"use client";

import { useEffect, useState } from "react";
import ProfileSection from "./ProfileSection";

type RightToWorkProps = {
  employeeId: number;
};

type RightToWorkRecord = {
  id: number;
  nationality: string;
  immigration_status: string | null;
  visa_or_permit_type: string | null;
  share_code: string | null;
  right_to_work_expiry: string | null;
  restrictions: string | null;
  check_completed_date: string | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
};

const nationalityOptions = [
  "English",
  "Welsh",
  "Scottish",
  "Irish (Northern Ireland)",
  "British",
  "Other",
];

export default function RightToWork({ employeeId }: RightToWorkProps) {
  const [records, setRecords] = useState<RightToWorkRecord[]>([]);
  const [talentRecord, setTalentRecord] = useState<any>(null);

  const [nationality, setNationality] = useState("English");
  const [immigrationStatus, setImmigrationStatus] = useState("");
  const [visaOrPermitType, setVisaOrPermitType] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [rightToWorkExpiry, setRightToWorkExpiry] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [checkCompletedDate, setCheckCompletedDate] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isOtherNationality = nationality === "Other";

  async function loadRecords() {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/right-to-work`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Right to work records could not be loaded.");
      }
      setRecords(result.records || []);
      setTalentRecord(result.talentRecord || null);
    } catch (error) {
      console.error("Error loading right to work records:", error);
      setMessage(error instanceof Error ? error.message : "Right to work records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [employeeId]);

  async function saveRecord() {
    if (isOtherNationality) {
      if (!immigrationStatus.trim()) {
        setMessage("Please enter the immigration status.");
        return;
      }

      if (!visaOrPermitType.trim()) {
        setMessage("Please enter the visa or permit type.");
        return;
      }

      if (!rightToWorkExpiry) {
        setMessage("Please enter the right to work expiry date.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/employees/${employeeId}/right-to-work`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nationality,
          immigrationStatus: immigrationStatus || null,
          visaOrPermitType: visaOrPermitType || null,
          shareCode: shareCode || null,
          rightToWorkExpiry: rightToWorkExpiry || null,
          restrictions: restrictions || null,
          checkCompletedDate: checkCompletedDate || null,
          nextReviewDate: nextReviewDate || null,
          notes: notes || null,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Right to work record could not be saved.");
      }
    } catch (error) {
      console.error("Error saving right to work record:", error);
      setMessage(error instanceof Error ? error.message : "Right to work record could not be saved.");
      setSaving(false);
      return;
    }

    setNationality("English");
    setImmigrationStatus("");
    setVisaOrPermitType("");
    setShareCode("");
    setRightToWorkExpiry("");
    setRestrictions("");
    setCheckCompletedDate("");
    setNextReviewDate("");
    setNotes("");
    setMessage("Right to work record saved.");
    setSaving(false);
    loadRecords();
  }

  const talentPayload =
    talentRecord?.payload && typeof talentRecord.payload === "object"
      ? talentRecord.payload
      : null;
  const careCheck =
    talentPayload?.careCheck && typeof talentPayload.careCheck === "object"
      ? talentPayload.careCheck
      : null;
  const latest = records[0] || null;
  const status = talentPayload?.status || latest?.immigration_status || "not_recorded";
  const statusLabel = String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <ProfileSection title="Right to Work">
      {loading ? (
        <div style={{ color: "#5E456C" }}>Loading Right to Work record...</div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          <div style={summaryStyle}>
            <div>
              <div style={eyebrowStyle}>Current position</div>
              <div style={statusStyle}>{statusLabel}</div>
            </div>
            <div style={summaryGridStyle}>
              <Summary label="Checking method" value={talentPayload?.method || "Not recorded"} />
              <Summary label="Check date" value={talentPayload?.dateOfCheck || latest?.check_completed_date || "Not recorded"} />
              <Summary label="Outcome" value={talentPayload?.verificationOutcome || careCheck?.rtwCheckStatus || "Not recorded"} />
              <Summary label="Permission expiry" value={talentPayload?.expiryDate || latest?.right_to_work_expiry || "Not recorded"} />
              <Summary label="Next review" value={talentPayload?.followUpDate || latest?.next_review_date || "Not recorded"} />
              <Summary label="Provider" value={careCheck ? "CareCheck" : "Employer recorded"} />
            </div>
          </div>

          {careCheck ? (
            <div style={providerStyle}>
              <div style={eyebrowStyle}>CareCheck</div>
              <strong>{careCheck.statusDescription || careCheck.statusCode || "Provider status recorded"}</strong>
              {careCheck.rtwCheckStatus ? <span>Result: {careCheck.rtwCheckStatus}</span> : null}
              {careCheck.rtwCheckDate ? <span>Check date: {careCheck.rtwCheckDate}</span> : null}
            </div>
          ) : null}

          {records.length === 0 && !talentRecord ? (
            <div style={emptyStyle}>No Right to Work information has been recorded for this employee yet.</div>
          ) : null}
        </div>
      )}
    </ProfileSection>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  const display = String(value || "Not recorded").replace(/_/g, " ");
  return (
    <div style={itemStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{display}</div>
    </div>
  );
}

const summaryStyle: React.CSSProperties = {
  border: "1px solid #E7DDED",
  borderRadius: "14px",
  padding: "18px",
  background: "#FFFFFF",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const itemStyle: React.CSSProperties = {
  border: "1px solid #EEE7F1",
  borderRadius: "10px",
  padding: "11px",
  background: "#FBF9FC",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 800,
  
  letterSpacing: "0.05em",
};

const statusStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#342B38",
  fontSize: "18px",
  fontWeight: 800,
};

const labelStyle: React.CSSProperties = {
  color: "#817586",
  fontSize: "10px",
  fontWeight: 700,
};

const valueStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#443848",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "capitalize",
};

const providerStyle: React.CSSProperties = {
  display: "grid",
  gap: "5px",
  border: "1px solid #DDCDEB",
  borderRadius: "12px",
  background: "#FBF8FD",
  padding: "14px",
  color: "#443848",
  fontSize: "12px",
};

const emptyStyle: React.CSSProperties = {
  border: "1px solid #E7E1EA",
  borderRadius: "12px",
  padding: "14px",
  color: "#5E456C",
  background: "#FFFFFF",
};