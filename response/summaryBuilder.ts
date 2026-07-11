import { LeoCoreOutput } from "../core/router";
import { KnowledgeArticle } from "../knowledge";

export function buildSummaryUnderstanding(
  result: LeoCoreOutput,
  matterDescription?: string,
  knowledge?: KnowledgeArticle | null
): string {
  const description = matterDescription?.trim();

  if (knowledge) {
    return (
      `Based on the information available, this appears to involve ${knowledge.title.toLowerCase()}. ` +
      knowledge.summary
    );
  }

  return (
    description ||
    "Based on the information available, Leo has identified this as an HR matter requiring further assessment."
  );
}