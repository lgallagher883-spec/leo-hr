import {
  AuthorityEngineInput,
  AuthorityReference,
} from "../types";

const EMPLOYMENT_RIGHTS_TOPICS = [
  "dismissal",
  "unfair dismissal",
  "redundancy",
  "collective redundancy",
  "statutory sick pay",
  "sick pay",
  "paternity leave",
  "parental leave",
  "family leave",
  "zero hours",
  "guaranteed hours",
  "fire and rehire",
  "whistleblowing",
  "trade union",
  "industrial action",
  "tips",
  "pay",
  "holiday pay",
  "employment rights",
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

export function runEmploymentRightsAuthority(
  input: AuthorityEngineInput
): AuthorityReference[] {
  const context = normaliseAuthorityContext(input);

  const matchedTopics = EMPLOYMENT_RIGHTS_TOPICS.filter(
    (topic) => context.includes(topic)
  );

  if (matchedTopics.length === 0) {
    return [];
  }

  return [
    {
      id: "employment-rights-act-2025",

      sourceType: "legislation",

      authorityLevel: "primary",

      title: "Employment Rights Act 2025",

      reference: "2025 c. 36",

      summary:
        "The Employment Rights Act 2025 reforms a range of employment rights and establishes new enforcement arrangements. Its provisions are being brought into force in phases.",

      relevance: `Potentially relevant employment rights topics identified: ${matchedTopics.join(
        ", "
      )}. The applicable provision and its commencement status must be confirmed before Leo treats it as legally operative.`,

      status: "potentially_applicable",

      confidence: "medium",

      mandatory: true,

      sourceVersion:
        "Current amended version and commencement regulations must be checked",

      effectiveDate: "2025-12-18",

      retrievedAt: new Date().toISOString(),
    },
  ];
}