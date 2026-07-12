export type OrganisationKnowledgeType =
  | "company_profile"
  | "organisation_structure"
  | "employment_framework"
  | "hr_resource"
  | "operational_rule"
  | "approval_route"
  | "compliance_requirement"
  | "internal_practice"
  | "organisation_memory";

export interface StoredOrganisationKnowledge {
  id: string;

  organisationId?: string;

  type: OrganisationKnowledgeType;

  title: string;

  content: string;

  keywords: string[];

  source:
    | "welcome_brief"
    | "foundation"
    | "foundation_conversation"
    | "matter"
    | "user_instruction"
    | "system";

  active: boolean;

  createdAt?: string;

  updatedAt?: string;
}

export interface OrganisationKnowledgeMatch {
  id: string;

  type: OrganisationKnowledgeType;

  title: string;

  content: string;

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

export function searchStoredOrganisationKnowledge(
  message: string,
  knowledgeItems: StoredOrganisationKnowledge[] = []
): OrganisationKnowledgeMatch[] {
  const query = normalise(message);

  if (!query) {
    return [];
  }

  const queryWords = query
    .split(" ")
    .filter((word) => word.length >= 4);

  return knowledgeItems
    .filter((item) => item.active)
    .map((item) => {
      const normalisedKeywords = item.keywords.map(normalise);

      const searchableText = normalise(
        [
          item.title,
          item.content,
          ...item.keywords,
        ].join(" ")
      );

      const directKeywordMatches = normalisedKeywords.filter(
        (keyword) =>
          keyword &&
          (query.includes(keyword) ||
            keyword.includes(query))
      );

      const overlappingWords = queryWords.filter((word) =>
        searchableText.includes(word)
      );

      const score =
        directKeywordMatches.length * 3 +
        overlappingWords.length;

      return {
        item,
        score,
      };
    })
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
      relevance:
        "This organisation-specific knowledge may affect how Leo should advise the employer.",
      confidence:
        score >= 6
          ? "high"
          : score >= 3
            ? "medium"
            : "low",
    }));
}