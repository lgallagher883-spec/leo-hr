import { LeoCoreOutput } from "../core/router";
import { ReasoningOutput } from "../reasoning/reasoner";

export function buildAdvice(
  result: LeoCoreOutput,
  reasoning?: ReasoningOutput
): string {
  if (!reasoning) {
    return (
      "Leo recommends checking the relevant company policy, gathering the key facts, and ensuring any action is fair, consistent and properly documented."
    );
  }

  if (reasoning.shouldAskQuestionsFirst) {
    return (
      "Leo does not recommend making a final decision at this stage. " +
      "The employer should first gather the missing information, check the relevant company policy, and consider whether the facts create any legal or employee relations risk. " +
      "This is particularly important where the matter may involve health, disability, flexible working, or a potential reasonable adjustment."
    );
  }

  if (result.risk.overall === "high") {
    return (
      "This matter should be handled carefully and through a clear process. " +
      "Leo recommends checking the relevant company policy, documenting each step, and considering specialist HR or legal support before taking formal action."
    );
  }

  if (result.risk.overall === "medium") {
    return (
      "This matter appears manageable, but it should still be handled consistently and fairly. " +
      "Leo recommends checking the relevant company policy, confirming the facts, and making sure any decision can be justified by both the evidence and the needs of the business."
    );
  }

  return (
    "This appears to be a lower-risk matter at this stage. " +
    "Leo recommends dealing with it promptly, checking the relevant policy, and keeping a clear record of the outcome."
  );
}