import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { retrieveKnowledge } from "@/leo/knowledge/retrieve";
import { buildKnowledgeContext } from "@/leo/knowledge/context";
import { mapOrganisationMemoryRecords } from "@/leo/knowledge/organisationMemoryService";
import {
  KnowledgeChunk,
  KnowledgeSourceType,
} from "@/leo/knowledge/types";

export const runtime = "nodejs";

type SearchKnowledgeRequest = {
  organisationId?: string;
  query: string;
  maximumResults?: number;
};

type StoredKnowledgeChunk = {
  id: string;
  document_id: string;
  organisation_id: string;
  source_table: string | null;
  source_record_id: number | null;
  chunk_index: number;
  heading: string | null;
  content: string;
  token_estimate: number | null;
  metadata: Record<string, unknown> | null;
};

type PolicyRegisterRecord = {
  id: number;
  name: string;
  register_type: string;
};

type CompanyDocumentRecord = {
  id: number;
  name: string;
  document_type: string | null;
};

function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!secretKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createAdminClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function requireAuthorisedContext(permissionKey: string) {
  const session = await createSessionClient();

  const {
    data: { user },
    error: userError,
  } = await session.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "You are not signed in." },
        { status: 401 },
      ),
    };
  }

  const admin = createServerSupabaseClient();

  const resolvedRole = await resolveAuthoritativeUserRole(admin as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;

  if (!organisationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (session as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to access knowledge could not be verified.",
        },
        { status: 500 },
      ),
    };
  }

  if (!allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "You do not have permission to access this resource." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    supabase: admin,
    organisationId: String(organisationId),
  };
}

