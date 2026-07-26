import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AccessContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
};

async function requireAuthorisedContext(): Promise<
  | { ok: true; context: AccessContext }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 }
      ),
    };
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 }
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .in("membership_status", ["active", "accepted"])
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have active access to this organisation.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    context: {
      supabase,
      organisationId,
    },
  };
}

export async function GET() {
  try {
    const auth = await requireAuthorisedContext();

    if (!auth.ok) {
      return auth.response;
    }

    const { supabase, organisationId } = auth.context;

    const { data, error } = await supabase
      .from("development_pathways")
      .select("*")
      .eq("organisation_id", organisationId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Development pathways query failed:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Development pathways could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pathways: data ?? [],
      organisationId,
    });
  } catch (error) {
    console.error("Development pathways API failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Development pathways could not be loaded.",
      },
      { status: 500 }
    );
  }
}
