import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeterministicAuthorityKey,
  buildPersistableAuthorityRecords,
} from "../leo/authority/store/livePersistence.ts";

const APPROVED_URL = "https://www.gov.uk/statutory-sick-pay";
const UNAPPROVED_URL = "https://www.example-hr-blog.com/ssp-guide";
const HALLUCINATED_URL = "https://www.gov.uk/never-actually-cited";

function candidate(overrides = {}) {
  return {
    topic: "statutory-rates",
    title: "Statutory Sick Pay rate",
    sourceUrl: APPROVED_URL,
    sourceTitle: "Statutory Sick Pay",
    authorityType: "government",
    legalStatus: "current",
    jurisdiction: "england_wales",
    summary: "SSP is payable at the current published weekly rate.",
    practicalEffect: "Pay eligible employees the current SSP rate.",
    searchTerms: ["ssp", "statutory sick pay"],
    ...overrides,
  };
}

function baseInput(overrides = {}) {
  return {
    candidates: [candidate()],
    citedSources: [{ url: APPROVED_URL, title: "Statutory Sick Pay" }],
    searched: true,
    verifiedCurrent: true,
    evidence: "SSP is currently payable at the published weekly rate.",
    ...overrides,
  };
}

test("a verified cited approved source is eligible for persistence", () => {
  const records = buildPersistableAuthorityRecords(baseInput());

  assert.equal(records.length, 1);
  assert.equal(records[0].source_url, APPROVED_URL);
  assert.equal(records[0].legal_status, "current");
});

test("a hallucinated URL not actually returned/cited by web_search is rejected", () => {
  const records = buildPersistableAuthorityRecords(
    baseInput({
      candidates: [candidate({ sourceUrl: HALLUCINATED_URL })],
    })
  );

  assert.equal(records.length, 0);
});

test("an unapproved source domain is rejected", () => {
  const records = buildPersistableAuthorityRecords(
    baseInput({
      candidates: [candidate({ sourceUrl: UNAPPROVED_URL })],
      citedSources: [{ url: UNAPPROVED_URL }],
    })
  );

  assert.equal(records.length, 0);
});

test("legal_status uncertain is rejected", () => {
  const records = buildPersistableAuthorityRecords(
    baseInput({
      candidates: [candidate({ legalStatus: "uncertain" })],
    })
  );

  assert.equal(records.length, 0);
});

test("deterministic authority_key is stable for the same normalised URL", () => {
  const first = buildDeterministicAuthorityKey(
    "https://www.gov.uk/statutory-sick-pay"
  );
  const second = buildDeterministicAuthorityKey(
    "https://www.gov.uk/statutory-sick-pay"
  );

  assert.equal(first, second);
  assert.match(first, /^www\.gov\.uk:[a-f0-9]{32}$/);
});

test("two candidates citing the same normalised source URL merge into one persistable record and cannot trigger a duplicate-conflict batch", () => {
  const records = buildPersistableAuthorityRecords(
    baseInput({
      candidates: [
        candidate({
          summary: "SSP must be paid from day one for eligible absences.",
        }),
        candidate({
          summary:
            "The lower earnings limit no longer applies for SSP eligibility.",
          practicalEffect:
            "Review payroll systems to remove the LEL check.",
        }),
      ],
    })
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].source_url, APPROVED_URL);

  const uniqueKeys = new Set(records.map((record) => record.authority_key));

  assert.equal(uniqueKeys.size, records.length);
});
