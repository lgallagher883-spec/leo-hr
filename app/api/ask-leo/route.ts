import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { runAuthorityEngine } from "@/leo/authority/router";
import { buildConversationPlan } from "@/leo/conversation/conversationEngine";
import { buildConversationPrompt } from "@/leo/conversation/conversationPrompt";
import { runLeoCore } from "@/leo/core/router";
import { searchKnowledge } from "@/leo/knowledge";
import {
  StoredPolicy,
  StoredPolicySection,
} from "@/leo/knowledge/storage/policies";
import { buildLeoPrompt } from "@/leo/prompt/builder™";
import { runLeoReasoning } from "@/leo/reasoning/reasoner";
import { buildResponseArchitecture } from "@/leo/response/responseArchitecture";
import { buildResponsePrompt } from "@/leo/response/responsePrompt";
import { runProfessionalThinking } from "@/leo/thinking/model";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

type ConversationMessage = {
  role: "user" | "leo";
  content: string;
};

type AskLeoRequestBody = {
  message?: unknown;
  latestMessage?: unknown;
  conversationId?: unknown;
  requestId?: unknown;
  conversation?: unknown;
  contextType?: unknown;
  activeMatterId?: unknown;
  matter?: unknown;
  contextSummary?: unknown;
  policies?: unknown;
  organisationMemory?: unknown;
  previousMatters?: unknown;
};

type MatterContextPayload = {
  id: number | null;
  title: string;
  description: string;
  status: string;
  matterType: string;
  subject: string;
};

