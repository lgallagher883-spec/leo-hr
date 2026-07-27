import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

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

async function ensureAppointment(supabase: any, offer: any, organisationId: string) {
  const existing = await (supabase as any).from("leo_talent_appointments").select("*").eq("offer_id", offer.id).eq("organisation_id", organisationId).is("archived_at", null).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

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
  if (created.error) throw new Error(created.error.message);
  return created.data;
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
      let appointment = null;
      if (updateResult.data.status === "accepted") appointment = await ensureAppointment(supabase, updateResult.data, access.organisationId);
      return NextResponse.json({ success: true, offer: updateResult.data, appointment });
    }

    if (action === "accept") {
      const acceptedAt = optionalText(body.acceptedAt) || new Date().toISOString().slice(0, 10);
      const updateResult = await (supabase as any).from("leo_talent_offers").update({ status: "accepted", accepted_at: acceptedAt, proposed_start_date: optionalText(body.proposedStartDate), candidate_response_notes: optionalText(body.candidateResponseNotes) }).eq("id", id).eq("organisation_id", access.organisationId).select("*").single();
      if (updateResult.error) throw new Error(updateResult.error.message);
      const appointment = await ensureAppointment(supabase, updateResult.data, access.organisationId);
      return NextResponse.json({ success: true, offer: updateResult.data, appointment });
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
      const appointmentResult = await (supabase as any).from("leo_talent_appointments").select("*").eq("offer_id", id).eq("organisation_id", access.organisationId).is("archived_at", null).maybeSingle();
      if (appointmentResult.error) throw new Error(appointmentResult.error.message);
      if (!appointmentResult.data) return NextResponse.json({ success: false, error: "The appointment record was not found." }, { status: 404 });
      if (!["ready_to_start", "employee_creation_pending"].includes(appointmentResult.data.status)) return NextResponse.json({ success: false, error: "Set the appointment to Ready to start before creating the employee record." }, { status: 400 });

      const pending = await (supabase as any).from("leo_talent_appointments").update({ status: "employee_creation_pending" }).eq("id", appointmentResult.data.id).eq("organisation_id", access.organisationId);
      if (pending.error) throw new Error(pending.error.message);

      const rpcResult = await (supabase as any).rpc("convert_talent_candidate_to_employee", { p_offer_id: id });
      if (rpcResult.error) throw new Error(rpcResult.error.message);
      const employeeId = typeof rpcResult.data === "string" || typeof rpcResult.data === "number" ? String(rpcResult.data) : rpcResult.data?.employee_id ? String(rpcResult.data.employee_id) : null;

      const completion = await (supabase as any).from("leo_talent_appointments").update({ status: "employee_created", employee_id: employeeId ? Number(employeeId) : null, employee_created_at: new Date().toISOString(), recruitment_summary_transferred: true }).eq("id", appointmentResult.data.id).eq("organisation_id", access.organisationId).select("*").single();
      if (completion.error) throw new Error(completion.error.message);
      return NextResponse.json({ success: true, employeeId, appointment: completion.data });
    }

    return NextResponse.json({ success: false, error: "The requested action is not supported." }, { status: 400 });
  } catch (error) {
    console.error("Offer action failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "The offer action could not be completed." }, { status: 500 });
  }
}