import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AccessContext = {
  organisationId: string;
  role: string;
  permissionKeys: Set<string>;
};

type LeaveBody = {
  action?: unknown;
  recordId?: unknown;
  leaveType?: unknown;
  status?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  daysTaken?: unknown;
  notes?: unknown;
};

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function readEmployeeId(
  context: RouteContext,
): Promise<number | null> {
  const { id } = await context.params;
  const employeeId = Number(id);

  return Number.isInteger(employeeId) && employeeId > 0
    ? employeeId
    : null;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function readPositiveInteger(value: unknown): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseRole(value: string): "Owner" | "Senior" | "Manager" | "Employee" {
  const role = value.trim().toLowerCase();

  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";

  return "Employee";
}

async function requireAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requiredPermissions: string[],
): Promise<
  | { ok: true; access: AccessContext }
  | { ok: false; response: NextResponse }
> {
  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select(
      "id,role,membership_status,access_starts_at,access_ends_at",
    )
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have active access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  const now = Date.now();
  const accessStartsAt = membership.access_starts_at
    ? new Date(membership.access_starts_at).getTime()
    : null;
  const accessEndsAt = membership.access_ends_at
    ? new Date(membership.access_ends_at).getTime()
    : null;

  if (
    (accessStartsAt !== null &&
      Number.isFinite(accessStartsAt) &&
      accessStartsAt > now) ||
    (accessEndsAt !== null &&
      Number.isFinite(accessEndsAt) &&
      accessEndsAt <= now)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your organisation access is not currently active.",
        },
        { status: 403 },
      ),
    };
  }

  const resolvedRole = await resolveRoleForMembership(supabase as any, {
    membershipId: membership.id,
    fallbackRole: membership.role,
  });

  const role = resolvedRole.roleKey;
  const permissionKeys = new Set<string>();

  if (role !== "owner") {
    const { data: permissions, error: permissionsError } =
      await supabase.rpc("leo_effective_permissions", {
        target_organisation_id: organisationId,
      });

    if (permissionsError) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Your employee permissions could not be verified.",
          },
          { status: 403 },
        ),
      };
    }

    for (const permission of permissions ?? []) {
      if (
        permission &&
        typeof permission.permission_key === "string"
      ) {
        permissionKeys.add(permission.permission_key);
      }
    }

    const missingPermission = requiredPermissions.find(
      (permission) => !permissionKeys.has(permission),
    );

    if (missingPermission) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error:
              "You do not have permission to perform this employee action.",
          },
          { status: 403 },
        ),
      };
    }
  }

  return {
    ok: true,
    access: {
      organisationId,
      role,
      permissionKeys,
    },
  };
}

