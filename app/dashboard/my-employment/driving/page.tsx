"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type RecordData = Record<string, unknown>;

const uploadTypes = ["Driving licence", "Insurance", "MOT", "Other driving document"] as const;

function textValue(record: RecordData | null, keys: string[], fallback = "Not recorded") {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
  }
  return fallback;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "Not recorded";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function DrivingPage() {
  const [record, setRecord] = useState<RecordData | null>(null);
  const [documents, setDocuments] = useState<RecordData[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<string | number | null>(null);
  const [uploadType, setUploadType] = useState<(typeof uploadTypes)[number]>("Driving licence");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function loadDriving() {
    setLoading(true);
    try {
      const response = await fetch("/api/my-employment/driving", { cache: "no-store", headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; employeeLinked?: boolean; driving?: RecordData | null; documents?: RecordData[]; error?: string } | null;
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Your driving information could not be loaded.");
      setEmployeeLinked(payload.employeeLinked !== false);
      setRecord(payload.driving ?? null);
      setDocuments(Array.isArray(payload.documents) ? payload.documents : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your driving information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDriving();
  }, []);

  const rows = useMemo(() => [
    ["Drives for work", textValue(record, ["drives_for_work"], "No")],
    ["Vehicle used", textValue(record, ["vehicle_used"])],
    ["Driving licence number", textValue(record, ["driving_licence_number"])],
    ["Licence categories", textValue(record, ["licence_categories"])],
    ["Licence expiry", formatDate(record?.licence_expiry_date)],
    ["Authorised to drive", textValue(record, ["authorised_to_drive"], "No")],
    ["DVLA check completed", textValue(record, ["dvla_check_completed"], "No")],
    ["Next DVLA check", formatDate(record?.next_dvla_check_due)],
    ["Business insurance", textValue(record, ["business_insurance_confirmed"], "No")],
    ["Insurance expiry", formatDate(record?.business_insurance_expiry_date)],
    ["Penalty points", textValue(record, ["penalty_points"], "0")],
  ], [record]);

  async function uploadDocument(file: File) {
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadType", uploadType);
      const response = await fetch("/api/my-employment/driving", { method: "POST", body: formData });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "The document could not be uploaded.");
      setMessage(`${uploadType} uploaded securely. Your organisation can now review it.`);
      await loadDriving();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be uploaded.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function openDocument(document: RecordData) {
    const id = document.id;
    if (typeof id !== "string" && typeof id !== "number") return;
    setOpeningId(id);
    setError("");
    try {
      const params = new URLSearchParams({ action: "open", documentId: String(id) });
      const response = await fetch(`/api/my-employment/driving?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; signedUrl?: string; error?: string } | null;
      if (!response.ok || !payload?.success || !payload.signedUrl) throw new Error(payload?.error || "The document could not be opened.");
      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be opened.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={titleStyle}>Driving</h1>
        <p style={introStyle}>Review the driving and vehicle information your organisation holds and upload supporting evidence.</p>
      </header>

      <section style={noticeCard}>
        <strong style={{ color: "#6E5084" }}>Driving record is employer controlled</strong>
        <p style={{ margin: "7px 0 0", color: "#526071", lineHeight: 1.6 }}>You can upload supporting documents, but you cannot change or remove licence, vehicle, authorisation or verification information recorded by your organisation.</p>
      </section>

      {error ? <div style={errorCard}>{error}</div> : null}
      {message ? <div style={successCard}>{message}</div> : null}

      {loading ? (
        <section style={card}>Loading your driving information...</section>
      ) : !employeeLinked ? (
        <section style={card}>Your account has not yet been linked to an employee record.</section>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          <section style={card}>
            <h2 style={heading}>Driving record</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", columnGap: 30 }}>
              {rows.map(([label, value]) => <InfoRow key={label} label={label} value={String(value)} />)}
            </div>
          </section>

          <section style={card}>
            <div style={sectionHeader}>
              <div>
                <h2 style={{ ...heading, marginBottom: 4 }}>Driving and vehicle documents</h2>
                <p style={{ ...introStyle, margin: 0 }}>Upload evidence such as your licence, business-use insurance or MOT. Uploaded evidence cannot be edited or deleted from employee self-service.</p>
              </div>
            </div>

            <div style={uploadBar}>
              <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
                <span style={labelStyle}>Document type</span>
                <select value={uploadType} onChange={(event) => setUploadType(event.target.value as (typeof uploadTypes)[number])} style={selectStyle}>
                  {uploadTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} style={primaryButton}>{uploading ? "Uploading..." : "Upload document"}</button>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadDocument(file);
                }}
              />
            </div>

            {documents.length === 0 ? (
              <p style={emptyText}>No driving documents uploaded.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {documents.map((document) => {
                  const id = document.id;
                  const title = textValue(document, ["title", "file_name"], "Driving document");
                  const uploaded = formatDate(document.created_at);
                  return (
                    <article key={String(id)} style={documentRow}>
                      <div><strong>{title}</strong>{uploaded !== "Not recorded" ? <div style={metaText}>Uploaded {uploaded}</div> : null}</div>
                      <button type="button" onClick={() => void openDocument(document)} disabled={openingId === id} style={secondaryButton}>{openingId === id ? "Opening..." : "View"}</button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <div style={{ marginTop: 24 }}><Link href="/dashboard/my-employment" style={backLink}>← Back to My Employment</Link></div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div style={infoRow}><span style={labelStyle}>{label}</span><span style={{ color: value === "No" || value === "Not recorded" ? "#94A3B8" : "#2F2635", fontWeight: 600, textAlign: "right" }}>{value}</span></div>;
}

const pageStyle = { maxWidth: 1200, margin: "0 auto", paddingBottom: 32 } as const;
const eyebrow = { margin: "0 0 7px", color: "#6E5084", fontWeight: 800, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
const titleStyle = { margin: 0, color: "#6E5084", fontSize: 32 } as const;
const introStyle = { color: "#64748B", lineHeight: 1.6 } as const;
const card = { background: "#FFFFFF", border: "1px solid #E8E2EB", borderRadius: 18, padding: 22, boxShadow: "0 8px 22px rgba(17,24,39,.05)" } as const;
const noticeCard = { background: "#F7F1FC", border: "1px solid #E4D3EE", borderRadius: 16, padding: 20, marginBottom: 20 } as const;
const heading = { margin: "0 0 14px", color: "#2F2635", fontSize: 18 } as const;
const infoRow = { display: "flex", justifyContent: "space-between", gap: 20, padding: "13px 0", borderBottom: "1px solid #F0EDF2" } as const;
const labelStyle = { color: "#64748B", fontWeight: 700 } as const;
const sectionHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" as const, marginBottom: 16 };
const uploadBar = { display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" as const, marginBottom: 18 };
const selectStyle = { minHeight: 42, borderRadius: 10, border: "1px solid #D9CEE7", background: "#fff", padding: "8px 10px", color: "#2F2635" } as const;
const primaryButton = { border: 0, borderRadius: 10, background: "#6E5084", color: "#fff", padding: "11px 16px", fontWeight: 800, cursor: "pointer" } as const;
const secondaryButton = { border: "1px solid #CDB2E2", borderRadius: 10, background: "#fff", color: "#6E5084", padding: "9px 13px", fontWeight: 700, cursor: "pointer" } as const;
const documentRow = { display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", border: "1px solid #EEEAF1", borderRadius: 12, padding: 14 } as const;
const metaText = { marginTop: 4, color: "#7B7181", fontSize: 12 } as const;
const emptyText = { margin: 0, color: "#94A3B8" } as const;
const errorCard = { ...card, color: "#8F3B3B", marginBottom: 16 } as const;
const successCard = { ...card, color: "#356653", marginBottom: 16, background: "#F5FFF9" } as const;
const backLink = { display: "inline-block", textDecoration: "none", color: "#6E5084", border: "1px solid #CDB2E2", borderRadius: 10, padding: "10px 16px", fontWeight: 700 } as const;
