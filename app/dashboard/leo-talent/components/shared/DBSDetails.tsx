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

export type DBSMode = "candidate" | "employee";

export type DBSRequirement =
  | "not_assessed"
  | "not_required"
  | "basic"
  | "standard"
  | "enhanced"
  | "enhanced_with_childrens_barred_list"
  | "enhanced_with_adults_barred_list"
  | "enhanced_with_both_barred_lists";

export type DBSStatus =
  | "not_started"
  | "application_required"
  | "application_submitted"
  | "awaiting_certificate"
  | "awaiting_verification"
  | "verified"
  | "update_service_monitoring"
  | "renewal_due"
  | "expired"
  | "further_review_required"
  | "not_required";

export type DBSWorkforce =
  | ""
  | "child"
  | "adult"
  | "other"
  | "child_and_adult";

export type DBSResultPosition =
  | ""
  | "clear"
  | "information_disclosed"
  | "further_review_required"
  | "not_recorded";

export type DBSEvidence = {
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

export type DBSVerificationHistoryEntry = {
  id: string;
  verifiedAt: string;
  verifiedBy: string;
  status: DBSStatus;
  certificateNumber?: string;
  certificateIssueDate?: string;
  updateServiceChecked?: boolean;
  updateServiceCheckDate?: string;
  resultPosition?: DBSResultPosition;
  notes?: string;
};

export type DBSValue = {
  requirement: DBSRequirement;
  status: DBSStatus;
  workforce: DBSWorkforce;

  roleRequiresDBS: boolean;
  barredListCheckRequired: boolean;
  volunteerApplication: boolean;

  applicationReference: string;
  applicationSubmittedDate: string;
  applicationProvider: string;

  certificateNumber: string;
  certificateIssueDate: string;
  certificateSeenDate: string;
  certificateSeenBy: string;

  resultPosition: DBSResultPosition;
  disclosureSummary: string;
  suitabilityDecision: string;
  suitabilityDecisionDate: string;
  suitabilityDecisionBy: string;

  updateServiceRegistered: boolean;
  updateServiceRegistrationDate: string;
  updateServiceConsentConfirmed: boolean;
  updateServiceLastCheckedDate: string;
  updateServiceLastCheckedBy: string;
  updateServiceResult: string;

  renewalRequired: boolean;
  renewalDate: string;
  nextReviewDate: string;

  identityVerified: boolean;
  identityVerifiedDate: string;
  identityVerifiedBy: string;

  notes: string;
  evidence: DBSEvidence[];
  verificationHistory: DBSVerificationHistoryEntry[];
};

export type DBSPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewCertificateNumber: boolean;
  canEditCertificateNumber: boolean;
  canViewDisclosureInformation: boolean;
  canEditDisclosureInformation: boolean;
  canRecordSuitabilityDecision: boolean;
  canVerifyCertificate: boolean;
  canManageUpdateService: boolean;
  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;
  canViewHistory: boolean;
};

export type DBSAuditEvent = {
  action:
    | "dbs_edit_started"
    | "dbs_edit_cancelled"
    | "dbs_saved"
    | "dbs_evidence_selected"
    | "dbs_evidence_removed"
    | "dbs_verification_recorded"
    | "dbs_suitability_decision_recorded"
    | "dbs_update_service_check_recorded";
  mode: DBSMode;
  recordId?: string | number;
  changedFields?: string[];
  evidenceId?: string;
  occurredAt: string;
};

export type DBSSavePayload = {
  value: DBSValue;
  changedFields: string[];
  newFiles: File[];
  removedEvidenceIds: string[];
};

export type DBSDetailsProps = {
  mode: DBSMode;
  value?: Partial<DBSValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<DBSPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (
    payload: DBSSavePayload,
  ) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (
    event: DBSAuditEvent,
  ) => Promise<void> | void;
};

type ValidationErrors = Partial<
  Record<keyof DBSValue, string>
>;

type PendingFile = {
  id: string;
  file: File;
};

