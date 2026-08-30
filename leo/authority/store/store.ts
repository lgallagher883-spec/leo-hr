export type AuthorityLegalStatus =
  | "current"
  | "future_enacted"
  | "proposed"
  | "historical"
  | "superseded"
  | "uncertain";

export type StoredAuthorityRecord = {
  authority_key: string;
  topic: string;
  title: string;
  source_url: string;
  source_domain: string;
  source_title: string | null;
  authority_type: string;
  legal_status: AuthorityLegalStatus;
  jurisdiction: string;
  summary: string;
  practical_effect: string | null;
  effective_from: string | null;
  effective_to: string | null;
  source_published_at: string | null;
  source_updated_at: string | null;
  verified_at: string;
  expires_at: string;
  search_terms: string[];
  content_hash: string | null;
  metadata: Record<string, unknown> | null;
};

export type AuthorityStoreResult = {
  available: boolean;
  fresh: boolean;
  records: StoredAuthorityRecord[];
  error?: string;
};

const STORE_MAX_AGE_HOURS = 36;
const MAX_RECORDS = 250;

function getSupabaseConfig():
  | { url: string; serviceRoleKey: string }
  | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function normaliseTerms(message: string): string[] {
  const ignored = new Set([
    "about", "after", "again", "against", "also", "because",
    "before", "being", "could", "current", "does", "from",
    "have", "into", "latest", "should", "that", "their",
    "there", "these", "they", "this", "today", "what",
    "when", "where", "which", "with", "would", "your",
    "employee", "employer"
  ]);

  return Array.from(
    new Set(
      message
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .split(/\s+/)
        .map((term) => term.trim())
        .filter(
          (term) =>
            term.length >= 3 &&
            !ignored.has(term)
        )
    )
  ).slice(0, 24);
}

function scoreRecord(
  record: StoredAuthorityRecord,
  terms: string[]
): number {
  if (terms.length === 0) {
    return 0;
  }

  const haystack = [
    record.topic,
    record.title,
    record.summary,
    record.practical_effect || "",
    ...(record.search_terms || []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;

  for (const term of terms) {
    if (record.topic.toLowerCase().includes(term)) {
      score += 20;
    }

    if (record.title.toLowerCase().includes(term)) {
      score += 16;
    }

    if (
      (record.search_terms || []).some(
        (candidate) =>
          candidate.toLowerCase() === term ||
          candidate.toLowerCase().includes(term)
      )
    ) {
      score += 12;
    }

    if (haystack.includes(term)) {
      score += 4;
    }
  }

  if (record.legal_status === "current") {
    score += 3;
  }

  if (record.legal_status === "future_enacted") {
    score += 2;
  }

  return score;
}

function isRecordFresh(
  record: StoredAuthorityRecord,
  now: Date
): boolean {
  const verified = new Date(record.verified_at);
  const expires = new Date(record.expires_at);

  if (
    Number.isNaN(verified.getTime()) ||
    Number.isNaN(expires.getTime())
  ) {
    return false;
  }

  const maxAgeMs =
    STORE_MAX_AGE_HOURS * 60 * 60 * 1000;

  return (
    now.getTime() <= expires.getTime() &&
    now.getTime() - verified.getTime() <= maxAgeMs
  );
}

export async function findStoredAuthority(
  message: string
): Promise<AuthorityStoreResult> {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      available: false,
      fresh: false,
      records: [],
      error:
        "Authority store is unavailable because NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
    };
  }

  try {
    const endpoint =
      `${config.url}/rest/v1/leo_authority_records` +
      `?select=*` +
      `&legal_status=in.(current,future_enacted,proposed)` +
      `&order=verified_at.desc` +
      `&limit=${MAX_RECORDS}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const raw = await response.text();

    if (!response.ok) {
      throw new Error(
        `Authority store read failed (${response.status}): ${raw.slice(0, 400)}`
      );
    }

    const allRecords = JSON.parse(raw) as StoredAuthorityRecord[];
    const terms = normaliseTerms(message);
    const now = new Date();

    const ranked = allRecords
      .map((record) => ({
        record,
        score: scoreRecord(record, terms),
      }))
      .filter((item) => item.score >= 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => item.record);

    return {
      available: true,
      fresh:
        ranked.length > 0 &&
        ranked.every((record) =>
          isRecordFresh(record, now)
        ),
      records: ranked,
    };
  } catch (error) {
    return {
      available: true,
      fresh: false,
      records: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown authority store read error.",
    };
  }
}

export async function upsertAuthorityRecords(
  records: StoredAuthorityRecord[]
): Promise<void> {
  if (records.length === 0) {
    return;
  }

  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to write the authority store."
    );
  }

  const endpoint =
    `${config.url}/rest/v1/leo_authority_records` +
    `?on_conflict=authority_key`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(
      records.map((record) => ({
        ...record,
        updated_at: new Date().toISOString(),
      }))
    ),
    cache: "no-store",
  });

  if (!response.ok) {
    const raw = await response.text();

    throw new Error(
      `Authority store write failed (${response.status}): ${raw.slice(0, 500)}`
    );
  }
}
