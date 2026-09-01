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