"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import mobileStyles from "../MyEmployment.module.css";

type DatabaseRecord = Record<string, unknown>;

type MedicalResponse = {
  success?: boolean;
  employeeLinked?: boolean;
  medicalRecord?: DatabaseRecord | null;
  fitNotes?: DatabaseRecord[];
  absenceRecords?: DatabaseRecord[];
  error?: string;
};

function firstText(
  record: DatabaseRecord | null | undefined,
  keys: string[],
  fallback: string,
) {
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

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function MedicalPage() {
  const [medicalRecord, setMedicalRecord] =
    useState<DatabaseRecord | null>(null);
  const [fitNoteRecords, setFitNoteRecords] =
    useState<DatabaseRecord[]>([]);
  const [absenceRecords, setAbsenceRecords] =
    useState<DatabaseRecord[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] =
    useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function loadMedical() {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch("/api/my-employment/medical", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const result = (await response.json().catch(() => null)) as
        | MedicalResponse
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "Your medical information could not be loaded.",
        );
      }

      setEmployeeLinked(result.employeeLinked !== false);
      setMedicalRecord(result.medicalRecord ?? null);
      setFitNoteRecords(
        Array.isArray(result.fitNotes) ? result.fitNotes : [],
      );
      setAbsenceRecords(
        Array.isArray(result.absenceRecords)
          ? result.absenceRecords
          : [],
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Your medical information could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMedical();
  }, []);

  const medicalRows = useMemo(
    () => [
      [
        "Medical information",
        firstText(
          medicalRecord,
          [
            "medical_condition",
            "medical_information",
            "medical_notes",
            "health_information",
          ],
          "No information recorded",
        ),
      ],
      [
        "Workplace adjustments",
        firstText(
          medicalRecord,
          [
            "reasonable_adjustments",
            "workplace_adjustments",
            "adjustments",
          ],
          "None recorded",
        ),
      ],
      [
        "Occupational health referrals",
        firstText(
          medicalRecord,
          ["occupational_health_referrals", "occupational_health"],
          "None recorded",
        ),
      ],
      [
        "Allergies",
        firstText(
          medicalRecord,
          ["allergies", "allergy_details"],
          "None recorded",
        ),
      ],
    ],
    [medicalRecord],
  );

  const currentFitNote = fitNoteRecords[0] ?? null;
  const latestAbsence = absenceRecords[0] ?? null;

  const desktopFitNoteRows = useMemo(() => {
    const fitNoteTitle = firstText(
      currentFitNote,
      ["title", "document_name", "file_name", "name"],
      "",
    );

    const currentFitNoteValue = currentFitNote
      ? fitNoteTitle || "Recorded"
      : "None";

    const returnToWorkValue = firstText(
      latestAbsence,
      [
        "return_to_work_status",
        "return_to_work_meeting",
        "return_to_work_required",
        "rtw_status",
      ],
      "Not required",
    );

    const absenceType = firstText(
      latestAbsence,
      ["absence_type", "leave_type", "category", "type", "reason"],
      "",
    );

    const absenceStart = formatDate(
      latestAbsence?.start_date ??
        latestAbsence?.absence_start_date ??
        latestAbsence?.date_from,
    );

    const latestAbsenceValue = latestAbsence
      ? [absenceType, absenceStart].filter(Boolean).join(" — ") ||
        "Recorded"
      : "None recorded";

    return [
      ["Current fit note", currentFitNoteValue],
      ["Return to work meeting", returnToWorkValue],
      ["Latest absence", latestAbsenceValue],
    ];
  }, [currentFitNote, latestAbsence]);

  async function uploadFitNote(file: File) {
    setUploading(true);
    setMessage("");
    setLoadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/my-employment/medical", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || "The fit note could not be uploaded.",
        );
      }

      setMessage("Fit note uploaded.");
      await loadMedical();
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "The fit note could not be uploaded.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function openFitNote(record: DatabaseRecord) {
    const id = record.id;

    if (typeof id !== "number" && typeof id !== "string") return;

    setOpeningId(id);
    setLoadError("");

    try {
      const params = new URLSearchParams({
        action: "open",
        documentId: String(id),
      });

      const response = await fetch(
        `/api/my-employment/medical?${params.toString()}`,
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            signedUrl?: string;
            error?: string;
          }
        | null;

      if (
        !response.ok ||
        !payload?.success ||
        !payload.signedUrl
      ) {
        throw new Error(
          payload?.error || "The fit note could not be opened.",
        );
      }

      window.open(
        payload.signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "The fit note could not be opened.",
      );
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <>
      {/* PHONE-ONLY employee app */}
      <main
        className={`${mobileStyles.employeeMobileOnly} ${mobileStyles.employeeMobilePage} ${mobileStyles.mobileSectionStack}`}
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <header>
          <h1 style={{ margin: 0, color: "#6E5084", fontSize: 32 }}>
            Medical
          </h1>
        </header>

        {loading ? (
          <section
            className={mobileStyles.mobileCompactCard}
            style={card}
          >
            Loading your medical information...
          </section>
        ) : loadError && !employeeLinked ? (
          <section
            className={mobileStyles.mobileCompactCard}
            style={card}
          >
            <span style={{ color: "#8F3B3B" }}>{loadError}</span>
          </section>
        ) : !employeeLinked ? (
          <section
            className={mobileStyles.mobileCompactCard}
            style={card}
          >
            Your employee record is not available.
          </section>
        ) : (
          <>
            <section
              className={mobileStyles.mobileCompactCard}
              style={card}
            >
              <h2 style={heading}>Medical record</h2>

              {medicalRows.map(([label, value]) => (
                <MobileRecordRow
                  key={label}
                  label={label}
                  value={String(value)}
                />
              ))}
            </section>

            <section
              className={mobileStyles.mobileCompactCard}
              style={card}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <h2 style={{ ...heading, margin: 0 }}>Fit notes</h2>

                <button
                  type="button"
                  className={mobileStyles.mobilePrimaryButton}
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  style={{ padding: "9px 12px" }}
                >
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

              {fitNoteRecords.length === 0 ? (
                <p style={emptyTextStyle}>No fit notes uploaded.</p>
              ) : (
                <div className={mobileStyles.mobileDocumentList}>
                  {fitNoteRecords.map((record) => {
                    const id = record.id;
                    const title = firstText(
                      record,
                      ["title", "file_name"],
                      "Fit note",
                    );
                    const uploaded = formatDate(record.created_at);

                    return (
                      <div
                        key={String(id)}
                        className={mobileStyles.mobileDocumentRow}
                      >
                        <div>
                          <strong>{title}</strong>
                          {uploaded ? (
                            <div style={documentMetaStyle}>
                              Uploaded {uploaded}
                            </div>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          className={mobileStyles.mobileSecondaryButton}
                          onClick={() => void openFitNote(record)}
                          disabled={openingId === id}
                          style={{ padding: "8px 11px" }}
                        >
                          {openingId === id ? "Opening..." : "View"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section
              className={mobileStyles.mobileCompactCard}
              style={card}
            >
              <h2 style={heading}>Absence</h2>
              <MobileRecordRow
                label="Latest absence"
                value={
                  latestAbsence
                    ? `${firstText(
                        latestAbsence,
                        ["leave_type"],
                        "Absence",
                      )}${
                        formatDate(latestAbsence.start_date)
                          ? ` · ${formatDate(
                              latestAbsence.start_date,
                            )}`
                          : ""
                      }`
                    : "None recorded"
                }
              />
            </section>

            {message ? <div style={messageStyle}>{message}</div> : null}
            {loadError ? <div style={errorStyle}>{loadError}</div> : null}
          </>
        )}
      </main>

      {/* EXISTING EMPLOYEE DESKTOP PRESENTATION — intentionally preserved */}
      <main
        className={mobileStyles.employeeDesktopOnly}
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        <p
          style={{
            color: "#6E5084",
            fontWeight: 800,
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          Employee workspace
        </p>

        <h1
          style={{
            fontSize: 32,
            color: "#6E5084",
            margin: "8px 0",
          }}
        >
          Medical Information &amp; Fit Notes
        </h1>

        <p style={{ color: "#64748B", marginBottom: 24 }}>
          Review the health information and fit note records your organisation
          holds for you.
        </p>

        <section
          style={{
            background: "#F7F1FC",
            border: "1px solid #E4D3EE",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <strong style={{ color: "#6E5084" }}>
            Confidential information
          </strong>

          <p
            style={{
              margin: "8px 0 0",
              color: "#526071",
              lineHeight: 1.6,
            }}
          >
            Medical information is restricted and only available to authorised
            users where there is a legitimate employment reason.
          </p>
        </section>

        {loading ? (
          <section style={card}>
            <p style={{ margin: 0, color: "#64748B", lineHeight: 1.6 }}>
              Leo HR is loading your medical information.
            </p>
          </section>
        ) : loadError ? (
          <section style={card}>
            <p style={{ margin: 0, color: "#8F3B3B", lineHeight: 1.6 }}>
              {loadError}
            </p>
          </section>
        ) : !employeeLinked ? (
          <section style={card}>
            <p style={{ margin: 0, color: "#64748B", lineHeight: 1.6 }}>
              Your account has not yet been linked to an employee record.
            </p>
          </section>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(340px,1fr))",
              gap: 20,
            }}
          >
            <section style={card}>
              <h2 style={heading}>Medical record</h2>
              {medicalRows.map(([label, value]) => (
                <DesktopRow
                  key={label}
                  label={label}
                  value={String(value)}
                />
              ))}
            </section>

            <section style={card}>
              <h2 style={heading}>Fit notes</h2>
              {desktopFitNoteRows.map(([label, value]) => (
                <DesktopRow
                  key={label}
                  label={label}
                  value={String(value)}
                />
              ))}
            </section>
          </div>
        )}

        <section style={{ ...card, marginTop: 20 }}>
          <h2 style={heading}>Future capability</h2>

          <p style={{ color: "#64748B", lineHeight: 1.6 }}>
            This workspace will display uploaded fit notes, occupational health
            reports, workplace adjustments, return-to-work meetings and absence
            history directly from the Employees module. Employee updates will
            use secure audited workflows.
          </p>

          <button
            disabled
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #D8DCE2",
              background: "#F8FAFC",
              color: "#94A3B8",
              fontWeight: 700,
              cursor: "not-allowed",
            }}
          >
            Submit medical update
          </button>
        </section>

        <div style={{ marginTop: 24 }}>
          <Link
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
    </>
  );
}

function MobileRecordRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className={mobileStyles.mobileRecordRow}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        padding: "12px 0",
        borderBottom: "1px solid #F0EDF2",
      }}
    >
      <span
        className={mobileStyles.mobileRecordLabel}
        style={{ color: "#64748B", fontWeight: 700 }}
      >
        {label}
      </span>

      <span
        className={mobileStyles.mobileRecordValue}
        style={{
          color:
            value === "None recorded" ||
            value === "No information recorded"
              ? "#94A3B8"
              : "#2F2635",
          fontWeight: 600,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DesktopRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const isEmptyValue =
    value === "None recorded" ||
    value === "None" ||
    value === "No information recorded";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        padding: "14px 0",
        borderBottom: "1px solid #F0EDF2",
      }}
    >
      <span style={{ color: "#64748B", fontWeight: 700 }}>
        {label}
      </span>

      <span
        style={{
          color: isEmptyValue ? "#94A3B8" : "#2F2635",
          fontWeight: 600,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const card = {
  background: "#FFFFFF",
  border: "1px solid #E8E2EB",
  borderRadius: 18,
  padding: 22,
  boxShadow: "0 8px 22px rgba(17,24,39,.05)",
} as const;

const heading = {
  margin: "0 0 12px",
  color: "#2F2635",
  fontSize: 18,
} as const;

const emptyTextStyle = {
  margin: 0,
  color: "#94A3B8",
  fontSize: 14,
} as const;

const documentMetaStyle = {
  marginTop: 4,
  color: "#7B7181",
  fontSize: 12,
} as const;

const messageStyle = {
  color: "#356653",
  fontSize: 13,
} as const;

const errorStyle = {
  color: "#8F3B3B",
  fontSize: 13,
} as const;
