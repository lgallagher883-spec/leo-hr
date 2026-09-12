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

  if (
    risk.overall === "critical" ||
    risk.legal === "critical"
  ) {
    return {
      intent,
      risk,
      category: "escalation_required",
      shouldCreateMatter: true,
      confidence: "high",
    };
  }

  const explicitlyRequestsDocument =
    text.includes("write me") ||
    text.includes("draft") ||
    text.includes("prepare a letter") ||
    text.includes("write a letter") ||
    text.includes("write an email") ||
    text.includes("draft an email") ||
    text.includes("template");

  if (explicitlyRequestsDocument) {
    return {
      intent,
      risk,
      category: "document_needed",
      shouldCreateMatter: false,
      confidence: "high",
    };
  }

  const looksLikePolicyGuidance =
    intent === "policy_question" ||
    text.startsWith("what is ") ||
    text.startsWith("what are ") ||
    text.startsWith("how does ") ||
    text.includes("what does the law say") ||
    text.includes("what is the law") ||
    text.includes("guidance on");

  if (looksLikePolicyGuidance) {
    return {
      intent,
      risk,
      category: "policy_guidance",
      shouldCreateMatter: false,
      confidence: "high",
    };
  }

  return {
    intent,
    risk,
    category: "advice",
    shouldCreateMatter: false,
    confidence: "high",
  };
}
