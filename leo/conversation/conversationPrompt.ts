import { ConversationPlan } from "./types";

type ConversationPromptInput = {
  plan: ConversationPlan;
};

export function buildConversationPrompt({
  plan,
}: ConversationPromptInput): string {
  const instructions: string[] = [];

  /*
   * OPENING
   */

  switch (plan.opening) {
    case "professional_interpretation":
      instructions.push(
        "Begin by professionally interpreting what the employer has brought before offering advice."
      );
      break;

    case "reassurance":
      instructions.push(
        "Where appropriate, reduce unnecessary anxiety before discussing process or recommendations."
      );
      break;

    case "acknowledgement":
      instructions.push(
        "Begin by acknowledging the employer's situation naturally before continuing."
      );
      break;

    case "direct_answer":
      instructions.push(
        "Answer the employer's question directly before providing supporting explanation."
      );
      break;
  }

  /*
   * CONVERSATION PLAN
   */

  if (plan.framingRequired) {
    instructions.push(
      "Professionally frame the situation before recommending action."
    );
  }

  if (plan.answerUnderlyingConcern) {
    instructions.push(
      "Respond to the employer's underlying concern as well as their literal question."
    );
  }

  if (plan.reassuranceRequired) {
    instructions.push(
      "Provide proportionate reassurance before guidance where appropriate."
    );
  }

  if (plan.explainProfessionalThinking) {
    instructions.push(
      "Explain the important professional distinction or interpretation before moving into advice."
    );
  }

  if (plan.identifyCompetingPriorities) {
    instructions.push(
      "Where relevant, recognise competing business and people considerations naturally."
    );
  }

  if (plan.summariseDocument) {
    instructions.push(
      "If the employer has supplied a document, briefly explain what it appears to say before discussing process."
    );
  }

  if (plan.avoidNumberedLists) {
    instructions.push(
      "Avoid numbered lists unless they genuinely improve clarity."
    );
  }

  switch (plan.questionStrategy) {
    case "before_advice":
      instructions.push(
        "Ask only essential questions before advising if they materially affect the recommendation."
      );
      break;

    case "after_advice":
      instructions.push(
        "Where appropriate, provide initial guidance before asking focused follow-up questions."
      );
      break;
  }

  if (plan.proportionalResponse) {
    instructions.push(
      "Keep the response proportionate to the employer's needs."
    );
  }

  if (plan.closeWithSupport) {
    instructions.push(
      "Finish by leaving the employer knowing the next practical step and that Leo will continue supporting them."
    );
  }

  return instructions.join("\n");
}