import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RoleKey = "owner" | "senior" | "manager" | "employee";
type ReminderModule = "compliance" | "sar" | "learn";
type ReminderMilestone = "T-30" | "T-14" | "T-7" | "T-1" | "T0";

type ReminderCandidate = {
  module: ReminderModule;
  sourceType: string;
  sourceId: string;
  employeeId: number | null;
  employeeName: string | null;
  dueDate: string;
  milestone: ReminderMilestone;
  title: string;
  message: string;
  actionUrl: string;
  statusBand: "approaching" | "due" | "expired";
  fingerprint: string;
};

type ReminderNotification = {
  id: string;
  title: string;
  message: string;
  action_url: string | null;
  created_at: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
};

type ReminderAction = "dismiss" | "snooze" | "read";

const DAY_MS = 24 * 60 * 60 * 1000;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(role: unknown): RoleKey {
  const key = text(role).toLowerCase();
  if (key === "owner") return "owner";
  if (key === "senior" || key === "hr") return "senior";
  if (key === "manager") return "manager";
  return "employee";
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function daysUntil(dateValue: string): number | null {
  const dueDate = parseDateOnly(dateValue);
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.floor((dueDate.getTime() - today.getTime()) / DAY_MS);
}

function standardMilestone(dateValue: string): ReminderMilestone | null {
  const days = daysUntil(dateValue);
  if (days === null) return null;
  if (days <= 0) return "T0";
  if (days <= 7) return "T-7";
  if (days <= 30) return "T-30";
  return null;
}

function sarMilestone(dateValue: string): ReminderMilestone | null {
  const days = daysUntil(dateValue);
  if (days === null) return null;
  if (days <= 0) return "T0";
  if (days <= 1) return "T-1";
  if (days <= 7) return "T-7";
  if (days <= 14) return "T-14";
  return null;
}

function statusBand(dateValue: string): "approaching" | "due" | "expired" {
  const days = daysUntil(dateValue);
  if (days === null) return "approaching";
  if (days < 0) return "expired";
  if (days === 0) return "due";
  return "approaching";
}

function fingerprint(parts: Array<string | number | null | undefined>) {
  return parts.map((part) => String(part ?? "")).join("|");
}

function notificationKey(userId: string, candidate: ReminderCandidate) {
  return [
    "phase1-reminder",
    userId,
    candidate.module,
    candidate.sourceType,
    candidate.sourceId,
    candidate.milestone,
    candidate.fingerprint,
  ].join(":");
}

function isSarClosed(status: unknown) {
  const value = text(status).toLowerCase();
  return (
    value.includes("complete") ||
    value.includes("closed") ||
    value.includes("cancel") ||
    value.includes("withdrawn") ||
    value.includes("archived")
  );
}

async function resolveUserContext() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      error: "You must be signed in to access reminders.",
      status: 401,
    };
  }

  const resolved = await resolveAuthoritativeUserRole(admin as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  if (!resolved) {
    return {
      ok: false as const,
      error: "Your active organisation could not be resolved.",
      status: 403,
    };
  }

  const organisationId = resolved.membership.organisation_id;
  const roleKey = normaliseRole(resolved.roleKey);

  const permissionKeys = new Set<string>();

  if (roleKey !== "owner") {
    const { data: permissions } = await (supabase as any).rpc(
      "leo_effective_permissions",
      { target_organisation_id: organisationId },
    );

    for (const permission of permissions ?? []) {
      if (permission && typeof permission.permission_key === "string") {
        permissionKeys.add(permission.permission_key);
      }
    }
  }

  const { data: identityMembership } = await (admin as any)
    .from("identity_organisation_memberships")
    .select("employee_id")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .limit(1)
    .maybeSingle();

  const userEmployeeId =
    identityMembership && Number.isInteger(Number(identityMembership.employee_id))
      ? Number(identityMembership.employee_id)
      : null;

  return {
    ok: true as const,
    supabase,
    admin,
    user,
    organisationId,
    roleKey,
    permissionKeys,
    userEmployeeId,
  };
}

