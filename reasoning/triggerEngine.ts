import { ReasoningModuleInput } from "./modules/types";

export type TriggerResult = {
  triggered: boolean;
  confidence: number;
  matches: string[];
};

type TriggerOptions = {
  keywords: string[];
  strongKeywords?: string[];
  intentMatches?: string[];
  minimumConfidence?: number;
};

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function evaluateReasoningTrigger(
  input: ReasoningModuleInput,
  options: TriggerOptions
): TriggerResult {
  const text = normalise(input.matterContext);
  const intent = normalise(input.intent);

  const normalKeywords = options.keywords.map(normalise);
  const strongKeywords = (options.strongKeywords || []).map(normalise);
  const intentMatches = (options.intentMatches || []).map(normalise);

  const matchedKeywords = normalKeywords.filter((keyword) =>
    text.includes(keyword)
  );

  const matchedStrongKeywords = strongKeywords.filter((keyword) =>
    text.includes(keyword)
  );

  const matchedIntent = intentMatches.filter(
    (intentMatch) =>
      intent === intentMatch || intent.includes(intentMatch)
  );

  let confidence = 0;

  confidence += matchedKeywords.length * 15;
  confidence += matchedStrongKeywords.length * 30;
  confidence += matchedIntent.length * 35;

  confidence = Math.min(confidence, 100);

  const minimumConfidence = options.minimumConfidence ?? 20;

  return {
    triggered: confidence >= minimumConfidence,
    confidence,
    matches: [
      ...matchedStrongKeywords,
      ...matchedKeywords,
      ...matchedIntent.map((match) => `intent:${match}`),
    ],
  };
}