"use client";

import EmploymentDetails from "./components/EmploymentDetails";
import EmployeeNotes from "./components/EmployeeNotes";
import EmergencyContacts from "./components/EmergencyContacts";
import EmployeeWarnings from "./components/EmployeeWarnings";
import LeaveAbsence from "./components/LeaveAbsence";
import EmployeeMedical from "./components/EmployeeMedical";
import RightToWork from "./components/RightToWork";
import DBSSafeguarding from "./components/DBSSafeguarding";
import DrivingChecks from "./components/DrivingChecks";
import EmployeeDocuments from "./components/EmployeeDocuments";
import EmployeeMatters from "./components/EmployeeMatters";
import TrainingLogs from "./components/TrainingLogs";
import ComplianceSummary from "./components/ComplianceSummary";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import EmployeeDevelopment from "./components/EmployeeDevelopment";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Employee = {
  id: number;
  name: string;
  role: string | null;
  email: string | null;
  status: string | null;
  start_date: string | null;
};

type ProfileSection =
  | "Overview"
  | "Compliance Summary"
  | "Employment"
  | "Development"
  | "Notes"
  | "Matters"
  | "Leave & Absence"
  | "Warnings"
  | "Emergency Contacts"
  | "Right to Work"
  | "DBS / Safeguarding"
  | "Driving"
  | "Medical"
  | "Training Logs"
  | "Documents"
  | "Archive";

const sections: ProfileSection[] = [
  "Overview",
  "Compliance Summary",
  "Employment",
  "Development",
  "Notes",
  "Matters",
  "Leave & Absence",
  "Warnings",
  "Emergency Contacts",
  "Right to Work",
  "DBS / Safeguarding",
  "Driving",
  "Medical",
  "Training Logs",
  "Documents",
  "Archive",
];

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("Overview");
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  useEffect(() => {
    async function loadEmployee() {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, role, email, status, start_date")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Error loading employee:", error);
        setLoading(false);
        return;
      }

      setEmployee(data);
      setLoading(false);
    }

    loadEmployee();
  }, [params.id]);

  async function archiveEmployee() {
    if (!employee) return;

    const confirmed = window.confirm(
      `Are you sure you want to archive ${employee.name}? This will remove them from the active employee list but keep their profile record.`
    );

    if (!confirmed) return;

    setArchiving(true);
    setArchiveError("");

    const { error } = await supabase
      .from("employees")
      .update({ status: "Archived" })
      .eq("id", employee.id);

    if (error) {
      console.error("Error archiving employee:", error);
      setArchiveError("Employee could not be archived.");
      setArchiving(false);
      return;
    }

    router.push("/dashboard/employees");
    router.refresh();
  }

  if (loading) return <div>Loading employee...</div>;
  if (!employee) return <div>Employee not found.</div>;

  return (
    <div style={{ maxWidth: "1200px", width: "100%" }}>
      <button
        onClick={() => router.push("/dashboard/employees")}
        style={backStyle}
      >
        ← All employees
      </button>

      <div style={headerStyle}>
        <h1 style={{ margin: 0 }}>{employee.name}</h1>

        <p style={{ color: "#6B7280", marginTop: "8px" }}>
          {employee.role || "No role"} · {employee.status || "Active"} ·
          started {employee.start_date || "Not set"}
        </p>
      </div>

      <div style={layoutStyle}>
        <aside style={navStyle}>
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              style={
                activeSection === section
                  ? activeNavButtonStyle
                  : navButtonStyle
              }
            >
              {section}
            </button>
          ))}
        </aside>

        <main style={mainStyle}>
          {activeSection === "Overview" && (
  <>
    <ComplianceSummary employeeId={employee.id} />

    <Panel title="Overview">
      <Info label="Name" value={employee.name} />
      <Info label="Role" value={employee.role || "Not set"} />
      <Info label="Status" value={employee.status || "Active"} />
      <Info
        label="Start Date"
        value={employee.start_date || "Not set"}
      />
      <Info label="Linked Matters" value="See Matters tab" />
    </Panel>
  </>
)}

          {activeSection === "Compliance Summary" && (
            <ComplianceSummary employeeId={employee.id} />
          )}

          {activeSection === "Employment" && (
            <EmploymentDetails
              employeeId={employee.id}
              initialName={employee.name || ""}
              initialEmail={employee.email || ""}
              initialRole={employee.role || ""}
              initialStatus={employee.status || "Active"}
              initialStartDate={employee.start_date || ""}
            />
          )}
{activeSection === "Development" && (
  <EmployeeDevelopment employeeId={employee.id} />
)}

          {activeSection === "Notes" && (
            <EmployeeNotes employeeId={employee.id} />
          )}

          {activeSection === "Matters" && (
            <EmployeeMatters employeeId={employee.id} />
          )}

          {activeSection === "Emergency Contacts" && (
            <EmergencyContacts employeeId={employee.id} />
          )}

          {activeSection === "Warnings" && (
            <EmployeeWarnings employeeId={employee.id} />
          )}

          {activeSection === "Leave & Absence" && (
            <LeaveAbsence employeeId={employee.id} />
          )}

          {activeSection === "Medical" && (
            <EmployeeMedical employeeId={employee.id} />
          )}

          {activeSection === "Training Logs" && (
            <TrainingLogs employeeId={employee.id} />
          )}

          {activeSection === "Right to Work" && (
            <RightToWork employeeId={employee.id} />
          )}

          {activeSection === "DBS / Safeguarding" && (
            <DBSSafeguarding employeeId={employee.id} />
          )}

          {activeSection === "Driving" && (
            <DrivingChecks employeeId={employee.id} />
          )}

          {activeSection === "Documents" && (
            <EmployeeDocuments employeeId={employee.id} />
          )}

          {activeSection === "Archive" && (
            <Panel title="Archive Employee">
              <p style={{ color: "#6B7280", fontSize: "14px" }}>
                Archiving keeps this employee record for audit and history, but
                removes them from active use.
              </p>

              {archiveError && <div style={errorStyle}>{archiveError}</div>}

              <button
                onClick={archiveEmployee}
                disabled={archiving}
                style={archiveButtonStyle}
              >
                {archiving ? "Archiving..." : "Archive employee"}
              </button>
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "13px", color: "#6B7280" }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const backStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#6B7280",
  marginBottom: "16px",
};

const headerStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
  marginBottom: "18px",
};

const layoutStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  gap: "18px",
  alignItems: "start",
};

const navStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "12px",
  display: "grid",
  gap: "6px",
};

const navButtonStyle: React.CSSProperties = {
  textAlign: "left",
  background: "transparent",
  border: "none",
  padding: "10px 12px",
  borderRadius: "10px",
  cursor: "pointer",
  color: "#374151",
  fontWeight: 600,
};

const activeNavButtonStyle: React.CSSProperties = {
  ...navButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
};

const mainStyle: React.CSSProperties = {
  minWidth: 0,
};

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
};

const errorStyle: React.CSSProperties = {
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "12px",
};

const archiveButtonStyle: React.CSSProperties = {
  background: "#B91C1C",
  color: "#fff",
  border: "none",
  padding: "7px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
};