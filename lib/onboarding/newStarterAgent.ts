import type { NewStarterReadinessResult } from "@/lib/onboarding/newStarterReadiness";
import type { NewStarterPreparedAction } from "@/lib/onboarding/newStarterPlan";

type NewStarterPlan = {
  employeeId: number;
  overallStatus: NewStarterReadinessResult["overallStatus"];
  actions: NewStarterPreparedAction[];
};

function outstanding(
  readiness: NewStarterReadinessResult,
  key: string,
) {
  const item = readiness.items.find((candidate) => candidate.key === key);
  return Boolean(
    item &&
      item.status !== "complete" &&
      item.status !== "not_required",
  );
}

function displayPreparedAction(action: NewStarterPreparedAction): string {
  switch (action.key) {
    case "onboarding_plan":
      return "onboarding plan";
    case "probation_schedule":
      return "probation dates";
    case "employee_invitation":
      return "employee invitation";
    case "contract_preparation":
      return "employment documents";
    default:
      return action.label.toLowerCase();
  }
}

export function buildNewStarterWorkflowStartReply(args: {
  readiness: NewStarterReadinessResult;
  plan: NewStarterPlan;
}): string {
  const { readiness, plan } = args;
  const name = readiness.employee.name || "the new starter";
  const remaining = readiness.counts.missing + readiness.counts.needsReview;

  if (readiness.overallStatus === "ready" || remaining === 0) {
    return [
      `${name}'s new starter checks are complete. There is nothing else I need from you in this readiness workflow.`,
      "",
      "I'll stop surfacing the new starter action panel now that the outstanding actions are complete.",
    ].join("\n");
  }

  const prepared = plan.actions
    .filter(
      (action) =>
        action.status === "ready" &&
        (action.kind === "automatic" || action.kind === "prepare") &&
        action.key !== "contract_preparation",
    )
    .map(displayPreparedAction);

  const employerInputs: string[] = [];
  if (outstanding(readiness, "manager")) employerInputs.push("line manager");
  if (outstanding(readiness, "dbs")) employerInputs.push("DBS / safeguarding requirement");
  if (outstanding(readiness, "right_to_work")) employerInputs.push("right to work");
  if (outstanding(readiness, "contract")) employerInputs.push("employment terms");
  if (outstanding(readiness, "mandatory_learning")) employerInputs.push("mandatory learning");

  const employeeInputs: string[] = [];
  if (outstanding(readiness, "emergency_contact")) employeeInputs.push("emergency contact");

  let nextQuestion = "";
  if (outstanding(readiness, "manager")) {
    nextQuestion = `First, who will ${name} report to?`;
  } else if (outstanding(readiness, "dbs")) {
    nextQuestion = `First, does ${name}'s role require a DBS check or safeguarding clearance?`;
  } else if (outstanding(readiness, "right_to_work")) {
    nextQuestion = `First, how will ${name}'s right to work check be completed and recorded?`;
  } else if (outstanding(readiness, "contract")) {
    nextQuestion = `First, are ${name}'s employment terms confirmed so I can use them to prepare the employment documents?`;
  } else if (outstanding(readiness, "mandatory_learning")) {
    nextQuestion = `First, what mandatory learning should apply to ${name}'s role?`;
  } else if (outstanding(readiness, "portal_invitation")) {
    nextQuestion = readiness.employee.email
      ? `The employee invitation is ready to prepare. I will still need your approval before anything is sent externally.`
      : `First, what email address should be used for ${name}'s employee portal invitation?`;
  } else {
    nextQuestion = "The remaining items need to be completed or recorded before I can close the new starter workflow.";
  }

  const lines = [
    `${name} has ${remaining} new starter action${remaining === 1 ? "" : "s"} outstanding.`,
  ];

  if (prepared.length > 0) {
    lines.push(
      "",
      `From the information already held in Leo, I can prepare the ${prepared.join(" and ")} without asking you to work them out manually.`,
    );
  }

  if (employerInputs.length > 0) {
    lines.push(
      "",
      `I still need employer input on: ${employerInputs.join(" · ")}.`,
    );
  }

  if (employeeInputs.length > 0) {
    lines.push(
      `${name} will need to complete: ${employeeInputs.join(" · ")}.`,
    );
  }

  lines.push(
    "",
    nextQuestion,
    "",
    `When you have that information, let me know so I can continue getting ${name} ready.`,
  );

  return lines.join("\n");
}


export function buildNewStarterWorkflowProgressReply(args: {
  readiness: NewStarterReadinessResult;
  plan: NewStarterPlan;
  applied: Array<{ key: string; summary: string }>;
  pending: Array<{ key: string; summary: string }>;
}): string {
  const { readiness, plan, applied, pending } = args;
  const name = readiness.employee.name || "the new starter";
  const remaining = readiness.counts.missing + readiness.counts.needsReview;

  const lines: string[] = [];

  if (applied.length > 0) {
    lines.push(
      applied.map((action) => `• ${action.summary}`).join("\n"),
    );
  }

  if (pending.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(pending.map((item) => `• ${item.summary}`).join("\n"));
  }

  if (remaining === 0) {
    lines.push(
      "",
      `${name}'s new starter readiness actions are now complete. I do not need any further information for this workflow.`,
    );
    return lines.join("\n");
  }

  const itemByKey = new Map(readiness.items.map((item) => [item.key, item]));
  const isOutstanding = (key: string) => {
    const item = itemByKey.get(key);
    return Boolean(item && item.status !== "complete" && item.status !== "not_required");
  };

  let next = "";
  if (isOutstanding("manager")) {
    next = `Who will ${name} report to?`;
  } else if (isOutstanding("right_to_work")) {
    next = `Has ${name}'s right to work check been completed? If it has, I need the completed check to be recorded before I can clear that action.`;
  } else if (isOutstanding("dbs")) {
    next = `Does ${name}'s role require a DBS check or safeguarding clearance?`;
  } else if (isOutstanding("contract")) {
    const contractAction = plan.actions.find((action) => action.key === "contract_preparation");
    next = contractAction?.status === "ready"
      ? `The employment document is still not complete. I have the chosen draft-contract basis, but I still need the confirmed employment terms required to prepare it safely.`
      : `I still need the confirmed employment terms before the employment document can be prepared.`;
  } else if (isOutstanding("emergency_contact")) {
    next = `I still need a contact telephone number for each emergency contact before I can treat that action as complete.`;
  } else if (isOutstanding("mandatory_learning")) {
    next = `What mandatory learning, if any, should apply to ${name}'s role?`;
  } else if (isOutstanding("probation")) {
    next = `I can prepare the probation dates from the recorded start date, but the probation action has not yet been completed in the employee record.`;
  } else if (isOutstanding("portal_invitation")) {
    next = readiness.employee.email
      ? `The employee portal invitation can be prepared, but it still requires employer approval before anything is sent externally.`
      : `What email address should be used for ${name}'s employee portal invitation?`;
  } else {
    next = "There are still outstanding readiness items that need to be completed or recorded.";
  }

  lines.push(
    "",
    `${remaining} new starter action${remaining === 1 ? "" : "s"} remain outstanding.`,
    "",
    next,
    "",
    `When you have that information, let me know so I can continue getting ${name} ready.`,
  );

  return lines.join("\n");
}
