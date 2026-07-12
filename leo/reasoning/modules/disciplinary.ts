import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runDisciplinaryReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "disciplinary",
      "misconduct",
      "gross misconduct",
      "conduct issue",
      "conduct concern",
      "behaviour issue",
      "inappropriate behaviour",
      "breach of policy",
      "breach of procedure",
      "rule breach",
      "unauthorised absence",
      "insubordination",
      "refused instruction",
      "refusal to follow instruction",
      "dishonesty",
      "theft",
      "fraud",
      "violence",
      "aggressive behaviour",
      "swearing",
      "confidentiality breach",
      "data breach",
      "social media",
      "suspended",
      "suspension",
      "warning",
      "written warning",
      "final written warning",
      "dismiss for misconduct",
    ],

    strongKeywords: [
      "disciplinary investigation",
      "disciplinary hearing",
      "disciplinary meeting",
      "gross misconduct allegation",
      "summary dismissal",
      "dismissal for gross misconduct",
      "final written warning",
      "formal disciplinary",
      "suspended pending investigation",
    ],

    intentMatches: [
      "disciplinary",
      "misconduct",
      "conduct",
      "gross_misconduct",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Disciplinary",

    triggered,

    issues: triggered
      ? [
          "The matter may involve alleged misconduct or a breach of workplace standards.",
          "The employer should distinguish allegations from established facts and avoid reaching conclusions before an investigation.",
          `Disciplinary reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "A fair disciplinary process should normally include an investigation, written notification of the allegations, a hearing and an opportunity for the employee to respond.",
          "The employee may have the statutory right to be accompanied at a formal disciplinary hearing.",
          "The employer should follow the ACAS Code of Practice on disciplinary and grievance procedures where it applies.",
          "Any sanction should be reasonable, proportionate and consistent with the evidence, policy and treatment of comparable cases.",
          "Dismissal should not be predetermined before the employee has had a fair opportunity to respond.",
          "Consider whether disability, whistleblowing, trade union activity, pregnancy, discrimination or another protected issue may be connected to the allegations or proposed action.",
          "Suspension should not be automatic and should be kept under review.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Assess the seriousness of the allegation and its impact on trust, safety, colleagues, customers, service delivery and reputation.",
          "Consider whether temporary measures other than suspension could protect the investigation.",
          "Ensure the matter is handled promptly while allowing sufficient time for a fair investigation.",
          "Maintain confidentiality and limit information to those who genuinely need to know.",
          "Apply standards consistently across employees and managers.",
          "Consider whether informal management is more proportionate for minor concerns.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's disciplinary procedure and code of conduct.",
          "Check whether the alleged behaviour is listed as misconduct or gross misconduct.",
          "Review any relevant safeguarding, confidentiality, IT, social media, attendance, equality, health and safety or data protection policy.",
          "Check the employee's contract, handbook and any previous live warnings.",
          "Confirm who is authorised to investigate, chair the hearing and decide any appeal.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What exactly is alleged to have happened?",
          "When and where did the alleged conduct occur?",
          "Who witnessed or reported it?",
          "What evidence is available?",
          "Has the employee been informed of the allegation?",
          "Has an impartial investigation been completed?",
          "What explanation has the employee given?",
          "Is there any relevant mitigation?",
          "Does the matter involve possible gross misconduct?",
          "Is suspension being considered, and why is it necessary?",
          "Are there suitable alternatives to suspension?",
          "Does the employee have any live warnings?",
          "How have similar cases been handled previously?",
          "Could disability, health, discrimination, whistleblowing or another protected issue be relevant?",
          "What does the disciplinary policy require?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Define the allegation clearly and avoid describing it as proven misconduct before the evidence has been considered.",
          "Appoint an appropriate and impartial investigator.",
          "Gather relevant documents, records, witness accounts and other evidence.",
          "Consider whether suspension is genuinely necessary and review it regularly if used.",
          "Give the employee a fair opportunity to respond during the investigation.",
          "If there is a case to answer, invite the employee to a formal disciplinary hearing in writing.",
          "Provide the allegations and relevant evidence in advance of the hearing.",
          "Explain the right to be accompanied where applicable.",
          "Hold the hearing with an open mind and consider the employee's response and any mitigation.",
          "Decide whether the allegation is upheld on the evidence available.",
          "Select a proportionate and consistent outcome in line with policy.",
          "Confirm the outcome and reasons in writing.",
          "Offer a right of appeal where formal action is taken.",
          "Keep a clear audit trail of the investigation, hearing, decision and outcome.",
        ]
      : [],
  };
}