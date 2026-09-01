import { ConversationPlan } from "../conversation/types";

export type ResponseArchitecture = {
  openingStyle: ConversationPlan["opening"];
  responseShape: ConversationPlan["shape"];
  questionStrategy: ConversationPlan["questionStrategy"];
  acknowledgeUnderlyingConcern: boolean;
  summariseDocument: boolean;
  closeWithSupport: boolean;
  avoidNumberedLists: boolean;
  maximumParts: number;
  communicationRules: string[];
};

export type ResponseArchitectureInput = {
  message: string;
  conversationPlan: ConversationPlan;
};

export function buildResponseArchitecture({
  conversationPlan,
}: ResponseArchitectureInput): ResponseArchitecture {
  return {
    openingStyle: conversationPlan.opening,
    responseShape: conversationPlan.shape,
    questionStrategy: conversationPlan.questionStrategy,
    acknowledgeUnderlyingConcern:
      conversationPlan.answerUnderlyingConcern,
    summariseDocument:
      conversationPlan.summariseDocument,
    closeWithSupport:
      conversationPlan.closeWithSupport,
    avoidNumberedLists:
      conversationPlan.avoidNumberedLists,
    maximumParts: 5,
    communicationRules: [
      "Communicate the private assessment faithfully without independently changing its judgement.",
      "Use natural, concise and practical employer-facing language.",
      "Do not expose internal assessment labels, routing signals or system architecture.",
      "Do not repeat the employer's message without adding the assessment's useful interpretation.",
      "Explain uncertainty and evidence limits where the private assessment identifies them.",
      "Do not turn the response into a complete procedure unless the employer asked for one.",
      "Do not use headings or lists unless they materially improve clarity.",
      "Do not end with a generic invitation for more questions.",
    ],
  };
}