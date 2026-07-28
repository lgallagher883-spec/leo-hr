"use client";

import { useEffect, useState } from "react";
import ProfileSection from "./ProfileSection";
import Field from "./Field";
import SelectField from "./SelectField";
import SaveButton from "./SaveButton";

type EmploymentDetailsProps = {
  employeeId: number;
  initialName: string;
  initialEmail: string;
  initialRole: string;
  initialStatus: string;
  initialStartDate: string;
};

type EmploymentDetailsResponse = {
  success?: boolean;
  employmentDetails?: {
    manager?: string | null;
    probation_end_date?: string | null;
    employment_end_date?: string | null;
    reason_for_leaving?: string | null;
    annual_leave_allowance?: string | null;
  };
  error?: string;
};

type EmploymentSaveResponse = {
  success?: boolean;
  employee?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    status?: string | null;
    start_date?: string | null;
  };
  employmentDetails?: {
    manager?: string | null;
    probation_end_date?: string | null;
    employment_end_date?: string | null;
    reason_for_leaving?: string | null;
    annual_leave_allowance?: string | null;
  };
  error?: string;
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadEmploymentDetails() {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetch(
          `/api/employees/${employeeId}?include=employment_details`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const result =
          (await response.json()) as EmploymentDetailsResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Employment details could not be loaded."
          );
        }

        const details = result.employmentDetails;

        if (!details) {
          throw new Error("Employment details could not be loaded.");
        }

        setManager(details.manager || "");
        setProbationEndDate(details.probation_end_date || "");
        setEmploymentEndDate(details.employment_end_date || "");
        setReasonForLeaving(details.reason_for_leaving || "");
        setAnnualLeaveAllowance(details.annual_leave_allowance || "");
      } catch (error) {
        console.error("Error loading employment details:", error);
        setMessage(
          error instanceof Error
            ? error.message
            : "Employment details could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEmploymentDetails();
  }, [employeeId]);

  async function saveEmploymentDetails() {
    if (!name.trim()) {
      setMessage("Employee name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_employment",
          updates: {
            name: name.trim(),
            email,
            role,
            status,
            start_date: startDate,
            manager,
            probation_end_date: probationEndDate,
            employment_end_date: employmentEndDate,
            reason_for_leaving: reasonForLeaving,
            annual_leave_allowance: annualLeaveAllowance,
          },
        }),
      });

      const result =
        (await response.json()) as EmploymentSaveResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Employment details could not be saved."
        );
      }

      if (result.employee) {
        setName(result.employee.name || "");
        setEmail(result.employee.email || "");
        setRole(result.employee.role || "");
        setStatus(result.employee.status || "Active");
        setStartDate(result.employee.start_date || "");
      }

      if (result.employmentDetails) {
        setManager(result.employmentDetails.manager || "");
        setProbationEndDate(
          result.employmentDetails.probation_end_date || ""
        );
        setEmploymentEndDate(
          result.employmentDetails.employment_end_date || ""
        );
        setReasonForLeaving(
          result.employmentDetails.reason_for_leaving || ""
        );
        setAnnualLeaveAllowance(
          result.employmentDetails.annual_leave_allowance || ""
        );
      }

      setMessage("Employment details saved.");
    } catch (error) {
      console.error("Error saving employment details:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Employment details could not be saved."
      );
    } finally {
      setSaving(false);
    }
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

      <SaveButton
        onClick={saveEmploymentDetails}
        disabled={saving || loading}
      >
        {loading
          ? "Loading..."
          : saving
          ? "Saving..."
          : "Save employment details"}
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
