export type AcceptedOfferAdminPlan = {
  ensureOnboardingAppointment: boolean;
  reuseRecruitmentData: boolean;
  prepareDueDiligence: boolean;
  prepareEmploymentDocuments: boolean;
  createEmployeeNow: boolean;
  needsHumanInput: boolean;
  reasons: string[];
};

export function planAcceptedOfferAdministration(args: {
  offerAccepted: boolean;
  startDateConfirmed: boolean;
  appointmentDecisionAllowsProgression: boolean;
  requiredChecksSatisfied: boolean;
  nonStandardTermsRecorded: boolean;
}): AcceptedOfferAdminPlan {
  const reasons: string[] = [];

  if (!args.offerAccepted) reasons.push("The offer has not been accepted.");
  if (!args.startDateConfirmed) reasons.push("The start date is not confirmed.");
  if (!args.appointmentDecisionAllowsProgression) {
    reasons.push("The appointment decision does not allow progression.");
  }
  if (!args.requiredChecksSatisfied) {
    reasons.push("Required pre-employment checks are not yet satisfied.");
  }
  if (args.nonStandardTermsRecorded) {
    reasons.push("Non-standard employment terms require human confirmation.");
  }

  const canPrepare =
    args.offerAccepted && args.appointmentDecisionAllowsProgression;

  return {
    ensureOnboardingAppointment: canPrepare,
    reuseRecruitmentData: canPrepare,
    prepareDueDiligence: canPrepare && !args.requiredChecksSatisfied,
    prepareEmploymentDocuments: canPrepare,
    createEmployeeNow:
      canPrepare &&
      args.startDateConfirmed &&
      args.requiredChecksSatisfied &&
      !args.nonStandardTermsRecorded,
    needsHumanInput:
      !args.startDateConfirmed ||
      !args.appointmentDecisionAllowsProgression ||
      args.nonStandardTermsRecorded,
    reasons,
  };
}
