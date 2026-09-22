import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ActionBody = {
  action?: unknown;
  matterId?: unknown;
  reason?: unknown;
};

const workflowStages = ["Open", "In Progress", "Needs Attention", "Closed"] as const;

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stageIndex(status: unknown) {
  const value = readText(status);
  const index = workflowStages.indexOf(value as (typeof workflowStages)[number]);
  return index >= 0 ? index : 0;
}

async function requireContext() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ success: false, error: "You must be signed in." }, { status: 401 }) };
  }

  const resolved = await resolveAuthoritativeUserRole(admin as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  if (!resolved) {
    return { response: NextResponse.json({ success: false, error: "Your active organisation could not be resolved." }, { status: 403 }) };
  }

  const organisationId = resolved.membership.organisation_id;
  const roleKey = resolved.roleKey;

  if (!["owner", "senior", "manager"].includes(roleKey)) {
    return { response: NextResponse.json({ success: false, error: "This workspace is available to management users." }, { status: 403 }) };
  }

  return { supabase, admin, user, organisationId, roleKey };
}

async function scopedMatters(admin: ReturnType<typeof createAdminClient>, organisationId: string) {
  const employeeResult = await (admin as any)
    .from("employees")
    .select("id")
    .eq("organisation_id", organisationId);

  const employeeIds = (employeeResult.data ?? []).map((row: { id: number }) => row.id);
  if (employeeIds.length === 0) return [];

  const result = await (admin as any)
    .from("matters")
    .select("id,title,subject,status,matter_type,employee_id,created_at")
    .in("employee_id", employeeIds)
    .order("created_at", { ascending: false });

  return result.data ?? [];
}

