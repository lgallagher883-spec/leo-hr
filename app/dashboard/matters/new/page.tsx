"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useMatters } from "../MatterContext";
import { recordAuditLog } from "../../../../lib/audit";

const supabase = createClient(
  process.env
    .NEXT_PUBLIC_SUPABASE_URL!,
  process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Employee = {
  id: number;
  name: string;
  role: string | null;
  status: string | null;
};

export default function NewMatterPage() {
  const router = useRouter();
  const { addMatter } =
    useMatters();

  const [
    matterType,
    setMatterType,
  ] = useState(
    "Disciplinary"
  );

  const [subject, setSubject] =
    useState("");

  const [
    matterLead,
    setMatterLead,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    employees,
    setEmployees,
  ] = useState<Employee[]>([]);

  const [
    employeeSearch,
    setEmployeeSearch,
  ] = useState("");

  const [
    selectedEmployee,
    setSelectedEmployee,
  ] =
    useState<Employee | null>(
      null
    );

  const [
    creating,
    setCreating,
  ] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      const { data, error } =
        await supabase
          .from("employees")
          .select(
            "id, name, role, status"
          )
          .neq(
            "status",
            "Archived"
          )
          .order("name", {
            ascending: true,
          });

      if (error) {
        console.error(
          "Error loading employees:",
          error
        );

        return;
      }

      setEmployees(
        (data ||
          []) as Employee[]
      );
    }

    loadEmployees();
  }, []);

  async function handleCreate() {
    if (creating) {
      return;
    }

    if (!selectedEmployee) {
      alert(
        "Please select an employee."
      );

      return;
    }

    if (!subject.trim()) {
      alert(
        "Please enter a subject."
      );

      return;
    }

    setCreating(true);

    const createdMatter =
      await addMatter({
        title:
          subject.trim(),
        subject:
          subject.trim(),
        matterType,
        matterLead:
          matterLead.trim(),
        description:
          description.trim(),
        employeeId:
          selectedEmployee.id,
      });

    if (!createdMatter) {
      setCreating(false);
      return;
    }

    router.push(
      `/dashboard/matters/${createdMatter.id}`
    );
  }

  const filteredEmployees =
    employees.filter(
      (employee) =>
        `${employee.name} ${
          employee.role || ""
        }`
          .toLowerCase()
          .includes(
            employeeSearch.toLowerCase()
          )
    );

  return (
    <div
      style={{
        maxWidth: "760px",
      }}
    >
      <h1
        style={{
          fontSize: "26px",
          fontWeight: 700,
        }}
      >
        Create New Matter
      </h1>

      <p
        style={{
          color: "#6B7280",
          marginBottom: "24px",
        }}
      >
        Create a structured HR
        Matter record.
      </p>

      <div style={cardStyle}>
        <div>
          <label
            style={labelStyle}
          >
            Employee
          </label>

          <input
            value={
              employeeSearch
            }
            onChange={(event) => {
              setEmployeeSearch(
                event.target.value
              );

              setSelectedEmployee(
                null
              );
            }}
            style={inputStyle}
            placeholder="Search employee name or role..."
          />

          {selectedEmployee && (
            <div
              style={
                selectedEmployeeStyle
              }
            >
              Selected:{" "}
              <strong>
                {
                  selectedEmployee.name
                }
              </strong>

              {selectedEmployee.role
                ? ` · ${selectedEmployee.role}`
                : ""}
            </div>
          )}

          {!selectedEmployee &&
            employeeSearch && (
              <div
                style={
                  employeeResultsStyle
                }
              >
                {filteredEmployees.length ===
                0 ? (
                  <div
                    style={{
                      color:
                        "#6B7280",
                      padding: "8px",
                    }}
                  >
                    No employees
                    found.
                  </div>
                ) : (
                  filteredEmployees.map(
                    (employee) => (
                      <button
                        key={
                          employee.id
                        }
                        type="button"
                        onClick={() => {
                          setSelectedEmployee(
                            employee
                          );

                          setEmployeeSearch(
                            employee.name
                          );
                        }}
                        style={
                          employeeResultButtonStyle
                        }
                      >
                        <strong>
                          {
                            employee.name
                          }
                        </strong>

                        <span
                          style={{
                            color:
                              "#6B7280",
                          }}
                        >
                          {employee.role
                            ? ` · ${employee.role}`
                            : " · No role"}
                        </span>
                      </button>
                    )
                  )
                )}
              </div>
            )}
        </div>

        <div>
          <label
            style={labelStyle}
          >
            Matter Type
          </label>

          <select
            value={matterType}
            onChange={(event) =>
              setMatterType(
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="Disciplinary">
              Disciplinary
            </option>

            <option value="Grievance">
              Grievance
            </option>

            <option value="Absence">
              Absence
            </option>

            <option value="Capability">
              Capability
            </option>

            <option value="Performance">
              Performance
            </option>

            <option value="Flexible Working">
              Flexible Working
            </option>

            <option value="Redundancy">
              Redundancy
            </option>

            <option value="Conduct">
              Conduct
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <div>
          <label
            style={labelStyle}
          >
            Subject
          </label>

          <input
            value={subject}
            onChange={(event) =>
              setSubject(
                event.target.value
              )
            }
            style={inputStyle}
            placeholder="e.g. Intoxicated at work"
          />
        </div>

        <div>
          <label
            style={labelStyle}
          >
            Matter Lead
          </label>

          <input
            value={matterLead}
            onChange={(event) =>
              setMatterLead(
                event.target.value
              )
            }
            style={inputStyle}
            placeholder="e.g. Lindsay Gallagher"
          />
        </div>

        <div>
          <label
            style={labelStyle}
          >
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            rows={5}
            style={{
              ...inputStyle,
              resize: "none",
              fontFamily:
                "inherit",
            }}
            placeholder="Add factual background or initial notes..."
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/matters"
              )
            }
            disabled={creating}
            style={cancelButtonStyle}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            style={{
              ...createButtonStyle,
              opacity: creating
                ? 0.65
                : 1,
              cursor: creating
                ? "not-allowed"
                : "pointer",
            }}
          >
            {creating
              ? "Creating..."
              : "Create Matter"}
          </button>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border:
    "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  borderRadius: "10px",
  border:
    "1px solid #e5e7eb",
  boxSizing: "border-box",
};

const selectedEmployeeStyle: React.CSSProperties = {
  marginTop: "8px",
  background: "#F7F1FC",
  border:
    "1px solid #E9D5FF",
  color: "#6E5084",
  padding: "10px",
  borderRadius: "10px",
  fontSize: "14px",
};

const employeeResultsStyle: React.CSSProperties = {
  marginTop: "8px",
  border:
    "1px solid #e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
  background: "#fff",
};

const employeeResultButtonStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  display: "block",
  padding: "10px",
  border: "none",
  borderBottom:
    "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
};

const cancelButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border:
    "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
};

const createButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#6E5084",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};