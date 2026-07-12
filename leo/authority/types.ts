export type AuthoritySourceType =
  | "legislation"
  | "acas_code"
  | "acas_guidance"
  | "regulator"
  | "contract"
  | "company_policy"
  | "foundation"
  | "organisation_memory"
  | "previous_matter"
  | "leo_philosophy";

export type AuthorityLevel =
  | "primary"
  | "mandatory"
  | "authoritative_guidance"
  | "contractual"
  | "organisational"
  | "contextual"
  | "philosophical";

export type AuthorityConfidence = "low" | "medium" | "high";

export type AuthorityStatus =
  | "applicable"
  | "potentially_applicable"
  | "not_applicable"
  | "information_required";

export type AuthorityConflictType =
  | "law_policy"
  | "law_contract"
  | "policy_practice"
  | "policy_foundation"
  | "guidance_practice"
  | "historical_inconsistency"
  | "other";

export interface AuthorityReference {
  id: string;

  sourceType: AuthoritySourceType;

  authorityLevel: AuthorityLevel;

  title: string;

  reference?: string;

  summary: string;

  relevance: string;

  status: AuthorityStatus;

  confidence: AuthorityConfidence;

  mandatory: boolean;

  sourceVersion?: string;

  effectiveDate?: string;

  retrievedAt?: string;
}

export interface AuthorityConflict {
  type: AuthorityConflictType;

  description: string;

  higherAuthority: string;

  lowerAuthority: string;

  recommendedApproach: string;

  riskCreated: string;
}

export interface AuthorityComplianceGap {
  area: string;

  description: string;

  authorityReference?: string;

  recommendedAction: string;

  severity: "low" | "medium" | "high" | "critical";
}

export interface AuthorityRecommendation {
  action: string;

  rationale: string;

  supportedBy: string[];

  priority: "low" | "medium" | "high" | "critical";

  requiresHumanDecision: boolean;
}

export interface AuthorityAuditEntry {
  sourceType: AuthoritySourceType;

  sourceTitle: string;

  finding: string;

  appliedToRecommendation: boolean;
}

export interface AuthorityEngineInput {
  message: string;

  matterId?: string;

  organisationId?: string;

  employeeId?: string;

  intent?: unknown;

  risk?: unknown;

  classification?: unknown;

  triggerOutput?: unknown;

  professionalReasoning?: unknown;

  companyKnowledge?: unknown;

  employerPolicies?: unknown[];

  foundationKnowledge?: unknown[];

  previousMatters?: unknown[];

  organisationMemory?: unknown[];
}

export interface AuthorityEngineOutput {
  applicableAuthorities: AuthorityReference[];

  conflicts: AuthorityConflict[];

  complianceGaps: AuthorityComplianceGap[];

  groundedRecommendations: AuthorityRecommendation[];

  missingAuthorityInformation: string[];

  regulatorConsiderations: AuthorityReference[];

  philosophyConsiderations: AuthorityReference[];

  auditTrail: AuthorityAuditEntry[];

  confidence: AuthorityConfidence;

  authorityApplied: boolean;
}