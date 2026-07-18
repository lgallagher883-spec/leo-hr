"use client";

import {
  AlertCircle,
  Award,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
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

export type ProfessionalRegistrationsDetailsMode = "candidate" | "employee";

export type ProfessionalRegistrationStatus =
  | "not_assessed"
  | "details_required"
  | "evidence_required"
  | "verification_required"
  | "active"
  | "renewal_due"
  | "lapsed"
  | "suspended"
  | "restricted"
  | "removed"
  | "not_required";

export type ProfessionalRegistrationRequirement =
  | "mandatory"
  | "regulatory"
  | "contractual"
  | "desirable"
  | "development"
  | "other";

export type RegistrationEvidenceType =
  | "registration_certificate"
  | "membership_card"
  | "practising_licence"
  | "online_register_check"
  | "renewal_confirmation"
  | "restriction_notice"
  | "correspondence"
  | "other";

export type RegistrationEvidence = {
  id: string;
  evidenceType: RegistrationEvidenceType;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  current: boolean;
};

export type RegistrationVerificationEntry = {
  id: string;
  checkedAt: string;
  checkedBy: string;
  status: ProfessionalRegistrationStatus;
  method: string;
  registerUrl?: string;
  registerReference?: string;
  validFrom?: string;
  expiryDate?: string;
  restrictionsFound?: boolean;
  restrictionsSummary?: string;
  notes?: string;
};

export type ProfessionalRegistrationRecord = {
  id: string;
  professionOrRole: string;
  professionalBody: string;
  registerName: string;
  requirement: ProfessionalRegistrationRequirement;
  status: ProfessionalRegistrationStatus;
  registrationNumber: string;
  membershipGrade: string;
  practisingLicenceNumber: string;
  countryOrJurisdiction: string;
  initialRegistrationDate: string;
  validFromDate: string;
  expiryDate: string;
  renewalDate: string;
  lastCheckedDate: string;
  lastCheckedBy: string;
  verificationMethod: string;
  registerUrl: string;
  registerReference: string;
  activeOnRegister: boolean;
  practisingRightsConfirmed: boolean;
  identityMatched: boolean;
  scopeMatchesRole: boolean;
  restrictionsOrConditionsPresent: boolean;
  restrictionsOrConditions: string;
  fitnessToPractiseConcern: boolean;
  fitnessToPractiseSummary: string;
  employerActionRequired: boolean;
  employerAction: string;
  continuingProfessionalDevelopmentRequired: boolean;
  cpdRequirementSummary: string;
  indemnityRequired: boolean;
  indemnityConfirmed: boolean;
  notes: string;
  evidence: RegistrationEvidence[];
  verificationHistory: RegistrationVerificationEntry[];
};

export type ProfessionalRegistrationsDetailsValue = {
  registrationRequiredForRole: boolean;
  minimumRegistrationRequirement: string;
  overallStatus: ProfessionalRegistrationStatus;
  nextReviewDate: string;
  summaryNotes: string;
  registrations: ProfessionalRegistrationRecord[];
};

export type ProfessionalRegistrationsDetailsPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewRegistrationNumbers: boolean;
  canEditRegistrationNumbers: boolean;
  canVerify: boolean;
  canRecordRestrictions: boolean;
  canRecordFitnessToPractise: boolean;
  canAddRegistration: boolean;
  canDeleteRegistration: boolean;
  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;
  canViewHistory: boolean;
};

export type ProfessionalRegistrationsAuditEvent = {
  action:
    | "professional_registrations_edit_started"
    | "professional_registrations_edit_cancelled"
    | "professional_registrations_saved"
    | "professional_registration_added"
    | "professional_registration_removed"
    | "professional_registration_evidence_selected"
    | "professional_registration_evidence_removed"
    | "professional_registration_verified"
    | "professional_registration_restriction_recorded";
  mode: ProfessionalRegistrationsDetailsMode;
  recordId?: string | number;
  registrationId?: string;
  evidenceId?: string;
  changedFields?: string[];
  occurredAt: string;
};

export type PendingRegistrationFile = {
  registrationId: string;
  file: File;
  evidenceType: RegistrationEvidenceType;
};

export type ProfessionalRegistrationsSavePayload = {
  value: ProfessionalRegistrationsDetailsValue;
  changedFields: string[];
  newFiles: PendingRegistrationFile[];
  removedEvidenceIds: string[];
  removedRegistrationIds: string[];
};

export type ProfessionalRegistrationsDetailsProps = {
  mode: ProfessionalRegistrationsDetailsMode;
  value?: Partial<ProfessionalRegistrationsDetailsValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<ProfessionalRegistrationsDetailsPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (payload: ProfessionalRegistrationsSavePayload) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (event: ProfessionalRegistrationsAuditEvent) => Promise<void> | void;
};

type ValidationErrors = Record<string, string>;
type PendingFile = {
  id: string;
  registrationId: string;
  file: File;
  evidenceType: RegistrationEvidenceType;
};

const STATUS_OPTIONS: Array<{ value: ProfessionalRegistrationStatus; label: string }> = [
  { value: "not_assessed", label: "Not assessed" },
  { value: "details_required", label: "Details required" },
  { value: "evidence_required", label: "Evidence required" },
  { value: "verification_required", label: "Verification required" },
  { value: "active", label: "Active" },
  { value: "renewal_due", label: "Renewal due" },
  { value: "lapsed", label: "Lapsed" },
  { value: "suspended", label: "Suspended" },
  { value: "restricted", label: "Restricted" },
  { value: "removed", label: "Removed from register" },
  { value: "not_required", label: "Not required" },
];

const REQUIREMENT_OPTIONS: Array<{ value: ProfessionalRegistrationRequirement; label: string }> = [
  { value: "mandatory", label: "Mandatory for role" },
  { value: "regulatory", label: "Regulatory requirement" },
  { value: "contractual", label: "Contractual requirement" },
  { value: "desirable", label: "Desirable" },
  { value: "development", label: "Development requirement" },
  { value: "other", label: "Other" },
];

const EVIDENCE_OPTIONS: Array<{ value: RegistrationEvidenceType; label: string }> = [
  { value: "registration_certificate", label: "Registration certificate" },
  { value: "membership_card", label: "Membership card" },
  { value: "practising_licence", label: "Practising licence" },
  { value: "online_register_check", label: "Online register check" },
  { value: "renewal_confirmation", label: "Renewal confirmation" },
  { value: "restriction_notice", label: "Restriction notice" },
  { value: "correspondence", label: "Correspondence" },
  { value: "other", label: "Other" },
];

const EMPTY_REGISTRATION = (): ProfessionalRegistrationRecord => ({
  id: crypto.randomUUID(),
  professionOrRole: "",
  professionalBody: "",
  registerName: "",
  requirement: "mandatory",
  status: "not_assessed",
  registrationNumber: "",
  membershipGrade: "",
  practisingLicenceNumber: "",
  countryOrJurisdiction: "United Kingdom",
  initialRegistrationDate: "",
  validFromDate: "",
  expiryDate: "",
  renewalDate: "",
  lastCheckedDate: "",
  lastCheckedBy: "",
  verificationMethod: "",
  registerUrl: "",
  registerReference: "",
  activeOnRegister: false,
  practisingRightsConfirmed: false,
  identityMatched: false,
  scopeMatchesRole: false,
  restrictionsOrConditionsPresent: false,
  restrictionsOrConditions: "",
  fitnessToPractiseConcern: false,
  fitnessToPractiseSummary: "",
  employerActionRequired: false,
  employerAction: "",
  continuingProfessionalDevelopmentRequired: false,
  cpdRequirementSummary: "",
  indemnityRequired: false,
  indemnityConfirmed: false,
  notes: "",
  evidence: [],
  verificationHistory: [],
});

