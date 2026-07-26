import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireInsightsAccess() {
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
          error: "You must be signed in to view Insights.",
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
      target_permission_key: "insights.view",
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    console.error(
      "Insights permission could not be checked:",
      permissionError,
    );

    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to view Insights could not be verified.",
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
          error: "You do not have permission to view Insights.",
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
    const access = await requireInsightsAccess();

    if (access.response) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const [
      employeeResult,
      matterResult,
      sarResult,
      resourceResult,
      knowledgeResult,
    ] = await Promise.all([
      supabase
        .from("employees")
        .select("id,name,status,start_date")
        .eq("organisation_id", organisationId)
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("matters")
        .select("id,title,subject,status,matter_type,created_at")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("employee_sars")
        .select(
          "id,request_title,employee_id,matter_id,status,response_due_date,extended_due_date,created_at",
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("policy_register")
        .select("id,name,register_type")
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("knowledge_chunks")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_active", true),
    ]);

    if (employeeResult.error) {
      console.error(
        "Insights employees query failed:",
        employeeResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            employeeResult.error.message ||
            "Employee data could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (matterResult.error) {
      console.error(
        "Insights Matters query failed:",
        matterResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            matterResult.error.message ||
            "Matter data could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (sarResult.error) {
      console.error(
        "Insights SAR query failed:",
        sarResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            sarResult.error.message ||
            "SAR data could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (resourceResult.error) {
      console.error(
        "Insights HR Resources query failed:",
        resourceResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            resourceResult.error.message ||
            "HR Resource data could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (knowledgeResult.error) {
      console.error(
        "Insights knowledge query failed:",
        knowledgeResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            knowledgeResult.error.message ||
            "Knowledge data could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        employees: employeeResult.data || [],
        matters: matterResult.data || [],
        sars: sarResult.data || [],
        resources: resourceResult.data || [],
        knowledgeSectionCount: knowledgeResult.count || 0,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Insights API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Insights data could not be loaded.",
      },
      { status: 500 },
    );
  }
}