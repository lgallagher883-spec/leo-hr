import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runEqualityDiscriminationReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "discrimination",
      "discriminated",
      "equality",
      "equal opportunities",
      "protected characteristic",
      "less favourable treatment",
      "unfair treatment",
      "direct discrimination",
      "indirect discrimination",
      "victimisation",
      "harassment",
      "reasonable adjustment",
      "failure to make reasonable adjustments",
      "discrimination arising from disability",
      "age discrimination",
      "sex discrimination",
      "race discrimination",
      "racial discrimination",
      "disability discrimination",
      "religion discrimination",
      "religious discrimination",
      "belief discrimination",
      "sexual orientation discrimination",
      "gender reassignment discrimination",
      "marriage discrimination",
      "civil partnership discrimination",
      "pregnancy discrimination",
      "maternity discrimination",
      "menopause discrimination",
      "associative discrimination",
      "perceptive discrimination",
      "discrimination by association",
      "discrimination by perception",
      "equal pay",
      "positive action",
      "occupational requirement",
      "objective justification",
      "protected group",
      "bias",
      "unconscious bias",
    ],

    strongKeywords: [
      "formal discrimination complaint",
      "equality act claim",
      "employment tribunal discrimination claim",
      "treated less favourably because of",
      "disadvantaged by workplace rule",
      "failure to make reasonable adjustments",
      "discrimination arising from disability",
      "victimised after discrimination complaint",
      "dismissed because of protected characteristic",
      "selected for redundancy because of protected characteristic",
      "pregnancy related dismissal",
      "maternity related dismissal",
      "equal pay claim",
    ],

    intentMatches: [
      "discrimination",
      "equality",
      "protected_characteristic",
      "victimisation",
      "equal_pay",
      "reasonable_adjustments",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Equality & Discrimination",

    triggered,

    issues: triggered
      ? [
          "The matter may involve treatment connected to a protected characteristic, a discriminatory workplace rule, a failure to make reasonable adjustments, harassment or victimisation.",
          "Equality risk should be considered across the whole employment relationship, including recruitment, pay, training, promotion, absence, discipline, redundancy and dismissal.",
          "The employer should examine both the reason for the decision and its practical impact.",
          `Equality and discrimination reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "The Equality Act 2010 protects the characteristics of age, disability, gender reassignment, marriage and civil partnership, pregnancy and maternity, race, religion or belief, sex and sexual orientation.",
          "Direct discrimination generally occurs where someone is treated less favourably because of a protected characteristic.",
          "Indirect discrimination may arise where a provision, criterion or practice applies to everyone but puts people sharing a protected characteristic at a particular disadvantage and cannot be objectively justified.",
          "Objective justification normally requires the employer to show that the measure pursues a legitimate aim and is a proportionate means of achieving it.",
          "Discrimination arising from disability may occur where a disabled person is treated unfavourably because of something resulting from their disability and the treatment cannot be justified.",
          "Employers have a duty to make reasonable adjustments where a disabled person is placed at a substantial disadvantage.",
          "The reasonable-adjustments duty is separate from flexible-working duties and should be considered independently.",
          "Harassment related to a protected characteristic and sexual harassment can be unlawful.",
          "Victimisation may occur where someone is subjected to a detriment because they raised, supported or gave evidence concerning an Equality Act matter.",
          "Associative discrimination may arise because of another person's protected characteristic, and perceptive discrimination may arise because someone is believed to have a protected characteristic.",
          "Pregnancy and maternity discrimination involves unfavourable treatment because of pregnancy, maternity leave or pregnancy-related illness.",
          "Equal-pay law applies to contractual pay and terms for equal work, subject to any lawful material-factor defence.",
          "Equality protections apply to job applicants, employees and workers and can apply regardless of length of service.",
          "Employers can be liable for discriminatory acts carried out by employees in the course of employment unless they can establish an available statutory defence, including evidence of reasonable preventative steps where relevant.",
          "Positive action is legally distinct from positive discrimination and must remain within the permitted statutory conditions.",
          "An occupational requirement based on a protected characteristic is only lawful in limited circumstances where it is genuinely required and proportionate.",
          "Discrimination claims do not require the ordinary qualifying period for unfair dismissal.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Equality should be considered before decisions are implemented, not only after a complaint is made.",
          "Managers should base decisions on clear evidence and documented role or business requirements.",
          "Consistency is important, but treating everyone identically can still create disadvantage where circumstances differ.",
          "Policies, targets, attendance rules, working arrangements and selection criteria should be checked for unintended group disadvantage.",
          "Decision-makers should examine whether assumptions, stereotypes or unconscious bias have influenced the process.",
          "The organisation should compare treatment across genuinely comparable employees while recognising relevant differences.",
          "Equality risks may overlap with absence, capability, disciplinary, grievance, performance, recruitment, pay, redundancy and family-leave matters.",
          "The employer should consider whether a less discriminatory alternative could achieve the same legitimate business aim.",
          "Good records are essential because the employer may later need to explain the factual and non-discriminatory basis for its decision.",
          "Complaints should be handled without retaliation, exclusion or career disadvantage.",
          "Training alone is not enough; the organisation should also review its systems, management practice and workplace culture.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's equality, diversity and inclusion policy.",
          "Check reasonable-adjustments, disability, pregnancy and maternity, harassment, grievance and recruitment procedures where relevant.",
          "Review the policy directly governing the decision, such as attendance, capability, disciplinary, redundancy, promotion or flexible working.",
          "Check whether any criterion, rule, threshold or process could place a protected group at a disadvantage.",
          "Review equal-pay, pay-review, bonus and benefits arrangements where relevant.",
          "Confirm who is authorised to decide adjustments, investigate complaints and hear appeals.",
          "Check whether equality monitoring information is kept separately from selection and employment decisions.",
          "Review whether managers have received practical training on discrimination, adjustments, harassment and victimisation.",
          "Confirm how complaints, sensitive information, confidentiality and retaliation risks are managed.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What decision, treatment, rule or behaviour is causing concern?",
          "Which protected characteristic or equality issue may be relevant?",
          "Who made the decision and what reasons were recorded?",
          "What evidence supports the stated reason?",
          "How was the person treated compared with an actual or hypothetical comparator?",
          "Does a workplace rule or practice disadvantage a group sharing the protected characteristic?",
          "What legitimate aim is the employer trying to achieve?",
          "Could that aim be achieved through a less discriminatory alternative?",
          "Does the matter involve disability or something arising from disability?",
          "Did the employer know, or should it reasonably have known, about the disability?",
          "What disadvantage is the disabled person experiencing?",
          "What reasonable adjustments have been requested, discussed, trialled or rejected?",
          "Does the matter involve pregnancy, maternity leave or pregnancy-related illness?",
          "Does the matter involve harassment, sexual harassment or unwanted conduct?",
          "Has the employee previously raised an equality complaint or supported another person?",
          "Could later treatment amount to victimisation?",
          "Are pay or contractual terms being compared?",
          "Are recruitment, promotion, training, redundancy or dismissal decisions involved?",
          "Have comparable cases been handled consistently?",
          "Is there an urgent need to preserve evidence or prevent further harm?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Identify the precise decision, treatment, rule or behaviour under review.",
          "Identify every protected characteristic or equality duty that may be relevant.",
          "Pause any avoidable final decision until the equality risks have been assessed.",
          "Gather the factual evidence and documented reasons relied upon by the decision-maker.",
          "Check for direct discrimination, indirect discrimination, harassment, victimisation and disability-related duties separately.",
          "Where disability may apply, meet with the employee and explore reasonable adjustments before reaching a decision.",
          "Assess the practical disadvantage created by any workplace rule, criterion or practice.",
          "Identify the legitimate business aim and consider whether a less discriminatory alternative is available.",
          "Remove pregnancy-related and maternity-related disadvantage from attendance, performance, selection and redundancy decisions.",
          "Review comparators carefully and ensure that genuinely similar cases are treated consistently.",
          "Investigate equality complaints promptly and impartially.",
          "Protect complainants and witnesses from retaliation or victimisation.",
          "Record the alternatives considered and explain why the selected approach is necessary and proportionate.",
          "Seek specialist legal advice where dismissal, redundancy, equal pay, complex disability or significant tribunal exposure is involved.",
          "Confirm decisions and reasons clearly in writing.",
          "Review whether policy, management practice or training needs to change to prevent recurrence.",
          "Keep a secure audit trail of the evidence, equality analysis, adjustments, consultation and final decision.",
        ]
      : [],
  };
}