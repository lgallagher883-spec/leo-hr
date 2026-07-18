"use client";

import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  History,
  Loader2,
  LockKeyhole,
  Mail,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
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

export type ReferencesDetailsMode = "candidate" | "employee";
export type ReferenceType =
  | "employment"
  | "character"
  | "academic"
  | "professional"
  | "regulatory"
  | "other";
export type ReferenceStatus =
  | "not_requested"
  | "permission_required"
  | "ready_to_request"
  | "requested"
  | "reminder_due"
  | "received"
  | "review_required"
  | "satisfactory"
  | "concerns_recorded"
  | "unable_to_obtain"
  | "withdrawn"
  | "not_required";
export type ReferenceMethod = "email" | "telephone" | "letter" | "portal" | "in_person" | "other";
export type ReferenceEvidenceType =
  | "reference_response"
  | "email_correspondence"
  | "telephone_note"
  | "employment_confirmation"
  | "consent"
  | "risk_assessment"
  | "supporting_document"
  | "other";

export type ReferenceEvidence = {
  id: string;
  evidenceType: ReferenceEvidenceType;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
};

export type ReferenceHistoryEntry = {
  id: string;
  occurredAt: string;
  occurredBy: string;
  action: string;
  status?: ReferenceStatus;
  method?: ReferenceMethod;
  notes?: string;
};

export type ReferenceRecord = {
  id: string;
  referenceType: ReferenceType;
  status: ReferenceStatus;
  organisationName: string;
  refereeName: string;
  refereeJobTitle: string;
  refereeRelationship: string;
  refereeEmail: string;
  refereePhone: string;
  address: string;
  employmentStartDate: string;
  employmentEndDate: string;
  jobTitleHeld: string;
  reasonForLeaving: string;
  permissionToContact: boolean;
  permissionDate: string;
  requestedDate: string;
  requestedBy: string;
  requestMethod: ReferenceMethod;
  reminderDate: string;
  receivedDate: string;
  reviewedDate: string;
  reviewedBy: string;
  datesConfirmed: boolean;
  jobTitleConfirmed: boolean;
  dutiesConfirmed: boolean;
  conductConfirmed: boolean;
  attendanceConfirmed: boolean;
  safeguardingConcernsConfirmed: boolean;
  eligibleForRehireConfirmed: boolean;
  satisfactory: boolean;
  concernsIdentified: boolean;
  discrepancyIdentified: boolean;
  discrepancyDetails: string;
  concernDetails: string;
  followUpRequired: boolean;
  followUpDate: string;
  followUpOwner: string;
  riskAssessmentCompleted: boolean;
  riskAssessmentOutcome: string;
  decisionNotes: string;
  notes: string;
  evidence: ReferenceEvidence[];
  history: ReferenceHistoryEntry[];
};

export type ReferencesDetailsValue = {
  referencesRequired: boolean;
  minimumReferencesRequired: number;
  employmentReferenceRequired: boolean;
  regulatoryRequirementApplies: boolean;
  referencesBeforeStartRequired: boolean;
  overallStatus: ReferenceStatus;
  conditionalStartApproved: boolean;
  conditionalStartApprovedBy: string;
  conditionalStartApprovalDate: string;
  conditionalStartControls: string;
  nextReviewDate: string;
  summaryNotes: string;
  references: ReferenceRecord[];
};

export type ReferencesDetailsPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewRefereeContactDetails: boolean;
  canEditRefereeContactDetails: boolean;
  canRequestReferences: boolean;
  canReviewReferences: boolean;
  canRecordConcerns: boolean;
  canApproveConditionalStart: boolean;
  canAddReference: boolean;
  canDeleteReference: boolean;
  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;
  canViewHistory: boolean;
};

export type ReferencesDetailsSavePayload = {
  value: ReferencesDetailsValue;
  changedFields: string[];
  newFiles: Array<{ referenceId: string; file: File; evidenceType: ReferenceEvidenceType }>;
  removedEvidenceIds: string[];
  removedReferenceIds: string[];
};

export type ReferencesDetailsAuditEvent = {
  action:
    | "references_edit_started"
    | "references_edit_cancelled"
    | "references_saved"
    | "reference_added"
    | "reference_removed"
    | "reference_requested"
    | "reference_reviewed"
    | "reference_concern_recorded"
    | "conditional_start_approved"
    | "reference_evidence_selected"
    | "reference_evidence_removed";
  mode: ReferencesDetailsMode;
  recordId?: string | number;
  referenceId?: string;
  evidenceId?: string;
  changedFields?: string[];
  occurredAt: string;
};

export type ReferencesDetailsProps = {
  mode: ReferencesDetailsMode;
  value?: Partial<ReferencesDetailsValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<ReferencesDetailsPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (payload: ReferencesDetailsSavePayload) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (event: ReferencesDetailsAuditEvent) => Promise<void> | void;
};

type Errors = Record<string, string>;
type PendingFile = { id: string; referenceId: string; file: File; evidenceType: ReferenceEvidenceType };

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const STATUS_OPTIONS: Array<{ value: ReferenceStatus; label: string }> = [
  { value: "not_requested", label: "Not requested" },
  { value: "permission_required", label: "Permission required" },
  { value: "ready_to_request", label: "Ready to request" },
  { value: "requested", label: "Requested" },
  { value: "reminder_due", label: "Reminder due" },
  { value: "received", label: "Received" },
  { value: "review_required", label: "Review required" },
  { value: "satisfactory", label: "Satisfactory" },
  { value: "concerns_recorded", label: "Concerns recorded" },
  { value: "unable_to_obtain", label: "Unable to obtain" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "not_required", label: "Not required" },
];

const TYPE_OPTIONS: Array<{ value: ReferenceType; label: string }> = [
  { value: "employment", label: "Employment reference" },
  { value: "character", label: "Character reference" },
  { value: "academic", label: "Academic reference" },
  { value: "professional", label: "Professional reference" },
  { value: "regulatory", label: "Regulatory reference" },
  { value: "other", label: "Other" },
];

