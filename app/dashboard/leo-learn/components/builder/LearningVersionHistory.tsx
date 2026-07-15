"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  learningModuleId: number;
  currentVersionNumber: number;
  onUpdated: () => Promise<void>;
};

type LearningVersion = {
  id: number;
  version_number: number;
  change_summary: string | null;
  published_at: string | null;
  created_at: string;
};

export default function LearningVersionHistory({
  learningModuleId,
  currentVersionNumber,
  onUpdated,
}: Props) {
  const [versions, setVersions] = useState<
    LearningVersion[]
  >([]);

  const [changeSummary, setChangeSummary] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadVersions();
  }, [learningModuleId]);

  async function loadVersions() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("learning_module_versions")
      .select(
        `
        id,
        version_number,
        change_summary,
        published_at,
        created_at
        `
      )
      .eq("learning_module_id", learningModuleId)
      .order("version_number", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error loading learning versions:",
        error
      );

      setErrorMessage(
        "Version history could not be loaded."
      );

      setLoading(false);
      return;
    }

    setVersions(
      (data || []) as LearningVersion[]
    );

    setLoading(false);
  }

  async function createVersion() {
    if (!changeSummary.trim()) {
      setErrorMessage(
        "Enter a brief summary of what changed."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const {
      data: moduleData,
      error: moduleError,
    } = await supabase
      .from("learning_modules")
      .select("*")
      .eq("id", learningModuleId)
      .single();

    if (moduleError || !moduleData) {
      console.error(
        "Error loading learning module:",
        moduleError
      );

      setErrorMessage(
        "The learning resource could not be prepared for versioning."
      );

      setSaving(false);
      return;
    }

    const {
      data: sectionData,
      error: sectionError,
    } = await supabase
      .from("learning_module_sections")
      .select("*")
      .eq(
        "learning_module_id",
        learningModuleId
      )
      .eq("is_archived", false)
      .order("sequence_number", {
        ascending: true,
      });

    if (sectionError) {
      console.error(
        "Error loading learning sections:",
        sectionError
      );

      setErrorMessage(
        "The learning content could not be prepared for versioning."
      );

      setSaving(false);
      return;
    }

    const nextVersionNumber =
      currentVersionNumber + 1;

    const { error: versionError } =
      await supabase
        .from("learning_module_versions")
        .insert({
          learning_module_id:
            learningModuleId,
          version_number:
            nextVersionNumber,
          version_snapshot: {
            module: moduleData,
            sections: sectionData || [],
          },
          change_summary:
            changeSummary.trim(),
          published_at:
            new Date().toISOString(),
        });

    if (versionError) {
      console.error(
        "Error creating learning version:",
        versionError
      );

      setErrorMessage(
        "The new version could not be created."
      );

      setSaving(false);
      return;
    }

    const { error: moduleUpdateError } =
      await supabase
        .from("learning_modules")
        .update({
          current_version_number:
            nextVersionNumber,
          status: "Published",
          last_reviewed_at:
            new Date().toISOString(),
        })
        .eq("id", learningModuleId);

    if (moduleUpdateError) {
      console.error(
        "Error updating current version:",
        moduleUpdateError
      );

      setErrorMessage(
        "The version was preserved, but the learning record could not be updated."
      );

      setSaving(false);
      return;
    }

    setChangeSummary("");
    setMessage(
      `Version ${nextVersionNumber} created.`
    );

    setSaving(false);

    await loadVersions();
    await onUpdated();
  }

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>
            Version History
          </h3>

          <p style={descriptionStyle}>
            Preserve published versions and a clear
            record of what changed.
          </p>
        </div>

        <div style={currentVersionStyle}>
          Current version:{" "}
          {currentVersionNumber}
        </div>
      </div>

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}

      {message && (
        <div style={messageStyle}>
          {message}
        </div>
      )}

      <div style={createPanelStyle}>
        <label style={labelStyle}>
          Change summary
        </label>

        <textarea
          value={changeSummary}
          onChange={(event) =>
            setChangeSummary(
              event.target.value
            )
          }
          placeholder="Briefly summarise the changes included in this version."
          style={textareaStyle}
        />

        <button
          type="button"
          onClick={() =>
            void createVersion()
          }
          disabled={saving}
          style={primaryButtonStyle}
        >
          {saving
            ? "Creating Version..."
            : "Create Published Version"}
        </button>
      </div>

      {loading ? (
        <div style={emptyStyle}>
          Loading version history...
        </div>
      ) : versions.length === 0 ? (
        <div style={emptyStyle}>
          No published versions have been preserved
          yet.
        </div>
      ) : (
        <div style={listStyle}>
          {versions.map((version) => (
            <div
              key={version.id}
              style={cardStyle}
            >
              <div style={versionNumberStyle}>
                Version{" "}
                {version.version_number}
              </div>

              <div style={summaryStyle}>
                {version.change_summary ||
                  "No change summary recorded."}
              </div>

              <div style={metaStyle}>
                {new Date(
                  version.published_at ||
                    version.created_at
                ).toLocaleString("en-GB")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const descriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
};

const currentVersionStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const createPanelStyle: React.CSSProperties = {
  padding: "16px",
  marginBottom: "16px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "12px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "90px",
  padding: "10px 12px",
  marginBottom: "12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  background: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1.5,
  resize: "vertical",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyStyle: React.CSSProperties = {
  padding: "24px",
  border: "1px dashed #D1D5DB",
  borderRadius: "12px",
  background: "#F9FAFB",
  color: "#6B7280",
  textAlign: "center",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const cardStyle: React.CSSProperties = {
  padding: "14px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const versionNumberStyle: React.CSSProperties = {
  color: "#6E5084",
  fontWeight: 800,
};

const summaryStyle: React.CSSProperties = {
  marginTop: "6px",
  color: "#374151",
  lineHeight: 1.5,
};

const metaStyle: React.CSSProperties = {
  marginTop: "7px",
  color: "#6B7280",
  fontSize: "12px",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};