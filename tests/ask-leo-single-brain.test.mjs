import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const route = read("app/api/ask-leo/route.ts");
const builder = read("leo/prompt/builder™.ts");
const authorityRouter = read("leo/authority/router.ts");
const liveAuthority = read("leo/authority/liveAuthority.ts");
const responseArchitecture = read("leo/response/responseArchitecture.ts");
const responsePrompt = read("leo/response/responsePrompt.ts");

test("Ask Leo uses routing-only core and does not call deterministic reasoning", () => {
  assert.match(route, /runLeoRouting/);
  assert.doesNotMatch(route, /runLeoReasoning/);
  assert.doesNotMatch(route, /runLeoCore/);
  assert.doesNotMatch(route, /professionalReasoning/);
  assert.doesNotMatch(route, /reasoningResult/);
});

test("ProfessionalSignalSet remains neutral and excludes judgement fields", () => {
  assert.match(builder, /export type ProfessionalSignalSet/);
  assert.match(builder, /possibleRelevantDomains/);
  assert.match(builder, /authorityResearchNeeded/);
  assert.match(builder, /authoritySearchTerms/);
  assert.match(builder, /companyContextSearchTerms/);
  assert.match(builder, /operationalRisk/);
  assert.match(builder, /workplaceRouting/);

  assert.doesNotMatch(builder, /\$\{reasoning\./);
  assert.doesNotMatch(builder, /recommendedSteps/);
  assert.doesNotMatch(builder, /professionalRecommendation/);
  assert.doesNotMatch(builder, /decisionFramework/);
  assert.doesNotMatch(builder, /groundedRecommendations/);
});

test("static authority path detects and verifies without action recommendations", () => {
  assert.doesNotMatch(authorityRouter, /AuthorityRecommendation/);
  assert.doesNotMatch(authorityRouter, /groundedRecommendations/);
  assert.doesNotMatch(liveAuthority, /detectedRecommendations/);
  assert.match(authorityRouter, /missingAuthorityInformation/);
  assert.match(liveAuthority, /Detected authorities/);
});

test("Call 2 architecture controls communication rather than judgement", () => {
  assert.doesNotMatch(responseArchitecture, /professionalSequence/);
  assert.doesNotMatch(responseArchitecture, /professional_recommendation/);
  assert.doesNotMatch(responseArchitecture, /immediate_next_step/);
  assert.match(responseArchitecture, /communicationRules/);

  assert.match(responsePrompt, /controls communication only/);
  assert.match(responsePrompt, /sole source of substantive professional judgement/);
  assert.match(builder, /principal substantive source/);
});

test("Call 1 assessment contract is organised around professional judgement", () => {
  assert.match(route, /employerDecision/);
  assert.match(route, /professionalRationale/);
  assert.match(route, /evidencePosition/);
  assert.match(route, /actionPlan/);
  assert.match(route, /alternativeAssessment/);
  assert.match(route, /authorityAndCompanyContext/);

  assert.match(builder, /Answer the employer's actual question directly/);
  assert.match(builder, /An investigation is not a complete recommendation/);
  assert.match(builder, /Do not default to external legal advice/);
  assert.match(builder, /Contingent next actions/);
});

test("professional issue discovery informs authority before final assessment", () => {
  const discoveryIndex = route.indexOf("PROFESSIONAL ISSUE DISCOVERY (Call 1A)");
  const authorityIndex = route.indexOf(
    "AUTHORITY INFORMED BY PROFESSIONAL ISSUE DISCOVERY"
  );
  const finalAssessmentIndex = route.indexOf(
    "PRIVATE PROFESSIONAL ASSESSMENT (non-streaming, structured JSON)"
  );

  assert.ok(discoveryIndex >= 0);
  assert.ok(authorityIndex > discoveryIndex);
  assert.ok(finalAssessmentIndex > authorityIndex);
  assert.match(route, /buildAuthorityResearchQuery\(\s*message,\s*issueDiscovery/);
  assert.match(builder, /every materially relevant workplace issue/i);
  assert.doesNotMatch(builder, /TUPE|redundancy|holiday pay|bullying investigation/i);
});

test("Call 2 receives and must preserve communication priorities", () => {
  assert.match(route, /communicationPriority/);
  assert.match(builder, /communicationPriority\.mustCommunicate/);
  assert.match(builder, /silently create a coverage checklist/i);
  assert.match(builder, /omission, weakening or merging away.*is not/i);
  assert.match(builder, /materially and explicitly/i);
  assert.match(builder, /Do not rely on implication/i);
  assert.match(builder, /mandatory-point coverage wins/i);
  assert.match(builder, /Must communicate:/);
  assert.match(builder, /May defer:/);
  assert.match(builder, /FINAL MANDATORY COVERAGE CHECKLIST/);
  assert.match(
    builder,
    /assessment\?\.communicationPriority\.mustCommunicate/
  );
});

test("live authority research is bounded without weakening official sources", () => {
  assert.match(liveAuthority, /normally 2 to 6 sources/i);
  assert.match(liveAuthority, /Stop searching when every material/i);
  assert.match(liveAuthority, /search_context_size:\s*\n\s*"low"/);
  assert.match(liveAuthority, /max_tool_calls: 2/);
  assert.match(liveAuthority, /APPROVED_AUTHORITY_DOMAINS/);
  assert.match(liveAuthority, /gpt-5\.6-luna/);
  assert.match(liveAuthority, /effort: "low"/);
  assert.match(liveAuthority, /collectCitedSources/);
  assert.match(liveAuthority, /citedSources\.size === 6/);
});