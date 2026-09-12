import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const route = read("app/api/ask-leo/route.ts");
const builder = read("leo/prompt/builder™.ts");
const authorityRouter = read("leo/authority/router.ts");
const liveAuthority = read("leo/authority/liveAuthority.ts");
const intent = read("leo/core/intent.ts");
const classifier = read("leo/core/classifier.ts");

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

test("single professional prompt uses a concise reasoning standard", () => {
  assert.match(builder, /REASONING/);
  assert.match(builder, /Start from the employer's actual facts/);
  assert.match(builder, /Reach a clear professional view/);
  assert.doesNotMatch(builder, /IDEAA/);
});

test("reasoning standard requires analysis and clear professional judgement", () => {
  assert.match(builder, /distinctive facts, what has materially changed/i);
  assert.match(builder, /Separate fact, allegation, assumption and inference/i);
  assert.match(builder, /Test the employer's proposed course/i);
  assert.match(builder, /Reach a clear professional view/i);
});

test("professional judgement doctrine reasons from facts before action", () => {
  assert.match(builder, /Diagnose before prescribing/i);
  assert.match(builder, /what has materially changed/i);
  assert.match(builder, /recommend only proportionate next steps/i);
  assert.match(builder, /questions that could materially change the recommendation/i);
});

test("prompt distinguishes legal requirements from professional recommendation", () => {
  assert.match(builder, /Distinguish legal requirements, contractual obligations/i);
  assert.match(builder, /good practice and professional recommendation/i);
  assert.match(builder, /recommend only proportionate next steps/i);
});

test("prompt discourages generic checklist and filler advice", () => {
  assert.match(builder, /Do not default to numbered procedures or generic checklists/i);
  assert.match(builder, /If the answer would be substantially the same without the distinctive facts/i);
  assert.match(builder, /unless it materially affects what the employer should do now/i);
});

test("prompt avoids default safe-harbour actions", () => {
  assert.match(builder, /Do not recommend a PIP, investigation, suspension/i);
  assert.match(builder, /simply because it is commonly associated with the topic/i);
  assert.match(builder, /only proportionate next steps that are relevant now/i);
});

test("prompt does not default to numbered lists and uses Next steps selectively", () => {
  assert.match(builder, /Use concise paragraphs/i);
  assert.match(builder, /Do not default to numbered procedures or generic checklists/i);
  assert.match(builder, /Use a short "Next steps" section only where several immediate actions are genuinely useful/i);
});

test("prompt professionally frames live situations without implying wrongdoing", () => {
  assert.match(builder, /Separate fact, allegation, assumption and inference/i);
  assert.match(builder, /Lead with the professional position, not a stock introduction/i);
  assert.match(builder, /Test the employer's proposed course rather than simply agreeing/i);
});

test("professional prompt diagnoses before prescribing", () => {
  assert.match(builder, /Diagnose before prescribing/i);
  assert.match(builder, /materially changed/i);
  assert.match(builder, /Do not recite later procedural stages/i);
  assert.match(builder, /distinctive facts/i);
});

test("Ask Leo response depth is not predetermined by message length or Matter routing", () => {
  assert.match(route, /responseMode: "standard"/);
  assert.doesNotMatch(route, /message\.split\(\/\\s\+\//);
  assert.doesNotMatch(route, /length <= 60/);
  assert.doesNotMatch(route, /\? "sparse_live"/);
});

test("performance and capability are context labels rather than forced process routes", () => {
  assert.match(intent, /text\.includes\("performance"\)/);
  assert.match(intent, /text\.includes\("capability"\)/);
  assert.match(intent, /return "employee_issue"/);
  assert.doesNotMatch(classifier, /intent === "employee_issue"/);
  assert.match(classifier, /explicitlyRequestsDocument/);
});

test("classifier only marks a document when the employer actually requests one", () => {
  assert.match(classifier, /text\.includes\("write me"\)/);
  assert.match(classifier, /text\.includes\("draft"\)/);
  assert.match(classifier, /category: "document_needed"/);
  assert.match(classifier, /shouldCreateMatter: false/);
});

test("Matter recommendation requires active case-management signals", () => {
  assert.match(route, /const activeCaseSignals = \[/);
  assert.match(route, /const substantiveCaseSignals = \[/);
  assert.match(route, /hasActiveCaseSignal/);
  assert.match(route, /hasSubstantiveCaseSignal/);
  assert.doesNotMatch(route, /highSuitabilityIntent/);
  assert.doesNotMatch(route, /caseSignalCount >= 2/);
});

test("prompt remains subject-neutral without topic-specific decision trees", () => {
  assert.match(builder, /Start from the employer's actual facts, not the nearest HR label/i);
  assert.doesNotMatch(builder, /grievance\s*[-=]>|sickness\s*[-=]>|redundancy\s*[-=]>/i);
  assert.doesNotMatch(builder, /switch\s*\([^)]*(grievance|sickness|redundancy)/i);
});

test("authority is evidence context rather than the professional decision-maker", () => {
  assert.match(builder, /AUTHORITY EVIDENCE/);
  assert.match(builder, /These are retrieval hints only/i);
  assert.match(builder, /Apply only the legal, contractual, policy and professional principles/i);
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
  assert.match(liveAuthority, /LIVE_LEGAL_CHANGE_TOPICS/);
  assert.match(liveAuthority, /"dismiss"/);
  assert.match(liveAuthority, /"probation"/);
  assert.match(liveAuthority, /needsCurrentVerification/);
  assert.match(liveAuthority, /Stable professional questions do not need an authority-store network/);
  assert.match(builder, /future-enacted change that materially affects planning/i);
  assert.match(builder, /Never state a changing qualifying period, threshold, rate or commencement position/i);
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
  assert.match(route, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(route, /"X-Leo-Version"/);
  assert.match(route, /leoModel/);
  assert.match(route, /responseMode:/);
  assert.match(route, /authorityTotalMs: Math\.round\(authorityTotalMs\)/);
  assert.match(route, /storedAuthorityMs:/);
  assert.match(route, /liveAuthorityMs:/);
  assert.match(route, /totalPreStreamMs: Math\.round\(totalPreStreamMs\)/);
});
