export interface StoredPreviousMatter {
  id: string;

  organisationId?: string;

  employeeId?: string;

  title: string;

  matterType: string;

  summary: string;

  outcome?: string;

  keyFacts: string[];

  actionsTaken: string[];

  lessonsLearned?: string[];

  closedAt?: string;

  active: boolean;
}

export interface PreviousMatterMatch {
  id: string;

  title: string;

  matterType: string;

  summary: string;

  outcome?: string;

  relevance: string;

  confidence: "low" | "medium" | "high";
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchPreviousMatters(
  message: string,
  matters: StoredPreviousMatter[] = []
): PreviousMatterMatch[] {
  const query = normalise(message);

  if (!query) {
    return [];
  }

  const queryWords = query
    .split(" ")
    .filter((word) => word.length >= 4);

  return matters
    .filter((matter) => matter.active)
    .map((matter) => {
      const searchableText = normalise(
        [
          matter.title,
          matter.matterType,
          matter.summary,
          matter.outcome || "",
          ...matter.keyFacts,
          ...matter.actionsTaken,
          ...(matter.lessonsLearned || []),
        ].join(" ")
      );

      const overlappingWords = queryWords.filter((word) =>
        searchableText.includes(word)
      );

      const score = overlappingWords.length;

      return {
        matter,
        score,
      };
    })
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score)
    .map(({ matter, score }) => ({
      id: matter.id,
      title: matter.title,
      matterType: matter.matterType,
      summary: matter.summary,
      outcome: matter.outcome,
      relevance:
        "This previous matter may help Leo assess consistency, precedent and organisational practice.",
      confidence:
        score >= 6
          ? "high"
          : score >= 3
            ? "medium"
            : "low",
    }));
}