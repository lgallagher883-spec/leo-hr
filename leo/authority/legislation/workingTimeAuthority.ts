import {
  AuthorityEngineInput,
  AuthorityReference,
} from "../types";

const WORKING_TIME_TOPICS = [
  "working time",
  "working hours",
  "hours of work",
  "maximum working week",
  "48 hour",
  "48-hour",
  "opt out",
  "opt-out",
  "rest break",
  "rest breaks",
  "daily rest",
  "weekly rest",
  "night work",
  "night worker",
  "night workers",
  "overtime",
  "on call",
  "on-call",
  "shift",
  "shifts",
  "holiday",
  "annual leave",
  "holiday entitlement",
  "holiday pay",
  "paid leave",
  "young worker",
  "young workers",
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

export function runWorkingTimeAuthority(
  input: AuthorityEngineInput
): AuthorityReference[] {
  const context = normaliseAuthorityContext(input);

  const matchedTopics = WORKING_TIME_TOPICS.filter(
    (topic) => context.includes(topic)
  );

  if (matchedTopics.length === 0) {
    return [];
  }

  return [
    {
      id: "working-time-regulations-1998",

      sourceType: "legislation",

      authorityLevel: "primary",

      title: "Working Time Regulations 1998",

      reference: "SI 1998/1833",

      summary:
        "The Working Time Regulations 1998 govern working time limits, rest periods, rest breaks, night work and statutory paid annual leave.",

      relevance: `Potential Working Time Regulations considerations identified: ${matchedTopics.join(
        ", "
      )}. Leo should assess working hours, rest requirements, annual leave rights, night-working rules and any valid opt-out arrangements.`,

      status: "potentially_applicable",

      confidence: "medium",

      mandatory: true,

      sourceVersion:
        "Current amended version must be checked",

      effectiveDate: "1998-10-01",

      retrievedAt: new Date().toISOString(),
    },
  ];
}