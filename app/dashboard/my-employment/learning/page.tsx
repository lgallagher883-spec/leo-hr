"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { createClient } from "@/lib/supabase/client";

type EmployeeLink = {
  employee_id: number | null;
};

type LearningModule = {
  id?: number | null;
  title?: string | null;
  description?: string | null;
  estimated_duration_minutes?: number | null;
};

type DevelopmentPathway = {
  id?: number | null;
  title?: string | null;
  description?: string | null;
};

type LearningAssignment = {
  id: number;
  employee_id: number;
  learning_module_id: number | null;
  development_pathway_id: number | null;
  assignment_type: string | null;
  assigned_at: string | null;
  start_date: string | null;
  due_date: string | null;
  status: string | null;
  progress_percentage: number | string | null;
  completed_at: string | null;
  manager_validation_required: boolean | null;
  learning_modules?: LearningModule | LearningModule[] | null;
  development_pathways?:
    | DevelopmentPathway
    | DevelopmentPathway[]
    | null;
};

type LearningCertificate = {
  id: number;
  title: string | null;
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string | null;
  file_url: string | null;
};

type ReminderItem = {
  id: string;
  title: string;
  message: string;
  actionUrl: string | null;
  metadata?: {
    module?: string;
    milestone?: string;
  };
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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
  return value?.trim() || "Not Started";
}

function isComplete(assignment: LearningAssignment) {
  return normaliseStatus(assignment.status).toLowerCase() === "completed";
}

function isOverdue(assignment: LearningAssignment) {
  if (!assignment.due_date || isComplete(assignment)) return false;

  const due = new Date(`${assignment.due_date}T23:59:59`);
  return !Number.isNaN(due.getTime()) && due < new Date();
}

function getAssignmentTitle(assignment: LearningAssignment) {
  const module = firstRelation(assignment.learning_modules);
  const pathway = firstRelation(assignment.development_pathways);

  return (
    module?.title ||
    pathway?.title ||
    (assignment.learning_module_id
      ? "Learning assignment"
      : "Development pathway")
  );
}

function getAssignmentDescription(assignment: LearningAssignment) {
  const module = firstRelation(assignment.learning_modules);
  const pathway = firstRelation(assignment.development_pathways);

  return (
    module?.description ||
    pathway?.description ||
    "No description has been added."
  );
}

function getAssignmentKind(assignment: LearningAssignment) {
  return assignment.learning_module_id
    ? "Learning module"
    : "Development pathway";
}

function statusStyle(status: string): CSSProperties {
  const value = status.toLowerCase();

  if (value === "completed") {
    return {
      background: "#ECFDF3",
      border: "1px solid #BBE7CE",
      color: "#256344",
    };
  }

  if (value === "in progress") {
    return {
      background: "#F7F1FC",
      border: "1px solid #DFCDE9",
      color: "#6E5084",
    };
  }

  if (
    value === "awaiting assessment" ||
    value === "awaiting validation"
  ) {
    return {
      background: "#FFF8E8",
      border: "1px solid #F4D99A",
      color: "#805D16",
    };
  }

  if (value === "paused" || value === "removed") {
    return {
      background: "#F3F4F6",
      border: "1px solid #D8DCE2",
      color: "#596273",
    };
  }

  return {
    background: "#F8FAFC",
    border: "1px solid #DCE3EA",
    color: "#526071",
  };
}

