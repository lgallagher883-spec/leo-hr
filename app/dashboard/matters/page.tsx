"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function MattersPage() {
  const router = useRouter();

  const [matters, setMatters] = useState<Matter[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const mattersResult = await supabase
      .from("matters")
      .select(
        "id, title, status, description, created_at, employee_id, matter_type, subject, matter_lead"
      )
      .order("created_at", { ascending: false });

    const employeesResult = await supabase.from("employees").select("id, name");

    if (mattersResult.error) {
      console.error("Error loading matters:", mattersResult.error);
      setLoading(false);
      return;
    }

    setMatters(mattersResult.data || []);
    setEmployees(employeesResult.data || []);
    setLoading(false);
  }

  async function deleteMatter(matterId: number) {
    const confirmed = window.confirm(
      "Delete this matter? This will remove the matter and its chronology entries."
    );

    if (!confirmed) return;

    const { error } = await supabase.from("matters").delete().eq("id", matterId);

    if (error) {
      console.error("Error deleting matter:", error);
      alert("Matter could not be deleted.");
      return;
    }

    setMatters((prev) => prev.filter((matter) => matter.id !== matterId));
  }

  function getEmployeeName(employeeId: number | null) {
    if (!employeeId) return "Unlinked";

    return (
      employees.find((employee) => employee.id === employeeId)?.name ||
      "Unlinked"
    );
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Not recorded";

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
          onClick={() => router.push("/dashboard/matters/new")}
          style={newButtonStyle}
        >
          + New Matter
        </button>
      </div>

      <div style={tableCardStyle}>
        {loading ? (
          <div style={emptyStyle}>Loading matters...</div>
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
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteMatter(matter.id);
                        }}
                        style={deleteButtonStyle}
                      >
                        Delete
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
  background: "#ffffff",
  border: "1px solid #e5e7eb",
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
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};