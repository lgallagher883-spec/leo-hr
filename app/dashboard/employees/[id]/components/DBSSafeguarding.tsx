"use client";

import { useEffect, useState } from "react";
import ProfileSection from "./ProfileSection";
import Field from "./Field";
import SelectField from "./SelectField";
import SaveButton from "./SaveButton";

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
  update_service_last_check_date: string | null;
  update_service_next_check_due: string | null;
  update_service_consent_confirmed: boolean | null;
  update_service_certificate_seen: boolean | null;
  update_service_identity_confirmed: boolean | null;
  update_service_eligibility_confirmed: boolean | null;
  update_service_result: string | null;
  safeguarding_training_completed: string | null;
  safeguarding_training_expiry: string | null;
  notes: string | null;
  created_at: string;
  carecheck?: Record<string, any> | null;
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
  const [updateServiceLastCheckDate, setUpdateServiceLastCheckDate] = useState("");
  const [updateServiceNextCheckDue, setUpdateServiceNextCheckDue] = useState("");
  const [updateServiceConsentConfirmed, setUpdateServiceConsentConfirmed] = useState(false);
  const [updateServiceCertificateSeen, setUpdateServiceCertificateSeen] = useState(false);
  const [updateServiceIdentityConfirmed, setUpdateServiceIdentityConfirmed] = useState(false);
  const [updateServiceEligibilityConfirmed, setUpdateServiceEligibilityConfirmed] = useState(false);
  const [updateServiceResult, setUpdateServiceResult] = useState("");
  const [safeguardingTrainingCompleted, setSafeguardingTrainingCompleted] =
    useState("");
  const [safeguardingTrainingExpiry, setSafeguardingTrainingExpiry] =
    useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [careCheckBusy, setCareCheckBusy] = useState(false);

  async function loadRecords() {
    setLoading(true);

    try {
      const response = await fetch(`/api/employees/${employeeId}/dbs-safeguarding`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "DBS / safeguarding records could not be loaded.");
      }

      const seen = new Set<string>();
      const uniqueRecords = (result.records || []).filter((record: DBSRecord) => {
        const key = JSON.stringify([
          record.dbs_required, record.dbs_level, record.certificate_number,
          record.certificate_issue_date, record.next_check_due, record.update_service,
          record.update_service_id, record.update_service_last_check_date,
          record.update_service_next_check_due, record.update_service_consent_confirmed,
          record.update_service_certificate_seen, record.update_service_identity_confirmed,
          record.update_service_eligibility_confirmed, record.update_service_result, record.safeguarding_training_completed,
          record.safeguarding_training_expiry, record.notes,
        ]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setRecords(uniqueRecords);
    } catch (error) {
      console.error("Error loading DBS records:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "DBS / safeguarding records could not be loaded."
      );
    } finally {
      setLoading(false);
    }
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
    if (dbsRequired === "Yes" && updateService === "No" && !certificateIssueDate) {
      setMessage("Please enter the DBS certificate issue date.");
      return;
    }
    if (updateService === "Yes") {
      if (dbsLevel === "Basic") {
        setMessage("The DBS Update Service is only available for Standard and Enhanced certificates.");
        return;
      }
      if (!certificateNumber || !updateServiceLastCheckDate || !updateServiceResult) {
        setMessage("For an Update Service check, record the certificate number, check date and result.");
        return;
      }
      if (!updateServiceConsentConfirmed || !updateServiceCertificateSeen || !updateServiceIdentityConfirmed || !updateServiceEligibilityConfirmed) {
        setMessage("Confirm consent, original certificate viewing, identity checking and legal eligibility before recording an Update Service status check.");
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/employees/${employeeId}/dbs-safeguarding`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dbsRequired,
          dbsLevel: dbsRequired === "Yes" ? dbsLevel : null,
          certificateNumber: certificateNumber || null,
          certificateIssueDate: certificateIssueDate || null,
          nextCheckDue: nextCheckDue || null,
          updateService: updateService || null,
          updateServiceId: updateServiceId || null,
          updateServiceLastCheckDate: updateServiceLastCheckDate || null,
          updateServiceNextCheckDue: updateServiceNextCheckDue || null,
          updateServiceConsentConfirmed,
          updateServiceCertificateSeen,
          updateServiceIdentityConfirmed,
          updateServiceEligibilityConfirmed,
          updateServiceResult: updateServiceResult || null,
          safeguardingTrainingCompleted: safeguardingTrainingCompleted || null,
          safeguardingTrainingExpiry: safeguardingTrainingExpiry || null,
          notes: notes || null,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "DBS / safeguarding record could not be saved.");
      }
    } catch (error) {
      console.error("Error saving DBS record:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "DBS / safeguarding record could not be saved."
      );
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
    setUpdateServiceLastCheckDate("");
    setUpdateServiceNextCheckDue("");
    setUpdateServiceConsentConfirmed(false);
    setUpdateServiceCertificateSeen(false);
    setUpdateServiceIdentityConfirmed(false);
    setUpdateServiceEligibilityConfirmed(false);
    setUpdateServiceResult("");
    setSafeguardingTrainingCompleted("");
    setSafeguardingTrainingExpiry("");
    setNotes("");
    setMessage("DBS / safeguarding record saved.");
    setSaving(false);
    loadRecords();
  }

  const careCheckRecord = records.find((record) => record.carecheck && typeof record.carecheck === "object");
  const latestCareCheck = careCheckRecord?.carecheck && typeof careCheckRecord.carecheck === "object" ? careCheckRecord.carecheck : null;

  async function runCareCheck(action: "invite" | "refresh_status") {
    setCareCheckBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/employees/${employeeId}/carecheck`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "dbs", action, dbsLevel }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "CareCheck could not complete the DBS action.");
      setMessage(action === "invite" ? "CareCheck DBS invite sent and tracking connected." : "CareCheck DBS status refreshed.");
      await loadRecords();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "CareCheck could not complete the DBS action.");
    } finally { setCareCheckBusy(false); }
  }

  return (
    <ProfileSection title="DBS / Safeguarding">
      <p style={{ color: "#5E456C", fontSize: "14px", marginTop: 0 }}>
        Record DBS checks, review dates and safeguarding training. When a DBS
        certificate issue date is entered, the next check due date is
        automatically set to 11 months later.
      </p>

      <div style={{ color: "#5E456C", fontSize: "12px", marginBottom: "10px" }}>
        CareCheck provider status is evidence for the employer to review. Leo does not make an employment or suitability decision from a provider result.
      </div>

      <div style={{ border: "1px solid #DDCDEB", borderRadius: "12px", background: "#FBF8FD", padding: "14px", marginBottom: "16px" }}>
        <div style={{ color: "#6E5084", fontSize: "11px", fontWeight: 800 }}>CareCheck</div>
        <div style={{ marginTop: "5px", fontWeight: 800 }}>DBS provider check</div>
        <div style={{ marginTop: "6px", color: "#756A79", fontSize: "12px" }}>
          {latestCareCheck?.statusDescription || latestCareCheck?.statusCode || "No CareCheck DBS application linked to this employee."}
        </div>
        {latestCareCheck?.applicationReference ? <div style={{ marginTop: "4px", color: "#756A79", fontSize: "11px" }}>Reference: {latestCareCheck.applicationReference}</div> : null}
        {latestCareCheck?.resultType != null ? <div style={{ marginTop: "4px", color: "#756A79", fontSize: "11px" }}>Provider result received — employer review required.</div> : null}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <button type="button" disabled={careCheckBusy} onClick={() => void runCareCheck(latestCareCheck?.applicationReference ? "refresh_status" : "invite")} style={{ border: "1px solid #6E5084", borderRadius: "9px", background: "#6E5084", color: "#fff", padding: "9px 12px", fontWeight: 800, cursor: careCheckBusy ? "not-allowed" : "pointer" }}>
            {careCheckBusy ? "Working..." : latestCareCheck?.applicationReference ? "Refresh CareCheck status" : "Send CareCheck DBS invite"}
          </button>
        </div>
      </div>

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

          {dbsLevel === "Basic" ? (
            <div style={{ color: "#5E456C", fontSize: "12px", marginBottom: "14px" }}>
              DBS Update Service status checks are not available for Basic DBS certificates.
            </div>
          ) : (
            <>
              <SelectField label="DBS Update Service" value={updateService} onChange={setUpdateService} options={yesNoOptions} small />
              {updateService === "Yes" ? (
                <div style={{ border: "1px solid #DDCDEB", borderRadius: "12px", background: "#FBF8FD", padding: "14px", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 800, marginBottom: "6px" }}>Record Update Service status check</div>
                  <div style={{ color: "#5E456C", fontSize: "12px", marginBottom: "12px" }}>
                    Leo records the employer's check; it does not control the employee's personal DBS Update Service subscription. Choose the next check date using your organisation's risk-based policy.
                  </div>
                  <Field label="Last Update Service Check" value={updateServiceLastCheckDate} onChange={setUpdateServiceLastCheckDate} type="date" small />
                  <Field label="Next Update Service Check Due" value={updateServiceNextCheckDue} onChange={setUpdateServiceNextCheckDue} type="date" small />
                  <SelectField label="Update Service Result" value={updateServiceResult} onChange={setUpdateServiceResult} options={["Certificate remains current", "Status changed — new DBS check required"]} />
                  <div style={{ fontWeight: 700, marginTop: "12px", marginBottom: "8px" }}>Before recording this check, confirm:</div>\n                  <label style={{ display: "grid", gap: "8px", color: "#5E456C", fontSize: "12px" }}>
                    <span><input type="checkbox" checked={updateServiceConsentConfirmed} onChange={(e) => setUpdateServiceConsentConfirmed(e.target.checked)} /> The individual has given consent for this Update Service status check</span>
                    <span><input type="checkbox" checked={updateServiceCertificateSeen} onChange={(e) => setUpdateServiceCertificateSeen(e.target.checked)} /> The original DBS certificate has been viewed in person</span>
                    <span><input type="checkbox" checked={updateServiceIdentityConfirmed} onChange={(e) => setUpdateServiceIdentityConfirmed(e.target.checked)} /> The individual's identity has been checked</span>
                    <span><input type="checkbox" checked={updateServiceEligibilityConfirmed} onChange={(e) => setUpdateServiceEligibilityConfirmed(e.target.checked)} /> We are legally entitled to carry out this status check for the same DBS level/type and workforce</span>
                  </label>
                </div>
              ) : null}
            </>
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
        <div style={{ marginTop: "10px", color: "#5E456C", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          DBS / safeguarding history
        </div>

        {loading ? (
          <div style={{ color: "#5E456C" }}>
            Loading DBS / safeguarding records...
          </div>
        ) : records.length === 0 ? (
          <div style={{ color: "#5E456C" }}>
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
                  {record.dbs_required === "Yes" && record.dbs_level ? ` · ${record.dbs_level}` : ""}
                </div>

                <div
                  style={{
                    color: "#5E456C",
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
                    {record.update_service_id ? ` · ${record.update_service_id}` : ""}
                    {record.update_service_last_check_date ? ` · last checked ${record.update_service_last_check_date}` : ""}
                    {record.update_service_next_check_due ? ` · next due ${record.update_service_next_check_due}` : ""}
                    {record.update_service_result ? <div><strong>Result:</strong> {record.update_service_result}</div> : null}
                    {record.update_service === "Yes" ? <div style={{ fontSize: "12px", color: "#5E456C" }}>Consent {record.update_service_consent_confirmed ? "confirmed" : "not recorded"} · original certificate {record.update_service_certificate_seen ? "viewed" : "not recorded"} · identity {record.update_service_identity_confirmed ? "checked" : "not recorded"} · eligibility {record.update_service_eligibility_confirmed ? "confirmed" : "not recorded"}</div> : null}
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
                    color: "#5E456C",
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