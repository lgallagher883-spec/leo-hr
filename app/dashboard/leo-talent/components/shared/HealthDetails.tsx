"use client";

import {
  Activity,
  AlertCircle,
  Baby,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileHeart,
  FileText,
  HeartPulse,
  History,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Stethoscope,
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

export type HealthDetailsMode = "candidate" | "employee";

export type HealthRecordStatus =
  | "not_assessed"
  | "information_requested"
  | "support_in_place"
  | "occupational_health_review"
  | "fit_for_role"
  | "fit_with_adjustments"
  | "temporarily_unfit"
  | "review_required"
  | "closed";

export type HealthEvidenceType =
  | "fit_note"
  | "occupational_health_report"
  | "medical_advice"
  | "adjustment_assessment"
  | "risk_assessment"
  | "consent_form"
  | "vaccination_evidence"
  | "return_to_work_record"
  | "pregnancy_risk_assessment"
  | "other";

export type OccupationalHealthOutcome =
  | "pending"
  | "fit_for_role"
  | "fit_with_adjustments"
  | "temporarily_unfit"
  | "further_information_required"
  | "review_required"
  | "closed";

export type HealthEvidence = {
  id: string;
  evidenceType: HealthEvidenceType;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  current: boolean;
};

export type OccupationalHealthHistoryEntry = {
  id: string;
  referralDate: string;
  appointmentDate?: string;
  reportReceivedDate?: string;
  referredBy: string;
  provider?: string;
  reason: string;
  outcome: OccupationalHealthOutcome;
  reviewDate?: string;
  recommendedAdjustments?: string;
  restrictions?: string;
  notes?: string;
};

export type HealthReviewHistoryEntry = {
  id: string;
  reviewedAt: string;
  reviewedBy: string;
  status: HealthRecordStatus;
  reason?: string;
  changesMade?: string;
  nextReviewDate?: string;
  notes?: string;
};

export type HealthDetailsValue = {
  status: HealthRecordStatus;
  nextReviewDate: string;
  lastReviewedDate: string;
  lastReviewedBy: string;

  consentToProcessHealthData: boolean;
  consentRecordedDate: string;
  consentRecordedBy: string;
  consentNotes: string;

  disabilityOrLongTermConditionDisclosed: boolean;
  disabilityOrConditionDetails: string;
  conditionImpactAtWork: string;
  employeePreferredLanguage: string;

  reasonableAdjustmentsRequired: boolean;
  reasonableAdjustments: string;
  adjustmentStartDate: string;
  adjustmentReviewDate: string;
  adjustmentOwner: string;
  adjustmentRiskAssessmentRequired: boolean;
  adjustmentRiskAssessmentCompleted: boolean;

  allergiesOrEmergencyMedicalInformation: string;
  medicationRelevantToWork: string;
  medicalRestrictions: string;
  manualHandlingRestrictions: string;
  drivingRestrictions: string;
  loneWorkingRestrictions: string;
  workingTimeRestrictions: string;

  vaccinationRequirementApplies: boolean;
  vaccinationRequirementDetails: string;
  vaccinationStatus: string;
  vaccinationReviewDate: string;

  pregnancyRelatedSupportRequired: boolean;
  pregnancyRelatedSupportDetails: string;
  pregnancyRiskAssessmentCompleted: boolean;
  pregnancyRiskAssessmentDate: string;
  expectedWeekOfChildbirth: string;

  currentFitNoteApplies: boolean;
  fitNoteStartDate: string;
  fitNoteEndDate: string;
  fitNoteAdvice: string;
  fitNoteReviewDate: string;

  occupationalHealthReferralRequired: boolean;
  occupationalHealthReferralReason: string;
  occupationalHealthConsentConfirmed: boolean;
  occupationalHealthCurrentOutcome: OccupationalHealthOutcome;
  occupationalHealthNextReviewDate: string;

  returnToWorkSupportRequired: boolean;
  returnToWorkSupportDetails: string;
  returnToWorkReviewDate: string;

  emergencyResponseInstructions: string;
  managerGuidance: string;
  confidentialNotes: string;

  evidence: HealthEvidence[];
  occupationalHealthHistory: OccupationalHealthHistoryEntry[];
  reviewHistory: HealthReviewHistoryEntry[];
};

export type HealthDetailsPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewSensitiveHealthData: boolean;
  canEditSensitiveHealthData: boolean;
  canViewPregnancyInformation: boolean;
  canEditPregnancyInformation: boolean;
  canViewOccupationalHealth: boolean;
  canEditOccupationalHealth: boolean;
  canRecordConsent: boolean;
  canManageAdjustments: boolean;
  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;
  canViewHistory: boolean;
};

export type HealthDetailsAuditEvent = {
  action:
    | "health_edit_started"
    | "health_edit_cancelled"
    | "health_saved"
    | "health_evidence_selected"
    | "health_evidence_removed"
    | "health_consent_recorded"
    | "health_adjustment_updated"
    | "occupational_health_updated"
    | "pregnancy_support_updated";
  mode: HealthDetailsMode;
  recordId?: string | number;
  evidenceId?: string;
  changedFields?: string[];
  occurredAt: string;
};

export type PendingHealthFile = {
  file: File;
  evidenceType: HealthEvidenceType;
};

export type HealthDetailsSavePayload = {
  value: HealthDetailsValue;
  changedFields: string[];
  newFiles: PendingHealthFile[];
  removedEvidenceIds: string[];
};

export type HealthDetailsProps = {
  mode: HealthDetailsMode;
  value?: Partial<HealthDetailsValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<HealthDetailsPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (payload: HealthDetailsSavePayload) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (event: HealthDetailsAuditEvent) => Promise<void> | void;
};

type ValidationErrors = Record<string, string>;

type PendingFile = {
  id: string;
  file: File;
  evidenceType: HealthEvidenceType;
};

const EMPTY_VALUE: HealthDetailsValue = {
  status: "not_assessed",
  nextReviewDate: "",
  lastReviewedDate: "",
  lastReviewedBy: "",

  consentToProcessHealthData: false,
  consentRecordedDate: "",
  consentRecordedBy: "",
  consentNotes: "",

  disabilityOrLongTermConditionDisclosed: false,
  disabilityOrConditionDetails: "",
  conditionImpactAtWork: "",
  employeePreferredLanguage: "",

  reasonableAdjustmentsRequired: false,
  reasonableAdjustments: "",
  adjustmentStartDate: "",
  adjustmentReviewDate: "",
  adjustmentOwner: "",
  adjustmentRiskAssessmentRequired: false,
  adjustmentRiskAssessmentCompleted: false,

  allergiesOrEmergencyMedicalInformation: "",
  medicationRelevantToWork: "",
  medicalRestrictions: "",
  manualHandlingRestrictions: "",
  drivingRestrictions: "",
  loneWorkingRestrictions: "",
  workingTimeRestrictions: "",

  vaccinationRequirementApplies: false,
  vaccinationRequirementDetails: "",
  vaccinationStatus: "",
  vaccinationReviewDate: "",

  pregnancyRelatedSupportRequired: false,
  pregnancyRelatedSupportDetails: "",
  pregnancyRiskAssessmentCompleted: false,
  pregnancyRiskAssessmentDate: "",
  expectedWeekOfChildbirth: "",

  currentFitNoteApplies: false,
  fitNoteStartDate: "",
  fitNoteEndDate: "",
  fitNoteAdvice: "",
  fitNoteReviewDate: "",

  occupationalHealthReferralRequired: false,
  occupationalHealthReferralReason: "",
  occupationalHealthConsentConfirmed: false,
  occupationalHealthCurrentOutcome: "pending",
  occupationalHealthNextReviewDate: "",

  returnToWorkSupportRequired: false,
  returnToWorkSupportDetails: "",
  returnToWorkReviewDate: "",

  emergencyResponseInstructions: "",
  managerGuidance: "",
  confidentialNotes: "",

  evidence: [],
  occupationalHealthHistory: [],
  reviewHistory: [],
};

