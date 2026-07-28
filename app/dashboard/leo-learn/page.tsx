"use client";

import { useEffect, useState } from "react";
import LearningLibrary from "./components/LearningLibrary";
import DevelopmentPathways from "./components/pathways/DevelopmentPathways";
import LearningWorkspace from "./components/learning/LearningWorkspace";
import QualificationsWorkspace from "./components/qualifications/QualificationsWorkspace";
import AIStudioWorkspace from "./components/ai-studio/AIStudioWorkspace";
import LearningSettingsWorkspace from "./components/settings/LearningSettingsWorkspace";

type LearnSection =
  | "Dashboard"
  | "Learning Library"
  | "Development Pathways"
  | "Learning"
  | "Qualifications & Certificates"
  | "AI Studio"
  | "Learning Analytics"
  | "Settings";

const sections: LearnSection[] = [
  "Dashboard",
  "Learning Library",
  "Development Pathways",
  "Learning",
  "Qualifications & Certificates",
  "AI Studio",
  "Learning Analytics",
  "Settings",
];

type LearnIntelligence = {
  section: string;
  summary: string;
  nextStep: string;
  recommendations: string[];
  capabilityInsights: string[];
  complianceGuidance: string[];
  developmentSuggestions: string[];
  professionalDevelopmentSuggestions: string[];
  draftLearningPlan: {
    title: string;
    summary: string;
    actions: string[];
  };
  grounding?: {
    snapshot?: {
      assignmentsInProgress?: number;
      assignmentsTotal?: number;
      assignmentsCompleted?: number;
      qualificationsDueForRenewal?: number;
      pathwaysPublished?: number;
      modulesPublished?: number;
      assignmentsPastDue?: number;
      qualificationsExpired?: number;
    };
  };
};

export default function LeoLearnPage() {
  const [activeSection, setActiveSection] =
    useState<LearnSection>("Dashboard");
  const [dashboardIntelligence, setDashboardIntelligence] =
    useState<LearnIntelligence | null>(null);
  const [analyticsIntelligence, setAnalyticsIntelligence] =
    useState<LearnIntelligence | null>(null);

  useEffect(() => {
    void loadPageIntelligence();
  }, []);

  async function loadPageIntelligence() {
    try {
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        fetch("/api/leo-learn/intelligence?section=dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }),
        fetch("/api/leo-learn/intelligence?section=analytics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ]);

      const dashboardPayload = (await dashboardResponse.json().catch(() => null)) as
        | { success?: boolean; intelligence?: LearnIntelligence }
        | null;

      const analyticsPayload = (await analyticsResponse.json().catch(() => null)) as
        | { success?: boolean; intelligence?: LearnIntelligence }
        | null;

      if (dashboardResponse.ok && dashboardPayload?.success && dashboardPayload.intelligence) {
        setDashboardIntelligence(dashboardPayload.intelligence);
      }

      if (analyticsResponse.ok && analyticsPayload?.success && analyticsPayload.intelligence) {
        setAnalyticsIntelligence(analyticsPayload.intelligence);
      }
    } catch (error) {
      console.error("Leo Learn intelligence could not be loaded:", error);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>LEO LEARN</div>

          <h1 style={titleStyle}>
            Learning and Development
          </h1>

          <p style={descriptionStyle}>
            Develop capable, confident and competent people through
            practical workplace learning.
          </p>
        </div>

        <button
          type="button"
          style={primaryButtonStyle}
          onClick={() => setActiveSection("AI Studio")}
        >
          Build with Leo
        </button>
      </div>

      <div style={navigationGridStyle}>
        {sections.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => setActiveSection(section)}
            style={
              activeSection === section
                ? activeNavigationCardStyle
                : navigationCardStyle
            }
          >
            <span style={navigationTitleStyle}>
              {section}
            </span>

            <span style={navigationDescriptionStyle}>
              {getSectionDescription(section)}
            </span>
          </button>
        ))}
      </div>

      <div style={workspaceStyle}>
        {activeSection === "Dashboard" && (
          <LearnDashboard
            onNavigate={setActiveSection}
            intelligence={dashboardIntelligence}
          />
        )}

        {activeSection === "Learning Library" && (
          <LearningLibrary />
        )}

        {activeSection === "Development Pathways" && (
          <DevelopmentPathways />
        )}

        {activeSection === "Learning" && (
          <LearningWorkspace />
        )}

        {activeSection ===
  "Qualifications & Certificates" && (
  <QualificationsWorkspace />
)}

       {activeSection === "AI Studio" && (
  <AIStudioWorkspace />
)} 

        {activeSection === "Learning Analytics" && (
          <LearningAnalyticsWorkspace
            intelligence={analyticsIntelligence}
          />
        )}

        {activeSection === "Settings" && (
  <LearningSettingsWorkspace />
)}
      </div>
    </div>
  );
}

