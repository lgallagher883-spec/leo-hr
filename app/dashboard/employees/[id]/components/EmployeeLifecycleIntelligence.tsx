"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type LifecycleContext =
  | "employment"
  | "probation"
  | "absence"
  | "development"
  | "compliance"
  | "documents"
  | "employee_relations";

type InsightPayload = {
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

type DraftPayload = {
  success: boolean;
  draft?: {
    title: string;
    content: string;
    summary: string;
    rationale: string[];
    documentType: string;
  };
  error?: string;
};

type Props = {
  employeeId: number;
  lifecycleContext: LifecycleContext;
  defaultPrompt: string;
};

export default function EmployeeLifecycleIntelligence({
  employeeId,
  lifecycleContext,
  defaultPrompt,
}: Props) {
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState("");
  const [insight, setInsight] = useState<InsightPayload["intelligence"] | null>(null);

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [draftResult, setDraftResult] = useState<DraftPayload["draft"] | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInsight() {
      setInsightLoading(true);
      setInsightError("");

      try {
        const response = await fetch(
          `/api/employees/${employeeId}/insight?context=${encodeURIComponent(lifecycleContext)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const result = (await response.json().catch(() => null)) as InsightPayload | null;

        if (!response.ok || !result?.success || !result.intelligence) {
          throw new Error(result?.error || "Leo insight is unavailable for this section.");
        }

        if (!active) {
          return;
        }

        setInsight(result.intelligence);
      } catch (error) {
        if (!active) {
          return;
        }

        setInsight(null);
        setInsightError(error instanceof Error ? error.message : "Leo insight is unavailable for this section.");
      } finally {
        if (active) {
          setInsightLoading(false);
        }
      }
    }

    void loadInsight();

    return () => {
      active = false;
    };
  }, [employeeId, lifecycleContext]);

  async function generateDraft() {
    if (!prompt.trim() || draftLoading) {
      return;
    }

    setDraftLoading(true);
    setDraftError("");

    try {
      const response = await fetch(`/api/employees/${employeeId}/draft`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: lifecycleContext,
          prompt: prompt.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as DraftPayload | null;

      if (!response.ok || !result?.success || !result.draft) {
        throw new Error(result?.error || "The draft could not be generated.");
      }

      setDraftResult(result.draft);
    } catch (error) {
      setDraftResult(null);
      setDraftError(error instanceof Error ? error.message : "The draft could not be generated.");
    } finally {
      setDraftLoading(false);
    }
  }

  const recommendations = useMemo(
    () => insight?.recommendations?.filter(Boolean).slice(0, 3) || [],
    [insight],
  );

  const risks = useMemo(
    () => insight?.risks?.filter(Boolean).slice(0, 2) || [],
    [insight],
  );

  return (
    <div style={panelStyle}>
      <h4 style={titleStyle}>Leo Draft and Insight</h4>

      <p style={descriptionStyle}>
        Contextual guidance and draft support for this employee lifecycle section.
      </p>

      {insightLoading ? <p style={textStyle}>Generating section insight.</p> : null}

      {!insightLoading && insightError ? <p style={textStyle}>{insightError}</p> : null}

      {!insightLoading && !insightError && insight ? (
        <div style={insightPanelStyle}>
          <p style={textStyle}>{insight.summary || insight.nextStep || "Leo insight is ready."}</p>

          <div style={badgeRowStyle}>
            <span style={badgeStyle}>Knowledge sources: {insight.knowledge?.sourceCount ?? 0}</span>
            <span style={badgeStyle}>Foundations: {insight.grounding?.foundationsCount ?? 0}</span>
            <span style={badgeStyle}>Organisation memory: {insight.grounding?.organisationMemoryCount ?? 0}</span>
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
        </div>
      ) : null}

      <div style={draftPanelStyle}>
        <label style={fieldLabelStyle}>Draft prompt</label>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          style={textareaStyle}
          placeholder="Describe what Leo should draft for this section."
        />

        <button
          type="button"
          onClick={() => void generateDraft()}
          disabled={draftLoading || !prompt.trim()}
          style={{ ...buttonStyle, opacity: draftLoading || !prompt.trim() ? 0.65 : 1 }}
        >
          {draftLoading ? "Generating draft..." : "Generate contextual draft"}
        </button>

        {lifecycleContext === "absence" ? (
          <p style={safetyNoteStyle}>
            Medical records are excluded from this draft context.
          </p>
        ) : null}

        {draftError ? <p style={errorStyle}>{draftError}</p> : null}

        {draftResult ? (
          <div style={draftResultStyle}>
            <div style={draftTitleStyle}>{draftResult.title}</div>
            <p style={textStyle}>{draftResult.summary}</p>
            <textarea readOnly value={draftResult.content} style={draftOutputStyle} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

const panelStyle: CSSProperties = {
  border: "1px solid #E7DDED",
  borderRadius: 14,
  background: "#FFFFFF",
  padding: 14,
  display: "grid",
  gap: 12,
  marginBottom: 16,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#2F2435",
  fontSize: 15,
  fontWeight: 700,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#665A6C",
  fontSize: 13,
  lineHeight: 1.5,
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#5D5263",
  fontSize: 13,
  lineHeight: 1.6,
};

const insightPanelStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #EFE4F5",
  background: "#FBF8FD",
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

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#352A3B",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

const listStyle: CSSProperties = {
  margin: "6px 0 0",
  paddingLeft: 18,
  color: "#45394B",
  fontSize: 13,
  lineHeight: 1.5,
};

const draftPanelStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const fieldLabelStyle: CSSProperties = {
  color: "#4C3D55",
  fontSize: 12,
  fontWeight: 700,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 82,
  borderRadius: 8,
  border: "1px solid #DDD4E4",
  padding: 10,
  fontSize: 13,
};

const buttonStyle: CSSProperties = {
  border: "none",
  background: "#4D2E62",
  color: "#FFFFFF",
  borderRadius: 8,
  padding: "9px 12px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  justifySelf: "start",
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: "#9F1239",
  fontSize: 13,
};

const safetyNoteStyle: CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: 12,
};

const draftResultStyle: CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  padding: 10,
  background: "#FFFFFF",
  display: "grid",
  gap: 8,
};

const draftTitleStyle: CSSProperties = {
  color: "#111827",
  fontWeight: 800,
  fontSize: 14,
};

const draftOutputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 150,
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  padding: 10,
  fontSize: 13,
  lineHeight: 1.5,
  background: "#F9FAFB",
};
