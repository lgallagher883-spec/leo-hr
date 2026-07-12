import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runTupeReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "tupe",
      "business transfer",
      "service provision change",
      "outsourcing",
      "insourcing",
      "retender",
      "retendering",
      "new contractor",
      "change of contractor",
      "business sale",
      "business acquisition",
      "merger",
      "transfer of employees",
      "employees transferring",
      "staff transfer",
      "new employer",
      "transfer date",
      "employee liability information",
      "measures",
      "harmonise terms",
      "harmonisation",
      "transfer consultation",
      "inform and consult",
    ],

    strongKeywords: [
      "transfer of undertakings",
      "transfer of undertakings protection of employment",
      "tupe transfer",
      "service provision change",
      "employee liability information",
      "existing terms and conditions transfer",
      "economic technical or organisational reason",
      "eto reason",
    ],

    intentMatches: [
      "tupe",
      "business_transfer",
      "service_provision_change",
      "employee_transfer",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "TUPE",

    triggered,

    issues: triggered
      ? [
          "The matter may involve a business transfer or service provision change where employees could transfer to a new employer.",
          "The employer should establish whether TUPE applies before making decisions about employees, terms or redundancies.",
          `TUPE reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "TUPE may apply where a business or part of a business transfers to a new employer, or where there is a qualifying service provision change.",
          "Where TUPE applies, assigned employees usually transfer automatically with continuity of employment preserved.",
          "The new employer generally inherits the transferring employees' contracts, rights, liabilities and relevant employment history.",
          "Both the outgoing and incoming employers must inform affected employees or their representatives before the transfer.",
          "Consultation is required where measures are proposed that may affect employees.",
          "Employee liability information should normally be provided by the outgoing employer to the incoming employer at least 28 days before the transfer.",
          "Dismissals connected with the transfer may be automatically unfair unless there is a valid economic, technical or organisational reason involving changes in the workforce.",
          "Changes to contractual terms because of the transfer are restricted and should not be made merely to harmonise terms.",
          "Consider whether collective consultation obligations may also apply where redundancies are proposed.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Clarify the commercial transaction, transfer date and responsibilities of both employers.",
          "Identify which employees are genuinely assigned to the transferring business or service.",
          "Assess the operational impact of inherited staffing structures, terms, liabilities and employee relations issues.",
          "Plan communications carefully to reduce uncertainty and protect service continuity.",
          "Identify any proposed measures early, including changes to location, structure, working practices or staffing.",
          "Review the quality and completeness of employee liability information before the transfer.",
          "Consider integration planning without assuming transferred terms can simply be harmonised.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review any organisational TUPE, restructuring, consultation and redundancy procedures.",
          "Check employment contracts, collective agreements, handbooks and local practices applying to transferring employees.",
          "Review recognition arrangements with any trade union or employee representatives.",
          "Confirm who is responsible for informing and consulting affected employees.",
          "Check whether any proposed measures need to be disclosed by the incoming employer to the outgoing employer.",
          "Review policies on mobility, redundancy, benefits, pensions, family leave and employee data.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What is transferring and why?",
          "Is this a business transfer, outsourcing, insourcing or change of contractor?",
          "What is the proposed transfer date?",
          "Which employees are assigned to the transferring business or service?",
          "How was the affected employee group identified?",
          "Are there employees who work partly inside and partly outside the transferring activity?",
          "What measures are proposed by either employer?",
          "Have employees or representatives been informed?",
          "Is consultation required, and who will conduct it?",
          "Has employee liability information been prepared and shared?",
          "Are redundancies or structural changes being considered before or after the transfer?",
          "Are changes to contractual terms being proposed?",
          "Are trade unions or employee representatives involved?",
          "Are there unresolved grievances, disciplinary matters, absences or litigation risks transferring?",
          "Are any affected employees on maternity, family leave, sickness absence or another protected status?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Confirm whether the proposed transaction is likely to fall within TUPE before taking employee-related action.",
          "Define the transferring activity and identify employees assigned to it.",
          "Agree responsibilities and a transfer timetable between the outgoing and incoming employers.",
          "Identify any proposed measures and communicate them between employers early.",
          "Inform affected employees or representatives in good time before the transfer.",
          "Consult meaningfully where measures are proposed.",
          "Prepare and verify employee liability information and provide it within the required timeframe.",
          "Review contracts, policies, benefits, collective arrangements and outstanding employee relations matters.",
          "Avoid changing terms simply to harmonise them following the transfer.",
          "Do not make transfer-related dismissals or redundancies without first considering TUPE protections and any valid ETO reason.",
          "Keep clear records of the transfer analysis, affected employees, information provided, consultation and decisions.",
          "Take specialist legal advice where the application of TUPE, employee assignment or proposed measures are uncertain.",
        ]
      : [],
  };
}