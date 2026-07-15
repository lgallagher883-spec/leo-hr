"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  learningModuleId: number;
};

type LearningSection = {
  id: number;
  learning_module_id: number;
  title: string;
  section_type: string;
  content: string | null;
  sequence_number: number;
  estimated_duration_minutes: number | null;
  completion_required: boolean;
  media_id: number | null;
  created_at: string;
  updated_at: string;
};

type FormMode = "create" | "edit";

const sectionTypes = [
  "Text",
  "Video",
  "Document",
  "Presentation",
  "Activity",
  "Assessment",
  "External Link",
  "Manager Action",
  "Evidence Upload",
  "Other",
];

export default function LearningContent({
  learningModuleId,
}: Props) {
  const [sections, setSections] = useState<
    LearningSection[]
  >([]);

  const [selectedSectionId, setSelectedSectionId] =
    useState<number | null>(null);

  const [formMode, setFormMode] =
    useState<FormMode>("create");

  const [showForm, setShowForm] =
    useState(false);

  const [title, setTitle] = useState("");
  const [sectionType, setSectionType] =
    useState("Text");
  const [content, setContent] = useState("");
  const [durationMinutes, setDurationMinutes] =
    useState("");
  const [
    completionRequired,
    setCompletionRequired,
  ] = useState(true);

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadSections();
  }, [learningModuleId]);

  async function loadSections() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("learning_module_sections")
      .select(
        `
        id,
        learning_module_id,
        title,
        section_type,
        content,
        sequence_number,
        estimated_duration_minutes,
        completion_required,
        media_id,
        created_at,
        updated_at
        `
      )
      .eq(
        "learning_module_id",
        learningModuleId
      )
      .eq("is_archived", false)
      .order("sequence_number", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Error loading learning sections:",
        error
      );

      setErrorMessage(
        "The learning content could not be loaded."
      );

      setLoading(false);
      return;
    }

    setSections(
      (data || []) as LearningSection[]
    );

    setLoading(false);
  }

  function resetForm() {
    setSelectedSectionId(null);
    setFormMode("create");
    setTitle("");
    setSectionType("Text");
    setContent("");
    setDurationMinutes("");
    setCompletionRequired(true);
    setErrorMessage("");
  }

  function openCreateForm() {
    resetForm();
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(
    section: LearningSection
  ) {
    setSelectedSectionId(section.id);
    setFormMode("edit");
    setTitle(section.title);
    setSectionType(section.section_type);
    setContent(section.content || "");
    setDurationMinutes(
      section.estimated_duration_minutes !==
        null
        ? String(
            section.estimated_duration_minutes
          )
        : ""
    );
    setCompletionRequired(
      section.completion_required
    );
    setMessage("");
    setErrorMessage("");
    setShowForm(true);
  }

  async function saveSection() {
    if (!title.trim()) {
      setErrorMessage(
        "Enter a section title."
      );
      return;
    }

    if (
      durationMinutes &&
      Number(durationMinutes) < 0
    ) {
      setErrorMessage(
        "Estimated duration cannot be less than zero."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const sectionData = {
      learning_module_id:
        learningModuleId,
      title: title.trim(),
      section_type: sectionType,
      content: content.trim() || null,
      estimated_duration_minutes:
        durationMinutes
          ? Number(durationMinutes)
          : null,
      completion_required:
        completionRequired,
    };

    if (
      formMode === "edit" &&
      selectedSectionId !== null
    ) {
      const { error } = await supabase
        .from("learning_module_sections")
        .update(sectionData)
        .eq("id", selectedSectionId);

      if (error) {
        console.error(
          "Error updating learning section:",
          error
        );

        setErrorMessage(
          "The learning section could not be updated."
        );

        setSaving(false);
        return;
      }

      setMessage("Learning section updated.");
    } else {
      const nextSequenceNumber =
        sections.length === 0
          ? 1
          : Math.max(
              ...sections.map(
                (section) =>
                  section.sequence_number
              )
            ) + 1;

      const { error } = await supabase
        .from("learning_module_sections")
        .insert({
          ...sectionData,
          sequence_number:
            nextSequenceNumber,
        });

      if (error) {
        console.error(
          "Error creating learning section:",
          error
        );

        setErrorMessage(
          "The learning section could not be created."
        );

        setSaving(false);
        return;
      }

      setMessage("Learning section created.");
    }

    setSaving(false);
    setShowForm(false);
    resetForm();

    await loadSections();
  }

  async function moveSection(
    section: LearningSection,
    direction: -1 | 1
  ) {
    const currentIndex =
      sections.findIndex(
        (item) => item.id === section.id
      );

    const targetIndex =
      currentIndex + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= sections.length
    ) {
      return;
    }

    const targetSection =
      sections[targetIndex];

    const currentSequence =
      section.sequence_number;

    const targetSequence =
      targetSection.sequence_number;

    const temporarySequence =
      Math.max(
        ...sections.map(
          (item) =>
            item.sequence_number
        )
      ) + 1000;

    const { error: temporaryError } =
      await supabase
        .from("learning_module_sections")
        .update({
          sequence_number:
            temporarySequence,
        })
        .eq("id", section.id);

    if (temporaryError) {
      console.error(
        "Error preparing section move:",
        temporaryError
      );

      setErrorMessage(
        "The section order could not be changed."
      );
      return;
    }

    const { error: targetError } =
      await supabase
        .from("learning_module_sections")
        .update({
          sequence_number:
            currentSequence,
        })
        .eq("id", targetSection.id);

    if (targetError) {
      console.error(
        "Error moving target section:",
        targetError
      );

      await supabase
        .from("learning_module_sections")
        .update({
          sequence_number:
            currentSequence,
        })
        .eq("id", section.id);

      setErrorMessage(
        "The section order could not be changed."
      );
      return;
    }

    const { error: finalError } =
      await supabase
        .from("learning_module_sections")
        .update({
          sequence_number:
            targetSequence,
        })
        .eq("id", section.id);

    if (finalError) {
      console.error(
        "Error completing section move:",
        finalError
      );

      setErrorMessage(
        "The section order could not be changed."
      );
      return;
    }

    await loadSections();
  }

  async function archiveSection(
    section: LearningSection
  ) {
    const confirmed = window.confirm(
      `Archive "${section.title}"?\n\nThe section will remain preserved in the learning history.`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("learning_module_sections")
      .update({
        is_archived: true,
        archived_at:
          new Date().toISOString(),
      })
      .eq("id", section.id);

    if (error) {
      console.error(
        "Error archiving learning section:",
        error
      );

      setErrorMessage(
        "The learning section could not be archived."
      );

      return;
    }

    setMessage("Learning section archived.");

    if (
      selectedSectionId === section.id
    ) {
      setShowForm(false);
      resetForm();
    }

    await loadSections();
  }

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>Content</h3>

          <p style={descriptionStyle}>
            Build the learning in clear,
            structured sections. Sections can be
            edited, reordered and archived without
            losing their history.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          style={primaryButtonStyle}
        >
          Add Section
        </button>
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

      {showForm && (
        <div style={formPanelStyle}>
          <div style={formHeaderStyle}>
            <div>
              <h4 style={formTitleStyle}>
                {formMode === "edit"
                  ? "Edit Section"
                  : "Add Section"}
              </h4>

              <p
                style={
                  formDescriptionStyle
                }
              >
                Create one clear part of the
                learning resource.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              style={closeButtonStyle}
            >
              Close
            </button>
          </div>

          <div style={formGridStyle}>
            <FormField label="Section title">
              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="For example, What to do when the fire alarm sounds"
                style={inputStyle}
              />
            </FormField>

            <FormField label="Section type">
              <select
                value={sectionType}
                onChange={(event) =>
                  setSectionType(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                {sectionTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>

          <FormField label="Content or instructions">
            <textarea
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value
                )
              }
              placeholder="Write the learning content, activity instructions or supporting explanation."
              style={textareaStyle}
            />
          </FormField>

          <div style={formGridStyle}>
            <FormField label="Estimated duration in minutes">
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(
                    event.target.value
                  )
                }
                placeholder="For example, 10"
                style={inputStyle}
              />
            </FormField>

            <div
              style={
                checkboxFieldContainerStyle
              }
            >
              <label
                style={checkboxCardStyle}
              >
                <input
                  type="checkbox"
                  checked={
                    completionRequired
                  }
                  onChange={(event) =>
                    setCompletionRequired(
                      event.target.checked
                    )
                  }
                />

                <span>
                  <span
                    style={
                      checkboxTitleStyle
                    }
                  >
                    Completion required
                  </span>

                  <span
                    style={
                      checkboxDescriptionStyle
                    }
                  >
                    The employee must complete this
                    section before the learning is
                    marked complete.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              disabled={saving}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void saveSection()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Saving..."
                : formMode === "edit"
                  ? "Update Section"
                  : "Add Section"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={emptyStateStyle}>
          Loading learning content...
        </div>
      ) : sections.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>✦</div>

          <h4 style={emptyTitleStyle}>
            No learning sections yet
          </h4>

          <p
            style={
              emptyDescriptionStyle
            }
          >
            Add the first section to begin
            building this learning resource.
          </p>
        </div>
      ) : (
        <div style={sectionListStyle}>
          {sections.map(
            (section, index) => (
              <div
                key={section.id}
                style={sectionCardStyle}
              >
                <div
                  style={
                    sectionNumberStyle
                  }
                >
                  {index + 1}
                </div>

                <div
                  style={
                    sectionContentStyle
                  }
                >
                  <div
                    style={
                      sectionHeaderStyle
                    }
                  >
                    <div>
                      <div
                        style={
                          sectionTypeStyle
                        }
                      >
                        {
                          section.section_type
                        }
                      </div>

                      <h4
                        style={
                          sectionTitleStyle
                        }
                      >
                        {section.title}
                      </h4>
                    </div>

                    <div
                      style={
                        sectionStatusStyle
                      }
                    >
                      {section.completion_required
                        ? "Required"
                        : "Optional"}
                    </div>
                  </div>

                  {section.content && (
                    <div
                      style={
                        sectionTextStyle
                      }
                    >
                      {section.content}
                    </div>
                  )}

                  <div
                    style={
                      sectionMetaStyle
                    }
                  >
                    {section.estimated_duration_minutes !==
                    null
                      ? `${section.estimated_duration_minutes} minutes`
                      : "Duration not set"}
                  </div>

                  <div
                    style={
                      sectionActionsStyle
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void moveSection(
                          section,
                          -1
                        )
                      }
                      disabled={index === 0}
                      style={
                        smallButtonStyle
                      }
                    >
                      Move up
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void moveSection(
                          section,
                          1
                        )
                      }
                      disabled={
                        index ===
                        sections.length - 1
                      }
                      style={
                        smallButtonStyle
                      }
                    >
                      Move down
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(
                          section
                        )
                      }
                      style={
                        editButtonStyle
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void archiveSection(
                          section
                        )
                      }
                      style={
                        smallButtonStyle
                      }
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={formFieldStyle}>
      <label style={labelStyle}>
        {label}
      </label>

      {children}
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
  maxWidth: "740px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
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

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const formPanelStyle: React.CSSProperties = {
  padding: "18px",
  marginBottom: "18px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const formHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
};

const formTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const formDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: "#6B7280",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "15px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  background: "#FFFFFF",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "130px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const checkboxFieldContainerStyle: React.CSSProperties =
  {
    marginTop: "15px",
  };

const checkboxCardStyle: React.CSSProperties = {
  minHeight: "43px",
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  background: "#FFFFFF",
  cursor: "pointer",
};

const checkboxTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const checkboxDescriptionStyle: React.CSSProperties =
  {
    display: "block",
    marginTop: "3px",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.4,
  };

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "18px",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "30px 20px",
  border: "1px dashed #D1D5DB",
  borderRadius: "13px",
  background: "#F9FAFB",
  color: "#6B7280",
  textAlign: "center",
};

const emptyIconStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  marginBottom: "8px",
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const emptyDescriptionStyle: React.CSSProperties =
  {
    margin: "7px 0 0",
    fontSize: "14px",
  };

const sectionListStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const sectionCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "14px",
  padding: "16px",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  background: "#FFFFFF",
};

const sectionNumberStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 800,
};

const sectionContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const sectionTypeStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#111827",
  fontSize: "16px",
};

const sectionStatusStyle: React.CSSProperties = {
  padding: "5px 8px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const sectionTextStyle: React.CSSProperties = {
  marginTop: "10px",
  color: "#4B5563",
  fontSize: "14px",
  lineHeight: 1.55,
  whiteSpace: "pre-wrap",
};

const sectionMetaStyle: React.CSSProperties = {
  marginTop: "9px",
  color: "#6B7280",
  fontSize: "12px",
};

const sectionActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
  marginTop: "12px",
};

const smallButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  padding: "7px 10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const editButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  color: "#6E5084",
  border: "1px solid #CDB2E2",
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