const EMPTY_VALUE: ProfessionalRegistrationsDetailsValue = {
  registrationRequiredForRole: false,
  minimumRegistrationRequirement: "",
  overallStatus: "not_assessed",
  nextReviewDate: "",
  summaryNotes: "",
  registrations: [],
};

const DEFAULT_PERMISSIONS: ProfessionalRegistrationsDetailsPermissions = {
  canView: true,
  canEdit: true,
  canViewRegistrationNumbers: true,
  canEditRegistrationNumbers: true,
  canVerify: true,
  canRecordRestrictions: true,
  canRecordFitnessToPractise: true,
  canAddRegistration: true,
  canDeleteRegistration: true,
  canViewEvidence: true,
  canUploadEvidence: true,
  canDeleteEvidence: true,
  canViewHistory: true,
};

function normaliseRegistration(value: Partial<ProfessionalRegistrationRecord>): ProfessionalRegistrationRecord {
  return {
    ...EMPTY_REGISTRATION(),
    ...value,
    id: value.id ?? crypto.randomUUID(),
    evidence: value.evidence ?? [],
    verificationHistory: value.verificationHistory ?? [],
  };
}

function normaliseValue(value?: Partial<ProfessionalRegistrationsDetailsValue>): ProfessionalRegistrationsDetailsValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    registrations: value?.registrations?.map(normaliseRegistration) ?? [],
  };
}

function cleanValue(value: ProfessionalRegistrationsDetailsValue): ProfessionalRegistrationsDetailsValue {
  return {
    ...value,
    minimumRegistrationRequirement: value.minimumRegistrationRequirement.trim(),
    summaryNotes: value.summaryNotes.trim(),
    registrations: value.registrations.map((item) => ({
      ...item,
      professionOrRole: item.professionOrRole.trim(),
      professionalBody: item.professionalBody.trim(),
      registerName: item.registerName.trim(),
      registrationNumber: item.registrationNumber.trim().toUpperCase(),
      membershipGrade: item.membershipGrade.trim(),
      practisingLicenceNumber: item.practisingLicenceNumber.trim().toUpperCase(),
      countryOrJurisdiction: item.countryOrJurisdiction.trim(),
      lastCheckedBy: item.lastCheckedBy.trim(),
      verificationMethod: item.verificationMethod.trim(),
      registerUrl: item.registerUrl.trim(),
      registerReference: item.registerReference.trim(),
      restrictionsOrConditions: item.restrictionsOrConditions.trim(),
      fitnessToPractiseSummary: item.fitnessToPractiseSummary.trim(),
      employerAction: item.employerAction.trim(),
      cpdRequirementSummary: item.cpdRequirementSummary.trim(),
      notes: item.notes.trim(),
    })),
  };
}

function changedFields(original: ProfessionalRegistrationsDetailsValue, current: ProfessionalRegistrationsDetailsValue): string[] {
  const a = cleanValue(original);
  const b = cleanValue(current);
  const fields: string[] = [];
  const roots: Array<keyof Omit<ProfessionalRegistrationsDetailsValue, "registrations">> = [
    "registrationRequiredForRole",
    "minimumRegistrationRequirement",
    "overallStatus",
    "nextReviewDate",
    "summaryNotes",
  ];
  roots.forEach((key) => {
    if (a[key] !== b[key]) fields.push(String(key));
  });
  const originalMap = new Map(a.registrations.map((item) => [item.id, item]));
  const keys: Array<keyof ProfessionalRegistrationRecord> = [
    "professionOrRole", "professionalBody", "registerName", "requirement", "status",
    "registrationNumber", "membershipGrade", "practisingLicenceNumber", "countryOrJurisdiction",
    "initialRegistrationDate", "validFromDate", "expiryDate", "renewalDate", "lastCheckedDate",
    "lastCheckedBy", "verificationMethod", "registerUrl", "registerReference", "activeOnRegister",
    "practisingRightsConfirmed", "identityMatched", "scopeMatchesRole", "restrictionsOrConditionsPresent",
    "restrictionsOrConditions", "fitnessToPractiseConcern", "fitnessToPractiseSummary",
    "employerActionRequired", "employerAction", "continuingProfessionalDevelopmentRequired",
    "cpdRequirementSummary", "indemnityRequired", "indemnityConfirmed", "notes",
  ];
  b.registrations.forEach((item) => {
    const prior = originalMap.get(item.id);
    if (!prior) {
      fields.push(`registrations.${item.id}.added`);
      return;
    }
    keys.forEach((key) => {
      if (prior[key] !== item[key]) fields.push(`registrations.${item.id}.${String(key)}`);
    });
  });
  const currentIds = new Set(b.registrations.map((item) => item.id));
  a.registrations.forEach((item) => {
    if (!currentIds.has(item.id)) fields.push(`registrations.${item.id}.removed`);
  });
  return fields;
}

function validate(value: ProfessionalRegistrationsDetailsValue): ValidationErrors {
  const errors: ValidationErrors = {};
  if (value.registrationRequiredForRole && !value.minimumRegistrationRequirement.trim()) {
    errors.minimumRegistrationRequirement = "Record the minimum professional registration requirement for the role.";
  }
  if (value.registrationRequiredForRole && value.registrations.length === 0) {
    errors.registrations = "Add at least one professional registration record.";
  }
  value.registrations.forEach((item, index) => {
    const p = `registrations.${item.id}`;
    if (!item.professionOrRole.trim()) errors[`${p}.professionOrRole`] = `Enter the profession or role for record ${index + 1}.`;
    if (!item.professionalBody.trim()) errors[`${p}.professionalBody`] = "Enter the professional or regulatory body.";
    if (!item.registerName.trim()) errors[`${p}.registerName`] = "Enter the name of the register.";
    if (["active", "renewal_due", "restricted", "suspended"].includes(item.status) && !item.registrationNumber.trim()) {
      errors[`${p}.registrationNumber`] = "Enter the registration or membership number.";
    }
    if (item.validFromDate && item.expiryDate && item.expiryDate < item.validFromDate) {
      errors[`${p}.expiryDate`] = "The expiry date cannot be before the valid-from date.";
    }
    if (item.expiryDate && item.renewalDate && item.renewalDate < item.expiryDate) {
      errors[`${p}.renewalDate`] = "The renewal date cannot be before the expiry date.";
    }
    if (item.status === "active" && !item.lastCheckedDate) errors[`${p}.lastCheckedDate`] = "Record when the register was last checked.";
    if (item.status === "active" && !item.lastCheckedBy.trim()) errors[`${p}.lastCheckedBy`] = "Record who checked the register.";
    if (item.status === "active" && !item.verificationMethod.trim()) errors[`${p}.verificationMethod`] = "Record how the registration was verified.";
    if (item.restrictionsOrConditionsPresent && !item.restrictionsOrConditions.trim()) {
      errors[`${p}.restrictionsOrConditions`] = "Record the restrictions or conditions shown on the register.";
    }
    if (item.fitnessToPractiseConcern && !item.fitnessToPractiseSummary.trim()) {
      errors[`${p}.fitnessToPractiseSummary`] = "Record a factual summary of the fitness-to-practise concern.";
    }
    if (item.employerActionRequired && !item.employerAction.trim()) {
      errors[`${p}.employerAction`] = "Record the employer action required.";
    }
    if (item.continuingProfessionalDevelopmentRequired && !item.cpdRequirementSummary.trim()) {
      errors[`${p}.cpdRequirementSummary`] = "Record the continuing professional development requirement.";
    }
    if (item.indemnityRequired && !item.indemnityConfirmed && item.status === "active") {
      errors[`${p}.indemnityConfirmed`] = "Required professional indemnity must be confirmed before the registration is treated as fully active.";
    }
  });
  return errors;
}

