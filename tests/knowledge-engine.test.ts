import test from "node:test";
import assert from "node:assert/strict";

import { buildKnowledgeContext } from "../leo/knowledge/context";

test("buildKnowledgeContext surfaces likely missing resources for HR queries", () => {
  const context = buildKnowledgeContext({
    query: "disciplinary investigation process",
    results: [],
    sourcesUsed: [],
    gaps: [],
  });

  assert.ok(context.summary.length > 0);
  assert.ok(
    context.gaps.some((gap) =>
      /disciplinary|investigation|policy|procedure/i.test(gap)
    )
  );
});

test("buildKnowledgeContext prefers active current knowledge over archived material", () => {
  const context = buildKnowledgeContext({
    query: "grievance policy",
    results: [
      {
        chunkId: "chunk-1",
        documentId: "doc-1",
        documentTitle: "Grievance Policy",
        sourceType: "policy",
        heading: "Overview",
        content: "This policy covers grievance handling.",
        relevanceScore: 92,
        metadata: {
          isActive: true,
          isArchived: false,
        },
      },
      {
        chunkId: "chunk-2",
        documentId: "doc-2",
        documentTitle: "Legacy Grievance Policy",
        sourceType: "policy",
        heading: "Legacy",
        content: "This older policy is archived.",
        relevanceScore: 40,
        metadata: {
          isActive: false,
          isArchived: true,
        },
      },
    ],
    sourcesUsed: [
      {
        documentId: "doc-1",
        title: "Grievance Policy",
        sourceType: "policy",
      },
    ],
    gaps: [],
  });

  assert.match(context.summary.toLowerCase(), /active|current/i);
  assert.ok(
    context.recommendedSources.some((source) =>
      source.toLowerCase().includes("grievance")
    )
  );
});
