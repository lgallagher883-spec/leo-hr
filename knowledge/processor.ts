import { readWordDocument } from "./reader";
import { chunkKnowledgeDocument } from "./chunker";
import {
  KnowledgeChunk,
  KnowledgeReadResult,
} from "./types";

export type ProcessKnowledgeDocumentInput = {
  documentId: string;
  organisationId: string;
  fileName: string;
  fileBuffer: Buffer;
};

export type ProcessKnowledgeDocumentResult = {
  success: boolean;
  documentId: string;
  readResult: KnowledgeReadResult | null;
  chunks: KnowledgeChunk[];
  warnings: string[];
  error: string | null;
};

export async function processKnowledgeDocument({
  documentId,
  organisationId,
  fileName,
  fileBuffer,
}: ProcessKnowledgeDocumentInput): Promise<ProcessKnowledgeDocumentResult> {
  const extension = getFileExtension(fileName);

  if (extension !== "docx") {
    return {
      success: false,
      documentId,
      readResult: null,
      chunks: [],
      warnings: [],
      error:
        "This first version of the knowledge reader currently supports DOCX files only.",
    };
  }

  const readResult = await readWordDocument(fileBuffer, fileName);

  if (!readResult.success) {
    return {
      success: false,
      documentId,
      readResult,
      chunks: [],
      warnings: readResult.warnings,
      error: readResult.error || "The document could not be read.",
    };
  }

  const chunkResult = chunkKnowledgeDocument({
    documentId,
    organisationId,
    text: readResult.text,
  });

  if (!chunkResult.success) {
    return {
      success: false,
      documentId,
      readResult,
      chunks: [],
      warnings: [
        ...readResult.warnings,
        ...chunkResult.warnings,
      ],
      error:
        chunkResult.error ||
        "The document text could not be divided into knowledge sections.",
    };
  }

  return {
    success: true,
    documentId,
    readResult,
    chunks: chunkResult.chunks,
    warnings: [
      ...readResult.warnings,
      ...chunkResult.warnings,
    ],
    error: null,
  };
}

function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts[parts.length - 1];
}