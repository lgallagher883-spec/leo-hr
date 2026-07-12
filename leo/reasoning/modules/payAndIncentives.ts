import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runPayAndIncentivesReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "pay",
      "salary",
      "wages",
      "hourly rate",
      "pay rise",
      "pay increase",
      "pay review",
      "underpaid",
      "unpaid wages",
      "late pay",
      "incorrect pay",
      "pay discrepancy",
      "pay difference",
      "equal pay",
      "minimum wage",
      "national minimum wage",
      "national living wage",
      "deduction",
      "deducted",
      "overpayment",
      "recover overpayment",
      "bonus",
      "discretionary bonus",
      "contractual bonus",
      "commission",
      "sales commission",
      "incentive",
      "incentive scheme",
      "performance bonus",
      "attendance bonus",
      "overtime",
      "overtime pay",
      "allowance",
      "shift allowance",
      "tips",
      "gratuities",
      "service charge",
      "expenses",
      "payslip",
      "payroll",
      "holiday pay",
      "sick pay",
      "retainer",
      "piece work",
    ],

    strongKeywords: [
      "unlawful deduction from wages",
      "breach of contract pay",
      "minimum wage breach",
      "national minimum wage underpayment",
      "equal pay claim",
      "bonus dispute",
      "commission dispute",
      "withheld wages",
      "withheld commission",
      "recover salary overpayment",
      "change contractual pay",
      "reduce salary",
      "cut pay",
    ],

    intentMatches: [
      "pay",
      "wages",
      "pay_and_incentives",
      "bonus",
      "commission",
      "deductions",
      "equal_pay",
      "minimum_wage",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Pay & Incentives",

    triggered,

    issues: triggered
      ? [
          "The matter concerns pay, wages, deductions, bonuses, commission, incentives or another financial term of employment.",
          "The employer should distinguish contractual entitlement from discretionary arrangements and payroll errors.",
          `Pay and incentives reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "Workers must receive at least the applicable National Minimum Wage or National Living Wage for all working time that counts under the legislation.",
          "National Minimum Wage rates change periodically, so Leo should always check the current official rate rather than rely on a hard-coded figure.",
          "For pay periods beginning on or after 1 April 2026, the National Living Wage for workers aged 21 and over is £12.71 per hour, with separate rates for younger workers and eligible apprentices.",
          "The employee's written statement should clearly state their pay, how it is calculated and when it is paid.",
          "An employer can only make deductions from wages where the deduction is required by law, authorised by the contract or agreed by the worker in writing, subject to limited exceptions.",
          "Bonuses and commission may form part of wages and can potentially give rise to unlawful-deduction or breach-of-contract issues if not paid correctly.",
          "The employer should establish whether a bonus or commission scheme is contractual, discretionary or partly discretionary.",
          "Discretionary decisions must still be exercised honestly, rationally, consistently and without discrimination.",
          "Men and women must receive equal pay and contractual terms for equal work unless the employer can establish a lawful material-factor explanation that is not discriminatory.",
          "Fixed-term and part-time workers must not be treated less favourably without objective justification, including in relation to relevant benefits and bonus schemes.",
          "Changing contractual pay normally requires agreement or a lawful contractual basis and should not be imposed without consultation and risk assessment.",
          "Holiday pay calculations may need to include regular payments intrinsically linked to work, depending on the nature of the payment and applicable rules.",
          "Pay decisions must not discriminate because of sex, race, disability, age, pregnancy, family leave or another protected characteristic.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Check the payroll records and calculation method before treating a pay concern as an employee-relations dispute.",
          "Clear, transparent and consistently applied pay structures reduce grievances, equal-pay risks and management inconsistency.",
          "Incentive schemes should reward behaviour that supports the organisation rather than encouraging unsafe, unfair or counterproductive conduct.",
          "Bonus and commission targets should be measurable, understandable and realistically achievable.",
          "Managers should not make informal pay promises without appropriate authority.",
          "Consider affordability, internal pay consistency, recruitment pressures, retention and employee morale when reviewing pay.",
          "Any overpayment recovery plan should be reasonable and should avoid causing unnecessary financial hardship.",
          "Attendance incentives should be reviewed carefully because they may disadvantage disabled employees, pregnant employees or those taking protected leave.",
          "Pay confidentiality clauses should not be used to prevent lawful discussions relevant to equal-pay rights.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the employee's contract, written statement and any applicable pay or reward policy.",
          "Check the wording of bonus, commission, incentive, overtime, allowance and expenses schemes.",
          "Confirm whether the relevant payment is contractual, discretionary or subject to stated conditions.",
          "Review the organisation's payroll, deductions, overpayments and salary-review procedures.",
          "Check equal-pay, equality, family-leave, sickness, holiday and flexible-working policies where relevant.",
          "Confirm who has authority to approve pay changes, bonuses, commission adjustments and deductions.",
          "Review any collective agreement, recognised trade-union arrangement or established custom and practice.",
          "Check whether previous consistent payments may have become contractually binding through custom and practice.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What payment or deduction is in dispute?",
          "What does the employee's contract or written statement say?",
          "Is the payment salary, wages, overtime, bonus, commission, allowance, holiday pay, sick pay or expenses?",
          "Is the payment contractual or discretionary?",
          "What pay period and calculation method apply?",
          "What hours did the employee actually work?",
          "Does the employee receive at least the applicable minimum-wage rate after relevant deductions and adjustments?",
          "Was the employee given an itemised payslip?",
          "What authorisation exists for the deduction?",
          "Was written agreement obtained before the deduction was made?",
          "If there was an overpayment, how did it arise and what amount is outstanding?",
          "Has the employer discussed an affordable repayment arrangement?",
          "What rules govern the bonus or commission scheme?",
          "Were the relevant targets or conditions communicated clearly?",
          "Has the scheme been applied consistently to comparable employees?",
          "Could sickness, disability, pregnancy, family leave, part-time status or fixed-term status have affected the payment?",
          "Is there a potential equal-pay comparator?",
          "Has the employer previously paid this benefit consistently?",
          "Is a contractual pay change being proposed, and has consultation taken place?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Identify the precise payment, deduction, calculation or contractual term involved.",
          "Review the contract, written statement, policy, payroll records and any bonus or commission rules.",
          "Check the applicable National Minimum Wage or National Living Wage rate using current official guidance.",
          "Recalculate the payment using the correct hours, rate, targets and eligibility conditions.",
          "Confirm whether any deduction was legally authorised and properly explained.",
          "Correct payroll errors promptly and provide a clear written calculation.",
          "Where an overpayment has occurred, notify the employee, explain the calculation and seek a reasonable repayment arrangement before deducting money.",
          "Where bonus or commission is disputed, identify which elements are contractual and which genuinely remain discretionary.",
          "Apply any discretion consistently, reasonably and without discrimination.",
          "Check for equal-pay, part-time-worker, fixed-term-worker, disability and family-leave risks before finalising the decision.",
          "Consult and seek agreement before changing contractual pay or benefits.",
          "Confirm any agreed pay change in writing and update the written statement where required.",
          "Review incentive schemes periodically to ensure they remain lawful, transparent and aligned with safe and appropriate behaviour.",
          "Keep an audit trail of calculations, approvals, communications and the reason for the final decision.",
        ]
      : [],
  };
}