const EMPTY_VALUE: DBSValue = {
  requirement: "not_assessed",
  status: "not_started",
  workforce: "",

  roleRequiresDBS: false,
  barredListCheckRequired: false,
  volunteerApplication: false,

  applicationReference: "",
  applicationSubmittedDate: "",
  applicationProvider: "",

  certificateNumber: "",
  certificateIssueDate: "",
  certificateSeenDate: "",
  certificateSeenBy: "",

  resultPosition: "",
  disclosureSummary: "",
  suitabilityDecision: "",
  suitabilityDecisionDate: "",
  suitabilityDecisionBy: "",

  updateServiceRegistered: false,
  updateServiceRegistrationDate: "",
  updateServiceConsentConfirmed: false,
  updateServiceLastCheckedDate: "",
  updateServiceLastCheckedBy: "",
  updateServiceResult: "",

  renewalRequired: false,
  renewalDate: "",
  nextReviewDate: "",

  identityVerified: false,
  identityVerifiedDate: "",
  identityVerifiedBy: "",

  notes: "",
  evidence: [],
  verificationHistory: [],
};

const DEFAULT_PERMISSIONS: DBSPermissions = {
  canView: true,
  canEdit: true,
  canViewCertificateNumber: true,
  canEditCertificateNumber: true,
  canViewDisclosureInformation: true,
  canEditDisclosureInformation: true,
  canRecordSuitabilityDecision: true,
  canVerifyCertificate: true,
  canManageUpdateService: true,
  canViewEvidence: true,
  canUploadEvidence: true,
  canDeleteEvidence: true,
  canViewHistory: true,
};

const REQUIREMENT_OPTIONS: Array<{
  value: DBSRequirement;
  label: string;
}> = [
  {
    value: "not_assessed",
    label: "Not assessed",
  },
  {
    value: "not_required",
    label: "Not required",
  },
  {
    value: "basic",
    label: "Basic DBS",
  },
  {
    value: "standard",
    label: "Standard DBS",
  },
  {
    value: "enhanced",
    label: "Enhanced DBS",
  },
  {
    value: "enhanced_with_childrens_barred_list",
    label: "Enhanced with Children’s Barred List",
  },
  {
    value: "enhanced_with_adults_barred_list",
    label: "Enhanced with Adults’ Barred List",
  },
  {
    value: "enhanced_with_both_barred_lists",
    label: "Enhanced with both Barred Lists",
  },
];

const STATUS_OPTIONS: Array<{
  value: DBSStatus;
  label: string;
}> = [
  {
    value: "not_started",
    label: "Not started",
  },
  {
    value: "application_required",
    label: "Application required",
  },
  {
    value: "application_submitted",
    label: "Application submitted",
  },
  {
    value: "awaiting_certificate",
    label: "Awaiting certificate",
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
    value: "update_service_monitoring",
    label: "Update Service monitoring",
  },
  {
    value: "renewal_due",
    label: "Renewal due",
  },
  {
    value: "expired",
    label: "Expired",
  },
  {
    value: "further_review_required",
    label: "Further review required",
  },
  {
    value: "not_required",
    label: "Not required",
  },
];

const WORKFORCE_OPTIONS: Array<{
  value: DBSWorkforce;
  label: string;
}> = [
  {
    value: "",
    label: "Select workforce",
  },
  {
    value: "child",
    label: "Child workforce",
  },
  {
    value: "adult",
    label: "Adult workforce",
  },
  {
    value: "child_and_adult",
    label: "Child and adult workforce",
  },
  {
    value: "other",
    label: "Other workforce",
  },
];

const RESULT_OPTIONS: Array<{
  value: DBSResultPosition;
  label: string;
}> = [
  {
    value: "",
    label: "Select result position",
  },
  {
    value: "clear",
    label: "No information disclosed",
  },
  {
    value: "information_disclosed",
    label: "Information disclosed",
  },
  {
    value: "further_review_required",
    label: "Further review required",
  },
  {
    value: "not_recorded",
    label: "Result not recorded",
  },
];

function normaliseValue(
  value?: Partial<DBSValue>,
): DBSValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    evidence: value?.evidence ?? [],
    verificationHistory:
      value?.verificationHistory ?? [],
  };
}

