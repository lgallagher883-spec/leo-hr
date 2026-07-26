import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type PlatformRole = "owner" | "senior" | "manager" | "employee";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();

  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";

  return "employee";
}

async function getAuthorisedContext(supabase: any) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const membershipResult = await supabase
    .from("organisation_memberships")
    .select("organisation_id, role, membership_status")
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipResult.error) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error:
            membershipResult.error.message ||
            "Leo could not verify your organisation access.",
        },
        { status: 500 },
      ),
    };
  }

  const organisationId = membershipResult.data?.organisation_id ?? null;
  const role = normaliseRole(membershipResult.data?.role);

  if (!organisationId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Leo could not find an active organisation for your account.",
        },
        { status: 403 },
      ),
    };
  }

  return { user, organisationId, role };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) return access.error;

    const profilesResult = await (supabase as any)
      .from("leo_talent_safer_recruitment_profiles")
      .select("*")
      .eq("organisation_id", access.organisationId)
      .order("updated_at", { ascending: false });

    if (profilesResult.error) {
      throw new Error(
        profilesResult.error.message ||
          "Leo could not load the due diligence register.",
      );
    }

    const profiles = profilesResult.data ?? [];

    if (profiles.length === 0) {
      return NextResponse.json({ success: true, records: [] });
    }

    const candidateIds = [
      ...new Set(profiles.map((profile: any) => profile.candidate_id)),
    ];
    const vacancyIds = [
      ...new Set(profiles.map((profile: any) => profile.vacancy_id)),
    ];
    const applicationIds = [
      ...new Set(profiles.map((profile: any) => profile.application_id)),
    ];

    const [candidateResult, vacancyResult, applicationResult] =
      await Promise.all([
        (supabase as any)
          .from("leo_talent_candidates")
          .select(
            "id,candidate_reference,first_name,middle_names,last_name,preferred_name,email,phone,country",
          )
          .eq("organisation_id", access.organisationId)
          .in("id", candidateIds),
        (supabase as any)
          .from("leo_talent_vacancies")
          .select(
            "id,vacancy_reference,title,department,location_name,safer_recruitment_required,requires_dbs,dbs_level,requires_driving,requires_qualification_checks,required_reference_count,overseas_check_required_if_applicable",
          )
          .eq("organisation_id", access.organisationId)
          .in("id", vacancyIds),
        (supabase as any)
          .from("leo_talent_applications")
          .select(
            "id,application_reference,vacancy_id,candidate_id,current_stage_key,status",
          )
          .eq("organisation_id", access.organisationId)
          .in("id", applicationIds),
      ]);

    if (candidateResult.error) throw new Error(candidateResult.error.message);
    if (vacancyResult.error) throw new Error(vacancyResult.error.message);
    if (applicationResult.error) throw new Error(applicationResult.error.message);

    const candidates = new Map(
      (candidateResult.data ?? []).map((item: any) => [item.id, item]),
    );
    const vacancies = new Map(
      (vacancyResult.data ?? []).map((item: any) => [item.id, item]),
    );
    const applications = new Map(
      (applicationResult.data ?? []).map((item: any) => [item.id, item]),
    );

    const records = profiles.map((profile: any) => ({
      profile,
      candidate: candidates.get(profile.candidate_id) ?? null,
      vacancy: vacancies.get(profile.vacancy_id) ?? null,
      application: applications.get(profile.application_id) ?? null,
    }));

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("Due diligence register loading failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Due diligence could not be loaded.",
      },
      { status: 500 },
    );
  }
}