type AskLeoConversationRow = {
  id: number;
  title: string;
  converted_to_matter_id: number | null;
  converted_to_matter_at: string | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be signed in to use Ask Leo.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: organisationId,
      error: organisationError,
    } = await supabase.rpc("leo_current_organisation_id");

    if (
      organisationError ||
      typeof organisationId !== "string" ||
      !organisationId.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Your active organisation could not be resolved.",
        },
        {
          status: 403,
        }
      );
    }

    const body = (await req.json()) as AskLeoRequestBody;

    const latestMessage =
      typeof body.latestMessage === "string"
        ? body.latestMessage.trim()
        : "";

    const message =
      latestMessage ||
      (typeof body.message === "string"
        ? body.message.trim()
        : "");

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

    const conversation = normaliseConversation(
      body.conversation
    );

    const contextType =
      typeof body.contextType === "string"
        ? body.contextType
            .trim()
            .toLowerCase()
        : "general";

    const activeMatterId = readMatterId(
      body.activeMatterId
    );

    const providedConversationId =
      readConversationId(body.conversationId);

    const requestId = readRequestId(
      body.requestId
    );

    const matterContext = normaliseMatterContext(
      body.matter,
      activeMatterId
    );

    const contextSummary =
      typeof body.contextSummary === "string"
        ? body.contextSummary.trim()
        : "";

    const shouldPersistConversation =
      contextType !== "matter" &&
      !activeMatterId;

    let persistedConversationId: number | null =
      null;

    let userMessageAlreadyStored = false;

    if (shouldPersistConversation) {
      const ensuredConversation =
        await ensureAskLeoConversation({
          supabase,
          organisationId,
          userId: user.id,
          conversationId:
            providedConversationId,
          firstMessage: message,
        });

      if (
        "error" in
        ensuredConversation
      ) {
        return NextResponse.json(
          {
            error:
              ensuredConversation.error,
          },
          {
            status:
              ensuredConversation.status,
          }
        );
      }

      const currentConversationId =
        ensuredConversation.conversation.id;

      persistedConversationId =
        currentConversationId;

      if (requestId) {
        const dedupeResult =
          await getAskLeoRequestReplay({
            supabase,
            conversationId:
              currentConversationId,
            requestId,
          });

        if (dedupeResult.error) {
          return NextResponse.json(
            {
              error:
                dedupeResult.error,
            },
            { status: 500 }
          );
        }

        if (dedupeResult.response) {
          return createReplayStreamResponse({
            response: dedupeResult.response,
            conversationId: persistedConversationId,
          });
        }

        userMessageAlreadyStored =
          dedupeResult.userMessageExists;
      }

      if (!userMessageAlreadyStored) {
        const saveUserMessageResult =
          await saveAskLeoConversationMessage({
            supabase,
            conversationId:
              currentConversationId,
            organisationId,
            userId: user.id,
            role: "user",
            content: message,
            requestId,
          });

        if (
          saveUserMessageResult.error &&
          !saveUserMessageResult.isDuplicate
        ) {
          return NextResponse.json(
            {
              error:
                "Leo could not save your Ask Leo message.",
            },
            {
              status: 500,
            }
          );
        }
      }
    }

    /*
     * 1. PROFESSIONAL THINKING
     */

    const thinkingResult =
      runProfessionalThinking(message);

    /*
     * 2. LEO CORE
     */

    const coreMessage = [
      matterContext.id
        ? `Matter context is active for Matter ${matterContext.id}.`
        : "",
      message,
    ]
      .filter(Boolean)
      .join("\n\n");

    const coreResult = runLeoCore(coreMessage);

    /*
     * 3. PROFESSIONAL REASONING
     */

    const reasoningResult = runLeoReasoning(
      coreResult,
      coreMessage
    );

    /*
     * 4. AUTHORITY ENGINE
     */

    const authorityResult =
      await runAuthorityEngine({
        message,
        intent: coreResult.intent,
        risk: coreResult.risk.overall,
        classification: coreResult.decision,
        professionalReasoning:
          reasoningResult,
      });

    /*
     * 5. FOUNDATIONS
     */

    const {
      data: foundationRows,
      error: foundationError,
    } = await supabase
      .from("organisation_foundations")
      .select("section,key,value,source")
      .eq("organisation_id", organisationId);

    if (foundationError) {
      console.error(
        "Error loading organisation foundations:",
        foundationError
      );
    }

    const organisationKnowledge =
      foundationRows?.map(
        (row, index) => ({
          id: `${row.section}-${row.key}-${index}`,
          type: mapFoundationType(
            row.section
          ),
          title: row.key,
          content: row.value,
          keywords: buildKnowledgeKeywords(
            row.section,
            row.key,
            row.value
          ),
          source: "foundation" as const,
          active: true,
        })
      ) ?? [];

    /*
     * 6. HR RESOURCE DOCUMENT KNOWLEDGE
     */

    const documentPolicies =
      await loadRelevantDocumentPolicies(
        message,
        organisationId,
        supabase
      );

    /*
     * 7. EXISTING SUPPLIED KNOWLEDGE
     */

    const suppliedPolicies: StoredPolicy[] =
      Array.isArray(body.policies)
        ? body.policies
        : [];

    /*
     * 8. LEO KNOWLEDGE
     */

    const organisationMemory = Array.isArray(
      body.organisationMemory
    )
      ? body.organisationMemory
      : [];

    const knowledgeResult = searchKnowledge({
      message,

      organisationMemory,

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
     * 9. CONVERSATION INTELLIGENCE
     */

    const conversationPlan =
      buildConversationPlan({
        message,
        thinking: thinkingResult,
      });

    const conversationPrompt =
      buildConversationPrompt({
        plan: conversationPlan,
      });

    /*
     * 10. RESPONSE ARCHITECTURE
     */

    const responseArchitecture =
      buildResponseArchitecture({
        message,
        conversationPlan,
      });

    const responsePrompt =
      buildResponsePrompt({
        architecture:
          responseArchitecture,
      });

    /*
     * 11. PROMPT BUILDER
     */

    const leoPrompt = buildLeoPrompt(
      thinkingResult,
      coreResult,
      reasoningResult,
      authorityResult,
      knowledgeResult,
      conversationPlan,
      conversationPrompt,
      responsePrompt
    );

    /*
     * 12. OPENAI
     */

    const promptContext =
      buildPromptContextEnvelope({
        latestMessage: message,
        conversation,
        contextType,
        matter: matterContext,
        contextSummary,
      });

    const matterRecommendation =
      evaluateMatterRecommendation({
        latestMessage: message,
        contextType,
        activeMatterId,
        coreRequiresMatter:
          coreResult.requiresMatter,
        intent: coreResult.intent,
        overallRisk:
          coreResult.risk.overall,
        missingInformationCount:
          reasoningResult
            .missingInformation.length,
      });

    const documentKnowledge = {
      policyCount: documentPolicies.length,
      sectionCount: documentPolicies.reduce(
        (total, policy) =>
          total + policy.sections.length,
        0
      ),
      sources: documentPolicies.map(
        (policy) => policy.title
      ),
    };

    const completionStream =
      await client.chat.completions.create(
        {
          model: "gpt-4o-mini",
          temperature: 0.4,
          stream: true,
          messages: [
            {
              role: "system",
              content: leoPrompt,
            },
            {
              role: "user",
              content: promptContext,
            },
          ],
        }
      );

    const encoder = new TextEncoder();

    const responseStream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        const sendEvent = (payload: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`${JSON.stringify(payload)}\n`)
          );
        };

        try {
          sendEvent({
            type: "meta",
            conversationId: persistedConversationId,
          });

          for await (const chunk of completionStream) {
            const delta =
              chunk.choices[0]?.delta?.content || "";

            if (!delta) {
              continue;
            }

            fullResponse += delta;
            sendEvent({
              type: "delta",
              delta,
            });
          }

          if (!fullResponse.trim()) {
            fullResponse =
              "Leo was unable to generate a response.";

            sendEvent({
              type: "delta",
              delta: fullResponse,
            });
          }

          if (
            shouldPersistConversation &&
            persistedConversationId
          ) {
            const saveLeoMessageResult =
              await saveAskLeoConversationMessage({
                supabase,
                conversationId:
                  persistedConversationId,
                organisationId,
                userId: user.id,
                role: "leo",
                content: fullResponse,
                requestId,
              });

            if (
              saveLeoMessageResult.error &&
              !saveLeoMessageResult.isDuplicate
            ) {
              console.error(
                "Ask Leo reply could not be persisted:",
                saveLeoMessageResult.error
              );
            }

            const nowIso =
              new Date().toISOString();

            const { error: conversationUpdateError } =
              await supabase
                .from("ask_leo_conversations")
                .update({
                  last_message_preview:
                    buildConversationPreview(
                      fullResponse
                    ),
                  last_message_at: nowIso,
                  updated_at: nowIso,
                })
                .eq(
                  "id",
                  persistedConversationId
                )
                .eq(
                  "organisation_id",
                  organisationId
                )
                .eq("user_id", user.id);

            if (conversationUpdateError) {
              console.error(
                "Ask Leo conversation metadata could not be updated:",
                conversationUpdateError
              );
            }
          }

          console.log(
            "LEO CONVERSATION PLAN:",
            conversationPlan
          );

          sendEvent({
            type: "done",
            conversationId: persistedConversationId,
            shouldCreateMatter:
              matterRecommendation.shouldRecommend,
            matterRecommendationReason:
              matterRecommendation.reason,
            documentKnowledge,
          });

          controller.close();
        } catch (streamError) {
          console.error(
            "Ask Leo streaming error:",
            streamError
          );

          sendEvent({
            type: "error",
            error:
              "Leo could not complete the response.",
          });
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      status: 200,
      headers: {
        "Content-Type":
          "application/x-ndjson; charset=utf-8",
        "Cache-Control":
          "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error(
      "Ask Leo API error:",
      error
    );

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

function createReplayStreamResponse(input: {
  response: string;
  conversationId: number | null;
}) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `${JSON.stringify({
            type: "meta",
            conversationId: input.conversationId,
          })}\n`
        )
      );

      controller.enqueue(
        encoder.encode(
          `${JSON.stringify({
            type: "delta",
            delta: input.response,
          })}\n`
        )
      );

      controller.enqueue(
        encoder.encode(
          `${JSON.stringify({
            type: "done",
            conversationId: input.conversationId,
            shouldCreateMatter: false,
            matterRecommendationReason:
              "Conversation replayed from saved history.",
            documentKnowledge: {
              policyCount: 0,
              sectionCount: 0,
              sources: [],
            },
          })}\n`
        )
      );

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type":
        "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function loadRelevantDocumentPolicies(
  message: string,
  organisationId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<StoredPolicy[]> {
  const {
    data: chunkData,
    error: chunkError,
  } = await supabase
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
    .eq(
      "organisation_id",
      organisationId
    )
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
    (chunkData ||
      []) as StoredKnowledgeChunk[];

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
  } = await supabase
    .from("policy_register")
    .select(
      "id,name,register_type"
    )
    // policy_register has no organisation_id column in schema.
    // Safety is enforced by restricting lookup IDs to those derived from
    // organisation-scoped knowledge_chunks above.
    .in("id", policyRecordIds);

  if (policyError) {
    console.error(
      "Error loading HR Resource records:",
      policyError
    );

    return [];
  }

  const policyRecords =
    (policyData ||
      []) as PolicyRegisterRecord[];

  const searchTerms =
    normaliseSearchTerms(message);

  const relevantChunks = chunks
    .map((chunk) => {
      const policy =
        policyRecords.find(
          (record) =>
            chunk.source_table ===
              "policy_register" &&
            record.id ===
              chunk.source_record_id
        );

      if (!policy) {
        return null;
      }

      const heading =
        chunk.heading || "";

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
          heading
            .toLowerCase()
            .includes(term)
        ) {
          score += 25;
        }

        if (
          searchableText.includes(term)
        ) {
          score += 10;
        }
      }

      const phrase =
        searchTerms.join(" ");

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
      } =>
        Boolean(
          result && result.score > 0
        )
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
    const existing =
      policyGroups.get(
        result.policy.id
      );

    const section: StoredPolicySection =
      {
        id: result.chunk.id,

        heading:
          result.chunk.heading ||
          `Section ${
            result.chunk.chunk_index +
            1
          }`,

        content:
          result.chunk.content,

        keywords:
          buildKnowledgeKeywords(
            result.policy.name,
            result.chunk.heading || "",
            result.chunk.content
          ),
      };

    if (existing) {
      existing.sections.push(section);
      continue;
    }

    policyGroups.set(
      result.policy.id,
      {
        policy: result.policy,
        sections: [section],
      }
    );
  }

  return Array.from(
    policyGroups.values()
  ).map(
    ({ policy, sections }) => ({
      id: `policy-register-${policy.id}`,

      organisationId,

      title: policy.name,

      category: mapPolicyCategory(
        policy.name,
        policy.register_type
      ),

      summary:
        `Relevant sections retrieved from the organisation's ${policy.name}.`,

      keywords:
        buildKnowledgeKeywords(
          policy.register_type,
          policy.name,
          sections
            .map(
              (section) =>
                section.heading
            )
            .join(" ")
        ),

      sections,

      active: true,
    })
  );
}