async function resolveScopedEmployees(args: {
  admin: ReturnType<typeof createAdminClient>;
  organisationId: string;
  roleKey: RoleKey;
  userId: string;
  userEmployeeId: number | null;
}) {
  const { admin, organisationId, roleKey, userEmployeeId } = args;

  const { data: employeesResult } = await (admin as any)
    .from("employees")
    .select("id, name, email, status")
    .eq("organisation_id", organisationId)
    .neq("status", "Archived");

  const employees = (employeesResult ?? []) as Array<{
    id: number;
    name: string | null;
    email: string | null;
    status: string | null;
  }>;

  if (roleKey === "owner" || roleKey === "senior") {
    return {
      employeeIds: employees.map((employee) => employee.id),
      employees,
      scopedEmployeeMap: new Map(employees.map((employee) => [employee.id, employee])),
    };
  }

  if (roleKey === "employee") {
    const employeeIds = userEmployeeId ? [userEmployeeId] : [];
    const scoped = employees.filter((employee) => employeeIds.includes(employee.id));
    return {
      employeeIds,
      employees,
      scopedEmployeeMap: new Map(scoped.map((employee) => [employee.id, employee])),
    };
  }

  const managerEmployee = userEmployeeId
    ? employees.find((employee) => employee.id === userEmployeeId)
    : null;

  if (!managerEmployee || !text(managerEmployee.name)) {
    return {
      employeeIds: [] as number[],
      employees,
      scopedEmployeeMap: new Map<number, (typeof employees)[number]>(),
    };
  }

  const managerName = text(managerEmployee.name).toLowerCase();

  const { data: employmentRows } = await (admin as any)
    .from("employee_employment_details")
    .select("employee_id, manager");

  const managedEmployeeIds = new Set<number>();

  for (const row of employmentRows ?? []) {
    if (!Number.isInteger(Number(row.employee_id))) continue;
    const assignedManager = text(row.manager).toLowerCase();
    if (assignedManager && assignedManager === managerName) {
      managedEmployeeIds.add(Number(row.employee_id));
    }
  }

  const employeeIds = Array.from(managedEmployeeIds);
  const scoped = employees.filter((employee) => employeeIds.includes(employee.id));

  return {
    employeeIds,
    employees,
    scopedEmployeeMap: new Map(scoped.map((employee) => [employee.id, employee])),
  };
}

function canUseCompliance(roleKey: RoleKey, permissionKeys: Set<string>) {
  return roleKey === "owner" || permissionKeys.has("compliance.view");
}

function canUseSar(roleKey: RoleKey, permissionKeys: Set<string>) {
  return roleKey === "owner" || permissionKeys.has("sar_requests.view");
}

function canUseLearn(roleKey: RoleKey, permissionKeys: Set<string>) {
  if (roleKey === "owner") return true;
  return permissionKeys.has("employees.view") || roleKey === "employee";
}

