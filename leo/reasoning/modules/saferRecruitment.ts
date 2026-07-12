import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runSaferRecruitmentReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "safer recruitment",
      "safeguarding recruitment",
      "work with children",
      "work with vulnerable adults",
      "regulated activity",
      "childcare recruitment",
      "care recruitment",
      "school recruitment",
      "nursery recruitment",
      "care home recruitment",
      "safeguarding check",
      "employment history",
      "employment gaps",
      "references",
      "reference check",
      "professional registration",
      "qualification check",
      "identity check",
      "criminal record",
      "dbs",
      "barred list",
      "overseas check",
      "online search",
      "single central record",
      "suitability",
      "unsuitable person",
      "safeguarding allegation",
      "prohibition check",
    ],

    strongKeywords: [
      "enhanced dbs with barred list",
      "children's barred list",
      "adults' barred list",
      "regulated activity with children",
      "regulated activity with adults",
      "safer recruitment panel",
      "safeguarding reference",
      "single central record",
      "keeping children safe in education",
      "eyfs safer recruitment",
      "previous safeguarding concern",
      "prohibition from teaching",
      "section 128 check",
    ],

    intentMatches: [
      "safer_recruitment",
      "safeguarding_recruitment",
      "regulated_activity",
      "dbs",
      "suitability_checks",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Safer Recruitment",

    triggered,

    issues: triggered
      ? [
          "The recruitment process may involve work with children, vulnerable adults or another safeguarding-sensitive role.",
          "The employer should assess suitability through the whole recruitment process rather than relying on a DBS check alone.",
          "Safer recruitment requires consistent scrutiny of identity, history, references, qualifications, conduct and role eligibility.",
          `Safer recruitment reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "The employer must identify whether the role is eligible for a basic, standard, enhanced or enhanced DBS check with the relevant barred-list check.",
          "A barred-list check must only be requested where the role falls within the legal definition of regulated activity.",
          "It is unlawful to knowingly permit a barred person to engage in regulated activity.",
          "The employer remains responsible for deciding whether the candidate is suitable, even where a DBS certificate is clear.",
          "Early-years providers must ensure that people looking after children are suitable and that safeguarding procedures support safer recruitment.",
          "For schools and colleges, the current statutory safeguarding guidance must be followed, including the applicable pre-appointment checks and record-keeping duties.",
          "References should be obtained and scrutinised carefully, with safeguarding concerns, disciplinary history and suitability explored where lawful and relevant.",
          "Recruitment decisions must still comply with equality, data-protection and rehabilitation-of-offenders requirements.",
          "Where the candidate has lived or worked overseas, additional checks may be necessary because a UK DBS check may not reveal overseas conduct.",
          "Any information indicating a risk of harm, prohibition, barring or safeguarding concern must be assessed before the candidate begins regulated work.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Build safeguarding into the vacancy, advert, application, shortlisting, interview, offer and onboarding stages.",
          "Use an application process that captures a complete employment history rather than relying only on a CV.",
          "Investigate unexplained employment gaps, frequent role changes and inconsistencies without making assumptions.",
          "Ensure at least one person involved in the process understands safer-recruitment principles.",
          "Assess the candidate's attitudes, judgement, boundaries and understanding of safeguarding as well as technical competence.",
          "Do not allow staffing pressure or urgent cover needs to bypass essential checks.",
          "Record why the employer considers the candidate suitable for the role.",
          "Where checks remain outstanding, use only lawful and properly risk-assessed interim arrangements.",
          "Leo Talent should eventually prevent a candidate from progressing to unrestricted employment until mandatory checks are complete.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's safer-recruitment and safeguarding policies.",
          "Check the recruitment, DBS, references, allegations-management, whistleblowing and data-protection procedures.",
          "Confirm which checks are mandatory for the role and who is responsible for completing and approving them.",
          "Review the job description and person specification for an explicit safeguarding responsibility.",
          "Check whether the organisation requires a structured application form, safeguarding declaration or self-disclosure form.",
          "Confirm the process for overseas checks, professional registration, qualifications and identity verification.",
          "Review how conditional offers, outstanding checks and supervised starts are managed.",
          "For schools and colleges, check the process for maintaining the Single Central Record.",
          "For early-years providers, ensure the safeguarding policy includes procedures designed to recruit only suitable individuals.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "Does the role involve children, vulnerable adults or regulated activity?",
          "Which workforce and level of DBS check is legally appropriate?",
          "Does the role qualify for a barred-list check?",
          "Has the candidate's identity been verified?",
          "Has a full employment history been obtained?",
          "Are there unexplained gaps or inconsistencies?",
          "Have at least two appropriate references been requested where required by policy or regulation?",
          "Were references obtained directly from the referee rather than supplied by the candidate?",
          "Do the references address safeguarding history and suitability?",
          "Have qualifications and professional registrations been verified?",
          "Has the candidate lived or worked overseas?",
          "Are overseas criminal-record or professional-conduct checks required?",
          "Are prohibition, disqualification or regulatory checks relevant?",
          "Has the candidate been asked safeguarding-focused interview questions?",
          "Has any adverse information arisen from the application, references, DBS, online search or interview?",
          "Has the candidate been given an opportunity to explain discrepancies or adverse information?",
          "Are all mandatory checks complete before the proposed start date?",
          "If not, is any proposed supervised start lawful, necessary and risk assessed?",
          "Who has made and documented the final suitability decision?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Confirm the safeguarding responsibilities and regulated-activity status of the role before advertising.",
          "Include the organisation's commitment to safeguarding in the advert and recruitment materials.",
          "Use an application form or equivalent process that captures a full employment history and requires gaps to be explained.",
          "Apply objective shortlisting criteria and scrutinise inconsistencies before interview.",
          "Ask safeguarding-focused interview questions relevant to the role.",
          "Verify identity, qualifications, professional registration and right to work.",
          "Request the correct level of DBS and barred-list check only where legally eligible.",
          "Obtain and scrutinise appropriate references, including safeguarding and suitability information where relevant.",
          "Follow up vague, incomplete, contradictory or concerning references directly with the referee.",
          "Carry out appropriate overseas, prohibition, disqualification or regulatory checks where required.",
          "Assess all information together rather than treating any single check as conclusive.",
          "Give the candidate an opportunity to explain discrepancies or adverse information before making a final decision.",
          "Record the rationale for the suitability decision and who authorised it.",
          "Do not permit unrestricted work with children or vulnerable adults until required checks are complete.",
          "Where an interim start is legally permitted, document the reason, supervision, safeguards, risk assessment and review date.",
          "Transfer all completed checks and restrictions into the onboarding record within Leo Talent.",
        ]
      : [],
  };
}