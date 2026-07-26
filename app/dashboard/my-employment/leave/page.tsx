"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

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

function isAnnualLeave(record: LeaveRecord) {
  return record.leave_type?.trim().toLowerCase() === "annual leave";
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
        console.error("LEO employee leave load failed:", error);

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

  const annualLeaveUsed = useMemo(
    () =>
      records
        .filter((record) => isAnnualLeave(record) && !isCancelled(record))
        .reduce(
          (total, record) => total + numberValue(record.days_taken),
          0,
        ),
    [records],
  );

  const annualLeaveRemaining = Math.max(
    allowance - annualLeaveUsed,
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

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Employee workspace</p>
          <h1 style={titleStyle}>My Leave</h1>
          <p style={subtitleStyle}>
            Review your leave entitlement, upcoming time away and recorded
            leave history.
          </p>
        </div>

        <Link href="/dashboard/my-employment" style={backButtonStyle}>
          ← Back to My Employment
        </Link>
      </header>

      {loading ? (
        <StatePanel
          title="Loading your leave"
          message="LEO is preparing your entitlement and leave history."
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
          <section style={summaryGridStyle} aria-label="Leave summary">
            <SummaryCard
              label="Annual entitlement"
              value={`${formatDays(allowance)} days`}
              supportingText="Your recorded annual leave allowance"
            />

            <SummaryCard
              label="Used or booked"
              value={`${formatDays(annualLeaveUsed)} days`}
              supportingText="Approved, requested or taken annual leave"
            />

            <SummaryCard
              label="Remaining"
              value={`${formatDays(annualLeaveRemaining)} days`}
              supportingText="Based on the records currently held"
            />

            <SummaryCard
              label="Upcoming"
              value={String(upcomingRecords.length)}
              supportingText="Future non-cancelled leave records"
            />
          </section>

          <section style={informationPanelStyle}>
            <div>
              <h2 style={panelTitleStyle}>Requesting leave</h2>
              <p style={panelTextStyle}>
                Employee leave requests will be submitted through a protected
                approval route. Until that route is enabled, this workspace is
                read-only and shows the records currently held by your
                organisation.
              </p>
            </div>

            <span style={readOnlyBadgeStyle}>Read-only</span>
          </section>

          <section style={recordsPanelStyle}>
            <div style={panelHeadingStyle}>
              <div>
                <h2 style={panelTitleStyle}>Leave history</h2>
                <p style={panelTextStyle}>
                  Your recorded annual leave, absence and other workplace leave.
                </p>
              </div>

              <span style={recordCountStyle}>
                {records.length} {records.length === 1 ? "record" : "records"}
              </span>
            </div>

            {records.length === 0 ? (
              <div style={emptyStateStyle}>
                <h3 style={emptyTitleStyle}>No leave records yet</h3>
                <p style={emptyTextStyle}>
                  Your leave and absence history will appear here when records
                  are added.
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
    <article style={summaryCardStyle}>
      <span style={summaryLabelStyle}>{label}</span>
      <strong style={summaryValueStyle}>{value}</strong>
      <span style={summarySupportingStyle}>{supportingText}</span>
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

const readOnlyBadgeStyle: CSSProperties = {
  flexShrink: 0,
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#FFFFFF",
  border: "1px solid #DCC8E8",
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 750,
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