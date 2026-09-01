import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const route = read("app/api/ask-leo/route.ts");
const builder = read("leo/prompt/builder™.ts");
const authorityRouter = read("leo/authority/router.ts");
const liveAuthority = read("leo/authority/liveAuthority.ts");

test("Ask Leo does not import conversation or response planning layers", () => {
  assert.doesNotMatch(route, /buildConversationPlan/);
  assert.doesNotMatch(route, /buildConversationPrompt/);
  assert.doesNotMatch(route, /buildResponseArchitecture/);
  assert.doesNotMatch(route, /buildResponsePrompt/);
});

test("Ask Leo does not contain removed issue discovery or private assessment layers", () => {
  assert.doesNotMatch(route, /buildIssueDiscoveryJsonSchema/);
  assert.doesNotMatch(route, /buildInternalAnalysisJsonSchema/);
  assert.doesNotMatch(route, /parseIssueDiscovery/);
  assert.doesNotMatch(route, /parseInternalAnalysis/);
  assert.doesNotMatch(route, /resolveAssessmentFromChoice/);
  assert.doesNotMatch(route, /Call 1A/);
  assert.doesNotMatch(route, /Call 1B/);
});

test("ordinary Ask Leo path has one streamed employer-facing OpenAI model invocation", () => {
  const modelCalls = route.match(/client\.chat\.completions\.create/g) || [];
  assert.equal(modelCalls.length, 1);
  assert.match(route, /model: "gpt-4o"/);
  assert.match(route, /stream: true/);
  assert.match(route, /messages: \[/);
  assert.match(route, /role: "system"/);
  assert.match(route, /content: leoPrompt/);
  assert.match(route, /role: "user"/);
  assert.match(route, /content: promptContext/);
  assert.doesNotMatch(route, /stream: false/);
  assert.doesNotMatch(route, /response_format/);
  assert.doesNotMatch(route, /client\.responses\.create/);
});

test("single professional prompt uses IDEA without a fifth stage", () => {
  assert.match(builder, /IDENTIFY/);
  assert.match(builder, /DEFINE/);
  assert.match(builder, /EXPLAIN/);
  assert.match(builder, /APPLY/);
  assert.match(builder, /IDEA has no fifth stage/);
  assert.doesNotMatch(builder, /^ADVISE$/m);
  assert.doesNotMatch(builder, /IDEAA/);
});

test("IDEA requires interaction analysis and clear professional judgement", () => {
  assert.match(builder, /what does this combination of facts mean for the decision/i);
  assert.match(builder, /conflicting interests, roles, evidence or processes/i);
  assert.match(
    builder,
    /Distinguish fact, allegation, assumption, inference, missing evidence/i
  );
  assert.match(builder, /challenge the first obvious answer/i);
  assert.match(builder, /most plausible viable alternative/i);
  assert.match(builder, /reach a clear professional judgement/i);
  assert.match(builder, /material relationship between the issues/i);
});

test("professional judgement doctrine reasons from facts before action", () => {
  assert.match(builder, /what the known facts establish/i);
  assert.match(builder, /what is alleged or missing/i);
  assert.match(builder, /strongest reason that conclusion may be wrong or premature/i);
  assert.match(builder, /most defensible and proportionate course/i);
  assert.match(builder, /one fact most likely to change the recommendation/i);
  assert.match(builder, /Do not expose this as a questionnaire/i);
});

test("APPLY distinguishes required action from professional recommendation", () => {
  assert.match(builder, /Distinguish what must happen from what Leo professionally recommends/i);
  assert.match(builder, /what can proceed, what should change/i);
  assert.match(builder, /without unnecessary delay/i);
  assert.match(builder, /who should decide or conduct a step where independence matters/i);
  assert.match(builder, /avoid absolute advice/i);
});

test("prompt discourages generic checklist and filler advice", () => {
  assert.match(builder, /Avoid turning the answer into a generic policy checklist/i);
  assert.match(builder, /Do not give filler advice/i);
  assert.match(builder, /unless the specific point changes what the employer should do/i);
  assert.match(builder, /Do not jump from issue recognition straight to generic action/i);
});

test("prompt avoids default safe-harbour actions", () => {
  assert.match(builder, /Do not default to the course that merely appears most cautious/i);
  assert.match(builder, /Pausing everything, investigating everything, waiting until everything is resolved/i);
  assert.match(builder, /may be appropriate only where the facts make that action material/i);
  assert.match(builder, /Keep judgement concise and proportionate/i);
});

test("prompt does not default to numbered lists and uses Next steps selectively", () => {
  assert.match(builder, /Do not default to numbered lists/i);
  assert.match(builder, /prefer cohesive professional prose in short paragraphs/i);
  assert.match(builder, /finish with a short section headed "Next steps"/i);
  assert.match(builder, /around 2 to 5 concise bullet points/i);
  assert.match(builder, /do not introduce new advice/i);
  assert.match(builder, /do not use this section for simple factual questions/i);
});

test("prompt remains subject-neutral without topic-specific decision trees", () => {
  assert.match(builder, /Do not use topic-specific decision trees/);
  assert.match(builder, /they are only possible labels/i);
  assert.doesNotMatch(builder, /grievance\s*[-=]>|sickness\s*[-=]>|redundancy\s*[-=]>/i);
  assert.doesNotMatch(builder, /switch\s*\([^)]*(grievance|sickness|redundancy)/i);
  assert.doesNotMatch(builder, /if\s+.*\b(grievance|sickness|performance|disability|disciplinary|redundancy|tupe|whistleblowing)\b.*\bthen\b/i);
  assert.doesNotMatch(builder, /\b(grievance|sickness|performance|disability|disciplinary|redundancy|tupe|whistleblowing)\b\s*:/i);
});

test("authority is evidence context rather than the professional decision-maker", () => {
  assert.match(builder, /Authority is an evidence service, not the professional decision-maker/);
  assert.match(builder, /Static authority references are unverified retrieval hints/);
  assert.match(builder, /Verified stored or live authority is evidence\/context/);
  assert.doesNotMatch(authorityRouter, /AuthorityRecommendation/);
  assert.doesNotMatch(authorityRouter, /groundedRecommendations/);
});

test("stored and live authority protections remain wired into Ask Leo", () => {
  assert.match(route, /runAuthorityEngine/);
  assert.match(route, /researchLiveAuthority/);
  assert.match(route, /storedAuthorityQuery: message/);
  assert.match(liveAuthority, /findStoredAuthority/);
  assert.match(liveAuthority, /stored\.fresh &&\s*stored\.sufficient/);
  assert.match(liveAuthority, /shouldResearchLiveAuthority/);
  assert.match(liveAuthority, /APPROVED_AUTHORITY_DOMAINS/);
  assert.match(liveAuthority, /upsertAuthorityRecords/);
  assert.match(liveAuthority, /effort: "low"/);
});

test("legacy reasoning modules remain absent from Ask Leo", () => {
  assert.match(route, /runLeoRouting/);
  assert.doesNotMatch(route, /runLeoReasoning/);
  assert.doesNotMatch(route, /runReasoningModules/);
  assert.doesNotMatch(route, /runLeoCore/);
});

test("gpt-4o-mini is not used as a separate communication rewrite call", () => {
  assert.doesNotMatch(route, /gpt-4o-mini/);
  assert.doesNotMatch(route, /buildEmployerResponsePrompt/);
  assert.doesNotMatch(builder, /principal substantive source/);
  assert.doesNotMatch(builder, /communicationPriority/);
});

test("timing instrumentation remains diagnostic-only and gated", () => {
  assert.match(
    route,
    /askLeoTimingEnabled\s*=\s*\n?\s*process\.env\.ASK_LEO_LOG_TIMINGS === "1"/
  );

  const timingLogIndex = route.indexOf('"[ASK LEO TIMING]"');
  assert.ok(timingLogIndex > 0);
  const beforeLog = route.slice(0, timingLogIndex);
  const gateIndex = beforeLog.lastIndexOf("if (askLeoTimingEnabled) {");
  assert.ok(gateIndex > 0);

  const timingLogMatches = route.match(/"\[ASK LEO TIMING\]"/g) || [];
  assert.equal(timingLogMatches.length, 1);
  assert.doesNotMatch(route, /askLeoTimingEnabled[^\n]*\?[^\n]*model/);
  assert.match(route, /professionalModelStartMs: Math\.round/);
  assert.match(route, /authorityTotalMs: Math\.round\(authorityTotalMs\)/);
  assert.match(route, /storedAuthorityMs:/);
  assert.match(route, /liveAuthorityMs:/);
  assert.match(route, /totalPreStreamMs: Math\.round\(totalPreStreamMs\)/);
});