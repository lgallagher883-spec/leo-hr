import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";
import { convertAppointmentToEmployee } from "@/lib/talent/conversion";

type RouteContext = { params: Promise<{ id: string }> };
type PlatformRole = "owner" | "senior" | "manager" | "employee";
const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function optionalText(value: unknown): string | null { const result = text(value); return result || null; }
function optionalNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}
function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();
  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";
  return "employee";
}

async function getAuthorisedContext(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: NextResponse.json({ success: false, error: "Your session is unavailable. Please sign in again." }, { status: 401 }) };

  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;
  if (!organisationId) return { error: NextResponse.json({ success: false, error: "Leo could not find an active organisation for your account." }, { status: 403 }) };
  return { user, organisationId, role: normaliseRole(resolvedRole?.roleKey) };
}

async function getOffer(supabase: any, organisationId: string, id: string) {
  return (supabase as any).from("leo_talent_offers").select("*").eq("id", id).eq("organisation_id", organisationId).is("archived_at", null).maybeSingle();
}

async function getVacancyForOffer(supabase: any, organisationId: string, vacancyId: string) {
  return (supabase as any)
    .from("leo_talent_vacancies")
    .select("id, organisation_id, safer_recruitment_required")
    .eq("id", vacancyId)
    .eq("organisation_id", organisationId)
    .maybeSingle();
}

async function writeTalentActivity(
  supabase: any,
  organisationId: string,
  actorUserId: string,
  offerId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {},
) {
  const result = await (supabase as any).from("talent_analytics_events").insert({
    organisation_id: organisationId,
    event_type: eventType,
    entity_type: "offer",
    entity_id: offerId,
    actor_user_id: actorUserId,
    description,
    metadata,
  });

  if (result.error) {
    console.warn("Offer activity could not be recorded:", result.error);
  }
}

async function ensureDueDiligenceProfileForOffer(
  supabase: any,
  organisationId: string,
  offer: any,
  vacancy: any,
) {
  const existing = await (supabase as any)
    .from("leo_talent_safer_recruitment_profiles")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("application_id", offer.application_id)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.id) return { id: existing.data.id, created: false };

  const created = await (supabase as any)
    .from("leo_talent_safer_recruitment_profiles")
    .insert({
      organisation_id: organisationId,
      application_id: offer.application_id,
      vacancy_id: offer.vacancy_id,
      candidate_id: offer.candidate_id,
      status: "in_progress",
      overall_risk_level: "not_assessed",
      review_required: vacancy?.safer_recruitment_required === true,
    })
    .select("id")
    .single();

  if (created.error) {
    if (created.error.code !== "23505") throw new Error(created.error.message);

    const recovered = await (supabase as any)
      .from("leo_talent_safer_recruitment_profiles")
      .select("id")
      .eq("organisation_id", organisationId)
      .eq("application_id", offer.application_id)
      .single();

    if (recovered.error || !recovered.data?.id) {
      throw new Error(recovered.error?.message ?? created.error.message);
    }

    return { id: recovered.data.id, created: false };
  }

  return { id: created.data.id, created: true };
}

async function getAppointmentDecisionOutcome(
  supabase: any,
  organisationId: string,
  applicationId: string,
) {
  const result = await (supabase as any)
    .from("leo_talent_candidate_shared_records")
    .select("payload,updated_at")
    .eq("organisation_id", organisationId)
    .eq("application_id", applicationId)
    .eq("component_key", "appointment_decision")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (result.error) throw new Error(result.error.message);

  const latest =
    Array.isArray(result.data) && result.data.length > 0
      ? result.data[0]
      : null;

  const payload =
    latest?.payload && typeof latest.payload === "object"
      ? (latest.payload as Record<string, unknown>)
      : null;

  const outcome = text(payload?.outcome).toLowerCase();

  if (outcome === "ready_for_appointment") return "ready_for_appointment";
  if (outcome === "not_ready") return "not_ready";
  if (outcome === "withdrawn") return "withdrawn";
  return "pending";
}

function blockedByDecision(outcome: string) {
  return outcome === "not_ready" || outcome === "withdrawn";
}