export async function GET() {
  try {
    const access = await requireContext();
    if ("response" in access) return access.response;

    const { admin, organisationId, user, roleKey } = access;
    const matters = await scopedMatters(admin, organisationId);

    const [auditResult, notificationResult] = await Promise.all([
      (admin as any)
        .from("audit_logs")
        .select("action,action_category,created_at,metadata")
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: false })
        .limit(5000),
      (admin as any)
        .from("organisation_notifications")
        .select("id,title,message,action_url,created_at,is_read,is_dismissed,metadata")
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const logs = auditResult.data ?? [];
    const notifications = notificationResult.data ?? [];

    const proactiveCreated = logs.filter((row: any) => row.action === "reminder_milestone_emitted").length;
    const matterAgentActions = logs.filter((row: any) => row.action === "matter_agent_action_completed").length;
    const proactiveAcknowledged = logs.filter((row: any) => row.action === "reminder_acknowledged").length;
    const workflowAdvances = logs.filter((row: any) => row.action === "workflow_stage_advanced").length;
    const escalationsRaised = logs.filter((row: any) => row.action === "matter_escalated_to_management").length;

    const escalations = notifications
      .filter((row: any) => row.metadata?.agent_operation === "management_escalation" && row.metadata?.recipient_user_id === user.id && !row.is_dismissed)
      .map((row: any) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        actionUrl: row.action_url,
        createdAt: row.created_at,
        isRead: row.is_read,
        matterId: row.metadata?.matter_id ?? null,
        reason: row.metadata?.reason ?? null,
        recipientRole: row.metadata?.recipient_role ?? null,
      }));

    return NextResponse.json({
      success: true,
      role: roleKey,
      currentUserId: user.id,
      workflowStages,
      matters: matters.map((matter: any) => ({
        ...matter,
        workflowStage: stageIndex(matter.status),
        nextStage: stageIndex(matter.status) < workflowStages.length - 1
          ? workflowStages[stageIndex(matter.status) + 1]
          : null,
      })),
      escalations,
      usage: {
        proactiveTasksCreated: proactiveCreated,
        proactiveTasksAcknowledged: proactiveAcknowledged,
        workflowStagesAdvanced: workflowAdvances,
        managementEscalationsRaised: escalationsRaised,
        matterAgentActionsCompleted: matterAgentActions,
        trackedAutomationEvents: proactiveCreated + proactiveAcknowledged + workflowAdvances + escalationsRaised + matterAgentActions,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Agent Operations GET failed:", error);
    return NextResponse.json({ success: false, error: "Agent Operations data could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireContext();
    if ("response" in access) return access.response;

    const { admin, organisationId, user, roleKey } = access;
    const body = (await request.json().catch(() => null)) as ActionBody | null;
    const action = readText(body?.action);
    const matterId = Number(body?.matterId);

    if (!Number.isInteger(matterId) || matterId <= 0) {
      return NextResponse.json({ success: false, error: "A valid Matter is required." }, { status: 400 });
    }

    const matters = await scopedMatters(admin, organisationId);
    const matter = matters.find((item: any) => Number(item.id) === matterId);

    if (!matter) {
      return NextResponse.json({ success: false, error: "The Matter could not be found in your organisation." }, { status: 404 });
    }

    if (action === "advance_workflow") {
      return NextResponse.json({
        success: false,
        error: "Matter stages are evidence-led. Open the Matter and complete Leo's next action rather than advancing the process manually.",
      }, { status: 409 });
    }

    if (action === "escalate") {
      const reason = readText(body?.reason) || "This Matter requires management review before the workflow continues.";

      const membershipResult = await (admin as any)
        .from("organisation_memberships")
        .select("user_id,role,membership_status")
        .eq("organisation_id", organisationId)
        .eq("membership_status", "active")
        .in("role", ["owner", "senior"]);

      const recipients = (membershipResult.data ?? []).filter((row: any) => row.user_id && row.user_id !== user.id);

      if (recipients.length === 0 && !["owner", "senior"].includes(roleKey)) {
        return NextResponse.json({ success: false, error: "No active Owner or Senior user is available to receive this escalation." }, { status: 409 });
      }

      await (admin as any)
        .from("matters")
        .update({ status: "Needs Attention" })
        .eq("id", matterId);

      if (recipients.length > 0) {
        const rows = recipients.map((recipient: any) => ({
          organisation_id: organisationId,
          notification_key: `management-escalation:${matterId}:${recipient.user_id}:${Date.now()}`,
          notification_type: "reminder",
          event_version: "agent-operations-v1",
          title: "Management escalation requires review",
          message: `${matter.subject || matter.title || `Matter #${matterId}`}: ${reason}`,
          action_url: `/dashboard/matters/${matterId}`,
          action_label: "Review escalation",
          metadata: {
            recipient_user_id: recipient.user_id,
            agent_operation: "management_escalation",
            matter_id: matterId,
            reason,
            escalated_by: user.id,
            escalated_by_role: roleKey,
            recipient_role: recipient.role,
          },
          is_read: false,
          is_dismissed: false,
        }));

        await (admin as any).from("organisation_notifications").insert(rows);
      }

      await (admin as any).from("matter_timeline").insert({
        matter_id: matterId,
        event_type: "management_escalation",
        title: "Escalated for management review",
        description: reason,
        created_by: "Leo",
      });

      await (admin as any).from("audit_logs").insert({
        organisation_id: organisationId,
        user_id: user.id,
        action: "matter_escalated_to_management",
        action_category: "Escalation Management",
        entity_type: "Matter",
        entity_name: matter.subject || matter.title || `Matter #${matterId}`,
        description: reason,
        metadata: { matter_id: matterId, recipient_count: recipients.length, escalated_by_role: roleKey },
        source_page: "/dashboard/agent-operations",
        ip_address: null,
      });

      return NextResponse.json({ success: true, recipientCount: recipients.length, status: "Needs Attention" });
    }

    return NextResponse.json({ success: false, error: "The requested Agent Operations action is not supported." }, { status: 400 });
  } catch (error) {
    console.error("Agent Operations POST failed:", error);
    return NextResponse.json({ success: false, error: "The Agent Operations action could not be completed." }, { status: 500 });
  }
}
