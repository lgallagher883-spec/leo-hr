import test from "node:test";
import assert from "node:assert/strict";

import { buildLeoInsight } from "../leo/insight/engine";

test("insight engine surfaces proactive risks, trends and early interventions", () => {
  const insight = buildLeoInsight({
    periodLabel: "Last quarter",
    employees: [
      { id: 1, name: "A", status: "Active", start_date: "2026-07-01" },
    ],
    matters: [
      {
        id: 1,
        title: "Workload concern",
        subject: "Workload concern",
        status: "Open",
        matter_type: "Grievance",
        created_at: "2026-05-01T00:00:00.000Z",
      },
    ],
    sars: [
      {
        id: 1,
        request_title: "Personal data request",
        employee_id: 1,
        matter_id: 1,
        status: "Open",
        response_due_date: "2026-07-20T00:00:00.000Z",
        extended_due_date: null,
        created_at: "2026-06-01T00:00:00.000Z",
      },
    ],
    resources: [{ id: 1, name: "Grievance policy", register_type: "policy" }],
    knowledgeSectionCount: 1,
  });

  assert.ok(insight.risks.length > 0);
  assert.ok(insight.trends.length > 0);
  assert.ok(insight.recommendations.length > 0);
  assert.ok(insight.earlyInterventions.length > 0);
  assert.match(insight.summary, /risk|trend|intervention/i);
});
