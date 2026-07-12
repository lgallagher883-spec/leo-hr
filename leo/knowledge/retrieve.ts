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