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
  sufficient: boolean;
  records: StoredAuthorityRecord[];
  error?: string;
};

export type StoredAuthoritySufficiency = {
  sufficient: boolean;
  fresh: boolean;
  queryCoverage: number;
  stronglyRelevantRecordCount: number;
  records: StoredAuthorityRecord[];
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

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseTerms(message: string): string[] {
  const ignored = new Set([
    "about", "after", "again", "against", "also", "and",
    "are", "because", "before", "being", "can", "could",
    "current", "does", "for", "from", "has", "have", "his",
    "into", "its", "latest", "not", "our", "should", "that",
    "the", "their", "there", "these", "they", "this", "today",
    "was", "were", "what", "when", "where", "which", "will",
    "with", "would", "your", "employee", "employer"
  ]);

  return Array.from(
    new Set(
      normalise(message)
        .split(/\s+/)
        .map((term) => term.trim())
        .filter(
          (term) =>
            term.length >= 3 &&
            !/^\d+$/.test(term) &&
            !ignored.has(term)
        )
    )
  ).slice(0, 24);
}

function assessRecordRelevance(
  record: StoredAuthorityRecord,
  terms: string[],
  normalisedQuestion: string
): {
  score: number;
  matchedTerms: string[];
  strong: boolean;
} {
  if (terms.length === 0) {
    return {
      score: 0,
      matchedTerms: [],
      strong: false,
    };
  }

  const titleAndTopic = normalise(
    [record.topic, record.title].join(" ")
  );
  const titleAndTopicTerms = new Set(
    titleAndTopic.split(" ").filter(Boolean)
  );
  const searchableText = normalise([
    record.topic,
    record.title,
    record.summary,
    record.practical_effect || "",
    ...(record.search_terms || []),
  ].join(" "));
  const searchableTerms = new Set(
    searchableText.split(" ").filter(Boolean)
  );
  const matchedTerms = terms.filter((term) =>
    searchableTerms.has(term)
  );
  const titleAndTopicMatches = terms.filter((term) =>
    titleAndTopicTerms.has(term)
  );
  const exactSearchPhraseMatches = (record.search_terms || [])
    .map(normalise)
    .filter(
      (phrase) =>
        normaliseTerms(phrase).length >= 3 &&
        normalisedQuestion.includes(phrase)
    );
  const queryPhrases = terms
    .slice(0, -2)
    .map(
      (term, index) =>
        `${term} ${terms[index + 1]} ${terms[index + 2]}`
    );
  const coherentPhraseMatches = queryPhrases.filter((phrase) =>
    titleAndTopic.includes(phrase)
  );

  const score =
    titleAndTopicMatches.length * 5 +
    exactSearchPhraseMatches.length * 6 +
    coherentPhraseMatches.length * 4 +
    matchedTerms.length;
  const strong = coherentPhraseMatches.length > 0;

  return {
    score,
    matchedTerms,
    strong,
  };
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
      sufficient: false,
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
    const assessment = assessStoredAuthoritySufficiency(
      message,
      allRecords
    );

    return {
      available: true,
      fresh: assessment.fresh,
      sufficient: assessment.sufficient,
      records: assessment.records,
    };
  } catch (error) {
    return {
      available: true,
      fresh: false,
      sufficient: false,
      records: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown authority store read error.",
    };
  }
}

export function assessStoredAuthoritySufficiency(
  message: string,
  records: StoredAuthorityRecord[],
  now: Date = new Date()
): StoredAuthoritySufficiency {
  const terms = normaliseTerms(message);
  const normalisedQuestion = normalise(message);

  if (terms.length === 0 || records.length === 0) {
    return {
      sufficient: false,
      fresh: false,
      queryCoverage: 0,
      stronglyRelevantRecordCount: 0,
      records: [],
    };
  }

  const ranked = records
    .map((record) => ({
      record,
      ...assessRecordRelevance(
        record,
        terms,
        normalisedQuestion
      ),
    }))
    .filter(
      (item) =>
        item.strong &&
        item.matchedTerms.length / terms.length >= 0.6
    )
    .sort((first, second) => second.score - first.score)
    .slice(0, 8);
  const selectedRecords = ranked.map((item) => item.record);
  const coveredTerms = new Set(
    ranked.flatMap((item) => item.matchedTerms)
  );
  const queryCoverage = coveredTerms.size / terms.length;
  const fresh =
    selectedRecords.length > 0 &&
    selectedRecords.every((record) => isRecordFresh(record, now));
  const sufficient =
    fresh &&
    ranked.length > 0 &&
    queryCoverage >= 0.5 &&
    ranked[0].score >= 12;

  return {
    sufficient,
    fresh,
    queryCoverage: Number(queryCoverage.toFixed(2)),
    stronglyRelevantRecordCount: ranked.length,
    records: selectedRecords,
  };
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
