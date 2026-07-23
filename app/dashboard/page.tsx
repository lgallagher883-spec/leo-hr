"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useMatters } from "./matters/MatterContext";

export default function DashboardPage() {
  const router = useRouter();
  const { matters } = useMatters();

  const [leoPrompt, setLeoPrompt] = useState("");
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);

  const liveMatters = matters.filter(
    (matter) => matter.status?.toLowerCase() !== "closed",
  ).length;

  useEffect(() => {
    let active = true;

    async function loadDashboardDetails() {
      const supabase = createClient();

      const [
        {
          data: { user },
        },
        employeeResult,
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .neq("status", "Archived"),
      ]);

      if (!active) return;

      const displayName =
  user?.user_metadata?.display_name ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.user_metadata?.first_name ||
  user?.email?.split("@")[0] ||
  null;

      if (displayName) {
        const rawFirstName = displayName.trim().split(/\s+/)[0];

setFirstName(
  rawFirstName.charAt(0).toUpperCase() +
    rawFirstName.slice(1).toLowerCase(),
);
      }

      if (employeeResult.error) {
        console.error(
          "LEO dashboard could not load the employee count:",
          employeeResult.error,
        );
        setEmployeeCount(null);
        return;
      }

      setEmployeeCount(employeeResult.count ?? 0);
    }

    void loadDashboardDetails();

    return () => {
      active = false;
    };
  }, []);

  function askLeo() {
    const prompt = leoPrompt.trim();

    if (prompt) {
      router.push(`/dashboard/ask-leo?prompt=${encodeURIComponent(prompt)}`);
      return;
    }

    router.push("/dashboard/ask-leo");
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            Welcome back{firstName ? `, ${firstName}` : ""}
          </h1>

          <p style={welcomeTextStyle}>
            What would you like to do today?
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/matters/new")}
          style={primaryButtonStyle}
        >
          + New Matter
        </button>
      </header>

      <section style={askLeoCardStyle} aria-labelledby="ask-leo-heading">
        <div style={sparkleCircleStyle} aria-hidden="true">
          <span style={mainSparkleStyle}>✦</span>
          <span style={smallSparkleStyle}>✦</span>
        </div>

        <div style={askLeoContentStyle}>
          <h2 id="ask-leo-heading" style={askLeoTitleStyle}>
            Ask Leo
          </h2>

          <p style={askLeoTextStyle}>
            Ask Leo a general workplace query or create a new matter where Leo
            can guide and assist you through it.
          </p>

          <div style={promptRowStyle}>
            <input
              value={leoPrompt}
              onChange={(event) => setLeoPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") askLeo();
              }}
              placeholder="Ask Leo anything..."
              style={promptInputStyle}
              aria-label="Ask Leo a question"
            />

            <button
              type="button"
              onClick={askLeo}
              style={askLeoButtonStyle}
            >
              Ask Leo
            </button>
          </div>
        </div>
      </section>

      <section style={summaryGridStyle} aria-label="Dashboard shortcuts">
        <DashboardCard
          label="Employees"
          value={employeeCount === null ? "—" : employeeCount}
          actionLabel="View Employees"
          onClick={() => router.push("/dashboard/employees")}
        />

        <DashboardCard
          label="Live Matters"
          value={liveMatters}
          actionLabel="View Matters"
          onClick={() => router.push("/dashboard/matters")}
        />

        <DashboardCard
          label="Recent Conversations"
          value="View"
          actionLabel="View Conversations"
          onClick={() => router.push("/dashboard/leo-conversations")}
        />
      </section>
    </main>
  );
}

function DashboardCard({
  label,
  value,
  actionLabel,
  onClick,
}: {
  label: string;
  value: number | string;
  actionLabel: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        ...summaryCardStyle,
        ...(hovered ? summaryCardHoverStyle : {}),
      }}
      aria-label={actionLabel}
    >
      <span style={summaryLabelStyle}>{label}</span>

      <span
        style={{
          ...summaryNumberStyle,
          ...(typeof value === "string" && value === "View"
            ? summaryWordStyle
            : {}),
        }}
      >
        {value}
      </span>

      <span style={summaryActionStyle}>
        {actionLabel}
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

const pageStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  fontSize: "30px",
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  margin: 0,
  color: "#6E5084",
};

const welcomeTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "15px",
  lineHeight: 1.5,
};

const primaryButtonStyle: CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  borderWidth: "1px",
borderStyle: "solid",
borderColor: "#E5E7EB",
  padding: "11px 16px",
  borderRadius: "11px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(110, 80, 132, 0.16)",
};

const askLeoCardStyle: CSSProperties = {
  display: "flex",
  gap: "26px",
  alignItems: "center",
  background: "#F7F1FC",
  border: "1px solid #E9D5FF",
  borderRadius: "20px",
  padding: "30px",
  marginBottom: "24px",
  boxShadow: "0 10px 28px rgba(110, 80, 132, 0.07)",
  flexWrap: "wrap",
};

const askLeoContentStyle: CSSProperties = {
  flex: "1 1 520px",
  minWidth: 0,
};

const sparkleCircleStyle: CSSProperties = {
  position: "relative",
  width: "96px",
  height: "96px",
  minWidth: "96px",
  borderRadius: "999px",
  background: "#F5FFF9",
  color: "#6E5084",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 10px 24px rgba(110, 80, 132, 0.12)",
};

const mainSparkleStyle: CSSProperties = {
  fontSize: "58px",
  lineHeight: 1,
  color: "#6E5084",
};

const smallSparkleStyle: CSSProperties = {
  position: "absolute",
  right: "20px",
  top: "20px",
  fontSize: "22px",
  color: "#6E5084",
};

const askLeoTitleStyle: CSSProperties = {
  fontSize: "30px",
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "#6E5084",
  margin: "0 0 10px",
};

const askLeoTextStyle: CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: 1.55,
  maxWidth: "700px",
  margin: "0 0 18px",
};

const promptRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  maxWidth: "700px",
  flexWrap: "wrap",
};

const promptInputStyle: CSSProperties = {
  flex: "1 1 320px",
  minWidth: 0,
  background: "#FFFFFF",
  border: "1px solid #D8B4FE",
  borderRadius: "12px",
  padding: "13px 14px",
  fontSize: "14px",
  color: "#111827",
  outline: "none",
};

const askLeoButtonStyle: CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "1px solid #6E5084",
  borderRadius: "12px",
  padding: "12px 19px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "20px",
};

const summaryCardStyle: CSSProperties = {
  width: "100%",
  minHeight: "210px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  background: "#FFFFFF",
  borderWidth: "1px",
borderStyle: "solid",
borderColor: "#E5E7EB",
  borderRadius: "18px",
  padding: "24px",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
};

const summaryCardHoverStyle: CSSProperties = {
  transform: "translateY(-2px)",
  borderColor: "#CDB2E2",
  boxShadow: "0 12px 28px rgba(110, 80, 132, 0.12)",
};

const summaryLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "17px",
  lineHeight: 1.35,
  fontWeight: 700,
  color: "#111827",
};

const summaryNumberStyle: CSSProperties = {
  display: "block",
  fontSize: "44px",
  lineHeight: 1,
  fontWeight: 700,
  letterSpacing: "-0.03em",
  color: "#6E5084",
};

const summaryWordStyle: CSSProperties = {
  fontSize: "32px",
};

const summaryActionStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  paddingTop: "16px",
  borderTop: "1px solid #F0EAF4",
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 700,
};