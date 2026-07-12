import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runAppealReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "appeal",
      "appealing",
      "appeal outcome",
      "appeal decision",
      "challenge the outcome",
      "challenge the decision",
      "review the decision",
      "unhappy with the outcome",
      "dispute the outcome",
      "disciplinary appeal",
      "grievance appeal",
      "dismissal appeal",
      "redundancy appeal",
      "capability appeal",
      "performance appeal",
      "warning appeal",
      "appeal hearing",
      "appeal meeting",
      "appeal letter",
      "grounds of appeal",
      "new evidence",
      "procedural unfairness",
      "sanction too harsh",
    ],

    strongKeywords: [
      "formal appeal",
      "appeal against dismissal",
      "appeal against disciplinary outcome",
      "appeal against grievance outcome",
      "appeal hearing",
      "appeal officer",
      "appeal panel",
    ],

    intentMatches: [
      "appeal",
      "disciplinary_appeal",
      "grievance_appeal",
      "dismissal_appeal",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Appeal",

    triggered,

    issues: triggered
      ? [
          "The employee appears to be challenging an earlier workplace decision or outcome.",
          "The appeal should be considered impartially and should not simply repeat the original decision-making process.",
          `Appeal reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "A fair process should normally provide an opportunity to appeal formal disciplinary and grievance outcomes.",
          "The appeal should, where possible, be handled by someone who was not involved in the original decision and who has sufficient authority.",
          "The employee may have the statutory right to be accompanied at a formal appeal hearing where the underlying process attracts that right.",
          "The appeal decision should consider the stated grounds of appeal, relevant evidence and any procedural concerns.",
          "The employer should avoid treating the appeal as misconduct or retaliation.",
          "Where dismissal is under appeal, the employer should consider the effect of any successful appeal on continuity of employment and reinstatement.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "An effective appeal can identify errors before they become legal disputes.",
          "Consider the impact of delay on the employee, managers, working relationships and operational certainty.",
          "Maintain confidentiality and avoid unnecessary circulation of the original decision.",
          "Ensure the appeal officer has access to the relevant documents and sufficient time to review them.",
          "Consider whether the appeal can be dealt with as a review or requires a full rehearing.",
          "Preserve confidence in the organisation's decision-making by showing that the appeal is genuine and independent.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the appeal provisions in the relevant disciplinary, grievance, capability, redundancy or other procedure.",
          "Check any time limit for lodging an appeal.",
          "Confirm how the appeal should be submitted and who should hear it.",
          "Check whether the procedure provides for a review, rehearing or panel.",
          "Review the original outcome letter, hearing notes, evidence and decision rationale.",
          "Confirm whether the policy permits new evidence to be considered.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What decision or outcome is being appealed?",
          "When was the original outcome communicated?",
          "Was the appeal submitted within the required timescale?",
          "What are the employee's stated grounds of appeal?",
          "Is the employee alleging new evidence, procedural unfairness, factual error, inconsistency or an excessive sanction?",
          "Who made the original decision?",
          "Who is available to hear the appeal impartially?",
          "Does the appeal require a review of the original decision or a complete rehearing?",
          "What documents and evidence were considered originally?",
          "Has any new evidence been provided?",
          "Could discrimination, whistleblowing, disability or another protected issue be relevant?",
          "Has the employee been told about the appeal process and any right to be accompanied?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Acknowledge the appeal promptly and confirm the process and timescale.",
          "Clarify the precise grounds of appeal.",
          "Appoint an impartial appeal officer who was not materially involved in the original decision where possible.",
          "Provide the appeal officer with the original evidence, notes, outcome and appeal submission.",
          "Decide whether the appeal should be a review or a full rehearing.",
          "Invite the employee to an appeal hearing and explain any right to be accompanied.",
          "Allow the employee to explain the grounds of appeal and present relevant evidence.",
          "Consider each ground of appeal separately.",
          "Decide whether the original outcome should be upheld, reduced, varied or overturned.",
          "Record the reasons for the appeal decision clearly.",
          "Confirm the final outcome in writing.",
          "Where an appeal succeeds, take prompt action to correct the original outcome and any resulting records.",
        ]
      : [],
  };
}