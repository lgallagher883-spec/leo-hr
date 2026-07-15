"use client";

import { useState } from "react";
import ProbationWorkspace from "./development/probation/ProbationWorkspace";
import DevelopmentRecordsWorkspace from "./development/shared/DevelopmentRecordsWorkspace";

type Props = {
  employeeId: number;
};

type DevelopmentSection =
  | "Probation"
  | "Reviews"
  | "One-to-Ones"
  | "Support Plans"
  | "Achievements & Milestones"
  | "Recognition";

const sections: DevelopmentSection[] = [
  "Probation",
  "Reviews",
  "One-to-Ones",
  "Support Plans",
  "Achievements & Milestones",
  "Recognition",
];

export default function EmployeeDevelopment({
  employeeId,
}: Props) {
  const [activeSection, setActiveSection] =
    useState<DevelopmentSection>("Probation");

  return (
    <div>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Development</h2>

        <p style={descriptionStyle}>
          Manage probation, employee reviews, regular conversations,
          support and professional milestones.
        </p>
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
        {activeSection === "Probation" && (
          <ProbationWorkspace employeeId={employeeId} />
        )}

        {activeSection === "Reviews" && (
          <DevelopmentRecordsWorkspace
            employeeId={employeeId}
            recordType="Review"
            title="Reviews"
            description="Record structured employee reviews, agreed actions and follow-up dates."
          />
        )}

        {activeSection === "One-to-Ones" && (
          <DevelopmentRecordsWorkspace
            employeeId={employeeId}
            recordType="One-to-One"
            title="One-to-Ones"
            description="Record regular manager and employee conversations without unnecessary administration."
          />
        )}

        {activeSection === "Support Plans" && (
          <DevelopmentRecordsWorkspace
            employeeId={employeeId}
            recordType="Support Plan"
            title="Support Plans"
            description="Record structured support, expected improvement, agreed actions and review dates."
          />
        )}

        {activeSection === "Achievements & Milestones" && (
          <AchievementsAndMilestonesWorkspace
            employeeId={employeeId}
          />
        )}

        {activeSection === "Recognition" && (
          <DevelopmentRecordsWorkspace
            employeeId={employeeId}
            recordType="Recognition"
            title="Recognition"
            description="Record positive contributions, appreciation and notable employee recognition."
          />
        )}
      </div>
    </div>
  );
}

function AchievementsAndMilestonesWorkspace({
  employeeId,
}: {
  employeeId: number;
}) {
  const [activeView, setActiveView] = useState<
    "Achievements" | "Milestones"
  >("Achievements");

  return (
    <div>
      <div style={subNavigationStyle}>
        <button
          type="button"
          onClick={() => setActiveView("Achievements")}
          style={
            activeView === "Achievements"
              ? activeSubNavigationButtonStyle
              : subNavigationButtonStyle
          }
        >
          Achievements
        </button>

        <button
          type="button"
          onClick={() => setActiveView("Milestones")}
          style={
            activeView === "Milestones"
              ? activeSubNavigationButtonStyle
              : subNavigationButtonStyle
          }
        >
          Milestones
        </button>
      </div>

      {activeView === "Achievements" && (
        <DevelopmentRecordsWorkspace
          employeeId={employeeId}
          recordType="Achievement"
          title="Achievements"
          description="Record qualifications, completed development and other notable achievements."
        />
      )}

      {activeView === "Milestones" && (
        <DevelopmentRecordsWorkspace
          employeeId={employeeId}
          recordType="Milestone"
          title="Milestones"
          description="Record important points in the employee’s professional journey."
        />
      )}
    </div>
  );
}

function getSectionDescription(
  section: DevelopmentSection
): string {
  switch (section) {
    case "Probation":
      return "Reviews, reminders, documents and decisions.";

    case "Reviews":
      return "Structured employee review conversations.";

    case "One-to-Ones":
      return "Regular manager and employee check-ins.";

    case "Support Plans":
      return "Practical support and monitored improvement.";

    case "Achievements & Milestones":
      return "The employee’s professional journey.";

    case "Recognition":
      return "Positive contributions and appreciation.";
  }
}

const headerStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "20px",
  marginBottom: "18px",
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

const navigationGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
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
  borderRadius: "14px",
  padding: "20px",
};

const subNavigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "18px",
};

const subNavigationButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "9px 13px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeSubNavigationButtonStyle: React.CSSProperties = {
  ...subNavigationButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};