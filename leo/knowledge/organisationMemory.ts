export type OrganisationMemoryType =
  | "working_practice"
  | "management_preference"
  | "approval_route"
  | "operational_rule"
  | "cultural_context"
  | "sector_context"
  | "historical_practice"
  | "other";

export interface OrganisationMemoryItem {
  id: string;

  organisationId?: string;

  type: OrganisationMemoryType;

  title: string;

  content: string;

  keywords: string[];

  active: boolean;

  source:
    | "welcome_brief"
    | "foundation_conversation"
    | "matter"
    | "user_instruction"
    | "system";

  createdAt?: string;

  updatedAt?: string;
}

export interface OrganisationMemorySearchResult {
  matches: OrganisationMemoryItem[];

  memoryFound: boolean;
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchOrganisationMemory(
  message: string,
  memoryItems: OrganisationMemoryItem[] = []
): OrganisationMemorySearchResult {
  const context = normalise(message);

  const matches = memoryItems.filter((item) => {
    if (!item.active) {
      return false;
    }

    const searchableContent = normalise(
      [
        item.title,
        item.content,
        ...item.keywords,
      ].join(" ")
    );

    const keywordMatch = item.keywords.some((keyword) =>
      context.includes(normalise(keyword))
    );

    const contentWords = searchableContent
      .split(" ")
      .filter((word) => word.length >= 4);

    const overlappingWords = contentWords.filter((word) =>
      context.includes(word)
    );

    return keywordMatch || overlappingWords.length >= 2;
  });

  return {
    matches,
    memoryFound: matches.length > 0,
  };
}