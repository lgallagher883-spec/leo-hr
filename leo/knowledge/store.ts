import { createClient } from "@supabase/supabase-js";
import { KnowledgeChunk } from "./types";

export type StoreKnowledgeChunksInput = {
  documentId: string;
  chunks: KnowledgeChunk[];
  sourceTable?: string | null;
  sourceRecordId?: number | null;
};

export type StoreKnowledgeChunksResult = {
  success: boolean;
  documentId: string;
  storedCount: number;
  error: string | null;
};

function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function storeKnowledgeChunks({
  documentId,
  chunks,
  sourceTable = null,
  sourceRecordId = null,
}: StoreKnowledgeChunksInput): Promise<StoreKnowledgeChunksResult> {
  try {
    if (!documentId.trim()) {
      return {
        success: false,
        documentId,
        storedCount: 0,
        error: "A document ID is required.",
      };
    }

    if (chunks.length === 0) {
      return {
        success: false,
        documentId,
        storedCount: 0,
        error: "There are no knowledge chunks to store.",
      };
    }

    const invalidChunk = chunks.find(
      (chunk) =>
        chunk.documentId !== documentId ||
        !chunk.organisationId.trim() ||
        !chunk.content.trim()
    );

    if (invalidChunk) {
      return {
        success: false,
        documentId,
        storedCount: 0,
        error:
          "One or more knowledge chunks contain invalid document, organisation or content data.",
      };
    }

    const supabase = createServerSupabaseClient();

    const { error: deleteError } = await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      return {
        success: false,
        documentId,
        storedCount: 0,
        error: `Existing knowledge chunks could not be cleared: ${deleteError.message}`,
      };
    }

    const rows = chunks.map((chunk) => ({
      document_id: chunk.documentId,
      organisation_id: chunk.organisationId,
      source_table: sourceTable,
      source_record_id: sourceRecordId,
      chunk_index: chunk.chunkIndex,
      heading: chunk.heading,
      content: chunk.content,
      token_estimate: chunk.tokenEstimate,
      metadata: chunk.metadata,
    }));

    const { error: insertError } = await supabase
      .from("knowledge_chunks")
      .insert(rows);

    if (insertError) {
      return {
        success: false,
        documentId,
        storedCount: 0,
        error: `Knowledge chunks could not be stored: ${insertError.message}`,
      };
    }

    return {
      success: true,
      documentId,
      storedCount: rows.length,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      documentId,
      storedCount: 0,
      error:
        error instanceof Error
          ? error.message
          : "Unknown knowledge storage error.",
    };
  }
}