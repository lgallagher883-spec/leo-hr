import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runCapabilityReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "capability",
      "not capable",
      "cannot do the job",
      "can't do the job",
      "unable to perform",
      "unable to carry out duties",
      "not competent",
      "lacks competence",
      "skills gap",
      "unable to meet standards",
      "not meeting required standards",
      "not able to fulfil the role",
      "not suitable for the role",
      "struggling in the role",
      "cannot cope with the role",
      "cannot manage the workload",
      "lack of ability",
      "lack of skill",
      "lack of knowledge",
      "unable to improve",
      "failed to improve",
      "performance has not improved",
      "insufficient improvement",
      "capability concern",
      "capability issue",
      "medical capability",
      "ill health capability",
    ],

    strongKeywords: [
      "formal capability",
      "capability procedure",
      "capability hearing",
      "capability meeting",
      "capability warning",
      "final capability warning",
      "dismissal on capability grounds",
      "ill health dismissal",
      "medical incapability",
      "long-term incapacity",
    ],

    intentMatches: [
      "capability",
      "performance",
      "ill_health_capability",
      "medical_capability",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Capability",

    triggered,

    issues: triggered
      ? [
          "The matter may concern whether the employee has the ability, competence, qualifications, health or capacity to perform the role.",
          "It is important to distinguish capability from misconduct, deliberate refusal, inadequate training, unclear expectations and temporary performance issues.",
          `Capability reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "A fair capability process should normally identify the concern clearly, provide support and allow a reasonable opportunity for improvement.",
          "Where health or disability may be relevant, the employer should consider medical evidence and reasonable adjustments before reaching conclusions.",
          "The Equality Act 2010 may apply where the employee has a physical or mental impairment with a substantial and long-term adverse effect.",
          "Capability dismissal should usually be a final step after support, review and reasonable alternatives have been considered.",
          "The employer should avoid treating temporary illness, insufficient training or poor management support as permanent incapability.",
          "Any decision should be based on reliable evidence and a fair assessment of the role requirements.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Assess the impact of the capability concern on service quality, safety, customers, colleagues, workload and operational delivery.",
          "Consider whether the role expectations are realistic and whether they are being applied consistently.",
          "Review whether the employee has received suitable induction, training, supervision, resources and feedback.",
          "Consider whether duties, working arrangements, workload or responsibilities could reasonably be adjusted.",
          "Assess whether redeployment or an alternative role may be practical before employment is ended.",
          "Ensure the process is proportionate to the seriousness and duration of the concern.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's capability or performance management procedure.",
          "Check any sickness absence, disability, reasonable adjustments, probation, training or disciplinary policy that may also apply.",
          "Confirm whether the organisation has a separate ill-health capability process.",
          "Review the employee's job description, required qualifications, objectives and documented standards.",
          "Check previous appraisals, supervision notes, training records, improvement plans and warnings.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What specific duties or standards is the employee unable to meet?",
          "What evidence demonstrates the capability concern?",
          "How long has the concern existed?",
          "Has the employee previously performed the role successfully?",
          "Is the issue related to skill, knowledge, experience, health, disability, workload or conduct?",
          "What training, coaching, supervision or support has been provided?",
          "Has the employee been told clearly what improvement is required?",
          "Has a reasonable improvement period been given?",
          "Has the employee explained why they are struggling?",
          "Is there any medical evidence or Occupational Health advice?",
          "Could reasonable adjustments help?",
          "Is the employee within probation?",
          "Are there any suitable alternative duties or roles available?",
          "Has the organisation followed its own capability procedure?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Define the capability concern using specific examples and evidence.",
          "Confirm the essential requirements of the role and the standard expected.",
          "Meet with the employee to explain the concern and hear their response.",
          "Identify whether the issue arises from training, support, health, disability, workload or unclear expectations.",
          "Provide appropriate support, training, supervision and a reasonable opportunity to improve.",
          "Where health may be relevant, consider medical or Occupational Health advice.",
          "Consider reasonable adjustments where disability may apply.",
          "Use a clear improvement plan with measurable objectives, support and review dates where appropriate.",
          "Record progress, support provided and the employee's response at each stage.",
          "Consider alternatives such as adjusted duties, reduced responsibilities or redeployment before dismissal.",
          "Only consider dismissal after a fair process where the evidence shows that the employee remains unable to meet the essential requirements of the role.",
        ]
      : [],
  };
}