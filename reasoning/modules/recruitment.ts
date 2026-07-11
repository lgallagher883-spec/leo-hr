import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runRecruitmentReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "recruitment",
      "recruit",
      "hiring",
      "hire",
      "vacancy",
      "job advert",
      "job description",
      "person specification",
      "candidate",
      "applicant",
      "application",
      "shortlist",
      "shortlisting",
      "interview",
      "interview questions",
      "selection criteria",
      "selection process",
      "job offer",
      "conditional offer",
      "unconditional offer",
      "reference",
      "references",
      "pre-employment checks",
      "internal candidate",
      "external candidate",
      "rejection",
      "unsuccessful applicant",
      "new starter",
      "recruitment decision",
      "appointment",
      "appoint",
    ],

    strongKeywords: [
      "recruitment discrimination",
      "reasonable adjustment for interview",
      "conditional job offer",
      "withdraw job offer",
      "right to work check",
      "dbs check",
      "safer recruitment",
      "essential criteria",
      "objective selection criteria",
      "interview scoring",
      "recruitment panel",
    ],

    intentMatches: [
      "recruitment",
      "hiring",
      "vacancy",
      "candidate_selection",
      "job_offer",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Recruitment",

    triggered,

    issues: triggered
      ? [
          "The matter concerns attracting, assessing, selecting or appointing a candidate.",
          "The employer should use a fair, consistent and evidence-based recruitment process.",
          "Recruitment decisions should be based on the genuine requirements of the role rather than assumptions, preferences or personal characteristics.",
          `Recruitment reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "The Equality Act 2010 applies throughout recruitment, including advertising, applications, shortlisting, interviews, testing, offers and rejection decisions.",
          "Job adverts and selection criteria must not directly or indirectly discriminate because of a protected characteristic unless a lawful exception applies.",
          "Reasonable adjustments must be considered for disabled applicants throughout the recruitment process.",
          "Applicants should be asked whether they need reasonable adjustments for the interview or assessment process.",
          "Health or disability questions should not normally be asked before a job offer, except for limited lawful purposes such as arranging adjustments or assessing an essential function of the role.",
          "Selection criteria should be objective, relevant to the role and applied consistently to all candidates.",
          "Right to work must be checked before employment begins, and checks should be carried out consistently without unlawful discrimination.",
          "A DBS check should only be requested at the correct level and where the role is eligible.",
          "A job offer may create contractual obligations once accepted, so the employer should make clear whether the offer is conditional or unconditional.",
          "Conditional offers should state the checks or requirements that must be satisfied before employment starts.",
          "References should be handled fairly and accurately, and the applicant should normally be given an opportunity to respond to material concerns before an offer is withdrawn.",
          "Applicant data, interview notes and equality-monitoring information must be handled in accordance with data-protection requirements.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Define the genuine business need before advertising the vacancy.",
          "Use an accurate job description and person specification so candidates are assessed against the actual role.",
          "Separate essential criteria from desirable criteria.",
          "Use consistent interview questions and scoring to improve fairness and decision quality.",
          "Keep written evidence explaining why the successful candidate was selected.",
          "Consider internal candidates fairly and do not assume they are automatically entitled to appointment.",
          "Avoid over-engineered recruitment processes that create delay without improving the hiring decision.",
          "Assess values, behaviours and organisational fit through evidence rather than subjective impressions.",
          "For regulated, safety-critical or safeguarding roles, ensure the recruitment process includes the required additional checks.",
          "Plan the offer, checks, notice period, start date and onboarding process before confirming appointment.",
          "Leo Talent should eventually capture the full workflow from vacancy creation through applications, interviews, offer, acceptance and onboarding.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's recruitment and selection procedure.",
          "Check safer-recruitment, equality, right-to-work, DBS, references and data-protection policies where relevant.",
          "Review the approved job description and person specification.",
          "Confirm who is authorised to advertise, shortlist, interview and make an offer.",
          "Check whether the organisation requires a recruitment panel or minimum number of interviewers.",
          "Review any internal-vacancy, redeployment, promotion or succession policy.",
          "Confirm the rules for storing interview notes and applicant information.",
          "Check whether offers must be conditional on references, right-to-work evidence, DBS clearance, qualifications or health checks.",
          "Review the organisation's standard probation position, including Leo's recommended three-month probation period.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What role is being recruited?",
          "Why is the vacancy required?",
          "Is there an approved job description and person specification?",
          "Which criteria are essential and which are desirable?",
          "How and where will the vacancy be advertised?",
          "Could the advert or criteria disadvantage a protected group?",
          "How will applications be scored?",
          "Who will shortlist and interview?",
          "Will all candidates be asked the same core questions?",
          "Has each candidate been asked whether they require reasonable adjustments?",
          "Are any tests or assessments relevant and proportionate to the role?",
          "What evidence supports the preferred candidate's appointment?",
          "Are there internal, redeployment or at-risk employees who should be considered?",
          "Does the role require safer-recruitment checks, a DBS check, references, qualification checks or professional registration?",
          "Has right to work been checked or planned before employment begins?",
          "Will the offer be conditional or unconditional?",
          "What conditions must be satisfied before the employee starts?",
          "Has the candidate disclosed anything that requires a fair and lawful assessment?",
          "Has the recruitment decision been documented clearly?",
          "What probation period will apply?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Confirm the genuine need for the role and obtain the required approval to recruit.",
          "Prepare or review an accurate job description and person specification.",
          "Separate essential requirements from desirable attributes.",
          "Check the advert and criteria for discriminatory wording or unnecessary barriers.",
          "Advertise the role using a process that gives suitable candidates a fair opportunity to apply.",
          "Use a documented shortlisting matrix based on the stated criteria.",
          "Ask all candidates the same core interview questions and score answers consistently.",
          "Ask applicants whether they require reasonable adjustments for any stage of the process.",
          "Do not ask general health or disability questions before offer unless a lawful exception applies.",
          "Keep factual interview notes and record the reason for the final decision.",
          "Check whether safer-recruitment, DBS, qualification, professional-registration or reference requirements apply.",
          "Complete a lawful right-to-work check before employment begins.",
          "Make the offer conditional where outstanding checks or evidence remain.",
          "State the role, salary, hours, location, start date, conditions, benefits and probation period clearly in the offer.",
          "Obtain the candidate's acceptance and track completion of all pre-employment checks.",
          "If adverse information arises, investigate it fairly and give the candidate an opportunity to respond before withdrawing an offer.",
          "Transfer the successful candidate into a structured onboarding process within Leo Talent.",
          "Retain recruitment records securely and only for as long as justified.",
        ]
      : [],
  };
}