import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type VacancyStatus =
  | "draft"
  | "approval_required"
  | "approved"
  | "open"
  | "paused"
  | "closed"
  | "filled"
  | "cancelled"
  | "archived";

type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "returned"
  | "declined";

type UpdateVacancyBody = {
  status?: VacancyStatus;
  approval_status?: ApprovalStatus;
  title?: unknown;
  department?: unknown;
  location_name?: unknown;
  employment_type?: unknown;
  salary_min?: unknown;
  salary_max?: unknown;
  salary_currency?: unknown;
  salary_period?: unknown;
  advert_text?: unknown;
  description?: unknown;
  role_summary?: unknown;
  responsibilities?: unknown;
  essential_criteria?: unknown;
  desirable_criteria?: unknown;
  benefits?: unknown;
  hiring_manager_name?: unknown;
  metadata?: Record<string, unknown>;
  published_at?: string | null;
  opening_date?: string | null;
  closing_date?: string | null;
  archived_at?: string | null;
  target_start_date?: string | null;
  is_internal_only?: unknown;
  accepts_internal_candidates?: unknown;
  blind_review_enabled?: unknown;
  ai_screening_enabled?: unknown;
  safer_recruitment_required?: unknown;
  regulated_role?: unknown;
  requires_dbs?: unknown;
  requires_driving?: unknown;
  requires_qualification_checks?: unknown;
  required_reference_count?: unknown;
  salary_visible?: unknown;
  number_of_positions?: unknown;
  work_pattern?: unknown;
  hours_per_week?: unknown;
};

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const validStatuses = new Set<VacancyStatus>([
  "draft",
  "approval_required",
  "approved",
  "open",
  "paused",
  "closed",
  "filled",
  "cancelled",
  "archived",
]);

const validApprovalStatuses = new Set<ApprovalStatus>([
  "not_required",
  "pending",
  "approved",
  "returned",
  "declined",
]);

const employmentTypes = new Set([
  "permanent",
  "fixed_term",
  "temporary",
  "casual",
  "zero_hours",
  "apprenticeship",
  "internship",
  "contractor",
  "volunteer",
  "other",
]);

const salaryPeriods = new Set([
  "year",
  "month",
  "week",
  "day",
  "hour",
  "fixed",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();

  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";
  return "Employee";
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function optionalDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return trimmed;
}

async function getUserContext(
  supabase: any,
  userId: string,
  organisationId: string,
) {
  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId,
    organisationId,
    allowedStatuses: ["active"],
  });

  if (!resolvedRole) {
    return null;
  }

  return {
    userId,
    organisationId: resolvedRole.membership.organisation_id,
    role: normaliseRole(resolvedRole.roleKey),
  };
}

