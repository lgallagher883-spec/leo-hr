import { LeoCoreOutput } from "../core/router";
import { KnowledgeSearchResult } from "../knowledge";

export function buildSummaryUnderstanding(
  result: LeoCoreOutput,
  matterDescription: string | undefined,
  knowledge: KnowledgeSearchResult
): string {
  const description =
    matterDescription?.trim();

  const primaryKnowledge =
    knowledge.sources[0];

  const knowledgeContext =
    primaryKnowledge
      ? ` Relevant organisation information was found in ${primaryKnowledge.title}.`
      : "";

  if (description) {
    return (
      `This Matter concerns ${description}. ` +
      `Leo has identified it as a ${formatIntent(
        result.intent
      )} matter.${knowledgeContext}`
    );
  }

  return (
    `This appears to be a ${formatIntent(
      result.intent
    )} matter.${knowledgeContext}`
  );
}

function formatIntent(
  intent: unknown
): string {
  return String(intent)
    .replace(/[_-]+/g, " ")
    .toLowerCase();
}