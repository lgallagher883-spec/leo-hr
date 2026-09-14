import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateAgentAction, highestModelTier, highestRiskLevel } from "./policy";
import type {
  AgentPolicyDecision,
  CreateAgentRunInput,
} from "./types";

type PlannedTask = {
  sequence: number;
  decision: AgentPolicyDecision;
  agentKey: CreateAgentRunInput["tasks"][number]["agentKey"];
  skillKey: string | null;
  action: CreateAgentRunInput["tasks"][number]["action"];
  toolKey: string | null;
  summary: string;
  input: Record<string, unknown>;
};

export type AgentRunResult =
  | {
      success: true;
      runId: string;
      status: "running" | "awaiting_approval";
      approvalsRequired: number;
    }
  | {
      success: false;
      error: string;
    };

export async function createAgentRun(
  input: CreateAgentRunInput,
): Promise<AgentRunResult> {
  if (!input.organisationId.trim() || !input.goal.trim()) {
    return { success: false, error: "Organisation and goal are required." };
  }

  if (input.tasks.length === 0) {
    return { success: false, error: "At least one task is required." };
  }

  const plannedTasks: PlannedTask[] = input.tasks.map((task, index) => ({
    sequence: index,
    decision: evaluateAgentAction({
      action: task.action,
      actorRole: input.actorRole,
    }),
    agentKey: task.agentKey,
    skillKey: task.skillKey ?? null,
    action: task.action,
    toolKey: task.toolKey ?? null,
    summary: task.summary,
    input: task.input ?? {},
  }));

  const blocked = plannedTasks.find((task) => !task.decision.allowed);
  if (blocked) {
    return {
      success: false,
      error:
        blocked.decision.approvalReason ||
        "The requested agent action is not permitted.",
    };
  }

  const riskLevel = highestRiskLevel(
    plannedTasks.map((task) => task.decision.riskLevel),
  );
  const modelTier = highestModelTier(
    plannedTasks.map((task) => task.decision.modelTier),
  );
  const approvalsRequired = plannedTasks.filter(
    (task) => task.decision.requiresApproval,
  ).length;
  const initialStatus =
    approvalsRequired > 0 ? "awaiting_approval" : "running";

  const supabase = createAdminClient();

  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      organisation_id: input.organisationId,
      requested_by: input.requestedBy ?? null,
      agent_key: input.agentKey,
      goal: input.goal,
      status: initialStatus,
      risk_level: riskLevel,
      model_tier: modelTier,
      started_at: initialStatus === "running" ? new Date().toISOString() : null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (runError || !run) {
    return {
      success: false,
      error: runError?.message || "Agent run could not be created.",
    };
  }

  const taskRows = plannedTasks.map((task) => ({
    run_id: run.id,
    organisation_id: input.organisationId,
    agent_key: task.agentKey,
    skill_key: task.skillKey,
    action_key: task.action,
    status: task.decision.requiresApproval ? "awaiting_approval" : "pending",
    requires_approval: task.decision.requiresApproval,
    approval_reason: task.decision.approvalReason,
    tool_key: task.toolKey,
    input: {
      ...task.input,
      summary: task.summary,
      policy: {
        riskLevel: task.decision.riskLevel,
        modelTier: task.decision.modelTier,
        mayDelegate: task.decision.mayDelegate,
      },
    },
    sequence: task.sequence,
  }));

  const { data: createdTasks, error: taskError } = await supabase
    .from("agent_tasks")
    .insert(taskRows)
    .select("id,sequence,requires_approval,approval_reason,agent_key,action_key");

  if (taskError || !createdTasks) {
    await supabase.from("agent_runs").delete().eq("id", run.id);
    return {
      success: false,
      error: taskError?.message || "Agent tasks could not be created.",
    };
  }

  const approvalRows = createdTasks
    .filter((task) => task.requires_approval)
    .map((task) => ({
      run_id: run.id,
      task_id: task.id,
      organisation_id: input.organisationId,
      requested_by_agent: task.agent_key,
      approval_type: task.action_key,
      summary:
        plannedTasks.find((planned) => planned.sequence === task.sequence)
          ?.summary || "Agent action requires approval.",
      status: "pending",
    }));

  if (approvalRows.length > 0) {
    const { error: approvalError } = await supabase
      .from("agent_approvals")
      .insert(approvalRows);

    if (approvalError) {
      await supabase.from("agent_runs").delete().eq("id", run.id);
      return {
        success: false,
        error: approvalError.message,
      };
    }
  }

  await supabase.from("audit_logs").insert({
    organisation_id: input.organisationId,
    user_id: input.requestedBy ?? null,
    action: "agent_run_created",
    action_category: "System",
    entity_type: "agent_run",
    entity_id: run.id,
    entity_name: input.agentKey,
    description: input.goal,
    metadata: {
      riskLevel,
      modelTier,
      approvalsRequired,
      taskCount: plannedTasks.length,
    },
    source_page: "agentic_leo",
  });

  return {
    success: true,
    runId: run.id,
    status: initialStatus,
    approvalsRequired,
  };
}

export async function rememberAgentContext(args: {
  organisationId: string;
  createdBy?: string | null;
  memoryType: string;
  title: string;
  content: string;
  keywords?: string[];
  scope?: "organisation" | "client" | "project" | "agent" | "run";
  scopeRef?: string | null;
  sensitivity?: "internal" | "confidential" | "restricted";
  source: string;
  sourceRef?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();

  return supabase.from("agent_memory").insert({
    organisation_id: args.organisationId,
    created_by: args.createdBy ?? null,
    memory_type: args.memoryType,
    title: args.title,
    content: args.content,
    keywords: args.keywords ?? [],
    scope: args.scope ?? "organisation",
    scope_ref: args.scopeRef ?? null,
    sensitivity: args.sensitivity ?? "internal",
    source: args.source,
    source_ref: args.sourceRef ?? null,
    metadata: args.metadata ?? {},
  });
}
