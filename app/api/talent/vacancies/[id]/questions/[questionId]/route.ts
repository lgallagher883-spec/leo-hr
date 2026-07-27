import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
    questionId: string;
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

async function loadQuestionForVacancy(
  supabase: SupabaseClient,
  questionId: string,
  vacancyId: string,
  organisationId: string,
) {
  const result = await supabase
    .from("leo_talent_vacancy_questions")
    .select("id, vacancy_id, organisation_id, question_text")
    .eq("id", questionId)
    .eq("vacancy_id", vacancyId)
    .maybeSingle();

  if (result.error) {
    return {
      error: jsonError(
        result.error.message || "The application question could not be loaded.",
        result.error.code === "PGRST116" ? 404 : 500,
      ),
    };
  }

  if (!result.data) {
    return {
      error: jsonError("The application question could not be found.", 404),
    };
  }

  if (
    result.data.organisation_id !== null &&
    String(result.data.organisation_id) !== organisationId
  ) {
    return {
      error: jsonError("You do not have access to this application question.", 403),
    };
  }

  return {
    question: result.data as {
      id: string;
      vacancy_id: string;
      organisation_id: string | null;
      question_text: string;
    },
  };
}

type UpdateQuestionBody = {
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase);

    if ("error" in access) {
      return access.error;
    }

    const { id, questionId } = await context.params;
    const vacancyId = text(id);
    const parsedQuestionId = text(questionId);

    if (!vacancyId) {
      return jsonError("The vacancy reference is invalid.", 400);
    }

    if (!parsedQuestionId) {
      return jsonError("The question reference is invalid.", 400);
    }

    const vacancyResult = await loadVacancyForOrganisation(
      supabase,
      vacancyId,
      access.organisationId,
    );

    if ("error" in vacancyResult) {
      return vacancyResult.error;
    }

    const questionResult = await loadQuestionForVacancy(
      supabase,
      parsedQuestionId,
      vacancyResult.vacancy.id,
      access.organisationId,
    );

    if ("error" in questionResult) {
      return questionResult.error;
    }

    let body: UpdateQuestionBody;

    try {
      body = (await request.json()) as UpdateQuestionBody;
    } catch {
      return jsonError("The question update is invalid.", 400);
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.question_text !== undefined) {
      const value = text(body.question_text);
      if (!value) {
        return jsonError("The application question text is required.", 400);
      }
      updates.question_text = value;
    }

    if (body.help_text !== undefined) {
      updates.help_text = body.help_text === null ? null : text(body.help_text) || null;
    }

    if (body.question_type !== undefined) {
      const value = text(body.question_type);
      if (!value) {
        return jsonError("The application question type is required.", 400);
      }
      updates.question_type = value;
    }

    if (body.options !== undefined) {
      if (!Array.isArray(body.options)) {
        return jsonError("The question options are invalid.", 400);
      }
      updates.options = body.options;
    }

    if (body.is_required !== undefined) {
      if (typeof body.is_required !== "boolean") {
        return jsonError("The required flag is invalid.", 400);
      }
      updates.is_required = body.is_required;
    }

    if (body.is_knockout !== undefined) {
      if (typeof body.is_knockout !== "boolean") {
        return jsonError("The knockout flag is invalid.", 400);
      }
      updates.is_knockout = body.is_knockout;
    }

    if (body.knockout_rule !== undefined) {
      if (
        body.knockout_rule !== null &&
        (typeof body.knockout_rule !== "object" || Array.isArray(body.knockout_rule))
      ) {
        return jsonError("The knockout rule is invalid.", 400);
      }

      updates.knockout_rule = body.knockout_rule ?? {};
    }

    if (body.blind_review_excluded !== undefined) {
      if (typeof body.blind_review_excluded !== "boolean") {
        return jsonError("The blind review setting is invalid.", 400);
      }
      updates.blind_review_excluded = body.blind_review_excluded;
    }

    if (body.display_order !== undefined) {
      const orderNumber = Number(body.display_order);
      if (!Number.isFinite(orderNumber) || orderNumber < 0) {
        return jsonError("The question order is invalid.", 400);
      }
      updates.display_order = Math.floor(orderNumber);
    }

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        return jsonError("The question active state is invalid.", 400);
      }
      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 1) {
      return jsonError("No supported question changes were provided.", 400);
    }

    const updateResult = await supabase
      .from("leo_talent_vacancy_questions")
      .update(updates)
      .eq("id", questionResult.question.id)
      .eq("vacancy_id", vacancyResult.vacancy.id)
      .select("*")
      .single();

    if (updateResult.error || !updateResult.data) {
      return jsonError(
        updateResult.error?.message ||
          "The application question could not be updated.",
        500,
      );
    }

    return NextResponse.json({
      success: true,
      question: updateResult.data,
    });
  } catch (error) {
    console.error("Vacancy question update failed:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "The application question could not be updated.",
      500,
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase);

    if ("error" in access) {
      return access.error;
    }

    const { id, questionId } = await context.params;
    const vacancyId = text(id);
    const parsedQuestionId = text(questionId);

    if (!vacancyId) {
      return jsonError("The vacancy reference is invalid.", 400);
    }

    if (!parsedQuestionId) {
      return jsonError("The question reference is invalid.", 400);
    }

    const vacancyResult = await loadVacancyForOrganisation(
      supabase,
      vacancyId,
      access.organisationId,
    );

    if ("error" in vacancyResult) {
      return vacancyResult.error;
    }

    const questionResult = await loadQuestionForVacancy(
      supabase,
      parsedQuestionId,
      vacancyResult.vacancy.id,
      access.organisationId,
    );

    if ("error" in questionResult) {
      return questionResult.error;
    }

    const deleteResult = await supabase
      .from("leo_talent_vacancy_questions")
      .delete()
      .eq("id", questionResult.question.id)
      .eq("vacancy_id", vacancyResult.vacancy.id);

    if (deleteResult.error) {
      return jsonError(
        deleteResult.error.message ||
          "The application question could not be deleted.",
        500,
      );
    }

    const activityResult = await supabase
      .from("talent_analytics_events")
      .insert({
        organisation_id:
          questionResult.question.organisation_id ?? access.organisationId,
        event_type: "vacancy_question_deleted",
        entity_type: "vacancy",
        entity_id: vacancyResult.vacancy.id,
        actor_user_id: access.user.id,
        description: "Application question deleted.",
        metadata: {
          question: questionResult.question.question_text,
        },
      });

    if (activityResult.error) {
      console.warn(
        "Vacancy question activity could not be recorded:",
        activityResult.error,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vacancy question delete failed:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "The application question could not be deleted.",
      500,
    );
  }
}
