import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { processKnowledgeDocument } from "@/leo/knowledge/processor";
import { storeKnowledgeChunks } from "@/leo/knowledge/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProcessDocumentRequest = {
  documentId: string;
  organisationId?: string;
  fileName: string;
  filePath?: string;
  sourceTable?: "policy_register" | "company_documents" | null;
  sourceRecordId?: number | null;
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
        {
          success: false,
          error: "You do not have permission to access this resource.",
        },
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

async function loadOwnedSourceResource(args: {
  supabase: ReturnType<typeof createServerSupabaseClient>;
  organisationId: string;
  sourceTable: "policy_register" | "company_documents";
  sourceRecordId: number;
}) {
  const { supabase, organisationId, sourceTable, sourceRecordId } = args;

  const { data, error } = await supabase
    .from(sourceTable)
    .select("id, file_name, file_path")
    .eq("id", sourceRecordId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      error: error.message,
      status: 500,
    };
  }

  if (!data) {
    return {
      ok: false as const,
      error: "The resource could not be found.",
      status: 404,
    };
  }

  if (!data.file_path) {
    return {
      ok: false as const,
      error: "The resource does not have a stored file path.",
      status: 400,
    };
  }

  return {
    ok: true as const,
    fileName: data.file_name as string | null,
    filePath: data.file_path as string,
  };
}

export async function POST(request: Request) {
  try {
    const access = await requireAuthorisedContext("hr_resources.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access;
    const body = (await request.json()) as Partial<ProcessDocumentRequest>;

    const documentId = body.documentId?.trim();
    const fileName = body.fileName?.trim();

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: "documentId is required.",
        },
        { status: 400 },
      );
    }

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          error: "fileName is required.",
        },
        { status: 400 },
      );
    }

    const sourceTable = body.sourceTable ?? null;
    const sourceRecordId =
      typeof body.sourceRecordId === "number" ? body.sourceRecordId : null;

    if (
      sourceTable !== "policy_register" &&
      sourceTable !== "company_documents"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid source table is required.",
        },
        { status: 400 },
      );
    }

    if (sourceRecordId === null || !Number.isFinite(sourceRecordId)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid source record ID is required.",
        },
        { status: 400 },
      );
    }

    const resource = await loadOwnedSourceResource({
      supabase,
      organisationId,
      sourceTable,
      sourceRecordId,
    });

    if (!resource.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resource.error,
        },
        { status: resource.status },
      );
    }

    const bucket =
      sourceTable === "policy_register"
        ? "policy-documents"
        : "company-documents";

    const downloadResult = await supabase.storage
      .from(bucket)
      .download(resource.filePath);

    if (downloadResult.error || !downloadResult.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            downloadResult.error?.message ||
            "The stored file could not be downloaded.",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await downloadResult.data.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const trustedFileName = resource.fileName?.trim() || fileName;

    const processResult = await processKnowledgeDocument({
      documentId,
      organisationId,
      fileName: trustedFileName,
      fileBuffer,
    });

    if (!processResult.success) {
      return NextResponse.json(
        {
          success: false,
          stage: "processing",
          documentId,
          warnings: processResult.warnings,
          error:
            processResult.error ||
            "The resource could not be processed.",
        },
        { status: 400 },
      );
    }

    const storeResult = await storeKnowledgeChunks({
      documentId,
      chunks: processResult.chunks,
      sourceTable,
      sourceRecordId,
    });

    if (!storeResult.success) {
      return NextResponse.json(
        {
          success: false,
          stage: "storage",
          documentId,
          extractedTextLength:
            processResult.readResult?.text.length || 0,
          generatedChunkCount: processResult.chunks.length,
          warnings: processResult.warnings,
          error:
            storeResult.error ||
            "The knowledge chunks could not be stored.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "The resource was read and added to LEO Knowledge.",
      documentId,
      fileName: trustedFileName,
      extractedTextLength:
        processResult.readResult?.text.length || 0,
      generatedChunkCount: processResult.chunks.length,
      storedChunkCount: storeResult.storedCount,
      warnings: processResult.warnings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown document processing error.",
      },
      { status: 500 },
    );
  }
}