const DEFAULT_PERMISSIONS: HealthDetailsPermissions = {
  canView: true,
  canEdit: true,
  canViewSensitiveHealthData: true,
  canEditSensitiveHealthData: true,
  canViewPregnancyInformation: true,
  canEditPregnancyInformation: true,
  canViewOccupationalHealth: true,
  canEditOccupationalHealth: true,
  canRecordConsent: true,
  canManageAdjustments: true,
  canViewEvidence: true,
  canUploadEvidence: true,
  canDeleteEvidence: true,
  canViewHistory: true,
};

const STATUS_OPTIONS: Array<{ value: HealthRecordStatus; label: string }> = [
  { value: "not_assessed", label: "Not assessed" },
  { value: "information_requested", label: "Information requested" },
  { value: "support_in_place", label: "Support in place" },
  { value: "occupational_health_review", label: "Occupational Health review" },
  { value: "fit_for_role", label: "Fit for role" },
  { value: "fit_with_adjustments", label: "Fit with adjustments" },
  { value: "temporarily_unfit", label: "Temporarily unfit" },
  { value: "review_required", label: "Review required" },
  { value: "closed", label: "Closed" },
];

const OH_OUTCOME_OPTIONS: Array<{ value: OccupationalHealthOutcome; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "fit_for_role", label: "Fit for role" },
  { value: "fit_with_adjustments", label: "Fit with adjustments" },
  { value: "temporarily_unfit", label: "Temporarily unfit" },
  { value: "further_information_required", label: "Further information required" },
  { value: "review_required", label: "Review required" },
  { value: "closed", label: "Closed" },
];

const EVIDENCE_TYPE_OPTIONS: Array<{ value: HealthEvidenceType; label: string }> = [
  { value: "fit_note", label: "Fit note" },
  { value: "occupational_health_report", label: "Occupational Health report" },
  { value: "medical_advice", label: "Medical advice" },
  { value: "adjustment_assessment", label: "Adjustment assessment" },
  { value: "risk_assessment", label: "Risk assessment" },
  { value: "consent_form", label: "Consent form" },
  { value: "vaccination_evidence", label: "Vaccination evidence" },
  { value: "return_to_work_record", label: "Return-to-work record" },
  { value: "pregnancy_risk_assessment", label: "Pregnancy risk assessment" },
  { value: "other", label: "Other" },
];

function normaliseValue(value?: Partial<HealthDetailsValue>): HealthDetailsValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    evidence: value?.evidence ?? [],
    occupationalHealthHistory: value?.occupationalHealthHistory ?? [],
    reviewHistory: value?.reviewHistory ?? [],
  };
}

function normaliseComparableValue(value: HealthDetailsValue): HealthDetailsValue {
  const trimmed: HealthDetailsValue = { ...value };
  const stringKeys = Object.keys(value).filter(
    (key) => typeof value[key as keyof HealthDetailsValue] === "string",
  ) as Array<keyof HealthDetailsValue>;

  stringKeys.forEach((key) => {
    const current = value[key];
    if (typeof current === "string") {
      (trimmed as unknown as Record<string, unknown>)[String(key)] = current.trim();
    }
  });

  return trimmed;
}

function getChangedFields(
  original: HealthDetailsValue,
  current: HealthDetailsValue,
): string[] {
  const a = normaliseComparableValue(original);
  const b = normaliseComparableValue(current);
  const ignored = new Set(["evidence", "occupationalHealthHistory", "reviewHistory"]);

  return (Object.keys(a) as Array<keyof HealthDetailsValue>).filter((key) => {
    if (ignored.has(String(key))) return false;
    return a[key] !== b[key];
  }).map(String);
}

function validateValue(value: HealthDetailsValue): ValidationErrors {
  const errors: ValidationErrors = {};

  if (value.consentToProcessHealthData) {
    if (!value.consentRecordedDate) errors.consentRecordedDate = "Enter the date consent was recorded.";
    if (!value.consentRecordedBy.trim()) errors.consentRecordedBy = "Enter who recorded the consent.";
  }

  if (value.disabilityOrLongTermConditionDisclosed && !value.disabilityOrConditionDetails.trim()) {
    errors.disabilityOrConditionDetails = "Record the disclosed condition or relevant support information.";
  }

  if (value.reasonableAdjustmentsRequired) {
    if (!value.reasonableAdjustments.trim()) errors.reasonableAdjustments = "Record the reasonable adjustments required.";
    if (!value.adjustmentOwner.trim()) errors.adjustmentOwner = "Record who is responsible for the adjustments.";
  }

  if (value.adjustmentStartDate && value.adjustmentReviewDate && value.adjustmentReviewDate < value.adjustmentStartDate) {
    errors.adjustmentReviewDate = "The adjustment review date cannot be before the start date.";
  }

  if (value.currentFitNoteApplies) {
    if (!value.fitNoteStartDate) errors.fitNoteStartDate = "Enter the fit note start date.";
    if (!value.fitNoteEndDate) errors.fitNoteEndDate = "Enter the fit note end date.";
  }

  if (value.fitNoteStartDate && value.fitNoteEndDate && value.fitNoteEndDate < value.fitNoteStartDate) {
    errors.fitNoteEndDate = "The fit note end date cannot be before the start date.";
  }

  if (value.occupationalHealthReferralRequired) {
    if (!value.occupationalHealthReferralReason.trim()) errors.occupationalHealthReferralReason = "Record the reason for the Occupational Health referral.";
    if (!value.occupationalHealthConsentConfirmed) errors.occupationalHealthConsentConfirmed = "Confirm that appropriate consent has been recorded.";
  }

  if (value.vaccinationRequirementApplies && !value.vaccinationRequirementDetails.trim()) {
    errors.vaccinationRequirementDetails = "Record the role-specific vaccination requirement.";
  }

  if (value.pregnancyRelatedSupportRequired && !value.pregnancyRelatedSupportDetails.trim()) {
    errors.pregnancyRelatedSupportDetails = "Record the pregnancy-related support or workplace changes required.";
  }

  if (value.pregnancyRiskAssessmentCompleted && !value.pregnancyRiskAssessmentDate) {
    errors.pregnancyRiskAssessmentDate = "Enter the date the pregnancy risk assessment was completed.";
  }

  if (value.returnToWorkSupportRequired && !value.returnToWorkSupportDetails.trim()) {
    errors.returnToWorkSupportDetails = "Record the return-to-work support required.";
  }

  return errors;
}

