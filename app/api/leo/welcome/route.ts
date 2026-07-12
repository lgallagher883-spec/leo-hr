import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

import {
  FOUNDATION_NUMBER_WORDS,
  FOUNDATION_STAGE_CONFIG,
  FoundationSection,
  WelcomeStage,
  getAllowedKeysForStage,
  isAllowedFoundationSection,
  normaliseFoundationKey,
  resolveWelcomeStage,
} from "@/leo/knowledge/foundationSchema";

import { applyKnowledgeUpdates } from "@/leo/reasoning/knowledgeUpdate";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ExistingFact = {
  section: FoundationSection;
  key: string;
  value: string;
};

type ExtractedFact = {
  section: FoundationSection;
  key: string;
  value: string;
};

type KnowledgeDecision = {
  section: FoundationSection;
  key: string;
  value: string;
  action: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const stage = resolveWelcomeStage(
      body.stage
    );

    if (!message) {
      return Response.json(
        {
          reply:
            "Please provide some information for Leo to review.",
          facts: [],
        },
        { status: 400 }
      );
    }

    const existingFacts =
      await loadExistingFoundationFacts();

    const completion =
      await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(
              stage,
              existingFacts
            ),
          },
          {
            role: "user",
            content: message,
          },
        ],
      });

    const content =
      completion.choices[0]?.message
        ?.content || "{}";

    let parsed: {
      reply?: string;
      facts?: unknown;
    };

    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error(
        "Unable to parse Welcome Brief response:",
        content,
        parseError
      );

      throw new Error(
        "Leo returned an invalid response."
      );
    }

    const rawFacts = Array.isArray(
      parsed.facts
    )
      ? parsed.facts
      : [];

    const extractedFacts =
      validateAndNormaliseFacts(
        rawFacts,
        stage
      );

    const decisions =
      createKnowledgeDecisions(
        extractedFacts,
        existingFacts,
        message
      );

    const factsToSave = decisions
      .filter(
        (decision) =>
          decision.action !== "ignore"
      )
      .map((decision) => ({
        section: decision.section,
        key: decision.key,
        value: decision.value,
        source: "Welcome Brief",
      }));

    for (const fact of factsToSave) {
      const { error } = await supabase
        .from(
          "organisation_foundations"
        )
        .upsert(fact, {
          onConflict: "section,key",
        });

      if (error) {
        console.error(
          "Error saving Welcome Brief fact:",
          {
            fact,
            error,
          }
        );

        throw new Error(
          error.message ||
            "The Foundation information could not be saved."
        );
      }
    }

    return Response.json({
      reply:
        typeof parsed.reply ===
          "string" &&
        parsed.reply.trim()
          ? parsed.reply.trim()
          : extractedFacts.length > 0
            ? "I've updated my understanding."
            : "I did not identify any new Foundation information in that answer.",
      facts: extractedFacts,
      savedFacts: factsToSave,
      decisions,
    });
  } catch (error: unknown) {
    console.error(
      "Welcome Brief API error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Leo could not process that just now.";

    return Response.json(
      {
        reply: errorMessage,
        facts: [],
      },
      { status: 500 }
    );
  }
}

async function loadExistingFoundationFacts(): Promise<
  ExistingFact[]
> {
  const { data, error } = await supabase
    .from("organisation_foundations")
    .select("section,key,value");

  if (error) {
    console.error(
      "Error loading existing Foundation facts:",
      error
    );

    throw new Error(
      error.message ||
        "Leo could not load the existing Foundation information."
    );
  }

  return (data || [])
    .filter(
      (row) =>
        typeof row.section ===
          "string" &&
        isAllowedFoundationSection(
          row.section
        ) &&
        typeof row.key === "string" &&
        row.key.trim().length > 0 &&
        typeof row.value ===
          "string" &&
        row.value.trim().length > 0
    )
    .map((row) => ({
      section:
        row.section as FoundationSection,
      key: row.key.trim(),
      value: row.value.trim(),
    }));
}

