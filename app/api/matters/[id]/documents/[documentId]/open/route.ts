import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MATTER_DOCUMENTS_BUCKET = "matter-documents";

type RouteContext = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id, documentId } = await context.params;
  const matterId = Number(id);
  const parsedDocumentId = Number(documentId);

  if (
    !Number.isInteger(matterId) ||
    matterId <= 0 ||
    !Number.isInteger(parsedDocumentId) ||
    parsedDocumentId <= 0
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "The document reference is invalid.",
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Your session is unavailable. Please sign in again.",
      },
      { status: 401 },
    );
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return NextResponse.json(
      {
        success: false,
        error: "Your active organisation could not be resolved.",
      },
      { status: 403 },
    );
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: "matters.view",
      target_user_id: user.id,
    },
  );

  if (permissionError || !allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "You do not have permission to view this document.",
      },
      { status: permissionError ? 500 : 403 },
    );
  }

  const { data: document, error: documentError } = await supabase
    .from("matter_documents")
    .select("id,matter_id,storage_path")
    .eq("id", parsedDocumentId)
    .eq("matter_id", matterId)
    .maybeSingle();

  if (documentError) {
    console.error("Matter document could not be loaded for opening:", documentError);

    return NextResponse.json(
      {
        success: false,
        error: "The document could not be verified.",
      },
      { status: 500 },
    );
  }

  if (!document?.storage_path) {
    return NextResponse.json(
      {
        success: false,
        error: "This document does not have an uploaded file.",
      },
      { status: 404 },
    );
  }

  const { data, error } = await supabase.storage
    .from(MATTER_DOCUMENTS_BUCKET)
    .createSignedUrl(document.storage_path, 60);

  if (error || !data?.signedUrl) {
    console.error("Matter document signed URL could not be created:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "The document could not be opened.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    url: data.signedUrl,
  });
}