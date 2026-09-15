export type ComplianceEvidenceState = "verified" | "present_unverified" | "missing" | "contradictory";

export type ComplianceReconciliationPlan = {
  closeAdministrativeGap: boolean;
  linkExistingEvidence: boolean;
  needsHumanReview: boolean;
  supportingEvidenceRequired: boolean;
  reasons: string[];
};

export function planComplianceReconciliation(args: {
  requirementApplies: boolean;
  evidenceState: ComplianceEvidenceState;
  evidenceMatchesEmployee: boolean;
  evidenceCurrent: boolean;
}): ComplianceReconciliationPlan {
  const reasons: string[] = [];

  if (!args.requirementApplies) {
    return {
      closeAdministrativeGap: true,
      linkExistingEvidence: false,
      needsHumanReview: false,
      supportingEvidenceRequired: false,
      reasons: ["The requirement does not apply to this employee."],
    };
  }

  if (args.evidenceState === "contradictory") {
    reasons.push("Existing evidence is contradictory.");
  }
  if (args.evidenceState === "missing") {
    reasons.push("Supporting evidence is missing.");
  }
  if (!args.evidenceMatchesEmployee && args.evidenceState !== "missing") {
    reasons.push("The evidence cannot be safely matched to this employee.");
  }
  if (!args.evidenceCurrent && args.evidenceState !== "missing") {
    reasons.push("The evidence is not current.");
  }
  if (args.evidenceState === "present_unverified") {
    reasons.push("The evidence is present but still requires verification.");
  }

  const verifiedUsable =
    args.evidenceState === "verified" &&
    args.evidenceMatchesEmployee &&
    args.evidenceCurrent;

  return {
    closeAdministrativeGap: verifiedUsable,
    linkExistingEvidence: verifiedUsable,
    needsHumanReview:
      args.evidenceState === "contradictory" ||
      args.evidenceState === "present_unverified" ||
      (!args.evidenceMatchesEmployee && args.evidenceState !== "missing"),
    supportingEvidenceRequired: !verifiedUsable,
    reasons,
  };
}
