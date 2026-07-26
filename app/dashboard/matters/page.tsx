"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Matter = {
  id: number;
  title: string;
  status: string;
  description: string | null;
  created_at: string | null;
  employee_id: number | null;
  matter_type: string | null;
  subject: string | null;
  matter_lead: string | null;
};

type Employee = {
  id: number;
  name: string;
};

type MattersResponse = {
  success: boolean;
  matters?: Matter[];
  employees?: Employee[];
  error?: string;
};

type DeleteMatterResponse = {
  success: boolean;
  deletedMatterId?: number;
  error?: string;
};

export default function MattersPage() {
  const router = useRouter();

  const [matters, setMatters] = useState<Matter[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingMatterId, setDeletingMatterId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/matters", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as MattersResponse;

      if (!response.ok || !result.success) {
        if (response.status === 401 || response.status === 403) {
          router.replace("/dashboard");
          return;
        }

        throw new Error(
          result.error || "LEO could not load the organisation's matters.",
        );
      }

      setMatters(result.matters ?? []);
      setEmployees(result.employees ?? []);
    } catch (error) {
      console.error("Error loading Matters:", error);

      setLoadError(
        error instanceof Error
          ? error.message
          : "LEO could not load the organisation's matters.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteMatter(matterId: number) {
    const confirmed = window.confirm(
      "Delete this matter? This will remove the matter and its chronology entries.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingMatterId(matterId);

    try {
      const response = await fetch(`/api/matters/${matterId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as DeleteMatterResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "The matter could not be deleted.",
        );
      }

      setMatters((current) =>
        current.filter((matter) => matter.id !== matterId),
      );
    } catch (error) {
      console.error("Error deleting matter:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "The matter could not be deleted.",
      );
    } finally {
      setDeletingMatterId(null);
    }
  }

  function getEmployeeName(employeeId: number | null) {
    if (!employeeId) {
      return "Unlinked";
    }

    return (
      employees.find((employee) => employee.id === employeeId)?.name ??
      "Unlinked"
    );
  }

  function formatDate(dateString: string | null) {
    if (!dateString) {
      return "Not recorded";
    }

    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusStyle(status: string) {
    if (status === "Needs Attention") {
      return { background: "#FFF7ED", color: "#9A3412" };
    }

    if (status === "In Progress") {
      return { background: "#FFFBEB", color: "#92400E" };
    }

    if (status === "Closed") {
      return { background: "#F3F4F6", color: "#374151" };
    }

    return { background: "#F5FFF9", color: "#166534" };
  }

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Matters</h1>
          <p style={subtitleStyle}>Manage all HR matters in the system.</p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/matters/new")}
          style={newButtonStyle}
        >
          + New Matter
        </button>
      </div>

      <div style={tableCardStyle}>
        {loading ? (
          <div style={emptyStyle}>Loading matters...</div>
        ) : loadError ? (
          <div role="alert" style={errorStateStyle}>
            <strong style={errorHeadingStyle}>Matters could not be loaded</strong>
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void loadData()}
              style={retryButtonStyle}
            >
              Try again
            </button>
          </div>
        ) : matters.length === 0 ? (
          <div style={emptyStyle}>No matters yet. Create your first one.</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Employee</Th>
                <Th>Matter Type</Th>
                <Th>Subject</Th>
                <Th>Date Opened</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>

            <tbody>
              {matters.map((matter) => {
                const statusStyle = getStatusStyle(matter.status || "Open");
                const isDeleting = deletingMatterId === matter.id;

                return (
                  <tr key={matter.id} style={rowStyle}>
                    <Td
                      onClick={() =>
                        router.push(`/dashboard/matters/${matter.id}`)
                      }
                      strong
                    >
                      {getEmployeeName(matter.employee_id)}
                    </Td>

                    <Td
                      onClick={() =>
                        router.push(`/dashboard/matters/${matter.id}`)
                      }
                    >
                      {matter.matter_type || "General"}
                    </Td>

                    <Td
                      onClick={() =>
                        router.push(`/dashboard/matters/${matter.id}`)
                      }
                    >
                      {matter.subject || matter.title}
                    </Td>

                    <Td
                      onClick={() =>
                        router.push(`/dashboard/matters/${matter.id}`)
                      }
                    >
                      {formatDate(matter.created_at)}
                    </Td>

                    <Td
                      onClick={() =>
                        router.push(`/dashboard/matters/${matter.id}`)
                      }
                    >
                      <span style={{ ...badgeStyle, ...statusStyle }}>
                        {matter.status || "Open"}
                      </span>
                    </Td>

                    <Td>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={(event) => {
                          event.stopPropagation();
                          void deleteMatter(matter.id);
                        }}
                        style={{
                          ...deleteButtonStyle,
                          opacity: isDeleting ? 0.6 : 1,
                          cursor: isDeleting ? "not-allowed" : "pointer",
                        }}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={thStyle}>{children}</th>;
}

function Td({
  children,
  strong = false,
  onClick,
}: {
  children: React.ReactNode;
  strong?: boolean;
  onClick?: () => void;
}) {
  return (
    <td
      onClick={onClick}
      style={{ ...tdStyle, fontWeight: strong ? 700 : 400 }}
    >
      {children}
    </td>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  marginBottom: "4px",
  color: "#111827",
};

const subtitleStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "14px",
  margin: 0,
};

const newButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 600,
  cursor: "pointer",
};

const tableCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  overflow: "hidden",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  borderBottom: "1px solid #E5E7EB",
  color: "#374151",
  fontSize: "13px",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #F3F4F6",
  color: "#374151",
  fontSize: "14px",
  cursor: "pointer",
};

const rowStyle: React.CSSProperties = {
  cursor: "default",
};

const emptyStyle: React.CSSProperties = {
  padding: "20px",
  color: "#6B7280",
};

const errorStateStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "10px",
  padding: "20px",
  color: "#7F1D1D",
  background: "#FFF7F7",
};

const errorHeadingStyle: React.CSSProperties = {
  fontSize: "14px",
};

const retryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "8px",
  padding: "7px 11px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 700,
};

const badgeStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: "999px",
  whiteSpace: "nowrap",
};

const deleteButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 600,
};