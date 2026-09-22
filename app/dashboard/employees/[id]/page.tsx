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
  department?: string | null;
  location?: string | null;
  manager_name?: string | null;
  employee_reference?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  {
    section: "Overview",
    description: "Current position and connected activity",
    minimumRole: "Employee",
  },
  {
    section: "Employment",
    description: "Employment information and status",
    minimumRole: "Employee",
  },
  {
    section: "Compliance Summary",
    description: "Current checks, records and renewals",
    minimumRole: "Manager",
  },
  {
    section: "Development",
    description: "Probation, reviews and development",
    minimumRole: "Employee",
  },
  {
    section: "Learning",
    description: "Training, learning and qualifications",
    minimumRole: "Employee",
  },
  {
    section: "Timeline",
    description: "Chronological employee history",
    minimumRole: "Manager",
  },
  {
    section: "Documents",
    description: "Employment and supporting documents",
    minimumRole: "Employee",
  },
  {
    section: "Matters",
    description: "Connected workplace Matters",
    minimumRole: "Manager",
  },
  {
    section: "Leave & Absence",
    description: "Leave and absence records",
    minimumRole: "Employee",
  },
  {
    section: "Warnings",
    description: "Formal warning history",
    minimumRole: "Manager",
  },
  {
    section: "Right to Work",
    description: "Eligibility evidence and review dates",
    minimumRole: "Senior",
  },
  {
    section: "DBS / Safeguarding",
    description: "DBS and safeguarding records",
    minimumRole: "Senior",
  },
  {
    section: "Driving",
    description: "Driving records and annual DVLA checks",
    minimumRole: "Manager",
  },
  {
    section: "Medical",
    description: "Restricted employment health records",
    minimumRole: "Senior",
  },
  {
    section: "Emergency Contacts",
    description: "Emergency contact information",
    minimumRole: "Employee",
  },
  {
    section: "Notes",
    description: "General employment notes",
    minimumRole: "Manager",
  },
  {
    section: "Archive",
    description: "Archive or restore the employee record",
    minimumRole: "Senior",
  },
];

