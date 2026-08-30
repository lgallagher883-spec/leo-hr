
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AccessContext = {
  organisationId: string;
};

type EmployeeRecord = {
  id: number;
  organisation_id: string | null;
};

type EmployeeUserLink = {
  employee_id: number;
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

type LeaveRequestBody = {
  leaveType?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  dayPortion?: unknown;
  daysTaken?: unknown;
  employeeNotes?: unknown;
};

const leaveMetadataPrefix = "LEO_LEAVE_METADATA_V1:";

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

function readText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function readNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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

    const organisationId = accessResult.access.organisationId;

    const { data: employeeLink, error: employeeLinkError } = await supabase
      .from("employee_user_links")
      .select("employee_id")
      .eq("organisation_id", organisationId)
      .eq("user_id", user.id)
      .eq("link_status", "active")
      .maybeSingle();

    if (employeeLinkError) {
      console.error(
        "LEO leave API employee link lookup failed:",
        employeeLinkError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            employeeLinkError.message ||
            "Your employee record could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (!employeeLink) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        allowance: 0,
        records: [],
      });
    }

    const linkedEmployee = employeeLink as EmployeeUserLink;

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id,organisation_id")
      .eq("organisation_id", organisationId)
      .eq("id", linkedEmployee.employee_id)
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