function mapPolicyCategory(
  title: string,
  registerType: string
): StoredPolicy["category"] {
  const value =
    `${title} ${registerType}`.toLowerCase();

  if (
    value.includes("disciplin")
  ) {
    return "disciplinary";
  }

  if (
    value.includes("grievance")
  ) {
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
    value.includes(
      "right to work"
    ) ||
    value.includes("dbs")
  ) {
    return "recruitment";
  }

  if (
    value.includes(
      "flexible working"
    )
  ) {
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
    value.includes(
      "discrimination"
    ) ||
    value.includes("harassment") ||
    value.includes("bullying")
  ) {
    return "equality";
  }

  if (
    value.includes("health") ||
    value.includes("safety") ||
    value.includes(
      "risk assessment"
    )
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
        .replace(
          /[^\p{L}\p{N}\s]/gu,
          " "
        )
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
        .replace(
          /[^\p{L}\p{N}\s]/gu,
          " "
        )
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 4
        )
    )
  );
}

function normaliseConversation(
  value: unknown
): ConversationMessage[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (
          !item ||
          typeof item !== "object"
        ) {
          return null;
        }

        const role =
          (item as { role?: unknown }).role;

        const content =
          (item as { content?: unknown })
            .content;

        if (
          (role !== "user" &&
            role !== "leo") ||
          typeof content !== "string"
        ) {
          return null;
        }

        const trimmed = content.trim();

        if (!trimmed) {
          return null;
        }

        return {
          role,
          content: trimmed,
        } as ConversationMessage;
      })
      .filter(
        (
          item
        ): item is ConversationMessage =>
          Boolean(item)
      )
      .slice(-14);
}

