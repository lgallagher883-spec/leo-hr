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

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();
  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";
  return "employee";
}

function careCheckReference(value: unknown, fallback: string): string {
  const normalised = text(value).replace(/[^A-Za-z0-9_]/g, "");
  return normalised || fallback.replace(/[^A-Za-z0-9_]/g, "");
}

function leoRtwStatus(providerStatus: unknown): string {
  const status = text(providerStatus).toUpperCase();

  switch (status) {
    case "INVITE_SENT":
      return "awaiting_evidence";
    case "APP_REJECTED":
    case "APP_WITHDRAWN":
    case "FORM_INVALID":
      return "follow_up_required";
    case "AWAITING_DIGITAL_ID":
    case "FORM_READY":
    case "FORM_COMPLETE":
    case "FORM_AUTHORISED":
    case "APP_SENT":
    case "APP_RECEIVED":
    case "APP_COMPLETE":
      return "awaiting_verification";
    default:
      return status ? "awaiting_verification" : "not_started";
  }
}

async function getAuthorisedContext(supabase: any) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Your session is unavailable. Please sign in again." },
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
        { success: false, error: "Leo could not find an active organisation for your account." },
        { status: 403 },
      ),
    };
  }

  const role = normaliseRole(resolvedRole.roleKey);
  if (!writeRoles.has(role)) {
    return {
      error: NextResponse.json(
        { success: false, error: "You do not have permission to manage CareCheck checks." },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    organisationId: resolvedRole.membership.organisation_id,
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

  const [candidateResult, applicationResult, sharedResult] = await Promise.all([
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
      .from("leo_talent_candidate_shared_records")
      .select("id,payload,status,completed_at")
      .eq("organisation_id", organisationId)
      .eq("candidate_id", profile.candidate_id)
      .eq("application_id", profile.application_id)
      .eq("component_key", "right_to_work")
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  if (candidateResult.error) throw new Error(candidateResult.error.message);
  if (applicationResult.error) throw new Error(applicationResult.error.message);
  if (sharedResult.error) throw new Error(sharedResult.error.message);

  return {
    profile,
    candidate: candidateResult.data,
    application: applicationResult.data,
    shared:
      Array.isArray(sharedResult.data) && sharedResult.data.length > 0
        ? sharedResult.data[0]
        : null,
  };
}

async function saveState({
  supabase,
  organisationId,
  context,
  careCheck,
}: {
  supabase: any;
  organisationId: string;
  context: NonNullable<Awaited<ReturnType<typeof loadContext>>>;
  careCheck: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const existingPayload =
    context.shared?.payload && typeof context.shared.payload === "object"
      ? (context.shared.payload as Record<string, unknown>)
      : {};

  const status = leoRtwStatus(careCheck.statusCode);
  const providerCheckDate = text(careCheck.rtwCheckDate);
  const providerOutcome = text(careCheck.rtwCheckStatus);

  const payload = {
    ...existingPayload,
    status,
    method:
      text(existingPayload.method) ||
      (providerCheckDate ? "digital_identity_service" : ""),
    dateOfCheck:
      text(existingPayload.dateOfCheck) || providerCheckDate,
    verificationOutcome:
      providerOutcome || text(existingPayload.verificationOutcome),
    careCheck,
  };

  if (context.shared?.id) {
    const result = await (supabase as any)
      .from("leo_talent_candidate_shared_records")
      .update({
        payload,
        status,
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
      component_key: "right_to_work",
      payload,
      status,
      completed_at: null,
      updated_at: now,
    })
    .select("id,payload,status,completed_at,updated_at")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function POST(request: Request, routeContext: RouteContext) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error:
          "CareCheck Right to Work actions are currently limited to development until Leo's production CareCheck account is activated.",
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
        { success: false, error: "The due-diligence record could not be found." },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { action?: unknown }
      | null;
    const action = text(body?.action);

    const existingPayload =
      context.shared?.payload && typeof context.shared.payload === "object"
        ? (context.shared.payload as Record<string, unknown>)
        : {};
    const existingCareCheck =
      existingPayload.careCheck && typeof existingPayload.careCheck === "object"
        ? (existingPayload.careCheck as Record<string, unknown>)
        : {};

    if (action === "invite") {
      if (!context.candidate?.email) {
        return NextResponse.json(
          { success: false, error: "Add the candidate's email address before sending a CareCheck Right to Work invite." },
          { status: 400 },
        );
      }

      if (text(existingCareCheck.applicationReference)) {
        return NextResponse.json(
          { success: false, error: "A CareCheck Right to Work check is already linked to this candidate. Refresh its status instead." },
          { status: 409 },
        );
      }

      const invite = await sendCareCheckCandidateInvite({
        // CareCheck requires ExternalReference to be unique. A candidate may
        // have both a DBS and RTW check for the same Leo application, so RTW
        // uses its own deterministic provider namespace rather than reusing
        // the Leo application/candidate reference used by DBS.
        externalReference: careCheckReference(
          `RTW${text(context.application?.application_reference)}`,
          `RTWAPP${String(context.profile.application_id)}`,
        ),
        candidateReference: careCheckReference(
          `RTW${text(context.candidate.candidate_reference)}`,
          `RTWCAN${String(context.profile.candidate_id)}`,
        ),
        candidateEmailAddress: context.candidate.email,
        candidateFirstName: context.candidate.first_name,
        candidateSurname: context.candidate.last_name,
        checkType: "D",
        type: "RTW",
      });

      if (!invite.success || !invite.applicationReference) {
        return NextResponse.json(
          {
            success: false,
            error:
              invite.resultMessage ||
              "CareCheck did not accept the Right to Work invite.",
          },
          { status: 502 },
        );
      }

      const provider = await pullCareCheckApplicationStatus(
        invite.applicationReference,
      );
      const now = new Date().toISOString();

      const careCheck = {
        provider: "CareCheck",
        environment: "sandbox",
        applicationReference:
          provider.applicationReference || invite.applicationReference,
        invitedAt: now,
        lastCheckedAt: now,
        statusCode: provider.statusCode,
        statusDescription: provider.statusDescription,
        isCurrentStatus: provider.isCurrentStatus,
        responseCode: provider.responseCode,
        responseMessage: provider.responseMessage,
        disclosureType: provider.disclosureType,
        rtwCheckStatus: provider.rtwCheckStatus,
        rtwCheckDate: provider.rtwCheckDate,
        providerCheckType: "D",
        providerInviteType: "RTW",
      };

      await saveState({
        supabase,
        organisationId: access.organisationId,
        context,
        careCheck,
      });

      return NextResponse.json({ success: true, careCheck });
    }

    if (action === "refresh_status") {
      const applicationReference = text(existingCareCheck.applicationReference);

      if (!applicationReference) {
        return NextResponse.json(
          { success: false, error: "No CareCheck Right to Work check is linked to this candidate yet." },
          { status: 400 },
        );
      }

      const provider = await pullCareCheckApplicationStatus(applicationReference);
      const careCheck = {
        ...existingCareCheck,
        applicationReference:
          provider.applicationReference || applicationReference,
        lastCheckedAt: new Date().toISOString(),
        statusCode: provider.statusCode,
        statusDescription: provider.statusDescription,
        isCurrentStatus: provider.isCurrentStatus,
        responseCode: provider.responseCode,
        responseMessage: provider.responseMessage,
        disclosureType: provider.disclosureType,
        rtwCheckStatus: provider.rtwCheckStatus,
        rtwCheckDate: provider.rtwCheckDate,
      };

      await saveState({
        supabase,
        organisationId: access.organisationId,
        context,
        careCheck,
      });

      return NextResponse.json({ success: true, careCheck });
    }

    return NextResponse.json(
      { success: false, error: "The requested CareCheck Right to Work action is invalid." },
      { status: 400 },
    );
  } catch (error) {
    console.error("CareCheck Right to Work action failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The CareCheck Right to Work action could not be completed.",
      },
      { status: 500 },
    );
  }
}
