"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type VacancyStatus =
  | "draft"
  | "approval_required"
  | "approved"
  | "open";

type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved";

type PlatformRole =
  | "Owner"
  | "Senior"
  | "Manager"
  | "Employee";

type VacancyForm = {
  vacancyReference: string;
  title: string;
  department: string;
  locationName: string;
  hiringManagerName: string;
  recruitmentLeadName: string;
  employmentType: string;
  workPattern: string;
  hoursPerWeek: string;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: string;
  salaryCurrency: string;
  salaryVisible: boolean;
  numberOfPositions: string;
  openingDate: string;
  closingDate: string;
  targetStartDate: string;
  approvalRequired: boolean;
  isInternalOnly: boolean;
  acceptsInternalCandidates: boolean;
  blindReviewEnabled: boolean;
  aiScreeningEnabled: boolean;
  dueDiligenceRequired: boolean;
  regulatedRole: boolean;
  requiresDbs: boolean;
  requiresDriving: boolean;
  requiresQualificationChecks: boolean;
  requiredReferenceCount: string;
};

type FormErrors = Partial<Record<keyof VacancyForm, string>>;

type UserContext = {
  userId: string | null;
  organisationId: string | number | null;
  role: PlatformRole;
};

const initialForm: VacancyForm = {
  vacancyReference: "",
  title: "",
  department: "",
  locationName: "",
  hiringManagerName: "",
  recruitmentLeadName: "",
  employmentType: "Permanent",
  workPattern: "Full time",
  hoursPerWeek: "",
  salaryMin: "",
  salaryMax: "",
  salaryPeriod: "per annum",
  salaryCurrency: "GBP",
  salaryVisible: true,
  numberOfPositions: "1",
  openingDate: "",
  closingDate: "",
  targetStartDate: "",
  approvalRequired: false,
  isInternalOnly: false,
  acceptsInternalCandidates: true,
  blindReviewEnabled: false,
  aiScreeningEnabled: false,
  dueDiligenceRequired: true,
  regulatedRole: false,
  requiresDbs: false,
  requiresDriving: false,
  requiresQualificationChecks: false,
  requiredReferenceCount: "1",
};

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(value: unknown): PlatformRole {
  const role = readText(value).toLowerCase();

  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";
  if (role === "employee") return "Employee";

  return "Owner";
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalNumber(value: string): number | null {
  if (!value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function generateVacancyReference(): string {
  const year = new Date().getFullYear();
  const stamp = Date.now().toString().slice(-6);
  return `VAC-${year}-${stamp}`;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function CreateVacancyPage() {
  const router = useRouter();

  const [form, setForm] = useState<VacancyForm>(() => ({
    ...initialForm,
    vacancyReference: generateVacancyReference(),
    openingDate: getToday(),
  }));

  const [errors, setErrors] = useState<FormErrors>({});
  const [userContext, setUserContext] = useState<UserContext>({
    userId: null,
    organisationId: null,
    role: "Owner",
  });
  const [loadingContext, setLoadingContext] = useState(true);
  const [savingMode, setSavingMode] = useState<
    "draft" | "open" | null
  >(null);
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const canCreate =
    roleRank[userContext.role] >= roleRank.Manager;

  const dueDiligenceSummary = useMemo(() => {
    const items: string[] = [];

    if (form.dueDiligenceRequired) {
      items.push("standard identity and employment checks");
    }

    items.push(
      `${form.requiredReferenceCount || "0"} reference${
        form.requiredReferenceCount === "1" ? "" : "s"
      }`,
    );

    if (form.requiresDbs) items.push("DBS");
    if (form.requiresDriving) items.push("driving");
    if (form.requiresQualificationChecks) {
      items.push("qualification verification");
    }
    if (form.regulatedRole) items.push("regulated role controls");

    return items;
  }, [form]);

  const loadUserContext = useCallback(async () => {
    setLoadingContext(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserContext({
          userId: null,
          organisationId: null,
          role: "Owner",
        });
        return;
      }

      const possibleColumns = [
        "user_id",
        "auth_user_id",
        "id",
      ];

      let profile: Record<string, unknown> | null = null;

      for (const column of possibleColumns) {
        const result = await supabase
          .from("user_profiles")
          .select("*")
          .eq(column, user.id)
          .limit(1);

        if (!result.error && result.data?.length) {
          profile = result.data[0] as Record<string, unknown>;
          break;
        }
      }

      setUserContext({
        userId: user.id,
        organisationId:
          (profile?.organisation_id as string | number | null) ??
          null,
        role: normaliseRole(
          profile?.platform_role ??
            profile?.role ??
            profile?.access_level,
        ),
      });
    } catch (error) {
      console.warn(
        "Vacancy permissions could not be loaded:",
        error,
      );

      setUserContext({
        userId: null,
        organisationId: null,
        role: "Owner",
      });
    } finally {
      setLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    void loadUserContext();
  }, [loadUserContext]);

  function updateField<K extends keyof VacancyForm>(
    field: K,
    value: VacancyForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) return current;

      const next = { ...current };
      delete next[field];
      return next;
    });

    setPageError("");
    setPageMessage("");
  }

  function validateForm(
    intendedStatus: "draft" | "open",
  ): FormErrors {
    const nextErrors: FormErrors = {};

    if (!form.vacancyReference.trim()) {
      nextErrors.vacancyReference =
        "Enter a vacancy reference.";
    }

    if (!form.title.trim()) {
      nextErrors.title = "Enter the vacancy title.";
    }

    if (!form.employmentType.trim()) {
      nextErrors.employmentType =
        "Select an employment type.";
    }

    const positions = Number(form.numberOfPositions);

    if (
      !Number.isInteger(positions) ||
      positions < 1
    ) {
      nextErrors.numberOfPositions =
        "Enter at least one position.";
    }

    if (
      form.hoursPerWeek &&
      (Number(form.hoursPerWeek) <= 0 ||
        Number(form.hoursPerWeek) > 168)
    ) {
      nextErrors.hoursPerWeek =
        "Enter valid weekly hours.";
    }

    if (
      form.salaryMin &&
      Number(form.salaryMin) < 0
    ) {
      nextErrors.salaryMin =
        "Salary cannot be negative.";
    }

    if (
      form.salaryMax &&
      Number(form.salaryMax) < 0
    ) {
      nextErrors.salaryMax =
        "Salary cannot be negative.";
    }

    if (
      form.salaryMin &&
      form.salaryMax &&
      Number(form.salaryMax) <
        Number(form.salaryMin)
    ) {
      nextErrors.salaryMax =
        "Maximum salary must not be below the minimum.";
    }

    const referenceCount = Number(
      form.requiredReferenceCount,
    );

    if (
      !Number.isInteger(referenceCount) ||
      referenceCount < 0 ||
      referenceCount > 5
    ) {
      nextErrors.requiredReferenceCount =
        "Enter between zero and five references.";
    }

    if (
      form.regulatedRole &&
      referenceCount < 2
    ) {
      nextErrors.requiredReferenceCount =
        "Regulated roles should require at least two references.";
    }

    if (
      form.openingDate &&
      form.closingDate &&
      form.closingDate < form.openingDate
    ) {
      nextErrors.closingDate =
        "Closing date must be on or after the opening date.";
    }

    if (
      form.closingDate &&
      form.targetStartDate &&
      form.targetStartDate < form.closingDate
    ) {
      nextErrors.targetStartDate =
        "Target start date must be after the closing date.";
    }

    if (intendedStatus === "open") {
      if (!form.department.trim()) {
        nextErrors.department =
          "Enter a department before opening the vacancy.";
      }

      if (!form.locationName.trim()) {
        nextErrors.locationName =
          "Enter a location before opening the vacancy.";
      }

      if (!form.hiringManagerName.trim()) {
        nextErrors.hiringManagerName =
          "Enter a hiring manager before opening the vacancy.";
      }

      if (!form.openingDate) {
        nextErrors.openingDate =
          "Set an opening date before opening the vacancy.";
      }

      if (!form.closingDate) {
        nextErrors.closingDate =
          "Set a closing date before opening the vacancy.";
      }
    }

    return nextErrors;
  }

  async function writeAuditEvent(
    vacancyId: string,
    action: string,
  ) {
    try {
      await supabase
        .from("talent_analytics_events")
        .insert({
          organisation_id:
            userContext.organisationId,
          event_type: action,
          entity_type: "vacancy",
          entity_id: vacancyId,
          actor_user_id: userContext.userId,
          metadata: {
            vacancy_reference:
              form.vacancyReference.trim(),
            vacancy_title: form.title.trim(),
          },
        });
    } catch (error) {
      console.warn(
        "Vacancy audit event could not be recorded:",
        error,
      );
    }
  }

  async function saveVacancy(
    intendedStatus: "draft" | "open",
  ) {
    setPageError("");
    setPageMessage("");

    if (!canCreate) {
      setPageError(
        "You do not have access to create vacancies.",
      );
      return;
    }

    const nextErrors = validateForm(intendedStatus);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setPageError(
        "Please review the highlighted information before saving.",
      );
      return;
    }

    setSavingMode(intendedStatus);

    const approvalStatus: ApprovalStatus =
      form.approvalRequired
        ? "pending"
        : intendedStatus === "open"
          ? "approved"
          : "not_required";

    const vacancyStatus: VacancyStatus =
      form.approvalRequired
        ? "approval_required"
        : intendedStatus === "open"
          ? "open"
          : "draft";

    const now = new Date().toISOString();

    const payload = {
      organisation_id:
        userContext.organisationId,
      vacancy_reference:
        form.vacancyReference.trim(),
      title: form.title.trim(),
      department: optionalText(form.department),
      location_name: optionalText(
        form.locationName,
      ),
      hiring_manager_name: optionalText(
        form.hiringManagerName,
      ),
      recruitment_lead_name: optionalText(
        form.recruitmentLeadName,
      ),
      employment_type: form.employmentType,
      work_pattern: optionalText(form.workPattern),
      hours_per_week: optionalNumber(
        form.hoursPerWeek,
      ),
      salary_min: optionalNumber(form.salaryMin),
      salary_max: optionalNumber(form.salaryMax),
      salary_period: optionalText(
        form.salaryPeriod,
      ),
      salary_currency:
        form.salaryCurrency || "GBP",
      salary_visible: form.salaryVisible,
      number_of_positions: Number(
        form.numberOfPositions,
      ),
      status: vacancyStatus,
      approval_status: approvalStatus,
      opening_date: form.openingDate || null,
      closing_date: form.closingDate || null,
      target_start_date:
        form.targetStartDate || null,
      is_internal_only: form.isInternalOnly,
      accepts_internal_candidates:
        form.acceptsInternalCandidates,
      blind_review_enabled:
        form.blindReviewEnabled,
      ai_screening_enabled:
        form.aiScreeningEnabled,
      safer_recruitment_required:
        form.dueDiligenceRequired,
      regulated_role: form.regulatedRole,
      requires_dbs: form.requiresDbs,
      requires_driving: form.requiresDriving,
      requires_qualification_checks:
        form.requiresQualificationChecks,
      required_reference_count: Number(
        form.requiredReferenceCount,
      ),
      archived_at: null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("talent_vacancies")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error(
        "Vacancy could not be created:",
        error,
      );

      setPageError(
        `Leo could not create this vacancy. ${error.message}`,
      );
      setSavingMode(null);
      return;
    }

    const vacancyId = String(data.id);

    await writeAuditEvent(
      vacancyId,
      vacancyStatus === "open"
        ? "vacancy_opened"
        : vacancyStatus ===
            "approval_required"
          ? "vacancy_submitted_for_approval"
          : "vacancy_created",
    );

    setPageMessage(
      vacancyStatus === "open"
        ? "Vacancy created and opened for applications."
        : vacancyStatus ===
            "approval_required"
          ? "Vacancy created and submitted for approval."
          : "Vacancy saved as a draft.",
    );

    router.push(
      `/dashboard/leo-talent/recruitment/${vacancyId}`,
    );
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void saveVacancy("draft");
  }

  function handleCancel() {
    const hasEnteredInformation =
      form.title.trim() ||
      form.department.trim() ||
      form.locationName.trim() ||
      form.hiringManagerName.trim() ||
      form.salaryMin.trim() ||
      form.salaryMax.trim() ||
      form.closingDate;

    if (
      hasEnteredInformation &&
      !window.confirm(
        "Leave this page? Unsaved vacancy information will be lost.",
      )
    ) {
      return;
    }

    router.push("/dashboard/leo-talent");
  }

  if (loadingContext) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingPanel}>
          <h1 style={styles.loadingTitle}>
            Preparing vacancy workspace…
          </h1>

          <p style={styles.loadingText}>
            Leo is loading your recruitment access and
            organisation settings.
          </p>
        </div>
      </main>
    );
  }

  if (!canCreate) {
    return (
      <main style={styles.page}>
        <div style={styles.accessPanel}>
          <p style={styles.eyebrow}>LEO TALENT</p>

          <h1 style={styles.pageTitle}>
            Create Vacancy
          </h1>

          <p style={styles.accessText}>
            You do not have access to create vacancies
            within your current permission level.
          </p>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() =>
              router.push("/dashboard/leo-talent")
            }
          >
            Return to Leo Talent
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>LEO TALENT</p>

          <h1 style={styles.pageTitle}>
            Create Vacancy
          </h1>

          <p style={styles.pageDescription}>
            Set up the role, recruitment controls and
            Due Diligence requirements before applications
            begin.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={handleCancel}
          disabled={savingMode !== null}
        >
          Cancel
        </button>
      </div>

      {pageError ? (
        <div role="alert" style={styles.errorMessage}>
          {pageError}
        </div>
      ) : null}

      {pageMessage ? (
        <div role="status" style={styles.successMessage}>
          {pageMessage}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        style={styles.form}
        noValidate
      >
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Vacancy Details
              </h2>

              <p style={styles.sectionDescription}>
                Record the information used to identify
                and manage the recruitment campaign.
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Field
              label="Vacancy reference"
              required
              error={errors.vacancyReference}
            >
              <input
                type="text"
                value={form.vacancyReference}
                onChange={(event) =>
                  updateField(
                    "vacancyReference",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.vacancyReference),
                )}
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Vacancy title"
              required
              error={errors.title}
            >
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  updateField(
                    "title",
                    event.target.value,
                  )
                }
                style={inputStyle(Boolean(errors.title))}
                placeholder="For example, Nursery Manager"
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Department"
              error={errors.department}
            >
              <input
                type="text"
                value={form.department}
                onChange={(event) =>
                  updateField(
                    "department",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.department),
                )}
                placeholder="For example, Operations"
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Location"
              error={errors.locationName}
            >
              <input
                type="text"
                value={form.locationName}
                onChange={(event) =>
                  updateField(
                    "locationName",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.locationName),
                )}
                placeholder="Site, office or remote"
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Hiring manager"
              error={errors.hiringManagerName}
            >
              <input
                type="text"
                value={form.hiringManagerName}
                onChange={(event) =>
                  updateField(
                    "hiringManagerName",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.hiringManagerName),
                )}
                placeholder="Person responsible for the appointment"
                disabled={savingMode !== null}
              />
            </Field>

            <Field label="Recruitment lead">
              <input
                type="text"
                value={form.recruitmentLeadName}
                onChange={(event) =>
                  updateField(
                    "recruitmentLeadName",
                    event.target.value,
                  )
                }
                style={styles.input}
                placeholder="Optional recruitment coordinator"
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Number of positions"
              required
              error={errors.numberOfPositions}
            >
              <input
                type="number"
                min="1"
                step="1"
                value={form.numberOfPositions}
                onChange={(event) =>
                  updateField(
                    "numberOfPositions",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.numberOfPositions),
                )}
                disabled={savingMode !== null}
              />
            </Field>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Employment and Pay
              </h2>

              <p style={styles.sectionDescription}>
                Define the contract, working pattern and
                salary information candidates will see.
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Field
              label="Employment type"
              required
              error={errors.employmentType}
            >
              <select
                value={form.employmentType}
                onChange={(event) =>
                  updateField(
                    "employmentType",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.employmentType),
                )}
                disabled={savingMode !== null}
              >
                <option>Permanent</option>
                <option>Fixed term</option>
                <option>Temporary</option>
                <option>Casual</option>
                <option>Zero hours</option>
                <option>Apprenticeship</option>
                <option>Internship</option>
                <option>Volunteer</option>
              </select>
            </Field>

            <Field label="Working pattern">
              <select
                value={form.workPattern}
                onChange={(event) =>
                  updateField(
                    "workPattern",
                    event.target.value,
                  )
                }
                style={styles.input}
                disabled={savingMode !== null}
              >
                <option>Full time</option>
                <option>Part time</option>
                <option>Flexible</option>
                <option>Shift work</option>
                <option>Term time</option>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>Other</option>
              </select>
            </Field>

            <Field
              label="Hours per week"
              error={errors.hoursPerWeek}
            >
              <input
                type="number"
                min="0"
                max="168"
                step="0.25"
                value={form.hoursPerWeek}
                onChange={(event) =>
                  updateField(
                    "hoursPerWeek",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.hoursPerWeek),
                )}
                placeholder="For example, 37.5"
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Minimum salary"
              error={errors.salaryMin}
            >
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.salaryMin}
                onChange={(event) =>
                  updateField(
                    "salaryMin",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.salaryMin),
                )}
                placeholder="0.00"
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Maximum salary"
              error={errors.salaryMax}
            >
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.salaryMax}
                onChange={(event) =>
                  updateField(
                    "salaryMax",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.salaryMax),
                )}
                placeholder="0.00"
                disabled={savingMode !== null}
              />
            </Field>

            <Field label="Salary period">
              <select
                value={form.salaryPeriod}
                onChange={(event) =>
                  updateField(
                    "salaryPeriod",
                    event.target.value,
                  )
                }
                style={styles.input}
                disabled={savingMode !== null}
              >
                <option value="per annum">
                  Per annum
                </option>
                <option value="per month">
                  Per month
                </option>
                <option value="per week">
                  Per week
                </option>
                <option value="per day">
                  Per day
                </option>
                <option value="per hour">
                  Per hour
                </option>
              </select>
            </Field>

            <Field label="Currency">
              <select
                value={form.salaryCurrency}
                onChange={(event) =>
                  updateField(
                    "salaryCurrency",
                    event.target.value,
                  )
                }
                style={styles.input}
                disabled={savingMode !== null}
              >
                <option value="GBP">GBP — £</option>
                <option value="EUR">EUR — €</option>
                <option value="USD">USD — $</option>
              </select>
            </Field>
          </div>

          <div style={styles.optionGrid}>
            <ToggleCard
              checked={form.salaryVisible}
              onChange={(checked) =>
                updateField("salaryVisible", checked)
              }
              title="Display salary"
              description="Show the salary information in candidate-facing recruitment content."
              disabled={savingMode !== null}
            />

            <ToggleCard
              checked={form.isInternalOnly}
              onChange={(checked) =>
                updateField("isInternalOnly", checked)
              }
              title="Internal-only vacancy"
              description="Limit this campaign to existing employees."
              disabled={savingMode !== null}
            />

            <ToggleCard
              checked={form.acceptsInternalCandidates}
              onChange={(checked) =>
                updateField(
                  "acceptsInternalCandidates",
                  checked,
                )
              }
              title="Accept internal candidates"
              description="Allow existing employees to apply alongside external candidates."
              disabled={savingMode !== null}
            />
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Dates and Controls
              </h2>

              <p style={styles.sectionDescription}>
                Set the campaign dates and decide whether
                approval is required before recruitment opens.
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Field
              label="Opening date"
              error={errors.openingDate}
            >
              <input
                type="date"
                value={form.openingDate}
                onChange={(event) =>
                  updateField(
                    "openingDate",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.openingDate),
                )}
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Closing date"
              error={errors.closingDate}
            >
              <input
                type="date"
                value={form.closingDate}
                onChange={(event) =>
                  updateField(
                    "closingDate",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.closingDate),
                )}
                disabled={savingMode !== null}
              />
            </Field>

            <Field
              label="Target start date"
              error={errors.targetStartDate}
            >
              <input
                type="date"
                value={form.targetStartDate}
                onChange={(event) =>
                  updateField(
                    "targetStartDate",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(errors.targetStartDate),
                )}
                disabled={savingMode !== null}
              />
            </Field>
          </div>

          <div style={styles.optionGrid}>
            <ToggleCard
              checked={form.approvalRequired}
              onChange={(checked) =>
                updateField(
                  "approvalRequired",
                  checked,
                )
              }
              title="Approval required"
              description="Submit the vacancy for approval rather than opening it immediately."
              disabled={savingMode !== null}
            />

            <ToggleCard
              checked={form.blindReviewEnabled}
              onChange={(checked) =>
                updateField(
                  "blindReviewEnabled",
                  checked,
                )
              }
              title="Blind review"
              description="Support initial application review without candidate-identifying information."
              disabled={savingMode !== null}
            />

            <ToggleCard
              checked={form.aiScreeningEnabled}
              onChange={(checked) =>
                updateField(
                  "aiScreeningEnabled",
                  checked,
                )
              }
              title="AI-assisted screening"
              description="Allow Leo to support review. Human decision-makers remain responsible for every outcome."
              disabled={savingMode !== null}
            />
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Due Diligence
              </h2>

              <p style={styles.sectionDescription}>
                Define the checks that must be completed
                before appointment or onboarding.
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Field
              label="References required"
              required
              error={errors.requiredReferenceCount}
              hint="Regulated roles should normally require two references."
            >
              <input
                type="number"
                min="0"
                max="5"
                step="1"
                value={form.requiredReferenceCount}
                onChange={(event) =>
                  updateField(
                    "requiredReferenceCount",
                    event.target.value,
                  )
                }
                style={inputStyle(
                  Boolean(
                    errors.requiredReferenceCount,
                  ),
                )}
                disabled={savingMode !== null}
              />
            </Field>
          </div>

          <div style={styles.optionGrid}>
            <ToggleCard
              checked={form.dueDiligenceRequired}
              onChange={(checked) =>
                updateField(
                  "dueDiligenceRequired",
                  checked,
                )
              }
              title="Due Diligence required"
              description="Require the standard pre-employment verification workflow."
              disabled={savingMode !== null}
            />

            <ToggleCard
              checked={form.regulatedRole}
              onChange={(checked) => {
                updateField("regulatedRole", checked);

                if (
                  checked &&
                  Number(
                    form.requiredReferenceCount,
                  ) < 2
                ) {
                  updateField(
                    "requiredReferenceCount",
                    "2",
                  );
                }
              }}
              title="Regulated role"
              description="Apply enhanced controls for regulated or inspection-sensitive work."
              disabled={savingMode !== null}
            />

            <ToggleCard
              checked={form.requiresDbs}
              onChange={(checked) =>
                updateField("requiresDbs", checked)
              }
              title="DBS required"
              description="Require the appropriate DBS route for work in England and Wales."
              disabled={savingMode !== null}
            />

            <ToggleCard
              checked={form.requiresDriving}
              onChange={(checked) =>
                updateField(
                  "requiresDriving",
                  checked,
                )
              }
              title="Driving checks required"
              description="Verify licence, eligibility and any role-specific driving requirements."
              disabled={savingMode !== null}
            />

            <ToggleCard
              checked={
                form.requiresQualificationChecks
              }
              onChange={(checked) =>
                updateField(
                  "requiresQualificationChecks",
                  checked,
                )
              }
              title="Qualification checks required"
              description="Verify qualifications, registrations or professional memberships."
              disabled={savingMode !== null}
            />
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.summaryIcon}>✦</div>

            <div>
              <h3 style={styles.summaryTitle}>
                Due Diligence summary
              </h3>

              <p style={styles.summaryText}>
                This vacancy currently requires{" "}
                {dueDiligenceSummary.length
                  ? dueDiligenceSummary.join(", ")
                  : "no additional checks"}
                .
              </p>

              <p style={styles.summaryNote}>
                Where a candidate has lived or worked
                overseas, the appointment workflow should
                also consider an overseas police check or
                certificate of good conduct where relevant.
              </p>
            </div>
          </div>
        </section>

        <div style={styles.footerActions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleCancel}
            disabled={savingMode !== null}
          >
            Cancel
          </button>

          <div style={styles.footerActionGroup}>
            <button
              type="submit"
              style={styles.secondaryButton}
              disabled={savingMode !== null}
            >
              {savingMode === "draft"
                ? "Saving draft…"
                : "Save as draft"}
            </button>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() =>
                void saveVacancy("open")
              }
              disabled={savingMode !== null}
            >
              {savingMode === "open"
                ? form.approvalRequired
                  ? "Submitting…"
                  : "Creating vacancy…"
                : form.approvalRequired
                  ? "Submit for approval"
                  : "Create and open vacancy"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  required = false,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}
        {required ? (
          <span style={styles.required}> *</span>
        ) : null}
      </span>

      {children}

      {error ? (
        <span style={styles.fieldError}>{error}</span>
      ) : hint ? (
        <span style={styles.hint}>{hint}</span>
      ) : null}
    </label>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
  disabled: boolean;
}) {
  return (
    <label
      style={{
        ...styles.toggleCard,
        ...(checked
          ? styles.toggleCardActive
          : {}),
        ...(disabled
          ? styles.disabledCard
          : {}),
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        disabled={disabled}
        style={styles.checkbox}
      />

      <span style={styles.toggleContent}>
        <span style={styles.toggleTitle}>
          {title}
        </span>

        <span style={styles.toggleDescription}>
          {description}
        </span>
      </span>
    </label>
  );
}

function inputStyle(hasError: boolean): CSSProperties {
  return hasError
    ? {
        ...styles.input,
        borderColor: "#C96B82",
        background: "#FFF9FA",
      }
    : styles.input;
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    maxWidth: "1400px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    flexWrap: "wrap",
    padding: "24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  pageTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "30px",
    lineHeight: 1.2,
  },
  pageDescription: {
    margin: "8px 0 0",
    maxWidth: "760px",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  section: {
    padding: "22px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  sectionHeader: {
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "19px",
  },
  sectionDescription: {
    margin: "7px 0 0",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },
  label: {
    color: "#374151",
    fontSize: "13px",
    fontWeight: 700,
  },
  required: {
    color: "#6E5084",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "42px",
    padding: "10px 12px",
    background: "#FFFFFF",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    color: "#111827",
    fontSize: "14px",
    outline: "none",
  },
  fieldError: {
    color: "#9F4058",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  hint: {
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  optionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "12px",
    marginTop: "18px",
  },
  toggleCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    minHeight: "94px",
    padding: "16px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "14px",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  toggleCardActive: {
    background: "#F7F1FC",
    borderColor: "#CDB2E2",
  },
  disabledCard: {
    opacity: 0.65,
    cursor: "default",
  },
  checkbox: {
    width: "17px",
    height: "17px",
    marginTop: "2px",
    accentColor: "#6E5084",
    flexShrink: 0,
  },
  toggleContent: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  toggleTitle: {
    color: "#6E5084",
    fontSize: "14px",
    fontWeight: 750,
  },
  toggleDescription: {
    color: "#6B7280",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  summaryBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginTop: "18px",
    padding: "18px",
    background: "#F7F1FC",
    border: "1px solid #E8DDF0",
    borderRadius: "14px",
  },
  summaryIcon: {
    color: "#6E5084",
    fontSize: "22px",
    lineHeight: 1,
  },
  summaryTitle: {
    margin: 0,
    color: "#4A3657",
    fontSize: "15px",
  },
  summaryText: {
    margin: "7px 0 0",
    color: "#66556F",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  summaryNote: {
    margin: "7px 0 0",
    color: "#75677D",
    fontSize: "12px",
    lineHeight: 1.55,
  },
  footerActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    padding: "18px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  footerActionGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    minHeight: "42px",
    padding: "10px 15px",
    background: "#6E5084",
    border: "1px solid #6E5084",
    borderRadius: "10px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: "42px",
    padding: "10px 15px",
    background: "#FFFFFF",
    border: "1px solid #CDB2E2",
    borderRadius: "10px",
    color: "#6E5084",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  errorMessage: {
    padding: "14px 16px",
    background: "#FFF8FA",
    border: "1px solid #E7CBD2",
    borderRadius: "12px",
    color: "#7D4654",
    fontSize: "14px",
  },
  successMessage: {
    padding: "14px 16px",
    background: "#F5FFF9",
    border: "1px solid #CFE9DA",
    borderRadius: "12px",
    color: "#38634A",
    fontSize: "14px",
  },
  loadingPanel: {
    padding: "42px 24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    textAlign: "center",
  },
  loadingTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px",
  },
  loadingText: {
    margin: "8px 0 0",
    color: "#6B7280",
    fontSize: "14px",
  },
  accessPanel: {
    padding: "28px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  accessText: {
    margin: "10px 0 20px",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
};