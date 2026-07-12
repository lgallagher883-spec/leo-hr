import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runRightToWorkReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "right to work",
      "immigration status",
      "visa",
      "work visa",
      "share code",
      "passport check",
      "identity service provider",
      "idsp",
      "digital identity check",
      "online right to work check",
      "manual right to work check",
      "home office check",
      "employer checking service",
      "ecs",
      "limited leave",
      "time-limited right to work",
      "indefinite leave",
      "settled status",
      "pre-settled status",
      "student visa",
      "graduate visa",
      "skilled worker visa",
      "sponsor licence",
      "sponsored worker",
      "biometric residence permit",
      "brp",
      "evisa",
      "work restrictions",
      "hours restriction",
      "illegal working",
      "civil penalty",
      "immigration document",
      "right to work expired",
      "visa expired",
    ],

    strongKeywords: [
      "no right to work",
      "right to work check not completed",
      "right to work check expired",
      "employee has lost right to work",
      "positive verification notice",
      "employer checking service",
      "civil penalty for illegal working",
      "knowingly employing an illegal worker",
      "sponsor compliance breach",
      "share code check",
      "follow-up right to work check",
    ],

    intentMatches: [
      "right_to_work",
      "immigration",
      "visa",
      "sponsorship",
      "illegal_working",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Right to Work",

    triggered,

    issues: triggered
      ? [
          "The matter concerns whether an individual has permission to work in the UK and whether the employer has completed the correct prescribed check.",
          "The employer should establish both the individual's immigration position and whether any restrictions apply to the proposed role, hours or duration.",
          `Right to work reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "A prescribed right-to-work check should be completed before employment begins.",
          "A compliant check may establish a statutory excuse against a civil penalty if the individual is later found not to have the right to undertake the work.",
          "The employer must use the correct checking route: a Home Office online check, an eligible manual document check, or an approved digital identity check where permitted.",
          "For an online check, the employer should use the official employer right-to-work service with the individual's share code and date of birth.",
          "The employer must check that the photograph and personal details shown by the service relate to the person presenting for work.",
          "A share code is time limited, so the check should be completed and retained while the code remains valid.",
          "Where the Home Office online service is mandatory for an individual's status, a physical document alone may not establish a statutory excuse.",
          "For most EU, EEA and Swiss citizens, a passport or national identity card alone is not sufficient evidence of right to work; Irish citizens are treated differently.",
          "Where the individual has a time-limited right to work, a follow-up check must be completed before the current permission or statutory excuse expires.",
          "The Employer Checking Service may be required where the individual cannot evidence status through the standard online or document route but has an outstanding application, appeal or other eligible circumstance.",
          "The employer should retain a clear record of the check, including the date it was completed and the evidence produced.",
          "Checks must be carried out consistently and without racial or nationality discrimination.",
          "Knowingly employing someone without the correct right to work may expose the employer to criminal liability as well as civil penalties.",
          "A sponsor licence does not remove the separate obligation to complete a right-to-work check.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Right-to-work verification should be built into Leo Talent before a new starter is marked as cleared to begin work.",
          "The employer should not rely on assumptions based on nationality, accent, name or length of UK residence.",
          "All candidates should be subject to a consistent checking process at the same stage of recruitment.",
          "Any restrictions on occupation, working hours, location or supplementary employment should be recorded and monitored.",
          "Time-limited permissions should generate advance reminders for follow-up checks.",
          "Managers should not allow urgent staffing needs to bypass a required check.",
          "Where sponsorship is involved, right-to-work records should align with sponsor-licence records and reporting duties.",
          "If a current employee's permission is uncertain, the employer should investigate promptly without assuming that dismissal is automatically lawful.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's right-to-work and immigration-compliance procedure.",
          "Check recruitment, onboarding, safer-recruitment, equality and data-protection policies.",
          "Confirm who is authorised and trained to carry out checks.",
          "Check which checking routes the organisation permits, including approved digital identity providers.",
          "Review how evidence is copied, dated, stored and retained.",
          "Confirm how time-limited permissions and follow-up checks are monitored.",
          "Check sponsor-licence procedures where the organisation sponsors workers.",
          "Review escalation and decision-making arrangements where evidence is unclear, expired or disputed.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "Has the individual started work yet?",
          "What type of immigration status or nationality does the individual have?",
          "Which right-to-work checking route is appropriate?",
          "Has the employer used the correct official online service where required?",
          "Was the check completed before employment began?",
          "Does the photograph and personal information match the individual?",
          "Does the result permit the specific work being offered?",
          "Are there restrictions on hours, occupation, location or supplementary work?",
          "Is the right to work permanent or time limited?",
          "When does the current permission or statutory excuse expire?",
          "Has a follow-up check date been recorded?",
          "If the standard check cannot be completed, is the Employer Checking Service available?",
          "Has a Positive Verification Notice been received where required?",
          "Has the evidence and date of check been retained securely?",
          "Is the employee sponsored, and are sponsor duties also relevant?",
          "Has the check been applied consistently to comparable candidates?",
          "Is there evidence that the employee may have lost or exceeded their permission to work?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Identify the correct right-to-work route before requesting evidence.",
          "Complete the prescribed check before the individual begins employment.",
          "For eligible online checks, use the official employer service with the share code and date of birth.",
          "Check that the photograph and details match the individual presenting for work.",
          "Confirm that the permission covers the proposed role, hours and working arrangements.",
          "For eligible British and Irish passport holders, use a compliant manual or approved digital identity process.",
          "Do not accept an EU, EEA or Swiss passport alone where an online status check is required.",
          "Where normal evidence is unavailable but the individual may still have permission, use the Employer Checking Service where eligible.",
          "Retain the check result or document copy securely and record the date the check was completed.",
          "Record all restrictions and ensure managers understand them.",
          "For time-limited permission, schedule a follow-up check well before expiry.",
          "If permission appears to have expired or changed, investigate promptly and obtain specialist advice before suspending or dismissing.",
          "Where sponsorship applies, cross-check the employee's role and records against sponsor duties.",
          "Apply the same checking standards to all recruits to reduce discrimination risk.",
          "Do not allow the employee to start unrestricted work until the required check has been completed.",
        ]
      : [],
  };
}