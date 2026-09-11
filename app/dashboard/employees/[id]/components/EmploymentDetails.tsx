

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
  continuous_service_date?: string | null;
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


function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatDays(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(roundToTwo(value));
}

function calculateFullYearStatutoryDays(
  workingPatternType: string,
  contractedDaysPerWeek: string,
  partYearWorker: boolean,
): number | null {
  if (workingPatternType !== "Fixed days" || partYearWorker) {
    return null;
  }

  const daysPerWeek = parseOptionalNumber(contractedDaysPerWeek);

  if (
    daysPerWeek === null ||
    daysPerWeek <= 0 ||
    daysPerWeek > 7
  ) {
    return null;
  }

  return roundToTwo(Math.min(daysPerWeek * 5.6, 28));
}

function createValidDate(
  year: number,
  month: number,
  day: number,
): Date | null {
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function addYearsClamped(date: Date, years: number): Date {
  const targetYear = date.getFullYear() + years;
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const exact = createValidDate(targetYear, month, day);
  if (exact) return exact;

  return new Date(targetYear, month, 0);
}

function addMonthsClamped(date: Date, months: number): Date {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonthIndex = totalMonths % 12;
  const day = date.getDate();

  const lastDayOfTargetMonth = new Date(
    targetYear,
    targetMonthIndex + 1,
    0,
  ).getDate();

  return new Date(
    targetYear,
    targetMonthIndex,
    Math.min(day, lastDayOfTargetMonth),
  );
}

function getCurrentLeaveYear(
  startMonthValue: string,
  startDayValue: string,
): { start: Date; end: Date } | null {
  const month = Number(startMonthValue);
  const day = Number(startDayValue);

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = createValidDate(today.getFullYear(), month, day);
  if (!start) return null;

  if (start > today) {
    start = createValidDate(today.getFullYear() - 1, month, day);
  }

  if (!start) return null;

  const nextStart = addYearsClamped(start, 1);
  const end = new Date(nextStart);
  end.setDate(end.getDate() - 1);

  return { start, end };
}

function parseDateOnlyValue(value: string): Date | null {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function roundUpToNextHalfDay(value: number): number {
  const scaled = value * 2;
  const nearestWhole = Math.round(scaled);

  /*
    Normalise tiny floating-point drift before applying GOV.UK's
    upward half-day rounding. Without this, a mathematically exact
    7.0 can arrive as 7.000000000000001 and incorrectly become 7.5.
  */
  const normalisedScaled =
    Math.abs(scaled - nearestWhole) < 1e-9
      ? nearestWhole
      : scaled;

  return Math.ceil(normalisedScaled) / 2;
}

function countMonthsStarted(
  employmentStart: Date,
  leaveYearEnd: Date,
): number {
  let count = 0;

  for (let monthOffset = 0; monthOffset < 12; monthOffset += 1) {
    const monthStart = addMonthsClamped(employmentStart, monthOffset);

    if (monthStart <= leaveYearEnd) {
      count += 1;
    } else {
      break;
    }
  }

  return Math.min(count, 12);
}

function inclusiveCalendarDays(start: Date, end: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  const utcStart = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const utcEnd = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  );

  return Math.floor((utcEnd - utcStart) / millisecondsPerDay) + 1;
}

type CurrentYearEntitlementResult =
  | {
      kind: "full-year";
      entitlement: number;
      description: string;
    }
  | {
      kind: "starter";
      entitlement: number;
      monthsStarted: number;
      description: string;
    }
  | {
      kind: "leaver";
      entitlement: number;
      employmentDays: number;
      leaveYearDays: number;
      description: string;
    }
  | {
      kind: "outside-current-year";
      entitlement: null;
      description: string;
    }
  | {
      kind: "missing-dates";
      entitlement: null;
      description: string;
    };

function calculateCurrentYearStatutoryEntitlement({
  fullYearEntitlement,
  employmentStartDate,
  employmentEndDate,
  holidayYearStartMonth,
  holidayYearStartDay,
}: {
  fullYearEntitlement: number | null;
  employmentStartDate: string;
  employmentEndDate: string;
  holidayYearStartMonth: string;
  holidayYearStartDay: string;
}): CurrentYearEntitlementResult | null {
  if (fullYearEntitlement === null) return null;

  const leaveYear = getCurrentLeaveYear(
    holidayYearStartMonth,
    holidayYearStartDay,
  );

  if (!leaveYear) {
    return {
      kind: "missing-dates",
      entitlement: null,
      description:
        "Set the holiday year start day and month to calculate the current leave-year entitlement.",
    };
  }

  const employmentStart = parseDateOnlyValue(employmentStartDate);
  const employmentEnd = parseDateOnlyValue(employmentEndDate);

  if (!employmentStart) {
    return {
      kind: "missing-dates",
      entitlement: null,
      description:
        "Set the employee start date to calculate the current leave-year entitlement.",
    };
  }

  if (
    employmentEnd &&
    (employmentEnd < leaveYear.start ||
      employmentStart > leaveYear.end)
  ) {
    return {
      kind: "outside-current-year",
      entitlement: null,
      description:
        "The recorded employment dates do not overlap the current holiday year.",
    };
  }

  if (employmentStart > leaveYear.end) {
    return {
      kind: "outside-current-year",
      entitlement: null,
      description:
        "The employee has not started during the current holiday year.",
    };
  }

  const startsPartWayThroughYear = employmentStart > leaveYear.start;
  const leavesPartWayThroughYear =
    employmentEnd !== null && employmentEnd < leaveYear.end;

  if (leavesPartWayThroughYear) {
    const effectiveStart =
      employmentStart > leaveYear.start
        ? employmentStart
        : leaveYear.start;
    const effectiveEnd = employmentEnd;

    if (effectiveEnd < effectiveStart) {
      return {
        kind: "outside-current-year",
        entitlement: null,
        description:
          "The recorded employment dates do not overlap the current holiday year.",
      };
    }

    const employmentDays = inclusiveCalendarDays(
      effectiveStart,
      effectiveEnd,
    );
    const leaveYearDays = inclusiveCalendarDays(
      leaveYear.start,
      leaveYear.end,
    );

    return {
      kind: "leaver",
      entitlement: roundToTwo(
        fullYearEntitlement * (employmentDays / leaveYearDays),
      ),
      employmentDays,
      leaveYearDays,
      description:
        "Calculated from the proportion of the current leave year the employee is in employment.",
    };
  }

  if (startsPartWayThroughYear) {
    const monthsStarted = countMonthsStarted(
      employmentStart,
      leaveYear.end,
    );

    return {
      kind: "starter",
      entitlement: roundUpToNextHalfDay(
        fullYearEntitlement * (monthsStarted / 12),
      ),
      monthsStarted,
      description:
        "Calculated from the proportion of the leave year remaining from the employee\'s start date, using the GOV.UK months-based method and statutory rounding.",
    };
  }

  return {
    kind: "full-year",
    entitlement: fullYearEntitlement,
    description:
      "The employee is employed for the full current holiday year.",
  };
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
  const [continuousServiceDate, setContinuousServiceDate] = useState("");

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

  const statutoryFullYearDays = calculateFullYearStatutoryDays(
    workingPatternType,
    contractedDaysPerWeek,
    partYearWorker,
  );

  const currentYearStatutory =
    calculateCurrentYearStatutoryEntitlement({
      fullYearEntitlement: statutoryFullYearDays,
      employmentStartDate: startDate,
      employmentEndDate,
      holidayYearStartMonth,
      holidayYearStartDay,
    });

  const statutoryApplicableDays =
    currentYearStatutory?.entitlement ?? null;

  const recordedAllowance = parseOptionalNumber(annualLeaveAllowance);

  const contractualAllowanceSelected =
    leaveEntitlementBasis === "Contractual";

  const canCompareRecordedAllowanceToStatutoryFloor =
    contractualAllowanceSelected &&
    statutoryApplicableDays !== null &&
    bankHolidayTreatment === "Included";

  const recordedAllowanceBelowStatutoryFloor =
    canCompareRecordedAllowanceToStatutoryFloor &&
    recordedAllowance !== null &&
    recordedAllowance < statutoryApplicableDays;

  const resolvedAnnualLeaveAllowance =
    leaveEntitlementBasis === "Statutory"
      ? statutoryApplicableDays
      : leaveEntitlementBasis === "Contractual"
        ? recordedAllowance
        : null;

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
        setContinuousServiceDate(details.continuous_service_date || "");
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

  const fixedDaysPattern = workingPatternType === "Fixed days";
  const fixedHoursPattern = workingPatternType === "Fixed hours";
  const irregularHoursPattern = workingPatternType === "Irregular hours";
  const requiresContractedHours = fixedHoursPattern;
  const requiresContractedDays = fixedDaysPattern || fixedHoursPattern;
  const requiresNormalWorkingDays = fixedDaysPattern || fixedHoursPattern;

  async function saveEmploymentDetails() {
    if (!name.trim()) {
      setMessage("Employee name is required.");
      return;
    }

    const contractedHours = parseOptionalNumber(contractedHoursPerWeek);
    const contractedDays = parseOptionalNumber(contractedDaysPerWeek);

    if (
      requiresContractedHours &&
      (contractedHours === null || contractedHours <= 0)
    ) {
      setMessage(
        "Enter the employee's contracted hours per week for a fixed-hours working pattern.",
      );
      return;
    }

    if (
      requiresContractedDays &&
      (contractedDays === null || contractedDays <= 0 || contractedDays > 7)
    ) {
      setMessage(
        "Enter the employee's contracted days per week (between 0 and 7) for this working pattern.",
      );
      return;
    }

    if (requiresNormalWorkingDays && workingDays.length === 0) {
      setMessage(
        "Select the employee's normal working days for this working pattern.",
      );
      return;
    }

    if (leaveEntitlementBasis === "Statutory" && statutoryApplicableDays === null) {
      setMessage(
        workingPatternType === "Irregular hours" || partYearWorker
          ? "Statutory entitlement for irregular-hours and part-year workers must be calculated from actual hours worked in each pay period. Complete that accrual process before using a statutory annual balance."
          : "Complete the fixed-days working pattern, employee start date and holiday-year start date so Leo can calculate the statutory entitlement before saving.",
      );
      return;
    }

    if (
      leaveEntitlementBasis === "Contractual" &&
      (recordedAllowance === null || recordedAllowance <= 0)
    ) {
      setMessage(
        "Enter the employee's contractual annual leave entitlement before saving.",
      );
      return;
    }

    if (recordedAllowanceBelowStatutoryFloor) {
      setMessage(
        `Annual leave entitlement cannot be below the calculated statutory minimum of ${formatDays(
          statutoryApplicableDays as number,
        )} days for the current holiday year when bank holidays are included.`,
      );
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
              annual_leave_allowance:
                resolvedAnnualLeaveAllowance === null
                  ? ""
                  : String(resolvedAnnualLeaveAllowance),
              continuous_service_date: continuousServiceDate,
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
        setContinuousServiceDate(details.continuous_service_date || "");
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

      <Field
        label="Continuous Service Date"
        value={continuousServiceDate}
        onChange={setContinuousServiceDate}
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
          holiday setup. Leo uses this information to calculate leave
          entitlement and working-pattern-aware leave requests.
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

      {workingPatternType !== "Not set" ? (
        <>
          <Field
            label={`Contracted Hours Per Week${
              requiresContractedHours ? " (required)" : ""
            }`}
            value={contractedHoursPerWeek}
            onChange={setContractedHoursPerWeek}
            placeholder="e.g. 37.5"
            type="number"
            small
          />

          <div
            style={{
              marginTop: "-10px",
              marginBottom: "14px",
              maxWidth: "720px",
              fontSize: "12px",
              lineHeight: 1.5,
              color: "#6B7280",
            }}
          >
            {fixedDaysPattern
              ? "Optional for a fixed-days pattern. Leo calculates statutory leave in days from contracted days per week, so weekly hours are not needed for that calculation."
              : fixedHoursPattern
                ? "Required for a fixed-hours pattern. Leo can derive the employee's average working day from weekly hours and contracted days, so a separate hours-per-day field is not needed."
                : "Optional reference information for an irregular-hours pattern. Statutory holiday accrual must use actual hours worked in each pay period rather than this contracted-hours figure."}
          </div>

          <Field
            label={`Contracted Days Per Week${
              requiresContractedDays ? " (required)" : ""
            }`}
            value={contractedDaysPerWeek}
            onChange={setContractedDaysPerWeek}
            placeholder="e.g. 5"
            type="number"
            small
          />

          <div
            style={{
              marginTop: "-10px",
              marginBottom: "14px",
              maxWidth: "720px",
              fontSize: "12px",
              lineHeight: 1.5,
              color: "#6B7280",
            }}
          >
            {fixedDaysPattern
              ? "Required. Leo uses contracted days per week × 5.6 weeks, capped at 28 days, for the full-year statutory entitlement."
              : fixedHoursPattern
                ? "Required so Leo can relate the weekly hours to the employee's normal working days."
                : "Optional for irregular-hours workers. Actual hours worked drive statutory accrual."}
          </div>
        </>
      ) : null}

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "13px",
            color: "#6B7280",
            marginBottom: "7px",
          }}
        >
          Normal Working Days{requiresNormalWorkingDays ? " (required)" : ""}
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

        <div
          style={{
            marginTop: "8px",
            maxWidth: "720px",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "#6B7280",
          }}
        >
          {fixedDaysPattern
            ? "Required so Leo can calculate working-pattern-aware leave requests and identify which requested dates are normally worked."
            : fixedHoursPattern
              ? "Required for working-pattern-aware leave requests and to support the employee's hours-based working arrangement."
              : irregularHoursPattern
                ? "Optional where there is no reliable weekly pattern. Record normal days only if the employee genuinely has them."
                : "Select the employee's usual working days where a normal pattern applies."}
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

      <div
        style={{
          marginBottom: "16px",
          maxWidth: "720px",
          padding: "14px 16px",
          border: "1px solid #E5E7EB",
          borderRadius: "10px",
          background: "#FAFAFA",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#374151",
            marginBottom: "6px",
          }}
        >
          Leo calculated entitlement
        </div>

        {workingPatternType === "Irregular hours" || partYearWorker ? (
          <div
            style={{
              fontSize: "13px",
              lineHeight: 1.55,
              color: "#6B7280",
            }}
          >
            This worker requires pay-period holiday accrual using actual
            hours worked. Leo will not manufacture an annual days figure
            from the employment profile. The irregular-hours / part-year
            accrual engine will calculate this separately.
          </div>
        ) : statutoryFullYearDays !== null ? (
          <>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Full-year statutory entitlement
            </div>

            <div
              style={{
                marginTop: "3px",
                fontSize: "20px",
                fontWeight: 700,
                color: "#374151",
              }}
            >
              {formatDays(statutoryFullYearDays)} days
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "13px",
                lineHeight: 1.55,
                color: "#6B7280",
              }}
            >
              Based on {displayValue(contractedDaysPerWeek)} contracted
              days per week × 5.6 weeks, capped at 28 days.
            </div>

            <div
              style={{
                marginTop: "14px",
                paddingTop: "14px",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Current holiday-year statutory entitlement
              </div>

              {currentYearStatutory?.entitlement !== null &&
              currentYearStatutory?.entitlement !== undefined ? (
                <>
                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#374151",
                    }}
                  >
                    {formatDays(currentYearStatutory.entitlement)} days
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "12px",
                      lineHeight: 1.5,
                      color: "#6B7280",
                    }}
                  >
                    {currentYearStatutory.description}
                  </div>

                  {currentYearStatutory.kind === "starter" ? (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: "#6B7280",
                      }}
                    >
                      Months included in this leave-year entitlement:{" "}
                      {currentYearStatutory.monthsStarted} of 12.
                    </div>
                  ) : null}

                  {currentYearStatutory.kind === "leaver" ? (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: "#6B7280",
                      }}
                    >
                      Calendar days in employment this leave year:{" "}
                      {currentYearStatutory.employmentDays} of{" "}
                      {currentYearStatutory.leaveYearDays}.
                    </div>
                  ) : null}
                </>
              ) : (
                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    color: "#92400E",
                  }}
                >
                  {currentYearStatutory?.description ||
                    "Set the employment and holiday-year dates to calculate the current entitlement."}
                </div>
              )}
            </div>

            {bankHolidayTreatment === "Additional" ? (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "#6B7280",
                }}
              >
                Bank holidays are marked as additional. Leo does not
                compare contractual annual leave by itself against the total
                statutory paid-leave benchmark.
              </div>
            ) : null}

            {contractualAllowanceSelected &&
            bankHolidayTreatment === "Included" &&
            recordedAllowanceBelowStatutoryFloor ? (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  fontWeight: 700,
                  color: "#B91C1C",
                }}
              >
                The recorded entitlement is below the calculated
                statutory minimum for the current holiday year. Increase
                the entitlement before saving.
              </div>
            ) : null}

            {contractualAllowanceSelected &&
            bankHolidayTreatment === "Included" &&
            statutoryApplicableDays !== null &&
            recordedAllowance !== null &&
            recordedAllowance >= statutoryApplicableDays ? (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "#166534",
                }}
              >
                The recorded entitlement meets or exceeds the calculated
                statutory minimum for the current holiday year.
              </div>
            ) : null}
          </>
        ) : (
          <div
            style={{
              fontSize: "13px",
              lineHeight: 1.55,
              color: "#6B7280",
            }}
          >
            Select Fixed days and enter Contracted Days Per Week to show
            the statutory entitlement.
          </div>
        )}
      </div>

      {leaveEntitlementBasis === "Contractual" ? (
        <>
          <Field
            label="Contractual Annual Leave Entitlement (days)"
            value={annualLeaveAllowance}
            onChange={setAnnualLeaveAllowance}
            placeholder="e.g. 30"
            type="number"
            small
          />

          <div
            style={{
              marginTop: "-6px",
              marginBottom: "16px",
              maxWidth: "720px",
              fontSize: "12px",
              lineHeight: 1.5,
              color: "#6B7280",
            }}
          >
            Enter the contractual entitlement that applies to this employee.
            Where bank holidays are included, Leo checks this against the
            calculated statutory minimum.
          </div>
        </>
      ) : leaveEntitlementBasis === "Statutory" &&
        statutoryApplicableDays !== null ? (
        <div
          style={{
            marginTop: "-2px",
            marginBottom: "16px",
            maxWidth: "720px",
            padding: "11px 13px",
            border: "1px solid #D1FAE5",
            borderRadius: "8px",
            background: "#F0FDF4",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "#166534",
          }}
        >
          Leo will save {formatDays(statutoryApplicableDays)} days as the
          employee&apos;s current statutory annual-leave balance source. No
          duplicate manual entitlement is required.
        </div>
      ) : null}

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
