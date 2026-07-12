import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runDisabilityReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const text = input.matterContext.toLowerCase();

  const triggered =
    text.includes("disability") ||
    text.includes("disabled") ||
    text.includes("medical") ||
    text.includes("health condition") ||
    text.includes("ongoing condition") ||
    text.includes("back problem") ||
    text.includes("back pain") ||
    text.includes("reasonable adjustment") ||
    text.includes("adjustment");

  return {
    module: "Disability / Health Condition",
    triggered,
    issues: triggered
      ? [
          "The employee has referred to a health issue or possible disability-related matter.",
        ]
      : [],
    legalConsiderations: triggered
      ? [
          "Consider whether the condition could amount to a disability under the Equality Act 2010.",
          "Consider whether the employer may have a duty to explore reasonable adjustments.",
          "Avoid making assumptions about the employee’s capability, limitations, or medical position without evidence.",
        ]
      : [],
    businessConsiderations: triggered
      ? [
          "The employer should balance operational requirements with the need to consider reasonable adjustments.",
        ]
      : [],
    policyConsiderations: triggered
      ? [
          "Check any sickness absence, capability, flexible working, disability, reasonable adjustments, or wellbeing policy uploaded by the employer.",
        ]
      : [],
    missingInformation: triggered
      ? [
          "What is the nature of the condition and how does it affect the employee’s work?",
          "Is the condition temporary, recurring, long-term, or likely to last 12 months or more?",
          "Has the employee provided medical evidence or consented to an Occupational Health referral?",
          "What adjustment is the employee asking for, and why?",
        ]
      : [],
    recommendedSteps: triggered
      ? [
          "Do not refuse or approve the request automatically.",
          "Arrange a discussion with the employee to understand the health position and requested adjustment.",
          "Consider whether medical or Occupational Health advice is needed.",
          "Review the relevant company policy before deciding how to proceed.",
          "Keep a clear written record of the discussion, evidence considered, and reasons for any decision.",
        ]
      : [],
  };
}