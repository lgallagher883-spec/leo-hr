"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  History,
  IdCard,
  Loader2,
  LockKeyhole,
  Pencil,
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

export type IdentityVerificationMode = "candidate" | "employee";

export type IdentityVerificationStatus =
  | "not_started"
  | "awaiting_evidence"
  | "awaiting_verification"
  | "verified"
  | "follow_up_required"
  | "failed"
  | "not_required";

export type IdentityDocumentType =
  | ""
  | "passport"
  | "driving_licence"
  | "birth_certificate"
  | "adoption_certificate"
  | "national_identity_card"
  | "residence_document"
  | "name_change_document"
  | "marriage_certificate"
  | "deed_poll"
  | "other";

export type IdentityEvidence = {
  id: string;
  documentType: IdentityDocumentType;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  filePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  description?: string;
  current: boolean;
};

export type IdentityVerificationHistoryEntry = {
  id: string;
  verifiedAt: string;
  verifiedBy: string;
  status: IdentityVerificationStatus;
  method: string;
  documentsChecked: string[];
  notes?: string;
};

export type IdentityVerificationValue = {
  status: IdentityVerificationStatus;
  legalName: string;
  preferredName: string;
  previousNames: string;
  dateOfBirth: string;
  nationality: string;
  identityDocumentType: IdentityDocumentType;
  documentReference: string;
  issuingCountry: string;
  issueDate: string;
  expiryDate: string;
  addressEvidenceSeen: boolean;
  addressEvidenceType: string;
  addressEvidenceDate: string;
  photographMatched: boolean;
  dateOfBirthMatched: boolean;
  legalNameMatched: boolean;
  addressMatched: boolean;
  nameDifferenceIdentified: boolean;
  nameDifferenceExplanation: string;
  originalDocumentSeen: boolean;
  digitalVerificationCompleted: boolean;
  verificationMethod: string;
  verifiedDate: string;
  verifiedBy: string;
  followUpRequired: boolean;
  followUpDate: string;
  followUpOwner: string;
  verificationOutcome: string;
  notes: string;
  evidence: IdentityEvidence[];
  verificationHistory: IdentityVerificationHistoryEntry[];
};

export type IdentityVerificationPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewDocumentReference: boolean;
  canEditDocumentReference: boolean;
  canVerify: boolean;
  canViewEvidence: boolean;
  canUploadEvidence: boolean;
  canDeleteEvidence: boolean;
  canViewHistory: boolean;
};

export type IdentityVerificationSavePayload = {
  value: IdentityVerificationValue;
  changedFields: string[];
  newFiles: Array<{ file: File; documentType: IdentityDocumentType }>;
  removedEvidenceIds: string[];
};

export type IdentityVerificationAuditEvent = {
  action:
    | "identity_verification_edit_started"
    | "identity_verification_edit_cancelled"
    | "identity_verification_saved"
    | "identity_evidence_selected"
    | "identity_evidence_removed"
    | "identity_verification_completed";
  mode: IdentityVerificationMode;
  recordId?: string | number;
  changedFields?: string[];
  evidenceId?: string;
  occurredAt: string;
};

export type IdentityVerificationDetailsProps = {
  mode: IdentityVerificationMode;
  value?: Partial<IdentityVerificationValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<IdentityVerificationPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (payload: IdentityVerificationSavePayload) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (event: IdentityVerificationAuditEvent) => Promise<void> | void;
};

type Errors = Partial<Record<keyof IdentityVerificationValue, string>>;
type PendingFile = { id: string; file: File; documentType: IdentityDocumentType };

const EMPTY_VALUE: IdentityVerificationValue = {
  status: "not_started",
  legalName: "",
  preferredName: "",
  previousNames: "",
  dateOfBirth: "",
  nationality: "",
  identityDocumentType: "",
  documentReference: "",
  issuingCountry: "",
  issueDate: "",
  expiryDate: "",
  addressEvidenceSeen: false,
  addressEvidenceType: "",
  addressEvidenceDate: "",
  photographMatched: false,
  dateOfBirthMatched: false,
  legalNameMatched: false,
  addressMatched: false,
  nameDifferenceIdentified: false,
  nameDifferenceExplanation: "",
  originalDocumentSeen: false,
  digitalVerificationCompleted: false,
  verificationMethod: "",
  verifiedDate: "",
  verifiedBy: "",
  followUpRequired: false,
  followUpDate: "",
  followUpOwner: "",
  verificationOutcome: "",
  notes: "",
  evidence: [],
  verificationHistory: [],
};