export default function MyLearningPage() {
  const [assignments, setAssignments] = useState<LearningAssignment[]>([]);
  const [certificates, setCertificates] = useState<LearningCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [employeeLinked, setEmployeeLinked] = useState(true);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLearning() {
      setLoading(true);
      setLoadError("");

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Your signed-in account could not be confirmed.");
        }

        const membershipResult = await (supabase as any)
          .from("identity_organisation_memberships")
          .select("employee_id")
          .eq("user_id", user.id)
          .eq("membership_status", "active")
          .not("employee_id", "is", null)
          .limit(1)
          .maybeSingle();

        if (membershipResult.error) {
          throw membershipResult.error;
        }

        const employeeLink =
          membershipResult.data as EmployeeLink | null;

        if (!employeeLink?.employee_id) {
          if (active) {
            setEmployeeLinked(false);
            setAssignments([]);
            setCertificates([]);
            setLoading(false);
          }

          return;
        }

        const employeeId = employeeLink.employee_id;

        const [assignmentResult, certificateResult] = await Promise.all([
          (supabase as any)
            .from("learning_assignments")
            .select(
              `
                id,
                employee_id,
                learning_module_id,
                development_pathway_id,
                assignment_type,
                assigned_at,
                start_date,
                due_date,
                status,
                progress_percentage,
                completed_at,
                manager_validation_required,
                learning_modules (
                  id,
                  title,
                  description,
                  estimated_duration_minutes
                ),
                development_pathways (
                  id,
                  title,
                  description
                )
              `,
            )
            .eq("employee_id", employeeId)
            .neq("status", "Removed")
            .order("due_date", { ascending: true, nullsFirst: false }),
          (supabase as any)
            .from("learning_certificates")
            .select(
              "id, title, certificate_number, issue_date, expiry_date, status, file_url",
            )
            .eq("employee_id", employeeId)
            .order("issue_date", { ascending: false }),
        ]);

        if (assignmentResult.error) {
          throw assignmentResult.error;
        }

        if (certificateResult.error) {
          console.warn(
            "LEO could not load employee learning certificates:",
            certificateResult.error,
          );
        }

        if (!active) return;

        setEmployeeLinked(true);
        setAssignments(
          (assignmentResult.data ?? []) as LearningAssignment[],
        );
        setCertificates(
          (certificateResult.data ?? []) as LearningCertificate[],
        );
        setLoading(false);
      } catch (error) {
        console.error("LEO employee learning load failed:", error);

        if (!active) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Your learning information could not be loaded.",
        );
        setLoading(false);
      }
    }

    void loadLearning();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadReminders() {
      setRemindersLoading(true);

      try {
        const response = await fetch("/api/reminders?limit=10", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              success?: boolean;
              reminders?: ReminderItem[];
            }
          | null;

        if (!response.ok || !payload?.success) {
          throw new Error("Personal reminders could not be loaded.");
        }

        if (!active) return;

        const filtered = (payload.reminders || []).filter((item) => {
          const moduleKey = String(item.metadata?.module || "").toLowerCase();
          return moduleKey === "learn" || moduleKey === "compliance";
        });

        setReminders(filtered);
      } catch (error) {
        console.error("My Employment reminders could not be loaded:", error);
        if (!active) return;
        setReminders([]);
      } finally {
        if (active) {
          setRemindersLoading(false);
        }
      }
    }

    void loadReminders();

    return () => {
      active = false;
    };
  }, []);

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => !isComplete(assignment)),
    [assignments],
  );

  const completedAssignments = useMemo(
    () => assignments.filter(isComplete),
    [assignments],
  );

  const overdueAssignments = useMemo(
    () => assignments.filter(isOverdue),
    [assignments],
  );

  const averageProgress = useMemo(() => {
    if (activeAssignments.length === 0) return 0;

    const total = activeAssignments.reduce(
      (sum, assignment) =>
        sum + numberValue(assignment.progress_percentage),
      0,
    );

    return Math.round(total / activeAssignments.length);
  }, [activeAssignments]);

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Employee workspace</p>
          <h1 style={titleStyle}>My Learning</h1>
          <p style={subtitleStyle}>
            Review assigned learning, development pathways, progress and
            certificates.
          </p>
        </div>

        <Link href="/dashboard/my-employment" style={backButtonStyle}>
          ← Back to My Employment
        </Link>
      </header>

      {loading ? (
        <StatePanel
          title="Loading your learning"
          message="LEO is preparing your assignments and certificates."
        />
      ) : loadError ? (
        <StatePanel
          title="Learning information unavailable"
          message={loadError}
          error
        />
      ) : !employeeLinked ? (
        <StatePanel
          title="Employee record not linked"
          message="Your account is active, but it has not yet been linked to an employee record. An organisation owner or senior user needs to complete that link before your learning can appear."
        />
      ) : (
        <>
          <section style={reminderPanelStyle} aria-label="Personal reminders">
            <h2 style={reminderPanelTitleStyle}>Personal reminders</h2>

            {remindersLoading ? (
              <p style={reminderPanelTextStyle}>Loading reminders...</p>
            ) : reminders.length === 0 ? (
              <p style={reminderPanelTextStyle}>No active personal reminders.</p>
            ) : (
              <ul style={reminderListStyle}>
                {reminders.map((item) => (
                  <li key={item.id} style={reminderItemStyle}>
                    <div>
                      <p style={reminderItemTitleStyle}>{item.title}</p>
                      <p style={reminderItemTextStyle}>{item.message}</p>
                    </div>

                    {item.actionUrl ? (
                      <Link href={item.actionUrl} style={reminderLinkStyle}>
                        Open
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={summaryGridStyle} aria-label="Learning summary">
            <SummaryCard
              label="Active learning"
              value={String(activeAssignments.length)}
              supportingText="Assignments awaiting completion"
            />

            <SummaryCard
              label="Average progress"
              value={`${averageProgress}%`}
              supportingText="Across active assignments"
            />

            <SummaryCard
              label="Overdue"
              value={String(overdueAssignments.length)}
              supportingText="Learning currently past its due date"
              warning={overdueAssignments.length > 0}
            />

            <SummaryCard
              label="Certificates"
              value={String(certificates.length)}
              supportingText="Certificates held in LEO Learn"
            />
          </section>

          <section style={panelStyle}>
            <div style={panelHeadingStyle}>
              <div>
                <h2 style={panelTitleStyle}>Current learning</h2>
                <p style={panelTextStyle}>
                  Your active modules and development pathways.
                </p>
              </div>

              <span style={countStyle}>
                {activeAssignments.length} active
              </span>
            </div>

            {activeAssignments.length === 0 ? (
              <EmptyState
                title="No active learning"
                message="You do not currently have any learning assignments awaiting completion."
              />
            ) : (
              <div style={assignmentGridStyle}>
                {activeAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                  />
                ))}
              </div>
            )}
          </section>

          <section style={twoColumnGridStyle}>
            <div style={panelStyle}>
              <div style={panelHeadingStyle}>
                <div>
                  <h2 style={panelTitleStyle}>Completed learning</h2>
                  <p style={panelTextStyle}>
                    Your latest completed assignments.
                  </p>
                </div>

                <span style={countStyle}>
                  {completedAssignments.length} completed
                </span>
              </div>

              {completedAssignments.length === 0 ? (
                <EmptyState
                  title="No completed learning yet"
                  message="Completed modules and pathways will appear here."
                />
              ) : (
                <div style={compactListStyle}>
                  {completedAssignments.slice(0, 6).map((assignment) => (
                    <div key={assignment.id} style={compactRowStyle}>
                      <div>
                        <strong style={compactTitleStyle}>
                          {getAssignmentTitle(assignment)}
                        </strong>
                        <div style={compactMetaStyle}>
                          Completed {formatDate(assignment.completed_at)}
                        </div>
                      </div>

                      <span
                        style={{
                          ...statusBadgeBaseStyle,
                          ...statusStyle("Completed"),
                        }}
                      >
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={panelStyle}>
              <div style={panelHeadingStyle}>
                <div>
                  <h2 style={panelTitleStyle}>Certificates</h2>
                  <p style={panelTextStyle}>
                    Certificates issued through LEO Learn.
                  </p>
                </div>

                <span style={countStyle}>{certificates.length} held</span>
              </div>

              {certificates.length === 0 ? (
                <EmptyState
                  title="No certificates yet"
                  message="Certificates issued after eligible learning is completed will appear here."
                />
              ) : (
                <div style={compactListStyle}>
                  {certificates.slice(0, 6).map((certificate) => (
                    <div key={certificate.id} style={certificateRowStyle}>
                      <div>
                        <strong style={compactTitleStyle}>
                          {certificate.title || "Learning certificate"}
                        </strong>

                        <div style={compactMetaStyle}>
                          Issued {formatDate(certificate.issue_date)}
                          {certificate.expiry_date
                            ? ` · Expires ${formatDate(
                                certificate.expiry_date,
                              )}`
                            : ""}
                        </div>

                        {certificate.certificate_number ? (
                          <div style={certificateNumberStyle}>
                            {certificate.certificate_number}
                          </div>
                        ) : null}
                      </div>

                      {certificate.file_url ? (
                        <a
                          href={certificate.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={viewLinkStyle}
                        >
                          View
                        </a>
                      ) : (
                        <span
                          style={{
                            ...statusBadgeBaseStyle,
                            ...statusStyle(
                              certificate.status || "Active",
                            ),
                          }}
                        >
                          {certificate.status || "Active"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function AssignmentCard({
  assignment,
}: {
  assignment: LearningAssignment;
}) {
  const progress = Math.min(
    Math.max(numberValue(assignment.progress_percentage), 0),
    100,
  );
  const status = normaliseStatus(assignment.status);
  const overdue = isOverdue(assignment);

  return (
    <article style={assignmentCardStyle}>
      <div style={assignmentTopStyle}>
        <div>
          <div style={kindStyle}>{getAssignmentKind(assignment)}</div>
          <h3 style={assignmentTitleStyle}>
            {getAssignmentTitle(assignment)}
          </h3>
        </div>

        <span
          style={{
            ...statusBadgeBaseStyle,
            ...(overdue
              ? {
                  background: "#FFF1F1",
                  border: "1px solid #F1C5C5",
                  color: "#8F3B3B",
                }
              : statusStyle(status)),
          }}
        >
          {overdue ? "Overdue" : status}
        </span>
      </div>

      <p style={assignmentDescriptionStyle}>
        {getAssignmentDescription(assignment)}
      </p>

      <div style={progressHeaderStyle}>
        <span>Progress</span>
        <strong>{Math.round(progress)}%</strong>
      </div>

      <div style={progressTrackStyle}>
        <div
          style={{
            ...progressFillStyle,
            width: `${progress}%`,
          }}
        />
      </div>

      <div style={assignmentMetaGridStyle}>
        <Detail
          label="Assigned"
          value={formatDate(assignment.assigned_at)}
        />

        <Detail
          label="Due"
          value={formatDate(assignment.due_date)}
        />

        <Detail
          label="Assignment"
          value={assignment.assignment_type || "Not specified"}
        />
      </div>

      {assignment.manager_validation_required ? (
        <div style={validationNoticeStyle}>
          Manager validation is required before this learning is fully
          completed.
        </div>
      ) : null}
    </article>
  );
}

function SummaryCard({
  label,
  value,
  supportingText,
  warning = false,
}: {
  label: string;
  value: string;
  supportingText: string;
  warning?: boolean;
}) {
  return (
    <article
      style={{
        ...summaryCardStyle,
        borderColor: warning ? "#F1C5C5" : "#E8E2EB",
        background: warning ? "#FFF9F9" : "#FFFFFF",
      }}
    >
      <span style={summaryLabelStyle}>{label}</span>
      <strong
        style={{
          ...summaryValueStyle,
          color: warning ? "#8F3B3B" : "#6E5084",
        }}
      >
        {value}
      </strong>
      <span style={summarySupportingStyle}>{supportingText}</span>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
    </div>
  );
}

function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div style={emptyStateStyle}>
      <h3 style={emptyTitleStyle}>{title}</h3>
      <p style={emptyTextStyle}>{message}</p>
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

const reminderPanelStyle: CSSProperties = {
  marginBottom: "20px",
  padding: "16px",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  background: "#FFFFFF",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
};

const reminderPanelTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "#111827",
  fontSize: "16px",
  lineHeight: 1.3,
  fontWeight: 700,
};

const reminderPanelTextStyle: CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const reminderListStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: "10px",
};

const reminderItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  padding: "10px",
};

const reminderItemTitleStyle: CSSProperties = {
  margin: "0 0 3px",
  color: "#111827",
  fontSize: "13px",
  lineHeight: 1.4,
  fontWeight: 700,
};

const reminderItemTextStyle: CSSProperties = {
  margin: 0,
  color: "#4B5563",
  fontSize: "12px",
  lineHeight: 1.45,
};

const reminderLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "8px",
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
  textDecoration: "none",
  padding: "6px 9px",
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
  border: "1px solid #E8E2EB",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
};

const summaryLabelStyle: CSSProperties = {
  color: "#64748B",
  fontSize: "13px",
  fontWeight: 700,
};

const summaryValueStyle: CSSProperties = {
  fontSize: "28px",
  lineHeight: 1.2,
};

const summarySupportingStyle: CSSProperties = {
  marginTop: "auto",
  color: "#7C8798",
  fontSize: "12px",
  lineHeight: 1.45,
};

const panelStyle: CSSProperties = {
  marginBottom: "20px",
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
  lineHeight: 1.5,
};

const countStyle: CSSProperties = {
  flexShrink: 0,
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 750,
};

const assignmentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "16px",
};

const assignmentCardStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  background: "#FCFCFD",
  border: "1px solid #ECE8EF",
};

const assignmentTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "14px",
};

const kindStyle: CSSProperties = {
  marginBottom: "5px",
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const assignmentTitleStyle: CSSProperties = {
  margin: 0,
  color: "#2F2635",
  fontSize: "16px",
  lineHeight: 1.4,
};

const assignmentDescriptionStyle: CSSProperties = {
  minHeight: "44px",
  margin: "12px 0 16px",
  color: "#64748B",
  fontSize: "13px",
  lineHeight: 1.55,
};

const statusBadgeBaseStyle: CSSProperties = {
  flexShrink: 0,
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 750,
};

const progressHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "7px",
  color: "#526071",
  fontSize: "12px",
};

const progressTrackStyle: CSSProperties = {
  height: "8px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "#EDE7F1",
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "#6E5084",
  transition: "width 200ms ease",
};

const assignmentMetaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: "12px",
  marginTop: "16px",
  paddingTop: "15px",
  borderTop: "1px solid #ECE8EF",
};

const detailLabelStyle: CSSProperties = {
  color: "#7C8798",
  fontSize: "10px",
  fontWeight: 750,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const detailValueStyle: CSSProperties = {
  marginTop: "4px",
  color: "#2F2635",
  fontSize: "12px",
  fontWeight: 650,
};

const validationNoticeStyle: CSSProperties = {
  marginTop: "14px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "#FFF8E8",
  border: "1px solid #F4D99A",
  color: "#805D16",
  fontSize: "12px",
  lineHeight: 1.45,
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "20px",
};

const compactListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const compactRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  padding: "13px 14px",
  borderRadius: "11px",
  background: "#FCFCFD",
  border: "1px solid #ECE8EF",
};

const certificateRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "14px",
  padding: "13px 14px",
  borderRadius: "11px",
  background: "#FCFCFD",
  border: "1px solid #ECE8EF",
};

const compactTitleStyle: CSSProperties = {
  color: "#2F2635",
  fontSize: "13px",
  lineHeight: 1.4,
};

const compactMetaStyle: CSSProperties = {
  marginTop: "4px",
  color: "#7C8798",
  fontSize: "11px",
  lineHeight: 1.45,
};

const certificateNumberStyle: CSSProperties = {
  marginTop: "4px",
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 700,
};

const viewLinkStyle: CSSProperties = {
  flexShrink: 0,
  padding: "6px 10px",
  borderRadius: "9px",
  background: "#F7F1FC",
  border: "1px solid #DFCDE9",
  color: "#6E5084",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 750,
};

const emptyStateStyle: CSSProperties = {
  padding: "30px 18px",
  textAlign: "center",
  borderRadius: "13px",
  background: "#FCFCFD",
  border: "1px dashed #DCCFE4",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "#2F2635",
  fontSize: "15px",
};

const emptyTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#64748B",
  fontSize: "13px",
  lineHeight: 1.5,
};

const statePanelStyle: CSSProperties = {
  padding: "30px",
  borderRadius: "18px",
  border: "1px solid #E8E2EB",
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