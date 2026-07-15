"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  learningModuleId: number;
  assignmentEligible: boolean;
};

type Employee = {
  id: number;
  name: string;
  role: string | null;
  status: string | null;
};

type LearningAssignment = {
  id: number;
  learning_module_id: number;
  employee_id: number;
  assigned_date: string;
  due_date: string | null;
  status: string;
  progress_percent: number;
  started_at: string | null;
  completed_date: string | null;
  manager_notes: string | null;
  created_at: string;
  updated_at: string;
};

const assignmentStatuses = [
  "Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
];

export default function LearningAssignments({
  learningModuleId,
  assignmentEligible,
}: Props) {
  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [assignments, setAssignments] = useState<
    LearningAssignment[]
  >([]);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  const [dueDate, setDueDate] = useState("");

  const [managerNotes, setManagerNotes] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] =
    useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadAssignments();
  }, [learningModuleId]);

  async function loadAssignments() {
    setLoading(true);
    setErrorMessage("");

    const [
      employeeResult,
      assignmentResult,
    ] = await Promise.all([
      supabase
        .from("employees")
        .select(
          `
          id,
          name,
          role,
          status
          `
        )
        .neq("status", "Archived")
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("learning_assignments")
        .select(
          `
          id,
          learning_module_id,
          employee_id,
          assigned_date,
          due_date,
          status,
          progress_percent,
          started_at,
          completed_date,
          manager_notes,
          created_at,
          updated_at
          `
        )
        .eq(
          "learning_module_id",
          learningModuleId
        )
        .eq("is_archived", false)
        .order("assigned_date", {
          ascending: false,
        }),
    ]);

    if (employeeResult.error) {
      console.error(
        "Error loading employees:",
        employeeResult.error
      );

      setErrorMessage(
        "Employees could not be loaded."
      );

      setLoading(false);
      return;
    }

    if (assignmentResult.error) {
      console.error(
        "Error loading learning assignments:",
        assignmentResult.error
      );

      setErrorMessage(
        "Learning assignments could not be loaded."
      );

      setLoading(false);
      return;
    }

    setEmployees(
      (employeeResult.data || []) as Employee[]
    );

    setAssignments(
      (assignmentResult.data ||
        []) as LearningAssignment[]
    );

    setLoading(false);
  }

  const employeeMap = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.id,
        employee,
      ])
    );
  }, [employees]);

  const assignedEmployeeIds = useMemo(() => {
    return new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.status !== "Cancelled"
        )
        .map(
          (assignment) =>
            assignment.employee_id
        )
    );
  }, [assignments]);

  const availableEmployees =
    employees.filter(
      (employee) =>
        !assignedEmployeeIds.has(employee.id)
    );

  async function assignLearning() {
    if (!selectedEmployeeId) {
      setErrorMessage(
        "Select an employee."
      );
      return;
    }

    setAssigning(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("learning_assignments")
      .insert({
        learning_module_id:
          learningModuleId,
        employee_id: Number(
          selectedEmployeeId
        ),
        assigned_date: getTodayDate(),
        due_date: dueDate || null,
        status: "Assigned",
        progress_percent: 0,
        manager_notes:
          managerNotes.trim() || null,
      });

    if (error) {
      console.error(
        "Error assigning learning:",
        error
      );

      setErrorMessage(
        error.code === "23505"
          ? "This learning is already actively assigned to that employee."
          : "The learning could not be assigned."
      );

      setAssigning(false);
      return;
    }

    setSelectedEmployeeId("");
    setDueDate("");
    setManagerNotes("");

    setMessage("Learning assigned.");

    setAssigning(false);

    await loadAssignments();
  }

  async function updateAssignmentStatus(
    assignment: LearningAssignment,
    nextStatus: string
  ) {
    setMessage("");
    setErrorMessage("");

    const now =
      new Date().toISOString();

    const updateData = {
      status: nextStatus,
      progress_percent:
        nextStatus === "Completed"
          ? 100
          : nextStatus === "In Progress"
            ? Math.max(
                assignment.progress_percent,
                1
              )
            : nextStatus === "Assigned"
              ? 0
              : assignment.progress_percent,
      started_at:
        nextStatus === "In Progress" &&
        !assignment.started_at
          ? now
          : assignment.started_at,
      completed_date:
        nextStatus === "Completed"
          ? getTodayDate()
          : null,
    };

    const { error } = await supabase
      .from("learning_assignments")
      .update(updateData)
      .eq("id", assignment.id);

    if (error) {
      console.error(
        "Error updating assignment status:",
        error
      );

      setErrorMessage(
        "The assignment status could not be updated."
      );

      return;
    }

    setMessage(
      "Assignment status updated."
    );

    await loadAssignments();
  }

  async function updateProgress(
    assignment: LearningAssignment,
    nextProgress: number
  ) {
    const safeProgress = Math.min(
      100,
      Math.max(0, nextProgress)
    );

    const completed =
      safeProgress === 100;

    const { error } = await supabase
      .from("learning_assignments")
      .update({
        progress_percent: safeProgress,
        status: completed
          ? "Completed"
          : safeProgress > 0
            ? "In Progress"
            : "Assigned",
        started_at:
          safeProgress > 0 &&
          !assignment.started_at
            ? new Date().toISOString()
            : assignment.started_at,
        completed_date: completed
          ? getTodayDate()
          : null,
      })
      .eq("id", assignment.id);

    if (error) {
      console.error(
        "Error updating assignment progress:",
        error
      );

      setErrorMessage(
        "The learning progress could not be updated."
      );

      return;
    }

    await loadAssignments();
  }

  async function updateManagerNotes(
    assignmentId: number,
    notes: string
  ) {
    const { error } = await supabase
      .from("learning_assignments")
      .update({
        manager_notes:
          notes.trim() || null,
      })
      .eq("id", assignmentId);

    if (error) {
      console.error(
        "Error updating manager notes:",
        error
      );

      setErrorMessage(
        "The manager notes could not be updated."
      );

      return;
    }

    setMessage("Manager notes updated.");

    await loadAssignments();
  }

  async function archiveAssignment(
    assignment: LearningAssignment
  ) {
    const employee =
      employeeMap.get(
        assignment.employee_id
      );

    const confirmed = window.confirm(
      `Archive this learning assignment for ${
        employee?.name || "the employee"
      }?\n\nThe assignment history will remain preserved.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("learning_assignments")
      .update({
        is_archived: true,
        archived_at:
          new Date().toISOString(),
      })
      .eq("id", assignment.id);

    if (error) {
      console.error(
        "Error archiving assignment:",
        error
      );

      setErrorMessage(
        "The learning assignment could not be archived."
      );

      return;
    }

    setMessage(
      "Learning assignment archived."
    );

    await loadAssignments();
  }

  const activeCount =
    assignments.filter(
      (assignment) =>
        assignment.status === "Assigned" ||
        assignment.status ===
          "In Progress"
    ).length;

  const completedCount =
    assignments.filter(
      (assignment) =>
        assignment.status === "Completed"
    ).length;

  const overdueCount =
    assignments.filter(
      (assignment) =>
        Boolean(assignment.due_date) &&
        assignment.due_date! <
          getTodayDate() &&
        assignment.status !==
          "Completed" &&
        assignment.status !==
          "Cancelled"
    ).length;

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>
            Assignments
          </h3>

          <p style={descriptionStyle}>
            Assign this learning to employees and
            monitor progress, completion and due
            dates.
          </p>
        </div>
      </div>

      {!assignmentEligible && (
        <div style={noticeStyle}>
          This learning resource is not currently
          available for assignment. It can be
          enabled from the Overview workspace.
        </div>
      )}

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}

      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Active Assignments"
          value={String(activeCount)}
        />

        <SummaryCard
          label="Completed"
          value={String(completedCount)}
        />

        <SummaryCard
          label="Past Due"
          value={String(overdueCount)}
        />

        <SummaryCard
          label="Total Assignment History"
          value={String(assignments.length)}
        />
      </div>

      <div style={assignPanelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <h4 style={panelTitleStyle}>
              Assign Learning
            </h4>

            <p style={panelDescriptionStyle}>
              Select an employee and add an
              appropriate completion date.
            </p>
          </div>
        </div>

        <div style={formGridStyle}>
          <FormField label="Employee">
            <select
              value={selectedEmployeeId}
              onChange={(event) =>
                setSelectedEmployeeId(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="">
                Select an employee
              </option>

              {availableEmployees.map(
                (employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                    {employee.role
                      ? ` · ${employee.role}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </FormField>

          <FormField label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </FormField>
        </div>

        <FormField label="Manager notes">
          <textarea
            value={managerNotes}
            onChange={(event) =>
              setManagerNotes(
                event.target.value
              )
            }
            placeholder="Optional context or expectations for this assignment."
            style={textareaStyle}
          />
        </FormField>

        <div style={assignActionsStyle}>
          <button
            type="button"
            onClick={() =>
              void assignLearning()
            }
            disabled={
              assigning ||
              !assignmentEligible
            }
            style={{
              ...primaryButtonStyle,
              opacity:
                !assignmentEligible ||
                assigning
                  ? 0.65
                  : 1,
            }}
          >
            {assigning
              ? "Assigning..."
              : "Assign Learning"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>
          Loading learning assignments...
        </div>
      ) : assignments.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>✦</div>

          <h4 style={emptyTitleStyle}>
            No assignments yet
          </h4>

          <p style={emptyDescriptionStyle}>
            Assign this learning to an employee
            when it is ready to be completed.
          </p>
        </div>
      ) : (
        <div style={assignmentListStyle}>
          {assignments.map(
            (assignment) => {
              const employee =
                employeeMap.get(
                  assignment.employee_id
                );

              const isOverdue =
                Boolean(
                  assignment.due_date
                ) &&
                assignment.due_date! <
                  getTodayDate() &&
                assignment.status !==
                  "Completed" &&
                assignment.status !==
                  "Cancelled";

              return (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  employeeName={
                    employee?.name ||
                    `Employee ${assignment.employee_id}`
                  }
                  employeeRole={
                    employee?.role || null
                  }
                  isOverdue={isOverdue}
                  onStatusChange={(
                    nextStatus
                  ) =>
                    void updateAssignmentStatus(
                      assignment,
                      nextStatus
                    )
                  }
                  onProgressChange={(
                    nextProgress
                  ) =>
                    void updateProgress(
                      assignment,
                      nextProgress
                    )
                  }
                  onNotesSave={(notes) =>
                    void updateManagerNotes(
                      assignment.id,
                      notes
                    )
                  }
                  onArchive={() =>
                    void archiveAssignment(
                      assignment
                    )
                  }
                />
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  employeeName,
  employeeRole,
  isOverdue,
  onStatusChange,
  onProgressChange,
  onNotesSave,
  onArchive,
}: {
  assignment: LearningAssignment;
  employeeName: string;
  employeeRole: string | null;
  isOverdue: boolean;
  onStatusChange: (
    status: string
  ) => void;
  onProgressChange: (
    progress: number
  ) => void;
  onNotesSave: (notes: string) => void;
  onArchive: () => void;
}) {
  const [notes, setNotes] = useState(
    assignment.manager_notes || ""
  );

  return (
    <div style={assignmentCardStyle}>
      <div style={assignmentHeaderStyle}>
        <div>
          <h4 style={employeeNameStyle}>
            {employeeName}
          </h4>

          <div style={employeeMetaStyle}>
            {employeeRole ||
              "Role not recorded"}
            {" · "}
            Assigned{" "}
            {formatDate(
              assignment.assigned_date
            )}
          </div>
        </div>

        <div
          style={
            isOverdue
              ? overdueStatusStyle
              : assignmentStatusStyle
          }
        >
          {isOverdue
            ? "Past Due"
            : assignment.status}
        </div>
      </div>

      <div style={detailsGridStyle}>
        <DetailItem
          label="Due Date"
          value={
            assignment.due_date
              ? formatDate(
                  assignment.due_date
                )
              : "Not set"
          }
        />

        <DetailItem
          label="Started"
          value={
            assignment.started_at
              ? new Date(
                  assignment.started_at
                ).toLocaleDateString(
                  "en-GB"
                )
              : "Not started"
          }
        />

        <DetailItem
          label="Completed"
          value={
            assignment.completed_date
              ? formatDate(
                  assignment.completed_date
                )
              : "Not completed"
          }
        />

        <DetailItem
          label="Progress"
          value={`${assignment.progress_percent}%`}
        />
      </div>

      <div style={progressTrackStyle}>
        <div
          style={{
            ...progressBarStyle,
            width: `${assignment.progress_percent}%`,
          }}
        />
      </div>

      <div style={controlGridStyle}>
        <FormField label="Status">
          <select
            value={assignment.status}
            onChange={(event) =>
              onStatusChange(
                event.target.value
              )
            }
            style={inputStyle}
          >
            {assignmentStatuses.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              )
            )}
          </select>
        </FormField>

        <FormField label="Progress">
          <input
            type="number"
            min="0"
            max="100"
            value={
              assignment.progress_percent
            }
            onChange={(event) =>
              onProgressChange(
                Number(
                  event.target.value
                )
              )
            }
            style={inputStyle}
          />
        </FormField>
      </div>

      <FormField label="Manager notes">
        <textarea
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          style={notesTextareaStyle}
        />
      </FormField>

      <div style={cardActionsStyle}>
        <button
          type="button"
          onClick={() =>
            onNotesSave(notes)
          }
          style={secondaryButtonStyle}
        >
          Save Notes
        </button>

        <button
          type="button"
          onClick={onArchive}
          style={archiveButtonStyle}
        >
          Archive Assignment
        </button>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryValueStyle}>
        {value}
      </div>

      <div style={summaryLabelStyle}>
        {label}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div style={detailValueStyle}>
        {value}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={formFieldStyle}>
      <label style={labelStyle}>
        {label}
      </label>

      {children}
    </div>
  );
}

function getTodayDate(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(
  value: string
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(`${value}T12:00:00`)
  );
}

const headerStyle: React.CSSProperties = {
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const descriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
};

const noticeStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "15px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  fontSize: "14px",
  lineHeight: 1.5,
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "10px",
  marginBottom: "16px",
};

const summaryCardStyle: React.CSSProperties = {
  padding: "14px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "12px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  fontWeight: 800,
};

const summaryLabelStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "12px",
};

