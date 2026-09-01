import test from "node:test";
import assert from "node:assert/strict";

import {
  parseInternalAnalysis,
  resolveAssessmentFromChoice,
  type LeoInternalAnalysis,
} from "../app/api/ask-leo/route";

const validAnalysis: LeoInternalAnalysis = {
  employerDecision: {
    question: "Whether formal capability action is justified now.",
    directAnswer: "No. The current evidence supports addressing the attendance concern, but not moving directly to formal capability action.",
    currentRecommendation: "Set a clear attendance expectation and review the existing records before deciding whether formal action is proportionate.",
    confidence: "medium",
  },
  professionalRationale: {
    whyThisIsRecommended: "The records show a concern requiring management action, while the reason and prior management response remain material to proportionality.",
    materialLegalPosition: ["Any formal action should be fair, evidence-based and consistent with the applicable procedure."],
    applicationToFacts: ["The records indicate lateness but do not establish why it occurred or whether expectations were made clear."],
    commercialAndPeopleConsiderations: ["Continued lateness affects team coverage, while disproportionate escalation risks damaging trust."],
    competingConsiderations: ["The employer needs reliable attendance, but the employee may have a material explanation not shown by clocking records."],
    proportionality: "A documented management expectation is proportionate before formal action on the current evidence.",
  },
  evidencePosition: {
    establishedFacts: ["Clocking records show late arrival during the last month."],
    allegationsOrAssumptions: ["The manager assumes the lateness reflects inability or unwillingness to meet the role requirements."],
    materialEvidence: [
      {
        item: "Clocking-in records for the last month.",
        tendsToEstablish: "A pattern of late arrival over the last month.",
        strength: "moderate",
        limitations: "Does not establish the reason for lateness or prior expectations.",
      },
    ],
    materialUnknowns: ["Whether a clear attendance expectation was previously communicated."],
    decisionChangingInformation: ["Whether the employee has already received a clear warning and support about the same pattern."],
  },
  actionPlan: {
    doNow: ["Check the attendance record and previous management communications, then set the required attendance standard in writing."],
    doNotDoYet: ["Do not describe the employee as incapable or impose a formal sanction on the current evidence."],
    nextIf: [
      {
        condition: "the employee has already received a clear expectation and the pattern continues without adequate explanation",
        action: "consider proportionate formal action under the applicable procedure",
      },
    ],
    unsupportedCommitments: ["Do not promise that no formal process will follow."],
  },
  alternativeAssessment: {
    rejectedOrRiskyAlternative: "Move immediately to a formal capability process.",
    whyNotRecommended: "That would treat an attendance pattern as established incapability before the cause, expectations and prior response are known.",
  },
  authorityAndCompanyContext: {
    verifiedLegalConstraints: ["A fair process must be based on the evidence and allow a response before formal conclusions."],
    relevantCompanyContext: ["The attendance policy requires a documented review."],
    unresolvedAuthorityUncertainty: [],
  },
};

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
    employerDecision: {
      ...validAnalysis.employerDecision,
      confidence: "very_high",
    },
  };

  assert.equal(parseInternalAnalysis(JSON.stringify(invalidShape)), null);
});

test("parseInternalAnalysis rejects a missing required field", () => {
  const { currentRecommendation, ...withoutRecommendation } =
    validAnalysis.employerDecision;
  void currentRecommendation;

  assert.equal(
    parseInternalAnalysis(
      JSON.stringify({
        ...validAnalysis,
        employerDecision: withoutRecommendation,
      })
    ),
    null,
  );
});

test("parseInternalAnalysis rejects a missing new judgement field", () => {
  const { unsupportedCommitments, ...withoutUnsupportedCommitments } =
    validAnalysis.actionPlan;
  void unsupportedCommitments;

  assert.equal(
    parseInternalAnalysis(
      JSON.stringify({
        ...validAnalysis,
        actionPlan: withoutUnsupportedCommitments,
      })
    ),
    null,
  );
});

test("parseInternalAnalysis rejects an invalid evidenceAssessment strength value", () => {
  const invalidEvidence = {
    ...validAnalysis,
    evidencePosition: {
      ...validAnalysis.evidencePosition,
      materialEvidence: [
        {
          item: "CCTV footage",
          tendsToEstablish: "The employee took the item.",
          strength: "very_strong",
          limitations: "Does not establish intent.",
        },
      ],
    },
  };

  assert.equal(parseInternalAnalysis(JSON.stringify(invalidEvidence)), null);
});

test("resolveAssessmentFromChoice accepts a valid structured assessment with finish_reason stop", () => {
  const choice = {
    finish_reason: "stop",
    message: { content: JSON.stringify(validAnalysis) },
  };

  assert.deepEqual(resolveAssessmentFromChoice(choice), validAnalysis);
});

test("resolveAssessmentFromChoice rejects a non-stop finish_reason", () => {
  const choice = {
    finish_reason: "length",
    message: { content: JSON.stringify(validAnalysis) },
  };

  assert.equal(resolveAssessmentFromChoice(choice), null);
});

test("resolveAssessmentFromChoice rejects missing message content", () => {
  const choice = {
    finish_reason: "stop",
    message: { content: null },
  };

  assert.equal(resolveAssessmentFromChoice(choice), null);
});

test("resolveAssessmentFromChoice rejects content that fails schema validation", () => {
  const choice = {
    finish_reason: "stop",
    message: { content: JSON.stringify({ not: "the expected shape" }) },
  };

  assert.equal(resolveAssessmentFromChoice(choice), null);
});

test("resolveAssessmentFromChoice rejects an undefined choice", () => {
  assert.equal(resolveAssessmentFromChoice(undefined), null);
});

// A missing/invalid Call 1 assessment must never prevent Call 2 from
// producing an employer-facing response - `assessment` is a nullable input
// to buildEmployerResponsePrompt, not a gate on the response pipeline. This
// is an architectural guarantee (verified via live end-to-end testing and
// code review of the POST handler control flow), not something that can be
// asserted as a deterministic unit test in isolation.
test.todo(
  "assessment failure never blocks the employer-facing response - covered by live end-to-end verification, not a unit test",
);

// Whether a draft/reply is actually *consistent* with the private assessment
// is a qualitative judgement (no admission/commitment/allegation beyond what
// the assessment supports). This cannot be asserted deterministically in a
// unit test - it is covered by the agreed rubric-based regression suite run
// against unseen scenarios, not by a hard-coded expected string here.
test.todo(
  "drafting response inconsistent with the private assessment - covered by rubric-based regression testing, not a deterministic unit test",
);
