"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Globe2,
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

export type OverseasChecksMode = "candidate" | "employee";

export type OverseasCheckStatus =
  | "not_assessed"
  | "not_required"
  | "required"
  | "awaiting_details"
  | "awaiting_evidence"
  | "verification_required"
  | "complete"
  | "unable_to_obtain"
  | "risk_review_required"
  | "conditional_clearance";

export type OverseasCheckType =
  | "police_clearance"
  | "criminal_record_certificate"
  | "certificate_of_good_conduct"
  | "regulatory_check"
  | "employment_history_check"
  | "identity_check"
  | "other";

export type OverseasEvidence = {
  id: string;
  evidenceType: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
};

export type OverseasCheckHistoryEntry = {
  id: string;
  occurredAt: string;
  occurredBy: string;
  action: string;
  status?: OverseasCheckStatus;
  notes?: string;
};

export type OverseasCheckRecord = {
  id: string;
  country: string;
  countryCode: string;
  checkType: OverseasCheckType;
  status: OverseasCheckStatus;
  reasonRequired: string;
  residenceOrWorkStartDate: string;
  residenceOrWorkEndDate: string;
  authorityName: string;
  applicationReference: string;
  applicationDate: string;
  certificateReference: string;
  certificateIssueDate: string;
  certificateExpiryDate: string;
  originalSeen: boolean;
  translationRequired: boolean;
  translationReceived: boolean;
  translatorName: string;
  translationDate: string;
  authenticityVerified: boolean;
  verifiedDate: string;
  verifiedBy: string;
  verificationMethod: string;
  resultSummary: string;
  concernIdentified: boolean;
  concernDetails: string;
  unableToObtain: boolean;
  unableToObtainReason: string;
  alternativeEvidenceConsidered: string;
  riskAssessmentRequired: boolean;
  riskAssessmentOutcome: string;
  conditionalControls: string;
  nextReviewDate: string;
  notes: string;
  evidence: OverseasEvidence[];
  history: OverseasCheckHistoryEntry[];
};

export type OverseasChecksValue = {
  overseasChecksRequired: boolean;
  requirementReason: string;
  minimumResidenceThresholdMonths: number;
  overallStatus: OverseasCheckStatus;
  conditionalClearanceApproved: boolean;
  conditionalClearanceApprovedBy: string;
  conditionalClearanceDate: string;
  conditionalClearanceControls: string;
  summaryNotes: string;
  checks: OverseasCheckRecord[];
};

export type OverseasChecksPermissions = {
  canView: boolean;
  canEdit: boolean;
  canAddCheck: boolean;
  canDeleteCheck: boolean;
  canVerify: boolean;
  canRecordConcerns: boolean;
  canApproveConditionalClearance: boolean;
  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;
  canViewHistory: boolean;
};

export type OverseasChecksSavePayload = {
  value: OverseasChecksValue;
  changedFields: string[];
  newFiles: Array<{ checkId: string; file: File; evidenceType: string }>;
  removedEvidenceIds: string[];
  removedCheckIds: string[];
};

export type OverseasChecksAuditEvent = {
  action:
    | "overseas_checks_edit_started"
    | "overseas_checks_edit_cancelled"
    | "overseas_checks_saved"
    | "overseas_check_added"
    | "overseas_check_removed"
    | "overseas_check_verified"
    | "overseas_check_concern_recorded"
    | "overseas_conditional_clearance_approved"
    | "overseas_evidence_selected"
    | "overseas_evidence_removed";
  mode: OverseasChecksMode;
  recordId?: string | number;
  checkId?: string;
  evidenceId?: string;
  changedFields?: string[];
  occurredAt: string;
};

export type OverseasChecksDetailsProps = {
  mode: OverseasChecksMode;
  value?: Partial<OverseasChecksValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<OverseasChecksPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (payload: OverseasChecksSavePayload) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (event: OverseasChecksAuditEvent) => Promise<void> | void;
};

type Errors = Record<string, string>;
type PendingFile = { id: string; checkId: string; file: File; evidenceType: string };

const makeId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const STATUS_OPTIONS: Array<{ value: OverseasCheckStatus; label: string }> = [
  { value: "not_assessed", label: "Not assessed" },
  { value: "not_required", label: "Not required" },
  { value: "required", label: "Required" },
  { value: "awaiting_details", label: "Awaiting details" },
  { value: "awaiting_evidence", label: "Awaiting evidence" },
  { value: "verification_required", label: "Verification required" },
  { value: "complete", label: "Complete" },
  { value: "unable_to_obtain", label: "Unable to obtain" },
  { value: "risk_review_required", label: "Risk review required" },
  { value: "conditional_clearance", label: "Conditional clearance" },
];

