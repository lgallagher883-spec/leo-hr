import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { assessStoredAuthoritySufficiency } from "../leo/authority/store/store.ts";

const now = new Date("2026-09-01T12:00:00.000Z");

function record(overrides = {}) {
  return {
    authority_key: "orbital-cargo-permit",
    topic: "orbital cargo permit renewal",
    title: "Orbital cargo permit renewal and inspection requirements",
    source_url: "https://example.gov/orbital-cargo",
    source_domain: "example.gov",
    source_title: "Orbital cargo permits",
    authority_type: "regulation",
    legal_status: "current",
    jurisdiction: "test",
    summary:
      "Operators must renew orbital cargo permits and complete safety inspections before launch.",
    practical_effect:
      "Keep renewal records and inspection evidence for each launch.",
    effective_from: null,
    effective_to: null,
    source_published_at: null,
    source_updated_at: null,
    verified_at: "2026-09-01T06:00:00.000Z",
    expires_at: "2026-09-02T06:00:00.000Z",
    search_terms: [
      "orbital cargo permit",
      "permit renewal",
      "safety inspection",
    ],
    content_hash: null,
    metadata: null,
    ...overrides,
  };
}

test("fresh but irrelevant records are insufficient", () => {
  const result = assessStoredAuthoritySufficiency(
    "What are the orbital cargo permit renewal and safety inspection requirements?",
    [
      record({
        topic: "marine passenger licensing",
        title: "Marine passenger licensing fees",
        summary: "Passenger vessels must pay annual licensing fees.",
        practical_effect: "Keep vessel payment records.",
        search_terms: ["marine licence", "passenger vessel"],
      }),
    ],
    now
  );

  assert.equal(result.sufficient, false);
  assert.equal(result.records.length, 0);
});

test("one partially relevant record is insufficient when material concepts remain uncovered", () => {
  const result = assessStoredAuthoritySufficiency(
    "How do orbital cargo permit renewal, radiation insurance, customs security, worker certification and emergency reporting obligations interact?",
    [record()],
    now
  );

  assert.equal(result.sufficient, false);
  assert.ok(result.queryCoverage < 0.5);
});

test("fresh comprehensive authority may suppress live research", () => {
  const result = assessStoredAuthoritySufficiency(
    "What are the orbital cargo permit renewal and safety inspection requirements?",
    [record()],
    now
  );

  assert.equal(result.sufficient, true);
  assert.equal(result.fresh, true);
  assert.equal(result.records.length, 1);
});

test("stale comprehensive authority is insufficient", () => {
  const result = assessStoredAuthoritySufficiency(
    "What are the orbital cargo permit renewal and safety inspection requirements?",
    [
      record({
        verified_at: "2026-08-20T06:00:00.000Z",
        expires_at: "2026-08-21T06:00:00.000Z",
      }),
    ],
    now
  );

  assert.equal(result.fresh, false);
  assert.equal(result.sufficient, false);
});

test("the live-authority fast path requires the generic sufficiency result", () => {
  const liveAuthority = readFileSync(
    new URL("../leo/authority/liveAuthority.ts", import.meta.url),
    "utf8"
  );

  assert.match(liveAuthority, /stored\.fresh\s*&&\s*stored\.sufficient/);
  assert.match(liveAuthority, /ASK_LEO_FORCE_LIVE_AUTHORITY/);
});