import mammoth from "mammoth";
import { KnowledgeReadResult } from "./types";

export async function readWordDocument(
  file: Buffer,
  fileName: string
): Promise<KnowledgeReadResult> {
  try {
    const result = await mammoth.extractRawText({
      buffer: file,
    });

    return {
      success: true,
      fileName,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      text: result.value,
      warnings: result.messages.map((m) => m.message),
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      fileName,
      mimeType: null,
      text: "",
      warnings: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown document reading error.",
    };
  }
}