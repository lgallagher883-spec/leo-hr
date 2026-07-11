import { LeoCoreOutput } from "../core/router";

export type ReasoningOutput = {
  primaryIssue: string;
  secondaryIssues: string[];
  legalConsiderations: string[];
  businessConsiderations: string[];
  policyConsiderations: string[];
  missingInformation: string[];
  recommendedApproach: string;
  recommendedSteps: string[];
  triggeredModules: string[];
  shouldAskQuestionsFirst: boolean;
};

export function runLeoReasoning(
  result: LeoCoreOutput,
  matterContext: string
): ReasoningOutput {
  const moduleResults = result.reasoningModules;

  const secondaryIssues = moduleResults.flatMap(
    (module) => module.issues
  );

  const legalConsiderations = moduleResults.flatMap(
    (module) => module.legalConsiderations
  );

  const businessConsiderations = moduleResults.flatMap(
    (module) => module.businessConsiderations
  );

  const policyConsiderations = moduleResults.flatMap(
    (module) => module.policyConsiderations
  );

  const missingInformation = moduleResults.flatMap(
    (module) => module.missingInformation
  );

  const recommendedSteps = moduleResults.flatMap(
    (module) => module.recommendedSteps
  );

  const triggeredModules = moduleResults.map(
    (module) => module.module
  );

  return {
    primaryIssue: String(result.intent),
    secondaryIssues,
    legalConsiderations,
    businessConsiderations,
    policyConsiderations,
    missingInformation,
    recommendedApproach:
      missingInformation.length > 0
        ? "Ask focused clarification questions before recommending a final course of action."
        : "Provide practical HR guidance based on the information available.",
    recommendedSteps,
    triggeredModules,
    shouldAskQuestionsFirst: missingInformation.length > 0,
  };
}