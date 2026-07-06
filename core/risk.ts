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

export function assessRisk(intent: string, message: string): RiskAssessment {
  const text = message.toLowerCase();

  // Default baseline
  let legal: RiskLevel = "low";
  let employee: RiskLevel = "low";
  let business: RiskLevel = "low";
  let relationship: RiskLevel = "low";

  // Termination / dismissal risk
  if (intent === "termination") {
    legal = "critical";
    employee = "critical";
    business = "high";
    relationship = "high";
  }

  // Grievance risk
  if (intent === "grievance") {
    legal = "high";
    employee = "high";
    relationship = "high";
  }

  // Disciplinary risk
  if (intent === "disciplinary") {
    legal = "high";
    employee = "high";
    business = "medium";
  }

  // Absence / sickness
  if (intent === "absence") {
    legal = "medium";
    employee = "medium";
    business = "medium";
  }

  // Redundancy
  if (intent === "redundancy") {
    legal = "critical";
    employee = "critical";
    business = "critical";
    relationship = "high";
  }

  // Pay issues
  if (intent === "pay") {
    legal = "high";
    employee = "high";
    business = "medium";
  }

  // Contract issues
  if (intent === "contract") {
    legal = "medium";
    employee = "medium";
  }

  // Escalation keywords (override logic)
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
    overall
  };
}