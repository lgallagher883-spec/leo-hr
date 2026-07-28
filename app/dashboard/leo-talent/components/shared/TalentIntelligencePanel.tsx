"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type TalentStage =
  | "vacancies"
  | "applications"
  | "candidates"
  | "interviews"
  | "offers"
  | "due_diligence"
  | "onboarding";

type IntelligenceResponse = {
  success: boolean;
  intelligence?: {
    summary?: string;
    nextStep?: string;
    recommendations?: string[];
    risks?: string[];
    knowledge?: {
      sourceCount?: number;
    };
    grounding?: {
      foundationsCount?: number;
      organisationMemoryCount?: number;
    };
  };
  error?: string;
};

const panelStyle: CSSProperties = {
  border: "1px solid #E7DDED",
  borderRadius: 16,
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 12,
  boxShadow: "0 8px 24px rgba(65, 45, 75, 0.05)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#2F2435",
  fontSize: 16,
  fontWeight: 700,
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#665A6C",
  fontSize: 13,
  lineHeight: 1.6,
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const badgeStyle: CSSProperties = {
  border: "1px solid #DED2E7",
  borderRadius: 999,
  background: "#F8F4FB",
  color: "#5D4D66",
  padding: "4px 9px",
  fontSize: 11,
  fontWeight: 700,
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "#45394B",
  fontSize: 13,
  lineHeight: 1.5,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#352A3B",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

export default function TalentIntelligencePanel({ stage }: { stage: TalentStage }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IntelligenceResponse["intelligence"] | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/talent/intelligence?stage=${encodeURIComponent(stage)}`, {
          method: "GET",
          cache: "no-store",
        });

        const result = (await response.json().catch(() => null)) as IntelligenceResponse | null;

        if (!response.ok || !result?.success || !result.intelligence) {
          throw new Error(result?.error || "Leo intelligence is unavailable.");
        }

        if (!active) {
          return;
        }

        setData(result.intelligence);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setData(null);
        setError(loadError instanceof Error ? loadError.message : "Leo intelligence is unavailable.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [stage]);

  const recommendations = useMemo(() => data?.recommendations?.filter(Boolean).slice(0, 3) || [], [data]);
  const risks = useMemo(() => data?.risks?.filter(Boolean).slice(0, 2) || [], [data]);

  return (
    <section style={panelStyle} aria-live="polite">
      <h3 style={titleStyle}>Leo intelligence</h3>

      {loading ? <p style={textStyle}>Generating contextual guidance for this stage.</p> : null}

      {!loading && error ? <p style={textStyle}>{error}</p> : null}

      {!loading && !error && data ? (
        <>
          <p style={textStyle}>{data.summary || data.nextStep || "Leo intelligence is ready for this stage."}</p>

          <div style={badgeRowStyle}>
            <span style={badgeStyle}>Knowledge sources: {data.knowledge?.sourceCount ?? 0}</span>
            <span style={badgeStyle}>Foundations: {data.grounding?.foundationsCount ?? 0}</span>
            <span style={badgeStyle}>Organisation memory: {data.grounding?.organisationMemoryCount ?? 0}</span>
          </div>

          {recommendations.length > 0 ? (
            <div>
              <p style={sectionTitleStyle}>Recommended next steps</p>
              <ul style={listStyle}>
                {recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {risks.length > 0 ? (
            <div>
              <p style={sectionTitleStyle}>Watchpoints</p>
              <ul style={listStyle}>
                {risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