const TYPE_OPTIONS: Array<{ value: OverseasCheckType; label: string }> = [
  { value: "police_clearance", label: "Police clearance" },
  { value: "criminal_record_certificate", label: "Criminal-record certificate" },
  { value: "certificate_of_good_conduct", label: "Certificate of good conduct" },
  { value: "regulatory_check", label: "Regulatory check" },
  { value: "employment_history_check", label: "Employment-history check" },
  { value: "identity_check", label: "Identity check" },
  { value: "other", label: "Other" },
];

const DEFAULT_PERMISSIONS: OverseasChecksPermissions = {
  canView: true,
  canEdit: true,
  canAddCheck: true,
  canDeleteCheck: true,
  canVerify: true,
  canRecordConcerns: true,
  canApproveConditionalClearance: true,
  canViewEvidence: true,
  canUploadEvidence: true,
  canDeleteEvidence: true,
  canViewHistory: true,
};

const newCheck = (): OverseasCheckRecord => ({
  id: makeId(),
  country: "",
  countryCode: "",
  checkType: "police_clearance",
  status: "required",
  reasonRequired: "",
  residenceOrWorkStartDate: "",
  residenceOrWorkEndDate: "",
  authorityName: "",
  applicationReference: "",
  applicationDate: "",
  certificateReference: "",
  certificateIssueDate: "",
  certificateExpiryDate: "",
  originalSeen: false,
  translationRequired: false,
  translationReceived: false,
  translatorName: "",
  translationDate: "",
  authenticityVerified: false,
  verifiedDate: "",
  verifiedBy: "",
  verificationMethod: "",
  resultSummary: "",
  concernIdentified: false,
  concernDetails: "",
  unableToObtain: false,
  unableToObtainReason: "",
  alternativeEvidenceConsidered: "",
  riskAssessmentRequired: false,
  riskAssessmentOutcome: "",
  conditionalControls: "",
  nextReviewDate: "",
  notes: "",
  evidence: [],
  history: [],
});

const EMPTY_VALUE: OverseasChecksValue = {
  overseasChecksRequired: false,
  requirementReason: "",
  minimumResidenceThresholdMonths: 6,
  overallStatus: "not_assessed",
  conditionalClearanceApproved: false,
  conditionalClearanceApprovedBy: "",
  conditionalClearanceDate: "",
  conditionalClearanceControls: "",
  summaryNotes: "",
  checks: [],
};

function normalise(value?: Partial<OverseasChecksValue>): OverseasChecksValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    checks: (value?.checks ?? []).map((item) => ({ ...newCheck(), ...item, id: item.id || makeId(), evidence: item.evidence ?? [], history: item.history ?? [] })),
  };
}

function validate(value: OverseasChecksValue): Errors {
  const errors: Errors = {};
  if (value.overseasChecksRequired && !value.requirementReason.trim()) errors.requirementReason = "Record why overseas checks are required.";
  if (value.overseasChecksRequired && value.checks.length === 0) errors.checks = "Add at least one country-specific overseas check.";
  if (value.conditionalClearanceApproved) {
    if (!value.conditionalClearanceApprovedBy.trim()) errors.conditionalClearanceApprovedBy = "Record who approved conditional clearance.";
    if (!value.conditionalClearanceDate) errors.conditionalClearanceDate = "Record the approval date.";
    if (!value.conditionalClearanceControls.trim()) errors.conditionalClearanceControls = "Record the temporary controls.";
  }
  value.checks.forEach((item) => {
    const p = `checks.${item.id}`;
    if (!item.country.trim()) errors[`${p}.country`] = "Enter the country.";
    if (!item.reasonRequired.trim()) errors[`${p}.reasonRequired`] = "Record why this country check is required.";
    if (item.status === "complete") {
      if (!item.verifiedDate) errors[`${p}.verifiedDate`] = "Enter the verification date.";
      if (!item.verifiedBy.trim()) errors[`${p}.verifiedBy`] = "Enter who verified the check.";
      if (!item.verificationMethod.trim()) errors[`${p}.verificationMethod`] = "Record the verification method.";
    }
    if (item.translationRequired && !item.translationReceived) errors[`${p}.translationReceived`] = "A required translation must be received before completion.";
    if (item.concernIdentified && !item.concernDetails.trim()) errors[`${p}.concernDetails`] = "Record the concern.";
    if (item.unableToObtain && !item.unableToObtainReason.trim()) errors[`${p}.unableToObtainReason`] = "Record why the check could not be obtained.";
    if (item.riskAssessmentRequired && !item.riskAssessmentOutcome.trim()) errors[`${p}.riskAssessmentOutcome`] = "Record the risk assessment outcome.";
  });
  return errors;
}

