export type KnowledgeFact = {
  key: string;
  value: string;
};

export type KnowledgeMatch = {
  matched: boolean;
  matchedKey: string | null;
  confidence: number;
  reason: string;
};

const conceptGroups: Record<string, string[]> = {
  "Operational rules": [
    "operational rule",
    "working rule",
    "business rule",
    "must complete",
    "must follow",
    "required process",
    "mandatory",
    "requirement for managers",
  ],

  "Approval routes": [
    "approval",
    "approve",
    "authorise",
    "authorisation",
    "permission",
    "sign off",
    "manager approval",
    "operations manager approval",
  ],

  "Compliance requirements": [
    "compliance",
    "regulatory",
    "regulation",
    "statutory",
    "legal requirement",
    "ofsted requirement",
    "cqc requirement",
    "eyfs",
  ],

  "Internal practices": [
    "internal practice",
    "usual practice",
    "normally",
    "typically",
    "we usually",
    "standard practice",
    "customary",
  ],

  "Things Leo should remember": [
    "remember",
    "important context",
    "something leo should know",
    "organisation preference",
    "local arrangement",
  ],

  "Annual safeguarding training": [
    "annual safeguarding",
    "safeguarding refresher",
    "safeguarding training every year",
    "yearly safeguarding",
  ],

  "Working patterns": [
    "working pattern",
    "rota",
    "shift",
    "working hours",
    "work schedule",
  ],

  "Managers / leadership structure": [
    "manager",
    "leadership",
    "reports to",
    "reporting line",
    "management structure",
  ],

  "Departments / teams": [
    "department",
    "team",
    "operations team",
    "central team",
    "business support team",
  ],

  "Site working pattern": [
    "site",
    "location",
    "home working",
    "working from home",
    "office based",
    "site based",
  ],

  "Cross-site working": [
    "cross-site",
    "across sites",
    "different settings",
    "multiple locations",
    "between sites",
  ],
};

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWords(value: string): Set<string> {
  return new Set(
    normalise(value)
      .split(" ")
      .filter((word) => word.length > 2)
  );
}

function calculateWordOverlap(first: string, second: string): number {
  const firstWords = getWords(first);
  const secondWords = getWords(second);

  if (firstWords.size === 0 || secondWords.size === 0) {
    return 0;
  }

  let sharedWords = 0;

  for (const word of firstWords) {
    if (secondWords.has(word)) {
      sharedWords += 1;
    }
  }

  return sharedWords / Math.min(firstWords.size, secondWords.size);
}

function getConceptScore(key: string, message: string): number {
  const aliases = conceptGroups[key] || [];
  const normalisedMessage = normalise(message);

  let score = 0;

  for (const alias of aliases) {
    if (normalisedMessage.includes(normalise(alias))) {
      score += 1;
    }
  }

  return Math.min(score / 2, 1);
}

export function matchKnowledgeFact(
  existingFacts: KnowledgeFact[],
  proposedKey: string,
  proposedValue: string,
  employerMessage: string
): KnowledgeMatch {
  if (existingFacts.length === 0) {
    return {
      matched: false,
      matchedKey: null,
      confidence: 0,
      reason: "No existing facts were available for comparison.",
    };
  }

  let bestMatch: KnowledgeMatch = {
    matched: false,
    matchedKey: null,
    confidence: 0,
    reason: "No sufficiently similar existing fact was found.",
  };

  for (const existingFact of existingFacts) {
    const keySimilarity = calculateWordOverlap(
      existingFact.key,
      proposedKey
    );

    const valueSimilarity = calculateWordOverlap(
      existingFact.value,
      proposedValue
    );

    const messageSimilarity = calculateWordOverlap(
      existingFact.value,
      employerMessage
    );

    const existingConceptScore = getConceptScore(
      existingFact.key,
      `${proposedValue} ${employerMessage}`
    );

    const proposedConceptScore = getConceptScore(
      proposedKey,
      `${existingFact.value} ${employerMessage}`
    );

    const confidence =
      keySimilarity * 0.3 +
      valueSimilarity * 0.3 +
      messageSimilarity * 0.2 +
      existingConceptScore * 0.15 +
      proposedConceptScore * 0.05;

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        matched: confidence >= 0.45,
        matchedKey: confidence >= 0.45 ? existingFact.key : null,
        confidence: Number(confidence.toFixed(2)),
        reason:
          confidence >= 0.45
            ? `The proposed knowledge overlaps with the existing "${existingFact.key}" fact.`
            : "The similarity was below the matching threshold.",
      };
    }
  }

  return bestMatch;
}