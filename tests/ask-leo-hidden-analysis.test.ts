import test from "node:test";
import assert from "node:assert/strict";

import {
  parseInternalAnalysis,
  processHiddenAnalysisBuffer,
  type LeoInternalAnalysis,
} from "../app/api/ask-leo/route";

const boundary = {
  start: "%%%LEO_INTERNAL_ANALYSIS_START_test-token%%%",
  end: "%%%LEO_INTERNAL_ANALYSIS_END_test-token%%%",
};

const validAnalysis: LeoInternalAnalysis = {
  establishedFacts: ["Employee has worked for the business for three years."],
  assertionsAndAllegations: ["Manager alleges repeated lateness."],
  evidence: ["Clocking-in records for the last month."],
  materialUnknowns: ["Whether the employee was previously warned."],
  overlappingIssues: ["Possible capability issue alongside conduct concern."],
  companyContextConsiderations: ["Attendance policy requires a documented review."],
  legalGrounding: [
    {
      tier: "acas_code",
      statement:
        "A fair process should give the employee an opportunity to respond before formal action.",
    },
  ],
  options: ["Informal conversation", "Formal capability process"],
  recommendation: "Hold an informal conversation before considering formal action.",
  immediateNextStep: "Arrange a meeting with the employee this week.",
};

function wrap(analysis: unknown, reply: string): string {
  return `${boundary.start}${JSON.stringify(analysis)}${boundary.end}${reply}`;
}

test("parseInternalAnalysis accepts a well-formed analysis object", () => {
  const parsed = parseInternalAnalysis(JSON.stringify(validAnalysis));
  assert.deepEqual(parsed, validAnalysis);
});

test("parseInternalAnalysis rejects invalid JSON", () => {
  assert.equal(parseInternalAnalysis("{not valid json"), null);
});

test("parseInternalAnalysis rejects valid JSON with an invalid schema", () => {
  const invalidShape = {
    ...validAnalysis,
    legalGrounding: [{ tier: "not_a_real_tier", statement: "x" }],
  };

  assert.equal(parseInternalAnalysis(JSON.stringify(invalidShape)), null);
});

test("parseInternalAnalysis rejects a missing required field", () => {
  const { recommendation, ...withoutRecommendation } = validAnalysis;
  void recommendation;

  assert.equal(
    parseInternalAnalysis(JSON.stringify(withoutRecommendation)),
    null,
  );
});

test("processHiddenAnalysisBuffer isolates a valid hidden analysis and reply", () => {
  const buffer = wrap(validAnalysis, "Here is Leo's employer-facing reply.");
  const result = processHiddenAnalysisBuffer(buffer, boundary);

  assert.equal(result.state, "streaming");
  if (result.state === "streaming") {
    assert.equal(result.tail, "Here is Leo's employer-facing reply.");
    assert.deepEqual(result.analysis, validAnalysis);
  }
});

test("processHiddenAnalysisBuffer stays buffering while delimiters are split across chunks", () => {
  const full = wrap(validAnalysis, "Reply after a split boundary.");
  const chunks = [
    full.slice(0, 20),
    full.slice(20, 60),
    full.slice(60, full.indexOf(boundary.end) + 10),
    full.slice(full.indexOf(boundary.end) + 10),
  ];

  let buffer = "";
  let lastResult = processHiddenAnalysisBuffer(buffer, boundary);

  for (const chunk of chunks) {
    buffer += chunk;
    lastResult = processHiddenAnalysisBuffer(buffer, boundary);

    if (lastResult.state === "streaming") {
      break;
    }

    assert.equal(lastResult.state, "buffering");
  }

  assert.equal(lastResult.state, "streaming");
  if (lastResult.state === "streaming") {
    assert.equal(lastResult.tail, "Reply after a split boundary.");
  }
});

test("processHiddenAnalysisBuffer fails closed when the end marker never arrives", () => {
  const buffer =
    boundary.start + "x".repeat(9000); // exceeds MAX_ANALYSIS_BUFFER_LENGTH

  const result = processHiddenAnalysisBuffer(buffer, boundary);

  assert.equal(result.state, "failed");
});

test("processHiddenAnalysisBuffer fails closed when the start marker is missing", () => {
  const buffer = JSON.stringify(validAnalysis) + boundary.end + "reply text";
  const result = processHiddenAnalysisBuffer(buffer, boundary);

  assert.equal(result.state, "failed");
});

test("processHiddenAnalysisBuffer discards an invalid analysis but still isolates the boundary safely", () => {
  const buffer = wrap({ not: "the expected shape" }, "Reply continues normally.");
  const result = processHiddenAnalysisBuffer(buffer, boundary);

  assert.equal(result.state, "streaming");
  if (result.state === "streaming") {
    assert.equal(result.analysis, null);
    assert.equal(result.tail, "Reply continues normally.");
  }
});

test("interrupted stream before the boundary completes never exposes hidden content", () => {
  const full = wrap(validAnalysis, "Reply that never gets a chance to stream.");
  const truncated = full.slice(0, full.indexOf(boundary.end) - 5);

  const result = processHiddenAnalysisBuffer(truncated, boundary);

  // Still buffering (the stream was cut before the end marker arrived) -
  // nothing has been produced for the caller to forward to the client.
  assert.equal(result.state, "buffering");
});

test("interrupted stream after the boundary only ever exposes the reply portion", () => {
  const full = wrap(validAnalysis, "Reply that gets cut short mid-sentence");
  const truncated = full.slice(0, full.length - 10);

  const result = processHiddenAnalysisBuffer(truncated, boundary);

  assert.equal(result.state, "streaming");
  if (result.state === "streaming") {
    assert.doesNotMatch(result.tail, new RegExp(boundary.start));
    assert.doesNotMatch(result.tail, new RegExp(boundary.end));
    assert.doesNotMatch(result.tail, /establishedFacts/);
  }
});

test("no hidden analysis bytes or delimiters ever appear in the isolated reply", () => {
  const buffer = wrap(validAnalysis, "Final employer-facing text only.");
  const result = processHiddenAnalysisBuffer(buffer, boundary);

  assert.equal(result.state, "streaming");
  if (result.state === "streaming") {
    assert.ok(!result.tail.includes(boundary.start));
    assert.ok(!result.tail.includes(boundary.end));
    assert.ok(!result.tail.includes("establishedFacts"));
    assert.ok(!result.tail.includes("legalGrounding"));
  }
});

test("employer-facing reply containing delimiter-like text is passed through untouched", () => {
  const decoyLookingText =
    "The manager said the policy is '%%%LEO_INTERNAL_ANALYSIS_END_other%%%' in the handbook.";
  const buffer = wrap(validAnalysis, decoyLookingText);

  const result = processHiddenAnalysisBuffer(buffer, boundary);

  assert.equal(result.state, "streaming");
  if (result.state === "streaming") {
    assert.equal(result.tail, decoyLookingText);
  }
});

// Whether a draft/reply is actually *consistent* with the hidden analysis is a
// qualitative judgement (no admission/commitment/allegation beyond what the
// analysis supports). This cannot be asserted deterministically in a unit
// test - it is covered by the agreed rubric-based regression suite run
// against unseen scenarios, not by a hard-coded expected string here.
test.todo(
  "drafting response inconsistent with the hidden analysis - covered by rubric-based regression testing, not a deterministic unit test",
);
