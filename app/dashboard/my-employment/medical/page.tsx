"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value) && value.length > 0) {
      const joined = value
        .map((item) => String(item).trim())
        .filter(Boolean)
        .join(", ");

      if (joined) return joined;
    }
  }

  return fallback;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function latestRecord(records: DatabaseRecord[]) {
  return records[0] ?? null;
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
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMedicalInformation() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/my-employment/medical", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const result = (await response.json()) as MedicalResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ??
              "Your medical information could not be loaded.",
          );
        }

        if (!active) return;

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
        setLoading(false);
      } catch (error) {
        console.error("LEO medical page load failed:", error);

        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Your medical information could not be loaded.",
        );
        setLoading(false);
      }
    }

    void loadMedicalInformation();

    return () => {
      active = false;
    };
  }, []);

  const medical = useMemo(
    () => [
      [
        "Medical information",
        firstText(
          medicalRecord,
          [
            "medical_information",
            "medical_notes",
            "health_information",
            "health_notes",
            "medical_conditions",
            "condition_details",
          ],
          "No information recorded",
        ),
      ],
      [
        "Workplace adjustments",
        firstText(
          medicalRecord,
          [
            "workplace_adjustments",
            "reasonable_adjustments",
            "adjustments",
            "adjustment_details",
          ],
          "None recorded",
        ),
      ],
      [
        "Occupational health referrals",
        firstText(
          medicalRecord,
          [
            "occupational_health_referrals",
            "occupational_health_referral",
            "occupational_health",
            "oh_referral_status",
            "oh_notes",
          ],
          "None recorded",
        ),
      ],
      [
        "Allergies",
        firstText(
          medicalRecord,
          [
            "allergies",
            "allergy_details",
            "known_allergies",
          ],
          "None recorded",
        ),
      ],
    ],
    [medicalRecord],
  );

  const currentFitNote = latestRecord(fitNoteRecords);
  const latestAbsence = latestRecord(absenceRecords);

  const fitNotes = useMemo(() => {
    const fitNoteTitle = firstText(
      currentFitNote,
      [
        "title",
        "document_name",
        "file_name",
        "name",
      ],
      "",
    );

    const fitNoteExpiry = formatDate(
      currentFitNote?.expiry_date ??
        currentFitNote?.end_date ??
        currentFitNote?.valid_until,
    );

    const currentFitNoteValue = currentFitNote
      ? fitNoteExpiry
        ? `${fitNoteTitle || "Fit note"} — until ${fitNoteExpiry}`
        : fitNoteTitle || "Recorded"
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
      [
        "absence_type",
        "leave_type",
        "category",
        "type",
        "reason",
      ],
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

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto" }}>
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
            LEO is loading your medical information.
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
            Your account has not yet been linked to an employee record. An
            organisation owner or senior user needs to complete that link
            before your medical information can appear.
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

            {medical.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </section>

          <section style={card}>
            <h2 style={heading}>Fit notes</h2>

            {fitNotes.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </section>
        </div>
      )}

      <section style={{ ...card, marginTop: 20 }}>
        <h2 style={heading}>Future capability</h2>

        <p style={{ color: "#64748B", lineHeight: 1.6 }}>
          This workspace will display uploaded fit notes, occupational health
          reports, workplace adjustments, return-to-work meetings and absence
          history directly from the Employees module. Employee updates will use
          secure audited workflows.
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
  );
}

function Row({
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