function normaliseComparableValue(
  value: DBSValue,
): DBSValue {
  return {
    ...value,
    applicationReference:
      value.applicationReference.trim(),
    applicationProvider:
      value.applicationProvider.trim(),
    certificateNumber:
      value.certificateNumber.trim(),
    certificateSeenBy:
      value.certificateSeenBy.trim(),
    disclosureSummary:
      value.disclosureSummary.trim(),
    suitabilityDecision:
      value.suitabilityDecision.trim(),
    suitabilityDecisionBy:
      value.suitabilityDecisionBy.trim(),
    updateServiceLastCheckedBy:
      value.updateServiceLastCheckedBy.trim(),
    updateServiceResult:
      value.updateServiceResult.trim(),
    identityVerifiedBy:
      value.identityVerifiedBy.trim(),
    notes: value.notes.trim(),
  };
}

function getChangedFields(
  original: DBSValue,
  current: DBSValue,
): string[] {
  const originalNormalised =
    normaliseComparableValue(original);

  const currentNormalised =
    normaliseComparableValue(current);

  const comparableKeys: Array<keyof DBSValue> = [
    "requirement",
    "status",
    "workforce",
    "roleRequiresDBS",
    "barredListCheckRequired",
    "volunteerApplication",
    "applicationReference",
    "applicationSubmittedDate",
    "applicationProvider",
    "certificateNumber",
    "certificateIssueDate",
    "certificateSeenDate",
    "certificateSeenBy",
    "resultPosition",
    "disclosureSummary",
    "suitabilityDecision",
    "suitabilityDecisionDate",
    "suitabilityDecisionBy",
    "updateServiceRegistered",
    "updateServiceRegistrationDate",
    "updateServiceConsentConfirmed",
    "updateServiceLastCheckedDate",
    "updateServiceLastCheckedBy",
    "updateServiceResult",
    "renewalRequired",
    "renewalDate",
    "nextReviewDate",
    "identityVerified",
    "identityVerifiedDate",
    "identityVerifiedBy",
    "notes",
  ];

  return comparableKeys.filter(
    (key) =>
      originalNormalised[key] !==
      currentNormalised[key],
  );
}

