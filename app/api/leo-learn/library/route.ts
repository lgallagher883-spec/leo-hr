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

    const [modulesResult, categoriesResult, providersResult] =
      await Promise.all([
        supabase
          .from("learning_modules")
          .select(
            `
            id,
            title,
            description,
            learning_type,
            delivery_method,
            category_id,
            provider_id,
            status,
            estimated_duration_minutes,
            assignment_eligible,
            certificate_available,
            assessment_required,
            manager_validation_required,
            review_frequency_months,
            last_reviewed_at,
            next_review_date,
            current_version_number,
            source_type,
            created_at,
            updated_at
            `
          )
          .eq("is_archived", false)
          .order("updated_at", { ascending: false }),

        supabase
          .from("learning_categories")
          .select("id, name")
          .eq("is_archived", false)
          .eq("is_active", true)
          .order("display_order", { ascending: true }),

        supabase
          .from("learning_providers")
          .select("id, name")
          .eq("is_archived", false)
          .eq("is_active", true)
          .order("name", { ascending: true }),
      ]);

    if (modulesResult.error) {
      console.error("Learning modules query failed:", modulesResult.error);
      return NextResponse.json(
        {
          success: false,
          error: modulesResult.error.message || "The Learning Library could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (categoriesResult.error) {
      console.error("Learning categories query failed:", categoriesResult.error);
      return NextResponse.json(
        {
          success: false,
          error: categoriesResult.error.message || "Learning categories could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (providersResult.error) {
      console.error("Learning providers query failed:", providersResult.error);
      return NextResponse.json(
        {
          success: false,
          error: providersResult.error.message || "Learning providers could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      modules: modulesResult.data ?? [],
      categories: categoriesResult.data ?? [],
      providers: providersResult.data ?? [],
      organisationId,
    });
  } catch (error) {
    console.error("Learning library API failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The Learning Library could not be loaded.",
      },
      { status: 500 }
    );
  }
}
