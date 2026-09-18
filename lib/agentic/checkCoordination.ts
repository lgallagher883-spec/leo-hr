export type WorkforceCheckPlan = {
  checkType: "right_to_work" | "dbs";
  reuseExistingVerifiedEvidence: boolean;
  prepareProviderRequest: boolean;
  advanceAdministrativeWorkflow: boolean;
  needsHumanVerification: boolean;
  needsHumanSuitabilityDecision: boolean;
  reasons: string[];
};

export function planWorkforceCheck(args: {
  checkType: "right_to_work" | "dbs";
  required: boolean;
  existingVerifiedEvidence: boolean;
  providerAvailable: boolean;
  consentRecorded: boolean;
  discrepancyRecorded: boolean;
}): WorkforceCheckPlan {
  const reasons: string[] = [];

  if (!args.required) {
    return {
      checkType: args.checkType,
      reuseExistingVerifiedEvidence: false,
      prepareProviderRequest: false,
      advanceAdministrativeWorkflow: true,
      needsHumanVerification: false,
      needsHumanSuitabilityDecision: false,
      reasons: ["This check is not required for the role or workflow."],
    };
  }

  if (args.discrepancyRecorded) {
    reasons.push("The check contains a discrepancy requiring human review.");
  }

  const reuseExistingVerifiedEvidence =
    args.existingVerifiedEvidence && !args.discrepancyRecorded;

  const prepareProviderRequest =
    !reuseExistingVerifiedEvidence &&
    args.providerAvailable &&
    args.consentRecorded &&
    !args.discrepancyRecorded;

  if (!reuseExistingVerifiedEvidence && !args.consentRecorded) {
    reasons.push("Required consent has not been recorded.");
  }
  if (!reuseExistingVerifiedEvidence && !args.providerAvailable) {
    reasons.push("The approved check provider is not currently available.");
  }

  return {
    checkType: args.checkType,
    reuseExistingVerifiedEvidence,
    prepareProviderRequest,
    advanceAdministrativeWorkflow:
      reuseExistingVerifiedEvidence && !args.discrepancyRecorded,
    needsHumanVerification:
      args.required && !reuseExistingVerifiedEvidence,
    needsHumanSuitabilityDecision:
      args.checkType === "dbs" && args.discrepancyRecorded,
    reasons,
  };
}
