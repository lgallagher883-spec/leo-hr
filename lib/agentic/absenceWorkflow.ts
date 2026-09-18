export type AbsenceAdminPlan = {
  prepareReturnToWork: boolean;
  preparePayrollInput: boolean;
  closeRoutineAdministration: boolean;
  needsHumanReview: boolean;
  reasons: string[];
};

export function planAbsenceAdministration(args: {
  leaveType: string;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  evidenceComplete: boolean;
  welfareConcernRecorded: boolean;
  adjustmentNeedRecorded: boolean;
  recordDisputed: boolean;
}): AbsenceAdminPlan {
  const isSickness = args.leaveType.trim().toLowerCase() === "sickness absence";
  const status = String(args.status || "").trim().toLowerCase();
  const returned =
    status === "completed" ||
    (Boolean(args.endDate) && status !== "cancelled" && status !== "declined");

  const reasons: string[] = [];

  if (!isSickness) {
    reasons.push("This is not a sickness absence workflow.");
  }
  if (!args.startDate) {
    reasons.push("The absence start date is missing.");
  }
  if (args.welfareConcernRecorded) {
    reasons.push("A welfare concern requires human consideration.");
  }
  if (args.adjustmentNeedRecorded) {
    reasons.push("A possible adjustment requires human consideration.");
  }
  if (args.recordDisputed) {
    reasons.push("The absence record is disputed.");
  }

  const needsHumanReview =
    reasons.some((reason) => !reason.startsWith("This is not")) ||
    args.welfareConcernRecorded ||
    args.adjustmentNeedRecorded ||
    args.recordDisputed;

  return {
    prepareReturnToWork: isSickness && returned,
    preparePayrollInput: isSickness && Boolean(args.startDate),
    closeRoutineAdministration:
      isSickness &&
      returned &&
      args.evidenceComplete &&
      !needsHumanReview,
    needsHumanReview,
    reasons,
  };
}
