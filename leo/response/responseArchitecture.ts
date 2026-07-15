import { ConversationPlan } from "../conversation/types";

export type ProfessionalResponseStage =
  | "employer_objective"
  | "professional_reality"
  | "professional_classification"
  | "professional_context"
  | "professional_severity"
  | "employer_risk"
  | "professional_recommendation"
  | "immediate_next_step";

export type ProfessionalResponseComponent = {
  stage: ProfessionalResponseStage;
  instruction: string;
  required: boolean;
};

export type ResponseSectionType =
  | "professional_interpretation"
  | "underlying_concern"
  | "professional_judgement"
  | "recommendation"
  | "next_step"
  | "supportive_close";

export type ResponseSection = {
  type: ResponseSectionType;
  instruction: string;
  required: boolean;
};

export type ResponseArchitecture = {
  conversationPlan: ConversationPlan;

  professionalSequence: ProfessionalResponseComponent[];

  sections: ResponseSection[];

  avoidNumberedLists: boolean;

  maximumSections: number;

  responseRules: string[];
};

export type ResponseArchitectureInput = {
  message: string;
  conversationPlan: ConversationPlan;
};

export function buildResponseArchitecture({
  message,
  conversationPlan,
}: ResponseArchitectureInput): ResponseArchitecture {
  const normalisedMessage = message
    .toLowerCase()
    .trim();

  const professionalSequence:
    ProfessionalResponseComponent[] = [
      {
        stage: "employer_objective",
        instruction:
          buildEmployerObjectiveInstruction(
            normalisedMessage
          ),
        required:
          conversationPlan.answerUnderlyingConcern,
      },

      {
        stage: "professional_reality",
        instruction:
          "Establish what is currently known. Separate established facts from allegations, assumptions, opinions, interpretations and missing information.",
        required: true,
      },

      {
        stage: "professional_classification",
        instruction:
          "Identify what professional HR area or areas the situation appears to fall under. Use this classification to guide the advice, but do not allow it to predetermine the outcome.",
        required: true,
      },

      {
        stage: "professional_context",
        instruction:
          "Consider why the situation may have arisen. Take account of intent, motivation, misunderstanding, capability, training, communication, management decisions, workplace pressures, health, wellbeing, personal circumstances and any relevant mitigation. Context may explain behaviour without excusing it.",
        required: true,
      },

      {
        stage: "professional_severity",
        instruction:
          "Assess how serious the situation currently appears, considering actual impact, possible consequences, urgency, employee wellbeing, business continuity and proportionality. Do not treat seriousness as proof of an outcome.",
        required: true,
      },

      {
        stage: "employer_risk",
        instruction:
          "Consider the material risks for the employer arising from both action and inaction. Focus only on relevant legal, employee relations, operational, commercial, reputational, consistency and procedural risks. Do not create unnecessary fear.",
        required: true,
      },

      {
        stage: "professional_recommendation",
        instruction:
          "Give a confident, fair and proportionate professional recommendation based on the information currently available. Professional judgement must lead; process and authority should support it.",
        required: true,
      },

      {
        stage: "immediate_next_step",
        instruction:
          "State the single most appropriate immediate next step. Do not attempt to resolve every future stage of the Matter in this response.",
        required: true,
      },
    ];

  const sections: ResponseSection[] = [
    {
      type: "professional_interpretation",
      instruction:
        "Open by explaining the professional reality of the situation rather than repeating the employer's words or immediately listing actions.",
      required:
        conversationPlan.framingRequired,
    },

    {
      type: "underlying_concern",
      instruction:
        "Respond naturally to the employer's underlying concern and objective, not only the literal wording of the question.",
      required:
        conversationPlan.answerUnderlyingConcern,
    },

    {
      type: "professional_judgement",
      instruction:
        "Explain the most important professional distinction or judgement that should guide the employer before discussing process.",
      required:
        conversationPlan.explainProfessionalThinking,
    },

    {
      type: "recommendation",
      instruction:
        "Give a clear and proportionate recommendation supported by the facts, context, seriousness and material employer risks.",
      required: true,
    },

    {
      type: "next_step",
      instruction:
        "Make the immediate practical next step unmistakably clear.",
      required: true,
    },

    {
      type: "supportive_close",
      instruction:
        "Close naturally and make clear that Leo will remain alongside the employer as the Matter develops. Do not use generic offers such as asking whether they would like further help.",
      required:
        conversationPlan.closeWithSupport,
    },
  ];

  return {
    conversationPlan,

    professionalSequence:
      professionalSequence.filter(
        (component) =>
          component.required
      ),

    sections: sections.filter(
      (section) => section.required
    ),

    avoidNumberedLists:
      conversationPlan.avoidNumberedLists,

    maximumSections: 5,

    responseRules: [
      "Do not begin with a generic phrase such as 'From what you have shared, this sounds like a serious situation.'",
      "Do not begin by listing steps.",
      "Do not repeat the employer's message back to them without adding professional interpretation.",
      "Do not describe fact-finding as something separate from an investigation where it forms part of the investigation.",
      "Do not recommend speaking to an accused employee before considering the correct investigation order and whether evidence should first be secured.",
      "Do not turn every response into a complete HR procedure.",
      "Do not use headings or numbered lists unless they materially improve understanding.",
      "Do not finish with generic wording such as 'Would you like help with that?'",
      "The response must sound natural when spoken aloud by an experienced retained HR consultant.",
    ],
  };
}

function buildEmployerObjectiveInstruction(
  message: string
): string {
  if (
    includesAny(message, [
      "i feel awful",
      "am i being unfair",
      "am i being unreasonable",
      "i want to be fair",
    ])
  ) {
    return "Recognise that the employer is seeking reassurance about whether they are acting fairly, not merely asking for a process. Address that concern before explaining what should happen.";
  }

  if (
    includesAny(message, [
      "replace them",
      "business to run",
      "affecting the business",
      "business run properly",
      "business to run properly",
    ])
  ) {
    return "Recognise that the employer is trying to balance fair treatment with business continuity. Address both concerns rather than answering only the technical HR question.";
  }

  if (
    includesAny(message, [
      "what should i do",
      "how should i approach",
      "not sure how to respond",
      "don't know what to do",
      "do not know what to do",
    ])
  ) {
    return "Recognise that the employer wants confident guidance on the correct immediate response and is concerned about making the wrong decision.";
  }

  return "Identify what the employer is trying to achieve, what uncertainty is preventing them from acting confidently and what they most need from Leo at this point.";
}

function includesAny(
  value: string,
  terms: string[]
): boolean {
  return terms.some((term) =>
    value.includes(term)
  );
}