import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireSarViewAccess() {
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
          error: "You must be signed in to view SAR requests.",
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
      target_permission_key: "sar_requests.view",
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    console.error("SAR permission could not be checked:", permissionError);

    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to view SAR requests could not be verified.",
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
          error: "You do not have permission to view SAR requests.",
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
    const access = await requireSarViewAccess();

    if (access.response) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const [sarResult, employeeResult] = await Promise.all([
      supabase
        .from("employee_sars")
        .select(
          `
            id,
            employee_id,
            matter_id,
            request_title,
            request_received_date,
            response_due_date,
            extended_due_date,
            status,
            assigned_to,
            identity_verified,
            collection_complete,
            review_complete,
            redaction_complete,
            disclosure_sent,
            created_at
          `,
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("employees")
        .select("id,name")
        .eq("organisation_id", organisationId)
        .order("name", {
          ascending: true,
        }),
    ]);

    if (sarResult.error) {
      console.error("Error loading SAR requests:", sarResult.error);

      return NextResponse.json(
        {
          success: false,
          error:
            sarResult.error.message ||
            "SAR requests could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (employeeResult.error) {
      console.error("Error loading SAR employees:", employeeResult.error);

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

    const employeeIds = (employeeResult.data || []).map(({ id }) => id);

    const matterResult = employeeIds.length
      ? await supabase
          .from("matters")
          .select("id,title,subject,employee_id")
          .in("employee_id", employeeIds)
      : { data: [], error: null };

    if (matterResult.error) {
      console.error("Error loading SAR matters:", matterResult.error);

      return NextResponse.json(
        {
          success: false,
          error:
            matterResult.error.message ||
            "Matter records could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        sarRequests: sarResult.data || [],
        employees: employeeResult.data || [],
        matters: matterResult.data || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("SAR Requests API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "SAR requests could not be loaded.",
      },
      { status: 500 },
    );
  }
}