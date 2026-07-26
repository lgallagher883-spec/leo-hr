import { NextResponse } from "next/server";

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
  metadata?: Record<string, unknown>;
  published_at?: string | null;
  opening_date?: string | null;
  closing_date?: string | null;
  archived_at?: string | null;
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

async function getUserContext(supabase: any, userId: string) {
  let profile: Record<string, unknown> | null = null;

  for (const column of ["user_id", "auth_user_id", "id"]) {
    const result = await supabase
      .from("user_profiles")
      .select("*")
      .eq(column, userId)
      .limit(1);

    if (!result.error && Array.isArray(result.data) && result.data.length > 0) {
      profile = result.data[0] as Record<string, unknown>;
      break;
    }
  }

  return {
    userId,
    organisationId:
      (profile?.organisation_id as string | number | null) ?? null,
    role: normaliseRole(
      profile?.platform_role ?? profile?.role ?? profile?.access_level,
    ),
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

    const userContext = await getUserContext(supabase as any, user.id);

    if (roleRank[userContext.role] < roleRank.Manager) {
      return NextResponse.json(
        { success: false, error: "Manager, Senior or Owner access is required." },
        { status: 403 },
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

    if (body.status !== undefined) updates.status = body.status;
    if (body.approval_status !== undefined) {
      updates.approval_status = body.approval_status;
    }
    if (body.metadata !== undefined) updates.metadata = body.metadata;
    if (body.published_at !== undefined) {
      updates.published_at = body.published_at;
    }
    if (body.opening_date !== undefined) {
      updates.opening_date = body.opening_date;
    }
    if (body.closing_date !== undefined) {
      updates.closing_date = body.closing_date;
    }
    if (body.archived_at !== undefined) {
      updates.archived_at = body.archived_at;
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

    const userContext = await getUserContext(supabase as any, user.id);

    if (userContext.role !== "Owner") {
      return NextResponse.json(
        { success: false, error: "Only an Owner can permanently delete a vacancy." },
        { status: 403 },
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