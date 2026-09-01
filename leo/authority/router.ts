import { runAcasCodeAuthority } from "./acas/codeAuthority";
import { runAcasGuidanceAuthority } from "./acas/guidanceAuthority";
import { runEmploymentRightsAuthority } from "./legislation/employmentRightsAuthority";
import { runEqualityAuthority } from "./legislation/equalityAuthority";
import { runWorkingTimeAuthority } from "./legislation/workingTimeAuthority";

import {
  AuthorityAuditEntry,
  AuthorityEngineInput,
  AuthorityEngineOutput,
  AuthorityReference,
} from "./types";

export async function runAuthorityEngine(
  input: AuthorityEngineInput
): Promise<AuthorityEngineOutput> {
  const applicableAuthorities: AuthorityReference[] = [];
  const auditTrail: AuthorityAuditEntry[] = [];
  const missingAuthorityInformation: string[] = [];

  function addAuthorities(
    authorities: AuthorityReference[]
  ): void {
    applicableAuthorities.push(...authorities);
    auditTrail.push(
      ...authorities.map((authority) => ({
        sourceType: authority.sourceType,
        sourceTitle: authority.title,
        finding: authority.relevance,
        appliedToRecommendation: false,
      }))
    );
  }

  const employmentRightsAuthorities =
    runEmploymentRightsAuthority(input);
  addAuthorities(employmentRightsAuthorities);

  if (employmentRightsAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Confirm which relevant Employment Rights Act 2025 provisions are currently in force and whether transitional arrangements apply."
    );
  }

  const equalityAuthorities = runEqualityAuthority(input);
  addAuthorities(equalityAuthorities);

  if (equalityAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Confirm the potentially relevant Equality Act provisions and factual protected-characteristic context."
    );
  }

  const workingTimeAuthorities = runWorkingTimeAuthority(input);
  addAuthorities(workingTimeAuthorities);

  if (workingTimeAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Confirm the potentially relevant working-time, rest, night-work, leave and opt-out provisions."
    );
  }

  const acasCodeAuthorities = runAcasCodeAuthority(input);
  addAuthorities(acasCodeAuthorities);

  if (acasCodeAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Verify the current applicable ACAS Code and the parts relevant to the employer's question."
    );
  }

  const acasGuidanceAuthorities = runAcasGuidanceAuthority(input);
  addAuthorities(acasGuidanceAuthorities);

  if (acasGuidanceAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Verify the current applicable ACAS guidance and distinguish guidance from mandatory legal requirements."
    );
  }

  const confidence = applicableAuthorities.some(
    (authority) => authority.confidence === "high"
  )
    ? "high"
    : applicableAuthorities.length > 0
      ? "medium"
      : "low";

  return {
    applicableAuthorities,
    conflicts: [],
    complianceGaps: [],
    missingAuthorityInformation: Array.from(
      new Set(missingAuthorityInformation)
    ),
    regulatorConsiderations: [],
    philosophyConsiderations: [],
    auditTrail,
    confidence,
    authorityApplied: applicableAuthorities.length > 0,
  };
}