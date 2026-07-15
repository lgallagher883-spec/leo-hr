import {
  ProfessionalResponseComponent,
  ResponseArchitecture,
  ResponseSection,
} from "./responseArchitecture";

type ResponsePromptInput = {
  architecture: ResponseArchitecture;
};

export function buildResponsePrompt({
  architecture,
}: ResponsePromptInput): string {
  const professionalSequence =
    architecture.professionalSequence.map(
      (
        component: ProfessionalResponseComponent,
        index: number
      ) =>
        `${index + 1}. ${formatProfessionalStage(
          component.stage
        )}\n${component.instruction}`
    );

  const conversationalSequence =
    architecture.sections.map(
      (
        section: ResponseSection,
        index: number
      ) =>
        `${index + 1}. ${formatSectionName(
          section.type
        )}\n${section.instruction}`
    );

  const responseRules =
    architecture.responseRules.map(
      (rule) => `- ${rule}`
    );

  const instructions = [
    "Build the response from the professional assessment sequence below.",
    "",
    "PROFESSIONAL ASSESSMENT SEQUENCE",
    "",
    ...professionalSequence,
    "",
    "Use this sequence to determine the substance and order of the professional judgement.",
    "Do not expose these stage names to the employer.",
    "Do not mechanically write one paragraph for every stage.",
    "Only include content that is relevant to the employer's immediate situation.",
    "",
    "CONVERSATIONAL FLOW",
    "",
    ...conversationalSequence,
    "",
    "Use this flow to shape how the professional assessment is experienced by the employer.",
    "Blend the response into one natural professional conversation.",
    "Do not display section names, labels or numbers.",
    "Do not repeat the same point in different parts of the response.",
    "",
    "MANDATORY RESPONSE RULES",
    "",
    ...responseRules,
  ];

  if (architecture.avoidNumberedLists) {
    instructions.push(
      "",
      "Do not use a numbered list in the final response."
    );
  }

  instructions.push(
    "",
    `Use no more than ${architecture.maximumSections} distinct conversational parts.`,
    "The first paragraph must add professional interpretation rather than merely repeating the employer's message.",
    "The response must explain the most important professional judgement before moving into process.",
    "Give one clear immediate recommendation.",
    "End with the next practical step, expressed naturally.",
    "The employer should experience one calm, coherent response rather than a template.",
    "The final wording must sound natural when spoken aloud by an experienced retained HR consultant."
  );

  return instructions.join("\n");
}

function formatProfessionalStage(
  stage: ProfessionalResponseComponent["stage"]
): string {
  switch (stage) {
    case "employer_objective":
      return "Employer objective";

    case "professional_reality":
      return "Professional reality";

    case "professional_classification":
      return "Professional classification";

    case "professional_context":
      return "Professional context and rationale";

    case "professional_severity":
      return "Professional severity";

    case "employer_risk":
      return "Employer risk";

    case "professional_recommendation":
      return "Professional recommendation";

    case "immediate_next_step":
      return "Immediate next step";
  }
}

function formatSectionName(
  type: ResponseSection["type"]
): string {
  switch (type) {
    case "professional_interpretation":
      return "Professional interpretation";

    case "underlying_concern":
      return "Underlying concern";

    case "professional_judgement":
      return "Professional judgement";

    case "recommendation":
      return "Recommendation";

    case "next_step":
      return "Immediate next step";

    case "supportive_close":
      return "Supportive close";
  }
}