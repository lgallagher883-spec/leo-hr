export const RESEARCH_EVENT_TYPES = [
  "ask_leo_category_requested",
  "matter_opened",
  "matter_completed",
  "rtw_completed",
  "probation_review_completed",
  "probation_extended",
  "compliance_gap_identified",
  "compliance_gap_resolved",
  "onboarding_completed",
  "workflow_started",
  "workflow_completed",
  "learning_or_certificate_admin_completed",
  "recruitment_or_new_starter_workflow_completed",
] as const;

export type ResearchEventType = (typeof RESEARCH_EVENT_TYPES)[number];

export const ORGANISATION_SIZE_BANDS = [
  "1-9",
  "10-49",
  "50-249",
  "250+",
  "unknown",
] as const;
export type OrganisationSizeBand = (typeof ORGANISATION_SIZE_BANDS)[number];

export const RESEARCH_INDUSTRY_GROUPS = [
  "early_years",
  "care",
  "professional_services",
  "other",
  "unknown",
] as const;
export type ResearchIndustryGroup = (typeof RESEARCH_INDUSTRY_GROUPS)[number];

export type ResearchEventInput = {
  eventType: ResearchEventType;
  eventCategory?: string | null;
  organisationSizeBand?: OrganisationSizeBand;
  industryGroup?: ResearchIndustryGroup;
  properties?: Record<string, boolean | number | null>;
  occurredAt?: string;
};

const prohibitedKeyPattern =
  /(name|email|phone|address|employee.?id|user.?id|candidate.?id|matter.?id|document.?id|notes?|description|prompt|response|evidence|medical|diagnos|health|allegation|protected.?characteristic)/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

export function bandOrganisationSize(count: number | null | undefined): OrganisationSizeBand {
  if (!Number.isFinite(count) || (count ?? 0) < 1) return "unknown";
  if ((count as number) <= 9) return "1-9";
  if ((count as number) <= 49) return "10-49";
  if ((count as number) <= 249) return "50-249";
  return "250+";
}

export function validateResearchEvent(input: ResearchEventInput): ResearchEventInput {
  if (!RESEARCH_EVENT_TYPES.includes(input.eventType)) {
    throw new Error("Research event type is not allow-listed.");
  }
  if (input.eventCategory && (input.eventCategory.length > 64 || emailPattern.test(input.eventCategory))) {
    throw new Error("Research event category must be a short non-identifying category.");
  }
  const properties = input.properties ?? {};
  for (const [key, value] of Object.entries(properties)) {
    if (prohibitedKeyPattern.test(key)) throw new Error(`Research property "${key}" is prohibited.`);
    if (typeof value === "string") throw new Error("Free-text research properties are prohibited.");
  }
  return {
    ...input,
    organisationSizeBand: input.organisationSizeBand ?? "unknown",
    industryGroup: input.industryGroup ?? "unknown",
    properties,
  };
}
