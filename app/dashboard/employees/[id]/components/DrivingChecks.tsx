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

type DrivingChecksProps = {
  employeeId: number;
};

type DrivingRecord = {
  id: number;
  drives_for_work: string;
  vehicle_used: string | null;
  authorised_to_drive: string | null;
  driving_licence_number: string | null;
  licence_categories: string | null;
  licence_issue_date: string | null;
  licence_expiry_date: string | null;
  dvla_check_completed: string | null;
  dvla_check_date: string | null;
  next_dvla_check_due: string | null;
  business_insurance_confirmed: string | null;
  business_insurance_expiry_date: string | null;
  penalty_points: number | null;
  motoring_convictions: string | null;
  restrictions_or_adjustments: string | null;
  senior_authorisation_required: string | null;
  authorised_by: string | null;
  date_authorised: string | null;
  notes: string | null;
  created_at: string;
};

const yesNoOptions = ["No", "Yes"];
const yesNoNaOptions = ["No", "Yes", "Not Applicable"];
const vehicleOptions = ["Own vehicle", "Company vehicle", "Both"];

function addMonths(dateString: string, months: number) {
  if (!dateString) return "";

  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);

  return date.toISOString().slice(0, 10);
}

function getDrivingRisk(points: string) {
  const numericPoints = Number(points || 0);

  if (Number.isNaN(numericPoints)) {
    return {
      label: "Risk not assessed",
      message: "Enter penalty points to assess driving risk.",
    };
  }

  if (numericPoints >= 10) {
    return {
      label: "Very high risk",
      message:
        "10 or more penalty points recorded. Senior management review is strongly recommended before authorising business driving.",
    };
  }

  if (numericPoints >= 7) {
    return {
      label: "High risk",
      message:
        "7–9 penalty points recorded. Senior management approval is recommended before authorising business driving.",
    };
  }

  if (numericPoints >= 4) {
    return {
      label: "Moderate risk",
      message:
        "4–6 penalty points recorded. Review suitability, insurance requirements and any company driving policy.",
    };
  }

  return {
    label: "Low risk",
    message: "0–3 penalty points recorded.",
  };
}

