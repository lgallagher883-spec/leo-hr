// Leo HR employee leave self-service page.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import mobileStyles from "../MyEmployment.module.css";

// Leave data now loads through /api/my-employment/leave.

type LeaveRecord = {
  id: number;
  leave_type: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  days_taken: number | string | null;
  notes: string | null;
  created_at: string | null;
};

const employeeLeaveTypes = [
  "Annual Leave",
  "Half Day Leave",
  "Unpaid Leave",
  "Sickness Absence",
  "Medical Appointment",
  "Hospital Appointment",
  "Compassionate Leave",
  "Time Off for Dependants",
  "Carer's Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Adoption Leave",
  "Shared Parental Leave",
  "Parental Leave",
  "Parental Bereavement Leave",
  "Neonatal Care Leave",
  "Jury Service",
  "Public Duties",
  "Military Reserve Leave",
  "Study Leave",
  "Sabbatical",
  "Time Off in Lieu (TOIL)",
  "Garden Leave",
  "Furlough",
  "Other",
] as const;

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function normaliseStatus(value: string | null) {
  return value?.trim() || "Recorded";
}

function isCancelled(record: LeaveRecord) {
  return normaliseStatus(record.status).toLowerCase() === "cancelled";
}

function statusStyle(status: string): CSSProperties {
  const normalised = status.toLowerCase();

  if (
    normalised === "approved" ||
    normalised === "taken" ||
    normalised === "completed"
  ) {
    return {
      background: "#ECFDF3",
      border: "1px solid #BBE7CE",
      color: "#256344",
    };
  }

  if (normalised === "requested" || normalised === "pending") {
    return {
      background: "#FFF8E8",
      border: "1px solid #F4D99A",
      color: "#805D16",
    };
  }

  if (normalised === "cancelled" || normalised === "declined") {
    return {
      background: "#FFF1F1",
      border: "1px solid #F1C5C5",
      color: "#8F3B3B",
    };
  }

  return {
    background: "#F7F1FC",
    border: "1px solid #E4D3EE",
    color: "#6E5084",
  };
}

