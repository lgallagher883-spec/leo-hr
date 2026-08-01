"use client";

import { useCallback, useEffect, useState } from "react";

import EmployeeLifecycleIntelligence from "./EmployeeLifecycleIntelligence";
import Field from "./Field";
import ProfileSection from "./ProfileSection";
import SaveButton from "./SaveButton";
import SelectField from "./SelectField";

type EmployeeDocumentsProps = {
  employeeId: number;
};

type EmployeeDocument = {
  id: number;
  title: string;
  document_type: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  notes: string | null;
  created_at: string;
};

const documentTypes = [
  "Contract",
  "Offer Letter",
  "Right to Work",
  "DBS",
  "Driving",
  "Insurance",
  "Medical / Occupational Health",
  "Fit Note",
  "Return to Work",
  "Warning",
  "Grievance",
  "Disciplinary",
  "Performance",
  "Training",
  "Policy Acknowledgement",
  "Other",
];

export default function EmployeeDocuments({
  employeeId,
}: EmployeeDocumentsProps) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("Contract");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/documents`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            documents?: EmployeeDocument[];
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || "Employee documents could not be loaded.",
        );
      }

      setDocuments(
        Array.isArray(payload.documents)
          ? payload.documents
          : [],
      );
    } catch (error) {
      console.error("Error loading employee documents:", error);
      setDocuments([]);
      setMessage(
        error instanceof Error
          ? error.message
          : "Employee documents could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function uploadDocument() {
    if (!selectedFile) {
      setMessage("Please choose a file to upload.");
      return;
    }

    const documentTitle = title.trim() || selectedFile.name;
    const formData = new FormData();

    formData.append("title", documentTitle);
    formData.append("documentType", documentType);
    formData.append("notes", notes);
    formData.append("file", selectedFile);

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/documents`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            document?: EmployeeDocument;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.success || !payload.document) {
        throw new Error(
          payload?.error || "The employee document could not be uploaded.",
        );
      }

      setDocuments((current) => [
        payload.document as EmployeeDocument,
        ...current.filter(
          (document) => document.id !== payload.document?.id,
        ),
      ]);
      setTitle("");
      setDocumentType("Contract");
      setNotes("");
      setSelectedFile(null);
      setFileInputKey((current) => current + 1);
      setMessage("Document uploaded.");
    } catch (error) {
      console.error("Error uploading employee document:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "The employee document could not be uploaded.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function openDocument(document: EmployeeDocument) {
    setOpeningId(document.id);
    setMessage("");

    try {
      const query = new URLSearchParams({
        action: "open",
        documentId: String(document.id),
      });

      const response = await fetch(
        `/api/employees/${employeeId}/documents?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            signedUrl?: string;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.success || !payload.signedUrl) {
        throw new Error(
          payload?.error || "The document could not be opened.",
        );
      }

      window.open(
        payload.signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      console.error("Error opening employee document:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "The document could not be opened.",
      );
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <ProfileSection title="Documents">
      <EmployeeLifecycleIntelligence
        employeeId={employeeId}
        lifecycleContext="documents"
        defaultPrompt="Draft a professional request that lists missing employee documents and asks for submission by a clear date."
      />

      <p
        style={{
          color: "#6B7280",
          fontSize: "14px",
          marginTop: 0,
        }}
      >
        Upload documents linked to this employee, such as contracts, right to
        work evidence, fit notes, DBS certificates, driving documents and HR
        letters.
      </p>

      <Field
        label="Document Title"
        value={title}
        onChange={setTitle}
        placeholder="Defaults to file name if left blank"
      />

      <SelectField
        label="Document Type"
        value={documentType}
        onChange={setDocumentType}
        options={documentTypes}
      />

      <Field
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Optional notes"
      />

      <div style={{ marginBottom: "12px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            color: "#6B7280",
            marginBottom: "5px",
          }}
        >
          File
        </label>

        <input
          key={fileInputKey}
          type="file"
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] || null);
          }}
        />
      </div>

      <SaveButton onClick={uploadDocument} disabled={saving}>
        {saving ? "Uploading..." : "Upload document"}
      </SaveButton>

      {message ? (
        <div
          style={{
            marginTop: "10px",
            color: "#6B7280",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      ) : null}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Document history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ color: "#6B7280" }}>
            No documents uploaded yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {documents.map((document) => (
              <div
                key={document.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "12px",
                  background: "#F9FAFB",
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  {document.title}
                </div>

                <div
                  style={{
                    color: "#6B7280",
                    fontSize: "13px",
                    marginTop: "4px",
                  }}
                >
                  {document.document_type || "Document"} ·{" "}
                  {document.file_name}
                </div>

                {document.notes ? (
                  <div
                    style={{
                      marginTop: "8px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <strong>Notes:</strong> {document.notes}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void openDocument(document)}
                  disabled={openingId === document.id}
                  style={{
                    marginTop: "10px",
                    background: "#111827",
                    color: "#fff",
                    border: "none",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    cursor:
                      openingId === document.id
                        ? "default"
                        : "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                    opacity:
                      openingId === document.id
                        ? 0.7
                        : 1,
                  }}
                >
                  {openingId === document.id
                    ? "Opening..."
                    : "Open document"}
                </button>

                <div
                  style={{
                    color: "#6B7280",
                    fontSize: "12px",
                    marginTop: "10px",
                  }}
                >
                  Uploaded{" "}
                  {new Date(document.created_at).toLocaleString(
                    "en-GB",
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileSection>
  );
}