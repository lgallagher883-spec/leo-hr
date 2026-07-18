"use client";

import {
  AlertCircle,
  CalendarClock,
  Car,
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

export type DrivingDetailsMode =
  | "candidate"
  | "employee";

export type DrivingRequirementStatus =
  | "not_assessed"
  | "not_required"
  | "required"
  | "desirable";

export type DrivingCheckStatus =
  | "not_started"
  | "awaiting_evidence"
  | "awaiting_check"
  | "verified"
  | "follow_up_required"
  | "expired"
  | "not_required";

export type DrivingLicenceCategory =
  | "AM"
  | "A1"
  | "A2"
  | "A"
  | "B1"
  | "B"
  | "BE"
  | "C1"
  | "C1E"
  | "C"
  | "CE"
  | "D1"
  | "D1E"
  | "D"
  | "DE"
  | "F"
  | "G"
  | "H"
  | "K"
  | "L"
  | "M"
  | "N"
  | "P"
  | "Q";

export type DrivingEvidenceType =
  | "driving_licence"
  | "dvla_check"
  | "insurance"
  | "mot"
  | "vehicle_tax"
  | "business_use_confirmation"
  | "other";

export type DrivingEvidence = {
  id: string;
  evidenceType: DrivingEvidenceType;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  current: boolean;
};

export type DrivingVerificationHistoryEntry = {
  id: string;
  checkedAt: string;
  checkedBy: string;
  status: DrivingCheckStatus;
  licenceNumberLastFour?: string;
  licenceExpiryDate?: string;
  penaltyPoints?: number;
  businessUseConfirmed?: boolean;
  insuranceExpiryDate?: string;
  notes?: string;
};

export type DrivingDetailsValue = {
  requirementStatus: DrivingRequirementStatus;
  checkStatus: DrivingCheckStatus;

  drivingRequiredForRole: boolean;
  ownVehicleRequired: boolean;
  businessDrivingRequired: boolean;
  companyVehicleAllocated: boolean;
  companyVehicleReference: string;

  licenceHeld: boolean;
  fullLicence: boolean;
  provisionalLicence: boolean;
  licenceNumber: string;
  countryOfIssue: string;
  licenceIssueDate: string;
  licenceExpiryDate: string;
  licenceCategories: DrivingLicenceCategory[];
  automaticOnly: boolean;

  dvlaCheckRequired: boolean;
  dvlaCheckConsentConfirmed: boolean;
  dvlaCheckCode: string;
  dvlaCheckDate: string;
  dvlaCheckedBy: string;
  dvlaCheckOutcome: string;
  dvlaFollowUpDate: string;

  penaltyPoints: number | null;
  endorsements: string;
  restrictionsOrCodes: string;
  disqualificationHistory: boolean;
  disqualificationDetails: string;

  businessUsePermitted: boolean;
  insuranceVerified: boolean;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiryDate: string;

  motRequired: boolean;
  motVerified: boolean;
  motExpiryDate: string;

  vehicleTaxVerified: boolean;
  vehicleTaxExpiryDate: string;

  greyFleetApproved: boolean;
  greyFleetApprovalDate: string;
  greyFleetApprovedBy: string;

  nextReviewDate: string;
  notes: string;

  evidence: DrivingEvidence[];
  verificationHistory: DrivingVerificationHistoryEntry[];
};

export type DrivingDetailsPermissions = {
  canView: boolean;
  canEdit: boolean;

  canViewLicenceNumber: boolean;
  canEditLicenceNumber: boolean;

  canViewDVLAInformation: boolean;
  canEditDVLAInformation: boolean;
  canPerformDVLACheck: boolean;

  canViewDisqualificationInformation: boolean;
  canEditDisqualificationInformation: boolean;

  canViewInsuranceInformation: boolean;
  canEditInsuranceInformation: boolean;

  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;

  canViewHistory: boolean;
};

export type DrivingDetailsAuditEvent = {
  action:
    | "driving_edit_started"
    | "driving_edit_cancelled"
    | "driving_saved"
    | "driving_evidence_selected"
    | "driving_evidence_removed"
    | "driving_verification_recorded"
    | "driving_dvla_check_recorded"
    | "driving_grey_fleet_approved";
  mode: DrivingDetailsMode;
  recordId?: string | number;
  changedFields?: string[];
  evidenceId?: string;
  occurredAt: string;
};

export type DrivingDetailsSavePayload = {
  value: DrivingDetailsValue;
  changedFields: string[];
  newFiles: File[];
  removedEvidenceIds: string[];
};

export type DrivingDetailsProps = {
  mode: DrivingDetailsMode;
  value?: Partial<DrivingDetailsValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<DrivingDetailsPermissions>;

  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;

  errorMessage?: string | null;
  successMessage?: string | null;

  headerActions?: ReactNode;

  onSave?: (
    payload: DrivingDetailsSavePayload,
  ) => Promise<void> | void;

  onCancel?: () => void;

  onAudit?: (
    event: DrivingDetailsAuditEvent,
  ) => Promise<void> | void;
};

type ValidationErrors = Partial<
  Record<keyof DrivingDetailsValue, string>
>;

type PendingFile = {
  id: string;
  file: File;
  evidenceType: DrivingEvidenceType;
};

const EMPTY_VALUE: DrivingDetailsValue = {
  requirementStatus: "not_assessed",
  checkStatus: "not_started",

  drivingRequiredForRole: false,
  ownVehicleRequired: false,
  businessDrivingRequired: false,
  companyVehicleAllocated: false,
  companyVehicleReference: "",

  licenceHeld: false,
  fullLicence: false,
  provisionalLicence: false,
  licenceNumber: "",
  countryOfIssue: "United Kingdom",
  licenceIssueDate: "",
  licenceExpiryDate: "",
  licenceCategories: [],
  automaticOnly: false,

  dvlaCheckRequired: false,
  dvlaCheckConsentConfirmed: false,
  dvlaCheckCode: "",
  dvlaCheckDate: "",
  dvlaCheckedBy: "",
  dvlaCheckOutcome: "",
  dvlaFollowUpDate: "",

  penaltyPoints: null,
  endorsements: "",
  restrictionsOrCodes: "",
  disqualificationHistory: false,
  disqualificationDetails: "",

  businessUsePermitted: false,
  insuranceVerified: false,
  insuranceProvider: "",
  insurancePolicyNumber: "",
  insuranceExpiryDate: "",

  motRequired: false,
  motVerified: false,
  motExpiryDate: "",

  vehicleTaxVerified: false,
  vehicleTaxExpiryDate: "",

  greyFleetApproved: false,
  greyFleetApprovalDate: "",
  greyFleetApprovedBy: "",

  nextReviewDate: "",
  notes: "",

  evidence: [],
  verificationHistory: [],
};

const DEFAULT_PERMISSIONS: DrivingDetailsPermissions =
  {
    canView: true,
    canEdit: true,

    canViewLicenceNumber: true,
    canEditLicenceNumber: true,

    canViewDVLAInformation: true,
    canEditDVLAInformation: true,
    canPerformDVLACheck: true,

    canViewDisqualificationInformation: true,
    canEditDisqualificationInformation: true,

    canViewInsuranceInformation: true,
    canEditInsuranceInformation: true,

    canViewEvidence: true,
    canUploadEvidence: true,
    canDeleteEvidence: true,

    canViewHistory: true,
  };

const REQUIREMENT_OPTIONS: Array<{
  value: DrivingRequirementStatus;
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
    value: "required",
    label: "Required",
  },
  {
    value: "desirable",
    label: "Desirable",
  },
];

