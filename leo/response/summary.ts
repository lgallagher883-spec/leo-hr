import { LeoCoreOutput } from "../core/router";
import { getKnowledge } from "../knowledge";
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
  const knowledge = getKnowledge(result.intent);

  return {
    understanding: buildSummaryUnderstanding(
      result,
      matterDescription,
      knowledge
    ),
    risk: formatRisk(result.risk.overall),
    nextStep:
      knowledge?.nextStep ||
      "Continue the conversation with Leo so the matter can be assessed and the next appropriate HR step can be identified.",
  };
}

function formatRisk(risk: string): string {
  return risk.toUpperCase();
}