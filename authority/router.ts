import { runEmploymentRightsAuthority } from "./legislation/employmentRightsAuthority";

import {
  AuthorityEngineInput,
  AuthorityEngineOutput,
  AuthorityReference,
  AuthorityConflict,
  AuthorityComplianceGap,
  AuthorityRecommendation,
  AuthorityAuditEntry,
} from "./types";

export async function runAuthorityEngine(
  input: AuthorityEngineInput
): Promise<AuthorityEngineOutput> {
  const applicableAuthorities: AuthorityReference[] = [];

  const conflicts: AuthorityConflict[] = [];

  const complianceGaps: AuthorityComplianceGap[] = [];

  const groundedRecommendations: AuthorityRecommendation[] = [];

  const regulatorConsiderations: AuthorityReference[] = [];

  const philosophyConsiderations: AuthorityReference[] = [];

  const auditTrail: AuthorityAuditEntry[] = [];

  const missingAuthorityInformation: string[] = [];

  const employmentRightsAuthorities =
    runEmploymentRightsAuthority(input);

  applicableAuthorities.push(
    ...employmentRightsAuthorities
  );

  auditTrail.push(
    ...employmentRightsAuthorities.map((authority) => ({
      sourceType: authority.sourceType,
      sourceTitle: authority.title,
      finding: authority.relevance,
      appliedToRecommendation: false,
    }))
  );

  if (employmentRightsAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Confirm which relevant Employment Rights Act 2025 provisions are currently in force and whether transitional rules apply."
    );
  }

  return {
    applicableAuthorities,
    conflicts,
    complianceGaps,
    groundedRecommendations,
    missingAuthorityInformation,
    regulatorConsiderations,
    philosophyConsiderations,
    auditTrail,
    confidence:
      applicableAuthorities.length > 0
        ? "medium"
        : "low",
    authorityApplied:
      applicableAuthorities.length > 0,
  };
}