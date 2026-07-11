export type ReasoningModuleInput = {
  matterContext: string;
  intent: string;
  risk: string;
};

export type ReasoningModuleOutput = {
  module: string;
  triggered: boolean;
  issues: string[];
  legalConsiderations: string[];
  businessConsiderations: string[];
  policyConsiderations: string[];
  missingInformation: string[];
  recommendedSteps: string[];
};