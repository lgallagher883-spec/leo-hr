import { detectIntent, IntentType } from "./intent";
import { assessRisk, RiskAssessment } from "./risk";
import { classify, LeoClassification } from "./classifier";
import { runReasoningModules } from "../reasoning/modules";
import { ReasoningModuleOutput } from "../reasoning/modules/types";

export type LeoCoreOutput = {
  intent: IntentType;
  risk: RiskAssessment;
  decision: LeoClassification;
  requiresMatter: boolean;
  reasoningModules: ReasoningModuleOutput[];
};

export type LeoRoutingOutput = Omit<LeoCoreOutput, "reasoningModules">;

export function runLeoRouting(message: string): LeoRoutingOutput {
  // 1. Intent recognition
  const intent = detectIntent(message);

  // 2. Risk assessment
  const risk = assessRisk(intent, message);

  // 3. Classification decision
  const decision = classify(intent, risk, message);

  // 4. Matter rule
  const requiresMatter =
    decision.shouldCreateMatter ||
    decision.category === "escalation_required";

  return {
    intent,
    risk,
    decision,
    requiresMatter,
  };
}

export function runLeoCore(message: string): LeoCoreOutput {
  const routing = runLeoRouting(message);

  // 4. Legacy professional HR reasoning for non-Ask-Leo consumers.
  const reasoningModules = runReasoningModules({
    matterContext: message,
    intent: String(routing.intent),
    risk: String(routing.risk.overall),
  });

  return {
    ...routing,
    reasoningModules,
  };
}