function readMatterId(
  value: unknown
): number | null {
    const parsed = Number(value);

    return Number.isInteger(parsed) &&
      parsed > 0
      ? parsed
      : null;
}

function normaliseMatterContext(
  value: unknown,
  fallbackMatterId: number | null
): MatterContextPayload {
    if (!value || typeof value !== "object") {
      return {
        id: fallbackMatterId,
        title: "",
        description: "",
        status: "",
        matterType: "",
        subject: "",
      };
    }

    const payload = value as {
      id?: unknown;
      title?: unknown;
      description?: unknown;
      status?: unknown;
      matterType?: unknown;
      subject?: unknown;
    };

    return {
      id:
        readMatterId(payload.id) ||
        fallbackMatterId,
      title:
        typeof payload.title === "string"
          ? payload.title.trim()
          : "",
      description:
        typeof payload.description ===
        "string"
          ? payload.description.trim()
          : "",
      status:
        typeof payload.status === "string"
          ? payload.status.trim()
          : "",
      matterType:
        typeof payload.matterType ===
        "string"
          ? payload.matterType.trim()
          : "",
      subject:
        typeof payload.subject === "string"
          ? payload.subject.trim()
          : "",
    };
}

function buildPromptContextEnvelope(input: {
  latestMessage: string;
  conversation: ConversationMessage[];
  contextType: string;
  matter: MatterContextPayload;
  contextSummary: string;
}): string {
    const conversationSummary =
      input.conversation.length > 0
        ? input.conversation
            .map(
              (item) =>
                `${
                  item.role === "leo"
                    ? "Leo"
                    : "Employer"
                }: ${item.content}`
            )
            .join("\n\n")
        : "No prior conversation context supplied.";

    const matterLines =
      input.matter.id
        ? [
            `Matter ID: ${input.matter.id}`,
            `Matter title: ${input.matter.title || "Not recorded"}`,
            `Matter subject: ${input.matter.subject || "Not recorded"}`,
            `Matter type: ${input.matter.matterType || "Not recorded"}`,
            `Matter status: ${input.matter.status || "Not recorded"}`,
            `Matter description: ${input.matter.description || "Not recorded"}`,
          ].join("\n")
        : "No active Matter context provided.";

    return [
      "Use the context below to answer as Leo.",
      "",
      `Context type: ${input.contextType || "general"}`,
      "",
      "ACTIVE MATTER CONTEXT",
      matterLines,
      "",
      "CONVERSATION CONTEXT",
      conversationSummary,
      input.contextSummary
        ? "\nADDITIONAL CONTEXT\n" +
          input.contextSummary
        : "",
      "",
      "LATEST EMPLOYER MESSAGE",
      input.latestMessage,
    ]
      .filter(Boolean)
      .join("\n");
}

