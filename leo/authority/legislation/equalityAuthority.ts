import {
  AuthorityEngineInput,
  AuthorityReference,
} from "../types";

const EQUALITY_TOPICS = [
  "disability",
  "disabled",
  "reasonable adjustment",
  "reasonable adjustments",
  "discrimination",
  "direct discrimination",
  "indirect discrimination",
  "harassment",
  "victimisation",
  "equality",
  "protected characteristic",
  "pregnancy",
  "maternity",
  "sex",
  "race",
  "religion",
  "belief",
  "age",
  "sexual orientation",
  "gender reassignment",
  "marriage",
  "civil partnership",
];

function normaliseAuthorityContext(
  input: AuthorityEngineInput
): string {
  return JSON.stringify({
    message: input.message,
    intent: input.intent,
    classification: input.classification,
    triggerOutput: input.triggerOutput,
    professionalReasoning: input.professionalReasoning,
  }).toLowerCase();
}

export function runEqualityAuthority(
  input: AuthorityEngineInput
): AuthorityReference[] {
  const context = normaliseAuthorityContext(input);

  const matchedTopics = EQUALITY_TOPICS.filter(
    (topic) => context.includes(topic)
  );

  if (matchedTopics.length === 0) {
    return [];
  }

  return [
    {
      id: "equality-act-2010",

      sourceType: "legislation",

      authorityLevel: "primary",

      title: "Equality Act 2010",

      reference: "2010 c. 15",

      summary:
        "The Equality Act 2010 provides the principal legal framework governing discrimination, harassment, victimisation and reasonable adjustments in employment.",

      relevance: `Potential Equality Act considerations identified: ${matchedTopics.join(
        ", "
      )}. Leo should assess whether a protected characteristic, prohibited conduct or reasonable adjustment duty may be relevant.`,

      status: "potentially_applicable",

      confidence: "medium",

      mandatory: true,

      sourceVersion:
        "Current amended version must be checked",

      effectiveDate: "2010-10-01",

      retrievedAt: new Date().toISOString(),
    },
  ];
}