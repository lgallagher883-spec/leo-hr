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


export function readDelegatedRoutineLeaveApproval(
  companyKnowledge: Array<{ title?: string | null; content?: string | null }>,
): boolean {
  const statements = companyKnowledge
    .map((item) => `${item.title || ""}\n${item.content || ""}`.toLowerCase())
    .join("\n");

  const explicitlyDelegates =
    /leo\s+(?:may|can|is authorised to|is authorized to)\s+(?:automatically\s+)?approve\s+(?:routine\s+)?annual leave/.test(
      statements,
    ) ||
    /(?:routine\s+)?annual leave\s+(?:may|can)\s+be\s+(?:automatically\s+)?approved\s+by\s+leo/.test(
      statements,
    );

  const explicitBlock =
    /leo\s+(?:must not|cannot|can not|is not authorised to|is not authorized to)\s+(?:automatically\s+)?approve\s+(?:routine\s+)?annual leave/.test(
      statements,
    ) ||
    /annual leave\s+(?:must|should)\s+be\s+approved\s+by\s+(?:a\s+)?(?:manager|owner|human)/.test(
      statements,
    );

  return explicitlyDelegates && !explicitBlock;
}


export function shouldAutoCancelRoutineAnnualLeave(args: {
  leaveType: string;
  currentStatus: string | null;
  delegatedAutoApproval: boolean;
  wasAgenticAutoApproved: boolean;
  leaveHasStarted: boolean;
}): { canAutoCancel: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!args.delegatedAutoApproval) {
    reasons.push("The organisation has not explicitly delegated routine annual leave approval to Leo.");
  }

  if (args.leaveType !== "Annual Leave" && args.leaveType !== "Half Day Leave") {
    reasons.push("This leave type requires human consideration.");
  }

  if (!args.wasAgenticAutoApproved) {
    reasons.push("Leo only reverses leave that it previously approved automatically.");
  }

  if (String(args.currentStatus || "").toLowerCase() !== "approved") {
    reasons.push("Only an approved leave record can be automatically cancelled.");
  }

  if (args.leaveHasStarted) {
    reasons.push("Leave that has already started requires human consideration.");
  }

  return {
    canAutoCancel: reasons.length === 0,
    reasons,
  };
}
