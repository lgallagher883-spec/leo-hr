import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runAbsenceReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "absence",
      "absent",
      "sick",
      "sickness",
      "off sick",
      "gp",
      "doctor",
      "medical certificate",
      "return to work",
      "stress",
      "anxiety",
      "depression",
      "back pain",
      "migraine",
      "ill health",
      "hospital",
      "calling in",
      "called in sick",
      "has not been in",
      "hasn't been in",
    ],

    strongKeywords: [
      "fit note",
      "occupational health",
      "phased return",
      "long term sickness",
      "long-term sickness",
      "short term sickness",
      "short-term sickness",
      "repeated absence",
      "absence pattern",
    ],

    intentMatches: [
      "absence",
      "sickness",
      "attendance",
      "ill health",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Absence Management",

    triggered,

    issues: triggered
      ? [
          "The matter involves employee absence, sickness or attendance.",
          "Attendance management and employee wellbeing may both require consideration.",
          `Absence reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "Consider eligibility for Statutory Sick Pay and any enhanced contractual sick pay.",
          "Consider whether the absence may relate to a disability under the Equality Act 2010.",
          "Avoid capability or dismissal decisions until sufficient medical and factual evidence has been considered.",
          "Medical information must be handled carefully and only used where relevant.",
          "Consider whether reasonable adjustments or other support may be required.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Assess the operational impact of the absence.",
          "Consider temporary cover, workload distribution and service continuity.",
          "Maintain appropriate and supportive contact with the employee.",
          "Consider whether repeated short-term absence is creating a pattern that requires review.",
          "Ensure management action remains proportionate and consistent.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's sickness absence or attendance policy.",
          "Check the sickness reporting and certification procedure.",
          "Review any capability, disability, reasonable adjustments or wellbeing policy where relevant.",
          "Check whether the organisation provides enhanced contractual sick pay.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "How long has the employee been absent?",
          "What reason has been given for the absence?",
          "Is this a single long-term absence or a pattern of short-term absences?",
          "Has the employee followed the organisation's reporting procedure?",
          "Has a fit note or other medical evidence been provided?",
          "Has a return-to-work meeting taken place after any previous absence?",
          "Has Occupational Health or other medical advice been considered?",
          "Could the condition be long term, recurring or amount to a disability?",
          "Has the employee requested any support or reasonable adjustments?",
          "What operational impact is the absence having?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Establish the full absence history and current medical position.",
          "Check whether the employee has followed the sickness reporting procedure.",
          "Maintain reasonable welfare contact during the absence.",
          "Obtain appropriate medical or Occupational Health advice where needed.",
          "Explore reasonable adjustments where disability may be relevant.",
          "Arrange and document a return-to-work meeting when the employee returns.",
          "Review any repeated short-term absence pattern before deciding whether formal action is appropriate.",
          "Keep clear records of contact, evidence, support considered and management decisions.",
          "Ensure any action is consistent with company policy and relevant ACAS principles.",
        ]
      : [],
  };
}