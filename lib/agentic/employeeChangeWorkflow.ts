export type EmploymentChange = {
  field: string;
  label: string;
  previousValue: unknown;
  newValue: unknown;
};

const fieldLabels: Record<string, string> = {
  role: "Role / job title",
  manager: "Line manager",
  contracted_hours_per_week: "Contracted hours",
  contracted_days_per_week: "Contracted days",
  working_days: "Working days",
  working_pattern_type: "Working pattern",
  annual_leave_allowance: "Annual leave allowance",
  employment_end_date: "Employment end date",
  status: "Employment status",
  email: "Email",
};

function comparable(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify([...value].sort());
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function detectApprovedEmploymentChanges(args: {
  previousEmployee: Record<string, unknown>;
  nextEmployee: Record<string, unknown>;
  previousEmployment: Record<string, unknown> | null;
  nextEmployment: Record<string, unknown>;
}): EmploymentChange[] {
  const { previousEmployee, nextEmployee, previousEmployment, nextEmployment } = args;
  const changes: EmploymentChange[] = [];

  for (const field of ["role", "status", "email"]) {
    if (comparable(previousEmployee[field]) !== comparable(nextEmployee[field])) {
      changes.push({
        field,
        label: fieldLabels[field] || field,
        previousValue: previousEmployee[field] ?? null,
        newValue: nextEmployee[field] ?? null,
      });
    }
  }

  for (const field of [
    "manager",
    "contracted_hours_per_week",
    "contracted_days_per_week",
    "working_days",
    "working_pattern_type",
    "annual_leave_allowance",
    "employment_end_date",
  ]) {
    if (comparable(previousEmployment?.[field]) !== comparable(nextEmployment[field])) {
      changes.push({
        field,
        label: fieldLabels[field] || field,
        previousValue: previousEmployment?.[field] ?? null,
        newValue: nextEmployment[field] ?? null,
      });
    }
  }

  return changes;
}

export function downstreamAdminForChanges(changes: EmploymentChange[]) {
  const fields = new Set(changes.map((change) => change.field));
  const actions: Array<{
    key: string;
    label: string;
    status: "prepared" | "completed";
    reason: string;
  }> = [];

  if (fields.has("manager")) {
    actions.push({
      key: "reporting_relationship",
      label: "Reporting relationship updated",
      status: "completed",
      reason: "The approved manager change is already reflected in the employee record.",
    });
  }

  if (
    fields.has("role") ||
    fields.has("contracted_hours_per_week") ||
    fields.has("contracted_days_per_week") ||
    fields.has("working_days") ||
    fields.has("working_pattern_type")
  ) {
    actions.push({
      key: "contract_variation",
      label: "Contract variation preparation",
      status: "prepared",
      reason: "Leo can prepare a variation record from the approved change without asking the employer to repeat it.",
    });
  }

  if (
    fields.has("contracted_hours_per_week") ||
    fields.has("contracted_days_per_week") ||
    fields.has("working_days") ||
    fields.has("annual_leave_allowance")
  ) {
    actions.push({
      key: "entitlement_review",
      label: "Leave entitlement review",
      status: "prepared",
      reason: "Working-pattern changes can affect entitlement, so Leo has flagged the existing leave configuration for deterministic recalculation/review rather than guessing.",
    });
  }

  if (
    fields.has("role") ||
    fields.has("contracted_hours_per_week") ||
    fields.has("contracted_days_per_week") ||
    fields.has("working_pattern_type")
  ) {
    actions.push({
      key: "payroll_change_pack",
      label: "Payroll change pack",
      status: "prepared",
      reason: "Leo has assembled the approved employment changes that may need to be supplied to payroll.",
    });
  }

  if (fields.has("role")) {
    actions.push({
      key: "role_assignments_review",
      label: "Role-based assignments review",
      status: "prepared",
      reason: "A role change can affect policy, learning and compliance requirements. Leo should compare the new role with existing assignments before adding anything.",
    });
  }

  return actions;
}
