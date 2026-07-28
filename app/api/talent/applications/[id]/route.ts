import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedStatuses = new Set([
  "draft",
  "submitted",
  "active",
  "on_hold",
  "withdrawn",
  "rejected",
  "unsuccessful",
  "offered",
  "appointed",
]);

type PlatformRole = "owner" | "senior" | "manager" | "employee";

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

async function getAuthorisedContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  minimumRole: PlatformRole,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        { success: false, error: "You are not signed in." },
        { status: 401 },
      ),
    };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;
  const role = normaliseRole(resolvedRole?.roleKey);

  if (!organisationId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Leo could not find an active organisation for your account.",
        },
        { status: 403 },
      ),
    };
  }

  if (roleRank[role] < roleRank[minimumRole]) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have access to update applications.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    organisationId,
  };
}

async function ensureDueDiligenceProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  application: {
    id: string;
    organisation_id: string | null;
    vacancy_id: string;
    candidate_id: string;
    vacancy: {
      organisation_id: string | null;
      safer_recruitment_required: boolean;
      requires_dbs: boolean;
      dbs_level: string | null;
      required_reference_count: number;
      overseas_check_required_if_applicable: boolean;
    } | null;
  },
) {
  const organisationId =
    application.organisation_id ?? application.vacancy?.organisation_id ?? null;

  if (!organisationId) {
    throw new Error(
      "This application is not linked to an organisation, so its due diligence profile could not be created.",
    );
  }

  const now = new Date().toISOString();

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("leo_talent_safer_recruitment_profiles")
    .select("id")
    .eq("application_id", application.id)
    .maybeSingle();

  if (existingProfileError) throw existingProfileError;

  let profileId = existingProfile?.id ?? null;

  if (!profileId) {
    const { data: createdProfile, error: profileInsertError } = await supabase
      .from("leo_talent_safer_recruitment_profiles")
      .insert({
        organisation_id: organisationId,
        application_id: application.id,
        vacancy_id: application.vacancy_id,
        candidate_id: application.candidate_id,
        status: "in_progress",
        overall_risk_level: "not_assessed",
        review_required:
          application.vacancy?.safer_recruitment_required ?? false,
        updated_at: now,
      } as never)
      .select("id")
      .single();

    if (profileInsertError) {
      if (profileInsertError.code !== "23505") throw profileInsertError;

      const { data: recoveredProfile, error: recoveryError } = await supabase
        .from("leo_talent_safer_recruitment_profiles")
        .select("id")
        .eq("application_id", application.id)
        .single();

      if (recoveryError || !recoveredProfile?.id) {
        throw recoveryError ?? profileInsertError;
      }

      profileId = recoveredProfile.id;
    } else {
      profileId = createdProfile?.id ?? null;
    }
  }

  if (!profileId) {
    throw new Error("Leo could not retrieve the due diligence profile identifier.");
  }

  async function ensureSingleCheck(
    tableName:
      | "leo_talent_identity_checks"
      | "leo_talent_right_to_work_checks"
      | "leo_talent_dbs_checks"
      | "leo_talent_overseas_checks",
    payload: Record<string, unknown>,
  ) {
    const { data: existingCheck, error: lookupError } = await (supabase as any)
      .from(tableName)
      .select("id")
      .eq("safer_recruitment_profile_id", profileId)
      .limit(1)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existingCheck?.id) return;

    const { error: insertError } = await (supabase as any)
      .from(tableName)
      .insert({
        organisation_id: organisationId,
        safer_recruitment_profile_id: profileId,
        ...payload,
      });

    if (insertError && insertError.code !== "23505") throw insertError;
  }

  await ensureSingleCheck("leo_talent_identity_checks", {
    document_type: "Passport",
    status: "pending",
  });

  await ensureSingleCheck("leo_talent_right_to_work_checks", {
    check_type: "manual",
    right_to_work_status: "pending",
  });

  const requiredReferenceCount = Math.max(
    1,
    Math.min(application.vacancy?.required_reference_count ?? 2, 5),
  );

  const { data: existingReferences, error: referencesLookupError } =
    await supabase
      .from("leo_talent_references")
      .select("reference_number")
      .eq("safer_recruitment_profile_id", profileId);

  if (referencesLookupError) throw referencesLookupError;

  const existingNumbers = new Set(
    (existingReferences ?? []).map((item) => item.reference_number),
  );

  const missingReferences = Array.from(
    { length: requiredReferenceCount },
    (_, index) => index + 1,
  )
    .filter((number) => !existingNumbers.has(number))
    .map((number) => ({
      organisation_id: organisationId,
      safer_recruitment_profile_id: profileId,
      reference_number: number,
      referee_name: `Referee ${number}`,
      request_status: "not_requested",
      phone_verification_required: true,
      phone_verification_status: "not_started",
      outcome: "pending",
    }));

  if (missingReferences.length > 0) {
    const { error: referencesInsertError } = await supabase
      .from("leo_talent_references")
      .insert(missingReferences as never);

    if (referencesInsertError && referencesInsertError.code !== "23505") {
      throw referencesInsertError;
    }
  }

  await ensureSingleCheck("leo_talent_dbs_checks", {
    dbs_level: application.vacancy?.dbs_level || "enhanced",
    status: application.vacancy?.requires_dbs
      ? "application_required"
      : "not_required",
  });

  if (application.vacancy?.overseas_check_required_if_applicable) {
    await ensureSingleCheck("leo_talent_overseas_checks", {
      country: "Not recorded",
      status: "not_started",
    });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const applicationId = id?.trim();

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "The application reference is invalid." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const access = await getAuthorisedContext(supabase, "manager");

    if ("response" in access) {
      return access.response;
    }

    const body = (await request.json().catch(() => ({}))) as {
      currentStageKey?: string;
      status?: string;
    };

    const currentStageKey = body.currentStageKey?.trim();
    const status = body.status?.trim();

    if (!currentStageKey || !status || !allowedStatuses.has(status)) {
      return NextResponse.json(
        { success: false, error: "A valid stage and status are required." },
        { status: 400 },
      );
    }

    const { data: application, error: applicationError } = await supabase
      .from("leo_talent_applications")
      .select(`
        id,
        organisation_id,
        vacancy_id,
        candidate_id,
        current_stage_key,
        status,
        withdrawn_at,
        closed_at,
        vacancy:leo_talent_vacancies (
          organisation_id,
          safer_recruitment_required,
          requires_dbs,
          dbs_level,
          required_reference_count,
          overseas_check_required_if_applicable
        )
      `)
      .eq("id", applicationId)
      .eq("organisation_id", access.organisationId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { success: false, error: "The application could not be found." },
        { status: applicationError?.code === "PGRST116" ? 404 : 500 },
      );
    }

    const vacancy = Array.isArray(application.vacancy)
      ? application.vacancy[0] ?? null
      : application.vacancy;

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      current_stage_key: currentStageKey,
      status,
      last_reviewed_at: now,
      last_reviewed_by: access.user.id,
      updated_at: now,
      updated_by: access.user.id,
    };

    if (status === "withdrawn") {
      updatePayload.withdrawn_at = application.withdrawn_at ?? now;
    } else if (application.status === "withdrawn") {
      updatePayload.withdrawn_at = null;
      updatePayload.withdrawal_reason = null;
    }

    if (["rejected", "unsuccessful", "appointed"].includes(status)) {
      updatePayload.closed_at = application.closed_at ?? now;
    } else if (
      ["withdrawn", "rejected", "unsuccessful", "appointed"].includes(
        application.status,
      )
    ) {
      updatePayload.closed_at = null;
      updatePayload.closed_reason = null;
    }

    const { data: updated, error: updateError } = await supabase
      .from("leo_talent_applications")
      .update(updatePayload as never)
      .eq("id", applicationId)
      .eq("organisation_id", access.organisationId)
      .select("id, application_reference, current_stage_key, status")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: `Leo could not save the application changes. ${updateError.message}`,
        },
        { status: 500 },
      );
    }

    let dueDiligenceReady = false;

    if (currentStageKey === "checks") {
      try {
        await ensureDueDiligenceProfile(supabase, {
          ...application,
          vacancy,
        });
        dueDiligenceReady = true;
      } catch (profileError) {
        return NextResponse.json(
          {
            success: false,
            saved: true,
            application: updated,
            error:
              profileError instanceof Error
                ? `${updated.application_reference} was moved to Pre-emp Checks, but its due diligence profile could not be prepared. ${profileError.message}`
                : `${updated.application_reference} was moved to Pre-emp Checks, but its due diligence profile could not be prepared.`,
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      application: updated,
      message: dueDiligenceReady
        ? `${updated.application_reference} was updated and its due diligence profile is ready.`
        : `${updated.application_reference} was updated successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not save the application changes.",
      },
      { status: 500 },
    );
  }
}