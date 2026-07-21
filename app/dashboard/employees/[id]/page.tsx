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

import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const defaultPlatformRole: PlatformRole = "Owner";

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

  const [platformRole] = useState<PlatformRole>(defaultPlatformRole);

  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");

  const hasPermission = useCallback(
    (minimumRole: PlatformRole) =>
      roleRank[platformRole] >= roleRank[minimumRole],
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

    /*
      The first query uses only the employee columns already confirmed in the
      current live build. This prevents the upgraded page from depending on
      future columns before their coordinated database migration is applied.
    */
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, role, email, status, start_date")
      .eq("id", employeeId)
      .single();

    if (error) {
      console.error("Error loading employee:", error);
      setLoadError(
        "This employee record could not be loaded. Please return to Employees and try again."
      );
      setEmployee(null);
      setLoading(false);
      return;
    }

    setEmployee(data as Employee);
    setLoading(false);
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

    const coreEvents: TimelineEvent[] = [];

    if (employee.start_date) {
      coreEvents.push({
        id: `employment-start-${employee.id}`,
        date: employee.start_date,
        title: "Employment started",
        description: `${employee.name} started employment${
          employee.role ? ` as ${employee.role}` : ""
        }.`,
        category: "Employment",
        source: "Employees",
      });
    }

    try {
      const { data: employeeTimelineData, error: employeeTimelineError } =
        await supabase
          .from("employee_timeline")
          .select(
            "id, event_type, title, description, status, source_module, source_record_id, metadata, event_date, created_at"
          )
          .eq("employee_id", employee.id)
          .order("event_date", { ascending: false })
          .limit(200);

      if (employeeTimelineError) {
        console.warn(
          "Employee timeline records could not be loaded:",
          employeeTimelineError
        );
      } else if (employeeTimelineData) {
        const employeeTimelineEvents: TimelineEvent[] =
          employeeTimelineData.map(
            (
              record: {
                id: number;
                event_type: string | null;
                title: string | null;
                description: string | null;
                status: string | null;
                source_module: string | null;
                source_record_id: string | null;
                metadata: Record<string, unknown> | null;
                event_date: string | null;
                created_at: string | null;
              },
              index: number
            ) => ({
              id: `employee-timeline-${record.id || index}`,
              date: record.event_date || record.created_at,
              title:
                record.title ||
                record.event_type ||
                "Employee activity",
              description:
                record.description ||
                "An event was recorded against this employee.",
              category: inferTimelineCategory({
                category: record.event_type || "",
                source_module: record.source_module || "",
                action_title: record.title || "",
                status: record.status || "",
              }),
              source:
                record.source_module ||
                record.event_type ||
                "Employees",
            })
          );

        coreEvents.push(...employeeTimelineEvents);
      }
    } catch (error) {
      console.warn(
        "Employee timeline records could not be loaded:",
        error
      );
    }

    try {
      const { data: auditData, error: auditError } = await supabase
        .from("audit_logs")
        .select(
          "id, action, action_category, entity_type, entity_id, entity_name, description, metadata, source_page, created_at"
        )
        .eq("entity_type", "Employee")
        .eq("entity_id", String(employee.id))
        .order("created_at", { ascending: false })
        .limit(100);

      if (auditError) {
        console.warn("Audit timeline could not be loaded:", auditError);
      } else if (auditData) {
        const auditEvents: TimelineEvent[] = auditData.map(
          (
            record: {
              id: number;
              action: string | null;
              action_category: string | null;
              entity_type: string | null;
              entity_id: string | null;
              entity_name: string | null;
              description: string | null;
              metadata: Record<string, unknown> | null;
              source_page: string | null;
              created_at: string | null;
            },
            index: number
          ) => ({
            id: `audit-${record.id || index}`,
            date: record.created_at,
            title: record.action || "Employee record updated",
            description:
              record.description ||
              "A recorded action affected this employee.",
            category: inferTimelineCategory({
              category: record.action_category || "",
              action_title: record.action || "",
              entity_type: record.entity_type || "",
              source_page: record.source_page || "",
            }),
            source: "Audit Logs",
          })
        );

        coreEvents.push(...auditEvents);
      }
    } catch (error) {
      console.warn("Audit timeline could not be loaded:", error);
    }

    const uniqueEvents = removeDuplicateTimelineEvents(coreEvents).sort(
      (a, b) => dateValue(b.date) - dateValue(a.date)
    );

    setTimelineEvents(uniqueEvents);
    setTimelineLoading(false);
  }, [employee]);

  useEffect(() => {
    if (activeSection === "Timeline" && employee) {
      void buildTimeline();
    }
  }, [activeSection, employee, buildTimeline]);

  async function writeEmployeeAuditEvent(
    actionTitle: string,
    description: string,
    metadata?: Record<string, unknown>
  ) {
    if (!employee) return;

    try {
      const { error } = await supabase.from("audit_logs").insert({
        employee_id: employee.id,
        action_title: actionTitle,
        description,
        category: "Employee",
        source_module: "Employees",
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Employee audit event was not written:", error);
      }
    } catch (error) {
      console.warn("Employee audit event was not written:", error);
    }
  }

  async function archiveEmployee() {
    if (!employee || archiving) return;

    const confirmed = window.confirm(
      `Archive ${employee.name}?\n\nThe employee will be removed from the active employee list. Their profile, documents, Matters, learning history and audit record will remain preserved.`
    );

    if (!confirmed) return;

    setArchiving(true);
    setArchiveError("");
    setArchiveSuccess("");

    const { error } = await supabase
      .from("employees")
      .update({ status: "Archived" })
      .eq("id", employee.id);

    if (error) {
      console.error("Error archiving employee:", error);
      setArchiveError(
        "The employee could not be archived. No changes were made."
      );
      setArchiving(false);
      return;
    }

    await writeEmployeeAuditEvent(
      "Employee archived",
      `${employee.name} was archived and removed from active use.`,
      {
        previous_status: employee.status || "Active",
        new_status: "Archived",
      }
    );

    setEmployee((current) =>
      current ? { ...current, status: "Archived" } : current
    );
    setArchiveSuccess(
      `${employee.name} has been archived. Their employment record remains preserved.`
    );
    setArchiving(false);
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

    const { error } = await supabase
      .from("employees")
      .update({ status: "Active" })
      .eq("id", employee.id);

    if (error) {
      console.error("Error restoring employee:", error);
      setArchiveError(
        "The employee could not be restored. No changes were made."
      );
      setRestoring(false);
      return;
    }

    await writeEmployeeAuditEvent(
      "Employee restored",
      `${employee.name} was restored to active use.`,
      {
        previous_status: "Archived",
        new_status: "Active",
      }
    );

    setEmployee((current) =>
      current ? { ...current, status: "Active" } : current
    );
    setArchiveSuccess(
      `${employee.name} has been restored to the active employee register.`
    );
    setRestoring(false);
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

  const employeeStatus = normaliseEmployeeStatus(employee.status);
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
              <div style={eyebrowStyle}>Employee workspace</div>
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
            <HeaderMeta label="Access view" value={platformRole} />
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
              <SectionHeading
                eyebrow="Employee overview"
                title={`${employee.name} at a glance`}
                description="Current employment information, compliance position and useful actions from one place."
              />

              <div style={summaryGridStyle}>
                <SummaryCard
                  label="Employment status"
                  value={employeeStatus}
                  supportingText={
                    isArchived
                      ? "The employee record is preserved for history."
                      : isNewStarter
                      ? "Pre-employment or onboarding activity is still underway."
                      : "Current employee record."
                  }
                />

                <SummaryCard
                  label="Current role"
                  value={employee.role || "Not set"}
                  supportingText="Managed from Employment."
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
                  supportingText="Open the Matters tab for connected workplace activity."
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

              <Panel
                title="Employee record"
                description="Core information held against this employee."
              >
                <div style={informationGridStyle}>
                  <Info label="Name" value={employee.name} />
                  <Info
                    label="Email"
                    value={employee.email || "Not set"}
                  />
                  <Info
                    label="Role"
                    value={employee.role || "Not set"}
                  />
                  <Info label="Status" value={employeeStatus} />
                  <Info label="Start date" value={startDateLabel} />
                  <Info
                    label="Employee reference"
                    value={String(employee.id)}
                  />
                </div>
              </Panel>
            </div>
          )}

          {activeSection === "Employment" && (
            <SectionShell
              eyebrow="Employment"
              title="Employment details"
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
            <SectionShell
              eyebrow="Compliance"
              title="Compliance summary"
              description="Review the employee’s current checks, evidence and upcoming renewal dates."
            >
              <ComplianceSummary employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Development" && (
            <SectionShell
              eyebrow="Development"
              title="Development"
              description="Manage probation, reviews, one-to-ones, support plans, achievements and recognition."
            >
              <EmployeeDevelopment employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Learning" && (
            <SectionShell
              eyebrow="Leo Learn"
              title="Learning"
              description="Review training records now and connected Leo Learn activity as the module develops."
            >
              <TrainingLogs employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Timeline" && (
            <SectionShell
              eyebrow="Employee history"
              title="Timeline"
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
            <SectionShell
              eyebrow="Documents"
              title="Employee documents"
              description="Store and review employment, identity, compliance and supporting documents."
            >
              <EmployeeDocuments employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Matters" && (
            <SectionShell
              eyebrow="Matters"
              title="Employee Matters"
              description="Review workplace Matters connected to this employee."
            >
              <EmployeeMatters employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Leave & Absence" && (
            <SectionShell
              eyebrow="Leave and absence"
              title="Leave & Absence"
              description="Record and review leave, sickness absence and related workplace activity."
            >
              <LeaveAbsence employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Warnings" && (
            <SectionShell
              eyebrow="Warnings"
              title="Warning history"
              description="Maintain formal warning records, expiry dates and supporting documentation."
            >
              <EmployeeWarnings employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Right to Work" && (
            <SectionShell
              eyebrow="Eligibility"
              title="Right to Work"
              description="Maintain evidence, review dates and the employee’s current Right to Work position."
            >
              <RightToWork employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "DBS / Safeguarding" && (
  <SectionShell
    eyebrow="Due diligence"
    title="DBS / Safeguarding"
    description="Maintain DBS, Update Service and safeguarding-related employment records."
  >
    <DBSSafeguarding employeeId={employee.id} />
  </SectionShell>
)}

          {activeSection === "Driving" && (
            <SectionShell
              eyebrow="Driving compliance"
              title="Driving"
              description="Maintain driving records, evidence and annual DVLA check history."
            >
              <DrivingChecks employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Medical" && (
            <SectionShell
              eyebrow="Restricted information"
              title="Medical"
              description="Maintain authorised employment-related health and occupational information."
            >
              <EmployeeMedical employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Emergency Contacts" && (
            <SectionShell
              eyebrow="Emergency information"
              title="Emergency contacts"
              description="Maintain the employee’s nominated emergency-contact information."
            >
              <EmergencyContacts employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Notes" && (
            <SectionShell
              eyebrow="Employment notes"
              title="Notes"
              description="Record appropriate general employment notes that do not belong within a Matter."
            >
              <EmployeeNotes employeeId={employee.id} />
            </SectionShell>
          )}

          {activeSection === "Archive" && (
            <SectionShell
              eyebrow="Record lifecycle"
              title={isArchived ? "Archived employee" : "Archive employee"}
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
  supportingText: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div style={summaryCardLabelStyle}>{label}</div>
      <div style={summaryCardValueStyle}>{value}</div>
      <div style={summaryCardSupportingTextStyle}>{supportingText}</div>
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
        color: "#4B5563",
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
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#6B7280",
  fontWeight: 700,
  padding: "0",
  marginBottom: "16px",
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
  color: "#241B2B",
  fontSize: "30px",
  lineHeight: 1.15,
};

const eyebrowStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
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
  color: "#77707B",
  fontSize: "12px",
  marginBottom: "5px",
};

const headerMetaValueStyle: CSSProperties = {
  color: "#2F2636",
  fontSize: "14px",
  fontWeight: 800,
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
  textTransform: "uppercase",
};

const bannerTitleStyle: CSSProperties = {
  margin: "5px 0 7px",
  color: "#302638",
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
  color: "#2D2433",
  fontSize: "14px",
  fontWeight: 800,
};

const navigationSubtitleStyle: CSSProperties = {
  color: "#7C7480",
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
  color: "#3A3040",
  fontWeight: 800,
  fontSize: "13px",
};

const navigationButtonDescriptionStyle: CSSProperties = {
  display: "block",
  color: "#807885",
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
  color: "#2B2231",
  fontSize: "23px",
};

const sectionDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#6F6773",
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
  color: "#79717E",
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
  color: "#746C78",
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: "7px",
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
  color: "#2D2433",
  fontSize: "18px",
};

const panelDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#716A75",
  fontSize: "13px",
  lineHeight: 1.55,
};

const quickActionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "10px",
};

const quickActionButtonStyle: CSSProperties = {
  display: "block",
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
  color: "#746D78",
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
  color: "#7A727E",
  fontSize: "12px",
};

const informationValueStyle: CSSProperties = {
  color: "#312738",
  fontWeight: 800,
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
  textTransform: "uppercase",
};

const timelineTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#312738",
  fontSize: "15px",
};

const timelineDateStyle: CSSProperties = {
  color: "#7B737F",
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
  color: "#918A95",
  fontSize: "11px",
};

const emptyStateStyle: CSSProperties = {
  background: "#FBF9FC",
  border: "1px dashed #DCCFE3",
  borderRadius: "12px",
  padding: "22px",
  color: "#746D78",
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
  color: "#7A727E",
  fontSize: "12px",
  fontWeight: 700,
};

const archiveInformationValueStyle: CSSProperties = {
  color: "#352B3B",
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
  color: "#302638",
  fontSize: "24px",
};

const pageStateMessageStyle: CSSProperties = {
  margin: "10px 0 18px",
  color: "#716A75",
  lineHeight: 1.6,
  fontSize: "14px",
};