import { readFileSync } from "node:fs";
import process from "node:process";

const scenarioPath = new URL("../benchmarks/ask-leo/scenarios.json", import.meta.url);
const scenarios = JSON.parse(readFileSync(scenarioPath, "utf8"));
const resultPath = process.argv[2];

if (!resultPath) {
  console.log(JSON.stringify({
    scenarioCount: scenarios.length,
    instructions: "Supply a JSON file containing an array of { id, answer, durationMs, model, leoVersion } results.",
    scenarios,
  }, null, 2));
  process.exit(0);
}

const results = JSON.parse(readFileSync(resultPath, "utf8"));
const byId = new Map(results.map((result) => [result.id, result]));
const report = scenarios.map((scenario) => {
  const result = byId.get(scenario.id);
  if (!result) return { id: scenario.id, status: "missing" };

  const answer = String(result.answer || "");
  const numberedSteps = (answer.match(/^\s*\d+[.)]\s/gm) || []).length;
  const bulletCount = (answer.match(/^\s*[-*]\s/gm) || []).length;
  const absoluteClaims = /\b(guarantees?|ensures?|proves?)\b/i.test(answer);
  const stockOpening = /^(in this situation|it(?:'|’)s important|while .*important)/i.test(answer.trim());

  return {
    id: scenario.id,
    category: scenario.category,
    model: result.model || "unknown",
    leoVersion: result.leoVersion || "unknown",
    durationMs: Number.isFinite(result.durationMs) ? result.durationMs : null,
    mechanicalChecks: {
      hasAnswer: answer.trim().length > 0,
      avoidsNumberedProcedure: numberedSteps === 0,
      conciseActionSet: bulletCount <= 3,
      avoidsAbsoluteOutcomeClaim: !absoluteClaims,
      avoidsStockOpening: !stockOpening,
    },
    humanReview: {
      decisiveJudgement: scenario.decisiveJudgement,
      mustDemonstrate: scenario.mustDemonstrate,
      mustAvoid: scenario.mustAvoid,
    },
  };
});

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2));
