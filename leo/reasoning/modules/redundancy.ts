import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runRedundancyReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "redundancy",
      "redundant",
      "role at risk",
      "at risk of redundancy",
      "job at risk",
      "role no longer needed",
      "role no longer required",
      "restructure",
      "reorganisation",
      "business closure",
      "site closure",
      "department closure",
      "headcount reduction",
      "reduce headcount",
      "cost cutting",
      "cost-cutting",
      "selection pool",
      "selection criteria",
      "consultation",
      "alternative employment",
      "suitable alternative role",
      "redundancy pay",
      "collective redundancy",
      "collective consultation",
    ],

    strongKeywords: [
      "redundancy consultation",
      "redundancy selection",
      "provisional selection for redundancy",
      "notice of redundancy",
      "dismissal by reason of redundancy",
      "20 or more redundancies",
      "collective consultation period",
      "hr1 form",
    ],

    intentMatches: [
      "redundancy",
      "restructure",
      "business_closure",
      "collective_redundancy",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Redundancy",

    triggered,

    issues: triggered
      ? [
          "The matter may involve a proposed reduction in roles, work or staffing requirements.",
          "The employer should establish whether there is a genuine redundancy situation before selecting employees or reaching outcomes.",
          `Redundancy reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "A genuine redundancy situation may arise where the business closes, a workplace closes or the employer's requirement for employees to carry out work of a particular kind reduces or ends.",
          "A fair redundancy process should normally include meaningful consultation before any final decision is made.",
          "The employer should identify an appropriate selection pool and use fair, objective and consistently applied selection criteria.",
          "Employees should be considered for suitable alternative employment where available.",
          "Collective consultation obligations may apply where 20 or more redundancies are proposed at one establishment within a 90-day period.",
          "Eligible employees may be entitled to statutory redundancy pay, notice pay and accrued holiday pay.",
          "Selection must not be influenced by discrimination, pregnancy, family leave, whistleblowing, trade union activity or other automatically unfair reasons.",
          "The employer should avoid presenting redundancy as a final decision before consultation has taken place.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Clarify the business reason for the proposed change and the outcome the organisation is trying to achieve.",
          "Consider whether the work has genuinely reduced or whether it will continue under a different title or employee.",
          "Assess the operational impact of removing roles, knowledge, skills or capacity.",
          "Consider alternatives such as reduced hours, recruitment freezes, redeployment, voluntary redundancy or changes to structure.",
          "Plan communications carefully to maintain trust and reduce uncertainty.",
          "Consider the impact on remaining employees, morale, workload and service continuity.",
          "Ensure managers involved in consultation are properly briefed and consistent.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's redundancy, restructuring and consultation procedures.",
          "Check employment contracts for mobility, flexibility, lay-off, short-time working or enhanced redundancy terms.",
          "Review any collective agreement or recognised trade union arrangements.",
          "Check how selection criteria, appeals and alternative roles are dealt with under policy.",
          "Review previous redundancy exercises for consistency.",
          "Confirm who is authorised to consult, score employees and make final decisions.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What business change is being proposed?",
          "Why is the role or work no longer required?",
          "How many roles and employees may be affected?",
          "Is the proposal limited to one establishment or multiple locations?",
          "Has a final decision already been made?",
          "What is the proposed selection pool?",
          "Why is that pool appropriate?",
          "What selection criteria are proposed?",
          "Who will carry out the scoring?",
          "What evidence will support each score?",
          "Are 20 or more redundancies proposed within 90 days at one establishment?",
          "Are employee representatives or a recognised trade union involved?",
          "What suitable alternative roles may be available?",
          "Have alternatives to redundancy been considered?",
          "Are any affected employees pregnant, on family leave, disabled, absent, whistleblowers or trade union representatives?",
          "What notice and redundancy payments may be due?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Document the genuine business reason and the proposed organisational change.",
          "Identify which roles, rather than named employees, are potentially affected.",
          "Confirm the appropriate selection pool before applying any criteria.",
          "Develop objective, measurable and non-discriminatory selection criteria.",
          "Begin meaningful consultation while proposals remain open to change.",
          "Explain the business rationale, proposed process, pool, criteria and timescale to affected employees.",
          "Invite employees to suggest alternatives and respond genuinely to proposals.",
          "Consider voluntary redundancy, reduced hours, redeployment and other alternatives where appropriate.",
          "Search for suitable alternative employment throughout the process.",
          "Apply selection criteria consistently and retain evidence supporting scores.",
          "Allow employees to challenge provisional scores and provide relevant evidence.",
          "Check whether collective consultation and HR1 notification obligations apply.",
          "Confirm final decisions in writing only after consultation is complete.",
          "Provide notice, redundancy pay calculations, holiday pay and appeal information where applicable.",
          "Keep a complete audit trail of the business rationale, consultation, scoring, alternatives and final decision.",
        ]
      : [],
  };
}