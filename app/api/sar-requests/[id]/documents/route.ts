import { NextResponse } from "next/server";

import {
  assertSarOwnership,
  optionalText,
  parseInteger,
  readText,
  requireSarAccess,
  safeFileName,
  validateSarUploadFile,
} from "../../_access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const uploadedPaths: string[] = [];

  try {
    const access = await requireSarAccess("sar_requests.view");

    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    const sarId = parseInteger(id);

    if (!sarId) {
      return NextResponse.json(
        {
          success: false,
          error: "The SAR reference is not valid.",
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

    const { data: sar, error: sarError } = await supabase
      .from("employee_sars")
      .select("id,employee_id")
      .eq("id", sarId)
      .maybeSingle();

    if (sarError || !sar) {
      return NextResponse.json(
        {
          success: false,
          error: "The SAR request could not be found.",
        },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const documentType = readText(formData.get("documentType")) || "Collected Record";
    const notes = optionalText(formData.get("notes"));
    const explicitTitle = optionalText(formData.get("title"));
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Select a document to upload.",
        },
        { status: 400 },
      );
    }

    const fileError = validateSarUploadFile(file);

    if (fileError) {
      return NextResponse.json(
        {
          success: false,
          error: fileError,
        },
        { status: 400 },
      );
    }

    const filePath =
      `sar-requests/${sar.employee_id}/${sar.id}/` +
      `${Date.now()}-${safeFileName(file.name)}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const uploadResult = await supabase.storage
      .from("hr-resources")
      .upload(filePath, bytes, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message || "The document could not be uploaded.");
    }

    uploadedPaths.push(filePath);

    const title = explicitTitle || file.name;

    const { data: document, error: documentError } = await supabase
      .from("employee_sar_documents")
      .insert({
        sar_id: sar.id,
        employee_id: sar.employee_id,
        document_type: documentType,
        title,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || null,
        file_size: file.size,
        review_status: "Not Reviewed",
        notes,
      })
      .select("*")
      .single();

    if (documentError || !document) {
      throw new Error(documentError?.message || "The document record could not be saved.");
    }

    const { error: timelineError } = await supabase
      .from("employee_sar_timeline")
      .insert({
        sar_id: sar.id,
        event_type: "document_uploaded",
        title: "SAR document added",
        description: `${documentType}: ${title}`,
        created_by: "User",
      });

    if (timelineError) {
      throw new Error(timelineError.message || "The SAR timeline could not be updated.");
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      const access = await requireSarAccess("sar_requests.view");

      if (access.ok) {
        await access.context.supabase.storage
          .from("hr-resources")
          .remove(uploadedPaths);
      }
    }

    console.error("SAR document upload API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be uploaded.",
      },
      { status: 500 },
    );
  }
}