async function buildComplianceCandidates(args: {
  admin: ReturnType<typeof createAdminClient>;
  employeeIds: number[];
  scopedEmployees: Map<number, { id: number; name: string | null }>;
}) {
  const { admin, employeeIds, scopedEmployees } = args;
  if (employeeIds.length === 0) return [] as ReminderCandidate[];

  const [rtwResult, dbsResult, drivingResult, trainingResult] = await Promise.all([
    (admin as any)
      .from("employee_right_to_work")
      .select("employee_id,right_to_work_expiry,next_review_date,created_at")
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),

    (admin as any)
      .from("employee_dbs_checks")
      .select(
        "employee_id,dbs_required,next_check_due,safeguarding_training_expiry,update_service,update_service_next_check_due,created_at",
      )
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),

    (admin as any)
      .from("employee_driving_checks")
      .select(
        "employee_id,drives_for_work,licence_expiry_date,next_dvla_check_due,business_insurance_expiry_date,mot_required,mot_expiry_date,created_at",
      )
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),

    (admin as any)
      .from("employee_training_logs")
      .select("id,employee_id,training_name,refresh_or_expiry_date")
      .in("employee_id", employeeIds),
  ]);

  const latestByEmployee = <T extends { employee_id: number } & Record<string, unknown>>(
    rows: T[],
    createdAtField = "created_at",
  ) => {
    const map = new Map<number, T>();

    for (const row of rows) {
      const existing = map.get(row.employee_id);
      if (!existing) {
        map.set(row.employee_id, row);
        continue;
      }

      const existingTs = text(existing[createdAtField]).length
        ? new Date(String(existing[createdAtField])).getTime()
        : 0;

      const rowTs = text(row[createdAtField]).length
        ? new Date(String(row[createdAtField])).getTime()
        : 0;

      if (rowTs >= existingTs) {
        map.set(row.employee_id, row);
      }
    }

    return map;
  };

  const rtwByEmployee = latestByEmployee((rtwResult.data ?? []) as any[]);
  const dbsByEmployee = latestByEmployee((dbsResult.data ?? []) as any[]);
  const drivingByEmployee = latestByEmployee((drivingResult.data ?? []) as any[]);

  const candidates: ReminderCandidate[] = [];

  const pushCandidate = (input: {
    employeeId: number;
    sourceType: string;
    sourceId: string;
    dueDate: string;
    title: string;
    actionUrl: string;
  }) => {
    const milestone = standardMilestone(input.dueDate);
    if (!milestone) return;

    const employee = scopedEmployees.get(input.employeeId);
    const employeeName = employee?.name ?? null;
    const band = statusBand(input.dueDate);

    const message = employeeName
      ? `${input.title} for ${employeeName} is ${band === "expired" ? "expired" : band === "due" ? "due today" : "approaching expiry"}.`
      : `${input.title} is ${band === "expired" ? "expired" : band === "due" ? "due today" : "approaching expiry"}.`;

    candidates.push({
      module: "compliance",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      employeeId: input.employeeId,
      employeeName,
      dueDate: input.dueDate,
      milestone,
      title: input.title,
      message,
      actionUrl: input.actionUrl,
      statusBand: band,
      fingerprint: fingerprint([input.sourceType, input.sourceId, input.dueDate]),
    });
  };

  for (const employeeId of employeeIds) {
    const rtw = rtwByEmployee.get(employeeId) as any;
    const dbs = dbsByEmployee.get(employeeId) as any;
    const driving = drivingByEmployee.get(employeeId) as any;

    const rtwDue = text(rtw?.next_review_date || rtw?.right_to_work_expiry);
    if (rtwDue) {
      pushCandidate({
        employeeId,
        sourceType: "right_to_work",
        sourceId: String(employeeId),
        dueDate: rtwDue,
        title: "Right to Work review",
        actionUrl: `/dashboard/employees/${employeeId}?section=right_to_work`,
      });
    }

    if (String(dbs?.dbs_required).toLowerCase() === "yes") {
      const dbsDue = text(dbs?.next_check_due);
      if (dbsDue) {
        pushCandidate({
          employeeId,
          sourceType: "dbs_check",
          sourceId: String(employeeId),
          dueDate: dbsDue,
          title: "DBS re-check",
          actionUrl: `/dashboard/employees/${employeeId}?section=dbs`,
        });
      }

      const safeguardingDue = text(dbs?.safeguarding_training_expiry);
      if (safeguardingDue) {
        pushCandidate({
          employeeId,
          sourceType: "safeguarding_training",
          sourceId: String(employeeId),
          dueDate: safeguardingDue,
          title: "Safeguarding training expiry",
          actionUrl: `/dashboard/employees/${employeeId}?section=dbs`,
        });
      }

      if (String(dbs?.update_service).toLowerCase() === "yes") {
        const updateDue = text(dbs?.update_service_next_check_due);
        if (updateDue) {
          pushCandidate({
            employeeId,
            sourceType: "dbs_update_service",
            sourceId: String(employeeId),
            dueDate: updateDue,
            title: "DBS update service check",
            actionUrl: `/dashboard/employees/${employeeId}?section=dbs`,
          });
        }
      }
    }

    if (String(driving?.drives_for_work).toLowerCase() === "yes") {
      const licenceDue = text(driving?.licence_expiry_date);
      if (licenceDue) {
        pushCandidate({
          employeeId,
          sourceType: "driving_licence",
          sourceId: String(employeeId),
          dueDate: licenceDue,
          title: "Driving licence expiry",
          actionUrl: `/dashboard/employees/${employeeId}?section=driving`,
        });
      }

      const dvlaDue = text(driving?.next_dvla_check_due);
      if (dvlaDue) {
        pushCandidate({
          employeeId,
          sourceType: "dvla_check",
          sourceId: String(employeeId),
          dueDate: dvlaDue,
          title: "DVLA annual check",
          actionUrl: `/dashboard/employees/${employeeId}?section=driving`,
        });
      }

      const insuranceDue = text(driving?.business_insurance_expiry_date);
      if (insuranceDue) {
        pushCandidate({
          employeeId,
          sourceType: "business_insurance",
          sourceId: String(employeeId),
          dueDate: insuranceDue,
          title: "Business insurance expiry",
          actionUrl: `/dashboard/employees/${employeeId}?section=driving`,
        });
      }

      if (String(driving?.mot_required).toLowerCase() === "yes") {
        const motDue = text(driving?.mot_expiry_date);
        if (motDue) {
          pushCandidate({
            employeeId,
            sourceType: "mot_expiry",
            sourceId: String(employeeId),
            dueDate: motDue,
            title: "MOT expiry",
            actionUrl: `/dashboard/employees/${employeeId}?section=driving`,
          });
        }
      }
    }
  }

  for (const trainingRow of (trainingResult.data ?? []) as any[]) {
    const dueDate = text(trainingRow.refresh_or_expiry_date);
    if (!dueDate) continue;

    pushCandidate({
      employeeId: Number(trainingRow.employee_id),
      sourceType: "training_refresh",
      sourceId: String(trainingRow.id || `${trainingRow.employee_id}-${trainingRow.training_name}`),
      dueDate,
      title: `${text(trainingRow.training_name) || "Training"} refresh`,
      actionUrl: `/dashboard/employees/${trainingRow.employee_id}?section=learning`,
    });
  }

  return candidates;
}

