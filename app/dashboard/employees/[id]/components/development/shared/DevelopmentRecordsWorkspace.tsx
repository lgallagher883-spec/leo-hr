"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RecordType =
  | "Review"
  | "One-to-One"
  | "Support Plan"
  | "Achievement"
  | "Milestone"
  | "Recognition";

type Props = {
  employeeId: number;
  recordType: RecordType;
  title: string;
  description: string;
};

type DevelopmentRecord = {
  id: number;
  employee_id: number;
  record_type: RecordType;
  title: string;
  record_date: string;
  manager_name: string | null;
  attendees: string | null;
  summary: string | null;
  employee_comments: string | null;
  manager_comments: string | null;
  agreed_actions: string | null;
  support_required: string | null;
  next_review_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function DevelopmentRecordsWorkspace({
  employeeId,
  recordType,
  title,
  description,
}: Props) {
  const [records, setRecords] = useState<DevelopmentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<DevelopmentRecord | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [recordTitle, setRecordTitle] = useState("");
  const [recordDate, setRecordDate] = useState(
    getTodayDate()
  );
  const [managerName, setManagerName] = useState("");
  const [attendees, setAttendees] = useState("");
  const [summary, setSummary] = useState("");
  const [employeeComments, setEmployeeComments] =
    useState("");
  const [managerComments, setManagerComments] =
    useState("");
  const [agreedActions, setAgreedActions] = useState("");
  const [supportRequired, setSupportRequired] =
    useState("");
  const [nextReviewDate, setNextReviewDate] =
    useState("");
  const [status, setStatus] = useState(
    recordType === "Support Plan"
      ? "Active"
      : "Completed"
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadRecords();
  }, [employeeId, recordType]);

  async function loadRecords() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("employee_development_records")
      .select(
        `
        id,
        employee_id,
        record_type,
        title,
        record_date,
        manager_name,
        attendees,
        summary,
        employee_comments,
        manager_comments,
        agreed_actions,
        support_required,
        next_review_date,
        status,
        created_at,
        updated_at
        `
      )
      .eq("employee_id", employeeId)
      .eq("record_type", recordType)
      .eq("is_archived", false)
      .order("record_date", { ascending: false });

    if (error) {
      console.error(
        "Error loading development records:",
        error
      );
      setErrorMessage(
        `${title} records could not be loaded.`
      );
      setLoading(false);
      return;
    }

    setRecords((data || []) as DevelopmentRecord[]);
    setLoading(false);
  }

  function resetForm() {
    setSelectedRecord(null);
    setRecordTitle("");
    setRecordDate(getTodayDate());
    setManagerName("");
    setAttendees("");
    setSummary("");
    setEmployeeComments("");
    setManagerComments("");
    setAgreedActions("");
    setSupportRequired("");
    setNextReviewDate("");
    setStatus(
      recordType === "Support Plan"
        ? "Active"
        : "Completed"
    );
    setErrorMessage("");
  }

  function openNewRecord() {
    resetForm();
    setShowForm(true);
  }

  function openExistingRecord(record: DevelopmentRecord) {
    setSelectedRecord(record);
    setRecordTitle(record.title);
    setRecordDate(record.record_date);
    setManagerName(record.manager_name || "");
    setAttendees(record.attendees || "");
    setSummary(record.summary || "");
    setEmployeeComments(
      record.employee_comments || ""
    );
    setManagerComments(
      record.manager_comments || ""
    );
    setAgreedActions(record.agreed_actions || "");
    setSupportRequired(record.support_required || "");
    setNextReviewDate(record.next_review_date || "");
    setStatus(record.status);
    setMessage("");
    setErrorMessage("");
    setShowForm(true);
  }

  async function saveRecord() {
    if (!recordTitle.trim()) {
      setErrorMessage("Enter a title.");
      return;
    }

    if (!recordDate) {
      setErrorMessage("Enter the record date.");
      return;
    }

    if (!summary.trim()) {
      setErrorMessage("Enter a brief summary.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const recordData = {
      employee_id: employeeId,
      record_type: recordType,
      title: recordTitle.trim(),
      record_date: recordDate,
      manager_name: managerName.trim() || null,
      attendees: attendees.trim() || null,
      summary: summary.trim(),
      employee_comments:
        employeeComments.trim() || null,
      manager_comments:
        managerComments.trim() || null,
      agreed_actions: agreedActions.trim() || null,
      support_required:
        supportRequired.trim() || null,
      next_review_date: nextReviewDate || null,
      status,
      updated_at: new Date().toISOString(),
    };

    if (selectedRecord) {
      const { error } = await supabase
        .from("employee_development_records")
        .update(recordData)
        .eq("id", selectedRecord.id);

      if (error) {
        console.error(
          "Error updating development record:",
          error
        );
        setErrorMessage(
          "The record could not be updated."
        );
        setSaving(false);
        return;
      }

      setMessage("Record updated.");
    } else {
      const { error } = await supabase
        .from("employee_development_records")
        .insert(recordData);

      if (error) {
        console.error(
          "Error creating development record:",
          error
        );
        setErrorMessage(
          "The record could not be created."
        );
        setSaving(false);
        return;
      }

      setMessage("Record created.");
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
    await loadRecords();
  }

  async function archiveRecord(recordId: number) {
    const confirmed = window.confirm(
      "Archive this record? It will remain preserved in the database."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("employee_development_records")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        status: "Archived",
      })
      .eq("id", recordId);

    if (error) {
      console.error(
        "Error archiving development record:",
        error
      );
      setErrorMessage(
        "The record could not be archived."
      );
      return;
    }

    setMessage("Record archived.");
    setShowForm(false);
    resetForm();
    await loadRecords();
  }

  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h3 style={workspaceTitleStyle}>{title}</h3>

          <p style={workspaceDescriptionStyle}>
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={openNewRecord}
          style={primaryButtonStyle}
        >
          {getCreateButtonLabel(recordType)}
        </button>
      </div>

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      {message && (
        <div style={messageStyle}>{message}</div>
      )}

      {showForm && (
        <div style={formPanelStyle}>
          <div style={formHeaderStyle}>
            <h4 style={formTitleStyle}>
              {selectedRecord
                ? `Edit ${getSingularLabel(recordType)}`
                : getCreateButtonLabel(recordType)}
            </h4>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              style={closeButtonStyle}
            >
              Close
            </button>
          </div>

          <div style={formGridStyle}>
            <FormField label="Title">
              <input
                type="text"
                value={recordTitle}
                onChange={(event) =>
                  setRecordTitle(event.target.value)
                }
                placeholder={getTitlePlaceholder(
                  recordType
                )}
                style={inputStyle}
              />
            </FormField>

            <FormField label={getDateLabel(recordType)}>
              <input
                type="date"
                value={recordDate}
                onChange={(event) =>
                  setRecordDate(event.target.value)
                }
                style={inputStyle}
              />
            </FormField>
          </div>

          {showManagerFields(recordType) && (
            <div style={formGridStyle}>
              <FormField label="Manager">
                <input
                  type="text"
                  value={managerName}
                  onChange={(event) =>
                    setManagerName(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Attendees">
                <input
                  type="text"
                  value={attendees}
                  onChange={(event) =>
                    setAttendees(event.target.value)
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>
          )}

          <FormField label={getSummaryLabel(recordType)}>
            <textarea
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              placeholder={getSummaryPlaceholder(
                recordType
              )}
              style={textareaStyle}
            />
          </FormField>

          {showConversationFields(recordType) && (
            <>
              <FormField label="Employee comments">
                <textarea
                  value={employeeComments}
                  onChange={(event) =>
                    setEmployeeComments(
                      event.target.value
                    )
                  }
                  style={textareaStyle}
                />
              </FormField>

              <FormField label="Manager comments">
                <textarea
                  value={managerComments}
                  onChange={(event) =>
                    setManagerComments(
                      event.target.value
                    )
                  }
                  style={textareaStyle}
                />
              </FormField>
            </>
          )}

          {recordType === "Support Plan" && (
            <FormField label="Support being provided">
              <textarea
                value={supportRequired}
                onChange={(event) =>
                  setSupportRequired(
                    event.target.value
                  )
                }
                placeholder="Record the support, coaching, learning or guidance being provided."
                style={textareaStyle}
              />
            </FormField>
          )}

          {showActionsField(recordType) && (
            <FormField label="Agreed actions">
              <textarea
                value={agreedActions}
                onChange={(event) =>
                  setAgreedActions(
                    event.target.value
                  )
                }
                style={textareaStyle}
              />
            </FormField>
          )}

          {(recordType === "Review" ||
            recordType === "One-to-One" ||
            recordType === "Support Plan") && (
            <div style={formGridStyle}>
              <FormField label="Next review date">
                <input
                  type="date"
                  value={nextReviewDate}
                  onChange={(event) =>
                    setNextReviewDate(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Status">
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Completed">
                    Completed
                  </option>
                  <option value="Closed">Closed</option>
                </select>
              </FormField>
            </div>
          )}

          <div style={formActionsStyle}>
            {selectedRecord && (
              <button
                type="button"
                onClick={() =>
                  void archiveRecord(
                    selectedRecord.id
                  )
                }
                disabled={saving}
                style={archiveButtonStyle}
              >
                Archive
              </button>
            )}

            <div style={rightActionsStyle}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={saving}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveRecord()}
                disabled={saving}
                style={primaryButtonStyle}
              >
                {saving
                  ? "Saving..."
                  : selectedRecord
                    ? "Update Record"
                    : "Save Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={historyHeaderStyle}>
        <h4 style={historyTitleStyle}>
          {title} history
        </h4>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>
          Loading records...
        </div>
      ) : records.length === 0 ? (
        <div style={emptyStateStyle}>
          No {title.toLowerCase()} records have been
          created yet.
        </div>
      ) : (
        <div style={recordListStyle}>
          {records.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() =>
                openExistingRecord(record)
              }
              style={recordCardStyle}
            >
              <div>
                <div style={recordTitleStyle}>
                  {record.title}
                </div>

                <div style={recordMetaStyle}>
                  {formatDate(record.record_date)}
                  {record.manager_name
                    ? ` · ${record.manager_name}`
                    : ""}
                </div>

                {record.summary && (
                  <div style={recordSummaryStyle}>
                    {record.summary}
                  </div>
                )}
              </div>

              <div style={statusStyle}>
                {record.status}
              </div>
            </button>
          ))}
        </div>
      )}
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
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function getCreateButtonLabel(
  recordType: RecordType
): string {
  switch (recordType) {
    case "Review":
      return "Create Review";
    case "One-to-One":
      return "Create One-to-One";
    case "Support Plan":
      return "Create Support Plan";
    case "Achievement":
      return "Add Achievement";
    case "Milestone":
      return "Add Milestone";
    case "Recognition":
      return "Add Recognition";
  }
}

function getSingularLabel(
  recordType: RecordType
): string {
  return recordType;
}

function getDateLabel(recordType: RecordType): string {
  switch (recordType) {
    case "Review":
      return "Review date";
    case "One-to-One":
      return "Meeting date";
    case "Support Plan":
      return "Start date";
    case "Achievement":
      return "Achievement date";
    case "Milestone":
      return "Milestone date";
    case "Recognition":
      return "Recognition date";
  }
}

function getTitlePlaceholder(
  recordType: RecordType
): string {
  switch (recordType) {
    case "Review":
      return "Annual Review, Six-Month Review or Ad Hoc Review";
    case "One-to-One":
      return "Regular One-to-One";
    case "Support Plan":
      return "Performance Support Plan";
    case "Achievement":
      return "Qualification achieved";
    case "Milestone":
      return "Promoted to Team Leader";
    case "Recognition":
      return "Outstanding customer service";
  }
}

function getSummaryLabel(
  recordType: RecordType
): string {
  switch (recordType) {
    case "Review":
      return "Review summary";
    case "One-to-One":
      return "Conversation summary";
    case "Support Plan":
      return "Areas requiring support or improvement";
    case "Achievement":
      return "Achievement";
    case "Milestone":
      return "Milestone";
    case "Recognition":
      return "Recognition details";
  }
}

function getSummaryPlaceholder(
  recordType: RecordType
): string {
  switch (recordType) {
    case "Review":
      return "Summarise the review conversation.";
    case "One-to-One":
      return "Summarise the conversation and anything discussed.";
    case "Support Plan":
      return "Describe the areas requiring improvement or additional support.";
    case "Achievement":
      return "Describe what the employee achieved.";
    case "Milestone":
      return "Describe the employee’s professional milestone.";
    case "Recognition":
      return "Describe the contribution being recognised.";
  }
}

function showManagerFields(
  recordType: RecordType
): boolean {
  return (
    recordType === "Review" ||
    recordType === "One-to-One" ||
    recordType === "Support Plan" ||
    recordType === "Recognition"
  );
}

function showConversationFields(
  recordType: RecordType
): boolean {
  return (
    recordType === "Review" ||
    recordType === "One-to-One" ||
    recordType === "Support Plan"
  );
}

function showActionsField(
  recordType: RecordType
): boolean {
  return (
    recordType === "Review" ||
    recordType === "One-to-One" ||
    recordType === "Support Plan"
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

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}

const workspaceHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "20px",
};

const workspaceTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const workspaceDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
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
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const archiveButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const formPanelStyle: React.CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "20px",
  marginBottom: "22px",
};

const formHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
};

const formTitleStyle: React.CSSProperties = {
  margin: 0,
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#6B7280",
  fontWeight: 700,
  cursor: "pointer",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "16px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "100px",
  padding: "10px 12px",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1.5,
  resize: "vertical",
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginTop: "20px",
};

const rightActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginLeft: "auto",
};

const errorStyle: React.CSSProperties = {
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
};

const messageStyle: React.CSSProperties = {
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "16px",
};

const historyHeaderStyle: React.CSSProperties = {
  marginTop: "8px",
  marginBottom: "12px",
};

const historyTitleStyle: React.CSSProperties = {
  margin: 0,
};

const emptyStateStyle: React.CSSProperties = {
  padding: "24px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "12px",
  color: "#6B7280",
  textAlign: "center",
};

const recordListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const recordCardStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
  padding: "14px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  textAlign: "left",
  cursor: "pointer",
};

const recordTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontWeight: 800,
};

const recordMetaStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "12px",
};

const recordSummaryStyle: React.CSSProperties = {
  marginTop: "8px",
  color: "#4B5563",
  fontSize: "14px",
  lineHeight: 1.5,
};

const statusStyle: React.CSSProperties = {
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};