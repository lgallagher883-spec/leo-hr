import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AccessContext = {
  organisationId: string;
};

type EmployeeRecord = {
  id: number;
  organisation_id: string | null;
};

type LeaveRecord = {
  id: number;
  leave_type: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  days_taken: number | string | null;
  notes: string | null;
  created_at: string | null;
};

type EmploymentDetails = {
  annual_leave_allowance: number | string | null;
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
          error: "You must be signed in to view your leave information.",
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
            "Your signed-in account does not have an email address that can be linked to an employee record.",
        },
        { status: 409 },
      );
    }

    const organisationId = accessResult.access.organisationId;

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id,organisation_id")
      .eq("organisation_id", organisationId)
      .ilike("email", userEmail)
      .limit(1)
      .maybeSingle();

    if (employeeError) {
      console.error("LEO leave API employee lookup failed:", employeeError);

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
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        allowance: 0,
        records: [],
      });
    }

    const employeeRecord = employee as EmployeeRecord;

    const [leaveResult, detailsResult] = await Promise.all([
      (supabase as any)
        .from("employee_leave_records")
        .select(
          "id,leave_type,status,start_date,end_date,days_taken,notes,created_at",
        )
        .eq("employee_id", employeeRecord.id)
        .eq("organisation_id", organisationId)
        .order("start_date", { ascending: false }),
      (supabase as any)
        .from("employee_employment_details")
        .select("annual_leave_allowance")
        .eq("employee_id", employeeRecord.id)
        .maybeSingle(),
    ]);

    if (leaveResult.error) {
      console.error(
        "LEO leave API leave-record lookup failed:",
        leaveResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            leaveResult.error.message ||
            "Your leave records could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (detailsResult.error) {
      console.warn(
        "LEO leave API allowance lookup failed:",
        detailsResult.error,
      );
    }

    const details = detailsResult.data as EmploymentDetails | null;

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      allowance: details?.annual_leave_allowance ?? 0,
      records: (leaveResult.data ?? []) as LeaveRecord[],
    });
  } catch (error) {
    console.error("LEO leave API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your leave information could not be loaded.",
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
  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    console.error(
      "LEO leave API organisation lookup failed:",
      organisationError,
    );

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
      "membership_status,access_starts_at,access_ends_at",
    )
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error(
      "LEO leave API membership lookup failed:",
      membershipError,
    );
  }

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
  const accessStartsAt = parseTimestamp(membership.access_starts_at);
  const accessEndsAt = parseTimestamp(membership.access_ends_at);

  if (
    (accessStartsAt !== null && accessStartsAt > now) ||
    (accessEndsAt !== null && accessEndsAt <= now)
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

  return {
    ok: true,
    access: {
      organisationId,
    },
  };
}

function normaliseEmail(value: string | null | undefined) {
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