"use client";

import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CandidateEmployeeMode =
  | "candidate"
  | "employee";

export type CandidateEmployeeDetailsValue = {
  title: string;
  firstName: string;
  middleNames: string;
  lastName: string;
  preferredName: string;
  personalEmail: string;
  workEmail: string;
  personalTelephone: string;
  workTelephone: string;
  dateOfBirth: string;
  nationalInsuranceNumber: string;
  addressLine1: string;
  addressLine2: string;
  townOrCity: string;
  county: string;
  postcode: string;
  country: string;
  internalCandidate: boolean;
  employeeReference: string;
  notes: string;
};

export type CandidateEmployeeDetailsPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewDateOfBirth: boolean;
  canEditDateOfBirth: boolean;
  canViewNationalInsuranceNumber: boolean;
  canEditNationalInsuranceNumber: boolean;
};

export type CandidateEmployeeDetailsAuditEvent = {
  action:
    | "personal_details_edit_started"
    | "personal_details_edit_cancelled"
    | "personal_details_saved";
  mode: CandidateEmployeeMode;
  recordId?: string | number;
  changedFields?: string[];
  occurredAt: string;
};

export type CandidateEmployeeDetailsProps = {
  mode: CandidateEmployeeMode;
  value?: Partial<CandidateEmployeeDetailsValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<CandidateEmployeeDetailsPermissions>;
  startInEditMode?: boolean;
  saving?: boolean;
  disabled?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  onSave?: (
    value: CandidateEmployeeDetailsValue,
    changedFields: string[],
  ) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (
    event: CandidateEmployeeDetailsAuditEvent,
  ) => Promise<void> | void;
  headerActions?: ReactNode;
};

type ValidationErrors = Partial<
  Record<keyof CandidateEmployeeDetailsValue, string>
>;

const EMPTY_VALUE: CandidateEmployeeDetailsValue = {
  title: "",
  firstName: "",
  middleNames: "",
  lastName: "",
  preferredName: "",
  personalEmail: "",
  workEmail: "",
  personalTelephone: "",
  workTelephone: "",
  dateOfBirth: "",
  nationalInsuranceNumber: "",
  addressLine1: "",
  addressLine2: "",
  townOrCity: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
  internalCandidate: false,
  employeeReference: "",
  notes: "",
};

const DEFAULT_PERMISSIONS: CandidateEmployeeDetailsPermissions =
  {
    canView: true,
    canEdit: true,
    canViewDateOfBirth: true,
    canEditDateOfBirth: true,
    canViewNationalInsuranceNumber: true,
    canEditNationalInsuranceNumber: true,
  };

function normaliseValue(
  value?: Partial<CandidateEmployeeDetailsValue>,
): CandidateEmployeeDetailsValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    internalCandidate:
      value?.internalCandidate ?? false,
  };
}

function normaliseComparableValue(
  value: CandidateEmployeeDetailsValue,
): CandidateEmployeeDetailsValue {
  return {
    ...value,
    title: value.title.trim(),
    firstName: value.firstName.trim(),
    middleNames: value.middleNames.trim(),
    lastName: value.lastName.trim(),
    preferredName: value.preferredName.trim(),
    personalEmail: value.personalEmail
      .trim()
      .toLowerCase(),
    workEmail: value.workEmail.trim().toLowerCase(),
    personalTelephone:
      value.personalTelephone.trim(),
    workTelephone: value.workTelephone.trim(),
    nationalInsuranceNumber:
      value.nationalInsuranceNumber
        .trim()
        .toUpperCase()
        .replace(/\s+/g, " "),
    addressLine1: value.addressLine1.trim(),
    addressLine2: value.addressLine2.trim(),
    townOrCity: value.townOrCity.trim(),
    county: value.county.trim(),
    postcode: value.postcode
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " "),
    country: value.country.trim(),
    employeeReference:
      value.employeeReference.trim(),
    notes: value.notes.trim(),
  };
}

