"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ComplianceLevel = "review" | "upcoming" | "ok";

type ComplianceRow = {
  employeeId: number;
  employeeName: string;
  category: string;
  item: string;
  detail: string;
  level: ComplianceLevel;
  dueDate: string | null;
  daysRemaining: number | null;
};

type EmployeeComplianceGroup = {
  employeeId: number;
  employeeName: string;
  items: ComplianceRow[];
  soonestDays: number;
};

function daysUntil(dateString: string | null) {
  if (!dateString) return null;

  const today = new Date();
  const target = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getLevel(dateString: string | null): ComplianceLevel {
  const days = daysUntil(dateString);

  if (!dateString || days === null) return "review";
  if (days < 0) return "review";
  if (days <= 30) return "upcoming";
  return "ok";
}

function getDetail(dateString: string | null) {
  const days = daysUntil(dateString);

  if (!dateString || days === null) return "No date recorded.";
  if (days < 0) return `Date passed ${Math.abs(days)} day(s) ago.`;
  if (days <= 30) return `Due in ${days} day(s).`;
  return `Due in ${days} day(s).`;
}

function getLastUpdated() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CompanyComplianceDashboard() {
  const [rows, setRows] = useState<ComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    async function loadCompliance() {
      setLoading(true);
      setLastUpdated(getLastUpdated());

      const { data: employees } = await supabase
        .from("employees")
        .select("id, name, status")
        .order("name", { ascending: true });

      const activeEmployees = (employees || []).filter(
        (employee: any) => employee.status !== "Archived"
      );

      const allRows: ComplianceRow[] = [];

      for (const employee of activeEmployees) {
        const employeeId = employee.id;
        const employeeName = employee.name || "Unnamed employee";

        function addDateRow(
          category: string,
          item: string,
          dueDate: string | null
        ) {
          const level = getLevel(dueDate);
          const daysRemaining = daysUntil(dueDate);

          if (level === "ok") return;

          allRows.push({
            employeeId,
            employeeName,
            category,
            item,
            detail: getDetail(dueDate),
            level,
            dueDate,
            daysRemaining,
          });
        }

        const rightToWork = await supabase
          .from("employee_right_to_work")
          .select("right_to_work_expiry, next_review_date")
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false })
          .limit(1);

        const dbs = await supabase
          .from("employee_dbs_checks")
          .select("next_check_due, safeguarding_training_expiry")
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false })
          .limit(1);

        const driving = await supabase
          .from("employee_driving_checks")
          .select(
            "licence_expiry_date, next_dvla_check_due, business_insurance_expiry_date"
          )
          .eq("employee_id", employeeId)
          .order("created_at", { ascending: false })
          .limit(1);

        const training = await supabase
          .from("employee_training_logs")
          .select("training_name, refresh_or_expiry_date")
          .eq("employee_id", employeeId)
          .order("refresh_or_expiry_date", { ascending: true });

        const leaveRecords = await supabase
          .from("employee_leave_records")
          .select("leave_type, status, days_taken")
          .eq("employee_id", employeeId);

        const employmentDetails = await supabase
          .from("employee_employment_details")
          .select("annual_leave_allowance")
          .eq("employee_id", employeeId)
          .maybeSingle();

        const latestRightToWork = rightToWork.data?.[0];

        if (latestRightToWork) {
          addDateRow(
            "Right to Work",
            "Right to Work",
            latestRightToWork.right_to_work_expiry
          );

          addDateRow(
            "Right to Work",
            "Right to Work Review",
            latestRightToWork.next_review_date
          );
        } else {
          addDateRow("Right to Work", "Right to Work", null);
        }

        const latestDbs = dbs.data?.[0];

        if (latestDbs) {
          addDateRow("DBS", "DBS", latestDbs.next_check_due);

          addDateRow(
            "DBS",
            "Safeguarding",
            latestDbs.safeguarding_training_expiry
          );
        }

        const latestDriving = driving.data?.[0];

        if (latestDriving) {
          addDateRow(
            "Driving",
            "Driving Licence",
            latestDriving.licence_expiry_date
          );

          addDateRow("Driving", "DVLA Check", latestDriving.next_dvla_check_due);

          addDateRow(
            "Driving",
            "Business Insurance",
            latestDriving.business_insurance_expiry_date
          );
        }

        (training.data || []).forEach((record: any) => {
          addDateRow(
            "Training",
            record.training_name || "Training",
            record.refresh_or_expiry_date
          );
        });

        const allowance = Number(
          employmentDetails.data?.annual_leave_allowance || 0
        );

        const annualLeaveUsed = (leaveRecords.data || [])
          .filter(
            (record: any) =>
              record.leave_type === "Annual Leave" &&
              record.status !== "Cancelled"
          )
          .reduce((total: number, record: any) => {
            const days = Number(record.days_taken || 0);
            return total + (Number.isNaN(days) ? 0 : days);
          }, 0);

        if (allowance > 0 && annualLeaveUsed > allowance) {
          allRows.push({
            employeeId,
            employeeName,
            category: "Leave",
            item: "Annual Leave",
            detail: `${annualLeaveUsed} days recorded against an entitlement of ${allowance} days.`,
            level: "review",
            dueDate: null,
            daysRemaining: null,
          });
        }
      }

      setRows(allRows);
      setLoading(false);
    }

    loadCompliance();
  }, []);

  const filteredRows = rows.filter((row) => {
    const matchesFilter =
      filter === "All" ||
      (filter === "Needs Review" && row.level === "review") ||
      (filter === "Due in 30 Days" && row.level === "upcoming") ||
      row.category === filter;

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      searchText.length === 0 ||
      row.employeeName.toLowerCase().includes(searchText) ||
      row.category.toLowerCase().includes(searchText) ||
      row.item.toLowerCase().includes(searchText) ||
      row.detail.toLowerCase().includes(searchText);

    return matchesFilter && matchesSearch;
  });

  const groupedEmployees = groupByEmployee(filteredRows);

  const employeesToAction = groupByEmployee(rows).length;
  const reviewsRequired = rows.filter((row) => row.level === "review").length;
  const dueIn30Days = rows.filter((row) => row.level === "upcoming").length;
  const overallCompliance =
    rows.length === 0 ? 100 : Math.max(0, Math.round(100 - rows.length * 3));

  const filters = [
    "All",
    "Needs Review",
    "Due in 30 Days",
    "DBS",
    "Right to Work",
    "Driving",
    "Training",
    "Leave",
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "30px", marginBottom: "8px" }}>
          Company Compliance Dashboard
        </h1>

        <p style={{ color: "#6B7280", marginBottom: "6px" }}>
          A calm overview of employee compliance records that may need review.
        </p>

        {lastUpdated && (
          <div style={{ color: "#9CA3AF", fontSize: "12px" }}>
            Last updated: {lastUpdated}
          </div>
        )}
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard title="Employees to Action" value={employeesToAction} />
        <SummaryCard title="Reviews Required" value={reviewsRequired} />
        <SummaryCard title="Due in 30 Days" value={dueIn30Days} />
        <SummaryCard title="Overall Compliance" value={`${overallCompliance}%`} />
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by employee, topic or detail..."
        style={searchStyle}
      />

      <div style={filterWrapStyle}>
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            style={filterButtonStyle(filter === item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={cardStyle}>Checking company compliance records...</div>
      ) : groupedEmployees.length === 0 ? (
        <div style={okBoxStyle}>
          No immediate company compliance items found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "14px" }}>
          {groupedEmployees.map((employee) => (
            <EmployeeComplianceCard
              key={employee.employeeId}
              employee={employee}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function groupByEmployee(rows: ComplianceRow[]): EmployeeComplianceGroup[] {
  const map = new Map<number, EmployeeComplianceGroup>();

  rows.forEach((row) => {
    if (!map.has(row.employeeId)) {
      map.set(row.employeeId, {
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        items: [],
        soonestDays: 999999,
      });
    }

    const group = map.get(row.employeeId);

    if (group) {
      group.items.push(row);

      if (row.daysRemaining !== null) {
        group.soonestDays = Math.min(group.soonestDays, row.daysRemaining);
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.soonestDays !== b.soonestDays) {
      return a.soonestDays - b.soonestDays;
    }

    return a.employeeName.localeCompare(b.employeeName);
  });
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ color: "#6B7280", fontSize: "14px" }}>{title}</div>
      <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "6px" }}>
        {value}
      </div>
    </div>
  );
}