async function buildSarCandidates(args: {
  admin: ReturnType<typeof createAdminClient>;
  employeeIds: number[];
  scopedEmployees: Map<number, { id: number; name: string | null }>;
}) {
  const { admin, employeeIds, scopedEmployees } = args;
  if (employeeIds.length === 0) return [] as ReminderCandidate[];

  const { data } = await (admin as any)
    .from("employee_sars")
    .select("id,employee_id,request_title,status,response_due_date,extended_due_date")
    .in("employee_id", employeeIds);

  const candidates: ReminderCandidate[] = [];

  for (const row of (data ?? []) as any[]) {
    if (isSarClosed(row.status)) continue;

    const dueDate = text(row.extended_due_date || row.response_due_date);
    if (!dueDate) continue;

    const milestone = sarMilestone(dueDate);
    if (!milestone) continue;

    const employeeId = Number(row.employee_id);
    const employeeName = scopedEmployees.get(employeeId)?.name ?? null;
    const band = statusBand(dueDate);

    candidates.push({
      module: "sar",
      sourceType: "sar_deadline",
      sourceId: String(row.id),
      employeeId,
      employeeName,
      dueDate,
      milestone,
      title: "SAR response deadline",
      message: employeeName
        ? `SAR deadline for ${employeeName} is ${band === "expired" ? "overdue" : band === "due" ? "due today" : "approaching"}.`
        : `A SAR deadline is ${band === "expired" ? "overdue" : band === "due" ? "due today" : "approaching"}.`,
      actionUrl: `/dashboard/sar-requests/${row.id}`,
      statusBand: band,
      fingerprint: fingerprint([
        "sar",
        row.id,
        dueDate,
        text(row.status),
        text(row.request_title),
      ]),
    });
  }

  return candidates;
}