export async function POST(request: Request) {
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
          error: "You must be signed in to request leave.",
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

    const organisationId = accessResult.access.organisationId;

    const { data: employeeLink, error: employeeLinkError } = await supabase
      .from("employee_user_links")
      .select("employee_id")
      .eq("organisation_id", organisationId)
      .eq("user_id", user.id)
      .eq("link_status", "active")
      .maybeSingle();

    if (employeeLinkError) {
      return NextResponse.json(
        {
          success: false,
          error: "Your employee record could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (!employeeLink?.employee_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account is not linked to an employee record.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as LeaveRequestBody;

    const leaveType = readText(body.leaveType);
    const startDate = readText(body.startDate);
    const endDate = readText(body.endDate) || startDate;
    const dayPortion = readText(body.dayPortion) || "Full day";
    const employeeNotes = readText(body.employeeNotes) || "";
    const daysTaken = readNumber(body.daysTaken);

    const allowedLeaveTypes = new Set([
      "Annual Leave",
      "Half Day Leave",
      "Unpaid Leave",
      "Sickness Absence",
      "Medical Appointment",
      "Hospital Appointment",
      "Compassionate Leave",
      "Time Off for Dependants",
      "Carer's Leave",
      "Maternity Leave",
      "Paternity Leave",
      "Adoption Leave",
      "Shared Parental Leave",
      "Parental Leave",
      "Parental Bereavement Leave",
      "Neonatal Care Leave",
      "Jury Service",
      "Public Duties",
      "Military Reserve Leave",
      "Study Leave",
      "Sabbatical",
      "Time Off in Lieu (TOIL)",
      "Garden Leave",
      "Furlough",
      "Other",
    ]);

    const allowedDayPortions = new Set([
      "Full day",
      "Half day - morning",
      "Half day - afternoon",
    ]);

    if (!leaveType || !allowedLeaveTypes.has(leaveType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please choose a valid annual leave type.",
        },
        { status: 400 },
      );
    }

    if (
      !startDate ||
      !endDate ||
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please choose valid leave dates.",
        },
        { status: 400 },
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          success: false,
          error: "The end date cannot be before the start date.",
        },
        { status: 400 },
      );
    }

    if (!allowedDayPortions.has(dayPortion)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please choose a valid day type.",
        },
        { status: 400 },
      );
    }

    if (daysTaken === null || daysTaken <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The requested leave must contain at least one working period.",
        },
        { status: 400 },
      );
    }

    const admin = getAdminClient();

    const employeeResult = await admin
      .from("employees")
      .select("id,name")
      .eq("id", employeeLink.employee_id)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (employeeResult.error) {
      throw new Error(employeeResult.error.message);
    }

    if (!employeeResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Your employee record could not be found.",
        },
        { status: 404 },
      );
    }

    const overlappingResult = await admin
      .from("employee_leave_records")
      .select("id,status,start_date,end_date")
      .eq("employee_id", employeeResult.data.id);

    if (overlappingResult.error) {
      throw new Error(overlappingResult.error.message);
    }

    const overlappingRecord = (overlappingResult.data ?? []).find((record) => {
      const status = String(record.status || "").toLowerCase();

      if (status === "cancelled" || status === "declined") {
        return false;
      }

      const recordStart = record.start_date;
      const recordEnd = record.end_date || record.start_date;

      if (!recordStart || !recordEnd) return false;

      return startDate <= recordEnd && endDate >= recordStart;
    });

    if (overlappingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "This request overlaps with an existing leave record.",
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    const recordCategoryByLeaveType: Record<string, string> = {
      "Annual Leave": "Annual leave",
      "Half Day Leave": "Annual leave",
      "Unpaid Leave": "Special leave",
      "Sickness Absence": "Absence",
      "Medical Appointment": "Special leave",
      "Hospital Appointment": "Special leave",
      "Compassionate Leave": "Special leave",
      "Time Off for Dependants": "Special leave",
      "Carer's Leave": "Special leave",
      "Maternity Leave": "Family leave",
      "Paternity Leave": "Family leave",
      "Adoption Leave": "Family leave",
      "Shared Parental Leave": "Family leave",
      "Parental Leave": "Family leave",
      "Parental Bereavement Leave": "Family leave",
      "Neonatal Care Leave": "Family leave",
      "Jury Service": "Special leave",
      "Public Duties": "Special leave",
      "Military Reserve Leave": "Special leave",
      "Study Leave": "Special leave",
      "Sabbatical": "Special leave",
      "Time Off in Lieu (TOIL)": "Special leave",
      "Garden Leave": "Employment arrangement",
      "Furlough": "Employment arrangement",
      "Other": "Special leave",
    };

    const metadata = {
      version: 1,
      employeeNotes,
      managerComments: "",
      dayPortion,
      submittedAt: now,
      submittedBy: user.id,
      decisionAt: null,
      decisionBy: null,
      returnedAt: null,
      cancelledAt: null,
      cancellationReason: "",
      recordCategory: recordCategoryByLeaveType[leaveType] || "Special leave",
      calculatedDays: daysTaken,
      manuallyAdjusted: false,
      source: "Employee",
      futureCalendarSync: false,
    };

    const insertResult = await admin
      .from("employee_leave_records")
      .insert({
        employee_id: employeeResult.data.id,
        leave_type: leaveType,
        status: "Submitted",
        start_date: startDate,
        end_date: endDate,
        days_taken: daysTaken,
        notes: `${leaveMetadataPrefix}${JSON.stringify(metadata)}`,
        updated_at: now,
      })
      .select(
        "id,leave_type,status,start_date,end_date,days_taken,notes,created_at",
      )
      .single();

    if (insertResult.error || !insertResult.data) {
      throw new Error(
        insertResult.error?.message ||
          "Your leave request could not be created.",
      );
    }

    const userName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : user.email || "Employee";

    const auditResult = await admin.from("audit_logs").insert({
      organisation_id: organisationId,
      user_id: user.id,
      user_name: userName,
      user_email: user.email || null,
      action: "Leave request submitted",
      action_category: "Employee",
      entity_type: "Employee",
      entity_id: String(employeeResult.data.id),
      entity_name: employeeResult.data.name,
      description: `${leaveType} was requested by ${employeeResult.data.name}.`,
      new_values: {
        leave_record_id: insertResult.data.id,
        leave_type: insertResult.data.leave_type,
        status: insertResult.data.status,
        start_date: insertResult.data.start_date,
        end_date: insertResult.data.end_date,
        days_taken: insertResult.data.days_taken,
      },
      metadata: {
        source_module: "Employee Leave",
      },
      source_page: "/dashboard/my-employment/leave",
      ip_address:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: request.headers.get("user-agent"),
      created_at: now,
    });

    if (auditResult.error) {
      console.warn(
        "Leo HR employee leave audit event could not be written:",
        auditResult.error,
      );
    }

    const timelineResult = await admin.from("employee_timeline").insert({
      organisation_id: organisationId,
      employee_id: employeeResult.data.id,
      event_type: "Leave & Absence",
      title: "Leave request submitted",
      description: `${leaveType} was requested by ${employeeResult.data.name}.`,
      status: "Submitted",
      source_module: "Leave & Absence",
      source_record_id: String(insertResult.data.id),
      metadata: {
        leave_type: insertResult.data.leave_type,
        start_date: insertResult.data.start_date,
        end_date: insertResult.data.end_date,
        days_taken: insertResult.data.days_taken,
      },
      event_date: now,
      created_by: user.id,
      created_at: now,
    });

    if (timelineResult.error) {
      console.warn(
        "Leo HR employee leave timeline event could not be written:",
        timelineResult.error,
      );
    }

    return NextResponse.json(
      {
        success: true,
        record: insertResult.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Leo HR employee leave request failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your leave request could not be submitted.",
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

function parseTimestamp(
  value: string | null | undefined,
): number | null {
  if (!value) return null;

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : null;
}