function EmployeeComplianceCard({
  employee,
}: {
  employee: EmployeeComplianceGroup;
}) {
  const reviewCount = employee.items.filter(
    (item) => item.level === "review"
  ).length;

  const upcomingCount = employee.items.filter(
    (item) => item.level === "upcoming"
  ).length;

  const sortedItems = [...employee.items].sort((a, b) => {
    const aDays = a.daysRemaining ?? 999999;
    const bDays = b.daysRemaining ?? 999999;

    if (aDays !== bDays) return aDays - bDays;

    return a.item.localeCompare(b.item);
  });

  return (
    <div style={employeeCardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          alignItems: "flex-start",
        }}
      >
        <div>
          <a
            href={`/dashboard/employees/${employee.employeeId}`}
            style={{
              color: "#6E5084",
              fontWeight: 800,
              fontSize: "18px",
              textDecoration: "none",
            }}
          >
            {employee.employeeName}
          </a>

          <div style={{ color: "#6B7280", marginTop: "4px", fontSize: "14px" }}>
            {employee.items.length} outstanding item
            {employee.items.length === 1 ? "" : "s"}
          </div>
        </div>

        <a
          href={`/dashboard/employees/${employee.employeeId}`}
          style={openButtonStyle}
        >
          Open profile
        </a>
      </div>

      <div style={statusLineStyle}>
        {reviewCount > 0 && (
          <span style={badgeStyle("review")}>{reviewCount} review</span>
        )}

        {upcomingCount > 0 && (
          <span style={badgeStyle("upcoming")}>{upcomingCount} due soon</span>
        )}
      </div>

      <div style={itemsBoxStyle}>
        {sortedItems.map((item, index) => (
          <div key={`${item.category}-${item.item}-${index}`} style={itemRowStyle}>
            <span style={{ fontWeight: 700 }}>{item.item}</span>
            <span style={{ color: "#6B7280" }}> — {item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "22px",
};

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "18px",
};

const employeeCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "18px",
};

const okBoxStyle: React.CSSProperties = {
  background: "#F5FFF9",
  border: "1px solid #D1FAE5",
  borderRadius: "12px",
  padding: "16px",
  color: "#374151",
};

const searchStyle: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "12px 14px",
  marginBottom: "14px",
  fontSize: "14px",
  outline: "none",
};

const filterWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "22px",
};

function filterButtonStyle(active: boolean): React.CSSProperties {
  return {
    border: "1px solid #E5E7EB",
    background: active ? "#F3E8FF" : "#FFFFFF",
    color: active ? "#6E5084" : "#374151",
    borderRadius: "999px",
    padding: "8px 12px",
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
  };
}

const openButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  textDecoration: "none",
  borderRadius: "10px",
  padding: "8px 12px",
  fontWeight: 700,
  fontSize: "13px",
};

const statusLineStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "14px",
  marginBottom: "12px",
};

const itemsBoxStyle: React.CSSProperties = {
  background: "#FAFAFA",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "12px",
  display: "grid",
  gap: "8px",
};

const itemRowStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
};

function badgeStyle(level: ComplianceLevel): React.CSSProperties {
  return {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    background: level === "review" ? "#FFF7ED" : "#FFFBEB",
    color: level === "review" ? "#9A3412" : "#92400E",
    border: level === "review" ? "1px solid #FED7AA" : "1px solid #FDE68A",
  };
}