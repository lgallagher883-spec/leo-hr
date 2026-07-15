import {
  AuthorityEngineInput,
  AuthorityReference,
} from "../types";

const FAIR_WORK_AGENCY_TOPICS = [
  "fair work agency",
  "minimum wage",
  "national minimum wage",
  "underpayment",
  "unpaid wages",
  "holiday pay",
  "unpaid holiday",
  "statutory sick pay",
  "employment agency",
  "agency worker",
  "gangmaster",
  "labour provider",
  "labour market abuse",
  "worker exploitation",
  "modern slavery",
  "illegal working",
  "enforcement notice",
  "civil penalty",
  "employment tribunal award",
  "unpaid tribunal award",
  "record keeping",
  "pay records",
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

export function runFairWorkAgencyAuthority(
  input: AuthorityEngineInput
): AuthorityReference[] {
  const context =
    normaliseAuthorityContext(input);

  const matchedTopics =
    FAIR_WORK_AGENCY_TOPICS.filter(
      (topic) =>
        context.includes(topic)
    );

  if (matchedTopics.length === 0) {
    return [];
  }

  return [
    {
      id: "fair-work-agency",

      sourceType: "regulator",

      authorityLevel:
        "authoritative_guidance",

      title: "Fair Work Agency",

      reference:
        "Employment Rights Act 2025 labour-market enforcement framework",

      summary:
        "The Fair Work Agency is the central labour-market enforcement body responsible for enforcing specified employment protections and addressing labour-market non-compliance.",

      relevance: `Potential Fair Work Agency enforcement topics identified: ${matchedTopics.join(
        ", "
      )}. Leo should assess whether the employer has complied with applicable pay, holiday, record-keeping, agency-work and labour-market enforcement obligations.`,

      status: "potentially_applicable",

      confidence: "medium",

      mandatory: true,

      sourceVersion:
        "Current Fair Work Agency remit, statutory powers and commencement position must be checked",

      effectiveDate: "2026-04-07",

      retrievedAt:
        new Date().toISOString(),
    },
  ];
}