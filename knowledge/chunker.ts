import {
  KnowledgeChunk,
  KnowledgeChunkResult,
} from "./types";

type ChunkDocumentInput = {
  documentId: string;
  organisationId: string;
  text: string;
  maximumChunkLength?: number;
};

export function chunkKnowledgeDocument({
  documentId,
  organisationId,
  text,
  maximumChunkLength = 1800,
}: ChunkDocumentInput): KnowledgeChunkResult {
  try {
    const cleanedText = normaliseText(text);

    if (!cleanedText) {
      return {
        success: false,
        documentId,
        chunks: [],
        warnings: [],
        error: "The document did not contain any readable text.",
      };
    }

    const sections = splitIntoSections(cleanedText);
    const chunks: KnowledgeChunk[] = [];

    sections.forEach((section) => {
      const sectionChunks = splitSection(
        section.content,
        maximumChunkLength
      );

      sectionChunks.forEach((content) => {
        chunks.push({
          id: `${documentId}-chunk-${chunks.length}`,
          documentId,
          organisationId,
          chunkIndex: chunks.length,
          heading: section.heading,
          content,
          tokenEstimate: estimateTokens(content),
          metadata: {},
        });
      });
    });

    return {
      success: true,
      documentId,
      chunks,
      warnings:
        chunks.length === 1
          ? [
              "The document was stored as one knowledge chunk because no clear sections were detected.",
            ]
          : [],
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      documentId,
      chunks: [],
      warnings: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown document chunking error.",
    };
  }
}

function normaliseText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoSections(
  text: string
): Array<{
  heading: string | null;
  content: string;
}> {
  const lines = text.split("\n");
  const sections: Array<{
    heading: string | null;
    content: string;
  }> = [];

  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  function saveCurrentSection() {
    const content = currentContent.join("\n").trim();

    if (!content) {
      return;
    }

    sections.push({
      heading: currentHeading,
      content,
    });

    currentContent = [];
  }

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      currentContent.push("");
      continue;
    }

    if (looksLikeHeading(trimmedLine)) {
      saveCurrentSection();
      currentHeading = trimmedLine;
      continue;
    }

    currentContent.push(trimmedLine);
  }

  saveCurrentSection();

  if (sections.length === 0) {
    return [
      {
        heading: null,
        content: text,
      },
    ];
  }

  return sections;
}

function looksLikeHeading(line: string): boolean {
  if (line.length > 100) {
    return false;
  }

  if (/^\d+(\.\d+)*[.)]?\s+\S+/.test(line)) {
    return true;
  }

  if (/^(section|part|chapter)\s+\d+/i.test(line)) {
    return true;
  }

  if (line.endsWith(":") && line.split(" ").length <= 10) {
    return true;
  }

  const letters = line.replace(/[^a-zA-Z]/g, "");

  if (
    letters.length >= 3 &&
    line === line.toUpperCase() &&
    line.split(" ").length <= 12
  ) {
    return true;
  }

  return false;
}

function splitSection(
  text: string,
  maximumChunkLength: number
): string[] {
  if (text.length <= maximumChunkLength) {
    return [text];
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > maximumChunkLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      chunks.push(
        ...splitLongParagraph(paragraph, maximumChunkLength)
      );

      continue;
    }

    const proposedChunk = currentChunk
      ? `${currentChunk}\n\n${paragraph}`
      : paragraph;

    if (proposedChunk.length > maximumChunkLength) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk = proposedChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function splitLongParagraph(
  paragraph: string,
  maximumChunkLength: number
): string[] {
  const sentences =
    paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];

  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    const proposedChunk = currentChunk
      ? `${currentChunk} ${trimmedSentence}`
      : trimmedSentence;

    if (
      proposedChunk.length > maximumChunkLength &&
      currentChunk
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk = proposedChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}