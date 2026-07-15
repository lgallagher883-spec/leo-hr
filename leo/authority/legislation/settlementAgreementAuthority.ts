import {
  AuthorityEngineInput,
  AuthorityReference,
} from "../types";

const SETTLEMENT_AGREEMENT_TOPICS = [
  "settlement agreement",
  "settle",
  "without prejudice",
  "protected conversation",
  "termination package",
  "compromise agreement",
  "exit agreement",
  "mutual termination",
  "termination payment",
  "waive claims",
  "legal advice",
  "confidentiality",
  "reference",
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
  }).toLowerCase();
}

export function runSettlementAgreementAuthority(
  input: AuthorityEngineInput
): AuthorityReference[] {
  const context =
    normaliseAuthorityContext(input);

  const matchedTopics =
    SETTLEMENT_AGREEMENT_TOPICS.filter(
      (topic) => context.includes(topic)
    );

  if (matchedTopics.length === 0) {
    return [];
  }

  return [
    {
      id: "settlement-agreements",

      sourceType: "legislation",

      authorityLevel: "primary",

      title: "Settlement Agreements",

      reference:
        "Employment Rights Act 1996 and associated legislation",

      summary:
        "Settlement agreements allow employment claims to be validly settled where statutory legal requirements are satisfied, including independent legal advice.",

      relevance: `Potential settlement agreement issues identified: ${matchedTopics.join(
        ", "
      )}. Leo should ensure the statutory conditions for a valid settlement agreement are satisfied before relying upon it.`,

      status: "potentially_applicable",

      confidence: "medium",

      mandatory: true,

      sourceVersion:
        "Current legislation and case law should be checked",

      retrievedAt:
        new Date().toISOString(),
    },
  ];
}