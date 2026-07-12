import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runWhistleblowingReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "whistleblowing",
      "whistleblower",
      "protected disclosure",
      "public interest disclosure",
      "report wrongdoing",
      "reported wrongdoing",
      "raised concerns",
      "serious concern",
      "criminal offence",
      "breach of legal obligation",
      "miscarriage of justice",
      "health and safety danger",
      "environmental damage",
      "cover up",
      "conceal wrongdoing",
      "fraud",
      "corruption",
      "regulatory breach",
      "safeguarding concern",
      "sexual harassment disclosure",
      "reported sexual harassment",
      "prescribed person",
      "reported to regulator",
      "anonymous disclosure",
      "confidential disclosure",
      "retaliation",
      "victimised for speaking up",
      "treated badly for raising concerns",
      "dismissed for whistleblowing",
      "hours reduced after complaint",
    ],

    strongKeywords: [
      "protected whistleblowing disclosure",
      "automatic unfair dismissal for whistleblowing",
      "detriment for whistleblowing",
      "reported to a prescribed person",
      "whistleblowing investigation",
      "whistleblowing retaliation",
      "sexual harassment qualifying disclosure",
      "public interest disclosure",
      "worker dismissed after reporting wrongdoing",
    ],

    intentMatches: [
      "whistleblowing",
      "protected_disclosure",
      "public_interest_disclosure",
      "retaliation",
      "report_wrongdoing",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Whistleblowing",

    triggered,

    issues: triggered
      ? [
          "The matter may involve a worker reporting suspected wrongdoing that affects others or is believed to be in the public interest.",
          "The employer should distinguish whistleblowing from a purely personal grievance, while recognising that the same facts can sometimes involve both.",
          "The employer must avoid retaliation, dismissal or other disadvantage because a worker raised a protected concern.",
          `Whistleblowing reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "Whistleblowing law protects workers who make qualifying disclosures in the reasonable belief that the information tends to show specified wrongdoing and that disclosure is in the public interest.",
          "Qualifying wrongdoing can include criminal offences, breach of legal obligations, miscarriages of justice, danger to health and safety, environmental damage and deliberate concealment.",
          "From 6 April 2026, sexual harassment is expressly capable of being a qualifying disclosure under whistleblowing law.",
          "Workers are protected from detriment because they made a protected disclosure.",
          "Employees dismissed because they made a protected disclosure may claim automatic unfair dismissal without needing the ordinary qualifying period.",
          "Protection can apply even where the concern turns out to be mistaken, provided the worker had the required reasonable belief.",
          "A disclosure can be made internally, to certain prescribed persons or bodies, or through another legally protected route depending on the circumstances.",
          "Confidentiality clauses and non-disclosure agreements must not be used to prevent lawful whistleblowing.",
          "The employer should keep the identity of the whistleblower confidential as far as reasonably possible, while explaining that complete anonymity may not always be possible.",
          "A whistleblowing concern should not be rejected merely because it was not labelled as whistleblowing.",
          "Any disciplinary, performance, absence, redundancy or dismissal action involving the whistleblower should be reviewed carefully for possible retaliation or causation risk.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Whistleblowing can help the organisation identify risks, wrongdoing and regulatory failures before they escalate.",
          "The employer should respond promptly and objectively rather than defensively.",
          "The person handling the disclosure should be sufficiently independent and senior.",
          "The organisation should separate the investigation of the alleged wrongdoing from any concerns about the whistleblower's own conduct where possible.",
          "Managers should avoid promises of absolute secrecy that may not be possible to keep.",
          "The employer should monitor the worker's treatment after the disclosure to prevent subtle retaliation, exclusion or career disadvantage.",
          "Where regulatory, safeguarding or criminal issues arise, external reporting obligations may need to be considered.",
          "Anonymous disclosures should still be assessed on their substance and available evidence.",
          "The organisation should use lessons from disclosures to improve systems, controls, culture and management accountability.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's whistleblowing or speak-up policy.",
          "Check grievance, safeguarding, fraud, anti-bribery, equality, sexual harassment, health and safety and data-protection policies where relevant.",
          "Confirm who is authorised to receive, assess and investigate disclosures.",
          "Check how confidentiality, anonymity, record keeping and feedback are handled.",
          "Review escalation routes to senior leadership, trustees, owners, regulators or prescribed persons.",
          "Check whether the policy clearly prohibits retaliation and explains how workers can report concerns safely.",
          "Confirm whether a separate investigation procedure is required.",
          "Review any non-disclosure or settlement wording to ensure it does not improperly restrict protected disclosures.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What information did the worker disclose?",
          "What type of wrongdoing do they believe occurred?",
          "Why do they believe the concern affects others or is in the public interest?",
          "When and to whom was the disclosure made?",
          "Was the concern raised internally, externally or with a prescribed person?",
          "Was the disclosure made verbally, in writing, anonymously or confidentially?",
          "What evidence or dates were provided?",
          "Has the worker previously raised the same concern?",
          "What response did the organisation give?",
          "Has the worker experienced dismissal, reduced hours, exclusion, harassment, blocked promotion or another disadvantage afterwards?",
          "Is sexual harassment involved?",
          "Does the concern overlap with a personal grievance?",
          "Is there an immediate health, safety, safeguarding, criminal or regulatory risk?",
          "Who can investigate the concern independently?",
          "Does the organisation need to notify a regulator, safeguarding authority, police or other external body?",
          "Are any current disciplinary, capability, absence, redundancy or dismissal processes involving the whistleblower?",
          "Has the worker been told how confidentiality and feedback will be handled?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Acknowledge the disclosure promptly and thank the worker for raising the concern.",
          "Record the disclosure accurately, including the alleged wrongdoing, dates, people involved and evidence.",
          "Assess whether it may qualify for whistleblowing protection even if the worker did not use that label.",
          "Identify and control any immediate safeguarding, health and safety, criminal or regulatory risk.",
          "Appoint an impartial and suitably senior person to assess or investigate the concern.",
          "Explain how confidentiality will be protected and any limits to anonymity.",
          "Investigate the alleged wrongdoing objectively and separately from any personal grievance where practical.",
          "Do not subject the worker to dismissal, disadvantage, hostility or retaliation.",
          "Review any existing or proposed action concerning the worker for possible whistleblowing risk.",
          "Consider whether a regulator, prescribed person, safeguarding authority or police must be notified.",
          "Provide appropriate feedback to the worker without breaching other people's confidentiality.",
          "Monitor the worker's treatment after the disclosure and intervene if retaliation occurs.",
          "Keep a secure audit trail of the disclosure, assessment, investigation, action and outcome.",
          "Review policies, systems and management controls after the matter concludes.",
        ]
      : [],
  };
}