import type {
  AgentAction,
  AgentActorRole,
  AgentModelTier,
  AgentPolicyDecision,
  AgentRiskLevel,
} from "./types";

const restrictedActions = new Set<AgentAction>([
  "dismissal",
  "delete",
]);

const highRiskActions = new Set<AgentAction>([
  "send_external",
  "financial",
  "legal_hr_judgement",
  "employee_sensitive",
  "submit_external",
]);

const approvalActions = new Set<AgentAction>([
  "send_external",
  "financial",
  "employee_sensitive",
  "submit_external",
  "dismissal",
  "delete",
]);

const reasoningActions = new Set<AgentAction>([
  "legal_hr_judgement",
  "dismissal",
]);

const economyActions = new Set<AgentAction>([
  "classify",
  "draft_internal",
  "draft_external",
]);

function riskForAction(action: AgentAction): AgentRiskLevel {
  if (restrictedActions.has(action)) return "restricted";
  if (highRiskActions.has(action)) return "high";
  if (action === "write_internal" || action === "draft_external") return "medium";
  return "low";
}

function modelForAction(action: AgentAction): AgentModelTier {
  if (reasoningActions.has(action)) return "reasoning";
  if (economyActions.has(action)) return "economy";
  return "deterministic";
}

export function evaluateAgentAction(args: {
  action: AgentAction;
  actorRole: AgentActorRole;
}): AgentPolicyDecision {
  const { action, actorRole } = args;
  const riskLevel = riskForAction(action);
  const modelTier = modelForAction(action);

  if (actorRole === "employee") {
    return {
      allowed: false,
      riskLevel,
      requiresApproval: false,
      approvalReason: "Agentic workforce actions are not available to Employee accounts.",
      modelTier,
      mayDelegate: false,
    };
  }

  if (actorRole === "manager" && (riskLevel === "high" || riskLevel === "restricted")) {
    return {
      allowed: false,
      riskLevel,
      requiresApproval: false,
      approvalReason: "This action requires Owner or Senior authority.",
      modelTier,
      mayDelegate: false,
    };
  }

  // Dismissal is deliberately blocked from autonomous execution.
  // Ask Leo may analyse the situation, but the agent workforce cannot send,
  // action or complete a dismissal on the employer's behalf.
  if (action === "dismissal") {
    return {
      allowed: false,
      riskLevel: "restricted",
      requiresApproval: true,
      approvalReason:
        "Dismissal cannot be executed by Agentic Leo. Route the HR reasoning to Ask Leo and require an authorised human decision.",
      modelTier: "reasoning",
      mayDelegate: false,
    };
  }

  const requiresApproval = approvalActions.has(action);

  return {
    allowed: true,
    riskLevel,
    requiresApproval,
    approvalReason: requiresApproval
      ? "Explicit Owner or Senior approval is required before this action can be executed."
      : null,
    modelTier,
    mayDelegate: action !== "employee_sensitive" && action !== "delete",
  };
}

export function highestModelTier(tiers: AgentModelTier[]): AgentModelTier {
  if (tiers.includes("reasoning")) return "reasoning";
  if (tiers.includes("economy")) return "economy";
  return "deterministic";
}

export function highestRiskLevel(levels: AgentRiskLevel[]): AgentRiskLevel {
  const order: AgentRiskLevel[] = ["low", "medium", "high", "restricted"];
  return levels.reduce(
    (highest, current) =>
      order.indexOf(current) > order.indexOf(highest) ? current : highest,
    "low",
  );
}
