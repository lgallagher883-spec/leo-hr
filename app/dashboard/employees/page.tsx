"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Employee = {
  id: number;
  name: string;
  role: string | null;
  status: string | null;
};

type ViewMode = "active" | "archived";

export default function EmployeesPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployees() {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, role, status")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading employees:", error);
        setLoading(false);
        return;
      }

      setEmployees(data || []);
      setLoading(false);
    }

    loadEmployees();
  }, []);

  const visibleEmployees = employees.filter((employee) => {
    const status = employee.status || "Active";

    if (viewMode === "active" && status === "Archived") return false;
    if (viewMode === "archived" && status !== "Archived") return false;

    return `${employee.name} ${employee.role || ""} ${status}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const activeCount = employees.filter(
    (employee) => (employee.status || "Active") !== "Archived"
  ).length;

  const archivedCount = employees.filter(
    (employee) => employee.status === "Archived"
  ).length;

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "28px", margin: 0 }}>Employees</h1>
          <p style={{ color: "#6B7280", marginTop: "8px" }}>
            Your staff records, used to link Matters and documents.
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/employees/new")}
          style={primaryButtonStyle}
        >
          Add employee
        </button>
      </div>

      <div style={tabsStyle}>
        <button
          onClick={() => setViewMode("active")}
          style={viewMode === "active" ? activeTabStyle : tabStyle}
        >
          Active employees ({activeCount})
        </button>

        <button
          onClick={() => setViewMode("archived")}
          style={viewMode === "archived" ? activeTabStyle : tabStyle}
        >
          Archived employees ({archivedCount})
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          viewMode === "active"
            ? "Search active employees…"
            : "Search archived employees…"
        }
        style={searchStyle}
      />

      {loading ? (
        <div style={emptyStyle}>Loading employees...</div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {visibleEmployees.map((employee) => (
            <div
              key={employee.id}
              onClick={() =>
                router.push(`/dashboard/employees/${employee.id}`)
              }
              style={cardStyle}
            >
              <div style={{ fontWeight: 800, fontSize: "18px" }}>
                {employee.name}
              </div>

              <div style={metaStyle}>
                {employee.role || "No role"} · {employee.status || "Active"}
              </div>
            </div>
          ))}

          {visibleEmployees.length === 0 && (
            <div style={emptyStyle}>
              {viewMode === "active"
                ? "No active employees found."
                : "No archived employees found."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
};

const tabsStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  marginBottom: "16px",
};

const tabStyle: React.CSSProperties = {
  background: "#fff",
  color: "#6B7280",
  border: "1px solid #e5e7eb",
  padding: "9px 12px",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: 600,
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  background: "#6E5084",
  color: "#fff",
  border: "1px solid #6E5084",
};

const searchStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  marginBottom: "18px",
  fontSize: "14px",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  cursor: "pointer",
};

const metaStyle: React.CSSProperties = {
  marginTop: "6px",
  color: "#6B7280",
  fontSize: "13px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const emptyStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  color: "#6B7280",
};