async function buildLearnCandidates(args: {
  admin: ReturnType<typeof createAdminClient>;
  employeeIds: number[];
  scopedEmployees: Map<number, { id: number; name: string | null }>;
}) {
  const { admin, employeeIds, scopedEmployees } = args;
  if (employeeIds.length === 0) return [] as ReminderCandidate[];

  const [assignmentsResult, qualificationsResult] = await Promise.all([
    (admin as any)
      .from("learning_assignments")
      .select("id,employee_id,due_date,status,learning_module_id")
      .in("employee_id", employeeIds)
      .eq("is_archived", false),

    (admin as any)
      .from("employee_qualifications")
      .select("id,employee_id,title,expiry_date,status,renewal_required")
      .in("employee_id", employeeIds)
      .eq("is_archived", false),
  ]);

  const candidates: ReminderCandidate[] = [];

  for (const row of (assignmentsResult.data ?? []) as any[]) {
    const status = text(row.status).toLowerCase();
    if (status === "completed" || status === "cancelled" || status === "removed") {
      continue;
    }

    const dueDate = text(row.due_date);
    if (!dueDate) continue;

    const milestone = standardMilestone(dueDate);
    if (!milestone) continue;

    const employeeId = Number(row.employee_id);
    const employeeName = scopedEmployees.get(employeeId)?.name ?? null;
    const band = statusBand(dueDate);

    candidates.push({
      module: "learn",
      sourceType: "learning_assignment",
      sourceId: String(row.id),
      employeeId,
      employeeName,
      dueDate,
      milestone,
      title: "Learning assignment due",
      message: employeeName
        ? `A learning assignment for ${employeeName} is ${band === "expired" ? "overdue" : band === "due" ? "due today" : "approaching due date"}.`
        : `A learning assignment is ${band === "expired" ? "overdue" : band === "due" ? "due today" : "approaching due date"}.`,
      actionUrl: employeeId
        ? `/dashboard/employees/${employeeId}?section=learning`
        : "/dashboard/leo-learn",
      statusBand: band,
      fingerprint: fingerprint(["assignment", row.id, dueDate, text(row.status)]),
    });
  }

  for (const row of (qualificationsResult.data ?? []) as any[]) {
    const dueDate = text(row.expiry_date);
    if (!dueDate) continue;

    const milestone = standardMilestone(dueDate);
    if (!milestone) continue;

    const employeeId = Number(row.employee_id);
    const employeeName = scopedEmployees.get(employeeId)?.name ?? null;
    const band = statusBand(dueDate);

    candidates.push({
      module: "learn",
      sourceType: "qualification_expiry",
      sourceId: String(row.id),
      employeeId,
      employeeName,
      dueDate,
      milestone,
      title: "Qualification expiry",
      message: employeeName
        ? `A qualification for ${employeeName} is ${band === "expired" ? "expired" : band === "due" ? "expiring today" : "approaching expiry"}.`
        : `A qualification is ${band === "expired" ? "expired" : band === "due" ? "expiring today" : "approaching expiry"}.`,
      actionUrl: employeeId
        ? `/dashboard/employees/${employeeId}?section=learning`
        : "/dashboard/leo-learn",
      statusBand: band,
      fingerprint: fingerprint(["qualification", row.id, dueDate, text(row.status)]),
    });
  }

  return candidates;
}

async function writeAuditEvent(args: {
  admin: ReturnType<typeof createAdminClient>;
  organisationId: string;
  userId: string;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
}) {
  const { admin, organisationId, userId, action, description, metadata } = args;

  await (admin as any).from("audit_logs").insert({
    organisation_id: organisationId,
    user_id: userId,
    action,
    action_category: "Reminders",
    entity_type: "Reminder",
    entity_name: "Phase 1 Reminder",
    description,
    metadata,
    source_page: "/dashboard",
    ip_address: null,
  });
}