const DEFAULT_PERMISSIONS: IdentityVerificationPermissions = {
  canView: true,
  canEdit: true,
  canViewDocumentReference: true,
  canEditDocumentReference: true,
  canVerify: true,
  canViewEvidence: true,
  canUploadEvidence: true,
  canDeleteEvidence: true,
  canViewHistory: true,
};

const STATUS_OPTIONS: Array<{ value: IdentityVerificationStatus; label: string }> = [
  { value: "not_started", label: "Not started" },
  { value: "awaiting_evidence", label: "Awaiting evidence" },
  { value: "awaiting_verification", label: "Awaiting verification" },
  { value: "verified", label: "Verified" },
  { value: "follow_up_required", label: "Follow-up required" },
  { value: "failed", label: "Verification failed" },
  { value: "not_required", label: "Not required" },
];

const DOCUMENT_OPTIONS: Array<{ value: IdentityDocumentType; label: string }> = [
  { value: "", label: "Select document type" },
  { value: "passport", label: "Passport" },
  { value: "driving_licence", label: "Driving licence" },
  { value: "birth_certificate", label: "Birth certificate" },
  { value: "adoption_certificate", label: "Adoption certificate" },
  { value: "national_identity_card", label: "National identity card" },
  { value: "residence_document", label: "Residence document" },
  { value: "name_change_document", label: "Name-change document" },
  { value: "marriage_certificate", label: "Marriage certificate" },
  { value: "deed_poll", label: "Deed poll" },
  { value: "other", label: "Other" },
];

function normalise(value?: Partial<IdentityVerificationValue>): IdentityVerificationValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    evidence: value?.evidence ?? [],
    verificationHistory: value?.verificationHistory ?? [],
  };
}

function cleaned(value: IdentityVerificationValue): IdentityVerificationValue {
  return {
    ...value,
    legalName: value.legalName.trim(),
    preferredName: value.preferredName.trim(),
    previousNames: value.previousNames.trim(),
    nationality: value.nationality.trim(),
    documentReference: value.documentReference.trim().toUpperCase(),
    issuingCountry: value.issuingCountry.trim(),
    addressEvidenceType: value.addressEvidenceType.trim(),
    nameDifferenceExplanation: value.nameDifferenceExplanation.trim(),
    verificationMethod: value.verificationMethod.trim(),
    verifiedBy: value.verifiedBy.trim(),
    followUpOwner: value.followUpOwner.trim(),
    verificationOutcome: value.verificationOutcome.trim(),
    notes: value.notes.trim(),
  };
}

function getChangedFields(original: IdentityVerificationValue, current: IdentityVerificationValue): string[] {
  const a = cleaned(original);
  const b = cleaned(current);
  const ignored = new Set(["evidence", "verificationHistory"]);
  return (Object.keys(a) as Array<keyof IdentityVerificationValue>)
    .filter((key) => !ignored.has(String(key)) && a[key] !== b[key])
    .map(String);
}

function validate(value: IdentityVerificationValue): Errors {
  const errors: Errors = {};
  const verificationComplete = value.status === "verified";

  if (value.status !== "not_required" && !value.legalName.trim()) {
    errors.legalName = "Enter the legal name being verified.";
  }
  if (value.status !== "not_required" && !value.dateOfBirth) {
    errors.dateOfBirth = "Enter the date of birth being verified.";
  }
  if (verificationComplete && !value.identityDocumentType) {
    errors.identityDocumentType = "Select the primary identity document checked.";
  }
  if (verificationComplete && !value.verifiedDate) {
    errors.verifiedDate = "Enter the verification date.";
  }
  if (verificationComplete && !value.verifiedBy.trim()) {
    errors.verifiedBy = "Enter who completed the verification.";
  }
  if (verificationComplete && !value.verificationMethod.trim()) {
    errors.verificationMethod = "Record how identity was verified.";
  }
  if (verificationComplete && !value.legalNameMatched) {
    errors.legalNameMatched = "Confirm that the legal name matched.";
  }
  if (verificationComplete && !value.dateOfBirthMatched) {
    errors.dateOfBirthMatched = "Confirm that the date of birth matched.";
  }
  if (value.nameDifferenceIdentified && !value.nameDifferenceExplanation.trim()) {
    errors.nameDifferenceExplanation = "Explain the name difference and supporting evidence.";
  }
  if (value.followUpRequired && !value.followUpDate) {
    errors.followUpDate = "Enter the follow-up date.";
  }
  if (value.followUpRequired && !value.followUpOwner.trim()) {
    errors.followUpOwner = "Assign the follow-up owner.";
  }
  if (value.issueDate && value.expiryDate && value.expiryDate < value.issueDate) {
    errors.expiryDate = "The expiry date cannot be before the issue date.";
  }
  return errors;
}

