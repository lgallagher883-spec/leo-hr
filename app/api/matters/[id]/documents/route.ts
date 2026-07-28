import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MATTER_DOCUMENTS_BUCKET = "matter-documents";
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreateDocumentBody = {
  title?: unknown;
  documentType?: unknown;
  description?: unknown;
  source?: unknown;
  status?: unknown;
  fileName?: unknown;
  storagePath?: unknown;
  mimeType?: unknown;
  fileSizeBytes?: unknown;
  content?: unknown;
  includeInBundle?: unknown;
  documentGroupId?: unknown;
};

const documentSelect = [
  "id",
  "matter_id",
  "document_group_id",
  "version_number",
  "title",
  "document_type",
  "description",
  "source",
  "status",
  "file_name",
  "storage_path",
  "mime_type",
  "file_size_bytes",
  "content",
  "include_in_bundle",
  "created_by",
  "created_at",
  "updated_at",
].join(",");

const allowedSources = new Set([
  "uploaded",
  "leo_generated",
  "user_created",
  "system_generated",
]);

const allowedStatuses = new Set([
  "Draft",
  "Final",
  "Superseded",
  "Archived",
]);

function readMatterId(id: string): number | null {
  const matterId = Number(id);
  return Number.isInteger(matterId) && matterId > 0 ? matterId : null;
}

function readRequiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(value: unknown): string | null {
  const text = readRequiredText(value);
  return text || null;
}

function readFileSize(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

function safeFileName(fileName: string): string {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-() ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 180);

  return cleaned || "document";
}

async function requirePermission(permissionKey: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    console.error("Matter-document permission could not be checked:", permissionError);

    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to use Matter documents could not be verified.",
        },
        { status: 500 },
      ),
    };
  }

  if (!allowed) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have permission to perform this action.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    user,
    organisationId: String(organisationId),
  };
}

async function verifyMatterAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matterId: number,
) {
  const { data, error } = await supabase
    .from("matters")
    .select("id")
    .eq("id", matterId)
    .maybeSingle();

  if (error) {
    console.error("Matter could not be checked for document access:", error);
    return { error: "The Matter could not be verified." };
  }

  if (!data) {
    return { error: "The Matter could not be found or accessed." };
  }

  return { matter: data };
}

async function getNextVersionNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matterId: number,
  documentGroupId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("matter_documents")
    .select("version_number")
    .eq("matter_id", matterId)
    .eq("document_group_id", documentGroupId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(
      error.message || "The next document version could not be determined.",
    );
  }

  return (data?.[0]?.version_number ?? 0) + 1;
}

