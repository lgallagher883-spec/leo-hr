"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ProfileSection from "./ProfileSection";
import Field from "./Field";
import SelectField from "./SelectField";
import SaveButton from "./SaveButton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    const { data, error } = await supabase
      .from("employee_right_to_work")
      .select(
        "id, nationality, immigration_status, visa_or_permit_type, share_code, right_to_work_expiry, restrictions, check_completed_date, next_review_date, notes, created_at"
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading right to work records:", error);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
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

    const { error } = await supabase.from("employee_right_to_work").insert([
      {
        employee_id: employeeId,
        nationality,
        immigration_status: immigrationStatus || null,
        visa_or_permit_type: visaOrPermitType || null,
        share_code: shareCode || null,
        right_to_work_expiry: rightToWorkExpiry || null,
        restrictions: restrictions || null,
        check_completed_date: checkCompletedDate || null,
        next_review_date: nextReviewDate || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving right to work record:", error);
      setMessage("Right to work record could not be saved.");
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

  return (
    <ProfileSection title="Right to Work">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Record right to work checks and review dates. If nationality is marked as
        Other, visa or permit details should be completed.
      </p>

      <SelectField
        label="Nationality"
        value={nationality}
        onChange={setNationality}
        options={nationalityOptions}
        small
      />

      {!isOtherNationality && (
        <div style={noticeStyle}>
          British / UK nationality selected. Visa fields are not required, but
          you should still record the right to work check date and any notes.
        </div>
      )}

      {isOtherNationality && (
        <div style={warningStyle}>
          Other nationality selected. Complete visa / permit details, expiry date
          and review information.
        </div>
      )}

      {isOtherNationality && (
        <>
          <Field
            label="Immigration Status"
            value={immigrationStatus}
            onChange={setImmigrationStatus}
            placeholder="e.g. Skilled Worker, Student, Dependant"
          />

          <Field
            label="Visa / Permit Type"
            value={visaOrPermitType}
            onChange={setVisaOrPermitType}
            placeholder="e.g. Skilled Worker visa"
          />

          <Field
            label="Share Code"
            value={shareCode}
            onChange={setShareCode}
            placeholder="e.g. ABC-123-XYZ"
          />

          <Field
            label="Right to Work Expiry"
            value={rightToWorkExpiry}
            onChange={setRightToWorkExpiry}
            type="date"
            small
          />

          <Field
            label="Restrictions"
            value={restrictions}
            onChange={setRestrictions}
            placeholder="Any work restrictions or conditions"
          />
        </>
      )}

      <Field
        label="Check Completed Date"
        value={checkCompletedDate}
        onChange={setCheckCompletedDate}
        type="date"
        small
      />

      <Field
        label="Next Review Date"
        value={nextReviewDate}
        onChange={setNextReviewDate}
        type="date"
        small
      />

      <Field
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Optional notes"
      />

      <SaveButton onClick={saveRecord} disabled={saving}>
        {saving ? "Saving..." : "Save right to work record"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Right to work history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>Loading right to work records...</div>
        ) : records.length === 0 ? (
          <div style={{ color: "#6B7280" }}>No right to work records yet.</div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {records.map((record) => (
              <div
                key={record.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "12px",
                  background: "#F9FAFB",
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  {record.nationality}
                  {record.visa_or_permit_type
                    ? ` · ${record.visa_or_permit_type}`
                    : ""}
                </div>

                <div style={{ color: "#6B7280", fontSize: "13px", marginTop: "4px" }}>
                  Check completed: {record.check_completed_date || "Not set"} ·
                  Next review: {record.next_review_date || "Not set"}
                </div>

                {record.right_to_work_expiry && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Right to work expiry:</strong>{" "}
                    {record.right_to_work_expiry}
                  </div>
                )}

                {record.share_code && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Share code:</strong> {record.share_code}
                  </div>
                )}

                {record.restrictions && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Restrictions:</strong> {record.restrictions}
                  </div>
                )}

                {record.notes && (
                  <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>
                    <strong>Notes:</strong> {record.notes}
                  </div>
                )}

                <div style={{ color: "#6B7280", fontSize: "12px", marginTop: "10px" }}>
                  Added {new Date(record.created_at).toLocaleString("en-GB")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileSection>
  );
}

const noticeStyle: React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  color: "#374151",
  fontSize: "14px",
  marginBottom: "14px",
};

const warningStyle: React.CSSProperties = {
  background: "#FEF3C7",
  border: "1px solid #F59E0B",
  borderRadius: "10px",
  padding: "12px",
  color: "#92400E",
  fontSize: "14px",
  marginBottom: "14px",
};