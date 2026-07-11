import {
  AuthorityEngineInput,
  AuthorityReference,
} from "../types";

const DISCIPLINARY_GRIEVANCE_TOPICS = [
  "disciplinary",
  "misconduct",
  "gross misconduct",
  "grievance",
  "investigation",
  "appeal",
  "capability",
  "performance",
  "warning",
  "dismissal",
];

const FLEXIBLE_WORKING_TOPICS = [
  "flexible working",
  "working from home",
  "home working",
  "hybrid working",
  "change hours",
  "change working pattern",
  "compressed hours",
  "part time",
  "job share",
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

export function runAcasCodeAuthority(
  input: AuthorityEngineInput
): AuthorityReference[] {
  const context = normaliseAuthorityContext(input);

  const authorities: AuthorityReference[] = [];

  const disciplinaryGrievanceMatches =
    DISCIPLINARY_GRIEVANCE_TOPICS.filter((topic) =>
      context.includes(topic)
    );

  if (disciplinaryGrievanceMatches.length > 0) {
    authorities.push({
      id: "acas-disciplinary-grievance-code",

      sourceType: "acas_code",

      authorityLevel: "mandatory",

      title:
        "ACAS Code of Practice on Disciplinary and Grievance Procedures",

      summary:
        "The ACAS Code sets the minimum standards employers should follow when handling disciplinary, capability and grievance matters.",

      relevance: `Relevant disciplinary or grievance topics identified: ${disciplinaryGrievanceMatches.join(
        ", "
      )}. Leo should check that the employer investigates fairly, explains the issues, allows the employee to respond, permits accompaniment where applicable, confirms decisions and provides an appeal.`,

      status: "applicable",

      confidence: "high",

      mandatory: true,

      sourceVersion: "Current published ACAS Code",

      retrievedAt: new Date().toISOString(),
    });
  }

  const flexibleWorkingMatches =
    FLEXIBLE_WORKING_TOPICS.filter((topic) =>
      context.includes(topic)
    );

  if (flexibleWorkingMatches.length > 0) {
    authorities.push({
      id: "acas-flexible-working-code",

      sourceType: "acas_code",

      authorityLevel: "mandatory",

      title:
        "ACAS Code of Practice on Requests for Flexible Working",

      summary:
        "The ACAS Code provides the minimum standards employers should follow when handling statutory flexible-working requests.",

      relevance: `Relevant flexible-working topics identified: ${flexibleWorkingMatches.join(
        ", "
      )}. Leo should check that the request is considered reasonably, discussed where appropriate, decided without unreasonable delay and handled alongside equality and reasonable-adjustment duties.`,

      status: "applicable",

      confidence: "high",

      mandatory: true,

      sourceVersion: "Current published ACAS Code",

      effectiveDate: "2024-04-06",

      retrievedAt: new Date().toISOString(),
    });
  }

  return authorities;
}