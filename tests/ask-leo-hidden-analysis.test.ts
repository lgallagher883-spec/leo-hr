import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(
  new URL("../app/api/ask-leo/route.ts", import.meta.url),
  "utf8"
);

test("Ask Leo no longer exposes hidden issue-discovery or private-assessment parsers", () => {
  assert.doesNotMatch(route, /parseIssueDiscovery/);
  assert.doesNotMatch(route, /parseInternalAnalysis/);
  assert.doesNotMatch(route, /resolveAssessmentFromChoice/);
  assert.doesNotMatch(route, /buildIssueDiscoveryJsonSchema/);
  assert.doesNotMatch(route, /buildInternalAnalysisJsonSchema/);
});