const CHECK_STATUS_OPTIONS: Array<{
  value: DrivingCheckStatus;
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
    value: "awaiting_check",
    label: "Awaiting check",
  },
  {
    value: "verified",
    label: "Verified",
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

const LICENCE_CATEGORY_OPTIONS: Array<{
  value: DrivingLicenceCategory;
  label: string;
}> = [
  { value: "AM", label: "AM – Mopeds" },
  { value: "A1", label: "A1 – Light motorcycles" },
  { value: "A2", label: "A2 – Medium motorcycles" },
  { value: "A", label: "A – Motorcycles" },
  { value: "B1", label: "B1 – Light vehicles" },
  { value: "B", label: "B – Cars" },
  { value: "BE", label: "BE – Car with trailer" },
  {
    value: "C1",
    label: "C1 – Medium-sized vehicles",
  },
  {
    value: "C1E",
    label: "C1E – Medium vehicle with trailer",
  },
  { value: "C", label: "C – Large vehicles" },
  {
    value: "CE",
    label: "CE – Large vehicle with trailer",
  },
  {
    value: "D1",
    label: "D1 – Minibuses",
  },
  {
    value: "D1E",
    label: "D1E – Minibus with trailer",
  },
  {
    value: "D",
    label: "D – Buses",
  },
  {
    value: "DE",
    label: "DE – Bus with trailer",
  },
  { value: "F", label: "F – Agricultural tractors" },
  { value: "G", label: "G – Road rollers" },
  { value: "H", label: "H – Tracked vehicles" },
  { value: "K", label: "K – Mowing machines" },
  {
    value: "L",
    label: "L – Electrically propelled vehicles",
  },
  {
    value: "M",
    label: "M – Trolley vehicles",
  },
  {
    value: "N",
    label: "N – Exempt vehicles",
  },
  {
    value: "P",
    label: "P – Mopeds with limited speed",
  },
  {
    value: "Q",
    label: "Q – Two or three-wheeled vehicles",
  },
];

const EVIDENCE_TYPE_OPTIONS: Array<{
  value: DrivingEvidenceType;
  label: string;
}> = [
  {
    value: "driving_licence",
    label: "Driving licence",
  },
  {
    value: "dvla_check",
    label: "DVLA check",
  },
  {
    value: "insurance",
    label: "Insurance",
  },
  {
    value: "mot",
    label: "MOT",
  },
  {
    value: "vehicle_tax",
    label: "Vehicle tax",
  },
  {
    value: "business_use_confirmation",
    label: "Business-use confirmation",
  },
  {
    value: "other",
    label: "Other",
  },
];

function normaliseValue(
  value?: Partial<DrivingDetailsValue>,
): DrivingDetailsValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    licenceCategories:
      value?.licenceCategories ?? [],
    evidence: value?.evidence ?? [],
    verificationHistory:
      value?.verificationHistory ?? [],
  };
}

function normaliseComparableValue(
  value: DrivingDetailsValue,
): DrivingDetailsValue {
  return {
    ...value,
    companyVehicleReference:
      value.companyVehicleReference.trim(),

    licenceNumber:
      value.licenceNumber.trim().toUpperCase(),
    countryOfIssue:
      value.countryOfIssue.trim(),

    dvlaCheckCode:
      value.dvlaCheckCode.trim().toUpperCase(),
    dvlaCheckedBy:
      value.dvlaCheckedBy.trim(),
    dvlaCheckOutcome:
      value.dvlaCheckOutcome.trim(),

    endorsements:
      value.endorsements.trim(),
    restrictionsOrCodes:
      value.restrictionsOrCodes.trim(),
    disqualificationDetails:
      value.disqualificationDetails.trim(),

    insuranceProvider:
      value.insuranceProvider.trim(),
    insurancePolicyNumber:
      value.insurancePolicyNumber.trim(),

    greyFleetApprovedBy:
      value.greyFleetApprovedBy.trim(),

    notes: value.notes.trim(),

    licenceCategories: [
      ...value.licenceCategories,
    ].sort(),
  };
}

