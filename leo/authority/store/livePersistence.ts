import { createHash } from "node:crypto";

import type { StoredAuthorityRecord } from "./store.ts";
import { STORE_MAX_AGE_HOURS } from "./store.ts";
import type { ModelAuthorityRecord } from "./updater.ts";
import {
  asAuthorityType,
  asNullableDate,
  asSearchTerms,
  asStatus,
  asText,
  sourceDomain,
  sourceIsApproved,
  stripCodeFence,
} from "./updater.ts";

export type CitedAuthoritySource = {
  url: string;
  title?: string;
};

// Reused by both citation collection and persistence so a source URL has a
// single canonical identity throughout the live-authority path.
export function normaliseSourceUrl(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.delete("utm_source");
    return url.toString();
  } catch {
    return "";
  }
}

// Server-generated key so persistence never trusts a model-chosen identifier.
export function buildDeterministicAuthorityKey(
  normalisedSourceUrl: string
): string {
  const hash = createHash("sha256")
    .update(normalisedSourceUrl)
    .digest("hex")
    .slice(0, 32);

  return `${sourceDomain(normalisedSourceUrl)}:${hash}`;
}

export function parseCandidateAuthorityRecords(
  rawStructuredSection: string
): ModelAuthorityRecord[] {
  if (!rawStructuredSection.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      stripCodeFence(rawStructuredSection)
    ) as { records?: ModelAuthorityRecord[] };

    return Array.isArray(parsed.records)
      ? parsed.records
      : [];
  } catch {
    return [];
  }
}

function toPersistableAuthorityRecord(
  candidate: ModelAuthorityRecord,
  citedNormalisedUrls: Set<string>,
  now: Date,
  expiresAt: string
): StoredAuthorityRecord | null {
  const rawSourceUrl = asText(candidate.sourceUrl);
  const title = asText(candidate.title);
  const summary = asText(candidate.summary);
  const legalStatus = asStatus(candidate.legalStatus);

  if (!rawSourceUrl || !title || !summary) {
    return null;
  }

  // Never persist a model-only assessment as reusable authority.
  if (legalStatus === "uncertain") {
    return null;
  }

  if (!sourceIsApproved(rawSourceUrl)) {
    return null;
  }

  const sourceUrl = normaliseSourceUrl(rawSourceUrl);

  if (!sourceUrl || !citedNormalisedUrls.has(sourceUrl)) {
    return null;
  }

  return {
    authority_key: buildDeterministicAuthorityKey(sourceUrl),
    topic: asText(candidate.topic) || "ad_hoc_live_research",
    title,
    source_url: sourceUrl,
    source_domain: sourceDomain(sourceUrl),
    source_title: asText(candidate.sourceTitle) || null,
    authority_type:
      asAuthorityType(candidate.authorityType),
    legal_status: legalStatus,
    jurisdiction:
      asText(candidate.jurisdiction) || "england_wales",
    summary,
    practical_effect:
      asText(candidate.practicalEffect) || null,
    effective_from: asNullableDate(candidate.effectiveFrom),
    effective_to: asNullableDate(candidate.effectiveTo),
    source_published_at: asNullableDate(
      candidate.sourcePublishedAt
    ),
    source_updated_at: asNullableDate(
      candidate.sourceUpdatedAt
    ),
    verified_at: now.toISOString(),
    expires_at: expiresAt,
    search_terms: asSearchTerms(candidate.searchTerms, []),
    content_hash: null,
    metadata: { origin: "ad_hoc_live_research" },
  } satisfies StoredAuthorityRecord;
}

export function buildPersistableAuthorityRecords(input: {
  candidates: ModelAuthorityRecord[];
  citedSources: CitedAuthoritySource[];
  searched: boolean;
  verifiedCurrent: boolean;
  evidence: string;
}): StoredAuthorityRecord[] {
  if (
    !input.searched ||
    !input.verifiedCurrent ||
    !input.evidence.trim() ||
    input.candidates.length === 0
  ) {
    return [];
  }

  const citedNormalisedUrls = new Set(
    input.citedSources
      .map((source) => normaliseSourceUrl(source.url))
      .filter(Boolean)
  );

  if (citedNormalisedUrls.size === 0) {
    return [];
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + STORE_MAX_AGE_HOURS * 60 * 60 * 1000
  ).toISOString();

  return mergeDuplicateAuthorityRecords(
    input.candidates
      .map((candidate) =>
        toPersistableAuthorityRecord(
          candidate,
          citedNormalisedUrls,
          now,
          expiresAt
        )
      )
      .filter(
        (record): record is StoredAuthorityRecord =>
          record !== null
      )
  );
}

// The same official source may legitimately support more than one
// candidate proposition; upsertAuthorityRecords() requires at most one
// row per authority_key per batch, so duplicates are merged deterministically.
function mergeDuplicateAuthorityRecords(
  records: StoredAuthorityRecord[]
): StoredAuthorityRecord[] {
  const byKey = new Map<string, StoredAuthorityRecord[]>();

  for (const record of records) {
    const group = byKey.get(record.authority_key);

    if (group) {
      group.push(record);
    } else {
      byKey.set(record.authority_key, [record]);
    }
  }

  return Array.from(byKey.values()).map(mergeAuthorityRecordGroup);
}

function mergeAuthorityRecordGroup(
  group: StoredAuthorityRecord[]
): StoredAuthorityRecord {
  const [primary] = group;

  if (group.length === 1) {
    return primary;
  }

  const summary = Array.from(
    new Set(group.map((record) => record.summary).filter(Boolean))
  ).join(" ");
  const practicalEffect = Array.from(
    new Set(
      group
        .map((record) => record.practical_effect)
        .filter((value): value is string => Boolean(value))
    )
  ).join(" ");
  const searchTerms = Array.from(
    new Set(group.flatMap((record) => record.search_terms))
  ).slice(0, 40);

  return {
    ...primary,
    summary,
    practical_effect: practicalEffect || null,
    effective_from:
      group.find((record) => record.effective_from)
        ?.effective_from ?? null,
    effective_to:
      group.find((record) => record.effective_to)
        ?.effective_to ?? null,
    source_published_at:
      group.find((record) => record.source_published_at)
        ?.source_published_at ?? null,
    source_updated_at:
      group.find((record) => record.source_updated_at)
        ?.source_updated_at ?? null,
    search_terms: searchTerms,
    metadata: {
      ...(primary.metadata || {}),
      mergedCandidateCount: group.length,
    },
  } satisfies StoredAuthorityRecord;
}
