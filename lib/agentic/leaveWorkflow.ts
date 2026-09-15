export type RoutineLeaveAssessment = {
  canAutoApprove: boolean;
  reasons: string[];
};

export function assessRoutineAnnualLeave(args: {
  leaveType: string;
  daysTaken: number | null;
  availableDays: number | null;
  overlapsExisting: boolean;
  workingPatternKnown: boolean;
  delegatedAutoApproval: boolean;
}): RoutineLeaveAssessment {
  const reasons: string[] = [];

  if (!args.delegatedAutoApproval) {
    reasons.push("The organisation has not explicitly delegated routine annual leave approval to Leo.");
  }

  if (args.leaveType !== "Annual Leave" && args.leaveType !== "Half Day Leave") {
    reasons.push("This leave type requires human consideration.");
  }

  if (!args.workingPatternKnown) {
    reasons.push("The employee's working pattern is not complete enough for automatic checking.");
  }

  if (!Number.isFinite(args.daysTaken) || Number(args.daysTaken) <= 0) {
    reasons.push("The requested leave duration could not be confirmed.");
  }

  if (!Number.isFinite(args.availableDays)) {
    reasons.push("The available annual leave balance could not be confirmed.");
  } else if (Number(args.daysTaken) > Number(args.availableDays)) {
    reasons.push("The request exceeds the confirmed available annual leave balance.");
  }

  if (args.overlapsExisting) {
    reasons.push("The request overlaps another active leave record.");
  }

  return {
    canAutoApprove: reasons.length === 0,
    reasons,
  };
}
