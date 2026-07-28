import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";
import { convertAppointmentToEmployee } from "@/lib/talent/conversion";

type RouteContext = { params: Promise<{ id: string }> };
type PlatformRole = "owner" | "senior" | "manager" | "employee";

const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);
const appointmentStatuses = new Set(["pre_employment", "checks_in_progress", "ready_to_start", "employee_creation_pending", "employee_created", "employment_commenced", "started", "withdrawn", "cancelled"]);
const conversionTriggerStatuses = new Set(["employee_created", "employment_commenced", "started"]);
const itemStatuses = new Set(["not_started", "in_progress", "awaiting_information", "complete", "not_required", "blocked"]);
const itemCategories = new Set(["candidate_details", "documents", "safer_recruitment", "payroll", "equipment", "learning", "induction", "manager_action", "other"]);
const ownerTypes = new Set(["candidate", "manager", "hr", "employer", "system"]);

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function optionalText(value: unknown): string | null { const result = text(value); return result || null; }
function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();
  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";
  return "employee";
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

function parseEmployeeId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  if (value && typeof value === "object") {
    const nested = (value as any).employee_id;
    return parseEmployeeId(nested);
  }
  return null;
}

export function isRpcUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalised = message.toLowerCase();
  return (
    normalised.includes("could not find the function") ||
    (normalised.includes("schema cache") && normalised.includes("function"))
  );
}

export function isMissingAnalyticsTable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalised = message.toLowerCase();
  return (
    normalised.includes("talent_analytics_events") &&
    (normalised.includes("could not find the table") ||
      normalised.includes("relation") ||
      normalised.includes("schema cache"))
  );
}

export function statusRequiresEmployee(status: unknown) {
  return conversionTriggerStatuses.has(text(status));
}

async function getVerifiedEmployee(
  supabase: any,
  organisationId: string,
  employeeId: number | null,
) {
  if (!employeeId) return null;

  const result = await (supabase as any)
    .from("employees")
    .select("id,organisation_id,name,email,status")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data ?? null;
}

async function findSafeEmployeeByEmail(
  supabase: any,
  organisationId: string,
  email: string | null,
) {
  const normalisedEmail = optionalText(email);
  if (!normalisedEmail) return null;

  const byEmail = await (supabase as any)
    .from("employees")
    .select("id,organisation_id,name,email,status")
    .eq("organisation_id", organisationId)
    .ilike("email", normalisedEmail)
    .order("id", { ascending: true });

  if (byEmail.error) throw new Error(byEmail.error.message);

  const rows = Array.isArray(byEmail.data) ? byEmail.data : [];
  if (rows.length === 0) return null;
  if (rows.length > 1) {
    throw new Error(
      "More than one employee record matches the candidate email. Resolve duplicates before conversion can continue.",
    );
  }

  return rows[0];
}

async function createEmployeeFallback(
  supabase: any,
  access: { user: { id: string }; organisationId: string },
  appointment: any,
  candidate: any,
) {
  const preferredEmail = optionalText(candidate.email);
  const safeByEmail = await findSafeEmployeeByEmail(
    supabase,
    access.organisationId,
    preferredEmail,
  );
  if (safeByEmail?.id) return Number(safeByEmail.id);

  const fullName =
    [optionalText(candidate.first_name), optionalText(candidate.last_name)]
      .filter(Boolean)
      .join(" ")
      .trim() || "New employee";

  const inserted = await (supabase as any)
    .from("employees")
    .insert([
      {
        organisation_id: access.organisationId,
        name: fullName,
        role: null,
        email: preferredEmail,
        start_date:
          optionalText(appointment.agreed_start_date) ??
          optionalText(appointment.actual_start_date),
        status: "Active",
      },
    ])
    .select("id")
    .single();

  if (inserted.error) {
    const message = inserted.error.message.toLowerCase();
    if (message.includes("duplicate") || inserted.error.code === "23505") {
      const racedByEmail = await findSafeEmployeeByEmail(
        supabase,
        access.organisationId,
        preferredEmail,
      );

      if (racedByEmail?.id) return Number(racedByEmail.id);
    }

    throw new Error(inserted.error.message);
  }

  return parseEmployeeId(inserted.data?.id);
}

