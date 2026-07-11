import { LeoCoreOutput } from "../core/router";
import { ReasoningOutput } from "../reasoning/reasoner";

export function buildGuidance(
  result: LeoCoreOutput,
  reasoning?: ReasoningOutput
): string {
  if (!reasoning) {
    return (
      "Based on the information currently available, Leo recommends approaching this matter in a structured way and checking the relevant company policy before deciding how to proceed."
    );
  }

  const paragraphs: string[] = [];

  paragraphs.push(
    "Leo would first check the relevant company policy or procedure for this type of matter. If the organisation has uploaded a policy, Leo should use that policy as the starting point for guidance."
  );

  if (reasoning.secondaryIssues.length > 0) {
    paragraphs.push(reasoning.secondaryIssues.join(" "));
  }

  if (reasoning.businessConsiderations.length > 0) {
    paragraphs.push(reasoning.businessConsiderations.join(" "));
  }

  if (reasoning.legalConsiderations.length > 0) {
    paragraphs.push(
      "Legal considerations include: " +
        reasoning.legalConsiderations.join(" ")
    );
  }

  if (paragraphs.length === 1) {
    paragraphs.push(
      "Based on the information currently available, Leo recommends approaching this matter in a structured and evidence-based way before deciding how to proceed."
    );
  }

  return paragraphs.join("\n\n");
}