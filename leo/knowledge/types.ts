export type KnowledgeSourceType =
  | "foundation"
  | "policy"
  | "procedure"
  | "contract"
  | "handbook"
  | "template"
  | "form"
  | "risk_assessment"
  | "training"
  | "guidance"
  | "register"
  | "organisation_memory"
  | "legislation"
  | "acas"
  | "regulator"
  | "matter"
  | "employee"
  | "unknown";

export type KnowledgeDocumentStatus =
  | "in_place"
  | "draft"
  | "draft_available"
  | "review_available"
  | "review_suggested"
  | "under_review"
  | "update_available"
  | "recommended"
  | "planned"
  | "superseded"
  | "archived"
  | "not_currently_required";

export type KnowledgeProcessingStatus =
  | "pending"
  | "reading"
  | "read"
  | "chunking"
  | "chunked"
  | "indexing"
  | "indexed"
  | "failed";

export type KnowledgeDocument = {
  id: string;
  organisationId: string;

  title: string;
  sourceType: KnowledgeSourceType;

  category: string | null;
  description: string | null;

  fileName: string | null;
  filePath: string | null;
  fileUrl: string | null;
  mimeType: string | null;

  documentStatus: KnowledgeDocumentStatus;
  processingStatus: KnowledgeProcessingStatus;

  extractedText: string | null;

  effectiveDate: string | null;
  reviewDate: string | null;
  createdAt: string;
  updatedAt: string;

  metadata: Record<string, unknown>;
};

export type KnowledgeChunk = {
  id: string;
  documentId: string;
  organisationId: string;

  chunkIndex: number;
  heading: string | null;
  content: string;

  tokenEstimate: number | null;

  metadata: Record<string, unknown>;
};

export type KnowledgeReadResult = {
  success: boolean;

  fileName: string | null;
  mimeType: string | null;

  text: string;

  warnings: string[];
  error: string | null;
};

export type KnowledgeChunkResult = {
  success: boolean;

  documentId: string;
  chunks: KnowledgeChunk[];

  warnings: string[];
  error: string | null;
};

export type KnowledgeSearchInput = {
  organisationId: string;
  query: string;

  sourceTypes?: KnowledgeSourceType[];
  documentIds?: string[];

  maximumResults?: number;
};

export type KnowledgeSearchResult = {
  chunkId: string;
  documentId: string;

  documentTitle: string;
  sourceType: KnowledgeSourceType;

  heading: string | null;
  content: string;

  relevanceScore: number;

  metadata: Record<string, unknown>;
};

export type KnowledgeContext = {
  query: string;

  results: KnowledgeSearchResult[];

  sourcesUsed: Array<{
    documentId: string;
    title: string;
    sourceType: KnowledgeSourceType;
  }>;

  gaps: string[];
};