export default function DrivingChecks({ employeeId }: DrivingChecksProps) {
  const [records, setRecords] = useState<DrivingRecord[]>([]);

  const [drivesForWork, setDrivesForWork] = useState("Yes");
  const [vehicleUsed, setVehicleUsed] = useState("Own vehicle");
  const [authorisedToDrive, setAuthorisedToDrive] = useState("No");

  const [drivingLicenceNumber, setDrivingLicenceNumber] = useState("");
  const [licenceCategories, setLicenceCategories] = useState("");
  const [licenceIssueDate, setLicenceIssueDate] = useState("");
  const [licenceExpiryDate, setLicenceExpiryDate] = useState("");

  const [dvlaCheckCompleted, setDvlaCheckCompleted] = useState("No");
  const [dvlaCheckDate, setDvlaCheckDate] = useState("");
  const [nextDvlaCheckDue, setNextDvlaCheckDue] = useState("");

  const [businessInsuranceConfirmed, setBusinessInsuranceConfirmed] =
    useState("No");
  const [businessInsuranceExpiryDate, setBusinessInsuranceExpiryDate] =
    useState("");

  const [penaltyPoints, setPenaltyPoints] = useState("");
  const [motoringConvictions, setMotoringConvictions] = useState("");
  const [restrictionsOrAdjustments, setRestrictionsOrAdjustments] =
    useState("");

  const [seniorAuthorisationRequired, setSeniorAuthorisationRequired] =
    useState("No");
  const [authorisedBy, setAuthorisedBy] = useState("");
  const [dateAuthorised, setDateAuthorised] = useState("");

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const risk = getDrivingRisk(penaltyPoints);

  async function loadRecords() {
    const { data, error } = await supabase
      .from("employee_driving_checks")
      .select(
        "id, drives_for_work, vehicle_used, authorised_to_drive, driving_licence_number, licence_categories, licence_issue_date, licence_expiry_date, dvla_check_completed, dvla_check_date, next_dvla_check_due, business_insurance_confirmed, business_insurance_expiry_date, penalty_points, motoring_convictions, restrictions_or_adjustments, senior_authorisation_required, authorised_by, date_authorised, notes, created_at"
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading driving records:", error);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRecords();
  }, [employeeId]);

  function handleDvlaCheckDateChange(value: string) {
    setDvlaCheckDate(value);

    if (value) {
      setNextDvlaCheckDue(addMonths(value, 11));
    } else {
      setNextDvlaCheckDue("");
    }
  }

  function handlePenaltyPointsChange(value: string) {
    setPenaltyPoints(value);

    const numericPoints = Number(value || 0);
    if (!Number.isNaN(numericPoints) && numericPoints >= 7) {
      setSeniorAuthorisationRequired("Yes");
    }
  }

  async function saveRecord() {
    if (drivesForWork === "Yes" && !licenceExpiryDate) {
      setMessage("Please enter the driving licence expiry date.");
      return;
    }

    if (
      drivesForWork === "Yes" &&
      businessInsuranceConfirmed === "Yes" &&
      !businessInsuranceExpiryDate
    ) {
      setMessage("Please enter the business insurance expiry date.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employee_driving_checks").insert([
      {
        employee_id: employeeId,
        drives_for_work: drivesForWork,
        vehicle_used: drivesForWork === "Yes" ? vehicleUsed : null,
        authorised_to_drive:
          drivesForWork === "Yes" ? authorisedToDrive : null,
        driving_licence_number:
          drivesForWork === "Yes" ? drivingLicenceNumber || null : null,
        licence_categories:
          drivesForWork === "Yes" ? licenceCategories || null : null,
        licence_issue_date:
          drivesForWork === "Yes" ? licenceIssueDate || null : null,
        licence_expiry_date:
          drivesForWork === "Yes" ? licenceExpiryDate || null : null,
        dvla_check_completed:
          drivesForWork === "Yes" ? dvlaCheckCompleted : null,
        dvla_check_date:
          drivesForWork === "Yes" ? dvlaCheckDate || null : null,
        next_dvla_check_due:
          drivesForWork === "Yes" ? nextDvlaCheckDue || null : null,
        business_insurance_confirmed:
          drivesForWork === "Yes" ? businessInsuranceConfirmed : null,
        business_insurance_expiry_date:
          drivesForWork === "Yes"
            ? businessInsuranceExpiryDate || null
            : null,
        penalty_points:
          drivesForWork === "Yes" && penaltyPoints
            ? Number(penaltyPoints)
            : null,
        motoring_convictions:
          drivesForWork === "Yes" ? motoringConvictions || null : null,
        restrictions_or_adjustments:
          drivesForWork === "Yes" ? restrictionsOrAdjustments || null : null,
        senior_authorisation_required:
          drivesForWork === "Yes" ? seniorAuthorisationRequired : null,
        authorised_by: drivesForWork === "Yes" ? authorisedBy || null : null,
        date_authorised:
          drivesForWork === "Yes" ? dateAuthorised || null : null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving driving record:", error);
      setMessage("Driving record could not be saved.");
      setSaving(false);
      return;
    }

    setDrivesForWork("Yes");
    setVehicleUsed("Own vehicle");
    setAuthorisedToDrive("No");
    setDrivingLicenceNumber("");
    setLicenceCategories("");
    setLicenceIssueDate("");
    setLicenceExpiryDate("");
    setDvlaCheckCompleted("No");
    setDvlaCheckDate("");
    setNextDvlaCheckDue("");
    setBusinessInsuranceConfirmed("No");
    setBusinessInsuranceExpiryDate("");
    setPenaltyPoints("");
    setMotoringConvictions("");
    setRestrictionsOrAdjustments("");
    setSeniorAuthorisationRequired("No");
    setAuthorisedBy("");
    setDateAuthorised("");
    setNotes("");
    setMessage("Driving record saved.");
    setSaving(false);
    loadRecords();
  }

  return (
    <ProfileSection title="Driving">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        Record whether this employee drives for work or on company business,
        including licence checks, insurance and authorisation.
      </p>

      <SelectField
        label="Drives for work or on company business?"
        value={drivesForWork}
        onChange={setDrivesForWork}
        options={yesNoOptions}
        small
      />

      {drivesForWork === "Yes" && (
        <>
          <div style={formGridStyle}>
            <SelectField
              label="Vehicle Used"
              value={vehicleUsed}
              onChange={setVehicleUsed}
              options={vehicleOptions}
            />

            <SelectField
              label="Authorised to Drive on Company Business"
              value={authorisedToDrive}
              onChange={setAuthorisedToDrive}
              options={yesNoOptions}
              small
            />

            <Field
              label="Driving Licence Number"
              value={drivingLicenceNumber}
              onChange={setDrivingLicenceNumber}
              placeholder="Optional"
            />

            <Field
              label="Licence Categories"
              value={licenceCategories}
              onChange={setLicenceCategories}
              placeholder="e.g. B, C1, D1"
            />

            <Field
              label="Licence Issue Date"
              value={licenceIssueDate}
              onChange={setLicenceIssueDate}
              type="date"
              small
            />

            <Field
              label="Licence Expiry Date"
              value={licenceExpiryDate}
              onChange={setLicenceExpiryDate}
              type="date"
              small
            />

            <SelectField
              label="DVLA Check Completed"
              value={dvlaCheckCompleted}
              onChange={setDvlaCheckCompleted}
              options={yesNoOptions}
              small
            />

            <Field
              label="DVLA Check Date"
              value={dvlaCheckDate}
              onChange={handleDvlaCheckDateChange}
              type="date"
              small
            />

            <Field
              label="Next DVLA Check Due"
              value={nextDvlaCheckDue}
              onChange={setNextDvlaCheckDue}
              type="date"
              small
            />

            <SelectField
              label="Business Insurance Confirmed"
              value={businessInsuranceConfirmed}
              onChange={setBusinessInsuranceConfirmed}
              options={yesNoNaOptions}
            />

            {businessInsuranceConfirmed === "Yes" && (
              <Field
                label="Business Insurance Expiry Date"
                value={businessInsuranceExpiryDate}
                onChange={setBusinessInsuranceExpiryDate}
                type="date"
                small
              />
            )}

            <Field
              label="Penalty Points"
              value={penaltyPoints}
              onChange={handlePenaltyPointsChange}
              type="number"
              placeholder="e.g. 0"
              small
            />
          </div>

          <div style={riskBoxStyle}>
            <strong>LEO Driving Risk:</strong> {risk.label}
            <div style={{ marginTop: "6px" }}>{risk.message}</div>
          </div>

          <Field
            label="Motoring Convictions / Endorsements"
            value={motoringConvictions}
            onChange={setMotoringConvictions}
            placeholder="Optional"
          />

          <Field
            label="Restrictions or Adjustments"
            value={restrictionsOrAdjustments}
            onChange={setRestrictionsOrAdjustments}
            placeholder="Optional"
          />

          <SelectField
            label="Senior Management Authorisation Required"
            value={seniorAuthorisationRequired}
            onChange={setSeniorAuthorisationRequired}
            options={yesNoOptions}
            small
          />

          {seniorAuthorisationRequired === "Yes" && (
            <div style={formGridStyle}>
              <Field
                label="Authorised By"
                value={authorisedBy}
                onChange={setAuthorisedBy}
                placeholder="Senior manager name"
              />

              <Field
                label="Date Authorised"
                value={dateAuthorised}
                onChange={setDateAuthorised}
                type="date"
                small
              />
            </div>
          )}
        </>
      )}

      <Field
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Optional notes"
      />

      <SaveButton onClick={saveRecord} disabled={saving}>
        {saving ? "Saving..." : "Save driving record"}
      </SaveButton>

      {message && (
        <div style={{ marginTop: "10px", color: "#6B7280", fontSize: "14px" }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <div style={{ fontWeight: 800, marginBottom: "10px" }}>
          Driving history
        </div>

        {loading ? (
          <div style={{ color: "#6B7280" }}>Loading driving records...</div>
        ) : records.length === 0 ? (
          <div style={{ color: "#6B7280" }}>No driving records yet.</div>
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
                  Drives for work/business: {record.drives_for_work}
                  {record.vehicle_used ? ` · ${record.vehicle_used}` : ""}
                </div>

                {record.authorised_to_drive && (
                  <div
                    style={{
                      color: "#6B7280",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  >
                    Authorised to drive: {record.authorised_to_drive} · Penalty
                    points: {record.penalty_points ?? "Not set"}
                  </div>
                )}

                {record.licence_expiry_date && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Licence expiry:</strong>{" "}
                    {record.licence_expiry_date}
                  </div>
                )}

                {record.next_dvla_check_due && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Next DVLA check due:</strong>{" "}
                    {record.next_dvla_check_due}
                  </div>
                )}

                {record.business_insurance_confirmed && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Business insurance:</strong>{" "}
                    {record.business_insurance_confirmed}
                    {record.business_insurance_expiry_date
                      ? ` · expires ${record.business_insurance_expiry_date}`
                      : ""}
                  </div>
                )}

                {record.senior_authorisation_required && (
                  <div style={{ marginTop: "8px" }}>
                    <strong>Senior authorisation required:</strong>{" "}
                    {record.senior_authorisation_required}
                    {record.authorised_by
                      ? ` · authorised by ${record.authorised_by}`
                      : ""}
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

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px 16px",
  alignItems: "start",
};

const riskBoxStyle: React.CSSProperties = {
  background: "#F9FAFB",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  color: "#374151",
  fontSize: "14px",
  marginBottom: "14px",
};