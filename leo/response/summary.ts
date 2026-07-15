import { LeoCoreOutput } from "../core/router";
import { searchKnowledge } from "../knowledge";
import { buildSummaryUnderstanding } from "./summaryBuilder";

export type LeoSummaryOutput = {
  understanding: string;
  risk: string;
  nextStep: string;
};

export function generateLeoSummary(
  result: LeoCoreOutput,
  matterDescription?: string
): LeoSummaryOutput {
  const knowledge = searchKnowledge({
    message:
      matterDescription?.trim() ||
      String(result.intent),
  });

  return {
    understanding: buildSummaryUnderstanding(
      result,
      matterDescription,
      knowledge
    ),

    risk: formatRisk(
      result.risk.overall
    ),

    nextStep:
      "Continue the conversation with Leo so the current position can be assessed and the next appropriate step identified.",
  };
}

function formatRisk(
  risk: string
): string {
  return String(risk).toUpperCase();
}