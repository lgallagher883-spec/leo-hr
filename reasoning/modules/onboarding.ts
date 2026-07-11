import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runOnboardingReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "onboarding",
      "onboard",
      "induction",
      "new starter",
      "new employee",
      "first day",
      "start date",
      "joining the company",
      "joined the company",
      "welcome meeting",
      "starter checklist",
      "new starter checklist",
      "employment contract",
      "written statement",
      "employee handbook",
      "company policies",
      "payroll setup",
      "bank details",
      "emergency contact",
      "equipment",
      "laptop",
      "uniform",
      "access pass",
      "system access",
      "email account",
      "training",
      "mandatory training",
      "health and safety induction",
      "safeguarding induction",
      "probation objectives",
      "probation review",
      "line manager introduction",
      "team introduction",
      "orientation",
      "role expectations",
      "job responsibilities",
      "first week",
      "first month",
    ],

    strongKeywords: [
      "pre-employment checks incomplete",
      "start before checks complete",
      "right to work not completed",
      "dbs outstanding",
      "references outstanding",
      "contract not issued",
      "written statement not issued",
      "mandatory training incomplete",
      "safeguarding training incomplete",
      "new starter compliance",
      "failed onboarding",
      "probation objectives not set",
    ],

    intentMatches: [
      "onboarding",
      "new_starter",
      "induction",
      "employee_setup",
      "starter_compliance",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Onboarding",

    triggered,

    issues: triggered
      ? [
          "The matter concerns preparing, welcoming or integrating a new employee into the organisation.",
          "Successful onboarding should confirm that the employee is legally cleared, properly documented, equipped, trained and supported to perform the role.",
          "The process should connect recruitment, pre-employment checks, induction, training and probation rather than treating them as separate administrative tasks.",
          `Onboarding reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "A lawful right-to-work check must be completed before employment begins.",
          "The employee should receive the required written statement of employment particulars within the applicable legal timeframe.",
          "Any contractual documents, policies or conditions referred to in the offer should be provided clearly and accurately.",
          "Personal information gathered during onboarding must be handled securely and only for legitimate employment purposes.",
          "Health or disability information should be handled confidentially and used to identify support or reasonable adjustments where appropriate.",
          "Mandatory health and safety information, instruction and training must be provided before the employee undertakes work that could create risk.",
          "Where the role involves regulated activity, safeguarding, DBS, barred-list, qualification, registration or suitability requirements must be satisfied before unrestricted duties begin.",
          "The employer must not treat the new employee unfavourably because of disability, pregnancy, family leave, religion, race, age or another protected characteristic.",
          "Contractual pay, hours, location, benefits, notice and probation terms should match the accepted offer unless a lawful change has been agreed.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Onboarding should begin before the employee's first day, with checks, documents, equipment and access arranged in advance.",
          "A clear first-day and first-week plan improves confidence, productivity and retention.",
          "The employee should understand the organisation, their role, reporting line, priorities and expected standards.",
          "The line manager should take ownership of the employee's practical integration rather than leaving onboarding entirely to HR.",
          "Role-specific training should be distinguished from general company induction.",
          "Managers should avoid overwhelming the employee with documents without explaining how policies apply in practice.",
          "The employee should know where to go for support, questions, concerns and workplace adjustments.",
          "Early feedback points help identify unclear expectations, training gaps or suitability concerns before the probation review.",
          "Leo Talent should maintain one onboarding record covering checks, documents, training, equipment, introductions, objectives and probation milestones.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's onboarding, induction and probation procedures.",
          "Check recruitment, safer-recruitment, right-to-work, DBS, references and data-protection requirements.",
          "Review health and safety, safeguarding, equality, IT security, confidentiality and acceptable-use policies.",
          "Confirm which mandatory policies must be acknowledged by the employee.",
          "Check which training courses must be completed before the employee performs particular duties.",
          "Review the process for issuing contracts, written particulars, handbooks and policy access.",
          "Confirm who is responsible for payroll, equipment, system access, building access, training and line-management arrangements.",
          "Check whether the organisation has standard four-week, eight-week and twelve-week probation reviews.",
          "Confirm the organisation's standard three-month probation period and any contractual extension provisions.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What is the employee's confirmed start date?",
          "Has the employee accepted the offer and its conditions?",
          "Have all required pre-employment checks been completed?",
          "Has a lawful right-to-work check been completed?",
          "Are references, DBS, barred-list, qualification or professional-registration checks required?",
          "Are any checks still outstanding?",
          "If checks remain outstanding, can the employee lawfully begin any duties?",
          "Has the contract or written statement been issued?",
          "Do the contractual terms match the accepted offer?",
          "Has payroll received the required information?",
          "Has the employee been added to the correct systems and records?",
          "Are equipment, uniform, email, access permissions and workspace ready?",
          "Who is the employee's line manager?",
          "Has a first-day and first-week plan been prepared?",
          "What mandatory training must be completed?",
          "What role-specific training or supervision is required?",
          "Are safeguarding, health and safety or regulatory inductions required?",
          "Does the employee require any reasonable adjustments?",
          "Have probation objectives and review dates been set?",
          "Who will check progress during the first week and first month?",
          "Has the employee been introduced to relevant colleagues, procedures and support routes?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Create one onboarding record in Leo Talent as soon as the candidate accepts the offer.",
          "Confirm the start date, role, salary, hours, location, reporting line and probation terms.",
          "Track every condition of the offer and do not mark the employee cleared until mandatory checks are complete.",
          "Complete and record the lawful right-to-work check before employment begins.",
          "Complete any required DBS, barred-list, references, qualification, registration or overseas checks.",
          "Issue the contract, written particulars, handbook and relevant policies.",
          "Arrange payroll, pension information and required employee records.",
          "Prepare equipment, uniform, workspace, email, systems and building access before the first day.",
          "Identify and arrange any reasonable adjustments before the employee starts where possible.",
          "Create a structured first-day and first-week timetable.",
          "Introduce the employee to their manager, team, key contacts and organisational structure.",
          "Explain the role, duties, standards, reporting arrangements and immediate priorities.",
          "Complete mandatory health and safety, safeguarding, confidentiality, data-protection and role-specific training.",
          "Confirm which policies the employee must read and acknowledge.",
          "Set clear probation objectives and schedule reviews at approximately four, eight and twelve weeks.",
          "Hold an early check-in during the first week to identify questions, support needs or practical problems.",
          "Record completed checks, training, documents, equipment and discussions in Leo Talent.",
          "Escalate missing checks, safeguarding concerns, contractual inconsistencies or unresolved adjustments before the employee undertakes unrestricted duties.",
          "At the end of onboarding, confirm that responsibility has transferred into normal line management and probation monitoring.",
        ]
      : [],
  };
}