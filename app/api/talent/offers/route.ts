import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type PlatformRole = "owner" | "senior" | "manager" | "employee";
const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);

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
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ success: false, error: "Your session is unavailable. Please sign in again." }, { status: 401 }) };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;
  const role = normaliseRole(resolvedRole?.roleKey);

  if (!organisationId) {
    return { error: NextResponse.json({ success: false, error: "Leo could not find an active organisation for your account." }, { status: 403 }) };
  }

  return { user, organisationId, role };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);
    if ("error" in access) return access.error;

    const [offersResult, appointmentsResult, candidatesResult, applicationsResult, vacanciesResult] = await Promise.all([
      (supabase as any).from("leo_talent_offers").select("*").eq("organisation_id", access.organisationId).is("archived_at", null).order("created_at", { ascending: false }),
      (supabase as any).from("leo_talent_appointments").select("*").eq("organisation_id", access.organisationId).is("archived_at", null).order("created_at", { ascending: false }),
      (supabase as any).from("leo_talent_candidates").select("*").eq("organisation_id", access.organisationId).order("created_at", { ascending: false }),
      (supabase as any).from("leo_talent_applications").select("*").eq("organisation_id", access.organisationId).order("created_at", { ascending: false }),
      (supabase as any).from("leo_talent_vacancies").select("*").eq("organisation_id", access.organisationId).order("created_at", { ascending: false }),
    ]);

    const firstError = offersResult.error || appointmentsResult.error || candidatesResult.error || applicationsResult.error || vacanciesResult.error;
    if (firstError) throw new Error(firstError.message);

    return NextResponse.json({
      success: true,
      offers: offersResult.data ?? [],
      appointments: appointmentsResult.data ?? [],
      candidates: candidatesResult.data ?? [],
      applications: applicationsResult.data ?? [],
      vacancies: vacanciesResult.data ?? [],
    });
  } catch (error) {
    console.error("Offers loading failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Offers and appointments could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);
    if ("error" in access) return access.error;

    if (!writeRoles.has(access.role)) {
      return NextResponse.json({ success: false, error: "You do not have permission to create offers." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const applicationId = text(body.applicationId);
    if (!applicationId) {
      return NextResponse.json({ success: false, error: "Select an applicant before creating an offer." }, { status: 400 });
    }

    const applicationResult = await (supabase as any)
      .from("leo_talent_applications")
      .select("*")
      .eq("id", applicationId)
      .eq("organisation_id", access.organisationId)
      .maybeSingle();

    if (applicationResult.error) throw new Error(applicationResult.error.message);
    if (!applicationResult.data) return NextResponse.json({ success: false, error: "The application was not found." }, { status: 404 });

    const application = applicationResult.data;
    const [candidateResult, vacancyResult, existingResult] = await Promise.all([
      (supabase as any).from("leo_talent_candidates").select("*").eq("id", application.candidate_id).eq("organisation_id", access.organisationId).maybeSingle(),
      (supabase as any).from("leo_talent_vacancies").select("*").eq("id", application.vacancy_id).eq("organisation_id", access.organisationId).maybeSingle(),
      (supabase as any).from("leo_talent_offers").select("id").eq("application_id", applicationId).eq("organisation_id", access.organisationId).is("archived_at", null).maybeSingle(),
    ]);

    if (candidateResult.error) throw new Error(candidateResult.error.message);
    if (vacancyResult.error) throw new Error(vacancyResult.error.message);
    if (existingResult.error) throw new Error(existingResult.error.message);
    if (existingResult.data) return NextResponse.json({ success: false, error: "An active offer already exists for this application." }, { status: 409 });
    if (!candidateResult.data || !vacancyResult.data) return NextResponse.json({ success: false, error: "The candidate or vacancy record was not found." }, { status: 404 });

    const vacancy = vacancyResult.data;
    const result = await (supabase as any).from("leo_talent_offers").insert({
      organisation_id: access.organisationId,
      application_id: application.id,
      vacancy_id: application.vacancy_id,
      candidate_id: application.candidate_id,
      offer_type: "conditional",
      status: "draft",
      job_title: text(vacancy.job_title) || text(vacancy.title) || text(vacancy.vacancy_title) || "Vacancy",
      department: text(vacancy.department) || null,
      location_name: text(vacancy.location_name) || text(vacancy.location) || null,
      manager_name: text(vacancy.manager_name) || text(vacancy.hiring_manager_name) || null,
      employment_type: text(vacancy.employment_type) || text(vacancy.contract_type) || "permanent",
      salary_currency: "GBP",
      salary_period: "year",
      probation_months: 3,
      conditions: [],
      approval_status: "not_required",
    }).select("*").single();

    if (result.error) throw new Error(result.error.message);
    return NextResponse.json({ success: true, offer: result.data }, { status: 201 });
  } catch (error) {
    console.error("Offer creation failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "The offer could not be created." }, { status: 500 });
  }
}