function getChangedFields(
  original: DrivingDetailsValue,
  current: DrivingDetailsValue,
): string[] {
  const originalNormalised =
    normaliseComparableValue(original);

  const currentNormalised =
    normaliseComparableValue(current);

  const comparableKeys: Array<
    keyof DrivingDetailsValue
  > = [
    "requirementStatus",
    "checkStatus",

    "drivingRequiredForRole",
    "ownVehicleRequired",
    "businessDrivingRequired",
    "companyVehicleAllocated",
    "companyVehicleReference",

    "licenceHeld",
    "fullLicence",
    "provisionalLicence",
    "licenceNumber",
    "countryOfIssue",
    "licenceIssueDate",
    "licenceExpiryDate",
    "licenceCategories",
    "automaticOnly",

    "dvlaCheckRequired",
    "dvlaCheckConsentConfirmed",
    "dvlaCheckCode",
    "dvlaCheckDate",
    "dvlaCheckedBy",
    "dvlaCheckOutcome",
    "dvlaFollowUpDate",

    "penaltyPoints",
    "endorsements",
    "restrictionsOrCodes",
    "disqualificationHistory",
    "disqualificationDetails",

    "businessUsePermitted",
    "insuranceVerified",
    "insuranceProvider",
    "insurancePolicyNumber",
    "insuranceExpiryDate",

    "motRequired",
    "motVerified",
    "motExpiryDate",

    "vehicleTaxVerified",
    "vehicleTaxExpiryDate",

    "greyFleetApproved",
    "greyFleetApprovalDate",
    "greyFleetApprovedBy",

    "nextReviewDate",
    "notes",
  ];

  return comparableKeys.filter((key) => {
    const originalValue =
      originalNormalised[key];
    const currentValue =
      currentNormalised[key];

    if (
      Array.isArray(originalValue) &&
      Array.isArray(currentValue)
    ) {
      return (
        JSON.stringify(originalValue) !==
        JSON.stringify(currentValue)
      );
    }

    return originalValue !== currentValue;
  });
}

