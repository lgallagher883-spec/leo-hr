import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QueryResult<T> = {
  data: T[] | null;
  error: {
    message?: string;
  } | null;
};

async function requireComplianceAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You must be signed in to view compliance records.",
        },
        { status: 401 },
      ),
    };
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: "compliance.view",
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    console.error(
      "Compliance permission could not be checked:",
      permissionError,
    );

    return {
      response: NextResponse.json(
        {
          success: false,
          error:
            "Your permission to view compliance records could not be verified.",
        },
        { status: 500 },
      ),
    };
  }

  if (!allowed) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have permission to view compliance records.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    organisationId,
  };
}

export async function GET() {
  try {
    const access = await requireComplianceAccess();

    if (access.response) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const [
      employeeResult,
      siteResult,
      employmentResult,
      rightToWorkResult,
      dbsResult,
      drivingResult,
      trainingResult,
    ] = await Promise.all([
      supabase
        .from("employees")
        .select("*")
        .eq("organisation_id", organisationId)
        .order("name", { ascending: true }),

      supabase
        .from("sites")
        .select("id, name, manager, status")
        .eq("organisation_id", organisationId)
        .order("name", { ascending: true }),

      supabase
        .from("employee_employment_details")
        .select(
          "employee_id, manager, probation_end_date, employment_end_date",
        ),

      supabase
        .from("employee_right_to_work")
        .select(
          "id, employee_id, nationality, immigration_status, visa_or_permit_type, right_to_work_expiry, check_completed_date, next_review_date, created_at",
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("employee_dbs_checks")
        .select(
          "id, employee_id, dbs_required, dbs_level, certificate_number, certificate_issue_date, next_check_due, update_service, update_service_id, update_service_last_check_date, update_service_next_check_due, safeguarding_training_completed, safeguarding_training_expiry, created_at",
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("employee_driving_checks")
        .select(
          "id, employee_id, drives_for_work, vehicle_used, vehicle_registration, vehicle_ownership, authorised_to_drive, licence_expiry_date, dvla_check_completed, dvla_check_date, next_dvla_check_due, business_insurance_confirmed, business_insurance_expiry_date, mot_required, mot_expiry_date, created_at",
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("employee_training_logs")
        .select(
          "id, employee_id, training_name, date_completed, refresh_or_expiry_date, notes, created_at",
        )
        .order("refresh_or_expiry_date", { ascending: true }),
    ]);

    if (employeeResult.error) {
      console.error(
        "Compliance employee query failed:",
        employeeResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            employeeResult.error.message ||
            "Employee records could not be loaded.",
        },
        { status: 500 },
      );
    }

    const optionalSources: Array<{
      label: string;
      result: QueryResult<unknown>;
    }> = [
      { label: "Sites", result: siteResult },
      { label: "Employment details", result: employmentResult },
      { label: "Right to Work", result: rightToWorkResult },
      { label: "DBS and safeguarding", result: dbsResult },
      { label: "Driving compliance", result: drivingResult },
      { label: "Training records", result: trainingResult },
    ];

    const warnings = optionalSources
      .filter(({ result }) => Boolean(result.error))
      .map(({ label, result }) => {
        console.error(
          `Compliance query failed for ${label}:`,
          result.error,
        );

        return label;
      });

    return NextResponse.json(
      {
        success: true,
        employees: employeeResult.data || [],
        sites: siteResult.data || [],
        employmentDetails: employmentResult.data || [],
        rightToWorkRecords: rightToWorkResult.data || [],
        dbsRecords: dbsResult.data || [],
        drivingRecords: drivingResult.data || [],
        trainingRecords: trainingResult.data || [],
        warnings,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Compliance API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The compliance registers could not be loaded.",
      },
      { status: 500 },
    );
  }
}