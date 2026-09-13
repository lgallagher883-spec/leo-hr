import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const scenarios = JSON.parse(readFileSync(new URL("../benchmarks/ask-leo/scenarios.json", import.meta.url), "utf8"));

test("Ask Leo benchmark contains broad, reviewable judgement scenarios", () => {
  assert.ok(scenarios.length >= 20);
  assert.equal(new Set(scenarios.map((scenario) => scenario.id)).size, scenarios.length);
  assert.ok(new Set(scenarios.map((scenario) => scenario.category)).size >= 10);

  for (const scenario of scenarios) {
    assert.ok(scenario.prompt.length >= 30, `${scenario.id} needs a substantive prompt`);
    assert.ok(scenario.decisiveJudgement.length >= 40, `${scenario.id} needs an explicit judgement standard`);
    assert.ok(scenario.mustDemonstrate.length >= 3, `${scenario.id} needs positive criteria`);
    assert.ok(scenario.mustAvoid.length >= 2, `${scenario.id} needs failure criteria`);
  }
});
