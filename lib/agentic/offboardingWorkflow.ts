export type OffboardingAdministrationPlan = {
  prepareHandoverPack: boolean;
  prepareAssetReturnPack: boolean;
  calculateProvisionalLeaveReconciliation: boolean;
  preparePayrollInputs: boolean;
  scheduleApprovedAccessChanges: boolean;
  prepareRetentionWorkflow: boolean;
  needsHumanInput: boolean;
  blockInferredDeparture: boolean;
  blockFinalPayOrDeductionDecision: boolean;
  blockUnauthorisedAccessRemoval: boolean;
  reasons: string[];
};

export function planOffboardingAdministration(args: {
  departureAuthorised: boolean;
  finalDateConfirmed: boolean;
  departureDisputed: boolean;
  leaveRulesConfigured: boolean;
  leaveRecordsComplete: boolean;
  payrollInputsComplete: boolean;
  accessChangesApproved: boolean;
  retentionRulesConfigured: boolean;
  finalPayOrDeductionDecisionRequested: boolean;
}): OffboardingAdministrationPlan {
  const reasons: string[] = [];
  const confirmedDeparture =
    args.departureAuthorised && args.finalDateConfirmed && !args.departureDisputed;

  if (!args.departureAuthorised) {
    reasons.push("No authorised departure record is available.");
  }
  if (args.departureAuthorised && !args.finalDateConfirmed) {
    reasons.push("The employee's final date has not been confirmed.");
  }
  if (args.departureDisputed) {
    reasons.push("The departure date or basis is disputed and requires human review.");
  }
  if (confirmedDeparture && (!args.leaveRulesConfigured || !args.leaveRecordsComplete)) {
    reasons.push("Leave reconciliation requires complete records and configured rules.");
  }
  if (confirmedDeparture && !args.payrollInputsComplete) {
    reasons.push("Payroll information is incomplete.");
  }
  if (confirmedDeparture && !args.accessChangesApproved) {
    reasons.push("Access changes require explicit authorisation.");
  }
  if (confirmedDeparture && !args.retentionRulesConfigured) {
    reasons.push("The retention workflow requires configured retention rules.");
  }
  if (args.finalPayOrDeductionDecisionRequested) {
    reasons.push("Final pay and deduction decisions require human approval.");
  }

  return {
    prepareHandoverPack: confirmedDeparture,
    prepareAssetReturnPack: confirmedDeparture,
    calculateProvisionalLeaveReconciliation:
      confirmedDeparture && args.leaveRulesConfigured && args.leaveRecordsComplete,
    preparePayrollInputs: confirmedDeparture,
    scheduleApprovedAccessChanges:
      confirmedDeparture && args.accessChangesApproved,
    prepareRetentionWorkflow:
      confirmedDeparture && args.retentionRulesConfigured,
    needsHumanInput:
      !confirmedDeparture ||
      !args.leaveRulesConfigured ||
      !args.leaveRecordsComplete ||
      !args.payrollInputsComplete ||
      !args.accessChangesApproved ||
      !args.retentionRulesConfigured ||
      args.finalPayOrDeductionDecisionRequested,
    blockInferredDeparture: !args.departureAuthorised,
    blockFinalPayOrDeductionDecision:
      args.finalPayOrDeductionDecisionRequested,
    blockUnauthorisedAccessRemoval: !args.accessChangesApproved,
    reasons,
  };
}