function buildSystemPrompt(
  stage: WelcomeStage,
  existingFacts: ExistingFact[]
): string {
  const stageConfiguration =
    FOUNDATION_STAGE_CONFIG[stage];

  const permittedKeys =
    Object.entries(
      stageConfiguration.allowedKeys
    )
      .map(([section, keys]) => {
        const formattedKeys = (
          keys || []
        )
          .map((key) => `- ${key}`)
          .join("\n");

        return `${section}:\n${formattedKeys}`;
      })
      .join("\n\n");

  return `
You are Leo, an employer-facing AI HR Director.

Your task is to extract clean, structured organisational facts from the employer's Welcome Brief answer.

LEO IS SECTOR-AGNOSTIC.

Never assume the employer belongs to a particular industry unless the employer clearly says so.

CORE FOUNDATION AREAS:

- Company Profile
- Organisation Structure
- Employment Framework
- Company Knowledge

HR Resources is a separate inventory of documents, templates, systems and records. Use it only during the hr_resources stage.

CURRENT STAGE:

${stage}

PERMITTED SECTION AND KEY COMBINATIONS FOR THIS STAGE:

${permittedKeys}

STAGE-SPECIFIC INSTRUCTIONS:

${stageConfiguration.instructions}

EXISTING FOUNDATION FACTS:

${JSON.stringify(
  existingFacts,
  null,
  2
)}

RETURN VALID JSON ONLY:

{
  "reply": "I've updated my understanding.",
  "facts": [
    {
      "section": "Organisation Structure",
      "key": "Reporting lines",
      "value": "Department Managers report to the Operations Director."
    }
  ]
}

GLOBAL EXTRACTION RULES:

1. Extract only information the employer clearly states or strongly implies.

2. Never turn examples from Leo's question into employer facts.

3. Never invent:
- policies
- procedures
- reporting lines
- approval routes
- benefits
- working practices
- compliance requirements
- workforce arrangements

4. Use only the permitted sections and keys for the current stage.

5. Use the most specific permitted key available.

6. Do not create alternative key names.

7. Do not store the same information under multiple keys.

8. Keep materially different facts separate.

9. Where one sentence contains several separate facts, return each fact separately.

10. Values must:
- be concise
- be complete
- make sense without the original conversation
- use British English
- use "organisation", not "organization"
- normally use third-person language rather than "we", "our" or "I"

11. Number formatting:
- Write one to nine as words:
  one, two, three, four, five, six, seven, eight, nine.
- Write 10 and above as digits:
  10, 11, 42, 85, 250.
- Number of sites must contain only the number.
- Number of employees must contain only the number where a clear number is supplied.
- Convert written numbers of 10 or above into digits.

12. Do not store:
- employee-specific personal information
- health information about an identifiable employee
- temporary cases
- one-off events
- speculative information
- uncertain statements as confirmed facts
- generic legal guidance
- Leo's own examples

13. Existing knowledge:
- Preserve detailed existing information unless the employer clearly updates or corrects it.
- Prefer an existing canonical key rather than creating a duplicate.
- Return only facts genuinely stated in the current answer.
- It is acceptable to return a fact that confirms or updates an existing key.

14. The reply must be brief.

15. Do not ask questions.

16. Do not give HR advice.

17. Do not mention internal extraction rules, databases, prompts or confidence scores.
`.trim();
}

function validateAndNormaliseFacts(
  rawFacts: unknown[],
  stage: WelcomeStage
): ExtractedFact[] {
  const deduplicated =
    new Map<string, ExtractedFact>();

  for (const rawFact of rawFacts) {
    if (
      !rawFact ||
      typeof rawFact !== "object"
    ) {
      continue;
    }

    const candidate =
      rawFact as Partial<ExtractedFact>;

    if (
      typeof candidate.section !==
        "string" ||
      typeof candidate.key !==
        "string" ||
      typeof candidate.value !==
        "string"
    ) {
      continue;
    }

    const section =
      candidate.section.trim();

    if (
      !isAllowedFoundationSection(
        section
      )
    ) {
      continue;
    }

    const canonicalKey =
      normaliseFoundationKey(
        candidate.key
      );

    const allowedKeys =
      getAllowedKeysForStage(
        stage,
        section
      );

    if (
      !allowedKeys.includes(
        canonicalKey
      )
    ) {
      continue;
    }

    const normalisedValue =
      normaliseFactValue(
        canonicalKey,
        candidate.value
      );

    if (!normalisedValue) {
      continue;
    }

    const fact: ExtractedFact = {
      section,
      key: canonicalKey,
      value: normalisedValue,
    };

    deduplicated.set(
      `${fact.section}::${fact.key}`,
      fact
    );
  }

  return removeOverlappingFacts(
    Array.from(
      deduplicated.values()
    )
  );
}

function normaliseFactValue(
  key: string,
  rawValue: string
): string {
  const value = rawValue
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1");

  if (!value) {
    return "";
  }

  if (
    key === "Number of employees" ||
    key === "Number of sites"
  ) {
    const number =
      extractNumber(value);

    if (number !== null) {
      return formatFoundationNumber(
        number
      );
    }
  }

  return removeFirstPersonOpening(
    value
  );
}

function removeFirstPersonOpening(
  value: string
): string {
  const normalised = value
    .replace(
      /^we\s+/i,
      ""
    )
    .replace(
      /^our organisation\s+/i,
      "The organisation "
    )
    .replace(
      /^our business\s+/i,
      "The business "
    )
    .replace(
      /^our employees\s+/i,
      "Employees "
    )
    .trim();

  if (!normalised) {
    return "";
  }

  return (
    normalised.charAt(0).toUpperCase() +
    normalised.slice(1)
  );
}