async function generateAndPersist(args: {
  admin: ReturnType<typeof createAdminClient>;
  organisationId: string;
  userId: string;
  roleKey: RoleKey;
  permissionKeys: Set<string>;
  userEmployeeId: number | null;
}) {
  const { admin, organisationId, userId, roleKey, permissionKeys, userEmployeeId } = args;

  const { employeeIds, scopedEmployeeMap } = await resolveScopedEmployees({
    admin,
    organisationId,
    roleKey,
    userId,
    userEmployeeId,
  });

  const candidates: ReminderCandidate[] = [];

  if (canUseCompliance(roleKey, permissionKeys)) {
    candidates.push(
      ...(await buildComplianceCandidates({
        admin,
        employeeIds,
        scopedEmployees: scopedEmployeeMap as any,
      })),
    );
  }

  if ((roleKey === "owner" || roleKey === "senior" || roleKey === "manager") && canUseSar(roleKey, permissionKeys)) {
    candidates.push(
      ...(await buildSarCandidates({
        admin,
        employeeIds,
        scopedEmployees: scopedEmployeeMap as any,
      })),
    );
  }

  if (canUseLearn(roleKey, permissionKeys)) {
    candidates.push(
      ...(await buildLearnCandidates({
        admin,
        employeeIds,
        scopedEmployees: scopedEmployeeMap as any,
      })),
    );
  }

  if (roleKey === "employee") {
    for (let index = candidates.length - 1; index >= 0; index -= 1) {
      if (candidates[index].employeeId !== userEmployeeId) {
        candidates.splice(index, 1);
      }
    }
  }

  const candidatesWithKeys = candidates.map((candidate) => ({
    key: notificationKey(userId, candidate),
    candidate,
  }));

  const activeKeys = new Set(candidatesWithKeys.map((entry) => entry.key));

  const existingPhaseResult = await (admin as any)
    .from("organisation_notifications")
    .select("id, notification_key, is_dismissed, metadata")
    .eq("organisation_id", organisationId)
    .eq("notification_type", "reminder")
    .like("notification_key", "phase1-reminder:%")
    .contains("metadata", { recipient_user_id: userId });

  const staleIds: string[] = [];

  for (const row of existingPhaseResult.data ?? []) {
    const rowKey = text((row as any).notification_key);
    const rowDismissed = Boolean((row as any).is_dismissed);

    if (!rowKey || activeKeys.has(rowKey) || rowDismissed) {
      continue;
    }

    staleIds.push(String((row as any).id));
  }

  if (staleIds.length > 0) {
    const nowIso = new Date().toISOString();

    const staleUpdate = await (admin as any)
      .from("organisation_notifications")
      .update({
        is_dismissed: true,
        dismissed_at: nowIso,
        dismissed_by: userId,
      })
      .in("id", staleIds)
      .eq("organisation_id", organisationId);

    if (!staleUpdate.error) {
      for (const staleId of staleIds) {
        await writeAuditEvent({
          admin,
          organisationId,
          userId,
          action: "reminder_state_recalculated",
          description: "A stale reminder was cleared after source data changed.",
          metadata: {
            reminder_id: staleId,
            reason: "source_record_updated_or_resolved",
          },
        });
      }
    }
  }

  const existingResult = await (admin as any)
    .from("organisation_notifications")
    .select("id, notification_key")
    .eq("organisation_id", organisationId)
    .in("notification_key", candidatesWithKeys.map((entry) => entry.key));

  const existingKeys = new Set<string>(
    (existingResult.data ?? []).map((row: { notification_key: string }) => row.notification_key),
  );

  const rowsToInsert = candidatesWithKeys
    .filter((entry) => !existingKeys.has(entry.key))
    .map((entry) => ({
      organisation_id: organisationId,
      notification_key: entry.key,
      notification_type: "reminder",
      event_version: "phase1",
      title: entry.candidate.title,
      message: entry.candidate.message,
      action_url: entry.candidate.actionUrl,
      action_label: "Open",
      metadata: {
        recipient_user_id: userId,
        phase: "phase1",
        module: entry.candidate.module,
        milestone: entry.candidate.milestone,
        due_date: entry.candidate.dueDate,
        source_type: entry.candidate.sourceType,
        source_id: entry.candidate.sourceId,
        source_fingerprint: entry.candidate.fingerprint,
        employee_id: entry.candidate.employeeId,
        status_band: entry.candidate.statusBand,
      },
      is_read: false,
      is_dismissed: false,
    }));

  if (rowsToInsert.length > 0) {
    const insertResult = await (admin as any)
      .from("organisation_notifications")
      .insert(rowsToInsert)
      .select("id, title, metadata");

    if (!insertResult.error) {
      for (const row of insertResult.data ?? []) {
        await writeAuditEvent({
          admin,
          organisationId,
          userId,
          action: "reminder_milestone_emitted",
          description: "A milestone reminder was emitted in-app.",
          metadata: {
            reminder_id: row.id,
            reminder_title: row.title,
            ...(row.metadata && typeof row.metadata === "object" ? row.metadata : {}),
          },
        });
      }
    }
  }
}