const assignPanelStyle: React.CSSProperties = {
  padding: "17px",
  marginBottom: "18px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "13px",
};

const panelHeaderStyle: React.CSSProperties = {
  marginBottom: "2px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const panelDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  background: "#FFFFFF",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "90px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const notesTextareaStyle: React.CSSProperties = {
  ...textareaStyle,
  minHeight: "75px",
};

const assignActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "15px",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "9px",
  padding: "8px 11px",
  fontWeight: 700,
  cursor: "pointer",
};

const archiveButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  padding: "8px 11px",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "30px 20px",
  border: "1px dashed #D1D5DB",
  borderRadius: "13px",
  background: "#F9FAFB",
  color: "#6B7280",
  textAlign: "center",
};

const emptyIconStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  marginBottom: "8px",
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const emptyDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  fontSize: "14px",
};

const assignmentListStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const assignmentCardStyle: React.CSSProperties = {
  padding: "16px",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  background: "#FFFFFF",
};

const assignmentHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const employeeNameStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const employeeMetaStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6B7280",
  fontSize: "12px",
};

const assignmentStatusStyle: React.CSSProperties = {
  padding: "5px 9px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const overdueStatusStyle: React.CSSProperties = {
  ...assignmentStatusStyle,
  background: "#FFF7ED",
  color: "#9A3412",
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "12px",
  marginTop: "15px",
};

const detailLabelStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "11px",
};

const detailValueStyle: React.CSSProperties = {
  marginTop: "3px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const progressTrackStyle: React.CSSProperties = {
  height: "8px",
  marginTop: "14px",
  overflow: "hidden",
  background: "#F3F4F6",
  borderRadius: "999px",
};

const progressBarStyle: React.CSSProperties = {
  height: "100%",
  background: "#6E5084",
  borderRadius: "999px",
};

const controlGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
};

const cardActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "14px",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};