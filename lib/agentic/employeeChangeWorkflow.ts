export type EmploymentChange = {
  field: string;
  label: string;
  previousValue: unknown;
  newValue: unknown;
};

const fieldLabels: Record<string, string> = {
  role: "Role / job title",
  start_date: "Employment start date",
  manager: "Line manager",
  contracted_hours_per_week: "Contracted hours",
  contracted_days_per_week: "Contracted days",
  working_days: "Working days",
  working_pattern_type: "Working pattern",
  annual_leave_allowance: "Annual leave allowance",
  part_year_worker: "Part-year worker status",
  holiday_year_start_month: "Holiday year start month",
  holiday_year_start_day: "Holiday year start day",
  leave_entitlement_basis: "Leave entitlement basis",
  bank_holiday_treatment: "Bank holiday treatment",
  reserved_leave_days: "Reserved leave days",
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

  for (const field of ["role", "start_date", "status", "email"]) {
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
    "part_year_worker",
    "holiday_year_start_month",
    "holiday_year_start_day",
    "leave_entitlement_basis",
    "bank_holiday_treatment",
    "reserved_leave_days",
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
    fields.has("annual_leave_allowance") ||
    fields.has("part_year_worker") ||
    fields.has("holiday_year_start_month") ||
    fields.has("holiday_year_start_day") ||
    fields.has("leave_entitlement_basis") ||
    fields.has("bank_holiday_treatment") ||
    fields.has("reserved_leave_days")
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


export function buildEmployeeChangePacks(changes: EmploymentChange[]) {
  const byField = new Map(changes.map((change) => [change.field, change]));

  const contractFields = [
    "role",
    "start_date",
    "contracted_hours_per_week",
    "contracted_days_per_week",
    "working_days",
    "working_pattern_type",
    "annual_leave_allowance",
    "part_year_worker",
    "holiday_year_start_month",
    "holiday_year_start_day",
    "leave_entitlement_basis",
    "bank_holiday_treatment",
    "reserved_leave_days",
  ];
  const payrollFields = [
    "role",
    "start_date",
    "contracted_hours_per_week",
    "contracted_days_per_week",
    "working_pattern_type",
    "annual_leave_allowance",
    "employment_end_date",
    "status",
  ];

  const pick = (fields: string[]) =>
    fields
      .map((field) => byField.get(field))
      .filter((change): change is EmploymentChange => Boolean(change));

  return {
    contractVariation: pick(contractFields),
    payrollChange: pick(payrollFields),
    roleAssignments: byField.has("role") ? [byField.get("role") as EmploymentChange] : [],
  };
}


export async function syncPublishedMandatoryRolePathways(args: {
  admin: any;
  organisationId: string;
  employeeId: number;
  role: string;
  userId: string;
}): Promise<{ assigned: number; existing: number; reason: string }> {
  const { admin, organisationId, employeeId, role, userId } = args;
  const targetRole = role.trim();

  if (!targetRole) {
    return { assigned: 0, existing: 0, reason: "No approved role is recorded." };
  }

  const pathways = await admin
    .from("development_pathways")
    .select("id,title,estimated_completion_days")
    .eq("organisation_id", organisationId)
    .eq("status", "Published")
    .eq("assignment_type", "Mandatory")
    .ilike("target_role", targetRole)
    .eq("is_archived", false);

  if (pathways.error) throw new Error(pathways.error.message);
  if (!pathways.data?.length) {
    return { assigned: 0, existing: 0, reason: "No published mandatory pathway is configured for the approved role." };
  }

  const pathwayIds = pathways.data.map((pathway: any) => pathway.id);
  const existingAssignments = await admin
    .from("pathway_assignments")
    .select("id,pathway_id,status")
    .eq("employee_id", employeeId)
    .in("pathway_id", pathwayIds);

  if (existingAssignments.error) throw new Error(existingAssignments.error.message);

  const activePathwayIds = new Set(
    (existingAssignments.data ?? [])
      .filter((assignment: any) => assignment.status !== "Cancelled")
      .map((assignment: any) => assignment.pathway_id),
  );

  const toAssign = pathways.data.filter(
    (pathway: any) => !activePathwayIds.has(pathway.id),
  );

  let assigned = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const pathway of toAssign) {
    const targetDate =
      Number.isFinite(Number(pathway.estimated_completion_days)) &&
      Number(pathway.estimated_completion_days) > 0
        ? (() => {
            const date = new Date(today + "T00:00:00");
            date.setDate(date.getDate() + Number(pathway.estimated_completion_days));
            return date.toISOString().slice(0, 10);
          })()
        : null;

    const assignment = await admin
      .from("pathway_assignments")
      .insert({
        pathway_id: pathway.id,
        employee_id: employeeId,
        assigned_date: today,
        start_date: today,
        target_completion_date: targetDate,
        manager_employee_id: null,
        status: "Assigned",
        progress_percent: 0,
        assignment_source: "Agentic Leo - approved role",
        manager_notes: null,
      })
      .select("id")
      .single();

    if (assignment.error) throw new Error(assignment.error.message);

    const steps = await admin
      .from("pathway_steps")
      .select("id,sequence_number")
      .eq("pathway_id", pathway.id)
      .eq("is_archived", false)
      .order("sequence_number", { ascending: true });

    if (steps.error) throw new Error(steps.error.message);

    if (steps.data?.length) {
      const progress = await admin.from("pathway_progress").insert(
        steps.data.map((step: any, index: number) => ({
          pathway_assignment_id: assignment.data.id,
          pathway_step_id: step.id,
          employee_id: employeeId,
          status: index === 0 ? "Available" : "Not Started",
          progress_percent: 0,
        })),
      );

      if (progress.error) throw new Error(progress.error.message);
    }

    assigned += 1;
  }

  if (assigned > 0) {
    const now = new Date().toISOString();
    const timeline = await admin.from("employee_timeline").insert({
      organisation_id: organisationId,
      employee_id: employeeId,
      event_type: "Agentic Mandatory Pathways Assigned",
      title: "Mandatory role learning assigned",
      description: "Leo assigned published mandatory pathways that explicitly match the employee's approved role, without duplicating existing active assignments.",
      status: "Completed",
      source_module: "Agentic Leo",
      source_record_id: String(employeeId),
      metadata: {
        role: targetRole,
        assigned_count: assigned,
        existing_count: activePathwayIds.size,
        ask_leo_involved: false,
      },
      event_date: now,
      created_by: userId,
      created_at: now,
    });

    if (timeline.error) {
      console.warn("Agentic mandatory pathway timeline event could not be created:", timeline.error);
    }
  }

  return {
    assigned,
    existing: activePathwayIds.size,
    reason:
      assigned > 0
        ? "Published mandatory pathways matching the approved role were assigned."
        : "All matching published mandatory pathways are already actively assigned.",
  };
}
