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
  automaticCompleted?: Array<{ key: string; summary: string }>;
  automaticDeferred?: Array<{ key: string; summary: string }>;
}): string {
  const { readiness, plan, automaticCompleted = [], automaticDeferred = [] } = args;
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

  const employeeInputs: string[] = [];
  if (outstanding(readiness, "emergency_contact")) employeeInputs.push("emergency contact");

  let nextQuestion = "";
  if (outstanding(readiness, "manager")) {
    nextQuestion = `First, who will ${name} report to?`;
  } else if (outstanding(readiness, "dbs")) {
    nextQuestion = `First, does ${name}'s role require a DBS check or safeguarding clearance?`;
  } else if (outstanding(readiness, "right_to_work")) {
    nextQuestion = `First, how will ${name}'s right to work check be completed and recorded?`;
  } else if (outstanding(readiness, "portal_invitation") && !readiness.employee.email) {
    nextQuestion = readiness.employee.email
      ? `The employee invitation is ready to prepare. I will still need your approval before anything is sent externally.`
      : `First, what email address should be used for ${name}'s employee portal invitation?`;
  } else if (outstanding(readiness, "emergency_contact")) {
    nextQuestion = `I still need usable emergency contact details for ${name}.`;
  } else {
    nextQuestion = "";
  }

  const lines = [
    `I'm getting ${name} ready using the information and resources already held in Leo.`,
  ];

  if (automaticCompleted.length > 0) {
    lines.push("", automaticCompleted.map((action) => `• ${action.summary}`).join("\n"));
  }

  if (outstanding(readiness, "contract")) {
    lines.push("", "I'm handling the employment contract preparation from the organisation's contract resource and the company and employee information already held. I'll only come back to you if a genuinely required term is missing.");
  }

  if (prepared.length > 0) {
    lines.push(
      "",
      `From the information already held in Leo, I can prepare the ${prepared.join(" and ")} without asking you to work them out manually.`,
    );
  }

  if (employerInputs.length > 0) {
    lines.push("", `I still need your input on: ${employerInputs.join(" · ")}.`);
  }

  if (employeeInputs.length > 0) {
    lines.push(
      `${name} will need to complete: ${employeeInputs.join(" · ")}.`,
    );
  }

  if (nextQuestion) {
    lines.push("", nextQuestion, "", `When you have that information, let me know so I can continue getting ${name} ready.`);
  } else {
    lines.push("", `I'll continue the remaining Leo-owned preparation without asking you to repeat information already in the system.`);
  }

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

  const pendingKeys = new Set(pending.map((item) => item.key));

  let next = "";
  if (isOutstanding("right_to_work")) {
    next = `Has ${name}'s right to work check been completed? If it has, I need the completed check to be recorded before I can clear that action.`;
  } else if (isOutstanding("dbs")) {
    next = `Does ${name}'s role require a DBS check or safeguarding clearance?`;
  } else if (isOutstanding("emergency_contact")) {
    next = `I still need a contact telephone number for each emergency contact before I can treat that action as complete.`;
  } else if (isOutstanding("manager") && !pendingKeys.has("manager")) {
    next = `Who will ${name} report to?`;
  } else if (isOutstanding("manager")) {
    next = `The manager action is still open because the manager you supplied could not yet be matched safely in this organisation.`;
  } else if (isOutstanding("portal_invitation") && !readiness.employee.email) {
    next = `What email address should be used for ${name}'s employee portal invitation?`;
  } else {
    next = "Leo is continuing the remaining preparation from the records and resources already available.";
  }

  const unresolvedNotes: string[] = [];
  if (pendingKeys.has("manager")) {
    unresolvedNotes.push("the manager must be matched to a current employee record before I can update it");
  }
  if (pendingKeys.has("emergency_contact_details")) {
    unresolvedNotes.push("the emergency contacts still need telephone numbers");
  }

  lines.push(
    "",
    `${remaining} new starter action${remaining === 1 ? "" : "s"} remain outstanding.`,
    "",
    next,
  );

  if (unresolvedNotes.length > 0) {
    lines.push("", `Still waiting on: ${unresolvedNotes.join(" · ")}.`);
  }

  lines.push(
    "",
    `When you have that information, let me know so I can continue getting ${name} ready.`,
  );

  return lines.join("\n");
}
