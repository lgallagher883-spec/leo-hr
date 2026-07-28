import { KnowledgeContext, KnowledgeSearchResult } from "./types";

export function buildKnowledgeContext(
  input: KnowledgeContext
): KnowledgeContext & {
  summary: string;
  recommendedSources: string[];
  currentKnowledgeSummary: string;
} {
  const query = input.query.trim().toLowerCase();
  const hasResults = input.results.length > 0;

  const activeResults = input.results.filter((result) => {
    const metadata = result.metadata as Record<string, unknown> | undefined;

    return metadata?.isActive !== false && metadata?.isArchived !== true;
  });

  const recommendedSources = input.results
    .slice(0, 5)
    .map((result) => result.documentTitle)
    .filter(Boolean);

  const gaps = buildGaps(query, input.gaps, hasResults, activeResults.length);

  const summary = buildSummary(query, activeResults, gaps);
  const currentKnowledgeSummary = buildCurrentKnowledgeSummary(activeResults);

  return {
    ...input,
    summary,
    recommendedSources,
    currentKnowledgeSummary,
    gaps,
  };
}

function buildSummary(
  query: string,
  results: KnowledgeSearchResult[],
  gaps: string[]
): string {
  if (!results.length) {
    return `No current knowledge was retrieved for the request about ${query}. Leo should look for the relevant policy, procedure or organisational resource before advising.`;
  }

  const topResult = results[0];

  return `Leo found ${results.length} relevant knowledge result${results.length === 1 ? "" : "s"} for ${query}, with the strongest match in ${topResult.documentTitle}. ${gaps.length ? `The remaining gaps are: ${gaps.join("; ")}` : "The available knowledge appears sufficient for a grounded response."}`;
}

function buildCurrentKnowledgeSummary(results: KnowledgeSearchResult[]): string {
  if (!results.length) {
    return "No active knowledge is currently available for this request.";
  }

  const first = results[0];

  return `Current knowledge is centred around ${first.documentTitle} and is available for use in the response.`;
}

function buildGaps(
  query: string,
  providedGaps: string[],
  hasResults: boolean,
  activeResultCount: number
): string[] {
  const derived = new Set<string>();

  if (!hasResults || activeResultCount === 0) {
    if (/disciplinary|investigation|hearing|misconduct/i.test(query)) {
      derived.add("A current disciplinary or investigation policy is not yet available in the active knowledge base.");
    }

    if (/grievance|complaint/i.test(query)) {
      derived.add("A grievance or complaint procedure reference is still missing from active knowledge.");
    }

    if (/absence|sickness|leave/i.test(query)) {
      derived.add("Absence or leave guidance is not yet represented in the active knowledge base.");
    }
  }

  for (const gap of providedGaps) {
    if (gap) {
      derived.add(gap);
    }
  }

  return Array.from(derived);
}
