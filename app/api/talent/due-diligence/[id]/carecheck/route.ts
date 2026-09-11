import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { sendCareCheckCandidateInvite } from "@/lib/carecheck/candidate-invite";
import { pullCareCheckApplicationStatus } from "@/lib/carecheck/status-pull";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PlatformRole = "owner" | "senior" | "manager" | "employee";

const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function careCheckReference(value: unknown, fallback: string): string {
  const normalised = text(value).replace(/[^A-Za-z0-9_]/g, "");
  return normalised || fallback.replace(/[^A-Za-z0-9_]/g, "");
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

  const role = normaliseRole(resolvedRole.roleKey);

  if (!writeRoles.has(role)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "You do not have permission to manage CareCheck checks.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    organisationId: resolvedRole.membership.organisation_id,
    role,
  };
}

async function loadContext(
  supabase: any,
  organisationId: string,
  profileId: string,
) {
  const profileResult = await (supabase as any)
    .from("leo_talent_safer_recruitment_profiles")
    .select("id,organisation_id,application_id,vacancy_id,candidate_id")
    .eq("id", profileId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (profileResult.error) throw new Error(profileResult.error.message);
  if (!profileResult.data) return null;

  const profile = profileResult.data;

  const [candidateResult, applicationResult, vacancyResult, sharedResult] =
    await Promise.all([
      (supabase as any)
        .from("leo_talent_candidates")
        .select("id,candidate_reference,first_name,last_name,email")
        .eq("id", profile.candidate_id)
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      (supabase as any)
        .from("leo_talent_applications")
        .select("id,application_reference")
        .eq("id", profile.application_id)
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      (supabase as any)
        .from("leo_talent_vacancies")
        .select("id,requires_dbs,dbs_level")
        .eq("id", profile.vacancy_id)
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      (supabase as any)
        .from("leo_talent_candidate_shared_records")
        .select("id,payload,status,completed_at")
        .eq("organisation_id", organisationId)
        .eq("candidate_id", profile.candidate_id)
        .eq("application_id", profile.application_id)
        .eq("component_key", "dbs")
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

  if (candidateResult.error) throw new Error(candidateResult.error.message);
  if (applicationResult.error) throw new Error(applicationResult.error.message);
  if (vacancyResult.error) throw new Error(vacancyResult.error.message);
  if (sharedResult.error) throw new Error(sharedResult.error.message);

  return {
    profile,
    candidate: candidateResult.data,
    application: applicationResult.data,
    vacancy: vacancyResult.data,
    shared:
      Array.isArray(sharedResult.data) && sharedResult.data.length > 0
        ? sharedResult.data[0]
        : null,
  };
}

function leoDbsStatusForCareCheck(providerStatus: unknown): string {
  const status = text(providerStatus).toUpperCase();

  if (!status) return "not_started";
  if (status.includes("INVITE")) return "candidate_invited";
  if (status.includes("SUBMIT") || status.includes("APPLICATION")) return "application_submitted";
  if (status.includes("CERTIFICATE") && (status.includes("AWAIT") || status.includes("PENDING"))) {
    return "awaiting_certificate";
  }
  if (status.includes("VERIFY") || status.includes("VERIFICATION")) return "awaiting_verification";
  if (status.includes("COMPLETE") || status.includes("COMPLETED") || status.includes("ISSUED")) {
    return "awaiting_verification";
  }
  if (status.includes("REVIEW") || status.includes("DISCLOS")) return "further_review_required";

  return "application_submitted";
}

async function saveCareCheckState({
  supabase,
  organisationId,
  userId,
  context,
  careCheck,
}: {
  supabase: any;
  organisationId: string;
  userId: string;
  context: NonNullable<Awaited<ReturnType<typeof loadContext>>>;
  careCheck: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const existingPayload =
    context.shared?.payload && typeof context.shared.payload === "object"
      ? (context.shared.payload as Record<string, unknown>)
      : {};

  const leoStatus = leoDbsStatusForCareCheck(careCheck.statusCode);
  const nextPayload = {
    ...existingPayload,
    roleRequiresDBS: Boolean(context.vacancy?.requires_dbs),
    requirement: context.vacancy?.requires_dbs
      ? (context.vacancy?.dbs_level ?? existingPayload.requirement ?? "enhanced")
      : "not_required",
    status: leoStatus,
    applicationReference:
      text(careCheck.applicationReference) || text(existingPayload.applicationReference),
    applicationSubmittedDate:
      text(existingPayload.applicationSubmittedDate) ||
      (text(careCheck.invitedAt) ? text(careCheck.invitedAt).slice(0, 10) : ""),
    applicationProvider: "CareCheck",
    careCheck,
  };

  if (context.shared?.id) {
    const result = await (supabase as any)
      .from("leo_talent_candidate_shared_records")
      .update({
        payload: nextPayload,
        status: leoStatus,
        updated_at: now,
      })
      .eq("id", context.shared.id)
      .eq("organisation_id", organisationId)
      .select("id,payload,status,completed_at,updated_at")
      .single();

    if (result.error) throw new Error(result.error.message);
    return result.data;
  }

  const result = await (supabase as any)
    .from("leo_talent_candidate_shared_records")
    .insert({
      organisation_id: organisationId,
      candidate_id: context.profile.candidate_id,
      application_id: context.profile.application_id,
      vacancy_id: context.profile.vacancy_id,
      safer_recruitment_profile_id: context.profile.id,
      component_key: "dbs",
      payload: nextPayload,
      status: leoStatus,
      completed_at: null,
      updated_at: now,
    })
    .select("id,payload,status,completed_at,updated_at")
    .single();

  if (result.error) throw new Error(result.error.message);

  const auditResult = await (supabase as any)
    .from("talent_analytics_events")
    .insert({
      organisation_id: organisationId,
      event_type: "carecheck_dbs_connected",
      entity_type: "application",
      entity_id: context.profile.application_id,
      actor_user_id: userId,
      description: "CareCheck DBS tracking was connected to the candidate due-diligence record.",
      metadata: {
        profile_id: context.profile.id,
        candidate_id: context.profile.candidate_id,
      },
    });

  if (auditResult.error) {
    console.warn("CareCheck audit event could not be recorded:", auditResult.error);
  }

  return result.data;
}

export async function POST(request: Request, routeContext: RouteContext) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error:
          "CareCheck candidate actions are currently limited to development while production provider codes and credentials are being confirmed.",
      },
      { status: 409 },
    );
  }

  try {
    const { id } = await routeContext.params;
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) return access.error;

    const context = await loadContext(
      supabase,
      access.organisationId,
      id,
    );

    if (!context) {
      return NextResponse.json(
        { success: false, error: "The due diligence record was not found." },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
    };
    const action = text(body.action);
    const existingCareCheck =
      context.shared?.payload &&
      typeof context.shared.payload === "object" &&
      (context.shared.payload as Record<string, unknown>).careCheck &&
      typeof (context.shared.payload as Record<string, unknown>).careCheck === "object"
        ? ((context.shared.payload as Record<string, unknown>).careCheck as Record<string, unknown>)
        : {};

    if (action === "invite") {
      if (!context.vacancy?.requires_dbs) {
        return NextResponse.json(
          { success: false, error: "This vacancy does not require a DBS check." },
          { status: 400 },
        );
      }

      if (!context.candidate?.email) {
        return NextResponse.json(
          {
            success: false,
            error: "Add the candidate's email address before sending a CareCheck invite.",
          },
          { status: 400 },
        );
      }

      const existingReference = text(existingCareCheck.applicationReference);
      if (existingReference) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A CareCheck application is already linked to this candidate. Refresh its status instead of sending another invite.",
          },
          { status: 409 },
        );
      }

      /*
       * X / DI are the provider codes proven against CareCheck's dev
       * Candidate Invite service. Production DBS-level code mapping
       * remains deliberately isolated until CareCheck confirms it.
       */
      const invite = await sendCareCheckCandidateInvite({
        externalReference: careCheckReference(
          context.application?.application_reference,
          `APP${String(context.profile.application_id)}`,
        ),
        candidateReference: careCheckReference(
          context.candidate.candidate_reference,
          `CAN${String(context.profile.candidate_id)}`,
        ),
        candidateEmailAddress: context.candidate.email,
        candidateFirstName: context.candidate.first_name,
        candidateSurname: context.candidate.last_name,
        checkType: "X",
        type: "DI",
      });

      if (!invite.success || !invite.applicationReference) {
        return NextResponse.json(
          {
            success: false,
            error:
              invite.resultMessage ||
              "CareCheck did not accept the candidate invite.",
          },
          { status: 502 },
        );
      }

      const status = await pullCareCheckApplicationStatus(
        invite.applicationReference,
      );
      const now = new Date().toISOString();

      const careCheck = {
        provider: "CareCheck",
        environment: "sandbox",
        applicationReference:
          status.applicationReference || invite.applicationReference,
        invitedAt: now,
        lastCheckedAt: now,
        statusCode: status.statusCode,
        statusDescription: status.statusDescription,
        isCurrentStatus: status.isCurrentStatus,
        responseCode: status.responseCode,
        responseMessage: status.responseMessage,
        providerCheckType: "X",
        providerInviteType: "DI",
        vacancyDbsLevel: context.vacancy?.dbs_level ?? null,
      };

      await saveCareCheckState({
        supabase,
        organisationId: access.organisationId,
        userId: access.user.id,
        context,
        careCheck,
      });

      return NextResponse.json({
        success: true,
        careCheck,
      });
    }

    if (action === "refresh_status") {
      const applicationReference = text(
        existingCareCheck.applicationReference,
      );

      if (!applicationReference) {
        return NextResponse.json(
          {
            success: false,
            error: "No CareCheck application is linked to this candidate yet.",
          },
          { status: 400 },
        );
      }

      const status = await pullCareCheckApplicationStatus(
        applicationReference,
      );
      const now = new Date().toISOString();

      const careCheck = {
        ...existingCareCheck,
        applicationReference:
          status.applicationReference || applicationReference,
        lastCheckedAt: now,
        statusCode: status.statusCode,
        statusDescription: status.statusDescription,
        isCurrentStatus: status.isCurrentStatus,
        responseCode: status.responseCode,
        responseMessage: status.responseMessage,
      };

      await saveCareCheckState({
        supabase,
        organisationId: access.organisationId,
        userId: access.user.id,
        context,
        careCheck,
      });

      return NextResponse.json({
        success: true,
        careCheck,
      });
    }

    return NextResponse.json(
      { success: false, error: "The requested CareCheck action is invalid." },
      { status: 400 },
    );
  } catch (error) {
    console.error("CareCheck due-diligence action failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The CareCheck action could not be completed.",
      },
      { status: 500 },
    );
  }
}
