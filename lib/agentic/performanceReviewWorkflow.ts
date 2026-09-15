export type PerformanceReviewEvidence = {
  source: "employee_timeline" | "learning" | "probation" | "manager";
  label: string;
  recordedAt?: string | null;
};

function prepareTraceableEvidence(
  evidence: PerformanceReviewEvidence[] = [],
): PerformanceReviewEvidence[] {
  const seen = new Set<string>();

  return evidence.flatMap((item) => {
    const label = item.label.trim();
    const recordedAt = item.recordedAt?.trim() || null;
    const key = `${item.source}:${label.toLocaleLowerCase()}:${recordedAt || ""}`;

    if (!label || seen.has(key)) return [];
    seen.add(key);

    return [{ source: item.source, label, recordedAt }];
  });
}

export type PerformanceReviewAdminPlan = {
  prepareReview: boolean;
  carryForwardOpenActions: boolean;
  prepareDevelopmentAssignments: boolean;
  needsHumanAssessment: boolean;
  blockPayOrPromotionDecision: boolean;
  blockFormalCapabilityDecision: boolean;
  reviewPack: {
    objectivesAvailable: boolean;
    previousCommitmentsAvailable: boolean;
    employeeContributionAvailable: boolean;
    evidence: PerformanceReviewEvidence[];
  };
  reasons: string[];
};

export function planPerformanceReviewAdministration(args: {
  reviewCycleOpen: boolean;
  objectivesAvailable: boolean;
  previousCommitmentsAvailable: boolean;
  employeeContributionAvailable: boolean;
  managerAssessmentRecorded: boolean;
  developmentActionsApproved: boolean;
  payOrPromotionDecisionRequested: boolean;
  formalCapabilityDecisionRequested: boolean;
  evidence?: PerformanceReviewEvidence[];
}): PerformanceReviewAdminPlan {
  const reasons: string[] = [];

  if (!args.reviewCycleOpen) reasons.push("No performance review cycle is currently open.");
  if (!args.managerAssessmentRecorded && args.reviewCycleOpen) {
    reasons.push("The manager's performance assessment has not been recorded.");
  }
  if (args.payOrPromotionDecisionRequested) {
    reasons.push("Pay and promotion decisions require human judgement.");
  }
  if (args.formalCapabilityDecisionRequested) {
    reasons.push("A formal capability decision requires human judgement.");
  }

  return {
    prepareReview: args.reviewCycleOpen,
    carryForwardOpenActions:
      args.reviewCycleOpen && args.previousCommitmentsAvailable,
    prepareDevelopmentAssignments:
      args.reviewCycleOpen && args.developmentActionsApproved,
    needsHumanAssessment:
      args.reviewCycleOpen && !args.managerAssessmentRecorded,
    blockPayOrPromotionDecision: args.payOrPromotionDecisionRequested,
    blockFormalCapabilityDecision: args.formalCapabilityDecisionRequested,
    reviewPack: {
      objectivesAvailable: args.objectivesAvailable,
      previousCommitmentsAvailable: args.previousCommitmentsAvailable,
      employeeContributionAvailable: args.employeeContributionAvailable,
      evidence: prepareTraceableEvidence(args.evidence),
    },
    reasons,
  };
}
