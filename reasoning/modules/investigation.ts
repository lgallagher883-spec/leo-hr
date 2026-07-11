import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runInvestigationReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "investigation",
      "investigate",
      "investigating",
      "allegation",
      "complaint",
      "incident",
      "incident report",
      "witness",
      "witness statement",
      "evidence",
      "cctv",
      "fact finding",
      "fact-finding",
      "statement",
      "interview",
      "investigating officer",
      "investigation meeting",
      "investigation report",
      "suspension",
    ],

    strongKeywords: [
      "formal investigation",
      "disciplinary investigation",
      "grievance investigation",
      "safeguarding investigation",
      "gross misconduct allegation",
      "serious allegation",
    ],

    intentMatches: [
      "investigation",
      "fact_finding",
      "allegation",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Investigation",

    triggered,

    issues: triggered
      ? [
          "The matter requires an objective fact-finding investigation before conclusions are reached.",
          "Evidence should be gathered fairly and impartially.",
          `Investigation reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "Investigations should remain impartial and avoid predetermined conclusions.",
          "Only relevant evidence should be collected and retained.",
          "Confidentiality should be maintained throughout the investigation.",
          "Witness evidence should be accurately recorded.",
          "The investigator should not normally determine any disciplinary outcome.",
          "Natural justice requires the employee to have an opportunity to respond to allegations.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Prompt investigations reduce operational disruption.",
          "Protect evidence before it is lost.",
          "Consider safeguarding, reputation and customer impact where relevant.",
          "Separate conflicting employees if necessary.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the investigation procedure.",
          "Check disciplinary, grievance and safeguarding policies where applicable.",
          "Ensure investigators have appropriate authority.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What is being investigated?",
          "Who reported the concern?",
          "Who are the witnesses?",
          "What documentary evidence exists?",
          "Has CCTV or electronic evidence been secured?",
          "Has the employee been informed appropriately?",
          "Is suspension genuinely necessary?",
          "Could evidence be lost if action is delayed?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Clearly define the allegation or issue.",
          "Appoint an impartial investigator.",
          "Secure relevant evidence immediately.",
          "Interview witnesses individually.",
          "Allow the employee to provide their account.",
          "Record evidence objectively.",
          "Produce a factual investigation report.",
          "Determine whether there is a case to answer before progressing further.",
        ]
      : [],
  };
}