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

type LearningMediaRecord = {
  id: number;
  learning_module_id: number | null;
  file_name: string;
  original_file_name: string | null;
  media_type: string;
  file_path: string | null;
  file_url: string | null;
  external_url: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  transcript: string | null;
  captions_url: string | null;
  accessibility_reviewed: boolean;
  created_at: string;
};

type FormMode = "upload" | "external";

const mediaTypes = [
  "Video",
  "Audio",
  "PDF",
  "Word",
  "PowerPoint",
  "Image",
  "Spreadsheet",
  "External Link",
  "Transcript",
  "Downloadable Resource",
  "Other",
];

export default function LearningMedia({
  learningModuleId,
}: Props) {
  const [mediaRecords, setMediaRecords] = useState<
    LearningMediaRecord[]
  >([]);

  const [formMode, setFormMode] =
    useState<FormMode>("upload");

  const [displayName, setDisplayName] =
    useState("");

  const [mediaType, setMediaType] =
    useState("PDF");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [externalUrl, setExternalUrl] =
    useState("");

  const [durationMinutes, setDurationMinutes] =
    useState("");

  const [transcript, setTranscript] =
    useState("");

  const [captionsUrl, setCaptionsUrl] =
    useState("");

  const [
    accessibilityReviewed,
    setAccessibilityReviewed,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadMedia();
  }, [learningModuleId]);

  async function loadMedia() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("learning_media")
      .select(
        `
        id,
        learning_module_id,
        file_name,
        original_file_name,
        media_type,
        file_path,
        file_url,
        external_url,
        mime_type,
        file_size_bytes,
        duration_seconds,
        transcript,
        captions_url,
        accessibility_reviewed,
        created_at
        `
      )
      .eq(
        "learning_module_id",
        learningModuleId
      )
      .eq("is_archived", false)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error loading learning media:",
        error
      );

      setErrorMessage(
        "The learning media could not be loaded."
      );

      setLoading(false);
      return;
    }

    setMediaRecords(
      (data || []) as LearningMediaRecord[]
    );

    setLoading(false);
  }

  function resetForm() {
    setDisplayName("");
    setMediaType(
      formMode === "external"
        ? "External Link"
        : "PDF"
    );
    setSelectedFile(null);
    setExternalUrl("");
    setDurationMinutes("");
    setTranscript("");
    setCaptionsUrl("");
    setAccessibilityReviewed(false);
    setErrorMessage("");
  }

  function changeFormMode(
    nextMode: FormMode
  ) {
    setFormMode(nextMode);
    setDisplayName("");
    setMediaType(
      nextMode === "external"
        ? "External Link"
        : "PDF"
    );
    setSelectedFile(null);
    setExternalUrl("");
    setDurationMinutes("");
    setTranscript("");
    setCaptionsUrl("");
    setAccessibilityReviewed(false);
    setMessage("");
    setErrorMessage("");
  }

  async function saveMedia() {
    if (formMode === "upload" && !selectedFile) {
      setErrorMessage(
        "Choose a file to upload."
      );
      return;
    }

    if (
      formMode === "external" &&
      !externalUrl.trim()
    ) {
      setErrorMessage(
        "Enter the external link."
      );
      return;
    }

    if (
      formMode === "external" &&
      !isValidUrl(externalUrl)
    ) {
      setErrorMessage(
        "Enter a valid external link beginning with http:// or https://."
      );
      return;
    }

    if (
      captionsUrl.trim() &&
      !isValidUrl(captionsUrl)
    ) {
      setErrorMessage(
        "Enter a valid captions link beginning with http:// or https://."
      );
      return;
    }

    if (
      durationMinutes &&
      Number(durationMinutes) < 0
    ) {
      setErrorMessage(
        "Duration cannot be less than zero."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (formMode === "external") {
      const { error } = await supabase
        .from("learning_media")
        .insert({
          learning_module_id:
            learningModuleId,
          file_name:
            displayName.trim() ||
            externalUrl.trim(),
          original_file_name: null,
          media_type: "External Link",
          file_path: null,
          file_url: null,
          external_url:
            externalUrl.trim(),
          mime_type: null,
          file_size_bytes: null,
          duration_seconds:
            durationMinutes
              ? Number(durationMinutes) * 60
              : null,
          transcript:
            transcript.trim() || null,
          captions_url:
            captionsUrl.trim() || null,
          accessibility_reviewed:
            accessibilityReviewed,
        });

      if (error) {
        console.error(
          "Error saving external learning media:",
          error
        );

        setErrorMessage(
          "The external learning resource could not be saved."
        );

        setSaving(false);
        return;
      }

      setMessage(
        "External learning resource added."
      );

      setSaving(false);
      resetForm();

      await loadMedia();
      return;
    }

    const file = selectedFile;

    if (!file) {
      setSaving(false);
      return;
    }

    const safeFileName =
      file.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_"
      );

    const filePath = `${learningModuleId}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("learning-media")
        .upload(filePath, file);

    if (uploadError) {
      console.error(
        "Error uploading learning media:",
        uploadError
      );

      setErrorMessage(
        "The learning file could not be uploaded."
      );

      setSaving(false);
      return;
    }

    const { error: recordError } =
      await supabase
        .from("learning_media")
        .insert({
          learning_module_id:
            learningModuleId,
          file_name:
            displayName.trim() ||
            file.name,
          original_file_name:
            file.name,
          media_type: mediaType,
          file_path: filePath,
          file_url: null,
          external_url: null,
          mime_type:
            file.type || null,
          file_size_bytes:
            file.size,
          duration_seconds:
            durationMinutes
              ? Number(durationMinutes) * 60
              : null,
          transcript:
            transcript.trim() || null,
          captions_url:
            captionsUrl.trim() || null,
          accessibility_reviewed:
            accessibilityReviewed,
        });

    if (recordError) {
      console.error(
        "Error saving learning media record:",
        recordError
      );

      await supabase.storage
        .from("learning-media")
        .remove([filePath]);

      setErrorMessage(
        "The learning media record could not be saved."
      );

      setSaving(false);
      return;
    }

    setMessage("Learning media uploaded.");

    setSaving(false);
    resetForm();

    await loadMedia();
  }

  async function openMedia(
    media: LearningMediaRecord
  ) {
    setErrorMessage("");

    if (media.external_url) {
      window.open(
        media.external_url,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    if (media.file_url) {
      window.open(
        media.file_url,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    if (!media.file_path) {
      setErrorMessage(
        "This media record does not contain an available file or link."
      );
      return;
    }

    const { data, error } =
      await supabase.storage
        .from("learning-media")
        .createSignedUrl(
          media.file_path,
          60
        );

    if (error) {
      console.error(
        "Error opening learning media:",
        error
      );

      setErrorMessage(
        "The learning media could not be opened."
      );
      return;
    }

    if (data?.signedUrl) {
      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  async function archiveMedia(
    media: LearningMediaRecord
  ) {
    const confirmed = window.confirm(
      `Archive "${media.file_name}"?\n\nThe media record and original file will remain preserved.`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("learning_media")
      .update({
        is_archived: true,
        archived_at:
          new Date().toISOString(),
      })
      .eq("id", media.id);

    if (error) {
      console.error(
        "Error archiving learning media:",
        error
      );

      setErrorMessage(
        "The learning media could not be archived."
      );
      return;
    }

    setMessage("Learning media archived.");

    await loadMedia();
  }

  const totalFileSize = mediaRecords.reduce(
    (total, media) =>
      total +
      (media.file_size_bytes || 0),
    0
  );

  const uploadedFileCount =
    mediaRecords.filter(
      (media) =>
        Boolean(media.file_path)
    ).length;

  const externalLinkCount =
    mediaRecords.filter(
      (media) =>
        Boolean(media.external_url)
    ).length;

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>
            Media
          </h3>

          <p style={descriptionStyle}>
            Upload files, videos, presentations
            and downloadable resources, or link to
            external learning content.
          </p>
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

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Media Records"
          value={String(
            mediaRecords.length
          )}
        />

        <SummaryCard
          label="Uploaded Files"
          value={String(
            uploadedFileCount
          )}
        />

        <SummaryCard
          label="External Links"
          value={String(
            externalLinkCount
          )}
        />

        <SummaryCard
          label="Stored File Size"
          value={formatFileSize(
            totalFileSize
          )}
        />
      </div>

      <div style={formModeNavigationStyle}>
        <button
          type="button"
          onClick={() =>
            changeFormMode("upload")
          }
          style={
            formMode === "upload"
              ? activeModeButtonStyle
              : modeButtonStyle
          }
        >
          Upload File
        </button>

        <button
          type="button"
          onClick={() =>
            changeFormMode("external")
          }
          style={
            formMode === "external"
              ? activeModeButtonStyle
              : modeButtonStyle
          }
        >
          Add External Link
        </button>
      </div>

      <div style={formPanelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <h4 style={panelTitleStyle}>
              {formMode === "upload"
                ? "Upload Learning Media"
                : "Add External Learning Resource"}
            </h4>

            <p style={panelDescriptionStyle}>
              {formMode === "upload"
                ? "Upload a file that can be used within this learning resource."
                : "Link to a resource hosted outside the LEO platform."}
            </p>
          </div>
        </div>

        <div style={formGridStyle}>
          <FormField label="Display name">
            <input
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(
                  event.target.value
                )
              }
              placeholder={
                formMode === "upload"
                  ? "Defaults to the file name"
                  : "For example, HSE Fire Safety Guide"
              }
              style={inputStyle}
            />
          </FormField>

          <FormField label="Media type">
            <select
              value={mediaType}
              onChange={(event) =>
                setMediaType(
                  event.target.value
                )
              }
              disabled={
                formMode === "external"
              }
              style={inputStyle}
            >
              {mediaTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {formMode === "upload" ? (
          <FormField label="File">
            <input
              type="file"
              onChange={(event) =>
                setSelectedFile(
                  event.target.files?.[0] ||
                    null
                )
              }
            />
          </FormField>
        ) : (
          <FormField label="External link">
            <input
              type="url"
              value={externalUrl}
              onChange={(event) =>
                setExternalUrl(
                  event.target.value
                )
              }
              placeholder="https://"
              style={inputStyle}
            />
          </FormField>
        )}

        <div style={formGridStyle}>
          <FormField label="Duration in minutes">
            <input
              type="number"
              min="0"
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(
                  event.target.value
                )
              }
              placeholder="Optional"
              style={inputStyle}
            />
          </FormField>

          <FormField label="Captions link">
            <input
              type="url"
              value={captionsUrl}
              onChange={(event) =>
                setCaptionsUrl(
                  event.target.value
                )
              }
              placeholder="Optional https:// link"
              style={inputStyle}
            />
          </FormField>
        </div>

        <FormField label="Transcript">
          <textarea
            value={transcript}
            onChange={(event) =>
              setTranscript(
                event.target.value
              )
            }
            placeholder="Optional transcript, supporting text or accessibility notes."
            style={textareaStyle}
          />
        </FormField>

        <label style={checkboxCardStyle}>
          <input
            type="checkbox"
            checked={
              accessibilityReviewed
            }
            onChange={(event) =>
              setAccessibilityReviewed(
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
              Accessibility reviewed
            </span>

            <span
              style={
                checkboxDescriptionStyle
              }
            >
              Confirm that the resource has been
              reviewed for appropriate captions,
              transcript, readability or
              alternative access.
            </span>
          </span>
        </label>

        <div style={formActionsStyle}>
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            style={secondaryButtonStyle}
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() =>
              void saveMedia()
            }
            disabled={saving}
            style={primaryButtonStyle}
          >
            {saving
              ? "Saving..."
              : formMode === "upload"
                ? "Upload Media"
                : "Add External Link"}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>
          Loading learning media...
        </div>
      ) : mediaRecords.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>
            ✦
          </div>

          <h4 style={emptyTitleStyle}>
            No learning media yet
          </h4>

          <p style={emptyDescriptionStyle}>
            Upload a file or add an external link
            when this learning resource needs
            supporting content.
          </p>
        </div>
      ) : (
        <div style={mediaGridStyle}>
          {mediaRecords.map((media) => (
            <div
              key={media.id}
              style={mediaCardStyle}
            >
              <div style={mediaHeaderStyle}>
                <div>
                  <div style={mediaTypeStyle}>
                    {media.media_type}
                  </div>

                  <h4 style={mediaTitleStyle}>
                    {media.file_name}
                  </h4>
                </div>

                <div
                  style={
                    accessibilityReviewedStyle
                  }
                >
                  {media.accessibility_reviewed
                    ? "Accessibility Reviewed"
                    : "Review Not Recorded"}
                </div>
              </div>

              <div style={mediaDetailsGridStyle}>
                <DetailItem
                  label="Source"
                  value={
                    media.external_url
                      ? "External Link"
                      : "Uploaded File"
                  }
                />

                <DetailItem
                  label="File Size"
                  value={
                    media.file_size_bytes !==
                    null
                      ? formatFileSize(
                          media.file_size_bytes
                        )
                      : "Not applicable"
                  }
                />

                <DetailItem
                  label="Duration"
                  value={
                    media.duration_seconds !==
                    null
                      ? formatDuration(
                          media.duration_seconds
                        )
                      : "Not set"
                  }
                />

                <DetailItem
                  label="Added"
                  value={new Date(
                    media.created_at
                  ).toLocaleDateString(
                    "en-GB"
                  )}
                />
              </div>

              {media.transcript && (
                <div style={transcriptPreviewStyle}>
                  <strong>
                    Transcript:
                  </strong>{" "}
                  {truncateText(
                    media.transcript,
                    180
                  )}
                </div>
              )}

              <div style={mediaActionsStyle}>
                <button
                  type="button"
                  onClick={() =>
                    void openMedia(media)
                  }
                  style={openButtonStyle}
                >
                  Open
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void archiveMedia(media)
                  }
                  style={archiveButtonStyle}
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryValueStyle}>
        {value}
      </div>

      <div style={summaryLabelStyle}>
        {label}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div style={detailValueStyle}>
        {value}
      </div>
    </div>
  );
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function formatFileSize(
  bytes: number
): string {
  if (!bytes) return "0 B";

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.min(
    Math.floor(
      Math.log(bytes) /
        Math.log(1024)
    ),
    units.length - 1
  );

  const value =
    bytes / Math.pow(1024, index);

  return `${value.toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function formatDuration(
  seconds: number
): string {
  const minutes = Math.floor(
    seconds / 60
  );

  const remainingSeconds =
    seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} seconds`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} minutes`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function truncateText(
  value: string,
  maximumLength: number
): string {
  if (
    value.length <= maximumLength
  ) {
    return value;
  }

  return `${value.slice(
    0,
    maximumLength
  )}…`;
}

const headerStyle: React.CSSProperties = {
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

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "10px",
  marginBottom: "16px",
};

const summaryCardStyle: React.CSSProperties = {
  padding: "14px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "12px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "21px",
  fontWeight: 800,
};

const summaryLabelStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "12px",
};

const formModeNavigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "12px",
};

const modeButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  padding: "8px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeModeButtonStyle: React.CSSProperties = {
  ...modeButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const formPanelStyle: React.CSSProperties = {
  padding: "17px",
  marginBottom: "18px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "13px",
};

const panelHeaderStyle: React.CSSProperties = {
  marginBottom: "2px",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const panelDescriptionStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.45,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "14px",
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
  minHeight: "100px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const checkboxCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  marginTop: "14px",
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

const checkboxDescriptionStyle: React.CSSProperties = {
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
  marginTop: "16px",
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

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
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

const emptyDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  fontSize: "14px",
};

const mediaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "12px",
};

const mediaCardStyle: React.CSSProperties = {
  padding: "16px",
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  background: "#FFFFFF",
};

const mediaHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const mediaTypeStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const mediaTitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#111827",
  fontSize: "16px",
};

const accessibilityReviewedStyle: React.CSSProperties = {
  padding: "5px 8px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
  textAlign: "center",
};

const mediaDetailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "12px",
  marginTop: "14px",
  paddingTop: "13px",
  borderTop: "1px solid #E5E7EB",
};

const detailLabelStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "11px",
};

const detailValueStyle: React.CSSProperties = {
  marginTop: "3px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const transcriptPreviewStyle: React.CSSProperties = {
  marginTop: "12px",
  padding: "10px",
  background: "#F9FAFB",
  borderRadius: "9px",
  color: "#4B5563",
  fontSize: "12px",
  lineHeight: 1.5,
};

const mediaActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  marginTop: "14px",
};

const openButtonStyle: React.CSSProperties = {
  background: "#111827",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "9px",
  padding: "8px 11px",
  fontWeight: 700,
  cursor: "pointer",
};

const archiveButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  padding: "8px 11px",
  fontWeight: 700,
  cursor: "pointer",
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