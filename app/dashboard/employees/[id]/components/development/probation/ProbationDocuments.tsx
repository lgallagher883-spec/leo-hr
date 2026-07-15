"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import type {
  ProbationRecord,
  ProbationReview,
} from "./types";
import { formatDate } from "./probationHelpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  employeeId: number;
  probation: ProbationRecord;
  reviews: ProbationReview[];
};

type EmployeeDocument = {
  id: number;
  employee_id: number;
  title: string;
  document_type: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  notes: string | null;
  created_at: string | null;
};

type ProbationDocumentLink = {
  id: number;
  probation_id: number;
  employee_id: number;
  employee_document_id: number;
  review_id: number | null;
  document_type: string;
  linked_at: string;
  is_archived: boolean;
};

const probationDocumentTypes = [
  "Contract",
  "Probation Clause",
  "Initial Check-in",
  "First Review",
  "Progress Review",
  "Final Review",
  "Support Plan",
  "Extension Letter",
  "Permanent Employment Confirmation",
  "Termination Letter",
  "Decision Record",
  "Other",
];

export default function ProbationDocuments({
  employeeId,
  probation,
  reviews,
}: Props) {
  const [employeeDocuments, setEmployeeDocuments] = useState<
    EmployeeDocument[]
  >([]);

  const [probationLinks, setProbationLinks] = useState<
    ProbationDocumentLink[]
  >([]);

  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] =
    useState("Initial Check-in");
  const [reviewId, setReviewId] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [existingDocumentId, setExistingDocumentId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadDocuments();
  }, [employeeId, probation.id]);

  async function loadDocuments() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: employeeDocumentData,
      error: employeeDocumentError,
    } = await supabase
      .from("employee_documents")
      .select(
        `
        id,
        employee_id,
        title,
        document_type,
        file_name,
        file_path,
        file_type,
        notes,
        created_at
        `
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (employeeDocumentError) {
      console.error(
        "Error loading employee documents:",
        employeeDocumentError
      );
      setErrorMessage(
        "The employee documents could not be loaded."
      );
      setLoading(false);
      return;
    }

    const {
      data: probationLinkData,
      error: probationLinkError,
    } = await supabase
      .from("probation_documents")
      .select(
        `
        id,
        probation_id,
        employee_id,
        employee_document_id,
        review_id,
        document_type,
        linked_at,
        is_archived
        `
      )
      .eq("probation_id", probation.id)
      .eq("is_archived", false)
      .order("linked_at", { ascending: false });

    if (probationLinkError) {
      console.error(
        "Error loading probation document links:",
        probationLinkError
      );
      setErrorMessage(
        "The probation documents could not be loaded."
      );
      setLoading(false);
      return;
    }

    setEmployeeDocuments(
      (employeeDocumentData || []) as EmployeeDocument[]
    );

    setProbationLinks(
      (probationLinkData || []) as ProbationDocumentLink[]
    );

    setLoading(false);
  }

  async function uploadAndLinkDocument() {
    if (!selectedFile) {
      setErrorMessage("Choose a file to upload.");
      return;
    }

    setUploading(true);
    setMessage("");
    setErrorMessage("");

    const safeFileName = selectedFile.name.replace(
      /[^a-zA-Z0-9.\-_]/g,
      "_"
    );

    const filePath = `${employeeId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("employee-documents")
      .upload(filePath, selectedFile);

    if (uploadError) {
      console.error(
        "Error uploading probation document:",
        uploadError
      );
      setErrorMessage(
        "The probation document file could not be uploaded."
      );
      setUploading(false);
      return;
    }

    const documentTitle =
      title.trim() || selectedFile.name;

    const {
      data: createdDocument,
      error: documentError,
    } = await supabase
      .from("employee_documents")
      .insert({
        employee_id: employeeId,
        title: documentTitle,
        document_type: documentType,
        file_name: selectedFile.name,
        file_path: filePath,
        file_type: selectedFile.type || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        id,
        employee_id,
        title,
        document_type,
        file_name,
        file_path,
        file_type,
        notes,
        created_at
        `
      )
      .single();

    if (documentError || !createdDocument) {
      console.error(
        "Error saving employee document:",
        documentError
      );

      await supabase.storage
        .from("employee-documents")
        .remove([filePath]);

      setErrorMessage(
        "The probation document record could not be saved."
      );
      setUploading(false);
      return;
    }

    const { error: linkError } = await supabase
      .from("probation_documents")
      .insert({
        probation_id: probation.id,
        employee_id: employeeId,
        employee_document_id: createdDocument.id,
        review_id: reviewId ? Number(reviewId) : null,
        document_type: documentType,
      });

    if (linkError) {
      console.error(
        "Error linking probation document:",
        linkError
      );

      await supabase
        .from("employee_documents")
        .delete()
        .eq("id", createdDocument.id);

      await supabase.storage
        .from("employee-documents")
        .remove([filePath]);

      setErrorMessage(
        "The document could not be linked to probation."
      );
      setUploading(false);
      return;
    }

    setTitle("");
    setDocumentType("Initial Check-in");
    setReviewId("");
    setNotes("");
    setSelectedFile(null);
    setMessage("Probation document uploaded.");
    setUploading(false);

    await loadDocuments();
  }

  async function linkExistingDocument() {
    if (!existingDocumentId) {
      setErrorMessage(
        "Select an existing employee document."
      );
      return;
    }

    setLinking(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("probation_documents")
      .insert({
        probation_id: probation.id,
        employee_id: employeeId,
        employee_document_id:
          Number(existingDocumentId),
        review_id: reviewId ? Number(reviewId) : null,
        document_type: documentType,
      });

    if (error) {
      console.error(
        "Error linking existing document:",
        error
      );

      setErrorMessage(
        error.code === "23505"
          ? "This document is already linked under that document type."
          : "The existing document could not be linked."
      );

      setLinking(false);
      return;
    }

    setExistingDocumentId("");
    setReviewId("");
    setMessage("Existing document linked to probation.");
    setLinking(false);

    await loadDocuments();
  }

  async function openDocument(filePath: string) {
    const { data, error } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(filePath, 60);

    if (error) {
      console.error("Error opening document:", error);
      setErrorMessage("The document could not be opened.");
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  }

  async function removeProbationLink(linkId: number) {
    const confirmed = window.confirm(
      "Remove this document from probation? The original employee document will remain preserved."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("probation_documents")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", linkId);

    if (error) {
      console.error(
        "Error removing probation document link:",
        error
      );
      setErrorMessage(
        "The probation document link could not be removed."
      );
      return;
    }

    setMessage(
      "The link was removed. The employee document remains preserved."
    );

    await loadDocuments();
  }

  const documentsById = useMemo(() => {
    return new Map(
      employeeDocuments.map((document) => [
        document.id,
        document,
      ])
    );
  }, [employeeDocuments]);

  const linkedDocumentIds = useMemo(() => {
    return new Set(
      probationLinks.map(
        (link) => link.employee_document_id
      )
    );
  }, [probationLinks]);

  const availableEmployeeDocuments =
    employeeDocuments.filter(
      (document) => !linkedDocumentIds.has(document.id)
    );

  return (
    <div style={documentsPanelStyle}>
      <h4 style={documentsTitleStyle}>
        Probation Documents
      </h4>

      <p style={documentsDescriptionStyle}>
        Upload probation records or link documents already
        held in the employee’s Documents area.
      </p>

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      {message && (
        <div style={messageStyle}>{message}</div>
      )}

      <div style={formGridStyle}>
        <FormField label="Document type">
          <select
            value={documentType}
            onChange={(event) =>
              setDocumentType(event.target.value)
            }
            style={inputStyle}
          >
            {probationDocumentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Related review">
          <select
            value={reviewId}
            onChange={(event) =>
              setReviewId(event.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              Whole probation record
            </option>

            {reviews.map((review) => (
              <option key={review.id} value={review.id}>
                {review.review_type} ·{" "}
                {formatDate(review.scheduled_date)}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div style={uploadSectionStyle}>
        <h5 style={sectionTitleStyle}>
          Upload a new document
        </h5>

        <FormField label="Document title">
          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Defaults to the file name"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Notes">
          <input
            type="text"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Optional notes"
            style={inputStyle}
          />
        </FormField>

        <FormField label="File">
          <input
            type="file"
            onChange={(event) =>
              setSelectedFile(
                event.target.files?.[0] || null
              )
            }
          />
        </FormField>

        <button
          type="button"
          onClick={() => void uploadAndLinkDocument()}
          disabled={uploading}
          style={primaryButtonStyle}
        >
          {uploading
            ? "Uploading..."
            : "Upload probation document"}
        </button>
      </div>

      <div style={existingSectionStyle}>
        <h5 style={sectionTitleStyle}>
          Link an existing employee document
        </h5>

        {availableEmployeeDocuments.length === 0 ? (
          <div style={mutedTextStyle}>
            No unlinked employee documents are available.
          </div>
        ) : (
          <>
            <select
              value={existingDocumentId}
              onChange={(event) =>
                setExistingDocumentId(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">
                Select an employee document
              </option>

              {availableEmployeeDocuments.map(
                (document) => (
                  <option
                    key={document.id}
                    value={document.id}
                  >
                    {document.title} ·{" "}
                    {document.file_name}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={() => void linkExistingDocument()}
              disabled={linking}
              style={secondaryButtonStyle}
            >
              {linking
                ? "Linking..."
                : "Link existing document"}
            </button>
          </>
        )}
      </div>

      <div style={historySectionStyle}>
        <h5 style={sectionTitleStyle}>
          Linked probation documents
        </h5>

        {loading ? (
          <div style={mutedTextStyle}>
            Loading probation documents...
          </div>
        ) : probationLinks.length === 0 ? (
          <div style={mutedTextStyle}>
            No probation documents have been linked yet.
          </div>
        ) : (
          <div style={documentListStyle}>
            {probationLinks.map((link) => {
              const document = documentsById.get(
                link.employee_document_id
              );

              if (!document) return null;

              return (
                <div
                  key={link.id}
                  style={documentCardStyle}
                >
                  <div>
                    <div style={documentTitleStyle}>
                      {document.title}
                    </div>

                    <div style={documentMetaStyle}>
                      {link.document_type} ·{" "}
                      {document.file_name}
                    </div>

                    <div style={documentMetaStyle}>
                      Linked{" "}
                      {new Date(
                        link.linked_at
                      ).toLocaleString("en-GB")}
                    </div>
                  </div>

                  <div style={documentActionsStyle}>
                    <button
                      type="button"
                      onClick={() =>
                        void openDocument(
                          document.file_path
                        )
                      }
                      style={openButtonStyle}
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void removeProbationLink(
                          link.id
                        )
                      }
                      style={removeButtonStyle}
                    >
                      Remove link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={formFieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const documentsPanelStyle: React.CSSProperties = {
  marginTop: "22px",
  borderTop: "1px solid #E5E7EB",
  paddingTop: "20px",
};

const documentsTitleStyle: React.CSSProperties = {
  margin: 0,
};

const documentsDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "14px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "18px",
};

const formFieldStyle: React.CSSProperties = {
  marginBottom: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#374151",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  fontSize: "14px",
  boxSizing: "border-box",
  marginBottom: "12px",
};

const uploadSectionStyle: React.CSSProperties = {
  marginTop: "10px",
  padding: "16px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "12px",
};

const existingSectionStyle: React.CSSProperties = {
  marginTop: "14px",
  padding: "16px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const historySectionStyle: React.CSSProperties = {
  marginTop: "20px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "14px",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "9px 13px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "9px 13px",
  fontWeight: 700,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  marginTop: "14px",
  padding: "12px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  marginTop: "14px",
  padding: "12px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
};

const documentListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const documentCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  padding: "14px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const documentTitleStyle: React.CSSProperties = {
  fontWeight: 800,
};

const documentMetaStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "12px",
};

const documentActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const openButtonStyle: React.CSSProperties = {
  background: "#111827",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "8px",
  padding: "7px 10px",
  cursor: "pointer",
  fontWeight: 600,
};

const removeButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  padding: "7px 10px",
  cursor: "pointer",
  fontWeight: 600,
};