"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import mobileStyles from "../MyEmployment.module.css";

type DocumentRecord = Record<string, unknown>;

type DocumentsResponse = {
  success?: boolean;
  employeeLinked?: boolean;
  documents?: DocumentRecord[];
  error?: string;
};

type OpenDocumentResponse = {
  success?: boolean;
  signedUrl?: string;
  error?: string;
};

type DisplayDocument = {
  key: string;
  documentId: string | null;
  sourceTable: string;
  title: string;
  status: string;
  available: boolean;
};

const placeholderDocuments = [
  ["Employment Contract", "Awaiting document"],
  ["Offer Letter", "Awaiting document"],
  ["Employee Handbook", "Awaiting acknowledgement"],
  ["Policies", "Available when assigned"],
  ["Right to Work", "Managed in Right to Work workspace"],
  ["DBS Certificate", "Managed in DBS workspace"],
] as const;

function firstText(
  record: DocumentRecord,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function firstBoolean(
  record: DocumentRecord,
  keys: string[],
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }
  }

  return null;
}

function normaliseDocument(
  record: DocumentRecord,
  index: number,
): DisplayDocument {
  const title =
    firstText(record, [
      "title",
      "document_title",
      "document_name",
      "name",
      "file_name",
      "document_type",
      "category",
    ]) || `Document ${index + 1}`;

  const explicitStatus = firstText(record, [
    "status",
    "document_status",
    "acknowledgement_status",
    "verification_status",
  ]);

  const acknowledged = firstBoolean(record, [
    "acknowledged",
    "is_acknowledged",
    "employee_acknowledged",
  ]);

  const filePath =
    firstText(record, [
      "file_path",
      "storage_path",
      "document_path",
    ]) || null;

  const available =
    Boolean(filePath) ||
    firstBoolean(record, [
      "is_available",
      "available_to_employee",
      "visible_to_employee",
    ]) === true;

  let status = explicitStatus;

  if (!status && acknowledged === true) {
    status = "Acknowledged";
  }

  if (!status && acknowledged === false) {
    status = "Awaiting acknowledgement";
  }

  if (!status) {
    status = available ? "Available" : "Awaiting document";
  }

  const documentId =
    firstText(record, ["id", "document_id", "source_record_id"]) || null;

  const sourceTable =
    firstText(record, ["source_table"]) || "employee_documents";

  return {
    key: documentId || `${title}-${index}`,
    documentId,
    sourceTable,
    title,
    status,
    available: available && Boolean(documentId),
  };
}

export default function MyDocumentsPage() {
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [openError, setOpenError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          "/api/my-employment/documents",
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const result =
          (await response.json()) as DocumentsResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ??
              "Your employment documents could not be loaded.",
          );
        }

        if (!active) return;

        setEmployeeLinked(result.employeeLinked !== false);
        setRecords(
          Array.isArray(result.documents)
            ? result.documents
            : [],
        );
        setLoading(false);
      } catch (error) {
        console.error("Leo HR documents page load failed:", error);

        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Your employment documents could not be loaded.",
        );
        setLoading(false);
      }
    }

    void loadDocuments();

    return () => {
      active = false;
    };
  }, []);

  const documents = useMemo<DisplayDocument[]>(() => {
    if (records.length > 0) {
      return records.map(normaliseDocument);
    }

    return placeholderDocuments.map(
      ([title, status], index) => ({
        key: `${title}-${index}`,
        documentId: null,
        sourceTable: "employee_documents",
        title,
        status,
        available: false,
      }),
    );
  }, [records]);

  async function openDocument(document: DisplayDocument) {
    if (!document.available || !document.documentId) return;

    setOpeningKey(document.key);
    setOpenError("");

    try {
      const query = new URLSearchParams({
        action: "open",
        documentId: document.documentId,
        sourceTable: document.sourceTable,
      });

      const response = await fetch(
        `/api/my-employment/documents?${query.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result =
        (await response.json()) as OpenDocumentResponse;

      if (!response.ok || !result.success || !result.signedUrl) {
        throw new Error(
          result.error ?? "This document could not be opened.",
        );
      }

      window.open(
        result.signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      console.error("Leo HR document open failed:", error);
      setOpenError(
        error instanceof Error
          ? error.message
          : "This document could not be opened.",
      );
    } finally {
      setOpeningKey(null);
    }
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 32,
          color: "#6E5084",
          margin: "8px 0",
        }}
      >
        My Documents
      </h1>

      <p style={{ color: "#64748B", marginBottom: 24 }}>
        View the employment documents your organisation has shared
        with you.
      </p>

      {openError ? (
        <div
          style={{
            ...messageCard,
            color: "#8F3B3B",
            marginBottom: 16,
          }}
        >
          {openError}
        </div>
      ) : null}

      {loading ? (
        <div style={messageCard}>
          Leo HR is loading your employment documents.
        </div>
      ) : loadError ? (
        <div
          style={{
            ...messageCard,
            color: "#8F3B3B",
          }}
        >
          {loadError}
        </div>
      ) : !employeeLinked ? (
        <div style={messageCard}>
          Your account has not yet been linked to an employee
          record. An organisation owner or senior user needs to
          complete that link before your documents can appear.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {documents.map((document) => (
            <div
              key={document.key}
              style={{
                background: "#fff",
                border: "1px solid #E8E2EB",
                borderRadius: 16,
                padding: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 20,
                boxShadow:
                  "0 8px 22px rgba(17,24,39,.05)",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {document.title}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    color: "#64748B",
                  }}
                >
                  {document.status}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void openDocument(document)}
                disabled={
                  !document.available ||
                  openingKey === document.key
                }
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: document.available
                    ? "1px solid #CDB2E2"
                    : "1px solid #D8DCE2",
                  background: document.available
                    ? "#FFFFFF"
                    : "#F8FAFC",
                  color: document.available
                    ? "#6E5084"
                    : "#94A3B8",
                  fontWeight: 700,
                  cursor:
                    document.available &&
                    openingKey !== document.key
                      ? "pointer"
                      : "not-allowed",
                  flexShrink: 0,
                  opacity:
                    openingKey === document.key ? 0.7 : 1,
                }}
              >
                {openingKey === document.key ? "Opening..." : "View"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Link
          className={mobileStyles.mobileBackLink}
          href="/dashboard/my-employment"
          style={{
            textDecoration: "none",
            color: "#6E5084",
            border: "1px solid #CDB2E2",
            borderRadius: 10,
            padding: "10px 16px",
            display: "inline-block",
            fontWeight: 700,
          }}
        >
          ← Back to My Employment
        </Link>
      </div>
    </main>
  );
}

const messageCard = {
  background: "#FFFFFF",
  border: "1px solid #E8E2EB",
  borderRadius: 16,
  padding: 20,
  color: "#64748B",
  lineHeight: 1.6,
  boxShadow: "0 8px 22px rgba(17,24,39,.05)",
} as const;
