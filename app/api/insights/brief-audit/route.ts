import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BriefAuditBody = {
  action?: unknown;
  description?: unknown;
  period?: unknown;
  periodLabel?: unknown;
  metadata?: unknown;
};

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
          error: "You must be signed in to write Insights audit events.",
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
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to use Insights could not be verified.",
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
          error: "You do not have permission to use Insights.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    organisationId: String(organisationId),
    user,
  };
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const access = await requireInsightsAccess();

    if ("response" in access) {
      return access.response;
    }

    const { supabase, organisationId, user } = access;

    const body = (await request.json().catch(() => null)) as BriefAuditBody | null;

    const action = toText(body?.action);
    const description = toText(body?.description);
    const period = toText(body?.period);
    const periodLabel = toText(body?.periodLabel);
    const metadata = toMetadata(body?.metadata);

    if (!action || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "action and description are required.",
        },
        { status: 400 },
      );
    }

    const fullName = toText(user.user_metadata?.full_name);
    const displayName = toText(user.user_metadata?.name);
    const userName = fullName || displayName || user.email || "System user";

    const { error } = await supabase.from("audit_logs").insert({
      organisation_id: organisationId,
      user_id: user.id,
      user_name: userName,
      user_email: user.email || null,
      action,
      action_category: "System",
      entity_type: "Insight Brief",
      entity_id: period || null,
      entity_name: periodLabel
        ? `Executive Insight Brief · ${periodLabel}`
        : "Executive Insight Brief",
      description,
      previous_values: null,
      new_values: metadata as any,
      metadata: {
        ...metadata,
        period,
        period_label: periodLabel,
        source_module: "Insights",
        report_type: "executive_insight_brief",
        destination_path: "/dashboard/insights",
      } as any,
      source_page: "/dashboard/insights",
      ip_address: null,
      user_agent: request.headers.get("user-agent"),
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || "The Insights audit event could not be saved.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The Insights audit event could not be saved.",
      },
      { status: 500 },
    );
  }
}
