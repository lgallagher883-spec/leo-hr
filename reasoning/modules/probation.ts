import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runProbationReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "probation",
      "probationary period",
      "probation review",
      "probation meeting",
      "probation outcome",
      "probation extension",
      "extend probation",
      "failed probation",
      "fail probation",
      "pass probation",
      "confirm employment",
      "new starter review",
      "new employee review",
      "settling in",
      "not suitable during probation",
      "performance during probation",
      "absence during probation",
      "conduct during probation",
      "dismiss during probation",
      "dismissal during probation",
      "end probation",
      "probation warning",
      "probation concerns",
      "unsuccessful probation",
    ],

    strongKeywords: [
      "formal probation review",
      "extend the probationary period",
      "dismissal at the end of probation",
      "termination during probation",
      "probation period extended",
      "final probation review",
      "probation dismissal",
    ],

    intentMatches: [
      "probation",
      "probation_review",
      "probation_extension",
      "probation_dismissal",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Probation",

    triggered,

    issues: triggered
      ? [
          "The matter concerns an employee's progress, conduct, attendance or suitability during probation.",
          "The employer should distinguish between performance, conduct, attendance, training, health and suitability concerns.",
          "Probation must be actively managed and should not be allowed to drift towards six months without a clear, documented decision.",
          `Probation reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "There is no statutory requirement to use a probation period and no statutory maximum length, so the employer must follow the employment contract and probation policy.",
          "Leo's standard employer recommendation is a three-month probation period, allowing sufficient time for a controlled extension and any necessary process before six months' service.",
          "From 1 January 2027, ordinary unfair-dismissal protection applies after six months' service.",
          "Employees who have already completed six months' service by 1 January 2027 will gain ordinary unfair-dismissal protection immediately. This includes employees who started on or before 1 July 2026.",
          "The employer must calculate the employee's effective termination date, including contractual or statutory notice, because employment may continue beyond the date the dismissal decision is made.",
          "Probation does not remove day-one protections relating to discrimination, pregnancy, family leave, whistleblowing, trade union activity, health and safety or other automatically unfair reasons.",
          "A probation dismissal should still be supported by clear reasons, evidence, an opportunity for the employee to respond and a written outcome.",
          "Where performance or conduct is involved, the employer should follow a fair process consistent with the principles of the relevant procedure and the ACAS Code where applicable.",
          "Where disability or ill health may be relevant, the employer must consider medical evidence and reasonable adjustments before reaching a decision.",
          "Contractual and statutory notice requirements must be checked before employment is ended.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Leo's standard recommendation is that probation should normally be three months.",
          "A three-month probation period provides a meaningful assessment window while preserving time for an extension, additional support and, where necessary, a properly managed termination process before six months' service.",
          "Probation reviews should be scheduled throughout the period rather than leaving concerns until the final review.",
          "Managers should address concerns as soon as they arise and record the support, feedback and expectations given.",
          "Where probation is extended, the extension should be specific, time-limited and supported by clear objectives and review dates.",
          "The employer should account for notice when planning any termination so that the effective termination date does not unintentionally fall after six months' service.",
          "Assess whether the employee received a proper induction, training, supervision and clear expectations.",
          "Consider whether the concern is likely to improve with additional support or a short extension.",
          "Ensure probation standards are applied consistently across comparable employees.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the employee's contract and the organisation's probation procedure.",
          "Check the stated probation length, notice period and any contractual power to extend probation.",
          "Review performance, capability, conduct, absence, disability and reasonable-adjustments policies where relevant.",
          "Check whether the policy requires interim reviews, a final review meeting or written confirmation of the outcome.",
          "Confirm who is authorised to extend probation, confirm appointment or dismiss.",
          "Review documented objectives, supervision notes, training records, feedback and previous probation reviews.",
          "Check whether the contract explains what happens if probation expires without a written outcome.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What is the employee's start date?",
          "What is the contractual probation period?",
          "When does the probation period end?",
          "What notice period applies during probation?",
          "What would the effective termination date be if notice were issued now?",
          "Will the employee reach six months' service before employment legally ends?",
          "Has the employee received a proper induction and required training?",
          "What standards, objectives or behaviours were expected?",
          "What specific concerns have arisen?",
          "When were those concerns first discussed with the employee?",
          "What support, coaching or supervision has been provided?",
          "Has the employee been given a reasonable opportunity to improve?",
          "Has the employee given any explanation for the concerns?",
          "Are health, disability, pregnancy, family leave, whistleblowing or another protected issue relevant?",
          "Has sickness absence affected the employee's opportunity to demonstrate suitability?",
          "Does the contract or policy allow probation to be extended?",
          "Has a formal probation review meeting been arranged?",
          "What outcome is the employer considering and why?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Use three months as the organisation's standard probation period unless there is a clear, documented role-specific reason for a different period.",
          "Schedule probation reviews at approximately four weeks, eight weeks and twelve weeks.",
          "Review the contract, probation policy, employee start date, probation end date and notice provisions before taking action.",
          "Calculate the effective termination date, including notice, before deciding whether there is sufficient time to complete the process safely.",
          "Identify employees who started on or before 1 July 2026 because they may gain ordinary unfair-dismissal protection immediately on 1 January 2027 if they have six months' service.",
          "Gather clear examples of performance, conduct, attendance or suitability concerns.",
          "Check whether expectations, training, supervision and support were sufficiently clear.",
          "Meet with the employee to discuss progress, explain the concerns and hear their response.",
          "Consider disability, health, pregnancy, family leave, whistleblowing and other protected-right risks before deciding the outcome.",
          "Where improvement appears realistic, consider a short, controlled extension if the contract or policy permits it.",
          "If probation is extended, confirm the reasons, objectives, support, review dates, revised end date and possible consequences in writing.",
          "Do not allow probation to drift towards six months without a documented decision and action plan.",
          "Where dismissal is being considered, provide the employee with the concerns and evidence, hear their response, consider alternatives and complete the process promptly.",
          "Confirm any dismissal decision, reasons, notice arrangements and appeal right in writing.",
          "Keep a clear record of reviews, support, concerns, evidence, decisions and the employee's response.",
        ]
      : [],
  };
}