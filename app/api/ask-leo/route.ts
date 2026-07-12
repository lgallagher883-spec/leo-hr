import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { runAuthorityEngine } from "@/leo/authority/router";
import { runLeoCore } from "@/leo/core/router";
import { searchKnowledge } from "@/leo/knowledge";
import {
  StoredPolicy,
  StoredPolicySection,
} from "@/leo/knowledge/storage/policies";
import { buildLeoPrompt } from "@/leo/prompt/builder";
import { runLeoReasoning } from "@/leo/reasoning/reasoner";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type StoredKnowledgeChunk = {
  id: string;
  document_id: string;
  organisation_id: string;
  source_table: string | null;
  source_record_id: number | null;
  chunk_index: number;
  heading: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
};

type PolicyRegisterRecord = {
  id: number;
  name: string;
  register_type: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 1. LEO CORE
     */

    const coreResult = runLeoCore(message);

    /*
     * 2. PROFESSIONAL REASONING
     */

    const reasoningResult = runLeoReasoning(
      coreResult,
      message
    );

    /*
     * 3. AUTHORITY ENGINE
     */

    const authorityResult = await runAuthorityEngine({
      message,
      intent: coreResult.intent,
      risk: coreResult.risk.overall,
      classification: coreResult.decision,
      professionalReasoning: reasoningResult,
    });

    /*
     * 4. FOUNDATIONS
     */

    const {
      data: foundationRows,
      error: foundationError,
    } = await supabase
      .from("organisation_foundations")
      .select("section,key,value,source");

    if (foundationError) {
      console.error(
        "Error loading organisation foundations:",
        foundationError
      );
    }

    const organisationKnowledge =
      foundationRows?.map((row, index) => ({
        id: `${row.section}-${row.key}-${index}`,
        type: mapFoundationType(row.section),
        title: row.key,
        content: row.value,
        keywords: buildKnowledgeKeywords(
          row.section,
          row.key,
          row.value
        ),
        source: "foundation" as const,
        active: true,
      })) ?? [];

    /*
     * 5. HR RESOURCE DOCUMENT KNOWLEDGE
     */

    const organisationId =
      typeof body.organisationId === "string" &&
      body.organisationId.trim()
        ? body.organisationId.trim()
        : "default-organisation";

    const documentPolicies =
      await loadRelevantDocumentPolicies(
        message,
        organisationId
      );

    /*
     * 6. EXISTING SUPPLIED KNOWLEDGE
     */

    const suppliedPolicies: StoredPolicy[] =
      Array.isArray(body.policies)
        ? body.policies
        : [];

    /*
     * 7. LEO KNOWLEDGE
     */

    const knowledgeResult = searchKnowledge({
      message,

      organisationMemory: Array.isArray(
        body.organisationMemory
      )
        ? body.organisationMemory
        : [],

      policies: [
        ...suppliedPolicies,
        ...documentPolicies,
      ],

      organisationKnowledge,

      previousMatters: Array.isArray(
        body.previousMatters
      )
        ? body.previousMatters
        : [],
    });

    /*
     * 8. PROMPT BUILDER
     */

    const leoPrompt = buildLeoPrompt(
      message,
      coreResult,
      reasoningResult,
      authorityResult,
      knowledgeResult
    );

    /*
     * 9. OPENAI
     */

    const completion =
      await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: leoPrompt,
          },
        ],
      });

    const response =
      completion.choices[0]?.message?.content ??
      "Leo was unable to generate a response.";

    return NextResponse.json({
      response,
      core: coreResult,
      reasoning: reasoningResult,
      authority: authorityResult,
      knowledge: knowledgeResult,

      documentKnowledge: {
        policyCount: documentPolicies.length,

        sectionCount: documentPolicies.reduce(
          (total, policy) =>
            total + policy.sections.length,
          0
        ),

        sources: documentPolicies.map(
          (policy) => policy.title
        ),
      },
    });
  } catch (error) {
    console.error("Ask Leo API error:", error);

    return NextResponse.json(
      {
        error:
          "Leo was unable to process this request.",
      },
      {
        status: 500,
      }
    );
  }
}

