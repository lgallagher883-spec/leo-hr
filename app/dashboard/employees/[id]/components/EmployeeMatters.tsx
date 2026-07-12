"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProfileSection from "./ProfileSection";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type EmployeeMattersProps = {
  employeeId: number;
};

type Matter = {
  id: number;
  title: string;
  status: string | null;
  description: string | null;
  created_at: string | null;
};

export default function EmployeeMatters({ employeeId }: EmployeeMattersProps) {
  const router = useRouter();

  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatters() {
      const { data, error } = await supabase
        .from("matters")
        .select("id, title, status, description, created_at")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading linked matters:", error);
        setLoading(false);
        return;
      }

      setMatters(data || []);
      setLoading(false);
    }

    loadMatters();
  }, [employeeId]);

  return (
    <ProfileSection title="Matters">
      <p style={{ color: "#6B7280", fontSize: "14px", marginTop: 0 }}>
        HR matters linked to this employee will appear here.
      </p>

      {loading ? (
        <div style={{ color: "#6B7280" }}>Loading linked matters...</div>
      ) : matters.length === 0 ? (
        <div style={emptyStyle}>No matters linked to this employee yet.</div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {matters.map((matter) => (
            <div
              key={matter.id}
              onClick={() => router.push(`/dashboard/matters/${matter.id}`)}
              style={cardStyle}
            >
              <div style={{ fontWeight: 800 }}>{matter.title}</div>

              <div style={{ color: "#6B7280", fontSize: "13px", marginTop: "4px" }}>
                {matter.status || "Open"}
              </div>

              {matter.description && (
                <div style={{ marginTop: "8px", color: "#374151" }}>
                  {matter.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ProfileSection>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  background: "#F9FAFB",
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px",
  background: "#F9FAFB",
  color: "#6B7280",
};