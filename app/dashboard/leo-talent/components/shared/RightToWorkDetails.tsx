"use client";

import {
  AlertCircle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  History,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type RightToWorkMode =
  | "candidate"
  | "employee";

export type RightToWorkStatus =
  | "not_started"
  | "awaiting_evidence"
  | "awaiting_verification"
  | "verified"
  | "time_limited"
  | "follow_up_required"
  | "expired"
  | "not_required";

export type RightToWorkMethod =
  | ""
  | "manual_document_check"
  | "online_share_code"
  | "digital_identity_service"
  | "employer_checking_service"
  | "other";

export type RightToWorkDocumentType =
  | ""
  | "british_passport"
  | "irish_passport"
  | "birth_certificate"
  | "certificate_of_registration"
  | "biometric_residence_document"
  | "immigration_status_document"
  | "share_code"
  | "positive_verification_notice"
  | "other";

export type RightToWorkEvidence = {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  current: boolean;
};

export type RightToWorkVerificationHistoryEntry = {
  id: string;
  verifiedAt: string;
  verifiedBy: string;
  method: RightToWorkMethod;
  outcome:
    | "verified"
    | "time_limited"
    | "follow_up_required"
    | "not_verified";
  expiryDate?: string;
  followUpDate?: string;
  notes?: string;
};

export type RightToWorkValue = {
  status: RightToWorkStatus;
  method: RightToWorkMethod;
  documentType: RightToWorkDocumentType;
  documentReference: string;
  nationality: string;
  shareCode: string;
  dateOfCheck: string;
  checkedBy: string;
  expiryDate: string;
  followUpDate: string;
  restrictions: string;
  verificationOutcome: string;
  notes: string;
  evidence: RightToWorkEvidence[];
  verificationHistory: RightToWorkVerificationHistoryEntry[];
};

export type RightToWorkPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;
  canViewShareCode: boolean;
  canEditShareCode: boolean;
  canVerify: boolean;
  canViewHistory: boolean;
};

export type RightToWorkAuditEvent = {
  action:
    | "right_to_work_edit_started"
    | "right_to_work_edit_cancelled"
    | "right_to_work_saved"
    | "right_to_work_evidence_selected"
    | "right_to_work_evidence_removed"
    | "right_to_work_verification_recorded";
  mode: RightToWorkMode;
  recordId?: string | number;
  changedFields?: string[];
  evidenceId?: string;
  occurredAt: string;
};

export type RightToWorkSavePayload = {
  value: RightToWorkValue;
  changedFields: string[];
  newFiles: File[];
  removedEvidenceIds: string[];
};

export type RightToWorkDetailsProps = {
  mode: RightToWorkMode;
  value?: Partial<RightToWorkValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<RightToWorkPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (
    payload: RightToWorkSavePayload,
  ) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (
    event: RightToWorkAuditEvent,
  ) => Promise<void> | void;
};

type ValidationErrors = Partial<
  Record<keyof RightToWorkValue, string>
>;

type PendingFile = {
  id: string;
  file: File;
};

const EMPTY_VALUE: RightToWorkValue = {
  status: "not_started",
  method: "",
  documentType: "",
  documentReference: "",
  nationality: "",
  shareCode: "",
  dateOfCheck: "",
  checkedBy: "",
  expiryDate: "",
  followUpDate: "",
  restrictions: "",
  verificationOutcome: "",
  notes: "",
  evidence: [],
  verificationHistory: [],
};

const DEFAULT_PERMISSIONS: RightToWorkPermissions =
  {
    canView: true,
    canEdit: true,
    canViewEvidence: true,
    canUploadEvidence: true,
    canDeleteEvidence: true,
    canViewShareCode: true,
    canEditShareCode: true,
    canVerify: true,
    canViewHistory: true,
  };

const STATUS_OPTIONS: Array<{
  value: RightToWorkStatus;
  label: string;
}> = [
  {
    value: "not_started",
    label: "Not started",
  },
  {
    value: "awaiting_evidence",
    label: "Awaiting evidence",
  },
  {
    value: "awaiting_verification",
    label: "Awaiting verification",
  },
  {
    value: "verified",
    label: "Verified",
  },
  {
    value: "time_limited",
    label: "Time-limited permission",
  },
  {
    value: "follow_up_required",
    label: "Follow-up required",
  },
  {
    value: "expired",
    label: "Expired",
  },
  {
    value: "not_required",
    label: "Not required",
  },
];

