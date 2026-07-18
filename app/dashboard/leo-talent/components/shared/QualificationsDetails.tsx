"use client";

import {
  AlertCircle,
  Award,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileText,
  GraduationCap,
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

export type QualificationsDetailsMode = "candidate" | "employee";
export type QualificationStatus =
  | "not_assessed"
  | "awaiting_details"
  | "awaiting_evidence"
  | "verification_required"
  | "verified"
  | "renewal_due"
  | "expired"
  | "rejected"
  | "not_required";
export type QualificationRequirement =
  | "essential"
  | "desirable"
  | "development"
  | "regulatory"
  | "professional_membership"
  | "other";
export type QualificationEvidenceType =
  | "certificate"
  | "transcript"
  | "award_letter"
  | "professional_membership"
  | "licence"
  | "verification_response"
  | "renewal_confirmation"
  | "equivalency_assessment"
  | "other";

export type QualificationEvidence = {
  id: string;
  evidenceType: QualificationEvidenceType;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  current?: boolean;
};

export type QualificationVerificationHistoryEntry = {
  id: string;
  checkedAt: string;
  checkedBy: string;
  status: QualificationStatus;
  method?: string;
  referenceChecked?: string;
  notes?: string;
};

export type QualificationRecord = {
  id: string;
  qualificationName: string;
  subjectOrSpecialism: string;
  requirement: QualificationRequirement;
  level: string;
  awardingBody: string;
  institution: string;
  countryOfAward: string;
  registrationOrCertificateNumber: string;
  professionalBody: string;
  membershipNumber: string;
  dateStarted: string;
  dateAwarded: string;
  expiryDate: string;
  renewalDate: string;
  gradeOrResult: string;
  creditValue: string;
  status: QualificationStatus;
  evidenceSeen: boolean;
  originalDocumentSeen: boolean;
  digitalVerificationCompleted: boolean;
  awardingBodyVerified: boolean;
  verifiedDate: string;
  verifiedBy: string;
  verificationMethod: string;
  verificationReference: string;
  roleRequirementMet: boolean;
  equivalencyRequired: boolean;
  equivalencyConfirmed: boolean;
  equivalencyDetails: string;
  restrictionsOrConditions: string;
  notes: string;
  evidence: QualificationEvidence[];
  verificationHistory: QualificationVerificationHistoryEntry[];
};

export type QualificationsDetailsValue = {
  qualificationRequiredForRole: boolean;
  minimumQualificationRequirement: string;
  regulatoryRequirementApplies: boolean;
  professionalRegistrationRequired: boolean;
  overallStatus: QualificationStatus;
  nextReviewDate: string;
  summaryNotes: string;
  qualifications: QualificationRecord[];
};

export type QualificationsDetailsPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewCertificateNumbers: boolean;
  canEditCertificateNumbers: boolean;
  canViewProfessionalMembership: boolean;
  canEditProfessionalMembership: boolean;
  canVerifyQualifications: boolean;
  canApproveEquivalency: boolean;
  canAddQualification: boolean;
  canDeleteQualification: boolean;
  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;
  canViewHistory: boolean;
};

export type QualificationsDetailsSavePayload = {
  value: QualificationsDetailsValue;
  changedFields: string[];
  newFiles: Array<{
    qualificationId: string;
    file: File;
    evidenceType: QualificationEvidenceType;
  }>;
  removedEvidenceIds: string[];
  removedQualificationIds: string[];
};

export type QualificationsDetailsAuditEvent = {
  action:
    | "qualifications_edit_started"
    | "qualifications_edit_cancelled"
    | "qualifications_saved"
    | "qualification_added"
    | "qualification_removed"
    | "qualification_evidence_selected"
    | "qualification_evidence_removed"
    | "qualification_verified"
    | "qualification_equivalency_confirmed";
  mode: QualificationsDetailsMode;
  recordId?: string | number;
  qualificationId?: string;
  evidenceId?: string;
  changedFields?: string[];
  occurredAt: string;
};

export type QualificationsDetailsProps = {
  mode: QualificationsDetailsMode;
  value?: Partial<QualificationsDetailsValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<QualificationsDetailsPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (payload: QualificationsDetailsSavePayload) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (event: QualificationsDetailsAuditEvent) => Promise<void> | void;
};

type ValidationErrors = Record<string, string>;
type PendingFile = {
  id: string;
  qualificationId: string;
  file: File;
  evidenceType: QualificationEvidenceType;
};

