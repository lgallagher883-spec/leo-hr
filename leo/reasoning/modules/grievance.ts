import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runGrievanceReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "grievance",
      "formal complaint",
      "complaint about manager",
      "complaint about colleague",
      "unfair treatment",
      "treated unfairly",
      "workplace complaint",
      "raised concerns",
      "employee complaint",
      "bullying complaint",
      "harassment complaint",
      "discrimination complaint",
      "victimisation",
      "relationship breakdown",
      "conflict at work",
      "manager behaviour",
      "colleague behaviour",
      "working conditions",
      "breach of contract",
      "pay complaint",
      "workload complaint",
      "appeal grievance outcome",
    ],

    strongKeywords: [
      "formal grievance",
      "grievance hearing",
      "grievance meeting",
      "grievance investigation",
      "grievance outcome",
      "grievance appeal",
      "collective grievance",
      "written grievance",
    ],

    intentMatches: [
      "grievance",
      "employee_complaint",
      "workplace_complaint",
      "collective_grievance",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Grievance",

    triggered,

    issues: triggered
      ? [
          "The employee appears to have raised a workplace concern or complaint that may need to be handled under the grievance procedure.",
          "The employer should separate the employee's allegations from any conclusions and ensure the concerns are examined fairly.",
          `Grievance reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "The employer should follow a fair grievance process and consider the ACAS Code of Practice on disciplinary and grievance procedures.",
          "The employee may have the statutory right to be accompanied at a formal grievance hearing.",
          "The grievance may raise discrimination, harassment, victimisation, whistleblowing, contractual or health and safety issues that require separate consideration.",
          "The employer should avoid subjecting the employee to retaliation or disadvantage because they raised a concern.",
          "Any relevant time-sensitive legal or procedural issues should be identified promptly.",
          "A grievance should not be dismissed merely because it was raised informally or without using a specific label.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Addressing concerns promptly may prevent further conflict, absence, resignations or legal escalation.",
          "Consider the effect of the grievance on working relationships, team morale and management credibility.",
          "Maintain appropriate confidentiality while gathering enough information to investigate properly.",
          "Consider whether temporary reporting lines, mediation or other interim arrangements are needed.",
          "Ensure the person handling the grievance is sufficiently impartial and senior.",
          "Take care where the grievance concerns the employee's direct manager or senior leadership.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's grievance procedure.",
          "Check equality, dignity at work, bullying and harassment, whistleblowing, health and safety and data protection policies where relevant.",
          "Confirm who should hear the grievance and any subsequent appeal.",
          "Review any timescales, written notification requirements and rights of accompaniment.",
          "Check whether the concern overlaps with an existing disciplinary, capability, absence or safeguarding process.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What exactly is the employee complaining about?",
          "When did the events take place?",
          "Who is involved?",
          "Has the concern been raised in writing?",
          "Is the employee seeking a particular outcome?",
          "Has the concern previously been raised informally?",
          "What evidence or witnesses may be relevant?",
          "Does the grievance involve discrimination, harassment, victimisation or whistleblowing?",
          "Does the grievance concern the employee's manager or the person who would normally handle it?",
          "Is there an active disciplinary, performance, absence or safeguarding process connected to the grievance?",
          "Is any immediate action needed to protect the employee or preserve evidence?",
          "Has the employee been informed about the grievance procedure and right to be accompanied?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Acknowledge the grievance promptly and confirm the next steps.",
          "Clarify the allegations, relevant dates, people involved and outcome sought.",
          "Appoint an impartial person to hear or investigate the grievance.",
          "Decide whether a separate investigation is required before the grievance hearing.",
          "Invite the employee to a formal grievance meeting and explain the right to be accompanied where applicable.",
          "Give the employee a full opportunity to explain the concerns and provide evidence.",
          "Investigate disputed facts fairly and speak to relevant witnesses.",
          "Consider each allegation separately and record the evidence and conclusions.",
          "Confirm the outcome and reasons in writing.",
          "Explain any action the organisation will take while preserving appropriate confidentiality.",
          "Offer a right of appeal.",
          "Monitor the workplace afterwards for retaliation, relationship issues or further concerns.",
        ]
      : [],
  };
}