function LearnDashboard({
  onNavigate,
  intelligence,
}: {
  onNavigate: (section: LearnSection) => void;
  intelligence: LearnIntelligence | null;
}) {
  const snapshot = intelligence?.grounding?.snapshot;

  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>
            Learning Overview
          </h2>

          <p style={workspaceDescriptionStyle}>
            A calm overview of current learning,
            development activity and items due for
            review.
          </p>
        </div>
      </div>

      <div style={kpiGridStyle}>
        <KpiCard
          label="Employees Currently Learning"
          value={String(snapshot?.assignmentsInProgress || 0)}
        />

        <KpiCard
          label="Learning Assigned This Month"
          value={String(snapshot?.assignmentsTotal || 0)}
        />

        <KpiCard
          label="Learning Completed This Month"
          value={String(snapshot?.assignmentsCompleted || 0)}
        />

        <KpiCard
          label="Certificates Due for Renewal"
          value={String(snapshot?.qualificationsDueForRenewal || 0)}
        />

        <KpiCard
          label="Development Pathways Active"
          value={String(snapshot?.pathwaysPublished || 0)}
        />

        <KpiCard
          label="Learning Requiring Review"
          value={String(snapshot?.modulesPublished || 0)}
        />
      </div>

      <div style={dashboardGridStyle}>
        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>
            Leo Recommendations
          </h3>

          {intelligence ? (
            <div style={intelligencePanelStyle}>
              <p style={intelligenceSummaryStyle}>
                {intelligence.summary}
              </p>

              <div style={intelligenceLabelStyle}>Next step</div>
              <p style={intelligenceNextStepStyle}>{intelligence.nextStep}</p>

              <div style={intelligenceLabelStyle}>Top recommendations</div>
              <ul style={intelligenceListStyle}>
                {intelligence.recommendations.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={emptyPanelStyle}>
              <div style={starStyle}>✦</div>

              <p style={emptyPanelTextStyle}>
                Leo is preparing contextual learning recommendations.
              </p>
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>
            Quick Actions
          </h3>

          <div style={quickActionGridStyle}>
            <QuickAction
              label="Create Learning"
              onClick={() =>
                onNavigate("Learning Library")
              }
            />

            <QuickAction
              label="Assign Learning"
              onClick={() =>
                onNavigate("Learning")
              }
            />

            <QuickAction
              label="Create Development Pathway"
              onClick={() =>
                onNavigate(
                  "Development Pathways"
                )
              }
            />

            <QuickAction
              label="Upload Content"
              onClick={() =>
                onNavigate("Learning Library")
              }
            />

            <QuickAction
              label="Build with Leo"
              onClick={() =>
                onNavigate("AI Studio")
              }
            />

            <QuickAction
              label="View Analytics"
              onClick={() =>
                onNavigate(
                  "Learning Analytics"
                )
              }
            />
          </div>
        </div>
      </div>

      <div style={dashboardGridStyle}>
        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>
            Recent Learning Activity
          </h3>

          <div style={emptyPanelStyle}>
            <p style={emptyPanelTextStyle}>
              Learning assignments, completions,
              certificates and pathway activity will
              appear here.
            </p>
          </div>
        </div>

        <div style={panelStyle}>
          <h3 style={panelTitleStyle}>
            Development Snapshot
          </h3>

          <div style={emptyPanelStyle}>
            <p style={emptyPanelTextStyle}>
              Development activity will appear here
              once learning and pathways are
              assigned.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LearningAnalyticsWorkspace({
  intelligence,
}: {
  intelligence: LearnIntelligence | null;
}) {
  const snapshot = intelligence?.grounding?.snapshot;

  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>Learning Analytics</h2>

          <p style={workspaceDescriptionStyle}>
            Understand learning activity, development trends and workforce capability.
          </p>
        </div>
      </div>

      <div style={kpiGridStyle}>
        <KpiCard label="Past Due Learning" value={String(snapshot?.assignmentsPastDue || 0)} />
        <KpiCard label="Expired Credentials" value={String(snapshot?.qualificationsExpired || 0)} />
        <KpiCard label="Active Learning" value={String(snapshot?.assignmentsInProgress || 0)} />
        <KpiCard label="Completed Learning" value={String(snapshot?.assignmentsCompleted || 0)} />
      </div>

      {!intelligence ? (
        <div style={placeholderStyle}>Leo analytics intelligence is loading.</div>
      ) : (
        <div style={dashboardGridStyle}>
          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>Capability Insights</h3>
            <ul style={intelligenceListStyle}>
              {intelligence.capabilityInsights.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>Compliance-Driven Training Guidance</h3>
            <ul style={intelligenceListStyle}>
              {intelligence.complianceGuidance.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>{intelligence.draftLearningPlan.title}</h3>
            <p style={intelligenceSummaryStyle}>{intelligence.draftLearningPlan.summary}</p>
            <ul style={intelligenceListStyle}>
              {intelligence.draftLearningPlan.actions.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>Professional Development Suggestions</h3>
            <ul style={intelligenceListStyle}>
              {intelligence.professionalDevelopmentSuggestions.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiValueStyle}>
        {value}
      </div>

      <div style={kpiLabelStyle}>
        {label}
      </div>
    </div>
  );
}

function QuickAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={quickActionStyle}
    >
      {label}
    </button>
  );
}

function PlaceholderWorkspace({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>
            {title}
          </h2>

          <p style={workspaceDescriptionStyle}>
            {description}
          </p>
        </div>
      </div>

      <div style={placeholderStyle}>
        This workspace will be built from the
        approved Leo Learn specification.
      </div>
    </div>
  );
}

function getSectionDescription(
  section: LearnSection
): string {
  switch (section) {
    case "Dashboard":
      return "Learning activity, recommendations and quick actions.";

    case "Learning Library":
      return "The single source of truth for learning content.";

    case "Development Pathways":
      return "Structured programmes for development and progression.";

    case "Learning":
      return "Assignments, progress, assessments and evidence.";

    case "Qualifications & Certificates":
      return "Qualifications, certificates, renewals and verification.";

    case "AI Studio":
      return "Create and improve learning with Leo.";

    case "Learning Analytics":
      return "Learning intelligence and development trends.";

    case "Settings":
      return "Learning defaults, categories and templates.";
  }
}

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1400px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "18px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  marginBottom: "8px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const descriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const navigationGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const navigationCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  minHeight: "105px",
  padding: "16px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  textAlign: "left",
  cursor: "pointer",
};

const activeNavigationCardStyle: React.CSSProperties = {
  ...navigationCardStyle,
  background: "#F7F1FC",
  border: "1px solid #CDB2E2",
};

const navigationTitleStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "15px",
  fontWeight: 700,
};

const navigationDescriptionStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const workspaceStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "16px",
  padding: "22px",
};

const workspaceHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "20px",
};

const workspaceTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const workspaceDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const kpiGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const kpiCardStyle: React.CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "16px",
};

const kpiValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "26px",
  fontWeight: 800,
};

const kpiLabelStyle: React.CSSProperties = {
  marginTop: "6px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.4,
};

const dashboardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "14px",
  marginBottom: "14px",
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "18px",
  background: "#FFFFFF",
};

const panelTitleStyle: React.CSSProperties = {
  margin: "0 0 14px",
  color: "#111827",
  fontSize: "16px",
};

const emptyPanelStyle: React.CSSProperties = {
  padding: "24px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "12px",
  textAlign: "center",
};

const starStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  marginBottom: "8px",
};

const emptyPanelTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const quickActionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "10px",
};

const quickActionStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 12px",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
};

const placeholderStyle: React.CSSProperties = {
  padding: "28px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "14px",
  color: "#6B7280",
  textAlign: "center",
};

const intelligencePanelStyle: React.CSSProperties = {
  padding: "16px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const intelligenceSummaryStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#374151",
  fontSize: "13px",
  lineHeight: 1.6,
};

const intelligenceLabelStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "4px",
};

const intelligenceNextStepStyle: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#111827",
  fontSize: "13px",
  lineHeight: 1.5,
};

const intelligenceListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "#374151",
  fontSize: "13px",
  lineHeight: 1.6,
};