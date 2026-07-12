import { LeoCoreOutput } from "../core/router";
import { ReasoningOutput } from "../reasoning/reasoner";

export function buildNextSteps(
  result: LeoCoreOutput,
  reasoning?: ReasoningOutput
): string[] {
  if (reasoning?.recommendedSteps.length) {
    return reasoning.recommendedSteps;
  }

  const steps = [
    "Review the relevant company policy or procedure.",
    "Record the key facts and timeline of events.",
    "Identify whether any further information is needed before deciding what to do next.",
  ];

  if (result.risk.overall === "medium" || result.risk.overall === "high") {
    steps.push("Consider whether the matter should be managed as a formal HR process.");
  }

  if (result.risk.overall === "high") {
    steps.push("Consider taking specialist HR or legal advice before progressing.");
  }

  if (result.requiresMatter) {
    steps.push("Continue managing this matter within the Leo Matter workspace.");
  }

  return steps;
}