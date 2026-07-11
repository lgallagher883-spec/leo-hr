import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runHealthSafetyWellbeingReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "health and safety",
      "health safety",
      "workplace safety",
      "accident",
      "injury",
      "incident",
      "near miss",
      "unsafe",
      "hazard",
      "risk assessment",
      "workplace risk",
      "safe system of work",
      "personal protective equipment",
      "ppe",
      "manual handling",
      "slip",
      "trip",
      "fall",
      "display screen equipment",
      "dse",
      "lone working",
      "home working",
      "remote working",
      "work equipment",
      "fire safety",
      "first aid",
      "stress",
      "work-related stress",
      "mental health",
      "wellbeing",
      "burnout",
      "workload",
      "fatigue",
      "occupational health",
      "health surveillance",
      "workplace temperature",
      "violence at work",
      "aggression at work",
      "safety concern",
      "hse",
      "riddor",
    ],

    strongKeywords: [
      "serious workplace accident",
      "reportable injury",
      "riddor report",
      "hse investigation",
      "improvement notice",
      "prohibition notice",
      "unsafe working conditions",
      "no risk assessment",
      "work-related stress risk assessment",
      "employee seriously injured",
      "fatal accident",
      "occupational disease",
      "health surveillance failure",
      "immediate danger",
    ],

    intentMatches: [
      "health_and_safety",
      "wellbeing",
      "workplace_accident",
      "risk_assessment",
      "work_related_stress",
      "mental_health",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Health, Safety & Wellbeing",

    triggered,

    issues: triggered
      ? [
          "The matter concerns a physical or psychological workplace risk, accident, unsafe condition or employee-wellbeing concern.",
          "The employer should identify the hazard, assess who may be harmed and take proportionate action to eliminate or control the risk.",
          "Health and safety management should cover employees, home workers and other people who may be affected by the organisation's activities.",
          `Health, safety and wellbeing reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "Employers have a general duty to protect the health, safety and welfare of employees and other people affected by their work activities.",
          "The employer must carry out suitable and sufficient risk assessments, identify hazards and take action to eliminate or control risks.",
          "Organisations employing five or more people should record significant risk-assessment findings and have a written health and safety policy.",
          "The employer should arrange effective planning, organisation, control, monitoring and review of preventive and protective measures.",
          "The organisation must have access to competent health and safety advice.",
          "Employees must receive appropriate information, instruction, supervision and training, and required training should be provided during working hours without charge.",
          "Employees or their representatives must be consulted on health and safety matters that affect them.",
          "Employers have a legal duty to assess and manage work-related stress in the same way as other workplace risks.",
          "The HSE Management Standards provide a recognised framework for assessing work-related stress, including demands, control, support, relationships, role and change.",
          "Home workers must be protected in the same way as other workers, including risks involving stress, display screen equipment, lone working and the home-working environment.",
          "Certain work-related injuries, diseases and dangerous occurrences may need to be reported under RIDDOR.",
          "Where health surveillance is legally required because of workplace exposure, the employer must arrange suitable surveillance and act on the results.",
          "Health and medical information must be handled confidentially and in accordance with data-protection requirements.",
          "Where an employee may be disabled, the employer should also consider reasonable adjustments under the Equality Act 2010.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Health and safety should be managed as an operational responsibility rather than only as an HR or compliance exercise.",
          "Managers should act promptly where there is an immediate or serious risk.",
          "Risk assessments should reflect actual working practices rather than generic templates.",
          "The employer should investigate accidents and near misses to identify underlying causes, not simply individual blame.",
          "Workload, staffing, working hours, organisational change and poor management support can contribute to stress and ill health.",
          "Employee wellbeing initiatives should not replace action on unsafe workloads, poor systems or unresolved workplace risks.",
          "The organisation should monitor patterns in absence, accidents, near misses, grievances, turnover and stress indicators.",
          "Remote and hybrid working arrangements require specific consideration of equipment, DSE, isolation, workload and emergency arrangements.",
          "Health and safety responsibilities should be clearly allocated and understood by managers.",
          "Lessons from incidents should be communicated and used to improve systems, training and supervision.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's health and safety policy and risk-assessment arrangements.",
          "Check accident, incident, near-miss and RIDDOR reporting procedures.",
          "Review first aid, fire safety, emergency, lone-working and home-working procedures.",
          "Check manual-handling, DSE, PPE, work-equipment and workplace-inspection arrangements where relevant.",
          "Review work-related stress, mental health, wellbeing, sickness absence and occupational-health policies.",
          "Confirm who provides competent health and safety advice.",
          "Check how employees and safety representatives are consulted.",
          "Review training records and confirm whether refresher or role-specific training is required.",
          "Check whether health surveillance is required for any workplace exposure.",
          "Review the organisation's process for responding to HSE enquiries, notices or enforcement action.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What hazard, incident or health concern has arisen?",
          "Is anyone currently at immediate risk?",
          "Who may be affected, including employees, contractors, visitors, service users or members of the public?",
          "Has a risk assessment been completed?",
          "When was it last reviewed?",
          "What control measures are currently in place?",
          "Has an accident, injury, near miss or dangerous occurrence happened?",
          "Was medical treatment required?",
          "Could the matter be reportable under RIDDOR?",
          "Has the incident scene or relevant evidence been preserved?",
          "Has the employee received appropriate training, instruction and supervision?",
          "Was suitable equipment or PPE provided?",
          "Could workload, staffing, hours, management behaviour or organisational change be contributing?",
          "Has a work-related stress risk assessment been considered?",
          "Does the employee work remotely or alone?",
          "Are DSE, equipment, home-working or environmental risks relevant?",
          "Is Occupational Health or medical advice required?",
          "Could disability or reasonable adjustments be relevant?",
          "Have employees or health and safety representatives been consulted?",
          "Does the organisation have five or more employees and a written health and safety policy?",
          "Is competent health and safety advice available?",
          "Has HSE, a local authority, regulator or insurer been notified or involved?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Take immediate action to remove or control any serious or imminent danger.",
          "Identify the hazard, who may be harmed and how serious the potential harm could be.",
          "Complete or review a suitable and sufficient risk assessment.",
          "Record significant findings and assign clear actions, owners and review dates.",
          "Investigate accidents and near misses promptly and preserve relevant evidence.",
          "Check whether the matter must be reported under RIDDOR.",
          "Provide suitable information, instruction, training, supervision, equipment and PPE.",
          "Consult affected employees and any recognised health and safety representatives.",
          "Where stress or mental health is involved, assess work-related causes and act on the findings rather than relying only on individual wellbeing support.",
          "Use the HSE Management Standards approach where appropriate to assess demands, control, support, relationships, role and organisational change.",
          "Review home-working, DSE, lone-working and environmental risks where relevant.",
          "Seek competent health and safety or Occupational Health advice where specialist input is required.",
          "Consider reasonable adjustments where disability or long-term health conditions may apply.",
          "Update policies, safe systems, training and controls following the investigation.",
          "Communicate the outcome and any required changes to relevant employees and managers.",
          "Monitor whether the controls are working and review them after incidents, workplace changes or new information.",
          "Keep a clear audit trail of risk assessments, consultation, training, incidents, decisions and completed actions.",
        ]
      : [],
  };
}