async function createDocumentRecord(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  matterId: number;
  title: string;
  documentType: string;
  description: string | null;
  source: string;
  status: string;
  fileName: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  content: string | null;
  includeInBundle: boolean;
  documentGroupId: string | null;
}) {
  const {
    supabase,
    userId,
    matterId,
    title,
    documentType,
    description,
    source,
    status,
    fileName,
    storagePath,
    mimeType,
    fileSizeBytes,
    content,
    includeInBundle,
    documentGroupId,
  } = args;

  const versionNumber = documentGroupId
    ? await getNextVersionNumber(supabase, matterId, documentGroupId)
    : 1;

  const insertValues: Record<string, unknown> = {
    matter_id: matterId,
    version_number: versionNumber,
    title,
    document_type: documentType,
    description,
    source,
    status,
    file_name: fileName,
    storage_path: storagePath,
    mime_type: mimeType,
    file_size_bytes: fileSizeBytes,
    content,
    include_in_bundle: includeInBundle,
    created_by: userId,
  };

  if (documentGroupId) {
    insertValues.document_group_id = documentGroupId;
  }

  return supabase
    .from("matter_documents")
    .insert(insertValues)
    .select(documentSelect)
    .single();
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json(
      { success: false, error: "The Matter reference is invalid." },
      { status: 400 },
    );
  }

  const access = await requirePermission("matters.view");
  if (access.response) return access.response;

  const { supabase } = access;
  const matterAccess = await verifyMatterAccess(supabase, matterId);

  if (matterAccess.error) {
    return NextResponse.json(
      { success: false, error: matterAccess.error },
      { status: matterAccess.error.includes("found") ? 404 : 500 },
    );
  }

  const { data, error } = await supabase
    .from("matter_documents")
    .select(documentSelect)
    .eq("matter_id", matterId)
    .order("created_at", { ascending: false })
    .order("version_number", { ascending: false });

  if (error) {
    console.error("Matter documents could not be loaded:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "The Matter documents could not be loaded.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    documents: data ?? [],
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json(
      { success: false, error: "The Matter reference is invalid." },
      { status: 400 },
    );
  }

  const access = await requirePermission("matters.update");
  if (access.response) return access.response;

  const { supabase, user, organisationId } = access;
  const matterAccess = await verifyMatterAccess(supabase, matterId);

  if (matterAccess.error) {
    return NextResponse.json(
      { success: false, error: matterAccess.error },
      { status: matterAccess.error.includes("found") ? 404 : 500 },
    );
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    let storagePath: string | null = null;

    try {
      const formData = await request.formData();
      const fileValue = formData.get("file");

      if (!(fileValue instanceof File)) {
        return NextResponse.json(
          { success: false, error: "Choose a file to upload." },
          { status: 400 },
        );
      }

      if (fileValue.size <= 0) {
        return NextResponse.json(
          { success: false, error: "The selected file is empty." },
          { status: 400 },
        );
      }

      if (fileValue.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected file is larger than the 25 MB upload limit.",
          },
          { status: 400 },
        );
      }

      const fileName = safeFileName(fileValue.name);
      const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${fileName}`;
      storagePath = `${organisationId}/matters/${matterId}/${uniqueName}`;

      const fileBuffer = Buffer.from(await fileValue.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(MATTER_DOCUMENTS_BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: fileValue.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("Matter document file upload failed:", uploadError);

        return NextResponse.json(
          {
            success: false,
            error:
              uploadError.message ||
              "The file could not be uploaded to secure storage.",
          },
          { status: 500 },
        );
      }

      const { data, error } = await createDocumentRecord({
        supabase,
        userId: user.id,
        matterId,
        title: fileValue.name,
        documentType:
          readRequiredText(formData.get("documentType")) || "Other",
        description: readOptionalText(formData.get("description")),
        source: "uploaded",
        status: "Final",
        fileName: fileValue.name,
        storagePath,
        mimeType: fileValue.type || "application/octet-stream",
        fileSizeBytes: fileValue.size,
        content: null,
        includeInBundle: readBoolean(formData.get("includeInBundle"), true),
        documentGroupId: null,
      });

      if (error || !data) {
        console.error("Matter document record could not be saved:", error);

        await supabase.storage
          .from(MATTER_DOCUMENTS_BUCKET)
          .remove([storagePath]);

        return NextResponse.json(
          {
            success: false,
            error: error?.message || "The Matter document record could not be saved.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          document: data,
        },
        { status: 201 },
      );
    } catch (error) {
      console.error("Matter document upload failed:", error);

      if (storagePath) {
        await supabase.storage
          .from(MATTER_DOCUMENTS_BUCKET)
          .remove([storagePath]);
      }

      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "The Matter document could not be uploaded.",
        },
        { status: 500 },
      );
    }
  }

  let body: CreateDocumentBody;

  try {
    body = (await request.json()) as CreateDocumentBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "The Matter document request could not be read.",
      },
      { status: 400 },
    );
  }

  const title = readRequiredText(body.title);
  const documentType =
    readRequiredText(body.documentType) || "General document";
  const source = readRequiredText(body.source) || "user_created";
  const status = readRequiredText(body.status) || "Draft";
  const documentGroupId = readOptionalText(body.documentGroupId);

  if (!title) {
    return NextResponse.json(
      { success: false, error: "A document title is required." },
      { status: 400 },
    );
  }

  if (!allowedSources.has(source)) {
    return NextResponse.json(
      { success: false, error: "The document source is invalid." },
      { status: 400 },
    );
  }

  if (!allowedStatuses.has(status)) {
    return NextResponse.json(
      { success: false, error: "The document status is invalid." },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await createDocumentRecord({
      supabase,
      userId: user.id,
      matterId,
      title,
      documentType,
      description: readOptionalText(body.description),
      source,
      status,
      fileName: readOptionalText(body.fileName),
      storagePath: readOptionalText(body.storagePath),
      mimeType: readOptionalText(body.mimeType),
      fileSizeBytes: readFileSize(body.fileSizeBytes),
      content: readOptionalText(body.content),
      includeInBundle: readBoolean(body.includeInBundle, true),
      documentGroupId,
    });

    if (error || !data) {
      console.error("Matter document could not be saved:", error);

      return NextResponse.json(
        {
          success: false,
          error: error?.message || "The Matter document could not be saved.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        document: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Matter document creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The Matter document could not be created.",
      },
      { status: 500 },
    );
  }
}