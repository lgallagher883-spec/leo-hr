import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };
type PlatformRole = "owner" | "senior" | "manager" | "employee";

const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);
const appointmentStatuses = new Set(["pre_employment", "checks_in_progress", "ready_to_start", "employee_creation_pending", "employee_created", "started", "withdrawn", "cancelled"]);
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

async function getAuthorisedContext(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: NextResponse.json({ success: false, error: "Your session is unavailable. Please sign in again." }, { status: 401 }) };

  const membershipResult = await supabase.from("organisation_memberships").select("organisation_id, role, membership_status").eq("user_id", user.id).eq("membership_status", "active").order("is_default_organisation", { ascending: false }).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (membershipResult.error) return { error: NextResponse.json({ success: false, error: membershipResult.error.message || "Leo could not verify your organisation access." }, { status: 500 }) };

  const organisationId = membershipResult.data?.organisation_id ?? null;
  if (!organisationId) return { error: NextResponse.json({ success: false, error: "Leo could not find an active organisation for your account." }, { status: 403 }) };
  return { user, organisationId, role: normaliseRole(membershipResult.data?.role) };
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

      if (changes.status !== undefined) {
        const status = text(changes.status);
        if (!appointmentStatuses.has(status)) return NextResponse.json({ success: false, error: "The appointment status is invalid." }, { status: 400 });
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