export default function MyLeavePage() {
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [allowance, setAllowance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState("Annual Leave");
  const [dayPortion, setDayPortion] = useState<
    "Full day" | "Half day - morning" | "Half day - afternoon"
  >("Full day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLeave() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/my-employment/leave", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const result = (await response.json()) as {
          success?: boolean;
          employeeLinked?: boolean;
          allowance?: number | string | null;
          records?: LeaveRecord[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            result.error || "Your leave information could not be loaded.",
          );
        }

        if (!result.success) {
          throw new Error(
            result.error || "Your leave information could not be loaded.",
          );
        }

        if (!active) {
          return;
        }

        if (!result.employeeLinked) {
          setEmployeeLinked(false);
          setRecords([]);
          setAllowance(0);
          setLoading(false);

          return;
        }

        const leaveRecords = Array.isArray(result.records)
          ? result.records
          : [];

        const annualLeaveAllowance = numberValue(
          result.allowance,
        );

        setEmployeeLinked(true);
        setRecords(leaveRecords);
        setAllowance(annualLeaveAllowance);
        setLoading(false);
      } catch (error) {
        console.error("Leo HR employee leave load failed:", error);

        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Your leave information could not be loaded.",
        );
        setLoading(false);
      }
    }

    void loadLeave();

    return () => {
      active = false;
    };
  }, []);

  const annualLeaveRecords = useMemo(
    () =>
      records.filter((record) => {
        const leaveType = record.leave_type?.trim().toLowerCase();

        return (
          leaveType === "annual leave" ||
          leaveType === "half day leave"
        );
      }),
    [records],
  );

  const annualLeaveTaken = useMemo(
    () =>
      annualLeaveRecords
        .filter((record) => {
          const status = normaliseStatus(record.status).toLowerCase();

          if (status === "completed" || status === "taken") {
            return true;
          }

          if (status !== "approved") {
            return false;
          }

          const value = record.end_date || record.start_date;

          if (!value) {
            return false;
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const recordDate = new Date(`${value}T00:00:00`);

          return (
            !Number.isNaN(recordDate.getTime()) &&
            recordDate < today
          );
        })
        .reduce(
          (total, record) => total + numberValue(record.days_taken),
          0,
        ),
    [annualLeaveRecords],
  );

  const annualLeaveBooked = useMemo(
    () =>
      annualLeaveRecords
        .filter((record) => {
          const status = normaliseStatus(record.status).toLowerCase();

          if (status !== "approved") {
            return false;
          }

          const value = record.end_date || record.start_date;

          if (!value) {
            return false;
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const recordDate = new Date(`${value}T00:00:00`);

          return (
            !Number.isNaN(recordDate.getTime()) &&
            recordDate >= today
          );
        })
        .reduce(
          (total, record) => total + numberValue(record.days_taken),
          0,
        ),
    [annualLeaveRecords],
  );

  const annualLeavePending = useMemo(
    () =>
      annualLeaveRecords
        .filter((record) => {
          const status = normaliseStatus(record.status).toLowerCase();

          return (
            status === "requested" ||
            status === "submitted" ||
            status === "pending" ||
            status === "returned"
          );
        })
        .reduce(
          (total, record) => total + numberValue(record.days_taken),
          0,
        ),
    [annualLeaveRecords],
  );

  const annualLeaveConfirmed =
    annualLeaveTaken + annualLeaveBooked;

  const annualLeaveRemaining = Math.max(
    allowance - annualLeaveConfirmed,
    0,
  );

  const upcomingRecords = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return records.filter((record) => {
      if (!record.start_date || isCancelled(record)) return false;

      const start = new Date(`${record.start_date}T00:00:00`);
      return !Number.isNaN(start.getTime()) && start >= today;
    });
  }, [records]);

  const requestedDays = useMemo(
    () => calculateRequestedDays(startDate, endDate || startDate, dayPortion),
    [startDate, endDate, dayPortion],
  );

  const requestDeductsAnnualLeave =
    requestType === "Annual Leave" ||
    requestType === "Half Day Leave";

  const remainingAfterRequest = requestDeductsAnnualLeave
    ? Math.max(annualLeaveRemaining - requestedDays, 0)
    : annualLeaveRemaining;

  function resetRequestForm() {
    setRequestType("Annual Leave");
    setDayPortion("Full day");
    setStartDate("");
    setEndDate("");
    setRequestNotes("");
    setRequestError("");
    setShowRequestForm(false);
  }

  async function submitLeaveRequest() {
    setRequestError("");
    setRequestMessage("");

    if (!startDate) {
      setRequestError("Please choose a start date.");
      return;
    }

    const effectiveEndDate = endDate || startDate;

    if (effectiveEndDate < startDate) {
      setRequestError("The end date cannot be before the start date.");
      return;
    }

    if (requestedDays <= 0) {
      setRequestError(
        "The selected dates do not contain any working days.",
      );
      return;
    }

    if (
      requestDeductsAnnualLeave &&
      requestedDays > annualLeaveRemaining
    ) {
      const confirmed = window.confirm(
        `This request is for ${formatDays(requestedDays)} days, but your current remaining annual leave is ${formatDays(
          annualLeaveRemaining,
        )} days. Submit it for review anyway?`,
      );

      if (!confirmed) return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/my-employment/leave", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          leaveType: requestType,
          startDate,
          endDate: effectiveEndDate,
          dayPortion,
          daysTaken: requestedDays,
          employeeNotes: requestNotes,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            record?: LeaveRecord;
            error?: string;
          }
        | null;

      if (!response.ok || !result?.success || !result.record) {
        throw new Error(
          result?.error || "Your leave request could not be submitted.",
        );
      }

      setRecords((current) => [result.record as LeaveRecord, ...current]);
      setRequestMessage("Your leave request has been submitted for approval.");
      setRequestType("Annual Leave");
      setDayPortion("Full day");
      setStartDate("");
      setEndDate("");
      setRequestNotes("");
      setShowRequestForm(false);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Your leave request could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <main className={mobileStyles.leavePage} style={pageStyle}>
      <header className={mobileStyles.leaveHeader} style={headerStyle}>
        <div>
          <p className={mobileStyles.leaveEyebrow} style={eyebrowStyle}>Employee workspace</p>
          <h1 style={titleStyle}>My Leave</h1>
          <p style={subtitleStyle}>
            Review your leave entitlement, upcoming time away and recorded
            leave history.
          </p>
        </div>

        <Link className={mobileStyles.mobileBackLink} href="/dashboard/my-employment" style={backButtonStyle}>
          ← Back to My Employment
        </Link>
      </header>

      {loading ? (
        <StatePanel
          title="Loading your leave"
          message="Leo HR is preparing your entitlement and leave history."
        />
      ) : loadError ? (
        <StatePanel
          title="Leave information unavailable"
          message={loadError}
          error
        />
      ) : !employeeLinked ? (
        <StatePanel
          title="Employee record not linked"
          message="Your account is active, but it has not yet been linked to an employee record. An organisation owner or senior user needs to complete that link before your leave information can appear."
        />
      ) : (
        <>
          <section className={mobileStyles.leaveSummaryGrid} style={summaryGridStyle} aria-label="Leave summary">
            <SummaryCard
              label="Annual entitlement"
              value={`${formatDays(allowance)} days`}
              supportingText="Your recorded annual leave allowance"
            />

            <SummaryCard
              label="Taken"
              value={`${formatDays(annualLeaveTaken)} days`}
              supportingText="Approved annual leave already taken"
            />

            <SummaryCard
              label="Booked"
              value={`${formatDays(annualLeaveBooked)} days`}
              supportingText="Approved future annual leave"
            />

            <SummaryCard
              label="Pending"
              value={`${formatDays(annualLeavePending)} days`}
              supportingText="Awaiting approval or clarification"
            />

            <SummaryCard
              label="Remaining"
              value={`${formatDays(annualLeaveRemaining)} days`}
              supportingText="Confirmed balance after approved leave"
            />
          </section>

          <section className={mobileStyles.leaveRequestPanel} style={informationPanelStyle}>
            <div style={{ width: "100%" }}>
              <div className={mobileStyles.leaveRequestHeading} style={requestHeadingStyle}>
                <div>
                  <h2 style={panelTitleStyle}>Request leave</h2>
                  <p className={mobileStyles.leaveRequestSupporting} style={panelTextStyle}>
                    Submit annual leave for approval.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm((current) => !current);
                    setRequestError("");
                    setRequestMessage("");
                  }}
                  style={primaryActionStyle}
                >
                  {showRequestForm ? "Close" : "Request leave"}
                </button>
              </div>

              {requestMessage ? (
                <div style={successMessageStyle}>{requestMessage}</div>
              ) : null}

              {requestError ? (
                <div style={errorMessageStyle}>{requestError}</div>
              ) : null}

              {showRequestForm ? (
                <div style={{ marginTop: 18 }}>
                  <div className={mobileStyles.leaveRequestFormGrid} style={requestFormGridStyle}>
                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>Leave type</span>
                      <select
                        value={requestType}
                        onChange={(event) => setRequestType(event.target.value)}
                        style={inputStyle}
                      >
                        {employeeLeaveTypes.map((leaveType) => (
                          <option key={leaveType} value={leaveType}>
                            {leaveType}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>Day type</span>
                      <select
                        value={dayPortion}
                        onChange={(event) =>
                          setDayPortion(
                            event.target.value as
                              | "Full day"
                              | "Half day - morning"
                              | "Half day - afternoon",
                          )
                        }
                        style={inputStyle}
                      >
                        <option value="Full day">Full day</option>
                        <option value="Half day - morning">Half day - morning</option>
                        <option value="Half day - afternoon">Half day - afternoon</option>
                      </select>
                    </label>

                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>Start date</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        style={inputStyle}
                      />
                    </label>

                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>End date</span>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) => setEndDate(event.target.value)}
                        style={inputStyle}
                      />
                    </label>

                    <label style={fieldStyle}>
                      <span style={fieldLabelStyle}>Working days</span>
                      <input
                        value={formatDays(requestedDays)}
                        readOnly
                        style={readOnlyInputStyle}
                      />
                    </label>

                    {requestDeductsAnnualLeave ? (
                      <label style={fieldStyle}>
                        <span style={fieldLabelStyle}>
                          Remaining after approval
                        </span>
                        <input
                          value={`${formatDays(remainingAfterRequest)} days`}
                          readOnly
                          style={readOnlyInputStyle}
                        />
                      </label>
                    ) : null}

                    <label
                      className={mobileStyles.leaveRequestNotes}
                      style={{ ...fieldStyle, gridColumn: "1 / -1" }}
                    >
                      <span style={fieldLabelStyle}>Notes for your manager</span>
                      <textarea
                        value={requestNotes}
                        onChange={(event) => setRequestNotes(event.target.value)}
                        rows={3}
                        placeholder="Optional"
                        style={textareaStyle}
                      />
                    </label>
                  </div>

                  <div style={requestActionsStyle}>
                    <button
                      type="button"
                      onClick={() => void submitLeaveRequest()}
                      disabled={submitting}
                      style={
                        submitting
                          ? { ...primaryActionStyle, opacity: 0.6, cursor: "not-allowed" }
                          : primaryActionStyle
                      }
                    >
                      {submitting ? "Submitting..." : "Submit for approval"}
                    </button>

                    <button
                      type="button"
                      onClick={resetRequestForm}
                      disabled={submitting}
                      style={secondaryActionStyle}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className={mobileStyles.leaveHistoryPanel} style={recordsPanelStyle}>
            <div style={panelHeadingStyle}>
              <div>
                <h2 style={panelTitleStyle}>Leave history</h2>
                <p style={panelTextStyle}>
                  Your recorded leave and absence history.
                </p>
              </div>

              <span style={recordCountStyle}>
                {records.length} {records.length === 1 ? "record" : "records"}
              </span>
            </div>

            {records.length === 0 ? (
              <div style={emptyStateStyle}>
                <h3 style={emptyTitleStyle}>No leave recorded yet</h3>
                <p style={emptyTextStyle}>
                  Your leave history will appear here when records are added.
                </p>
              </div>
            ) : (
              <div style={recordListStyle}>
                {records.map((record) => {
                  const status = normaliseStatus(record.status);
                  const days = numberValue(record.days_taken);

                  return (
                    <article key={record.id} style={recordCardStyle}>
                      <div style={recordTopRowStyle}>
                        <div>
                          <h3 style={recordTitleStyle}>
                            {record.leave_type || "Leave record"}
                          </h3>

                          <p style={recordDateStyle}>
                            {formatDate(record.start_date)}
                            {record.end_date &&
                            record.end_date !== record.start_date
                              ? ` – ${formatDate(record.end_date)}`
                              : ""}
                          </p>
                        </div>

                        <span
                          style={{
                            ...statusBadgeBaseStyle,
                            ...statusStyle(status),
                          }}
                        >
                          {status}
                        </span>
                      </div>

                      <div style={recordDetailsGridStyle}>
                        <RecordDetail
                          label="Duration"
                          value={`${formatDays(days)} ${
                            days === 1 ? "day" : "days"
                          }`}
                        />

                        <RecordDetail
                          label="Recorded"
                          value={
                            record.created_at
                              ? new Intl.DateTimeFormat("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }).format(new Date(record.created_at))
                              : "Not recorded"
                          }
                        />
                      </div>

                      {record.notes ? (
                        <div style={notesStyle}>
                          <strong style={notesLabelStyle}>Notes</strong>
                          <p style={notesTextStyle}>{record.notes}</p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  supportingText,
}: {
  label: string;
  value: string;
  supportingText: string;
}) {
  return (
    <article className={mobileStyles.leaveSummaryCard} style={summaryCardStyle}>
      <span style={summaryLabelStyle}>{label}</span>
      <strong style={summaryValueStyle}>{value}</strong>
      <span className={mobileStyles.leaveSummarySupporting} style={summarySupportingStyle}>{supportingText}</span>
    </article>
  );
}

function RecordDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
    </div>
  );
}

function StatePanel({
  title,
  message,
  error = false,
}: {
  title: string;
  message: string;
  error?: boolean;
}) {
  return (
    <section
      style={{
        ...statePanelStyle,
        borderColor: error ? "#F1C5C5" : "#E8E2EB",
        background: error ? "#FFF8F8" : "#FFFFFF",
      }}
    >
      <h2 style={stateTitleStyle}>{title}</h2>
      <p style={stateTextStyle}>{message}</p>
    </section>
  );
}



function calculateRequestedDays(
  startDate: string,
  endDate: string,
  dayPortion:
    | "Full day"
    | "Half day - morning"
    | "Half day - afternoon",
) {
  if (!startDate) return 0;

  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate || startDate}T12:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  let total = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const day = cursor.getDay();

    if (day !== 0 && day !== 6) {
      total += 1;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (
    total > 0 &&
    dayPortion !== "Full day"
  ) {
    if ((endDate || startDate) === startDate) {
      return 0.5;
    }

    return Math.max(total - 0.5, 0.5);
  }

  return total;
}



const requestHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
};

const requestFormGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px 16px",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const fieldLabelStyle: CSSProperties = {
  color: "#514758",
  fontSize: "12px",
  fontWeight: 800,
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: "42px",
  border: "1px solid #DCD3E0",
  borderRadius: "10px",
  padding: "10px 11px",
  background: "#FFFFFF",
  color: "#302638",
  fontFamily: "inherit",
  fontSize: "13px",
};

const readOnlyInputStyle: CSSProperties = {
  ...inputStyle,
  background: "#F7F5F8",
  color: "#675D6C",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "86px",
  resize: "vertical",
  lineHeight: 1.5,
};

const requestActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "9px",
  marginTop: "16px",
};

const primaryActionStyle: CSSProperties = {
  border: "1px solid #6E5084",
  background: "#6E5084",
  color: "#FFFFFF",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const secondaryActionStyle: CSSProperties = {
  border: "1px solid #D8CCDE",
  background: "#FFFFFF",
  color: "#5B4568",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const successMessageStyle: CSSProperties = {
  marginTop: "14px",
  padding: "11px 12px",
  borderRadius: "10px",
  background: "#F5FFF9",
  border: "1px solid #CDE7DA",
  color: "#356653",
  fontSize: "13px",
};

const errorMessageStyle: CSSProperties = {
  marginTop: "14px",
  padding: "11px 12px",
  borderRadius: "10px",
  background: "#FBF2F4",
  border: "1px solid #E7CBD1",
  color: "#81505B",
  fontSize: "13px",
};


const pageStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "32px",
  lineHeight: 1.2,
  fontWeight: 750,
  letterSpacing: "-0.025em",
};

const subtitleStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#64748B",
  fontSize: "15px",
  lineHeight: 1.55,
};

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "42px",
  padding: "9px 15px",
  borderRadius: "11px",
  border: "1px solid #CDB2E2",
  background: "#FFFFFF",
  color: "#6E5084",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 700,
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const summaryCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minHeight: "145px",
  padding: "20px",
  borderRadius: "16px",
  background: "#FFFFFF",
  border: "1px solid #E8E2EB",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
};

const summaryLabelStyle: CSSProperties = {
  color: "#64748B",
  fontSize: "13px",
  fontWeight: 700,
};

const summaryValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "28px",
  lineHeight: 1.2,
};

const summarySupportingStyle: CSSProperties = {
  marginTop: "auto",
  color: "#7C8798",
  fontSize: "12px",
  lineHeight: 1.45,
};

const informationPanelStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "20px",
  padding: "20px",
  borderRadius: "16px",
  background: "#F7F1FC",
  border: "1px solid #E4D3EE",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  color: "#2F2635",
  fontSize: "17px",
  lineHeight: 1.4,
  fontWeight: 750,
};

const panelTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#64748B",
  fontSize: "14px",
  lineHeight: 1.55,
};

const recordsPanelStyle: CSSProperties = {
  padding: "22px",
  borderRadius: "18px",
  background: "#FFFFFF",
  border: "1px solid #E8E2EB",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
};

const panelHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "18px",
};

const recordCountStyle: CSSProperties = {
  flexShrink: 0,
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 750,
};

const recordListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const recordCardStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  background: "#FCFCFD",
  border: "1px solid #ECE8EF",
};

const recordTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "14px",
};

const recordTitleStyle: CSSProperties = {
  margin: 0,
  color: "#2F2635",
  fontSize: "15px",
  lineHeight: 1.4,
  fontWeight: 750,
};

const recordDateStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#64748B",
  fontSize: "13px",
};

const statusBadgeBaseStyle: CSSProperties = {
  flexShrink: 0,
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 750,
};

const recordDetailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "14px",
  marginTop: "16px",
  paddingTop: "15px",
  borderTop: "1px solid #ECE8EF",
};

const detailLabelStyle: CSSProperties = {
  color: "#7C8798",
  fontSize: "11px",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const detailValueStyle: CSSProperties = {
  marginTop: "4px",
  color: "#2F2635",
  fontSize: "13px",
  fontWeight: 650,
};

const notesStyle: CSSProperties = {
  marginTop: "15px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#FFFFFF",
  border: "1px solid #EEEAF1",
};

const notesLabelStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
};

const notesTextStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#526071",
  fontSize: "13px",
  lineHeight: 1.5,
};

const emptyStateStyle: CSSProperties = {
  padding: "36px 20px",
  textAlign: "center",
  borderRadius: "14px",
  background: "#FCFCFD",
  border: "1px dashed #DCCFE4",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "#2F2635",
  fontSize: "16px",
};

const emptyTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#64748B",
  fontSize: "14px",
};

const statePanelStyle: CSSProperties = {
  padding: "30px",
  borderRadius: "18px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#E8E2EB",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
};

const stateTitleStyle: CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "18px",
};

const stateTextStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#64748B",
  fontSize: "14px",
  lineHeight: 1.55,
};