function fieldError(errors: ValidationErrors, id: string, field: keyof ProfessionalRegistrationRecord) {
  return errors[`registrations.${id}.${String(field)}`];
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(parsed);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function labelFor<T extends string>(options: Array<{ value: T; label: string }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function statusAppearance(status: ProfessionalRegistrationStatus) {
  if (status === "active") return { background: "#F2FAF5", border: "#CFE6D8", color: "#4E765F", icon: <CheckCircle2 size={14} /> };
  if (["details_required", "evidence_required", "verification_required", "renewal_due"].includes(status)) {
    return { background: "#FBF8F2", border: "#E7DCC6", color: "#806C46", icon: <Clock3 size={14} /> };
  }
  if (["lapsed", "suspended", "restricted", "removed"].includes(status)) {
    return { background: "#FFF7F8", border: "#E8CBD2", color: "#8B4E5D", icon: <AlertCircle size={14} /> };
  }
  return { background: "#F8F5FA", border: "#E1D8E6", color: "#746A79", icon: <ShieldCheck size={14} /> };
}

function SectionHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <header style={styles.sectionHeader}><span style={styles.sectionIcon}>{icon}</span><div><h3 style={styles.sectionTitle}>{title}</h3><p style={styles.sectionDescription}>{description}</p></div></header>;
}

function FieldLabel({ children, required, sensitive }: { children: ReactNode; required?: boolean; sensitive?: boolean }) {
  return <label style={styles.fieldLabel}><span>{children}</span>{required ? <span style={styles.requiredMark}>*</span> : null}{sensitive ? <span style={styles.sensitiveLabel}><LockKeyhole size={11} />Restricted</span> : null}</label>;
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p role="alert" style={styles.fieldError}><AlertCircle size={12} />{message}</p> : null;
}

function ReadOnly({ value, fallback = "Not recorded", restricted = false }: { value?: string; fallback?: string; restricted?: boolean }) {
  if (restricted) return <span style={styles.restrictedValue}><LockKeyhole size={13} />Restricted</span>;
  return <span style={{ ...styles.readOnlyValue, ...(!value ? styles.readOnlyEmpty : {}) }}>{value || fallback}</span>;
}

function Checkbox({ checked, label, description, disabled, onChange }: { checked: boolean; label: string; description?: string; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label style={styles.checkboxCard}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span><strong style={styles.checkboxTitle}>{label}</strong>{description ? <span style={styles.checkboxDescription}>{description}</span> : null}</span></label>;
}

export default function ProfessionalRegistrationsDetails({
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
}: ProfessionalRegistrationsDetailsProps) {
  const resolvedPermissions = useMemo(() => ({ ...DEFAULT_PERMISSIONS, ...permissions }), [permissions]);
  const suppliedValue = useMemo(() => normaliseValue(value), [value]);
  const [original, setOriginal] = useState(suppliedValue);
  const [draft, setDraft] = useState(suppliedValue);
  const [editing, setEditing] = useState(startInEditMode && resolvedPermissions.canEdit);
  const [expandedIds, setExpandedIds] = useState(suppliedValue.registrations.map((item) => item.id));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState<string[]>([]);
  const [removedRegistrationIds, setRemovedRegistrationIds] = useState<string[]>([]);
  const [activeRegistrationId, setActiveRegistrationId] = useState<string | null>(null);
  const [selectedEvidenceType, setSelectedEvidenceType] = useState<RegistrationEvidenceType>("registration_certificate");
  const [localSaving, setLocalSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;

  useEffect(() => {
    setOriginal(suppliedValue);
    setDraft(suppliedValue);
    setExpandedIds(suppliedValue.registrations.map((item) => item.id));
    setErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setRemovedRegistrationIds([]);
  }, [suppliedValue]);

  const fields = useMemo(() => changedFields(original, draft), [original, draft]);
  const isDirty = fields.length > 0 || pendingFiles.length > 0 || removedEvidenceIds.length > 0 || removedRegistrationIds.length > 0;
  const overallAppearance = statusAppearance(draft.overallStatus);

  async function audit(action: ProfessionalRegistrationsAuditEvent["action"], options?: { registrationId?: string; evidenceId?: string; changedFields?: string[] }) {
    await onAudit?.({ action, mode, recordId, registrationId: options?.registrationId, evidenceId: options?.evidenceId, changedFields: options?.changedFields, occurredAt: new Date().toISOString() });
  }

  function updateRoot<K extends keyof ProfessionalRegistrationsDetailsValue>(key: K, next: ProfessionalRegistrationsDetailsValue[K]) {
    setDraft((current) => ({ ...current, [key]: next }));
    setErrors((current) => { const copy = { ...current }; delete copy[String(key)]; return copy; });
  }

  function updateRegistration<K extends keyof ProfessionalRegistrationRecord>(id: string, key: K, next: ProfessionalRegistrationRecord[K]) {
    setDraft((current) => ({ ...current, registrations: current.registrations.map((item) => item.id === id ? { ...item, [key]: next } : item) }));
    setErrors((current) => { const copy = { ...current }; delete copy[`registrations.${id}.${String(key)}`]; return copy; });
  }

  async function beginEditing() { if (!resolvedPermissions.canEdit || isDisabled) return; setEditing(true); await audit("professional_registrations_edit_started"); }
  async function cancelEditing() { setDraft(original); setErrors({}); setPendingFiles([]); setRemovedEvidenceIds([]); setRemovedRegistrationIds([]); setEditing(false); onCancel?.(); await audit("professional_registrations_edit_cancelled"); }
  function resetChanges() { setDraft(original); setErrors({}); setPendingFiles([]); setRemovedEvidenceIds([]); setRemovedRegistrationIds([]); }

  async function addRegistration() {
    if (!resolvedPermissions.canAddRegistration || isDisabled) return;
    const item = EMPTY_REGISTRATION();
    setDraft((current) => ({ ...current, registrations: [...current.registrations, item] }));
    setExpandedIds((current) => [...current, item.id]);
    await audit("professional_registration_added", { registrationId: item.id });
  }

  async function removeRegistration(id: string) {
    if (!resolvedPermissions.canDeleteRegistration || isDisabled) return;
    if (original.registrations.some((item) => item.id === id)) setRemovedRegistrationIds((current) => [...current, id]);
    setDraft((current) => ({ ...current, registrations: current.registrations.filter((item) => item.id !== id) }));
    setPendingFiles((current) => current.filter((item) => item.registrationId !== id));
    await audit("professional_registration_removed", { registrationId: id });
  }

  function openFilePicker(id: string) {
    setActiveRegistrationId(id);
    requestAnimationFrame(() => fileInputRef.current?.click());
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    if (!activeRegistrationId) { event.target.value = ""; return; }
    const files = Array.from(event.target.files ?? []).filter((file) => file.size <= 15 * 1024 * 1024);
    setPendingFiles((current) => [...current, ...files.map((file) => ({ id: crypto.randomUUID(), registrationId: activeRegistrationId, file, evidenceType: selectedEvidenceType }))]);
    if (files.length) await audit("professional_registration_evidence_selected", { registrationId: activeRegistrationId });
    event.target.value = "";
  }

  async function removeExistingEvidence(registrationId: string, evidenceId: string) {
    if (!resolvedPermissions.canDeleteEvidence || isDisabled) return;
    setRemovedEvidenceIds((current) => [...current, evidenceId]);
    await audit("professional_registration_evidence_removed", { registrationId, evidenceId });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedPermissions.canEdit || isDisabled || !onSave) return;
    const nextErrors = validate(draft);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const first = Object.keys(nextErrors).find((key) => key.startsWith("registrations."));
      if (first) {
        const id = first.split(".")[1];
        setExpandedIds((current) => current.includes(id) ? current : [...current, id]);
      }
      return;
    }
    const cleaned = cleanValue(draft);
    const changed = changedFields(original, cleaned);
    if (!changed.length && !pendingFiles.length && !removedEvidenceIds.length && !removedRegistrationIds.length) { setEditing(false); return; }
    try {
      setLocalSaving(true);
      await onSave({
        value: cleaned,
        changedFields: changed,
        newFiles: pendingFiles.map((item) => ({ registrationId: item.registrationId, file: item.file, evidenceType: item.evidenceType })),
        removedEvidenceIds,
        removedRegistrationIds,
      });
      setOriginal(cleaned);
      setDraft(cleaned);
      setPendingFiles([]);
      setRemovedEvidenceIds([]);
      setRemovedRegistrationIds([]);
      setErrors({});
      setEditing(false);
      await audit("professional_registrations_saved", { changedFields: changed });
      for (const item of cleaned.registrations) {
        if (changed.includes(`registrations.${item.id}.status`) && item.status === "active") await audit("professional_registration_verified", { registrationId: item.id });
        if (changed.includes(`registrations.${item.id}.restrictionsOrConditionsPresent`) && item.restrictionsOrConditionsPresent) await audit("professional_registration_restriction_recorded", { registrationId: item.id });
      }
    } finally { setLocalSaving(false); }
  }

  if (!resolvedPermissions.canView) {
    return <section style={styles.accessCard}><span style={styles.accessIcon}><LockKeyhole size={20} /></span><div><h2 style={styles.accessTitle}>Professional registration information is restricted</h2><p style={styles.accessText}>Your current permission level does not allow access to this record.</p></div></section>;
  }

  return (
    <section style={styles.card}>
      <header style={styles.cardHeader}>
        <div style={styles.identity}><span style={styles.identityIcon}><Award size={21} /></span><div style={{ minWidth: 0 }}><div style={styles.titleRow}><h2 style={styles.cardTitle}>Professional registrations</h2><span style={{ ...styles.statusBadge, background: overallAppearance.background, borderColor: overallAppearance.border, color: overallAppearance.color }}>{overallAppearance.icon}{labelFor(STATUS_OPTIONS, draft.overallStatus)}</span></div><p style={styles.cardSubtitle}>{recordLabel || (mode === "candidate" ? "Candidate record" : "Employee record")}{recordId !== undefined ? ` · Record ${String(recordId)}` : ""}</p></div></div>
        <div style={styles.headerActions}>{headerActions}{!editing && resolvedPermissions.canEdit ? <button type="button" style={styles.secondaryButton} onClick={beginEditing} disabled={isDisabled}><Pencil size={15} />Edit registrations</button> : null}</div>
      </header>

      {errorMessage ? <div role="alert" style={styles.errorBanner}><AlertCircle size={17} /><span>{errorMessage}</span></div> : null}
      {successMessage ? <div role="status" style={styles.successBanner}><Check size={17} /><span>{successMessage}</span></div> : null}

      <form onSubmit={submit}>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={handleFiles} style={{ display: "none" }} />
        <div style={styles.content}>
          <section style={styles.section}>
            <SectionHeader icon={<ShieldCheck size={18} />} title="Role registration requirements" description="Record the professional, statutory or regulatory registration required for the role." />
            <div style={styles.formGrid}>
              <div style={styles.field}><FieldLabel>Overall status</FieldLabel>{editing ? <select value={draft.overallStatus} onChange={(event) => updateRoot("overallStatus", event.target.value as ProfessionalRegistrationStatus)} style={styles.input} disabled={isDisabled}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <ReadOnly value={labelFor(STATUS_OPTIONS, draft.overallStatus)} />}</div>
              <div style={styles.field}><FieldLabel>Next review date</FieldLabel>{editing ? <input type="date" value={draft.nextReviewDate} onChange={(event) => updateRoot("nextReviewDate", event.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnly value={draft.nextReviewDate ? formatDate(draft.nextReviewDate) : ""} />}</div>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel required={draft.registrationRequiredForRole}>Minimum registration requirement</FieldLabel>{editing ? <><textarea rows={4} value={draft.minimumRegistrationRequirement} onChange={(event) => updateRoot("minimumRegistrationRequirement", event.target.value)} style={{ ...styles.textarea, ...(errors.minimumRegistrationRequirement ? styles.inputError : {}) }} disabled={isDisabled} placeholder="Record the professional body, register, membership grade or practising status required." /><ErrorText message={errors.minimumRegistrationRequirement} /></> : <ReadOnly value={draft.minimumRegistrationRequirement} fallback="No minimum registration requirement recorded" />}</div>
            </div>
            <div style={styles.checkboxGrid}>{editing ? <Checkbox checked={draft.registrationRequiredForRole} label="Registration required for role" description="The individual must hold and maintain a specified registration, membership or licence." disabled={isDisabled} onChange={(checked) => updateRoot("registrationRequiredForRole", checked)} /> : <ReadOnly value={draft.registrationRequiredForRole ? "Professional registration required" : "Professional registration not required"} />}</div>
            <div style={styles.field}><FieldLabel>Summary notes</FieldLabel>{editing ? <textarea rows={4} value={draft.summaryNotes} onChange={(event) => updateRoot("summaryNotes", event.target.value)} style={styles.textarea} disabled={isDisabled} /> : <ReadOnly value={draft.summaryNotes} fallback="No summary notes recorded" />}</div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionActionHeader}><SectionHeader icon={<Building2 size={18} />} title="Registration records" description="Maintain each professional membership, statutory registration or practising licence separately." />{editing && resolvedPermissions.canAddRegistration ? <button type="button" style={styles.secondaryButton} onClick={addRegistration} disabled={isDisabled}><Plus size={15} />Add registration</button> : null}</div>
            <ErrorText message={errors.registrations} />
            {!draft.registrations.length ? <div style={styles.emptyState}><Award size={24} /><strong>No professional registrations recorded</strong><span>Add the relevant register, professional membership or practising licence.</span>{editing && resolvedPermissions.canAddRegistration ? <button type="button" style={styles.secondaryButton} onClick={addRegistration}><Plus size={15} />Add first registration</button> : null}</div> : null}

            <div style={styles.registrationList}>
              {draft.registrations.map((item, index) => {
                const expanded = expandedIds.includes(item.id);
                const appearance = statusAppearance(item.status);
                const visibleEvidence = item.evidence.filter((evidence) => !removedEvidenceIds.includes(evidence.id));
                const queued = pendingFiles.filter((file) => file.registrationId === item.id);
                return <article key={item.id} style={styles.registrationCard}>
                  <header style={styles.registrationHeader}>
                    <button type="button" style={styles.registrationToggle} onClick={() => setExpandedIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}>
                      <span style={styles.registrationIcon}><Award size={17} /></span><span style={{ minWidth: 0, flex: 1, textAlign: "left" }}><strong style={styles.registrationTitle}>{item.professionOrRole || `Professional registration ${index + 1}`}</strong><span style={styles.registrationSubtitle}>{item.professionalBody || "Professional body not recorded"} · {labelFor(REQUIREMENT_OPTIONS, item.requirement)}</span></span><span style={{ ...styles.statusBadge, background: appearance.background, borderColor: appearance.border, color: appearance.color }}>{appearance.icon}{labelFor(STATUS_OPTIONS, item.status)}</span><ChevronDown size={17} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }} />
                    </button>
                    {editing && resolvedPermissions.canDeleteRegistration ? <button type="button" style={styles.iconButton} onClick={() => removeRegistration(item.id)} disabled={isDisabled} aria-label="Remove registration"><Trash2 size={15} /></button> : null}
                  </header>

                  {expanded ? <div style={styles.registrationBody}>
                    <section style={styles.innerSection}>
                      <SectionHeader icon={<Award size={17} />} title="Registration details" description="Record the profession, professional body, register and membership details." />
                      <div style={styles.formGrid}>
                        <div style={styles.field}><FieldLabel required>Profession or role</FieldLabel>{editing ? <><input value={item.professionOrRole} onChange={(event) => updateRegistration(item.id, "professionOrRole", event.target.value)} style={{ ...styles.input, ...(fieldError(errors, item.id, "professionOrRole") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "professionOrRole")} /></> : <ReadOnly value={item.professionOrRole} />}</div>
                        <div style={styles.field}><FieldLabel required>Professional or regulatory body</FieldLabel>{editing ? <><input value={item.professionalBody} onChange={(event) => updateRegistration(item.id, "professionalBody", event.target.value)} style={{ ...styles.input, ...(fieldError(errors, item.id, "professionalBody") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "professionalBody")} /></> : <ReadOnly value={item.professionalBody} />}</div>
                        <div style={styles.field}><FieldLabel required>Register name</FieldLabel>{editing ? <><input value={item.registerName} onChange={(event) => updateRegistration(item.id, "registerName", event.target.value)} style={{ ...styles.input, ...(fieldError(errors, item.id, "registerName") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "registerName")} /></> : <ReadOnly value={item.registerName} />}</div>
                        <div style={styles.field}><FieldLabel>Requirement type</FieldLabel>{editing ? <select value={item.requirement} onChange={(event) => updateRegistration(item.id, "requirement", event.target.value as ProfessionalRegistrationRequirement)} style={styles.input} disabled={isDisabled}>{REQUIREMENT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <ReadOnly value={labelFor(REQUIREMENT_OPTIONS, item.requirement)} />}</div>
                        <div style={styles.field}><FieldLabel>Status</FieldLabel>{editing ? <select value={item.status} onChange={(event) => updateRegistration(item.id, "status", event.target.value as ProfessionalRegistrationStatus)} style={styles.input} disabled={isDisabled}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <ReadOnly value={labelFor(STATUS_OPTIONS, item.status)} />}</div>
                        <div style={styles.field}><FieldLabel>Country or jurisdiction</FieldLabel>{editing ? <input value={item.countryOrJurisdiction} onChange={(event) => updateRegistration(item.id, "countryOrJurisdiction", event.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnly value={item.countryOrJurisdiction} />}</div>
                        <div style={styles.field}><FieldLabel sensitive>Registration number</FieldLabel>{!resolvedPermissions.canViewRegistrationNumbers ? <ReadOnly restricted /> : editing && resolvedPermissions.canEditRegistrationNumbers ? <><input value={item.registrationNumber} onChange={(event) => updateRegistration(item.id, "registrationNumber", event.target.value)} style={{ ...styles.input, ...(fieldError(errors, item.id, "registrationNumber") ? styles.inputError : {}) }} disabled={isDisabled} autoComplete="off" /><ErrorText message={fieldError(errors, item.id, "registrationNumber")} /></> : <ReadOnly value={item.registrationNumber} />}</div>
                        <div style={styles.field}><FieldLabel>Membership grade</FieldLabel>{editing ? <input value={item.membershipGrade} onChange={(event) => updateRegistration(item.id, "membershipGrade", event.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnly value={item.membershipGrade} />}</div>
                        <div style={styles.field}><FieldLabel sensitive>Practising licence number</FieldLabel>{!resolvedPermissions.canViewRegistrationNumbers ? <ReadOnly restricted /> : editing && resolvedPermissions.canEditRegistrationNumbers ? <input value={item.practisingLicenceNumber} onChange={(event) => updateRegistration(item.id, "practisingLicenceNumber", event.target.value)} style={styles.input} disabled={isDisabled} autoComplete="off" /> : <ReadOnly value={item.practisingLicenceNumber} />}</div>
                      </div>
                    </section>

                    <section style={styles.innerSection}>
                      <SectionHeader icon={<CalendarClock size={17} />} title="Validity and renewal" description="Track initial registration, validity, expiry and renewal dates." />
                      <div style={styles.formGrid}>
                        {([ ["initialRegistrationDate", "Initial registration date"], ["validFromDate", "Valid from"], ["expiryDate", "Expiry date"], ["renewalDate", "Renewal date"] ] as Array<[keyof ProfessionalRegistrationRecord, string]>).map(([key, label]) => <div key={String(key)} style={styles.field}><FieldLabel>{label}</FieldLabel>{editing ? <><input type="date" value={String(item[key] ?? "")} onChange={(event) => updateRegistration(item.id, key, event.target.value as never)} style={{ ...styles.input, ...(fieldError(errors, item.id, key) ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, key)} /></> : <ReadOnly value={item[key] ? formatDate(String(item[key])) : ""} />}</div>)}
                      </div>
                    </section>

                    <section style={styles.innerSection}>
                      <SectionHeader icon={<FileCheck2 size={17} />} title="Register verification" description="Record the authoritative register check and whether the registration can be relied upon for the role." />
                      {!resolvedPermissions.canVerify && editing ? <div style={styles.restrictedPanel}><LockKeyhole size={17} /><div><strong>Verification controls are restricted</strong><p>Your current permission level does not allow you to confirm professional registration status.</p></div></div> : null}
                      <div style={styles.formGrid}>
                        <div style={styles.field}><FieldLabel>Last checked date</FieldLabel>{editing && resolvedPermissions.canVerify ? <><input type="date" value={item.lastCheckedDate} onChange={(event) => updateRegistration(item.id, "lastCheckedDate", event.target.value)} style={{ ...styles.input, ...(fieldError(errors, item.id, "lastCheckedDate") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "lastCheckedDate")} /></> : <ReadOnly value={item.lastCheckedDate ? formatDate(item.lastCheckedDate) : ""} />}</div>
                        <div style={styles.field}><FieldLabel>Checked by</FieldLabel>{editing && resolvedPermissions.canVerify ? <><input value={item.lastCheckedBy} onChange={(event) => updateRegistration(item.id, "lastCheckedBy", event.target.value)} style={{ ...styles.input, ...(fieldError(errors, item.id, "lastCheckedBy") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "lastCheckedBy")} /></> : <ReadOnly value={item.lastCheckedBy} />}</div>
                        <div style={styles.field}><FieldLabel>Verification method</FieldLabel>{editing && resolvedPermissions.canVerify ? <><input value={item.verificationMethod} onChange={(event) => updateRegistration(item.id, "verificationMethod", event.target.value)} style={{ ...styles.input, ...(fieldError(errors, item.id, "verificationMethod") ? styles.inputError : {}) }} disabled={isDisabled} placeholder="For example, live online register search" /><ErrorText message={fieldError(errors, item.id, "verificationMethod")} /></> : <ReadOnly value={item.verificationMethod} />}</div>
                        <div style={styles.field}><FieldLabel sensitive>Register reference</FieldLabel>{editing && resolvedPermissions.canVerify ? <input value={item.registerReference} onChange={(event) => updateRegistration(item.id, "registerReference", event.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnly value={item.registerReference} />}</div>
                        <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Register URL</FieldLabel>{editing && resolvedPermissions.canVerify ? <input type="url" value={item.registerUrl} onChange={(event) => updateRegistration(item.id, "registerUrl", event.target.value)} style={styles.input} disabled={isDisabled} placeholder="https://" /> : <ReadOnly value={item.registerUrl} />}</div>
                      </div>
                      <div style={styles.checkboxGrid}>{editing && resolvedPermissions.canVerify ? <><Checkbox checked={item.activeOnRegister} label="Active on register" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "activeOnRegister", checked)} /><Checkbox checked={item.practisingRightsConfirmed} label="Practising rights confirmed" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "practisingRightsConfirmed", checked)} /><Checkbox checked={item.identityMatched} label="Identity matched" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "identityMatched", checked)} /><Checkbox checked={item.scopeMatchesRole} label="Scope matches role" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "scopeMatchesRole", checked)} /></> : <><ReadOnly value={item.activeOnRegister ? "Active on register" : "Not confirmed active on register"} /><ReadOnly value={item.practisingRightsConfirmed ? "Practising rights confirmed" : "Practising rights not confirmed"} /><ReadOnly value={item.identityMatched ? "Identity matched" : "Identity match not confirmed"} /><ReadOnly value={item.scopeMatchesRole ? "Scope matches role" : "Role scope not confirmed"} /></>}</div>
                      {editing && resolvedPermissions.canVerify ? <button type="button" style={styles.secondaryButton} onClick={() => { updateRegistration(item.id, "status", "active"); updateRegistration(item.id, "activeOnRegister", true); if (!item.lastCheckedDate) updateRegistration(item.id, "lastCheckedDate", new Date().toISOString().slice(0, 10)); }} disabled={isDisabled}><CheckCircle2 size={15} />Mark registration active</button> : null}
                    </section>

                    <section style={styles.innerSection}>
                      <SectionHeader icon={<AlertCircle size={17} />} title="Restrictions, fitness to practise and employer action" description="Record factual register restrictions or concerns and the proportionate action required by the employer." />
                      {!resolvedPermissions.canRecordRestrictions || !resolvedPermissions.canRecordFitnessToPractise ? <div style={styles.restrictedPanel}><LockKeyhole size={17} /><div><strong>Some safeguarding fields are restricted</strong><p>Restricted fields remain hidden or read-only according to your permission level.</p></div></div> : null}
                      <div style={styles.checkboxGrid}>
                        {editing && resolvedPermissions.canRecordRestrictions ? <Checkbox checked={item.restrictionsOrConditionsPresent} label="Restrictions or conditions present" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "restrictionsOrConditionsPresent", checked)} /> : <ReadOnly value={item.restrictionsOrConditionsPresent ? "Restrictions or conditions recorded" : "No restrictions or conditions recorded"} restricted={!resolvedPermissions.canRecordRestrictions} />}
                        {editing && resolvedPermissions.canRecordFitnessToPractise ? <Checkbox checked={item.fitnessToPractiseConcern} label="Fitness-to-practise concern recorded" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "fitnessToPractiseConcern", checked)} /> : <ReadOnly value={item.fitnessToPractiseConcern ? "Fitness-to-practise concern recorded" : "No fitness-to-practise concern recorded"} restricted={!resolvedPermissions.canRecordFitnessToPractise} />}
                        {editing ? <Checkbox checked={item.employerActionRequired} label="Employer action required" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "employerActionRequired", checked)} /> : <ReadOnly value={item.employerActionRequired ? "Employer action required" : "No employer action recorded"} />}
                      </div>
                      <div style={styles.formGrid}>
                        <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel sensitive>Restrictions or conditions</FieldLabel>{editing && resolvedPermissions.canRecordRestrictions ? <><textarea rows={4} value={item.restrictionsOrConditions} onChange={(event) => updateRegistration(item.id, "restrictionsOrConditions", event.target.value)} style={{ ...styles.textarea, ...(fieldError(errors, item.id, "restrictionsOrConditions") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "restrictionsOrConditions")} /></> : <ReadOnly value={item.restrictionsOrConditions} restricted={!resolvedPermissions.canRecordRestrictions} />}</div>
                        <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel sensitive>Fitness-to-practise summary</FieldLabel>{editing && resolvedPermissions.canRecordFitnessToPractise ? <><textarea rows={4} value={item.fitnessToPractiseSummary} onChange={(event) => updateRegistration(item.id, "fitnessToPractiseSummary", event.target.value)} style={{ ...styles.textarea, ...(fieldError(errors, item.id, "fitnessToPractiseSummary") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "fitnessToPractiseSummary")} /></> : <ReadOnly value={item.fitnessToPractiseSummary} restricted={!resolvedPermissions.canRecordFitnessToPractise} />}</div>
                        <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Employer action</FieldLabel>{editing ? <><textarea rows={4} value={item.employerAction} onChange={(event) => updateRegistration(item.id, "employerAction", event.target.value)} style={{ ...styles.textarea, ...(fieldError(errors, item.id, "employerAction") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "employerAction")} /></> : <ReadOnly value={item.employerAction} />}</div>
                      </div>
                    </section>

                    <section style={styles.innerSection}>
                      <SectionHeader icon={<CalendarClock size={17} />} title="Ongoing professional requirements" description="Track continuing professional development and professional indemnity requirements." />
                      <div style={styles.checkboxGrid}>{editing ? <><Checkbox checked={item.continuingProfessionalDevelopmentRequired} label="CPD required" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "continuingProfessionalDevelopmentRequired", checked)} /><Checkbox checked={item.indemnityRequired} label="Professional indemnity required" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "indemnityRequired", checked)} /><Checkbox checked={item.indemnityConfirmed} label="Professional indemnity confirmed" disabled={isDisabled} onChange={(checked) => updateRegistration(item.id, "indemnityConfirmed", checked)} /></> : <><ReadOnly value={item.continuingProfessionalDevelopmentRequired ? "CPD required" : "No CPD requirement recorded"} /><ReadOnly value={item.indemnityRequired ? "Professional indemnity required" : "Professional indemnity not required"} /><ReadOnly value={item.indemnityConfirmed ? "Professional indemnity confirmed" : "Professional indemnity not confirmed"} /></>}</div>
                      <ErrorText message={fieldError(errors, item.id, "indemnityConfirmed")} />
                      <div style={styles.field}><FieldLabel>CPD requirement summary</FieldLabel>{editing ? <><textarea rows={4} value={item.cpdRequirementSummary} onChange={(event) => updateRegistration(item.id, "cpdRequirementSummary", event.target.value)} style={{ ...styles.textarea, ...(fieldError(errors, item.id, "cpdRequirementSummary") ? styles.inputError : {}) }} disabled={isDisabled} /><ErrorText message={fieldError(errors, item.id, "cpdRequirementSummary")} /></> : <ReadOnly value={item.cpdRequirementSummary} />}</div>
                    </section>

                    <section style={styles.innerSection}>
                      <SectionHeader icon={<FileText size={17} />} title="Notes and supporting evidence" description="Store concise notes and documents supporting registration and renewal decisions." />
                      <div style={styles.field}><FieldLabel>Notes</FieldLabel>{editing ? <textarea rows={5} value={item.notes} onChange={(event) => updateRegistration(item.id, "notes", event.target.value)} style={styles.textarea} disabled={isDisabled} /> : <ReadOnly value={item.notes} />}</div>
                      {!resolvedPermissions.canViewEvidence ? <div style={styles.restrictedPanel}><LockKeyhole size={17} /><div><strong>Evidence is restricted</strong><p>Your current permission level does not allow access to registration evidence.</p></div></div> : <>
                        {!visibleEvidence.length && !queued.length ? <div style={styles.compactEmpty}>No evidence uploaded for this registration.</div> : null}
                        <div style={styles.evidenceList}>{visibleEvidence.map((evidence) => <div key={evidence.id} style={styles.evidenceCard}><span style={styles.evidenceIcon}><FileText size={16} /></span><div style={{ flex: 1, minWidth: 0 }}><strong style={styles.evidenceName}>{evidence.fileName}</strong><span style={styles.evidenceMeta}>{labelFor(EVIDENCE_OPTIONS, evidence.evidenceType)} · {formatFileSize(evidence.fileSizeBytes)} · {formatDateTime(evidence.uploadedAt)}</span></div>{editing && resolvedPermissions.canDeleteEvidence ? <button type="button" style={styles.iconButton} onClick={() => removeExistingEvidence(item.id, evidence.id)}><Trash2 size={14} /></button> : null}</div>)}</div>
                        <div style={styles.evidenceList}>{queued.map((file) => <div key={file.id} style={styles.evidenceCard}><span style={styles.evidenceIcon}><Upload size={16} /></span><div style={{ flex: 1, minWidth: 0 }}><strong style={styles.evidenceName}>{file.file.name}</strong><span style={styles.evidenceMeta}>Ready to upload · {labelFor(EVIDENCE_OPTIONS, file.evidenceType)} · {formatFileSize(file.file.size)}</span></div><button type="button" style={styles.iconButton} onClick={() => setPendingFiles((current) => current.filter((entry) => entry.id !== file.id))}><X size={14} /></button></div>)}</div>
                        {editing && resolvedPermissions.canUploadEvidence ? <div style={styles.uploadRow}><select value={selectedEvidenceType} onChange={(event) => setSelectedEvidenceType(event.target.value as RegistrationEvidenceType)} style={styles.input} disabled={isDisabled}>{EVIDENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><button type="button" style={styles.secondaryButton} onClick={() => openFilePicker(item.id)} disabled={isDisabled}><Upload size={15} />Select evidence</button><span style={styles.helperText}>PDF, Word or image files up to 15 MB each.</span></div> : null}
                      </>}
                    </section>

                    {resolvedPermissions.canViewHistory ? <section style={styles.innerSection}><SectionHeader icon={<History size={17} />} title="Verification history" description="Review previous authoritative checks, outcomes and recorded restrictions." />{!item.verificationHistory.length ? <div style={styles.compactEmpty}>No previous verification checks recorded.</div> : <div style={styles.historyList}>{item.verificationHistory.map((entry) => <article key={entry.id} style={styles.historyCard}><span style={styles.historyMarker}><FileCheck2 size={14} /></span><div style={{ flex: 1 }}><div style={styles.historyHeader}><strong>{labelFor(STATUS_OPTIONS, entry.status)}</strong><span>{formatDateTime(entry.checkedAt)}</span></div><p style={styles.historyText}>Checked by {entry.checkedBy} · {entry.method}</p>{entry.expiryDate ? <p style={styles.historyText}>Expiry recorded: {formatDate(entry.expiryDate)}</p> : null}{entry.restrictionsFound ? <p style={styles.historyWarning}>Restrictions recorded: {entry.restrictionsSummary || "See registration record."}</p> : null}{entry.notes ? <p style={styles.historyNotes}>{entry.notes}</p> : null}</div></article>)}</div>}</section> : null}
                  </div> : null}
                </article>;
              })}
            </div>
          </section>
        </div>

        {editing ? <footer style={styles.footer}><div style={styles.changeSummary}>{isDirty ? <><span style={styles.unsavedDot} />Unsaved changes</> : <><Check size={14} />No unsaved changes</>}</div><div style={styles.footerActions}><button type="button" style={styles.tertiaryButton} onClick={resetChanges} disabled={!isDirty || isDisabled}><RotateCcw size={14} />Reset</button><button type="button" style={styles.secondaryButton} onClick={cancelEditing} disabled={isDisabled}><X size={15} />Cancel</button><button type="submit" style={styles.primaryButton} disabled={!isDirty || isDisabled || !onSave}>{isSaving ? <Loader2 size={15} className="leo-pr-spin" /> : <Save size={15} />}{isSaving ? "Saving..." : "Save registrations"}</button></div></footer> : null}
      </form>

      <style>{`@keyframes leo-pr-spin{to{transform:rotate(360deg)}}.leo-pr-spin{animation:leo-pr-spin .8s linear infinite}button:disabled,input:disabled,select:disabled,textarea:disabled{cursor:not-allowed;opacity:.6}input[type="checkbox"]{accent-color:#6E5084}`}</style>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { overflow: "hidden", border: "1px solid #E7DDED", borderRadius: 18, background: "#FFFFFF", boxShadow: "0 12px 32px rgba(71,49,81,.05)" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18, padding: "20px 22px", borderBottom: "1px solid #EEE5F2", background: "linear-gradient(135deg,#FFFFFF 0%,#FCF9FE 100%)" },
  identity: { display: "flex", alignItems: "center", gap: 13, minWidth: 0 },
  identityIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 13, background: "#F2EAF7", color: "#6E5084" },
  titleRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 9 },
  cardTitle: { margin: 0, color: "#342B38", fontSize: 17, fontWeight: 800 },
  cardSubtitle: { margin: "4px 0 0", color: "#847789", fontSize: 12 },
  statusBadge: { display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid", borderRadius: 999, padding: "5px 8px", fontSize: 10, fontWeight: 800 },
  headerActions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 9 },
  content: { display: "grid", gap: 18, padding: 22 },
  section: { display: "grid", gap: 17, padding: 20, border: "1px solid #ECE4F0", borderRadius: 15, background: "#FFFFFF" },
  innerSection: { display: "grid", gap: 16, padding: 18, border: "1px solid #EEE7F1", borderRadius: 13, background: "#FCFAFD" },
  sectionHeader: { display: "flex", alignItems: "flex-start", gap: 11 },
  sectionIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, flex: "0 0 auto", borderRadius: 10, background: "#F5EFF8", color: "#6E5084" },
  sectionTitle: { margin: 0, color: "#403545", fontSize: 14, fontWeight: 800 },
  sectionDescription: { margin: "4px 0 0", color: "#8B7F90", fontSize: 11, lineHeight: 1.5 },
  sectionActionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 17 },
  checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 7, minWidth: 0 },
  fieldLabel: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5, color: "#594D5E", fontSize: 11, fontWeight: 750 },
  requiredMark: { color: "#8E5F72" },
  sensitiveLabel: { display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 3, borderRadius: 999, background: "#F3EEF5", color: "#75687A", padding: "3px 6px", fontSize: 9, fontWeight: 750 },
  input: { width: "100%", minHeight: 42, boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: 10, outline: "none", background: "#FFFFFF", color: "#3F3543", padding: "10px 11px", font: "inherit", fontSize: 12 },
  textarea: { width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #DCCFE3", borderRadius: 10, outline: "none", background: "#FFFFFF", color: "#3F3543", padding: 11, font: "inherit", fontSize: 12, lineHeight: 1.55 },
  inputError: { borderColor: "#B97988", boxShadow: "0 0 0 3px rgba(185,121,136,.10)" },
  fieldError: { display: "flex", alignItems: "center", gap: 5, margin: 0, color: "#9A5668", fontSize: 10, lineHeight: 1.4 },
  readOnlyValue: { display: "flex", alignItems: "center", minHeight: 42, boxSizing: "border-box", border: "1px solid #EEE7F1", borderRadius: 10, background: "#FBF9FC", color: "#4D414F", padding: "10px 11px", fontSize: 12, lineHeight: 1.45, whiteSpace: "pre-wrap" },
  readOnlyEmpty: { color: "#A094A5", fontStyle: "italic" },
  restrictedValue: { display: "flex", alignItems: "center", gap: 7, minHeight: 42, boxSizing: "border-box", border: "1px solid #EEE7F1", borderRadius: 10, background: "#F8F5F9", color: "#847888", padding: "10px 11px", fontSize: 11, fontWeight: 700 },
  checkboxCard: { display: "flex", alignItems: "flex-start", gap: 9, minHeight: 64, boxSizing: "border-box", border: "1px solid #DED3E4", borderRadius: 10, background: "#FAF7FC", color: "#55495A", padding: 11, fontSize: 11, cursor: "pointer" },
  checkboxTitle: { display: "block", color: "#55495A", fontSize: 11 },
  checkboxDescription: { display: "block", marginTop: 3, color: "#8B7F90", fontSize: 10, lineHeight: 1.4 },
  registrationList: { display: "grid", gap: 14 },
  registrationCard: { overflow: "hidden", border: "1px solid #E5DCE9", borderRadius: 14, background: "#FFFFFF" },
  registrationHeader: { display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#FBF9FC" },
  registrationToggle: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, border: 0, background: "transparent", color: "inherit", padding: 4, cursor: "pointer" },
  registrationIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: "#F1EAF5", color: "#6E5084" },
  registrationTitle: { display: "block", overflow: "hidden", color: "#493D4D", fontSize: 12, textOverflow: "ellipsis", whiteSpace: "nowrap" },
  registrationSubtitle: { display: "block", marginTop: 3, color: "#8B7F90", fontSize: 10 },
  registrationBody: { display: "grid", gap: 14, padding: 14, borderTop: "1px solid #EEE7F1" },
  evidenceList: { display: "grid", gap: 9 },
  evidenceCard: { display: "flex", alignItems: "center", gap: 11, border: "1px solid #E7DFEB", borderRadius: 11, background: "#FFFFFF", padding: 11 },
  evidenceIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9, background: "#F3EDF7", color: "#6E5084" },
  evidenceName: { display: "block", overflow: "hidden", color: "#4A3E4E", fontSize: 11, textOverflow: "ellipsis", whiteSpace: "nowrap" },
  evidenceMeta: { display: "block", marginTop: 4, color: "#8B7F90", fontSize: 10 },
  uploadRow: { display: "grid", gridTemplateColumns: "minmax(220px,1fr) auto", alignItems: "center", gap: 10 },
  helperText: { gridColumn: "1 / -1", color: "#8C8091", fontSize: 10 },
  compactEmpty: { border: "1px dashed #DDD2E3", borderRadius: 11, background: "#FCFAFD", color: "#8A7E8F", padding: 14, fontSize: 11, textAlign: "center" },
  emptyState: { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 7, minHeight: 150, border: "1px dashed #DDD2E3", borderRadius: 12, background: "#FCFAFD", color: "#887C8D", padding: 20, textAlign: "center", fontSize: 11 },
  restrictedPanel: { display: "flex", alignItems: "flex-start", gap: 10, border: "1px solid #E5DDE9", borderRadius: 11, background: "#F9F6FA", color: "#746978", padding: 13, fontSize: 11, lineHeight: 1.5 },
  historyList: { display: "grid", gap: 12 },
  historyCard: { display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 0", borderBottom: "1px solid #F0EAF2" },
  historyMarker: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 999, background: "#F1EAF5", color: "#6E5084" },
  historyHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, color: "#4A3D4E", fontSize: 11 },
  historyText: { margin: "5px 0 0", color: "#7D7182", fontSize: 10, lineHeight: 1.5 },
  historyWarning: { margin: "7px 0 0", borderRadius: 8, background: "#FFF7F8", color: "#8B4E5D", padding: 8, fontSize: 10, lineHeight: 1.5 },
  historyNotes: { margin: "7px 0 0", borderRadius: 8, background: "#FAF7FC", color: "#675A6C", padding: 8, fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  errorBanner: { display: "flex", alignItems: "flex-start", gap: 9, margin: "18px 22px 0", border: "1px solid #E8CBD2", borderRadius: 11, background: "#FFF7F8", color: "#8B4E5D", padding: "11px 13px", fontSize: 11 },
  successBanner: { display: "flex", alignItems: "flex-start", gap: 9, margin: "18px 22px 0", border: "1px solid #CFE6D8", borderRadius: 11, background: "#F5FCF8", color: "#527460", padding: "11px 13px", fontSize: 11 },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, padding: "16px 22px", borderTop: "1px solid #EEE6F1", background: "#FCFAFD" },
  changeSummary: { display: "flex", alignItems: "center", gap: 7, color: "#7C7081", fontSize: 11, fontWeight: 650 },
  unsavedDot: { width: 7, height: 7, borderRadius: 999, background: "#8A6B9D" },
  footerActions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 },
  primaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 38, border: "1px solid #6E5084", borderRadius: 9, background: "#6E5084", color: "#FFFFFF", padding: "8px 13px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 38, border: "1px solid #DCCFE3", borderRadius: 9, background: "#FFFFFF", color: "#6E5084", padding: "8px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  tertiaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 38, border: 0, borderRadius: 9, background: "transparent", color: "#766A7A", padding: "8px 10px", fontSize: 11, fontWeight: 750, cursor: "pointer" },
  iconButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, border: "1px solid #E4DBE8", borderRadius: 9, background: "#FFFFFF", color: "#766A7A", cursor: "pointer" },
  accessCard: { display: "flex", alignItems: "flex-start", gap: 13, border: "1px solid #E6DCEB", borderRadius: 16, background: "#FBF8FC", padding: 20 },
  accessIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 11, background: "#F0E8F4", color: "#6E5084" },
  accessTitle: { margin: 0, color: "#493C4E", fontSize: 14, fontWeight: 800 },
  accessText: { margin: "5px 0 0", color: "#827687", fontSize: 11, lineHeight: 1.5 },
};