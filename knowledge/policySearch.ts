export interface PolicyMatch {
  id: string;

  policyName: string;

  sectionTitle: string;

  summary: string;

  relevance: string;

  confidence: "low" | "medium" | "high";
}

export interface PolicySearchResult {
  matches: PolicyMatch[];

  policyFound: boolean;
}

export function searchPolicies(
  message: string
): PolicySearchResult {
  /*
    Version 1

    This will eventually search:

    • Uploaded company policies
    • Employee handbook
    • Contract clauses
    • Standard letters
    • Templates

    using vector search.

    For now it simply returns the correct architecture.
  */

  return {
    matches: [],

    policyFound: false,
  };
}