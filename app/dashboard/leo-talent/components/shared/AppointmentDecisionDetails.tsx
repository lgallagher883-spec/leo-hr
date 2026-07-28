"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  History,
  Loader2,
  LockKeyhole,
  Pencil,
  RotateCcw,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppointmentDecisionMode = "candidate" | "employee";

export type AppointmentDecisionOutcome =
  | "pending"
  | "ready_for_appointment"
  | "not_ready"
  | "withdrawn";

export type AppointmentControlStatus =
  | "not_required"
  | "not_started"
  | "in_progress"
  | "complete"
  | "concern"
  | "waived";

export type AppointmentControlKey =
  | "identity"
  | "right_to_work"
  | "references"
  | "dbs"
  | "overseas_checks"
  | "qualifications"
  | "professional_registration"
  | "driving"
  | "vehicle"
  | "health_after_offer"
  | "other";

export type AppointmentControlRecord = {
  key: AppointmentControlKey;
  label: string;
  required: boolean;
  status: AppointmentControlStatus;
  completedDate: string;
  completedBy: string;
  concernSummary: string;
  waiverReason: string;
};

export type AppointmentDecisionHistoryEntry = {
  id: string;
  occurredAt: string;
  occurredBy: string;
  outcome: AppointmentDecisionOutcome;
  notes?: string;
};

export type AppointmentDecisionValue = {
  outcome: AppointmentDecisionOutcome;
  saferRecruitmentRequired: boolean;
  allMandatoryChecksComplete: boolean;
  unresolvedConcernsPresent: boolean;
  unresolvedConcernSummary: string;
  conditionsApply: boolean;
  conditions: string;
  conditionOwner: string;
  conditionReviewDate: string;
  proposedStartDate: string;
  approvedStartDate: string;
  appointmentReference: string;
  decisionDate: string;
  decidedBy: string;
  secondReviewerRequired: boolean;
  secondReviewerName: string;
  secondReviewDate: string;
  secondReviewOutcome: string;
  rationale: string;
  employeeCreationApproved: boolean;
  handoverNotes: string;
  controls: AppointmentControlRecord[];
  history: AppointmentDecisionHistoryEntry[];
};

export type AppointmentDecisionPermissions = {
  canView: boolean;
  canEdit: boolean;
  canMakeDecision: boolean;
  canApproveConditionalAppointment: boolean;
  canApproveEmployeeCreation: boolean;
  canRecordSecondReview: boolean;
  canViewHistory: boolean;
};

export type AppointmentDecisionSavePayload = {
  value: AppointmentDecisionValue;
  changedFields: string[];
};

export type AppointmentDecisionAuditEvent = {
  action:
    | "appointment_decision_edit_started"
    | "appointment_decision_edit_cancelled"
    | "appointment_decision_saved"
    | "employee_creation_approved";
  mode: AppointmentDecisionMode;
  recordId?: string | number;
  changedFields?: string[];
  occurredAt: string;
};

export type AppointmentDecisionDetailsProps = {
  mode: AppointmentDecisionMode;
  value?: Partial<AppointmentDecisionValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<AppointmentDecisionPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (payload: AppointmentDecisionSavePayload) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (event: AppointmentDecisionAuditEvent) => Promise<void> | void;
};

type Errors = Partial<Record<keyof AppointmentDecisionValue, string>>;

const CONTROL_DEFAULTS: AppointmentControlRecord[] = [
  { key: "identity", label: "Identity verification", required: true, status: "not_started", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "right_to_work", label: "Right to Work", required: true, status: "not_started", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "references", label: "References", required: true, status: "not_started", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "dbs", label: "DBS", required: false, status: "not_required", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "overseas_checks", label: "Overseas checks", required: false, status: "not_required", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "qualifications", label: "Qualifications", required: false, status: "not_required", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "professional_registration", label: "Professional registration", required: false, status: "not_required", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "driving", label: "Driving", required: false, status: "not_required", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "vehicle", label: "Vehicle", required: false, status: "not_required", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
  { key: "health_after_offer", label: "Post-offer health / adjustments", required: false, status: "not_required", completedDate: "", completedBy: "", concernSummary: "", waiverReason: "" },
];

const EMPTY_VALUE: AppointmentDecisionValue = {
  outcome: "pending",
  saferRecruitmentRequired: false,
  allMandatoryChecksComplete: false,
  unresolvedConcernsPresent: false,
  unresolvedConcernSummary: "",
  conditionsApply: false,
  conditions: "",
  conditionOwner: "",
  conditionReviewDate: "",
  proposedStartDate: "",
  approvedStartDate: "",
  appointmentReference: "",
  decisionDate: "",
  decidedBy: "",
  secondReviewerRequired: false,
  secondReviewerName: "",
  secondReviewDate: "",
  secondReviewOutcome: "",
  rationale: "",
  employeeCreationApproved: false,
  handoverNotes: "",
  controls: CONTROL_DEFAULTS,
  history: [],
};

const DEFAULT_PERMISSIONS: AppointmentDecisionPermissions = {
  canView: true,
  canEdit: true,
  canMakeDecision: true,
  canApproveConditionalAppointment: true,
  canApproveEmployeeCreation: true,
  canRecordSecondReview: true,
  canViewHistory: true,
};

const OUTCOME_OPTIONS: Array<{ value: AppointmentDecisionOutcome; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "ready_for_appointment", label: "Ready for appointment" },
  { value: "not_ready", label: "Not ready" },
  { value: "withdrawn", label: "Withdrawn" },
];

