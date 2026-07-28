import { runLeoCore } from "../core/router";
import { searchKnowledge } from "../knowledge";
import { buildDecisionFramework } from "../reasoning/decisionFramework";
import { runLeoReasoning } from "../reasoning/reasoner";
import { runProfessionalThinking } from "../thinking/model";

export type DraftDocumentType =
  | "investigation_invitation"
  | "disciplinary_letter"
  | "grievance_response"
  | "meeting_note"
  | "outcome_letter"
  | "general_hr_document";

export type DraftInput = {
  message: string;
  matterId: number;
  organisationId?: string;
  organisationKnowledge?: Array<{
    title: string;
    content: string;
    keywords?: string[];
  }>;
  organisationMemory?: Array<{
    title: string;
    content: string;
    keywords?: string[];
  }>;
  policies?: Array<{
    title?: string;
    content?: string;
  }>;
  documentType?: DraftDocumentType;
};

export type DraftOutput = {
  title: string;
  documentType: DraftDocumentType;
  content: string;
  summary: string;
  rationale: string[];
};

export function buildDraftDocument(input: DraftInput): DraftOutput {
  const core = runLeoCore(input.message);
  const thinking = runProfessionalThinking(input.message);
  const reasoning = runLeoReasoning(core, input.message);
  const framework = buildDecisionFramework(core, reasoning, input.message);

  const knowledge = searchKnowledge({
    message: input.message,
    organisationMemory: (input.organisationMemory || []).map((item) => ({
      id: item.title,
      organisationId: input.organisationId,
      type: "operational_rule",
      title: item.title,
      content: item.content,
      keywords: item.keywords || [],
      active: true,
      source: "user_instruction",
    })),
    policies: (input.policies || []).map((policy) => ({
      id: policy.title || "policy",
      title: policy.title || "Policy",
      sections: [],
      content: policy.content || "",
      metadata: {},
    }) as any),
    organisationKnowledge: (input.organisationKnowledge || []).map((item) => ({
      id: item.title,
      type: "organisation_memory",
      title: item.title,
      content: item.content,
      keywords: item.keywords || [],
      source: "system",
      active: true,
    })),
  });

  const documentType = input.documentType || inferDocumentType(input.message, core, thinking);
  const title = buildTitle(documentType, input.message);
  const content = buildDocumentContent({
    documentType,
    message: input.message,
    core,
    thinking,
    reasoning,
    framework,
    knowledge,
  });

  return {
    title,
    documentType,
    content,
    summary: `Drafted ${title.toLowerCase()} for the current matter using Leo's reasoning, knowledge, and decision framework.`,
    rationale: [
      "The draft is grounded in Leo's current reasoning assessment.",
      "Relevant organisational knowledge and memory were considered where available.",
      "The content follows the current proportionate decision framework.",
    ],
  };
}

function inferDocumentType(
  message: string,
  core: ReturnType<typeof runLeoCore>,
  thinking: ReturnType<typeof runProfessionalThinking>
): DraftDocumentType {
  const text = message.toLowerCase();

  if (text.includes("grievance") || text.includes("complaint")) {
    return "grievance_response";
  }

  if (text.includes("disciplin") || text.includes("misconduct") || text.includes("investigation")) {
    return "investigation_invitation";
  }

  if (text.includes("meeting") || text.includes("note")) {
    return "meeting_note";
  }

  if (text.includes("outcome") || text.includes("decision")) {
    return "outcome_letter";
  }

  if (thinking.employerObjective === "create_document") {
    return "general_hr_document";
  }

  if (core.requiresMatter) {
    return "general_hr_document";
  }

  return "general_hr_document";
}

function buildTitle(documentType: DraftDocumentType, message: string): string {
  const base = message.trim().slice(0, 60) || "HR document";

  switch (documentType) {
    case "investigation_invitation":
      return "Investigation Invitation";
    case "disciplinary_letter":
      return "Disciplinary Letter";
    case "grievance_response":
      return "Grievance Response";
    case "meeting_note":
      return "Meeting Note";
    case "outcome_letter":
      return "Outcome Letter";
    default:
      return `Drafted document: ${base}`;
  }
}

function buildDocumentContent(args: {
  documentType: DraftDocumentType;
  message: string;
  core: ReturnType<typeof runLeoCore>;
  thinking: ReturnType<typeof runProfessionalThinking>;
  reasoning: ReturnType<typeof runLeoReasoning>;
  framework: ReturnType<typeof buildDecisionFramework>;
  knowledge: ReturnType<typeof searchKnowledge>;
}): string {
  const { documentType, message, core, thinking, reasoning, framework, knowledge } = args;
  const knowledgeSummary = knowledge.sources.length
    ? knowledge.sources.slice(0, 3).map((source) => `- ${source.title}: ${source.summary}`).join("\n")
    : "- No specific organisational knowledge was surfaced for this draft.";

  const intro = `Subject: ${buildTitle(documentType, message)}\n\n`;
  const body = [
    `This draft has been prepared using Leo's current reasoning assessment for the matter.`,
    ``,
    `Context`,
    `- Intent: ${core.intent}`,
    `- Overall risk: ${core.risk.overall}`,
    `- Employer objective: ${thinking.employerObjective}`,
    `- Conversation mode: ${thinking.conversationMode}`,
    ``,
    `Professional assessment`,
    `- Primary issue: ${reasoning.primaryIssue}`,
    `- Professional recommendation: ${reasoning.professionalRecommendation}`,
    `- Immediate next step: ${reasoning.immediateNextStep}`,
    `- Decision sequence: ${framework.decisionSequence.join(" → ")}`,
    ``,
    `Relevant knowledge`,
    knowledgeSummary,
    ``,
    `Draft guidance`,
    `- Use this draft as a starting point and tailor it to the specific facts and records of the case.`,
    `- Keep the tone calm, professional and proportionate.`,
    `- Ensure any factual statements are verified before sending.`,
  ].join("\n");

  return `${intro}${body}`;
}
