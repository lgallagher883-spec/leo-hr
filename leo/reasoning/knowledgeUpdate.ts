import {
  KnowledgeFact,
  KnowledgeMatch,
  matchKnowledgeFact,
} from "./knowledgeMatcher";

export type KnowledgeUpdateAction =
  | "add"
  | "merge"
  | "replace"
  | "ignore";

export type KnowledgeUpdateDecision = {
  action: KnowledgeUpdateAction;
  key: string;
  value: string;
  matchedKey: string | null;
  confidence: number;
  reason: string;
};

type DecideKnowledgeUpdateInput = {
  existingFacts: KnowledgeFact[];
  proposedKey: string;
  proposedValue: string;
  employerMessage: string;
};

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isExplicitReplacement(message: string): boolean {
  const normalisedMessage = normalise(message);

  const replacementPhrases = [
    "this has changed",
    "has now changed",
    "is now",
    "we now",
    "no longer",
    "instead",
    "replace",
    "replaced",
    "incorrect",
    "that is wrong",
    "update this",
    "change this",
    "should now be",
  ];

  return replacementPhrases.some((phrase) =>
    normalisedMessage.includes(phrase)
  );
}

function isSameInformation(
  existingValue: string,
  proposedValue: string
): boolean {
  return normalise(existingValue) === normalise(proposedValue);
}

function mergeValues(
  existingValue: string,
  proposedValue: string
): string {
  if (isSameInformation(existingValue, proposedValue)) {
    return existingValue;
  }

  const normalisedExisting = normalise(existingValue);
  const normalisedProposed = normalise(proposedValue);

  if (normalisedExisting.includes(normalisedProposed)) {
    return existingValue;
  }

  if (normalisedProposed.includes(normalisedExisting)) {
    return proposedValue;
  }

  const existingEndsWithPunctuation = /[.!?]$/.test(
    existingValue.trim()
  );

  return `${existingValue.trim()}${
    existingEndsWithPunctuation ? "" : "."
  } ${proposedValue.trim()}`;
}

function findExistingFact(
  existingFacts: KnowledgeFact[],
  matchedKey: string | null
): KnowledgeFact | null {
  if (!matchedKey) return null;

  return (
    existingFacts.find((fact) => fact.key === matchedKey) || null
  );
}

export function decideKnowledgeUpdate({
  existingFacts,
  proposedKey,
  proposedValue,
  employerMessage,
}: DecideKnowledgeUpdateInput): KnowledgeUpdateDecision {
  const cleanKey = proposedKey.trim();
  const cleanValue = proposedValue.trim();

  if (!cleanKey || !cleanValue) {
    return {
      action: "ignore",
      key: cleanKey,
      value: cleanValue,
      matchedKey: null,
      confidence: 0,
      reason: "The proposed knowledge did not contain a valid key and value.",
    };
  }

  const match: KnowledgeMatch = matchKnowledgeFact(
    existingFacts,
    cleanKey,
    cleanValue,
    employerMessage
  );

  if (!match.matched || !match.matchedKey) {
    return {
      action: "add",
      key: cleanKey,
      value: cleanValue,
      matchedKey: null,
      confidence: match.confidence,
      reason: "No sufficiently similar existing fact was found.",
    };
  }

  const existingFact = findExistingFact(
    existingFacts,
    match.matchedKey
  );

  if (!existingFact) {
    return {
      action: "add",
      key: cleanKey,
      value: cleanValue,
      matchedKey: null,
      confidence: match.confidence,
      reason:
        "A possible match was identified, but the existing fact could not be found.",
    };
  }

  if (isSameInformation(existingFact.value, cleanValue)) {
    return {
      action: "ignore",
      key: existingFact.key,
      value: existingFact.value,
      matchedKey: existingFact.key,
      confidence: match.confidence,
      reason: "Leo already has this information recorded.",
    };
  }

  if (isExplicitReplacement(employerMessage)) {
    return {
      action: "replace",
      key: existingFact.key,
      value: cleanValue,
      matchedKey: existingFact.key,
      confidence: match.confidence,
      reason:
        "The employer clearly indicated that the existing information has changed.",
    };
  }

  return {
    action: "merge",
    key: existingFact.key,
    value: mergeValues(existingFact.value, cleanValue),
    matchedKey: existingFact.key,
    confidence: match.confidence,
    reason:
      "The new information relates to an existing fact and should be merged.",
  };
}

export function applyKnowledgeUpdates(
  existingFacts: KnowledgeFact[],
  proposedFacts: KnowledgeFact[],
  employerMessage: string
): KnowledgeUpdateDecision[] {
  const workingFacts = [...existingFacts];
  const decisions: KnowledgeUpdateDecision[] = [];

  for (const proposedFact of proposedFacts) {
    const decision = decideKnowledgeUpdate({
      existingFacts: workingFacts,
      proposedKey: proposedFact.key,
      proposedValue: proposedFact.value,
      employerMessage,
    });

    decisions.push(decision);

    if (decision.action === "ignore") {
      continue;
    }

    const existingIndex = workingFacts.findIndex(
      (fact) => fact.key === decision.key
    );

    if (existingIndex >= 0) {
      workingFacts[existingIndex] = {
        key: decision.key,
        value: decision.value,
      };
    } else {
      workingFacts.push({
        key: decision.key,
        value: decision.value,
      });
    }
  }

  return decisions;
}