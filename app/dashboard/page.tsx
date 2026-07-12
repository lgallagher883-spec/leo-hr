"use client";

import { useRouter } from "next/navigation";
import { useMatters } from "./matters/MatterContext";
import { useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { matters } = useMatters();
  const [leoPrompt, setLeoPrompt] = useState("");

  const liveMatters = matters.filter((m) => m.status !== "Closed").length;
  const recentMatters = [...matters].slice(0, 5);

  function askLeo() {
    const prompt = leoPrompt.trim();

    if (prompt) {
      router.push(`/dashboard/ask-leo?prompt=${encodeURIComponent(prompt)}`);
      return;
    }

    router.push("/dashboard/ask-leo");
  }

  function formatDate(dateString?: string | null) {
    if (!dateString) return "Not recorded";

    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Welcome back</h1>

        <button
          onClick={() => router.push("/dashboard/matters/new")}
          style={primaryButtonStyle}
        >
          + New Matter
        </button>
      </div>

      <div style={askLeoCardStyle}>
        <div style={sparkleCircleStyle}>
          <span style={mainSparkleStyle}>✦</span>
          <span style={smallSparkleStyle}>✦</span>
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={askLeoTitleStyle}>Ask Leo</h2>

          <p style={askLeoTextStyle}>
            Ask Leo a general workplace query or create a new matter where Leo
            can guide and assist you through it.
          </p>

          <div style={promptRowStyle}>
            <input
              value={leoPrompt}
              onChange={(e) => setLeoPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") askLeo();
              }}
              placeholder="Ask Leo anything..."
              style={promptInputStyle}
            />

            <button onClick={askLeo} style={askLeoButtonStyle}>
              Ask Leo
            </button>
          </div>
        </div>
      </div>

      <div style={summaryGridStyle}>
        <button
          onClick={() => router.push("/dashboard/matters")}
          style={summaryCardStyle}
        >
          <div style={summaryLabelStyle}>Live Matters</div>
          <div style={summaryNumberStyle}>{liveMatters}</div>
        </button>

        <button
          onClick={() => router.push("/dashboard/compliance")}
          style={summaryCardStyle}
        >
          <div style={summaryLabelStyle}>Compliance Overview</div>
          <div style={summaryNumberStyle}>View</div>
        </button>
      </div>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Recent Activity</h2>

        {recentMatters.length === 0 ? (
          <div style={emptyStyle}>No recent activity yet.</div>
        ) : (
          <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
            {recentMatters.map((matter) => (
              <div
                key={matter.id}
                onClick={() => router.push(`/dashboard/matters/${matter.id}`)}
                style={matterRowStyle}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {matter.subject || matter.title}
                  </div>

                  <div style={{ color: "#6B7280", fontSize: "13px" }}>
                    {matter.matter_type || "General"} · Opened{" "}
                    {formatDate(matter.created_at)}
                  </div>
                </div>

                <div style={statusBadgeStyle}>
                  {matter.status === "Needs Attention"
                    ? "Needs Review"
                    : matter.status || "Open"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
  margin: 0,
  color: "#111827",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const askLeoCardStyle: React.CSSProperties = {
  display: "flex",
  gap: "26px",
  alignItems: "center",
  background: "#F7F1FC",
  border: "1px solid #E9D5FF",
  borderRadius: "20px",
  padding: "30px",
  marginBottom: "20px",
};

const sparkleCircleStyle: React.CSSProperties = {
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

const mainSparkleStyle: React.CSSProperties = {
  fontSize: "58px",
  lineHeight: 1,
  color: "#6E5084",
};

const smallSparkleStyle: React.CSSProperties = {
  position: "absolute",
  right: "20px",
  top: "20px",
  fontSize: "22px",
  color: "#6E5084",
};

const askLeoTitleStyle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
  color: "#6E5084",
  margin: "0 0 10px 0",
};

const askLeoTextStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: 1.5,
  maxWidth: "700px",
  marginBottom: "18px",
};

const promptRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  maxWidth: "700px",
};

const promptInputStyle: React.CSSProperties = {
  flex: 1,
  background: "#FFFFFF",
  border: "1px solid #D8B4FE",
  borderRadius: "12px",
  padding: "13px 14px",
  fontSize: "14px",
  outline: "none",
};

const askLeoButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "12px",
  padding: "0 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  marginBottom: "20px",
};

const summaryCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "22px",
  textAlign: "left",
  cursor: "pointer",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#111827",
  marginBottom: "10px",
};

const summaryNumberStyle: React.CSSProperties = {
  fontSize: "32px",
  fontWeight: 800,
  color: "#6E5084",
};

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "20px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 800,
  margin: 0,
  color: "#111827",
};

const matterRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  padding: "12px",
  border: "1px solid #F3F4F6",
  borderRadius: "12px",
  cursor: "pointer",
};

const statusBadgeStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: "999px",
  background: "#F7F1FC",
  color: "#6E5084",
  whiteSpace: "nowrap",
};

const emptyStyle: React.CSSProperties = {
  color: "#6B7280",
  padding: "10px 0",
};