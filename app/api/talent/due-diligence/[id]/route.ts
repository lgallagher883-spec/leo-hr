import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PlatformRole = "owner" | "senior" | "manager" | "employee";

type SharedKey =
  | "identity_verification"
  | "right_to_work"
  | "references"
  | "dbs"
  | "overseas_checks"
  | "qualifications"
  | "professional_registrations"
  | "driving"
  | "vehicle"
  | "appointment_decision";

const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);
const decisionWriteRoles = new Set<PlatformRole>(["owner", "senior"]);
const sharedKeys = new Set<SharedKey>([
  "identity_verification",
  "right_to_work",
  "references",
  "dbs",
  "overseas_checks",
  "qualifications",
  "professional_registrations",
  "driving",
  "vehicle",
  "appointment_decision",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const result = text(value);
  return result || null;
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

  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  if (!resolvedRole) {
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
    organisationId: resolvedRole.membership.organisation_id,
    role: normaliseRole(resolvedRole.roleKey),
  };
}

function extractStatus(key: SharedKey, value: any): string | null {
  switch (key) {
    case "identity_verification":
    case "right_to_work":
    case "dbs":
    case "vehicle":
      return optionalText(value?.status);
    case "references":
    case "overseas_checks":
    case "qualifications":
    case "professional_registrations":
      return optionalText(value?.overallStatus);
    case "driving":
      return optionalText(value?.checkStatus);
    case "appointment_decision":
      return optionalText(value?.outcome);
  }
}

function isComplete(key: SharedKey, payload: any, vacancy: any) {
  if (key === "dbs" && !vacancy?.requires_dbs) return true;
  if (
    key === "overseas_checks" &&
    !vacancy?.overseas_check_required_if_applicable
  )
    return true;
  if (key === "qualifications" && !vacancy?.requires_qualification_checks)
    return true;
  if (key === "driving" && !vacancy?.requires_driving) return true;
  if (key === "vehicle" && !vacancy?.requires_driving) return true;

  const status = extractStatus(key, payload);

  return [
    "verified",
    "complete",
    "satisfactory",
    "active",
    "approved",
    "not_required",
    "cleared",
    "cleared_with_conditions",
  ].includes(status ?? "");
}

function hasPopulatedPayload(value: unknown) {
  if (!value || typeof value !== "object") return false;
  return Object.keys(value as Record<string, unknown>).length > 0;
}

function normaliseDecisionOutcome(value: unknown) {
  const outcome = text(value).toLowerCase();
  if (outcome === "ready_for_appointment") return "ready_for_appointment";
  if (outcome === "not_ready") return "not_ready";
  if (outcome === "withdrawn") return "withdrawn";
  return "pending";
}

function mergePayload(
  existingPayload: Record<string, unknown> | null,
  nextPayload: Record<string, unknown>,
) {
  return {
    ...(existingPayload ?? {}),
    ...nextPayload,
  };
}

async function getProfile(supabase: any, organisationId: string, id: string) {
  return (supabase as any)
    .from("leo_talent_safer_recruitment_profiles")
    .select("*")
    .eq("id", id)
    .eq("organisation_id", organisationId)
    .maybeSingle();
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) return access.error;

    const profileResult = await getProfile(
      supabase,
      access.organisationId,
      id,
    );

    if (profileResult.error) throw new Error(profileResult.error.message);

    if (!profileResult.data) {
      return NextResponse.json(
        { success: false, error: "The due diligence record was not found." },
        { status: 404 },
      );
    }

    const profile = profileResult.data;

    const [sharedResult, documentsResult] = await Promise.all([
      (supabase as any)
        .from("leo_talent_candidate_shared_records")
        .select("id,component_key,payload,status,completed_at,updated_at")
        .eq("organisation_id", access.organisationId)
        .eq("candidate_id", profile.candidate_id)
        .eq("application_id", profile.application_id),
      (supabase as any)
        .from("leo_talent_candidate_documents")
        .select(
          "id,title,document_type,file_name,created_at,verified_by,verification_notes",
        )
        .eq("organisation_id", access.organisationId)
        .eq("candidate_id", profile.candidate_id)
        .order("created_at", { ascending: false }),
    ]);

    if (sharedResult.error) throw new Error(sharedResult.error.message);
    if (documentsResult.error) throw new Error(documentsResult.error.message);

    return NextResponse.json({
      success: true,
      sharedRecords: sharedResult.data ?? [],
      documents: documentsResult.data ?? [],
    });
  } catch (error) {
    console.error("Due diligence detail loading failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Candidate due diligence details could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) return access.error;

    if (!writeRoles.has(access.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update due diligence records.",
        },
        { status: 403 },
      );
    }

    const profileResult = await getProfile(
      supabase,
      access.organisationId,
      id,
    );

    if (profileResult.error) throw new Error(profileResult.error.message);

    if (!profileResult.data) {
      return NextResponse.json(
        { success: false, error: "The due diligence record was not found." },
        { status: 404 },
      );
    }

    const profile = profileResult.data;
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action);
    const now = new Date().toISOString();

    if (action === "save_personal") {
      const value = (body.value ?? {}) as Record<string, unknown>;
      const firstName = text(value.firstName);
      const lastName = text(value.lastName);

      if (!firstName || !lastName) {
        return NextResponse.json(
          {
            success: false,
            error: "The candidate's first name and last name are required.",
          },
          { status: 400 },
        );
      }

      const candidateUpdate = {
        first_name: firstName,
        middle_names: optionalText(value.middleNames),
        last_name: lastName,
        preferred_name: optionalText(value.preferredName),
        email: optionalText(value.personalEmail),
        phone: optionalText(value.personalTelephone),
        country: optionalText(value.country),
        updated_at: now,
      };

      const candidateResult = await (supabase as any)
        .from("leo_talent_candidates")
        .update(candidateUpdate)
        .eq("id", profile.candidate_id)
        .eq("organisation_id", access.organisationId)
        .select(
          "id,candidate_reference,first_name,middle_names,last_name,preferred_name,email,phone,country",
        )
        .single();

      if (candidateResult.error) {
        throw new Error(
          candidateResult.error.message ||
            "Personal details could not be saved.",
        );
      }

      return NextResponse.json({
        success: true,
        candidate: candidateResult.data,
      });
    }

    if (action === "save_shared") {
      const key = text(body.key) as SharedKey;

      if (!sharedKeys.has(key)) {
        return NextResponse.json(
          { success: false, error: "The due diligence record type is invalid." },
          { status: 400 },
        );
      }

      const payload =
        body.value && typeof body.value === "object"
          ? (body.value as Record<string, unknown>)
          : {};

      if (key === "appointment_decision" && !decisionWriteRoles.has(access.role)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only Owner and Senior users can change the appointment decision.",
          },
          { status: 403 },
        );
      }

      const effectivePayload =
        key === "appointment_decision"
          ? {
              ...payload,
              outcome: normaliseDecisionOutcome(payload.outcome),
              decisionDate:
                optionalText(payload.decisionDate) ??
                optionalText(payload.decidedAt) ??
                now.slice(0, 10),
              decidedBy:
                optionalText(payload.decidedBy) ??
                optionalText(payload.decided_by) ??
                access.user.id,
              decidedAt:
                optionalText(payload.decidedAt) ??
                optionalText(payload.decided_at) ??
                now,
              notes:
                optionalText(payload.notes) ??
                optionalText(payload.rationale) ??
                optionalText(payload.reason) ??
                null,
              decisionReason:
                optionalText(payload.decisionReason) ??
                optionalText(payload.reason) ??
                optionalText(payload.rationale) ??
                null,
            }
          : payload;

      const vacancyResult = await (supabase as any)
        .from("leo_talent_vacancies")
        .select(
          "requires_dbs,requires_driving,requires_qualification_checks,overseas_check_required_if_applicable",
        )
        .eq("id", profile.vacancy_id)
        .eq("organisation_id", access.organisationId)
        .maybeSingle();

      if (vacancyResult.error) throw new Error(vacancyResult.error.message);

      const status = extractStatus(key, effectivePayload);
      const complete = isComplete(key, effectivePayload, vacancyResult.data);

      const existingSharedResult = await (supabase as any)
        .from("leo_talent_candidate_shared_records")
        .select(
          "id,component_key,payload,status,completed_at,updated_at,vacancy_id,safer_recruitment_profile_id",
        )
        .eq("organisation_id", access.organisationId)
        .eq("candidate_id", profile.candidate_id)
        .eq("application_id", profile.application_id)
        .eq("component_key", key)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (existingSharedResult.error) {
        throw new Error(
          existingSharedResult.error.message ||
            "The existing due diligence record could not be checked.",
        );
      }

      const existingShared =
        Array.isArray(existingSharedResult.data) &&
        existingSharedResult.data.length > 0
          ? existingSharedResult.data[0]
          : null;

      const keepCompletedData =
        key !== "appointment_decision" &&
        Boolean(existingShared?.completed_at) &&
        hasPopulatedPayload(existingShared?.payload);

      const nextStatus =
        keepCompletedData && !complete
          ? existingShared?.status ?? status
          : status;
      const nextCompletedAt =
        existingShared?.completed_at ?? (complete ? now : null);

      const mergedPayload = mergePayload(
        (existingShared?.payload as Record<string, unknown> | null) ?? null,
        effectivePayload,
      );

      let sharedResult;

      if (existingShared?.id) {
        const updatePayload: Record<string, unknown> = {
          status: nextStatus,
          completed_at: nextCompletedAt,
          updated_at: now,
        };

        updatePayload.payload = mergedPayload;

        if (!existingShared.vacancy_id) {
          updatePayload.vacancy_id = profile.vacancy_id;
        }
        if (!existingShared.safer_recruitment_profile_id) {
          updatePayload.safer_recruitment_profile_id = profile.id;
        }

        sharedResult = await (supabase as any)
          .from("leo_talent_candidate_shared_records")
          .update(updatePayload)
          .eq("id", existingShared.id)
          .eq("organisation_id", access.organisationId)
          .select("id,component_key,payload,status,completed_at,updated_at")
          .single();
      } else {
        sharedResult = await (supabase as any)
          .from("leo_talent_candidate_shared_records")
          .insert({
            organisation_id: access.organisationId,
            candidate_id: profile.candidate_id,
            application_id: profile.application_id,
            vacancy_id: profile.vacancy_id,
            safer_recruitment_profile_id: profile.id,
            component_key: key,
            payload: effectivePayload,
            status,
            completed_at: complete ? now : null,
            updated_at: now,
          })
          .select("id,component_key,payload,status,completed_at,updated_at")
          .single();

        if (sharedResult.error && sharedResult.error.code === "23505") {
          const recovered = await (supabase as any)
            .from("leo_talent_candidate_shared_records")
            .select("id")
            .eq("organisation_id", access.organisationId)
            .eq("candidate_id", profile.candidate_id)
            .eq("application_id", profile.application_id)
            .eq("component_key", key)
            .order("updated_at", { ascending: false })
            .limit(1);

          if (recovered.error) {
            throw new Error(recovered.error.message);
          }

          const recoveredId =
            Array.isArray(recovered.data) && recovered.data.length > 0
              ? recovered.data[0]?.id
              : null;

          if (!recoveredId) {
            throw new Error("The due diligence record could not be recovered.");
          }

          sharedResult = await (supabase as any)
            .from("leo_talent_candidate_shared_records")
            .update({
              payload: mergedPayload,
              status: keepCompletedData && !complete ? existingShared?.status ?? status : status,
              completed_at:
                keepCompletedData && !complete
                  ? existingShared?.completed_at ?? null
                  : complete
                    ? now
                    : null,
              updated_at: now,
            })
            .eq("id", recoveredId)
            .eq("organisation_id", access.organisationId)
            .select("id,component_key,payload,status,completed_at,updated_at")
            .single();
        }
      }

      if (sharedResult.error) {
        throw new Error(
          sharedResult.error.message || "The record could not be saved.",
        );
      }

      const profileUpdate = await (supabase as any)
        .from("leo_talent_safer_recruitment_profiles")
        .update({ status: "in_progress", updated_at: now })
        .eq("id", profile.id)
        .eq("organisation_id", access.organisationId);

      if (profileUpdate.error) {
        console.warn(
          "Due diligence record saved but profile status was not updated:",
          profileUpdate.error,
        );
      }

      if (key === "appointment_decision") {
        const outcome = normaliseDecisionOutcome(
          (sharedResult.data?.payload as Record<string, unknown> | null)
            ?.outcome,
        );
        const payloadData =
          (sharedResult.data?.payload as Record<string, unknown> | null) ?? {};

        const { error: auditError } = await (supabase as any)
          .from("talent_analytics_events")
          .insert({
            organisation_id: access.organisationId,
            event_type: "appointment_decision_override_updated",
            entity_type: "application",
            entity_id: profile.application_id,
            actor_user_id: access.user.id,
            description: `Appointment decision set to ${outcome.replaceAll("_", " ")}.`,
            metadata: {
              profile_id: profile.id,
              candidate_id: profile.candidate_id,
              vacancy_id: profile.vacancy_id,
              outcome,
              decided_at: payloadData.decidedAt ?? now,
              decided_by: payloadData.decidedBy ?? access.user.id,
              notes: payloadData.notes ?? payloadData.decisionReason ?? null,
            },
          });

        if (auditError) {
          console.warn(
            "Appointment decision audit event could not be recorded:",
            auditError,
          );
        }
      }

      return NextResponse.json({
        success: true,
        sharedRecord: sharedResult.data,
      });
    }

    return NextResponse.json(
      { success: false, error: "The requested due diligence action is invalid." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Due diligence update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The due diligence record could not be saved.",
      },
      { status: 500 },
    );
  }
}