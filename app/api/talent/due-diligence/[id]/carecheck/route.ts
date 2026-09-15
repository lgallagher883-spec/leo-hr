import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { planWorkforceCheck } from "@/lib/agentic/checkCoordination";
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

function providerWorkforceForCareCheck(
  workingWithChildren: unknown,
  workingWithVulnerableAdults: unknown,
): string | null {
  const children = text(workingWithChildren).toLowerCase();
  const adults = text(workingWithVulnerableAdults).toLowerCase();

  if (!children && !adults) return null;

  const worksWithChildren = children === "yes" || children === "true";
  const worksWithAdults = adults === "yes" || adults === "true";

  if (worksWithChildren && worksWithAdults) return "child_and_adult";
  if (worksWithChildren) return "child";
  if (worksWithAdults) return "adult";

  return "other";
}

const CARECHECK_SUBMITTED_STATUSES = new Set([
  "AWAITING_DIGITAL_ID",
  "FORM_READY",
  "FORM_COMPLETE",
  "FORM_AUTHORISED",
  "APP_SENT",
  "APP_RECEIVED",
  "APP_REJECTED",
  "APP_COMPLETE",
  "APP_WITHDRAWN",
  "FORM_INVALID",
  "AWAITING_MEDIA_CHECK",
]);

function careCheckStatusMeansSubmitted(providerStatus: unknown): boolean {
  return CARECHECK_SUBMITTED_STATUSES.has(text(providerStatus).toUpperCase());
}

function leoDbsStatusForCareCheck(
  providerStatus: unknown,
  resultType?: unknown,
): string {
  const status = text(providerStatus).toUpperCase();

  switch (status) {
    case "INVITE_SENT":
      return "candidate_invited";
    case "AWAITING_DIGITAL_ID":
    case "FORM_READY":
    case "FORM_COMPLETE":
    case "FORM_AUTHORISED":
      return "application_submitted";
    case "APP_SENT":
    case "APP_RECEIVED":
      return "awaiting_certificate";
    case "APP_COMPLETE":
      return resultType === true
        ? "further_review_required"
        : "awaiting_verification";
    case "APP_REJECTED":
    case "APP_WITHDRAWN":
    case "FORM_INVALID":
      return "further_review_required";
    case "AWAITING_MEDIA_CHECK":
      return "application_submitted";
    default:
      return status ? "application_submitted" : "not_started";
  }
}

function careCheckDbsCheckType(level: unknown): "Y" | "XS" | "XE" {
  const normalised = text(level).toLowerCase();

  if (normalised.includes("basic")) return "Y";
  if (normalised.includes("standard")) return "XS";
  return "XE";
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

  const leoStatus = leoDbsStatusForCareCheck(
    careCheck.statusCode,
    careCheck.resultType,
  );
  const providerWorkforce = providerWorkforceForCareCheck(
    careCheck.workingWithChildren,
    careCheck.workingWithVulnerableAdults,
  );
  const existingWorkforce = text(existingPayload.workforce);
  const nextPayload = {
    ...existingPayload,
    roleRequiresDBS: Boolean(context.vacancy?.requires_dbs),
    requirement: context.vacancy?.requires_dbs
      ? (context.vacancy?.dbs_level ?? existingPayload.requirement ?? "enhanced")
      : "not_required",
    status: leoStatus,
    workforce: existingWorkforce || providerWorkforce || "",
    applicationReference:
      text(careCheck.applicationReference) || text(existingPayload.applicationReference),
    applicationSubmittedDate: careCheckStatusMeansSubmitted(
      careCheck.statusCode,
    )
      ? text(existingPayload.applicationSubmittedDate) ||
        (text(careCheck.lastCheckedAt)
          ? text(careCheck.lastCheckedAt).slice(0, 10)
          : "")
      : "",
    applicationProvider: "CareCheck",
    certificateNumber:
      text(careCheck.certificateNumber) ||
      text(existingPayload.certificateNumber),
    certificateIssueDate:
      text(careCheck.certificateIssueDate) ||
      text(existingPayload.certificateIssueDate),
    certificateSeenDate:
      text(careCheck.certificateSeenDate) ||
      text(existingPayload.certificateSeenDate),
    resultPosition:
      careCheck.resultType === false
        ? "clear"
        : careCheck.resultType === true
          ? "further_review_required"
          : existingPayload.resultPosition ?? "",
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
    const existingPayload =
      context.shared?.payload && typeof context.shared.payload === "object"
        ? (context.shared.payload as Record<string, unknown>)
        : {};
    const existingCareCheck =
      existingPayload.careCheck &&
      typeof existingPayload.careCheck === "object"
        ? (existingPayload.careCheck as Record<string, unknown>)
        : {};

    const existingStatus = text(context.shared?.status).toLowerCase();
    const existingResultPosition = text(existingPayload.resultPosition).toLowerCase();
    const existingVerifiedEvidence =
      ["verified", "complete", "completed", "cleared"].includes(existingStatus) ||
      ["clear", "verified", "cleared"].includes(existingResultPosition);
    const consentRecorded =
      existingPayload.consentRecorded === true ||
      existingPayload.consent_recorded === true;
    const discrepancyRecorded =
      existingResultPosition === "further_review_required" ||
      existingPayload.discrepancyRecorded === true ||
      existingPayload.discrepancy_recorded === true;

    const agenticCheckPlan = planWorkforceCheck({
      checkType: "dbs",
      required: Boolean(context.vacancy?.requires_dbs),
      existingVerifiedEvidence,
      providerAvailable: true,
      consentRecorded,
      discrepancyRecorded,
    });

    if (action === "agentic_plan") {
      return NextResponse.json({
        success: true,
        agenticCheckPlan,
        askLeoInvolved: false,
      });
    }

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
        checkType: careCheckDbsCheckType(context.vacancy?.dbs_level),
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
        workingWithVulnerableAdults: status.workingWithVulnerableAdults,
        workingWithChildren: status.workingWithChildren,
        workforce: status.workforce,
        disclosureType: status.disclosureType,
        resultType: status.resultType,
        riskAssessment: status.riskAssessment,
        dbsReference: status.dbsReference,
        certificateNumber: status.certificateNumber,
        certificateIssueDate: status.certificateIssueDate,
        certificateReceivedDate: status.certificateReceivedDate,
        certificateSeenDate: status.certificateSeenDate,
        withdrawalReason: status.withdrawalReason,
        withdrawalDate: status.withdrawalDate,
        providerCheckType: careCheckDbsCheckType(context.vacancy?.dbs_level),
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
        agenticCheckPlan,
        askLeoInvolved: false,
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
        workingWithVulnerableAdults: status.workingWithVulnerableAdults,
        workingWithChildren: status.workingWithChildren,
        workforce: status.workforce,
        disclosureType: status.disclosureType,
        resultType: status.resultType,
        riskAssessment: status.riskAssessment,
        dbsReference: status.dbsReference,
        certificateNumber: status.certificateNumber,
        certificateIssueDate: status.certificateIssueDate,
        certificateReceivedDate: status.certificateReceivedDate,
        certificateSeenDate: status.certificateSeenDate,
        withdrawalReason: status.withdrawalReason,
        withdrawalDate: status.withdrawalDate,
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