const quickActions: QuickAction[] = [
  {
    label: "Update employment",
    section: "Employment",
    description: "Review or update the employee’s employment information.",
    minimumRole: "Senior",
  },
  {
    label: "Open Matter",
    section: "Matters",
    description: "View existing Matters or begin a connected workplace Matter.",
    minimumRole: "Manager",
  },
  {
    label: "Record absence",
    section: "Leave & Absence",
    description: "Open the employee’s leave and absence record.",
    minimumRole: "Manager",
  },
  {
    label: "Schedule review",
    section: "Development",
    description: "Open probation, reviews and one-to-one activity.",
    minimumRole: "Manager",
  },
  {
    label: "Add document",
    section: "Documents",
    description: "Upload or review employee documentation.",
    minimumRole: "Manager",
  },
  {
    label: "View learning",
    section: "Learning",
    description: "Review training, qualifications and development activity.",
    minimumRole: "Manager",
  },
];

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const employeeId = useMemo(() => {
    const parsed = Number(params.id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [params.id]);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("Overview");

  const [platformRole, setPlatformRole] = useState<PlatformRole | null>(null);

  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");

  const hasPermission = useCallback(
    (minimumRole: PlatformRole) =>
      platformRole !== null && roleRank[platformRole] >= roleRank[minimumRole],
    [platformRole]
  );

  const visibleNavigationItems = useMemo(
    () =>
      navigationItems.filter((item) => hasPermission(item.minimumRole)),
    [hasPermission]
  );

  const visibleQuickActions = useMemo(
    () => quickActions.filter((action) => hasPermission(action.minimumRole)),
    [hasPermission]
  );

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
        platformRole?: PlatformRole;
        error?: string;
      };

      if (!response.ok || !result.success || !result.employee) {
        throw new Error(
          result.error ||
            "This employee record could not be loaded. Please return to Employees and try again."
        );
      }

      setEmployee(result.employee);
      if (!result.platformRole) {
        throw new Error("Your organisation role could not be resolved.");
      }
      setPlatformRole(result.platformRole);
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
    void loadEmployee();
  }, [loadEmployee]);

  useEffect(() => {
    const selectedItem = navigationItems.find(
      (item) => item.section === activeSection
    );

    if (
      selectedItem &&
      !hasPermission(selectedItem.minimumRole) &&
      visibleNavigationItems.length > 0
    ) {
      setActiveSection(visibleNavigationItems[0].section);
    }
  }, [
    activeSection,
    hasPermission,
    visibleNavigationItems,
    platformRole,
  ]);

  const buildTimeline = useCallback(async () => {
    if (!employee) return;

    setTimelineLoading(true);
    setTimelineError("");

    try {
      const response = await fetch(
        `/api/employees/${employee.id}?include=timeline`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const result = (await response.json()) as {
        success?: boolean;
        timeline?: TimelineEvent[];
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "The employee timeline could not be loaded."
        );
      }

      setTimelineEvents(result.timeline || []);
    } catch (error) {
      console.error("Employee timeline could not be loaded:", error);
      setTimelineEvents([]);
      setTimelineError(
        error instanceof Error
          ? error.message
          : "The employee timeline could not be loaded."
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
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.employee) {
        throw new Error(
          result.error || "The employee could not be archived. No changes were made."
        );
      }

      setEmployee(result.employee);
      setArchiveSuccess(
        `${employee.name} has been archived. Their employment record remains preserved.`
      );
    } catch (error) {
      console.error("Error archiving employee:", error);
      setArchiveError(
        error instanceof Error
          ? error.message
          : "The employee could not be archived. No changes were made."
      );
    } finally {
      setArchiving(false);
    }
  }

  async function restoreEmployee() {
    if (!employee || restoring) return;

    const confirmed = window.confirm(
      `Restore ${employee.name} to the active employee register?`
    );

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
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.employee) {
        throw new Error(
          result.error || "The employee could not be restored. No changes were made."
        );
      }

      setEmployee(result.employee);
      setArchiveSuccess(
        `${employee.name} has been restored to the active employee register.`
      );
    } catch (error) {
      console.error("Error restoring employee:", error);
      setArchiveError(
        error instanceof Error
          ? error.message
          : "The employee could not be restored. No changes were made."
      );
    } finally {
      setRestoring(false);
    }
  }

  function openSection(section: ProfileSection) {
    const item = navigationItems.find(
      (navigationItem) => navigationItem.section === section
    );

    if (!item || !hasPermission(item.minimumRole)) return;

    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleQuickAction(action: QuickAction) {
    openSection(action.section);
  }

  if (loading) {
    return (
      <PageState
        title="Loading employee"
        message="The employee workspace is being prepared."
      />
    );
  }

  if (loadError || !employee) {
    return (
      <PageState
        title="Employee unavailable"
        message={
          loadError ||
          "The employee record could not be found or you do not have access to it."
        }
        actionLabel="Return to employees"
        onAction={() => router.push("/dashboard/employees")}
      />
    );
  }

  const storedEmployeeStatus = normaliseEmployeeStatus(employee.status);
  const startDateIsFuture = Boolean(
    employee.start_date &&
      new Date(`${employee.start_date}T00:00:00`).getTime() > new Date().setHours(23, 59, 59, 999)
  );
  const employeeStatus =
    storedEmployeeStatus !== "Archived" && startDateIsFuture
      ? "New Starter"
      : storedEmployeeStatus;
  const isArchived = employeeStatus === "Archived";
  const isNewStarter = employeeStatus === "New Starter";
  const startDateLabel = formatDate(employee.start_date);

  return (
    <div className="employee-profile-page">
      <button
        type="button"
        onClick={() => router.push("/dashboard/employees")}
        style={backButtonStyle}
      >
        <span aria-hidden="true">←</span>
        <span>All employees</span>
      </button>

      <header style={headerStyle}>
        <div style={headerIdentityStyle}>
          <div style={headerTitleRowStyle}>
            <div>
              <h1 style={employeeNameStyle}>{employee.name}</h1>
            </div>

            <StatusBadge status={employeeStatus} />
          </div>

          <div style={headerMetaGridStyle}>
            <HeaderMeta
              label="Role"
              value={employee.role || "Not set"}
            />
            <HeaderMeta label="Start date" value={startDateLabel} />
            <HeaderMeta
              label="Employee reference"
              value={String(employee.id)}
            />
            <HeaderMeta label="Your access" value={platformRole || "Resolving"} />
          </div>
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={() => openSection("Employment")}
            style={secondaryButtonStyle}
          >
            View employment
          </button>

          {hasPermission("Manager") && !isArchived && (
            <button
              type="button"
              onClick={() => openSection("Matters")}
              style={primaryButtonStyle}
            >
              Open Matters
            </button>
          )}
        </div>
      </header>

      {isNewStarter && (
        <NewStarterBanner
          employeeName={employee.name}
          startDate={startDateLabel}
          onViewEmployment={() => openSection("Employment")}
          onViewDocuments={() => openSection("Documents")}
        />
      )}

      {isArchived && (
        <ArchivedBanner
          employeeName={employee.name}
          canRestore={hasPermission("Senior")}
          restoring={restoring}
          onRestore={restoreEmployee}
        />
      )}

      <div className="employee-profile-layout">
        <aside style={navigationStyle} aria-label="Employee profile sections">
          <div style={navigationHeadingStyle}>
            <div style={navigationTitleStyle}>Employee record</div>
            <div style={navigationSubtitleStyle}>
              Select an area to view or update.
            </div>
          </div>

          <nav style={navigationListStyle}>
            {visibleNavigationItems.map((item) => {
              const isActive = activeSection === item.section;

              return (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => openSection(item.section)}
                  aria-current={isActive ? "page" : undefined}
                  style={
                    isActive
                      ? activeNavigationButtonStyle
                      : navigationButtonStyle
                  }
                >
                  <span style={navigationButtonTitleStyle}>
                    {item.section}
                  </span>
                  <span style={navigationButtonDescriptionStyle}>
                    {item.description}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main style={mainContentStyle}>
          {activeSection === "Overview" && (
            <div style={sectionStackStyle}>
              <div style={summaryGridStyle}>
                <SummaryCard
                  label="Employment status"
                  value={employeeStatus}
                  supportingText={
                    isArchived
                      ? "The employee record is preserved for history."
                      : isNewStarter
                      ? "Pre-employment or onboarding activity is still underway."
                      : undefined
                  }
                />

                <SummaryCard
                  label="Current role"
                  value={employee.role || "Not set"}
                />

                <SummaryCard
                  label="Start date"
                  value={startDateLabel}
                  supportingText={
                    employee.start_date
                      ? serviceLength(employee.start_date)
                      : "A start date has not been recorded."
                  }
                />

                <SummaryCard
                  label="Linked Matters"
                  value="View record"
                  onClick={
                    hasPermission("Manager")
                      ? () => openSection("Matters")
                      : undefined
                  }
                />
              </div>

              {hasPermission("Manager") && (
                <ComplianceSummary employeeId={employee.id} />
              )}

              <Panel
                title="Quick actions"
                description="Open the area needed for the next employee action."
              >
                <div style={quickActionGridStyle}>
                  {visibleQuickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleQuickAction(action)}
                      style={quickActionButtonStyle}
                    >
                      <span style={quickActionTitleStyle}>
                        {action.label}
                      </span>
                      <span style={quickActionDescriptionStyle}>
                        {action.description}
                      </span>
                    </button>
                  ))}
                </div>
              </Panel>

            </div>
          )}

          {activeSection === "Employment" && (
            <SectionShell              title="Employment details"
              description="Maintain the employee’s current employment information and status."
            >
              <EmploymentDetails
                employeeId={employee.id}
                initialName={employee.name || ""}
                initialEmail={employee.email || ""}
                initialRole={employee.role || ""}
                initialStatus={employee.status || "Active"}
                initialStartDate={employee.start_date || ""}
              />
            </SectionShell>
          )}

          {activeSection === "Compliance Summary" && (
            <SectionShell              title="Compliance summary"
              description="Review the employee’s current checks, evidence and upcoming renewal dates."
            >
              <ComplianceSummary employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Development" && (
            <SectionShell              title="Development"
              description="Manage probation, reviews, one-to-ones, support plans, achievements and recognition."
            >
              <EmployeeDevelopment employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Learning" && (
            <SectionShell              title="Learning"
              description="Review training records now and connected Leo Learn activity as the module develops."
            >
              <TrainingLogs employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Timeline" && (
            <SectionShell              title="Timeline"
              description="A chronological view of meaningful employment activity across the employee lifecycle."
              action={
                <button
                  type="button"
                  onClick={() => void buildTimeline()}
                  disabled={timelineLoading}
                  style={secondaryButtonStyle}
                >
                  {timelineLoading ? "Refreshing..." : "Refresh timeline"}
                </button>
              }
            >
              <EmployeeTimeline
                events={timelineEvents}
                loading={timelineLoading}
                error={timelineError}
              />
            </SectionShell>
          )}
                    {activeSection === "Documents" && (
            <SectionShell              title="Employee documents"
              description="Store and review employment, identity, compliance and supporting documents."
            >
              <EmployeeDocuments employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Matters" && (
            <SectionShell              title="Employee Matters"
              description="Review workplace Matters connected to this employee."
            >
              <EmployeeMatters employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Leave & Absence" && (
            <SectionShell              title="Leave & Absence"
              description="Record and review leave, sickness absence and related workplace activity."
            >
              <LeaveAbsence employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Warnings" && (
            <SectionShell              title="Warning history"
              description="Maintain formal warning records, expiry dates and supporting documentation."
            >
              <EmployeeWarnings employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Right to Work" && (
            <SectionShell              title="Right to Work"
              description="Maintain evidence, review dates and the employee’s current Right to Work position."
            >
              <RightToWork employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "DBS / Safeguarding" && (
  <SectionShell    title="DBS / Safeguarding"
    description="Maintain DBS, Update Service and safeguarding-related employment records."
  >
    <DBSSafeguarding employeeId={employee.id} />
  </SectionShell>
)}

          {activeSection === "Driving" && (
            <SectionShell              title="Driving"
              description="Maintain driving records, evidence and annual DVLA check history."
            >
              <DrivingChecks employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Medical" && (
            <SectionShell              title="Medical"
              description="Maintain authorised employment-related health and occupational information."
            >
              <EmployeeMedical employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Emergency Contacts" && (
            <SectionShell              title="Emergency contacts"
              description="Review and maintain the employee’s emergency contact details."
            >
              <EmergencyContacts employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Notes" && (
            <SectionShell              title="Notes"
              description="Record appropriate general employment notes that do not belong within a Matter."
            >
              <EmployeeNotes employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Archive" && (
            <SectionShell              title={isArchived ? "Archived employee" : "Archive employee"}
              description={
                isArchived
                  ? "This employee record remains preserved and can be restored by an authorised user."
                  : "Archiving removes the employee from active use while preserving their complete record."
              }
            >
              <Panel
                title={
                  isArchived
                    ? "Restore employee record"
                    : "Archive employee record"
                }
                description={
                  isArchived
                    ? "Restoring will return the employee to the active employee register."
                    : "The employee’s documents, Matters, learning, compliance records and history will remain preserved."
                }
              >
                <div style={archiveExplanationStyle}>
                  <ArchiveInformationRow
                    label="Current status"
                    value={employeeStatus}
                  />
                  <ArchiveInformationRow
                    label="Employee"
                    value={employee.name}
                  />
                  <ArchiveInformationRow
                    label="Record preservation"
                    value="Employment history and connected records will be retained."
                  />
                </div>

                {archiveError && (
                  <MessageBox tone="error">{archiveError}</MessageBox>
                )}

                {archiveSuccess && (
                  <MessageBox tone="success">{archiveSuccess}</MessageBox>
                )}

                {isArchived ? (
                  <button
                    type="button"
                    onClick={restoreEmployee}
                    disabled={restoring || !hasPermission("Senior")}
                    style={
                      restoring || !hasPermission("Senior")
                        ? disabledPrimaryButtonStyle
                        : primaryButtonStyle
                    }
                  >
                    {restoring ? "Restoring..." : "Restore employee"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={archiveEmployee}
                    disabled={archiving || !hasPermission("Senior")}
                    style={
                      archiving || !hasPermission("Senior")
                        ? disabledArchiveButtonStyle
                        : archiveButtonStyle
                    }
                  >
                    {archiving ? "Archiving..." : "Archive employee"}
                  </button>
                )}
              </Panel>
            </SectionShell>
          )}
        </main>
      </div>

      <style jsx>{`
        .employee-profile-page {
          width: 100%;
          max-width: 1440px;
        }

        .employee-profile-layout {
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 980px) {
          .employee-profile-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .employee-profile-page {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function SectionShell({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={sectionStackStyle}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={action}
      />

      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div style={sectionHeadingStyle}>
      <div style={sectionHeadingContentStyle}>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <h2 style={sectionTitleStyle}>{title}</h2>
        <p style={sectionDescriptionStyle}>{description}</p>
      </div>

      {action && <div style={sectionHeadingActionStyle}>{action}</div>}
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeadingStyle}>
        <h3 style={panelTitleStyle}>{title}</h3>

        {description && (
          <p style={panelDescriptionStyle}>{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={informationItemStyle}>
      <div style={informationLabelStyle}>{label}</div>
      <div style={informationValueStyle}>{value}</div>
    </div>
  );
}

function HeaderMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={headerMetaItemStyle}>
      <div style={headerMetaLabelStyle}>{label}</div>
      <div style={headerMetaValueStyle}>{value}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  supportingText,
  onClick,
}: {
  label: string;
  value: string;
  supportingText?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div style={summaryCardLabelStyle}>{label}</div>
      <div style={summaryCardValueStyle}>{value}</div>
      {supportingText ? (
        <div style={summaryCardSupportingTextStyle}>{supportingText}</div>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={summaryCardButtonStyle}
      >
        {content}
      </button>
    );
  }

  return <div style={summaryCardStyle}>{content}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const style = getStatusBadgeStyle(status);

  return <span style={style}>{status}</span>;
}

function NewStarterBanner({
  employeeName,
  startDate,
  onViewEmployment,
  onViewDocuments,
}: {
  employeeName: string;
  startDate: string;
  onViewEmployment: () => void;
  onViewDocuments: () => void;
}) {
  return (
    <section style={newStarterBannerStyle}>
      <div>
        <div style={bannerEyebrowStyle}>New starter</div>
        <h2 style={bannerTitleStyle}>
          Prepare {employeeName} for employment
        </h2>
        <p style={bannerDescriptionStyle}>
          Start date: {startDate}. Review the employment record and ensure
          required documents are available before employment begins.
        </p>
      </div>

      <div style={bannerActionsStyle}>
        <button
          type="button"
          onClick={onViewEmployment}
          style={secondaryButtonStyle}
        >
          Review employment
        </button>

        <button
          type="button"
          onClick={onViewDocuments}
          style={primaryButtonStyle}
        >
          View documents
        </button>
      </div>
    </section>
  );
}

function ArchivedBanner({
  employeeName,
  canRestore,
  restoring,
  onRestore,
}: {
  employeeName: string;
  canRestore: boolean;
  restoring: boolean;
  onRestore: () => void;
}) {
  return (
    <section style={archivedBannerStyle}>
      <div>
        <div style={bannerEyebrowStyle}>Archived employee</div>
        <h2 style={bannerTitleStyle}>{employeeName}</h2>
        <p style={bannerDescriptionStyle}>
          This employee is not included in the active employee register.
          Their record remains preserved for employment history, audit and
          authorised review.
        </p>
      </div>

      {canRestore && (
        <button
          type="button"
          onClick={onRestore}
          disabled={restoring}
          style={
            restoring ? disabledPrimaryButtonStyle : primaryButtonStyle
          }
        >
          {restoring ? "Restoring..." : "Restore employee"}
        </button>
      )}
    </section>
  );
}

function EmployeeTimeline({
  events,
  loading,
  error,
}: {
  events: TimelineEvent[];
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <Panel title="Timeline">
        <div style={emptyStateStyle}>Loading employee history...</div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="Timeline">
        <MessageBox tone="error">{error}</MessageBox>
      </Panel>
    );
  }

  if (events.length === 0) {
    return (
      <Panel
        title="Timeline"
        description="Meaningful employee events will appear here as activity is recorded across Leo."
      >
        <div style={emptyStateStyle}>
          No employee timeline activity has been recorded yet.
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Timeline"
      description="Events are shown with the most recent activity first."
    >
      <div style={timelineListStyle}>
        {events.map((event, index) => (
          <div key={event.id} style={timelineItemStyle}>
            <div style={timelineRailStyle}>
              <div style={timelineDotStyle} />

              {index < events.length - 1 && (
                <div style={timelineLineStyle} />
              )}
            </div>

            <div style={timelineContentStyle}>
              <div style={timelineTopRowStyle}>
                <div>
                  <div style={timelineCategoryStyle}>
                    {event.category}
                  </div>
                  <h4 style={timelineTitleStyle}>{event.title}</h4>
                </div>

                <time style={timelineDateStyle}>
                  {formatDateTime(event.date)}
                </time>
              </div>

              <p style={timelineDescriptionStyle}>
                {event.description}
              </p>

              <div style={timelineSourceStyle}>
                Source: {event.source}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ArchiveInformationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={archiveInformationRowStyle}>
      <span style={archiveInformationLabelStyle}>{label}</span>
      <span style={archiveInformationValueStyle}>{value}</span>
    </div>
  );
}

function MessageBox({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={tone === "error" ? errorMessageStyle : successMessageStyle}
    >
      {children}
    </div>
  );
}

function PageState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div style={pageStateOuterStyle}>
      <div style={pageStateCardStyle}>
        <h1 style={pageStateTitleStyle}>{title}</h1>
        <p style={pageStateMessageStyle}>{message}</p>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={primaryButtonStyle}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function normaliseEmployeeStatus(status: string | null): string {
  const value = status?.trim();

  if (!value) return "Active";

  const lowerValue = value.toLowerCase();

  if (lowerValue === "archived") return "Archived";
  if (lowerValue === "new starter") return "New Starter";
  if (lowerValue === "active") return "Active";
  if (lowerValue === "leaving") return "Leaving";
  if (lowerValue === "former employee") return "Former Employee";
  if (lowerValue === "suspended") return "Suspended";

  return value;
}

function formatDate(value: string | null): string {
  if (!value) return "Not set";

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(parsedDate);
}

function formatDateTime(value: string | null): string {
  if (!value) return "Date not recorded";

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    return formatDate(value);
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(parsedDate);
}

function serviceLength(startDate: string): string {
  const match = startDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  let start: Date;

  if (match) {
    const [, year, month, day] = match;

    start = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12,
      0,
      0
    );
  } else {
    start = new Date(startDate);
  }

  if (Number.isNaN(start.getTime())) {
    return "Length of service unavailable.";
  }

  const today = new Date();

  if (start.getTime() > today.getTime()) {
    return "Employment has not started yet.";
  }

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();

  if (today.getDate() < start.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0 && months > 0) {
    return `${years} year${years === 1 ? "" : "s"}, ${months} month${
      months === 1 ? "" : "s"
    } service.`;
  }

  if (years > 0) {
    return `${years} year${years === 1 ? "" : "s"} service.`;
  }

  return `${Math.max(months, 0)} month${
    months === 1 ? "" : "s"
  } service.`;
}

function readString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  return "";
}

function dateValue(value: string | null): number {
  if (!value) return 0;

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12,
      0,
      0
    ).getTime();
  }

  const parsedDate = new Date(value).getTime();

  return Number.isNaN(parsedDate) ? 0 : parsedDate;
}

function inferTimelineCategory(
  record: Record<string, unknown>
): TimelineEvent["category"] {
  const combinedText = [
    readString(record.category),
    readString(record.source_module),
    readString(record.action_title),
    readString(record.action),
    readString(record.event_type),
  ]
    .join(" ")
    .toLowerCase();

  if (
    combinedText.includes("learn") ||
    combinedText.includes("training") ||
    combinedText.includes("qualification") ||
    combinedText.includes("certificate")
  ) {
    return "Learning";
  }

  if (
    combinedText.includes("matter") ||
    combinedText.includes("disciplinary") ||
    combinedText.includes("grievance") ||
    combinedText.includes("investigation")
  ) {
    return "Matter";
  }

  if (
    combinedText.includes("document") ||
    combinedText.includes("file") ||
    combinedText.includes("upload")
  ) {
    return "Document";
  }

  if (
    combinedText.includes("compliance") ||
    combinedText.includes("dbs") ||
    combinedText.includes("right to work") ||
    combinedText.includes("driving") ||
    combinedText.includes("dvla")
  ) {
    return "Compliance";
  }

  if (
    combinedText.includes("development") ||
    combinedText.includes("probation") ||
    combinedText.includes("review") ||
    combinedText.includes("one-to-one")
  ) {
    return "Development";
  }

  if (
    combinedText.includes("employee") ||
    combinedText.includes("employment") ||
    combinedText.includes("role") ||
    combinedText.includes("status")
  ) {
    return "Employment";
  }

  return "System";
}

function removeDuplicateTimelineEvents(
  events: TimelineEvent[]
): TimelineEvent[] {
  const seen = new Set<string>();

  return events.filter((event) => {
    const key = [
      event.date || "",
      event.title.trim().toLowerCase(),
      event.description.trim().toLowerCase(),
    ].join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getStatusBadgeStyle(status: string): CSSProperties {
  const sharedStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "30px",
    padding: "5px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  };

  switch (status) {
    case "New Starter":
      return {
        ...sharedStyle,
        background: "#F7F1FC",
        color: "#6E5084",
        border: "1px solid #CDB2E2",
      };

    case "Archived":
      return {
        ...sharedStyle,
        background: "#F3F4F6",
        color: "#5E456C",
        border: "1px solid #D1D5DB",
      };

    case "Leaving":
      return {
        ...sharedStyle,
        background: "#FFF8E7",
        color: "#7C5A18",
        border: "1px solid #EAD8A5",
      };

    case "Suspended":
      return {
        ...sharedStyle,
        background: "#F8EFF2",
        color: "#76515E",
        border: "1px solid #DEC7CE",
      };

    case "Former Employee":
      return {
        ...sharedStyle,
        background: "#F5F3F7",
        color: "#62576A",
        border: "1px solid #D8D1DD",
      };

    default:
      return {
        ...sharedStyle,
        background: "#F5FFF9",
        color: "#356653",
        border: "1px solid #CDE7DA",
      };
  }
}

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  border: "1px solid #D8CCDE",
  background: "#FFFFFF",
  borderRadius: "10px",
  cursor: "pointer",
  color: "#6E5084",
  fontWeight: 600,
  padding: "9px 13px",
  marginBottom: "16px",
  boxShadow: "0 1px 2px rgba(73, 52, 86, 0.04)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "20px",
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "18px",
  padding: "24px",
  marginBottom: "18px",
  boxShadow: "0 8px 24px rgba(73, 52, 86, 0.04)",
};

const headerIdentityStyle: CSSProperties = {
  flex: "1 1 620px",
  minWidth: 0,
};

const headerTitleRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "14px",
};

const employeeNameStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#6E5084",
  fontSize: "30px",
  lineHeight: 1.15,
};

const eyebrowStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  
};

const headerMetaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
  gap: "12px",
  marginTop: "20px",
};

const headerMetaItemStyle: CSSProperties = {
  padding: "12px",
  borderRadius: "12px",
  background: "#FBF9FC",
  border: "1px solid #EEE8F0",
};

const headerMetaLabelStyle: CSSProperties = {
  color: "#5E456C",
  fontSize: "12px",
  marginBottom: "5px",
};

const headerMetaValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 600,
  overflowWrap: "anywhere",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "10px",
};

const primaryButtonStyle: CSSProperties = {
  border: "1px solid #6E5084",
  background: "#6E5084",
  color: "#FFFFFF",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #D8CCDE",
  background: "#FFFFFF",
  color: "#5B4568",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const disabledPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const archiveButtonStyle: CSSProperties = {
  border: "1px solid #A86573",
  background: "#A86573",
  color: "#FFFFFF",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: "13px",
};

const disabledArchiveButtonStyle: CSSProperties = {
  ...archiveButtonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
};

const newStarterBannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "18px",
  background: "#F7F1FC",
  border: "1px solid #DCCBE7",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "18px",
};

const archivedBannerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "18px",
  background: "#F5F4F6",
  border: "1px solid #DDD8E0",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "18px",
};

const bannerEyebrowStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  
};

const bannerTitleStyle: CSSProperties = {
  margin: "5px 0 7px",
  color: "#6E5084",
  fontSize: "20px",
};

const bannerDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#69616E",
  fontSize: "14px",
  lineHeight: 1.6,
  maxWidth: "760px",
};

const bannerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const navigationStyle: CSSProperties = {
  position: "sticky",
  top: "20px",
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "12px",
  boxShadow: "0 8px 24px rgba(73, 52, 86, 0.035)",
};

const navigationHeadingStyle: CSSProperties = {
  padding: "8px 8px 12px",
  borderBottom: "1px solid #EEE8F0",
  marginBottom: "8px",
};

const navigationTitleStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 600,
};

const navigationSubtitleStyle: CSSProperties = {
  color: "#5E456C",
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: "4px",
};

const navigationListStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
};

const navigationButtonStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "1px solid transparent",
  padding: "10px 11px",
  borderRadius: "10px",
  cursor: "pointer",
};

const activeNavigationButtonStyle: CSSProperties = {
  ...navigationButtonStyle,
  background: "#F7F1FC",
  border: "1px solid #E6D8ED",
};

const navigationButtonTitleStyle: CSSProperties = {
  display: "block",
  color: "#6E5084",
  fontWeight: 600,
  fontSize: "13px",
};

const navigationButtonDescriptionStyle: CSSProperties = {
  display: "block",
  color: "#5E456C",
  fontSize: "11px",
  lineHeight: 1.45,
  marginTop: "3px",
};

const mainContentStyle: CSSProperties = {
  minWidth: 0,
};

const sectionStackStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const sectionHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "14px",
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "20px",
};

const sectionHeadingContentStyle: CSSProperties = {
  flex: "1 1 520px",
  minWidth: 0,
};

const sectionHeadingActionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "5px 0 6px",
  color: "#5E456C",
  fontSize: "23px",
};

const sectionDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#5E456C",
  lineHeight: 1.6,
  fontSize: "14px",
  maxWidth: "760px",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "12px",
};

const summaryCardStyle: CSSProperties = {
  background: "#FFFFFF",
  minHeight: "132px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  border: "1px solid #E7E1EA",
  borderRadius: "14px",
  padding: "17px",
  textAlign: "left",
};

const summaryCardButtonStyle: CSSProperties = {
  ...summaryCardStyle,
  width: "100%",
  cursor: "pointer",
  fontFamily: "inherit",
};

const summaryCardLabelStyle: CSSProperties = {
  color: "#5E456C",
  fontSize: "12px",
  fontWeight: 700,
};

const summaryCardValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "21px",
  fontWeight: 900,
  marginTop: "8px",
};

const summaryCardSupportingTextStyle: CSSProperties = {
  color: "#5E456C",
  marginTop: "auto",
  fontSize: "12px",
  lineHeight: 1.5,
  paddingTop: "7px",
};

const panelStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "20px",
  minWidth: 0,
};

const panelHeadingStyle: CSSProperties = {
  marginBottom: "16px",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "18px",
  fontWeight: 600,
};

const panelDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#5E456C",
  fontSize: "13px",
  lineHeight: 1.55,
};

const quickActionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "10px",
};

const quickActionButtonStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  minHeight: "110px",
  boxSizing: "border-box",
  width: "100%",
  textAlign: "left",
  background: "#FBF9FC",
  border: "1px solid #E9E1ED",
  borderRadius: "12px",
  padding: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const quickActionTitleStyle: CSSProperties = {
  display: "block",
  color: "#5E456C",
  fontSize: "13px",
  fontWeight: 900,
};

const quickActionDescriptionStyle: CSSProperties = {
  display: "block",
  color: "#5E456C",
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: "5px",
};

const informationGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "12px",
};

const informationItemStyle: CSSProperties = {
  background: "#FBF9FC",
  border: "1px solid #EEE8F0",
  borderRadius: "12px",
  padding: "13px",
};

const informationLabelStyle: CSSProperties = {
  color: "#5E456C",
  fontSize: "12px",
};

const informationValueStyle: CSSProperties = {
  color: "#6E5084",
  fontWeight: 600,
  fontSize: "14px",
  marginTop: "5px",
  overflowWrap: "anywhere",
};

const timelineListStyle: CSSProperties = {
  display: "grid",
};

const timelineItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr)",
  gap: "12px",
};

const timelineRailStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const timelineDotStyle: CSSProperties = {
  width: "11px",
  height: "11px",
  borderRadius: "999px",
  background: "#6E5084",
  border: "3px solid #F1E9F5",
  boxSizing: "content-box",
  marginTop: "4px",
  zIndex: 1,
};

const timelineLineStyle: CSSProperties = {
  width: "2px",
  flex: 1,
  minHeight: "68px",
  background: "#E3D8E8",
  marginTop: "3px",
};

const timelineContentStyle: CSSProperties = {
  paddingBottom: "22px",
};

const timelineTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "10px",
};

const timelineCategoryStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "0.06em",
  
};

const timelineTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#6E5084",
  fontSize: "15px",
};

const timelineDateStyle: CSSProperties = {
  color: "#5E456C",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const timelineDescriptionStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#655E69",
  fontSize: "13px",
  lineHeight: 1.55,
};

const timelineSourceStyle: CSSProperties = {
  marginTop: "7px",
  color: "#5E456C",
  fontSize: "11px",
};

const emptyStateStyle: CSSProperties = {
  background: "#FBF9FC",
  border: "1px dashed #DCCFE3",
  borderRadius: "12px",
  padding: "22px",
  color: "#5E456C",
  textAlign: "center",
  fontSize: "13px",
};

const archiveExplanationStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  marginBottom: "16px",
};

const archiveInformationRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(140px, 200px) minmax(0, 1fr)",
  gap: "12px",
  padding: "11px 0",
  borderBottom: "1px solid #EEE8F0",
};

const archiveInformationLabelStyle: CSSProperties = {
  color: "#5E456C",
  fontSize: "12px",
  fontWeight: 700,
};

const archiveInformationValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 700,
};

const errorMessageStyle: CSSProperties = {
  background: "#FBF2F4",
  color: "#81505B",
  border: "1px solid #E7CBD1",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "13px",
  fontSize: "13px",
};

const successMessageStyle: CSSProperties = {
  background: "#F5FFF9",
  color: "#356653",
  border: "1px solid #CDE7DA",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "13px",
  fontSize: "13px",
};

const pageStateOuterStyle: CSSProperties = {
  minHeight: "420px",
  display: "grid",
  placeItems: "center",
};

const pageStateCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  background: "#FFFFFF",
  border: "1px solid #E7E1EA",
  borderRadius: "16px",
  padding: "28px",
  textAlign: "center",
};

const pageStateTitleStyle: CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "24px",
};

const pageStateMessageStyle: CSSProperties = {
  margin: "10px 0 18px",
  color: "#5E456C",
  lineHeight: 1.6,
  fontSize: "14px",
};

