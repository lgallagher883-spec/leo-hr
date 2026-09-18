export type ProbationAdminPlan = {
  prepareReviewPack: boolean;
  implementRecordedOutcome: boolean;
  prepareOutcomeCorrespondence: boolean;
  createExtensionMilestone: boolean;
  dismissalExecutionBlocked: boolean;
  needsHumanDecision: boolean;
  reasons: string[];
};

export function planProbationAdministration(args: {
  reviewType: string | null;
  reviewStatus: string | null;
  recordedOutcome: string | null;
  decisionRecordedByManager: boolean;
}): ProbationAdminPlan {
  const reviewType = String(args.reviewType || "").trim();
  const reviewStatus = String(args.reviewStatus || "").trim().toLowerCase();
  const outcome = String(args.recordedOutcome || "").trim();

  const finalReview = reviewType === "Final Review" || reviewType === "Extension Review";
  const outcomeRecorded =
    args.decisionRecordedByManager &&
    ["Permanent Employment", "Extend Probation", "Terminate Contract"].includes(outcome);

  const reasons: string[] = [];
  if (finalReview && !outcomeRecorded) {
    reasons.push("The probation outcome must be decided and recorded by the manager.");
  }

  return {
    prepareReviewPack: reviewStatus !== "completed",
    implementRecordedOutcome: outcomeRecorded && outcome !== "Terminate Contract",
    prepareOutcomeCorrespondence: outcomeRecorded,
    createExtensionMilestone: outcomeRecorded && outcome === "Extend Probation",
    dismissalExecutionBlocked: outcome === "Terminate Contract",
    needsHumanDecision: finalReview && !outcomeRecorded,
    reasons,
  };
}