async function resolveEmployeeIdForConversion(
  supabase: any,
  access: { user: { id: string }; organisationId: string },
  appointment: any,
) {
  const candidateResult = await (supabase as any)
    .from("leo_talent_candidates")
    .select("id,email,first_name,last_name,existing_employee_id")
    .eq("id", appointment.candidate_id)
    .eq("organisation_id", access.organisationId)
    .maybeSingle();

  if (candidateResult.error) throw new Error(candidateResult.error.message);
  if (!candidateResult.data) {
    throw new Error("The candidate linked to this appointment could not be found.");
  }

  const candidate = candidateResult.data;

  let employeeId = parseEmployeeId(appointment.employee_id);
  let verified = await getVerifiedEmployee(supabase, access.organisationId, employeeId);

  if (!verified) {
    employeeId = parseEmployeeId(candidate.existing_employee_id);
    verified = await getVerifiedEmployee(
      supabase,
      access.organisationId,
      employeeId,
    );
  }

  if (!verified) {
    const safeByEmail = await findSafeEmployeeByEmail(
      supabase,
      access.organisationId,
      optionalText(candidate.email),
    );
    if (safeByEmail?.id) {
      employeeId = parseEmployeeId(safeByEmail.id);
      verified = safeByEmail;
    }
  }

  if (!verified) {
    if (!appointment.offer_id) {
      throw new Error(
        "This appointment is not linked to an offer and cannot be converted to an employee.",
      );
    }

    const pending = await (supabase as any)
      .from("leo_talent_appointments")
      .update({
        status: "employee_creation_pending",
        updated_at: new Date().toISOString(),
        updated_by: access.user.id,
      })
      .eq("id", String(appointment.id))
      .eq("organisation_id", access.organisationId);

    if (pending.error) throw new Error(pending.error.message);

    const rpcResult = await (supabase as any).rpc(
      "convert_talent_candidate_to_employee",
      {
        p_offer_id: appointment.offer_id,
      },
    );

    if (rpcResult.error) {
      if (!isRpcUnavailable(rpcResult.error)) {
        throw new Error(rpcResult.error.message);
      }

      console.warn(
        "Talent conversion RPC unavailable in schema cache; using onboarding fallback conversion.",
      );

      employeeId = await createEmployeeFallback(
        supabase,
        access,
        appointment,
        candidate,
      );
    } else {
      employeeId = parseEmployeeId(rpcResult.data);
    }

    if (!employeeId) {
      const refreshed = await (supabase as any)
        .from("leo_talent_appointments")
        .select("employee_id")
        .eq("id", String(appointment.id))
        .eq("organisation_id", access.organisationId)
        .maybeSingle();

      if (refreshed.error) throw new Error(refreshed.error.message);
      employeeId = parseEmployeeId(refreshed.data?.employee_id);
    }

    verified = await getVerifiedEmployee(
      supabase,
      access.organisationId,
      employeeId,
    );

    if (!verified && !employeeId) {
      employeeId = await createEmployeeFallback(
        supabase,
        access,
        appointment,
        candidate,
      );
      verified = await getVerifiedEmployee(
        supabase,
        access.organisationId,
        employeeId,
      );
    }
  }

  if (!verified?.id) {
    throw new Error(
      "Employee conversion completed without a verifiable employee record in this organisation.",
    );
  }

  return {
    employeeId: Number(verified.id),
    candidate,
  };
}

