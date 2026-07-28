import {
  KnowledgeChunk,
  KnowledgeSearchInput,
  KnowledgeSearchResult,
} from "./types";

type SearchableChunk = KnowledgeChunk & {
  documentTitle: string;
  sourceType: any;
};

export function retrieveKnowledge({
  query,
  sourceTypes,
  maximumResults = 8,
}: KnowledgeSearchInput,
chunks: SearchableChunk[]): KnowledgeSearchResult[] {

  const searchTerms = normaliseQuery(query);

  const scored = chunks
    .filter((chunk) => {
      if (!sourceTypes?.length) return true;

      return sourceTypes.includes(chunk.sourceType);
    })
    .map((chunk) => {
      const metadata = (chunk.metadata || {}) as Record<string, unknown>;

      let score = 0;

      const content = chunk.content.toLowerCase();
      const heading = (chunk.heading || "").toLowerCase();
      const title = chunk.documentTitle.toLowerCase();

      for (const term of searchTerms) {
        if (content.includes(term)) score += 10;
        if (heading.includes(term)) score += 25;
        if (title.includes(term)) score += 30;
      }

      const phrase = searchTerms.join(" ");

      if (phrase.length > 5 && content.includes(phrase)) {
        score += 40;
      }

      if (metadata.isArchived === true) {
        score -= 45;
      }

      if (metadata.isActive === false) {
        score -= 30;
      }

      const sourceBoost = boostForSourceType(chunk.sourceType);
      score += sourceBoost;

      return {
        chunk,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maximumResults);

  return scored.map(({ chunk, score }) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,

    documentTitle: chunk.documentTitle,
    sourceType: chunk.sourceType,

    heading: chunk.heading,
    content: chunk.content,

    relevanceScore: score,

    metadata: chunk.metadata,
  }));
}

function normaliseQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((term) => term.length > 2);
}

function boostForSourceType(sourceType: unknown): number {
  switch (sourceType) {
    case "policy":
      return 20;
    case "procedure":
      return 18;
    case "foundation":
      return 14;
    case "organisation_memory":
      return 16;
    case "contract":
      return 12;
    case "guidance":
      return 10;
    default:
      return 0;
  }
}