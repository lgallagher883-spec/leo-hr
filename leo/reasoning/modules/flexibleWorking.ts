import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runFlexibleWorkingReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const text = input.matterContext.toLowerCase();

  const triggered =
    input.intent === "flexible_working" ||
    text.includes("flexible working") ||
    text.includes("change hours") ||
    text.includes("change his hours") ||
    text.includes("change her hours") ||
    text.includes("reduce hours") ||
    text.includes("working pattern") ||
    text.includes("part time") ||
    text.includes("full time") ||
    text.includes("compressed hours") ||
    text.includes("hybrid") ||
    text.includes("work from home");

  return {
    module: "Flexible Working",
    triggered,
    issues: triggered
      ? [
          "The employee appears to be requesting a change to their working hours or working pattern.",
        ]
      : [],
    legalConsiderations: triggered
      ? [
          "Consider whether this should be treated as a statutory flexible working request.",
          "Any refusal should be based on a recognised business reason and supported by evidence.",
          "The employer should consider whether the request overlaps with any health, disability, childcare, pregnancy, or discrimination-related issue.",
        ]
      : [],
    businessConsiderations: triggered
      ? [
          "Assess the operational impact of the requested working pattern.",
          "Consider whether the business can accommodate the request temporarily, permanently, or through a compromise arrangement.",
        ]
      : [],
    policyConsiderations: triggered
      ? [
          "Check the employer’s flexible working policy and any relevant contractual working hours provisions.",
        ]
      : [],
    missingInformation: triggered
      ? [
          "What exact working pattern is the employee requesting?",
          "Is the request temporary or permanent?",
          "Has the employee made the request formally?",
          "What date does the employee want the change to start?",
          "What operational impact would the change have on the business?",
          "Are there alternative working patterns or temporary arrangements that could meet both the employee’s needs and the business needs?",
        ]
      : [],
    recommendedSteps: triggered
      ? [
          "Acknowledge the request and avoid refusing it immediately.",
          "Check the flexible working policy and contract position.",
          "Meet with the employee to understand the request and reasons for it.",
          "Assess the business impact using evidence rather than assumptions.",
          "Consider whether a temporary arrangement, trial period, or alternative working pattern could be suitable.",
          "Confirm the decision and reasons in writing.",
        ]
      : [],
  };
}