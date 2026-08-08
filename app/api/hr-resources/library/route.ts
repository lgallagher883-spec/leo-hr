import { NextResponse } from "next/server";

import { getLeoResourceTypeSummaries } from "@/lib/hr-resources/leoCatalogue";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireHrResourcesAccess() {
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
          error: "You must be signed in to view HR resources.",
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
      target_permission_key: "hr_resources.view",
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to view HR resources could not be verified.",
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
          error: "You do not have permission to view HR resources.",
        },
        { status: 403 },
      ),
    };
  }

  return {};
}

export async function GET() {
  try {
    const access = await requireHrResourcesAccess();

    if ("response" in access) {
      return access.response;
    }

    const categories = await getLeoResourceTypeSummaries();

    return NextResponse.json(
      {
        success: true,
        categories,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("HR Resources library metadata could not be loaded:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "HR resources library metadata could not be loaded.",
      },
      { status: 500 },
    );
  }
}
