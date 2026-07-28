import {
  NextRequest,
  NextResponse,
} from "next/server";

import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type TimelineEvent = {
  id: string;
  date: string | null;
  title: string;
  description: string;
  category:
    | "Employment"
    | "Compliance"
    | "Development"
    | "Learning"
    | "Document"
    | "Matter"
    | "System";
  source: string;
};

type EmploymentDetailsRecord = {
  id: number;
  employee_id: number;
  manager: string | null;
  probation_end_date: string | null;
  employment_end_date: string | null;
  reason_for_leaving: string | null;
  annual_leave_allowance: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const employeeId =
      await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The employee reference is not valid.",
        },
        { status: 400 }
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
        { status: 401 }
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.view"]
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const { organisationId } =
      accessResult.access;

    const { data: employee, error } =
      await supabase
        .from("employees")
        .select(
          "id,name,role,email,status,start_date"
        )
        .eq("id", employeeId)
        .eq(
          "organisation_id",
          organisationId
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Employee record query failed:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message ||
            "The employee record could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The employee record could not be found or accessed.",
        },
        { status: 404 }
      );
    }

    if (
      request.nextUrl.searchParams.get(
        "include"
      ) !== "timeline"
    ) {
      return NextResponse.json({
        success: true,
        employee,
      });
    }

    const timeline = await buildTimeline(
      supabase,
      employee,
      organisationId
    );

    return NextResponse.json({
      success: true,
      employee,
      timeline,
    });
  } catch (error) {
    console.error(
      "Employee record API failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the employee record.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const employeeId =
      await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The employee reference is not valid.",
        },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      action?: unknown;
    };

    const action =
      typeof body.action === "string"
        ? body.action
        : "";

    if (
      action !== "archive" &&
      action !== "restore"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid employee action is required.",
        },
        { status: 400 }
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
        { status: 401 }
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.archive"]
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const { organisationId } =
      accessResult.access;

    const {
      data: employee,
      error: loadError,
    } = await supabase
      .from("employees")
      .select(
        "id,name,role,email,status,start_date"
      )
      .eq("id", employeeId)
      .eq(
        "organisation_id",
        organisationId
      )
      .maybeSingle();

    if (loadError) {
      console.error(
        "Employee archive lookup failed:",
        loadError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            loadError.message ||
            "The employee record could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The employee record could not be found or accessed.",
        },
        { status: 404 }
      );
    }

    const nextStatus =
      action === "archive"
        ? "Archived"
        : "Active";

    const archivedAt =
      action === "archive"
        ? new Date().toISOString()
        : null;

    const {
      data: updatedEmployee,
      error: updateError,
    } = await supabase
      .from("employees")
      .update({
        status: nextStatus,
        archived_at: archivedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId)
      .eq(
        "organisation_id",
        organisationId
      )
      .select(
        "id,name,role,email,status,start_date"
      )
      .maybeSingle();

    if (updateError) {
      console.error(
        "Employee archive update failed:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            updateError.message ||
            "The employee record could not be updated.",
        },
        { status: 500 }
      );
    }

    if (!updatedEmployee) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The employee record was not updated.",
        },
        { status: 409 }
      );
    }

    await writeAuditEvent({
      supabase,
      request,
      user,
      organisationId,
      employee,
      action,
      nextStatus,
    });

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
      message:
        action === "archive"
          ? `${employee.name} has been archived.`
          : `${employee.name} has been restored to the active employee register.`,
    });
  } catch (error) {
    console.error(
      "Employee update API failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to update the employee record.",
      },
      { status: 500 }
    );
  }
}

async function readEmployeeId(
  context: RouteContext
): Promise<number | null> {
  const { id } = await context.params;
  const employeeId = Number(id);

  return Number.isInteger(employeeId) &&
    employeeId > 0
    ? employeeId
    : null;
}

