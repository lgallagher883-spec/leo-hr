import {
  AuthorityEngineInput,
  AuthorityReference,
} from "../types";

const CONSTRUCTIVE_DISMISSAL_TOPICS = [
  "constructive dismissal",
  "forced to resign",
  "forced resignation",
  "resigned because of employer",
  "fundamental breach",
  "serious breach of contract",
  "breach of contract",
  "breach of trust and confidence",
  "destroy trust and confidence",
  "repudiatory breach",
  "unilateral change",
  "changed contract without agreement",
  "demotion",
  "reduced pay",
  "cut pay",
  "unsafe workplace",
  "failure to investigate",
  "failure to address grievance",
  "intolerable working conditions",
  "resignation in response",
];

function normaliseAuthorityContext(
  input: AuthorityEngineInput
): string {
  return JSON.stringify({
    message: input.message,
    intent: input.intent,
    classification: input.classification,
    triggerOutput: input.triggerOutput,
    professionalReasoning:
      input.professionalReasoning,
    companyKnowledge:
      input.companyKnowledge,
  }).toLowerCase();
}

export function runConstructiveDismissalAuthority(
  input: AuthorityEngineInput
): AuthorityReference[] {
  const context =
    normaliseAuthorityContext(input);

  const matchedTopics =
    CONSTRUCTIVE_DISMISSAL_TOPICS.filter(
      (topic) =>
        context.includes(topic)
    );

  if (matchedTopics.length === 0) {
    return [];
  }

  return [
    {
      id: "constructive-dismissal",

      sourceType: "legislation",

      authorityLevel: "primary",

      title: "Constructive Dismissal",

      reference:
        "Employment Rights Act 1996, section 95(1)(c), and applicable common-law principles",

      summary:
        "Constructive dismissal may arise where an employee resigns in response to a fundamental breach of contract by the employer. The alleged breach, the employee's response and the timing of the resignation require careful factual and legal assessment.",

      relevance: `Potential constructive-dismissal indicators identified: ${matchedTopics.join(
        ", "
      )}. Leo should assess the alleged contractual breach, whether it was fundamental, whether the employee resigned in response to it and whether their conduct may have affirmed the contract.`,

      status: "potentially_applicable",

      confidence: "medium",

      mandatory: true,

      sourceVersion:
        "Current amended legislation and applicable case-law principles must be checked",

      effectiveDate: "1996-08-22",

      retrievedAt:
        new Date().toISOString(),
    },
  ];
}