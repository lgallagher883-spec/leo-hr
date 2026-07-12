import { runAcasCodeAuthority } from "./acas/codeAuthority";
import { runAcasGuidanceAuthority } from "./acas/guidanceAuthority";
import { runEmploymentRightsAuthority } from "./legislation/employmentRightsAuthority";
import { runEqualityAuthority } from "./legislation/equalityAuthority";
import { runWorkingTimeAuthority } from "./legislation/workingTimeAuthority";

import {
  AuthorityAuditEntry,
  AuthorityComplianceGap,
  AuthorityConflict,
  AuthorityEngineInput,
  AuthorityEngineOutput,
  AuthorityRecommendation,
  AuthorityReference,
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

    groundedRecommendations.push({
      action:
        "Check the applicable employment-rights provisions and commencement position before making a final decision.",
      rationale:
        "Employment Rights Act 2025 provisions are being introduced in phases, so Leo must confirm that the relevant provision is legally operative.",
      supportedBy: employmentRightsAuthorities.map(
        (authority) => authority.title
      ),
      priority: "high",
      requiresHumanDecision: true,
    });
  }

  const equalityAuthorities =
    runEqualityAuthority(input);

  addAuthorities(equalityAuthorities);

  if (equalityAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Confirm the protected-characteristic context, prohibited conduct and any reasonable-adjustment duties before reaching a final decision."
    );

    groundedRecommendations.push({
      action:
        "Complete an equality-risk assessment before taking action that could disadvantage the employee.",
      rationale:
        "The matter may engage discrimination, harassment, victimisation or reasonable-adjustment duties.",
      supportedBy: equalityAuthorities.map(
        (authority) => authority.title
      ),
      priority: "high",
      requiresHumanDecision: true,
    });
  }

  const workingTimeAuthorities =
    runWorkingTimeAuthority(input);

  addAuthorities(workingTimeAuthorities);

  if (workingTimeAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Confirm the employee's hours, working pattern, rest periods, annual-leave position and any valid opt-out arrangements."
    );

    groundedRecommendations.push({
      action:
        "Check working hours, rest requirements and statutory annual-leave rights before confirming the proposed arrangement.",
      rationale:
        "The matter may engage mandatory working-time, rest-break, night-work or paid-leave requirements.",
      supportedBy: workingTimeAuthorities.map(
        (authority) => authority.title
      ),
      priority: "high",
      requiresHumanDecision: true,
    });
  }

  const acasCodeAuthorities =
    runAcasCodeAuthority(input);

  addAuthorities(acasCodeAuthorities);

  for (const authority of acasCodeAuthorities) {
    if (
      authority.id ===
      "acas-disciplinary-grievance-code"
    ) {
      groundedRecommendations.push({
        action:
          "Follow a fair process that includes fact-finding, clear written concerns, an opportunity for the employee to respond, a reasoned outcome and an appeal where applicable.",
        rationale:
          "The ACAS disciplinary and grievance framework requires procedural fairness before formal action is concluded.",
        supportedBy: [authority.title],
        priority: "high",
        requiresHumanDecision: true,
      });
    }

    if (
      authority.id ===
      "acas-flexible-working-code"
    ) {
      groundedRecommendations.push({
        action:
          "Consider the flexible-working request reasonably, discuss it with the employee where appropriate and provide a properly reasoned decision without unreasonable delay.",
        rationale:
          "The ACAS flexible-working framework sets expectations for a reasonable and procedurally fair response.",
        supportedBy: [authority.title],
        priority: "high",
        requiresHumanDecision: true,
      });
    }
  }

  if (acasCodeAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Confirm whether the relevant ACAS Code steps have already been followed and identify any procedural gaps."
    );
  }

  const acasGuidanceAuthorities =
    runAcasGuidanceAuthority(input);

  addAuthorities(acasGuidanceAuthorities);

  for (const authority of acasGuidanceAuthorities) {
    groundedRecommendations.push({
      action:
        authority.relevance.split(". ").slice(-1)[0] ||
        "Apply the relevant ACAS guidance to the matter.",
      rationale: authority.summary,
      supportedBy: [authority.title],
      priority: "medium",
      requiresHumanDecision: true,
    });
  }

  if (acasGuidanceAuthorities.length > 0) {
    missingAuthorityInformation.push(
      "Confirm which relevant ACAS guidance steps have already been followed and identify any remaining gaps."
    );
  }

  for (const auditEntry of auditTrail) {
    auditEntry.appliedToRecommendation =
      groundedRecommendations.some((recommendation) =>
        recommendation.supportedBy.includes(
          auditEntry.sourceTitle
        )
      );
  }

  const authorityApplied =
    groundedRecommendations.length > 0;

  return {
    applicableAuthorities,
    conflicts,
    complianceGaps,
    groundedRecommendations,
    missingAuthorityInformation: Array.from(
      new Set(missingAuthorityInformation)
    ),
    regulatorConsiderations,
    philosophyConsiderations,
    auditTrail,
    confidence:
      groundedRecommendations.length > 0
        ? "high"
        : applicableAuthorities.length > 0
          ? "medium"
          : "low",
    authorityApplied,
  };
}