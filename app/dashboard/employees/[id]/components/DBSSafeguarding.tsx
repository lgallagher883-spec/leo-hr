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

type DBSSafeguardingProps = {
  employeeId: number;
};

type DBSRecord = {
  id: number;
  dbs_required: string;
  dbs_level: string | null;
  certificate_number: string | null;
  certificate_issue_date: string | null;
  next_check_due: string | null;
  update_service: string | null;
  update_service_id: string | null;
  safeguarding_training_completed: string | null;
  safeguarding_training_expiry: string | null;
  notes: string | null;
  created_at: string;
};

const dbsRequiredOptions = ["Yes", "No"];

const dbsLevelOptions = [
  "Basic",
  "Standard",
  "Enhanced",
  "Enhanced with Children's Barred List",
  "Enhanced with Adults' Barred List",
  "Enhanced with Both Barred Lists",
];

const yesNoOptions = ["No", "Yes"];

function addMonths(dateString: string, months: number) {
  if (!dateString) return "";

  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);

  return date.toISOString().slice(0, 10);
}

export default function DBSSafeguarding({ employeeId }: DBSSafeguardingProps) {
  const [records, setRecords] = useState<DBSRecord[]>([]);

  const [dbsRequired, setDbsRequired] = useState("Yes");
  const [dbsLevel, setDbsLevel] = useState("Basic");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificateIssueDate, setCertificateIssueDate] = useState("");
  const [nextCheckDue, setNextCheckDue] = useState("");
  const [updateService, setUpdateService] = useState("No");
  const [updateServiceId, setUpdateServiceId] = useState("");
  const [safeguardingTrainingCompleted, setSafeguardingTrainingCompleted] =
    useState("");
  const [safeguardingTrainingExpiry, setSafeguardingTrainingExpiry] =
    useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadRecords() {
    const { data, error } = await supabase
      .from("employee_dbs_checks")
      .select(
        "id, dbs_required, dbs_level, certificate_number, certificate_issue_date, next_check_due, update_service, update_service_id, safeguarding_training_completed, safeguarding_training_expiry, notes, created_at"
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading DBS records:", error);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRecords();
  }, [employeeId]);

  function handleCertificateIssueDateChange(value: string) {
    setCertificateIssueDate(value);

    if (value) {
      setNextCheckDue(addMonths(value, 11));
    } else {
      setNextCheckDue("");
    }
  }

  async function saveRecord() {
    if (dbsRequired === "Yes" && !certificateIssueDate) {
      setMessage("Please enter the DBS certificate issue date.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employee_dbs_checks").insert([
      {
        employee_id: employeeId,
        dbs_required: dbsRequired,
        dbs_level: dbsRequired === "Yes" ? dbsLevel : null,
        certificate_number: certificateNumber || null,
        certificate_issue_date: certificateIssueDate || null,
        next_check_due: nextCheckDue || null,
        update_service: updateService || null,
        update_service_id: updateServiceId || null,
        safeguarding_training_completed:
          safeguardingTrainingCompleted || null,
        safeguarding_training_expiry: safeguardingTrainingExpiry || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving DBS record:", error);
      setMessage("DBS / safeguarding record could not be saved.");
      setSaving(false);
      return;
    }

    setDbsRequired("Yes");
    setDbsLevel("Basic");
    setCertificateNumber("");
    setCertificateIssueDate("");
    setNextCheckDue("");
    setUpdateService("No");
    setUpdateServiceId("");
    setSafeguardingTrainingCompleted("");
    setSafeguardingTrainingExpiry("");
    setNotes("");
    setMessage("DBS / safeguarding record saved.");
    setSaving(false);
    loadRecords();
  }

  return (
    <ProfileSection title="DBS / Safeguarding">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Record DBS checks, review dates and safeguarding training. When a DBS
        certificate issue date is entered, the next check due date is
        automatically set to 11 months later.
      </p>

      <SelectField
        label="DBS Required"
        value={dbsRequired}
        onChange={setDbsRequired}
        options={dbsRequiredOptions}
        small
      />

      {dbsRequired === "Yes" && (
        <>
          <SelectField
            label="DBS Level"
            value={dbsLevel}
            onChange={setDbsLevel}
            options={dbsLevelOptions}
          />

          <Field
            label="Certificate Number"
            value={certificateNumber}
            onChange={setCertificateNumber}
            placeholder="Optional"
          />

          <Field
            label="DBS Certificate Issue Date"
            value={certificateIssueDate}
            onChange={handleCertificateIssueDateChange}
            type="date"
            small
          />

          <Field
            label="Next DBS Check Due"
            value={nextCheckDue}
            onChange={setNextCheckDue}
            type="date"
            small
          />

          <SelectField
            label="DBS Update Service"
            value={updateService}
            onChange={setUpdateService}
            options={yesNoOptions}
            small
          />

          {updateService === "Yes" && (
            <Field
              label="Update Service ID"
              value={updateServiceId}
              onChange={setUpdateServiceId}
              placeholder="Optional"
            />
          )}
        </>
      )}

      <Field
        label="Safeguarding Training Completed"
        value={safeguardingTrainingCompleted}
        onChange={setSafeguardingTrainingCompleted}
        type="date"
        small
      />

      <Field
        label="Safeguarding Training Expiry"
        value={safeguardingTrainingExpiry}
        onChange={setSafeguardingTrainingExpiry}
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
        {saving ? "Saving..." : "Save DBS / safeguarding record"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          DBS / safeguarding history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>
            Loading DBS / safeguarding records...
          </div>
        ) : records.length === 0 ? (
          <div style={{ color: "#6B7280" }}>
            No DBS / safeguarding records yet.
          </div>
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
                  DBS required: {record.dbs_required}
                  {record.dbs_level ? ` · ${record.dbs_level}` : ""}
                </div>

                <div
                  style={{
                    color: "#6B7280",
                    fontSize: "13px",
                    marginTop: "4px",
                  }}
                >
                  Issue date: {record.certificate_issue_date || "Not set"} ·
                  Next check due: {record.next_check_due || "Not set"}
                </div>

                {record.certificate_number && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Certificate number:</strong>{" "}
                    {record.certificate_number}
                  </div>
                )}

                {record.update_service && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Update service:</strong> {record.update_service}
                    {record.update_service_id
                      ? ` · ${record.update_service_id}`
                      : ""}
                  </div>
                )}

                {(record.safeguarding_training_completed ||
                  record.safeguarding_training_expiry) && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Safeguarding training:</strong>{" "}
                    {record.safeguarding_training_completed || "Not set"} ·
                    expires {record.safeguarding_training_expiry || "Not set"}
                  </div>
                )}

                {record.notes && (
                  <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>
                    <strong>Notes:</strong> {record.notes}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </ProfileSection>
  );
}