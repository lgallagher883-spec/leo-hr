import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runDbsReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "dbs",
      "dbs check",
      "criminal record check",
      "basic dbs",
      "standard dbs",
      "enhanced dbs",
      "barred list",
      "children's barred list",
      "adults' barred list",
      "regulated activity",
      "dbs certificate",
      "dbs update service",
      "criminal conviction",
      "criminal caution",
      "spent conviction",
      "unspent conviction",
      "disclosure",
      "police information",
      "safeguarding check",
      "suitability check",
      "dbs renewal",
      "dbs expired",
      "portable dbs",
      "online status check",
      "adverse dbs",
      "positive dbs disclosure",
      "criminal history",
      "rehabilitation of offenders",
    ],

    strongKeywords: [
      "enhanced dbs with barred list",
      "children's barred list check",
      "adults' barred list check",
      "barred from regulated activity",
      "dbs certificate contains information",
      "adverse information on dbs",
      "criminal record disclosed",
      "dbs check not completed",
      "start work before dbs check",
      "dbs update service status changed",
      "knowingly employ a barred person",
    ],

    intentMatches: [
      "dbs",
      "criminal_record_check",
      "barred_list",
      "regulated_activity",
      "safeguarding_check",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "DBS",

    triggered,

    issues: triggered
      ? [
          "The matter concerns whether a criminal-record or barred-list check is required, appropriate or complete.",
          "The employer should identify the correct legal level of check for the role rather than requesting the highest available check by default.",
          "A DBS certificate is only one part of the employer's overall suitability assessment.",
          `DBS reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "A Basic DBS check may be requested for any role, but Standard, Enhanced and Enhanced with Barred List checks are only available where the role is legally eligible.",
          "The employer must establish whether it is legally entitled to ask the exempted question before requesting disclosure of spent convictions and cautions.",
          "A barred-list check may only be requested where the role falls within the relevant definition of regulated activity.",
          "It is unlawful to knowingly allow a barred person to undertake regulated activity from which they are barred.",
          "The correct workforce and barred list must be selected, such as children, adults or both where legally permitted.",
          "The employer should not request a higher level of DBS check than the role permits.",
          "Filtered convictions and cautions must not be taken into account where the law protects them from disclosure.",
          "A criminal record does not automatically make an applicant unsuitable; the employer should assess relevance, seriousness, age, circumstances, pattern, rehabilitation and risk.",
          "Information from a DBS certificate must be handled securely, confidentially and only by authorised people.",
          "The employer should follow the DBS Code of Practice when using Standard or Enhanced certificate information.",
          "The Update Service can support status checking, but the employer must confirm that the original certificate is at the correct level, workforce and barred-list status for the current role.",
          "From 21 January 2026, eligible self-employed people and personal employees can apply for Enhanced or Enhanced with Barred List checks through an Umbrella Body.",
          "From 1 September 2026, the supervision exemption for volunteers in regulated activity with children is removed, meaning affected volunteers will require the appropriate Enhanced DBS check with children's barred-list information.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "DBS eligibility should be decided when the role is designed, not after the preferred candidate has been selected.",
          "The employer should assess the whole suitability picture, including references, employment history, interview evidence, qualifications and conduct.",
          "Urgent staffing pressure should not lead managers to bypass legally required safeguarding checks.",
          "A clear risk-assessment process is needed where adverse information appears on a certificate.",
          "Managers should avoid automatic rejection and instead assess whether the information is relevant to the role and current risk.",
          "Where an employee starts before a certificate is received, any interim arrangement must be lawful, exceptional, documented, supervised and risk assessed.",
          "DBS Update Service checks should not be treated as transferable without confirming the certificate matches the new role.",
          "Leo Talent should record the level, workforce, barred-list status, certificate date, decision, restrictions and review requirements.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's DBS, safer-recruitment and safeguarding policies.",
          "Check the recruitment of ex-offenders policy where Standard or Enhanced checks are used.",
          "Review the organisation's secure handling, storage, access, retention and disposal arrangements for certificate information.",
          "Confirm who is authorised to determine eligibility, view certificates and make suitability decisions.",
          "Check the process for Update Service checks and obtaining the applicant's consent.",
          "Review the procedure for adverse disclosures, discrepancies, risk assessments and appeals.",
          "Confirm whether the organisation permits supervised starts while checks remain outstanding.",
          "Check any regulator-specific requirements applying to the role, including Ofsted or CQC expectations.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What duties will the individual actually perform?",
          "Does the role involve children, adults or another regulated setting?",
          "Does the role legally qualify for a Basic, Standard, Enhanced or Enhanced with Barred List check?",
          "Which workforce and barred list are relevant?",
          "Is the person carrying out regulated activity?",
          "Is the individual an employee, volunteer, contractor, self-employed person or personal employee?",
          "Has the correct application route been used?",
          "Has the applicant's identity been verified?",
          "Has the certificate been issued?",
          "Is the original certificate available to inspect?",
          "Does the certificate match the required level, workforce and barred-list status?",
          "Is the applicant subscribed to the Update Service?",
          "Has consent been obtained for an Update Service status check?",
          "Has the certificate or Update Service result changed?",
          "Does the certificate contain convictions, cautions, police information or barred-list information?",
          "How relevant is any disclosed information to the role?",
          "Has the applicant been given an opportunity to explain adverse information?",
          "Have references, employment history and other safeguarding checks also been completed?",
          "Is the employer considering allowing work to begin before the check is complete?",
          "What supervision and restrictions would apply during any interim period?",
          "Who will make and document the final suitability decision?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Define the duties of the role and confirm legal DBS eligibility before requesting a check.",
          "Use the official DBS eligibility guidance or eligibility tool to identify the correct level, workforce and barred-list requirement.",
          "Do not request a Standard, Enhanced or barred-list check unless the role is legally eligible.",
          "Verify the applicant's identity using the approved process.",
          "Use the appropriate Registered Body, Umbrella Body or other lawful application route.",
          "Inspect the original certificate where required and confirm that it belongs to the applicant.",
          "Where the Update Service is used, obtain consent and confirm that the original certificate is suitable for the new role.",
          "Review all certificate information carefully and do not automatically reject the applicant because of a criminal record.",
          "Assess relevance, seriousness, recency, frequency, circumstances, rehabilitation, role access and safeguarding risk.",
          "Give the applicant a fair opportunity to explain any disclosed or disputed information.",
          "Record the suitability assessment, decision, restrictions and decision-maker.",
          "Store certificate information securely and restrict access to authorised individuals.",
          "Do not retain certificate copies or information longer than justified under the organisation's policy and DBS requirements.",
          "Do not permit regulated activity where a required barred-list or Enhanced check has not been completed unless a lawful and properly controlled exception applies.",
          "Where an interim start is permitted, document the supervision, restrictions, risk assessment and review date.",
          "Check whether any 2026 changes affecting volunteers, self-employed individuals or personal employees apply.",
          "Transfer the final DBS status and any restrictions into the employee's onboarding record in Leo Talent.",
        ]
      : [],
  };
}