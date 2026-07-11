import { evaluateReasoningTrigger } from "../triggerEngine";
import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runBullyingReasoning(
  input: ReasoningModuleInput
): ReasoningModuleOutput {
  const trigger = evaluateReasoningTrigger(input, {
    keywords: [
      "bullying",
      "bullied",
      "workplace bullying",
      "intimidating",
      "humiliating",
      "insulting",
      "malicious behaviour",
      "abuse of power",
      "misuse of power",
      "undermining",
      "belittling",
      "shouting",
      "public criticism",
      "excluded",
      "isolated",
      "picked on",
      "singled out",
      "constant criticism",
      "unfair criticism",
      "threatening behaviour",
      "hostile behaviour",
      "offensive behaviour",
      "aggressive manager",
      "toxic manager",
      "toxic workplace",
      "workplace conflict",
      "team conflict",
      "manager bullying",
      "colleague bullying",
      "group bullying",
      "cyberbullying",
      "messages outside work",
      "bullying complaint",
    ],

    strongKeywords: [
      "formal bullying complaint",
      "bullying investigation",
      "abuse of managerial authority",
      "employee being humiliated",
      "persistent bullying",
      "retaliation after complaint",
      "employee signed off with stress due to bullying",
      "constructive dismissal bullying",
      "bullying linked to protected characteristic",
    ],

    intentMatches: [
      "bullying",
      "workplace_bullying",
      "manager_bullying",
      "workplace_conflict",
    ],

    minimumConfidence: 20,
  });

  const triggered = trigger.triggered;

  return {
    module: "Bullying",

    triggered,

    issues: triggered
      ? [
          "The matter may involve unwanted, intimidating, humiliating, malicious or insulting behaviour, or a misuse of power.",
          "The employer should distinguish bullying from reasonable management, legitimate performance feedback and ordinary workplace disagreement.",
          "Bullying may be repeated or, in some cases, arise from a serious single incident.",
          `Bullying reasoning confidence: ${trigger.confidence}%.`,
        ]
      : [],

    legalConsiderations: triggered
      ? [
          "There is no single statutory definition or standalone claim of workplace bullying, but bullying can create significant legal risk.",
          "Bullying behaviour may amount to unlawful harassment where it is related to a protected characteristic or is sexual in nature.",
          "Bullying may contribute to discrimination, victimisation, whistleblowing detriment, breach of contract, personal injury or constructive-dismissal risk.",
          "The employer has health and safety duties where bullying creates a foreseeable risk to physical or psychological health.",
          "The employer should take complaints seriously and investigate promptly, fairly and impartially.",
          "The employee should not be subjected to retaliation or disadvantage because they raised a complaint.",
          "Confidentiality should be maintained as far as reasonably possible, but the employer should not promise absolute secrecy.",
          "Any disciplinary action against the alleged bully should follow a fair process and the ACAS Code principles.",
        ]
      : [],

    businessConsiderations: triggered
      ? [
          "Unresolved bullying can cause absence, stress, turnover, grievances, reduced performance and reputational damage.",
          "The employer should assess the behaviour, context, impact, frequency, power imbalance and credibility of the evidence.",
          "Reasonable management action should be delivered respectfully, consistently and with evidence.",
          "Managers should not use performance or capability procedures as a cover for humiliating or targeting an employee.",
          "Consider whether temporary reporting-line changes or separation are needed while the concern is investigated.",
          "Mediation may help where the matter is primarily relational, but it should not replace investigation of serious allegations.",
          "The organisation should look for wider cultural or management issues rather than treating every complaint as an isolated personality clash.",
        ]
      : [],

    policyConsiderations: triggered
      ? [
          "Review the organisation's bullying, harassment, dignity at work and grievance procedures.",
          "Check disciplinary, equality, whistleblowing, wellbeing and health and safety policies where relevant.",
          "Confirm who should receive and investigate complaints about managers or senior leaders.",
          "Review any standards of behaviour, values or management-conduct expectations.",
          "Check whether informal resolution, mediation and formal investigation routes are clearly separated.",
          "Confirm how confidentiality, interim arrangements, records and appeals are handled.",
        ]
      : [],

    missingInformation: triggered
      ? [
          "What behaviour is alleged?",
          "Who is involved?",
          "When and where did the incidents occur?",
          "Was the behaviour repeated or was there a serious single incident?",
          "What words, actions, messages or decisions are relied upon?",
          "Were there witnesses?",
          "Is there documentary, email, messaging or meeting evidence?",
          "What impact has the behaviour had on the employee?",
          "Is the employee absent, unwell or seeking medical support?",
          "Is there a power imbalance between the people involved?",
          "Could the behaviour be linked to a protected characteristic?",
          "Is the matter connected to whistleblowing, grievance, performance, capability or disciplinary action?",
          "Has the concern been raised informally before?",
          "What response was given?",
          "Is any immediate action needed to protect the employee or evidence?",
          "Could mediation be appropriate, or are the allegations too serious?",
          "Who can investigate the matter impartially?",
        ]
      : [],

    recommendedSteps: triggered
      ? [
          "Acknowledge the concern promptly and take it seriously.",
          "Clarify the specific allegations, dates, people involved, evidence and impact.",
          "Assess whether the concern may involve harassment, discrimination, whistleblowing or health and safety risk.",
          "Consider interim measures such as temporary reporting changes or separation without prejudging the outcome.",
          "Appoint an impartial investigator where the allegations require formal examination.",
          "Gather relevant documents, messages, witness evidence and management records.",
          "Give both the complainant and the person complained about a fair opportunity to explain their account.",
          "Distinguish legitimate management action from behaviour that is intimidating, humiliating, insulting or abusive.",
          "Consider mediation only where appropriate and voluntary.",
          "Reach findings based on the available evidence and address each allegation separately.",
          "If misconduct is established, follow the disciplinary procedure before deciding any sanction.",
          "Confirm the outcome to the complainant as far as confidentiality permits.",
          "Protect the complainant and witnesses from retaliation.",
          "Monitor working relationships and wellbeing after the process concludes.",
          "Review whether management training, culture, workload or structural issues contributed to the problem.",
          "Keep a clear audit trail of the complaint, evidence, decisions and actions.",
        ]
      : [],
  };
}