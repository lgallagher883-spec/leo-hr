export type EmployerObjective =
  | "resolve_live_issue"
  | "understand_process"
  | "understand_rights_or_obligations"
  | "make_decision"
  | "review_compliance"
  | "create_document"
  | "general_guidance";

export type ConversationMode =
  | "exploration"
  | "guidance"
  | "learning"
  | "planning"
  | "decision_support"
  | "drafting"
  | "review";

export type ResponseDepth =
  | "brief"
  | "focused"
  | "structured"
  | "comprehensive";

export type EmotionalState =
  | "calm"
  | "uncertain"
  | "stressed"
  | "frustrated"
  | "angry";

export type ProfessionalThinkingOutput = {
  employerObjective: EmployerObjective;
  conversationMode: ConversationMode;
  responseDepth: ResponseDepth;
  emotionalState: EmotionalState;
  shouldExploreBeforeAdvising: boolean;
  responseAim: string;
  communicationGuidance: string[];
};

export function runProfessionalThinking(
  message: string
): ProfessionalThinkingOutput {
  const normalisedMessage = message.trim().toLowerCase();

  const employerObjective =
    identifyEmployerObjective(normalisedMessage);

  const conversationMode =
    identifyConversationMode(employerObjective);

  const emotionalState =
    identifyEmotionalState(normalisedMessage);

  const responseDepth =
    identifyResponseDepth(
      employerObjective,
      normalisedMessage
    );

  const shouldExploreBeforeAdvising =
    shouldExplore(
      employerObjective,
      normalisedMessage
    );

  return {
    employerObjective,
    conversationMode,
    responseDepth,
    emotionalState,
    shouldExploreBeforeAdvising,

    responseAim: buildResponseAim(
      employerObjective,
      shouldExploreBeforeAdvising
    ),

    communicationGuidance:
      buildCommunicationGuidance(
        responseDepth,
        emotionalState
      ),
  };
}

function identifyEmployerObjective(
  message: string
): EmployerObjective {
  if (
    includesAny(message, [
      "write a letter",
      "draft a letter",
      "write an email",
      "draft an email",
      "create a document",
      "prepare a letter",
    ])
  ) {
    return "create_document";
  }

  if (
    includesAny(message, [
      "how do i manage",
      "what is the process",
      "explain the process",
      "talk me through",
      "how does a",
      "how should a",
    ])
  ) {
    return "understand_process";
  }

  if (
    includesAny(message, [
      "can i dismiss",
      "should i dismiss",
      "can i terminate",
      "should i terminate",
      "what decision",
      "what outcome",
      "what should i decide",
    ])
  ) {
    return "make_decision";
  }

  if (
    includesAny(message, [
      "are we compliant",
      "have we followed",
      "did we follow",
      "is this compliant",
      "check our process",
      "review this",
    ])
  ) {
    return "review_compliance";
  }

  if (
    includesAny(message, [
      "what does the law say",
      "what are my obligations",
      "what are our obligations",
      "what rights",
      "legally",
      "is it lawful",
      "is this legal",
    ])
  ) {
    return "understand_rights_or_obligations";
  }

  if (
    includesAny(message, [
      "my employee",
      "an employee",
      "a member of staff",
      "one of my staff",
      "we have an issue",
      "i have an issue",
      "what should i do",
      "what do i do",
      "help me deal with",
    ])
  ) {
    return "resolve_live_issue";
  }

  return "general_guidance";
}

function identifyConversationMode(
  objective: EmployerObjective
): ConversationMode {
  switch (objective) {
    case "resolve_live_issue":
      return "guidance";

    case "understand_process":
    case "understand_rights_or_obligations":
      return "learning";

    case "make_decision":
      return "decision_support";

    case "review_compliance":
      return "review";

    case "create_document":
      return "drafting";

    case "general_guidance":
    default:
      return "exploration";
  }
}

function identifyResponseDepth(
  objective: EmployerObjective,
  message: string
): ResponseDepth {
  if (
    includesAny(message, [
      "in detail",
      "full process",
      "complete process",
      "comprehensive",
      "step by step",
    ])
  ) {
    return "comprehensive";
  }

  if (
    objective === "understand_process" ||
    objective ===
      "understand_rights_or_obligations"
  ) {
    return "structured";
  }

  if (
    objective === "make_decision" ||
    objective === "review_compliance"
  ) {
    return "focused";
  }

  if (
    includesAny(message, [
      "quick question",
      "briefly",
      "short answer",
      "just tell me",
    ])
  ) {
    return "brief";
  }

  return "focused";
}

