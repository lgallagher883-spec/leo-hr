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

type TrainingBody = {
  action?: unknown;
  recordId?: unknown;
  trainingName?: unknown;
  dateCompleted?: unknown;
  refreshOrExpiryDate?: unknown;
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

    const recordsResult = await admin
      .from("employee_training_logs")
      .select(
        "id,training_name,date_completed,refresh_or_expiry_date,notes,created_at,updated_at",
      )
      .eq("employee_id", employeeId)
      .order("date_completed", { ascending: false })
      .order("created_at", { ascending: false });

    if (recordsResult.error) {
      throw new Error(recordsResult.error.message);
    }

    return NextResponse.json(
      {
        success: true,
        records: recordsResult.data ?? [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Employee training API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Training logs could not be loaded.",
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

    const body = (await request.json().catch(() => ({}))) as TrainingBody;
    const trainingName = readOptionalString(body.trainingName);

    if (!trainingName) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter the training name.",
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
      .from("employee_training_logs")
      .insert({
        employee_id: employeeId,
        training_name: trainingName,
        date_completed: readOptionalString(body.dateCompleted),
        refresh_or_expiry_date: readOptionalString(
          body.refreshOrExpiryDate,
        ),
        notes: readOptionalString(body.notes),
        updated_at: now,
      })
      .select(
        "id,training_name,date_completed,refresh_or_expiry_date,notes,created_at,updated_at",
      )
      .single();

    if (result.error || !result.data) {
      throw new Error(
        result.error?.message || "The training log could not be saved.",
      );
    }

    await writeTrainingEvents({
      admin,
      request,
      user,
      organisationId: accessResult.access.organisationId,
      employee,
      record: result.data,
      action: "created",
    });

    return NextResponse.json(
      {
        success: true,
        record: result.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Employee training creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The training log could not be saved.",
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

    const body = (await request.json().catch(() => ({}))) as TrainingBody;
    const recordId = readPositiveInteger(body.recordId);
    const trainingName = readOptionalString(body.trainingName);

    if (!recordId) {
      return NextResponse.json(
        {
          success: false,
          error: "The training record reference is not valid.",
        },
        { status: 400 },
      );
    }

    if (!trainingName) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter the training name.",
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

    const existingRecord = await admin
      .from("employee_training_logs")
      .select("id,employee_id")
      .eq("id", recordId)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (existingRecord.error) {
      throw new Error(existingRecord.error.message);
    }

    if (!existingRecord.data) {
      return NextResponse.json(
        {
          success: false,
          error: "The training record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const result = await admin
      .from("employee_training_logs")
      .update({
        training_name: trainingName,
        date_completed: readOptionalString(body.dateCompleted),
        refresh_or_expiry_date: readOptionalString(
          body.refreshOrExpiryDate,
        ),
        notes: readOptionalString(body.notes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId)
      .eq("employee_id", employeeId)
      .select(
        "id,training_name,date_completed,refresh_or_expiry_date,notes,created_at,updated_at",
      )
      .single();

    if (result.error || !result.data) {
      throw new Error(
        result.error?.message ||
          "The training log could not be updated.",
      );
    }

    await writeTrainingEvents({
      admin,
      request,
      user,
      organisationId: accessResult.access.organisationId,
      employee,
      record: result.data,
      action: "updated",
    });

    return NextResponse.json({
      success: true,
      record: result.data,
    });
  } catch (error) {
    console.error("Employee training update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The training log could not be updated.",
      },
      { status: 500 },
    );
  }
}

async function writeTrainingEvents({
  admin,
  request,
  user,
  organisationId,
  employee,
  record,
  action,
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
  record: {
    id: number;
    training_name: string;
    date_completed: string | null;
    refresh_or_expiry_date: string | null;
    notes: string | null;
  };
  action: "created" | "updated";
}) {
  const now = new Date().toISOString();
  const userName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email || "System user";

  const actionTitle =
    action === "created"
      ? "Training log added"
      : "Training log updated";

  const auditResult = await admin.from("audit_logs").insert({
    organisation_id: organisationId,
    user_id: user.id,
    user_name: userName,
    user_email: user.email || null,
    action: actionTitle,
    action_category: "Learning",
    entity_type: "Employee",
    entity_id: String(employee.id),
    entity_name: employee.name,
    description: `${record.training_name} was ${
      action === "created" ? "added to" : "updated on"
    } ${employee.name}'s training record.`,
    new_values: {
      training_record_id: record.id,
      training_name: record.training_name,
      date_completed: record.date_completed,
      refresh_or_expiry_date: record.refresh_or_expiry_date,
      notes: record.notes,
    },
    metadata: {
      source_module: "Employees",
      employee_section: "Training Logs",
      action,
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
      "Training audit event could not be written:",
      auditResult.error,
    );
  }

  const timelineResult = await admin
    .from("employee_timeline")
    .insert({
      organisation_id: organisationId,
      employee_id: employee.id,
      event_type: "Training",
      title: actionTitle,
      description: `${record.training_name} was ${
        action === "created" ? "added" : "updated"
      } on the employee training record.`,
      status: "Completed",
      source_module: "Employees",
      source_record_id: String(record.id),
      metadata: {
        training_name: record.training_name,
        date_completed: record.date_completed,
        refresh_or_expiry_date: record.refresh_or_expiry_date,
      },
      event_date: now,
      created_by: user.id,
      created_at: now,
    });

  if (timelineResult.error) {
    console.warn(
      "Training timeline event could not be written:",
      timelineResult.error,
    );
  }
}