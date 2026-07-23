"use client";

import { useState } from "react";
import LearningOverview from "./LearningOverview";
import LearningContent from "./LearningContent";
import LearningAssessment from "./LearningAssessment";
import LearningCertificates from "./LearningCertificates";
import LearningAssignments from "./LearningAssignments";
import LearningVersionHistory from "./LearningVersionHistory";
import LearningMedia from "./LearningMedia";

export type LearningModule = {
  id: number;
  title: string;
  description: string | null;
  learning_type: string;
  delivery_method: string;
  category_id: number | null;
  provider_id: number | null;
  status: string;
  estimated_duration_minutes: number | null;
  assignment_eligible: boolean;
  certificate_available: boolean;
  assessment_required: boolean;
  manager_validation_required: boolean;
  review_frequency_months: number | null;
  last_reviewed_at: string | null;
  next_review_date: string | null;
  current_version_number: number;
  source_type: string;
  created_at: string;
  updated_at: string;
};

type WorkspaceSection =
  | "Overview"
  | "Content"
  | "Assessment"
  | "Certificates"
  | "Assignments"
  | "Version History"
  | "Media";

type Props = {
  learningModule: LearningModule;
  onBack: () => void;
  onUpdated: () => Promise<void>;
};

const sections: WorkspaceSection[] = [
  "Overview",
  "Content",
  "Assessment",
  "Certificates",
  "Assignments",
  "Version History",
  "Media",
];

export default function LearningWorkspace({
  learningModule,
  onBack,
  onUpdated,
}: Props) {
  const [activeSection, setActiveSection] =
    useState<WorkspaceSection>("Overview");

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={backButtonStyle}
      >
        ← Back to Learning Library
      </button>

      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <div style={headerMetaStyle}>
            <span style={statusStyle}>
              {learningModule.status}
            </span>

            <span style={typeStyle}>
              {learningModule.learning_type}
            </span>
          </div>

          <h2 style={titleStyle}>
            {learningModule.title}
          </h2>

          <p style={descriptionStyle}>
            {learningModule.description ||
              "No description has been added."}
          </p>

          <div style={summaryMetaStyle}>
            <span>
              {learningModule.delivery_method}
            </span>

            <span>·</span>

            <span>
              {learningModule.estimated_duration_minutes !==
              null
                ? `${learningModule.estimated_duration_minutes} minutes`
                : "Duration not set"}
            </span>

            <span>·</span>

            <span>
              {learningModule.source_type}
            </span>
          </div>
        </div>

        <div style={versionStyle}>
          Version{" "}
          {learningModule.current_version_number}
        </div>
      </div>

      <div style={navigationStyle}>
        {sections.map((section) => {
          const detail = getSectionDetail(
            section,
            learningModule
          );

          return (
            <button
              key={section}
              type="button"
              onClick={() =>
                setActiveSection(section)
              }
              style={
                activeSection === section
                  ? activeNavigationButtonStyle
                  : navigationButtonStyle
              }
            >
              <span>{section}</span>

              {detail && (
                <span style={navigationDetailStyle}>
                  {detail}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={workspaceStyle}>
        {activeSection === "Overview" && (
          <LearningOverview
            learningModule={learningModule}
            onUpdated={onUpdated}
          />
        )}

        {activeSection === "Content" && (
          <LearningContent
            learningModuleId={learningModule.id}
          />
        )}

        {activeSection === "Assessment" && (
          <LearningAssessment
            learningModuleId={learningModule.id}
            assessmentRequired={
              learningModule.assessment_required
            }
          />
        )}

        {activeSection === "Certificates" && (
          <LearningCertificates
            learningModuleId={learningModule.id}
            certificateAvailable={
              learningModule.certificate_available
            }
          />
        )}

        {activeSection === "Assignments" && (
          <LearningAssignments
            learningModuleId={learningModule.id}
            assignmentEligible={
              learningModule.assignment_eligible
            }
          />
        )}

        {activeSection === "Version History" && (
          <LearningVersionHistory
            learningModuleId={learningModule.id}
            currentVersionNumber={
              learningModule.current_version_number
            }
            onUpdated={onUpdated}
          />
        )}

        {activeSection === "Media" && (
          <LearningMedia
            learningModuleId={learningModule.id}
          />
        )}
      </div>
    </div>
  );
}

function getSectionDetail(
  section: WorkspaceSection,
  learningModule: LearningModule
): string | null {
  switch (section) {
    case "Assessment":
      return learningModule.assessment_required
        ? "Required"
        : null;

    case "Certificates":
      return learningModule.certificate_available
        ? "Enabled"
        : null;

    case "Assignments":
      return learningModule.assignment_eligible
        ? "Available"
        : null;

    default:
      return null;
  }
}

const backButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#6E5084",
  padding: 0,
  marginBottom: "16px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  padding: "22px",
  marginBottom: "16px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const headerContentStyle: React.CSSProperties = {
  minWidth: 0,
};

const headerMetaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "9px",
};

const statusStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const typeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #E5E7EB",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "24px",
};

const descriptionStyle: React.CSSProperties = {
  maxWidth: "760px",
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const summaryMetaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexWrap: "wrap",
  marginTop: "12px",
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: 600,
};

const versionStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const navigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const navigationButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "9px 13px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeNavigationButtonStyle: React.CSSProperties = {
  ...navigationButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const navigationDetailStyle: React.CSSProperties = {
  padding: "3px 6px",
  background: "#FFFFFF",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 800,
};

const workspaceStyle: React.CSSProperties = {
  minHeight: "320px",
};