import { NextResponse } from "next/server";
import { processKnowledgeDocument } from "@/leo/knowledge/processor";
import { storeKnowledgeChunks } from "@/leo/knowledge/store";

export const runtime = "nodejs";

type ProcessDocumentRequest = {
  documentId: string;
  organisationId: string;
  fileName: string;
  fileUrl: string;
  sourceTable?: string | null;
  sourceRecordId?: number | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ProcessDocumentRequest>;

    const documentId = body.documentId?.trim();
    const organisationId = body.organisationId?.trim();
    const fileName = body.fileName?.trim();
    const fileUrl = body.fileUrl?.trim();

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: "documentId is required.",
        },
        { status: 400 }
      );
    }

    if (!organisationId) {
      return NextResponse.json(
        {
          success: false,
          error: "organisationId is required.",
        },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          error: "fileName is required.",
        },
        { status: 400 }
      );
    }

    if (!fileUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "fileUrl is required.",
        },
        { status: 400 }
      );
    }

    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `The uploaded file could not be downloaded. Status: ${fileResponse.status}.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const processResult = await processKnowledgeDocument({
      documentId,
      organisationId,
      fileName,
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
        { status: 400 }
      );
    }

    const storeResult = await storeKnowledgeChunks({
      documentId,
      chunks: processResult.chunks,
      sourceTable: body.sourceTable || null,
      sourceRecordId:
        typeof body.sourceRecordId === "number"
          ? body.sourceRecordId
          : null,
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
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "The resource was read and added to LEO Knowledge.",
      documentId,
      fileName,
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
      { status: 500 }
    );
  }
}