function evaluateMatterRecommendation(input: {
  latestMessage: string;
  contextType: string;
  activeMatterId: number | null;
  coreRequiresMatter: boolean;
  intent: string;
  overallRisk:
    | "low"
    | "medium"
    | "high"
    | "critical";
  missingInformationCount: number;
}): {
  shouldRecommend: boolean;
  reason: string;
} {
    if (
      input.activeMatterId ||
      input.contextType === "matter"
    ) {
      return {
        shouldRecommend: false,
        reason:
          "Conversation is already within an active Matter.",
      };
    }

    const text =
      input.latestMessage.toLowerCase();

    const informationalSignals = [
      "what is",
      "what are",
      "can you explain",
      "how does",
      "policy",
      "guidance",
      "general",
    ];

    const caseManagementSignals = [
      "employee relations",
      "investigation",
      "disciplinary",
      "grievance",
      "capability",
      "absence",
      "long-term absence",
      "long term absence",
      "safeguarding",
      "compliance risk",
      "evidence",
      "hearing",
      "appeal",
      "dismiss",
      "terminate",
      "tribunal",
      "redundancy",
      "whistleblowing",
      "harassment",
      "discrimination",
    ];

    const continuitySignals = [
      "ongoing",
      "escalating",
      "formal",
      "written warning",
      "final warning",
      "chronology",
      "timeline",
      "record",
      "witness",
      "meeting",
      "appeal",
      "already raised",
      "again",
    ];

    const looksInformational =
      informationalSignals.some((term) =>
        text.includes(term)
      ) &&
      !caseManagementSignals.some((term) =>
        text.includes(term)
      ) &&
      input.overallRisk === "low";

    if (looksInformational) {
      return {
        shouldRecommend: false,
        reason:
          "Query appears informational and does not currently require structured case management.",
      };
    }

    const caseSignalCount =
      caseManagementSignals.filter((term) =>
        text.includes(term)
      ).length;

    const continuitySignalCount =
      continuitySignals.filter((term) =>
        text.includes(term)
      ).length;

    const highSuitabilityIntent = [
      "disciplinary",
      "grievance",
      "termination",
      "redundancy",
    ].includes(input.intent);

    const likelyERCase =
      input.overallRisk === "critical" ||
      input.overallRisk === "high" ||
      input.coreRequiresMatter ||
      highSuitabilityIntent ||
      caseSignalCount >= 2;

    const likelyOngoingCaseManagement =
      continuitySignalCount >= 1 ||
      input.overallRisk !== "low" ||
      input.missingInformationCount >= 4;

    const shouldRecommend =
      likelyERCase &&
      likelyOngoingCaseManagement;

    return shouldRecommend
      ? {
          shouldRecommend: true,
          reason:
            "A structured Matter record would support ongoing risk management, chronology and formal process continuity.",
        }
      : {
          shouldRecommend: false,
          reason:
            "Conversation can continue as general Ask Leo guidance at this stage.",
        };
}

