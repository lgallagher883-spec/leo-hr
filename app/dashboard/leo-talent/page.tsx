"use client";

import { useState, type CSSProperties } from "react";

import ApplicationsWorkspace from "./components/ApplicationsWorkspace";
import CandidateWorkspace from "./components/CandidateWorkspace";
import InterviewsWorkspace from "./components/InterviewsWorkspace";
import OffersWorkspace from "./components/OffersWorkspace";
import OnboardingWorkspace from "./components/OnboardingWorkspace";
import VacanciesWorkspace from "./components/VacanciesWorkspace";
import DueDiligenceWorkspace from "./components/DueDiligenceWorkspace";

type TalentSection =
  | "Dashboard"
  | "Vacancies"
  | "Applications"
  | "Candidates"
  | "Interviews"
  | "Due Diligence"
  | "Offers & Appointments"
  | "Onboarding"
  | "AI Studio"
  | "Settings";

const sections: TalentSection[] = [
  "Dashboard",
  "Vacancies",
  "Applications",
  "Candidates",
  "Interviews",
  "Due Diligence",
  "Offers & Appointments",
  "Onboarding",
  "AI Studio",
  "Settings",
];

export default function LeoTalentPage() {
  const [activeSection, setActiveSection] =
    useState<TalentSection>("Dashboard");

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>LEO TALENT</div>

          <h1 style={titleStyle}>Talent</h1>

          <p style={descriptionStyle}>
            Plan vacancies, manage candidates, make fair appointments and
            support every new starter through a connected people journey.
          </p>
        </div>

        <button
          type="button"
          style={primaryButtonStyle}
          onClick={() => setActiveSection("Vacancies")}
        >
          Create vacancy
        </button>
      </header>

      <nav aria-label="Leo Talent sections" style={navigationGridStyle}>
        {sections.map((section) => {
          const active = activeSection === section;

          return (
            <button
              key={section}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => setActiveSection(section)}
              style={active ? activeNavigationCardStyle : navigationCardStyle}
            >
              <span style={navigationTitleStyle}>{section}</span>

              <span style={navigationDescriptionStyle}>
                {getSectionDescription(section)}
              </span>
            </button>
          );
        })}
      </nav>

      <main style={workspaceStyle}>
        {activeSection === "Dashboard" ? (
          <TalentDashboard onNavigate={setActiveSection} />
        ) : null}

        {activeSection === "Vacancies" ? <VacanciesWorkspace /> : null}

        {activeSection === "Applications" ? <ApplicationsWorkspace /> : null}

        {activeSection === "Candidates" ? <CandidateWorkspace /> : null}

        {activeSection === "Interviews" ? <InterviewsWorkspace /> : null}

        {activeSection === "Due Diligence" ? (
          <DueDiligenceWorkspace />
        ) : null}

        {activeSection === "Offers & Appointments" ? <OffersWorkspace /> : null}

        {activeSection === "Onboarding" ? <OnboardingWorkspace /> : null}

        {activeSection === "AI Studio" ? (
          <TalentAIStudio onNavigate={setActiveSection} />
        ) : null}

        {activeSection === "Settings" ? <TalentSettings /> : null}
      </main>
    </div>
  );
}

