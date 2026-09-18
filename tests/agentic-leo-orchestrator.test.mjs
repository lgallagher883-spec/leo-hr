import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const policy = read("lib/agents/policy.ts");
const orchestrator = read("lib/agents/orchestrator.ts");
const migration = read("supabase/migrations/20260914203000_agentic_leo_core.sql");

test("dismissal execution is blocked from Agentic Leo", () => {
  assert.match(policy, /if \(action === "dismissal"\)/);
  assert.match(policy, /allowed:\s*false/);
  assert.match(policy, /Route the HR reasoning to Ask Leo/);
});

test("significant actions require explicit approval", () => {
  assert.match(policy, /"send_external"/);
  assert.match(policy, /"financial"/);
  assert.match(policy, /"submit_external"/);
  assert.match(policy, /Explicit Owner or Senior approval/);
});

test("agent runs select the lowest appropriate model tier", () => {
  assert.match(policy, /"deterministic"/);
  assert.match(policy, /"economy"/);
  assert.match(policy, /"reasoning"/);
  assert.match(orchestrator, /highestModelTier/);
});

test("agent state is organisation scoped and service-only", () => {
  assert.match(migration, /organisation_id uuid not null/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.agent_memory from anon, authenticated/);
});

test("orchestrator writes to the existing audit log", () => {
  assert.match(orchestrator, /from\("audit_logs"\)/);
  assert.match(orchestrator, /agent_run_created/);
});
