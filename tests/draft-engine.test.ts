import test from "node:test";
import assert from "node:assert/strict";

import { buildDraftDocument } from "../leo/draft/engine";

test("draft engine creates grounded documentation from reasoning and knowledge context", () => {
  const draft = buildDraftDocument({
    message: "Please draft a grievance response letter for an employee raising concerns about workload",
    matterId: 42,
    organisationId: "org-1",
    organisationKnowledge: [
      {
        title: "Workload policy",
        content: "Employees must raise concerns through the formal grievance process.",
        keywords: ["workload", "grievance"],
      },
    ],
    organisationMemory: [
      {
        title: "Previous grievance handling",
        content: "The business should acknowledge concerns promptly and investigate fairly.",
        keywords: ["grievance", "acknowledge"],
      },
    ],
    policies: [
      {
        title: "Grievance policy",
        content: "Employees should be given a fair hearing and a clear response.",
      },
    ],
    documentType: "grievance_response",
  });

  assert.equal(draft.documentType, "grievance_response");
  assert.match(draft.title, /Grievance Response/i);
  assert.match(draft.content, /Professional assessment/i);
  assert.match(draft.content, /Relevant knowledge/i);
  assert.ok(draft.rationale.length >= 3);
});
