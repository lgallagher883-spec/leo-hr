import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlatformRole = "owner" | "senior" | "manager" | "employee";
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

async function getAuthorisedContext(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: jsonError("Your session is unavailable. Please sign in again.", 401),
    };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;

  if (!organisationId) {
    return {
      error: jsonError(
        "Leo could not find an active organisation for your account.",
        403,
      ),
    };
  }

  const role = normaliseRole(resolvedRole?.roleKey);

  if (!writeRoles.has(role)) {
    return {
      error: jsonError("Manager, Senior or Owner access is required.", 403),
    };
  }

  return {
    user,
    organisationId: String(organisationId),
  };
}

async function loadVacancyForOrganisation(
  supabase: SupabaseClient,
  vacancyId: string,
  organisationId: string,
) {
  const result = await supabase
    .from("leo_talent_vacancies")
    .select("id, organisation_id")
    .eq("id", vacancyId)
    .maybeSingle();

  if (result.error) {
    return {
      error: jsonError(
        result.error.message || "The vacancy could not be loaded.",
        result.error.code === "PGRST116" ? 404 : 500,
      ),
    };
  }

  if (!result.data) {
    return {
      error: jsonError("The vacancy could not be found.", 404),
    };
  }

  if (
    result.data.organisation_id !== null &&
    String(result.data.organisation_id) !== organisationId
  ) {
    return {
      error: jsonError("You do not have access to this vacancy.", 403),
    };
  }

  return { vacancy: result.data as { id: string; organisation_id: string | null } };
}

type CreateQuestionBody = {
  question_text?: unknown;
  help_text?: unknown;
  question_type?: unknown;
  options?: unknown;
  is_required?: unknown;
  is_knockout?: unknown;
  knockout_rule?: unknown;
  blind_review_excluded?: unknown;
  display_order?: unknown;
  is_active?: unknown;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase);

    if ("error" in access) {
      return access.error;
    }

    const { id } = await context.params;
    const vacancyId = text(id);

    if (!vacancyId) {
      return jsonError("The vacancy reference is invalid.", 400);
    }

    const vacancyResult = await loadVacancyForOrganisation(
      supabase,
      vacancyId,
      access.organisationId,
    );

    if ("error" in vacancyResult) {
      return vacancyResult.error;
    }

    let body: CreateQuestionBody;

    try {
      body = (await request.json()) as CreateQuestionBody;
    } catch {
      return jsonError("The question details are invalid.", 400);
    }

    const questionText = text(body.question_text);
    const helpText = body.help_text === null ? null : text(body.help_text) || null;
    const questionType = text(body.question_type);
    const options = Array.isArray(body.options) ? body.options : [];
    const knockoutRule =
      body.knockout_rule &&
      typeof body.knockout_rule === "object" &&
      !Array.isArray(body.knockout_rule)
        ? (body.knockout_rule as Record<string, unknown>)
        : {};

    const isRequired = typeof body.is_required === "boolean" ? body.is_required : false;
    const isKnockout = typeof body.is_knockout === "boolean" ? body.is_knockout : false;
    const blindReviewExcluded =
      typeof body.blind_review_excluded === "boolean"
        ? body.blind_review_excluded
        : false;
    const isActive = typeof body.is_active === "boolean" ? body.is_active : true;

    const displayOrderNumber = Number(body.display_order);
    const displayOrder =
      Number.isFinite(displayOrderNumber) && displayOrderNumber >= 0
        ? Math.floor(displayOrderNumber)
        : 0;

    if (!questionText) {
      return jsonError("The application question text is required.", 400);
    }

    if (!questionType) {
      return jsonError("The application question type is required.", 400);
    }

    const now = new Date().toISOString();

    const insertResult = await supabase
      .from("leo_talent_vacancy_questions")
      .insert({
        organisation_id:
          vacancyResult.vacancy.organisation_id ?? access.organisationId,
        vacancy_id: vacancyResult.vacancy.id,
        question_text: questionText,
        help_text: helpText,
        question_type: questionType,
        options,
        is_required: isRequired,
        is_knockout: isKnockout,
        knockout_rule: knockoutRule,
        blind_review_excluded: blindReviewExcluded,
        display_order: displayOrder,
        is_active: isActive,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (insertResult.error || !insertResult.data) {
      return jsonError(
        insertResult.error?.message ||
          "The application question could not be added.",
        500,
      );
    }

    const activityResult = await supabase
      .from("talent_analytics_events")
      .insert({
        organisation_id:
          vacancyResult.vacancy.organisation_id ?? access.organisationId,
        event_type: "vacancy_question_added",
        entity_type: "vacancy",
        entity_id: vacancyResult.vacancy.id,
        actor_user_id: access.user.id,
        description: "Application question added.",
        metadata: {
          question: questionText,
        },
      });

    if (activityResult.error) {
      console.warn(
        "Vacancy question activity could not be recorded:",
        activityResult.error,
      );
    }

    return NextResponse.json({
      success: true,
      question: insertResult.data,
    });
  } catch (error) {
    console.error("Vacancy question create failed:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "The application question could not be added.",
      500,
    );
  }
}
