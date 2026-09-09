"use client";

import ComplianceSummary from "./components/ComplianceSummary";
import DBSSafeguarding from "./components/DBSSafeguarding";
import DrivingChecks from "./components/DrivingChecks";
import EmergencyContacts from "./components/EmergencyContacts";
import EmployeeDevelopment from "./components/EmployeeDevelopment";
import EmployeeDocuments from "./components/EmployeeDocuments";
import EmployeeMatters from "./components/EmployeeMatters";
import EmployeeMedical from "./components/EmployeeMedical";
import EmployeeNotes from "./components/EmployeeNotes";
import EmployeeWarnings from "./components/EmployeeWarnings";
import EmploymentDetails from "./components/EmploymentDetails";
import LeaveAbsence from "./components/LeaveAbsence";
import RightToWork from "./components/RightToWork";
import TrainingLogs from "./components/TrainingLogs";

import { useParams, useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type Employee = {
  id: number;
  name: string;
  role: string | null;
  email: string | null;
  status: string | null;
  start_date: string | null;
};

type ProfileSection =
  | "Overview"
  | "Employment"
  | "Compliance Summary"
  | "Development"
  | "Learning"
  | "Timeline"
  | "Documents"
  | "Matters"
  | "Leave & Absence"
  | "Warnings"
  | "Right to Work"
  | "DBS / Safeguarding"
  | "Driving"
  | "Medical"
  | "Emergency Contacts"
  | "Notes"
  | "Archive";

type NavigationItem = {
  section: ProfileSection;
  description: string;
  minimumRole: PlatformRole;
};

type TimelineEvent = {
  id: string;
  date: string | null;
  title: string;
  description: string;
  category:
    | "Employment"
    | "Compliance"
    | "Development"
    | "Learning"
    | "Document"
    | "Matter"
    | "System";
  source: string;
};

type QuickAction = {
  label: string;
  section: ProfileSection;
  description: string;
  minimumRole: PlatformRole;
};

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const navigationItems: NavigationItem[] = [
  { section: "Overview", description: "Current position and connected activity", minimumRole: "Employee" },
  { section: "Employment", description: "Employment information and status", minimumRole: "Employee" },
  { section: "Compliance Summary", description: "Current checks, records and renewals", minimumRole: "Manager" },
  { section: "Development", description: "Probation, reviews and development", minimumRole: "Employee" },
  { section: "Learning", description: "Training, learning and qualifications", minimumRole: "Employee" },
  { section: "Timeline", description: "Chronological employee history", minimumRole: "Manager" },
  { section: "Documents", description: "Employment and supporting documents", minimumRole: "Employee" },
  { section: "Matters", description: "Connected workplace Matters", minimumRole: "Manager" },
  { section: "Leave & Absence", description: "Leave and absence records", minimumRole: "Employee" },
  { section: "Warnings", description: "Formal warning history", minimumRole: "Manager" },
  { section: "Right to Work", description: "Eligibility evidence and review dates", minimumRole: "Senior" },
  { section: "DBS / Safeguarding", description: "DBS and safeguarding records", minimumRole: "Senior" },
  { section: "Driving", description: "Driving records and annual DVLA checks", minimumRole: "Manager" },
  { section: "Medical", description: "Restricted employment health records", minimumRole: "Senior" },
  { section: "Emergency Contacts", description: "Emergency contact information", minimumRole: "Employee" },
  { section: "Notes", description: "General employment notes", minimumRole: "Manager" },
  { section: "Archive", description: "Archive or restore the employee record", minimumRole: "Senior" },
];

const quickActions: QuickAction[] = [
  { label: "Update employment", section: "Employment", description: "Review or update employment information, working pattern and leave setup.", minimumRole: "Senior" },
  { label: "Right to Work", section: "Right to Work", description: "Add or review Right to Work evidence and follow-up dates.", minimumRole: "Senior" },
  { label: "DBS / Safeguarding", section: "DBS / Safeguarding", description: "Add or review DBS, Update Service and safeguarding records.", minimumRole: "Senior" },
  { label: "Driving", section: "Driving", description: "Add or review licence, DVLA, insurance and vehicle-check information.", minimumRole: "Manager" },
  { label: "Medical", section: "Medical", description: "Open restricted employment-health and occupational-health information.", minimumRole: "Senior" },
  { label: "Add document", section: "Documents", description: "Upload or review employee documentation.", minimumRole: "Manager" },
  { label: "Record absence", section: "Leave & Absence", description: "Open the employee’s leave and absence record.", minimumRole: "Manager" },
  { label: "Schedule review", section: "Development", description: "Open probation, reviews and one-to-one activity.", minimumRole: "Manager" },
  { label: "Open Matter", section: "Matters", description: "View existing Matters or begin a connected workplace Matter.", minimumRole: "Manager" },
  { label: "View learning", section: "Learning", description: "Review training, qualifications and development activity.", minimumRole: "Manager" },
];

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const employeeId = useMemo(() => {
    const parsed = Number(params.id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [params.id]);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeSection, setActiveSection] = useState<ProfileSection>("Overview");
  const [platformRole, setPlatformRole] = useState<PlatformRole>("Employee");
  const [roleResolved, setRoleResolved] = useState(false);

  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");

  const hasPermission = useCallback(
    (minimumRole: PlatformRole) => roleRank[platformRole] >= roleRank[minimumRole],
    [platformRole]
  );

  const visibleNavigationItems = useMemo(
    () => navigationItems.filter((item) => hasPermission(item.minimumRole)),
    [hasPermission]
  );

  const visibleQuickActions = useMemo(
    () => quickActions.filter((action) => hasPermission(action.minimumRole)),
    [hasPermission]
  );

  const resolvePlatformRole = useCallback(async () => {
    try {
      const response = await fetch("/api/current-access", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const result = (await response.json()) as {
        success?: boolean;
        role?: unknown;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Your employee workspace access could not be resolved.");
      }

      setPlatformRole(normalisePlatformRole(result.role));
    } catch (error) {
      console.error("Employee workspace role could not be resolved:", error);
      setPlatformRole("Employee");
    } finally {
      setRoleResolved(true);
    }
  }, []);

  const loadEmployee = useCallback(async () => {
    if (!employeeId) {
      setLoadError("The employee reference is not valid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const result = (await response.json()) as {
        success?: boolean;
        employee?: Employee;
        error?: string;
      };

      if (!response.ok || !result.success || !result.employee) {
        throw new Error(
          result.error ||
            "This employee record could not be loaded. Please return to Employees and try again."
        );
      }

      setEmployee(result.employee);
    } catch (error) {
      console.error("Error loading employee:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "This employee record could not be loaded. Please return to Employees and try again."
      );
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void Promise.all([loadEmployee(), resolvePlatformRole()]);
  }, [loadEmployee, resolvePlatformRole]);

  useEffect(() => {
    if (!roleResolved) return;

    const selectedItem = navigationItems.find((item) => item.section === activeSection);

    if (
      selectedItem &&
      !hasPermission(selectedItem.minimumRole) &&
      visibleNavigationItems.length > 0
    ) {
      setActiveSection(visibleNavigationItems[0].section);
    }
  }, [activeSection, hasPermission, roleResolved, visibleNavigationItems]);

  const buildTimeline = useCallback(async () => {
    if (!employee) return;

    setTimelineLoading(true);
    setTimelineError("");

    try {
      const response = await fetch(`/api/employees/${employee.id}?include=timeline`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const result = (await response.json()) as {
        success?: boolean;
        timeline?: TimelineEvent[];
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "The employee timeline could not be loaded.");
      }

      setTimelineEvents(result.timeline || []);
    } catch (error) {
      console.error("Employee timeline could not be loaded:", error);
      setTimelineEvents([]);
      setTimelineError(
        error instanceof Error ? error.message : "The employee timeline could not be loaded."
      );
    } finally {
      setTimelineLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    if (activeSection === "Timeline" && employee) {
      void buildTimeline();
    }
  }, [activeSection, employee, buildTimeline]);

  async function archiveEmployee() {
    if (!employee || archiving) return;

    const confirmed = window.confirm(
      `Archive ${employee.name}?\n\nThe employee will be removed from the active employee list. Their profile, documents, Matters, learning history and audit record will remain preserved.`
    );

    if (!confirmed) return;

    setArchiving(true);
    setArchiveError("");
    setArchiveSuccess("");

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        employee?: Employee;
        error?: string;
      };

      if (!response.ok || !result.success || !result.employee) {
        throw new Error(result.error || "The employee could not be archived. No changes were made.");
      }

      setEmployee(result.employee);
      setArchiveSuccess(`${employee.name} has been archived. Their employment record remains preserved.`);
    } catch (error) {
      setArchiveError(
        error instanceof Error ? error.message : "The employee could not be archived. No changes were made."
      );
    } finally {
      setArchiving(false);
    }
  }

  async function restoreEmployee() {
    if (!employee || restoring) return;

    const confirmed = window.confirm(`Restore ${employee.name} to the active employee register?`);
    if (!confirmed) return;

    setRestoring(true);
    setArchiveError("");
    setArchiveSuccess("");

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        employee?: Employee;
        error?: string;
      };

      if (!response.ok || !result.success || !result.employee) {
        throw new Error(result.error || "The employee could not be restored. No changes were made.");
      }

      setEmployee(result.employee);
      setArchiveSuccess(`${employee.name} has been restored to the active employee register.`);
    } catch (error) {
      setArchiveError(
        error instanceof Error ? error.message : "The employee could not be restored. No changes were made."
      );
    } finally {
      setRestoring(false);
    }
  }

  function openSection(section: ProfileSection) {
    const item = navigationItems.find((navigationItem) => navigationItem.section === section);
    if (!item || !hasPermission(item.minimumRole)) return;

    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading || !roleResolved) {
    return <PageState title="Loading employee" message="The employee workspace is being prepared." />;
  }

  if (loadError || !employee) {
    return (
      <PageState
        title="Employee unavailable"
        message={loadError || "The employee record could not be found or you do not have access to it."}
        actionLabel="Return to employees"
        onAction={() => router.push("/dashboard/employees")}
      />
    );
  }

  const employeeStatus = normaliseEmployeeStatus(employee.status);
  const isArchived = employeeStatus === "Archived";
  const isNewStarter = employeeStatus === "New Starter";
  const startDateLabel = formatDate(employee.start_date);

  return (
    <div className="employee-profile-page">
      <button type="button" onClick={() => router.push("/dashboard/employees")} style={backButtonStyle}>
        ← All employees
      </button>

      <header style={headerStyle}>
        <div style={{ flex: "1 1 620px", minWidth: 0 }}>
          <div style={eyebrowStyle}>Employee workspace</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h1 style={employeeNameStyle}>{employee.name}</h1>
            <StatusBadge status={employeeStatus} />
          </div>
          <div style={headerMetaGridStyle}>
            <Info label="Role" value={employee.role || "Not set"} />
            <Info label="Start date" value={startDateLabel} />
            <Info label="Employee reference" value={String(employee.id)} />
            <Info label="Access view" value={platformRole} />
          </div>
        </div>
        <div style={headerActionsStyle}>
          <button type="button" onClick={() => openSection("Employment")} style={secondaryButtonStyle}>View employment</button>
          {hasPermission("Manager") && !isArchived && (
            <button type="button" onClick={() => openSection("Matters")} style={primaryButtonStyle}>Open Matters</button>
          )}
        </div>
      </header>

      {isNewStarter && (
        <Banner title={`Prepare ${employee.name} for employment`} text={`Start date: ${startDateLabel}. Review the employment record and required documents before employment begins.`} />
      )}

      {isArchived && (
        <Banner title="Archived employee" text="This record remains preserved for employment history, audit and authorised review." />
      )}

      <div className="employee-profile-layout">
        <aside style={navigationStyle}>
          <div style={navigationHeadingStyle}>
            <div style={navigationTitleStyle}>Employee record</div>
            <div style={navigationSubtitleStyle}>Select an area to view or update.</div>
          </div>
          <nav style={{ display: "grid", gap: 5 }}>
            {visibleNavigationItems.map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => openSection(item.section)}
                style={activeSection === item.section ? activeNavigationButtonStyle : navigationButtonStyle}
              >
                <span style={navigationButtonTitleStyle}>{item.section}</span>
                <span style={navigationButtonDescriptionStyle}>{item.description}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main style={{ minWidth: 0 }}>
          {activeSection === "Overview" && (
            <div style={sectionStackStyle}>
              <SectionHeading eyebrow="Employee overview" title={`${employee.name} at a glance`} description="Current employment information, compliance position and useful actions from one place." />

              <div style={summaryGridStyle}>
                <SummaryCard label="Employment status" value={employeeStatus} supportingText="Current employee record." />
                <SummaryCard label="Current role" value={employee.role || "Not set"} supportingText="Managed from Employment." />
                <SummaryCard label="Start date" value={startDateLabel} supportingText={employee.start_date ? serviceLength(employee.start_date) : "A start date has not been recorded."} />
                <SummaryCard label="Linked Matters" value="View record" supportingText="Open the Matters tab for connected workplace activity." onClick={hasPermission("Manager") ? () => openSection("Matters") : undefined} />
              </div>

              {hasPermission("Manager") && <ComplianceSummary employeeId={employee.id} />}

              {visibleQuickActions.length > 0 && (
                <Panel title="Quick actions" description="Open the area needed for the next employee action.">
                  <div style={quickActionGridStyle}>
                    {visibleQuickActions.map((action) => (
                      <button key={action.label} type="button" onClick={() => openSection(action.section)} style={quickActionButtonStyle}>
                        <span style={quickActionTitleStyle}>{action.label}</span>
                        <span style={quickActionDescriptionStyle}>{action.description}</span>
                      </button>
                    ))}
                  </div>
                </Panel>
              )}

              <Panel title="Employee record" description="Core information held against this employee.">
                <div style={informationGridStyle}>
                  <Info label="Name" value={employee.name} />
                  <Info label="Email" value={employee.email || "Not set"} />
                  <Info label="Role" value={employee.role || "Not set"} />
                  <Info label="Status" value={employeeStatus} />
                  <Info label="Start date" value={startDateLabel} />
                  <Info label="Employee reference" value={String(employee.id)} />
                </div>
              </Panel>
            </div>
          )}

          {activeSection === "Employment" && <SectionShell eyebrow="Employment" title="Employment details" description="Maintain the employee’s current employment information and status."><EmploymentDetails employeeId={employee.id} initialName={employee.name || ""} initialEmail={employee.email || ""} initialRole={employee.role || ""} initialStatus={employee.status || "Active"} initialStartDate={employee.start_date || ""} /></SectionShell>}
          {activeSection === "Compliance Summary" && <SectionShell eyebrow="Compliance" title="Compliance summary" description="Review the employee’s current checks, evidence and upcoming renewal dates."><ComplianceSummary employeeId={employee.id} /></SectionShell>}
          {activeSection === "Development" && <SectionShell eyebrow="Development" title="Development" description="Manage probation, reviews, one-to-ones, support plans, achievements and recognition."><EmployeeDevelopment employeeId={employee.id} /></SectionShell>}
          {activeSection === "Learning" && <SectionShell eyebrow="Leo Learn" title="Learning" description="Review training records and connected Leo Learn activity."><TrainingLogs employeeId={employee.id} /></SectionShell>}
          {activeSection === "Timeline" && <SectionShell eyebrow="Employee history" title="Timeline" description="A chronological view of meaningful employment activity across the employee lifecycle." action={<button type="button" onClick={() => void buildTimeline()} disabled={timelineLoading} style={secondaryButtonStyle}>{timelineLoading ? "Refreshing..." : "Refresh timeline"}</button>}><EmployeeTimeline events={timelineEvents} loading={timelineLoading} error={timelineError} /></SectionShell>}
          {activeSection === "Documents" && <SectionShell eyebrow="Documents" title="Employee documents" description="Store and review employment, identity, compliance and supporting documents."><EmployeeDocuments employeeId={employee.id} /></SectionShell>}
          {activeSection === "Matters" && <SectionShell eyebrow="Matters" title="Employee Matters" description="Review workplace Matters connected to this employee."><EmployeeMatters employeeId={employee.id} /></SectionShell>}
          {activeSection === "Leave & Absence" && <SectionShell eyebrow="Leave and absence" title="Leave & Absence" description="Record and review leave, sickness absence and related workplace activity."><LeaveAbsence employeeId={employee.id} /></SectionShell>}
          {activeSection === "Warnings" && <SectionShell eyebrow="Warnings" title="Warning history" description="Maintain formal warning records, expiry dates and supporting documentation."><EmployeeWarnings employeeId={employee.id} /></SectionShell>}
          {activeSection === "Right to Work" && <SectionShell eyebrow="Eligibility" title="Right to Work" description="Maintain evidence, review dates and the employee’s current Right to Work position."><RightToWork employeeId={employee.id} /></SectionShell>}
          {activeSection === "DBS / Safeguarding" && <SectionShell eyebrow="Due diligence" title="DBS / Safeguarding" description="Maintain DBS, Update Service and safeguarding-related employment records."><DBSSafeguarding employeeId={employee.id} /></SectionShell>}
          {activeSection === "Driving" && <SectionShell eyebrow="Driving compliance" title="Driving" description="Maintain driving records, evidence and annual DVLA check history."><DrivingChecks employeeId={employee.id} /></SectionShell>}
          {activeSection === "Medical" && <SectionShell eyebrow="Restricted information" title="Medical" description="Maintain authorised employment-related health and occupational information."><EmployeeMedical employeeId={employee.id} /></SectionShell>}
          {activeSection === "Emergency Contacts" && <SectionShell eyebrow="Emergency information" title="Emergency contacts" description="Maintain the employee’s nominated emergency-contact information."><EmergencyContacts employeeId={employee.id} /></SectionShell>}
          {activeSection === "Notes" && <SectionShell eyebrow="Employment notes" title="Notes" description="Record appropriate general employment notes that do not belong within a Matter."><EmployeeNotes employeeId={employee.id} /></SectionShell>}
          {activeSection === "Archive" && (
            <SectionShell eyebrow="Record lifecycle" title={isArchived ? "Archived employee" : "Archive employee"} description={isArchived ? "This employee record remains preserved and can be restored by an authorised user." : "Archiving removes the employee from active use while preserving their complete record."}>
              <Panel title={isArchived ? "Restore employee record" : "Archive employee record"} description={isArchived ? "Restoring will return the employee to the active employee register." : "The employee’s documents, Matters, learning, compliance records and history will remain preserved."}>
                {archiveError && <MessageBox tone="error">{archiveError}</MessageBox>}
                {archiveSuccess && <MessageBox tone="success">{archiveSuccess}</MessageBox>}
                {isArchived ? (
                  <button type="button" onClick={restoreEmployee} disabled={restoring || !hasPermission("Senior")} style={primaryButtonStyle}>{restoring ? "Restoring..." : "Restore employee"}</button>
                ) : (
                  <button type="button" onClick={archiveEmployee} disabled={archiving || !hasPermission("Senior")} style={archiveButtonStyle}>{archiving ? "Archiving..." : "Archive employee"}</button>
                )}
              </Panel>
            </SectionShell>
          )}
        </main>
      </div>

      <style jsx>{`
        .employee-profile-page { width: 100%; max-width: 1440px; }
        .employee-profile-layout { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: 20px; align-items: start; }
        @media (max-width: 980px) { .employee-profile-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

function SectionShell({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return <div style={sectionStackStyle}><SectionHeading eyebrow={eyebrow} title={title} description={description} action={action} />{children}</div>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div style={sectionHeadingStyle}><div><div style={eyebrowStyle}>{eyebrow}</div><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionDescriptionStyle}>{description}</p></div>{action}</div>;
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section style={panelStyle}><div style={{ marginBottom: 16 }}><h3 style={panelTitleStyle}>{title}</h3>{description && <p style={panelDescriptionStyle}>{description}</p>}</div>{children}</section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div style={informationItemStyle}><div style={informationLabelStyle}>{label}</div><div style={informationValueStyle}>{value}</div></div>;
}

function SummaryCard({ label, value, supportingText, onClick }: { label: string; value: string; supportingText: string; onClick?: () => void }) {
  const content = <><div style={summaryCardLabelStyle}>{label}</div><div style={summaryCardValueStyle}>{value}</div><div style={summaryCardSupportingTextStyle}>{supportingText}</div></>;
  return onClick ? <button type="button" onClick={onClick} style={summaryCardButtonStyle}>{content}</button> : <div style={summaryCardStyle}>{content}</div>;
}

function StatusBadge({ status }: { status: string }) {
  return <span style={getStatusBadgeStyle(status)}>{status}</span>;
}

function Banner({ title, text }: { title: string; text: string }) {
  return <section style={bannerStyle}><div><div style={eyebrowStyle}>Employee status</div><h2 style={{ margin: "5px 0 7px", color: "#302638", fontSize: 20 }}>{title}</h2><p style={{ margin: 0, color: "#69616E", fontSize: 14, lineHeight: 1.6 }}>{text}</p></div></section>;
}

function EmployeeTimeline({ events, loading, error }: { events: TimelineEvent[]; loading: boolean; error: string }) {
  if (loading) return <Panel title="Timeline"><div style={emptyStateStyle}>Loading employee history...</div></Panel>;
  if (error) return <Panel title="Timeline"><MessageBox tone="error">{error}</MessageBox></Panel>;
  if (events.length === 0) return <Panel title="Timeline"><div style={emptyStateStyle}>No employee timeline activity has been recorded yet.</div></Panel>;

  return <Panel title="Timeline" description="Events are shown with the most recent activity first."><div style={{ display: "grid", gap: 12 }}>{events.map((event) => <div key={event.id} style={{ borderBottom: "1px solid #EEE8F0", paddingBottom: 12 }}><div style={{ color: "#6E5084", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{event.category}</div><div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><strong>{event.title}</strong><span style={{ color: "#7B737F", fontSize: 12 }}>{formatDateTime(event.date)}</span></div><p style={{ margin: "6px 0", color: "#655E69", fontSize: 13 }}>{event.description}</p><div style={{ color: "#918A95", fontSize: 11 }}>Source: {event.source}</div></div>)}</div></Panel>;
}

function MessageBox({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return <div style={tone === "error" ? errorMessageStyle : successMessageStyle}>{children}</div>;
}

function PageState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return <div style={{ minHeight: 420, display: "grid", placeItems: "center" }}><div style={{ width: "100%", maxWidth: 560, background: "#fff", border: "1px solid #E7E1EA", borderRadius: 16, padding: 28, textAlign: "center" }}><h1>{title}</h1><p>{message}</p>{actionLabel && onAction && <button type="button" onClick={onAction} style={primaryButtonStyle}>{actionLabel}</button>}</div></div>;
}

function normalisePlatformRole(value: unknown): PlatformRole {
  const role = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";
  return "Employee";
}

function normaliseEmployeeStatus(status: string | null): string {
  const value = status?.trim();
  if (!value) return "Active";
  const lower = value.toLowerCase();
  if (lower === "archived") return "Archived";
  if (lower === "new starter") return "New Starter";
  if (lower === "active") return "Active";
  if (lower === "leaving") return "Leaving";
  if (lower === "former employee") return "Former Employee";
  if (lower === "suspended") return "Suspended";
  return value;
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/London" }).format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) return "Date not recorded";
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) return formatDate(value);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(date);
}

function serviceLength(startDate: string): string {
  const start = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(start.getTime())) return "Length of service unavailable.";
  const today = new Date();
  if (start > today) return "Employment has not started yet.";
  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  if (today.getDate() < start.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years > 0 && months > 0) return `${years} year${years === 1 ? "" : "s"}, ${months} month${months === 1 ? "" : "s"} service.`;
  if (years > 0) return `${years} year${years === 1 ? "" : "s"} service.`;
  return `${Math.max(months, 0)} month${months === 1 ? "" : "s"} service.`;
}

function getStatusBadgeStyle(status: string): CSSProperties {
  const shared: CSSProperties = { display: "inline-flex", padding: "5px 11px", borderRadius: 999, fontSize: 12, fontWeight: 800 };
  if (status === "Archived") return { ...shared, background: "#F3F4F6", color: "#4B5563", border: "1px solid #D1D5DB" };
  if (status === "New Starter") return { ...shared, background: "#F7F1FC", color: "#6E5084", border: "1px solid #CDB2E2" };
  return { ...shared, background: "#F5FFF9", color: "#356653", border: "1px solid #CDE7DA" };
}

const backButtonStyle: CSSProperties = { border: "none", background: "transparent", cursor: "pointer", color: "#6B7280", fontWeight: 700, padding: 0, marginBottom: 16 };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, background: "#FFFFFF", border: "1px solid #E7E1EA", borderRadius: 18, padding: 24, marginBottom: 18, boxShadow: "0 8px 24px rgba(73,52,86,.04)" };
const employeeNameStyle: CSSProperties = { margin: "4px 0 0", color: "#241B2B", fontSize: 30, lineHeight: 1.15 };
const eyebrowStyle: CSSProperties = { color: "#6E5084", fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" };
const headerMetaGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 12, marginTop: 20 };
const headerActionsStyle: CSSProperties = { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 10 };
const primaryButtonStyle: CSSProperties = { border: "1px solid #6E5084", background: "#6E5084", color: "#fff", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13 };
const secondaryButtonStyle: CSSProperties = { border: "1px solid #D8CCDE", background: "#fff", color: "#5B4568", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13 };
const archiveButtonStyle: CSSProperties = { ...primaryButtonStyle, background: "#A86573", borderColor: "#A86573" };
const bannerStyle: CSSProperties = { background: "#F7F1FC", border: "1px solid #DCCBE7", borderRadius: 16, padding: 20, marginBottom: 18 };
const navigationStyle: CSSProperties = { position: "sticky", top: 20, background: "#fff", border: "1px solid #E7E1EA", borderRadius: 16, padding: 12, boxShadow: "0 8px 24px rgba(73,52,86,.035)" };
const navigationHeadingStyle: CSSProperties = { padding: "8px 8px 12px", borderBottom: "1px solid #EEE8F0", marginBottom: 8 };
const navigationTitleStyle: CSSProperties = { color: "#2D2433", fontSize: 14, fontWeight: 800 };
const navigationSubtitleStyle: CSSProperties = { color: "#7C7480", fontSize: 12, lineHeight: 1.5, marginTop: 4 };
const navigationButtonStyle: CSSProperties = { width: "100%", textAlign: "left", background: "transparent", border: "1px solid transparent", padding: "10px 11px", borderRadius: 10, cursor: "pointer" };
const activeNavigationButtonStyle: CSSProperties = { ...navigationButtonStyle, background: "#F7F1FC", border: "1px solid #E6D8ED" };
const navigationButtonTitleStyle: CSSProperties = { display: "block", color: "#3A3040", fontWeight: 800, fontSize: 13 };
const navigationButtonDescriptionStyle: CSSProperties = { display: "block", color: "#807885", fontSize: 11, lineHeight: 1.45, marginTop: 3 };
const sectionStackStyle: CSSProperties = { display: "grid", gap: 16 };
const sectionHeadingStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, background: "#fff", border: "1px solid #E7E1EA", borderRadius: 16, padding: 20 };
const sectionTitleStyle: CSSProperties = { margin: "5px 0 6px", color: "#2B2231", fontSize: 23 };
const sectionDescriptionStyle: CSSProperties = { margin: 0, color: "#6F6773", lineHeight: 1.6, fontSize: 14, maxWidth: 760 };
const summaryGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 };
const summaryCardStyle: CSSProperties = { background: "#fff", border: "1px solid #E7E1EA", borderRadius: 14, padding: 17, textAlign: "left" };
const summaryCardButtonStyle: CSSProperties = { ...summaryCardStyle, width: "100%", cursor: "pointer", fontFamily: "inherit" };
const summaryCardLabelStyle: CSSProperties = { color: "#79717E", fontSize: 12, fontWeight: 700 };
const summaryCardValueStyle: CSSProperties = { color: "#6E5084", fontSize: 21, fontWeight: 900, marginTop: 8 };
const summaryCardSupportingTextStyle: CSSProperties = { color: "#746C78", fontSize: 12, lineHeight: 1.5, marginTop: 7 };
const panelStyle: CSSProperties = { background: "#fff", border: "1px solid #E7E1EA", borderRadius: 16, padding: 20, minWidth: 0 };
const panelTitleStyle: CSSProperties = { margin: 0, color: "#2D2433", fontSize: 18 };
const panelDescriptionStyle: CSSProperties = { margin: "6px 0 0", color: "#716A75", fontSize: 13, lineHeight: 1.55 };
const quickActionGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 };
const quickActionButtonStyle: CSSProperties = { display: "block", width: "100%", textAlign: "left", background: "#FBF9FC", border: "1px solid #E9E1ED", borderRadius: 12, padding: 14, cursor: "pointer", fontFamily: "inherit" };
const quickActionTitleStyle: CSSProperties = { display: "block", color: "#5E456C", fontSize: 13, fontWeight: 900 };
const quickActionDescriptionStyle: CSSProperties = { display: "block", color: "#746D78", fontSize: 12, lineHeight: 1.5, marginTop: 5 };
const informationGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 };
const informationItemStyle: CSSProperties = { background: "#FBF9FC", border: "1px solid #EEE8F0", borderRadius: 12, padding: 13 };
const informationLabelStyle: CSSProperties = { color: "#7A727E", fontSize: 12 };
const informationValueStyle: CSSProperties = { color: "#312738", fontWeight: 800, fontSize: 14, marginTop: 5, overflowWrap: "anywhere" };
const emptyStateStyle: CSSProperties = { background: "#FBF9FC", border: "1px dashed #DCCFE3", borderRadius: 12, padding: 22, color: "#746D78", textAlign: "center", fontSize: 13 };
const errorMessageStyle: CSSProperties = { background: "#FBF2F4", color: "#81505B", border: "1px solid #E7CBD1", borderRadius: 10, padding: 12, marginBottom: 13, fontSize: 13 };
const successMessageStyle: CSSProperties = { background: "#F5FFF9", color: "#356653", border: "1px solid #CDE7DA", borderRadius: 10, padding: 12, marginBottom: 13, fontSize: 13 };
