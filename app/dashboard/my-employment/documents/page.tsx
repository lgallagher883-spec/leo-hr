"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DocumentRecord = Record<string, unknown>;

type DocumentsResponse = {
  success?: boolean;
  employeeLinked?: boolean;
  documents?: DocumentRecord[];
  companyDocuments?: DocumentRecord[];
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

const personalPlaceholders = [
  ["Employment Contract", "Awaiting document"],
  ["Offer Letter", "Awaiting document"],
  ["Right to Work", "Managed in Right to Work workspace"],
  ["DBS Certificate", "Managed in DBS workspace"],
] as const;

const companyPlaceholders = [
  ["Employee Handbook", "Available when your organisation shares it"],
  ["Policies", "Available when assigned or shared"],
] as const;

function firstText(record: DocumentRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function firstBoolean(record: DocumentRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return null;
}

function normaliseDocument(record: DocumentRecord, index: number): DisplayDocument {
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
  const filePath = firstText(record, ["file_path", "storage_path", "document_path"]);
  const visible = firstBoolean(record, [
    "is_available",
    "available_to_employee",
    "visible_to_employee",
  ]);
  const documentId = firstText(record, ["id", "document_id", "source_record_id"]) || null;

  let status = explicitStatus;
  if (!status && acknowledged === true) status = "Acknowledged";
  if (!status && acknowledged === false) status = "Awaiting acknowledgement";
  if (!status) status = filePath || visible === true ? "Available" : "Awaiting document";

  return {
    key: documentId || `${title}-${index}`,
    documentId,
    sourceTable: firstText(record, ["source_table"]) || "employee_documents",
    title,
    status,
    available: Boolean(documentId) && (Boolean(filePath) || visible === true),
  };
}

function placeholderRows(rows: readonly (readonly [string, string])[], sourceTable: string) {
  return rows.map(([title, status], index) => ({
    key: `${sourceTable}-${title}-${index}`,
    documentId: null,
    sourceTable,
    title,
    status,
    available: false,
  }));
}

export default function MyDocumentsPage() {
  const [records, setRecords] = useState<DocumentRecord[]>([]);
  const [companyRecords, setCompanyRecords] = useState<DocumentRecord[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/my-employment/documents", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json().catch(() => null)) as DocumentsResponse | null;
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || "Your employment documents could not be loaded.");
        }
        if (!active) return;
        setEmployeeLinked(payload.employeeLinked !== false);
        setRecords(Array.isArray(payload.documents) ? payload.documents : []);
        setCompanyRecords(Array.isArray(payload.companyDocuments) ? payload.companyDocuments : []);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Your employment documents could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const personalDocuments = useMemo(
    () => (records.length ? records.map(normaliseDocument) : placeholderRows(personalPlaceholders, "employee_documents")),
    [records],
  );

  const companyDocuments = useMemo(() => {
    const loaded = companyRecords.map((record, index) => {
      const document = normaliseDocument(record, index);
      return {
        ...document,
        sourceTable: "company_documents",
        status: firstText(record, ["document_type"]) || "Company document",
        available: Boolean(document.documentId),
      };
    });
    return loaded.length ? loaded : placeholderRows(companyPlaceholders, "company_documents");
  }, [companyRecords]);

  async function openDocument(document: DisplayDocument) {
    if (!document.available || !document.documentId) return;
    setOpeningKey(document.key);
    setError("");

    try {
      if (document.sourceTable === "company_documents") {
        window.open(`/api/company-documents/${encodeURIComponent(document.documentId)}/open`, "_blank", "noopener,noreferrer");
        return;
      }

      const query = new URLSearchParams({
        action: "open",
        documentId: document.documentId,
        sourceTable: document.sourceTable,
      });
      const response = await fetch(`/api/my-employment/documents?${query.toString()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; signedUrl?: string; error?: string } | null;
      if (!response.ok || !payload?.success || !payload.signedUrl) {
        throw new Error(payload?.error || "This document could not be opened.");
      }
      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This document could not be opened.");
    } finally {
      setOpeningKey(null);
    }
  }

  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 26 }}>
        <h1 style={titleStyle}>My Documents</h1>
        <p style={introStyle}>View documents that relate specifically to your employment and company documents shared with you.</p>
      </header>

      {error ? <div style={errorCard}>{error}</div> : null}

      {loading ? (
        <div style={messageCard}>Leo HR is loading your documents.</div>
      ) : !employeeLinked ? (
        <div style={messageCard}>Your account has not yet been linked to an employee record.</div>
      ) : (
        <div style={{ display: "grid", gap: 34 }}>
          <DocumentSection
            title="Your documents"
            description="Documents that relate specifically to you, such as your contract, offer letter and personal compliance records."
            documents={personalDocuments}
            openingKey={openingKey}
            onOpen={openDocument}
          />
          <DocumentSection
            title="Company documents"
            description="Your organisation's handbook, policies, procedures and other documents made available to you."
            documents={companyDocuments}
            openingKey={openingKey}
            onOpen={openDocument}
          />
        </div>
      )}

      <div style={{ marginTop: 26 }}>
        <Link href="/dashboard/my-employment" style={backLink}>← Back to My Employment</Link>
      </div>
    </main>
  );
}

function DocumentSection({
  title,
  description,
  documents,
  openingKey,
  onOpen,
}: {
  title: string;
  description: string;
  documents: DisplayDocument[];
  openingKey: string | null;
  onOpen: (document: DisplayDocument) => Promise<void>;
}) {
  return (
    <section>
      <h2 style={{ margin: 0, color: "#6E5084", fontSize: 22 }}>{title}</h2>
      <p style={{ ...introStyle, marginTop: 6, marginBottom: 15 }}>{description}</p>
      <div style={{ display: "grid", gap: 14 }}>
        {documents.map((document) => (
          <article key={`${document.sourceTable}-${document.key}`} style={documentCard}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ fontSize: 16, color: "#2F2635" }}>{document.title}</strong>
              <div style={{ marginTop: 5, color: "#64748B" }}>{document.status}</div>
            </div>
            <button
              type="button"
              onClick={() => void onOpen(document)}
              disabled={!document.available || openingKey === document.key}
              style={{ ...buttonStyle, opacity: document.available ? 1 : 0.55 }}
            >
              {openingKey === document.key ? "Opening..." : "View"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

const pageStyle = { maxWidth: 1200, margin: "0 auto", paddingBottom: 32 } as const;
const eyebrow = { margin: "0 0 7px", color: "#6E5084", fontWeight: 800, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
const titleStyle = { margin: 0, color: "#6E5084", fontSize: 32 } as const;
const introStyle = { color: "#64748B", lineHeight: 1.6 } as const;
const messageCard = { background: "#FFFFFF", border: "1px solid #E8E2EB", borderRadius: 16, padding: 20, color: "#64748B", lineHeight: 1.6 } as const;
const errorCard = { ...messageCard, color: "#8F3B3B", marginBottom: 16 } as const;
const documentCard = { background: "#FFFFFF", border: "1px solid #E8E2EB", borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, boxShadow: "0 8px 22px rgba(17,24,39,.05)" } as const;
const buttonStyle = { padding: "10px 16px", borderRadius: 10, border: "1px solid #CDB2E2", background: "#FFFFFF", color: "#6E5084", fontWeight: 700, cursor: "pointer", flexShrink: 0 } as const;
const backLink = { display: "inline-block", textDecoration: "none", color: "#6E5084", border: "1px solid #CDB2E2", borderRadius: 10, padding: "10px 16px", fontWeight: 700 } as const;
