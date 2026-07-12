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

type EmploymentDetailsProps = {
  employeeId: number;
  initialName: string;
  initialEmail: string;
  initialRole: string;
  initialStatus: string;
  initialStartDate: string;
};

export default function EmploymentDetails({
  employeeId,
  initialName,
  initialEmail,
  initialRole,
  initialStatus,
  initialStartDate,
}: EmploymentDetailsProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);

  const [manager, setManager] = useState("");
  const [probationEndDate, setProbationEndDate] = useState("");
  const [employmentEndDate, setEmploymentEndDate] = useState("");
  const [reasonForLeaving, setReasonForLeaving] = useState("");
  const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadEmploymentDetails() {
      const { data, error } = await supabase
        .from("employee_employment_details")
        .select(
          "manager, probation_end_date, employment_end_date, reason_for_leaving, annual_leave_allowance"
        )
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (error) {
        console.error("Error loading employment details:", error);
        return;
      }

      if (data) {
        setManager(data.manager || "");
        setProbationEndDate(data.probation_end_date || "");
        setEmploymentEndDate(data.employment_end_date || "");
        setReasonForLeaving(data.reason_for_leaving || "");
        setAnnualLeaveAllowance(data.annual_leave_allowance || "");
      }
    }

    loadEmploymentDetails();
  }, [employeeId]);

  async function saveEmploymentDetails() {
    if (!name.trim()) {
      setMessage("Employee name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const employeeUpdate = await supabase
      .from("employees")
      .update({
        name: name.trim(),
        email: email || null,
        role: role || null,
        status: status || "Active",
        start_date: startDate || null,
      })
      .eq("id", employeeId);

    if (employeeUpdate.error) {
      console.error("Error saving employee:", employeeUpdate.error);
      setMessage("Employment details could not be saved.");
      setSaving(false);
      return;
    }

    const detailsUpdate = await supabase
      .from("employee_employment_details")
      .upsert(
        {
          employee_id: employeeId,
          manager: manager || null,
          probation_end_date: probationEndDate || null,
          employment_end_date: employmentEndDate || null,
          reason_for_leaving: reasonForLeaving || null,
          annual_leave_allowance: annualLeaveAllowance || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "employee_id" }
      );

    if (detailsUpdate.error) {
      console.error("Error saving employment details:", detailsUpdate.error);
      setMessage("Employment details could not be saved.");
      setSaving(false);
      return;
    }

    setMessage("Employment details saved.");
    setSaving(false);
  }

  return (
    <ProfileSection title="Employment Details">
      <Field
        label="Full Name"
        value={name}
        onChange={setName}
        placeholder="Employee full name"
      />

      <Field
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="name@company.com"
      />

      <Field
        label="Role"
        value={role}
        onChange={setRole}
        placeholder="Job role"
      />

      <Field
        label="Start Date"
        value={startDate}
        onChange={setStartDate}
        type="date"
        small
      />

      <SelectField
        label="Employment Status"
        value={status}
        onChange={setStatus}
        options={["Active", "Former", "Archived"]}
        small
      />

      <Field
        label="Manager"
        value={manager}
        onChange={setManager}
        placeholder="Line manager name"
      />

      <Field
        label="Probation End Date"
        value={probationEndDate}
        onChange={setProbationEndDate}
        type="date"
        small
      />

      <Field
        label="Employment End Date"
        value={employmentEndDate}
        onChange={setEmploymentEndDate}
        type="date"
        small
      />

      <Field
        label="Reason for Leaving"
        value={reasonForLeaving}
        onChange={setReasonForLeaving}
        placeholder="Optional"
      />

      <Field
        label="Annual Leave Entitlement (days)"
        value={annualLeaveAllowance}
        onChange={setAnnualLeaveAllowance}
        placeholder="e.g. 25"
        type="number"
        small
      />

      <SaveButton onClick={saveEmploymentDetails} disabled={saving}>
        {saving ? "Saving..." : "Save employment details"}
      </SaveButton>

      {message && (
        <div
          style={{
            marginTop: "10px",
            color: "#6B7280",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      )}
    </ProfileSection>
  );
}