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

type EmployeeWarningsProps = {
  employeeId: number;
};

type Warning = {
  id: number;
  warning_type: string;
  date_issued: string | null;
  review_date: string | null;
  summary: string | null;
  outcome: string | null;
  created_at: string;
};

const warningTypes = ["Informal", "Verbal", "Written", "Final written", "Other"];

export default function EmployeeWarnings({ employeeId }: EmployeeWarningsProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);

  const [warningType, setWarningType] = useState("Informal");
  const [dateIssued, setDateIssued] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");

  const [editingWarningId, setEditingWarningId] = useState<number | null>(null);
  const [editWarningType, setEditWarningType] = useState("Informal");
  const [editDateIssued, setEditDateIssued] = useState("");
  const [editReviewDate, setEditReviewDate] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editOutcome, setEditOutcome] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadWarnings() {
    const { data, error } = await supabase
      .from("employee_warnings")
      .select(
        "id, warning_type, date_issued, review_date, summary, outcome, created_at"
      )
      .eq("employee_id", employeeId)
      .order("date_issued", { ascending: false });

    if (error) {
      console.error("Error loading warnings:", error);
      setLoading(false);
      return;
    }

    setWarnings(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadWarnings();
  }, [employeeId]);

  async function saveWarning() {
    if (!summary.trim()) {
      setMessage("Please add a short summary before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employee_warnings").insert([
      {
        employee_id: employeeId,
        warning_type: warningType,
        date_issued: dateIssued || null,
        review_date: reviewDate || null,
        summary: summary.trim(),
        outcome: outcome || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving warning:", error);
      setMessage("Warning could not be saved.");
      setSaving(false);
      return;
    }

    setWarningType("Informal");
    setDateIssued("");
    setReviewDate("");
    setSummary("");
    setOutcome("");
    setMessage("Warning saved.");
    setSaving(false);
    loadWarnings();
  }

  function startEditing(warning: Warning) {
    setEditingWarningId(warning.id);
    setEditWarningType(warning.warning_type || "Informal");
    setEditDateIssued(warning.date_issued || "");
    setEditReviewDate(warning.review_date || "");
    setEditSummary(warning.summary || "");
    setEditOutcome(warning.outcome || "");
    setMessage("");
  }

  function cancelEditing() {
    setEditingWarningId(null);
    setEditWarningType("Informal");
    setEditDateIssued("");
    setEditReviewDate("");
    setEditSummary("");
    setEditOutcome("");
  }

  async function saveEditedWarning(warningId: number) {
    if (!editSummary.trim()) {
      setMessage("Please add a short summary before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("employee_warnings")
      .update({
        warning_type: editWarningType,
        date_issued: editDateIssued || null,
        review_date: editReviewDate || null,
        summary: editSummary.trim(),
        outcome: editOutcome || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", warningId);

    if (error) {
      console.error("Error updating warning:", error);
      setMessage("Warning could not be updated.");
      setSaving(false);
      return;
    }

    cancelEditing();
    setMessage("Warning updated.");
    setSaving(false);
    loadWarnings();
  }

  return (
    <ProfileSection title="Warnings">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Record formal and informal warnings. Keep entries factual and linked to
        the relevant HR process where appropriate.
      </p>

      <SelectField
        label="Warning Type"
        value={warningType}
        onChange={setWarningType}
        options={warningTypes}
        small
      />

      <Field
        label="Date Issued"
        value={dateIssued}
        onChange={setDateIssued}
        type="date"
        small
      />

      <Field
        label="Review / Expiry Date"
        value={reviewDate}
        onChange={setReviewDate}
        type="date"
        small
      />

      <Field
        label="Summary"
        value={summary}
        onChange={setSummary}
        placeholder="Brief factual summary"
      />

      <Field
        label="Outcome"
        value={outcome}
        onChange={setOutcome}
        placeholder="Optional outcome or next step"
      />

      <SaveButton onClick={saveWarning} disabled={saving}>
        {saving ? "Saving..." : "Save warning"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Warning history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>Loading warnings...</div>
        ) : warnings.length === 0 ? (
          <div style={{ color: "#6B7280" }}>No warnings recorded.</div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {warnings.map((warning) => (
              <div key={warning.id} style={cardStyle}>
                {editingWarningId === warning.id ? (
                  <>
                    <SelectField
                      label="Warning Type"
                      value={editWarningType}
                      onChange={setEditWarningType}
                      options={warningTypes}
                      small
                    />

                    <Field
                      label="Date Issued"
                      value={editDateIssued}
                      onChange={setEditDateIssued}
                      type="date"
                      small
                    />

                    <Field
                      label="Review / Expiry Date"
                      value={editReviewDate}
                      onChange={setEditReviewDate}
                      type="date"
                      small
                    />

                    <Field
                      label="Summary"
                      value={editSummary}
                      onChange={setEditSummary}
                      placeholder="Brief factual summary"
                    />

                    <Field
                      label="Outcome"
                      value={editOutcome}
                      onChange={setEditOutcome}
                      placeholder="Optional outcome or next step"
                    />

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => saveEditedWarning(warning.id)}
                        disabled={saving}
                        style={smallDarkButtonStyle}
                      >
                        Save changes
                      </button>

                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        style={smallLightButtonStyle}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 800 }}>
                      {warning.warning_type}
                    </div>

                    <div style={metaStyle}>
                      Issued: {warning.date_issued || "Not set"} ·
                      Review/expiry: {warning.review_date || "Not set"}
                    </div>

                    <div style={{ marginTop: "10px", whiteSpace: "pre-wrap" }}>
                      {warning.summary}
                    </div>

                    {warning.outcome && (
                      <div style={{ marginTop: "8px", color: "#374151" }}>
                        <strong>Outcome:</strong> {warning.outcome}
                      </div>
                    )}

                    <div style={dateStyle}>
                      Added {new Date(warning.created_at).toLocaleString("en-GB")}
                    </div>

                    <button
                      onClick={() => startEditing(warning)}
                      style={smallLightButtonStyle}
                    >
                      Open / edit warning
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileSection>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  background: "#F9FAFB",
};

const metaStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "13px",
  marginTop: "4px",
};

const dateStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  marginTop: "10px",
};

const smallDarkButtonStyle: React.CSSProperties = {
  marginTop: "10px",
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "7px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
};

const smallLightButtonStyle: React.CSSProperties = {
  marginTop: "10px",
  background: "#fff",
  color: "#374151",
  border: "1px solid #e5e7eb",
  padding: "7px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
};