const STATUS_OPTIONS: Array<{ value: QualificationStatus; label: string }> = [
  { value: "not_assessed", label: "Not assessed" },
  { value: "awaiting_details", label: "Awaiting details" },
  { value: "awaiting_evidence", label: "Awaiting evidence" },
  { value: "verification_required", label: "Verification required" },
  { value: "verified", label: "Verified" },
  { value: "renewal_due", label: "Renewal due" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
  { value: "not_required", label: "Not required" },
];

const REQUIREMENT_OPTIONS: Array<{ value: QualificationRequirement; label: string }> = [
  { value: "essential", label: "Essential" },
  { value: "desirable", label: "Desirable" },
  { value: "development", label: "Development requirement" },
  { value: "regulatory", label: "Regulatory requirement" },
  { value: "professional_membership", label: "Professional membership" },
  { value: "other", label: "Other" },
];

const EVIDENCE_OPTIONS: Array<{ value: QualificationEvidenceType; label: string }> = [
  { value: "certificate", label: "Certificate" },
  { value: "transcript", label: "Transcript" },
  { value: "award_letter", label: "Award letter" },
  { value: "professional_membership", label: "Professional membership" },
  { value: "licence", label: "Licence" },
  { value: "verification_response", label: "Verification response" },
  { value: "renewal_confirmation", label: "Renewal confirmation" },
  { value: "equivalency_assessment", label: "Equivalency assessment" },
  { value: "other", label: "Other" },
];

const DEFAULT_PERMISSIONS: QualificationsDetailsPermissions = {
  canView: true,
  canEdit: true,
  canViewCertificateNumbers: true,
  canEditCertificateNumbers: true,
  canViewProfessionalMembership: true,
  canEditProfessionalMembership: true,
  canVerifyQualifications: true,
  canApproveEquivalency: true,
  canAddQualification: true,
  canDeleteQualification: true,
  canViewEvidence: true,
  canUploadEvidence: true,
  canDeleteEvidence: true,
  canViewHistory: true,
};

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `qualification-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyQualification = (): QualificationRecord => ({
  id: makeId(),
  qualificationName: "",
  subjectOrSpecialism: "",
  requirement: "essential",
  level: "",
  awardingBody: "",
  institution: "",
  countryOfAward: "United Kingdom",
  registrationOrCertificateNumber: "",
  professionalBody: "",
  membershipNumber: "",
  dateStarted: "",
  dateAwarded: "",
  expiryDate: "",
  renewalDate: "",
  gradeOrResult: "",
  creditValue: "",
  status: "not_assessed",
  evidenceSeen: false,
  originalDocumentSeen: false,
  digitalVerificationCompleted: false,
  awardingBodyVerified: false,
  verifiedDate: "",
  verifiedBy: "",
  verificationMethod: "",
  verificationReference: "",
  roleRequirementMet: false,
  equivalencyRequired: false,
  equivalencyConfirmed: false,
  equivalencyDetails: "",
  restrictionsOrConditions: "",
  notes: "",
  evidence: [],
  verificationHistory: [],
});

const emptyValue: QualificationsDetailsValue = {
  qualificationRequiredForRole: false,
  minimumQualificationRequirement: "",
  regulatoryRequirementApplies: false,
  professionalRegistrationRequired: false,
  overallStatus: "not_assessed",
  nextReviewDate: "",
  summaryNotes: "",
  qualifications: [],
};

function normaliseValue(value?: Partial<QualificationsDetailsValue>): QualificationsDetailsValue {
  return {
    ...emptyValue,
    ...value,
    qualifications: (value?.qualifications ?? []).map((item) => ({
      ...emptyQualification(),
      ...item,
      id: item.id || makeId(),
      evidence: item.evidence ?? [],
      verificationHistory: item.verificationHistory ?? [],
    })),
  };
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(parsed);
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(parsed);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function statusLabel(value: QualificationStatus) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function validate(value: QualificationsDetailsValue): ValidationErrors {
  const errors: ValidationErrors = {};
  if (value.qualificationRequiredForRole && !value.minimumQualificationRequirement.trim()) {
    errors.minimumQualificationRequirement = "Record the minimum qualification requirement.";
  }
  if (value.qualificationRequiredForRole && value.qualifications.length === 0) {
    errors.qualifications = "Add at least one qualification record.";
  }
  value.qualifications.forEach((item) => {
    const prefix = `qualifications.${item.id}`;
    if (!item.qualificationName.trim()) errors[`${prefix}.qualificationName`] = "Enter the qualification name.";
    if (!item.awardingBody.trim()) errors[`${prefix}.awardingBody`] = "Enter the awarding body.";
    if (item.dateStarted && item.dateAwarded && item.dateAwarded < item.dateStarted) errors[`${prefix}.dateAwarded`] = "Award date cannot be before the start date.";
    if (item.dateAwarded && item.expiryDate && item.expiryDate < item.dateAwarded) errors[`${prefix}.expiryDate`] = "Expiry date cannot be before the award date.";
    if (item.status === "verified" && !item.verifiedDate) errors[`${prefix}.verifiedDate`] = "Enter the verification date.";
    if (item.status === "verified" && !item.verifiedBy.trim()) errors[`${prefix}.verifiedBy`] = "Enter who verified the qualification.";
    if (item.status === "verified" && !item.verificationMethod.trim()) errors[`${prefix}.verificationMethod`] = "Record the verification method.";
    if (item.equivalencyRequired && item.equivalencyConfirmed && !item.equivalencyDetails.trim()) errors[`${prefix}.equivalencyDetails`] = "Record the equivalency assessment details.";
  });
  return errors;
}

const Field = ({ label, children, error, restricted }: { label: string; children: ReactNode; error?: string; restricted?: boolean }) => (
  <div style={styles.field}>
    <label style={styles.label}>
      {label}
      {restricted ? <span style={styles.restricted}><LockKeyhole size={10} /> Restricted</span> : null}
    </label>
    {children}
    {error ? <p style={styles.error}><AlertCircle size={12} />{error}</p> : null}
  </div>
);

const ReadOnly = ({ value, restricted }: { value?: string; restricted?: boolean }) => (
  <div style={styles.readOnly}>
    {restricted ? <><LockKeyhole size={13} />Restricted</> : value || "Not recorded"}
  </div>
);

const SectionHeader = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => (
  <div style={styles.sectionHeader}>
    <span style={styles.sectionIcon}>{icon}</span>
    <div><h3 style={styles.sectionTitle}>{title}</h3><p style={styles.sectionDescription}>{description}</p></div>
  </div>
);

export default function QualificationsDetails({
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
}: QualificationsDetailsProps) {
  const resolvedPermissions = useMemo(() => ({ ...DEFAULT_PERMISSIONS, ...permissions }), [permissions]);
  const supplied = useMemo(() => normaliseValue(value), [value]);
  const [original, setOriginal] = useState(supplied);
  const [draft, setDraft] = useState(supplied);
  const [editing, setEditing] = useState(startInEditMode && resolvedPermissions.canEdit);
  const [expanded, setExpanded] = useState<string[]>(supplied.qualifications.map((item) => item.id));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState<string[]>([]);
  const [removedQualificationIds, setRemovedQualificationIds] = useState<string[]>([]);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [evidenceType, setEvidenceType] = useState<QualificationEvidenceType>("certificate");
  const [localSaving, setLocalSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setOriginal(supplied);
    setDraft(supplied);
    setExpanded(supplied.qualifications.map((item) => item.id));
    setErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setRemovedQualificationIds([]);
  }, [supplied]);

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;
  const changedFields = useMemo(() => {
    const fields: string[] = [];
    if (JSON.stringify(original) !== JSON.stringify(draft)) fields.push("qualifications");
    if (pendingFiles.length) fields.push("newFiles");
    if (removedEvidenceIds.length) fields.push("removedEvidence");
    if (removedQualificationIds.length) fields.push("removedQualifications");
    return fields;
  }, [original, draft, pendingFiles, removedEvidenceIds, removedQualificationIds]);
  const isDirty = changedFields.length > 0;

  const audit = async (action: QualificationsDetailsAuditEvent["action"], extra?: Partial<QualificationsDetailsAuditEvent>) => {
    await onAudit?.({ action, mode, recordId, occurredAt: new Date().toISOString(), ...extra });
  };

  const updateRoot = <K extends keyof QualificationsDetailsValue>(key: K, next: QualificationsDetailsValue[K]) => {
    setDraft((current) => ({ ...current, [key]: next }));
    setErrors((current) => { const nextErrors = { ...current }; delete nextErrors[String(key)]; return nextErrors; });
  };

  const updateQualification = <K extends keyof QualificationRecord>(id: string, key: K, next: QualificationRecord[K]) => {
    setDraft((current) => ({
      ...current,
      qualifications: current.qualifications.map((item) => item.id === id ? { ...item, [key]: next } : item),
    }));
    const errorKey = `qualifications.${id}.${String(key)}`;
    setErrors((current) => { const nextErrors = { ...current }; delete nextErrors[errorKey]; return nextErrors; });
  };

  const addQualification = async () => {
    const item = emptyQualification();
    setDraft((current) => ({ ...current, qualifications: [...current.qualifications, item] }));
    setExpanded((current) => [...current, item.id]);
    await audit("qualification_added", { qualificationId: item.id });
  };

  const removeQualification = async (id: string) => {
    if (original.qualifications.some((item) => item.id === id)) setRemovedQualificationIds((current) => [...new Set([...current, id])]);
    setDraft((current) => ({ ...current, qualifications: current.qualifications.filter((item) => item.id !== id) }));
    setPendingFiles((current) => current.filter((item) => item.qualificationId !== id));
    await audit("qualification_removed", { qualificationId: id });
  };

  const selectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!uploadTarget) return;
    const files = Array.from(event.target.files ?? []).filter((file) => file.size <= 15 * 1024 * 1024);
    setPendingFiles((current) => [...current, ...files.map((file) => ({ id: makeId(), qualificationId: uploadTarget, file, evidenceType }))]);
    await audit("qualification_evidence_selected", { qualificationId: uploadTarget });
    event.target.value = "";
  };

  const removeEvidence = async (qualificationId: string, evidenceId: string) => {
    setRemovedEvidenceIds((current) => [...new Set([...current, evidenceId])]);
    await audit("qualification_evidence_removed", { qualificationId, evidenceId });
  };

  const cancel = async () => {
    setDraft(original);
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setRemovedQualificationIds([]);
    setErrors({});
    setEditing(false);
    onCancel?.();
    await audit("qualifications_edit_cancelled");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSave || isDisabled) return;
    const validation = validate(draft);
    if (Object.keys(validation).length) { setErrors(validation); return; }
    try {
      setLocalSaving(true);
      await onSave({
        value: draft,
        changedFields,
        newFiles: pendingFiles.map(({ qualificationId, file, evidenceType }) => ({ qualificationId, file, evidenceType })),
        removedEvidenceIds,
        removedQualificationIds,
      });
      setOriginal(draft);
      setPendingFiles([]);
      setRemovedEvidenceIds([]);
      setRemovedQualificationIds([]);
      setEditing(false);
      await audit("qualifications_saved", { changedFields });
    } finally {
      setLocalSaving(false);
    }
  };

  if (!resolvedPermissions.canView) {
    return <section style={styles.access}><LockKeyhole size={20} /><div><h2>Qualification information is restricted</h2><p>Your current permission level does not allow access to this record.</p></div></section>;
  }

  return (
    <section style={styles.card}>
      <header style={styles.cardHeader}>
        <div style={styles.identity}>
          <span style={styles.identityIcon}><GraduationCap size={21} /></span>
          <div><div style={styles.titleRow}><h2 style={styles.cardTitle}>Qualifications</h2><span style={styles.badge}>{statusLabel(draft.overallStatus)}</span></div><p style={styles.subtitle}>{recordLabel || (mode === "candidate" ? "Candidate record" : "Employee record")}{recordId !== undefined ? ` · Record ${recordId}` : ""}</p></div>
        </div>
        <div style={styles.actions}>{headerActions}{!editing && resolvedPermissions.canEdit ? <button type="button" style={styles.secondaryButton} disabled={isDisabled} onClick={async () => { setEditing(true); await audit("qualifications_edit_started"); }}><Pencil size={15} />Edit qualifications</button> : null}</div>
      </header>

      {errorMessage ? <div style={styles.errorBanner}><AlertCircle size={16} />{errorMessage}</div> : null}
      {successMessage ? <div style={styles.successBanner}><Check size={16} />{successMessage}</div> : null}

      <form onSubmit={submit}>
        <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={selectFiles} style={{ display: "none" }} />
        <div style={styles.content}>
          <section style={styles.section}>
            <SectionHeader icon={<ShieldCheck size={18} />} title="Role qualification requirements" description="Record the minimum qualification and registration requirements that apply." />
            <div style={styles.grid}>
              <Field label="Overall status">{editing ? <select style={styles.input} value={draft.overallStatus} disabled={isDisabled} onChange={(e) => updateRoot("overallStatus", e.target.value as QualificationStatus)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={statusLabel(draft.overallStatus)} />}</Field>
              <Field label="Next review date">{editing ? <input style={styles.input} type="date" value={draft.nextReviewDate} disabled={isDisabled} onChange={(e) => updateRoot("nextReviewDate", e.target.value)} /> : <ReadOnly value={draft.nextReviewDate ? formatDate(draft.nextReviewDate) : ""} />}</Field>
              <Field label="Minimum qualification requirement" error={errors.minimumQualificationRequirement}>{editing ? <textarea style={{ ...styles.textarea, ...(errors.minimumQualificationRequirement ? styles.inputError : {}) }} rows={3} value={draft.minimumQualificationRequirement} disabled={isDisabled} onChange={(e) => updateRoot("minimumQualificationRequirement", e.target.value)} /> : <ReadOnly value={draft.minimumQualificationRequirement} />}</Field>
              <Field label="Summary notes">{editing ? <textarea style={styles.textarea} rows={3} value={draft.summaryNotes} disabled={isDisabled} onChange={(e) => updateRoot("summaryNotes", e.target.value)} /> : <ReadOnly value={draft.summaryNotes} />}</Field>
            </div>
            <div style={styles.checkboxGrid}>
              {([
                ["qualificationRequiredForRole", "Qualification required for role"],
                ["regulatoryRequirementApplies", "Regulatory requirement applies"],
                ["professionalRegistrationRequired", "Professional registration required"],
              ] as const).map(([key, label]) => <label key={key} style={styles.checkboxCard}><input type="checkbox" checked={draft[key]} disabled={!editing || isDisabled} onChange={(e) => updateRoot(key, e.target.checked)} /><span>{label}</span></label>)}
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionActionHeader}><SectionHeader icon={<Award size={18} />} title="Qualification records" description="Add and verify each qualification, licence or professional membership separately." />{editing && resolvedPermissions.canAddQualification ? <button type="button" style={styles.secondaryButton} onClick={addQualification} disabled={isDisabled}><Plus size={15} />Add qualification</button> : null}</div>
            {errors.qualifications ? <p style={styles.error}><AlertCircle size={12} />{errors.qualifications}</p> : null}
            {draft.qualifications.length === 0 ? <div style={styles.empty}><GraduationCap size={24} /><strong>No qualifications recorded</strong><span>Add a qualification to begin.</span></div> : null}

            <div style={styles.list}>
              {draft.qualifications.map((qualification, index) => {
                const isOpen = expanded.includes(qualification.id);
                const fieldError = (field: keyof QualificationRecord) => errors[`qualifications.${qualification.id}.${String(field)}`];
                const evidence = qualification.evidence.filter((item) => !removedEvidenceIds.includes(item.id));
                const queued = pendingFiles.filter((item) => item.qualificationId === qualification.id);
                return <article key={qualification.id} style={styles.recordCard}>
                  <header style={styles.recordHeader}>
                    <button type="button" style={styles.recordToggle} onClick={() => setExpanded((current) => current.includes(qualification.id) ? current.filter((id) => id !== qualification.id) : [...current, qualification.id])}>
                      <span style={styles.recordIcon}><Award size={17} /></span><span style={{ flex: 1, textAlign: "left" }}><strong>{qualification.qualificationName || `Qualification ${index + 1}`}</strong><small style={styles.small}>{REQUIREMENT_OPTIONS.find((o) => o.value === qualification.requirement)?.label} · {qualification.level || "Level not recorded"}</small></span><span style={styles.badge}>{statusLabel(qualification.status)}</span><ChevronDown size={16} style={{ transform: isOpen ? "rotate(180deg)" : undefined }} />
                    </button>
                    {editing && resolvedPermissions.canDeleteQualification ? <button type="button" style={styles.iconButton} disabled={isDisabled} onClick={() => removeQualification(qualification.id)}><Trash2 size={15} /></button> : null}
                  </header>

                  {isOpen ? <div style={styles.recordBody}>
                    <SectionHeader icon={<GraduationCap size={17} />} title="Qualification details" description="Record the award, subject, level and issuing body." />
                    <div style={styles.grid}>
                      <Field label="Qualification name" error={fieldError("qualificationName")}>{editing ? <input style={{ ...styles.input, ...(fieldError("qualificationName") ? styles.inputError : {}) }} value={qualification.qualificationName} onChange={(e) => updateQualification(qualification.id, "qualificationName", e.target.value)} /> : <ReadOnly value={qualification.qualificationName} />}</Field>
                      <Field label="Subject or specialism">{editing ? <input style={styles.input} value={qualification.subjectOrSpecialism} onChange={(e) => updateQualification(qualification.id, "subjectOrSpecialism", e.target.value)} /> : <ReadOnly value={qualification.subjectOrSpecialism} />}</Field>
                      <Field label="Requirement type">{editing ? <select style={styles.input} value={qualification.requirement} onChange={(e) => updateQualification(qualification.id, "requirement", e.target.value as QualificationRequirement)}>{REQUIREMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={REQUIREMENT_OPTIONS.find((o) => o.value === qualification.requirement)?.label} />}</Field>
                      <Field label="Qualification level">{editing ? <input style={styles.input} value={qualification.level} onChange={(e) => updateQualification(qualification.id, "level", e.target.value)} placeholder="For example, Level 3 or Degree" /> : <ReadOnly value={qualification.level} />}</Field>
                      <Field label="Awarding body" error={fieldError("awardingBody")}>{editing ? <input style={{ ...styles.input, ...(fieldError("awardingBody") ? styles.inputError : {}) }} value={qualification.awardingBody} onChange={(e) => updateQualification(qualification.id, "awardingBody", e.target.value)} /> : <ReadOnly value={qualification.awardingBody} />}</Field>
                      <Field label="Institution or provider">{editing ? <input style={styles.input} value={qualification.institution} onChange={(e) => updateQualification(qualification.id, "institution", e.target.value)} /> : <ReadOnly value={qualification.institution} />}</Field>
                      <Field label="Country of award">{editing ? <input style={styles.input} value={qualification.countryOfAward} onChange={(e) => updateQualification(qualification.id, "countryOfAward", e.target.value)} /> : <ReadOnly value={qualification.countryOfAward} />}</Field>
                      <Field label="Grade or result">{editing ? <input style={styles.input} value={qualification.gradeOrResult} onChange={(e) => updateQualification(qualification.id, "gradeOrResult", e.target.value)} /> : <ReadOnly value={qualification.gradeOrResult} />}</Field>
                    </div>

                    <SectionHeader icon={<CalendarClock size={17} />} title="Dates and renewal" description="Record award, expiry and renewal dates." />
                    <div style={styles.grid}>
                      {(["dateStarted", "dateAwarded", "expiryDate", "renewalDate"] as const).map((key) => <Field key={key} label={{ dateStarted: "Date started", dateAwarded: "Date awarded", expiryDate: "Expiry date", renewalDate: "Renewal date" }[key]} error={fieldError(key)}>{editing ? <input type="date" style={{ ...styles.input, ...(fieldError(key) ? styles.inputError : {}) }} value={qualification[key]} onChange={(e) => updateQualification(qualification.id, key, e.target.value)} /> : <ReadOnly value={qualification[key] ? formatDate(qualification[key]) : ""} />}</Field>)}
                    </div>

                    <SectionHeader icon={<FileCheck2 size={17} />} title="Verification" description="Record certificate references and verification decisions." />
                    <div style={styles.grid}>
                      <Field label="Certificate or registration number" restricted>{resolvedPermissions.canViewCertificateNumbers ? (editing && resolvedPermissions.canEditCertificateNumbers ? <input style={styles.input} value={qualification.registrationOrCertificateNumber} onChange={(e) => updateQualification(qualification.id, "registrationOrCertificateNumber", e.target.value)} /> : <ReadOnly value={qualification.registrationOrCertificateNumber} />) : <ReadOnly restricted />}</Field>
                      <Field label="Professional body" restricted>{resolvedPermissions.canViewProfessionalMembership ? (editing && resolvedPermissions.canEditProfessionalMembership ? <input style={styles.input} value={qualification.professionalBody} onChange={(e) => updateQualification(qualification.id, "professionalBody", e.target.value)} /> : <ReadOnly value={qualification.professionalBody} />) : <ReadOnly restricted />}</Field>
                      <Field label="Membership number" restricted>{resolvedPermissions.canViewProfessionalMembership ? (editing && resolvedPermissions.canEditProfessionalMembership ? <input style={styles.input} value={qualification.membershipNumber} onChange={(e) => updateQualification(qualification.id, "membershipNumber", e.target.value)} /> : <ReadOnly value={qualification.membershipNumber} />) : <ReadOnly restricted />}</Field>
                      <Field label="Status">{editing ? <select style={styles.input} value={qualification.status} onChange={(e) => updateQualification(qualification.id, "status", e.target.value as QualificationStatus)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={statusLabel(qualification.status)} />}</Field>
                      <Field label="Verification date" error={fieldError("verifiedDate")}>{editing && resolvedPermissions.canVerifyQualifications ? <input type="date" style={styles.input} value={qualification.verifiedDate} onChange={(e) => updateQualification(qualification.id, "verifiedDate", e.target.value)} /> : <ReadOnly value={qualification.verifiedDate ? formatDate(qualification.verifiedDate) : ""} />}</Field>
                      <Field label="Verified by" error={fieldError("verifiedBy")}>{editing && resolvedPermissions.canVerifyQualifications ? <input style={styles.input} value={qualification.verifiedBy} onChange={(e) => updateQualification(qualification.id, "verifiedBy", e.target.value)} /> : <ReadOnly value={qualification.verifiedBy} />}</Field>
                      <Field label="Verification method" error={fieldError("verificationMethod")}>{editing && resolvedPermissions.canVerifyQualifications ? <input style={styles.input} value={qualification.verificationMethod} onChange={(e) => updateQualification(qualification.id, "verificationMethod", e.target.value)} /> : <ReadOnly value={qualification.verificationMethod} />}</Field>
                      <Field label="Verification reference" restricted>{editing && resolvedPermissions.canVerifyQualifications ? <input style={styles.input} value={qualification.verificationReference} onChange={(e) => updateQualification(qualification.id, "verificationReference", e.target.value)} /> : <ReadOnly value={qualification.verificationReference} />}</Field>
                    </div>

                    <div style={styles.checkboxGrid}>
                      {(["evidenceSeen", "originalDocumentSeen", "digitalVerificationCompleted", "awardingBodyVerified", "roleRequirementMet", "equivalencyRequired", "equivalencyConfirmed"] as const).map((key) => <label key={key} style={styles.checkboxCard}><input type="checkbox" checked={qualification[key]} disabled={!editing || isDisabled || (key === "equivalencyConfirmed" && !resolvedPermissions.canApproveEquivalency)} onChange={(e) => updateQualification(qualification.id, key, e.target.checked)} /><span>{({ evidenceSeen: "Evidence seen", originalDocumentSeen: "Original document seen", digitalVerificationCompleted: "Digital verification completed", awardingBodyVerified: "Awarding body verified", roleRequirementMet: "Role requirement met", equivalencyRequired: "Equivalency required", equivalencyConfirmed: "Equivalency confirmed" } as const)[key]}</span></label>)}
                    </div>

                    <div style={styles.grid}>
                      <Field label="Equivalency details" error={fieldError("equivalencyDetails")}>{editing ? <textarea style={styles.textarea} rows={3} value={qualification.equivalencyDetails} onChange={(e) => updateQualification(qualification.id, "equivalencyDetails", e.target.value)} /> : <ReadOnly value={qualification.equivalencyDetails} />}</Field>
                      <Field label="Restrictions or conditions">{editing ? <textarea style={styles.textarea} rows={3} value={qualification.restrictionsOrConditions} onChange={(e) => updateQualification(qualification.id, "restrictionsOrConditions", e.target.value)} /> : <ReadOnly value={qualification.restrictionsOrConditions} />}</Field>
                      <Field label="Notes">{editing ? <textarea style={styles.textarea} rows={3} value={qualification.notes} onChange={(e) => updateQualification(qualification.id, "notes", e.target.value)} /> : <ReadOnly value={qualification.notes} />}</Field>
                    </div>

                    {resolvedPermissions.canViewEvidence ? <section style={styles.innerSection}>
                      <SectionHeader icon={<FileText size={17} />} title="Supporting evidence" description="Store certificates, transcripts, licences and verification responses." />
                      {evidence.length === 0 && queued.length === 0 ? <div style={styles.empty}><FileText size={22} /><strong>No evidence uploaded</strong></div> : null}
                      <div style={styles.evidenceList}>
                        {evidence.map((item) => <div key={item.id} style={styles.evidenceCard}><span style={styles.fileIcon}><FileText size={16} /></span><div style={{ flex: 1 }}><strong>{item.fileName}</strong><small style={styles.small}>{EVIDENCE_OPTIONS.find((o) => o.value === item.evidenceType)?.label} · {formatFileSize(item.fileSizeBytes)} · {formatDateTime(item.uploadedAt)}</small></div>{editing && resolvedPermissions.canDeleteEvidence ? <button type="button" style={styles.iconButton} onClick={() => removeEvidence(qualification.id, item.id)}><Trash2 size={14} /></button> : null}</div>)}
                        {queued.map((item) => <div key={item.id} style={styles.evidenceCard}><span style={styles.fileIcon}><Upload size={16} /></span><div style={{ flex: 1 }}><strong>{item.file.name}</strong><small style={styles.small}>Ready to upload · {formatFileSize(item.file.size)}</small></div><button type="button" style={styles.iconButton} onClick={() => setPendingFiles((current) => current.filter((file) => file.id !== item.id))}><X size={14} /></button></div>)}
                      </div>
                      {editing && resolvedPermissions.canUploadEvidence ? <div style={styles.uploadRow}><select style={styles.input} value={evidenceType} onChange={(e) => setEvidenceType(e.target.value as QualificationEvidenceType)}>{EVIDENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select><button type="button" style={styles.secondaryButton} onClick={() => { setUploadTarget(qualification.id); requestAnimationFrame(() => fileRef.current?.click()); }}><Upload size={15} />Add evidence</button></div> : null}
                    </section> : null}

                    {resolvedPermissions.canViewHistory ? <section style={styles.innerSection}>
                      <SectionHeader icon={<History size={17} />} title="Verification history" description="Previous checks and decisions remain available for audit purposes." />
                      {qualification.verificationHistory.length === 0 ? <div style={styles.empty}><History size={22} /><strong>No verification history recorded</strong></div> : <div style={styles.historyList}>{qualification.verificationHistory.map((entry) => <article key={entry.id} style={styles.historyCard}><span style={styles.historyIcon}><CheckCircle2 size={14} /></span><div><strong>{statusLabel(entry.status)}</strong><p>{formatDateTime(entry.checkedAt)} · {entry.checkedBy}</p>{entry.method ? <p>{entry.method}</p> : null}{entry.notes ? <p>{entry.notes}</p> : null}</div></article>)}</div>}
                    </section> : null}
                  </div> : null}
                </article>;
              })}
            </div>
          </section>
        </div>

        {editing ? <footer style={styles.footer}>
          <div style={styles.saveState}>{isDirty ? <><span style={styles.dot} />Unsaved changes</> : <><Check size={14} />No unsaved changes</>}</div>
          <div style={styles.actions}>
            <button type="button" style={styles.tertiaryButton} disabled={!isDirty || isDisabled} onClick={() => { setDraft(original); setPendingFiles([]); setRemovedEvidenceIds([]); setRemovedQualificationIds([]); setErrors({}); }}><RotateCcw size={14} />Reset</button>
            <button type="button" style={styles.secondaryButton} disabled={isDisabled} onClick={cancel}><X size={15} />Cancel</button>
            <button type="submit" style={styles.primaryButton} disabled={!isDirty || isDisabled || !onSave}>{isSaving ? <Loader2 size={15} className="leo-spin" /> : <Save size={15} />}{isSaving ? "Saving..." : "Save qualifications"}</button>
          </div>
        </footer> : null}
      </form>
      <style>{`@keyframes leo-spin{to{transform:rotate(360deg)}}.leo-spin{animation:leo-spin .8s linear infinite}button:disabled,input:disabled,select:disabled,textarea:disabled{cursor:not-allowed;opacity:.6}input[type=checkbox]{accent-color:#6E5084}`}</style>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { border: "1px solid #E7DDED", borderRadius: 18, background: "#fff", overflow: "hidden", boxShadow: "0 12px 32px rgba(71,49,81,.05)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "20px 22px", borderBottom: "1px solid #EEE5F2", background: "linear-gradient(135deg,#fff,#FCF9FE)" },
  identity: { display: "flex", alignItems: "center", gap: 12 },
  identityIcon: { width: 42, height: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 13, background: "#F2EAF7", color: "#6E5084" },
  titleRow: { display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" },
  cardTitle: { margin: 0, fontSize: 17, color: "#342B38" },
  subtitle: { margin: "4px 0 0", color: "#847789", fontSize: 12 },
  badge: { display: "inline-flex", alignItems: "center", border: "1px solid #DDD2E3", borderRadius: 999, background: "#F8F5FA", color: "#6E5084", padding: "5px 8px", fontSize: 10, fontWeight: 800 },
  actions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  content: { display: "grid", gap: 18, padding: 22 },
  section: { display: "grid", gap: 16, padding: 20, border: "1px solid #ECE4F0", borderRadius: 15 },
  innerSection: { display: "grid", gap: 14, paddingTop: 4 },
  sectionHeader: { display: "flex", alignItems: "flex-start", gap: 11 },
  sectionIcon: { width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "#F5EFF8", color: "#6E5084" },
  sectionTitle: { margin: 0, fontSize: 14, color: "#403545" },
  sectionDescription: { margin: "4px 0 0", color: "#8B7F90", fontSize: 11, lineHeight: 1.5 },
  sectionActionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 },
  checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 },
  checkboxCard: { display: "flex", alignItems: "center", gap: 9, minHeight: 48, border: "1px solid #DED3E4", borderRadius: 10, background: "#FAF7FC", padding: 11, fontSize: 11 },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { display: "flex", alignItems: "center", gap: 6, color: "#594D5E", fontSize: 11, fontWeight: 750 },
  restricted: { display: "inline-flex", alignItems: "center", gap: 3, background: "#F3EEF5", borderRadius: 999, padding: "3px 6px", fontSize: 9 },
  input: { width: "100%", minHeight: 42, boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: 10, background: "#fff", color: "#3F3543", padding: "10px 11px", font: "inherit", fontSize: 12 },
  textarea: { width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #DCCFE3", borderRadius: 10, padding: 11, font: "inherit", fontSize: 12 },
  inputError: { borderColor: "#B97988", boxShadow: "0 0 0 3px rgba(185,121,136,.1)" },
  error: { display: "flex", gap: 5, alignItems: "center", margin: 0, color: "#9A5668", fontSize: 10 },
  readOnly: { minHeight: 42, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 7, border: "1px solid #EEE7F1", borderRadius: 10, background: "#FBF9FC", color: "#4D414F", padding: "10px 11px", fontSize: 12, whiteSpace: "pre-wrap" },
  list: { display: "grid", gap: 12 },
  recordCard: { border: "1px solid #E7DFEB", borderRadius: 13, overflow: "hidden" },
  recordHeader: { display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#FCFAFD" },
  recordToggle: { flex: 1, display: "flex", alignItems: "center", gap: 10, border: 0, background: "transparent", color: "#4A3E4E", cursor: "pointer" },
  recordIcon: { width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F2EAF7", color: "#6E5084" },
  recordBody: { display: "grid", gap: 18, padding: 18, borderTop: "1px solid #EEE7F1" },
  small: { display: "block", marginTop: 4, color: "#8B7F90", fontSize: 10 },
  evidenceList: { display: "grid", gap: 8 },
  evidenceCard: { display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid #E7DFEB", borderRadius: 10 },
  fileIcon: { width: 32, height: 32, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F3EDF7", color: "#6E5084" },
  uploadRow: { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" },
  historyList: { display: "grid", gap: 10 },
  historyCard: { display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #F0EAF2", fontSize: 11, color: "#6B5E70" },
  historyIcon: { width: 28, height: 28, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F1EAF5", color: "#6E5084" },
  empty: { minHeight: 110, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, border: "1px dashed #DDD2E3", borderRadius: 12, background: "#FCFAFD", color: "#887C8D", fontSize: 11, textAlign: "center", padding: 18 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "16px 22px", borderTop: "1px solid #EEE6F1", background: "#FCFAFD" },
  saveState: { display: "flex", alignItems: "center", gap: 7, color: "#7C7081", fontSize: 11, fontWeight: 650 },
  dot: { width: 7, height: 7, borderRadius: 999, background: "#8A6B9D" },
  primaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: "1px solid #6E5084", borderRadius: 9, background: "#6E5084", color: "#fff", padding: "8px 13px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: "1px solid #DCCFE3", borderRadius: 9, background: "#fff", color: "#6E5084", padding: "8px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  tertiaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: 0, borderRadius: 9, background: "transparent", color: "#766A7A", padding: "8px 10px", fontSize: 11, fontWeight: 750, cursor: "pointer" },
  iconButton: { width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #E4DBE8", borderRadius: 9, background: "#fff", color: "#766A7A", cursor: "pointer" },
  errorBanner: { display: "flex", gap: 9, margin: "18px 22px 0", border: "1px solid #E8CBD2", borderRadius: 11, background: "#FFF7F8", color: "#8B4E5D", padding: "11px 13px", fontSize: 11 },
  successBanner: { display: "flex", gap: 9, margin: "18px 22px 0", border: "1px solid #CFE6D8", borderRadius: 11, background: "#F5FCF8", color: "#527460", padding: "11px 13px", fontSize: 11 },
  access: { display: "flex", gap: 12, border: "1px solid #E6DCEB", borderRadius: 16, background: "#FBF8FC", padding: 20, color: "#6E5084" },
};