function parseMetadata(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseSnoozeDate(metadata: Record<string, unknown>) {
  const value = metadata.snoozed_until;
  if (typeof value !== "string") return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getReminders(args?: { module?: string; limit?: number }) {
  const context = await resolveUserContext();

  if (!context.ok) {
    return context;
  }

  const { admin, organisationId, roleKey, permissionKeys, userEmployeeId, user } = context;

  await generateAndPersist({
    admin,
    organisationId,
    userId: user.id,
    roleKey,
    permissionKeys,
    userEmployeeId,
  });

  const notificationsResult = await (admin as any)
    .from("organisation_notifications")
    .select("id,title,message,action_url,created_at,is_read,is_dismissed,metadata")
    .eq("organisation_id", organisationId)
    .eq("notification_type", "reminder")
    .eq("is_dismissed", false)
    .contains("metadata", { recipient_user_id: user.id })
    .order("created_at", { ascending: false })
    .limit(args?.limit && args.limit > 0 ? args.limit : 50);

  if (notificationsResult.error) {
    return {
      ok: false as const,
      error: "Reminders could not be loaded.",
      status: 500,
    };
  }

  const now = Date.now();
  const moduleFilter = text(args?.module).toLowerCase();

  const reminders = ((notificationsResult.data ?? []) as ReminderNotification[])
    .filter((row) => {
      const metadata = parseMetadata(row.metadata);
      const snoozedUntil = parseSnoozeDate(metadata);

      if (snoozedUntil !== null && snoozedUntil > now) {
        return false;
      }

      if (moduleFilter) {
        const reminderModule = text(metadata.module).toLowerCase();
        if (reminderModule !== moduleFilter) {
          return false;
        }
      }

      return true;
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      actionUrl: row.action_url,
      createdAt: row.created_at,
      isRead: row.is_read,
      metadata: parseMetadata(row.metadata),
    }));

  return {
    ok: true as const,
    organisationId,
    roleKey,
    reminders,
  };
}

export async function mutateReminder(args: {
  reminderId: string;
  action: ReminderAction;
  snoozeUntil?: string | null;
}) {
  const context = await resolveUserContext();

  if (!context.ok) {
    return context;
  }

  const { admin, organisationId, user } = context;

  const reminderResult = await (admin as any)
    .from("organisation_notifications")
    .select("id, organisation_id, metadata, is_dismissed")
    .eq("id", args.reminderId)
    .eq("organisation_id", organisationId)
    .eq("notification_type", "reminder")
    .maybeSingle();

  if (reminderResult.error || !reminderResult.data) {
    return {
      ok: false as const,
      status: 404,
      error: "Reminder not found.",
    };
  }

  const metadata = parseMetadata(reminderResult.data.metadata);
  const recipientUserId = text(metadata.recipient_user_id);

  if (!recipientUserId || recipientUserId !== user.id) {
    return {
      ok: false as const,
      status: 403,
      error: "You do not have access to this reminder.",
    };
  }

  const nowIso = new Date().toISOString();

  if (args.action === "dismiss") {
    const { error } = await (admin as any)
      .from("organisation_notifications")
      .update({
        is_dismissed: true,
        dismissed_at: nowIso,
        dismissed_by: user.id,
      })
      .eq("id", args.reminderId)
      .eq("organisation_id", organisationId);

    if (error) {
      return {
        ok: false as const,
        status: 500,
        error: "The reminder could not be dismissed.",
      };
    }

    await writeAuditEvent({
      admin,
      organisationId,
      userId: user.id,
      action: "reminder_dismissed",
      description: "A reminder was dismissed.",
      metadata: {
        reminder_id: args.reminderId,
        reminder_key: metadata.notification_key ?? null,
      },
    });

    return {
      ok: true as const,
    };
  }

  if (args.action === "read") {
    const { error } = await (admin as any)
      .from("organisation_notifications")
      .update({
        is_read: true,
        read_at: nowIso,
      })
      .eq("id", args.reminderId)
      .eq("organisation_id", organisationId);

    if (error) {
      return {
        ok: false as const,
        status: 500,
        error: "The reminder could not be acknowledged.",
      };
    }

    await writeAuditEvent({
      admin,
      organisationId,
      userId: user.id,
      action: "reminder_acknowledged",
      description: "A reminder was acknowledged.",
      metadata: {
        reminder_id: args.reminderId,
      },
    });

    return {
      ok: true as const,
    };
  }

  if (args.action === "snooze") {
    const snoozeUntil = text(args.snoozeUntil);
    const parsed = snoozeUntil ? new Date(snoozeUntil) : null;

    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      return {
        ok: false as const,
        status: 400,
        error: "A valid future snooze date is required.",
      };
    }

    const nextMetadata = {
      ...metadata,
      snoozed_until: parsed.toISOString(),
      snoozed_by: user.id,
      snoozed_at: nowIso,
    };

    const { error } = await (admin as any)
      .from("organisation_notifications")
      .update({ metadata: nextMetadata })
      .eq("id", args.reminderId)
      .eq("organisation_id", organisationId);

    if (error) {
      return {
        ok: false as const,
        status: 500,
        error: "The reminder could not be snoozed.",
      };
    }

    await writeAuditEvent({
      admin,
      organisationId,
      userId: user.id,
      action: "reminder_snoozed",
      description: "A reminder was snoozed.",
      metadata: {
        reminder_id: args.reminderId,
        snoozed_until: parsed.toISOString(),
      },
    });

    return {
      ok: true as const,
    };
  }

  return {
    ok: false as const,
    status: 400,
    error: "Unsupported reminder action.",
  };
}
