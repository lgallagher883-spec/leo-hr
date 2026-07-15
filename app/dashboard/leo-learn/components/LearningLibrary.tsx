"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import LearningWorkspace from "./builder/LearningWorkspace";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const moduleStatuses = [
  "Draft",
  "Under Review",
  "Published",
];

export default function LearningLibrary() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [categories, setCategories] = useState<
    LearningCategory[]
  >([]);
  const [providers, setProviders] = useState<
    LearningProvider[]
  >([]);

  const [workspaceModule, setWorkspaceModule] =
    useState<LearningModule | null>(null);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [learningType, setLearningType] =
    useState("Course");
  const [deliveryMethod, setDeliveryMethod] =
    useState("Online");
  const [categoryId, setCategoryId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [status, setStatus] = useState("Draft");
  const [durationMinutes, setDurationMinutes] =
    useState("");
  const [
    reviewFrequencyMonths,
    setReviewFrequencyMonths,
  ] = useState("12");
  const [nextReviewDate, setNextReviewDate] =
    useState("");
  const [
    assignmentEligible,
    setAssignmentEligible,
  ] = useState(true);
  const [
    certificateAvailable,
    setCertificateAvailable,
  ] = useState(false);
  const [
    assessmentRequired,
    setAssessmentRequired,
  ] = useState(false);
  const [
    managerValidationRequired,
    setManagerValidationRequired,
  ] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    void loadLibrary();
  }, []);

  async function loadLibrary(): Promise<void> {
    setLoading(true);
    setErrorMessage("");

    const [
      modulesResult,
      categoriesResult,
      providersResult,
    ] = await Promise.all([
      supabase
        .from("learning_modules")
        .select(
          `
          id,
          title,
          description,
          learning_type,
          delivery_method,
          category_id,
          provider_id,
          status,
          estimated_duration_minutes,
          assignment_eligible,
          certificate_available,
          assessment_required,
          manager_validation_required,
          review_frequency_months,
          last_reviewed_at,
          next_review_date,
          current_version_number,
          source_type,
          created_at,
          updated_at
          `
        )
        .eq("is_archived", false)
        .order("updated_at", { ascending: false }),

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
        .order("name", { ascending: true }),
    ]);

    if (modulesResult.error) {
      console.error(
        "Error loading learning modules:",
        modulesResult.error
      );
      setErrorMessage(
        "The Learning Library could not be loaded."
      );
      setLoading(false);
      return;
    }

    if (categoriesResult.error) {
      console.error(
        "Error loading learning categories:",
        categoriesResult.error
      );
      setErrorMessage(
        "Learning categories could not be loaded."
      );
      setLoading(false);
      return;
    }

    if (providersResult.error) {
      console.error(
        "Error loading learning providers:",
        providersResult.error
      );
      setErrorMessage(
        "Learning providers could not be loaded."
      );
      setLoading(false);
      return;
    }

    setModules(
      (modulesResult.data || []) as LearningModule[]
    );
    setCategories(
      (categoriesResult.data ||
        []) as LearningCategory[]
    );
    setProviders(
      (providersResult.data ||
        []) as LearningProvider[]
    );

    setLoading(false);
  }

  async function reloadWorkspaceModule(
    moduleId: number
  ): Promise<void> {
    const { data, error } = await supabase
      .from("learning_modules")
      .select(
        `
        id,
        title,
        description,
        learning_type,
        delivery_method,
        category_id,
        provider_id,
        status,
        estimated_duration_minutes,
        assignment_eligible,
        certificate_available,
        assessment_required,
        manager_validation_required,
        review_frequency_months,
        last_reviewed_at,
        next_review_date,
        current_version_number,
        source_type,
        created_at,
        updated_at
        `
      )
      .eq("id", moduleId)
      .single();

    if (error || !data) {
      console.error(
        "Error reloading learning module:",
        error
      );
      setErrorMessage(
        "The learning resource could not be refreshed."
      );
      return;
    }

    setWorkspaceModule(data as LearningModule);
  }

  const filteredModules = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return modules.filter((module) => {
      const matchesSearch =
        !search ||
        module.title.toLowerCase().includes(search) ||
        (module.description || "")
          .toLowerCase()
          .includes(search) ||
        module.learning_type
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        module.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        String(module.category_id || "") ===
          categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    modules,
    searchTerm,
    statusFilter,
    categoryFilter,
  ]);

  const publishedCount = modules.filter(
    (module) => module.status === "Published"
  ).length;

  const draftCount = modules.filter(
    (module) => module.status === "Draft"
  ).length;

  const underReviewCount = modules.filter(
    (module) =>
      module.status === "Under Review"
  ).length;

  const dueForReviewCount = modules.filter(
    (module) =>
      Boolean(module.next_review_date) &&
      module.next_review_date! <= getTodayDate()
  ).length;

  function resetCreateForm(): void {
    setTitle("");
    setDescription("");
    setLearningType("Course");
    setDeliveryMethod("Online");
    setCategoryId("");
    setProviderId("");
    setStatus("Draft");
    setDurationMinutes("");
    setReviewFrequencyMonths("12");
    setNextReviewDate("");
    setAssignmentEligible(true);
    setCertificateAvailable(false);
    setAssessmentRequired(false);
    setManagerValidationRequired(false);
    setErrorMessage("");
  }

  function openCreateForm(): void {
    resetCreateForm();
    setMessage("");
    setShowCreateForm(true);
  }

  async function createModule(): Promise<void> {
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

    const { data, error } = await supabase
      .from("learning_modules")
      .insert({
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
        source_type: "Employer Created",
      })
      .select(
        `
        id,
        title,
        description,
        learning_type,
        delivery_method,
        category_id,
        provider_id,
        status,
        estimated_duration_minutes,
        assignment_eligible,
        certificate_available,
        assessment_required,
        manager_validation_required,
        review_frequency_months,
        last_reviewed_at,
        next_review_date,
        current_version_number,
        source_type,
        created_at,
        updated_at
        `
      )
      .single();

    if (error || !data) {
      console.error(
        "Error creating learning module:",
        error
      );
      setErrorMessage(
        "The learning resource could not be created."
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowCreateForm(false);
    resetCreateForm();

    await loadLibrary();
    setWorkspaceModule(data as LearningModule);
  }

  if (workspaceModule) {
    return (
      <LearningWorkspace
        learningModule={workspaceModule}
        onBack={() => {
          setWorkspaceModule(null);
          void loadLibrary();
        }}
        onUpdated={async () => {
          await loadLibrary();
          await reloadWorkspaceModule(
            workspaceModule.id
          );
        }}
      />
    );
  }

  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>
            Learning Library
          </h2>

          <p style={workspaceDescriptionStyle}>
            Create, organise and maintain the
            organisation’s learning resources from one
            place.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          style={primaryButtonStyle}
        >
          Create Learning
        </button>
      </div>

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}

      {message && (
        <div style={messageStyle}>{message}</div>
      )}

      <div style={kpiGridStyle}>
        <KpiCard
          label="Total Learning Resources"
          value={String(modules.length)}
        />

        <KpiCard
          label="Published"
          value={String(publishedCount)}
        />

        <KpiCard
          label="Draft"
          value={String(draftCount)}
        />

        <KpiCard
          label="Under Review"
          value={String(underReviewCount)}
        />

        <KpiCard
          label="Due for Review"
          value={String(dueForReviewCount)}
        />

        <KpiCard
          label="Categories"
          value={String(categories.length)}
        />
      </div>

      {showCreateForm && (
        <div style={formPanelStyle}>
          <div style={formHeaderStyle}>
            <div>
              <h3 style={formTitleStyle}>
                Create Learning
              </h3>

              <p style={formDescriptionStyle}>
                Record the core details. The content,
                media, assessment and other settings
                will then be managed inside the learning
                workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetCreateForm();
              }}
              style={closeButtonStyle}
            >
              Close
            </button>
          </div>

          <div style={formGridStyle}>
            <FormField label="Learning title">
              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="For example, Fire Safety"
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
                {moduleStatuses.map(
                  (statusOption) => (
                    <option
                      key={statusOption}
                      value={statusOption}
                    >
                      {statusOption}
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Briefly explain the purpose of this learning."
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

          <div style={optionGridStyle}>
            <CheckboxField
              label="May be assigned to employees"
              checked={assignmentEligible}
              onChange={setAssignmentEligible}
            />

            <CheckboxField
              label="Certificate available"
              checked={certificateAvailable}
              onChange={setCertificateAvailable}
            />

            <CheckboxField
              label="Assessment required"
              checked={assessmentRequired}
              onChange={setAssessmentRequired}
            />

            <CheckboxField
              label="Manager validation required"
              checked={
                managerValidationRequired
              }
              onChange={
                setManagerValidationRequired
              }
            />
          </div>

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetCreateForm();
              }}
              disabled={saving}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void createModule()
              }
              disabled={saving}
              style={primaryButtonStyle}
            >
              {saving
                ? "Creating..."
                : "Create Learning"}
            </button>
          </div>
        </div>
      )}

      <div style={toolbarStyle}>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          placeholder="Search learning..."
          style={searchInputStyle}
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          style={filterStyle}
        >
          <option value="All">
            All statuses
          </option>

          {moduleStatuses.map(
            (statusOption) => (
              <option
                key={statusOption}
                value={statusOption}
              >
                {statusOption}
              </option>
            )
          )}
        </select>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value
            )
          }
          style={filterStyle}
        >
          <option value="All">
            All categories
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
      </div>

      {loading ? (
        <div style={emptyStateStyle}>
          Loading the Learning Library...
        </div>
      ) : filteredModules.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyStateIconStyle}>
            ✦
          </div>

          <h3 style={emptyStateTitleStyle}>
            No learning resources found
          </h3>

          <p style={emptyStateDescriptionStyle}>
            Create the organisation’s first
            learning resource or adjust the
            current search and filters.
          </p>
        </div>
      ) : (
        <div style={libraryGridStyle}>
          {filteredModules.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() =>
                setWorkspaceModule(module)
              }
              style={moduleCardStyle}
            >
              <div
                style={moduleCardHeaderStyle}
              >
                <div>
                  <div style={moduleStatusStyle}>
                    {module.status}
                  </div>

                  <h3 style={moduleTitleStyle}>
                    {module.title}
                  </h3>
                </div>

                <div style={versionStyle}>
                  v
                  {
                    module.current_version_number
                  }
                </div>
              </div>

              <p style={moduleDescriptionStyle}>
                {module.description ||
                  "No description has been added."}
              </p>

              <div style={moduleMetaGridStyle}>
                <ModuleMeta
                  label="Type"
                  value={module.learning_type}
                />

                <ModuleMeta
                  label="Delivery"
                  value={module.delivery_method}
                />

                <ModuleMeta
                  label="Duration"
                  value={
                    module.estimated_duration_minutes !==
                    null
                      ? `${module.estimated_duration_minutes} minutes`
                      : "Not set"
                  }
                />

                <ModuleMeta
                  label="Next Review"
                  value={
                    module.next_review_date
                      ? formatDate(
                          module.next_review_date
                        )
                      : "Not set"
                  }
                />
              </div>
            </button>
          ))}
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
  checked,
  onChange,
}: {
  label: string;
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

      <span>{label}</span>
    </label>
  );
}

function ModuleMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={moduleMetaLabelStyle}>
        {label}
      </div>

      <div style={moduleMetaValueStyle}>
        {value}
      </div>
    </div>
  );
}

function getTodayDate(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(
  dateValue: string
): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(`${dateValue}T12:00:00`)
  );
}

const workspaceHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
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

const kpiGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const kpiCardStyle: React.CSSProperties = {
  padding: "15px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "13px",
};

const kpiValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "24px",
  fontWeight: 800,
};

const kpiLabelStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.4,
};

const formPanelStyle: React.CSSProperties = {
  padding: "20px",
  marginBottom: "20px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const formHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
};

const formTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const formDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.5,
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
  marginTop: "16px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "100px",
  padding: "10px 12px",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1.5,
  resize: "vertical",
};

const optionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "10px",
  marginTop: "18px",
};

const checkboxCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  padding: "11px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 600,
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "20px",
};

const toolbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(240px, 1fr) 190px 210px",
  gap: "10px",
  marginBottom: "18px",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  boxSizing: "border-box",
};

const filterStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
};

const libraryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(290px, 1fr))",
  gap: "14px",
};

const moduleCardStyle: React.CSSProperties = {
  width: "100%",
  padding: "17px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  textAlign: "left",
  cursor: "pointer",
};

const moduleCardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const moduleStatusStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: "8px",
  padding: "5px 8px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const moduleTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "17px",
};

const versionStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: 700,
};

const moduleDescriptionStyle: React.CSSProperties = {
  minHeight: "42px",
  margin: "12px 0 16px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.55,
};

const moduleMetaGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "12px",
  paddingTop: "13px",
  borderTop: "1px solid #E5E7EB",
};

const moduleMetaLabelStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "11px",
  marginBottom: "3px",
};

const moduleMetaValueStyle: React.CSSProperties = {
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const emptyStateStyle: React.CSSProperties = {
  padding: "34px 20px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "14px",
  textAlign: "center",
  color: "#6B7280",
};

const emptyStateIconStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "23px",
  marginBottom: "8px",
};

const emptyStateTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const emptyStateDescriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: "14px",
  lineHeight: 1.6,
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "16px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "16px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};