async function verifyEmployee(
  admin: ReturnType<typeof getAdminClient>,
  organisationId: string,
  employeeId: number,
) {
  const result = await admin
    .from("employees")
    .select("id,name")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const employeeId = await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee reference is not valid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.view"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const admin = getAdminClient();
    const employee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const [recordsResult, allowanceResult] = await Promise.all([
      admin
        .from("employee_leave_records")
        .select("*")
        .eq("employee_id", employeeId)
        .order("start_date", { ascending: false }),
      admin
        .from("employee_employment_details")
        .select("annual_leave_allowance")
        .eq("employee_id", employeeId)
        .maybeSingle(),
    ]);

    if (recordsResult.error) {
      throw new Error(recordsResult.error.message);
    }

    if (allowanceResult.error) {
      throw new Error(allowanceResult.error.message);
    }

    return NextResponse.json(
      {
        success: true,
        currentUserId: user.id,
        platformRole: normaliseRole(accessResult.access.role),
        annualLeaveAllowance:
          allowanceResult.data?.annual_leave_allowance ?? null,
        records: recordsResult.data ?? [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Leave and absence API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leave and absence records could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const employeeId = await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee reference is not valid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.manage"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as LeaveBody;
    const leaveType = readOptionalString(body.leaveType);
    const status = readOptionalString(body.status) || "Submitted";
    const startDate = readOptionalString(body.startDate);

    if (!leaveType || !startDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Leave type and start date are required.",
        },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const employee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    const result = await admin
      .from("employee_leave_records")
      .insert({
        employee_id: employeeId,
        leave_type: leaveType,
        status,
        start_date: startDate,
        end_date: readOptionalString(body.endDate) || startDate,
        days_taken: readNumber(body.daysTaken),
        notes: readOptionalString(body.notes),
        updated_at: now,
      })
      .select("*")
      .single();

    if (result.error || !result.data) {
      throw new Error(
        result.error?.message ||
          "The leave request could not be created.",
      );
    }

    await writeLeaveEvents({
      admin,
      request,
      user,
      organisationId: accessResult.access.organisationId,
      employee,
      record: result.data,
      actionTitle:
        status === "Approved"
          ? "Leave recorded"
          : "Leave request submitted",
      description: `${leaveType} was added for ${employee.name}.`,
    });

    return NextResponse.json(
      {
        success: true,
        record: result.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Leave request creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The leave request could not be created.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const employeeId = await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee reference is not valid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.manage"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as LeaveBody;
    const action = readOptionalString(body.action);
    const recordId = readPositiveInteger(body.recordId);

    if (!action || !recordId) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid leave action and record reference are required.",
        },
        { status: 400 },
      );
    }

    const allowedActions = new Set([
      "update",
      "approve",
      "decline",
      "return",
      "cancel",
      "complete",
    ]);

    if (!allowedActions.has(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "The requested leave action is not supported.",
        },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const employee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const existing = await admin
      .from("employee_leave_records")
      .select("*")
      .eq("id", recordId)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (!existing.data) {
      return NextResponse.json(
        {
          success: false,
          error: "The leave record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();
    let updatePayload: Record<string, unknown>;
    let actionTitle: string;

    if (action === "update") {
      updatePayload = {
        leave_type:
          readOptionalString(body.leaveType) ||
          existing.data.leave_type,
        status:
          readOptionalString(body.status) ||
          existing.data.status,
        start_date:
          readOptionalString(body.startDate) ||
          existing.data.start_date,
        end_date:
          readOptionalString(body.endDate) ||
          readOptionalString(body.startDate) ||
          existing.data.end_date,
        days_taken:
          readNumber(body.daysTaken) ??
          existing.data.days_taken,
        notes:
          readOptionalString(body.notes),
        updated_at: now,
      };
      actionTitle = "Leave record updated";
    } else {
      const statusByAction: Record<string, string> = {
        approve: "Approved",
        decline: "Declined",
        return: "Returned",
        cancel: "Cancelled",
        complete: "Completed",
      };

      updatePayload = {
        status: statusByAction[action],
        notes:
          readOptionalString(body.notes) ??
          existing.data.notes,
        updated_at: now,
      };

      actionTitle =
        action === "approve"
          ? "Leave request approved"
          : action === "decline"
            ? "Leave request declined"
            : action === "return"
              ? "Leave request returned"
              : action === "cancel"
                ? "Leave record cancelled"
                : "Leave completed";
    }

    const result = await admin
      .from("employee_leave_records")
      .update(updatePayload)
      .eq("id", recordId)
      .eq("employee_id", employeeId)
      .select("*")
      .single();

    if (result.error || !result.data) {
      throw new Error(
        result.error?.message ||
          "The leave record could not be updated.",
      );
    }

    await writeLeaveEvents({
      admin,
      request,
      user,
      organisationId: accessResult.access.organisationId,
      employee,
      record: result.data,
      actionTitle,
      description: `${result.data.leave_type} was updated for ${employee.name}.`,
    });

    return NextResponse.json({
      success: true,
      record: result.data,
    });
  } catch (error) {
    console.error("Leave record update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The leave record could not be updated.",
      },
      { status: 500 },
    );
  }
}

async function writeLeaveEvents({
  admin,
  request,
  user,
  organisationId,
  employee,
  record,
  actionTitle,
  description,
}: {
  admin: ReturnType<typeof getAdminClient>;
  request: NextRequest;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  organisationId: string;
  employee: {
    id: number;
    name: string;
  };
  record: Record<string, any>;
  actionTitle: string;
  description: string;
}) {
  const now = new Date().toISOString();
  const userName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email || "System user";

  const auditResult = await admin.from("audit_logs").insert({
    organisation_id: organisationId,
    user_id: user.id,
    user_name: userName,
    user_email: user.email || null,
    action: actionTitle,
    action_category: "Employee",
    entity_type: "Employee",
    entity_id: String(employee.id),
    entity_name: employee.name,
    description,
    new_values: {
      leave_record_id: record.id,
      leave_type: record.leave_type,
      status: record.status,
      start_date: record.start_date,
      end_date: record.end_date,
      days_taken: record.days_taken,
    },
    metadata: {
      source_module: "Leave & Absence",
    },
    source_page: `/dashboard/employees/${employee.id}`,
    ip_address:
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() || null,
    user_agent: request.headers.get("user-agent"),
    created_at: now,
  });

  if (auditResult.error) {
    console.warn(
      "Leave audit event could not be written:",
      auditResult.error,
    );
  }

  const timelineResult = await admin
    .from("employee_timeline")
    .insert({
      organisation_id: organisationId,
      employee_id: employee.id,
      event_type: "Leave & Absence",
      title: actionTitle,
      description,
      status: record.status,
      source_module: "Leave & Absence",
      source_record_id: String(record.id),
      metadata: {
        leave_type: record.leave_type,
        start_date: record.start_date,
        end_date: record.end_date,
        days_taken: record.days_taken,
      },
      event_date: now,
      created_by: user.id,
      created_at: now,
    });

  if (timelineResult.error) {
    console.warn(
      "Leave timeline event could not be written:",
      timelineResult.error,
    );
  }
}