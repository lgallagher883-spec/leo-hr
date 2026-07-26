import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
    console.error(
      "HR Resources permission could not be checked:",
      permissionError,
    );

    return {
      response: NextResponse.json(
        {
          success: false,
          error:
            "Your permission to view HR resources could not be verified.",
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

  return { supabase };
}

export async function GET() {
  try {
    const access = await requireHrResourcesAccess();

    if (access.response) {
      return access.response;
    }

    const { supabase } = access;

    const [registerResult, documentsResult] = await Promise.all([
      supabase
        .from("policy_register")
        .select("*")
        .order("next_review_date", {
          ascending: true,
        }),

      supabase
        .from("company_documents")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (registerResult.error) {
      console.error(
        "Could not load resource register:",
        registerResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            registerResult.error.message ||
            "The HR resource register could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (documentsResult.error) {
      console.error(
        "Could not load company documents:",
        documentsResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            documentsResult.error.message ||
            "Company documents could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        items: registerResult.data || [],
        documents: documentsResult.data || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("HR Resources API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "HR resources could not be loaded.",
      },
      { status: 500 },
    );
  }
}