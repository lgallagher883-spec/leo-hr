import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

type ActionRecord = {
  id: string;
  title: string;
  prompt: string;
  detail: string;
  primaryLabel: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryAction?: "confirm_sent" | "escalate";
  category: "Proactive Tasking" | "Workflow Automation" | "Escalation Management";
};

function readMatterId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function lower(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

async function requireMatter(supabase: Awaited<ReturnType<typeof createClient>>, matterId: number, userId: string) {
  const { data: organisationId, error: organisationError } = await supabase.rpc("leo_current_organisation_id");
  if (organisationError || !organisationId) return { error: "Your active organisation could not be resolved.", status: 403 };

  const { data: allowed } = await (supabase as any).rpc("leo_has_permission", {
    target_organisation_id: organisationId,
    target_permission_key: "matters.view",
    target_user_id: userId,
  });

  if (!allowed) return { error: "You do not have permission to view this Matter.", status: 403 };

  const { data: matter, error } = await supabase
    .from("matters")
    .select("id,title,subject,description,status,matter_type,employee_id")
    .eq("id", matterId)
    .maybeSingle();

  if (error || !matter) return { error: "The Matter could not be found or accessed.", status: 404 };
  return { matter };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);
  if (!matterId) return NextResponse.json({ success: false, error: "Invalid Matter." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "You must be signed in." }, { status: 401 });

  const resolved = await requireMatter(supabase, matterId, user.id);
  if ("error" in resolved) return NextResponse.json({ success: false, error: resolved.error }, { status: resolved.status });

  const matter = resolved.matter;
  const [{ data: timeline }, { data: messages }] = await Promise.all([
    supabase.from("matter_timeline").select("event_type,title,description").eq("matter_id", matterId),
    supabase.from("matter_messages").select("role,content").eq("matter_id", matterId).order("created_at", { ascending: true }),
  ]);

  const evidence = [
    matter.title,
    matter.subject,
    matter.description,
    ...(timeline ?? []).flatMap((row: any) => [row.event_type, row.title, row.description]),
    ...(messages ?? []).map((row: any) => row.content),
  ].filter(Boolean).join("\n").toLowerCase();

  const matterType = lower(matter.matter_type);
  const actions: ActionRecord[] = [];

  const disciplinary = matterType.includes("disciplin") || evidence.includes("disciplin");
  const grievance = matterType.includes("griev") || evidence.includes("griev");
  const investigationComplete = /investigation (is )?(complete|completed|concluded)|case to answer|proceed to (a )?disciplinary hearing/.test(evidence);
  const inviteSent = /invitation (has been|was|is) sent|invite (has been|was|is) sent|disciplinary invitation sent|hearing invitation sent/.test(evidence);

  if (disciplinary && investigationComplete && !inviteSent) {
    actions.push({
      id: "disciplinary-invite",
      title: "Disciplinary hearing invitation",
      prompt: "The investigation appears to be complete. Has the disciplinary hearing invitation been sent yet?",
      detail: "Leo can take you straight to the correct invitation so you can prepare it, or you can confirm it has already been sent. The Matter chronology will record your confirmation.",
      primaryLabel: "Prepare invitation",
      primaryHref: "/dashboard/policies/letters/invitation-to-disciplinary-hearing",
      secondaryLabel: "Yes — mark as sent",
      secondaryAction: "confirm_sent",
      category: "Proactive Tasking",
    });
  }

  if (disciplinary && !investigationComplete) {
    actions.push({
      id: "disciplinary-investigation",
      title: "Complete the investigation stage",
      prompt: "Before a disciplinary hearing is arranged, Leo needs the investigation stage to be completed and a case-to-answer decision recorded.",
      detail: "Open the disciplinary investigation checklist to work through the evidence and next-stage decision.",
      primaryLabel: "Open investigation checklist",
      primaryHref: "/dashboard/policies/checklists/disciplinary-investigation-checklist",
      category: "Workflow Automation",
    });
  }

  if (grievance && !/grievance (meeting|hearing).*(held|complete|completed)/.test(evidence)) {
    actions.push({
      id: "grievance-meeting",
      title: "Grievance meeting",
      prompt: "This Matter is in the grievance workflow. Check whether the employee has been invited to a formal grievance meeting.",
      detail: "Leo can take you to the appropriate invitation and keep the Matter moving through the predefined process.",
      primaryLabel: "Prepare grievance invitation",
      primaryHref: "/dashboard/policies/letters/invitation-to-grievance-meeting",
      category: "Proactive Tasking",
    });
  }

  if (lower(matter.status) === "needs attention" || /high risk|escalat|legal advice|senior review/.test(evidence)) {
    actions.push({
      id: "management-review",
      title: "Management review",
      prompt: "This Matter may need authorised human review before the process continues.",
      detail: "Route it to an Owner or Senior user. Leo will record the escalation and keep the employment decision with an authorised person.",
      primaryLabel: "Review Matter",
      secondaryLabel: "Escalate to management",
      secondaryAction: "escalate",
      category: "Escalation Management",
    });
  }

  return NextResponse.json({ success: true, actions });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);
  if (!matterId) return NextResponse.json({ success: false, error: "Invalid Matter." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "You must be signed in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body?.action !== "confirm_sent") {
    return NextResponse.json({ success: false, error: "Unsupported action." }, { status: 400 });
  }

  const { data: organisationId, error: organisationError } = await supabase.rpc("leo_current_organisation_id");
  if (organisationError || !organisationId) return NextResponse.json({ success: false, error: "Your active organisation could not be resolved." }, { status: 403 });

  const { data: allowed } = await (supabase as any).rpc("leo_has_permission", {
    target_organisation_id: organisationId,
    target_permission_key: "matters.update",
    target_user_id: user.id,
  });
  if (!allowed) return NextResponse.json({ success: false, error: "You do not have permission to update this Matter." }, { status: 403 });

  const { error } = await supabase.from("matter_timeline").insert({
    matter_id: matterId,
    event_type: "workflow_task_completed",
    title: "Disciplinary hearing invitation sent",
    description: "The employer confirmed that the disciplinary hearing invitation has been sent. Leo recorded the completed workflow task.",
    created_by: "Leo",
  });

  if (error) {
    console.error("Matter workflow task could not be recorded:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "The workflow task could not be recorded.",
    }, { status: 500 });
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    organisation_id: organisationId,
    user_id: user.id,
    action: "matter_agent_action_completed",
    action_category: "HR Automation",
    entity_type: "Matter",
    entity_name: `Matter #${matterId}`,
    description: "A proactive Matter workflow task was confirmed complete.",
    metadata: { matter_id: matterId, task: "disciplinary_hearing_invitation_sent" },
    source_page: `/dashboard/matters/${matterId}`,
    ip_address: null,
  });

  if (auditError) {
    console.warn("Matter agent action audit event could not be written:", auditError);
  }

  return NextResponse.json({ success: true });
}