async function writeTalentActivity(
  supabase: any,
  organisationId: string,
  actorUserId: string,
  appointmentId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {},
) {
  const result = await (supabase as any).from("talent_analytics_events").insert({
    organisation_id: organisationId,
    event_type: eventType,
    entity_type: "appointment",
    entity_id: appointmentId,
    actor_user_id: actorUserId,
    description,
    metadata,
  });

  if (result.error) {
    if (isMissingAnalyticsTable(result.error)) {
      console.warn(
        "Talent analytics logging is unavailable (missing talent_analytics_events). Conversion will continue.",
      );
    } else {
      console.warn("Appointment activity could not be recorded:", result.error);
    }
  }
}

async function ensureEmploymentDetails(
  supabase: any,
  employeeId: number,
  managerName: string | null,
) {
  const existing = await (supabase as any)
    .from("employee_employment_details")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.id) return;

  const now = new Date().toISOString();
  const created = await (supabase as any).from("employee_employment_details").insert({
    employee_id: employeeId,
    manager: managerName,
    created_at: now,
    updated_at: now,
  });

  if (created.error && created.error.code !== "23505") {
    throw new Error(created.error.message);
  }
}

async function ensureEmployeeTimeline(
  supabase: any,
  organisationId: string,
  employeeId: number,
  appointmentId: string,
  actorUserId: string,
) {
  const existing = await (supabase as any)
    .from("employee_timeline")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("employee_id", employeeId)
    .eq("event_type", "Talent Appointment Confirmed")
    .eq("source_module", "Talent")
    .eq("source_record_id", appointmentId)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.id) return;

  const now = new Date().toISOString();
  const inserted = await (supabase as any).from("employee_timeline").insert({
    organisation_id: organisationId,
    employee_id: employeeId,
    event_type: "Talent Appointment Confirmed",
    title: "Employment confirmed",
    description:
      "Candidate was converted to employee from the Talent onboarding appointment.",
    status: "complete",
    source_module: "Talent",
    source_record_id: appointmentId,
    metadata: {
      conversion_source: "onboarding_confirm_employment",
    },
    event_date: now,
    created_by: actorUserId,
    created_at: now,
  });

  if (inserted.error && inserted.error.code !== "23505") {
    throw new Error(inserted.error.message);
  }
}