const CONTROL_STATUS_OPTIONS: Array<{ value: AppointmentControlStatus; label: string }> = [
  { value: "not_required", label: "Not required" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
  { value: "concern", label: "Concern" },
  { value: "waived", label: "Waived" },
];

function normalise(value?: Partial<AppointmentDecisionValue>): AppointmentDecisionValue {
  const suppliedControls = value?.controls ?? [];
  const controls = CONTROL_DEFAULTS.map((base) => ({ ...base, ...(suppliedControls.find((item) => item.key === base.key) ?? {}) }));
  suppliedControls.filter((item) => !controls.some((base) => base.key === item.key)).forEach((item) => controls.push(item));
  return { ...EMPTY_VALUE, ...value, controls, history: value?.history ?? [] };
}

function validate(value: AppointmentDecisionValue): Errors {
  const errors: Errors = {};
  const finalOutcome = [
    "ready_for_appointment",
    "not_ready",
    "withdrawn",
  ].includes(value.outcome);
  const mandatoryIncomplete = value.controls.some((item) => item.required && !["complete", "waived"].includes(item.status));

  if (finalOutcome && !value.decisionDate) errors.decisionDate = "Enter the decision date.";
  if (finalOutcome && !value.decidedBy.trim()) errors.decidedBy = "Enter who made the decision.";
  if (finalOutcome && !value.rationale.trim()) errors.rationale = "Record the decision rationale.";
  if (value.outcome === "ready_for_appointment" && value.unresolvedConcernsPresent && !value.unresolvedConcernSummary.trim()) {
    errors.unresolvedConcernSummary = "Record the unresolved concern.";
  }
  if (value.outcome === "ready_for_appointment" && value.conditionsApply) {
    if (!value.conditions.trim()) errors.conditions = "Record the appointment conditions.";
    if (!value.conditionOwner.trim()) errors.conditionOwner = "Assign responsibility for the conditions.";
    if (!value.conditionReviewDate) errors.conditionReviewDate = "Enter the condition review date.";
  }
  if (value.unresolvedConcernsPresent && !value.unresolvedConcernSummary.trim()) errors.unresolvedConcernSummary = "Record the unresolved concern.";
  if (value.secondReviewerRequired) {
    if (!value.secondReviewerName.trim()) errors.secondReviewerName = "Enter the second reviewer.";
    if (!value.secondReviewDate) errors.secondReviewDate = "Enter the second-review date.";
    if (!value.secondReviewOutcome.trim()) errors.secondReviewOutcome = "Record the second-review outcome.";
  }
  if (value.employeeCreationApproved && value.outcome !== "ready_for_appointment") {
    errors.employeeCreationApproved = "Employee creation can only be approved after appointment clearance.";
  }
  return errors;
}

const outcomeLabel = (value: AppointmentDecisionOutcome) => OUTCOME_OPTIONS.find((o) => o.value === value)?.label ?? value;
const statusLabel = (value: AppointmentControlStatus) => CONTROL_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
const formatDate = (value?: string) => !value ? "Not recorded" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
const formatDateTime = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return <div style={styles.field}><label style={styles.label}>{label}</label>{children}{error ? <p style={styles.error}><AlertCircle size={12} />{error}</p> : null}</div>;
}
function ReadOnly({ value }: { value?: string }) { return <span style={styles.readOnly}>{value || "Not recorded"}</span>; }
function Checkbox({ checked, label, description, disabled, onChange }: { checked: boolean; label: string; description?: string; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label style={styles.checkbox}><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /><span><strong>{label}</strong>{description ? <small style={styles.small}>{description}</small> : null}</span></label>;
}

export default function AppointmentDecisionDetails({
  mode, value, recordId, recordLabel, permissions, saving = false, disabled = false, startInEditMode = false,
  errorMessage, successMessage, headerActions, onSave, onCancel, onAudit,
}: AppointmentDecisionDetailsProps) {
  const resolvedPermissions = useMemo(() => ({ ...DEFAULT_PERMISSIONS, ...permissions }), [permissions]);
  const supplied = useMemo(() => normalise(value), [value]);
  const [original, setOriginal] = useState(supplied);
  const [draft, setDraft] = useState(supplied);
  const [editing, setEditing] = useState(startInEditMode && resolvedPermissions.canEdit);
  const [errors, setErrors] = useState<Errors>({});
  const [localSaving, setLocalSaving] = useState(false);

  useEffect(() => { setOriginal(supplied); setDraft(supplied); setErrors({}); }, [supplied]);

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;
  const changedFields = useMemo(() => JSON.stringify(original) === JSON.stringify(draft) ? [] : ["appointmentDecision"], [original, draft]);
  const isDirty = changedFields.length > 0;
  const mandatoryComplete = draft.controls.filter((c) => c.required).every((c) => ["complete", "waived"].includes(c.status));

  async function audit(action: AppointmentDecisionAuditEvent["action"], extra: Partial<AppointmentDecisionAuditEvent> = {}) {
    await onAudit?.({ action, mode, recordId, occurredAt: new Date().toISOString(), ...extra });
  }
  function update<K extends keyof AppointmentDecisionValue>(key: K, next: AppointmentDecisionValue[K]) { setDraft((c) => ({ ...c, [key]: next })); }
  function updateControl<K extends keyof AppointmentControlRecord>(key: AppointmentControlKey, field: K, next: AppointmentControlRecord[K]) {
    setDraft((c) => ({ ...c, controls: c.controls.map((item) => item.key === key ? { ...item, [field]: next } : item) }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSave || isDisabled || !resolvedPermissions.canEdit) return;
    const validation = validate(draft);
    if (Object.keys(validation).length) { setErrors(validation); return; }
    try {
      setLocalSaving(true);
      const finalValue = { ...draft, allMandatoryChecksComplete: mandatoryComplete };
      await onSave({ value: finalValue, changedFields });
      setOriginal(finalValue); setDraft(finalValue); setEditing(false);
      await audit("appointment_decision_saved", { changedFields });
      if (finalValue.employeeCreationApproved) await audit("employee_creation_approved", { changedFields });
    } finally { setLocalSaving(false); }
  }

  if (!resolvedPermissions.canView) return <section style={styles.access}><LockKeyhole size={20} /><div><h2>Appointment decision is restricted</h2><p>Your current permission level does not allow access to this record.</p></div></section>;

  return <section style={styles.card}>
    <header style={styles.header}>
      <div style={styles.identity}><span style={styles.icon}><ClipboardCheck size={21} /></span><div><div style={styles.titleRow}><h2 style={styles.title}>Appointment decision</h2><span style={styles.badge}>{outcomeLabel(draft.outcome)}</span></div><p style={styles.subtitle}>{recordLabel || (mode === "candidate" ? "Candidate record" : "Employee record")}{recordId !== undefined ? ` · Record ${recordId}` : ""}</p></div></div>
      <div style={styles.actions}>{headerActions}{!editing && resolvedPermissions.canEdit ? <button type="button" style={styles.secondaryButton} onClick={async () => { setEditing(true); await audit("appointment_decision_edit_started"); }}><Pencil size={15} />Edit decision</button> : null}</div>
    </header>
    {errorMessage ? <div style={styles.errorBanner}><AlertCircle size={16} />{errorMessage}</div> : null}
    {successMessage ? <div style={styles.successBanner}><Check size={16} />{successMessage}</div> : null}

    <form onSubmit={submit}>
      <div style={styles.content}>
        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}><strong>{draft.controls.filter((c) => c.required).length}</strong><span>Mandatory controls</span></div>
          <div style={styles.summaryCard}><strong>{draft.controls.filter((c) => c.required && c.status === "complete").length}</strong><span>Completed</span></div>
          <div style={styles.summaryCard}><strong>{draft.controls.filter((c) => c.status === "concern").length}</strong><span>Concerns</span></div>
          <div style={styles.summaryCard}><strong>{mandatoryComplete ? "Ready" : "Not ready"}</strong><span>Appointment readiness</span></div>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><ShieldCheck size={18} />Pre-employment controls</h3>
          <div style={styles.controlList}>
            {draft.controls.map((item) => <article key={item.key} style={styles.controlCard}>
              <div style={styles.controlTop}>
                <div><strong>{item.label}</strong><small style={styles.small}>{item.required ? "Mandatory" : "Not mandatory unless the role requires it"}</small></div>
                {editing ? <select style={styles.compactInput} value={item.status} onChange={(e) => updateControl(item.key, "status", e.target.value as AppointmentControlStatus)}>{CONTROL_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <span style={styles.badge}>{statusLabel(item.status)}</span>}
              </div>
              <div style={styles.checkboxGrid}><Checkbox checked={item.required} label="Required for this appointment" disabled={!editing || isDisabled} onChange={(v) => updateControl(item.key, "required", v)} /></div>
              <div style={styles.grid}>
                <Field label="Completed date">{editing ? <input style={styles.input} type="date" value={item.completedDate} onChange={(e) => updateControl(item.key, "completedDate", e.target.value)} /> : <ReadOnly value={item.completedDate ? formatDate(item.completedDate) : ""} />}</Field>
                <Field label="Completed by">{editing ? <input style={styles.input} value={item.completedBy} onChange={(e) => updateControl(item.key, "completedBy", e.target.value)} /> : <ReadOnly value={item.completedBy} />}</Field>
                {item.status === "concern" ? <Field label="Concern summary">{editing ? <textarea style={styles.textarea} value={item.concernSummary} onChange={(e) => updateControl(item.key, "concernSummary", e.target.value)} /> : <ReadOnly value={item.concernSummary} />}</Field> : null}
                {item.status === "waived" ? <Field label="Waiver reason">{editing ? <textarea style={styles.textarea} value={item.waiverReason} onChange={(e) => updateControl(item.key, "waiverReason", e.target.value)} /> : <ReadOnly value={item.waiverReason} />}</Field> : null}
              </div>
            </article>)}
          </div>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><CheckCircle2 size={18} />Decision</h3>
          <div style={styles.checkboxGrid}>
            <Checkbox checked={draft.saferRecruitmentRequired} label="Safer recruitment required" disabled={!editing || isDisabled} onChange={(v) => update("saferRecruitmentRequired", v)} />
            <Checkbox checked={draft.unresolvedConcernsPresent} label="Unresolved concerns remain" disabled={!editing || isDisabled} onChange={(v) => update("unresolvedConcernsPresent", v)} />
            <Checkbox checked={draft.secondReviewerRequired} label="Second reviewer required" disabled={!editing || isDisabled} onChange={(v) => update("secondReviewerRequired", v)} />
          </div>
          <div style={styles.grid}>
            <Field label="Outcome">{editing && resolvedPermissions.canMakeDecision ? <select style={styles.input} value={draft.outcome} onChange={(e) => { const outcome = e.target.value as AppointmentDecisionOutcome; update("outcome", outcome); if (outcome !== "ready_for_appointment") update("conditionsApply", false); }}>{OUTCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <ReadOnly value={outcomeLabel(draft.outcome)} />}</Field>
            <Field label="Decision date" error={errors.decisionDate}>{editing && resolvedPermissions.canMakeDecision ? <input style={styles.input} type="date" value={draft.decisionDate} onChange={(e) => update("decisionDate", e.target.value)} /> : <ReadOnly value={draft.decisionDate ? formatDate(draft.decisionDate) : ""} />}</Field>
            <Field label="Decided by" error={errors.decidedBy}>{editing && resolvedPermissions.canMakeDecision ? <input style={styles.input} value={draft.decidedBy} onChange={(e) => update("decidedBy", e.target.value)} /> : <ReadOnly value={draft.decidedBy} />}</Field>
            <Field label="Appointment reference">{editing ? <input style={styles.input} value={draft.appointmentReference} onChange={(e) => update("appointmentReference", e.target.value)} /> : <ReadOnly value={draft.appointmentReference} />}</Field>
            <Field label="Proposed start date">{editing ? <input style={styles.input} type="date" value={draft.proposedStartDate} onChange={(e) => update("proposedStartDate", e.target.value)} /> : <ReadOnly value={draft.proposedStartDate ? formatDate(draft.proposedStartDate) : ""} />}</Field>
            <Field label="Approved start date">{editing ? <input style={styles.input} type="date" value={draft.approvedStartDate} onChange={(e) => update("approvedStartDate", e.target.value)} /> : <ReadOnly value={draft.approvedStartDate ? formatDate(draft.approvedStartDate) : ""} />}</Field>
            <Field label="Rationale" error={errors.rationale}>{editing ? <textarea style={styles.textarea} value={draft.rationale} onChange={(e) => update("rationale", e.target.value)} /> : <ReadOnly value={draft.rationale} />}</Field>
            {draft.unresolvedConcernsPresent ? <Field label="Unresolved concern summary" error={errors.unresolvedConcernSummary}>{editing ? <textarea style={styles.textarea} value={draft.unresolvedConcernSummary} onChange={(e) => update("unresolvedConcernSummary", e.target.value)} /> : <ReadOnly value={draft.unresolvedConcernSummary} />}</Field> : null}
          </div>
        </section>

        {draft.outcome === "ready_for_appointment" && draft.conditionsApply ? <section style={styles.section}>
          <h3 style={styles.sectionTitle}><AlertCircle size={18} />Appointment conditions</h3>
          <div style={styles.grid}>
            <Field label="Conditions" error={errors.conditions}>{editing && resolvedPermissions.canApproveConditionalAppointment ? <textarea style={styles.textarea} value={draft.conditions} onChange={(e) => update("conditions", e.target.value)} /> : <ReadOnly value={draft.conditions} />}</Field>
            <Field label="Condition owner" error={errors.conditionOwner}>{editing ? <input style={styles.input} value={draft.conditionOwner} onChange={(e) => update("conditionOwner", e.target.value)} /> : <ReadOnly value={draft.conditionOwner} />}</Field>
            <Field label="Review date" error={errors.conditionReviewDate}>{editing ? <input style={styles.input} type="date" value={draft.conditionReviewDate} onChange={(e) => update("conditionReviewDate", e.target.value)} /> : <ReadOnly value={draft.conditionReviewDate ? formatDate(draft.conditionReviewDate) : ""} />}</Field>
          </div>
        </section> : null}

        {draft.secondReviewerRequired ? <section style={styles.section}>
          <h3 style={styles.sectionTitle}><ClipboardCheck size={18} />Second review</h3>
          <div style={styles.grid}>
            <Field label="Reviewer" error={errors.secondReviewerName}>{editing && resolvedPermissions.canRecordSecondReview ? <input style={styles.input} value={draft.secondReviewerName} onChange={(e) => update("secondReviewerName", e.target.value)} /> : <ReadOnly value={draft.secondReviewerName} />}</Field>
            <Field label="Review date" error={errors.secondReviewDate}>{editing && resolvedPermissions.canRecordSecondReview ? <input style={styles.input} type="date" value={draft.secondReviewDate} onChange={(e) => update("secondReviewDate", e.target.value)} /> : <ReadOnly value={draft.secondReviewDate ? formatDate(draft.secondReviewDate) : ""} />}</Field>
            <Field label="Review outcome" error={errors.secondReviewOutcome}>{editing && resolvedPermissions.canRecordSecondReview ? <textarea style={styles.textarea} value={draft.secondReviewOutcome} onChange={(e) => update("secondReviewOutcome", e.target.value)} /> : <ReadOnly value={draft.secondReviewOutcome} />}</Field>
          </div>
        </section> : null}

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}><ClipboardCheck size={18} />Employee handover</h3>
          <div style={styles.checkboxGrid}><Checkbox checked={draft.employeeCreationApproved} label="Approve creation of employee record" description="Only available after appointment clearance." disabled={!editing || isDisabled || !resolvedPermissions.canApproveEmployeeCreation} onChange={(v) => update("employeeCreationApproved", v)} /></div>
          {errors.employeeCreationApproved ? <p style={styles.error}><AlertCircle size={12} />{errors.employeeCreationApproved}</p> : null}
          <Field label="Handover notes">{editing ? <textarea style={styles.textarea} value={draft.handoverNotes} onChange={(e) => update("handoverNotes", e.target.value)} /> : <ReadOnly value={draft.handoverNotes} />}</Field>
        </section>

        {resolvedPermissions.canViewHistory ? <section style={styles.section}>
          <h3 style={styles.sectionTitle}><History size={18} />Decision history</h3>
          {draft.history.length === 0 ? <div style={styles.empty}>No decision history recorded.</div> : draft.history.map((entry) => <article key={entry.id} style={styles.historyCard}><strong>{outcomeLabel(entry.outcome)}</strong><span>{formatDateTime(entry.occurredAt)} · {entry.occurredBy}</span>{entry.notes ? <span>{entry.notes}</span> : null}</article>)}
        </section> : null}
      </div>

      {editing ? <footer style={styles.footer}><span>{isDirty ? "Unsaved changes" : "No unsaved changes"}</span><div style={styles.actions}><button type="button" style={styles.tertiaryButton} disabled={!isDirty || isDisabled} onClick={() => { setDraft(original); setErrors({}); }}><RotateCcw size={14} />Reset</button><button type="button" style={styles.secondaryButton} onClick={async () => { setDraft(original); setEditing(false); onCancel?.(); await audit("appointment_decision_edit_cancelled"); }}><X size={15} />Cancel</button><button type="submit" style={styles.primaryButton} disabled={!isDirty || isDisabled || !onSave}>{isSaving ? <Loader2 size={15} className="leo-spin" /> : <Save size={15} />}{isSaving ? "Saving..." : "Save appointment decision"}</button></div></footer> : null}
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
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }, summaryCard: { display: "grid", gap: 4, padding: 16, border: "1px solid #E7DFEB", borderRadius: 13, background: "#FCFAFD" },
  section: { display: "grid", gap: 16, padding: 20, border: "1px solid #ECE4F0", borderRadius: 15 }, sectionTitle: { margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#403545", fontSize: 14 },
  controlList: { display: "grid", gap: 12 }, controlCard: { display: "grid", gap: 12, padding: 14, border: "1px solid #E7DFEB", borderRadius: 12, background: "#FCFAFD" }, controlTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }, checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 },
  checkbox: { display: "flex", alignItems: "flex-start", gap: 9, minHeight: 46, border: "1px solid #DED3E4", borderRadius: 10, background: "#FAF7FC", padding: 11, fontSize: 11 },
  field: { display: "flex", flexDirection: "column", gap: 7 }, label: { color: "#594D5E", fontSize: 11, fontWeight: 750 },
  input: { width: "100%", minHeight: 42, boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: 10, background: "#fff", color: "#3F3543", padding: "10px 11px", font: "inherit", fontSize: 12 },
  compactInput: { minHeight: 36, border: "1px solid #DCCFE3", borderRadius: 9, background: "#fff", color: "#3F3543", padding: "8px 10px", font: "inherit", fontSize: 11 },
  textarea: { width: "100%", minHeight: 90, boxSizing: "border-box", resize: "vertical", border: "1px solid #DCCFE3", borderRadius: 10, padding: 11, font: "inherit", fontSize: 12 },
  readOnly: { minHeight: 42, display: "flex", alignItems: "center", border: "1px solid #EEE7F1", borderRadius: 10, background: "#FBF9FC", color: "#4D414F", padding: "10px 11px", fontSize: 12, whiteSpace: "pre-wrap" },
  error: { display: "flex", gap: 5, margin: 0, color: "#9A5668", fontSize: 10 }, small: { display: "block", marginTop: 4, color: "#8B7F90", fontSize: 10 },
  historyCard: { display: "grid", gap: 4, padding: 10, borderBottom: "1px solid #F0EAF2", color: "#6B5E70", fontSize: 11 }, empty: { minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #DDD2E3", borderRadius: 12, color: "#887C8D", fontSize: 11 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "16px 22px", borderTop: "1px solid #EEE6F1", background: "#FCFAFD", color: "#7C7081", fontSize: 11 },
  primaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: "1px solid #6E5084", borderRadius: 9, background: "#6E5084", color: "#fff", padding: "8px 13px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: "1px solid #DCCFE3", borderRadius: 9, background: "#fff", color: "#6E5084", padding: "8px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" },
  tertiaryButton: { display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, border: 0, borderRadius: 9, background: "transparent", color: "#766A7A", padding: "8px 10px", fontSize: 11, fontWeight: 750, cursor: "pointer" },
  errorBanner: { display: "flex", gap: 9, margin: "18px 22px 0", border: "1px solid #E8CBD2", borderRadius: 11, background: "#FFF7F8", color: "#8B4E5D", padding: "11px 13px", fontSize: 11 },
  successBanner: { display: "flex", gap: 9, margin: "18px 22px 0", border: "1px solid #CFE6D8", borderRadius: 11, background: "#F5FCF8", color: "#527460", padding: "11px 13px", fontSize: 11 },
  access: { display: "flex", gap: 12, border: "1px solid #E6DCEB", borderRadius: 16, background: "#FBF8FC", padding: 20, color: "#6E5084" },
};