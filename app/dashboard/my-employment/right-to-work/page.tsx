"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DataRecord = Record<string, unknown>;

type RightToWorkResponse = {
  success?: boolean;
  employeeLinked?: boolean;
  rightToWork?: DataRecord | null;
  documents?: DataRecord[];
  error?: string;
};

type DisplayRow = {
  label: string;
  value: string;
};

function firstText(
  record: DataRecord | null,
  keys: string[],
) {
  if (!record) return "";

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
  }

  return "";
}

function formatDate(value: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function dateValue(
  record: DataRecord | null,
  keys: string[],
) {
  return formatDate(firstText(record, keys));
}

export default function MyRightToWorkPage() {
  const [record, setRecord] = useState<DataRecord | null>(null);
  const [documents, setDocuments] = useState<DataRecord[]>([]);
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRightToWork() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          "/api/my-employment/right-to-work",
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const result =
          (await response.json()) as RightToWorkResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ??
              "Your Right to Work record could not be loaded.",
          );
        }

        if (!active) return;

        setEmployeeLinked(result.employeeLinked !== false);
        setRecord(result.rightToWork ?? null);
        setDocuments(
          Array.isArray(result.documents)
            ? result.documents
            : [],
        );
        setLoading(false);
      } catch (error) {
        console.error(
          "LEO Right to Work page load failed:",
          error,
        );

        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Your Right to Work record could not be loaded.",
        );
        setLoading(false);
      }
    }

    void loadRightToWork();

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo<DisplayRow[]>(() => {
    if (!record) {
      return [
        {
          label: "Right to Work status",
          value: "Awaiting check",
        },
        {
          label: "Check type",
          value: "Not recorded",
        },
        {
          label: "Check completed",
          value: "Not recorded",
        },
        {
          label: "Permission expiry",
          value: "Not recorded",
        },
        {
          label: "Follow-up check",
          value: "Not recorded",
        },
      ];
    }

    return [
      {
        label: "Right to Work status",
        value:
          firstText(record, [
            "status",
            "right_to_work_status",
            "verification_status",
            "check_status",
          ]) || "Awaiting check",
      },
      {
        label: "Check type",
        value:
          firstText(record, [
            "check_type",
            "right_to_work_type",
            "evidence_type",
            "document_type",
          ]) || "Not recorded",
      },
      {
        label: "Check completed",
        value:
          dateValue(record, [
            "checked_at",
            "check_date",
            "verified_at",
            "verification_date",
            "completed_at",
          ]) || "Not recorded",
      },
      {
        label: "Permission expiry",
        value:
          dateValue(record, [
            "expiry_date",
            "visa_expiry_date",
            "permission_expiry_date",
            "right_to_work_expiry_date",
          ]) || "No expiry recorded",
      },
      {
        label: "Follow-up check",
        value:
          dateValue(record, [
            "follow_up_date",
            "next_check_date",
            "recheck_date",
            "review_date",
          ]) || "Not required or not recorded",
      },
      {
        label: "Checked by",
        value:
          firstText(record, [
            "checked_by",
            "verified_by",
            "reviewed_by",
          ]) || "Not recorded",
      },
    ];
  }, [record]);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto" }}>
      <p style={{ color: "#6E5084", fontWeight: 700 }}>
        Employee workspace
      </p>

      <h1
        style={{
          fontSize: 32,
          color: "#6E5084",
          margin: "8px 0",
        }}
      >
        Right to Work
      </h1>

      <p style={{ color: "#64748B", marginBottom: 24 }}>
        Review the Right to Work information held on your employment
        record.
      </p>

      {loading ? (
        <div style={messageCard}>
          LEO is loading your Right to Work record.
        </div>
      ) : loadError ? (
        <div style={{ ...messageCard, color: "#8F3B3B" }}>
          {loadError}
        </div>
      ) : !employeeLinked ? (
        <div style={messageCard}>
          Your account has not yet been linked to an employee
          record. An organisation owner or senior user must complete
          that link before your Right to Work information can appear.
        </div>
      ) : (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {rows.map((row) => (
              <div
                key={row.label}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E2EB",
                  borderRadius: 16,
                  padding: 20,
                  boxShadow:
                    "0 8px 22px rgba(17,24,39,.05)",
                }}
              >
                <div
                  style={{
                    color: "#64748B",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {row.label}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </section>

          <section
            style={{
              marginTop: 24,
              background: "#FFFFFF",
              border: "1px solid #E8E2EB",
              borderRadius: 16,
              padding: 20,
              boxShadow:
                "0 8px 22px rgba(17,24,39,.05)",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#6E5084",
                fontSize: 20,
              }}
            >
              Right to Work documents
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#64748B",
              }}
            >
              Documents are shown here when they have been securely
              added to your employment record.
            </p>

            {documents.length === 0 ? (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: "#F8FAFC",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  color: "#64748B",
                }}
              >
                No Right to Work documents are currently available
                in this workspace.
              </div>
            ) : (
              <div
                style={{
                  marginTop: 16,
                  display: "grid",
                  gap: 12,
                }}
              >
                {documents.map((document, index) => {
                  const title =
                    firstText(document, [
                      "title",
                      "document_title",
                      "document_name",
                      "file_name",
                      "document_type",
                    ]) || `Right to Work document ${index + 1}`;

                  const status =
                    firstText(document, [
                      "status",
                      "verification_status",
                      "document_status",
                    ]) || "Available";

                  const url =
                    firstText(document, [
                      "signed_url",
                      "download_url",
                      "file_url",
                      "document_url",
                      "url",
                    ]) || "";

                  return (
                    <div
                      key={
                        firstText(document, [
                          "id",
                          "document_id",
                        ]) || `${title}-${index}`
                      }
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        padding: 16,
                        border: "1px solid #E8E2EB",
                        borderRadius: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#111827",
                            fontWeight: 700,
                          }}
                        >
                          {title}
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: "#64748B",
                            fontSize: 14,
                          }}
                        >
                          {status}
                        </div>
                      </div>

                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "9px 14px",
                            borderRadius: 10,
                            border:
                              "1px solid #CDB2E2",
                            color: "#6E5084",
                            fontWeight: 700,
                            textDecoration: "none",
                            flexShrink: 0,
                          }}
                        >
                          View
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={{
                            padding: "9px 14px",
                            borderRadius: 10,
                            border:
                              "1px solid #D8DCE2",
                            background: "#F8FAFC",
                            color: "#94A3B8",
                            fontWeight: 700,
                            cursor: "not-allowed",
                            flexShrink: 0,
                          }}
                        >
                          View
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <div
        style={{
          marginTop: 28,
          padding: 20,
          background: "#F7F1FC",
          border: "1px solid #E4D3EE",
          borderRadius: 16,
        }}
      >
        <strong style={{ color: "#6E5084" }}>
          Keeping your record accurate
        </strong>

        <p
          style={{
            margin: "8px 0 0",
            color: "#526071",
          }}
        >
          Contact your organisation if your immigration status,
          identity documents or permission to work have changed.
          Right to Work records can only be amended through an
          authorised process.
        </p>
      </div>

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