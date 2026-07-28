"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

type MatterDocument = {
  id: number;
  matter_id: number;
  document_group_id: string;
  version_number: number;
  title: string;
  document_type: string;
  description: string | null;
  source: "uploaded" | "leo_generated" | "user_created" | "system_generated";
  status: "Draft" | "Final" | "Superseded" | "Archived";
  file_name: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  content: string | null;
  include_in_bundle: boolean;
  created_at: string;
};

type Props = {
  matterId: number;
};

export default function MatterDocuments({ matterId }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<MatterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("General document");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"Draft" | "Final">("Draft");
  const [includeInBundle, setIncludeInBundle] = useState(true);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");

  useEffect(() => {
    void loadDocuments();
  }, [matterId]);

  async function loadDocuments() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/matters/${matterId}/documents`, {
        credentials: "include",
        cache: "no-store",
      });

      const result = (await response.json()) as {
        success: boolean;
        documents?: MatterDocument[];
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "The Matter documents could not be loaded.");
      }

      setDocuments(result.documents || []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The Matter documents could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveDocument() {
    if (!title.trim() || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/matters/${matterId}/documents`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          documentType,
          description: description.trim() || null,
          content: content.trim() || null,
          source: "user_created",
          status,
          includeInBundle,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        document?: MatterDocument;
        error?: string;
      };

      if (!response.ok || !result.success || !result.document) {
        throw new Error(result.error || "The Matter document could not be saved.");
      }

      setDocuments((current) => [result.document as MatterDocument, ...current]);
      setTitle("");
      setDocumentType("General document");
      setDescription("");
      setContent("");
      setStatus("Draft");
      setIncludeInBundle(true);
      setMessage("Matter document saved.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The Matter document could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  function chooseUploadFile() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null;
    setUploadFile(selectedFile);
    setError("");
    setMessage("");
  }

  async function uploadDocument() {
    if (!uploadFile || uploading) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("description", uploadDescription.trim());
      formData.append("documentType", "Other");
      formData.append("includeInBundle", "true");

      const response = await fetch(`/api/matters/${matterId}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = (await response.json()) as {
        success: boolean;
        document?: MatterDocument;
        error?: string;
      };

      if (!response.ok || !result.success || !result.document) {
        throw new Error(result.error || "The file could not be uploaded.");
      }

      setDocuments((current) => [result.document as MatterDocument, ...current]);
      setUploadFile(null);
      setUploadDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Document uploaded to this Matter.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The file could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function openDocument(document: MatterDocument) {
    if (!document.storage_path || openingDocumentId !== null) return;

    setOpeningDocumentId(document.id);
    setError("");

    try {
      const response = await fetch(
        `/api/matters/${matterId}/documents/${document.id}/open`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.url) {
        throw new Error(result.error || "The document could not be opened.");
      }

      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The document could not be opened.",
      );
    } finally {
      setOpeningDocumentId(null);
    }
  }

  async function generateDraft() {
    if (drafting) return;

    setDrafting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/matters/${matterId}/draft`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${title.trim() || "Draft matter document"}\n\n${description.trim() || "Generate a Matter document from the current Matter context."}`,
          title: title.trim() || `Draft for Matter #${matterId}`,
          documentType,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        document?: MatterDocument;
        error?: string;
      };

      if (!response.ok || !result.success || !result.document) {
        throw new Error(result.error || "The draft could not be generated.");
      }

      setDocuments((current) => [result.document as MatterDocument, ...current]);
      setTitle("");
      setDocumentType("General document");
      setDescription("");
      setContent("");
      setStatus("Draft");
      setIncludeInBundle(true);
      setMessage("LEO draft generated and saved to this Matter.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The draft could not be generated.",
      );
    } finally {
      setDrafting(false);
    }
  }

  return (
    <section style={panelStyle}>
      <div style={{ fontWeight: 700, marginBottom: "6px" }}>Matter Documents</div>
      <div style={mutedStyle}>
        Create and retain letters, forms, notes, statements, evidence records and other Matter documents.
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {message && <div style={successStyle}>{message}</div>}

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Document title"
        style={inputStyle}
      />

      <select
        value={documentType}
        onChange={(event) => setDocumentType(event.target.value)}
        style={{ ...inputStyle, marginTop: "10px" }}
      >
        <option>General document</option>
        <option>Letter</option>
        <option>Email</option>
        <option>Investigation form</option>
        <option>Investigation plan</option>
        <option>Meeting notes</option>
        <option>Meeting script</option>
        <option>Witness statement</option>
        <option>Evidence record</option>
        <option>Checklist</option>
        <option>Risk assessment</option>
        <option>Consultation document</option>
        <option>Outcome record</option>
        <option>Internal decision note</option>
        <option>LEO guidance</option>
        <option>LEO summary</option>
        <option>Other</option>
      </select>

      <select
        value={status}
        onChange={(event) => setStatus(event.target.value === "Final" ? "Final" : "Draft")}
        style={{ ...inputStyle, marginTop: "10px" }}
      >
        <option value="Draft">Draft</option>
        <option value="Final">Final</option>
      </select>

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Brief description or purpose..."
        style={textareaStyle}
      />

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Document content or working notes..."
        style={{ ...textareaStyle, minHeight: "140px" }}
      />

      <label style={checkboxStyle}>
        <input
          type="checkbox"
          checked={includeInBundle}
          onChange={(event) => setIncludeInBundle(event.target.checked)}
        />
        <span style={{ marginLeft: "8px" }}>Include in the Matter Bundle</span>
      </label>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
        <button
          onClick={saveDocument}
          disabled={saving || !title.trim()}
          style={{ ...buttonStyle, opacity: saving || !title.trim() ? 0.6 : 1, marginTop: 0 }}
        >
          {saving ? "Saving..." : "Save Matter Document"}
        </button>

        <button
          onClick={() => void generateDraft()}
          disabled={drafting}
          style={{ ...secondaryButtonStyle, marginTop: 0, opacity: drafting ? 0.6 : 1 }}
        >
          {drafting ? "Generating..." : "Generate draft with LEO"}
        </button>
      </div>

      <div style={uploadPanelStyle}>
        <div style={{ fontWeight: 700 }}>Add evidence or another document</div>
        <div style={{ ...mutedStyle, marginBottom: "10px" }}>
          Upload a file directly into this Matter so it is retained with the case and available to LEO.
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelected}
          style={{ display: "none" }}
        />

        <button
          type="button"
          onClick={chooseUploadFile}
          style={secondaryButtonStyle}
          disabled={uploading}
        >
          Add document
        </button>

        {uploadFile && (
          <>
            <div style={selectedFileStyle}>
              <strong>{uploadFile.name}</strong>
              <span style={metaStyle}>{formatFileSize(uploadFile.size)}</span>
            </div>

            <textarea
              value={uploadDescription}
              onChange={(event) => setUploadDescription(event.target.value)}
              placeholder="Optional description..."
              style={textareaStyle}
            />

            <button
              type="button"
              onClick={uploadDocument}
              disabled={uploading}
              style={{ ...buttonStyle, opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? "Uploading..." : "Upload to Matter"}
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: "20px", fontWeight: 700 }}>Saved Documents</div>

      {loading ? (
        <div style={mutedStyle}>Loading documents...</div>
      ) : documents.length === 0 ? (
        <div style={mutedStyle}>No Matter documents have been created yet.</div>
      ) : (
        <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
          {documents.map((document) => (
            <div key={document.id} style={documentStyle}>
              <div style={{ fontWeight: 700 }}>
                {document.file_name || document.title}
              </div>
              <div style={metaStyle}>
                {document.document_type} · Version {document.version_number} · {document.status}
              </div>

              {document.description && (
                <div style={{ marginTop: "8px", color: "#6B7280" }}>
                  {document.description}
                </div>
              )}

              {document.content && <div style={contentStyle}>{document.content}</div>}

              <div style={metaStyle}>
                {formatSource(document.source)} · {formatDate(document.created_at)} ·{" "}
                {document.include_in_bundle ? "Included in bundle" : "Excluded from bundle"}
              </div>

              {document.storage_path && (
                <button
                  type="button"
                  onClick={() => void openDocument(document)}
                  disabled={openingDocumentId !== null}
                  style={viewButtonStyle}
                >
                  {openingDocumentId === document.id ? "Opening..." : "View document"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatSource(source: MatterDocument["source"]) {
  if (source === "leo_generated") return "LEO generated";
  if (source === "system_generated") return "System generated";
  if (source === "uploaded") return "Uploaded";
  return "User created";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const panelStyle: React.CSSProperties = {
  marginTop: "20px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
};

const uploadPanelStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "16px",
  border: "1px solid #E4D3EE",
  borderRadius: "12px",
  background: "#F7F1FC",
};

const selectedFileStyle: React.CSSProperties = {
  marginTop: "12px",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 12px",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  background: "#FFFFFF",
  fontSize: "13px",
};

const mutedStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6B7280",
  marginTop: "6px",
  marginBottom: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "80px",
  padding: "10px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  marginTop: "10px",
};

const checkboxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginTop: "12px",
  color: "#374151",
  fontSize: "14px",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "10px",
  background: "#6E5084",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 700,
};

const viewButtonStyle: React.CSSProperties = {
  marginTop: "10px",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "12px",
};

const errorStyle: React.CSSProperties = {
  marginBottom: "10px",
  padding: "10px 12px",
  border: "1px solid #FECACA",
  borderRadius: "8px",
  background: "#FEF2F2",
  color: "#991B1B",
  fontSize: "13px",
};

const successStyle: React.CSSProperties = {
  marginBottom: "10px",
  padding: "10px 12px",
  border: "1px solid #A7F3D0",
  borderRadius: "8px",
  background: "#ECFDF5",
  color: "#065F46",
  fontSize: "13px",
};

const documentStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "14px",
  background: "#FCFCFD",
};

const metaStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "12px",
};

const contentStyle: React.CSSProperties = {
  marginTop: "10px",
  padding: "10px",
  borderRadius: "8px",
  background: "#FFFFFF",
  border: "1px solid #EEF0F3",
  color: "#374151",
  fontSize: "13px",
  whiteSpace: "pre-wrap",
};