function formatDate(value?: string): string {
  if (!value) return "Not recorded";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(value: HealthRecordStatus): string {
  return STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getOutcomeLabel(value: OccupationalHealthOutcome): string {
  return OH_OUTCOME_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getEvidenceTypeLabel(value: HealthEvidenceType): string {
  return EVIDENCE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getStatusAppearance(status: HealthRecordStatus) {
  switch (status) {
    case "fit_for_role":
    case "closed":
      return { background: "#F2FAF5", border: "#CFE6D8", color: "#4E765F", icon: <CheckCircle2 size={14} /> };
    case "support_in_place":
    case "fit_with_adjustments":
      return { background: "#F6F2FA", border: "#DDD0E5", color: "#6E5084", icon: <HeartPulse size={14} /> };
    case "information_requested":
    case "occupational_health_review":
    case "review_required":
      return { background: "#FBF8F2", border: "#E7DCC6", color: "#806C46", icon: <Activity size={14} /> };
    case "temporarily_unfit":
      return { background: "#FFF7F8", border: "#E8CBD2", color: "#8B4E5D", icon: <AlertCircle size={14} /> };
    default:
      return { background: "#F8F5FA", border: "#E1D8E6", color: "#746A79", icon: <ShieldCheck size={14} /> };
  }
}

function FieldLabel({ children, required, sensitive }: { children: ReactNode; required?: boolean; sensitive?: boolean }) {
  return (
    <label style={styles.fieldLabel}>
      <span>{children}</span>
      {required ? <span style={styles.requiredMark}>*</span> : null}
      {sensitive ? (
        <span style={styles.sensitiveLabel}>
          <LockKeyhole size={11} /> Restricted
        </span>
      ) : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" style={styles.fieldError}><AlertCircle size={12} />{message}</p>;
}

function ReadOnlyValue({ value, fallback = "Not recorded", restricted = false }: { value?: string; fallback?: string; restricted?: boolean }) {
  if (restricted) {
    return <span style={styles.restrictedValue}><LockKeyhole size={13} />Restricted</span>;
  }
  return <span style={{ ...styles.readOnlyValue, ...(!value ? styles.readOnlyEmpty : {}) }}>{value || fallback}</span>;
}

function SectionHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <header style={styles.sectionHeader}>
      <span style={styles.sectionIcon}>{icon}</span>
      <div>
        <h3 style={styles.sectionTitle}>{title}</h3>
        <p style={styles.sectionDescription}>{description}</p>
      </div>
    </header>
  );
}

function CheckboxField({ checked, label, description, disabled, onChange }: { checked: boolean; label: string; description?: string; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={styles.checkboxCard}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
      <span>
        <strong style={styles.checkboxTitle}>{label}</strong>
        {description ? <span style={styles.checkboxDescription}>{description}</span> : null}
      </span>
    </label>
  );
}

export default function HealthDetails({
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
}: HealthDetailsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resolvedPermissions = useMemo(() => ({ ...DEFAULT_PERMISSIONS, ...permissions }), [permissions]);
  const suppliedValue = useMemo(() => normaliseValue(value), [value]);
  const [originalValue, setOriginalValue] = useState<HealthDetailsValue>(suppliedValue);
  const [draft, setDraft] = useState<HealthDetailsValue>(suppliedValue);
  const [editing, setEditing] = useState(startInEditMode && resolvedPermissions.canEdit);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState<string[]>([]);
  const [selectedEvidenceType, setSelectedEvidenceType] = useState<HealthEvidenceType>("fit_note");
  const [localSaving, setLocalSaving] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState({ occupationalHealth: true, reviews: false });

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;

  useEffect(() => {
    setOriginalValue(suppliedValue);
    setDraft(suppliedValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
  }, [suppliedValue]);

  const changedFields = useMemo(() => getChangedFields(originalValue, draft), [originalValue, draft]);
  const isDirty = changedFields.length > 0 || pendingFiles.length > 0 || removedEvidenceIds.length > 0;
  const statusAppearance = getStatusAppearance(draft.status);

  async function recordAudit(action: HealthDetailsAuditEvent["action"], options?: { evidenceId?: string; changedFields?: string[] }) {
    if (!onAudit) return;
    await onAudit({ action, mode, recordId, evidenceId: options?.evidenceId, changedFields: options?.changedFields, occurredAt: new Date().toISOString() });
  }

  function updateField<Key extends keyof HealthDetailsValue>(key: Key, nextValue: HealthDetailsValue[Key]) {
    setDraft((current) => ({ ...current, [key]: nextValue }));
    setValidationErrors((current) => {
      if (!current[String(key)]) return current;
      const next = { ...current };
      delete next[String(key)];
      return next;
    });
  }

  async function beginEditing() {
    if (!resolvedPermissions.canEdit || isDisabled) return;
    setEditing(true);
    await recordAudit("health_edit_started");
  }

  async function cancelEditing() {
    setDraft(originalValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setEditing(false);
    onCancel?.();
    await recordAudit("health_edit_cancelled");
  }

  function resetChanges() {
    setDraft(originalValue);
    setValidationErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.size <= 15 * 1024 * 1024);
    if (files.length) {
      setPendingFiles((current) => [
        ...current,
        ...files.map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`, file, evidenceType: selectedEvidenceType })),
      ]);
      await recordAudit("health_evidence_selected");
    }
    event.target.value = "";
  }

  function removePendingFile(id: string) {
    setPendingFiles((current) => current.filter((item) => item.id !== id));
  }

  async function removeExistingEvidence(id: string) {
    if (!resolvedPermissions.canDeleteEvidence || isDisabled) return;
    setRemovedEvidenceIds((current) => current.includes(id) ? current : [...current, id]);
    await recordAudit("health_evidence_removed", { evidenceId: id });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedPermissions.canEdit || isDisabled || !onSave) return;

    const errors = validateValue(draft);
    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      return;
    }

    const cleanValue = normaliseComparableValue(draft);
    const fields = getChangedFields(originalValue, cleanValue);
    if (!fields.length && !pendingFiles.length && !removedEvidenceIds.length) {
      setEditing(false);
      return;
    }

    try {
      setLocalSaving(true);
      await onSave({
        value: cleanValue,
        changedFields: fields,
        newFiles: pendingFiles.map(({ file, evidenceType }) => ({ file, evidenceType })),
        removedEvidenceIds,
      });
      setOriginalValue(cleanValue);
      setDraft(cleanValue);
      setPendingFiles([]);
      setRemovedEvidenceIds([]);
      setValidationErrors({});
      setEditing(false);
      await recordAudit("health_saved", { changedFields: fields });

      if (fields.some((field) => field.startsWith("consent"))) await recordAudit("health_consent_recorded", { changedFields: fields });
      if (fields.some((field) => field.startsWith("reasonableAdjustments") || field.startsWith("adjustment"))) await recordAudit("health_adjustment_updated", { changedFields: fields });
      if (fields.some((field) => field.startsWith("occupationalHealth"))) await recordAudit("occupational_health_updated", { changedFields: fields });
      if (fields.some((field) => field.startsWith("pregnancy"))) await recordAudit("pregnancy_support_updated", { changedFields: fields });
    } finally {
      setLocalSaving(false);
    }
  }

  if (!resolvedPermissions.canView) {
    return (
      <section style={styles.accessCard}>
        <span style={styles.accessIcon}><LockKeyhole size={20} /></span>
        <div>
          <h2 style={styles.accessTitle}>Health information is restricted</h2>
          <p style={styles.accessText}>Your current permission level does not allow access to this record.</p>
        </div>
      </section>
    );
  }

  const visibleEvidence = draft.evidence.filter((item) => !removedEvidenceIds.includes(item.id));
  const sensitiveRestricted = !resolvedPermissions.canViewSensitiveHealthData;

  return (
    <section style={styles.card}>
      <header style={styles.cardHeader}>
        <div style={styles.identity}>
          <span style={styles.identityIcon}><HeartPulse size={21} /></span>
          <div style={{ minWidth: 0 }}>
            <div style={styles.titleRow}>
              <h2 style={styles.cardTitle}>Health details</h2>
              <span style={{ ...styles.statusBadge, background: statusAppearance.background, borderColor: statusAppearance.border, color: statusAppearance.color }}>
                {statusAppearance.icon}{getStatusLabel(draft.status)}
              </span>
            </div>
            <p style={styles.cardSubtitle}>
              {recordLabel || (mode === "candidate" ? "Candidate record" : "Employee record")}
              {recordId !== undefined ? ` · Record ${String(recordId)}` : ""}
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          {headerActions}
          {!editing && resolvedPermissions.canEdit ? (
            <button type="button" style={styles.secondaryButton} onClick={beginEditing} disabled={isDisabled}><Pencil size={15} />Edit health details</button>
          ) : null}
        </div>
      </header>

      <div style={styles.confidentialityBanner}>
        <LockKeyhole size={17} />
        <div>
          <strong>Confidential special-category data</strong>
          <p>Only record information that is necessary for employment, safety, support, legal duties or agreed workplace adjustments. Access should remain tightly restricted.</p>
        </div>
      </div>

      {errorMessage ? <div role="alert" style={styles.errorBanner}><AlertCircle size={17} /><span>{errorMessage}</span></div> : null}
      {successMessage ? <div role="status" style={styles.successBanner}><Check size={17} /><span>{successMessage}</span></div> : null}

      <form onSubmit={handleSubmit}>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleFileSelection} style={{ display: "none" }} />
        <div style={styles.content}>
          <section style={styles.section}>
            <SectionHeader icon={<ClipboardCheck size={18} />} title="Record status and review" description="Track the current health-support position and ensure the record is reviewed only when necessary." />
            <div style={styles.formGrid}>
              <div style={styles.field}><FieldLabel>Record status</FieldLabel>{editing ? <select value={draft.status} onChange={(e) => updateField("status", e.target.value as HealthRecordStatus)} style={styles.input} disabled={isDisabled}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnlyValue value={getStatusLabel(draft.status)} />}</div>
              <div style={styles.field}><FieldLabel>Next review date</FieldLabel>{editing ? <input type="date" value={draft.nextReviewDate} onChange={(e) => updateField("nextReviewDate", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.nextReviewDate ? formatDate(draft.nextReviewDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Last reviewed date</FieldLabel>{editing ? <input type="date" value={draft.lastReviewedDate} onChange={(e) => updateField("lastReviewedDate", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.lastReviewedDate ? formatDate(draft.lastReviewedDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Last reviewed by</FieldLabel>{editing ? <input value={draft.lastReviewedBy} onChange={(e) => updateField("lastReviewedBy", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.lastReviewedBy} />}</div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<ShieldCheck size={18} />} title="Consent and transparency" description="Record how the individual was informed and when explicit consent or another lawful basis was documented." />
            {!resolvedPermissions.canRecordConsent && editing ? <div style={styles.restrictedPanel}><LockKeyhole size={17} /><div><strong>Consent controls are restricted</strong><p>You may view permitted information but cannot alter consent records.</p></div></div> : null}
            <div style={styles.checkboxGrid}>
              {editing && resolvedPermissions.canRecordConsent ? <CheckboxField checked={draft.consentToProcessHealthData} label="Consent to process health information recorded" description="Use only where consent is the appropriate basis and ensure it is freely given and documented." disabled={isDisabled} onChange={(v) => updateField("consentToProcessHealthData", v)} /> : <ReadOnlyValue value={draft.consentToProcessHealthData ? "Consent recorded" : "Consent not recorded"} />}
            </div>
            <div style={styles.formGrid}>
              <div style={styles.field}><FieldLabel>Consent recorded date</FieldLabel>{editing && resolvedPermissions.canRecordConsent ? <><input type="date" value={draft.consentRecordedDate} onChange={(e) => updateField("consentRecordedDate", e.target.value)} style={{ ...styles.input, ...(validationErrors.consentRecordedDate ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.consentRecordedDate} /></> : <ReadOnlyValue value={draft.consentRecordedDate ? formatDate(draft.consentRecordedDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Consent recorded by</FieldLabel>{editing && resolvedPermissions.canRecordConsent ? <><input value={draft.consentRecordedBy} onChange={(e) => updateField("consentRecordedBy", e.target.value)} style={{ ...styles.input, ...(validationErrors.consentRecordedBy ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.consentRecordedBy} /></> : <ReadOnlyValue value={draft.consentRecordedBy} />}</div>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Consent or transparency notes</FieldLabel>{editing && resolvedPermissions.canRecordConsent ? <textarea value={draft.consentNotes} onChange={(e) => updateField("consentNotes", e.target.value)} rows={3} style={styles.textarea} disabled={isDisabled} /> : <ReadOnlyValue value={draft.consentNotes} />}</div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<UserRoundCheck size={18} />} title="Disability, long-term condition and workplace impact" description="Focus on functional impact, support and adjustments rather than unnecessary medical detail." />
            {sensitiveRestricted ? <div style={styles.restrictedPanel}><LockKeyhole size={17} /><div><strong>Sensitive health details are restricted</strong><p>Your current permission level does not allow access to condition details or workplace-impact information.</p></div></div> : (
              <>
                <div style={styles.checkboxGrid}>
                  {editing && resolvedPermissions.canEditSensitiveHealthData ? <CheckboxField checked={draft.disabilityOrLongTermConditionDisclosed} label="Disability or long-term condition disclosed" description="The individual has shared information relevant to work, safety or support." disabled={isDisabled} onChange={(v) => updateField("disabilityOrLongTermConditionDisclosed", v)} /> : <ReadOnlyValue value={draft.disabilityOrLongTermConditionDisclosed ? "Disclosure recorded" : "No disclosure recorded"} />}
                </div>
                <div style={styles.formGrid}>
                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel sensitive>Condition or support details</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <><textarea value={draft.disabilityOrConditionDetails} onChange={(e) => updateField("disabilityOrConditionDetails", e.target.value)} rows={4} style={{ ...styles.textarea, ...(validationErrors.disabilityOrConditionDetails ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.disabilityOrConditionDetails} /></> : <ReadOnlyValue value={draft.disabilityOrConditionDetails} />}</div>
                  <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel sensitive>Impact at work</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <textarea value={draft.conditionImpactAtWork} onChange={(e) => updateField("conditionImpactAtWork", e.target.value)} rows={4} style={styles.textarea} disabled={isDisabled} /> : <ReadOnlyValue value={draft.conditionImpactAtWork} />}</div>
                  <div style={styles.field}><FieldLabel>Preferred language used by the individual</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <input value={draft.employeePreferredLanguage} onChange={(e) => updateField("employeePreferredLanguage", e.target.value)} style={styles.input} disabled={isDisabled} placeholder="For example, disabled person, neurodivergent, long-term condition" /> : <ReadOnlyValue value={draft.employeePreferredLanguage} />}</div>
                </div>
              </>
            )}
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<HeartPulse size={18} />} title="Reasonable adjustments and workplace support" description="Record agreed measures, ownership and review arrangements without exposing unnecessary health information to managers." />
            {!resolvedPermissions.canManageAdjustments && editing ? <div style={styles.restrictedPanel}><LockKeyhole size={17} /><div><strong>Adjustment controls are restricted</strong><p>You cannot create or amend workplace adjustments with your current permission level.</p></div></div> : null}
            <div style={styles.checkboxGrid}>
              {editing && resolvedPermissions.canManageAdjustments ? <>
                <CheckboxField checked={draft.reasonableAdjustmentsRequired} label="Reasonable adjustments required" description="Workplace changes or support measures are required or under consideration." disabled={isDisabled} onChange={(v) => updateField("reasonableAdjustmentsRequired", v)} />
                <CheckboxField checked={draft.adjustmentRiskAssessmentRequired} label="Adjustment risk assessment required" description="A role, equipment or workplace risk assessment is needed." disabled={isDisabled} onChange={(v) => updateField("adjustmentRiskAssessmentRequired", v)} />
                <CheckboxField checked={draft.adjustmentRiskAssessmentCompleted} label="Adjustment risk assessment completed" description="The required assessment has been completed and recorded." disabled={isDisabled} onChange={(v) => updateField("adjustmentRiskAssessmentCompleted", v)} />
              </> : <>
                <ReadOnlyValue value={draft.reasonableAdjustmentsRequired ? "Adjustments required" : "No adjustments recorded"} />
                <ReadOnlyValue value={draft.adjustmentRiskAssessmentRequired ? "Risk assessment required" : "No adjustment risk assessment required"} />
                <ReadOnlyValue value={draft.adjustmentRiskAssessmentCompleted ? "Risk assessment completed" : "Risk assessment not recorded as completed"} />
              </>}
            </div>
            <div style={styles.formGrid}>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Agreed or proposed adjustments</FieldLabel>{editing && resolvedPermissions.canManageAdjustments ? <><textarea value={draft.reasonableAdjustments} onChange={(e) => updateField("reasonableAdjustments", e.target.value)} rows={5} style={{ ...styles.textarea, ...(validationErrors.reasonableAdjustments ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.reasonableAdjustments} /></> : <ReadOnlyValue value={draft.reasonableAdjustments} />}</div>
              <div style={styles.field}><FieldLabel>Adjustment start date</FieldLabel>{editing && resolvedPermissions.canManageAdjustments ? <input type="date" value={draft.adjustmentStartDate} onChange={(e) => updateField("adjustmentStartDate", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.adjustmentStartDate ? formatDate(draft.adjustmentStartDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Adjustment review date</FieldLabel>{editing && resolvedPermissions.canManageAdjustments ? <><input type="date" value={draft.adjustmentReviewDate} onChange={(e) => updateField("adjustmentReviewDate", e.target.value)} style={{ ...styles.input, ...(validationErrors.adjustmentReviewDate ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.adjustmentReviewDate} /></> : <ReadOnlyValue value={draft.adjustmentReviewDate ? formatDate(draft.adjustmentReviewDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Adjustment owner</FieldLabel>{editing && resolvedPermissions.canManageAdjustments ? <><input value={draft.adjustmentOwner} onChange={(e) => updateField("adjustmentOwner", e.target.value)} style={{ ...styles.input, ...(validationErrors.adjustmentOwner ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.adjustmentOwner} /></> : <ReadOnlyValue value={draft.adjustmentOwner} />}</div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<Stethoscope size={18} />} title="Workplace safety and restrictions" description="Record only medical or functional information necessary to manage safety, duties and emergency response." />
            {sensitiveRestricted ? <ReadOnlyValue restricted /> : (
              <div style={styles.formGrid}>
                {([
                  ["allergiesOrEmergencyMedicalInformation", "Allergies or emergency medical information"],
                  ["medicationRelevantToWork", "Medication relevant to work or emergency response"],
                  ["medicalRestrictions", "General medical restrictions"],
                  ["manualHandlingRestrictions", "Manual handling restrictions"],
                  ["drivingRestrictions", "Driving restrictions"],
                  ["loneWorkingRestrictions", "Lone-working restrictions"],
                  ["workingTimeRestrictions", "Working-time or shift restrictions"],
                  ["emergencyResponseInstructions", "Emergency response instructions"],
                ] as Array<[keyof HealthDetailsValue, string]>).map(([key, label]) => (
                  <div key={String(key)} style={{ ...styles.field, gridColumn: "1 / -1" }}>
                    <FieldLabel sensitive>{label}</FieldLabel>
                    {editing && resolvedPermissions.canEditSensitiveHealthData ? <textarea value={String(draft[key] ?? "")} onChange={(e) => updateField(key, e.target.value as never)} rows={3} style={styles.textarea} disabled={isDisabled} /> : <ReadOnlyValue value={String(draft[key] ?? "")} />}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<FileHeart size={18} />} title="Fit note and return-to-work support" description="Track the active fit-note period, work advice and any phased or supported return arrangements." />
            <div style={styles.checkboxGrid}>
              {editing && resolvedPermissions.canEditSensitiveHealthData ? <>
                <CheckboxField checked={draft.currentFitNoteApplies} label="Current fit note applies" description="An active fit note currently informs duties or absence management." disabled={isDisabled} onChange={(v) => updateField("currentFitNoteApplies", v)} />
                <CheckboxField checked={draft.returnToWorkSupportRequired} label="Return-to-work support required" description="A phased return, altered duties or other temporary support is required." disabled={isDisabled} onChange={(v) => updateField("returnToWorkSupportRequired", v)} />
              </> : <>
                <ReadOnlyValue value={draft.currentFitNoteApplies ? "Current fit note applies" : "No current fit note recorded"} restricted={sensitiveRestricted} />
                <ReadOnlyValue value={draft.returnToWorkSupportRequired ? "Return-to-work support required" : "No return-to-work support recorded"} restricted={sensitiveRestricted} />
              </>}
            </div>
            {!sensitiveRestricted ? <div style={styles.formGrid}>
              <div style={styles.field}><FieldLabel>Fit note start date</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <><input type="date" value={draft.fitNoteStartDate} onChange={(e) => updateField("fitNoteStartDate", e.target.value)} style={{ ...styles.input, ...(validationErrors.fitNoteStartDate ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.fitNoteStartDate} /></> : <ReadOnlyValue value={draft.fitNoteStartDate ? formatDate(draft.fitNoteStartDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Fit note end date</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <><input type="date" value={draft.fitNoteEndDate} onChange={(e) => updateField("fitNoteEndDate", e.target.value)} style={{ ...styles.input, ...(validationErrors.fitNoteEndDate ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.fitNoteEndDate} /></> : <ReadOnlyValue value={draft.fitNoteEndDate ? formatDate(draft.fitNoteEndDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Fit note review date</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <input type="date" value={draft.fitNoteReviewDate} onChange={(e) => updateField("fitNoteReviewDate", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.fitNoteReviewDate ? formatDate(draft.fitNoteReviewDate) : ""} />}</div>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Fit note advice</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <textarea value={draft.fitNoteAdvice} onChange={(e) => updateField("fitNoteAdvice", e.target.value)} rows={4} style={styles.textarea} disabled={isDisabled} /> : <ReadOnlyValue value={draft.fitNoteAdvice} />}</div>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Return-to-work support details</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <><textarea value={draft.returnToWorkSupportDetails} onChange={(e) => updateField("returnToWorkSupportDetails", e.target.value)} rows={4} style={{ ...styles.textarea, ...(validationErrors.returnToWorkSupportDetails ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.returnToWorkSupportDetails} /></> : <ReadOnlyValue value={draft.returnToWorkSupportDetails} />}</div>
              <div style={styles.field}><FieldLabel>Return-to-work review date</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <input type="date" value={draft.returnToWorkReviewDate} onChange={(e) => updateField("returnToWorkReviewDate", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.returnToWorkReviewDate ? formatDate(draft.returnToWorkReviewDate) : ""} />}</div>
            </div> : null}
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<Stethoscope size={18} />} title="Occupational Health" description="Manage referrals, consent, outcomes and review dates without treating medical advice as a substitute for management judgement." />
            {!resolvedPermissions.canViewOccupationalHealth ? <ReadOnlyValue restricted /> : <>
              {!resolvedPermissions.canEditOccupationalHealth && editing ? <div style={styles.restrictedPanel}><LockKeyhole size={17} /><div><strong>Occupational Health controls are restricted</strong><p>You can view this section but cannot amend referral or outcome details.</p></div></div> : null}
              <div style={styles.checkboxGrid}>
                {editing && resolvedPermissions.canEditOccupationalHealth ? <>
                  <CheckboxField checked={draft.occupationalHealthReferralRequired} label="Occupational Health referral required" description="A referral is required or has been initiated." disabled={isDisabled} onChange={(v) => updateField("occupationalHealthReferralRequired", v)} />
                  <CheckboxField checked={draft.occupationalHealthConsentConfirmed} label="Occupational Health consent confirmed" description="Consent and referral information have been documented appropriately." disabled={isDisabled} onChange={(v) => updateField("occupationalHealthConsentConfirmed", v)} />
                </> : <>
                  <ReadOnlyValue value={draft.occupationalHealthReferralRequired ? "Referral required" : "No referral required"} />
                  <ReadOnlyValue value={draft.occupationalHealthConsentConfirmed ? "Consent confirmed" : "Consent not confirmed"} />
                </>}
              </div>
              <FieldError message={validationErrors.occupationalHealthConsentConfirmed} />
              <div style={styles.formGrid}>
                <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Referral reason</FieldLabel>{editing && resolvedPermissions.canEditOccupationalHealth ? <><textarea value={draft.occupationalHealthReferralReason} onChange={(e) => updateField("occupationalHealthReferralReason", e.target.value)} rows={4} style={{ ...styles.textarea, ...(validationErrors.occupationalHealthReferralReason ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.occupationalHealthReferralReason} /></> : <ReadOnlyValue value={draft.occupationalHealthReferralReason} />}</div>
                <div style={styles.field}><FieldLabel>Current outcome</FieldLabel>{editing && resolvedPermissions.canEditOccupationalHealth ? <select value={draft.occupationalHealthCurrentOutcome} onChange={(e) => updateField("occupationalHealthCurrentOutcome", e.target.value as OccupationalHealthOutcome)} style={styles.input} disabled={isDisabled}>{OH_OUTCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnlyValue value={getOutcomeLabel(draft.occupationalHealthCurrentOutcome)} />}</div>
                <div style={styles.field}><FieldLabel>Next review date</FieldLabel>{editing && resolvedPermissions.canEditOccupationalHealth ? <input type="date" value={draft.occupationalHealthNextReviewDate} onChange={(e) => updateField("occupationalHealthNextReviewDate", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.occupationalHealthNextReviewDate ? formatDate(draft.occupationalHealthNextReviewDate) : ""} />}</div>
              </div>

              {resolvedPermissions.canViewHistory ? <div style={styles.historyBlock}>
                <button type="button" style={styles.historyToggle} onClick={() => setExpandedHistory((c) => ({ ...c, occupationalHealth: !c.occupationalHealth }))}>
                  <span><History size={15} />Occupational Health history</span><ChevronDown size={16} style={{ transform: expandedHistory.occupationalHealth ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {expandedHistory.occupationalHealth ? draft.occupationalHealthHistory.length ? <div style={styles.historyList}>{draft.occupationalHealthHistory.map((entry) => <article key={entry.id} style={styles.historyCard}><span style={styles.historyMarker}><Stethoscope size={14} /></span><div style={{ flex: 1 }}><div style={styles.historyHeader}><strong>{getOutcomeLabel(entry.outcome)}</strong><span>{formatDate(entry.referralDate)}</span></div><p style={styles.historyText}>Referred by {entry.referredBy}{entry.provider ? ` · ${entry.provider}` : ""}</p><p style={styles.historyNotes}>{entry.reason}</p>{entry.recommendedAdjustments ? <p style={styles.historyNotes}>Recommended adjustments: {entry.recommendedAdjustments}</p> : null}{entry.reviewDate ? <p style={styles.historyText}>Review due {formatDate(entry.reviewDate)}</p> : null}</div></article>)}</div> : <div style={styles.emptyCompact}>No Occupational Health history recorded.</div> : null}
              </div> : null}
            </>}
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<Baby size={18} />} title="Pregnancy-related workplace support" description="Keep pregnancy information access-restricted and focus on safety, support, risk assessment and temporary workplace changes." />
            {!resolvedPermissions.canViewPregnancyInformation ? <ReadOnlyValue restricted /> : <>
              <div style={styles.checkboxGrid}>
                {editing && resolvedPermissions.canEditPregnancyInformation ? <>
                  <CheckboxField checked={draft.pregnancyRelatedSupportRequired} label="Pregnancy-related support required" description="Temporary duties, hours, facilities or other workplace support are required." disabled={isDisabled} onChange={(v) => updateField("pregnancyRelatedSupportRequired", v)} />
                  <CheckboxField checked={draft.pregnancyRiskAssessmentCompleted} label="Pregnancy risk assessment completed" description="A suitable workplace risk assessment has been completed and recorded." disabled={isDisabled} onChange={(v) => updateField("pregnancyRiskAssessmentCompleted", v)} />
                </> : <>
                  <ReadOnlyValue value={draft.pregnancyRelatedSupportRequired ? "Support required" : "No support recorded"} />
                  <ReadOnlyValue value={draft.pregnancyRiskAssessmentCompleted ? "Risk assessment completed" : "Risk assessment not recorded as completed"} />
                </>}
              </div>
              <div style={styles.formGrid}>
                <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel sensitive>Pregnancy-related support details</FieldLabel>{editing && resolvedPermissions.canEditPregnancyInformation ? <><textarea value={draft.pregnancyRelatedSupportDetails} onChange={(e) => updateField("pregnancyRelatedSupportDetails", e.target.value)} rows={4} style={{ ...styles.textarea, ...(validationErrors.pregnancyRelatedSupportDetails ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.pregnancyRelatedSupportDetails} /></> : <ReadOnlyValue value={draft.pregnancyRelatedSupportDetails} />}</div>
                <div style={styles.field}><FieldLabel sensitive>Risk assessment date</FieldLabel>{editing && resolvedPermissions.canEditPregnancyInformation ? <><input type="date" value={draft.pregnancyRiskAssessmentDate} onChange={(e) => updateField("pregnancyRiskAssessmentDate", e.target.value)} style={{ ...styles.input, ...(validationErrors.pregnancyRiskAssessmentDate ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.pregnancyRiskAssessmentDate} /></> : <ReadOnlyValue value={draft.pregnancyRiskAssessmentDate ? formatDate(draft.pregnancyRiskAssessmentDate) : ""} />}</div>
                <div style={styles.field}><FieldLabel sensitive>Expected week of childbirth</FieldLabel>{editing && resolvedPermissions.canEditPregnancyInformation ? <input type="date" value={draft.expectedWeekOfChildbirth} onChange={(e) => updateField("expectedWeekOfChildbirth", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.expectedWeekOfChildbirth ? formatDate(draft.expectedWeekOfChildbirth) : ""} />}</div>
              </div>
            </>}
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<ShieldCheck size={18} />} title="Role-specific vaccination requirement" description="Use only where the requirement is lawful, necessary and proportionate for the role or regulated setting." />
            <div style={styles.checkboxGrid}>{editing && resolvedPermissions.canEditSensitiveHealthData ? <CheckboxField checked={draft.vaccinationRequirementApplies} label="Vaccination requirement applies" description="A lawful, role-specific requirement or risk-control measure has been identified." disabled={isDisabled} onChange={(v) => updateField("vaccinationRequirementApplies", v)} /> : <ReadOnlyValue value={draft.vaccinationRequirementApplies ? "Requirement applies" : "No requirement recorded"} restricted={sensitiveRestricted} />}</div>
            {!sensitiveRestricted ? <div style={styles.formGrid}>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Requirement details</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <><textarea value={draft.vaccinationRequirementDetails} onChange={(e) => updateField("vaccinationRequirementDetails", e.target.value)} rows={3} style={{ ...styles.textarea, ...(validationErrors.vaccinationRequirementDetails ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={validationErrors.vaccinationRequirementDetails} /></> : <ReadOnlyValue value={draft.vaccinationRequirementDetails} />}</div>
              <div style={styles.field}><FieldLabel sensitive>Vaccination status</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <input value={draft.vaccinationStatus} onChange={(e) => updateField("vaccinationStatus", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.vaccinationStatus} />}</div>
              <div style={styles.field}><FieldLabel>Review date</FieldLabel>{editing && resolvedPermissions.canEditSensitiveHealthData ? <input type="date" value={draft.vaccinationReviewDate} onChange={(e) => updateField("vaccinationReviewDate", e.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.vaccinationReviewDate ? formatDate(draft.vaccinationReviewDate) : ""} />}</div>
            </div> : null}
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<UserRoundCheck size={18} />} title="Manager guidance and confidential notes" description="Separate practical manager instructions from highly restricted clinical or HR notes." />
            <div style={styles.formGrid}>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Manager guidance</FieldLabel>{editing ? <textarea value={draft.managerGuidance} onChange={(e) => updateField("managerGuidance", e.target.value)} rows={4} style={styles.textarea} disabled={isDisabled} placeholder="Record only the practical instructions the manager needs to implement." /> : <ReadOnlyValue value={draft.managerGuidance} />}</div>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel sensitive>Confidential HR notes</FieldLabel>{sensitiveRestricted ? <ReadOnlyValue restricted /> : editing && resolvedPermissions.canEditSensitiveHealthData ? <textarea value={draft.confidentialNotes} onChange={(e) => updateField("confidentialNotes", e.target.value)} rows={5} style={styles.textarea} disabled={isDisabled} /> : <ReadOnlyValue value={draft.confidentialNotes} />}</div>
            </div>
          </section>

          <section style={styles.section}>
            <SectionHeader icon={<Upload size={18} />} title="Supporting evidence" description="Upload only necessary documents. Medical evidence should remain access-restricted and subject to retention controls." />
            {!resolvedPermissions.canViewEvidence ? <ReadOnlyValue restricted /> : <>
              {visibleEvidence.length || pendingFiles.length ? <div style={styles.evidenceList}>
                {visibleEvidence.map((item) => <article key={item.id} style={styles.evidenceCard}><span style={styles.evidenceFileIcon}><FileText size={17} /></span><div style={{ minWidth: 0, flex: 1 }}><strong style={styles.evidenceFileName}>{item.fileName}</strong><span style={styles.evidenceTypeLabel}>{getEvidenceTypeLabel(item.evidenceType)}</span><span style={styles.evidenceMeta}>{formatFileSize(item.fileSizeBytes)} · Uploaded {formatDateTime(item.uploadedAt)}{item.uploadedBy ? ` by ${item.uploadedBy}` : ""}</span></div>{editing && resolvedPermissions.canDeleteEvidence ? <button type="button" style={styles.iconButton} onClick={() => removeExistingEvidence(item.id)} disabled={isDisabled} aria-label={`Remove ${item.fileName}`}><Trash2 size={15} /></button> : null}</article>)}
                {pendingFiles.map((item) => <article key={item.id} style={styles.evidenceCard}><span style={styles.evidenceFileIcon}><FileText size={17} /></span><div style={{ minWidth: 0, flex: 1 }}><strong style={styles.evidenceFileName}>{item.file.name}</strong><span style={styles.evidenceTypeLabel}>{getEvidenceTypeLabel(item.evidenceType)}</span><span style={styles.evidenceMeta}>{formatFileSize(item.file.size)} · Pending upload</span></div><button type="button" style={styles.iconButton} onClick={() => removePendingFile(item.id)} disabled={isDisabled} aria-label={`Remove ${item.file.name}`}><X size={15} /></button></article>)}
              </div> : <div style={styles.emptyState}><FileHeart size={24} /><strong>No supporting evidence uploaded</strong><span>Fit notes, Occupational Health reports, risk assessments and consent records will appear here.</span></div>}
              {editing && resolvedPermissions.canUploadEvidence ? <div style={styles.uploadArea}><select value={selectedEvidenceType} onChange={(e) => setSelectedEvidenceType(e.target.value as HealthEvidenceType)} style={styles.uploadSelect} disabled={isDisabled}>{EVIDENCE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select><button type="button" style={styles.secondaryButton} onClick={() => fileInputRef.current?.click()} disabled={isDisabled}><Upload size={15} />Choose files</button><span style={styles.uploadHelp}>PDF, image or Word document. Maximum 15 MB per file.</span></div> : null}
            </>}
          </section>

          {resolvedPermissions.canViewHistory ? <section style={styles.section}>
            <SectionHeader icon={<History size={18} />} title="Health review history" description="Preserve previous review decisions, status changes and follow-up dates without altering the historic record." />
            <button type="button" style={styles.historyToggle} onClick={() => setExpandedHistory((c) => ({ ...c, reviews: !c.reviews }))}><span><History size={15} />Review history</span><ChevronDown size={16} style={{ transform: expandedHistory.reviews ? "rotate(180deg)" : "rotate(0deg)" }} /></button>
            {expandedHistory.reviews ? draft.reviewHistory.length ? <div style={styles.historyList}>{draft.reviewHistory.map((entry) => <article key={entry.id} style={styles.historyCard}><span style={styles.historyMarker}><ClipboardCheck size={14} /></span><div style={{ flex: 1 }}><div style={styles.historyHeader}><strong>{getStatusLabel(entry.status)}</strong><span>{formatDateTime(entry.reviewedAt)}</span></div><p style={styles.historyText}>Reviewed by {entry.reviewedBy}</p>{entry.reason ? <p style={styles.historyNotes}>{entry.reason}</p> : null}{entry.changesMade ? <p style={styles.historyNotes}>Changes: {entry.changesMade}</p> : null}{entry.nextReviewDate ? <p style={styles.historyText}>Next review {formatDate(entry.nextReviewDate)}</p> : null}</div></article>)}</div> : <div style={styles.emptyCompact}>No health review history recorded.</div> : null}
          </section> : null}
        </div>

        {editing ? <footer style={styles.footer}>
          <div style={styles.changeSummary}>{isDirty ? <><span style={styles.unsavedDot} />Unsaved changes</> : <><Check size={14} />No unsaved changes</>}</div>
          <div style={styles.footerActions}>
            <button type="button" style={styles.tertiaryButton} onClick={resetChanges} disabled={!isDirty || isDisabled}><RotateCcw size={14} />Reset</button>
            <button type="button" style={styles.secondaryButton} onClick={cancelEditing} disabled={isDisabled}><X size={15} />Cancel</button>
            <button type="submit" style={styles.primaryButton} disabled={!isDirty || isDisabled || !onSave}>{isSaving ? <Loader2 size={15} className="leo-health-spin" /> : <Save size={15} />}{isSaving ? "Saving..." : "Save health record"}</button>
          </div>
        </footer> : null}
      </form>

      <style>{`
        @keyframes leo-health-spin { to { transform: rotate(360deg); } }
        .leo-health-spin { animation: leo-health-spin 0.8s linear infinite; }
        button:disabled, input:disabled, select:disabled, textarea:disabled { cursor: not-allowed; opacity: 0.6; }
        input[type="checkbox"] { accent-color: #6E5084; }
      `}</style>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { overflow: "hidden", border: "1px solid #E7DDED", borderRadius: "18px", background: "#FFFFFF", boxShadow: "0 12px 32px rgba(71,49,81,0.05)" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "18px", padding: "20px 22px", borderBottom: "1px solid #EEE5F2", background: "linear-gradient(135deg,#FFFFFF 0%,#FCF9FE 100%)" },
  identity: { display: "flex", alignItems: "center", gap: "13px", minWidth: 0 },
  identityIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", flex: "0 0 auto", borderRadius: "13px", background: "#F2EAF7", color: "#6E5084" },
  titleRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "9px" },
  cardTitle: { margin: 0, color: "#342B38", fontSize: "17px", fontWeight: 800 },
  cardSubtitle: { margin: "4px 0 0", color: "#847789", fontSize: "12px" },
  statusBadge: { display: "inline-flex", alignItems: "center", gap: "5px", border: "1px solid", borderRadius: "999px", padding: "5px 8px", fontSize: "10px", fontWeight: 800 },
  headerActions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "9px" },
  confidentialityBanner: { display: "flex", alignItems: "flex-start", gap: "10px", margin: "18px 22px 0", border: "1px solid #DDD0E5", borderRadius: "12px", background: "#F8F4FA", color: "#67566F", padding: "13px", fontSize: "11px", lineHeight: 1.5 },
  content: { display: "grid", gap: "18px", padding: "22px" },
  section: { display: "grid", gap: "17px", padding: "20px", border: "1px solid #ECE4F0", borderRadius: "15px", background: "#FFFFFF" },
  sectionHeader: { display: "flex", alignItems: "flex-start", gap: "11px" },
  sectionIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", flex: "0 0 auto", borderRadius: "10px", background: "#F5EFF8", color: "#6E5084" },
  sectionTitle: { margin: 0, color: "#403545", fontSize: "14px", fontWeight: 800 },
  sectionDescription: { margin: "4px 0 0", color: "#8B7F90", fontSize: "11px", lineHeight: 1.5 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "17px" },
  checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "12px" },
  field: { display: "flex", flexDirection: "column", gap: "7px", minWidth: 0 },
  fieldLabel: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "5px", color: "#594D5E", fontSize: "11px", fontWeight: 750 },
  requiredMark: { color: "#8E5F72" },
  sensitiveLabel: { display: "inline-flex", alignItems: "center", gap: "3px", marginLeft: "3px", borderRadius: "999px", background: "#F3EEF5", color: "#75687A", padding: "3px 6px", fontSize: "9px", fontWeight: 750 },
  input: { width: "100%", minHeight: "42px", boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: "10px", outline: "none", background: "#FFFFFF", color: "#3F3543", padding: "10px 11px", font: "inherit", fontSize: "12px" },
  inputError: { borderColor: "#B97988", boxShadow: "0 0 0 3px rgba(185,121,136,0.10)" },
  textarea: { width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #DCCFE3", borderRadius: "10px", outline: "none", background: "#FFFFFF", color: "#3F3543", padding: "11px", font: "inherit", fontSize: "12px", lineHeight: 1.55 },
  checkboxCard: { display: "flex", alignItems: "flex-start", gap: "9px", minHeight: "64px", boxSizing: "border-box", border: "1px solid #DED3E4", borderRadius: "10px", background: "#FAF7FC", color: "#55495A", padding: "11px", fontSize: "11px", cursor: "pointer" },
  checkboxTitle: { display: "block", color: "#55495A", fontSize: "11px" },
  checkboxDescription: { display: "block", marginTop: "3px", color: "#8B7F90", fontSize: "10px", lineHeight: 1.4 },
  readOnlyValue: { display: "flex", alignItems: "center", minHeight: "42px", boxSizing: "border-box", border: "1px solid #EEE7F1", borderRadius: "10px", background: "#FBF9FC", color: "#4D414F", padding: "10px 11px", fontSize: "12px", lineHeight: 1.45, whiteSpace: "pre-wrap" },
  readOnlyEmpty: { color: "#A094A5", fontStyle: "italic" },
  restrictedValue: { display: "flex", alignItems: "center", gap: "7px", minHeight: "42px", boxSizing: "border-box", border: "1px solid #EEE7F1", borderRadius: "10px", background: "#F8F5F9", color: "#847888", padding: "10px 11px", fontSize: "11px", fontWeight: 700 },
  fieldError: { display: "flex", alignItems: "center", gap: "5px", margin: 0, color: "#9A5668", fontSize: "10px", lineHeight: 1.4 },
  restrictedPanel: { display: "flex", alignItems: "flex-start", gap: "10px", border: "1px solid #E5DDE9", borderRadius: "11px", background: "#F9F6FA", color: "#746978", padding: "13px", fontSize: "11px", lineHeight: 1.5 },
  evidenceList: { display: "grid", gap: "9px" },
  evidenceCard: { display: "flex", alignItems: "center", gap: "11px", border: "1px solid #E7DFEB", borderRadius: "11px", background: "#FFFFFF", padding: "11px" },
  evidenceFileIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", flex: "0 0 auto", borderRadius: "9px", background: "#F3EDF7", color: "#6E5084" },
  evidenceFileName: { display: "block", overflow: "hidden", color: "#4A3E4E", fontSize: "11px", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  evidenceTypeLabel: { display: "inline-flex", marginTop: "4px", borderRadius: "999px", background: "#F2ECF6", color: "#6E5084", padding: "3px 7px", fontSize: "9px", fontWeight: 750 },
  evidenceMeta: { display: "block", marginTop: "4px", color: "#8B7F90", fontSize: "10px" },
  uploadArea: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  uploadSelect: { minHeight: "38px", border: "1px solid #DCCFE3", borderRadius: "9px", outline: "none", background: "#FFFFFF", color: "#3F3543", padding: "8px 10px", font: "inherit", fontSize: "11px" },
  uploadHelp: { color: "#8C8091", fontSize: "10px" },
  historyBlock: { display: "grid", gap: "10px" },
  historyToggle: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", border: "1px solid #E6DDEB", borderRadius: "10px", background: "#FAF8FB", color: "#5E5163", padding: "10px 12px", fontSize: "11px", fontWeight: 750, cursor: "pointer" },
  historyList: { display: "grid", gap: "12px" },
  historyCard: { display: "flex", alignItems: "flex-start", gap: "11px", padding: "12px 0", borderBottom: "1px solid #F0EAF2" },
  historyMarker: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", flex: "0 0 auto", borderRadius: "999px", background: "#F1EAF5", color: "#6E5084" },
  historyHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", color: "#4A3D4E", fontSize: "11px" },
  historyText: { margin: "5px 0 0", color: "#7D7182", fontSize: "10px", lineHeight: 1.5 },
  historyNotes: { margin: "7px 0 0", borderRadius: "8px", background: "#FAF7FC", color: "#675A6C", padding: "8px", fontSize: "10px", lineHeight: 1.5, whiteSpace: "pre-wrap" },
  emptyState: { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "6px", minHeight: "130px", boxSizing: "border-box", border: "1px dashed #DDD2E3", borderRadius: "12px", background: "#FCFAFD", color: "#887C8D", padding: "20px", textAlign: "center", fontSize: "11px" },
  emptyCompact: { border: "1px dashed #DDD2E3", borderRadius: "10px", background: "#FCFAFD", color: "#887C8D", padding: "14px", textAlign: "center", fontSize: "11px" },
  errorBanner: { display: "flex", alignItems: "flex-start", gap: "9px", margin: "18px 22px 0", border: "1px solid #E8CBD2", borderRadius: "11px", background: "#FFF7F8", color: "#8B4E5D", padding: "11px 13px", fontSize: "11px" },
  successBanner: { display: "flex", alignItems: "flex-start", gap: "9px", margin: "18px 22px 0", border: "1px solid #CFE6D8", borderRadius: "11px", background: "#F5FCF8", color: "#527460", padding: "11px 13px", fontSize: "11px" },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", padding: "16px 22px", borderTop: "1px solid #EEE6F1", background: "#FCFAFD" },
  changeSummary: { display: "flex", alignItems: "center", gap: "7px", color: "#7C7081", fontSize: "11px", fontWeight: 650 },
  unsavedDot: { width: "7px", height: "7px", borderRadius: "999px", background: "#8A6B9D" },
  footerActions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" },
  primaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", minHeight: "38px", border: "1px solid #6E5084", borderRadius: "9px", background: "#6E5084", color: "#FFFFFF", padding: "8px 13px", fontSize: "11px", fontWeight: 800, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", minHeight: "38px", border: "1px solid #DCCFE3", borderRadius: "9px", background: "#FFFFFF", color: "#6E5084", padding: "8px 12px", fontSize: "11px", fontWeight: 800, cursor: "pointer" },
  tertiaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px", minHeight: "38px", border: 0, borderRadius: "9px", background: "transparent", color: "#766A7A", padding: "8px 10px", fontSize: "11px", fontWeight: 750, cursor: "pointer" },
  iconButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", flex: "0 0 auto", border: "1px solid #E4DBE8", borderRadius: "9px", background: "#FFFFFF", color: "#766A7A", cursor: "pointer" },
  accessCard: { display: "flex", alignItems: "flex-start", gap: "13px", border: "1px solid #E6DCEB", borderRadius: "16px", background: "#FBF8FC", padding: "20px" },
  accessIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", flex: "0 0 auto", borderRadius: "11px", background: "#F0E8F4", color: "#6E5084" },
  accessTitle: { margin: 0, color: "#493C4E", fontSize: "14px", fontWeight: 800 },
  accessText: { margin: "5px 0 0", color: "#827687", fontSize: "11px", lineHeight: 1.5 },
};