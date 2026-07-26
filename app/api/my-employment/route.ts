import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AccessContext = {
  organisationId: string;
  membershipRole: string;
};

type EmployeeRecord = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  status: string | null;
  start_date: string | null;
  organisation_id: string | null;
};

type EmploymentDetailsRecord = {
  manager: string | null;
  probation_end_date: string | null;
  employment_end_date: string | null;
  reason_for_leaving: string | null;
  annual_leave_allowance: string | number | null;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must be signed in to view your employment record.",
        },
        { status: 401 },
      );
    }

    const accessResult = await resolveActiveOrganisationAccess(
      supabase,
      user.id,
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const userEmail = normaliseEmail(user.email);

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your account does not have an email address that can be linked to an employee record.",
        },
        { status: 409 },
      );
    }

    const { organisationId, membershipRole } =
      accessResult.access;

    const { data: employee, error: employeeError } =
      await supabase
        .from("employees")
        .select(
          "id,name,email,role,status,start_date,organisation_id",
        )
        .eq("organisation_id", organisationId)
        .ilike("email", userEmail)
        .limit(1)
        .maybeSingle();

    if (employeeError) {
      console.error(
        "My Employment employee lookup failed:",
        employeeError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            employeeError.message ||
            "Your employee record could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          employeeLinked: false,
          error:
            "No employee record is linked to your signed-in email address. An organisation owner or senior user must add the same email address to your employee profile.",
        },
        { status: 404 },
      );
    }

    const {
      data: employmentDetails,
      error: employmentDetailsError,
    } = await supabase
      .from("employee_employment_details")
      .select(
        "manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance",
      )
      .eq("employee_id", employee.id)
      .maybeSingle();

    if (employmentDetailsError) {
      console.error(
        "My Employment details lookup failed:",
        employmentDetailsError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            employmentDetailsError.message ||
            "Your employment details could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      employee: mapEmployee(employee as EmployeeRecord),
      employmentDetails: mapEmploymentDetails(
        employmentDetails as EmploymentDetailsRecord | null,
      ),
      access: {
        organisationId,
        membershipRole,
      },
    });
  } catch (error) {
    console.error("My Employment API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your employment record could not be loaded.",
      },
      { status: 500 },
    );
  }
}

async function resolveActiveOrganisationAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<
  | {
      ok: true;
      access: AccessContext;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  const {
    data: organisationId,
    error: organisationError,
  } = await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    console.error(
      "My Employment organisation lookup failed:",
      organisationError,
    );

    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("organisation_memberships")
      .select(
        "role,membership_status,access_starts_at,access_ends_at",
      )
      .eq("organisation_id", organisationId)
      .eq("user_id", userId)
      .eq("membership_status", "active")
      .limit(1)
      .maybeSingle();

  if (membershipError) {
    console.error(
      "My Employment membership lookup failed:",
      membershipError,
    );
  }

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            "You do not have active access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  const now = Date.now();
  const accessStartsAt = parseTimestamp(
    membership.access_starts_at,
  );
  const accessEndsAt = parseTimestamp(
    membership.access_ends_at,
  );

  if (
    (accessStartsAt !== null && accessStartsAt > now) ||
    (accessEndsAt !== null && accessEndsAt <= now)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Your organisation access is not currently active.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    access: {
      organisationId,
      membershipRole: membership.role || "Employee",
    },
  };
}

function mapEmployee(employee: EmployeeRecord) {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    status: employee.status,
    startDate: employee.start_date,
  };
}

function mapEmploymentDetails(
  details: EmploymentDetailsRecord | null,
) {
  return {
    manager: details?.manager ?? null,
    probationEndDate:
      details?.probation_end_date ?? null,
    employmentEndDate:
      details?.employment_end_date ?? null,
    reasonForLeaving:
      details?.reason_for_leaving ?? null,
    annualLeaveAllowance:
      details?.annual_leave_allowance ?? null,
  };
}

function normaliseEmail(
  value: string | null | undefined,
) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function parseTimestamp(
  value: string | null | undefined,
): number | null {
  if (!value) return null;

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : null;
}