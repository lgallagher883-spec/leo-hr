import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_STANDARD_DAYS = [30, 7];

function normaliseDays(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;

  const days = Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter(
          (item) =>
            Number.isInteger(item) &&
            item >= 1 &&
            item <= 90,
        ),
    ),
  ).sort((a, b) => b - a);

  if (days.length < 1 || days.length > 4) {
    return null;
  }

  return days;
}

async function authorisedContext(permissionKey: string) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "You are not signed in." },
        { status: 401 },
      ),
    };
  }

  const { data: organisationId, error: organisationError } =
    await (supabase as any).rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } =
    await (supabase as any).rpc("leo_has_permission", {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    });

  if (permissionError || !allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: permissionError
            ? "Your notification permission could not be verified."
            : "You do not have permission to manage notification settings.",
        },
        { status: permissionError ? 500 : 403 },
      ),
    };
  }

  return {
    ok: true as const,
    admin,
    user,
    organisationId: String(organisationId),
  };
}

export async function GET() {
  try {
    const access = await authorisedContext("notifications.view");
    if (!access.ok) return access.response;

    const result = await (access.admin as any)
      .from("organisation_reminder_settings")
      .select("standard_days_before")
      .eq("organisation_id", access.organisationId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      success: true,
      settings: {
        standardDaysBefore:
          normaliseDays(result.data?.standard_days_before) ??
          DEFAULT_STANDARD_DAYS,
        sarDaysBefore: [14, 7, 1],
        dueDayAlwaysEnabled: true,
      },
    });
  } catch (error) {
    console.error("Reminder settings load failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Reminder settings could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const access = await authorisedContext("notifications.manage");
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => null)) as
      | { standardDaysBefore?: unknown }
      | null;

    const standardDaysBefore = normaliseDays(
      body?.standardDaysBefore,
    );

    if (!standardDaysBefore) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Choose between 1 and 4 reminder points, each between 1 and 90 days before the due date.",
        },
        { status: 400 },
      );
    }

    const result = await (access.admin as any)
      .from("organisation_reminder_settings")
      .upsert(
        {
          organisation_id: access.organisationId,
          standard_days_before: standardDaysBefore,
          updated_at: new Date().toISOString(),
          updated_by: access.user.id,
        },
        { onConflict: "organisation_id" },
      );

    if (result.error) {
      throw result.error;
    }

    await (access.admin as any).from("audit_logs").insert({
      organisation_id: access.organisationId,
      user_id: access.user.id,
      user_name:
        access.user.user_metadata?.full_name ||
        access.user.user_metadata?.name ||
        access.user.email ||
        "System user",
      user_email: access.user.email || null,
      action: "Reminder settings updated",
      action_category: "Settings",
      entity_type: "Notification Settings",
      entity_name: "Reminder timings",
      description:
        "Organisation reminder timing preferences were updated.",
      new_values: {
        standard_days_before: standardDaysBefore,
        sar_days_before: [14, 7, 1],
        due_day_always_enabled: true,
      },
      metadata: {
        source_module: "Foundations",
      },
      source_page: "/dashboard/foundations/notifications",
    });

    return NextResponse.json({
      success: true,
      settings: {
        standardDaysBefore,
        sarDaysBefore: [14, 7, 1],
        dueDayAlwaysEnabled: true,
      },
    });
  } catch (error) {
    console.error("Reminder settings save failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Reminder settings could not be saved.",
      },
      { status: 500 },
    );
  }
}
