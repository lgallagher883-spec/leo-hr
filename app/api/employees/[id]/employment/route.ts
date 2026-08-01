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

type EmploymentUpdateBody = {
  name?: unknown;
  email?: unknown;
  role?: unknown;
  status?: unknown;
  start_date?: unknown;
  manager?: unknown;
  probation_end_date?: unknown;
  employment_end_date?: unknown;
  reason_for_leaving?: unknown;
  annual_leave_allowance?: unknown;
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

function normaliseEmployeeStatus(value: unknown): string {
  const status = readOptionalString(value);

  if (!status || status === "Active") return "Active";
  if (status === "Former" || status === "Former Employee") {
    return "Former Employee";
  }
  if (status === "Archived") return "Archived";

  throw new Error("The selected employee status is invalid.");
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
    .select("id,name,email,role,status,start_date")
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

    const detailsResult = await admin
      .from("employee_employment_details")
      .select(
        "id,employee_id,manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance,created_at,updated_at",
      )
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (detailsResult.error) {
      throw new Error(detailsResult.error.message);
    }

    return NextResponse.json(
      {
        success: true,
        employee,
        employmentDetails: detailsResult.data ?? {
          employee_id: employeeId,
          manager: null,
          probation_end_date: null,
          employment_end_date: null,
          reason_for_leaving: null,
          annual_leave_allowance: null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Employment details API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Employment details could not be loaded.",
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

    const body = (await request.json().catch(() => ({}))) as {
      updates?: EmploymentUpdateBody;
    };

    const updates = body.updates ?? {};
    const name = readOptionalString(updates.name);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee name is required.",
        },
        { status: 400 },
      );
    }

    const status = normaliseEmployeeStatus(updates.status);
    const now = new Date().toISOString();
    const admin = getAdminClient();
    const currentEmployee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!currentEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const employeeResult = await admin
      .from("employees")
      .update({
        name,
        email: readOptionalString(updates.email),
        role: readOptionalString(updates.role),
        status,
        start_date: readOptionalString(updates.start_date),
        updated_at: now,
      })
      .eq("id", employeeId)
      .eq("organisation_id", accessResult.access.organisationId)
      .select("id,name,email,role,status,start_date")
      .single();

    if (employeeResult.error || !employeeResult.data) {
      throw new Error(
        employeeResult.error?.message ||
          "The employee record could not be updated.",
      );
    }

    const employmentPayload = {
      employee_id: employeeId,
      manager: readOptionalString(updates.manager),
      probation_end_date: readOptionalString(
        updates.probation_end_date,
      ),
      employment_end_date: readOptionalString(
        updates.employment_end_date,
      ),
      reason_for_leaving: readOptionalString(
        updates.reason_for_leaving,
      ),
      annual_leave_allowance: readOptionalString(
        updates.annual_leave_allowance,
      ),
      updated_at: now,
    };

    const existingDetails = await admin
      .from("employee_employment_details")
      .select("id")
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (existingDetails.error) {
      throw new Error(existingDetails.error.message);
    }

    const detailsResult = existingDetails.data
      ? await admin
          .from("employee_employment_details")
          .update(employmentPayload)
          .eq("id", existingDetails.data.id)
          .select(
            "id,employee_id,manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance,created_at,updated_at",
          )
          .single()
      : await admin
          .from("employee_employment_details")
          .insert(employmentPayload)
          .select(
            "id,employee_id,manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance,created_at,updated_at",
          )
          .single();

    if (detailsResult.error || !detailsResult.data) {
      throw new Error(
        detailsResult.error?.message ||
          "The employment details could not be saved.",
      );
    }

    const fullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : user.email || "System user";

    const auditResult = await admin.from("audit_logs").insert({
      organisation_id: accessResult.access.organisationId,
      user_id: user.id,
      user_name: fullName,
      user_email: user.email || null,
      action: "Employment details updated",
      action_category: "Employee",
      entity_type: "Employee",
      entity_id: String(employeeId),
      entity_name: employeeResult.data.name,
      description: `${employeeResult.data.name}'s employment details were updated.`,
      previous_values: {
        name: currentEmployee.name,
        email: currentEmployee.email,
        role: currentEmployee.role,
        status: currentEmployee.status,
        start_date: currentEmployee.start_date,
      },
      new_values: {
        name: employeeResult.data.name,
        email: employeeResult.data.email,
        role: employeeResult.data.role,
        status: employeeResult.data.status,
        start_date: employeeResult.data.start_date,
        manager: detailsResult.data.manager,
        probation_end_date: detailsResult.data.probation_end_date,
        employment_end_date: detailsResult.data.employment_end_date,
        reason_for_leaving: detailsResult.data.reason_for_leaving,
        annual_leave_allowance:
          detailsResult.data.annual_leave_allowance,
      },
      metadata: {
        source_module: "Employees",
        employee_section: "Employment Details",
      },
      source_page: `/dashboard/employees/${employeeId}`,
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
        "Employment details audit event could not be written:",
        auditResult.error,
      );
    }

    const timelineResult = await admin
      .from("employee_timeline")
      .insert({
        organisation_id: accessResult.access.organisationId,
        employee_id: employeeId,
        event_type: "Employment Details Updated",
        title: "Employment details updated",
        description:
          "The employee's core employment details were updated.",
        status: employeeResult.data.status,
        source_module: "Employees",
        source_record_id: String(employeeId),
        metadata: {
          manager: detailsResult.data.manager,
          role: employeeResult.data.role,
          start_date: employeeResult.data.start_date,
        },
        event_date: now,
        created_by: user.id,
        created_at: now,
      });

    if (timelineResult.error) {
      console.warn(
        "Employment details timeline event could not be written:",
        timelineResult.error,
      );
    }

    return NextResponse.json({
      success: true,
      employee: employeeResult.data,
      employmentDetails: detailsResult.data,
    });
  } catch (error) {
    console.error("Employment details update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Employment details could not be saved.",
      },
      { status: 500 },
    );
  }
}