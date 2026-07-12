import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runPerformanceReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "performance",
      "underperforming",
      "underperformance",
      "poor performance",
      "not performing",
      "not meeting expectations",
      "not meeting standards",
      "quality of work",
      "work quality",
      "targets",
      "missed targets",
      "missing targets",
      "productivity",
      "slow work",
      "mistakes",
      "errors",
      "competence",
      "incompetent",
      "standards",
      "objectives",
      "improvement required",
      "needs improvement",
      "performance concerns",
      "performance issue",
      "performance review",
      "appraisal",
      "pip",
    ],

    strongKeywords: [
      "performance improvement plan",
      "capability procedure",
      "capability meeting",
      "formal capability",
      "performance warning",
      "final performance warning",
      "failed improvement plan",
      "not capable of doing the job",
    ],

    intentMatches: [
      "performance",
      "capability",
      "underperformance",
      "performance_management",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Performance Management",

    triggered,

    issues: triggered
      ? [
          "The matter involves concerns about an employee's performance, capability or ability to meet required standards.",
          "It is important to distinguish capability concerns from misconduct, attendance issues, insufficient training or unclear management expectations.",
          `Performance reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "A fair process should normally give the employee clear information about the performance concerns and a reasonable opportunity to improve.",
          "Before taking formal action, consider whether disability, ill health, pregnancy, family-related circumstances or another protected characteristic may be relevant.",
          "Consider whether reasonable adjustments are required where the performance concern may be linked to disability.",
          "Any dismissal for capability should be based on evidence, a fair process and a reasonable assessment that improvement has not been achieved.",
          "The employer should avoid treating a lack of training, unclear expectations or inadequate support as employee incapability.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Identify the practical impact of the performance concern on quality, customers, colleagues, productivity, safety or service delivery.",
          "Consider whether the required standard has been explained consistently and applied fairly across comparable employees.",
          "Assess whether the employee has the resources, time, training and management support needed to succeed.",
          "Set measurable improvement expectations that are realistic for the role and organisation.",
          "Consider whether informal support may resolve the issue before beginning a formal process.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's performance management or capability procedure.",
          "Check any appraisal, supervision, probation, training or disciplinary policy that may be relevant.",
          "Confirm whether the organisation distinguishes between capability and misconduct.",
          "Check whether the required performance standards, targets or role expectations are documented.",
          "Review any previous support, supervision notes, objectives or improvement plans.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What specific aspect of the employee's performance is causing concern?",
          "What standard or expectation should the employee be meeting?",
          "How and when was that standard communicated?",
          "What evidence demonstrates that the required standard is not being met?",
          "How long has the concern existed?",
          "Has the employee previously performed at the required standard?",
          "Has the employee been given feedback about the concern?",
          "What training, coaching, supervision or support has already been provided?",
          "Has the employee given any explanation for the performance issue?",
          "Could health, disability, workload, unclear instructions, workplace relationships or insufficient resources be contributing?",
          "Is the employee still within probation?",
          "Has an improvement period or performance improvement plan already been used?",
          "What impact is the performance issue having on the organisation?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Define the performance concern using specific, factual examples rather than broad descriptions.",
          "Confirm the standard expected and ensure it is reasonable for the employee's role.",
          "Meet with the employee to explain the concern and hear their response before reaching conclusions.",
          "Identify whether training, clearer instructions, supervision, equipment, workload changes or reasonable adjustments are required.",
          "Consider informal coaching and support before formal action where appropriate.",
          "If formal management is necessary, create a written improvement plan with clear objectives, support, review dates and a reasonable timescale.",
          "Explain the possible consequences if sufficient improvement is not achieved.",
          "Review progress fairly and record the evidence considered at each stage.",
          "Keep capability and misconduct issues separate unless there is evidence that the employee is deliberately refusing to perform.",
          "Before considering dismissal, confirm that the employee has had a genuine opportunity to improve and that relevant alternatives have been considered.",
        ]
      : [],
  };
}