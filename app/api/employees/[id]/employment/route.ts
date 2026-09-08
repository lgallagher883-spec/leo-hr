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
  contracted_hours_per_week?: unknown;
  contracted_days_per_week?: unknown;
  working_days?: unknown;
  working_pattern_type?: unknown;
  part_year_worker?: unknown;
  holiday_year_start_month?: unknown;
  holiday_year_start_day?: unknown;
  leave_entitlement_basis?: unknown;
  bank_holiday_treatment?: unknown;
  reserved_leave_days?: unknown;
};

export const dynamic = "force-dynamic";

const EMPLOYMENT_DETAILS_SELECT =
  "id,employee_id,manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance,contracted_hours_per_week,contracted_days_per_week,working_days,working_pattern_type,part_year_worker,holiday_year_start_month,holiday_year_start_day,leave_entitlement_basis,bank_holiday_treatment,reserved_leave_days,created_at,updated_at";

const WORKING_DAYS = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

const WORKING_PATTERN_TYPES = new Set([
  "Fixed days",
  "Fixed hours",
  "Irregular hours",
]);

const LEAVE_ENTITLEMENT_BASES = new Set([
  "Statutory",
  "Contractual",
]);

const BANK_HOLIDAY_TREATMENTS = new Set([
  "Included",
  "Additional",
]);

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

function readOptionalChoice(
  value: unknown,
  allowedValues: Set<string>,
): string | null {
  const text = readOptionalString(value);

  if (!text || text === "Not set") return null;
  if (!allowedValues.has(text)) {
    throw new Error(`The selected value "${text}" is invalid.`);
  }

  return text;
}

function readOptionalNumber(
  value: unknown,
  {
    minimum,
    maximum,
    label,
  }: {
    minimum: number;
    maximum: number;
    label: string;
  },
): number | null {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new Error(
      `${label} must be between ${minimum} and ${maximum}.`,
    );
  }

  return parsed;
}

function readOptionalInteger(
  value: unknown,
  {
    minimum,
    maximum,
    label,
  }: {
    minimum: number;
    maximum: number;
    label: string;
  },
): number | null {
  const parsed = readOptionalNumber(value, {
    minimum,
    maximum,
    label,
  });

  if (parsed === null) return null;

  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number.`);
  }

  return parsed;
}

function readOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value === "true") return true;
  if (value === "false") return false;

  throw new Error("The part-year worker value is invalid.");
}

function readWorkingDays(value: unknown): string[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) {
    throw new Error("Working days must be supplied as a list.");
  }

  const days = Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  const invalidDay = days.find((day) => !WORKING_DAYS.has(day));

  if (invalidDay) {
    throw new Error(`"${invalidDay}" is not a valid working day.`);
  }

  return days.length > 0 ? days : null;
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
      .select(EMPLOYMENT_DETAILS_SELECT)
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
          contracted_hours_per_week: null,
          contracted_days_per_week: null,
          working_days: null,
          working_pattern_type: null,
          part_year_worker: null,
          holiday_year_start_month: null,
          holiday_year_start_day: null,
          leave_entitlement_basis: null,
          bank_holiday_treatment: null,
          reserved_leave_days: null,
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
      contracted_hours_per_week: readOptionalNumber(
        updates.contracted_hours_per_week,
        {
          minimum: 0,
          maximum: 168,
          label: "Contracted hours per week",
        },
      ),
      contracted_days_per_week: readOptionalNumber(
        updates.contracted_days_per_week,
        {
          minimum: 0,
          maximum: 7,
          label: "Contracted days per week",
        },
      ),
      working_days: readWorkingDays(updates.working_days),
      working_pattern_type: readOptionalChoice(
        updates.working_pattern_type,
        WORKING_PATTERN_TYPES,
      ),
      part_year_worker: readOptionalBoolean(
        updates.part_year_worker,
      ),
      holiday_year_start_month: readOptionalInteger(
        updates.holiday_year_start_month,
        {
          minimum: 1,
          maximum: 12,
          label: "Holiday year start month",
        },
      ),
      holiday_year_start_day: readOptionalInteger(
        updates.holiday_year_start_day,
        {
          minimum: 1,
          maximum: 31,
          label: "Holiday year start day",
        },
      ),
      leave_entitlement_basis: readOptionalChoice(
        updates.leave_entitlement_basis,
        LEAVE_ENTITLEMENT_BASES,
      ),
      bank_holiday_treatment: readOptionalChoice(
        updates.bank_holiday_treatment,
        BANK_HOLIDAY_TREATMENTS,
      ),
      reserved_leave_days: readOptionalNumber(
        updates.reserved_leave_days,
        {
          minimum: 0,
          maximum: 366,
          label: "Reserved leave days",
        },
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
          .select(EMPLOYMENT_DETAILS_SELECT)
          .single()
      : await admin
          .from("employee_employment_details")
          .insert(employmentPayload)
          .select(EMPLOYMENT_DETAILS_SELECT)
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
        contracted_hours_per_week:
          detailsResult.data.contracted_hours_per_week,
        contracted_days_per_week:
          detailsResult.data.contracted_days_per_week,
        working_days: detailsResult.data.working_days,
        working_pattern_type:
          detailsResult.data.working_pattern_type,
        part_year_worker: detailsResult.data.part_year_worker,
        holiday_year_start_month:
          detailsResult.data.holiday_year_start_month,
        holiday_year_start_day:
          detailsResult.data.holiday_year_start_day,
        leave_entitlement_basis:
          detailsResult.data.leave_entitlement_basis,
        bank_holiday_treatment:
          detailsResult.data.bank_holiday_treatment,
        reserved_leave_days:
          detailsResult.data.reserved_leave_days,
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
          working_pattern_type:
            detailsResult.data.working_pattern_type,
          working_days: detailsResult.data.working_days,
          contracted_hours_per_week:
            detailsResult.data.contracted_hours_per_week,
          annual_leave_allowance:
            detailsResult.data.annual_leave_allowance,
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
