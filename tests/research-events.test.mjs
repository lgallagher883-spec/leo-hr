import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../lib/research/events.ts", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../supabase/migrations/20260927120000_research_events.sql", import.meta.url), "utf8");

test("research contract contains an explicit event allow-list", () => {
  for (const event of [
    "matter_opened",
    "matter_completed",
    "probation_review_completed",
    "probation_extended",
    "onboarding_completed",
  ]) assert.match(source, new RegExp(`"${event}"`));
});

test("research properties prohibit identifiers and sensitive/free-text fields", () => {
  for (const token of ["employee.?id", "user.?id", "matter.?id", "prompt", "response", "evidence", "medical", "allegation"]) {
    assert.match(source, new RegExp(token, "i"));
  }
  assert.match(source, /typeof value === "string"/);
  assert.match(source, /Free-text research properties are prohibited/);
});

test("database is closed to browser roles", () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on table public\.research_events from anon, authenticated/i);
  assert.doesNotMatch(migration, /create policy/i);
});

test("aggregate view enforces both publication thresholds", () => {
  assert.match(migration, /count\(\*\) >= 30/);
  assert.match(migration, /count\(distinct organisation_key\) >= 10/);
});

test("research table has no direct HR record foreign-key columns", () => {
  assert.doesNotMatch(migration, /employee_id|user_id|candidate_id|matter_id|document_id/i);
});

test("organisation pseudonymisation is keyed and does not store raw IDs", () => {
  const pseudonym = fs.readFileSync(new URL("../lib/research/pseudonym.ts", import.meta.url), "utf8");
  const writer = fs.readFileSync(new URL("../lib/research/writer.ts", import.meta.url), "utf8");
  assert.match(pseudonym, /createHmac\("sha256", secret\)/);
  assert.match(pseudonym, /RESEARCH_PSEUDONYM_SECRET/);
  assert.match(writer, /pseudonymiseOrganisationId\(context\.organisationId\)/);
  assert.doesNotMatch(writer, /organisation_id:/);
});

test("initial workflow instrumentation contains no HR record identifiers in research payloads", () => {
  for (const path of [
    "../app/api/matters/route.ts",
    "../app/api/matters/[id]/route.ts",
    "../app/api/employees/[id]/probation/route.ts",
    "../app/api/talent/onboarding/[id]/route.ts",
  ]) {
    const route = fs.readFileSync(new URL(path, import.meta.url), "utf8");
    const calls = [...route.matchAll(/recordResearchEventBestEffort\(([\s\S]*?)\);/g)].map((match) => match[1]);
    assert.ok(calls.length > 0, `Expected research instrumentation in ${path}`);
    for (const call of calls) {
      assert.doesNotMatch(call, /employeeId|employee_id|userId|user_id|matterId|matter_id|candidateId|candidate_id|documentId|document_id|description|notes|prompt|response|evidence/i);
    }
  }
});
