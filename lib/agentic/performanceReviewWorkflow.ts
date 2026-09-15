export type PerformanceReviewAdminPlan = {
  prepareReview: boolean;
  carryForwardOpenActions: boolean;
  prepareDevelopmentAssignments: boolean;
  needsHumanAssessment: boolean;
  blockPayOrPromotionDecision: boolean;
  blockFormalCapabilityDecision: boolean;
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
    reasons,
  };
}