async function writeActivity(
  supabase: any,
  vacancy: Record<string, any>,
  userId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {},
) {
  const result = await supabase.from("talent_analytics_events").insert({
    organisation_id: vacancy.organisation_id ?? null,
    event_type: eventType,
    entity_type: "vacancy",
    entity_id: vacancy.id,
    actor_user_id: userId,
    description,
    metadata,
  });

  if (result.error) {
    console.warn("Vacancy activity could not be recorded:", result.error);
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Your session is unavailable. Please sign in again." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const vacancyId = id?.trim();

    if (!vacancyId) {
      return NextResponse.json(
        { success: false, error: "The vacancy reference is invalid." },
        { status: 400 },
      );
    }

    const result = await (supabase as any)
      .from("leo_talent_vacancies")
      .select("*")
      .eq("id", vacancyId)
      .single();

    if (result.error || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "The vacancy could not be found.",
        },
        { status: result.error?.code === "PGRST116" ? 404 : 500 },
      );
    }

    return NextResponse.json({ success: true, vacancy: result.data });
  } catch (error) {
    console.error("Vacancy loader failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The vacancy could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Your session is unavailable. Please sign in again." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const vacancyId = id?.trim();

    if (!vacancyId) {
      return NextResponse.json(
        { success: false, error: "The vacancy reference is invalid." },
        { status: 400 },
      );
    }

    const vacancyResult = await (supabase as any)
      .from("leo_talent_vacancies")
      .select("*")
      .eq("id", vacancyId)
      .single();

    if (vacancyResult.error || !vacancyResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: vacancyResult.error?.message || "The vacancy could not be found.",
        },
        { status: vacancyResult.error?.code === "PGRST116" ? 404 : 500 },
      );
    }

    const vacancy = vacancyResult.data as Record<string, any>;

    const targetOrganisationId =
      vacancy.organisation_id !== null && vacancy.organisation_id !== undefined
        ? String(vacancy.organisation_id)
        : "";

    const userContext = await getUserContext(
      supabase as any,
      user.id,
      targetOrganisationId,
    );

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this vacancy." },
        { status: 403 },
      );
    }

    if (roleRank[userContext.role] < roleRank.Manager) {
      return NextResponse.json(
        { success: false, error: "Manager, Senior or Owner access is required." },
        { status: 403 },
      );
    }

    if (
      userContext.organisationId !== null &&
      vacancy.organisation_id !== null &&
      String(userContext.organisationId) !== String(vacancy.organisation_id)
    ) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this vacancy." },
        { status: 403 },
      );
    }

    let body: UpdateVacancyBody;

    try {
      body = (await request.json()) as UpdateVacancyBody;
    } catch {
      return NextResponse.json(
        { success: false, error: "The vacancy update is invalid." },
        { status: 400 },
      );
    }

    if (body.status && !validStatuses.has(body.status)) {
      return NextResponse.json(
        { success: false, error: "The vacancy status is invalid." },
        { status: 400 },
      );
    }

    if (
      body.approval_status &&
      !validApprovalStatuses.has(body.approval_status)
    ) {
      return NextResponse.json(
        { success: false, error: "The approval status is invalid." },
        { status: 400 },
      );
    }

    if (
      body.approval_status !== undefined &&
      roleRank[userContext.role] < roleRank.Senior
    ) {
      return NextResponse.json(
        { success: false, error: "Senior or Owner access is required to record approval." },
        { status: 403 },
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    const supportedFields: Array<keyof UpdateVacancyBody> = [
      "title",
      "department",
      "location_name",
      "employment_type",
      "salary_min",
      "salary_max",
      "salary_currency",
      "salary_period",
      "advert_text",
      "description",
      "role_summary",
      "responsibilities",
      "essential_criteria",
      "desirable_criteria",
      "benefits",
      "hiring_manager_name",
      "opening_date",
      "closing_date",
      "target_start_date",
      "is_internal_only",
      "accepts_internal_candidates",
      "blind_review_enabled",
      "ai_screening_enabled",
      "safer_recruitment_required",
      "regulated_role",
      "requires_dbs",
      "requires_driving",
      "requires_qualification_checks",
      "required_reference_count",
      "salary_visible",
      "number_of_positions",
      "work_pattern",
      "hours_per_week",
      "status",
      "approval_status",
      "metadata",
      "published_at",
      "archived_at",
    ];

    const providedFields = Object.keys(body).filter((key) => key !== "approval_status" || body.approval_status !== undefined);

    for (const field of providedFields) {
      if (!supportedFields.includes(field as keyof UpdateVacancyBody)) {
        return NextResponse.json(
          { success: false, error: "No supported vacancy changes were provided." },
          { status: 400 },
        );
      }
    }

    if (body.title !== undefined) {
      const value = optionalText(body.title);
      if (!value || value.length > 160) {
        return NextResponse.json(
          { success: false, error: "The vacancy title is invalid." },
          { status: 400 },
        );
      }
      updates.title = value;
    }

    if (body.department !== undefined) updates.department = optionalText(body.department);
    if (body.location_name !== undefined) updates.location_name = optionalText(body.location_name);

    if (body.employment_type !== undefined) {
      const value = optionalText(body.employment_type)?.toLowerCase();
      if (!value || !employmentTypes.has(value)) {
        return NextResponse.json(
          { success: false, error: "The employment type is invalid." },
          { status: 400 },
        );
      }
      updates.employment_type = value;
    }

    if (body.salary_min !== undefined) {
      const value = optionalNumber(body.salary_min);
      if (value !== null && value < 0) {
        return NextResponse.json(
          { success: false, error: "The minimum salary is invalid." },
          { status: 400 },
        );
      }
      updates.salary_min = value;
    }

    if (body.salary_max !== undefined) {
      const value = optionalNumber(body.salary_max);
      if (value !== null && value < 0) {
        return NextResponse.json(
          { success: false, error: "The maximum salary is invalid." },
          { status: 400 },
        );
      }
      updates.salary_max = value;
    }

    if (
      body.salary_min !== undefined &&
      body.salary_max !== undefined &&
      optionalNumber(body.salary_min) !== null &&
      optionalNumber(body.salary_max) !== null &&
      Number(optionalNumber(body.salary_max)) < Number(optionalNumber(body.salary_min))
    ) {
      return NextResponse.json(
        { success: false, error: "The maximum salary must not be below the minimum." },
        { status: 400 },
      );
    }

    if (body.salary_currency !== undefined) {
      const value = optionalText(body.salary_currency)?.toUpperCase();
      if (!value || value.length !== 3) {
        return NextResponse.json(
          { success: false, error: "The salary currency is invalid." },
          { status: 400 },
        );
      }
      updates.salary_currency = value;
    }

    if (body.salary_period !== undefined) {
      const value = optionalText(body.salary_period)?.toLowerCase();
      if (value !== null && value !== undefined && !salaryPeriods.has(value)) {
        return NextResponse.json(
          { success: false, error: "The salary period is invalid." },
          { status: 400 },
        );
      }
      updates.salary_period = value ?? null;
    }

    if (body.advert_text !== undefined) updates.advert_text = optionalText(body.advert_text);
    if (body.description !== undefined) updates.advert_text = optionalText(body.description);
    if (body.role_summary !== undefined) updates.role_summary = optionalText(body.role_summary);
    if (body.responsibilities !== undefined) updates.responsibilities = optionalText(body.responsibilities);
    if (body.essential_criteria !== undefined) updates.essential_criteria = optionalText(body.essential_criteria);
    if (body.desirable_criteria !== undefined) updates.desirable_criteria = optionalText(body.desirable_criteria);
    if (body.benefits !== undefined) updates.benefits = optionalText(body.benefits);
    if (body.hiring_manager_name !== undefined) updates.hiring_manager_name = optionalText(body.hiring_manager_name);
    if (body.work_pattern !== undefined) updates.work_pattern = optionalText(body.work_pattern);

    if (body.hours_per_week !== undefined) {
      const value = optionalNumber(body.hours_per_week);
      if (value !== null && (value < 0 || value > 168)) {
        return NextResponse.json(
          { success: false, error: "The weekly hours value is invalid." },
          { status: 400 },
        );
      }
      updates.hours_per_week = value;
    }

    if (body.number_of_positions !== undefined) {
      const value = optionalNumber(body.number_of_positions);
      if (value === null || !Number.isInteger(value) || value < 1 || value > 1000) {
        return NextResponse.json(
          { success: false, error: "The positions value is invalid." },
          { status: 400 },
        );
      }
      updates.number_of_positions = value;
    }

    if (body.required_reference_count !== undefined) {
      const value = optionalNumber(body.required_reference_count);
      if (value === null || !Number.isInteger(value) || value < 0 || value > 5) {
        return NextResponse.json(
          { success: false, error: "The reference count is invalid." },
          { status: 400 },
        );
      }
      updates.required_reference_count = value;
    }

    for (const field of [
      "salary_visible",
      "is_internal_only",
      "accepts_internal_candidates",
      "blind_review_enabled",
      "ai_screening_enabled",
      "safer_recruitment_required",
      "regulated_role",
      "requires_dbs",
      "requires_driving",
      "requires_qualification_checks",
    ] as const) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== "boolean") {
          return NextResponse.json(
            { success: false, error: `The ${field.replaceAll("_", " ")} setting is invalid.` },
            { status: 400 },
          );
        }
        updates[field] = body[field];
      }
    }

    if (body.target_start_date !== undefined) {
      const value = optionalDate(body.target_start_date);
      if (value === undefined) {
        return NextResponse.json(
          { success: false, error: "The target start date is invalid." },
          { status: 400 },
        );
      }
      updates.target_start_date = value;
    }

    if (body.opening_date !== undefined) {
      const value = optionalDate(body.opening_date);
      if (value === undefined) {
        return NextResponse.json(
          { success: false, error: "The opening date is invalid." },
          { status: 400 },
        );
      }
      updates.opening_date = value;
    }

    if (body.closing_date !== undefined) {
      const value = optionalDate(body.closing_date);
      if (value === undefined) {
        return NextResponse.json(
          { success: false, error: "The closing date is invalid." },
          { status: 400 },
        );
      }
      updates.closing_date = value;
    }

    if (body.published_at !== undefined) {
      const value = optionalDate(body.published_at);
      if (value === undefined) {
        return NextResponse.json(
          { success: false, error: "The published date is invalid." },
          { status: 400 },
        );
      }
      updates.published_at = value;
    }

    if (body.archived_at !== undefined) {
      const value = optionalDate(body.archived_at);
      if (value === undefined) {
        return NextResponse.json(
          { success: false, error: "The archived date is invalid." },
          { status: 400 },
        );
      }
      updates.archived_at = value;
    }

    if (body.metadata !== undefined) updates.metadata = body.metadata;

    if (body.status !== undefined) updates.status = body.status;
    if (body.approval_status !== undefined) {
      updates.approval_status = body.approval_status;
    }

    if (updates.salary_min !== undefined && updates.salary_max !== undefined) {
      const minimum = updates.salary_min as number | null;
      const maximum = updates.salary_max as number | null;

      if (minimum !== null && maximum !== null && maximum < minimum) {
        return NextResponse.json(
          { success: false, error: "The maximum salary must not be below the minimum." },
          { status: 400 },
        );
      }
    }

    if (Object.keys(updates).length === 2) {
      return NextResponse.json(
        { success: false, error: "No supported vacancy changes were provided." },
        { status: 400 },
      );
    }

    const updateResult = await (supabase as any)
      .from("leo_talent_vacancies")
      .update(updates)
      .eq("id", vacancyId)
      .select("*")
      .single();

    if (updateResult.error || !updateResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: updateResult.error?.message || "The vacancy could not be updated.",
        },
        { status: 500 },
      );
    }

    const changedFields = Object.keys(updates).filter(
      (key) => !["updated_at", "updated_by"].includes(key),
    );

    await writeActivity(
      supabase as any,
      vacancy,
      user.id,
      "vacancy_updated",
      "Vacancy details were updated.",
      {
        changed_fields: changedFields,
        previous_status: vacancy.status ?? null,
        new_status: body.status ?? vacancy.status ?? null,
        previous_approval_status: vacancy.approval_status ?? null,
        new_approval_status:
          body.approval_status ?? vacancy.approval_status ?? null,
      },
    );

    return NextResponse.json({
      success: true,
      vacancy: updateResult.data,
    });
  } catch (error) {
    console.error("Vacancy update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The vacancy could not be updated.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Your session is unavailable. Please sign in again." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const vacancyId = id?.trim();

    if (!vacancyId) {
      return NextResponse.json(
        { success: false, error: "The vacancy reference is invalid." },
        { status: 400 },
      );
    }

    const vacancyResult = await (supabase as any)
      .from("leo_talent_vacancies")
      .select("*")
      .eq("id", vacancyId)
      .single();

    if (vacancyResult.error || !vacancyResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: vacancyResult.error?.message || "The vacancy could not be found.",
        },
        { status: vacancyResult.error?.code === "PGRST116" ? 404 : 500 },
      );
    }

    const vacancy = vacancyResult.data as Record<string, any>;

    const targetOrganisationId =
      vacancy.organisation_id !== null && vacancy.organisation_id !== undefined
        ? String(vacancy.organisation_id)
        : "";

    const userContext = await getUserContext(
      supabase as any,
      user.id,
      targetOrganisationId,
    );

    if (!userContext) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this vacancy." },
        { status: 403 },
      );
    }

    if (userContext.role !== "Owner") {
      return NextResponse.json(
        { success: false, error: "Only an Owner can permanently delete a vacancy." },
        { status: 403 },
      );
    }

    if (
      userContext.organisationId !== null &&
      vacancy.organisation_id !== null &&
      String(userContext.organisationId) !== String(vacancy.organisation_id)
    ) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this vacancy." },
        { status: 403 },
      );
    }

    const connectedTables = [
      "leo_talent_applications",
      "leo_talent_interviews",
      "leo_talent_offers",
    ];

    for (const tableName of connectedTables) {
      const result = await (supabase as any)
        .from(tableName)
        .select("id", { count: "exact", head: true })
        .eq("vacancy_id", vacancyId);

      if (result.error) {
        console.warn(`Could not check ${tableName} before vacancy deletion:`, result.error);
        continue;
      }

      if ((result.count ?? 0) > 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This vacancy has connected recruitment records and cannot be deleted. Archive it instead.",
          },
          { status: 409 },
        );
      }
    }

    const deleteResult = await (supabase as any)
      .from("leo_talent_vacancies")
      .delete()
      .eq("id", vacancyId);

    if (deleteResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: deleteResult.error.message || "The vacancy could not be deleted.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vacancy deletion failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The vacancy could not be deleted.",
      },
      { status: 500 },
    );
  }
}