function getChangedFields(
  original: CandidateEmployeeDetailsValue,
  current: CandidateEmployeeDetailsValue,
): string[] {
  const originalNormalised =
    normaliseComparableValue(original);
  const currentNormalised =
    normaliseComparableValue(current);

  return (
    Object.keys(
      currentNormalised,
    ) as Array<keyof CandidateEmployeeDetailsValue>
  ).filter(
    (key) =>
      originalNormalised[key] !==
      currentNormalised[key],
  );
}

function isValidEmail(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim(),
  );
}

function isFutureDate(value: string): boolean {
  if (!value) {
    return false;
  }

  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return selectedDate.getTime() > today.getTime();
}

function validateDetails(
  value: CandidateEmployeeDetailsValue,
  mode: CandidateEmployeeMode,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!value.firstName.trim()) {
    errors.firstName = "Enter the first name.";
  }

  if (!value.lastName.trim()) {
    errors.lastName = "Enter the last name.";
  }

  if (
    value.personalEmail &&
    !isValidEmail(value.personalEmail)
  ) {
    errors.personalEmail =
      "Enter a valid personal email address.";
  }

  if (
    value.workEmail &&
    !isValidEmail(value.workEmail)
  ) {
    errors.workEmail =
      "Enter a valid work email address.";
  }

  if (
    value.dateOfBirth &&
    isFutureDate(value.dateOfBirth)
  ) {
    errors.dateOfBirth =
      "The date of birth cannot be in the future.";
  }

  if (
    value.nationalInsuranceNumber &&
    value.nationalInsuranceNumber
      .replace(/\s/g, "")
      .length > 9
  ) {
    errors.nationalInsuranceNumber =
      "Check the National Insurance number.";
  }

  if (
    mode === "employee" &&
    value.internalCandidate
  ) {
    errors.internalCandidate =
      "Internal candidate status only applies before employee handover.";
  }

  return errors;
}

function FieldLabel({
  children,
  required,
  sensitive,
}: {
  children: ReactNode;
  required?: boolean;
  sensitive?: boolean;
}) {
  return (
    <label style={styles.fieldLabel}>
      <span>{children}</span>

      {required ? (
        <span
          aria-hidden="true"
          style={styles.requiredMark}
        >
          *
        </span>
      ) : null}

      {sensitive ? (
        <span
          title="Sensitive personal information"
          style={styles.sensitiveLabel}
        >
          <LockKeyhole size={11} />
          Restricted
        </span>
      ) : null}
    </label>
  );
}

function FieldError({
  message,
}: {
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" style={styles.fieldError}>
      <AlertCircle size={12} />
      {message}
    </p>
  );
}

function ReadOnlyValue({
  value,
  fallback = "Not recorded",
  restricted = false,
}: {
  value?: string;
  fallback?: string;
  restricted?: boolean;
}) {
  if (restricted) {
    return (
      <span style={styles.restrictedValue}>
        <LockKeyhole size={13} />
        Restricted
      </span>
    );
  }

  return (
    <span
      style={{
        ...styles.readOnlyValue,
        ...(!value ? styles.readOnlyEmpty : {}),
      }}
    >
      {value || fallback}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <header style={styles.sectionHeader}>
      <span style={styles.sectionIcon}>{icon}</span>

      <div>
        <h3 style={styles.sectionTitle}>{title}</h3>

        <p style={styles.sectionDescription}>
          {description}
        </p>
      </div>
    </header>
  );
}