export async function POST(request: Request) {
  try {
    const access = await requireAuthorisedContext("hr_resources.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const body = (await request.json()) as Partial<SearchKnowledgeRequest>;
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "query is required.",
        },
        { status: 400 }
      );
    }

    const maximumResults =
      typeof body.maximumResults === "number"
        ? Math.min(Math.max(body.maximumResults, 1), 20)
        : 8;

    const { data: storedChunks, error: chunksError } = await supabase
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
          token_estimate,
          metadata
        `
      )
 .eq("organisation_id", organisationId)
.eq("is_active", true)
.order("chunk_index", { ascending: true }); 

    if (chunksError) {
      return NextResponse.json(
        {
          success: false,
          error: `Knowledge chunks could not be loaded: ${chunksError.message}`,
        },
        { status: 500 }
      );
    }

    const chunks = (storedChunks || []) as StoredKnowledgeChunk[];

    if (chunks.length === 0) {
      return NextResponse.json({
        success: true,
        query,
        resultCount: 0,
        results: [],
        message: "No knowledge has been stored for this organisation yet.",
      });
    }

    const policyRecordIds = Array.from(
      new Set(
        chunks
          .filter(
            (chunk) =>
              chunk.source_table === "policy_register" &&
              typeof chunk.source_record_id === "number"
          )
          .map((chunk) => chunk.source_record_id as number)
      )
    );

    const companyDocumentIds = Array.from(
      new Set(
        chunks
          .filter(
            (chunk) =>
              chunk.source_table === "company_documents" &&
              typeof chunk.source_record_id === "number"
          )
          .map((chunk) => chunk.source_record_id as number)
      )
    );

    let policyRecords: PolicyRegisterRecord[] = [];
    let companyDocuments: CompanyDocumentRecord[] = [];

    if (policyRecordIds.length > 0) {
      const { data, error } = await supabase
        .from("policy_register")
        .select("id, name, register_type")
        .in("id", policyRecordIds);

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: `Policy resource details could not be loaded: ${error.message}`,
          },
          { status: 500 }
        );
      }

      policyRecords = (data || []) as PolicyRegisterRecord[];
    }

    if (companyDocumentIds.length > 0) {
      const { data, error } = await supabase
        .from("company_documents")
        .select("id, name, document_type")
        .in("id", companyDocumentIds);

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: `Company document details could not be loaded: ${error.message}`,
          },
          { status: 500 }
        );
      }

      companyDocuments = (data || []) as CompanyDocumentRecord[];
    }

    let organisationMemoryRecords: Array<{
      id: string;
      organisation_id: string;
      title: string;
      content: string;
      category: string | null;
      keywords: string[] | null;
      source: string | null;
      status: string | null;
      is_active: boolean;
    }> = [];

    const { data: memoryRows, error: memoryError } = await supabase
      .from("leo_organisation_memory_records")
      .select(
        "id, organisation_id, title, content, category, keywords, source, status, is_active",
      )
      .eq("organisation_id", organisationId)
      .order("updated_at", { ascending: false });

    if (!memoryError) {
      organisationMemoryRecords = Array.isArray(memoryRows)
        ? (memoryRows as Array<{
            id: string;
            organisation_id: string;
            title: string;
            content: string;
            category: string | null;
            keywords: string[] | null;
            source: string | null;
            status: string | null;
            is_active: boolean;
          }>)
        : [];
    }

    const memoryItems = mapOrganisationMemoryRecords(
      organisationMemoryRecords.filter(
        (record) => record.organisation_id === organisationId
      )
    );

    const searchableChunks = chunks.map((chunk) => {
      const policyRecord = policyRecords.find(
        (record) =>
          chunk.source_table === "policy_register" &&
          record.id === chunk.source_record_id
      );

      const companyDocument = companyDocuments.find(
        (record) =>
          chunk.source_table === "company_documents" &&
          record.id === chunk.source_record_id
      );

      const documentTitle =
        policyRecord?.name ||
        companyDocument?.name ||
        chunk.document_id;

      const rawSourceType =
        policyRecord?.register_type ||
        companyDocument?.document_type ||
        "unknown";

      const knowledgeChunk: KnowledgeChunk & {
        documentTitle: string;
        sourceType: KnowledgeSourceType;
      } = {
        id: chunk.id,
        documentId: chunk.document_id,
        organisationId: chunk.organisation_id,
        chunkIndex: chunk.chunk_index,
        heading: chunk.heading,
        content: chunk.content,
        tokenEstimate: chunk.token_estimate,
        metadata: {
          ...(chunk.metadata || {}),
          sourceTable: chunk.source_table,
          sourceRecordId: chunk.source_record_id,
        },
        documentTitle,
        sourceType: toKnowledgeSourceType(rawSourceType),
      };

      return knowledgeChunk;
    });

    const results = retrieveKnowledge(
      {
        organisationId,
        query,
        maximumResults,
      },
      searchableChunks
    );

    const context = buildKnowledgeContext({
      query,
      results,
      sourcesUsed: results.map((result) => ({
        documentId: result.documentId,
        title: result.documentTitle,
        sourceType: result.sourceType,
      })),
      gaps: memoryItems.length
        ? [
            `Organisation memory currently contributes ${memoryItems.length} approved knowledge item${memoryItems.length === 1 ? "" : "s"}.`,
          ]
        : [],
    });

    return NextResponse.json({
      success: true,
      query,
      resultCount: results.length,
      results,
      organisationMemoryCount: memoryItems.length,
      context,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown knowledge search error.",
      },
      { status: 500 }
    );
  }
}

function toKnowledgeSourceType(value: string): KnowledgeSourceType {
  const normalised = value
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

  const supportedTypes: KnowledgeSourceType[] = [
    "foundation",
    "policy",
    "procedure",
    "contract",
    "handbook",
    "template",
    "form",
    "risk_assessment",
    "training",
    "guidance",
    "register",
    "organisation_memory",
    "legislation",
    "acas",
    "regulator",
    "matter",
    "employee",
    "unknown",
  ];

  if (
    supportedTypes.includes(
      normalised as KnowledgeSourceType
    )
  ) {
    return normalised as KnowledgeSourceType;
  }

  return "unknown";
}
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      {
        success: false,
        error: "Add a search using ?q=your search words",
      },
      { status: 400 }
    );
  }

  const internalRequest = new Request(request.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      maximumResults: 5,
    }),
  });

  return POST(internalRequest);
}