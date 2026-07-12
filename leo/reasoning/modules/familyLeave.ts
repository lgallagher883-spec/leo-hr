import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runFamilyLeaveReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "maternity",
      "maternity leave",
      "maternity pay",
      "pregnant",
      "pregnancy",
      "expecting a baby",
      "due date",
      "antenatal appointment",
      "paternity",
      "paternity leave",
      "paternity pay",
      "adoption",
      "adoption leave",
      "adoption pay",
      "shared parental leave",
      "shared parental pay",
      "parental leave",
      "unpaid parental leave",
      "parental bereavement",
      "bereavement leave",
      "neonatal care",
      "neonatal leave",
      "neonatal pay",
      "keeping in touch day",
      "kit day",
      "split day",
      "return from maternity",
      "return from family leave",
      "family leave",
      "surrogacy",
      "birth parent",
      "primary adopter",
      "partner leave",
    ],

    strongKeywords: [
      "statutory maternity leave",
      "statutory maternity pay",
      "statutory paternity leave",
      "statutory paternity pay",
      "statutory adoption leave",
      "statutory adoption pay",
      "shared parental leave",
      "shared parental pay",
      "parental bereavement leave",
      "neonatal care leave",
      "pregnancy related dismissal",
      "selected for redundancy during maternity leave",
      "returning from maternity leave",
    ],

    intentMatches: [
      "family_leave",
      "maternity",
      "paternity",
      "adoption",
      "shared_parental_leave",
      "parental_leave",
      "parental_bereavement",
      "neonatal_care_leave",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Family Leave",

    triggered,

    issues: triggered
      ? [
          "The matter may involve pregnancy, maternity, paternity, adoption, shared parental, parental bereavement, neonatal care or another family-related leave right.",
          "The employer should identify the precise type of leave or pay involved before deciding eligibility, notice requirements or workplace arrangements.",
          `Family leave reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "Employees must not be subjected to discrimination, dismissal or disadvantage because of pregnancy, maternity leave or another protected family-leave reason.",
          "Maternity and adoption leave may last for up to 52 weeks, subject to the applicable rules and notice requirements.",
          "Eligible parents may share up to 50 weeks of Shared Parental Leave and up to 37 weeks of statutory shared parental pay, depending on how much maternity or adoption leave and pay has already been used.",
          "Paternity Leave and unpaid parental leave are day-one employment rights for eligible employees from 6 April 2026, although statutory pay may have separate qualifying conditions.",
          "Eligible employees can take up to two weeks of Paternity Leave, either together or as separate one-week blocks.",
          "Parental Bereavement Leave and Neonatal Care Leave may apply alongside other family-leave rights.",
          "Employment rights normally continue during statutory family leave, including holiday accrual and protection of contractual terms other than remuneration.",
          "The employee's right to return may depend on the type and total duration of leave taken.",
          "Redundancy, restructuring or role changes affecting an employee on family leave require particular care and may involve priority rights to suitable alternative vacancies.",
          "Current statutory pay rates and eligibility thresholds should be checked at the time of the request rather than hard-coded into the decision.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Plan temporary cover, handovers and communication without pressuring the employee to reduce or alter statutory leave.",
          "Maintain reasonable contact during leave while respecting the employee's preferences.",
          "Consider how workplace changes, restructures, training and promotion opportunities will be communicated to employees who are absent.",
          "Prepare properly for the employee's return, including any flexible-working request, breastfeeding arrangements, health and safety needs or phased transition.",
          "Apply enhanced contractual benefits consistently and check whether company schemes exceed statutory rights.",
          "Ensure managers understand that assumptions about commitment, availability or future attendance must not influence decisions.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's maternity, paternity, adoption, shared parental, parental, neonatal care and bereavement leave policies.",
          "Check whether the organisation provides enhanced family-leave pay or benefits.",
          "Review any flexible-working, redundancy, annual leave, sickness absence and equality policies that may also apply.",
          "Confirm the notice, evidence and payroll procedures for the relevant type of leave.",
          "Check who is authorised to approve leave arrangements and respond to discontinuous Shared Parental Leave requests.",
          "Review how Keeping in Touch days or Shared Parental Leave in Touch days are managed and paid.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What type of family leave or pay is being requested?",
          "What is the expected week of childbirth, placement date or other relevant date?",
          "When did the employee notify the organisation?",
          "What leave dates has the employee requested?",
          "Has the required notice or evidence been supplied?",
          "Does the employee meet the relevant eligibility conditions for statutory pay?",
          "Has any maternity or adoption leave or pay already been used or curtailed?",
          "Is the employee requesting continuous or discontinuous Shared Parental Leave?",
          "Does the organisation provide enhanced contractual pay?",
          "Is the employee combining different types of family leave?",
          "Are there any pregnancy-related health and safety concerns?",
          "Is a restructure, redundancy or role change taking place during the leave?",
          "Has the employee asked to change their return date or working arrangements?",
          "Are there any annual leave arrangements that need to be agreed around the leave?",
          "Has payroll been given the information needed to calculate statutory or contractual pay?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Identify the exact statutory or contractual leave category involved.",
          "Confirm the relevant dates, notice, evidence and eligibility requirements.",
          "Acknowledge the request in writing and confirm the agreed leave dates and expected return date.",
          "Check current GOV.UK statutory pay rates and qualifying conditions before confirming pay.",
          "Review the organisation's policy and any enhanced contractual entitlement.",
          "Discuss reasonable contact arrangements and any proposed Keeping in Touch or SPLIT days.",
          "Plan cover and handover arrangements without discouraging the employee from taking leave.",
          "Keep the employee informed of important workplace developments during the leave.",
          "Review accrued annual leave and agree how it will be taken.",
          "Prepare for the employee's return and discuss any requested adjustments or flexible-working arrangements.",
          "Apply additional safeguards if redundancy, restructuring or dismissal is being considered.",
          "Keep a clear written record of notices, evidence, calculations, communications and decisions.",
        ]
      : [],
  };
}