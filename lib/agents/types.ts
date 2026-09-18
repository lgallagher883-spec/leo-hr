export type AgentKey =
  | "business_administrator"
  | "procurement_manager"
  | "content_manager"
  | "hr_resource_writer"
  | "ask_leo"
  | "system";

export type AgentRiskLevel = "low" | "medium" | "high" | "restricted";
export type AgentModelTier = "deterministic" | "economy" | "reasoning";

export type AgentAction =
  | "read_internal"
  | "classify"
  | "calculate"
  | "draft_internal"
  | "draft_external"
  | "write_internal"
  | "send_external"
  | "financial"
  | "legal_hr_judgement"
  | "employee_sensitive"
  | "dismissal"
  | "delete"
  | "submit_external";

export type AgentRunStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentActorRole = "owner" | "senior" | "manager" | "employee" | "system";

export type AgentPolicyDecision = {
  allowed: boolean;
  riskLevel: AgentRiskLevel;
  requiresApproval: boolean;
  approvalReason: string | null;
  modelTier: AgentModelTier;
  mayDelegate: boolean;
};

export type AgentTaskPlan = {
  agentKey: AgentKey;
  skillKey?: string | null;
  action: AgentAction;
  toolKey?: string | null;
  summary: string;
  input?: Record<string, unknown>;
};

export type CreateAgentRunInput = {
  organisationId: string;
  requestedBy?: string | null;
  actorRole: AgentActorRole;
  agentKey: AgentKey;
  goal: string;
  tasks: AgentTaskPlan[];
  metadata?: Record<string, unknown>;
};
