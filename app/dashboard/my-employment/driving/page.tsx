"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import mobileStyles from "../MyEmployment.module.css";

type DatabaseRecord = Record<string, unknown>;

const desktopItems = [
  ["Driving licence status", "No licence recorded"],
  ["Licence number", "Not recorded"],
  ["Categories", "Not recorded"],
  ["Expiry date", "Not recorded"],
  ["Business driving authorised", "No"],
  ["Company vehicle assigned", "No"],
  ["Insurance evidence", "Not recorded"],
  ["Vehicle checks", "None recorded"],
];

const uploadTypes = [
  "Driving licence",
  "Insurance",
  "MOT",
  "Other driving document",
] as const;

function textValue(
  record: DatabaseRecord | null,
  keys: string[],
  fallback = "Not recorded",
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
  if (typeof value !== "string" || !value) return "Not recorded";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function DrivingPage() {
  const [record, setRecord] = useState<DatabaseRecord | null>(null);
  const [documents, setDocuments] = useState<DatabaseRecord[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openingId, setOpeningId] =
    useState<string | number | null>(null);
  const [uploadType, setUploadType] =
    useState<(typeof uploadTypes)[number]>("Driving licence");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function loadDriving() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/my-employment/driving", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            employeeLinked?: boolean;
            driving?: DatabaseRecord | null;
            documents?: DatabaseRecord[];
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error ||
            "Your driving information could not be loaded.",
        );
      }

      setEmployeeLinked(payload.employeeLinked !== false);
      setRecord(payload.driving ?? null);
      setDocuments(
        Array.isArray(payload.documents) ? payload.documents : [],
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your driving information could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDriving();
  }, []);

  const mobileRows = useMemo(
    () => [
      ["Drives for work", textValue(record, ["drives_for_work"], "No")],
      ["Vehicle used", textValue(record, ["vehicle_used"])],
      [
        "Driving licence number",
        textValue(record, ["driving_licence_number"]),
      ],
      ["Licence categories", textValue(record, ["licence_categories"])],
      ["Licence expiry", formatDate(record?.licence_expiry_date)],
      [
        "Authorised to drive",
        textValue(record, ["authorised_to_drive"], "No"),
      ],
      [
        "DVLA check completed",
        textValue(record, ["dvla_check_completed"], "No"),
      ],
      ["Next DVLA check", formatDate(record?.next_dvla_check_due)],
      [
        "Business insurance",
        textValue(record, ["business_insurance_confirmed"], "No"),
      ],
      [
        "Insurance expiry",
        formatDate(record?.business_insurance_expiry_date),
      ],
      ["Penalty points", textValue(record, ["penalty_points"], "0")],
    ],
    [record],
  );

  async function uploadDocument(file: File) {
    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadType", uploadType);

      const response = await fetch("/api/my-employment/driving", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || "The document could not be uploaded.",
        );
      }

      setMessage(`${uploadType} uploaded.`);
      await loadDriving();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The document could not be uploaded.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function openDocument(document: DatabaseRecord) {
    const id = document.id;

    if (typeof id !== "string" && typeof id !== "number") return;

    setOpeningId(id);
    setError("");

    try {
      const params = new URLSearchParams({
        action: "open",
        documentId: String(id),
      });

      const response = await fetch(
        `/api/my-employment/driving?${params.toString()}`,
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
          payload?.error || "The document could not be opened.",
        );
      }

      window.open(
        payload.signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (openError) {
      setError(
        openError instanceof Error
          ? openError.message
          : "The document could not be opened.",
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
            Driving
          </h1>
        </header>

        {loading ? (
          <section
            className={mobileStyles.mobileCompactCard}
            style={mobileCard}
          >
            Loading your driving information...
          </section>
        ) : error && !employeeLinked ? (
          <section
            className={mobileStyles.mobileCompactCard}
            style={mobileCard}
          >
            <span style={{ color: "#8F3B3B" }}>{error}</span>
          </section>
        ) : !employeeLinked ? (
          <section
            className={mobileStyles.mobileCompactCard}
            style={mobileCard}
          >
            Your employee record is not available.
          </section>
        ) : (
          <>
            <section
              className={mobileStyles.mobileCompactCard}
              style={mobileCard}
            >
              <h2 style={mobileHeading}>Driving record</h2>

              {mobileRows.map(([label, value]) => (
                <div
                  key={label}
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
                        value === "Not recorded" || value === "No"
                          ? "#94A3B8"
                          : "#2F2635",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </section>

            <section
              className={mobileStyles.mobileCompactCard}
              style={mobileCard}
            >
              <h2 style={mobileHeading}>Driving documents</h2>

              <div
                className={mobileStyles.mobileFormGrid}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <label className={mobileStyles.mobileFormField}>
                  <span>Document type</span>

                  <select
                    value={uploadType}
                    onChange={(event) =>
                      setUploadType(
                        event.target
                          .value as (typeof uploadTypes)[number],
                      )
                    }
                  >
                    {uploadTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ alignSelf: "end" }}>
                  <button
                    type="button"
                    className={mobileStyles.mobilePrimaryButton}
                    onClick={() => fileInput.current?.click()}
                    disabled={uploading}
                    style={{ padding: "10px 13px" }}
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>

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
                <p style={emptyTextStyle}>
                  No driving documents uploaded.
                </p>
              ) : (
                <div className={mobileStyles.mobileDocumentList}>
                  {documents.map((document) => {
                    const id = document.id;
                    const title = textValue(
                      document,
                      ["title", "file_name"],
                      "Driving document",
                    );
                    const uploaded = formatDate(document.created_at);

                    return (
                      <div
                        key={String(id)}
                        className={mobileStyles.mobileDocumentRow}
                      >
                        <div>
                          <strong>{title}</strong>
                          {uploaded !== "Not recorded" ? (
                            <div style={documentMetaStyle}>
                              Uploaded {uploaded}
                            </div>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          className={mobileStyles.mobileSecondaryButton}
                          onClick={() => void openDocument(document)}
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

            {message ? <div style={messageStyle}>{message}</div> : null}
            {error ? <div style={errorStyle}>{error}</div> : null}
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

        <h1 style={{ fontSize: 32, color: "#6E5084", margin: "8px 0" }}>
          Driving
        </h1>

        <p style={{ color: "#64748B", marginBottom: 24 }}>
          Review the driving information your organisation currently holds.
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
          <strong style={{ color: "#6E5084" }}>Driving compliance</strong>
          <p style={{ margin: "8px 0 0", color: "#526071", lineHeight: 1.6 }}>
            Driving records are maintained where a role requires business
            travel, use of a company vehicle or licence verification.
          </p>
        </section>

        <section
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E2EB",
            borderRadius: 18,
            padding: 22,
            boxShadow: "0 8px 22px rgba(17,24,39,.05)",
          }}
        >
          <h2
            style={{
              margin: "0 0 14px",
              fontSize: 18,
              color: "#2F2635",
            }}
          >
            Driving record
          </h2>

          {desktopItems.map(([label, value]) => (
            <div
              key={label}
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
                  color:
                    value === "No" ||
                    value === "Not recorded" ||
                    value === "No licence recorded" ||
                    value === "None recorded"
                      ? "#94A3B8"
                      : "#2F2635",
                  fontWeight: 600,
                }}
              >
                {value}
              </span>
            </div>
          ))}

          <button
            disabled
            style={{
              marginTop: 18,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px solid #D8DCE2",
              background: "#F8FAFC",
              color: "#94A3B8",
              cursor: "not-allowed",
              fontWeight: 700,
            }}
          >
            Upload licence
          </button>
        </section>

        <section
          style={{
            marginTop: 20,
            background: "#FFFFFF",
            border: "1px solid #E8E2EB",
            borderRadius: 18,
            padding: 22,
            boxShadow: "0 8px 22px rgba(17,24,39,.05)",
          }}
        >
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: 18,
              color: "#2F2635",
            }}
          >
            Future capability
          </h2>

          <p style={{ color: "#64748B", lineHeight: 1.6 }}>
            This workspace will eventually display DVLA verification,
            business-driving approval, insurance evidence, company vehicle
            allocation, MOT reminders and licence renewal workflows from the
            Employees module.
          </p>
        </section>

        <div style={{ marginTop: 24 }}>
          <Link
            href="/dashboard/my-employment"
            style={{
              display: "inline-block",
              textDecoration: "none",
              color: "#6E5084",
              border: "1px solid #CDB2E2",
              borderRadius: 10,
              padding: "10px 16px",
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

const mobileCard = {
  background: "#FFFFFF",
  border: "1px solid #E8E2EB",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 8px 22px rgba(17,24,39,.05)",
} as const;

const mobileHeading = {
  margin: "0 0 10px",
  color: "#6E5084",
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