function readConversationId(
  value: unknown
): number | null {
    const parsed = Number(value);

    return Number.isInteger(parsed) &&
      parsed > 0
      ? parsed
      : null;
}

function readRequestId(
  value: unknown
): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    return trimmed.slice(0, 100);
}

function buildConversationTitle(
  message: string
): string {
  const singleLine = message
    .replace(/\s+/g, " ")
    .trim();

  if (!singleLine) {
    return "New Ask Leo conversation";
  }

  return singleLine.length > 90
    ? `${singleLine.slice(0, 87)}...`
    : singleLine;
}

function buildConversationPreview(
  content: string
): string {
  const singleLine = content
    .replace(/\s+/g, " ")
    .trim();

  if (!singleLine) {
    return "";
  }

  return singleLine.length > 180
    ? `${singleLine.slice(0, 177)}...`
    : singleLine;
}

async function ensureAskLeoConversation(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
  userId: string;
  conversationId: number | null;
  firstMessage: string;
}): Promise<
  | {
      conversation: AskLeoConversationRow;
    }
  | {
      error: string;
      status: number;
    }
> {
  if (input.conversationId) {
    const { data, error } = await input.supabase
      .from("ask_leo_conversations")
      .select(
        "id,title,converted_to_matter_id,converted_to_matter_at"
      )
      .eq("id", input.conversationId)
      .eq(
        "organisation_id",
        input.organisationId
      )
      .eq("user_id", input.userId)
      .maybeSingle();

    if (error) {
      console.error(
        "Ask Leo conversation lookup failed:",
        error
      );

      return {
        error:
          "The Ask Leo conversation could not be verified.",
        status: 500,
      };
    }

    if (!data) {
      return {
        error:
          "The Ask Leo conversation could not be found.",
        status: 404,
      };
    }

    if (data.converted_to_matter_at) {
      return {
        error:
          "This Ask Leo conversation has already been converted to a Matter.",
        status: 409,
      };
    }

    return {
      conversation:
        data as AskLeoConversationRow,
    };
  }

  const nowIso = new Date().toISOString();

  const { data, error } =
    await input.supabase
      .from("ask_leo_conversations")
      .insert({
        organisation_id:
          input.organisationId,
        user_id: input.userId,
        title: buildConversationTitle(
          input.firstMessage
        ),
        last_message_preview:
          buildConversationPreview(
            input.firstMessage
          ),
        last_message_at: nowIso,
        updated_at: nowIso,
      })
      .select(
        "id,title,converted_to_matter_id,converted_to_matter_at"
      )
      .single();

  if (error || !data) {
    console.error(
      "Ask Leo conversation creation failed:",
      error
    );

    return {
      error:
        "Leo could not start a saved conversation.",
      status: 500,
    };
  }

  return {
    conversation:
      data as AskLeoConversationRow,
  };
}