async function ensureEmployeeCreationForAppointment(
  supabase: any,
  access: { user: { id: string }; organisationId: string },
  appointment: any,
  requestedStatus: string,
) {
  return convertAppointmentToEmployee({
    supabase,
    access,
    appointment,
    requestedStatus,
    appointmentResolution: "reused",
    onboardingResolution: "reused",
  });
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);
    if ("error" in access) return access.error;
    if (!writeRoles.has(access.role)) return NextResponse.json({ success: false, error: "You do not have permission to update onboarding records." }, { status: 403 });

    const appointmentResult = await (supabase as any).from("leo_talent_appointments").select("*").eq("id", id).eq("organisation_id", access.organisationId).maybeSingle();
    if (appointmentResult.error) throw new Error(appointmentResult.error.message);
    if (!appointmentResult.data) return NextResponse.json({ success: false, error: "The onboarding appointment was not found." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const action = text(body.action);

    if (action === "update_appointment") {
      const changes = body.changes ?? {};
      const update: Record<string, unknown> = {};

      const requestedStatus = changes.status !== undefined ? text(changes.status) : null;

      if (requestedStatus !== null) {
        const status = requestedStatus;
        if (!appointmentStatuses.has(status)) return NextResponse.json({ success: false, error: "The appointment status is invalid." }, { status: 400 });

        if (["ready_to_start", "employee_creation_pending", "employee_created", "employment_commenced", "started"].includes(status)) {
          const decisionOutcome = await getAppointmentDecisionOutcome(
            supabase as any,
            access.organisationId,
            String(appointmentResult.data.application_id),
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

        update.status = status;
      }
      if (changes.agreed_start_date !== undefined) update.agreed_start_date = optionalText(changes.agreed_start_date);
      if (changes.actual_start_date !== undefined) update.actual_start_date = optionalText(changes.actual_start_date);
      if (changes.manager_name !== undefined) update.manager_name = optionalText(changes.manager_name);
      if (changes.department !== undefined) update.department = optionalText(changes.department);
      if (changes.location_name !== undefined) update.location_name = optionalText(changes.location_name);
      if (changes.employee_created_at !== undefined) update.employee_created_at = optionalText(changes.employee_created_at);
      if (changes.recruitment_summary_transferred !== undefined) update.recruitment_summary_transferred = changes.recruitment_summary_transferred === true;
      if (changes.documents_transferred !== undefined) update.documents_transferred = changes.documents_transferred === true;
      if (changes.onboarding_transferred !== undefined) update.onboarding_transferred = changes.onboarding_transferred === true;
      if (changes.learning_pathway_triggered !== undefined) update.learning_pathway_triggered = changes.learning_pathway_triggered === true;
      if (changes.handover_completed_at !== undefined) update.handover_completed_at = optionalText(changes.handover_completed_at);
      if (changes.handover_notes !== undefined) update.handover_notes = optionalText(changes.handover_notes);
      if (changes.archived_at !== undefined) update.archived_at = optionalText(changes.archived_at);

      if (requestedStatus && statusRequiresEmployee(requestedStatus)) {
        const conversion = await ensureEmployeeCreationForAppointment(
          supabase as any,
          {
            user: access.user,
            organisationId: access.organisationId,
          },
          appointmentResult.data,
          requestedStatus,
        );

        return NextResponse.json({
          success: true,
          appointment: conversion.appointment,
          employeeId: conversion.employeeId,
          conversion,
        });
      }

      if (Object.keys(update).length === 0) return NextResponse.json({ success: false, error: "No supported appointment changes were supplied." }, { status: 400 });
      if (update.status === "employee_created" && !update.employee_created_at && !appointmentResult.data.employee_created_at) update.employee_created_at = new Date().toISOString();

      const result = await (supabase as any).from("leo_talent_appointments").update(update).eq("id", id).eq("organisation_id", access.organisationId).select("*").single();
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ success: true, appointment: result.data });
    }

    if (action === "update_item") {
      const itemId = text(body.itemId);
      const status = text(body.status);
      if (!itemId || !itemStatuses.has(status)) return NextResponse.json({ success: false, error: "A valid onboarding item and status are required." }, { status: 400 });

      const complete = status === "complete";
      const result = await (supabase as any).from("leo_talent_onboarding_items").update({
        status,
        completed_at: complete ? new Date().toISOString() : null,
        completed_by: complete ? access.user.id : null,
      }).eq("id", itemId).eq("appointment_id", id).eq("organisation_id", access.organisationId).select("*").single();
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ success: true, item: result.data });
    }

    if (action === "create_item") {
      const item = body.item ?? {};
      const itemName = text(item.itemName);
      const category = text(item.category);
      const ownerType = text(item.ownerType);
      if (!itemName) return NextResponse.json({ success: false, error: "Enter a task name." }, { status: 400 });
      if (!itemCategories.has(category) || !ownerTypes.has(ownerType)) return NextResponse.json({ success: false, error: "The task category or owner is invalid." }, { status: 400 });

      const result = await (supabase as any).from("leo_talent_onboarding_items").insert({
        organisation_id: access.organisationId,
        appointment_id: id,
        item_key: `custom_${Date.now()}`,
        item_name: itemName,
        item_category: category,
        description: optionalText(item.description),
        owner_type: ownerType,
        due_date: optionalText(item.dueDate),
        status: "not_started",
        candidate_visible: item.candidateVisible === true,
        candidate_editable: item.candidateEditable === true,
        metadata: { mandatory: true, custom: true },
      }).select("*").single();
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ success: true, item: result.data }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: "The requested action is not supported." }, { status: 400 });
  } catch (error) {
    console.error("Onboarding action failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "The onboarding action could not be completed." }, { status: 500 });
  }
}