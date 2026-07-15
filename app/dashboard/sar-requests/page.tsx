"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SarRequest = {
  id: number;
  employee_id: number;
  matter_id: number | null;
  request_title: string;
  request_received_date: string;
  response_due_date: string;
  extended_due_date: string | null;
  status: string;
  assigned_to: string | null;
  identity_verified: boolean;
  collection_complete: boolean;
  review_complete: boolean;
  redaction_complete: boolean;
  disclosure_sent: boolean;
  created_at: string;
};

type Employee = {
  id: number;
  name: string;
};

type Matter = {
  id: number;
  title: string;
  subject: string | null;
};

type FilterOption =
  | "All"
  | "Open"
  | "Due Soon"
  | "Overdue"
  | "Completed";

export default function SarRequestsPage() {
  const router = useRouter();

  const [sarRequests, setSarRequests] = useState<SarRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<FilterOption>("All");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [sarResult, employeeResult, matterResult] =
      await Promise.all([
        supabase
          .from("employee_sars")
          .select(
            `
              id,
              employee_id,
              matter_id,
              request_title,
              request_received_date,
              response_due_date,
              extended_due_date,
              status,
              assigned_to,
              identity_verified,
              collection_complete,
              review_complete,
              redaction_complete,
              disclosure_sent,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("employees")
          .select("id,name")
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("matters")
          .select("id,title,subject"),
      ]);

    if (sarResult.error) {
      console.error(
        "Error loading SAR requests:",
        sarResult.error
      );
    }

    if (employeeResult.error) {
      console.error(
        "Error loading employees:",
        employeeResult.error
      );
    }

    if (matterResult.error) {
      console.error(
        "Error loading matters:",
        matterResult.error
      );
    }

    setSarRequests(sarResult.data || []);
    setEmployees(employeeResult.data || []);
    setMatters(matterResult.data || []);
    setLoading(false);
  }

  const filteredRequests = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return sarRequests.filter((request) => {
      const employeeName =
        getEmployeeName(
          request.employee_id,
          employees
        ).toLowerCase();

      const matterName =
        getMatterName(
          request.matter_id,
          matters
        ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        request.request_title
          .toLowerCase()
          .includes(searchValue) ||
        request.status
          .toLowerCase()
          .includes(searchValue) ||
        employeeName.includes(searchValue) ||
        matterName.includes(searchValue) ||
        (request.assigned_to || "")
          .toLowerCase()
          .includes(searchValue);

      if (!matchesSearch) {
        return false;
      }

      const deadlineState =
        getDeadlineState(request);

      if (activeFilter === "All") {
        return true;
      }

      if (activeFilter === "Open") {
        return !isClosedStatus(request.status);
      }

      if (activeFilter === "Due Soon") {
        return deadlineState === "Due Soon";
      }

      if (activeFilter === "Overdue") {
        return deadlineState === "Overdue";
      }

      return isClosedStatus(request.status);
    });
  }, [
    activeFilter,
    employees,
    matters,
    sarRequests,
    search,
  ]);

  const openCount = sarRequests.filter(
    (request) =>
      !isClosedStatus(request.status)
  ).length;

  const dueSoonCount = sarRequests.filter(
    (request) =>
      getDeadlineState(request) ===
      "Due Soon"
  ).length;

  const overdueCount = sarRequests.filter(
    (request) =>
      getDeadlineState(request) ===
      "Overdue"
  ).length;

  const completedCount =
    sarRequests.filter((request) =>
      isClosedStatus(request.status)
    ).length;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            SAR Requests
          </h1>

          <p style={subtitleStyle}>
            Manage Subject Access Requests,
            deadlines, evidence collection,
            redaction and disclosure.
          </p>
        </div>

        <button
          onClick={() =>
            router.push(
              "/dashboard/sar-requests/new"
            )
          }
          style={primaryButtonStyle}
        >
          + New SAR
        </button>
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Open Requests"
          value={openCount}
        />

        <SummaryCard
          label="Due Soon"
          value={dueSoonCount}
        />

        <SummaryCard
          label="Overdue"
          value={overdueCount}
          attention={overdueCount > 0}
        />

        <SummaryCard
          label="Completed"
          value={completedCount}
        />
      </div>

      <div style={toolbarStyle}>
        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search by employee, Matter, status or owner..."
          style={searchStyle}
        />

        <div style={filterRowStyle}>
          {(
            [
              "All",
              "Open",
              "Due Soon",
              "Overdue",
              "Completed",
            ] as FilterOption[]
          ).map((filter) => (
            <button
              key={filter}
              onClick={() =>
                setActiveFilter(filter)
              }
              style={
                activeFilter === filter
                  ? activeFilterStyle
                  : filterStyle
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div style={tableCardStyle}>
        {loading ? (
          <div style={emptyStyle}>
            Loading SAR requests...
          </div>
        ) : filteredRequests.length ===
          0 ? (
          <div style={emptyStyle}>
            {sarRequests.length === 0
              ? "No SAR requests have been recorded yet."
              : "No SAR requests match the current filters."}
          </div>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Request</Th>
                  <Th>Linked Matter</Th>
                  <Th>Received</Th>
                  <Th>Deadline</Th>
                  <Th>Status</Th>
                  <Th>Progress</Th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map(
                  (request) => {
                    const deadlineState =
                      getDeadlineState(
                        request
                      );

                    return (
                      <tr
                        key={request.id}
                        onClick={() =>
                          router.push(
                            `/dashboard/sar-requests/${request.id}`
                          )
                        }
                        style={rowStyle}
                      >
                        <Td strong>
                          {getEmployeeName(
                            request.employee_id,
                            employees
                          )}
                        </Td>

                        <Td>
                          {request.request_title}
                        </Td>

                        <Td>
                          {getMatterName(
                            request.matter_id,
                            matters
                          )}
                        </Td>

                        <Td>
                          {formatDate(
                            request.request_received_date
                          )}
                        </Td>

                        <Td>
                          <div>
                            {formatDate(
                              getEffectiveDeadline(
                                request
                              )
                            )}
                          </div>

                          <span
                            style={{
                              ...deadlineBadgeStyle,
                              ...getDeadlineStyle(
                                deadlineState
                              ),
                            }}
                          >
                            {deadlineState}
                          </span>
                        </Td>

                        <Td>
                          <span
                            style={{
                              ...statusBadgeStyle,
                              ...getStatusStyle(
                                request.status
                              ),
                            }}
                          >
                            {request.status}
                          </span>
                        </Td>

                        <Td>
                          <ProgressSummary
                            request={request}
                          />
                        </Td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  attention = false,
}: {
  label: string;
  value: number;
  attention?: boolean;
}) {
  return (
    <div
      style={{
        ...summaryCardStyle,
        ...(attention
          ? attentionCardStyle
          : {}),
      }}
    >
      <div style={summaryLabelStyle}>
        {label}
      </div>

      <div style={summaryValueStyle}>
        {value}
      </div>
    </div>
  );
}

function ProgressSummary({
  request,
}: {
  request: SarRequest;
}) {
  const completed = [
    request.identity_verified,
    request.collection_complete,
    request.review_complete,
    request.redaction_complete,
    request.disclosure_sent,
  ].filter(Boolean).length;

  return (
    <div style={{ minWidth: "120px" }}>
      <div style={progressTextStyle}>
        {completed} of 5 complete
      </div>

      <div style={progressTrackStyle}>
        <div
          style={{
            ...progressFillStyle,
            width: `${
              (completed / 5) * 100
            }%`,
          }}
        />
      </div>
    </div>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return <th style={thStyle}>{children}</th>;
}

function Td({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      style={{
        ...tdStyle,
        fontWeight: strong ? 700 : 400,
      }}
    >
      {children}
    </td>
  );
}

function getEmployeeName(
  employeeId: number,
  employees: Employee[]
) {
  return (
    employees.find(
      (employee) =>
        employee.id === employeeId
    )?.name || "Unknown employee"
  );
}

function getMatterName(
  matterId: number | null,
  matters: Matter[]
) {
  if (!matterId) {
    return "No Matter linked";
  }

  const matter = matters.find(
    (item) => item.id === matterId
  );

  return (
    matter?.subject ||
    matter?.title ||
    `Matter ${matterId}`
  );
}

function isClosedStatus(
  status: string
) {
  return (
    status === "Completed" ||
    status === "Closed"
  );
}

function getEffectiveDeadline(
  request: SarRequest
) {
  return (
    request.extended_due_date ||
    request.response_due_date
  );
}

function getDeadlineState(
  request: SarRequest
):
  | "Completed"
  | "Overdue"
  | "Due Soon"
  | "On Track" {
  if (isClosedStatus(request.status)) {
    return "Completed";
  }

  const deadline = new Date(
    getEffectiveDeadline(request)
  );

  deadline.setHours(23, 59, 59, 999);

  const now = new Date();

  const differenceInDays = Math.ceil(
    (deadline.getTime() -
      now.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (differenceInDays < 0) {
    return "Overdue";
  }

  if (differenceInDays <= 7) {
    return "Due Soon";
  }

  return "On Track";
}

function getDeadlineStyle(
  state:
    | "Completed"
    | "Overdue"
    | "Due Soon"
    | "On Track"
): React.CSSProperties {
  if (state === "Overdue") {
    return {
      background: "#FEF2F2",
      color: "#991B1B",
    };
  }

  if (state === "Due Soon") {
    return {
      background: "#FFF7ED",
      color: "#9A3412",
    };
  }

  if (state === "Completed") {
    return {
      background: "#F3F4F6",
      color: "#374151",
    };
  }

  return {
    background: "#F0FDF4",
    color: "#166534",
  };
}

function getStatusStyle(
  status: string
): React.CSSProperties {
  if (
    status === "Completed" ||
    status === "Closed"
  ) {
    return {
      background: "#F3F4F6",
      color: "#374151",
    };
  }

  if (
    status === "Ready for Disclosure"
  ) {
    return {
      background: "#F0FDF4",
      color: "#166534",
    };
  }

  if (
    status === "Redaction" ||
    status === "Reviewing Records"
  ) {
    return {
      background: "#F5F3FF",
      color: "#6D28D9",
    };
  }

  if (
    status === "Collecting Records"
  ) {
    return {
      background: "#EFF6FF",
      color: "#1D4ED8",
    };
  }

  return {
    background: "#FFFBEB",
    color: "#92400E",
  };
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

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1400px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "26px",
  fontWeight: 700,
};

const subtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "14px",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "10px",
  background: "#6E5084",
  color: "#FFFFFF",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const summaryCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "16px",
};

const attentionCardStyle: React.CSSProperties = {
  borderColor: "#FECACA",
  background: "#FFFBFB",
};

const summaryLabelStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "13px",
  marginBottom: "8px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: 700,
};

const toolbarStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  marginBottom: "14px",
};

const searchStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "11px 12px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const filterRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const filterStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#4B5563",
  padding: "7px 12px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const activeFilterStyle: React.CSSProperties = {
  ...filterStyle,
  background: "#F7F1FC",
  borderColor: "#D8C8E5",
  color: "#6E5084",
};

const tableCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  overflow: "hidden",
};

const tableWrapperStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "980px",
};

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  color: "#4B5563",
  background: "#FAFAFA",
  borderBottom: "1px solid #E5E7EB",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 14px",
  borderBottom: "1px solid #F3F4F6",
  color: "#374151",
  fontSize: "13px",
  verticalAlign: "middle",
};

const rowStyle: React.CSSProperties = {
  cursor: "pointer",
};

const statusBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "4px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const deadlineBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  marginTop: "5px",
  padding: "3px 7px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
};

const progressTextStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  marginBottom: "5px",
};

const progressTrackStyle: React.CSSProperties = {
  height: "6px",
  borderRadius: "999px",
  background: "#E5E7EB",
  overflow: "hidden",
};

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "#6E5084",
};

const emptyStyle: React.CSSProperties = {
  padding: "28px",
  color: "#6B7280",
  fontSize: "14px",
  textAlign: "center",
};