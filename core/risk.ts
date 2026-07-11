import { IntentType } from "./intent";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskAssessment = {
  legal: RiskLevel;
  employee: RiskLevel;
  business: RiskLevel;
  relationship: RiskLevel;
  overall: RiskLevel;
};

function highestRisk(risks: RiskLevel[]): RiskLevel {
  if (risks.includes("critical")) return "critical";
  if (risks.includes("high")) return "high";
  if (risks.includes("medium")) return "medium";
  return "low";
}

export function assessRisk(
  intent: IntentType,
  message: string
): RiskAssessment {
  const text = message.toLowerCase();

  let legal: RiskLevel = "low";
  let employee: RiskLevel = "low";
  let business: RiskLevel = "low";
  let relationship: RiskLevel = "low";

  if (intent === "termination") {
    legal = "critical";
    employee = "critical";
    business = "high";
    relationship = "high";
  }

  if (intent === "grievance") {
    legal = "high";
    employee = "high";
    relationship = "high";
  }

  if (intent === "disciplinary") {
    legal = "high";
    employee = "high";
    business = "medium";
  }

  if (intent === "absence") {
    legal = "medium";
    employee = "medium";
    business = "medium";
  }

  if (intent === "flexible_working") {
    legal = "medium";
    employee = "medium";
    business = "medium";
    relationship = "medium";
  }

  if (intent === "redundancy") {
    legal = "critical";
    employee = "critical";
    business = "critical";
    relationship = "high";
  }

  if (intent === "pay") {
    legal = "high";
    employee = "high";
    business = "medium";
  }

  if (intent === "contract") {
    legal = "medium";
    employee = "medium";
  }

  if (
    text.includes("tribunal") ||
    text.includes("lawyer") ||
    text.includes("claim")
  ) {
    legal = "critical";
    business = "high";
  }

  const overall = highestRisk([legal, employee, business, relationship]);

  return {
    legal,
    employee,
    business,
    relationship,
    overall,
  };
}