async function buildTimeline(
  supabase: Awaited<
    ReturnType<typeof createClient>
  >,
  employee: {
    id: number;
    name: string;
    role: string | null;
    start_date: string | null;
  },
  organisationId: string
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  if (employee.start_date) {
    events.push({
      id: `employment-start-${employee.id}`,
      date: employee.start_date,
      title: "Employment started",
      description: `${employee.name} started employment${
        employee.role
          ? ` as ${employee.role}`
          : ""
      }.`,
      category: "Employment",
      source: "Employees",
    });
  }

  const {
    data: employeeTimelineData,
    error: employeeTimelineError,
  } = await supabase
    .from("employee_timeline")
    .select(
      "id,event_type,title,description,status,source_module,event_date,created_at"
    )
    .eq("employee_id", employee.id)
    .eq(
      "organisation_id",
      organisationId
    )
    .order("event_date", {
      ascending: false,
    })
    .limit(200);

  if (employeeTimelineError) {
    console.warn(
      "Employee timeline records could not be loaded:",
      employeeTimelineError
    );
  } else {
    for (const record of
      employeeTimelineData ?? []) {
      events.push({
        id: `employee-timeline-${record.id}`,
        date:
          record.event_date ||
          record.created_at,
        title:
          record.title ||
          record.event_type ||
          "Employee activity",
        description:
          record.description ||
          "An event was recorded against this employee.",
        category: inferTimelineCategory([
          record.event_type,
          record.source_module,
          record.title,
          record.status,
        ]),
        source:
          record.source_module ||
          record.event_type ||
          "Employees",
      });
    }
  }

  const { data: auditData, error: auditError } =
    await supabase
      .from("audit_logs")
      .select(
        "id,action,action_category,entity_type,description,source_page,created_at"
      )
      .eq(
        "organisation_id",
        organisationId
      )
      .eq("entity_type", "Employee")
      .eq("entity_id", String(employee.id))
      .order("created_at", {
        ascending: false,
      })
      .limit(100);

  if (auditError) {
    console.warn(
      "Audit timeline could not be loaded:",
      auditError
    );
  } else {
    for (const record of auditData ?? []) {
      events.push({
        id: `audit-${record.id}`,
        date: record.created_at,
        title:
          record.action ||
          "Employee record updated",
        description:
          record.description ||
          "A recorded action affected this employee.",
        category: inferTimelineCategory([
          record.action_category,
          record.action,
          record.entity_type,
          record.source_page,
        ]),
        source: "Audit Logs",
      });
    }
  }

  const seen = new Set<string>();

  return events
    .filter((event) => {
      const key = [
        event.date || "",
        event.title
          .trim()
          .toLowerCase(),
        event.description
          .trim()
          .toLowerCase(),
      ].join("|");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        dateValue(b.date) -
        dateValue(a.date)
    );
}

async function writeAuditEvent({
  supabase,
  request,
  user,
  organisationId,
  employee,
  action,
  nextStatus,
}: {
  supabase: Awaited<
    ReturnType<typeof createClient>
  >;
  request: NextRequest;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<
      string,
      unknown
    >;
  };
  organisationId: string;
  employee: {
    id: number;
    name: string;
    status: string | null;
  };
  action: "archive" | "restore";
  nextStatus: string;
}) {
  const fullName = readString(
    user.user_metadata?.full_name
  );
  const displayName = readString(
    user.user_metadata?.name
  );
  const userName =
    fullName ||
    displayName ||
    user.email ||
    "System user";

  const actionTitle =
    action === "archive"
      ? "Employee archived"
      : "Employee restored";

  const description =
    action === "archive"
      ? `${employee.name} was archived and removed from active use.`
      : `${employee.name} was restored to active use.`;

  const { error } = await supabase
    .from("audit_logs")
    .insert({
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
      previous_values: {
        status:
          employee.status || "Active",
      },
      new_values: {
        status: nextStatus,
      },
      metadata: {
        source_module: "Employees",
        employee_action: action,
      },
      source_page: `/dashboard/employees/${employee.id}`,
      ip_address:
        request.headers
          .get("x-forwarded-for")
          ?.split(",")[0]
          ?.trim() || null,
      user_agent:
        request.headers.get(
          "user-agent"
        ),
      created_at:
        new Date().toISOString(),
    });

  if (error) {
    console.warn(
      "Employee audit event was not written:",
      error
    );
  }
}

function inferTimelineCategory(
  values: Array<
    string | null | undefined
  >
): TimelineEvent["category"] {
  const combinedText = values
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    combinedText.includes("learn") ||
    combinedText.includes("training") ||
    combinedText.includes(
      "qualification"
    ) ||
    combinedText.includes("certificate")
  ) {
    return "Learning";
  }

  if (
    combinedText.includes("matter") ||
    combinedText.includes(
      "disciplinary"
    ) ||
    combinedText.includes(
      "grievance"
    ) ||
    combinedText.includes(
      "investigation"
    )
  ) {
    return "Matter";
  }

  if (
    combinedText.includes("document") ||
    combinedText.includes("file") ||
    combinedText.includes("upload")
  ) {
    return "Document";
  }

  if (
    combinedText.includes(
      "compliance"
    ) ||
    combinedText.includes("dbs") ||
    combinedText.includes(
      "right to work"
    ) ||
    combinedText.includes("driving") ||
    combinedText.includes("dvla")
  ) {
    return "Compliance";
  }

  if (
    combinedText.includes(
      "development"
    ) ||
    combinedText.includes(
      "probation"
    ) ||
    combinedText.includes("review") ||
    combinedText.includes(
      "one-to-one"
    )
  ) {
    return "Development";
  }

  if (
    combinedText.includes("employee") ||
    combinedText.includes(
      "employment"
    ) ||
    combinedText.includes("role") ||
    combinedText.includes("status")
  ) {
    return "Employment";
  }

  return "System";
}

function dateValue(
  value: string | null
): number {
  if (!value) {
    return 0;
  }

  const dateOnlyMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (dateOnlyMatch) {
    const [, year, month, day] =
      dateOnlyMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12,
      0,
      0
    ).getTime();
  }

  const parsedDate =
    new Date(value).getTime();

  return Number.isNaN(parsedDate)
    ? 0
    : parsedDate;
}

function readString(
  value: unknown
): string {
  return typeof value === "string"
    ? value
    : "";
}

type AccessContext = {
  organisationId: string;
  role: string;
  permissionKeys: Set<string>;
};

async function requireAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requiredPermissions: string[]
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
          error:
            "Your active organisation could not be resolved.",
        },
        { status: 403 }
      ),
    };
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("organisation_memberships")
      .select(
        "id,role,membership_status,access_starts_at,access_ends_at"
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
          error:
            "You do not have active access to this organisation.",
        },
        { status: 403 }
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
          error:
            "Your organisation access is not currently active.",
        },
        { status: 403 }
      ),
    };
  }

  const resolvedRole = await resolveRoleForMembership(
    supabase as any,
    {
      membershipId: membership.id,
      fallbackRole: membership.role,
    }
  );
  const role = resolvedRole.roleKey;
  const permissionKeys = new Set<string>();

  if (role !== "owner") {
    const { data: permissions, error: permissionsError } =
      await supabase.rpc("leo_effective_permissions", {
        target_organisation_id: organisationId,
      });

    if (permissionsError) {
      console.error(
        "Employee permission lookup failed:",
        permissionsError
      );

      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error:
              "Your employee permissions could not be verified.",
          },
          { status: 403 }
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
      (permission) => !permissionKeys.has(permission)
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
          { status: 403 }
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