const METHOD_OPTIONS: Array<{
  value: RightToWorkMethod;
  label: string;
}> = [
  {
    value: "",
    label: "Select checking method",
  },
  {
    value: "manual_document_check",
    label: "Manual document check",
  },
  {
    value: "online_share_code",
    label: "Home Office online share code",
  },
  {
    value: "digital_identity_service",
    label: "Digital identity verification service",
  },
  {
    value: "employer_checking_service",
    label: "Employer Checking Service",
  },
  {
    value: "other",
    label: "Other",
  },
];

const DOCUMENT_OPTIONS: Array<{
  value: RightToWorkDocumentType;
  label: string;
}> = [
  {
    value: "",
    label: "Select document type",
  },
  {
    value: "british_passport",
    label: "British passport",
  },
  {
    value: "irish_passport",
    label: "Irish passport",
  },
  {
    value: "birth_certificate",
    label: "Birth or adoption certificate",
  },
  {
    value: "certificate_of_registration",
    label: "Certificate of registration or naturalisation",
  },
  {
    value: "biometric_residence_document",
    label: "Biometric residence document",
  },
  {
    value: "immigration_status_document",
    label: "Immigration status document",
  },
  {
    value: "share_code",
    label: "Online share code",
  },
  {
    value: "positive_verification_notice",
    label: "Positive Verification Notice",
  },
  {
    value: "other",
    label: "Other",
  },
];

function normaliseValue(
  value?: Partial<RightToWorkValue>,
): RightToWorkValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    evidence: value?.evidence ?? [],
    verificationHistory:
      value?.verificationHistory ?? [],
  };
}

function normaliseComparableValue(
  value: RightToWorkValue,
): RightToWorkValue {
  return {
    ...value,
    documentReference:
      value.documentReference.trim(),
    nationality: value.nationality.trim(),
    shareCode: value.shareCode
      .trim()
      .toUpperCase(),
    checkedBy: value.checkedBy.trim(),
    restrictions: value.restrictions.trim(),
    verificationOutcome:
      value.verificationOutcome.trim(),
    notes: value.notes.trim(),
  };
}

function getChangedFields(
  original: RightToWorkValue,
  current: RightToWorkValue,
): string[] {
  const originalNormalised =
    normaliseComparableValue(original);

  const currentNormalised =
    normaliseComparableValue(current);

  const comparableKeys: Array<
    keyof RightToWorkValue
  > = [
    "status",
    "method",
    "documentType",
    "documentReference",
    "nationality",
    "shareCode",
    "dateOfCheck",
    "checkedBy",
    "expiryDate",
    "followUpDate",
    "restrictions",
    "verificationOutcome",
    "notes",
  ];

  return comparableKeys.filter(
    (key) =>
      originalNormalised[key] !==
      currentNormalised[key],
  );
}

function validateValue(
  value: RightToWorkValue,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const requiresVerification =
    value.status === "verified" ||
    value.status === "time_limited" ||
    value.status === "follow_up_required";

  if (requiresVerification && !value.method) {
    errors.method =
      "Select how the check was completed.";
  }

  if (
    requiresVerification &&
    !value.dateOfCheck
  ) {
    errors.dateOfCheck =
      "Enter the date the check was completed.";
  }

  if (
    requiresVerification &&
    !value.checkedBy.trim()
  ) {
    errors.checkedBy =
      "Enter who completed the check.";
  }

  if (
    value.method === "online_share_code" &&
    !value.shareCode.trim()
  ) {
    errors.shareCode =
      "Enter the share code used for the check.";
  }

  if (
    value.status === "time_limited" &&
    !value.expiryDate
  ) {
    errors.expiryDate =
      "Enter the permission expiry date.";
  }

  if (
    value.status === "follow_up_required" &&
    !value.followUpDate
  ) {
    errors.followUpDate =
      "Enter the next required check date.";
  }

  if (
    value.dateOfCheck &&
    value.expiryDate &&
    value.expiryDate < value.dateOfCheck
  ) {
    errors.expiryDate =
      "The expiry date cannot be before the check date.";
  }

  if (
    value.dateOfCheck &&
    value.followUpDate &&
    value.followUpDate < value.dateOfCheck
  ) {
    errors.followUpDate =
      "The follow-up date cannot be before the check date.";
  }

  return errors;
}

