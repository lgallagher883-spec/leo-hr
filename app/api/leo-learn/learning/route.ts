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

    const [employeeResult, moduleResult, assignmentResult] =
      await Promise.all([
        supabase
          .from("employees")
          .select("id, name, role, status")
          .eq("organisation_id", organisationId)
          .neq("status", "Archived")
          .order("name"),

        supabase
          .from("learning_modules")
          .select(
            `
            id,
            title,
            description,
            status,
            learning_type,
            delivery_method,
            estimated_duration_minutes,
            assessment_required,
            certificate_available,
            manager_validation_required
            `
          )
          .eq("organisation_id", organisationId)
          .eq("is_archived", false)
          .order("title"),

        supabase
          .from("learning_assignments")
          .select("*, employees!learning_assignments_employee_id_fkey!inner(id, organisation_id)")
          .eq("employees.organisation_id", organisationId)
          .eq("is_archived", false)
          .order("updated_at", { ascending: false }),
      ]);

    if (employeeResult.error) {
      console.error("Learning employees query failed:", employeeResult.error);
      return NextResponse.json(
        {
          success: false,
          error: employeeResult.error.message || "Employees could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (moduleResult.error) {
      console.error("Learning modules query failed:", moduleResult.error);
      return NextResponse.json(
        {
          success: false,
          error: moduleResult.error.message || "Learning modules could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (assignmentResult.error) {
      console.error("Learning assignments query failed:", assignmentResult.error);
      return NextResponse.json(
        {
          success: false,
          error: assignmentResult.error.message || "Learning assignments could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      employees: employeeResult.data ?? [],
      modules: moduleResult.data ?? [],
      assignments: assignmentResult.data ?? [],
      organisationId,
    });
  } catch (error) {
    console.error("Learning workspace API failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Learning data could not be loaded.",
      },
      { status: 500 }
    );
  }
}