export default function CandidateEmployeeDetails({
  mode,
  value,
  recordId,
  recordLabel,
  permissions,
  startInEditMode = false,
  saving = false,
  disabled = false,
  errorMessage,
  successMessage,
  onSave,
  onCancel,
  onAudit,
  headerActions,
}: CandidateEmployeeDetailsProps) {
  const resolvedPermissions = useMemo(
    () => ({
      ...DEFAULT_PERMISSIONS,
      ...permissions,
    }),
    [permissions],
  );

  const suppliedValue = useMemo(
    () => normaliseValue(value),
    [value],
  );

  const [originalValue, setOriginalValue] =
    useState<CandidateEmployeeDetailsValue>(
      suppliedValue,
    );

  const [draft, setDraft] =
    useState<CandidateEmployeeDetailsValue>(
      suppliedValue,
    );

  const [editing, setEditing] = useState(
    startInEditMode &&
      resolvedPermissions.canEdit,
  );

  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>({});

  const [localSaving, setLocalSaving] =
    useState(false);

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;

  useEffect(() => {
    setOriginalValue(suppliedValue);
    setDraft(suppliedValue);
    setValidationErrors({});
  }, [suppliedValue]);

  const changedFields = useMemo(
    () => getChangedFields(originalValue, draft),
    [draft, originalValue],
  );

  const isDirty = changedFields.length > 0;

  const modeLabel =
    mode === "candidate" ? "Candidate" : "Employee";

  const displayName =
    recordLabel?.trim() ||
    [
      draft.preferredName || draft.firstName,
      draft.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    modeLabel;

  function updateField<
    Key extends keyof CandidateEmployeeDetailsValue,
  >(
    key: Key,
    nextValue: CandidateEmployeeDetailsValue[Key],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: nextValue,
    }));

    setValidationErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[key];

      return nextErrors;
    });
  }

  async function recordAudit(
    action: CandidateEmployeeDetailsAuditEvent["action"],
    fields?: string[],
  ) {
    if (!onAudit) {
      return;
    }

    await onAudit({
      action,
      mode,
      recordId,
      changedFields: fields,
      occurredAt: new Date().toISOString(),
    });
  }

  async function beginEditing() {
    if (
      !resolvedPermissions.canEdit ||
      isDisabled
    ) {
      return;
    }

    setEditing(true);
    await recordAudit(
      "personal_details_edit_started",
    );
  }

  async function cancelEditing() {
    setDraft(originalValue);
    setValidationErrors({});
    setEditing(false);
    onCancel?.();

    await recordAudit(
      "personal_details_edit_cancelled",
    );
  }

  function resetChanges() {
    setDraft(originalValue);
    setValidationErrors({});
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !resolvedPermissions.canEdit ||
      isDisabled ||
      !onSave
    ) {
      return;
    }

    const errors = validateDetails(draft, mode);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const cleanValue =
      normaliseComparableValue(draft);

    const fields = getChangedFields(
      originalValue,
      cleanValue,
    );

    if (fields.length === 0) {
      setEditing(false);
      return;
    }

    try {
      setLocalSaving(true);

      await onSave(cleanValue, fields);

      setOriginalValue(cleanValue);
      setDraft(cleanValue);
      setValidationErrors({});
      setEditing(false);

      await recordAudit(
        "personal_details_saved",
        fields,
      );
    } finally {
      setLocalSaving(false);
    }
  }

  if (!resolvedPermissions.canView) {
    return (
      <section style={styles.accessCard}>
        <span style={styles.accessIcon}>
          <LockKeyhole size={20} />
        </span>

        <div>
          <h2 style={styles.accessTitle}>
            Personal details are restricted
          </h2>

          <p style={styles.accessText}>
            Your current permission level does not allow
            access to this information.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.card}>
      <header style={styles.cardHeader}>
        <div style={styles.identity}>
          <span style={styles.identityIcon}>
            {mode === "candidate" ? (
              <UserRound size={21} />
            ) : (
              <BriefcaseBusiness size={21} />
            )}
          </span>

          <div style={{ minWidth: 0 }}>
            <div style={styles.titleRow}>
              <h2 style={styles.cardTitle}>
                Personal details
              </h2>

              <span style={styles.modeBadge}>
                {modeLabel} mode
              </span>
            </div>

            <p style={styles.cardSubtitle}>
              {displayName}
              {recordId !== undefined
                ? ` · Record ${String(recordId)}`
                : ""}
            </p>
          </div>
        </div>

        <div style={styles.headerActions}>
          {headerActions}

          {!editing &&
          resolvedPermissions.canEdit ? (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={beginEditing}
              disabled={isDisabled}
            >
              <Pencil size={15} />
              Edit details
            </button>
          ) : null}
        </div>
      </header>

      {errorMessage ? (
        <div role="alert" style={styles.errorBanner}>
          <AlertCircle size={17} />

          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          style={styles.successBanner}
        >
          <Check size={17} />

          <span>{successMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div style={styles.content}>
          <section style={styles.section}>
            <SectionHeader
              icon={<UserRound size={18} />}
              title="Identity"
              description="Core identity information used throughout the employment lifecycle."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>Title</FieldLabel>

                {editing ? (
                  <select
                    value={draft.title}
                    onChange={(event) =>
                      updateField(
                        "title",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  >
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Miss">Miss</option>
                    <option value="Ms">Ms</option>
                    <option value="Mx">Mx</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">
                      Prof
                    </option>
                    <option value="Other">
                      Other
                    </option>
                  </select>
                ) : (
                  <ReadOnlyValue value={draft.title} />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel required>
                  First name
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="text"
                      value={draft.firstName}
                      onChange={(event) =>
                        updateField(
                          "firstName",
                          event.target.value,
                        )
                      }
                      autoComplete="given-name"
                      style={{
                        ...styles.input,
                        ...(validationErrors.firstName
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                      aria-invalid={
                        Boolean(
                          validationErrors.firstName,
                        )
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.firstName
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.firstName}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Middle name(s)
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.middleNames}
                    onChange={(event) =>
                      updateField(
                        "middleNames",
                        event.target.value,
                      )
                    }
                    autoComplete="additional-name"
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.middleNames}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel required>
                  Last name
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="text"
                      value={draft.lastName}
                      onChange={(event) =>
                        updateField(
                          "lastName",
                          event.target.value,
                        )
                      }
                      autoComplete="family-name"
                      style={{
                        ...styles.input,
                        ...(validationErrors.lastName
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                      aria-invalid={
                        Boolean(
                          validationErrors.lastName,
                        )
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.lastName
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.lastName}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Preferred name
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.preferredName}
                    onChange={(event) =>
                      updateField(
                        "preferredName",
                        event.target.value,
                      )
                    }
                    autoComplete="nickname"
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.preferredName}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel sensitive>
                  Date of birth
                </FieldLabel>

                {!resolvedPermissions.canViewDateOfBirth ? (
                  <ReadOnlyValue restricted />
                ) : editing &&
                  resolvedPermissions.canEditDateOfBirth ? (
                  <>
                    <input
                      type="date"
                      value={draft.dateOfBirth}
                      onChange={(event) =>
                        updateField(
                          "dateOfBirth",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.dateOfBirth
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                      aria-invalid={
                        Boolean(
                          validationErrors.dateOfBirth,
                        )
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.dateOfBirth
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.dateOfBirth}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel sensitive>
                  National Insurance number
                </FieldLabel>

                {!resolvedPermissions.canViewNationalInsuranceNumber ? (
                  <ReadOnlyValue restricted />
                ) : editing &&
                  resolvedPermissions.canEditNationalInsuranceNumber ? (
                  <>
                    <input
                      type="text"
                      value={
                        draft.nationalInsuranceNumber
                      }
                      onChange={(event) =>
                        updateField(
                          "nationalInsuranceNumber",
                          event.target.value.toUpperCase(),
                        )
                      }
                      placeholder="QQ 12 34 56 C"
                      autoComplete="off"
                      style={{
                        ...styles.input,
                        ...(validationErrors.nationalInsuranceNumber
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                      aria-invalid={
                        Boolean(
                          validationErrors.nationalInsuranceNumber,
                        )
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.nationalInsuranceNumber
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.nationalInsuranceNumber
                    }
                  />
                )}
              </div>

              {mode === "candidate" ? (
                <div style={styles.field}>
                  <FieldLabel>
                    Candidate type
                  </FieldLabel>

                  {editing ? (
                    <label style={styles.checkboxCard}>
                      <input
                        type="checkbox"
                        checked={
                          draft.internalCandidate
                        }
                        onChange={(event) =>
                          updateField(
                            "internalCandidate",
                            event.target.checked,
                          )
                        }
                        disabled={isDisabled}
                      />

                      <span>
                        Existing employee applying
                        internally
                      </span>
                    </label>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.internalCandidate
                          ? "Internal candidate"
                          : "External candidate"
                      }
                    />
                  )}
                </div>
              ) : (
                <div style={styles.field}>
                  <FieldLabel>
                    Employee reference
                  </FieldLabel>

                  {editing ? (
                    <input
                      type="text"
                      value={
                        draft.employeeReference
                      }
                      onChange={(event) =>
                        updateField(
                          "employeeReference",
                          event.target.value,
                        )
                      }
                      style={styles.input}
                      disabled={isDisabled}
                    />
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.employeeReference
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<Mail size={18} />}
              title="Contact information"
              description="Personal and work contact details remain clearly separated."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Personal email
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="email"
                      value={draft.personalEmail}
                      onChange={(event) =>
                        updateField(
                          "personalEmail",
                          event.target.value,
                        )
                      }
                      autoComplete="email"
                      style={{
                        ...styles.input,
                        ...(validationErrors.personalEmail
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.personalEmail
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.personalEmail}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Work email
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="email"
                      value={draft.workEmail}
                      onChange={(event) =>
                        updateField(
                          "workEmail",
                          event.target.value,
                        )
                      }
                      autoComplete="work email"
                      style={{
                        ...styles.input,
                        ...(validationErrors.workEmail
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.workEmail
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.workEmail}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Personal telephone
                </FieldLabel>

                {editing ? (
                  <div style={styles.iconInput}>
                    <Phone size={15} />

                    <input
                      type="tel"
                      value={
                        draft.personalTelephone
                      }
                      onChange={(event) =>
                        updateField(
                          "personalTelephone",
                          event.target.value,
                        )
                      }
                      autoComplete="tel"
                      style={styles.iconInputControl}
                      disabled={isDisabled}
                    />
                  </div>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.personalTelephone
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Work telephone
                </FieldLabel>

                {editing ? (
                  <div style={styles.iconInput}>
                    <Phone size={15} />

                    <input
                      type="tel"
                      value={draft.workTelephone}
                      onChange={(event) =>
                        updateField(
                          "workTelephone",
                          event.target.value,
                        )
                      }
                      style={styles.iconInputControl}
                      disabled={isDisabled}
                    />
                  </div>
                ) : (
                  <ReadOnlyValue
                    value={draft.workTelephone}
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<MapPin size={18} />}
              title="Home address"
              description="The current residential or correspondence address."
            />

            <div style={styles.formGrid}>
              <div
                style={{
                  ...styles.field,
                  gridColumn: "1 / -1",
                }}
              >
                <FieldLabel>
                  Address line 1
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.addressLine1}
                    onChange={(event) =>
                      updateField(
                        "addressLine1",
                        event.target.value,
                      )
                    }
                    autoComplete="address-line1"
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.addressLine1}
                  />
                )}
              </div>

              <div
                style={{
                  ...styles.field,
                  gridColumn: "1 / -1",
                }}
              >
                <FieldLabel>
                  Address line 2
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.addressLine2}
                    onChange={(event) =>
                      updateField(
                        "addressLine2",
                        event.target.value,
                      )
                    }
                    autoComplete="address-line2"
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.addressLine2}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Town or city
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.townOrCity}
                    onChange={(event) =>
                      updateField(
                        "townOrCity",
                        event.target.value,
                      )
                    }
                    autoComplete="address-level2"
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.townOrCity}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>County</FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.county}
                    onChange={(event) =>
                      updateField(
                        "county",
                        event.target.value,
                      )
                    }
                    autoComplete="address-level1"
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.county}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>Postcode</FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.postcode}
                    onChange={(event) =>
                      updateField(
                        "postcode",
                        event.target.value.toUpperCase(),
                      )
                    }
                    autoComplete="postal-code"
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.postcode}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>Country</FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.country}
                    onChange={(event) =>
                      updateField(
                        "country",
                        event.target.value,
                      )
                    }
                    autoComplete="country-name"
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.country}
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<ShieldCheck size={18} />}
              title="Record notes"
              description="Limited factual notes relevant to maintaining this record."
            />

            <div style={styles.field}>
              <FieldLabel>Notes</FieldLabel>

              {editing ? (
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value,
                    )
                  }
                  rows={5}
                  style={styles.textarea}
                  disabled={isDisabled}
                  placeholder="Add concise, factual information relevant to this record."
                />
              ) : (
                <ReadOnlyValue
                  value={draft.notes}
                  fallback="No record notes"
                />
              )}
            </div>
          </section>
        </div>

        {editing ? (
          <footer style={styles.footer}>
            <div style={styles.changeSummary}>
              {isDirty ? (
                <>
                  <span style={styles.unsavedDot} />
                  {changedFields.length} unsaved{" "}
                  {changedFields.length === 1
                    ? "change"
                    : "changes"}
                </>
              ) : (
                <>
                  <Check size={14} />
                  No unsaved changes
                </>
              )}
            </div>

            <div style={styles.footerActions}>
              <button
                type="button"
                style={styles.tertiaryButton}
                onClick={resetChanges}
                disabled={!isDirty || isDisabled}
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={cancelEditing}
                disabled={isDisabled}
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={
                  !isDirty ||
                  isDisabled ||
                  !onSave
                }
              >
                {isSaving ? (
                  <Loader2
                    size={15}
                    className="leo-shared-spin"
                  />
                ) : (
                  <Save size={15} />
                )}

                {isSaving
                  ? "Saving..."
                  : "Save details"}
              </button>
            </div>
          </footer>
        ) : null}
      </form>

      <style>
        {`
          @keyframes leo-shared-spin {
            to {
              transform: rotate(360deg);
            }
          }

          .leo-shared-spin {
            animation: leo-shared-spin 0.8s linear infinite;
          }

          @media (max-width: 760px) {
            .leo-shared-details-header {
              align-items: flex-start !important;
              flex-direction: column !important;
            }
          }
        `}
      </style>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    overflow: "hidden",
    border: "1px solid #E7DDED",
    borderRadius: "18px",
    background: "#FFFFFF",
    boxShadow: "0 12px 32px rgba(71, 49, 81, 0.05)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "20px 22px",
    borderBottom: "1px solid #EEE5F2",
    background:
      "linear-gradient(135deg, #FFFFFF 0%, #FCF9FE 100%)",
  },
  identity: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minWidth: 0,
  },
  identityIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    flex: "0 0 auto",
    borderRadius: "13px",
    background: "#F2EAF7",
    color: "#6E5084",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "9px",
  },
  cardTitle: {
    margin: 0,
    color: "#342B38",
    fontSize: "17px",
    fontWeight: 800,
    letterSpacing: "-0.01em",
  },
  cardSubtitle: {
    margin: "4px 0 0",
    overflow: "hidden",
    color: "#847789",
    fontSize: "12px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  modeBadge: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #DDCEE7",
    borderRadius: "999px",
    background: "#F8F2FB",
    color: "#6E5084",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "9px",
  },
  content: {
    display: "grid",
    gap: "18px",
    padding: "22px",
  },
  section: {
    padding: "20px",
    border: "1px solid #ECE4F0",
    borderRadius: "15px",
    background: "#FFFFFF",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    marginBottom: "18px",
  },
  sectionIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flex: "0 0 auto",
    borderRadius: "10px",
    background: "#F5EFF8",
    color: "#6E5084",
  },
  sectionTitle: {
    margin: 0,
    color: "#403545",
    fontSize: "14px",
    fontWeight: 800,
  },
  sectionDescription: {
    margin: "4px 0 0",
    color: "#8B7F90",
    fontSize: "11px",
    lineHeight: 1.5,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "17px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },
  fieldLabel: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "5px",
    color: "#594D5E",
    fontSize: "11px",
    fontWeight: 750,
  },
  requiredMark: {
    color: "#8E5F72",
  },
  sensitiveLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    marginLeft: "3px",
    borderRadius: "999px",
    background: "#F3EEF5",
    color: "#75687A",
    padding: "3px 6px",
    fontSize: "9px",
    fontWeight: 750,
  },
  input: {
    width: "100%",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #DCCFE3",
    borderRadius: "10px",
    outline: "none",
    background: "#FFFFFF",
    color: "#3F3543",
    padding: "10px 11px",
    font: "inherit",
    fontSize: "12px",
  },
  inputError: {
    borderColor: "#B97988",
    boxShadow: "0 0 0 3px rgba(185, 121, 136, 0.10)",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    border: "1px solid #DCCFE3",
    borderRadius: "10px",
    outline: "none",
    background: "#FFFFFF",
    color: "#3F3543",
    padding: "11px",
    font: "inherit",
    fontSize: "12px",
    lineHeight: 1.55,
  },
  iconInput: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #DCCFE3",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#8B7C90",
    padding: "0 11px",
  },
  iconInputControl: {
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    color: "#3F3543",
    padding: "10px 0",
    font: "inherit",
    fontSize: "12px",
  },
  checkboxCard: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #DED3E4",
    borderRadius: "10px",
    background: "#FAF7FC",
    color: "#55495A",
    padding: "10px 11px",
    fontSize: "11px",
    fontWeight: 650,
    cursor: "pointer",
  },
  readOnlyValue: {
    display: "flex",
    alignItems: "center",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #EEE7F1",
    borderRadius: "10px",
    background: "#FBF9FC",
    color: "#4D414F",
    padding: "10px 11px",
    fontSize: "12px",
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
  },
  readOnlyEmpty: {
    color: "#A094A5",
    fontStyle: "italic",
  },
  restrictedValue: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #EEE7F1",
    borderRadius: "10px",
    background: "#F8F5F9",
    color: "#847888",
    padding: "10px 11px",
    fontSize: "11px",
    fontWeight: 700,
  },
  fieldError: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    margin: 0,
    color: "#9A5668",
    fontSize: "10px",
    lineHeight: 1.4,
  },
  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    margin: "18px 22px 0",
    border: "1px solid #E8CBD2",
    borderRadius: "11px",
    background: "#FFF7F8",
    color: "#8B4E5D",
    padding: "11px 13px",
    fontSize: "11px",
    lineHeight: 1.5,
  },
  successBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    margin: "18px 22px 0",
    border: "1px solid #CFE6D8",
    borderRadius: "11px",
    background: "#F5FCF8",
    color: "#527460",
    padding: "11px 13px",
    fontSize: "11px",
    lineHeight: 1.5,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "14px",
    padding: "16px 22px",
    borderTop: "1px solid #EEE6F1",
    background: "#FCFAFD",
  },
  changeSummary: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#7C7081",
    fontSize: "11px",
    fontWeight: 650,
  },
  unsavedDot: {
    width: "7px",
    height: "7px",
    borderRadius: "999px",
    background: "#8A6B9D",
  },
  footerActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minHeight: "38px",
    border: "1px solid #6E5084",
    borderRadius: "9px",
    background: "#6E5084",
    color: "#FFFFFF",
    padding: "8px 13px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minHeight: "38px",
    border: "1px solid #DCCFE3",
    borderRadius: "9px",
    background: "#FFFFFF",
    color: "#6E5084",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },
  tertiaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    minHeight: "38px",
    border: 0,
    borderRadius: "9px",
    background: "transparent",
    color: "#766A7A",
    padding: "8px 10px",
    fontSize: "11px",
    fontWeight: 750,
    cursor: "pointer",
  },
  accessCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    border: "1px solid #E6DCEB",
    borderRadius: "16px",
    background: "#FBF8FC",
    padding: "20px",
  },
  accessIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    flex: "0 0 auto",
    borderRadius: "11px",
    background: "#F0E8F4",
    color: "#6E5084",
  },
  accessTitle: {
    margin: 0,
    color: "#493C4E",
    fontSize: "14px",
    fontWeight: 800,
  },
  accessText: {
    margin: "5px 0 0",
    color: "#827687",
    fontSize: "11px",
    lineHeight: 1.5,
  },
};