const statusLabel = (value: OverseasCheckStatus) => STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
const typeLabel = (value: OverseasCheckType) => TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
const formatDate = (value?: string) => !value ? "Not recorded" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
const formatDateTime = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const fileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return <div style={styles.field}><label style={styles.label}>{label}</label>{children}{error ? <p style={styles.error}><AlertCircle size={12} />{error}</p> : null}</div>;
}
function ReadOnly({ value }: { value?: string }) { return <span style={styles.readOnly}>{value || "Not recorded"}</span>; }
function Checkbox({ checked, label, disabled, onChange }: { checked: boolean; label: string; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label style={styles.checkbox}><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>;
}

export default function OverseasChecksDetails({
  mode, value, recordId, recordLabel, permissions, saving = false, disabled = false, startInEditMode = false,
  errorMessage, successMessage, headerActions, onSave, onCancel, onAudit,
}: OverseasChecksDetailsProps) {
  const resolvedPermissions = useMemo(() => ({ ...DEFAULT_PERMISSIONS, ...permissions }), [permissions]);
  const supplied = useMemo(() => normalise(value), [value]);
  const [original, setOriginal] = useState(supplied);
  const [draft, setDraft] = useState(supplied);
  const [editing, setEditing] = useState(startInEditMode && resolvedPermissions.canEdit);
  const [errors, setErrors] = useState<Errors>({});
  const [expanded, setExpanded] = useState<string[]>(supplied.checks.map((c) => c.id));
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState<string[]>([]);
  const [removedCheckIds, setRemovedCheckIds] = useState<string[]>([]);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [evidenceType, setEvidenceType] = useState("police_certificate");
  const [localSaving, setLocalSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setOriginal(supplied); setDraft(supplied); setExpanded(supplied.checks.map((c) => c.id));
    setErrors({}); setPendingFiles([]); setRemovedEvidenceIds([]); setRemovedCheckIds([]);
  }, [supplied]);

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;
  const changedFields = useMemo(() => JSON.stringify(original) === JSON.stringify(draft) ? [] : ["overseasChecks"], [original, draft]);
  const isDirty = changedFields.length > 0 || pendingFiles.length > 0 || removedEvidenceIds.length > 0 || removedCheckIds.length > 0;

  async function audit(action: OverseasChecksAuditEvent["action"], extra: Partial<OverseasChecksAuditEvent> = {}) {
    await onAudit?.({ action, mode, recordId, occurredAt: new Date().toISOString(), ...extra });
  }
  function updateRoot<K extends keyof OverseasChecksValue>(key: K, next: OverseasChecksValue[K]) { setDraft((c) => ({ ...c, [key]: next })); }
  function updateCheck<K extends keyof OverseasCheckRecord>(id: string, key: K, next: OverseasCheckRecord[K]) {
    setDraft((c) => ({ ...c, checks: c.checks.map((item) => item.id === id ? { ...item, [key]: next } : item) }));
  }
  async function addCheck() {
    const item = newCheck();
    setDraft((c) => ({ ...c, checks: [...c.checks, item] }));
    setExpanded((c) => [...c, item.id]);
    await audit("overseas_check_added", { checkId: item.id });
  }
  async function removeCheck(id: string) {
    if (original.checks.some((c) => c.id === id)) setRemovedCheckIds((c) => [...new Set([...c, id])]);
    setDraft((c) => ({ ...c, checks: c.checks.filter((item) => item.id !== id) }));
    setPendingFiles((c) => c.filter((f) => f.checkId !== id));
    await audit("overseas_check_removed", { checkId: id });
  }
  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    if (!uploadTarget) return;
    const files = Array.from(event.target.files ?? []).filter((file) => file.size <= 15 * 1024 * 1024);
    setPendingFiles((c) => [...c, ...files.map((file) => ({ id: makeId(), checkId: uploadTarget, file, evidenceType }))]);
    if (files.length) await audit("overseas_evidence_selected", { checkId: uploadTarget });
    event.target.value = "";
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSave || isDisabled || !resolvedPermissions.canEdit) return;
    const validation = validate(draft);
    if (Object.keys(validation).length) { setErrors(validation); return; }
    try {
      setLocalSaving(true);
      await onSave({
        value: draft, changedFields,
        newFiles: pendingFiles.map(({ checkId, file, evidenceType: type }) => ({ checkId, file, evidenceType: type })),
        removedEvidenceIds, removedCheckIds,
      });
      setOriginal(draft); setPendingFiles([]); setRemovedEvidenceIds([]); setRemovedCheckIds([]); setEditing(false);
      await audit("overseas_checks_saved", { changedFields });
    } finally { setLocalSaving(false); }
  }

  if (!resolvedPermissions.canView) return <section style={styles.access}><LockKeyhole size={20} /><div><h2>Overseas checks are restricted</h2><p>Your current permission level does not allow access to this record.</p></div></section>;

  return <section style={styles.card}>
    <header style={styles.header}>
      <div style={styles.identity}><span style={styles.icon}><Globe2 size={21} /></span><div><div style={styles.titleRow}><h2 style={styles.title}>Overseas checks</h2><span style={styles.badge}>{statusLabel(draft.overallStatus)}</span></div><p style={styles.subtitle}>{recordLabel || (mode === "candidate" ? "Candidate record" : "Employee record")}{recordId !== undefined ? ` · Record ${recordId}` : ""}</p></div></div>
      <div style={styles.actions}>{headerActions}{!editing && resolvedPermissions.canEdit ? <button type="button" style={styles.secondaryButton} onClick={async () => { setEditing(true); await audit("overseas_checks_edit_started"); }}><Pencil size={15} />Edit overseas checks</button> : null}</div>
    </header>
    {errorMessage ? <div style={styles.errorBanner}><AlertCircle size={16} />{errorMessage}</div> : null}
    {successMessage ? <div style={styles.successBanner}><Check size={16} />{successMessage}</div> : null}
    <form onSubmit={submit}>
      <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={selectFiles} style={{ display: "none" }} />
      <div style={styles.content}>
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><ShieldCheck size={18} />Requirement</h3>
          <div style={styles.checkboxGrid}><Checkbox checked={draft.overseasChecksRequired} label="Overseas checks required" disabled={!editing || isDisabled} onChange={(v) => updateRoot("overseasChecksRequired", v)} /></div>
          <div style={styles.grid}>
            <Field label="Overall status">{editing ? <select style={styles.input} value={draft.overallStatus} onChange={(e) => updateRoot("overallStatus", e.target.value as OverseasCheckStatus)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={statusLabel(draft.overallStatus)} />}</Field>
            <Field label="Minimum residence threshold (months)">{editing ? <input style={styles.input} type="number" min={1} max={120} value={draft.minimumResidenceThresholdMonths} onChange={(e) => updateRoot("minimumResidenceThresholdMonths", Number(e.target.value))} /> : <ReadOnly value={String(draft.minimumResidenceThresholdMonths)} />}</Field>
            <Field label="Requirement reason" error={errors.requirementReason}>{editing ? <textarea style={styles.textarea} value={draft.requirementReason} onChange={(e) => updateRoot("requirementReason", e.target.value)} /> : <ReadOnly value={draft.requirementReason} />}</Field>
            <Field label="Summary notes">{editing ? <textarea style={styles.textarea} value={draft.summaryNotes} onChange={(e) => updateRoot("summaryNotes", e.target.value)} /> : <ReadOnly value={draft.summaryNotes} />}</Field>
          </div>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><CheckCircle2 size={18} />Conditional clearance</h3>
          <div style={styles.checkboxGrid}><Checkbox checked={draft.conditionalClearanceApproved} label="Conditional clearance approved" disabled={!editing || isDisabled || !resolvedPermissions.canApproveConditionalClearance} onChange={(v) => updateRoot("conditionalClearanceApproved", v)} /></div>
          {draft.conditionalClearanceApproved ? <div style={styles.grid}>
            <Field label="Approved by" error={errors.conditionalClearanceApprovedBy}>{editing ? <input style={styles.input} value={draft.conditionalClearanceApprovedBy} onChange={(e) => updateRoot("conditionalClearanceApprovedBy", e.target.value)} /> : <ReadOnly value={draft.conditionalClearanceApprovedBy} />}</Field>
            <Field label="Approval date" error={errors.conditionalClearanceDate}>{editing ? <input style={styles.input} type="date" value={draft.conditionalClearanceDate} onChange={(e) => updateRoot("conditionalClearanceDate", e.target.value)} /> : <ReadOnly value={draft.conditionalClearanceDate ? formatDate(draft.conditionalClearanceDate) : ""} />}</Field>
            <Field label="Temporary controls" error={errors.conditionalClearanceControls}>{editing ? <textarea style={styles.textarea} value={draft.conditionalClearanceControls} onChange={(e) => updateRoot("conditionalClearanceControls", e.target.value)} /> : <ReadOnly value={draft.conditionalClearanceControls} />}</Field>
          </div> : null}
        </section>

        <section style={styles.section}>
          <div style={styles.sectionAction}><h3 style={styles.sectionTitle}><Globe2 size={18} />Country checks</h3>{editing && resolvedPermissions.canAddCheck ? <button type="button" style={styles.secondaryButton} onClick={addCheck}><Plus size={15} />Add country check</button> : null}</div>
          {errors.checks ? <p style={styles.error}><AlertCircle size={12} />{errors.checks}</p> : null}
          <div style={styles.list}>
            {draft.checks.map((item, index) => {
              const open = expanded.includes(item.id);
              const err = (field: keyof OverseasCheckRecord) => errors[`checks.${item.id}.${String(field)}`];
              const evidence = item.evidence.filter((e) => !removedEvidenceIds.includes(e.id));
              const queued = pendingFiles.filter((f) => f.checkId === item.id);
              return <article key={item.id} style={styles.recordCard}>
                <header style={styles.recordHeader}>
                  <button type="button" style={styles.recordToggle} onClick={() => setExpanded((c) => c.includes(item.id) ? c.filter((id) => id !== item.id) : [...c, item.id])}><span style={styles.recordIcon}><Globe2 size={17} /></span><span style={{ flex: 1, textAlign: "left" }}><strong>{item.country || `Country check ${index + 1}`}</strong><small style={styles.small}>{typeLabel(item.checkType)}</small></span><span style={styles.badge}>{statusLabel(item.status)}</span></button>
                  {editing && resolvedPermissions.canDeleteCheck ? <button type="button" style={styles.iconButton} onClick={() => removeCheck(item.id)}><Trash2 size={15} /></button> : null}
                </header>
                {open ? <div style={styles.recordBody}>
                  <div style={styles.grid}>
                    <Field label="Country" error={err("country")}>{editing ? <input style={styles.input} value={item.country} onChange={(e) => updateCheck(item.id, "country", e.target.value)} /> : <ReadOnly value={item.country} />}</Field>
                    <Field label="Country code">{editing ? <input style={styles.input} value={item.countryCode} onChange={(e) => updateCheck(item.id, "countryCode", e.target.value.toUpperCase())} /> : <ReadOnly value={item.countryCode} />}</Field>
                    <Field label="Check type">{editing ? <select style={styles.input} value={item.checkType} onChange={(e) => updateCheck(item.id, "checkType", e.target.value as OverseasCheckType)}>{TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={typeLabel(item.checkType)} />}</Field>
                    <Field label="Status">{editing ? <select style={styles.input} value={item.status} onChange={(e) => updateCheck(item.id, "status", e.target.value as OverseasCheckStatus)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={statusLabel(item.status)} />}</Field>
                    <Field label="Reason required" error={err("reasonRequired")}>{editing ? <textarea style={styles.textarea} value={item.reasonRequired} onChange={(e) => updateCheck(item.id, "reasonRequired", e.target.value)} /> : <ReadOnly value={item.reasonRequired} />}</Field>
                    <Field label="Authority">{editing ? <input style={styles.input} value={item.authorityName} onChange={(e) => updateCheck(item.id, "authorityName", e.target.value)} /> : <ReadOnly value={item.authorityName} />}</Field>
                    <Field label="Application reference">{editing ? <input style={styles.input} value={item.applicationReference} onChange={(e) => updateCheck(item.id, "applicationReference", e.target.value)} /> : <ReadOnly value={item.applicationReference} />}</Field>
                    <Field label="Application date">{editing ? <input style={styles.input} type="date" value={item.applicationDate} onChange={(e) => updateCheck(item.id, "applicationDate", e.target.value)} /> : <ReadOnly value={item.applicationDate ? formatDate(item.applicationDate) : ""} />}</Field>
                    <Field label="Certificate reference">{editing ? <input style={styles.input} value={item.certificateReference} onChange={(e) => updateCheck(item.id, "certificateReference", e.target.value)} /> : <ReadOnly value={item.certificateReference} />}</Field>
                    <Field label="Certificate issue date">{editing ? <input style={styles.input} type="date" value={item.certificateIssueDate} onChange={(e) => updateCheck(item.id, "certificateIssueDate", e.target.value)} /> : <ReadOnly value={item.certificateIssueDate ? formatDate(item.certificateIssueDate) : ""} />}</Field>
                    <Field label="Certificate expiry date">{editing ? <input style={styles.input} type="date" value={item.certificateExpiryDate} onChange={(e) => updateCheck(item.id, "certificateExpiryDate", e.target.value)} /> : <ReadOnly value={item.certificateExpiryDate ? formatDate(item.certificateExpiryDate) : ""} />}</Field>
                  </div>

                  <div style={styles.checkboxGrid}>
                    <Checkbox checked={item.originalSeen} label="Original seen" disabled={!editing || isDisabled} onChange={(v) => updateCheck(item.id, "originalSeen", v)} />
                    <Checkbox checked={item.translationRequired} label="Translation required" disabled={!editing || isDisabled} onChange={(v) => updateCheck(item.id, "translationRequired", v)} />
                    <Checkbox checked={item.translationReceived} label="Translation received" disabled={!editing || isDisabled} onChange={(v) => updateCheck(item.id, "translationReceived", v)} />
                    <Checkbox checked={item.authenticityVerified} label="Authenticity verified" disabled={!editing || isDisabled || !resolvedPermissions.canVerify} onChange={(v) => updateCheck(item.id, "authenticityVerified", v)} />
                    <Checkbox checked={item.concernIdentified} label="Concern identified" disabled={!editing || isDisabled || !resolvedPermissions.canRecordConcerns} onChange={(v) => updateCheck(item.id, "concernIdentified", v)} />
                    <Checkbox checked={item.unableToObtain} label="Unable to obtain" disabled={!editing || isDisabled} onChange={(v) => updateCheck(item.id, "unableToObtain", v)} />
                    <Checkbox checked={item.riskAssessmentRequired} label="Risk assessment required" disabled={!editing || isDisabled} onChange={(v) => updateCheck(item.id, "riskAssessmentRequired", v)} />
                  </div>

                  <div style={styles.grid}>
                    {item.translationRequired ? <>
                      <Field label="Translator">{editing ? <input style={styles.input} value={item.translatorName} onChange={(e) => updateCheck(item.id, "translatorName", e.target.value)} /> : <ReadOnly value={item.translatorName} />}</Field>
                      <Field label="Translation date">{editing ? <input style={styles.input} type="date" value={item.translationDate} onChange={(e) => updateCheck(item.id, "translationDate", e.target.value)} /> : <ReadOnly value={item.translationDate ? formatDate(item.translationDate) : ""} />}</Field>
                    </> : null}
                    <Field label="Verified date" error={err("verifiedDate")}>{editing && resolvedPermissions.canVerify ? <input style={styles.input} type="date" value={item.verifiedDate} onChange={(e) => updateCheck(item.id, "verifiedDate", e.target.value)} /> : <ReadOnly value={item.verifiedDate ? formatDate(item.verifiedDate) : ""} />}</Field>
                    <Field label="Verified by" error={err("verifiedBy")}>{editing && resolvedPermissions.canVerify ? <input style={styles.input} value={item.verifiedBy} onChange={(e) => updateCheck(item.id, "verifiedBy", e.target.value)} /> : <ReadOnly value={item.verifiedBy} />}</Field>
                    <Field label="Verification method" error={err("verificationMethod")}>{editing && resolvedPermissions.canVerify ? <input style={styles.input} value={item.verificationMethod} onChange={(e) => updateCheck(item.id, "verificationMethod", e.target.value)} /> : <ReadOnly value={item.verificationMethod} />}</Field>
                    <Field label="Result summary">{editing ? <textarea style={styles.textarea} value={item.resultSummary} onChange={(e) => updateCheck(item.id, "resultSummary", e.target.value)} /> : <ReadOnly value={item.resultSummary} />}</Field>
                    {item.concernIdentified ? <Field label="Concern details" error={err("concernDetails")}>{editing ? <textarea style={styles.textarea} value={item.concernDetails} onChange={(e) => updateCheck(item.id, "concernDetails", e.target.value)} /> : <ReadOnly value={item.concernDetails} />}</Field> : null}
                    {item.unableToObtain ? <>
                      <Field label="Reason unable to obtain" error={err("unableToObtainReason")}>{editing ? <textarea style={styles.textarea} value={item.unableToObtainReason} onChange={(e) => updateCheck(item.id, "unableToObtainReason", e.target.value)} /> : <ReadOnly value={item.unableToObtainReason} />}</Field>
                      <Field label="Alternative evidence considered">{editing ? <textarea style={styles.textarea} value={item.alternativeEvidenceConsidered} onChange={(e) => updateCheck(item.id, "alternativeEvidenceConsidered", e.target.value)} /> : <ReadOnly value={item.alternativeEvidenceConsidered} />}</Field>
                    </> : null}
                    {item.riskAssessmentRequired ? <Field label="Risk assessment outcome" error={err("riskAssessmentOutcome")}>{editing ? <textarea style={styles.textarea} value={item.riskAssessmentOutcome} onChange={(e) => updateCheck(item.id, "riskAssessmentOutcome", e.target.value)} /> : <ReadOnly value={item.riskAssessmentOutcome} />}</Field> : null}
                    <Field label="Conditional controls">{editing ? <textarea style={styles.textarea} value={item.conditionalControls} onChange={(e) => updateCheck(item.id, "conditionalControls", e.target.value)} /> : <ReadOnly value={item.conditionalControls} />}</Field>
                    <Field label="Notes">{editing ? <textarea style={styles.textarea} value={item.notes} onChange={(e) => updateCheck(item.id, "notes", e.target.value)} /> : <ReadOnly value={item.notes} />}</Field>
                  </div>

                  {resolvedPermissions.canViewEvidence ? <section style={styles.innerSection}>
                    <h4 style={styles.innerTitle}><FileText size={16} />Evidence</h4>
                    <div style={styles.evidenceList}>
                      {evidence.map((ev) => <div key={ev.id} style={styles.evidenceCard}><FileText size={15} /><div style={{ flex: 1 }}><strong>{ev.fileName}</strong><small style={styles.small}>{ev.evidenceType} · {fileSize(ev.fileSizeBytes)} · {formatDateTime(ev.uploadedAt)}</small></div>{editing && resolvedPermissions.canDeleteEvidence ? <button type="button" style={styles.iconButton} onClick={async () => { setRemovedEvidenceIds((c) => [...new Set([...c, ev.id])]); await audit("overseas_evidence_removed", { checkId: item.id, evidenceId: ev.id }); }}><Trash2 size={14} /></button> : null}</div>)}
                      {queued.map((ev) => <div key={ev.id} style={styles.evidenceCard}><Upload size={15} /><div style={{ flex: 1 }}><strong>{ev.file.name}</strong><small style={styles.small}>Queued · {ev.evidenceType} · {fileSize(ev.file.size)}</small></div><button type="button" style={styles.iconButton} onClick={() => setPendingFiles((c) => c.filter((f) => f.id !== ev.id))}><X size={14} /></button></div>)}
                    </div>
                    {editing && resolvedPermissions.canUploadEvidence ? <div style={styles.uploadRow}><input style={styles.input} value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} placeholder="Evidence type" /><button type="button" style={styles.secondaryButton} onClick={() => { setUploadTarget(item.id); requestAnimationFrame(() => fileRef.current?.click()); }}><Upload size={15} />Add evidence</button></div> : null}
                  </section> : null}

                  {resolvedPermissions.canViewHistory ? <section style={styles.innerSection}><h4 style={styles.innerTitle}><History size={16} />History</h4>{item.history.length === 0 ? <div style={styles.empty}>No history recorded.</div> : item.history.map((h) => <article key={h.id} style={styles.historyCard}><strong>{h.action}</strong><span>{formatDateTime(h.occurredAt)} · {h.occurredBy}</span>{h.notes ? <span>{h.notes}</span> : null}</article>)}</section> : null}
                </div> : null}
              </article>;
            })}
          </div>
        </section>
      </div>
      {editing ? <footer style={styles.footer}><span>{isDirty ? "Unsaved changes" : "No unsaved changes"}</span><div style={styles.actions}><button type="button" style={styles.tertiaryButton} disabled={!isDirty || isDisabled} onClick={() => { setDraft(original); setErrors({}); setPendingFiles([]); setRemovedEvidenceIds([]); setRemovedCheckIds([]); }}><RotateCcw size={14} />Reset</button><button type="button" style={styles.secondaryButton} onClick={async () => { setDraft(original); setEditing(false); onCancel?.(); await audit("overseas_checks_edit_cancelled"); }}><X size={15} />Cancel</button><button type="submit" style={styles.primaryButton} disabled={!isDirty || isDisabled || !onSave}>{isSaving ? <Loader2 size={15} className="leo-spin" /> : <Save size={15} />}{isSaving ? "Saving..." : "Save overseas checks"}</button></div></footer> : null}
    </form>
    <style>{`@keyframes leo-spin{to{transform:rotate(360deg)}}.leo-spin{animation:leo-spin .8s linear infinite}input[type=checkbox]{accent-color:#6E5084}`}</style>
  </section>;
}

const styles: Record<string, React.CSSProperties> = {
  card: { border: "1px solid #E7DDED", borderRadius: 18, background: "#fff", overflow: "hidden", boxShadow: "0 12px 32px rgba(71,49,81,.05)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "20px 22px", borderBottom: "1px solid #EEE5F2", background: "linear-gradient(135deg,#fff,#FCF9FE)" },
  identity: { display: "flex", alignItems: "center", gap: 12 }, icon: { width: 42, height: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 13, background: "#F2EAF7", color: "#6E5084" },
  titleRow: { display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }, title: { margin: 0, fontSize: 17, color: "#342B38" }, subtitle: { margin: "4px 0 0", color: "#847789", fontSize: 12 },
  badge: { border: "1px solid #DDD2E3", borderRadius: 999, background: "#F8F5FA", color: "#6E5084", padding: "5px 8px", fontSize: 10, fontWeight: 800 },
  actions: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }, content: { display: "grid", gap: 18, padding: 22 },
  section: { display: "grid", gap: 16, padding: 20, border: "1px solid #ECE4F0", borderRadius: 15 }, innerSection: { display: "grid", gap: 12, paddingTop: 8 }, innerTitle: { margin: 0, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#554A59" },
  sectionTitle: { margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#403545", fontSize: 14 }, sectionAction: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }, checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 },
  checkbox: { display: "flex", alignItems: "center", gap: 9, minHeight: 46, border: "1px solid #DED3E4", borderRadius: 10, background: "#FAF7FC", padding: 11, fontSize: 11 },
  field: { display: "flex", flexDirection: "column", gap: 7 }, label: { color: "#594D5E", fontSize: 11, fontWeight: 750 }, input: { width: "100%", minHeight: 42, boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: 10, background: "#fff", color: "#3F3543", padding: "10px 11px", font: "inherit", fontSize: 12 },
  textarea: { width: "100%", minHeight: 90, boxSizing: "border-box", resize: "vertical", border: "1px solid #DCCFE3", borderRadius: 10, padding: 11, font: "inherit", fontSize: 12 },
  readOnly: { minHeight: 42, display: "flex", alignItems: "center", border: "1px solid #EEE7F1", borderRadius: 10, background: "#FBF9FC", color: "#4D414F", padding: "10px 11px", fontSize: 12, whiteSpace: "pre-wrap" },
  error: { display: "flex", gap: 5, margin: 0, color: "#9A5668", fontSize: 10 }, list: { display: "grid", gap: 12 }, recordCard: { border: "1px solid #E7DFEB", borderRadius: 13, overflow: "hidden" },
  recordHeader: { display: "flex", alignItems: "center", gap: 8, padding: 10, background: "#FCFAFD" }, recordToggle: { flex: 1, display: "flex", alignItems: "center", gap: 10, border: 0, background: "transparent", color: "#4A3E4E", cursor: "pointer" },
  recordIcon: { width: 34, height: 34, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F2EAF7", color: "#6E5084" }, recordBody: { display: "grid", gap: 18, padding: 18, borderTop: "1px solid #EEE7F1" },
  small: { display: "block", marginTop: 4, color: "#8B7F90", fontSize: 10 }, evidenceList: { display: "grid", gap: 8 }, evidenceCard: { display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid #E7DFEB", borderRadius: 10 },
  uploadRow: { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }, historyCard: { display: "grid", gap: 4, padding: 10, borderBottom: "1px solid #F0EAF2", color: "#6B5E70", fontSize: 11 }, empty: { minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #DDD2E3", borderRadius: 12, color: "#887C8D", fontSize: 11 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "16px 22px", borderTop: "1px solid #EEE6F1", background: "#FCFAFD", color: "#7C7081", fontSize: 11 },
  primaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: "1px solid #6E5084", borderRadius: 9, background: "#6E5084", color: "#fff", padding: "8px 13px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: "1px solid #DCCFE3", borderRadius: 9, background: "#fff", color: "#6E5084", padding: "8px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  tertiaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: 0, borderRadius: 9, background: "transparent", color: "#766A7A", padding: "8px 10px", fontSize: 11, fontWeight: 750, cursor: "pointer" },
  iconButton: { width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #E4DBE8", borderRadius: 9, background: "#fff", color: "#766A7A", cursor: "pointer" },
  errorBanner: { display: "flex", gap: 9, margin: "18px 22px 0", border: "1px solid #E8CBD2", borderRadius: 11, background: "#FFF7F8", color: "#8B4E5D", padding: "11px 13px", fontSize: 11 },
  successBanner: { display: "flex", gap: 9, margin: "18px 22px 0", border: "1px solid #CFE6D8", borderRadius: 11, background: "#F5FCF8", color: "#527460", padding: "11px 13px", fontSize: 11 },
  access: { display: "flex", gap: 12, border: "1px solid #E6DCEB", borderRadius: 16, background: "#FBF8FC", padding: 20, color: "#6E5084" },
};