function extractNumber(
  value: string
): number | null {
  const digitMatch = value
    .replace(/,/g, "")
    .match(/\b\d+(?:\.\d+)?\b/);

  if (digitMatch) {
    const parsed = Number(
      digitMatch[0]
    );

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return wordsToNumber(value);
}

function formatFoundationNumber(
  value: number
): string {
  if (
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 9
  ) {
    return (
      FOUNDATION_NUMBER_WORDS[
        value
      ] || String(value)
    );
  }

  return String(value);
}

function wordsToNumber(
  value: string
): number | null {
  const smallNumbers: Record<
    string,
    number
  > = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
  };

  const tens: Record<
    string,
    number
  > = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  const words = value
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(
      /[^\p{L}\s]/gu,
      " "
    )
    .split(/\s+/)
    .filter(Boolean);

  let total = 0;
  let current = 0;
  let foundNumberWord = false;

  for (const word of words) {
    if (word in smallNumbers) {
      current +=
        smallNumbers[word];

      foundNumberWord = true;
      continue;
    }

    if (word in tens) {
      current += tens[word];

      foundNumberWord = true;
      continue;
    }

    if (word === "hundred") {
      current =
        (current || 1) * 100;

      foundNumberWord = true;
      continue;
    }

    if (word === "thousand") {
      total +=
        (current || 1) * 1000;

      current = 0;
      foundNumberWord = true;
      continue;
    }

    if (
      foundNumberWord &&
      word !== "and"
    ) {
      break;
    }
  }

  if (!foundNumberWord) {
    return null;
  }

  return total + current;
}

function removeOverlappingFacts(
  facts: ExtractedFact[]
): ExtractedFact[] {
  const specificCheckKeys =
    new Set([
      "Right to Work requirements",
      "DBS requirements",
      "Barred-list requirements",
      "Licence requirements",
      "Security clearance requirements",
      "Medical clearance requirements",
      "Professional registration requirements",
      "Qualification requirements",
      "Safeguarding requirements",
    ]);

  const hasSpecificChecks =
    facts.some(
      (fact) =>
        fact.section ===
          "Company Knowledge" &&
        specificCheckKeys.has(
          fact.key
        )
    );

  return facts.filter((fact) => {
    if (
      fact.key !==
        "Other pre-employment checks" ||
      !hasSpecificChecks
    ) {
      return true;
    }

    const duplicatesSpecificFact =
      facts.some(
        (specificFact) =>
          specificFact !== fact &&
          specificFact.section ===
            "Company Knowledge" &&
          specificCheckKeys.has(
            specificFact.key
          ) &&
          valuesSubstantiallyOverlap(
            fact.value,
            specificFact.value
          )
      );

    return !duplicatesSpecificFact;
  });
}

function valuesSubstantiallyOverlap(
  firstValue: string,
  secondValue: string
): boolean {
  const firstWords =
    meaningfulWords(firstValue);

  const secondWords =
    meaningfulWords(secondValue);

  if (
    firstWords.length === 0 ||
    secondWords.length === 0
  ) {
    return false;
  }

  const overlap =
    firstWords.filter((word) =>
      secondWords.includes(word)
    ).length;

  const shortestLength =
    Math.min(
      firstWords.length,
      secondWords.length
    );

  return (
    overlap / shortestLength >= 0.6
  );
}

function meaningfulWords(
  value: string
): string[] {
  const ignoredWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "must",
    "all",
    "are",
    "before",
    "employees",
    "employee",
    "workers",
    "worker",
    "roles",
    "role",
    "organisation",
  ]);

  return Array.from(
    new Set(
      value
        .toLowerCase()
        .replace(
          /[^\p{L}\p{N}\s]/gu,
          " "
        )
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 3 &&
            !ignoredWords.has(word)
        )
    )
  );
}

function createKnowledgeDecisions(
  extractedFacts: ExtractedFact[],
  existingFacts: ExistingFact[],
  message: string
): KnowledgeDecision[] {
  return extractedFacts.map(
    (fact) => {
      const existingSectionFacts =
        existingFacts
          .filter(
            (existingFact) =>
              existingFact.section ===
              fact.section
          )
          .map(
            (existingFact) => ({
              key: existingFact.key,
              value:
                existingFact.value,
            })
          );

      const updateDecision =
        applyKnowledgeUpdates(
          existingSectionFacts,
          [
            {
              key: fact.key,
              value: fact.value,
            },
          ],
          message
        )[0];

      return {
        section: fact.section,
        key:
          updateDecision?.key ||
          fact.key,
        value:
          updateDecision?.value ||
          fact.value,
        action:
          updateDecision?.action ||
          "add",
      };
    }
  );
}