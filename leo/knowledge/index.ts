import {
  OrganisationMemoryItem,
  searchOrganisationMemory,
} from "./organisationMemory";

import {
  PolicyMatch,
  searchPolicies,
} from "./policySearch";

import {
  StoredPolicy,
  searchStoredPolicies,
} from "./storage/policies";

import {
  StoredOrganisationKnowledge,
  searchStoredOrganisationKnowledge,
} from "./storage/organisation";

import {
  StoredPreviousMatter,
  searchPreviousMatters,
} from "./storage/previousMatters";

export interface KnowledgeSource {
  id: string;

  type:
    | "company_policy"
    | "contract"
    | "handbook"
    | "uploaded_document"
    | "foundation"
    | "organisation_memory"
    | "previous_matter";

  title: string;

  summary: string;

  relevance: string;

  confidence: "low" | "medium" | "high";
}

export interface KnowledgeSearchInput {
  message: string;

  organisationMemory?: OrganisationMemoryItem[];

  policies?: StoredPolicy[];

  organisationKnowledge?: StoredOrganisationKnowledge[];

  previousMatters?: StoredPreviousMatter[];
}

export interface KnowledgeSearchResult {
  sources: KnowledgeSource[];

  policyMatches: PolicyMatch[];

  memoryMatches: OrganisationMemoryItem[];

  organisationMatches: ReturnType<
    typeof searchStoredOrganisationKnowledge
  >;

  previousMatterMatches: ReturnType<
    typeof searchPreviousMatters
  >;

  organisationKnowledgeFound: boolean;
}

export function searchKnowledge(
  input: KnowledgeSearchInput
): KnowledgeSearchResult {
  const policyResult = searchPolicies(input.message);

  const storedPolicyMatches = searchStoredPolicies(
    input.message,
    input.policies || []
  );

  const memoryResult = searchOrganisationMemory(
    input.message,
    input.organisationMemory || []
  );

  const organisationMatches =
    searchStoredOrganisationKnowledge(
      input.message,
      input.organisationKnowledge || []
    );

  const previousMatterMatches =
    searchPreviousMatters(
      input.message,
      input.previousMatters || []
    );

  const policySources: KnowledgeSource[] = [
    ...policyResult.matches.map((match) => ({
      id: match.id,
      type: "company_policy" as const,
      title: match.policyName,
      summary: match.summary,
      relevance: match.relevance,
      confidence: match.confidence,
    })),

    ...storedPolicyMatches.map((match) => ({
      id: `${match.policyId}:${match.sectionId}`,
      type: "company_policy" as const,
      title: `${match.policyTitle} — ${match.sectionHeading}`,
      summary:
        "A relevant section was found in an employer policy.",
      relevance: match.relevance,
      confidence: match.confidence,
    })),
  ];

  const memorySources: KnowledgeSource[] =
    memoryResult.matches.map((memory) => ({
      id: memory.id,
      type: "organisation_memory",
      title: memory.title,
      summary: memory.content,
      relevance:
        "This organisational memory may be relevant to the employer's question.",
      confidence: "high",
    }));

  const organisationSources: KnowledgeSource[] =
    organisationMatches.map((match) => ({
      id: match.id,
      type:
        match.type === "organisation_memory"
          ? "organisation_memory"
          : "foundation",
      title: match.title,
      summary: match.content,
      relevance: match.relevance,
      confidence: match.confidence,
    }));

  const previousMatterSources: KnowledgeSource[] =
    previousMatterMatches.map((match) => ({
      id: match.id,
      type: "previous_matter",
      title: match.title,
      summary: match.outcome
        ? `${match.summary} Outcome: ${match.outcome}`
        : match.summary,
      relevance: match.relevance,
      confidence: match.confidence,
    }));

  const sources = [
    ...policySources,
    ...memorySources,
    ...organisationSources,
    ...previousMatterSources,
  ];

  return {
    sources,
    policyMatches: policyResult.matches,
    memoryMatches: memoryResult.matches,
    organisationMatches,
    previousMatterMatches,
    organisationKnowledgeFound:
      sources.length > 0,
  };
}