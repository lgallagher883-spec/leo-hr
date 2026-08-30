// Leo HR employee DBS page.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import mobileStyles from "../MyEmployment.module.css";

type DbsRecord = Record<string, unknown>;

function textValue(record: DbsRecord | null, key: string, fallback = "Not recorded") {
  if (!record) return fallback;
  const value = record[key];
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "Not recorded";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function DbsSafeguardingPage() {
  const [record, setRecord] = useState<DbsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadDbs() {
      try {
        const response = await fetch("/api/my-employment/dbs-safeguarding", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const result = (await response.json().catch(() => null)) as
          | { success?: boolean; dbs?: DbsRecord | null; error?: string }
          | null;
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Your DBS information could not be loaded.");
        }
        if (active) setRecord(result.dbs ?? null);
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Your DBS information could not be loaded.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDbs();
    return () => { active = false; };
  }, []);

  const rows = useMemo(() => [
    ["DBS status", record ? (textValue(record, "dbs_required") === "Yes" ? "Required" : "Not required") : "No DBS recorded"],
    ["DBS level", textValue(record, "dbs_level")],
    ["Certificate number", textValue(record, "certificate_number")],
    ["Issue date", formatDate(record?.certificate_issue_date)],
    ["Next check", formatDate(record?.next_check_due)],
    ["Update Service", textValue(record, "update_service")],
    ["Safeguarding training", formatDate(record?.safeguarding_training_expiry)],
  ], [record]);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto" }}>
      <p className={mobileStyles.employeeMobileHide} style={{ color: "#6E5084", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>
        Employee workspace
      </p>

      <h1 className={mobileStyles.employeeDesktopTitle} style={{ fontSize: 32, color: "#6E5084", margin: "8px 0" }}>
        DBS &amp; Safeguarding
      </h1>

      <h1 className={mobileStyles.employeeMobileTitle} style={{ fontSize: 32, color: "#6E5084", margin: "8px 0 20px" }}>
        DBS
      </h1>

      <p className={mobileStyles.employeeMobileHide} style={{ color: "#64748B", marginBottom: 24 }}>
        Review the DBS and safeguarding records currently held for your employment.
      </p>

      {loading ? (
        <section style={messageStyle}>Loading your DBS information...</section>
      ) : loadError ? (
        <section style={{ ...messageStyle, color: "#8F3B3B" }}>{loadError}</section>
      ) : (
        <section style={cardStyle}>
          <h2 style={{ margin: "0 0 14px", fontSize: 18, color: "#2F2635" }}>Compliance details</h2>
          {rows.map(([label, value]) => (
            <div key={label} className={mobileStyles.employeeDataRow} style={rowStyle}>
              <span style={{ color: "#64748B", fontWeight: 700 }}>{label}</span>
              <span className={mobileStyles.employeeDataValue} style={valueStyle}>{value}</span>
            </div>
          ))}
        </section>
      )}

      <div style={{ marginTop: 24 }}>
        <Link className={mobileStyles.mobileBackLink} href="/dashboard/my-employment" style={backStyle}>
          ← Back to My Employment
        </Link>
      </div>
    </main>
  );
}

const cardStyle = { background: "#FFFFFF", border: "1px solid #E8E2EB", borderRadius: 18, padding: 22, boxShadow: "0 8px 22px rgba(17,24,39,.05)" } as const;
const rowStyle = { display: "flex", justifyContent: "space-between", gap: 20, padding: "14px 0", borderBottom: "1px solid #F0EDF2" } as const;
const valueStyle = { color: "#2F2635", fontWeight: 600, textAlign: "right" } as const;
const messageStyle = { ...cardStyle, color: "#64748B" } as const;
const backStyle = { textDecoration: "none", color: "#6E5084", border: "1px solid #CDB2E2", borderRadius: 10, padding: "10px 16px", display: "inline-block", fontWeight: 700 } as const;
