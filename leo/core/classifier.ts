import { IntentType } from "./intent";
import { RiskAssessment } from "./risk";

export type LeoClassification = {
  intent: IntentType;
  risk: RiskAssessment;
  category:
    | "advice"
    | "policy_guidance"
    | "escalation_required"
    | "document_needed"
    | "out_of_scope";
  shouldCreateMatter: boolean;
  confidence: "low" | "medium" | "high";
};

export function classify(
  intent: IntentType,
  risk: RiskAssessment,
  message: string
): LeoClassification {
  const text = message.toLowerCase();

  if (intent === "non_workplace") {
    return {
      intent,
      risk,
      category: "out_of_scope",
      shouldCreateMatter: false,
      confidence: "high",
    };
  }

  if (risk.overall === "critical" || risk.legal === "critical") {
    return {
      intent,
      risk,
      category: "escalation_required",
      shouldCreateMatter: true,
      confidence: "high",
    };
  }

  if (
    intent === "disciplinary" ||
    intent === "grievance" ||
    intent === "termination" ||
    text.includes("letter") ||
    text.includes("write")
  ) {
    return {
      intent,
      risk,
      category: "document_needed",
      shouldCreateMatter: true,
      confidence: "medium",
    };
  }

  if (
    intent === "policy_question" ||
    intent === "contract" ||
    intent === "pay" ||
    intent === "absence" ||
    intent === "flexible_working"
  ) {
    return {
      intent,
      risk,
      category: "policy_guidance",
      shouldCreateMatter: true,
      confidence: "high",
    };
  }

  return {
    intent,
    risk,
    category: "advice",
    shouldCreateMatter: false,
    confidence: "medium",
  };
}