async function loadRelevantDocumentPolicies(
  message: string,
  organisationId: string
): Promise<StoredPolicy[]> {
  const serverSupabase =
    createServerSupabaseClient();

  const {
  data: chunkData,
  error: chunkError,
} = await serverSupabase
  .from("knowledge_chunks")
  .select(
    `
      id,
      document_id,
      organisation_id,
      source_table,
      source_record_id,
      chunk_index,
      heading,
      content,
      metadata
    `
  )
  .eq("organisation_id", organisationId)
  .eq("is_active", true)
  .order("chunk_index", {
    ascending: true,
  });

  if (chunkError) {
    console.error(
      "Error loading HR Resource knowledge:",
      chunkError
    );

    return [];
  }

  const chunks =
    (chunkData || []) as StoredKnowledgeChunk[];

  if (chunks.length === 0) {
    return [];
  }

  const policyRecordIds = Array.from(
    new Set(
      chunks
        .filter(
          (chunk) =>
            chunk.source_table ===
              "policy_register" &&
            typeof chunk.source_record_id ===
              "number"
        )
        .map(
          (chunk) =>
            chunk.source_record_id as number
        )
    )
  );

  if (policyRecordIds.length === 0) {
    return [];
  }

  const {
    data: policyData,
    error: policyError,
  } = await serverSupabase
    .from("policy_register")
    .select("id,name,register_type")
    .in("id", policyRecordIds);

  if (policyError) {
    console.error(
      "Error loading HR Resource records:",
      policyError
    );

    return [];
  }

  const policyRecords =
    (policyData || []) as PolicyRegisterRecord[];

  const searchTerms = normaliseSearchTerms(message);

  const relevantChunks = chunks
    .map((chunk) => {
      const policy = policyRecords.find(
        (record) =>
          chunk.source_table ===
            "policy_register" &&
          record.id === chunk.source_record_id
      );

      if (!policy) {
        return null;
      }

      const heading = chunk.heading || "";

      const searchableText = [
        policy.name,
        policy.register_type,
        heading,
        chunk.content,
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;

      for (const term of searchTerms) {
        if (
          policy.name
            .toLowerCase()
            .includes(term)
        ) {
          score += 30;
        }

        if (
          heading.toLowerCase().includes(term)
        ) {
          score += 25;
        }

        if (searchableText.includes(term)) {
          score += 10;
        }
      }

      const phrase = searchTerms.join(" ");

      if (
        phrase.length > 5 &&
        searchableText.includes(phrase)
      ) {
        score += 40;
      }

      return {
        chunk,
        policy,
        score,
      };
    })
    .filter(
      (
        result
      ): result is {
        chunk: StoredKnowledgeChunk;
        policy: PolicyRegisterRecord;
        score: number;
      } => Boolean(result && result.score > 0)
    )
    .sort(
      (first, second) =>
        second.score - first.score
    )
    .slice(0, 12);

  const policyGroups = new Map<
    number,
    {
      policy: PolicyRegisterRecord;
      sections: StoredPolicySection[];
    }
  >();

  for (const result of relevantChunks) {
    const existing = policyGroups.get(
      result.policy.id
    );

    const section: StoredPolicySection = {
      id: result.chunk.id,

      heading:
        result.chunk.heading ||
        `Section ${result.chunk.chunk_index + 1}`,

      content: result.chunk.content,

      keywords: buildKnowledgeKeywords(
        result.policy.name,
        result.chunk.heading || "",
        result.chunk.content
      ),
    };

    if (existing) {
      existing.sections.push(section);
      continue;
    }

    policyGroups.set(result.policy.id, {
      policy: result.policy,
      sections: [section],
    });
  }

  return Array.from(
    policyGroups.values()
  ).map(({ policy, sections }) => ({
    id: `policy-register-${policy.id}`,

    organisationId,

    title: policy.name,

    category: mapPolicyCategory(
      policy.name,
      policy.register_type
    ),

    summary:
      `Relevant sections retrieved from the organisation's ${policy.name}.`,

    keywords: buildKnowledgeKeywords(
      policy.register_type,
      policy.name,
      sections
        .map((section) => section.heading)
        .join(" ")
    ),

    sections,

    active: true,
  }));
}

function createServerSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured."
    );
  }

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured."
    );
  }

  return createClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function mapPolicyCategory(
  title: string,
  registerType: string
): StoredPolicy["category"] {
  const value =
    `${title} ${registerType}`.toLowerCase();

  if (value.includes("disciplin")) {
    return "disciplinary";
  }

  if (value.includes("grievance")) {
    return "grievance";
  }

  if (
    value.includes("absence") ||
    value.includes("sickness") ||
    value.includes("attendance")
  ) {
    return "absence";
  }

  if (
    value.includes("capability") ||
    value.includes("performance")
  ) {
    return "capability";
  }

  if (
    value.includes("recruit") ||
    value.includes("right to work") ||
    value.includes("dbs")
  ) {
    return "recruitment";
  }

  if (value.includes("flexible working")) {
    return "flexible_working";
  }

  if (
    value.includes("family") ||
    value.includes("maternity") ||
    value.includes("paternity") ||
    value.includes("parental")
  ) {
    return "family_leave";
  }

  if (
    value.includes("equal") ||
    value.includes("discrimination") ||
    value.includes("harassment") ||
    value.includes("bullying")
  ) {
    return "equality";
  }

  if (
    value.includes("health") ||
    value.includes("safety") ||
    value.includes("risk assessment")
  ) {
    return "health_and_safety";
  }

  return "general";
}

function normaliseSearchTerms(
  message: string
): string[] {
  const ignoredWords = new Set([
    "about",
    "after",
    "again",
    "against",
    "also",
    "because",
    "before",
    "being",
    "could",
    "does",
    "from",
    "have",
    "into",
    "should",
    "that",
    "their",
    "there",
    "these",
    "they",
    "this",
    "what",
    "when",
    "where",
    "which",
    "with",
    "would",
    "your",
  ]);

  return Array.from(
    new Set(
      message
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 4 &&
            !ignoredWords.has(word)
        )
    )
  );
}

function mapFoundationType(
  section: string
):
  | "company_profile"
  | "organisation_structure"
  | "employment_framework"
  | "hr_resource"
  | "operational_rule"
  | "approval_route"
  | "compliance_requirement"
  | "internal_practice"
  | "organisation_memory" {
  const normalisedSection =
    section.toLowerCase();

  if (
    normalisedSection.includes(
      "company profile"
    )
  ) {
    return "company_profile";
  }

  if (
    normalisedSection.includes(
      "organisation structure"
    )
  ) {
    return "organisation_structure";
  }

  if (
    normalisedSection.includes(
      "employment framework"
    )
  ) {
    return "employment_framework";
  }

  if (
    normalisedSection.includes(
      "hr resources"
    )
  ) {
    return "hr_resource";
  }

  return "organisation_memory";
}

function buildKnowledgeKeywords(
  section: string,
  key: string,
  value: string
): string[] {
  return Array.from(
    new Set(
      `${section} ${key} ${value}`
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 4)
    )
  );
}