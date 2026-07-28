import { LeoCoreOutput } from "../core/router";
import { ReasoningOutput } from "./reasoner";

export type DecisionFrameworkStage =
  | "observe"
  | "understand"
  | "explore"
  | "weigh_priorities"
  | "reduce_uncertainty"
  | "evaluate_options"
  | "validate_authority"
  | "recommend_next_step"
  | "remain_alongside";

export type DecisionFrameworkOutput = {
  decisionSequence: DecisionFrameworkStage[];
  decisionPrinciples: string[];
  proportionateRecommendation: string;
  nextQuestion: string | null;
  escalationRecommendation: string | null;
  uncertaintyPlan: string[];
  confidenceStatement: string;
};

export function buildDecisionFramework(
  core: LeoCoreOutput,
  reasoning: ReasoningOutput,
  message: string
): DecisionFrameworkOutput {
  const stages: DecisionFrameworkStage[] = [
    "observe",
    "understand",
    "explore",
    "weigh_priorities",
    "reduce_uncertainty",
    "evaluate_options",
    "validate_authority",
    "recommend_next_step",
    "remain_alongside",
  ];

  const principles = [
    "Recommend the least intrusive step that remains fair, reasonable and appropriate.",
    "Support before sanction where suitable.",
    "Investigation before conclusion.",
    "Facts before assumptions.",
    "Urgency should never replace fairness.",
    "The recommendation should move the matter forward.",
  ];

  const needsFurtherQuestion =
    reasoning.missingInformation.length > 0 ||
    reasoning.shouldAskQuestionsFirst;

  const nextQuestion = needsFurtherQuestion
    ? reasonedNextQuestion(reasoning, message)
    : null;

  const uncertaintyPlan = buildUncertaintyPlan(reasoning);

  const escalationRecommendation = buildEscalationRecommendation(core, reasoning);

  const proportionateRecommendation = buildProportionateRecommendation(
    reasoning,
    core,
    needsFurtherQuestion
  );

  const confidenceStatement = buildConfidenceStatement(core, reasoning);

  return {
    decisionSequence: stages,
    decisionPrinciples: principles,
    proportionateRecommendation,
    nextQuestion,
    escalationRecommendation,
    uncertaintyPlan,
    confidenceStatement,
  };
}

function buildProportionateRecommendation(
  reasoning: ReasoningOutput,
  core: LeoCoreOutput,
  needsFurtherQuestion: boolean
): string {
  const base = reasoning.professionalRecommendation || reasoning.immediateNextStep;

  if (!base) {
    return "The next step should be to clarify the facts and reduce uncertainty before making a firm recommendation.";
  }

  if (needsFurtherQuestion) {
    return `${base} The recommendation should remain proportionate and should only move to a firm action once the missing information has been addressed.`;
  }

  if (core.risk.overall === "high") {
    return `${base} The recommendation should be practical, timely and suitably escalated where the risk or authority level requires it.`;
  }

  return `${base} The recommendation should be proportionate, practical and achievable for the employer now.`;
}

function reasonedNextQuestion(
  reasoning: ReasoningOutput,
  message: string
): string {
  if (reasoning.missingInformation.length > 0) {
    return `The most useful next question is: ${reasoning.missingInformation[0]}`;
  }

  const normalised = message.toLowerCase();

  if (normalised.includes("grievance") || normalised.includes("complaint")) {
    return "What is the employer trying to establish first: the facts, the process, or the desired outcome?";
  }

  if (normalised.includes("absence") || normalised.includes("sick")) {
    return "What is the current medical position and how long is the absence expected to continue?";
  }

  return "What factual detail would most materially change the recommendation?";
}

function buildUncertaintyPlan(reasoning: ReasoningOutput): string[] {
  const plan = [
    "Identify the gap in facts clearly.",
    "Explain why the uncertainty matters for the decision.",
    "Recommend the minimal step needed to reduce it.",
  ];

  if (reasoning.missingInformation.length > 0) {
    plan.push(`Address the missing information: ${reasoning.missingInformation.join("; ")}`);
  }

  return plan;
}

function buildEscalationRecommendation(
  core: LeoCoreOutput,
  reasoning: ReasoningOutput
): string | null {
  const reasons = reasoning.legalConsiderations.join(" ").toLowerCase();

  if (
    core.requiresMatter ||
    core.risk.overall === "high" ||
    reasons.includes("safeguarding") ||
    reasons.includes("regulatory") ||
    reasons.includes("independence")
  ) {
    return "Escalation should be considered where authority, independence, safeguarding or regulatory obligations materially affect the next step.";
  }

  return null;
}

function buildConfidenceStatement(
  core: LeoCoreOutput,
  reasoning: ReasoningOutput
): string {
  if (core.risk.overall === "high") {
    return "Leo should be confident in the recommendation while remaining clear that the facts should continue to be tested where necessary.";
  }

  return `Leo should recommend the next step confidently, but with the professional caveat that ${reasoning.primaryIssue.toLowerCase()} requires careful sequencing and evidence.`;
}
