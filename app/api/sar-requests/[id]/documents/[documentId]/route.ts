import { NextResponse } from "next/server";

import {
  assertSarOwnership,
  parseInteger,
  readText,
  requireSarAccess,
} from "../../../_access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const access = await requireSarAccess("sar_requests.view");

    if (!access.ok) {
      return access.response;
    }

    const { id, documentId } = await context.params;
    const sarId = parseInteger(id);
    const parsedDocumentId = parseInteger(documentId);

    if (!sarId || !parsedDocumentId) {
      return NextResponse.json(
        {
          success: false,
          error: "The document reference is not valid.",
        },
        { status: 400 },
      );
    }

    const { supabase, organisationId } = access.context;

    const ownership = await assertSarOwnership(
      supabase,
      organisationId,
      sarId,
    );

    if (!ownership.ok) {
      return ownership.response;
    }

    const { data: existingDocument, error: existingError } = await supabase
      .from("employee_sar_documents")
      .select("id,sar_id,title,review_status")
      .eq("id", parsedDocumentId)
      .eq("sar_id", sarId)
      .maybeSingle();

    if (existingError || !existingDocument) {
      return NextResponse.json(
        {
          success: false,
          error: "The document could not be found.",
        },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const reviewStatus = readText(body.reviewStatus);

    if (!reviewStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Select a valid review status.",
        },
        { status: 400 },
      );
    }

    const { data: document, error } = await supabase
      .from("employee_sar_documents")
      .update({
        review_status: reviewStatus,
      })
      .eq("id", parsedDocumentId)
      .eq("sar_id", sarId)
      .select("*")
      .single();

    if (error || !document) {
      throw new Error(error?.message || "The document status could not be updated.");
    }

    await supabase.from("employee_sar_timeline").insert({
      sar_id: sarId,
      event_type: "document_review_updated",
      title: "Document review status updated",
      description: `${existingDocument.title} was marked as ${reviewStatus}.`,
      created_by: "User",
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("SAR document status API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document status could not be updated.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const access = await requireSarAccess("sar_requests.view");

    if (!access.ok) {
      return access.response;
    }

    const { id, documentId } = await context.params;
    const sarId = parseInteger(id);
    const parsedDocumentId = parseInteger(documentId);

    if (!sarId || !parsedDocumentId) {
      return NextResponse.json(
        {
          success: false,
          error: "The document reference is not valid.",
        },
        { status: 400 },
      );
    }

    const { supabase, organisationId } = access.context;

    const ownership = await assertSarOwnership(
      supabase,
      organisationId,
      sarId,
    );

    if (!ownership.ok) {
      return ownership.response;
    }

    const { data: existingDocument, error: existingError } = await supabase
      .from("employee_sar_documents")
      .select("id,sar_id,title,file_path")
      .eq("id", parsedDocumentId)
      .eq("sar_id", sarId)
      .maybeSingle();

    if (existingError || !existingDocument) {
      return NextResponse.json(
        {
          success: false,
          error: "The document could not be found.",
        },
        { status: 404 },
      );
    }

    if (existingDocument.file_path) {
      const { error: storageError } = await supabase.storage
        .from("hr-resources")
        .remove([existingDocument.file_path]);

      if (storageError) {
        console.error("SAR document file could not be removed:", storageError);
      }
    }

    const { error } = await supabase
      .from("employee_sar_documents")
      .delete()
      .eq("id", parsedDocumentId)
      .eq("sar_id", sarId);

    if (error) {
      throw new Error(error.message || "The document could not be removed.");
    }

    await supabase.from("employee_sar_timeline").insert({
      sar_id: sarId,
      event_type: "document_removed",
      title: "SAR document removed",
      description: existingDocument.title,
      created_by: "User",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SAR document deletion API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be removed.",
      },
      { status: 500 },
    );
  }
}
