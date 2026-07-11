import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runHarassmentReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "harassment",
      "harassed",
      "sexual harassment",
      "sexually harassed",
      "unwanted conduct",
      "unwanted behaviour",
      "offensive comments",
      "sexual comments",
      "sexual jokes",
      "inappropriate touching",
      "unwanted touching",
      "sexual advances",
      "suggestive messages",
      "inappropriate messages",
      "comments about appearance",
      "racist comments",
      "homophobic comments",
      "transphobic comments",
      "ableist comments",
      "ageist comments",
      "religious harassment",
      "harassment because of disability",
      "harassment because of race",
      "harassment because of sex",
      "harassment because of sexual orientation",
      "hostile environment",
      "intimidating environment",
      "degrading environment",
      "humiliating environment",
      "offensive environment",
      "third party harassment",
      "customer harassment",
      "client harassment",
      "supplier harassment",
      "harassment complaint",
    ],

    strongKeywords: [
      "formal harassment complaint",
      "sexual harassment complaint",
      "harassment investigation",
      "unwanted conduct related to protected characteristic",
      "third party sexual harassment",
      "harassment by customer",
      "harassment by manager",
      "retaliation after harassment complaint",
      "victimisation after harassment complaint",
      "sexual harassment qualifying disclosure",
    ],

    intentMatches: [
      "harassment",
      "sexual_harassment",
      "third_party_harassment",
      "protected_characteristic_harassment",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Harassment",

    triggered,

    issues: triggered
      ? [
          "The matter may involve unwanted conduct that has violated a person's dignity or created an intimidating, hostile, degrading, humiliating or offensive environment.",
          "The employer should establish whether the conduct is related to a protected characteristic, is sexual in nature, or involves retaliation after a complaint.",
          "The employer should also consider whether the alleged conduct came from a colleague, manager, customer, client, service user or another third party.",
          `Harassment reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "Harassment related to a protected characteristic can be unlawful under the Equality Act 2010.",
          "Sexual harassment is unwanted conduct of a sexual nature that violates dignity or creates an intimidating, hostile, degrading, humiliating or offensive environment.",
          "Harassment can arise from words, conduct, images, messages, touching, gestures, jokes or other behaviour.",
          "A serious single incident can amount to harassment; repeated behaviour is not always required.",
          "The effect of the conduct and the surrounding circumstances should be considered, together with whether it was reasonable for the conduct to have that effect.",
          "Employers must take reasonable steps to prevent sexual harassment of workers.",
          "Employers should anticipate risks, assess where sexual harassment could occur and take preventative action rather than relying only on complaint handling.",
          "Third-party harassment risk should be considered where workers interact with customers, clients, service users, contractors or suppliers.",
          "From 6 April 2026, sexual harassment can amount to a qualifying disclosure under whistleblowing law.",
          "Workers who report sexual harassment may therefore be protected from detriment, and employees may be protected from automatic unfair dismissal.",
          "The employer must not victimise or retaliate against someone because they raised, supported or gave evidence in a harassment complaint.",
          "A harassment complaint should be investigated fairly, promptly and impartially.",
          "Any disciplinary action against the alleged harasser should follow a fair procedure and ACAS Code principles.",
          "Confidentiality clauses or settlement wording must not be used to prevent lawful whistleblowing or reporting of criminal conduct.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Harassment can damage wellbeing, attendance, retention, team trust, safeguarding, customer relationships and organisational reputation.",
          "The employer should act promptly while keeping an open mind about the facts.",
          "Managers should not minimise conduct as banter, humour, personality conflict or a misunderstanding without examining the impact and context.",
          "The organisation should assess whether workplace culture, alcohol, isolated working, power imbalance, social events, messaging platforms or customer contact increase risk.",
          "Temporary measures may be needed to protect the complainant, preserve evidence or prevent further contact.",
          "Any interim action should avoid unnecessarily disadvantaging the complainant.",
          "The organisation should separate the complaint investigation from any decision about disciplinary action.",
          "Where the alleged harasser is a customer or third party, the employer should still take practical steps to protect the worker.",
          "The employer should monitor for retaliation, exclusion, shift changes, blocked opportunities or hostility after the complaint.",
          "Lessons from the complaint should be used to improve policy, training, supervision and workplace controls.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's harassment, sexual harassment, equality, dignity at work and grievance procedures.",
          "Check disciplinary, whistleblowing, safeguarding, social media, customer conduct and health and safety policies where relevant.",
          "Confirm whether the organisation has a prevention plan or risk assessment addressing sexual harassment.",
          "Review how staff report concerns and whether alternative reporting routes exist where the complaint concerns a manager.",
          "Check who is authorised to investigate and decide outcomes.",
          "Review expectations for workplace events, messaging, remote work, customer interactions and third-party behaviour.",
          "Confirm how interim measures, confidentiality, records, support and appeals are handled.",
          "Check whether managers and workers have received appropriate preventative training.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What conduct is alleged?",
          "Was the conduct sexual in nature or related to a protected characteristic?",
          "Who carried out the conduct?",
          "Was the person a manager, colleague, customer, client, contractor or service user?",
          "When and where did the conduct occur?",
          "Was there a single serious incident or repeated behaviour?",
          "What words, actions, messages, images or physical contact are relied upon?",
          "Were there witnesses?",
          "Is there email, messaging, CCTV, social-media or other documentary evidence?",
          "What impact did the conduct have on the complainant?",
          "Did the complainant indicate that the conduct was unwanted?",
          "Has the conduct been reported previously?",
          "What response did the organisation give?",
          "Has the complainant experienced retaliation or disadvantage afterwards?",
          "Could the complaint also amount to whistleblowing?",
          "Is there any immediate safeguarding, health and safety or criminal concern?",
          "Are temporary reporting-line, shift, location or contact restrictions required?",
          "Who can investigate the matter impartially?",
          "Does the organisation have evidence of preventative steps already taken?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Acknowledge the complaint promptly and take it seriously.",
          "Clarify the specific conduct, dates, people involved, context, evidence and impact.",
          "Assess whether the matter may involve unlawful harassment, sexual harassment, victimisation, whistleblowing, safeguarding or criminal conduct.",
          "Identify and control any immediate risk to the complainant or others.",
          "Consider interim arrangements that protect people without prejudging the outcome.",
          "Appoint an impartial and suitably trained investigator.",
          "Preserve relevant messages, documents, CCTV, social-media and witness evidence.",
          "Give the complainant and alleged harasser a fair opportunity to provide their account.",
          "Assess each allegation separately and consider both purpose and effect.",
          "Do not dismiss the behaviour as banter without examining the circumstances and impact.",
          "Where third parties are involved, take reasonable steps to prevent further harassment, including restrictions or changes to service arrangements where justified.",
          "If misconduct is established, follow the disciplinary procedure before deciding any sanction.",
          "Explain the outcome to the complainant as far as confidentiality permits.",
          "Protect the complainant and witnesses from retaliation or victimisation.",
          "Consider whether the matter should also be handled as a whistleblowing disclosure.",
          "Review the organisation's sexual-harassment risk assessment, policy, reporting routes and preventative training.",
          "Monitor the workplace after the process concludes.",
          "Keep a secure audit trail of the complaint, evidence, findings, decisions and preventative action.",
        ]
      : [],
  };
}