async function ensureAppointment(supabase: any, offer: any, organisationId: string) {
  const existing = await (supabase as any)
    .from("leo_talent_appointments")
    .select("*")
    .eq("organisation_id", organisationId)
    .is("archived_at", null)
    .or(`offer_id.eq.${offer.id},application_id.eq.${offer.application_id}`)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) {
    if (existing.data.offer_id !== offer.id) {
      const relinked = await (supabase as any)
        .from("leo_talent_appointments")
        .update({ offer_id: offer.id })
        .eq("id", existing.data.id)
        .eq("organisation_id", organisationId)
        .select("*")
        .single();
      if (relinked.error) throw new Error(relinked.error.message);
      return relinked.data;
    }
    return existing.data;
  }

  const created = await (supabase as any).from("leo_talent_appointments").insert({
    organisation_id: organisationId,
    offer_id: offer.id,
    application_id: offer.application_id,
    vacancy_id: offer.vacancy_id,
    candidate_id: offer.candidate_id,
    status: "pre_employment",
    agreed_start_date: offer.proposed_start_date || null,
    manager_name: offer.manager_name || null,
    department: offer.department || null,
    location_name: offer.location_name || null,
  }).select("*").single();

  if (created.error) {
    if (created.error.code !== "23505") throw new Error(created.error.message);

    const recovered = await (supabase as any)
      .from("leo_talent_appointments")
      .select("*")
      .eq("organisation_id", organisationId)
      .is("archived_at", null)
      .or(`offer_id.eq.${offer.id},application_id.eq.${offer.application_id}`)
      .maybeSingle();

    if (recovered.error || !recovered.data) {
      throw new Error(recovered.error?.message ?? created.error.message);
    }

    if (recovered.data.offer_id !== offer.id) {
      const relinked = await (supabase as any)
        .from("leo_talent_appointments")
        .update({ offer_id: offer.id })
        .eq("id", recovered.data.id)
        .eq("organisation_id", organisationId)
        .select("*")
        .single();
      if (relinked.error) throw new Error(relinked.error.message);
      return relinked.data;
    }

    return recovered.data;
  }

  return created.data;
}

