import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type PlatformRole = "owner" | "senior" | "manager" | "employee";

type CreateVacancyBody = {
  vacancy_reference?: unknown;
  title?: unknown;
  advert_text?: unknown;
  business_area?: unknown;
  department?: unknown;
  location_name?: unknown;
  hiring_manager_name?: unknown;
  recruitment_lead_name?: unknown;
  employment_type?: unknown;
  work_pattern?: unknown;
  hours_per_week?: unknown;
  salary_min?: unknown;
  salary_max?: unknown;
  salary_period?: unknown;
  salary_currency?: unknown;
  salary_visible?: unknown;
  number_of_positions?: unknown;
  status?: unknown;
  approval_status?: unknown;
  opening_date?: unknown;
  closing_date?: unknown;
  target_start_date?: unknown;
  is_internal_only?: unknown;
  accepts_internal_candidates?: unknown;
  blind_review_enabled?: unknown;
  ai_screening_enabled?: unknown;
  safer_recruitment_required?: unknown;
  regulated_role?: unknown;
  requires_dbs?: unknown;
  requires_driving?: unknown;
  requires_qualification_checks?: unknown;
  reference_validation_required?: unknown;
  required_reference_count?: unknown;
  published_at?: unknown;
};

const roleRank: Record<PlatformRole, number> = {
  employee: 1,
  manager: 2,
  senior: 3,
  owner: 4,
};

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

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
}

function optionalDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return trimmed;
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

  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;

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

  return {
    user,
    organisationId: String(organisationId),
    role: normaliseRole(resolvedRole?.roleKey),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) {
      return access.error;
    }

    const result = await (supabase as any)
      .from("leo_talent_vacancies")
      .select("*")
      .eq("organisation_id", access.organisationId)
      .order("created_at", { ascending: false });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({
      success: true,
      vacancies: result.data ?? [],
    });
  } catch (error) {
    console.error("Vacancy register load failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Vacancy records could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) {
      return access.error;
    }

    if (roleRank[access.role] < roleRank.manager) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to create vacancies.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) as CreateVacancyBody | null;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "The vacancy details could not be read.",
        },
        { status: 400 },
      );
    }

    const vacancyReference = optionalText(body.vacancy_reference);
    const title = optionalText(body.title);

    if (!vacancyReference || !title) {
      return NextResponse.json(
        {
          success: false,
          error: "A vacancy reference and title are required.",
        },
        { status: 400 },
      );
    }

    const status = optionalText(body.status) ?? "draft";
    const approvalStatus = optionalText(body.approval_status) ?? "not_required";
    const now = new Date().toISOString();

    const insertPayload = {
      organisation_id: access.organisationId,
      vacancy_reference: vacancyReference,
      title,
      advert_text: optionalText(body.advert_text),
      business_area: optionalText(body.business_area),
      department: optionalText(body.department),
      location_name: optionalText(body.location_name),
      hiring_manager_name: optionalText(body.hiring_manager_name),
      recruitment_lead_name: optionalText(body.recruitment_lead_name),
      employment_type: optionalText(body.employment_type),
      work_pattern: optionalText(body.work_pattern),
      hours_per_week: optionalNumber(body.hours_per_week),
      salary_min: optionalNumber(body.salary_min),
      salary_max: optionalNumber(body.salary_max),
      salary_period: optionalText(body.salary_period),
      salary_currency: optionalText(body.salary_currency) ?? "GBP",
      salary_visible: optionalBoolean(body.salary_visible, true),
      number_of_positions: optionalNumber(body.number_of_positions) ?? 1,
      status,
      approval_status: approvalStatus,
      opening_date: optionalDate(body.opening_date),
      closing_date: optionalDate(body.closing_date),
      target_start_date: optionalDate(body.target_start_date),
      is_internal_only: optionalBoolean(body.is_internal_only),
      accepts_internal_candidates: optionalBoolean(body.accepts_internal_candidates, true),
      blind_review_enabled: optionalBoolean(body.blind_review_enabled),
      ai_screening_enabled: optionalBoolean(body.ai_screening_enabled),
      safer_recruitment_required: optionalBoolean(body.safer_recruitment_required, true),
      regulated_role: optionalBoolean(body.regulated_role),
      requires_dbs: optionalBoolean(body.requires_dbs),
      requires_driving: optionalBoolean(body.requires_driving),
      requires_qualification_checks: optionalBoolean(body.requires_qualification_checks),
      reference_validation_required: optionalBoolean(body.reference_validation_required),
      required_reference_count: optionalNumber(body.required_reference_count) ?? 1,
      archived_at: null,
      published_at:
        status === "open"
          ? optionalDate(body.published_at) ?? now
          : null,
      created_by: access.user.id,
      updated_by: access.user.id,
      created_at: now,
      updated_at: now,
    };

    const result = await (supabase as any)
      .from("leo_talent_vacancies")
      .insert(insertPayload)
      .select("id, vacancy_reference, title, status")
      .single();

    if (result.error || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error?.message || "Leo could not create this vacancy.",
        },
        { status: 500 },
      );
    }

    await (supabase as any).from("talent_analytics_events").insert({
      organisation_id: access.organisationId,
      event_type:
        status === "open"
          ? "vacancy_opened"
          : status === "approval_required"
            ? "vacancy_submitted_for_approval"
            : "vacancy_created",
      entity_type: "vacancy",
      entity_id: result.data.id,
      actor_user_id: access.user.id,
      metadata: {
        vacancy_reference: result.data.vacancy_reference,
        vacancy_title: result.data.title,
      },
    });

    return NextResponse.json(
      {
        success: true,
        vacancy: result.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Vacancy create failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not create this vacancy.",
      },
      { status: 500 },
    );
  }
}