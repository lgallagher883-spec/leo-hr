"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [saving, setSaving] = useState(false);

  async function saveEmployee() {
    if (!name.trim()) {
      alert("Please enter the employee name.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("employees").insert([
      {
        name,
        role,
        email,
        start_date: startDate || null,
        status,
      },
    ]);

    setSaving(false);

    if (error) {
  console.error("Error saving employee:", JSON.stringify(error, null, 2));
  alert(`Employee could not be saved: ${error.message || "Unknown error"}`);
  return;
}

    router.push("/dashboard/employees");
  }

  return (
    <div style={{ maxWidth: "700px" }}>
      <button onClick={() => router.push("/dashboard/employees")} style={backStyle}>
        ← All employees
      </button>

      <h1 style={{ margin: 0 }}>Add employee</h1>
      <p style={{ color: "#6B7280", marginTop: "8px" }}>
        Create a staff record so Matters and documents can be linked to this employee.
      </p>

      <div style={cardStyle}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Employee name" style={inputStyle} />

        <label>Role</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Job role" style={inputStyle} />

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" style={inputStyle} />

        <label>Start date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, maxWidth: "220px" }} />

        <label>Employment status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, maxWidth: "260px", background: "#fff" }}>
          <option>Active</option>
          <option>Former</option>
        </select>

        <button onClick={saveEmployee} disabled={saving} style={saveButtonStyle}>
          {saving ? "Saving..." : "Save employee"}
        </button>
      </div>
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

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  marginTop: "20px",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  marginTop: "5px",
  marginBottom: "14px",
};

const saveButtonStyle: React.CSSProperties = {
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
  marginTop: "10px",
};