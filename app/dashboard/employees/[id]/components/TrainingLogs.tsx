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

type TrainingLogsProps = {
  employeeId: number;
};

type TrainingRecord = {
  id: number;
  training_name: string;
  date_completed: string | null;
  refresh_or_expiry_date: string | null;
  notes: string | null;
  created_at: string;
};

export default function TrainingLogs({ employeeId }: TrainingLogsProps) {
  const [records, setRecords] = useState<TrainingRecord[]>([]);

  const [trainingName, setTrainingName] = useState("");
  const [dateCompleted, setDateCompleted] = useState("");
  const [refreshOrExpiryDate, setRefreshOrExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editTrainingName, setEditTrainingName] = useState("");
  const [editDateCompleted, setEditDateCompleted] = useState("");
  const [editRefreshOrExpiryDate, setEditRefreshOrExpiryDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTrainingLogs() {
    const { data, error } = await supabase
      .from("employee_training_logs")
      .select(
        "id, training_name, date_completed, refresh_or_expiry_date, notes, created_at"
      )
      .eq("employee_id", employeeId)
      .order("date_completed", { ascending: false });

    if (error) {
      console.error("Error loading training logs:", error);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTrainingLogs();
  }, [employeeId]);

  async function saveTrainingLog() {
    if (!trainingName.trim()) {
      setMessage("Please enter the training name.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employee_training_logs").insert([
      {
        employee_id: employeeId,
        training_name: trainingName.trim(),
        date_completed: dateCompleted || null,
        refresh_or_expiry_date: refreshOrExpiryDate || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving training log:", error);
      setMessage("Training log could not be saved.");
      setSaving(false);
      return;
    }

    setTrainingName("");
    setDateCompleted("");
    setRefreshOrExpiryDate("");
    setNotes("");
    setMessage("Training log saved.");
    setSaving(false);
    loadTrainingLogs();
  }

  function startEditing(record: TrainingRecord) {
    setEditingRecordId(record.id);
    setEditTrainingName(record.training_name || "");
    setEditDateCompleted(record.date_completed || "");
    setEditRefreshOrExpiryDate(record.refresh_or_expiry_date || "");
    setEditNotes(record.notes || "");
    setMessage("");
  }

  function cancelEditing() {
    setEditingRecordId(null);
    setEditTrainingName("");
    setEditDateCompleted("");
    setEditRefreshOrExpiryDate("");
    setEditNotes("");
  }

  async function saveEditedTrainingLog(recordId: number) {
    if (!editTrainingName.trim()) {
      setMessage("Please enter the training name.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("employee_training_logs")
      .update({
        training_name: editTrainingName.trim(),
        date_completed: editDateCompleted || null,
        refresh_or_expiry_date: editRefreshOrExpiryDate || null,
        notes: editNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (error) {
      console.error("Error updating training log:", error);
      setMessage("Training log could not be updated.");
      setSaving(false);
      return;
    }

    cancelEditing();
    setMessage("Training log updated.");
    setSaving(false);
    loadTrainingLogs();
  }

  return (
    <ProfileSection title="Training Logs">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Record training completed by this employee, including refresher or
        expiry dates for training that needs renewing.
      </p>

      <Field
        label="Training Name"
        value={trainingName}
        onChange={setTrainingName}
        placeholder="e.g. Safeguarding Level 2, Fire Safety"
      />

      <Field
        label="Date Completed"
        value={dateCompleted}
        onChange={setDateCompleted}
        type="date"
        small
      />

      <Field
        label="Refresh / Expiry Date"
        value={refreshOrExpiryDate}
        onChange={setRefreshOrExpiryDate}
        type="date"
        small
      />

      <Field
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Optional notes"
      />

      <SaveButton onClick={saveTrainingLog} disabled={saving}>
        {saving ? "Saving..." : "Save training log"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Training history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>Loading training logs...</div>
        ) : records.length === 0 ? (
          <div style={{ color: "#6B7280" }}>No training logs yet.</div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {records.map((record) => (
              <div key={record.id} style={cardStyle}>
                {editingRecordId === record.id ? (
                  <>
                    <Field
                      label="Training Name"
                      value={editTrainingName}
                      onChange={setEditTrainingName}
                      placeholder="e.g. Safeguarding Level 2, Fire Safety"
                    />

                    <Field
                      label="Date Completed"
                      value={editDateCompleted}
                      onChange={setEditDateCompleted}
                      type="date"
                      small
                    />

                    <Field
                      label="Refresh / Expiry Date"
                      value={editRefreshOrExpiryDate}
                      onChange={setEditRefreshOrExpiryDate}
                      type="date"
                      small
                    />

                    <Field
                      label="Notes"
                      value={editNotes}
                      onChange={setEditNotes}
                      placeholder="Optional notes"
                    />

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => saveEditedTrainingLog(record.id)}
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
                      {record.training_name}
                    </div>

                    <div style={metaStyle}>
                      Completed: {record.date_completed || "Not set"} · Refresh
                      / expiry: {record.refresh_or_expiry_date || "Not set"}
                    </div>

                    {record.notes && (
                      <div style={{ marginTop: "10px", whiteSpace: "pre-wrap" }}>
                        {record.notes}
                      </div>
                    )}

                    <div style={dateStyle}>
                      Added {new Date(record.created_at).toLocaleString("en-GB")}
                    </div>

                    <button
                      onClick={() => startEditing(record)}
                      style={smallLightButtonStyle}
                    >
                      Open / edit training log
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