function validateValue(
  value: DBSValue,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const requiresDBS =
    value.roleRequiresDBS &&
    value.requirement !== "not_required";

  const verifiedStatus =
    value.status === "verified" ||
    value.status ===
      "update_service_monitoring";

  if (
    value.roleRequiresDBS &&
    value.requirement === "not_assessed"
  ) {
    errors.requirement =
      "Select the required level of DBS check.";
  }

  if (
    requiresDBS &&
    value.status === "not_required"
  ) {
    errors.status =
      "A required DBS check cannot be marked as not required.";
  }

  if (
    value.status === "application_submitted" &&
    !value.applicationSubmittedDate
  ) {
    errors.applicationSubmittedDate =
      "Enter the application submission date.";
  }

  if (
    verifiedStatus &&
    !value.certificateIssueDate
  ) {
    errors.certificateIssueDate =
      "Enter the certificate issue date.";
  }

  if (
    verifiedStatus &&
    !value.certificateSeenDate
  ) {
    errors.certificateSeenDate =
      "Enter the date the certificate was seen.";
  }

  if (
    verifiedStatus &&
    !value.certificateSeenBy.trim()
  ) {
    errors.certificateSeenBy =
      "Enter who verified the certificate.";
  }

  if (
    value.updateServiceRegistered &&
    !value.updateServiceConsentConfirmed
  ) {
    errors.updateServiceConsentConfirmed =
      "Confirm that consent is recorded before monitoring the Update Service.";
  }

  if (
    value.status ===
      "update_service_monitoring" &&
    !value.updateServiceLastCheckedDate
  ) {
    errors.updateServiceLastCheckedDate =
      "Enter the latest Update Service check date.";
  }

  if (
    value.resultPosition ===
      "information_disclosed" &&
    !value.suitabilityDecision.trim()
  ) {
    errors.suitabilityDecision =
      "Record the employer’s suitability decision.";
  }

  if (
    value.resultPosition ===
      "information_disclosed" &&
    !value.suitabilityDecisionDate
  ) {
    errors.suitabilityDecisionDate =
      "Enter the suitability decision date.";
  }

  if (
    value.resultPosition ===
      "information_disclosed" &&
    !value.suitabilityDecisionBy.trim()
  ) {
    errors.suitabilityDecisionBy =
      "Enter who made the suitability decision.";
  }

  if (
    value.certificateIssueDate &&
    value.certificateSeenDate &&
    value.certificateSeenDate <
      value.certificateIssueDate
  ) {
    errors.certificateSeenDate =
      "The certificate cannot have been seen before it was issued.";
  }

  if (
    value.applicationSubmittedDate &&
    value.certificateIssueDate &&
    value.certificateIssueDate <
      value.applicationSubmittedDate
  ) {
    errors.certificateIssueDate =
      "The certificate issue date cannot be before the application date.";
  }

  if (
    value.renewalRequired &&
    !value.renewalDate
  ) {
    errors.renewalDate =
      "Enter the planned renewal date.";
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

function getRequirementLabel(
  requirement: DBSRequirement,
): string {
  return (
    REQUIREMENT_OPTIONS.find(
      (option) =>
        option.value === requirement,
    )?.label ?? requirement
  );
}

function getStatusLabel(
  status: DBSStatus,
): string {
  return (
    STATUS_OPTIONS.find(
      (option) => option.value === status,
    )?.label ?? status
  );
}

function getResultLabel(
  result: DBSResultPosition,
): string {
  return (
    RESULT_OPTIONS.find(
      (option) => option.value === result,
    )?.label ?? "Not recorded"
  );
}

function getStatusAppearance(
  status: DBSStatus,
): {
  background: string;
  border: string;
  color: string;
  icon: ReactNode;
} {
  switch (status) {
    case "verified":
    case "update_service_monitoring":
      return {
        background: "#F2FAF5",
        border: "#CFE6D8",
        color: "#4E765F",
        icon: <CheckCircle2 size={14} />,
      };

    case "application_required":
    case "application_submitted":
    case "awaiting_certificate":
    case "awaiting_verification":
    case "renewal_due":
      return {
        background: "#FBF8F2",
        border: "#E7DCC6",
        color: "#806C46",
        icon: <Clock3 size={14} />,
      };

    case "expired":
    case "further_review_required":
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

function CheckboxField({
  checked,
  label,
  description,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={styles.checkboxCard}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        disabled={disabled}
      />

      <span>
        <strong style={styles.checkboxTitle}>
          {label}
        </strong>

        {description ? (
          <span style={styles.checkboxDescription}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export default function DBSDetails({
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
}: DBSDetailsProps) {
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
    useState<DBSValue>(suppliedValue);

  const [draft, setDraft] =
    useState<DBSValue>(suppliedValue);

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
    action: DBSAuditEvent["action"],
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
    Key extends keyof DBSValue,
  >(
    key: Key,
    nextValue: DBSValue[Key],
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

    await recordAudit("dbs_edit_started");
  }

  async function cancelEditing() {
    setDraft(originalValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setEditing(false);

    onCancel?.();

    await recordAudit("dbs_edit_cancelled");
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
      "dbs_evidence_selected",
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
      "dbs_evidence_removed",
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

      await recordAudit("dbs_saved", {
        changedFields: fields,
      });

      if (
        fields.some((field) =>
          [
            "certificateNumber",
            "certificateIssueDate",
            "certificateSeenDate",
            "certificateSeenBy",
            "status",
            "resultPosition",
          ].includes(field),
        )
      ) {
        await recordAudit(
          "dbs_verification_recorded",
          {
            changedFields: fields,
          },
        );
      }

      if (
        fields.some((field) =>
          [
            "suitabilityDecision",
            "suitabilityDecisionDate",
            "suitabilityDecisionBy",
          ].includes(field),
        )
      ) {
        await recordAudit(
          "dbs_suitability_decision_recorded",
          {
            changedFields: fields,
          },
        );
      }

      if (
        fields.some((field) =>
          [
            "updateServiceRegistered",
            "updateServiceLastCheckedDate",
            "updateServiceLastCheckedBy",
            "updateServiceResult",
          ].includes(field),
        )
      ) {
        await recordAudit(
          "dbs_update_service_check_recorded",
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
            DBS information is restricted
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
                DBS
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
              Edit DBS
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
              title="Requirement"
              description="The vacancy or role determines whether a check is required and the appropriate level."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Current status
                </FieldLabel>

                {editing ? (
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target
                          .value as DBSStatus,
                      )
                    }
                    style={{
                      ...styles.input,
                      ...(validationErrors.status
                        ? styles.inputError
                        : {}),
                    }}
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

                <FieldError
                  message={validationErrors.status}
                />
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Required level
                </FieldLabel>

                {editing ? (
                  <select
                    value={draft.requirement}
                    onChange={(event) =>
                      updateField(
                        "requirement",
                        event.target
                          .value as DBSRequirement,
                      )
                    }
                    style={{
                      ...styles.input,
                      ...(validationErrors.requirement
                        ? styles.inputError
                        : {}),
                    }}
                    disabled={isDisabled}
                  >
                    {REQUIREMENT_OPTIONS.map(
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
                    value={getRequirementLabel(
                      draft.requirement,
                    )}
                  />
                )}

                <FieldError
                  message={
                    validationErrors.requirement
                  }
                />
              </div>

              <div style={styles.field}>
                <FieldLabel>Workforce</FieldLabel>

                {editing ? (
                  <select
                    value={draft.workforce}
                    onChange={(event) =>
                      updateField(
                        "workforce",
                        event.target
                          .value as DBSWorkforce,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  >
                    {WORKFORCE_OPTIONS.map(
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
                    value={
                      WORKFORCE_OPTIONS.find(
                        (option) =>
                          option.value ===
                          draft.workforce,
                      )?.label
                    }
                  />
                )}
              </div>
            </div>

            <div style={styles.checkboxGrid}>
              {editing ? (
                <>
                  <CheckboxField
                    checked={
                      draft.roleRequiresDBS
                    }
                    label="DBS required for this role"
                    description="The vacancy or employee role requires a DBS check."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "roleRequiresDBS",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.barredListCheckRequired
                    }
                    label="Barred List check required"
                    description="Use only where the role is legally eligible."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "barredListCheckRequired",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.volunteerApplication
                    }
                    label="Volunteer application"
                    description="Record whether the application is being treated as a volunteer check."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "volunteerApplication",
                        checked,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.roleRequiresDBS
                        ? "DBS required"
                        : "DBS not marked as required"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.barredListCheckRequired
                        ? "Barred List check required"
                        : "No Barred List check recorded"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.volunteerApplication
                        ? "Volunteer application"
                        : "Paid role application"
                    }
                  />
                </>
              )}
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<FileCheck2 size={18} />}
              title="Application"
              description="Track the DBS application without duplicating candidate or employee identity information."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Application reference
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={
                      draft.applicationReference
                    }
                    onChange={(event) =>
                      updateField(
                        "applicationReference",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.applicationReference
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Application provider
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={
                      draft.applicationProvider
                    }
                    onChange={(event) =>
                      updateField(
                        "applicationProvider",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                    placeholder="For example, umbrella body or internal process."
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.applicationProvider
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Submitted date
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="date"
                      value={
                        draft.applicationSubmittedDate
                      }
                      onChange={(event) =>
                        updateField(
                          "applicationSubmittedDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.applicationSubmittedDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.applicationSubmittedDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.applicationSubmittedDate
                        ? formatDate(
                            draft.applicationSubmittedDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<FileCheck2 size={18} />}
              title="Certificate verification"
              description="Record that the original certificate or permitted digital result has been reviewed by an authorised person."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel sensitive>
                  Certificate number
                </FieldLabel>

                {!resolvedPermissions.canViewCertificateNumber ? (
                  <ReadOnlyValue restricted />
                ) : editing &&
                  resolvedPermissions.canEditCertificateNumber ? (
                  <input
                    type="text"
                    value={
                      draft.certificateNumber
                    }
                    onChange={(event) =>
                      updateField(
                        "certificateNumber",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.certificateNumber
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Certificate issue date
                </FieldLabel>

                {editing &&
                resolvedPermissions.canVerifyCertificate ? (
                  <>
                    <input
                      type="date"
                      value={
                        draft.certificateIssueDate
                      }
                      onChange={(event) =>
                        updateField(
                          "certificateIssueDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.certificateIssueDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.certificateIssueDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.certificateIssueDate
                        ? formatDate(
                            draft.certificateIssueDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Certificate seen date
                </FieldLabel>

                {editing &&
                resolvedPermissions.canVerifyCertificate ? (
                  <>
                    <input
                      type="date"
                      value={
                        draft.certificateSeenDate
                      }
                      onChange={(event) =>
                        updateField(
                          "certificateSeenDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.certificateSeenDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.certificateSeenDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.certificateSeenDate
                        ? formatDate(
                            draft.certificateSeenDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Certificate seen by
                </FieldLabel>

                {editing &&
                resolvedPermissions.canVerifyCertificate ? (
                  <>
                    <input
                      type="text"
                      value={
                        draft.certificateSeenBy
                      }
                      onChange={(event) =>
                        updateField(
                          "certificateSeenBy",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.certificateSeenBy
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.certificateSeenBy
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.certificateSeenBy
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Result position
                </FieldLabel>

                {editing ? (
                  <select
                    value={draft.resultPosition}
                    onChange={(event) =>
                      updateField(
                        "resultPosition",
                        event.target
                          .value as DBSResultPosition,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  >
                    {RESULT_OPTIONS.map(
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
                    value={getResultLabel(
                      draft.resultPosition,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Identity verified
                </FieldLabel>

                {editing ? (
                  <CheckboxField
                    checked={
                      draft.identityVerified
                    }
                    label={
                      draft.identityVerified
                        ? "Identity verified"
                        : "Identity not yet verified"
                    }
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "identityVerified",
                        checked,
                      )
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.identityVerified
                        ? "Identity verified"
                        : "Not verified"
                    }
                  />
                )}
              </div>

              {draft.identityVerified ||
              editing ? (
                <>
                  <div style={styles.field}>
                    <FieldLabel>
                      Identity verification date
                    </FieldLabel>

                    {editing ? (
                      <input
                        type="date"
                        value={
                          draft.identityVerifiedDate
                        }
                        onChange={(event) =>
                          updateField(
                            "identityVerifiedDate",
                            event.target.value,
                          )
                        }
                        style={styles.input}
                        disabled={isDisabled}
                      />
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.identityVerifiedDate
                            ? formatDate(
                                draft.identityVerifiedDate,
                              )
                            : ""
                        }
                      />
                    )}
                  </div>

                  <div style={styles.field}>
                    <FieldLabel>
                      Identity verified by
                    </FieldLabel>

                    {editing ? (
                      <input
                        type="text"
                        value={
                          draft.identityVerifiedBy
                        }
                        onChange={(event) =>
                          updateField(
                            "identityVerifiedBy",
                            event.target.value,
                          )
                        }
                        style={styles.input}
                        disabled={isDisabled}
                      />
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.identityVerifiedBy
                        }
                      />
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<LockKeyhole size={18} />}
              title="Disclosure and suitability"
              description="Disclosure information must remain restricted. Leo records the employer’s decision but does not make it."
            />

            {!resolvedPermissions.canViewDisclosureInformation ? (
              <div style={styles.restrictedPanel}>
                <LockKeyhole size={17} />

                <div>
                  <strong>
                    Disclosure information is restricted
                  </strong>

                  <p>
                    Your current permission level does
                    not allow access to this section.
                  </p>
                </div>
              </div>
            ) : (
              <div style={styles.formGrid}>
                <div
                  style={{
                    ...styles.field,
                    gridColumn: "1 / -1",
                  }}
                >
                  <FieldLabel sensitive>
                    Disclosure summary
                  </FieldLabel>

                  {editing &&
                  resolvedPermissions.canEditDisclosureInformation ? (
                    <textarea
                      value={
                        draft.disclosureSummary
                      }
                      onChange={(event) =>
                        updateField(
                          "disclosureSummary",
                          event.target.value,
                        )
                      }
                      rows={4}
                      style={styles.textarea}
                      disabled={isDisabled}
                      placeholder="Record only the minimum factual information required."
                    />
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.disclosureSummary
                      }
                      fallback="No disclosure summary recorded"
                    />
                  )}
                </div>

                <div
                  style={{
                    ...styles.field,
                    gridColumn: "1 / -1",
                  }}
                >
                  <FieldLabel sensitive>
                    Suitability decision
                  </FieldLabel>

                  {editing &&
                  resolvedPermissions.canRecordSuitabilityDecision ? (
                    <>
                      <textarea
                        value={
                          draft.suitabilityDecision
                        }
                        onChange={(event) =>
                          updateField(
                            "suitabilityDecision",
                            event.target.value,
                          )
                        }
                        rows={4}
                        style={{
                          ...styles.textarea,
                          ...(validationErrors.suitabilityDecision
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={isDisabled}
                        placeholder="Record the employer’s decision and concise rationale."
                      />

                      <FieldError
                        message={
                          validationErrors.suitabilityDecision
                        }
                      />
                    </>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.suitabilityDecision
                      }
                      fallback="No suitability decision recorded"
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <FieldLabel>
                    Decision date
                  </FieldLabel>

                  {editing &&
                  resolvedPermissions.canRecordSuitabilityDecision ? (
                    <>
                      <input
                        type="date"
                        value={
                          draft.suitabilityDecisionDate
                        }
                        onChange={(event) =>
                          updateField(
                            "suitabilityDecisionDate",
                            event.target.value,
                          )
                        }
                        style={{
                          ...styles.input,
                          ...(validationErrors.suitabilityDecisionDate
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={isDisabled}
                      />

                      <FieldError
                        message={
                          validationErrors.suitabilityDecisionDate
                        }
                      />
                    </>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.suitabilityDecisionDate
                          ? formatDate(
                              draft.suitabilityDecisionDate,
                            )
                          : ""
                      }
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <FieldLabel>
                    Decision made by
                  </FieldLabel>

                  {editing &&
                  resolvedPermissions.canRecordSuitabilityDecision ? (
                    <>
                      <input
                        type="text"
                        value={
                          draft.suitabilityDecisionBy
                        }
                        onChange={(event) =>
                          updateField(
                            "suitabilityDecisionBy",
                            event.target.value,
                          )
                        }
                        style={{
                          ...styles.input,
                          ...(validationErrors.suitabilityDecisionBy
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={isDisabled}
                      />

                      <FieldError
                        message={
                          validationErrors.suitabilityDecisionBy
                        }
                      />
                    </>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.suitabilityDecisionBy
                      }
                    />
                  )}
                </div>
              </div>
            )}
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<CalendarClock size={18} />}
              title="Update Service and renewal"
              description="Monitor subscribed certificates only where consent and an appropriate process are in place."
            />

            <div style={styles.checkboxGrid}>
              {editing &&
              resolvedPermissions.canManageUpdateService ? (
                <>
                  <CheckboxField
                    checked={
                      draft.updateServiceRegistered
                    }
                    label="Registered with the DBS Update Service"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "updateServiceRegistered",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.updateServiceConsentConfirmed
                    }
                    label="Consent to ongoing status checks recorded"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "updateServiceConsentConfirmed",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.renewalRequired
                    }
                    label="Renewal required"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "renewalRequired",
                        checked,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.updateServiceRegistered
                        ? "Update Service registered"
                        : "Not registered"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.updateServiceConsentConfirmed
                        ? "Consent recorded"
                        : "Consent not recorded"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.renewalRequired
                        ? "Renewal required"
                        : "No renewal requirement recorded"
                    }
                  />
                </>
              )}
            </div>

            {validationErrors.updateServiceConsentConfirmed ? (
              <FieldError
                message={
                  validationErrors.updateServiceConsentConfirmed
                }
              />
            ) : null}

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Update Service registration date
                </FieldLabel>

                {editing &&
                resolvedPermissions.canManageUpdateService ? (
                  <input
                    type="date"
                    value={
                      draft.updateServiceRegistrationDate
                    }
                    onChange={(event) =>
                      updateField(
                        "updateServiceRegistrationDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.updateServiceRegistrationDate
                        ? formatDate(
                            draft.updateServiceRegistrationDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Last status check date
                </FieldLabel>

                {editing &&
                resolvedPermissions.canManageUpdateService ? (
                  <>
                    <input
                      type="date"
                      value={
                        draft.updateServiceLastCheckedDate
                      }
                      onChange={(event) =>
                        updateField(
                          "updateServiceLastCheckedDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.updateServiceLastCheckedDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.updateServiceLastCheckedDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.updateServiceLastCheckedDate
                        ? formatDate(
                            draft.updateServiceLastCheckedDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Last status check completed by
                </FieldLabel>

                {editing &&
                resolvedPermissions.canManageUpdateService ? (
                  <input
                    type="text"
                    value={
                      draft.updateServiceLastCheckedBy
                    }
                    onChange={(event) =>
                      updateField(
                        "updateServiceLastCheckedBy",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.updateServiceLastCheckedBy
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Renewal date
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="date"
                      value={draft.renewalDate}
                      onChange={(event) =>
                        updateField(
                          "renewalDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.renewalDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.renewalDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.renewalDate
                        ? formatDate(
                            draft.renewalDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Next review date
                </FieldLabel>

                {editing ? (
                  <input
                    type="date"
                    value={draft.nextReviewDate}
                    onChange={(event) =>
                      updateField(
                        "nextReviewDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.nextReviewDate
                        ? formatDate(
                            draft.nextReviewDate,
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
                  Update Service result
                </FieldLabel>

                {editing &&
                resolvedPermissions.canManageUpdateService ? (
                  <textarea
                    value={
                      draft.updateServiceResult
                    }
                    onChange={(event) =>
                      updateField(
                        "updateServiceResult",
                        event.target.value,
                      )
                    }
                    rows={3}
                    style={styles.textarea}
                    disabled={isDisabled}
                    placeholder="Record the factual result shown by the Update Service."
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.updateServiceResult
                    }
                    fallback="No Update Service result recorded"
                  />
                )}
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<FileText size={18} />}
              title="Supporting evidence"
              description="Evidence should be stored securely and visible only to authorised users."
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
                    not allow access to DBS evidence.
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
                        Upload approved evidence or
                        verification records where
                        appropriate.
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
                          style={styles.evidenceMeta}
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
                          style={styles.evidenceMeta}
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
                          removePendingFile(item.id)
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
                      PDF, image or Word document.
                      Maximum 15 MB per file.
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
                description="Previous verification activity remains preserved and should not be overwritten."
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
                    here when checks are completed.
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
                              {getStatusLabel(
                                entry.status,
                              )}
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
                            Recorded by{" "}
                            {entry.verifiedBy}.
                          </p>

                          {entry.certificateIssueDate ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Certificate issued{" "}
                              {formatDate(
                                entry.certificateIssueDate,
                              )}
                              .
                            </p>
                          ) : null}

                          {entry.updateServiceChecked ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Update Service checked{" "}
                              {entry.updateServiceCheckDate
                                ? formatDate(
                                    entry.updateServiceCheckDate,
                                  )
                                : ""}
                              .
                            </p>
                          ) : null}

                          {entry.resultPosition ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Result:{" "}
                              {getResultLabel(
                                entry.resultPosition,
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
              description="Use concise, factual notes relevant to the DBS process and any required follow-up."
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
                  : "Save DBS"}
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
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
    marginTop: "16px",
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
  checkboxCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    minHeight: "64px",
    boxSizing: "border-box",
    border: "1px solid #DED3E4",
    borderRadius: "10px",
    background: "#FAF7FC",
    color: "#55495A",
    padding: "11px",
    fontSize: "11px",
    cursor: "pointer",
  },
  checkboxTitle: {
    display: "block",
    color: "#55495A",
    fontSize: "11px",
  },
  checkboxDescription: {
    display: "block",
    marginTop: "3px",
    color: "#8B7F90",
    fontSize: "10px",
    lineHeight: 1.4,
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
    lineHeight: 1.4,
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