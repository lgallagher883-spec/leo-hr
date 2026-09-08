"use client";

import { useEffect, useState } from "react";

import EmployeeLifecycleIntelligence from "./EmployeeLifecycleIntelligence";
import Field from "./Field";
import ProfileSection from "./ProfileSection";
import SaveButton from "./SaveButton";
import SelectField from "./SelectField";

type EmploymentDetailsProps = {
  employeeId: number;
  initialName: string;
  initialEmail: string;
  initialRole: string;
  initialStatus: string;
  initialStartDate: string;
};

type EmployeeRecord = {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  start_date: string | null;
};

type EmploymentDetailsRecord = {
  id?: number;
  employee_id?: number;
  manager?: string | null;
  probation_end_date?: string | null;
  employment_end_date?: string | null;
  reason_for_leaving?: string | null;
  annual_leave_allowance?: string | number | null;
  contracted_hours_per_week?: string | number | null;
  contracted_days_per_week?: string | number | null;
  working_days?: string[] | null;
  working_pattern_type?: string | null;
  part_year_worker?: boolean | null;
  holiday_year_start_month?: string | number | null;
  holiday_year_start_day?: string | number | null;
  leave_entitlement_basis?: string | null;
  bank_holiday_treatment?: string | null;
  reserved_leave_days?: string | number | null;
};

type EmploymentResponse = {
  success?: boolean;
  employee?: EmployeeRecord;
  employmentDetails?: EmploymentDetailsRecord;
  error?: string;
};

const WORKING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function normaliseStatusForForm(value: string | null | undefined): string {
  if (value === "Former Employee") return "Former";
  if (value === "Archived") return "Archived";
  return "Active";
}

