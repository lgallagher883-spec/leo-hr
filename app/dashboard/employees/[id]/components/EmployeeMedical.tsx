"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import ProfileSection from "./ProfileSection";
import Field from "./Field";
import SaveButton from "./SaveButton";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmployeeMedicalProps = {
  employeeId: number;
};

type MedicalRecord = {
  id: number;
  medical_condition: string | null;
  since_date: string | null;
  reasonable_adjustments: string | null;
  additional_notes: string | null;
  created_at: string;
};

export default function EmployeeMedical({ employeeId }: EmployeeMedicalProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  const [medicalCondition, setMedicalCondition] = useState("");
  const [sinceDate, setSinceDate] = useState("");
  const [reasonableAdjustments, setReasonableAdjustments] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editMedicalCondition, setEditMedicalCondition] = useState("");
  const [editSinceDate, setEditSinceDate] = useState("");
  const [editReasonableAdjustments, setEditReasonableAdjustments] = useState("");
  const [editAdditionalNotes, setEditAdditionalNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadMedicalRecords() {
    const { data, error } = await supabase
      .from("employee_medical")
      .select(
        "id, medical_condition, since_date, reasonable_adjustments, additional_notes, created_at"
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading medical records:", error);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMedicalRecords();
  }, [employeeId]);

  async function saveMedical() {
    if (!medicalCondition.trim()) {
      setMessage("Please enter a medical condition before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employee_medical").insert([
      {
        employee_id: employeeId,
        medical_condition: medicalCondition.trim(),
        since_date: sinceDate || null,
        reasonable_adjustments: reasonableAdjustments || null,
        additional_notes: additionalNotes || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving medical record:", error);
      setMessage("Medical record could not be saved.");
      setSaving(false);
      return;
    }

    setMedicalCondition("");
    setSinceDate("");
    setReasonableAdjustments("");
    setAdditionalNotes("");
    setMessage("Medical record saved.");
    setSaving(false);
    loadMedicalRecords();
  }

  function startEditing(record: MedicalRecord) {
    setEditingRecordId(record.id);
    setEditMedicalCondition(record.medical_condition || "");
    setEditSinceDate(record.since_date || "");
    setEditReasonableAdjustments(record.reasonable_adjustments || "");
    setEditAdditionalNotes(record.additional_notes || "");
    setMessage("");
  }

  function cancelEditing() {
    setEditingRecordId(null);
    setEditMedicalCondition("");
    setEditSinceDate("");
    setEditReasonableAdjustments("");
    setEditAdditionalNotes("");
  }

  async function saveEditedMedicalRecord(recordId: number) {
    if (!editMedicalCondition.trim()) {
      setMessage("Please enter a medical condition before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("employee_medical")
      .update({
        medical_condition: editMedicalCondition.trim(),
        since_date: editSinceDate || null,
        reasonable_adjustments: editReasonableAdjustments || null,
        additional_notes: editAdditionalNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (error) {
      console.error("Error updating medical record:", error);
      setMessage("Medical record could not be updated.");
      setSaving(false);
      return;
    }

    cancelEditing();
    setMessage("Medical record updated.");
    setSaving(false);
    loadMedicalRecords();
  }

  return (
    <ProfileSection title="Medical">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Record relevant workplace medical context and reasonable adjustments.
        This information is sensitive and should only be used where it is
        relevant to employment, welfare, adjustments or HR risk.
      </p>

      <Field
        label="Medical Condition"
        value={medicalCondition}
        onChange={setMedicalCondition}
        placeholder="e.g. ADHD, Type 1 diabetes"
      />

      <Field
        label="Since"
        value={sinceDate}
        onChange={setSinceDate}
        placeholder="Year / date"
        small
      />

      <Field
        label="Reasonable Adjustments"
        value={reasonableAdjustments}
        onChange={setReasonableAdjustments}
        placeholder="e.g. quiet workspace, flexible start times"
      />

      <Field
        label="Additional Health Notes"
        value={additionalNotes}
        onChange={setAdditionalNotes}
        placeholder="Optional notes"
      />

      <SaveButton onClick={saveMedical} disabled={saving}>
        {saving ? "Saving..." : "Save medical record"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Medical history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>Loading medical records...</div>
        ) : records.length === 0 ? (
          <div style={{ color: "#6B7280" }}>No medical records yet.</div>
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
                {editingRecordId === record.id ? (
                  <>
                    <Field
                      label="Medical Condition"
                      value={editMedicalCondition}
                      onChange={setEditMedicalCondition}
                      placeholder="e.g. ADHD, Type 1 diabetes"
                    />

                    <Field
                      label="Since"
                      value={editSinceDate}
                      onChange={setEditSinceDate}
                      placeholder="Year / date"
                      small
                    />

                    <Field
                      label="Reasonable Adjustments"
                      value={editReasonableAdjustments}
                      onChange={setEditReasonableAdjustments}
                      placeholder="e.g. quiet workspace, flexible start times"
                    />

                    <Field
                      label="Additional Health Notes"
                      value={editAdditionalNotes}
                      onChange={setEditAdditionalNotes}
                      placeholder="Optional notes"
                    />

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => saveEditedMedicalRecord(record.id)}
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
                      {record.medical_condition || "Medical record"}
                    </div>

                    <div
                      style={{
                        color: "#6B7280",
                        fontSize: "13px",
                        marginTop: "4px",
                      }}
                    >
                      Since: {record.since_date || "Not set"}
                    </div>

                    {record.reasonable_adjustments && (
                      <div style={{ marginTop: "10px" }}>
                        <strong>Reasonable adjustments:</strong>{" "}
                        {record.reasonable_adjustments}
                      </div>
                    )}

                    {record.additional_notes && (
                      <div style={{ marginTop: "10px", whiteSpace: "pre-wrap" }}>
                        <strong>Notes:</strong> {record.additional_notes}
                      </div>
                    )}

                    <div
                      style={{
                        color: "#6B7280",
                        fontSize: "12px",
                        marginTop: "10px",
                      }}
                    >
                      Added {new Date(record.created_at).toLocaleString("en-GB")}
                    </div>

                    <button
                      onClick={() => startEditing(record)}
                      style={smallLightButtonStyle}
                    >
                      Open / edit medical record
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