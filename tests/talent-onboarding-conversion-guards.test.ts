import test from "node:test";
import assert from "node:assert/strict";

import {
  isMissingAnalyticsTable,
  isRpcUnavailable,
  statusRequiresEmployee,
} from "@/app/api/talent/onboarding/[id]/route";

test("normal conversion statuses require employee verification", () => {
  assert.equal(statusRequiresEmployee("employee_created"), true);
  assert.equal(statusRequiresEmployee("started"), true);
  assert.equal(statusRequiresEmployee("employment_commenced"), true);
});

test("repeated conversion status remains conversion-triggered", () => {
  assert.equal(statusRequiresEmployee("employee_created"), true);
  assert.equal(statusRequiresEmployee("started"), true);
});

test("started with null employee_id should still trigger conversion", () => {
  assert.equal(statusRequiresEmployee("started"), true);
});

test("rpc unavailable detection identifies schema cache function errors", () => {
  const rpcMissing = {
    message:
      "Could not find the function public.convert_talent_candidate_to_employee(p_offer_id) in the schema cache",
  };

  assert.equal(isRpcUnavailable(rpcMissing), true);
  assert.equal(isRpcUnavailable(new Error("RPC timeout")), false);
});

test("analytics table unavailable detection is non-blocking condition", () => {
  const tableMissing = {
    message:
      "Could not find the table 'public.talent_analytics_events' in the schema cache",
  };

  assert.equal(isMissingAnalyticsTable(tableMissing), true);
  assert.equal(isMissingAnalyticsTable(new Error("permission denied")), false);
});
