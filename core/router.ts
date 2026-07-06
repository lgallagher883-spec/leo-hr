import { detectIntent, IntentType } from "./intent";
import { assessRisk, RiskAssessment } from "./risk";
import { classify, LeoClassification } from "./classifier";

export type LeoCoreOutput = {
  intent: IntentType;
  risk: RiskAssessment;
  decision: LeoClassification;
  requiresMatter: boolean;
};

export function runLeoCore(message: string): LeoCoreOutput {
  // 1. Intent recognition
  const intent = detectIntent(message);

  // 2. Risk assessment
  const risk = assessRisk(intent, message);

  // 3. Classification decision
  const decision = classify(intent, risk, message);

  // 4. Matter rule (final override safety check)
  const requiresMatter =
    decision.shouldCreateMatter ||
    decision.category === "escalation_required";

  return {
    intent,
    risk,
    decision,
    requiresMatter
  };
}