import { ProfessionalThinkingOutput } from "../thinking/model";
import { CONVERSATION_PROFILES } from "./conversationProfiles";
import { ConversationPlan } from "./types";

type ConversationEngineInput = {
  message: string;
  thinking: ProfessionalThinkingOutput;
};

export function buildConversationPlan({
  message,
  thinking,
}: ConversationEngineInput): ConversationPlan {
  const normalisedMessage = message
    .toLowerCase()
    .trim();

  const employerObjective =
    normaliseValue(thinking.employerObjective);

  const conversationMode =
    normaliseValue(thinking.conversationMode);

  /*
   * 1. DOCUMENT REVIEW
   *
   * Documents should be interpreted before Leo begins
   * explaining process or giving generic advice.
   */

  if (
    appearsToContainDocument(normalisedMessage) ||
    includesAny(employerObjective, [
      "document",
      "review",
      "interpret",
      "email",
      "letter",
    ]) ||
    includesAny(conversationMode, [
      "document",
      "review",
    ])
  ) {
    return clonePlan(
      CONVERSATION_PROFILES.documentReview
    );
  }

  /*
   * 2. LEARNING OR PROCESS REQUEST
   *
   * Where the employer is seeking general knowledge,
   * Leo should answer clearly without creating the feel
   * of a live Matter unnecessarily.
   */

  if (
    appearsToBeLearningRequest(normalisedMessage) ||
    includesAny(employerObjective, [
      "learn",
      "understand",
      "explain",
      "process",
      "guidance",
      "information",
    ]) ||
    includesAny(conversationMode, [
      "learning",
      "education",
      "explanation",
      "process",
    ])
  ) {
    return clonePlan(
      CONVERSATION_PROFILES.learning
    );
  }

  /*
   * 3. DECISION SUPPORT
   *
   * The employer is weighing options, expressing doubt
   * or asking Leo to help decide what is reasonable.
   */

  if (
    appearsToNeedDecisionSupport(
      normalisedMessage
    ) ||
    includesAny(employerObjective, [
      "decision",
      "decide",
      "choose",
      "option",
      "judgement",
    ]) ||
    includesAny(conversationMode, [
      "decision",
      "strategic",
      "planning",
      "review",
    ])
  ) {
    return clonePlan(
      CONVERSATION_PROFILES.decisionSupport
    );
  }

  /*
   * 4. DEFAULT LIVE MATTER
   *
   * Most employer messages describe a workplace
   * situation that requires calm framing, proportionate
   * advice and continued support.
   */

  return clonePlan(
    CONVERSATION_PROFILES.liveMatter
  );
}

function appearsToContainDocument(
  message: string
): boolean {
  const documentSignals = [
    "i've received this email",
    "i have received this email",
    "i've received the following email",
    "i have received the following email",
    "i've received this letter",
    "i have received this letter",
    "i've received this grievance",
    "i have received this grievance",
    "i've received this resignation",
    "i have received this resignation",
    "i've received this fit note",
    "i have received this fit note",
    "subject:",
    "dear ",
    "kind regards",
    "attached",
    "attachment",
    "please review",
    "can you review",
    "what does this mean",
  ];

  return documentSignals.some((signal) =>
    message.includes(signal)
  );
}

function appearsToBeLearningRequest(
  message: string
): boolean {
  const learningSignals = [
    "what is ",
    "what are ",
    "what does ",
    "can you explain",
    "could you explain",
    "how does ",
    "how do i ",
    "what is the process",
    "what are the stages",
    "tell me about",
    "help me understand",
    "what does the law say",
    "what are my obligations",
  ];

  const liveMatterSignals = [
    "one of my employees",
    "my employee",
    "i've received",
    "i have received",
    "has asked",
    "has submitted",
    "has complained",
    "has been accused",
    "has been off sick",
    "has resigned",
    "what should i do",
  ];

  const appearsLive =
    liveMatterSignals.some((signal) =>
      message.includes(signal)
    );

  if (appearsLive) {
    return false;
  }

  return learningSignals.some((signal) =>
    message.startsWith(signal) ||
    message.includes(signal)
  );
}

function appearsToNeedDecisionSupport(
  message: string
): boolean {
  const strongDecisionSignals = [
    "should i dismiss",
    "can i dismiss",
    "should i replace",
    "can i replace",
    "should i terminate",
    "can i terminate",
    "am i being unfair",
    "am i being unreasonable",
    "what are my options",
    "which option",
    "what would you recommend",
    "i feel awful",
    "i want to be fair",
    "but i also have a business to run",
    "but i also need the business to run",
  ];

  return strongDecisionSignals.some(
    (signal) => message.includes(signal)
  );
}

function normaliseValue(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
}

function includesAny(
  value: string,
  terms: string[]
): boolean {
  return terms.some((term) =>
    value.includes(term)
  );
}

function clonePlan(
  plan: ConversationPlan
): ConversationPlan {
  return {
    ...plan,
  };
}