import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { buildLeoInsight } from "@/leo/insight/engine";

export const dynamic = "force-dynamic";

type TimePeriod =
  | "30_days"
  | "quarter"
  | "6_months"
  | "12_months"
  | "all_time";

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

function readPeriod(value: string | null): TimePeriod {
  switch (value) {
    case "30_days":
    case "quarter":
    case "6_months":
    case "12_months":
    case "all_time":
      return value;
    default:
      return "quarter";
  }
}

function labelForPeriod(period: TimePeriod): string {
  switch (period) {
    case "30_days":
      return "Last 30 days";
    case "quarter":
      return "Last quarter";
    case "6_months":
      return "Last 6 months";
    case "12_months":
      return "Last 12 months";
    case "all_time":
      return "All time";
  }
}

export async function GET(request: Request) {
  try {
    const access = await requireInsightsAccess();

    if (access.response) {
      return access.response;
    }

    const { supabase, organisationId } = access;
    const { searchParams } = new URL(request.url);
    const period = readPeriod(searchParams.get("period"));
    const periodLabel = labelForPeriod(period);

    const employeeResult = await supabase
      .from("employees")
      .select("id,name,status,start_date")
      .eq("organisation_id", organisationId)
      .order("name", {
        ascending: true,
      });

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

    const employeeIds = (employeeResult.data || []).map((employee) => employee.id);

    const [matterResult, sarResult, knowledgeResult] = await Promise.all([
      employeeIds.length > 0
        ? supabase
            .from("matters")
            .select("id,title,subject,status,matter_type,created_at")
            .in("employee_id", employeeIds)
            .order("created_at", {
              ascending: false,
            })
        : Promise.resolve({ data: [], error: null }),

      employeeIds.length > 0
        ? supabase
            .from("employee_sars")
            .select(
              "id,request_title,employee_id,matter_id,status,response_due_date,extended_due_date,created_at",
            )
            .in("employee_id", employeeIds)
            .order("created_at", {
              ascending: false,
            })
        : Promise.resolve({ data: [], error: null }),

      supabase
        .from("knowledge_chunks")
        .select("source_table,source_record_id", {
          count: "exact",
        })
        .eq("organisation_id", organisationId)
        .eq("is_active", true),
    ]);

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

    const policyRecordIds = Array.from(
      new Set(
        (knowledgeResult.data || [])
          .filter(
            (chunk) =>
              chunk.source_table === "policy_register" &&
              typeof chunk.source_record_id === "number",
          )
          .map((chunk) => chunk.source_record_id as number),
      ),
    );

    const resourceResult = policyRecordIds.length
      ? await supabase
          .from("policy_register")
          .select("id,name,register_type")
          // policy_register has no organisation_id column in schema.
          // Restricting IDs to those referenced by organisation-scoped knowledge.
          .in("id", policyRecordIds)
          .order("name", {
            ascending: true,
          })
      : { data: [], error: null };

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

    const insight = buildLeoInsight({
      periodLabel,
      periodKey: period,
      employees: (employeeResult.data || []) as Array<{
        id: number;
        name: string;
        status?: string | null;
        start_date?: string | null;
      }>,
      matters: (matterResult.data || []) as Array<{
        id: number;
        title: string;
        subject?: string | null;
        status?: string | null;
        matter_type?: string | null;
        created_at?: string | null;
      }>,
      sars: (sarResult.data || []) as Array<{
        id: number;
        request_title: string;
        employee_id: number;
        matter_id?: number | null;
        status?: string;
        response_due_date?: string | null;
        extended_due_date?: string | null;
        created_at?: string | null;
      }>,
      resources: (resourceResult.data || []) as Array<{
        id: number;
        name: string;
        register_type?: string | null;
      }>,
      knowledgeSectionCount: knowledgeResult.count || 0,
    });

    return NextResponse.json(
      {
        success: true,
        period,
        periodLabel,
        employees: employeeResult.data || [],
        matters: matterResult.data || [],
        sars: sarResult.data || [],
        resources: resourceResult.data || [],
        knowledgeSectionCount: knowledgeResult.count || 0,
        insight,
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