const METHOD_OPTIONS: Array<{ value: ReferenceMethod; label: string }> = [
  { value: "email", label: "Email" },
  { value: "telephone", label: "Telephone" },
  { value: "letter", label: "Letter" },
  { value: "portal", label: "Portal" },
  { value: "in_person", label: "In person" },
  { value: "other", label: "Other" },
];

const EVIDENCE_OPTIONS: Array<{ value: ReferenceEvidenceType; label: string }> = [
  { value: "reference_response", label: "Reference response" },
  { value: "email_correspondence", label: "Email correspondence" },
  { value: "telephone_note", label: "Telephone note" },
  { value: "employment_confirmation", label: "Employment confirmation" },
  { value: "consent", label: "Consent" },
  { value: "risk_assessment", label: "Risk assessment" },
  { value: "supporting_document", label: "Supporting document" },
  { value: "other", label: "Other" },
];

const DEFAULT_PERMISSIONS: ReferencesDetailsPermissions = {
  canView: true,
  canEdit: true,
  canViewRefereeContactDetails: true,
  canEditRefereeContactDetails: true,
  canRequestReferences: true,
  canReviewReferences: true,
  canRecordConcerns: true,
  canApproveConditionalStart: true,
  canAddReference: true,
  canDeleteReference: true,
  canViewEvidence: true,
  canUploadEvidence: true,
  canDeleteEvidence: true,
  canViewHistory: true,
};

const newReference = (): ReferenceRecord => ({
  id: makeId(),
  referenceType: "employment",
  status: "not_requested",
  organisationName: "",
  refereeName: "",
  refereeJobTitle: "",
  refereeRelationship: "",
  refereeEmail: "",
  refereePhone: "",
  address: "",
  employmentStartDate: "",
  employmentEndDate: "",
  jobTitleHeld: "",
  reasonForLeaving: "",
  permissionToContact: false,
  permissionDate: "",
  requestedDate: "",
  requestedBy: "",
  requestMethod: "email",
  reminderDate: "",
  receivedDate: "",
  reviewedDate: "",
  reviewedBy: "",
  datesConfirmed: false,
  jobTitleConfirmed: false,
  dutiesConfirmed: false,
  conductConfirmed: false,
  attendanceConfirmed: false,
  safeguardingConcernsConfirmed: false,
  eligibleForRehireConfirmed: false,
  satisfactory: false,
  concernsIdentified: false,
  discrepancyIdentified: false,
  discrepancyDetails: "",
  concernDetails: "",
  followUpRequired: false,
  followUpDate: "",
  followUpOwner: "",
  riskAssessmentCompleted: false,
  riskAssessmentOutcome: "",
  decisionNotes: "",
  notes: "",
  evidence: [],
  history: [],
});

const EMPTY_VALUE: ReferencesDetailsValue = {
  referencesRequired: true,
  minimumReferencesRequired: 2,
  employmentReferenceRequired: true,
  regulatoryRequirementApplies: false,
  referencesBeforeStartRequired: true,
  overallStatus: "not_requested",
  conditionalStartApproved: false,
  conditionalStartApprovedBy: "",
  conditionalStartApprovalDate: "",
  conditionalStartControls: "",
  nextReviewDate: "",
  summaryNotes: "",
  references: [],
};

const normalise = (value?: Partial<ReferencesDetailsValue>): ReferencesDetailsValue => ({
  ...EMPTY_VALUE,
  ...value,
  references: (value?.references ?? []).map((reference) => ({ ...newReference(), ...reference, evidence: reference.evidence ?? [], history: reference.history ?? [] })),
});

const statusLabel = (value: ReferenceStatus) => STATUS_OPTIONS.find((option) => option.value === value)?.label ?? value;
const typeLabel = (value: ReferenceType) => TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
const methodLabel = (value: ReferenceMethod) => METHOD_OPTIONS.find((option) => option.value === value)?.label ?? value;
const evidenceLabel = (value: ReferenceEvidenceType) => EVIDENCE_OPTIONS.find((option) => option.value === value)?.label ?? value;

const formatDate = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
};

const fileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

const validate = (value: ReferencesDetailsValue): Errors => {
  const errors: Errors = {};
  if (value.referencesRequired && value.minimumReferencesRequired < 1) errors.minimumReferencesRequired = "Enter at least one required reference.";
  if (value.referencesRequired && value.references.length < value.minimumReferencesRequired) errors.references = `Add at least ${value.minimumReferencesRequired} reference record${value.minimumReferencesRequired === 1 ? "" : "s"}.`;
  if (value.conditionalStartApproved) {
    if (!value.conditionalStartApprovedBy.trim()) errors.conditionalStartApprovedBy = "Record who approved the conditional start.";
    if (!value.conditionalStartApprovalDate) errors.conditionalStartApprovalDate = "Record the approval date.";
    if (!value.conditionalStartControls.trim()) errors.conditionalStartControls = "Record the controls applying during the conditional start.";
  }
  value.references.forEach((reference) => {
    const prefix = `references.${reference.id}`;
    if (!reference.organisationName.trim() && reference.referenceType !== "character") errors[`${prefix}.organisationName`] = "Enter the organisation name.";
    if (!reference.refereeName.trim()) errors[`${prefix}.refereeName`] = "Enter the referee's name.";
    if (reference.permissionToContact && !reference.permissionDate) errors[`${prefix}.permissionDate`] = "Record when permission was obtained.";
    if (["requested", "reminder_due", "received", "review_required", "satisfactory", "concerns_recorded"].includes(reference.status)) {
      if (!reference.requestedDate) errors[`${prefix}.requestedDate`] = "Record when the reference was requested.";
      if (!reference.requestedBy.trim()) errors[`${prefix}.requestedBy`] = "Record who requested the reference.";
    }
    if (["received", "review_required", "satisfactory", "concerns_recorded"].includes(reference.status) && !reference.receivedDate) errors[`${prefix}.receivedDate`] = "Record when the reference was received.";
    if (["satisfactory", "concerns_recorded"].includes(reference.status)) {
      if (!reference.reviewedDate) errors[`${prefix}.reviewedDate`] = "Record the review date.";
      if (!reference.reviewedBy.trim()) errors[`${prefix}.reviewedBy`] = "Record who reviewed the reference.";
    }
    if (reference.concernsIdentified && !reference.concernDetails.trim()) errors[`${prefix}.concernDetails`] = "Record the concern and the facts supporting it.";
    if (reference.discrepancyIdentified && !reference.discrepancyDetails.trim()) errors[`${prefix}.discrepancyDetails`] = "Record the discrepancy.";
    if (reference.followUpRequired) {
      if (!reference.followUpDate) errors[`${prefix}.followUpDate`] = "Record the follow-up date.";
      if (!reference.followUpOwner.trim()) errors[`${prefix}.followUpOwner`] = "Assign the follow-up owner.";
    }
  });
  return errors;
};

function SectionHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <header style={styles.sectionHeader}><span style={styles.sectionIcon}>{icon}</span><div><h3 style={styles.sectionTitle}>{title}</h3><p style={styles.sectionDescription}>{description}</p></div></header>;
}

function Field({ label, children, error, restricted }: { label: string; children: ReactNode; error?: string; restricted?: boolean }) {
  return <div style={styles.field}><label style={styles.label}>{label}{restricted ? <span style={styles.restricted}><LockKeyhole size={10} />Restricted</span> : null}</label>{children}{error ? <p style={styles.error}><AlertCircle size={12} />{error}</p> : null}</div>;
}

function ReadOnly({ value, fallback = "Not recorded", restricted = false }: { value?: string; fallback?: string; restricted?: boolean }) {
  return <span style={styles.readOnly}>{restricted ? <><LockKeyhole size={13} />Restricted</> : value || fallback}</span>;
}

function Checkbox({ checked, label, description, disabled, onChange }: { checked: boolean; label: string; description?: string; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label style={styles.checkboxCard}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span><strong>{label}</strong>{description ? <small style={styles.small}>{description}</small> : null}</span></label>;
}

export default function ReferencesDetails({
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
}: ReferencesDetailsProps) {
  const resolvedPermissions = useMemo(() => ({ ...DEFAULT_PERMISSIONS, ...permissions }), [permissions]);
  const supplied = useMemo(() => normalise(value), [value]);
  const [original, setOriginal] = useState(supplied);
  const [draft, setDraft] = useState(supplied);
  const [editing, setEditing] = useState(startInEditMode && resolvedPermissions.canEdit);
  const [expanded, setExpanded] = useState<string[]>(supplied.references.map((reference) => reference.id));
  const [errors, setErrors] = useState<Errors>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState<string[]>([]);
  const [removedReferenceIds, setRemovedReferenceIds] = useState<string[]>([]);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [evidenceType, setEvidenceType] = useState<ReferenceEvidenceType>("reference_response");
  const [localSaving, setLocalSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setOriginal(supplied);
    setDraft(supplied);
    setExpanded(supplied.references.map((reference) => reference.id));
    setErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setRemovedReferenceIds([]);
  }, [supplied]);

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;
  const changedFields = useMemo(() => {
    const fields: string[] = [];
    const rootKeys: Array<keyof Omit<ReferencesDetailsValue, "references">> = [
      "referencesRequired", "minimumReferencesRequired", "employmentReferenceRequired", "regulatoryRequirementApplies", "referencesBeforeStartRequired", "overallStatus", "conditionalStartApproved", "conditionalStartApprovedBy", "conditionalStartApprovalDate", "conditionalStartControls", "nextReviewDate", "summaryNotes",
    ];
    rootKeys.forEach((key) => { if (JSON.stringify(original[key]) !== JSON.stringify(draft[key])) fields.push(String(key)); });
    if (JSON.stringify(original.references) !== JSON.stringify(draft.references)) fields.push("references");
    return fields;
  }, [draft, original]);
  const isDirty = changedFields.length > 0 || pendingFiles.length > 0 || removedEvidenceIds.length > 0 || removedReferenceIds.length > 0;

  const audit = async (action: ReferencesDetailsAuditEvent["action"], extra: Partial<ReferencesDetailsAuditEvent> = {}) => {
    await onAudit?.({ action, mode, recordId, occurredAt: new Date().toISOString(), ...extra });
  };

  const updateRoot = <K extends keyof ReferencesDetailsValue>(key: K, next: ReferencesDetailsValue[K]) => {
    setDraft((current) => ({ ...current, [key]: next }));
    setErrors((current) => { const copy = { ...current }; delete copy[String(key)]; return copy; });
  };

  const updateReference = <K extends keyof ReferenceRecord>(id: string, key: K, next: ReferenceRecord[K]) => {
    setDraft((current) => ({ ...current, references: current.references.map((reference) => reference.id === id ? { ...reference, [key]: next } : reference) }));
    setErrors((current) => { const copy = { ...current }; delete copy[`references.${id}.${String(key)}`]; return copy; });
  };

  const addReference = async () => {
    if (!resolvedPermissions.canAddReference || isDisabled) return;
    const reference = newReference();
    setDraft((current) => ({ ...current, references: [...current.references, reference] }));
    setExpanded((current) => [...current, reference.id]);
    await audit("reference_added", { referenceId: reference.id });
  };

  const removeReference = async (id: string) => {
    if (!resolvedPermissions.canDeleteReference || isDisabled) return;
    if (original.references.some((reference) => reference.id === id)) setRemovedReferenceIds((current) => [...new Set([...current, id])]);
    setDraft((current) => ({ ...current, references: current.references.filter((reference) => reference.id !== id) }));
    setPendingFiles((current) => current.filter((file) => file.referenceId !== id));
    await audit("reference_removed", { referenceId: id });
  };

  const selectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!uploadTarget) return;
    const files = Array.from(event.target.files ?? []).filter((file) => file.size <= 15 * 1024 * 1024);
    setPendingFiles((current) => [...current, ...files.map((file) => ({ id: makeId(), referenceId: uploadTarget, file, evidenceType }))]);
    if (files.length) await audit("reference_evidence_selected", { referenceId: uploadTarget });
    event.target.value = "";
  };

  const cancel = async () => {
    setDraft(original);
    setErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
    setRemovedReferenceIds([]);
    setEditing(false);
    onCancel?.();
    await audit("references_edit_cancelled");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSave || isDisabled || !resolvedPermissions.canEdit) return;
    const validation = validate(draft);
    if (Object.keys(validation).length) {
      setErrors(validation);
      const firstReferenceError = Object.keys(validation).find((key) => key.startsWith("references."));
      if (firstReferenceError) {
        const id = firstReferenceError.split(".")[1];
        setExpanded((current) => current.includes(id) ? current : [...current, id]);
      }
      return;
    }
    try {
      setLocalSaving(true);
      await onSave({ value: draft, changedFields, newFiles: pendingFiles.map(({ referenceId, file, evidenceType: nextEvidenceType }) => ({ referenceId, file, evidenceType: nextEvidenceType })), removedEvidenceIds, removedReferenceIds });
      setOriginal(draft);
      setPendingFiles([]);
      setRemovedEvidenceIds([]);
      setRemovedReferenceIds([]);
      setEditing(false);
      await audit("references_saved", { changedFields });
    } finally {
      setLocalSaving(false);
    }
  };

  if (!resolvedPermissions.canView) return <section style={styles.access}><LockKeyhole size={20} /><div><h2>Reference information is restricted</h2><p>Your current permission level does not allow access to this record.</p></div></section>;

  return <section style={styles.card}>
    <header style={styles.cardHeader}>
      <div style={styles.identity}><span style={styles.identityIcon}><UserCheck size={21} /></span><div><div style={styles.titleRow}><h2 style={styles.cardTitle}>References</h2><span style={styles.badge}>{statusLabel(draft.overallStatus)}</span></div><p style={styles.subtitle}>{recordLabel || (mode === "candidate" ? "Candidate record" : "Employee record")}{recordId !== undefined ? ` · Record ${recordId}` : ""}</p></div></div>
      <div style={styles.actions}>{headerActions}{!editing && resolvedPermissions.canEdit ? <button type="button" style={styles.secondaryButton} disabled={isDisabled} onClick={async () => { setEditing(true); await audit("references_edit_started"); }}><Pencil size={15} />Edit references</button> : null}</div>
    </header>

    {errorMessage ? <div style={styles.errorBanner}><AlertCircle size={16} />{errorMessage}</div> : null}
    {successMessage ? <div style={styles.successBanner}><Check size={16} />{successMessage}</div> : null}

    <form onSubmit={submit}>
      <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.msg,.eml" onChange={selectFiles} style={{ display: "none" }} />
      <div style={styles.content}>
        <section style={styles.section}>
          <SectionHeader icon={<ShieldCheck size={18} />} title="Reference requirements" description="Record the organisation's minimum reference requirement and whether references must be completed before the person starts." />
          <div style={styles.grid}>
            <Field label="Overall status">{editing ? <select style={styles.input} value={draft.overallStatus} disabled={isDisabled} onChange={(event) => updateRoot("overallStatus", event.target.value as ReferenceStatus)}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <ReadOnly value={statusLabel(draft.overallStatus)} />}</Field>
            <Field label="Minimum references required" error={errors.minimumReferencesRequired}>{editing ? <input style={{ ...styles.input, ...(errors.minimumReferencesRequired ? styles.inputError : {}) }} type="number" min={0} max={10} value={draft.minimumReferencesRequired} disabled={isDisabled} onChange={(event) => updateRoot("minimumReferencesRequired", Number(event.target.value))} /> : <ReadOnly value={String(draft.minimumReferencesRequired)} />}</Field>
            <Field label="Next review date">{editing ? <input style={styles.input} type="date" value={draft.nextReviewDate} disabled={isDisabled} onChange={(event) => updateRoot("nextReviewDate", event.target.value)} /> : <ReadOnly value={draft.nextReviewDate ? formatDate(draft.nextReviewDate) : ""} />}</Field>
            <Field label="Summary notes">{editing ? <textarea style={styles.textarea} rows={3} value={draft.summaryNotes} disabled={isDisabled} onChange={(event) => updateRoot("summaryNotes", event.target.value)} /> : <ReadOnly value={draft.summaryNotes} />}</Field>
          </div>
          <div style={styles.checkboxGrid}>
            <Checkbox checked={draft.referencesRequired} label="References required" disabled={!editing || isDisabled} onChange={(checked) => updateRoot("referencesRequired", checked)} />
            <Checkbox checked={draft.employmentReferenceRequired} label="Employment reference required" disabled={!editing || isDisabled} onChange={(checked) => updateRoot("employmentReferenceRequired", checked)} />
            <Checkbox checked={draft.regulatoryRequirementApplies} label="Regulatory requirement applies" disabled={!editing || isDisabled} onChange={(checked) => updateRoot("regulatoryRequirementApplies", checked)} />
            <Checkbox checked={draft.referencesBeforeStartRequired} label="References required before start" disabled={!editing || isDisabled} onChange={(checked) => updateRoot("referencesBeforeStartRequired", checked)} />
          </div>
        </section>

        <section style={styles.section}>
          <SectionHeader icon={<Clock3 size={18} />} title="Conditional start controls" description="Where a person starts before all references are satisfactory, record the authorised decision and temporary safeguards." />
          <div style={styles.checkboxGrid}><Checkbox checked={draft.conditionalStartApproved} label="Conditional start approved" description="Approval should be exceptional, reasoned and supported by temporary controls." disabled={!editing || isDisabled || !resolvedPermissions.canApproveConditionalStart} onChange={(checked) => updateRoot("conditionalStartApproved", checked)} /></div>
          {draft.conditionalStartApproved ? <div style={styles.grid}>
            <Field label="Approved by" error={errors.conditionalStartApprovedBy}>{editing && resolvedPermissions.canApproveConditionalStart ? <input style={{ ...styles.input, ...(errors.conditionalStartApprovedBy ? styles.inputError : {}) }} value={draft.conditionalStartApprovedBy} onChange={(event) => updateRoot("conditionalStartApprovedBy", event.target.value)} /> : <ReadOnly value={draft.conditionalStartApprovedBy} />}</Field>
            <Field label="Approval date" error={errors.conditionalStartApprovalDate}>{editing && resolvedPermissions.canApproveConditionalStart ? <input style={{ ...styles.input, ...(errors.conditionalStartApprovalDate ? styles.inputError : {}) }} type="date" value={draft.conditionalStartApprovalDate} onChange={(event) => updateRoot("conditionalStartApprovalDate", event.target.value)} /> : <ReadOnly value={draft.conditionalStartApprovalDate ? formatDate(draft.conditionalStartApprovalDate) : ""} />}</Field>
            <Field label="Temporary controls" error={errors.conditionalStartControls}>{editing && resolvedPermissions.canApproveConditionalStart ? <textarea style={{ ...styles.textarea, ...(errors.conditionalStartControls ? styles.inputError : {}) }} rows={4} value={draft.conditionalStartControls} onChange={(event) => updateRoot("conditionalStartControls", event.target.value)} placeholder="For example: supervision, restricted duties, no lone working, accelerated follow-up." /> : <ReadOnly value={draft.conditionalStartControls} />}</Field>
          </div> : null}
        </section>

        <section style={styles.section}>
          <div style={styles.sectionActionHeader}><SectionHeader icon={<Building2 size={18} />} title="Reference records" description="Keep each referee, request, response, review decision and supporting evidence in one auditable record." />{editing && resolvedPermissions.canAddReference ? <button type="button" style={styles.secondaryButton} onClick={addReference} disabled={isDisabled}><Plus size={15} />Add reference</button> : null}</div>
          {errors.references ? <p style={styles.error}><AlertCircle size={12} />{errors.references}</p> : null}
          {draft.references.length === 0 ? <div style={styles.empty}><UserCheck size={24} /><strong>No references recorded</strong><span>Add a referee to begin the reference process.</span></div> : null}

          <div style={styles.list}>{draft.references.map((reference, index) => {
            const open = expanded.includes(reference.id);
            const fieldError = (field: keyof ReferenceRecord) => errors[`references.${reference.id}.${String(field)}`];
            const evidence = reference.evidence.filter((item) => !removedEvidenceIds.includes(item.id));
            const queued = pendingFiles.filter((item) => item.referenceId === reference.id);
            return <article key={reference.id} style={styles.recordCard}>
              <header style={styles.recordHeader}>
                <button type="button" style={styles.recordToggle} onClick={() => setExpanded((current) => current.includes(reference.id) ? current.filter((id) => id !== reference.id) : [...current, reference.id])}>
                  <span style={styles.recordIcon}><Building2 size={17} /></span><span style={{ flex: 1, textAlign: "left" }}><strong>{reference.organisationName || reference.refereeName || `Reference ${index + 1}`}</strong><small style={styles.small}>{typeLabel(reference.referenceType)} · {reference.refereeName || "Referee not recorded"}</small></span><span style={styles.badge}>{statusLabel(reference.status)}</span><ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : undefined }} />
                </button>
                {editing && resolvedPermissions.canDeleteReference ? <button type="button" style={styles.iconButton} disabled={isDisabled} onClick={() => removeReference(reference.id)} aria-label="Remove reference"><Trash2 size={15} /></button> : null}
              </header>

              {open ? <div style={styles.recordBody}>
                <section style={styles.innerSection}>
                  <SectionHeader icon={<UserCheck size={17} />} title="Referee details" description="Record who is providing the reference and their relationship to the person." />
                  <div style={styles.grid}>
                    <Field label="Reference type">{editing ? <select style={styles.input} value={reference.referenceType} onChange={(event) => updateReference(reference.id, "referenceType", event.target.value as ReferenceType)}>{TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <ReadOnly value={typeLabel(reference.referenceType)} />}</Field>
                    <Field label="Status">{editing ? <select style={styles.input} value={reference.status} onChange={(event) => updateReference(reference.id, "status", event.target.value as ReferenceStatus)}>{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <ReadOnly value={statusLabel(reference.status)} />}</Field>
                    <Field label="Organisation" error={fieldError("organisationName")}>{editing ? <input style={{ ...styles.input, ...(fieldError("organisationName") ? styles.inputError : {}) }} value={reference.organisationName} onChange={(event) => updateReference(reference.id, "organisationName", event.target.value)} /> : <ReadOnly value={reference.organisationName} />}</Field>
                    <Field label="Referee name" error={fieldError("refereeName")}>{editing ? <input style={{ ...styles.input, ...(fieldError("refereeName") ? styles.inputError : {}) }} value={reference.refereeName} onChange={(event) => updateReference(reference.id, "refereeName", event.target.value)} /> : <ReadOnly value={reference.refereeName} />}</Field>
                    <Field label="Referee job title">{editing ? <input style={styles.input} value={reference.refereeJobTitle} onChange={(event) => updateReference(reference.id, "refereeJobTitle", event.target.value)} /> : <ReadOnly value={reference.refereeJobTitle} />}</Field>
                    <Field label="Relationship to person">{editing ? <input style={styles.input} value={reference.refereeRelationship} onChange={(event) => updateReference(reference.id, "refereeRelationship", event.target.value)} /> : <ReadOnly value={reference.refereeRelationship} />}</Field>
                    <Field label="Email" restricted>{!resolvedPermissions.canViewRefereeContactDetails ? <ReadOnly restricted /> : editing && resolvedPermissions.canEditRefereeContactDetails ? <div style={styles.inputWithIcon}><Mail size={14} /><input value={reference.refereeEmail} onChange={(event) => updateReference(reference.id, "refereeEmail", event.target.value)} /></div> : <ReadOnly value={reference.refereeEmail} />}</Field>
                    <Field label="Telephone" restricted>{!resolvedPermissions.canViewRefereeContactDetails ? <ReadOnly restricted /> : editing && resolvedPermissions.canEditRefereeContactDetails ? <div style={styles.inputWithIcon}><Phone size={14} /><input value={reference.refereePhone} onChange={(event) => updateReference(reference.id, "refereePhone", event.target.value)} /></div> : <ReadOnly value={reference.refereePhone} />}</Field>
                    <Field label="Address">{editing ? <textarea style={styles.textarea} rows={3} value={reference.address} onChange={(event) => updateReference(reference.id, "address", event.target.value)} /> : <ReadOnly value={reference.address} />}</Field>
                  </div>
                </section>

                <section style={styles.innerSection}>
                  <SectionHeader icon={<Building2 size={17} />} title="Employment details to confirm" description="Record the employment information supplied by the person so that it can be checked against the response." />
                  <div style={styles.grid}>
                    <Field label="Employment start date">{editing ? <input style={styles.input} type="date" value={reference.employmentStartDate} onChange={(event) => updateReference(reference.id, "employmentStartDate", event.target.value)} /> : <ReadOnly value={reference.employmentStartDate ? formatDate(reference.employmentStartDate) : ""} />}</Field>
                    <Field label="Employment end date">{editing ? <input style={styles.input} type="date" value={reference.employmentEndDate} onChange={(event) => updateReference(reference.id, "employmentEndDate", event.target.value)} /> : <ReadOnly value={reference.employmentEndDate ? formatDate(reference.employmentEndDate) : ""} />}</Field>
                    <Field label="Job title held">{editing ? <input style={styles.input} value={reference.jobTitleHeld} onChange={(event) => updateReference(reference.id, "jobTitleHeld", event.target.value)} /> : <ReadOnly value={reference.jobTitleHeld} />}</Field>
                    <Field label="Reason for leaving">{editing ? <textarea style={styles.textarea} rows={3} value={reference.reasonForLeaving} onChange={(event) => updateReference(reference.id, "reasonForLeaving", event.target.value)} /> : <ReadOnly value={reference.reasonForLeaving} />}</Field>
                  </div>
                </section>

                <section style={styles.innerSection}>
                  <SectionHeader icon={<Send size={17} />} title="Consent and request activity" description="Record permission to contact the referee, when the request was sent and any reminder due." />
                  <div style={styles.checkboxGrid}><Checkbox checked={reference.permissionToContact} label="Permission to contact referee" disabled={!editing || isDisabled} onChange={(checked) => updateReference(reference.id, "permissionToContact", checked)} /></div>
                  <div style={styles.grid}>
                    <Field label="Permission date" error={fieldError("permissionDate")}>{editing ? <input style={{ ...styles.input, ...(fieldError("permissionDate") ? styles.inputError : {}) }} type="date" value={reference.permissionDate} onChange={(event) => updateReference(reference.id, "permissionDate", event.target.value)} /> : <ReadOnly value={reference.permissionDate ? formatDate(reference.permissionDate) : ""} />}</Field>
                    <Field label="Request date" error={fieldError("requestedDate")}>{editing && resolvedPermissions.canRequestReferences ? <input style={{ ...styles.input, ...(fieldError("requestedDate") ? styles.inputError : {}) }} type="date" value={reference.requestedDate} onChange={(event) => updateReference(reference.id, "requestedDate", event.target.value)} /> : <ReadOnly value={reference.requestedDate ? formatDate(reference.requestedDate) : ""} />}</Field>
                    <Field label="Requested by" error={fieldError("requestedBy")}>{editing && resolvedPermissions.canRequestReferences ? <input style={{ ...styles.input, ...(fieldError("requestedBy") ? styles.inputError : {}) }} value={reference.requestedBy} onChange={(event) => updateReference(reference.id, "requestedBy", event.target.value)} /> : <ReadOnly value={reference.requestedBy} />}</Field>
                    <Field label="Request method">{editing && resolvedPermissions.canRequestReferences ? <select style={styles.input} value={reference.requestMethod} onChange={(event) => updateReference(reference.id, "requestMethod", event.target.value as ReferenceMethod)}>{METHOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <ReadOnly value={methodLabel(reference.requestMethod)} />}</Field>
                    <Field label="Reminder date">{editing && resolvedPermissions.canRequestReferences ? <input style={styles.input} type="date" value={reference.reminderDate} onChange={(event) => updateReference(reference.id, "reminderDate", event.target.value)} /> : <ReadOnly value={reference.reminderDate ? formatDate(reference.reminderDate) : ""} />}</Field>
                    <Field label="Received date" error={fieldError("receivedDate")}>{editing ? <input style={{ ...styles.input, ...(fieldError("receivedDate") ? styles.inputError : {}) }} type="date" value={reference.receivedDate} onChange={(event) => updateReference(reference.id, "receivedDate", event.target.value)} /> : <ReadOnly value={reference.receivedDate ? formatDate(reference.receivedDate) : ""} />}</Field>
                  </div>
                  {editing && resolvedPermissions.canRequestReferences ? <div style={styles.actionRow}><button type="button" style={styles.secondaryButton} onClick={async () => { updateReference(reference.id, "status", "requested"); if (!reference.requestedDate) updateReference(reference.id, "requestedDate", new Date().toISOString().slice(0, 10)); await audit("reference_requested", { referenceId: reference.id }); }}><Send size={15} />Mark as requested</button><span style={styles.helper}>The parent workspace remains responsible for actually sending the request and persisting the audit event.</span></div> : null}
                </section>

                <section style={styles.innerSection}>
                  <SectionHeader icon={<CheckCircle2 size={17} />} title="Reference review" description="Review the response objectively, distinguish confirmed facts from opinion and record any discrepancy or concern." />
                  <div style={styles.checkboxGrid}>
                    {([
                      ["datesConfirmed", "Employment dates confirmed"],
                      ["jobTitleConfirmed", "Job title confirmed"],
                      ["dutiesConfirmed", "Duties confirmed"],
                      ["conductConfirmed", "Conduct information received"],
                      ["attendanceConfirmed", "Attendance information received"],
                      ["safeguardingConcernsConfirmed", "Safeguarding question answered"],
                      ["eligibleForRehireConfirmed", "Rehire eligibility answered"],
                      ["satisfactory", "Reference assessed as satisfactory"],
                    ] as const).map(([key, label]) => <Checkbox key={key} checked={reference[key]} label={label} disabled={!editing || isDisabled || !resolvedPermissions.canReviewReferences} onChange={(checked) => updateReference(reference.id, key, checked)} />)}
                  </div>
                  <div style={styles.grid}>
                    <Field label="Reviewed date" error={fieldError("reviewedDate")}>{editing && resolvedPermissions.canReviewReferences ? <input style={{ ...styles.input, ...(fieldError("reviewedDate") ? styles.inputError : {}) }} type="date" value={reference.reviewedDate} onChange={(event) => updateReference(reference.id, "reviewedDate", event.target.value)} /> : <ReadOnly value={reference.reviewedDate ? formatDate(reference.reviewedDate) : ""} />}</Field>
                    <Field label="Reviewed by" error={fieldError("reviewedBy")}>{editing && resolvedPermissions.canReviewReferences ? <input style={{ ...styles.input, ...(fieldError("reviewedBy") ? styles.inputError : {}) }} value={reference.reviewedBy} onChange={(event) => updateReference(reference.id, "reviewedBy", event.target.value)} /> : <ReadOnly value={reference.reviewedBy} />}</Field>
                    <Field label="Decision notes">{editing && resolvedPermissions.canReviewReferences ? <textarea style={styles.textarea} rows={4} value={reference.decisionNotes} onChange={(event) => updateReference(reference.id, "decisionNotes", event.target.value)} placeholder="Record the evidence considered, any clarification obtained and the decision reached." /> : <ReadOnly value={reference.decisionNotes} />}</Field>
                  </div>
                  {editing && resolvedPermissions.canReviewReferences ? <div style={styles.actionRow}><button type="button" style={styles.secondaryButton} onClick={async () => { updateReference(reference.id, "status", reference.concernsIdentified ? "concerns_recorded" : "satisfactory"); if (!reference.reviewedDate) updateReference(reference.id, "reviewedDate", new Date().toISOString().slice(0, 10)); await audit("reference_reviewed", { referenceId: reference.id }); }}><CheckCircle2 size={15} />Complete review</button></div> : null}
                </section>

                <section style={styles.innerSection}>
                  <SectionHeader icon={<AlertCircle size={17} />} title="Discrepancies, concerns and follow-up" description="Record material issues neutrally, investigate proportionately and document any risk controls or follow-up action." />
                  <div style={styles.checkboxGrid}>
                    <Checkbox checked={reference.discrepancyIdentified} label="Discrepancy identified" disabled={!editing || isDisabled || !resolvedPermissions.canRecordConcerns} onChange={(checked) => updateReference(reference.id, "discrepancyIdentified", checked)} />
                    <Checkbox checked={reference.concernsIdentified} label="Concern identified" disabled={!editing || isDisabled || !resolvedPermissions.canRecordConcerns} onChange={async (checked) => { updateReference(reference.id, "concernsIdentified", checked); if (checked) await audit("reference_concern_recorded", { referenceId: reference.id }); }} />
                    <Checkbox checked={reference.followUpRequired} label="Follow-up required" disabled={!editing || isDisabled} onChange={(checked) => updateReference(reference.id, "followUpRequired", checked)} />
                    <Checkbox checked={reference.riskAssessmentCompleted} label="Risk assessment completed" disabled={!editing || isDisabled} onChange={(checked) => updateReference(reference.id, "riskAssessmentCompleted", checked)} />
                  </div>
                  <div style={styles.grid}>
                    {reference.discrepancyIdentified ? <Field label="Discrepancy details" error={fieldError("discrepancyDetails")}>{editing && resolvedPermissions.canRecordConcerns ? <textarea style={{ ...styles.textarea, ...(fieldError("discrepancyDetails") ? styles.inputError : {}) }} rows={4} value={reference.discrepancyDetails} onChange={(event) => updateReference(reference.id, "discrepancyDetails", event.target.value)} /> : <ReadOnly value={reference.discrepancyDetails} />}</Field> : null}
                    {reference.concernsIdentified ? <Field label="Concern details" error={fieldError("concernDetails")}>{editing && resolvedPermissions.canRecordConcerns ? <textarea style={{ ...styles.textarea, ...(fieldError("concernDetails") ? styles.inputError : {}) }} rows={4} value={reference.concernDetails} onChange={(event) => updateReference(reference.id, "concernDetails", event.target.value)} /> : <ReadOnly value={reference.concernDetails} />}</Field> : null}
                    {reference.followUpRequired ? <><Field label="Follow-up date" error={fieldError("followUpDate")}>{editing ? <input style={{ ...styles.input, ...(fieldError("followUpDate") ? styles.inputError : {}) }} type="date" value={reference.followUpDate} onChange={(event) => updateReference(reference.id, "followUpDate", event.target.value)} /> : <ReadOnly value={reference.followUpDate ? formatDate(reference.followUpDate) : ""} />}</Field><Field label="Follow-up owner" error={fieldError("followUpOwner")}>{editing ? <input style={{ ...styles.input, ...(fieldError("followUpOwner") ? styles.inputError : {}) }} value={reference.followUpOwner} onChange={(event) => updateReference(reference.id, "followUpOwner", event.target.value)} /> : <ReadOnly value={reference.followUpOwner} />}</Field></> : null}
                    {reference.riskAssessmentCompleted ? <Field label="Risk assessment outcome">{editing ? <textarea style={styles.textarea} rows={4} value={reference.riskAssessmentOutcome} onChange={(event) => updateReference(reference.id, "riskAssessmentOutcome", event.target.value)} /> : <ReadOnly value={reference.riskAssessmentOutcome} />}</Field> : null}
                    <Field label="Additional notes">{editing ? <textarea style={styles.textarea} rows={4} value={reference.notes} onChange={(event) => updateReference(reference.id, "notes", event.target.value)} /> : <ReadOnly value={reference.notes} />}</Field>
                  </div>
                </section>

                {resolvedPermissions.canViewEvidence ? <section style={styles.innerSection}>
                  <SectionHeader icon={<FileText size={17} />} title="Supporting evidence" description="Store the reference response, correspondence, call notes, consent and any supporting risk assessment." />
                  {evidence.length === 0 && queued.length === 0 ? <div style={styles.empty}><FileText size={22} /><strong>No evidence uploaded</strong></div> : <div style={styles.evidenceList}>
                    {evidence.map((item) => <div key={item.id} style={styles.evidenceCard}><span style={styles.fileIcon}><FileText size={15} /></span><div style={{ flex: 1, minWidth: 0 }}><strong>{item.fileName}</strong><small style={styles.small}>{evidenceLabel(item.evidenceType)} · {fileSize(item.fileSizeBytes)} · {formatDateTime(item.uploadedAt)}</small></div>{editing && resolvedPermissions.canDeleteEvidence ? <button type="button" style={styles.iconButton} onClick={async () => { setRemovedEvidenceIds((current) => [...new Set([...current, item.id])]); await audit("reference_evidence_removed", { referenceId: reference.id, evidenceId: item.id }); }}><Trash2 size={14} /></button> : null}</div>)}
                    {queued.map((item) => <div key={item.id} style={styles.evidenceCard}><span style={styles.fileIcon}><Upload size={15} /></span><div style={{ flex: 1, minWidth: 0 }}><strong>{item.file.name}</strong><small style={styles.small}>Queued · {evidenceLabel(item.evidenceType)} · {fileSize(item.file.size)}</small></div><button type="button" style={styles.iconButton} onClick={() => setPendingFiles((current) => current.filter((file) => file.id !== item.id))}><X size={14} /></button></div>)}
                  </div>}
                  {editing && resolvedPermissions.canUploadEvidence ? <div style={styles.uploadRow}><select style={styles.input} value={evidenceType} onChange={(event) => setEvidenceType(event.target.value as ReferenceEvidenceType)}>{EVIDENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><button type="button" style={styles.secondaryButton} onClick={() => { setUploadTarget(reference.id); requestAnimationFrame(() => fileRef.current?.click()); }}><Upload size={15} />Add evidence</button></div> : null}
                </section> : null}

                {resolvedPermissions.canViewHistory ? <section style={styles.innerSection}>
                  <SectionHeader icon={<History size={17} />} title="Reference history" description="Previous requests, reminders, responses, reviews and decisions remain available for audit purposes." />
                  {reference.history.length === 0 ? <div style={styles.empty}><History size={22} /><strong>No reference history recorded</strong></div> : <div style={styles.historyList}>{reference.history.map((entry) => <article key={entry.id} style={styles.historyCard}><span style={styles.historyIcon}><CheckCircle2 size={14} /></span><div><strong>{entry.action}</strong><p>{formatDateTime(entry.occurredAt)} · {entry.occurredBy}</p>{entry.status ? <p>{statusLabel(entry.status)}</p> : null}{entry.method ? <p>{methodLabel(entry.method)}</p> : null}{entry.notes ? <p>{entry.notes}</p> : null}</div></article>)}</div>}
                </section> : null}
              </div> : null}
            </article>;
          })}</div>
        </section>
      </div>

      {editing ? <footer style={styles.footer}><div style={styles.saveState}>{isDirty ? <><span style={styles.dot} />Unsaved changes</> : <><Check size={14} />No unsaved changes</>}</div><div style={styles.actions}><button type="button" style={styles.tertiaryButton} disabled={!isDirty || isDisabled} onClick={() => { setDraft(original); setErrors({}); setPendingFiles([]); setRemovedEvidenceIds([]); setRemovedReferenceIds([]); }}><RotateCcw size={14} />Reset</button><button type="button" style={styles.secondaryButton} disabled={isDisabled} onClick={cancel}><X size={15} />Cancel</button><button type="submit" style={styles.primaryButton} disabled={!isDirty || isDisabled || !onSave}>{isSaving ? <Loader2 size={15} className="leo-spin" /> : <Save size={15} />}{isSaving ? "Saving..." : "Save references"}</button></div></footer> : null}
    </form>
    <style>{`@keyframes leo-spin{to{transform:rotate(360deg)}}.leo-spin{animation:leo-spin .8s linear infinite}button:disabled,input:disabled,select:disabled,textarea:disabled{cursor:not-allowed;opacity:.6}input[type=checkbox]{accent-color:#6E5084}`}</style>
  </section>;
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
  checkboxCard: { display: "flex", alignItems: "flex-start", gap: 9, minHeight: 52, border: "1px solid #DED3E4", borderRadius: 10, background: "#FAF7FC", padding: 11, fontSize: 11 },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { display: "flex", alignItems: "center", gap: 6, color: "#594D5E", fontSize: 11, fontWeight: 750 },
  restricted: { display: "inline-flex", alignItems: "center", gap: 3, background: "#F3EEF5", borderRadius: 999, padding: "3px 6px", fontSize: 9 },
  input: { width: "100%", minHeight: 42, boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: 10, background: "#fff", color: "#3F3543", padding: "10px 11px", font: "inherit", fontSize: 12 },
  inputWithIcon: { minHeight: 42, display: "flex", alignItems: "center", gap: 8, border: "1px solid #DCCFE3", borderRadius: 10, padding: "0 11px", color: "#6E5084" },
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
  small: { display: "block", marginTop: 4, color: "#8B7F90", fontSize: 10, lineHeight: 1.4 },
  actionRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  helper: { color: "#8B7F90", fontSize: 10 },
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