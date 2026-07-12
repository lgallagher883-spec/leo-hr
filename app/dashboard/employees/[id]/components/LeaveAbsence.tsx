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

type LeaveAbsenceProps = {
  employeeId: number;
};

type LeaveRecord = {
  id: number;
  leave_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  days_taken: number | string | null;
  notes: string | null;
  created_at: string;
};

const leaveTypes = [
  "Annual Leave",
  "Sickness Absence",
  "Maternity Leave",
  "Paternity Leave",
  "Shared Parental Leave",
  "Adoption Leave",
  "Parental Bereavement Leave",
  "Carer's Leave",
  "Parental Leave",
  "Time Off for Dependants",
  "Compassionate Leave",
  "Jury Service",
  "Furlough",
  "Unpaid Leave",
  "Garden Leave",
  "Other",
];

const statusOptions = ["Requested", "Approved", "Taken", "Cancelled"];

export default function LeaveAbsence({ employeeId }: LeaveAbsenceProps) {
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState(0);

  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [status, setStatus] = useState("Requested");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysTaken, setDaysTaken] = useState("");
  const [notes, setNotes] = useState("");

  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editLeaveType, setEditLeaveType] = useState("Annual Leave");
  const [editStatus, setEditStatus] = useState("Requested");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editDaysTaken, setEditDaysTaken] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadRecords() {
    const { data, error } = await supabase
      .from("employee_leave_records")
      .select(
        "id, leave_type, status, start_date, end_date, days_taken, notes, created_at"
      )
      .eq("employee_id", employeeId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error loading leave records:", error);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }

  async function loadAnnualLeaveAllowance() {
    const { data, error } = await supabase
      .from("employee_employment_details")
      .select("annual_leave_allowance")
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (error) {
      console.error("Error loading annual leave allowance:", error);
      return;
    }

    const allowance = Number(data?.annual_leave_allowance || 0);
    setAnnualLeaveAllowance(Number.isNaN(allowance) ? 0 : allowance);
  }

  useEffect(() => {
    loadRecords();
    loadAnnualLeaveAllowance();
  }, [employeeId]);

  async function saveRecord() {
    if (!startDate) {
      setMessage("Please add a start date before saving.");
      return;
    }

    if (!daysTaken) {
      setMessage("Please enter the number of days taken.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employee_leave_records").insert([
      {
        employee_id: employeeId,
        leave_type: leaveType,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        days_taken: Number(daysTaken),
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving leave record:", error);
      setMessage("Leave / absence record could not be saved.");
      setSaving(false);
      return;
    }

    setLeaveType("Annual Leave");
    setStatus("Requested");
    setStartDate("");
    setEndDate("");
    setDaysTaken("");
    setNotes("");
    setMessage("Leave / absence record saved.");
    setSaving(false);

    await loadRecords();
    await loadAnnualLeaveAllowance();
  }

  function startEditing(record: LeaveRecord) {
    setEditingRecordId(record.id);
    setEditLeaveType(record.leave_type || "Annual Leave");
    setEditStatus(record.status || "Requested");
    setEditStartDate(record.start_date || "");
    setEditEndDate(record.end_date || "");
    setEditDaysTaken(record.days_taken ? String(record.days_taken) : "");
    setEditNotes(record.notes || "");
    setMessage("");
  }

  function cancelEditing() {
    setEditingRecordId(null);
    setEditLeaveType("Annual Leave");
    setEditStatus("Requested");
    setEditStartDate("");
    setEditEndDate("");
    setEditDaysTaken("");
    setEditNotes("");
  }

  async function saveEditedRecord(recordId: number) {
    if (!editStartDate) {
      setMessage("Please add a start date before saving.");
      return;
    }

    if (!editDaysTaken) {
      setMessage("Please enter the number of days taken.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("employee_leave_records")
      .update({
        leave_type: editLeaveType,
        status: editStatus,
        start_date: editStartDate || null,
        end_date: editEndDate || null,
        days_taken: Number(editDaysTaken),
        notes: editNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (error) {
      console.error("Error updating leave record:", error);
      setMessage("Leave / absence record could not be updated.");
      setSaving(false);
      return;
    }

    cancelEditing();
    setMessage("Leave / absence record updated.");
    setSaving(false);

    await loadRecords();
    await loadAnnualLeaveAllowance();
  }

  const annualLeaveUsed = records
    .filter(
      (record) =>
        record.leave_type === "Annual Leave" && record.status !== "Cancelled"
    )
    .reduce((total, record) => {
      const days = Number(record.days_taken || 0);
      return total + (Number.isNaN(days) ? 0 : days);
    }, 0);

  const annualLeaveRemaining = annualLeaveAllowance - annualLeaveUsed;

  return (
    <ProfileSection title="Leave & Absence">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Record annual leave, sickness absence and other types of statutory or
        workplace leave.
      </p>

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Annual Entitlement"
          value={`${annualLeaveAllowance} days`}
        />
        <SummaryCard label="Annual Leave Used" value={`${annualLeaveUsed} days`} />
        <SummaryCard label="Remaining" value={`${annualLeaveRemaining} days`} />
      </div>

      <div style={formGridStyle}>
        <SelectField
          label="Leave Type"
          value={leaveType}
          onChange={setLeaveType}
          options={leaveTypes}
        />

        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={statusOptions}
          small
        />

        <Field
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
          type="date"
          small
        />

        <Field
          label="End Date"
          value={endDate}
          onChange={setEndDate}
          type="date"
          small
        />

        <Field
          label="Days Taken"
          value={daysTaken}
          onChange={setDaysTaken}
          placeholder="e.g. 1, 2.5, 5"
          type="number"
          small
        />

        <Field
          label="Notes"
          value={notes}
          onChange={setNotes}
          placeholder="Optional notes"
        />
      </div>

      <SaveButton onClick={saveRecord} disabled={saving}>
        {saving ? "Saving..." : "Save leave / absence record"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Leave & absence history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>Loading records...</div>
        ) : records.length === 0 ? (
          <div style={{ color: "#6B7280" }}>
            No leave or absence records yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {records.map((record) => (
              <div key={record.id} style={cardStyle}>
                {editingRecordId === record.id ? (
                  <>
                    <div style={formGridStyle}>
                      <SelectField
                        label="Leave Type"
                        value={editLeaveType}
                        onChange={setEditLeaveType}
                        options={leaveTypes}
                      />

                      <SelectField
                        label="Status"
                        value={editStatus}
                        onChange={setEditStatus}
                        options={statusOptions}
                        small
                      />

                      <Field
                        label="Start Date"
                        value={editStartDate}
                        onChange={setEditStartDate}
                        type="date"
                        small
                      />

                      <Field
                        label="End Date"
                        value={editEndDate}
                        onChange={setEditEndDate}
                        type="date"
                        small
                      />

                      <Field
                        label="Days Taken"
                        value={editDaysTaken}
                        onChange={setEditDaysTaken}
                        placeholder="e.g. 1, 2.5, 5"
                        type="number"
                        small
                      />

                      <Field
                        label="Notes"
                        value={editNotes}
                        onChange={setEditNotes}
                        placeholder="Optional notes"
                      />
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => saveEditedRecord(record.id)}
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
                      {record.leave_type} · {record.status}
                    </div>

                    <div style={metaStyle}>
                      {record.start_date || "No start date"} →{" "}
                      {record.end_date || "No end date"} ·{" "}
                      {record.days_taken ?? "No"} days
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
                      Open / edit leave record
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "14px",
        background: "#F9FAFB",
      }}
    >
      <div style={{ color: "#6B7280", fontSize: "13px" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: "20px", marginTop: "4px" }}>
        {value}
      </div>
    </div>
  );
}

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "20px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px 16px",
  alignItems: "start",
};

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