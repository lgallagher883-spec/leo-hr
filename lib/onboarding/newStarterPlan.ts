import type { NewStarterReadinessResult } from "@/lib/onboarding/newStarterReadiness";

export type NewStarterPreparedAction = {
  key: string;
  label: string;
  kind: "automatic" | "prepare" | "approval_required";
  status: "ready" | "blocked";
  reason: string;
  payload?: Record<string, unknown>;
};

function addMonths(value: string, months: number): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("The employee start date is invalid.");
  }
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function prepareNewStarterPlan(
  readiness: NewStarterReadinessResult,
): {
  employeeId: number;
  overallStatus: NewStarterReadinessResult["overallStatus"];
  actions: NewStarterPreparedAction[];
} {
  const employee = readiness.employee;
  const startDate = employee.startDate;
  const itemByKey = new Map(readiness.items.map((item) => [item.key, item]));

  const probation = itemByKey.get("probation");
  const invitation = itemByKey.get("portal_invitation");
  const contract = itemByKey.get("contract");
  const rightToWork = itemByKey.get("right_to_work");

  const actions: NewStarterPreparedAction[] = [];

  actions.push({
    key: "onboarding_plan",
    label: "Prepare onboarding plan",
    kind: "automatic",
    status: "ready",
    reason: "Leo can assemble the readiness plan from existing records without an AI call.",
  });

  if (probation?.status === "missing") {
    if (!startDate) {
      actions.push({
        key: "probation_schedule",
        label: "Prepare probation schedule",
        kind: "prepare",
        status: "blocked",
        reason: "A start date is required before probation dates can be prepared.",
      });
    } else {
      actions.push({
        key: "probation_schedule",
        label: "Prepare probation schedule",
        kind: "prepare",
        status: "ready",
        reason: "Leo can prepare the existing probation workflow dates for employer approval.",
        payload: {
          action: "start",
          startDate,
          standardEndDate: addMonths(startDate, 3),
          finalDecisionDeadline: addMonths(startDate, 5),
        },
      });
    }
  }

  if (contract?.status === "missing") {
    actions.push({
      key: "contract_preparation",
      label: "Prepare contract / written particulars",
      kind: "prepare",
      status: "ready",
      reason: "Leo can prepare the document requirements, but contractual terms must remain employer-controlled.",
    });
  }

  if (rightToWork?.status === "missing") {
    actions.push({
      key: "right_to_work",
      label: "Complete right to work check",
      kind: "approval_required",
      status: "blocked",
      reason: "Right to work evidence must be checked and recorded by an authorised person before employment begins.",
    });
  }

  if (invitation?.status === "missing") {
    actions.push({
      key: "employee_invitation",
      label: "Prepare employee portal invitation",
      kind: "approval_required",
      status: employee.email ? "ready" : "blocked",
      reason: employee.email
        ? "Leo can prepare the invitation, but sending it externally requires employer approval."
        : "An employee email address is required before an invitation can be prepared.",
      payload: employee.email
        ? {
            employeeId: employee.id,
            email: employee.email,
          }
        : undefined,
    });
  }

  const dbs = itemByKey.get("dbs");
  if (dbs?.status === "needs_review") {
    actions.push({
      key: "dbs_requirement",
      label: "Confirm DBS requirement",
      kind: "approval_required",
      status: "ready",
      reason: "Leo must not infer whether DBS is required when no explicit requirement is recorded.",
    });
  }

  const manager = itemByKey.get("manager");
  if (manager?.status === "missing") {
    actions.push({
      key: "manager_assignment",
      label: "Confirm line manager",
      kind: "approval_required",
      status: "ready",
      reason: "The employer must confirm who is responsible for managing the starter.",
    });
  }

  return {
    employeeId: employee.id,
    overallStatus: readiness.overallStatus,
    actions,
  };
}
