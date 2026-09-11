"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HeartPulse,
  PlugZap,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

type HealthPayload = {
  success: boolean;
  checkedAt: string;
  overallStatus: "Healthy" | "Attention";
  deployment: {
    environment: string;
    commitSha: string | null;
    region: string | null;
  };
  checks: {
    database: {
      status: string;
      error: string | null;
    };
    platformValidation: {
      status: string;
      latest: Record<string, unknown> | null;
      error: string | null;
    };
    securityAlerts: {
      status: string;
      openCount: number;
      highOrCriticalCount: number;
      recent: Array<{
        id: string;
        severity: string | null;
        status: string | null;
        title: string | null;
        last_detected_at: string | null;
        occurrence_count: number | null;
      }>;
      error: string | null;
    };
    connectionHealth: {
      status: string;
      issueCount: number;
      recent: Array<{
        id: string;
        health_status: string | null;
        check_type: string | null;
        error_code: string | null;
        error_summary: string | null;
        checked_at: string | null;
      }>;
      error: string | null;
    };
  };
};

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/platform-admin/system-health", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "System health could not be loaded.");
      }

      setData(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "System health could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const healthy = data?.overallStatus === "Healthy";

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 40 }}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Platform Administration</div>
          <h1 style={titleStyle}>System Health</h1>
          <p style={subtitleStyle}>
            Read-only production checks for Leo&apos;s database, security,
            validation and connected-service health.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard/platform-admin" style={secondaryButtonStyle}>
            Back
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            style={primaryButtonStyle}
          >
            <RefreshCw size={15} />
            {loading ? "Checking..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div style={errorStyle} role="alert">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <section
            style={{
              ...summaryStyle,
              borderColor: healthy ? "#B9DFCF" : "#E8C8A6",
              background: healthy ? "#F5FFF9" : "#FFF9F1",
            }}
          >
            {healthy ? (
              <CheckCircle2 size={28} color="#2F7B5C" />
            ) : (
              <AlertTriangle size={28} color="#9B651C" />
            )}

            <div>
              <div style={{ fontWeight: 850, fontSize: 18 }}>
                {healthy
                  ? "Leo production checks are healthy"
                  : "Leo needs attention"}
              </div>
              <div style={metaStyle}>
                Checked {formatDate(data.checkedAt)}
                {data.deployment.commitSha
                  ? ` · commit ${data.deployment.commitSha.slice(0, 10)}`
                  : ""}
                {data.deployment.region
                  ? ` · ${data.deployment.region}`
                  : ""}
              </div>
            </div>
          </section>

          <section style={gridStyle}>
            <HealthCard
              icon={<Database size={20} />}
              title="Database"
              status={data.checks.database.status}
              detail={
                data.checks.database.error ||
                "Supabase database query completed successfully."
              }
            />
            <HealthCard
              icon={<HeartPulse size={20} />}
              title="Platform validation"
              status={data.checks.platformValidation.status}
              detail={validationDetail(data.checks.platformValidation.latest)}
            />
            <HealthCard
              icon={<ShieldAlert size={20} />}
              title="Security alerts"
              status={data.checks.securityAlerts.status}
              detail={
                data.checks.securityAlerts.highOrCriticalCount > 0
                  ? `${data.checks.securityAlerts.highOrCriticalCount} high/critical open alert(s).`
                  : `${data.checks.securityAlerts.openCount} open alert(s); none high/critical.`
              }
            />
            <HealthCard
              icon={<PlugZap size={20} />}
              title="Connections"
              status={data.checks.connectionHealth.status}
              detail={
                data.checks.connectionHealth.issueCount > 0
                  ? `${data.checks.connectionHealth.issueCount} recent connection health issue(s).`
                  : "No recent failed/degraded connection checks."
              }
            />
          </section>

          {(data.checks.securityAlerts.recent.length > 0 ||
            data.checks.connectionHealth.recent.length > 0) && (
            <section style={detailCardStyle}>
              <h2 style={sectionTitleStyle}>Items requiring review</h2>

              {data.checks.securityAlerts.recent.map((alert) => (
                <div key={alert.id} style={rowStyle}>
                  <strong>
                    {alert.title || "Security alert"}
                  </strong>
                  <span style={metaStyle}>
                    {alert.severity || "Unknown severity"} ·{" "}
                    {alert.last_detected_at
                      ? formatDate(alert.last_detected_at)
                      : "No timestamp"}
                  </span>
                </div>
              ))}

              {data.checks.connectionHealth.recent.map((issue) => (
                <div key={issue.id} style={rowStyle}>
                  <strong>
                    {issue.error_summary ||
                      issue.check_type ||
                      "Connection health issue"}
                  </strong>
                  <span style={metaStyle}>
                    {issue.health_status || "Unknown status"}
                    {issue.error_code ? ` · ${issue.error_code}` : ""}
                    {issue.checked_at
                      ? ` · ${formatDate(issue.checked_at)}`
                      : ""}
                  </span>
                </div>
              ))}
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}

function HealthCard({
  icon,
  title,
  status,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  status: string;
  detail: string;
}) {
  const healthy = status === "Healthy";

  return (
    <article style={cardStyle}>
      <div style={iconStyle}>{icon}</div>
      <div style={{ marginTop: 14, fontWeight: 850 }}>{title}</div>
      <div
        style={{
          marginTop: 8,
          display: "inline-flex",
          padding: "4px 8px",
          borderRadius: 999,
          background: healthy ? "#E9F8F0" : "#FFF1DF",
          color: healthy ? "#2F7B5C" : "#946019",
          fontSize: 12,
          fontWeight: 850,
        }}
      >
        {status}
      </div>
      <p style={{ margin: "10px 0 0", color: "#6D6472", lineHeight: 1.55 }}>
        {detail}
      </p>
    </article>
  );
}

function validationDetail(latest: Record<string, unknown> | null) {
  if (!latest) return "No platform validation run has been recorded yet.";

  const failed = Number(latest.failed_checks ?? 0);
  const critical = Number(latest.critical_failures ?? 0);
  const passed = Number(latest.passed_checks ?? 0);

  return `${passed} passed · ${failed} failed · ${critical} critical.`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  flexWrap: "wrap" as const,
  alignItems: "flex-start",
  marginBottom: 20,
};

const eyebrowStyle = {
  color: "#6E5084",
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: ".08em",
  textTransform: "uppercase" as const,
};

const titleStyle = {
  margin: "7px 0 5px",
  fontSize: 32,
  color: "#2F2635",
};

const subtitleStyle = {
  margin: 0,
  color: "#6D6472",
  lineHeight: 1.6,
};

const summaryStyle = {
  display: "flex",
  gap: 14,
  alignItems: "center",
  padding: 18,
  border: "1px solid",
  borderRadius: 16,
  marginBottom: 18,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const cardStyle = {
  padding: 18,
  border: "1px solid #E8E2EB",
  borderRadius: 16,
  background: "#FFFFFF",
};

const iconStyle = {
  width: 38,
  height: 38,
  borderRadius: 11,
  display: "grid",
  placeItems: "center",
  background: "#F0DFFD",
  color: "#6E5084",
};

const detailCardStyle = {
  marginTop: 18,
  padding: 18,
  border: "1px solid #E8E2EB",
  borderRadius: 16,
  background: "#FFFFFF",
};

const sectionTitleStyle = {
  margin: "0 0 12px",
  fontSize: 18,
};

const rowStyle = {
  display: "grid",
  gap: 4,
  padding: "11px 0",
  borderTop: "1px solid #F0EBF2",
};

const metaStyle = {
  color: "#817786",
  fontSize: 12,
};

const primaryButtonStyle = {
  minHeight: 40,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  border: 0,
  borderRadius: 10,
  padding: "0 13px",
  background: "#6E5084",
  color: "#FFFFFF",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight: 40,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 13px",
  borderRadius: 10,
  border: "1px solid #DDD2E3",
  color: "#5E4A69",
  fontWeight: 800,
  textDecoration: "none",
  background: "#FFFFFF",
};

const errorStyle = {
  marginBottom: 16,
  padding: 13,
  border: "1px solid #E7B9BF",
  borderRadius: 12,
  background: "#FFF4F5",
  color: "#8C2F3D",
};
