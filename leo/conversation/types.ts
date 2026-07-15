export type ConversationOpening =
  | "professional_interpretation"
  | "reassurance"
  | "acknowledgement"
  | "direct_answer";

export type ConversationShape =
  | "conversation"
  | "decision_support"
  | "action_plan"
  | "process_overview"
  | "document_review";

export type QuestionStrategy =
  | "none"
  | "before_advice"
  | "after_advice";

export interface ConversationPlan {
  opening: ConversationOpening;

  shape: ConversationShape;

  framingRequired: boolean;

  reassuranceRequired: boolean;

  answerUnderlyingConcern: boolean;

  summariseDocument: boolean;

  explainProfessionalThinking: boolean;

  identifyCompetingPriorities: boolean;

  avoidNumberedLists: boolean;

  questionStrategy: QuestionStrategy;

  proportionalResponse: boolean;

  closeWithSupport: boolean;
}