const formatDate = (value?: string) => {
  if (!value) return "Not recorded";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
};

const formatDateTime = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
};

const formatFileSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

const labelForStatus = (value: IdentityVerificationStatus) =>
  STATUS_OPTIONS.find((item) => item.value === value)?.label ?? value;

const labelForDocument = (value: IdentityDocumentType) =>
  DOCUMENT_OPTIONS.find((item) => item.value === value)?.label ?? "Not recorded";

function Field({ label, children, error, restricted }: { label: string; children: ReactNode; error?: string; restricted?: boolean }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
        {restricted ? <span style={styles.restricted}><LockKeyhole size={10} />Restricted</span> : null}
      </label>
      {children}
      {error ? <p style={styles.error}><AlertCircle size={12} />{error}</p> : null}
    </div>
  );
}

function ReadOnly({ value, restricted = false }: { value?: string; restricted?: boolean }) {
  return <span style={styles.readOnly}>{restricted ? <><LockKeyhole size={13} />Restricted</> : value || "Not recorded"}</span>;
}

function Checkbox({ checked, label, disabled, onChange }: { checked: boolean; label: string; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label style={styles.checkbox}><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>;
}

export default function IdentityVerificationDetails({
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
}: IdentityVerificationDetailsProps) {
  const resolvedPermissions = useMemo(() => ({ ...DEFAULT_PERMISSIONS, ...permissions }), [permissions]);
  const supplied = useMemo(() => normalise(value), [value]);
  const [original, setOriginal] = useState(supplied);
  const [draft, setDraft] = useState(supplied);
  const [editing, setEditing] = useState(startInEditMode && resolvedPermissions.canEdit);
  const [errors, setErrors] = useState<Errors>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedEvidenceIds, setRemovedEvidenceIds] = useState<string[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<IdentityDocumentType>("passport");
  const [localSaving, setLocalSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setOriginal(supplied);
    setDraft(supplied);
    setErrors({});
    setPendingFiles([]);
    setRemovedEvidenceIds([]);
  }, [supplied]);

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;
  const changedFields = useMemo(() => getChangedFields(original, draft), [original, draft]);
  const isDirty = changedFields.length > 0 || pendingFiles.length > 0 || removedEvidenceIds.length > 0;
  const visibleEvidence = draft.evidence.filter((item) => !removedEvidenceIds.includes(item.id));

  async function audit(action: IdentityVerificationAuditEvent["action"], extra: Partial<IdentityVerificationAuditEvent> = {}) {
    await onAudit?.({ action, mode, recordId, occurredAt: new Date().toISOString(), ...extra });
  }

  function update<K extends keyof IdentityVerificationValue>(key: K, next: IdentityVerificationValue[K]) {
    setDraft((current) => ({ ...current, [key]: next }));
    setErrors((current) => {
      const copy = { ...current };
      delete copy[key];
      return copy;
    });
  }

  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.size <= 15 * 1024 * 1024);
    setPendingFiles((current) => [
      ...current,
      ...files.map((file) => ({ id: crypto.randomUUID(), file, documentType: selectedDocumentType })),
    ]);
    if (files.length) await audit("identity_evidence_selected");
    event.target.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSave || isDisabled || !resolvedPermissions.canEdit) return;
    const validation = validate(draft);
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    const clean = cleaned(draft);
    const fields = getChangedFields(original, clean);
    try {
      setLocalSaving(true);
      await onSave({
        value: clean,
        changedFields: fields,
        newFiles: pendingFiles.map(({ file, documentType }) => ({ file, documentType })),
        removedEvidenceIds,
      });
      setOriginal(clean);
      setDraft(clean);
      setPendingFiles([]);
      setRemovedEvidenceIds([]);
      setEditing(false);
      await audit("identity_verification_saved", { changedFields: fields });
      if (clean.status === "verified") await audit("identity_verification_completed", { changedFields: fields });
    } finally {
      setLocalSaving(false);
    }
  }

  if (!resolvedPermissions.canView) {
    return <section style={styles.access}><LockKeyhole size={20} /><div><h2>Identity verification is restricted</h2><p>Your current permission level does not allow access to this record.</p></div></section>;
  }

  return (
    <section style={styles.card}>
      <header style={styles.header}>
        <div style={styles.identity}>
          <span style={styles.icon}><IdCard size={21} /></span>
          <div>
            <div style={styles.titleRow}>
              <h2 style={styles.title}>Identity verification</h2>
              <span style={styles.badge}>{labelForStatus(draft.status)}</span>
            </div>
            <p style={styles.subtitle}>{recordLabel || (mode === "candidate" ? "Candidate record" : "Employee record")}{recordId !== undefined ? ` · Record ${String(recordId)}` : ""}</p>
          </div>
        </div>
        <div style={styles.actions}>
          {headerActions}
          {!editing && resolvedPermissions.canEdit ? (
            <button type="button" style={styles.secondaryButton} disabled={isDisabled} onClick={async () => { setEditing(true); await audit("identity_verification_edit_started"); }}>
              <Pencil size={15} />Edit identity verification
            </button>
          ) : null}
        </div>
      </header>

      {errorMessage ? <div style={styles.errorBanner}><AlertCircle size={16} />{errorMessage}</div> : null}
      {successMessage ? <div style={styles.successBanner}><Check size={16} />{successMessage}</div> : null}

      <form onSubmit={submit}>
        <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={selectFiles} style={{ display: "none" }} />
        <div style={styles.content}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><ShieldCheck size={18} />Identity record</h3>
            <div style={styles.grid}>
              <Field label="Status">{editing ? <select style={styles.input} value={draft.status} onChange={(e) => update("status", e.target.value as IdentityVerificationStatus)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={labelForStatus(draft.status)} />}</Field>
              <Field label="Legal name" error={errors.legalName}>{editing ? <input style={styles.input} value={draft.legalName} onChange={(e) => update("legalName", e.target.value)} /> : <ReadOnly value={draft.legalName} />}</Field>
              <Field label="Preferred name">{editing ? <input style={styles.input} value={draft.preferredName} onChange={(e) => update("preferredName", e.target.value)} /> : <ReadOnly value={draft.preferredName} />}</Field>
              <Field label="Previous names">{editing ? <input style={styles.input} value={draft.previousNames} onChange={(e) => update("previousNames", e.target.value)} /> : <ReadOnly value={draft.previousNames} />}</Field>
              <Field label="Date of birth" error={errors.dateOfBirth}>{editing ? <input style={styles.input} type="date" value={draft.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} /> : <ReadOnly value={draft.dateOfBirth ? formatDate(draft.dateOfBirth) : ""} />}</Field>
              <Field label="Nationality">{editing ? <input style={styles.input} value={draft.nationality} onChange={(e) => update("nationality", e.target.value)} /> : <ReadOnly value={draft.nationality} />}</Field>
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><IdCard size={18} />Primary identity document</h3>
            <div style={styles.grid}>
              <Field label="Document type" error={errors.identityDocumentType}>{editing ? <select style={styles.input} value={draft.identityDocumentType} onChange={(e) => update("identityDocumentType", e.target.value as IdentityDocumentType)}>{DOCUMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={labelForDocument(draft.identityDocumentType)} />}</Field>
              <Field label="Document reference" restricted>{!resolvedPermissions.canViewDocumentReference ? <ReadOnly restricted /> : editing && resolvedPermissions.canEditDocumentReference ? <input style={styles.input} value={draft.documentReference} onChange={(e) => update("documentReference", e.target.value)} /> : <ReadOnly value={draft.documentReference} />}</Field>
              <Field label="Issuing country">{editing ? <input style={styles.input} value={draft.issuingCountry} onChange={(e) => update("issuingCountry", e.target.value)} /> : <ReadOnly value={draft.issuingCountry} />}</Field>
              <Field label="Issue date">{editing ? <input style={styles.input} type="date" value={draft.issueDate} onChange={(e) => update("issueDate", e.target.value)} /> : <ReadOnly value={draft.issueDate ? formatDate(draft.issueDate) : ""} />}</Field>
              <Field label="Expiry date" error={errors.expiryDate}>{editing ? <input style={styles.input} type="date" value={draft.expiryDate} onChange={(e) => update("expiryDate", e.target.value)} /> : <ReadOnly value={draft.expiryDate ? formatDate(draft.expiryDate) : ""} />}</Field>
            </div>
            <div style={styles.checkboxGrid}>
              <Checkbox checked={draft.originalDocumentSeen} label="Original document seen" disabled={!editing || isDisabled} onChange={(v) => update("originalDocumentSeen", v)} />
              <Checkbox checked={draft.digitalVerificationCompleted} label="Digital verification completed" disabled={!editing || isDisabled} onChange={(v) => update("digitalVerificationCompleted", v)} />
              <Checkbox checked={draft.photographMatched} label="Photograph matched" disabled={!editing || isDisabled} onChange={(v) => update("photographMatched", v)} />
              <Checkbox checked={draft.legalNameMatched} label="Legal name matched" disabled={!editing || isDisabled} onChange={(v) => update("legalNameMatched", v)} />
              <Checkbox checked={draft.dateOfBirthMatched} label="Date of birth matched" disabled={!editing || isDisabled} onChange={(v) => update("dateOfBirthMatched", v)} />
              <Checkbox checked={draft.addressMatched} label="Address matched" disabled={!editing || isDisabled} onChange={(v) => update("addressMatched", v)} />
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}><CheckCircle2 size={18} />Verification decision</h3>
            <div style={styles.checkboxGrid}>
              <Checkbox checked={draft.nameDifferenceIdentified} label="Name difference identified" disabled={!editing || isDisabled} onChange={(v) => update("nameDifferenceIdentified", v)} />
              <Checkbox checked={draft.followUpRequired} label="Follow-up required" disabled={!editing || isDisabled} onChange={(v) => update("followUpRequired", v)} />
              <Checkbox checked={draft.addressEvidenceSeen} label="Address evidence seen" disabled={!editing || isDisabled} onChange={(v) => update("addressEvidenceSeen", v)} />
            </div>
            <div style={styles.grid}>
              {draft.nameDifferenceIdentified ? <Field label="Name difference explanation" error={errors.nameDifferenceExplanation}>{editing ? <textarea style={styles.textarea} value={draft.nameDifferenceExplanation} onChange={(e) => update("nameDifferenceExplanation", e.target.value)} /> : <ReadOnly value={draft.nameDifferenceExplanation} />}</Field> : null}
              <Field label="Verification method" error={errors.verificationMethod}>{editing && resolvedPermissions.canVerify ? <input style={styles.input} value={draft.verificationMethod} onChange={(e) => update("verificationMethod", e.target.value)} /> : <ReadOnly value={draft.verificationMethod} />}</Field>
              <Field label="Verified date" error={errors.verifiedDate}>{editing && resolvedPermissions.canVerify ? <input style={styles.input} type="date" value={draft.verifiedDate} onChange={(e) => update("verifiedDate", e.target.value)} /> : <ReadOnly value={draft.verifiedDate ? formatDate(draft.verifiedDate) : ""} />}</Field>
              <Field label="Verified by" error={errors.verifiedBy}>{editing && resolvedPermissions.canVerify ? <input style={styles.input} value={draft.verifiedBy} onChange={(e) => update("verifiedBy", e.target.value)} /> : <ReadOnly value={draft.verifiedBy} />}</Field>
              {draft.followUpRequired ? <>
                <Field label="Follow-up date" error={errors.followUpDate}>{editing ? <input style={styles.input} type="date" value={draft.followUpDate} onChange={(e) => update("followUpDate", e.target.value)} /> : <ReadOnly value={draft.followUpDate ? formatDate(draft.followUpDate) : ""} />}</Field>
                <Field label="Follow-up owner" error={errors.followUpOwner}>{editing ? <input style={styles.input} value={draft.followUpOwner} onChange={(e) => update("followUpOwner", e.target.value)} /> : <ReadOnly value={draft.followUpOwner} />}</Field>
              </> : null}
              <Field label="Verification outcome">{editing ? <textarea style={styles.textarea} value={draft.verificationOutcome} onChange={(e) => update("verificationOutcome", e.target.value)} /> : <ReadOnly value={draft.verificationOutcome} />}</Field>
              <Field label="Notes">{editing ? <textarea style={styles.textarea} value={draft.notes} onChange={(e) => update("notes", e.target.value)} /> : <ReadOnly value={draft.notes} />}</Field>
            </div>
          </section>

          {resolvedPermissions.canViewEvidence ? (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}><FileText size={18} />Evidence</h3>
              <div style={styles.evidenceList}>
                {visibleEvidence.map((item) => (
                  <div key={item.id} style={styles.evidenceCard}>
                    <FileText size={16} />
                    <div style={{ flex: 1 }}>
                      <strong>{item.fileName}</strong>
                      <small style={styles.small}>{labelForDocument(item.documentType)} · {formatFileSize(item.fileSizeBytes)} · {formatDateTime(item.uploadedAt)}</small>
                    </div>
                    {editing && resolvedPermissions.canDeleteEvidence ? <button type="button" style={styles.iconButton} onClick={async () => { setRemovedEvidenceIds((c) => [...new Set([...c, item.id])]); await audit("identity_evidence_removed", { evidenceId: item.id }); }}><Trash2 size={14} /></button> : null}
                  </div>
                ))}
                {pendingFiles.map((item) => (
                  <div key={item.id} style={styles.evidenceCard}>
                    <Upload size={16} />
                    <div style={{ flex: 1 }}>
                      <strong>{item.file.name}</strong>
                      <small style={styles.small}>Queued · {labelForDocument(item.documentType)} · {formatFileSize(item.file.size)}</small>
                    </div>
                    <button type="button" style={styles.iconButton} onClick={() => setPendingFiles((c) => c.filter((f) => f.id !== item.id))}><X size={14} /></button>
                  </div>
                ))}
              </div>
              {editing && resolvedPermissions.canUploadEvidence ? <div style={styles.uploadRow}><select style={styles.input} value={selectedDocumentType} onChange={(e) => setSelectedDocumentType(e.target.value as IdentityDocumentType)}>{DOCUMENT_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select><button type="button" style={styles.secondaryButton} onClick={() => fileRef.current?.click()}><Upload size={15} />Add evidence</button></div> : null}
            </section>
          ) : null}

          {resolvedPermissions.canViewHistory ? (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}><History size={18} />Verification history</h3>
              {draft.verificationHistory.length === 0 ? <div style={styles.empty}>No verification history recorded.</div> : draft.verificationHistory.map((entry) => <article key={entry.id} style={styles.historyCard}><strong>{labelForStatus(entry.status)}</strong><span>{formatDateTime(entry.verifiedAt)} · {entry.verifiedBy}</span><span>{entry.method}</span>{entry.notes ? <span>{entry.notes}</span> : null}</article>)}
            </section>
          ) : null}
        </div>

        {editing ? <footer style={styles.footer}><span>{isDirty ? "Unsaved changes" : "No unsaved changes"}</span><div style={styles.actions}><button type="button" style={styles.tertiaryButton} disabled={!isDirty || isDisabled} onClick={() => { setDraft(original); setErrors({}); setPendingFiles([]); setRemovedEvidenceIds([]); }}><RotateCcw size={14} />Reset</button><button type="button" style={styles.secondaryButton} disabled={isDisabled} onClick={async () => { setDraft(original); setEditing(false); setErrors({}); setPendingFiles([]); setRemovedEvidenceIds([]); onCancel?.(); await audit("identity_verification_edit_cancelled"); }}><X size={15} />Cancel</button><button type="submit" style={styles.primaryButton} disabled={!isDirty || isDisabled || !onSave}>{isSaving ? <Loader2 size={15} className="leo-spin" /> : <Save size={15} />}{isSaving ? "Saving..." : "Save identity verification"}</button></div></footer> : null}
      </form>
      <style>{`@keyframes leo-spin{to{transform:rotate(360deg)}}.leo-spin{animation:leo-spin .8s linear infinite}input[type=checkbox]{accent-color:#6E5084}button:disabled,input:disabled,select:disabled,textarea:disabled{cursor:not-allowed;opacity:.6}`}</style>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { border: "1px solid #E7DDED", borderRadius: 18, background: "#fff", overflow: "hidden", boxShadow: "0 12px 32px rgba(71,49,81,.05)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "20px 22px", borderBottom: "1px solid #EEE5F2", background: "linear-gradient(135deg,#fff,#FCF9FE)" },
  identity: { display: "flex", alignItems: "center", gap: 12 },
  icon: { width: 42, height: 42, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 13, background: "#F2EAF7", color: "#6E5084" },
  titleRow: { display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" },
  title: { margin: 0, fontSize: 17, color: "#342B38" },
  subtitle: { margin: "4px 0 0", color: "#847789", fontSize: 12 },
  badge: { border: "1px solid #DDD2E3", borderRadius: 999, background: "#F8F5FA", color: "#6E5084", padding: "5px 8px", fontSize: 10, fontWeight: 800 },
  actions: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  content: { display: "grid", gap: 18, padding: 22 },
  section: { display: "grid", gap: 16, padding: 20, border: "1px solid #ECE4F0", borderRadius: 15 },
  sectionTitle: { margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#403545", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 },
  checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 },
  checkbox: { display: "flex", alignItems: "center", gap: 9, minHeight: 46, border: "1px solid #DED3E4", borderRadius: 10, background: "#FAF7FC", padding: 11, fontSize: 11 },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { display: "flex", alignItems: "center", gap: 6, color: "#594D5E", fontSize: 11, fontWeight: 750 },
  restricted: { display: "inline-flex", alignItems: "center", gap: 3, background: "#F3EEF5", borderRadius: 999, padding: "3px 6px", fontSize: 9 },
  input: { width: "100%", minHeight: 42, boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: 10, background: "#fff", color: "#3F3543", padding: "10px 11px", font: "inherit", fontSize: 12 },
  textarea: { width: "100%", minHeight: 92, boxSizing: "border-box", resize: "vertical", border: "1px solid #DCCFE3", borderRadius: 10, padding: 11, font: "inherit", fontSize: 12 },
  readOnly: { minHeight: 42, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 7, border: "1px solid #EEE7F1", borderRadius: 10, background: "#FBF9FC", color: "#4D414F", padding: "10px 11px", fontSize: 12, whiteSpace: "pre-wrap" },
  error: { display: "flex", gap: 5, margin: 0, color: "#9A5668", fontSize: 10 },
  evidenceList: { display: "grid", gap: 8 },
  evidenceCard: { display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid #E7DFEB", borderRadius: 10 },
  small: { display: "block", marginTop: 4, color: "#8B7F90", fontSize: 10 },
  uploadRow: { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" },
  iconButton: { width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #E4DBE8", borderRadius: 9, background: "#fff", color: "#766A7A", cursor: "pointer" },
  historyCard: { display: "grid", gap: 4, padding: 12, border: "1px solid #E7DFEB", borderRadius: 10, color: "#6B5E70", fontSize: 11 },
  empty: { minHeight: 90, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #DDD2E3", borderRadius: 12, color: "#887C8D", fontSize: 11 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "16px 22px", borderTop: "1px solid #EEE6F1", background: "#FCFAFD", color: "#7C7081", fontSize: 11 },
  primaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: "1px solid #6E5084", borderRadius: 9, background: "#6E5084", color: "#fff", padding: "8px 13px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: "1px solid #DCCFE3", borderRadius: 9, background: "#fff", color: "#6E5084", padding: "8px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  tertiaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: 0, borderRadius: 9, background: "transparent", color: "#766A7A", padding: "8px 10px", fontSize: 11, fontWeight: 750, cursor: "pointer" },
  errorBanner: { display: "flex", gap: 9, margin: "18px 22px 0", border: "1px solid #E8CBD2", borderRadius: 11, background: "#FFF7F8", color: "#8B4E5D", padding: "11px 13px", fontSize: 11 },
  successBanner: { display: "flex", gap: 9, margin: "18px 22px 0", border: "1px solid #CFE6D8", borderRadius: 11, background: "#F5FCF8", color: "#527460", padding: "11px 13px", fontSize: 11 },
  access: { display: "flex", gap: 12, border: "1px solid #E6DCEB", borderRadius: 16, background: "#FBF8FC", padding: 20, color: "#6E5084" },
};