function identifyEmotionalState(
  message: string
): EmotionalState {
  if (
    includesAny(message, [
      "furious",
      "absolutely raging",
      "so angry",
      "i am angry",
      "unacceptable",
    ])
  ) {
    return "angry";
  }

  if (
    includesAny(message, [
      "frustrated",
      "fed up",
      "had enough",
      "annoyed",
      "ridiculous",
    ])
  ) {
    return "frustrated";
  }

  if (
    includesAny(message, [
      "stressed",
      "panicking",
      "panic",
      "overwhelmed",
      "urgent",
      "desperate",
    ])
  ) {
    return "stressed";
  }

  if (
    includesAny(message, [
      "not sure",
      "unsure",
      "confused",
      "worried",
      "concerned",
    ])
  ) {
    return "uncertain";
  }

  return "calm";
}

function shouldExplore(
  objective: EmployerObjective,
  message: string
): boolean {
  if (
    objective === "understand_process" ||
    objective ===
      "understand_rights_or_obligations"
  ) {
    return false;
  }

  if (
    objective === "resolve_live_issue" ||
    objective === "make_decision"
  ) {
    return !includesAny(message, [
      "the full background is",
      "all the facts are",
      "here is the full timeline",
    ]);
  }

  return false;
}

function buildResponseAim(
  objective: EmployerObjective,
  shouldExploreBeforeAdvising: boolean
): string {
  if (shouldExploreBeforeAdvising) {
    return (
      "Help the employer organise the situation, " +
      "identify any material information still missing, " +
      "and move towards the next proportionate step."
    );
  }

  switch (objective) {
    case "understand_process":
      return (
        "Explain the complete process clearly and " +
        "proportionately, giving the employer a useful " +
        "overview without turning the response into a " +
        "procedural manual."
      );

    case "understand_rights_or_obligations":
      return (
        "Explain the relevant position in plain English " +
        "and identify what it means practically for the " +
        "employer."
      );

    case "make_decision":
      return (
        "Support the employer's decision by identifying " +
        "the material facts, professional considerations " +
        "and proportionate options."
      );

    case "review_compliance":
      return (
        "Review what has happened, identify meaningful " +
        "gaps or risks, and explain what should be corrected."
      );

    case "create_document":
      return (
        "Establish the purpose and necessary facts before " +
        "preparing a clear, professional workplace document."
      );

    case "general_guidance":
    case "resolve_live_issue":
    default:
      return (
        "Give clear, practical guidance that leaves the " +
        "employer knowing what to do next."
      );
  }
}

function buildCommunicationGuidance(
  depth: ResponseDepth,
  emotionalState: EmotionalState
): string[] {
  const guidance = [
    "Use plain, human and professional language.",
    "Do not use technical system terminology.",
    "Do not show off legal or HR knowledge.",
    "Provide only information that helps the employer.",
    "End with a clear practical next step.",
  ];

  if (depth === "brief") {
    guidance.push(
      "Answer directly and keep supporting detail minimal."
    );
  }

  if (depth === "focused") {
    guidance.push(
      "Concentrate on what matters now rather than covering every possible future stage."
    );
  }

  if (depth === "structured") {
    guidance.push(
      "Explain the overall framework in a clear sequence, with concise practical guidance for each stage."
    );
  }

  if (depth === "comprehensive") {
    guidance.push(
      "Cover the full subject, but organise it carefully and avoid walls of text or unnecessary exceptions."
    );
  }

  if (
    emotionalState === "stressed" ||
    emotionalState === "frustrated" ||
    emotionalState === "angry"
  ) {
    guidance.push(
      "Remain calm and measured. Acknowledge the difficulty without mirroring the employer's emotion."
    );

    guidance.push(
      "Lower the emotional temperature and help the employer regain a sense of control."
    );
  }

  if (emotionalState === "uncertain") {
    guidance.push(
      "Reduce uncertainty by explaining what is known, what remains unclear and what should happen next."
    );
  }

  return guidance;
}

function includesAny(
  message: string,
  phrases: string[]
): boolean {
  return phrases.some((phrase) =>
    message.includes(phrase)
  );
}