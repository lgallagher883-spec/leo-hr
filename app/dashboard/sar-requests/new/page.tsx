"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  id: number;
  name: string;
};

type Matter = {
  id: number;
  title: string;
  subject: string | null;
  employee_id: number | null;
  status: string | null;
};

export default function NewSarRequestPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [matterId, setMatterId] = useState("");
  const [requestTitle, setRequestTitle] =
    useState("Subject Access Request");
  const [requestSummary, setRequestSummary] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [assignedTo, setAssignedTo] = useState("");
  const [requestSource, setRequestSource] = useState("Email");
  const [requestFile, setRequestFile] = useState<File | null>(null);

  useEffect(() => {
    loadReferenceData();
  }, []);

  async function loadReferenceData() {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/sar-requests",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "SAR reference data could not be loaded."
        );
      }

      setEmployees(
        Array.isArray(result.employees)
          ? (result.employees as Employee[])
          : []
      );

      setMatters(
        Array.isArray(result.matters)
          ? (result.matters as Matter[])
          : []
      );
    } catch (error) {
      console.error(
        "Error loading SAR reference data:",
        error
      );

      setEmployees([]);
      setMatters([]);
    } finally {
      setLoading(false);
    }
  }

  const availableMatters = useMemo(() => {
    if (!employeeId) {
      return matters;
    }

    return matters.filter(
      (matter) =>
        matter.employee_id === Number(employeeId)
    );
  }, [employeeId, matters]);

  useEffect(() => {
    if (!matterId) return;

    const selectedMatter = matters.find(
      (matter) => matter.id === Number(matterId)
    );

    if (!selectedMatter) return;

    if (
      selectedMatter.employee_id &&
      String(selectedMatter.employee_id) !== employeeId
    ) {
      setEmployeeId(
        String(selectedMatter.employee_id)
      );
    }
  }, [employeeId, matterId, matters]);

  async function createSarRequest() {
    if (!employeeId) {
      setErrorMessage("Select the employee linked to this SAR.");
      return;
    }

    if (!receivedDate) {
      setErrorMessage("Enter the date the SAR was received.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("employeeId", employeeId);

      if (matterId) {
        formData.append("matterId", matterId);
      }

      formData.append(
        "requestTitle",
        requestTitle.trim() ||
          "Subject Access Request"
      );

      formData.append(
        "requestSummary",
        requestSummary
      );

      formData.append(
        "receivedDate",
        receivedDate
      );

      formData.append(
        "assignedTo",
        assignedTo
      );

      formData.append(
        "requestSource",
        requestSource
      );

      if (requestFile) {
        formData.append(
          "requestFile",
          requestFile
        );
      }

      const response = await fetch(
        "/api/sar-requests",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        !result?.success ||
        !result?.sar?.id
      ) {
        throw new Error(
          result?.error ||
            "SAR record was not created."
        );
      }

      router.push(
        `/dashboard/sar-requests/${result.sar.id}`
      );
    } catch (error) {
      console.error("Error creating SAR:", error);

      setErrorMessage(
        "The SAR could not be created. Check the details and try again."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return <div>Loading SAR setup...</div>;
  }

  return (
    <div style={pageStyle}>
      <button
        onClick={() =>
          router.push("/dashboard/sar-requests")
        }
        style={backButtonStyle}
      >
        ← SAR Requests
      </button>

      <div style={headerStyle}>
        <h1 style={titleStyle}>
          New Subject Access Request
        </h1>

        <p style={subtitleStyle}>
          Record the request, upload the original
          correspondence and connect it to the employee.
          Linking a Matter is optional.
        </p>
      </div>

      <div style={layoutStyle}>
        <main style={formCardStyle}>
          <SectionTitle>
            Request details
          </SectionTitle>

          <Field label="Employee" required>
            <select
              value={employeeId}
              onChange={(event) => {
                setEmployeeId(event.target.value);

                if (matterId) {
                  const currentMatter =
                    matters.find(
                      (matter) =>
                        matter.id ===
                        Number(matterId)
                    );

                  if (
                    currentMatter?.employee_id &&
                    currentMatter.employee_id !==
                      Number(event.target.value)
                  ) {
                    setMatterId("");
                  }
                }
              }}
              style={inputStyle}
            >
              <option value="">
                Select employee
              </option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Linked Matter"
            hint="Optional. Leave blank where the SAR has been received without an existing workplace Matter."
          >
            <select
              value={matterId}
              onChange={(event) =>
                setMatterId(event.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                No Matter linked
              </option>

              {availableMatters.map((matter) => (
                <option
                  key={matter.id}
                  value={matter.id}
                >
                  {matter.subject ||
                    matter.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Request title" required>
            <input
              value={requestTitle}
              onChange={(event) =>
                setRequestTitle(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </Field>

          <Field
            label="Request summary"
            hint="Briefly record what the employee appears to be asking for. Do not interpret the request more narrowly than the wording received."
          >
            <textarea
              value={requestSummary}
              onChange={(event) =>
                setRequestSummary(
                  event.target.value
                )
              }
              placeholder="Example: Request for copies of emails, meeting notes and records relating to the employee's grievance."
              style={textareaStyle}
            />
          </Field>

          <div style={twoColumnStyle}>
            <Field
              label="Date received"
              required
            >
              <input
                type="date"
                value={receivedDate}
                onChange={(event) =>
                  setReceivedDate(
                    event.target.value
                  )
                }
                style={inputStyle}
              />
            </Field>

            <Field label="Request source">
              <select
                value={requestSource}
                onChange={(event) =>
                  setRequestSource(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="Email">
                  Email
                </option>
                <option value="Letter">
                  Letter
                </option>
                <option value="Form">
                  Form
                </option>
                <option value="Verbal">
                  Verbal
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </Field>
          </div>

          <Field
            label="Owner"
            hint="The person responsible for coordinating the request."
          >
            <input
              value={assignedTo}
              onChange={(event) =>
                setAssignedTo(
                  event.target.value
                )
              }
              placeholder="Example: Sarah Jones"
              style={inputStyle}
            />
          </Field>

          <SectionTitle>
            Original request
          </SectionTitle>

          <Field
            label="Upload original request"
            hint="Upload the email, letter, form or other document received from the employee."
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.eml,.msg,.png,.jpg,.jpeg"
              onChange={(event) =>
                setRequestFile(
                  event.target.files?.[0] ||
                    null
                )
              }
              style={fileInputStyle}
            />

            {requestFile && (
              <div style={selectedFileStyle}>
                {requestFile.name} ·{" "}
                {formatFileSize(
                  requestFile.size
                )}
              </div>
            )}
          </Field>

          {errorMessage && (
            <div style={errorStyle}>
              {errorMessage}
            </div>
          )}

          <div style={actionRowStyle}>
            <button
              onClick={() =>
                router.push(
                  "/dashboard/sar-requests"
                )
              }
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              onClick={createSarRequest}
              disabled={saving}
              style={{
                ...primaryButtonStyle,
                opacity: saving ? 0.65 : 1,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Creating SAR..."
                : "Create SAR"}
            </button>
          </div>
        </main>

        <aside style={guidanceCardStyle}>
          <div style={guidanceTitleStyle}>
            Leo’s initial focus
          </div>

          <p style={guidanceTextStyle}>
            Once the SAR is created, Leo should
            help establish the scope of the
            request, confirm identity where
            necessary and identify the records
            that may need to be collected.
          </p>

          <div style={deadlineCardStyle}>
            <div style={deadlineLabelStyle}>
              Initial response deadline
            </div>

            <div style={deadlineValueStyle}>
              {receivedDate
                ? formatDate(
                    calculateInitialDeadline(
                      receivedDate
                    )
                  )
                : "Select received date"}
            </div>
          </div>

          <p style={guidanceNoteStyle}>
            This initial date is calculated as
            one calendar month from receipt.
            The final legal deadline may require
            review where the corresponding date
            does not exist in the following
            month, identity verification is
            outstanding or a lawful extension
            applies.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>
        {label}
        {required ? " *" : ""}
      </label>

      {hint && (
        <div style={hintStyle}>
          {hint}
        </div>
      )}

      {children}
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 style={sectionTitleStyle}>
      {children}
    </h2>
  );
}

function calculateInitialDeadline(
  receivedDate: string
) {
  const [year, month, day] =
    receivedDate
      .split("-")
      .map(Number);

  const targetMonthIndex = month;

  const lastDayOfTargetMonth =
    new Date(
      year,
      targetMonthIndex + 1,
      0
    ).getDate();

  const targetDay = Math.min(
    day,
    lastDayOfTargetMonth
  );

  const deadline = new Date(
    year,
    targetMonthIndex,
    targetDay
  );

  return [
    deadline.getFullYear(),
    String(
      deadline.getMonth() + 1
    ).padStart(2, "0"),
    String(deadline.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");
}

function formatDate(
  dateString: string
) {
  return new Date(
    `${dateString}T00:00:00`
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFileSize(
  bytes: number
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(
      bytes / 1024
    )} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1200px",
};

const backButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#6B7280",
  padding: 0,
  marginBottom: "16px",
  cursor: "pointer",
  fontSize: "14px",
};

const headerStyle: React.CSSProperties = {
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "26px",
  fontWeight: 700,
};

const subtitleStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  maxWidth: "760px",
  lineHeight: 1.6,
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 300px",
  gap: "18px",
  alignItems: "start",
};

const formCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "22px",
};

const guidanceCardStyle: React.CSSProperties = {
  background: "#FBF8FD",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "18px",
  position: "sticky",
  top: "18px",
};

const guidanceTitleStyle: React.CSSProperties = {
  color: "#4C365E",
  fontSize: "15px",
  fontWeight: 700,
  marginBottom: "9px",
};

const guidanceTextStyle: React.CSSProperties = {
  color: "#5F5368",
  fontSize: "13px",
  lineHeight: 1.6,
  margin: 0,
};

const guidanceNoteStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.55,
  margin: "12px 0 0",
};

const deadlineCardStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "13px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const deadlineLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  marginBottom: "5px",
};

const deadlineValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: 700,
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  margin: "0 0 16px",
};

const fieldStyle: React.CSSProperties = {
  marginBottom: "17px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "7px",
};

const hintStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.5,
  marginTop: "-2px",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 11px",
  fontSize: "14px",
  background: "#FFFFFF",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "105px",
  resize: "vertical",
  fontFamily: "inherit",
};

const fileInputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: "13px",
  color: "#4B5563",
};

const selectedFileStyle: React.CSSProperties = {
  marginTop: "9px",
  padding: "9px 10px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "9px",
  color: "#4B5563",
  fontSize: "12px",
};

const twoColumnStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "10px",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "10px",
  background: "#6E5084",
  color: "#FFFFFF",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  color: "#4B5563",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  marginTop: "8px",
  marginBottom: "14px",
  padding: "11px 12px",
  borderRadius: "10px",
  border: "1px solid #FECACA",
  background: "#FEF2F2",
  color: "#991B1B",
  fontSize: "13px",
};