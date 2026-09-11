"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type RecordData = Record<string, unknown>;

type MedicalResponse = {
  success?: boolean;
  employeeLinked?: boolean;
  medicalRecord?: RecordData | null;
  fitNotes?: RecordData[];
  absenceRecords?: RecordData[];
  error?: string;
};

function firstText(record: RecordData | null | undefined, keys: string[], fallback: string) {
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
  if (typeof value !== "string" || !value.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function MedicalPage() {
  const [medicalRecord, setMedicalRecord] = useState<RecordData | null>(null);
  const [fitNotes, setFitNotes] = useState<RecordData[]>([]);
  const [absenceRecords, setAbsenceRecords] = useState<RecordData[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function loadMedical() {
    setLoading(true);
    try {
      const response = await fetch("/api/my-employment/medical", { cache: "no-store", headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => null)) as MedicalResponse | null;
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "Your medical information could not be loaded.");
      setEmployeeLinked(payload.employeeLinked !== false);
      setMedicalRecord(payload.medicalRecord ?? null);
      setFitNotes(Array.isArray(payload.fitNotes) ? payload.fitNotes : []);
      setAbsenceRecords(Array.isArray(payload.absenceRecords) ? payload.absenceRecords : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your medical information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMedical();
  }, []);

  const medicalRows = useMemo(() => [
    ["Medical information", firstText(medicalRecord, ["medical_condition", "medical_information", "medical_notes", "health_information"], "No information recorded")],
    ["Workplace adjustments", firstText(medicalRecord, ["reasonable_adjustments", "workplace_adjustments", "adjustments"], "None recorded")],
    ["Occupational health referrals", firstText(medicalRecord, ["occupational_health_referrals", "occupational_health"], "None recorded")],
    ["Allergies", firstText(medicalRecord, ["allergies", "allergy_details"], "None recorded")],
  ], [medicalRecord]);

  const latestAbsence = absenceRecords[0] ?? null;

  async function uploadFitNote(file: File) {
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/my-employment/medical", { method: "POST", body: formData });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!response.ok || !payload?.success) throw new Error(payload?.error || "The fit note could not be uploaded.");
      setMessage("Fit note uploaded securely. Your organisation can now review it.");
      await loadMedical();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The fit note could not be uploaded.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function openFitNote(record: RecordData) {
    const id = record.id;
    if (typeof id !== "string" && typeof id !== "number") return;
    setOpeningId(id);
    setError("");
    try {
      const params = new URLSearchParams({ action: "open", documentId: String(id) });
      const response = await fetch(`/api/my-employment/medical?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; signedUrl?: string; error?: string } | null;
      if (!response.ok || !payload?.success || !payload.signedUrl) throw new Error(payload?.error || "The fit note could not be opened.");
      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The fit note could not be opened.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={titleStyle}>Medical Information &amp; Fit Notes</h1>
        <p style={introStyle}>Review the health information held for you and securely upload fit notes for your organisation.</p>
      </header>

      <section style={privacyCard}>
        <strong style={{ color: "#6E5084" }}>Confidential information</strong>
        <p style={{ margin: "7px 0 0", color: "#526071", lineHeight: 1.6 }}>Medical information is restricted to authorised users where there is a legitimate employment reason.</p>
      </section>

      {error ? <div style={errorCard}>{error}</div> : null}
      {message ? <div style={successCard}>{message}</div> : null}

      {loading ? (
        <section style={card}>Loading your medical information...</section>
      ) : !employeeLinked ? (
        <section style={card}>Your account has not yet been linked to an employee record.</section>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={responsiveGrid}>
            <section style={card}>
              <h2 style={heading}>Medical record</h2>
              {medicalRows.map(([label, value]) => <InfoRow key={label} label={label} value={String(value)} />)}
            </section>

            <section style={card}>
              <h2 style={heading}>Absence and fit-note status</h2>
              <InfoRow label="Current fit note" value={fitNotes.length ? firstText(fitNotes[0], ["title", "file_name"], "Recorded") : "None"} />
              <InfoRow label="Latest absence" value={latestAbsence ? `${firstText(latestAbsence, ["absence_type", "leave_type", "category", "type", "reason"], "Absence")}${formatDate(latestAbsence.start_date) ? ` · ${formatDate(latestAbsence.start_date)}` : ""}` : "None recorded"} />
            </section>
          </div>

          <section style={card}>
            <div style={sectionHeader}>
              <div>
                <h2 style={{ ...heading, marginBottom: 4 }}>Fit notes</h2>
                <p style={{ ...introStyle, margin: 0 }}>Upload a fit note or other medical certificate. You cannot amend the employer's medical record from here.</p>
              </div>
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} style={primaryButton}>
                {uploading ? "Uploading..." : "Upload fit note"}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadFitNote(file);
                }}
              />
            </div>

            {fitNotes.length === 0 ? (
              <p style={emptyText}>No fit notes uploaded.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {fitNotes.map((record) => {
                  const id = record.id;
                  const title = firstText(record, ["title", "file_name"], "Fit note");
                  const uploaded = formatDate(record.created_at);
                  return (
                    <article key={String(id)} style={documentRow}>
                      <div><strong>{title}</strong>{uploaded ? <div style={metaText}>Uploaded {uploaded}</div> : null}</div>
                      <button type="button" onClick={() => void openFitNote(record)} disabled={openingId === id} style={secondaryButton}>{openingId === id ? "Opening..." : "View"}</button>
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
  return <div style={infoRow}><span style={labelStyle}>{label}</span><span style={{ color: value.includes("recorded") || value === "None" ? "#94A3B8" : "#2F2635", fontWeight: 600, textAlign: "right" }}>{value}</span></div>;
}

const pageStyle = { maxWidth: 1200, margin: "0 auto", paddingBottom: 32 } as const;
const eyebrow = { margin: "0 0 7px", color: "#6E5084", fontWeight: 800, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
const titleStyle = { margin: 0, color: "#6E5084", fontSize: 32 } as const;
const introStyle = { color: "#64748B", lineHeight: 1.6 } as const;
const card = { background: "#FFFFFF", border: "1px solid #E8E2EB", borderRadius: 18, padding: 22, boxShadow: "0 8px 22px rgba(17,24,39,.05)" } as const;
const privacyCard = { background: "#F7F1FC", border: "1px solid #E4D3EE", borderRadius: 16, padding: 20, marginBottom: 20 } as const;
const heading = { margin: "0 0 14px", color: "#2F2635", fontSize: 18 } as const;
const responsiveGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 } as const;
const infoRow = { display: "flex", justifyContent: "space-between", gap: 20, padding: "13px 0", borderBottom: "1px solid #F0EDF2" } as const;
const labelStyle = { color: "#64748B", fontWeight: 700 } as const;
const sectionHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" as const, marginBottom: 16 };
const primaryButton = { border: 0, borderRadius: 10, background: "#6E5084", color: "#fff", padding: "11px 16px", fontWeight: 800, cursor: "pointer" } as const;
const secondaryButton = { border: "1px solid #CDB2E2", borderRadius: 10, background: "#fff", color: "#6E5084", padding: "9px 13px", fontWeight: 700, cursor: "pointer" } as const;
const documentRow = { display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", border: "1px solid #EEEAF1", borderRadius: 12, padding: 14 } as const;
const metaText = { marginTop: 4, color: "#7B7181", fontSize: 12 } as const;
const emptyText = { margin: 0, color: "#94A3B8" } as const;
const errorCard = { ...card, color: "#8F3B3B", marginBottom: 16 } as const;
const successCard = { ...card, color: "#356653", marginBottom: 16, background: "#F5FFF9" } as const;
const backLink = { display: "inline-block", textDecoration: "none", color: "#6E5084", border: "1px solid #CDB2E2", borderRadius: 10, padding: "10px 16px", fontWeight: 700 } as const;