function TalentDashboard({
  onNavigate,
}: {
  onNavigate: (section: TalentSection) => void;
}) {
  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>Talent overview</h2>
          <p style={workspaceDescriptionStyle}>
            A calm overview of vacancies, candidate activity, interviews,
            offers, due diligence and onboarding.
          </p>
        </div>
      </div>

      <div style={kpiGridStyle}>
        <KpiCard label="Live vacancies" value="0" />
        <KpiCard label="Applications received" value="0" />
        <KpiCard label="Candidates in progress" value="0" />
        <KpiCard label="Interviews" value="0" />
        <KpiCard label="Offers awaiting response" value="0" />
        <KpiCard label="Due diligence outstanding" value="0" />
      </div>

      <div style={dashboardGridStyle}>
        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Leo recommendations</h3>

          <div style={emptyPanelStyle}>
            <div style={starStyle}>✦</div>
            <p style={emptyPanelTextStyle}>
              Leo will present practical vacancy, candidate, appointment and
              onboarding recommendations here once activity begins.
            </p>
          </div>
        </section>

        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Quick actions</h3>

          <div style={quickActionGridStyle}>
            <QuickAction
              label="Create vacancy"
              onClick={() => onNavigate("Vacancies")}
            />
            <QuickAction
              label="Review applications"
              onClick={() => onNavigate("Applications")}
            />
            <QuickAction
              label="Add candidate"
              onClick={() => onNavigate("Candidates")}
            />
            <QuickAction
              label="Schedule interview"
              onClick={() => onNavigate("Interviews")}
            />
            <QuickAction
              label="Complete due diligence"
              onClick={() => onNavigate("Due Diligence")}
            />
            <QuickAction
              label="Prepare offer"
              onClick={() => onNavigate("Offers & Appointments")}
            />
            <QuickAction
              label="Manage onboarding"
              onClick={() => onNavigate("Onboarding")}
            />
          </div>
        </section>
      </div>

      <div style={dashboardGridStyle}>
        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Recent talent activity</h3>
          <div style={emptyPanelStyle}>
            <p style={emptyPanelTextStyle}>
              Vacancy changes, applications, interview decisions, offers, due
              diligence and onboarding activity will appear here.
            </p>
          </div>
        </section>

        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Talent snapshot</h3>
          <div style={emptyPanelStyle}>
            <p style={emptyPanelTextStyle}>
              Hiring and onboarding progress will appear here once activity is
              underway.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function TalentAIStudio({
  onNavigate,
}: {
  onNavigate: (section: TalentSection) => void;
}) {
  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>Talent AI Studio</h2>
          <p style={workspaceDescriptionStyle}>
            Create and improve vacancy content, structured assessments and
            candidate communications with Leo.
          </p>
        </div>
      </div>

      <div style={dashboardGridStyle}>
        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Build talent content</h3>

          <div style={quickActionGridStyle}>
            <QuickAction
              label="Draft vacancy"
              onClick={() => onNavigate("Vacancies")}
            />
            <QuickAction
              label="Create interview questions"
              onClick={() => onNavigate("Interviews")}
            />
            <QuickAction
              label="Prepare candidate message"
              onClick={() => onNavigate("Candidates")}
            />
            <QuickAction
              label="Build due diligence checklist"
              onClick={() => onNavigate("Due Diligence")}
            />
          </div>
        </section>

        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Leo assistance</h3>
          <div style={emptyPanelStyle}>
            <div style={starStyle}>✦</div>
            <p style={emptyPanelTextStyle}>
              AI-assisted Talent tools will appear here as they are connected
              to the approved Leo workflows.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function TalentSettings() {
  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>Talent settings</h2>
          <p style={workspaceDescriptionStyle}>
            Manage Talent defaults, templates, due diligence requirements and
            hiring controls.
          </p>
        </div>
      </div>

      <div style={settingsGridStyle}>
        <SettingsCard
          title="Vacancy defaults"
          description="Default vacancy settings, approval requirements and campaign timescales."
        />
        <SettingsCard
          title="Application stages"
          description="Configure the stages used to manage applications and candidate decisions."
        />
        <SettingsCard
          title="Interview templates"
          description="Manage structured interview forms, questions and scoring templates."
        />
        <SettingsCard
          title="Due diligence"
          description="Set role-based requirements for right to work, references, DBS and overseas checks."
        />
        <SettingsCard
          title="Offer templates"
          description="Manage offer documents, appointment communications and approval controls."
        />
        <SettingsCard
          title="Candidate communications"
          description="Manage standard messages, acknowledgements and outcome communications."
        />
        <SettingsCard
          title="Onboarding defaults"
          description="Manage starter tasks, due dates, ownership and onboarding templates."
        />
      </div>
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
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiLabelStyle}>{label}</div>
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
    <button type="button" onClick={onClick} style={quickActionStyle}>
      {label}
    </button>
  );
}

function SettingsCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <button type="button" style={settingsCardStyle}>
      <span style={settingsTitleStyle}>{title}</span>
      <span style={settingsDescriptionStyle}>{description}</span>
    </button>
  );
}

function getSectionDescription(section: TalentSection): string {
  switch (section) {
    case "Dashboard":
      return "Hiring activity, recommendations and quick actions.";
    case "Vacancies":
      return "Plan roles, campaigns and recruitment requirements.";
    case "Applications":
      return "Review applications, decisions and candidate progress.";
    case "Candidates":
      return "Manage candidate records, history and communications.";
    case "Interviews":
      return "Schedule interviews, panels, notes and outcomes.";
    case "Due Diligence":
      return "Track role-specific checks and appointment readiness.";
    case "Offers & Appointments":
      return "Prepare, approve and track employment offers.";
    case "Onboarding":
      return "Coordinate pre-start tasks and employee handover.";
    case "AI Studio":
      return "Create and improve Talent content with Leo.";
    case "Settings":
      return "Talent defaults, templates and hiring controls.";
  }
}

const pageStyle: CSSProperties = {
  width: "100%",
  maxWidth: 1400,
  minWidth: 0,
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  background: "#FFFFFF",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#E5E7EB",
  borderRadius: 16,
  padding: 24,
  marginBottom: 18,
};

const eyebrowStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
};

const descriptionStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: 14,
  lineHeight: 1.6,
  maxWidth: 760,
};

const primaryButtonStyle: CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  borderWidth: 0,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const navigationGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const navigationCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minHeight: 105,
  padding: 16,
  background: "#FFFFFF",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#E5E7EB",
  borderRadius: 14,
  textAlign: "left",
  cursor: "pointer",
};

const activeNavigationCardStyle: CSSProperties = {
  ...navigationCardStyle,
  background: "#F7F1FC",
  borderColor: "#CDB2E2",
};

const navigationTitleStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: 15,
  fontWeight: 700,
};

const navigationDescriptionStyle: CSSProperties = {
  color: "#6B7280",
  fontSize: 13,
  lineHeight: 1.5,
};

const workspaceStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  background: "#FFFFFF",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#E5E7EB",
  borderRadius: 16,
  padding: 22,
};

const workspaceHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 20,
};

const workspaceTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
};

const workspaceDescriptionStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: 14,
  lineHeight: 1.6,
};

const kpiGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const kpiCardStyle: CSSProperties = {
  background: "#F7F1FC",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#E8DDF0",
  borderRadius: 14,
  padding: 16,
};

const kpiValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: 26,
  fontWeight: 800,
};

const kpiLabelStyle: CSSProperties = {
  marginTop: 6,
  color: "#6B7280",
  fontSize: 13,
  lineHeight: 1.4,
};

const dashboardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 14,
  marginBottom: 14,
};

const panelStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#E5E7EB",
  borderRadius: 14,
  padding: 18,
  background: "#FFFFFF",
};

const panelTitleStyle: CSSProperties = {
  margin: "0 0 14px",
  color: "#111827",
  fontSize: 16,
};

const emptyPanelStyle: CSSProperties = {
  padding: 24,
  background: "#F9FAFB",
  borderWidth: 1,
  borderStyle: "dashed",
  borderColor: "#D1D5DB",
  borderRadius: 12,
  textAlign: "center",
};

const starStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: 22,
  marginBottom: 8,
};

const emptyPanelTextStyle: CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: 14,
  lineHeight: 1.6,
};

const quickActionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const quickActionStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#CDB2E2",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
};

const settingsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};

const settingsCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minHeight: 120,
  padding: 18,
  background: "#FFFFFF",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#E5E7EB",
  borderRadius: 14,
  textAlign: "left",
  cursor: "pointer",
};

const settingsTitleStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: 15,
  fontWeight: 700,
};

const settingsDescriptionStyle: CSSProperties = {
  color: "#6B7280",
  fontSize: 13,
  lineHeight: 1.5,
};