async function syncOfferAutomation(
  supabase: any,
  organisationId: string,
  offer: any,
  actorUserId: string,
) {
  const status = text(offer.status).toLowerCase();

  if (status === "accepted" || Boolean(offer.accepted_at)) {
    const decisionOutcome = await getAppointmentDecisionOutcome(
      supabase,
      organisationId,
      String(offer.application_id),
    );

    if (blockedByDecision(decisionOutcome)) {
      throw new Error(
        `Appointment progression is blocked because the appointment decision is ${decisionOutcome.replaceAll("_", " ")}.`,
      );
    }

    const vacancyResult = await getVacancyForOffer(
      supabase,
      organisationId,
      String(offer.vacancy_id),
    );
    if (vacancyResult.error) throw new Error(vacancyResult.error.message);

    const appointment = await ensureAppointment(supabase, offer, organisationId);
    const dueDiligence = await ensureDueDiligenceProfileForOffer(
      supabase,
      organisationId,
      offer,
      vacancyResult.data,
    );

    const isInactiveAppointment = ["withdrawn", "cancelled"].includes(
      text(appointment.status).toLowerCase(),
    );

    let activeAppointment = appointment;
    if (isInactiveAppointment) {
      const reopened = await (supabase as any)
        .from("leo_talent_appointments")
        .update({ status: "pre_employment" })
        .eq("id", appointment.id)
        .eq("organisation_id", organisationId)
        .select("*")
        .single();
      if (reopened.error) throw new Error(reopened.error.message);
      activeAppointment = reopened.data;
    }

    await writeTalentActivity(
      supabase,
      organisationId,
      actorUserId,
      String(offer.id),
      "offer_accepted_onboarding_synced",
      "Accepted offer synced with onboarding and due diligence.",
      {
        offer_status: offer.status,
        appointment_id: activeAppointment.id,
        due_diligence_profile_id: dueDiligence.id,
        appointment_decision: decisionOutcome,
      },
    );

    return {
      appointment: activeAppointment,
      dueDiligenceProfileId: dueDiligence.id,
    };
  }

  if (status === "withdrawn" || status === "cancelled" || status === "declined") {
    const appointmentStatus = status === "withdrawn" ? "withdrawn" : "cancelled";
    const updatedAppointment = await (supabase as any)
      .from("leo_talent_appointments")
      .update({ status: appointmentStatus })
      .eq("offer_id", offer.id)
      .eq("organisation_id", organisationId)
      .is("archived_at", null)
      .select("*")
      .maybeSingle();

    if (updatedAppointment.error) throw new Error(updatedAppointment.error.message);

    await writeTalentActivity(
      supabase,
      organisationId,
      actorUserId,
      String(offer.id),
      "offer_onboarding_status_synced",
      "Offer status synced to existing onboarding appointment.",
      {
        offer_status: offer.status,
        appointment_status: appointmentStatus,
        appointment_id: updatedAppointment.data?.id ?? null,
      },
    );

    return {
      appointment: updatedAppointment.data ?? null,
      dueDiligenceProfileId: null,
    };
  }

  return { appointment: null, dueDiligenceProfileId: null };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);
    if ("error" in access) return access.error;
    if (!writeRoles.has(access.role)) return NextResponse.json({ success: false, error: "You do not have permission to update offers and appointments." }, { status: 403 });

    const offerResult = await getOffer(supabase, access.organisationId, id);
    if (offerResult.error) throw new Error(offerResult.error.message);
    if (!offerResult.data) return NextResponse.json({ success: false, error: "The offer was not found." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const action = text(body.action);
    const offer = offerResult.data;

    if (action === "save_offer") {
      const draft = body.offer ?? {};
      if (!text(draft.job_title) || !text(draft.employment_type)) return NextResponse.json({ success: false, error: "Job title and employment type are required." }, { status: 400 });

      const draftStatus = text(draft.status).toLowerCase();
      const draftAccepted = Boolean(optionalText(draft.accepted_at));
      if (draftStatus === "accepted" || draftAccepted) {
        const decisionOutcome = await getAppointmentDecisionOutcome(
          supabase,
          access.organisationId,
          String(offer.application_id),
        );

        if (blockedByDecision(decisionOutcome)) {
          return NextResponse.json(
            {
              success: false,
              error: `Appointment progression is blocked because the appointment decision is ${decisionOutcome.replaceAll("_", " ")}.`,
            },
            { status: 409 },
          );
        }
      }

      const updateResult = await (supabase as any).from("leo_talent_offers").update({
        offer_type: text(draft.offer_type) || "conditional",
        status: text(draft.status) || "draft",
        job_title: text(draft.job_title),
        department: optionalText(draft.department),
        location_name: optionalText(draft.location_name),
        manager_name: optionalText(draft.manager_name),
        employment_type: text(draft.employment_type),
        proposed_start_date: optionalText(draft.proposed_start_date),
        hours_per_week: optionalNumber(draft.hours_per_week),
        work_pattern: optionalText(draft.work_pattern),
        salary_amount: optionalNumber(draft.salary_amount),
        salary_period: optionalText(draft.salary_period),
        salary_currency: text(draft.salary_currency) || "GBP",
        probation_months: optionalNumber(draft.probation_months),
        holiday_allowance_days: optionalNumber(draft.holiday_allowance_days),
        notice_period: optionalText(draft.notice_period),
        conditions: Array.isArray(draft.conditions) ? draft.conditions : [],
        approval_status: text(draft.approval_status) || "not_required",
        approval_notes: optionalText(draft.approval_notes),
        sent_at: optionalText(draft.sent_at),
        response_deadline: optionalText(draft.response_deadline),
        accepted_at: optionalText(draft.accepted_at),
        declined_at: optionalText(draft.declined_at),
        decline_reason: optionalText(draft.decline_reason),
        withdrawn_at: optionalText(draft.withdrawn_at),
        withdrawal_reason: optionalText(draft.withdrawal_reason),
        candidate_response_notes: optionalText(draft.candidate_response_notes),
      }).eq("id", id).eq("organisation_id", access.organisationId).select("*").single();
      if (updateResult.error) throw new Error(updateResult.error.message);
      const automation = await syncOfferAutomation(
        supabase,
        access.organisationId,
        updateResult.data,
        access.user.id,
      );
      return NextResponse.json({
        success: true,
        offer: updateResult.data,
        appointment: automation.appointment,
        dueDiligenceProfileId: automation.dueDiligenceProfileId,
      });
    }

    if (action === "accept") {
      const decisionOutcome = await getAppointmentDecisionOutcome(
        supabase,
        access.organisationId,
        String(offer.application_id),
      );

      if (blockedByDecision(decisionOutcome)) {
        return NextResponse.json(
          {
            success: false,
            error: `Appointment progression is blocked because the appointment decision is ${decisionOutcome.replaceAll("_", " ")}.`,
          },
          { status: 409 },
        );
      }

      const acceptedAt = optionalText(body.acceptedAt) || new Date().toISOString().slice(0, 10);
      const updateResult = await (supabase as any).from("leo_talent_offers").update({ status: "accepted", accepted_at: acceptedAt, proposed_start_date: optionalText(body.proposedStartDate), candidate_response_notes: optionalText(body.candidateResponseNotes) }).eq("id", id).eq("organisation_id", access.organisationId).select("*").single();
      if (updateResult.error) throw new Error(updateResult.error.message);
      const automation = await syncOfferAutomation(
        supabase,
        access.organisationId,
        updateResult.data,
        access.user.id,
      );
      return NextResponse.json({
        success: true,
        offer: updateResult.data,
        appointment: automation.appointment,
        dueDiligenceProfileId: automation.dueDiligenceProfileId,
      });
    }

    if (action === "save_appointment") {
      const appointment = body.appointment ?? {};
      const appointmentId = text(appointment.id);
      if (!appointmentId) return NextResponse.json({ success: false, error: "The appointment record is missing." }, { status: 400 });
      const result = await (supabase as any).from("leo_talent_appointments").update({
        status: text(appointment.status) || "pre_employment",
        agreed_start_date: optionalText(appointment.agreed_start_date),
        actual_start_date: optionalText(appointment.actual_start_date),
        manager_name: optionalText(appointment.manager_name),
        department: optionalText(appointment.department),
        location_name: optionalText(appointment.location_name),
        recruitment_summary_transferred: appointment.recruitment_summary_transferred === true,
        documents_transferred: appointment.documents_transferred === true,
        onboarding_transferred: appointment.onboarding_transferred === true,
        learning_pathway_triggered: appointment.learning_pathway_triggered === true,
        handover_completed_at: optionalText(appointment.handover_completed_at),
        handover_notes: optionalText(appointment.handover_notes),
      }).eq("id", appointmentId).eq("offer_id", id).eq("organisation_id", access.organisationId).select("*").single();
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ success: true, appointment: result.data });
    }

    if (action === "convert") {
      const decisionOutcome = await getAppointmentDecisionOutcome(
        supabase,
        access.organisationId,
        String(offer.application_id),
      );

      if (blockedByDecision(decisionOutcome)) {
        return NextResponse.json(
          {
            success: false,
            error: `Employee conversion is blocked because the appointment decision is ${decisionOutcome.replaceAll("_", " ")}.`,
          },
          { status: 409 },
        );
      }

      let appointmentResolution: "created" | "reused" = "reused";
      let appointmentRecord = await (supabase as any)
        .from("leo_talent_appointments")
        .select("*")
        .eq("offer_id", id)
        .eq("organisation_id", access.organisationId)
        .is("archived_at", null)
        .maybeSingle();

      if (appointmentRecord.error) throw new Error(appointmentRecord.error.message);

      if (!appointmentRecord.data) {
        const ensured = await ensureAppointment(
          supabase,
          offer,
          access.organisationId,
        );
        appointmentRecord = { data: ensured, error: null } as any;
        appointmentResolution = "created";
      }

      if (!appointmentRecord.data) {
        return NextResponse.json(
          { success: false, error: "The appointment record was not found." },
          { status: 404 },
        );
      }

      if (
        !["ready_to_start", "employee_creation_pending", "employee_created", "employment_commenced", "started"].includes(
          appointmentRecord.data.status,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Set the appointment to Ready to start before creating the employee record.",
          },
          { status: 400 },
        );
      }

      const conversion = await convertAppointmentToEmployee({
        supabase,
        access: {
          user: access.user,
          organisationId: access.organisationId,
        },
        appointment: appointmentRecord.data,
        requestedStatus: "employee_created",
        appointmentResolution,
        onboardingResolution: appointmentResolution,
      });

      return NextResponse.json({
        success: true,
        employeeId: conversion.employeeId,
        appointment: conversion.appointment,
        conversion,
      });
    }

    return NextResponse.json({ success: false, error: "The requested action is not supported." }, { status: 400 });
  } catch (error) {
    console.error("Offer action failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "The offer action could not be completed." }, { status: 500 });
  }
}