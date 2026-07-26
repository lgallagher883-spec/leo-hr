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

    const [
      employeesResult,
      typesResult,
      qualificationsResult,
      requirementsResult,
      employeeRequirementsResult,
    ] = await Promise.all([
      supabase
        .from("employees")
        .select("id, name, role, status")
        .eq("organisation_id", organisationId)
        .neq("status", "Archived")
        .order("name"),

      supabase
        .from("qualification_types")
        .select("*")
        .eq("organisation_id", organisationId)
        .eq("is_archived", false)
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("employee_qualifications")
        .select("*, employees!employee_qualifications_employee_id_fkey!inner(id, organisation_id)")
        .eq("employees.organisation_id", organisationId)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false }),

      supabase
        .from("qualification_requirements")
        .select("*")
        .eq("organisation_id", organisationId)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false }),

      supabase
        .from("employee_qualification_requirements")
        .select("*, employee_qualifications!employee_qualification_requireme_employee_qualification_id_fkey!inner(id, employee_id), employees!employee_qualification_requirements_employee_id_fkey!inner(id, organisation_id)")
        .eq("employees.organisation_id", organisationId)
        .order("updated_at", { ascending: false }),
    ]);

    const firstError =
      employeesResult.error ||
      typesResult.error ||
      qualificationsResult.error ||
      requirementsResult.error ||
      employeeRequirementsResult.error;

    if (firstError) {
      console.error("Qualification workspace query failed:", firstError);
      return NextResponse.json(
        {
          success: false,
          error: firstError.message || "Qualifications and certificates could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      employees: employeesResult.data ?? [],
      qualificationTypes: typesResult.data ?? [],
      qualifications: qualificationsResult.data ?? [],
      requirements: requirementsResult.data ?? [],
      employeeRequirements: employeeRequirementsResult.data ?? [],
      organisationId,
    });
  } catch (error) {
    console.error("Qualification workspace API failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Qualifications and certificates could not be loaded.",
      },
      { status: 500 }
    );
  }
}