function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

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
  const [status, setStatus] = useState(
    normaliseStatusForForm(initialStatus),
  );
  const [startDate, setStartDate] = useState(initialStartDate);

  const [manager, setManager] = useState("");
  const [probationEndDate, setProbationEndDate] = useState("");
  const [employmentEndDate, setEmploymentEndDate] = useState("");
  const [reasonForLeaving, setReasonForLeaving] = useState("");
  const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState("");

  const [contractedHoursPerWeek, setContractedHoursPerWeek] =
    useState("");
  const [contractedDaysPerWeek, setContractedDaysPerWeek] =
    useState("");
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [workingPatternType, setWorkingPatternType] =
    useState("Not set");
  const [partYearWorker, setPartYearWorker] = useState(false);
  const [holidayYearStartMonth, setHolidayYearStartMonth] =
    useState("");
  const [holidayYearStartDay, setHolidayYearStartDay] =
    useState("");
  const [leaveEntitlementBasis, setLeaveEntitlementBasis] =
    useState("Not set");
  const [bankHolidayTreatment, setBankHolidayTreatment] =
    useState("Not set");
  const [reservedLeaveDays, setReservedLeaveDays] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEmploymentDetails() {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetch(
          `/api/employees/${employeeId}/employment`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          },
        );

        const result = (await response.json().catch(() => null)) as
          | EmploymentResponse
          | null;

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || "Employment details could not be loaded.",
          );
        }

        if (cancelled) return;

        if (result.employee) {
          setName(result.employee.name || "");
          setEmail(result.employee.email || "");
          setRole(result.employee.role || "");
          setStatus(
            normaliseStatusForForm(result.employee.status),
          );
          setStartDate(result.employee.start_date || "");
        }

        const details = result.employmentDetails ?? {};

        setManager(details.manager || "");
        setProbationEndDate(details.probation_end_date || "");
        setEmploymentEndDate(details.employment_end_date || "");
        setReasonForLeaving(details.reason_for_leaving || "");
        setAnnualLeaveAllowance(
          displayValue(details.annual_leave_allowance),
        );
        setContractedHoursPerWeek(
          displayValue(details.contracted_hours_per_week),
        );
        setContractedDaysPerWeek(
          displayValue(details.contracted_days_per_week),
        );
        setWorkingDays(
          Array.isArray(details.working_days)
            ? details.working_days
            : [],
        );
        setWorkingPatternType(
          details.working_pattern_type || "Not set",
        );
        setPartYearWorker(Boolean(details.part_year_worker));
        setHolidayYearStartMonth(
          displayValue(details.holiday_year_start_month),
        );
        setHolidayYearStartDay(
          displayValue(details.holiday_year_start_day),
        );
        setLeaveEntitlementBasis(
          details.leave_entitlement_basis || "Not set",
        );
        setBankHolidayTreatment(
          details.bank_holiday_treatment || "Not set",
        );
        setReservedLeaveDays(
          displayValue(details.reserved_leave_days),
        );
      } catch (error) {
        console.error("Error loading employment details:", error);

        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Employment details could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEmploymentDetails();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  function toggleWorkingDay(day: string) {
    setWorkingDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  async function saveEmploymentDetails() {
    if (!name.trim()) {
      setMessage("Employee name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/employees/${employeeId}/employment`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
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
              contracted_hours_per_week: contractedHoursPerWeek,
              contracted_days_per_week: contractedDaysPerWeek,
              working_days: workingDays,
              working_pattern_type: workingPatternType,
              part_year_worker: partYearWorker,
              holiday_year_start_month: holidayYearStartMonth,
              holiday_year_start_day: holidayYearStartDay,
              leave_entitlement_basis: leaveEntitlementBasis,
              bank_holiday_treatment: bankHolidayTreatment,
              reserved_leave_days: reservedLeaveDays,
            },
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | EmploymentResponse
        | null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error || "Employment details could not be saved.",
        );
      }

      if (result.employee) {
        setName(result.employee.name || "");
        setEmail(result.employee.email || "");
        setRole(result.employee.role || "");
        setStatus(
          normaliseStatusForForm(result.employee.status),
        );
        setStartDate(result.employee.start_date || "");
      }

      if (result.employmentDetails) {
        const details = result.employmentDetails;

        setManager(details.manager || "");
        setProbationEndDate(details.probation_end_date || "");
        setEmploymentEndDate(details.employment_end_date || "");
        setReasonForLeaving(details.reason_for_leaving || "");
        setAnnualLeaveAllowance(
          displayValue(details.annual_leave_allowance),
        );
        setContractedHoursPerWeek(
          displayValue(details.contracted_hours_per_week),
        );
        setContractedDaysPerWeek(
          displayValue(details.contracted_days_per_week),
        );
        setWorkingDays(
          Array.isArray(details.working_days)
            ? details.working_days
            : [],
        );
        setWorkingPatternType(
          details.working_pattern_type || "Not set",
        );
        setPartYearWorker(Boolean(details.part_year_worker));
        setHolidayYearStartMonth(
          displayValue(details.holiday_year_start_month),
        );
        setHolidayYearStartDay(
          displayValue(details.holiday_year_start_day),
        );
        setLeaveEntitlementBasis(
          details.leave_entitlement_basis || "Not set",
        );
        setBankHolidayTreatment(
          details.bank_holiday_treatment || "Not set",
        );
        setReservedLeaveDays(
          displayValue(details.reserved_leave_days),
        );
      }

      setMessage("Employment details saved.");
    } catch (error) {
      console.error("Error saving employment details:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Employment details could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProfileSection title="Employment Details">
      <EmployeeLifecycleIntelligence
        employeeId={employeeId}
        lifecycleContext="employment"
        defaultPrompt="Draft a concise employment status update that confirms role, manager accountability, and the next agreed check-in."
      />

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

      <div
        style={{
          marginTop: "22px",
          marginBottom: "14px",
          paddingTop: "18px",
          borderTop: "1px solid #E5E7EB",
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#374151",
          }}
        >
          Working &amp; Holiday Pattern
        </div>
        <div
          style={{
            marginTop: "4px",
            maxWidth: "720px",
            fontSize: "13px",
            lineHeight: 1.5,
            color: "#6B7280",
          }}
        >
          Record the employee&apos;s normal working arrangement and
          contractual holiday setup. Leo will use this information for
          leave calculations once the holiday calculation engine is
          enabled.
        </div>
      </div>

      <SelectField
        label="Working Pattern"
        value={workingPatternType}
        onChange={setWorkingPatternType}
        options={[
          "Not set",
          "Fixed days",
          "Fixed hours",
          "Irregular hours",
        ]}
        small
      />

      <Field
        label="Contracted Hours Per Week"
        value={contractedHoursPerWeek}
        onChange={setContractedHoursPerWeek}
        placeholder="e.g. 37.5"
        type="number"
        small
      />

      <Field
        label="Contracted Days Per Week"
        value={contractedDaysPerWeek}
        onChange={setContractedDaysPerWeek}
        placeholder="e.g. 5"
        type="number"
        small
      />

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "13px",
            color: "#6B7280",
            marginBottom: "7px",
          }}
        >
          Normal Working Days
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {WORKING_DAYS.map((day) => {
            const selected = workingDays.includes(day);

            return (
              <label
                key={day}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 10px",
                  border: selected
                    ? "1px solid #6E5084"
                    : "1px solid #E5E7EB",
                  borderRadius: "8px",
                  background: selected ? "#F7F1FC" : "#FFFFFF",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleWorkingDay(day)}
                />
                {day}
              </label>
            );
          })}
        </div>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          marginBottom: "16px",
          fontSize: "13px",
          color: "#374151",
        }}
      >
        <input
          type="checkbox"
          checked={partYearWorker}
          onChange={(event) =>
            setPartYearWorker(event.target.checked)
          }
        />
        Part-year worker
      </label>

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "13px",
            color: "#6B7280",
            marginBottom: "7px",
          }}
        >
          Holiday Year Starts
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <select
            value={holidayYearStartDay}
            onChange={(event) =>
              setHolidayYearStartDay(event.target.value)
            }
            style={{
              width: "120px",
              padding: "10px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              background: "#FFFFFF",
            }}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, index) => index + 1).map(
              (day) => (
                <option key={day} value={String(day)}>
                  {day}
                </option>
              ),
            )}
          </select>

          <select
            value={holidayYearStartMonth}
            onChange={(event) =>
              setHolidayYearStartMonth(event.target.value)
            }
            style={{
              width: "180px",
              padding: "10px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              background: "#FFFFFF",
            }}
          >
            <option value="">Month</option>
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SelectField
        label="Leave Entitlement Basis"
        value={leaveEntitlementBasis}
        onChange={setLeaveEntitlementBasis}
        options={["Not set", "Statutory", "Contractual"]}
        small
      />

      <Field
        label="Annual Leave Entitlement (days)"
        value={annualLeaveAllowance}
        onChange={setAnnualLeaveAllowance}
        placeholder="e.g. 25"
        type="number"
        small
      />

      <SelectField
        label="Bank Holidays"
        value={bankHolidayTreatment}
        onChange={setBankHolidayTreatment}
        options={["Not set", "Included", "Additional"]}
        small
      />

      <Field
        label="Reserved / Shutdown Leave Days"
        value={reservedLeaveDays}
        onChange={setReservedLeaveDays}
        placeholder="e.g. 3"
        type="number"
        small
      />

      <div
        style={{
          marginTop: "-4px",
          marginBottom: "18px",
          maxWidth: "720px",
          fontSize: "12px",
          lineHeight: 1.5,
          color: "#6B7280",
        }}
      >
        Reserved or shutdown days form part of the employee&apos;s
        entitlement unless the employment terms provide otherwise. This
        field records the organisation&apos;s setup; it does not add
        extra leave automatically.
      </div>

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

      {message ? (
        <div
          style={{
            marginTop: "10px",
            color: "#6B7280",
            fontSize: "14px",
          }}
        >
          {message}
        </div>
      ) : null}
    </ProfileSection>
  );
}
