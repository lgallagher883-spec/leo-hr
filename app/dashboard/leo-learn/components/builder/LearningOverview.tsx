"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { LearningModule } from "./LearningWorkspace";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  learningModule: LearningModule;
  onUpdated: () => Promise<void>;
};

type LearningCategory = {
  id: number;
  name: string;
};

type LearningProvider = {
  id: number;
  name: string;
};

const learningTypes = [
  "Course",
  "Video",
  "Document",
  "Presentation",
  "Live Session",
  "External Link",
  "Practical Learning",
  "Guide",
  "Other",
];

const deliveryMethods = [
  "Online",
  "In Person",
  "Blended",
  "Self-Directed",
  "External",
];

const statuses = [
  "Draft",
  "Under Review",
  "Published",
];

export default function LearningOverview({
  learningModule,
  onUpdated,
}: Props) {
  const [categories, setCategories] = useState<
    LearningCategory[]
  >([]);

  const [providers, setProviders] = useState<
    LearningProvider[]
  >([]);

  const [title, setTitle] = useState(
    learningModule.title
  );

  const [description, setDescription] = useState(
    learningModule.description || ""
  );

  const [learningType, setLearningType] = useState(
    learningModule.learning_type
  );

  const [deliveryMethod, setDeliveryMethod] = useState(
    learningModule.delivery_method
  );

  const [categoryId, setCategoryId] = useState(
    learningModule.category_id
      ? String(learningModule.category_id)
      : ""
  );

  const [providerId, setProviderId] = useState(
    learningModule.provider_id
      ? String(learningModule.provider_id)
      : ""
  );

  const [status, setStatus] = useState(
    learningModule.status
  );

  const [durationMinutes, setDurationMinutes] =
    useState(
      learningModule.estimated_duration_minutes !==
        null
        ? String(
            learningModule.estimated_duration_minutes
          )
        : ""
    );

  const [
    reviewFrequencyMonths,
    setReviewFrequencyMonths,
  ] = useState(
    learningModule.review_frequency_months !== null
      ? String(
          learningModule.review_frequency_months
        )
      : ""
  );

  const [nextReviewDate, setNextReviewDate] =
    useState(
      learningModule.next_review_date || ""
    );

  const [
    assignmentEligible,
    setAssignmentEligible,
  ] = useState(
    learningModule.assignment_eligible
  );

  const [
    certificateAvailable,
    setCertificateAvailable,
  ] = useState(
    learningModule.certificate_available
  );

  const [
    assessmentRequired,
    setAssessmentRequired,
  ] = useState(
    learningModule.assessment_required
  );

  const [
    managerValidationRequired,
    setManagerValidationRequired,
  ] = useState(
    learningModule.manager_validation_required
  );

  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] =
    useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    setTitle(learningModule.title);
    setDescription(
      learningModule.description || ""
    );
    setLearningType(
      learningModule.learning_type
    );
    setDeliveryMethod(
      learningModule.delivery_method
    );
    setCategoryId(
      learningModule.category_id
        ? String(learningModule.category_id)
        : ""
    );
    setProviderId(
      learningModule.provider_id
        ? String(learningModule.provider_id)
        : ""
    );
    setStatus(learningModule.status);
    setDurationMinutes(
      learningModule.estimated_duration_minutes !==
        null
        ? String(
            learningModule.estimated_duration_minutes
          )
        : ""
    );
    setReviewFrequencyMonths(
      learningModule.review_frequency_months !== null
        ? String(
            learningModule.review_frequency_months
          )
        : ""
    );
    setNextReviewDate(
      learningModule.next_review_date || ""
    );
    setAssignmentEligible(
      learningModule.assignment_eligible
    );
    setCertificateAvailable(
      learningModule.certificate_available
    );
    setAssessmentRequired(
      learningModule.assessment_required
    );
    setManagerValidationRequired(
      learningModule.manager_validation_required
    );
  }, [learningModule]);

  async function loadOptions() {
    const [
      categoriesResult,
      providersResult,
    ] = await Promise.all([
      supabase
        .from("learning_categories")
        .select("id, name")
        .eq("is_archived", false)
        .eq("is_active", true)
        .order("display_order", {
          ascending: true,
        }),

      supabase
        .from("learning_providers")
        .select("id, name")
        .eq("is_archived", false)
        .eq("is_active", true)
        .order("name", {
          ascending: true,
        }),
    ]);

    if (categoriesResult.error) {
      console.error(
        "Error loading learning categories:",
        categoriesResult.error
      );
    } else {
      setCategories(
        (categoriesResult.data ||
          []) as LearningCategory[]
      );
    }

    if (providersResult.error) {
      console.error(
        "Error loading learning providers:",
        providersResult.error
      );
    } else {
      setProviders(
        (providersResult.data ||
          []) as LearningProvider[]
      );
    }
  }

  async function saveOverview() {
    if (!title.trim()) {
      setErrorMessage(
        "Enter a learning title."
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

    if (
      reviewFrequencyMonths &&
      Number(reviewFrequencyMonths) < 1
    ) {
      setErrorMessage(
        "Review frequency must be at least one month."
      );
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("learning_modules")
      .update({
        title: title.trim(),
        description:
          description.trim() || null,
        learning_type: learningType,
        delivery_method: deliveryMethod,
        category_id: categoryId
          ? Number(categoryId)
          : null,
        provider_id: providerId
          ? Number(providerId)
          : null,
        status,
        estimated_duration_minutes:
          durationMinutes
            ? Number(durationMinutes)
            : null,
        review_frequency_months:
          reviewFrequencyMonths
            ? Number(reviewFrequencyMonths)
            : null,
        next_review_date:
          nextReviewDate || null,
        assignment_eligible:
          assignmentEligible,
        certificate_available:
          certificateAvailable,
        assessment_required:
          assessmentRequired,
        manager_validation_required:
          managerValidationRequired,
      })
      .eq("id", learningModule.id);

    if (error) {
      console.error(
        "Error updating learning overview:",
        error
      );

      setErrorMessage(
        "The learning overview could not be updated."
      );

      setSaving(false);
      return;
    }

    setMessage("Learning overview updated.");
    setSaving(false);

    await onUpdated();
  }

  async function archiveLearning() {
    const confirmed = window.confirm(
      `Archive "${learningModule.title}"?\n\nThe learning resource and its history will remain preserved.`
    );

    if (!confirmed) return;

    setArchiving(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("learning_modules")
      .update({
        status: "Archived",
        is_archived: true,
        archived_at:
          new Date().toISOString(),
      })
      .eq("id", learningModule.id);

    if (error) {
      console.error(
        "Error archiving learning resource:",
        error
      );

      setErrorMessage(
        "The learning resource could not be archived."
      );

      setArchiving(false);
      return;
    }

    setMessage(
      "The learning resource has been archived."
    );

    setArchiving(false);
  }

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>Overview</h3>

          <p style={descriptionStyle}>
            Maintain the core details, delivery
            settings and publication position for this
            learning resource.
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

      <div style={formGridStyle}>
        <FormField label="Learning title">
          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            style={inputStyle}
          />
        </FormField>

        <FormField label="Status">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            style={inputStyle}
          >
            {statuses.map((statusOption) => (
              <option
                key={statusOption}
                value={statusOption}
              >
                {statusOption}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Description">
        <textarea
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Explain what this learning covers and why it matters."
          style={textareaStyle}
        />
      </FormField>

      <div style={formGridStyle}>
        <FormField label="Learning type">
          <select
            value={learningType}
            onChange={(event) =>
              setLearningType(
                event.target.value
              )
            }
            style={inputStyle}
          >
            {learningTypes.map((type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Delivery method">
          <select
            value={deliveryMethod}
            onChange={(event) =>
              setDeliveryMethod(
                event.target.value
              )
            }
            style={inputStyle}
          >
            {deliveryMethods.map((method) => (
              <option
                key={method}
                value={method}
              >
                {method}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div style={formGridStyle}>
        <FormField label="Category">
          <select
            value={categoryId}
            onChange={(event) =>
              setCategoryId(
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              No category selected
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Provider">
          <select
            value={providerId}
            onChange={(event) =>
              setProviderId(
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              No provider selected
            </option>

            {providers.map((provider) => (
              <option
                key={provider.id}
                value={provider.id}
              >
                {provider.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

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
            placeholder="For example, 30"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Review frequency in months">
          <input
            type="number"
            min="1"
            value={reviewFrequencyMonths}
            onChange={(event) =>
              setReviewFrequencyMonths(
                event.target.value
              )
            }
            placeholder="For example, 12"
            style={inputStyle}
          />
        </FormField>
      </div>

      <FormField label="Next review date">
        <input
          type="date"
          value={nextReviewDate}
          onChange={(event) =>
            setNextReviewDate(
              event.target.value
            )
          }
          style={inputStyle}
        />
      </FormField>

      <div style={optionsGridStyle}>
        <CheckboxField
          label="May be assigned to employees"
          description="This learning can be allocated directly to individual employees."
          checked={assignmentEligible}
          onChange={setAssignmentEligible}
        />

        <CheckboxField
          label="Certificate available"
          description="A certificate may be issued when the learning is completed."
          checked={certificateAvailable}
          onChange={setCertificateAvailable}
        />

        <CheckboxField
          label="Assessment required"
          description="Completion requires an assessment or knowledge check."
          checked={assessmentRequired}
          onChange={setAssessmentRequired}
        />

        <CheckboxField
          label="Manager validation required"
          description="A manager must confirm the practical learning or evidence."
          checked={
            managerValidationRequired
          }
          onChange={
            setManagerValidationRequired
          }
        />
      </div>

      <div style={actionsStyle}>
        <button
          type="button"
          onClick={() =>
            void archiveLearning()
          }
          disabled={saving || archiving}
          style={archiveButtonStyle}
        >
          {archiving
            ? "Archiving..."
            : "Archive Learning"}
        </button>

        <button
          type="button"
          onClick={() =>
            void saveOverview()
          }
          disabled={saving || archiving}
          style={{
            ...primaryButtonStyle,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving
            ? "Saving..."
            : "Save Overview"}
        </button>
      </div>
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

function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={checkboxCardStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />

      <span>
        <span style={checkboxTitleStyle}>
          {label}
        </span>

        <span
          style={checkboxDescriptionStyle}
        >
          {description}
        </span>
      </span>
    </label>
  );
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

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginBottom: "15px",
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
  minHeight: "110px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const optionsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "10px",
  marginTop: "4px",
};

const checkboxCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "13px",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
  background: "#F9FAFB",
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
    lineHeight: 1.45,
  };

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginTop: "20px",
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

const archiveButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "15px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "15px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};