function validateValue(
  value: DrivingDetailsValue,
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (
    value.drivingRequiredForRole &&
    value.requirementStatus === "not_assessed"
  ) {
    errors.requirementStatus =
      "Confirm whether driving is required or desirable.";
  }

  if (
    value.drivingRequiredForRole &&
    value.requirementStatus === "not_required"
  ) {
    errors.requirementStatus =
      "A role requiring driving cannot be marked as not required.";
  }

  if (
    value.licenceHeld &&
    !value.fullLicence &&
    !value.provisionalLicence
  ) {
    errors.fullLicence =
      "Confirm whether the licence is full or provisional.";
  }

  if (
    value.licenceHeld &&
    value.licenceCategories.length === 0
  ) {
    errors.licenceCategories =
      "Select at least one licence category.";
  }

  if (
    value.licenceIssueDate &&
    value.licenceExpiryDate &&
    value.licenceExpiryDate <
      value.licenceIssueDate
  ) {
    errors.licenceExpiryDate =
      "The expiry date cannot be before the issue date.";
  }

  if (
    value.dvlaCheckRequired &&
    !value.dvlaCheckConsentConfirmed
  ) {
    errors.dvlaCheckConsentConfirmed =
      "Confirm that consent has been recorded before completing a DVLA check.";
  }

  if (
    value.checkStatus === "verified" &&
    value.dvlaCheckRequired &&
    !value.dvlaCheckDate
  ) {
    errors.dvlaCheckDate =
      "Enter the date the DVLA check was completed.";
  }

  if (
    value.checkStatus === "verified" &&
    value.dvlaCheckRequired &&
    !value.dvlaCheckedBy.trim()
  ) {
    errors.dvlaCheckedBy =
      "Enter who completed the DVLA check.";
  }

  if (
    value.penaltyPoints !== null &&
    (value.penaltyPoints < 0 ||
      value.penaltyPoints > 99)
  ) {
    errors.penaltyPoints =
      "Enter a valid number of penalty points.";
  }

  if (
    value.disqualificationHistory &&
    !value.disqualificationDetails.trim()
  ) {
    errors.disqualificationDetails =
      "Record concise details of the disqualification history.";
  }

  if (
    value.businessDrivingRequired &&
    !value.businessUsePermitted
  ) {
    errors.businessUsePermitted =
      "Confirm that business use is permitted before approving business driving.";
  }

  if (
    value.ownVehicleRequired &&
    value.businessDrivingRequired &&
    !value.insuranceVerified
  ) {
    errors.insuranceVerified =
      "Business-use insurance must be verified where the person uses their own vehicle.";
  }

  if (
    value.insuranceVerified &&
    !value.insuranceExpiryDate
  ) {
    errors.insuranceExpiryDate =
      "Enter the insurance expiry date.";
  }

  if (
    value.motRequired &&
    value.motVerified &&
    !value.motExpiryDate
  ) {
    errors.motExpiryDate =
      "Enter the MOT expiry date.";
  }

  if (
    value.greyFleetApproved &&
    !value.greyFleetApprovalDate
  ) {
    errors.greyFleetApprovalDate =
      "Enter the grey fleet approval date.";
  }

  if (
    value.greyFleetApproved &&
    !value.greyFleetApprovedBy.trim()
  ) {
    errors.greyFleetApprovedBy =
      "Enter who approved the grey fleet record.";
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
  value: DrivingRequirementStatus,
): string {
  return (
    REQUIREMENT_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

function getCheckStatusLabel(
  value: DrivingCheckStatus,
): string {
  return (
    CHECK_STATUS_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

function getEvidenceTypeLabel(
  value: DrivingEvidenceType,
): string {
  return (
    EVIDENCE_TYPE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? value
  );
}

function getStatusAppearance(
  status: DrivingCheckStatus,
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

    case "awaiting_evidence":
    case "awaiting_check":
    case "follow_up_required":
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
        <span style={styles.requiredMark}>
          *
        </span>
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

export default function DrivingDetails({
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
}: DrivingDetailsProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [selectedEvidenceType, setSelectedEvidenceType] =
    useState<DrivingEvidenceType>(
      "driving_licence",
    );

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
    useState<DrivingDetailsValue>(
      suppliedValue,
    );

  const [draft, setDraft] =
    useState<DrivingDetailsValue>(
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
    getStatusAppearance(draft.checkStatus);

  const visibleEvidence = draft.evidence.filter(
    (item) =>
      !removedEvidenceIds.includes(item.id),
  );

  async function recordAudit(
    action: DrivingDetailsAuditEvent["action"],
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
    Key extends keyof DrivingDetailsValue,
  >(
    key: Key,
    nextValue: DrivingDetailsValue[Key],
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

  function toggleLicenceCategory(
    category: DrivingLicenceCategory,
  ) {
    setDraft((current) => {
      const alreadySelected =
        current.licenceCategories.includes(
          category,
        );

      return {
        ...current,
        licenceCategories: alreadySelected
          ? current.licenceCategories.filter(
              (item) => item !== category,
            )
          : [
              ...current.licenceCategories,
              category,
            ],
      };
    });

    setValidationErrors((current) => {
      if (!current.licenceCategories) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.licenceCategories;

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
      "driving_edit_started",
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
      "driving_edit_cancelled",
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
        evidenceType: selectedEvidenceType,
      })),
    ]);

    await recordAudit(
      "driving_evidence_selected",
    );

    event.target.value = "";
  }

  function removePendingFile(id: string) {
    setPendingFiles((current) =>
      current.filter(
        (item) => item.id !== id,
      ),
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
      "driving_evidence_removed",
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

      await recordAudit("driving_saved", {
        changedFields: fields,
      });

      if (
        fields.some((field) =>
          [
            "checkStatus",
            "licenceExpiryDate",
            "penaltyPoints",
            "insuranceExpiryDate",
            "motExpiryDate",
            "vehicleTaxExpiryDate",
          ].includes(field),
        )
      ) {
        await recordAudit(
          "driving_verification_recorded",
          {
            changedFields: fields,
          },
        );
      }

      if (
        fields.some((field) =>
          [
            "dvlaCheckDate",
            "dvlaCheckedBy",
            "dvlaCheckOutcome",
            "dvlaFollowUpDate",
          ].includes(field),
        )
      ) {
        await recordAudit(
          "driving_dvla_check_recorded",
          {
            changedFields: fields,
          },
        );
      }

      if (
        fields.some((field) =>
          [
            "greyFleetApproved",
            "greyFleetApprovalDate",
            "greyFleetApprovedBy",
          ].includes(field),
        )
      ) {
        await recordAudit(
          "driving_grey_fleet_approved",
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
            Driving information is restricted
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
            <Car size={21} />
          </span>

          <div style={{ minWidth: 0 }}>
            <div style={styles.titleRow}>
              <h2 style={styles.cardTitle}>
                Driving
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
                {getCheckStatusLabel(
                  draft.checkStatus,
                )}
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
              Edit driving record
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
              icon={<Car size={18} />}
              title="Role requirement"
              description="Record whether driving, a licence or access to a vehicle is necessary for the role."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Requirement status
                </FieldLabel>

                {editing ? (
                  <>
                    <select
                      value={
                        draft.requirementStatus
                      }
                      onChange={(event) =>
                        updateField(
                          "requirementStatus",
                          event.target
                            .value as DrivingRequirementStatus,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.requirementStatus
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

                    <FieldError
                      message={
                        validationErrors.requirementStatus
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={getRequirementLabel(
                      draft.requirementStatus,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Check status
                </FieldLabel>

                {editing ? (
                  <select
                    value={draft.checkStatus}
                    onChange={(event) =>
                      updateField(
                        "checkStatus",
                        event.target
                          .value as DrivingCheckStatus,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                  >
                    {CHECK_STATUS_OPTIONS.map(
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
                    value={getCheckStatusLabel(
                      draft.checkStatus,
                    )}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Company vehicle reference
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={
                      draft.companyVehicleReference
                    }
                    onChange={(event) =>
                      updateField(
                        "companyVehicleReference",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.companyVehicleAllocated
                    }
                    placeholder="Vehicle, fleet or asset reference"
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.companyVehicleReference
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
                      draft.drivingRequiredForRole
                    }
                    label="Driving required for the role"
                    description="Driving forms part of the role’s essential duties."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "drivingRequiredForRole",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.businessDrivingRequired
                    }
                    label="Business driving required"
                    description="The person will drive for work purposes."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "businessDrivingRequired",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.ownVehicleRequired
                    }
                    label="Own vehicle required"
                    description="The role requires use of the person’s own vehicle."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "ownVehicleRequired",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.companyVehicleAllocated
                    }
                    label="Company vehicle allocated"
                    description="A company-owned or leased vehicle is allocated."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "companyVehicleAllocated",
                        checked,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.drivingRequiredForRole
                        ? "Driving required"
                        : "Driving not required"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.businessDrivingRequired
                        ? "Business driving required"
                        : "No business driving recorded"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.ownVehicleRequired
                        ? "Own vehicle required"
                        : "Own vehicle not required"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.companyVehicleAllocated
                        ? "Company vehicle allocated"
                        : "No company vehicle allocated"
                    }
                  />
                </>
              )}
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<FileCheck2 size={18} />}
              title="Driving licence"
              description="Record the licence held, permitted categories and relevant expiry dates."
            />

            <div style={styles.checkboxGrid}>
              {editing ? (
                <>
                  <CheckboxField
                    checked={draft.licenceHeld}
                    label="Driving licence held"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "licenceHeld",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={draft.fullLicence}
                    label="Full licence"
                    disabled={
                      isDisabled ||
                      !draft.licenceHeld
                    }
                    onChange={(checked) => {
                      updateField(
                        "fullLicence",
                        checked,
                      );

                      if (checked) {
                        updateField(
                          "provisionalLicence",
                          false,
                        );
                      }
                    }}
                  />

                  <CheckboxField
                    checked={
                      draft.provisionalLicence
                    }
                    label="Provisional licence"
                    disabled={
                      isDisabled ||
                      !draft.licenceHeld
                    }
                    onChange={(checked) => {
                      updateField(
                        "provisionalLicence",
                        checked,
                      );

                      if (checked) {
                        updateField(
                          "fullLicence",
                          false,
                        );
                      }
                    }}
                  />

                  <CheckboxField
                    checked={draft.automaticOnly}
                    label="Automatic vehicles only"
                    disabled={
                      isDisabled ||
                      !draft.licenceHeld
                    }
                    onChange={(checked) =>
                      updateField(
                        "automaticOnly",
                        checked,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.licenceHeld
                        ? "Licence held"
                        : "No licence recorded"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.fullLicence
                        ? "Full licence"
                        : draft.provisionalLicence
                          ? "Provisional licence"
                          : ""
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.automaticOnly
                        ? "Automatic vehicles only"
                        : "No automatic-only restriction recorded"
                    }
                  />
                </>
              )}
            </div>

            <FieldError
              message={
                validationErrors.fullLicence
              }
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel sensitive>
                  Licence number
                </FieldLabel>

                {!resolvedPermissions.canViewLicenceNumber ? (
                  <ReadOnlyValue restricted />
                ) : editing &&
                  resolvedPermissions.canEditLicenceNumber ? (
                  <input
                    type="text"
                    value={draft.licenceNumber}
                    onChange={(event) =>
                      updateField(
                        "licenceNumber",
                        event.target.value.toUpperCase(),
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.licenceHeld
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.licenceNumber}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Country of issue
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={draft.countryOfIssue}
                    onChange={(event) =>
                      updateField(
                        "countryOfIssue",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.licenceHeld
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.countryOfIssue}
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Licence issue date
                </FieldLabel>

                {editing ? (
                  <input
                    type="date"
                    value={
                      draft.licenceIssueDate
                    }
                    onChange={(event) =>
                      updateField(
                        "licenceIssueDate",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={
                      isDisabled ||
                      !draft.licenceHeld
                    }
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.licenceIssueDate
                        ? formatDate(
                            draft.licenceIssueDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Licence expiry date
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="date"
                      value={
                        draft.licenceExpiryDate
                      }
                      onChange={(event) =>
                        updateField(
                          "licenceExpiryDate",
                          event.target.value,
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.licenceExpiryDate
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={
                        isDisabled ||
                        !draft.licenceHeld
                      }
                    />

                    <FieldError
                      message={
                        validationErrors.licenceExpiryDate
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.licenceExpiryDate
                        ? formatDate(
                            draft.licenceExpiryDate,
                          )
                        : ""
                    }
                  />
                )}
              </div>
            </div>

            <div style={styles.field}>
              <FieldLabel>
                Licence categories
              </FieldLabel>

              {editing ? (
                <div style={styles.categoryGrid}>
                  {LICENCE_CATEGORY_OPTIONS.map(
                    (option) => (
                      <label
                        key={option.value}
                        style={{
                          ...styles.categoryOption,
                          ...(draft.licenceCategories.includes(
                            option.value,
                          )
                            ? styles.categoryOptionSelected
                            : {}),
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={draft.licenceCategories.includes(
                            option.value,
                          )}
                          onChange={() =>
                            toggleLicenceCategory(
                              option.value,
                            )
                          }
                          disabled={
                            isDisabled ||
                            !draft.licenceHeld
                          }
                        />

                        <span>{option.label}</span>
                      </label>
                    ),
                  )}
                </div>
              ) : (
                <ReadOnlyValue
                  value={
                    draft.licenceCategories.length
                      ? draft.licenceCategories.join(
                          ", ",
                        )
                      : ""
                  }
                />
              )}

              <FieldError
                message={
                  validationErrors.licenceCategories
                }
              />
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<ShieldCheck size={18} />}
              title="DVLA check"
              description="Record consent, check details and any required follow-up without exposing restricted information unnecessarily."
            />

            {!resolvedPermissions.canViewDVLAInformation ? (
              <div style={styles.restrictedPanel}>
                <LockKeyhole size={17} />

                <div>
                  <strong>
                    DVLA information is restricted
                  </strong>

                  <p>
                    Your current permission level does
                    not allow access to this section.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.checkboxGrid}>
                  {editing &&
                  resolvedPermissions.canEditDVLAInformation ? (
                    <>
                      <CheckboxField
                        checked={
                          draft.dvlaCheckRequired
                        }
                        label="DVLA check required"
                        disabled={isDisabled}
                        onChange={(checked) =>
                          updateField(
                            "dvlaCheckRequired",
                            checked,
                          )
                        }
                      />

                      <CheckboxField
                        checked={
                          draft.dvlaCheckConsentConfirmed
                        }
                        label="Consent confirmed"
                        description="The person has provided consent for the check."
                        disabled={isDisabled}
                        onChange={(checked) =>
                          updateField(
                            "dvlaCheckConsentConfirmed",
                            checked,
                          )
                        }
                      />
                    </>
                  ) : (
                    <>
                      <ReadOnlyValue
                        value={
                          draft.dvlaCheckRequired
                            ? "DVLA check required"
                            : "DVLA check not required"
                        }
                      />

                      <ReadOnlyValue
                        value={
                          draft.dvlaCheckConsentConfirmed
                            ? "Consent confirmed"
                            : "Consent not confirmed"
                        }
                      />
                    </>
                  )}
                </div>

                <FieldError
                  message={
                    validationErrors.dvlaCheckConsentConfirmed
                  }
                />

                <div style={styles.formGrid}>
                  <div style={styles.field}>
                    <FieldLabel sensitive>
                      DVLA check code
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canEditDVLAInformation ? (
                      <input
                        type="text"
                        value={draft.dvlaCheckCode}
                        onChange={(event) =>
                          updateField(
                            "dvlaCheckCode",
                            event.target.value.toUpperCase(),
                          )
                        }
                        style={styles.input}
                        disabled={
                          isDisabled ||
                          !draft.dvlaCheckRequired
                        }
                      />
                    ) : (
                      <ReadOnlyValue
                        value={draft.dvlaCheckCode}
                      />
                    )}
                  </div>

                  <div style={styles.field}>
                    <FieldLabel>
                      Check date
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canPerformDVLACheck ? (
                      <>
                        <input
                          type="date"
                          value={
                            draft.dvlaCheckDate
                          }
                          onChange={(event) =>
                            updateField(
                              "dvlaCheckDate",
                              event.target.value,
                            )
                          }
                          style={{
                            ...styles.input,
                            ...(validationErrors.dvlaCheckDate
                              ? styles.inputError
                              : {}),
                          }}
                          disabled={
                            isDisabled ||
                            !draft.dvlaCheckRequired
                          }
                        />

                        <FieldError
                          message={
                            validationErrors.dvlaCheckDate
                          }
                        />
                      </>
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.dvlaCheckDate
                            ? formatDate(
                                draft.dvlaCheckDate,
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
                    resolvedPermissions.canPerformDVLACheck ? (
                      <>
                        <input
                          type="text"
                          value={
                            draft.dvlaCheckedBy
                          }
                          onChange={(event) =>
                            updateField(
                              "dvlaCheckedBy",
                              event.target.value,
                            )
                          }
                          style={{
                            ...styles.input,
                            ...(validationErrors.dvlaCheckedBy
                              ? styles.inputError
                              : {}),
                          }}
                          disabled={
                            isDisabled ||
                            !draft.dvlaCheckRequired
                          }
                        />

                        <FieldError
                          message={
                            validationErrors.dvlaCheckedBy
                          }
                        />
                      </>
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.dvlaCheckedBy
                        }
                      />
                    )}
                  </div>

                  <div style={styles.field}>
                    <FieldLabel>
                      Follow-up date
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canPerformDVLACheck ? (
                      <input
                        type="date"
                        value={
                          draft.dvlaFollowUpDate
                        }
                        onChange={(event) =>
                          updateField(
                            "dvlaFollowUpDate",
                            event.target.value,
                          )
                        }
                        style={styles.input}
                        disabled={
                          isDisabled ||
                          !draft.dvlaCheckRequired
                        }
                      />
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.dvlaFollowUpDate
                            ? formatDate(
                                draft.dvlaFollowUpDate,
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
                      DVLA check outcome
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canPerformDVLACheck ? (
                      <textarea
                        value={
                          draft.dvlaCheckOutcome
                        }
                        onChange={(event) =>
                          updateField(
                            "dvlaCheckOutcome",
                            event.target.value,
                          )
                        }
                        rows={4}
                        style={styles.textarea}
                        disabled={
                          isDisabled ||
                          !draft.dvlaCheckRequired
                        }
                        placeholder="Record the factual outcome and any follow-up required."
                      />
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.dvlaCheckOutcome
                        }
                        fallback="No outcome recorded"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
                    <section style={styles.section}>
            <SectionHeader
              icon={<AlertCircle size={18} />}
              title="Points, endorsements and restrictions"
              description="Record relevant licence information factually and restrict access to disqualification details."
            />

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <FieldLabel>
                  Penalty points
                </FieldLabel>

                {editing ? (
                  <>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={
                        draft.penaltyPoints ?? ""
                      }
                      onChange={(event) =>
                        updateField(
                          "penaltyPoints",
                          event.target.value === ""
                            ? null
                            : Number(
                                event.target.value,
                              ),
                        )
                      }
                      style={{
                        ...styles.input,
                        ...(validationErrors.penaltyPoints
                          ? styles.inputError
                          : {}),
                      }}
                      disabled={isDisabled}
                    />

                    <FieldError
                      message={
                        validationErrors.penaltyPoints
                      }
                    />
                  </>
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.penaltyPoints !== null
                        ? String(
                            draft.penaltyPoints,
                          )
                        : ""
                    }
                  />
                )}
              </div>

              <div style={styles.field}>
                <FieldLabel>
                  Restrictions or licence codes
                </FieldLabel>

                {editing ? (
                  <input
                    type="text"
                    value={
                      draft.restrictionsOrCodes
                    }
                    onChange={(event) =>
                      updateField(
                        "restrictionsOrCodes",
                        event.target.value,
                      )
                    }
                    style={styles.input}
                    disabled={isDisabled}
                    placeholder="For example, eyesight or vehicle restrictions"
                  />
                ) : (
                  <ReadOnlyValue
                    value={
                      draft.restrictionsOrCodes
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
                  Endorsements
                </FieldLabel>

                {editing ? (
                  <textarea
                    value={draft.endorsements}
                    onChange={(event) =>
                      updateField(
                        "endorsements",
                        event.target.value,
                      )
                    }
                    rows={4}
                    style={styles.textarea}
                    disabled={isDisabled}
                    placeholder="Record relevant endorsement codes, dates and factual details."
                  />
                ) : (
                  <ReadOnlyValue
                    value={draft.endorsements}
                    fallback="No endorsements recorded"
                  />
                )}
              </div>
            </div>

            {!resolvedPermissions.canViewDisqualificationInformation ? (
              <div style={styles.restrictedPanel}>
                <LockKeyhole size={17} />

                <div>
                  <strong>
                    Disqualification information is
                    restricted
                  </strong>

                  <p>
                    Your current permission level does
                    not allow access to this information.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.checkboxGrid}>
                  {editing &&
                  resolvedPermissions.canEditDisqualificationInformation ? (
                    <CheckboxField
                      checked={
                        draft.disqualificationHistory
                      }
                      label="Previous driving disqualification"
                      description="Record only information relevant to the role and assessment."
                      disabled={isDisabled}
                      onChange={(checked) =>
                        updateField(
                          "disqualificationHistory",
                          checked,
                        )
                      }
                    />
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.disqualificationHistory
                          ? "Previous disqualification recorded"
                          : "No disqualification recorded"
                      }
                    />
                  )}
                </div>

                {draft.disqualificationHistory ||
                editing ? (
                  <div style={styles.field}>
                    <FieldLabel sensitive>
                      Disqualification details
                    </FieldLabel>

                    {editing &&
                    resolvedPermissions.canEditDisqualificationInformation ? (
                      <>
                        <textarea
                          value={
                            draft.disqualificationDetails
                          }
                          onChange={(event) =>
                            updateField(
                              "disqualificationDetails",
                              event.target.value,
                            )
                          }
                          rows={4}
                          style={{
                            ...styles.textarea,
                            ...(validationErrors.disqualificationDetails
                              ? styles.inputError
                              : {}),
                          }}
                          disabled={
                            isDisabled ||
                            !draft.disqualificationHistory
                          }
                          placeholder="Record concise factual details and relevant dates."
                        />

                        <FieldError
                          message={
                            validationErrors.disqualificationDetails
                          }
                        />
                      </>
                    ) : (
                      <ReadOnlyValue
                        value={
                          draft.disqualificationDetails
                        }
                      />
                    )}
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<Car size={18} />}
              title="Business driving and grey fleet"
              description="Confirm that personal vehicle use is properly insured, roadworthy and approved before business driving begins."
            />

            <div style={styles.checkboxGrid}>
              {editing ? (
                <>
                  <CheckboxField
                    checked={
                      draft.businessUsePermitted
                    }
                    label="Business use permitted"
                    description="The insurance policy permits the required business driving."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "businessUsePermitted",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.insuranceVerified
                    }
                    label="Insurance verified"
                    description="Current insurance evidence has been reviewed."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "insuranceVerified",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={draft.motRequired}
                    label="MOT required"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "motRequired",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={draft.motVerified}
                    label="MOT verified"
                    disabled={
                      isDisabled ||
                      !draft.motRequired
                    }
                    onChange={(checked) =>
                      updateField(
                        "motVerified",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.vehicleTaxVerified
                    }
                    label="Vehicle tax verified"
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "vehicleTaxVerified",
                        checked,
                      )
                    }
                  />

                  <CheckboxField
                    checked={
                      draft.greyFleetApproved
                    }
                    label="Grey fleet approved"
                    description="The person and vehicle have been approved for business use."
                    disabled={isDisabled}
                    onChange={(checked) =>
                      updateField(
                        "greyFleetApproved",
                        checked,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ReadOnlyValue
                    value={
                      draft.businessUsePermitted
                        ? "Business use permitted"
                        : "Business use not confirmed"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.insuranceVerified
                        ? "Insurance verified"
                        : "Insurance not verified"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.motRequired
                        ? draft.motVerified
                          ? "MOT required and verified"
                          : "MOT required but not verified"
                        : "MOT not required"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.vehicleTaxVerified
                        ? "Vehicle tax verified"
                        : "Vehicle tax not verified"
                    }
                  />

                  <ReadOnlyValue
                    value={
                      draft.greyFleetApproved
                        ? "Grey fleet approved"
                        : "Grey fleet not approved"
                    }
                  />
                </>
              )}
            </div>

            <FieldError
              message={
                validationErrors.businessUsePermitted
              }
            />

            <FieldError
              message={
                validationErrors.insuranceVerified
              }
            />

            {!resolvedPermissions.canViewInsuranceInformation ? (
              <div style={styles.restrictedPanel}>
                <LockKeyhole size={17} />

                <div>
                  <strong>
                    Insurance information is restricted
                  </strong>

                  <p>
                    Your current permission level does
                    not allow access to policy details.
                  </p>
                </div>
              </div>
            ) : (
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <FieldLabel>
                    Insurance provider
                  </FieldLabel>

                  {editing &&
                  resolvedPermissions.canEditInsuranceInformation ? (
                    <input
                      type="text"
                      value={
                        draft.insuranceProvider
                      }
                      onChange={(event) =>
                        updateField(
                          "insuranceProvider",
                          event.target.value,
                        )
                      }
                      style={styles.input}
                      disabled={isDisabled}
                    />
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.insuranceProvider
                      }
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <FieldLabel sensitive>
                    Policy number
                  </FieldLabel>

                  {editing &&
                  resolvedPermissions.canEditInsuranceInformation ? (
                    <input
                      type="text"
                      value={
                        draft.insurancePolicyNumber
                      }
                      onChange={(event) =>
                        updateField(
                          "insurancePolicyNumber",
                          event.target.value,
                        )
                      }
                      style={styles.input}
                      disabled={isDisabled}
                    />
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.insurancePolicyNumber
                      }
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <FieldLabel>
                    Insurance expiry date
                  </FieldLabel>

                  {editing &&
                  resolvedPermissions.canEditInsuranceInformation ? (
                    <>
                      <input
                        type="date"
                        value={
                          draft.insuranceExpiryDate
                        }
                        onChange={(event) =>
                          updateField(
                            "insuranceExpiryDate",
                            event.target.value,
                          )
                        }
                        style={{
                          ...styles.input,
                          ...(validationErrors.insuranceExpiryDate
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={isDisabled}
                      />

                      <FieldError
                        message={
                          validationErrors.insuranceExpiryDate
                        }
                      />
                    </>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.insuranceExpiryDate
                          ? formatDate(
                              draft.insuranceExpiryDate,
                            )
                          : ""
                      }
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <FieldLabel>
                    MOT expiry date
                  </FieldLabel>

                  {editing ? (
                    <>
                      <input
                        type="date"
                        value={draft.motExpiryDate}
                        onChange={(event) =>
                          updateField(
                            "motExpiryDate",
                            event.target.value,
                          )
                        }
                        style={{
                          ...styles.input,
                          ...(validationErrors.motExpiryDate
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={
                          isDisabled ||
                          !draft.motRequired
                        }
                      />

                      <FieldError
                        message={
                          validationErrors.motExpiryDate
                        }
                      />
                    </>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.motExpiryDate
                          ? formatDate(
                              draft.motExpiryDate,
                            )
                          : ""
                      }
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <FieldLabel>
                    Vehicle tax expiry date
                  </FieldLabel>

                  {editing ? (
                    <input
                      type="date"
                      value={
                        draft.vehicleTaxExpiryDate
                      }
                      onChange={(event) =>
                        updateField(
                          "vehicleTaxExpiryDate",
                          event.target.value,
                        )
                      }
                      style={styles.input}
                      disabled={isDisabled}
                    />
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.vehicleTaxExpiryDate
                          ? formatDate(
                              draft.vehicleTaxExpiryDate,
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
                      value={
                        draft.nextReviewDate
                      }
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

                <div style={styles.field}>
                  <FieldLabel>
                    Grey fleet approval date
                  </FieldLabel>

                  {editing ? (
                    <>
                      <input
                        type="date"
                        value={
                          draft.greyFleetApprovalDate
                        }
                        onChange={(event) =>
                          updateField(
                            "greyFleetApprovalDate",
                            event.target.value,
                          )
                        }
                        style={{
                          ...styles.input,
                          ...(validationErrors.greyFleetApprovalDate
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={
                          isDisabled ||
                          !draft.greyFleetApproved
                        }
                      />

                      <FieldError
                        message={
                          validationErrors.greyFleetApprovalDate
                        }
                      />
                    </>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.greyFleetApprovalDate
                          ? formatDate(
                              draft.greyFleetApprovalDate,
                            )
                          : ""
                      }
                    />
                  )}
                </div>

                <div style={styles.field}>
                  <FieldLabel>
                    Grey fleet approved by
                  </FieldLabel>

                  {editing ? (
                    <>
                      <input
                        type="text"
                        value={
                          draft.greyFleetApprovedBy
                        }
                        onChange={(event) =>
                          updateField(
                            "greyFleetApprovedBy",
                            event.target.value,
                          )
                        }
                        style={{
                          ...styles.input,
                          ...(validationErrors.greyFleetApprovedBy
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={
                          isDisabled ||
                          !draft.greyFleetApproved
                        }
                      />

                      <FieldError
                        message={
                          validationErrors.greyFleetApprovedBy
                        }
                      />
                    </>
                  ) : (
                    <ReadOnlyValue
                      value={
                        draft.greyFleetApprovedBy
                      }
                    />
                  )}
                </div>
              </div>
            )}
          </section>

          <section style={styles.section}>
            <SectionHeader
              icon={<FileText size={18} />}
              title="Supporting evidence"
              description="Store licence, DVLA, insurance, MOT and business-use evidence securely."
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
                    not allow access to driving evidence.
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
                        Upload evidence used to verify
                        the driving record.
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
                            styles.evidenceTypeLabel
                          }
                        >
                          {getEvidenceTypeLabel(
                            item.evidenceType,
                          )}
                        </span>

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
                          style={
                            styles.evidenceTypeLabel
                          }
                        >
                          {getEvidenceTypeLabel(
                            item.evidenceType,
                          )}
                        </span>

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
                    <select
                      value={selectedEvidenceType}
                      onChange={(event) =>
                        setSelectedEvidenceType(
                          event.target
                            .value as DrivingEvidenceType,
                        )
                      }
                      style={styles.uploadSelect}
                      disabled={isDisabled}
                    >
                      {EVIDENCE_TYPE_OPTIONS.map(
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
                description="Previous driving checks remain preserved and should not be overwritten."
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
                    here after checks are saved.
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
                              {getCheckStatusLabel(
                                entry.status,
                              )}
                            </strong>

                            <span>
                              {formatDateTime(
                                entry.checkedAt,
                              )}
                            </span>
                          </div>

                          <p
                            style={
                              styles.historyText
                            }
                          >
                            Checked by{" "}
                            {entry.checkedBy}.
                          </p>

                          {entry.licenceNumberLastFour ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Licence ending{" "}
                              {
                                entry.licenceNumberLastFour
                              }
                              .
                            </p>
                          ) : null}

                          {entry.licenceExpiryDate ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Licence expiry{" "}
                              {formatDate(
                                entry.licenceExpiryDate,
                              )}
                              .
                            </p>
                          ) : null}

                          {entry.penaltyPoints !==
                          undefined ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Penalty points recorded:{" "}
                              {entry.penaltyPoints}.
                            </p>
                          ) : null}

                          {entry.businessUseConfirmed ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Business use confirmed.
                            </p>
                          ) : null}

                          {entry.insuranceExpiryDate ? (
                            <p
                              style={
                                styles.historyText
                              }
                            >
                              Insurance expiry{" "}
                              {formatDate(
                                entry.insuranceExpiryDate,
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
              description="Use concise factual notes relevant to driving eligibility, verification and follow-up."
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
                  : "Save driving record"}
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

          button:disabled,
          input:disabled,
          select:disabled,
          textarea:disabled {
            cursor: not-allowed;
            opacity: 0.6;
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
    display: "grid",
    gap: "17px",
    padding: "20px",
    border: "1px solid #ECE4F0",
    borderRadius: "15px",
    background: "#FFFFFF",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
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
  },

  categoryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "8px",
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

  uploadSelect: {
    minHeight: "38px",
    border: "1px solid #DCCFE3",
    borderRadius: "9px",
    outline: "none",
    background: "#FFFFFF",
    color: "#3F3543",
    padding: "8px 10px",
    font: "inherit",
    fontSize: "11px",
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

  categoryOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minHeight: "42px",
    boxSizing: "border-box",
    border: "1px solid #E3D9E8",
    borderRadius: "9px",
    background: "#FFFFFF",
    color: "#66596B",
    padding: "8px 10px",
    fontSize: "10px",
    cursor: "pointer",
  },

  categoryOptionSelected: {
    borderColor: "#BFA8CE",
    background: "#F6F0FA",
    color: "#6E5084",
    fontWeight: 750,
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

  evidenceTypeLabel: {
    display: "inline-flex",
    marginTop: "4px",
    borderRadius: "999px",
    background: "#F2ECF6",
    color: "#6E5084",
    padding: "3px 7px",
    fontSize: "9px",
    fontWeight: 750,
  },

  evidenceMeta: {
    display: "block",
    marginTop: "4px",
    color: "#8B7F90",
    fontSize: "10px",
  },

  uploadArea: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
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