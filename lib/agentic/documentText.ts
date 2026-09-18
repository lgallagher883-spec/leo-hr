export async function extractEmployeeDocumentText(args: {
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<{ text: string; method: "docx" | "text" | "none" }> {
  const { fileName, contentType, bytes } = args;
  const lowerName = fileName.toLowerCase();

  if (
    contentType === "text/plain" ||
    contentType === "text/csv" ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".csv")
  ) {
    const text = new TextDecoder("utf-8", { fatal: false })
      .decode(bytes)
      .replace(/\u0000/g, "")
      .trim()
      .slice(0, 50_000);

    return { text, method: "text" };
  }

  if (
    contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({
        buffer: Buffer.from(bytes),
      });

      return {
        text: (result.value || "").trim().slice(0, 50_000),
        method: "docx",
      };
    } catch (error) {
      console.warn("Agentic document text extraction failed:", error);
      return { text: "", method: "none" };
    }
  }

  return { text: "", method: "none" };
}