async function getAskLeoRequestReplay(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  conversationId: number;
  requestId: string;
}): Promise<{
  userMessageExists: boolean;
  response: string | null;
  error?: string;
}> {
  const { data: userMessage, error: userMessageError } =
    await input.supabase
      .from("ask_leo_conversation_messages")
      .select("id")
      .eq(
        "conversation_id",
        input.conversationId
      )
      .eq("role", "user")
      .eq(
        "client_message_id",
        input.requestId
      )
      .maybeSingle();

  if (userMessageError) {
    console.error(
      "Ask Leo dedupe user lookup failed:",
      userMessageError
    );

    return {
      userMessageExists: false,
      response: null,
      error:
        "Leo could not verify conversation replay state.",
    };
  }

  if (!userMessage) {
    return {
      userMessageExists: false,
      response: null,
    };
  }

  const { data: leoMessage, error: leoMessageError } =
    await input.supabase
      .from("ask_leo_conversation_messages")
      .select("content")
      .eq(
        "conversation_id",
        input.conversationId
      )
      .eq("role", "leo")
      .eq(
        "client_message_id",
        input.requestId
      )
      .maybeSingle();

  if (leoMessageError) {
    console.error(
      "Ask Leo dedupe reply lookup failed:",
      leoMessageError
    );

    return {
      userMessageExists: true,
      response: null,
      error:
        "Leo could not verify replay response state.",
    };
  }

  return {
    userMessageExists: true,
    response:
      typeof leoMessage?.content ===
      "string"
        ? leoMessage.content
        : null,
  };
}

async function saveAskLeoConversationMessage(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  conversationId: number;
  organisationId: string;
  userId: string;
  role: "user" | "leo";
  content: string;
  requestId: string | null;
}): Promise<{
  isDuplicate: boolean;
  error?: unknown;
}> {
  const { error } =
    await input.supabase
      .from("ask_leo_conversation_messages")
      .insert({
        conversation_id:
          input.conversationId,
        organisation_id:
          input.organisationId,
        user_id: input.userId,
        role: input.role,
        content: input.content,
        client_message_id:
          input.requestId,
      });

  if (!error) {
    return {
      isDuplicate: false,
    };
  }

  const maybeCode =
    (error as {
      code?: string;
    }).code;

  if (maybeCode === "23505") {
    return {
      isDuplicate: true,
    };
  }

  console.error(
    "Ask Leo conversation message save failed:",
    error
  );

  return {
    isDuplicate: false,
    error,
  };
}