function formatDate(value?: string): string {
  if (!value) {
    return "Not recorded";
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatFileSize(
  fileSizeBytes: number,
): string {
  if (fileSizeBytes < 1024) {
    return `${fileSizeBytes} B`;
  }

  if (fileSizeBytes < 1024 * 1024) {
    return `${(
      fileSizeBytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    fileSizeBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getStatusLabel(
  status: RightToWorkStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) => option.value === status,
    )?.label ?? status
  );
}

function getMethodLabel(
  method: RightToWorkMethod,
): string {
  return (
    METHOD_OPTIONS.find(
      (option) => option.value === method,
    )?.label ?? "Not recorded"
  );
}

function getDocumentLabel(
  documentType: RightToWorkDocumentType,
): string {
  return (
    DOCUMENT_OPTIONS.find(
      (option) =>
        option.value === documentType,
    )?.label ?? "Not recorded"
  );
}

function getStatusAppearance(
  status: RightToWorkStatus,
): {
  background: string;
  border: string;
  color: string;
  icon: ReactNode;
} {
  switch (status) {
    case "verified":
      return {
        background: "#F2FAF5",
        border: "#CFE6D8",
        color: "#4E765F",
        icon: <CheckCircle2 size={14} />,
      };

    case "time_limited":
      return {
        background: "#F7F3FA",
        border: "#DCCFE6",
        color: "#6E5084",
        icon: <CalendarClock size={14} />,
      };

    case "follow_up_required":
    case "awaiting_evidence":
    case "awaiting_verification":
      return {
        background: "#FBF8F2",
        border: "#E7DCC6",
        color: "#806C46",
        icon: <Clock3 size={14} />,
      };

    case "expired":
      return {
        background: "#FFF7F8",
        border: "#E8CBD2",
        color: "#8B4E5D",
        icon: <AlertCircle size={14} />,
      };

    case "not_required":
      return {
        background: "#F5F4F6",
        border: "#DFDBE2",
        color: "#6F6773",
        icon: <Check size={14} />,
      };

    case "not_started":
    default:
      return {
        background: "#F8F5FA",
        border: "#E1D8E6",
        color: "#746A79",
        icon: <ShieldCheck size={14} />,
      };
  }
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
        <span style={styles.requiredMark}>*</span>
      ) : null}

      {sensitive ? (
        <span style={styles.sensitiveLabel}>
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
    <p style={styles.fieldError}>
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
      <span style={styles.sectionIcon}>
        {icon}
      </span>

      <div>
        <h3 style={styles.sectionTitle}>
          {title}
        </h3>

        <p style={styles.sectionDescription}>
          {description}
        </p>
      </div>
    </header>
  );
}

export default function RightToWorkDetails({
  mode,
  value,
  recordId,
  recordLabel,
  permissions,
  saving = false,
  disabled = false,
  startInEditMode = false,
  errorMessage,
  successMessage,
  headerActions,
  onSave,
  onCancel,
  onAudit,
}: RightToWorkDetailsProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

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
    useState<RightToWorkValue>(
      suppliedValue,
    );

  const [draft, setDraft] =
    useState<RightToWorkValue>(
      suppliedValue,
    );

  const [editing, setEditing] = useState(
    startInEditMode &&
      resolvedPermissions.canEdit,
  );

  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>({});

  const [pendingFiles, setPendingFiles] =
    useState<PendingFile[]>([]);

  const [
    removedEvidenceIds,
    setRemovedEvidenceIds,
  ] = useState<string[]>([]);

  const [localSaving, setLocalSaving] =
    useState(false);

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;

  useEffect(() => {
    setOriginalValue(suppliedValue);
    setDraft(suppliedValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
  }, [suppliedValue]);

  const changedFields = useMemo(
    () => getChangedFields(originalValue, draft),
    [draft, originalValue],
  );

  const isDirty =
    changedFields.length > 0 ||
    pendingFiles.length > 0 ||
    removedEvidenceIds.length > 0;

  const statusAppearance =
    getStatusAppearance(draft.status);

  const visibleEvidence = draft.evidence.filter(
    (item) =>
      !removedEvidenceIds.includes(item.id),
  );

  async function recordAudit(
    action: RightToWorkAuditEvent["action"],
    options?: {
      changedFields?: string[];
      evidenceId?: string;
    },
  ) {
    if (!onAudit) {
      return;
    }

    await onAudit({
      action,
      mode,
      recordId,
      changedFields:
        options?.changedFields,
      evidenceId: options?.evidenceId,
      occurredAt: new Date().toISOString(),
    });
  }

  function updateField<
    Key extends keyof RightToWorkValue,
  >(
    key: Key,
    nextValue: RightToWorkValue[Key],
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

  async function beginEditing() {
    if (
      !resolvedPermissions.canEdit ||
      isDisabled
    ) {
      return;
    }

    setEditing(true);

    await recordAudit(
      "right_to_work_edit_started",
    );
  }

  async function cancelEditing() {
    setDraft(originalValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setEditing(false);

    onCancel?.();

    await recordAudit(
      "right_to_work_edit_cancelled",
    );
  }

  function resetChanges() {
    setDraft(originalValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
  }

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    );

    if (selectedFiles.length === 0) {
      return;
    }

    const allowedFiles = selectedFiles.filter(
      (file) => file.size <= 15 * 1024 * 1024,
    );

    setPendingFiles((current) => [
      ...current,
      ...allowedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
      })),
    ]);

    await recordAudit(
      "right_to_work_evidence_selected",
    );

    event.target.value = "";
  }

  function removePendingFile(id: string) {
    setPendingFiles((current) =>
      current.filter((item) => item.id !== id),
    );
  }

  async function removeExistingEvidence(
    evidenceId: string,
  ) {
    if (
      !resolvedPermissions.canDeleteEvidence ||
      isDisabled
    ) {
      return;
    }

    setRemovedEvidenceIds((current) => [
      ...current,
      evidenceId,
    ]);

    await recordAudit(
      "right_to_work_evidence_removed",
      {
        evidenceId,
      },
    );
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

    const errors = validateValue(draft);

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

    if (
      fields.length === 0 &&
      pendingFiles.length === 0 &&
      removedEvidenceIds.length === 0
    ) {
      setEditing(false);
      return;
    }

    try {
      setLocalSaving(true);

      await onSave({
        value: cleanValue,
        changedFields: fields,
        newFiles: pendingFiles.map(
          (item) => item.file,
        ),
        removedEvidenceIds,
      });

      setOriginalValue(cleanValue);
      setDraft(cleanValue);
      setPendingFiles([]);
      setRemovedEvidenceIds([]);
      setValidationErrors({});
      setEditing(false);

      await recordAudit(
        "right_to_work_saved",
        {
          changedFields: fields,
        },
      );

      if (
        fields.some((field) =>
          [
            "status",
            "method",
            "dateOfCheck",
            "checkedBy",
            "expiryDate",
            "followUpDate",
          ].includes(field),
        )
      ) {
        await recordAudit(
          "right_to_work_verification_recorded",
          {
            changedFields: fields,
          },
        );
      }
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
            Right to Work information is restricted
          </h2>

          <p style={styles.accessText}>
            Your current permission level does not
            allow access to this record.
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
            <UserRoundCheck size={21} />
          </span>

          <div style={{ minWidth: 0 }}>
            <div style={styles.titleRow}>
              <h2 style={styles.cardTitle}>
                Right to Work
              </h2>

              <span
                style={{
                  ...styles.statusBadge,
                  background:
                    statusAppearance.background,
                  borderColor:
                    statusAppearance.border,
                  color: statusAppearance.color,
                }}
              >
                {statusAppearance.icon}
                {getStatusLabel(draft.status)}
              </span>
            </div>

            <p style={styles.cardSubtitle}>
              {recordLabel ||
                (mode === "candidate"
                  ? "Candidate record"
                  : "Employee record")}
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
              Edit check
            </button>
          ) : null}
        </div>
      </header>

      {errorMessage ? (
        <div
          role="alert"
          style={styles.errorBanner}
        >
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
              icon={<ShieldCheck size={18} />}
              title="Verification position"
              description="Record the current position and how the statutory check was completed."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel required>
                  Current status
                </FieldLabel>

                {editing ? (
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target
                          .value as RightToWorkStatus,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <ReadOnlyValue
                    value={getStatusLabel(
                      draft.status,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Checking method
                </FieldLabel>

                {editing ? (
                  <>
                    <select
                      value={draft.method}
                      onChange={(event) =>
                        updateField(
                          "method",
                          event.target
                            .value as RightToWorkMethod,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.method
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    >
                      {METHOD_OPTIONS.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>

                    <FieldError
                      message={
                        validationErrors.method
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={getMethodLabel(
                      draft.method,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Evidence or document type
                </FieldLabel>

                {editing ? (
                  <select
                    value={draft.documentType}
                    onChange={(event) =>
                      updateField(
                        "documentType",
                        event.target
                          .value as RightToWorkDocumentType,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  >
                    {DOCUMENT_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <ReadOnlyValue
                    value={getDocumentLabel(
                      draft.documentType,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Document reference
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.documentReference}
                    onChange={(event) =>
                      updateField(
                        "documentReference",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.documentReference
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Nationality
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.nationality}
                    onChange={(event) =>
                      updateField(
                        "nationality",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.nationality}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel sensitive>
                  Share code
                </FieldLabel>

                {!resolvedPermissions.canViewShareCode ? (
                  <ReadOnlyValue restricted />
                ) : editing &&
                  resolvedPermissions.canEditShareCode ? (
                  <>
                    <input
                      type="text"
                      value={draft.shareCode}
                      onChange={(event) =>
                        updateField(
                          "shareCode",
                          event.target.value.toUpperCase(),
                        )
                      }
                      placeholder="Enter share code"
                      style={{
                        ...styles.input,
                        ...(validationErrors.shareCode
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.shareCode
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.shareCode}
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<FileCheck2 size={18} />}
              title="Check details"
              description="Preserve who completed the check, when it was completed and the outcome recorded."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Date of check
                </FieldLabel>

                {editing &&
                resolvedPermissions.canVerify ? (
                  <>
                    <input
                      type="date"
                      value={draft.dateOfCheck}
                      onChange={(event) =>
                        updateField(
                          "dateOfCheck",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.dateOfCheck
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.dateOfCheck
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.dateOfCheck
                        ? formatDate(
                            draft.dateOfCheck,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Checked by
                </FieldLabel>

                {editing &&
                resolvedPermissions.canVerify ? (
                  <>
                    <input
                      type="text"
                      value={draft.checkedBy}
                      onChange={(event) =>
                        updateField(
                          "checkedBy",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.checkedBy
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.checkedBy
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={draft.checkedBy}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Permission expiry date
                </FieldLabel>

                {editing &&
                resolvedPermissions.canVerify ? (
                  <>
                    <input
                      type="date"
                      value={draft.expiryDate}
                      onChange={(event) =>
                        updateField(
                          "expiryDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.expiryDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.expiryDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.expiryDate
                        ? formatDate(
                            draft.expiryDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Follow-up check date
                </FieldLabel>

                {editing &&
                resolvedPermissions.canVerify ? (
                  <>
                    <input
                      type="date"
                      value={draft.followUpDate}
                      onChange={(event) =>
                        updateField(
                          "followUpDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.followUpDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.followUpDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.followUpDate
                        ? formatDate(
                            draft.followUpDate,
                          )
                        : ""
                    }
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
                  Verification outcome
                </FieldLabel>

                {editing ? (
                  <textarea
                    value={
                      draft.verificationOutcome
                    }
                    onChange={(event) =>
                      updateField(
                        "verificationOutcome",
                        event.target.value,
                      )
                    }
                    rows={3}
                    style={styles.textarea}
                    disabled={isDisabled}
                    placeholder="Record the factual outcome of the check."
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.verificationOutcome
                    }
                    fallback="No outcome recorded"
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
                  Work restrictions or conditions
                </FieldLabel>

                {editing ? (
                  <textarea
                    value={draft.restrictions}
                    onChange={(event) =>
                      updateField(
                        "restrictions",
                        event.target.value,
                      )
                    }
                    rows={3}
                    style={styles.textarea}
                    disabled={isDisabled}
                    placeholder="Record any restrictions, permitted hours or conditions."
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.restrictions}
                    fallback="No restrictions recorded"
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<FileText size={18} />}
              title="Supporting evidence"
              description="Store the evidence used to support the check. Access should remain permission-controlled."
            />

            {!resolvedPermissions.canViewEvidence ? (
              <div style={styles.restrictedPanel}>
                <LockKeyhole size={17} />

                <div>
                  <strong>
                    Evidence is restricted
                  </strong>

                  <p>
                    Your current permission level does
                    not allow access to uploaded Right
                    to Work evidence.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.evidenceList}>
                  {visibleEvidence.length === 0 &&
                  pendingFiles.length === 0 ? (
                    <div style={styles.emptyState}>
                      <FileText size={22} />

                      <strong>
                        No evidence uploaded
                      </strong>

                      <span>
                        Upload a clear copy of the
                        evidence used for the check.
                      </span>
                    </div>
                  ) : null}

                  {visibleEvidence.map((item) => (
                    <article
                      key={item.id}
                      style={styles.evidenceCard}
                    >
                      <span
                        style={
                          styles.evidenceFileIcon
                        }
                      >
                        <FileText size={17} />
                      </span>

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <strong
                          style={
                            styles.evidenceFileName
                          }
                        >
                          {item.fileName}
                        </strong>

                        <span
                          style={
                            styles.evidenceMeta
                          }
                        >
                          {formatFileSize(
                            item.fileSizeBytes,
                          )}
                          {" · "}
                          Uploaded{" "}
                          {formatDateTime(
                            item.uploadedAt,
                          )}
                          {item.uploadedBy
                            ? ` by ${item.uploadedBy}`
                            : ""}
                        </span>
                      </div>

                      {editing &&
                      resolvedPermissions.canDeleteEvidence ? (
                        <button
                          type="button"
                          style={styles.iconButton}
                          onClick={() =>
                            removeExistingEvidence(
                              item.id,
                            )
                          }
                          disabled={isDisabled}
                          aria-label={`Remove ${item.fileName}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </article>
                  ))}

                  {pendingFiles.map((item) => (
                    <article
                      key={item.id}
                      style={{
                        ...styles.evidenceCard,
                        borderStyle: "dashed",
                        background: "#FBF8FC",
                      }}
                    >
                      <span
                        style={
                          styles.evidenceFileIcon
                        }
                      >
                        <Upload size={17} />
                      </span>

                      <div
                        style={{
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <strong
                          style={
                            styles.evidenceFileName
                          }
                        >
                          {item.file.name}
                        </strong>

                        <span
                          style={
                            styles.evidenceMeta
                          }
                        >
                          {formatFileSize(
                            item.file.size,
                          )}
                          {" · "}Awaiting save
                        </span>
                      </div>

                      <button
                        type="button"
                        style={styles.iconButton}
                        onClick={() =>
                          removePendingFile(
                            item.id,
                          )
                        }
                        disabled={isDisabled}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <X size={15} />
                      </button>
                    </article>
                  ))}
                </div>

                {editing &&
                resolvedPermissions.canUploadEvidence ? (
                  <div style={styles.uploadArea}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileSelection}
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={isDisabled}
                    >
                      <Plus size={15} />
                      Add evidence
                    </button>

                    <span style={styles.uploadHelp}>
                      PDF, image or Word document. Maximum
                      15 MB per file.
                    </span>
                  </div>
                ) : null}
              </>
            )}
          </section>

          {resolvedPermissions.canViewHistory ? (
            <section style={styles.section}>
              <SectionHeader
                icon={<History size={18} />}
                title="Verification history"
                description="Previous checks remain preserved and should not be overwritten."
              />

              {draft.verificationHistory.length ===
              0 ? (
                <div style={styles.emptyState}>
                  <History size={22} />

                  <strong>
                    No previous checks recorded
                  </strong>

                  <span>
                    Verification history will appear
                    here after checks are completed.
                  </span>
                </div>
              ) : (
                <div style={styles.historyList}>
                  {draft.verificationHistory.map(
                    (entry) => (
                      <article
                        key={entry.id}
                        style={styles.historyCard}
                      >
                        <span
                          style={
                            styles.historyMarker
                          }
                        >
                          <CheckCircle2 size={14} />
                        </span>

                        <div style={{ flex: 1 }}>
                          <div
                            style={
                              styles.historyHeader
                            }
                          >
                            <strong>
                              {entry.outcome ===
                              "verified"
                                ? "Verified"
                                : entry.outcome ===
                                    "time_limited"
                                  ? "Time-limited permission"
                                  : entry.outcome ===
                                      "follow_up_required"
                                    ? "Follow-up required"
                                    : "Not verified"}
                            </strong>

                            <span>
                              {formatDateTime(
                                entry.verifiedAt,
                              )}
                            </span>
                          </div>

                          <p
                            style={
                              styles.historyText
                            }
                          >
                            Checked by{" "}
                            {entry.verifiedBy} using{" "}
                            {getMethodLabel(
                              entry.method,
                            )}
                            .
                          </p>

                          {entry.expiryDate ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Permission expires{" "}
                              {formatDate(
                                entry.expiryDate,
                              )}
                              .
                            </p>
                          ) : null}

                          {entry.followUpDate ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Follow-up scheduled for{" "}
                              {formatDate(
                                entry.followUpDate,
                              )}
                              .
                            </p>
                          ) : null}

                          {entry.notes ? (
                            <p
                              style={
                                styles.historyNotes
                              }
                            >
                              {entry.notes}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>
          ) : null}

          <section style={styles.section}>
            <SectionHeader
              icon={<FileText size={18} />}
              title="Record notes"
              description="Use concise, factual notes relevant to the check and any required follow-up."
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
                  placeholder="Add concise factual notes."
                />
              ) : (
                <ReadOnlyValue
                  value={draft.notes}
                  fallback="No notes recorded"
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
                  Unsaved changes
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
                  : "Save Right to Work"}
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
    boxShadow:
      "0 12px 32px rgba(71, 49, 81, 0.05)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
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
  },
  cardSubtitle: {
    margin: "4px 0 0",
    color: "#847789",
    fontSize: "12px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    border: "1px solid",
    borderRadius: "999px",
    padding: "5px 8px",
    fontSize: "10px",
    fontWeight: 800,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
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
    boxShadow:
      "0 0 0 3px rgba(185, 121, 136, 0.10)",
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
  },
  evidenceList: {
    display: "grid",
    gap: "9px",
  },
  evidenceCard: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    border: "1px solid #E7DFEB",
    borderRadius: "11px",
    background: "#FFFFFF",
    padding: "11px",
  },
  evidenceFileIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flex: "0 0 auto",
    borderRadius: "9px",
    background: "#F3EDF7",
    color: "#6E5084",
  },
  evidenceFileName: {
    display: "block",
    overflow: "hidden",
    color: "#4A3E4E",
    fontSize: "11px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  evidenceMeta: {
    display: "block",
    marginTop: "3px",
    color: "#8B7F90",
    fontSize: "10px",
  },
  uploadArea: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "12px",
  },
  uploadHelp: {
    color: "#8C8091",
    fontSize: "10px",
  },
  historyList: {
    display: "grid",
    gap: "12px",
  },
  historyCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    padding: "12px 0",
    borderBottom: "1px solid #F0EAF2",
  },
  historyMarker: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    flex: "0 0 auto",
    borderRadius: "999px",
    background: "#F1EAF5",
    color: "#6E5084",
  },
  historyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
    color: "#4A3D4E",
    fontSize: "11px",
  },
  historyText: {
    margin: "5px 0 0",
    color: "#7D7182",
    fontSize: "10px",
    lineHeight: 1.5,
  },
  historyNotes: {
    margin: "7px 0 0",
    borderRadius: "8px",
    background: "#FAF7FC",
    color: "#675A6C",
    padding: "8px",
    fontSize: "10px",
    lineHeight: 1.5,
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "6px",
    minHeight: "130px",
    border: "1px dashed #DDD2E3",
    borderRadius: "12px",
    background: "#FCFAFD",
    color: "#887C8D",
    padding: "20px",
    textAlign: "center",
    fontSize: "11px",
  },
  restrictedPanel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    border: "1px solid #E5DDE9",
    borderRadius: "11px",
    background: "#F9F6FA",
    color: "#746978",
    padding: "13px",
    fontSize: "11px",
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
  iconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flex: "0 0 auto",
    border: "1px solid #E4DBE8",
    borderRadius: "9px",
    background: "#FFFFFF",
    color: "#766A7A",
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