"use client";

import {
  AlertCircle,
  Check,
  ChevronDown,
  HeartHandshake,
  History,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

export type EmergencyContactsDetailsMode = "candidate" | "employee";

export type EmergencyContactRelationship =
  | "spouse_partner"
  | "parent"
  | "child"
  | "sibling"
  | "relative"
  | "friend"
  | "carer"
  | "neighbour"
  | "colleague"
  | "other";

export type EmergencyContactStatus =
  | "current"
  | "review_due"
  | "unverified"
  | "unable_to_contact"
  | "superseded"
  | "archived";

export type EmergencyContactRecord = {
  id: string;
  fullName: string;
  relationship: EmergencyContactRelationship;
  relationshipOther: string;
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  townOrCity: string;
  county: string;
  postcode: string;
  country: string;
  preferredContactMethod: "phone" | "sms" | "email";
  priorityOrder: number;
  authorisedForEmergencyContact: boolean;
  authorisedToReceiveBasicInformation: boolean;
  interpreterOrCommunicationSupportRequired: boolean;
  communicationSupportDetails: string;
  accessibilityOrContactNotes: string;
  lastConfirmedDate: string;
  nextReviewDate: string;
  status: EmergencyContactStatus;
  notes: string;
};

export type EmergencyContactHistoryEntry = {
  id: string;
  occurredAt: string;
  occurredBy: string;
  action: string;
  contactId?: string;
  notes?: string;
};

export type EmergencyContactsDetailsValue = {
  contactsConfirmed: boolean;
  confirmationDate: string;
  confirmedBy: string;
  nextReviewDate: string;
  employeeConsentRecorded: boolean;
  consentDate: string;
  emergencyContactProcedureExplained: boolean;
  summaryNotes: string;
  contacts: EmergencyContactRecord[];
  history: EmergencyContactHistoryEntry[];
};

export type EmergencyContactsDetailsPermissions = {
  canView: boolean;
  canEdit: boolean;
  canViewContactDetails: boolean;
  canEditContactDetails: boolean;
  canAddContact: boolean;
  canDeleteContact: boolean;
  canConfirmContacts: boolean;
  canViewHistory: boolean;
};

export type EmergencyContactsDetailsSavePayload = {
  value: EmergencyContactsDetailsValue;
  changedFields: string[];
  removedContactIds: string[];
};

export type EmergencyContactsDetailsAuditEvent = {
  action:
    | "emergency_contacts_edit_started"
    | "emergency_contacts_edit_cancelled"
    | "emergency_contacts_saved"
    | "emergency_contact_added"
    | "emergency_contact_removed"
    | "emergency_contacts_confirmed";
  mode: EmergencyContactsDetailsMode;
  recordId?: string | number;
  contactId?: string;
  changedFields?: string[];
  occurredAt: string;
};

export type EmergencyContactsDetailsProps = {
  mode: EmergencyContactsDetailsMode;
  value?: Partial<EmergencyContactsDetailsValue>;
  recordId?: string | number;
  recordLabel?: string;
  permissions?: Partial<EmergencyContactsDetailsPermissions>;
  saving?: boolean;
  disabled?: boolean;
  startInEditMode?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  headerActions?: ReactNode;
  onSave?: (payload: EmergencyContactsDetailsSavePayload) => Promise<void> | void;
  onCancel?: () => void;
  onAudit?: (event: EmergencyContactsDetailsAuditEvent) => Promise<void> | void;
};

type Errors = Record<string, string>;

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const EMPTY_CONTACT = (): EmergencyContactRecord => ({
  id: makeId(),
  fullName: "",
  relationship: "spouse_partner",
  relationshipOther: "",
  primaryPhone: "",
  secondaryPhone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  townOrCity: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
  preferredContactMethod: "phone",
  priorityOrder: 1,
  authorisedForEmergencyContact: true,
  authorisedToReceiveBasicInformation: false,
  interpreterOrCommunicationSupportRequired: false,
  communicationSupportDetails: "",
  accessibilityOrContactNotes: "",
  lastConfirmedDate: "",
  nextReviewDate: "",
  status: "unverified",
  notes: "",
});

const EMPTY_VALUE: EmergencyContactsDetailsValue = {
  contactsConfirmed: false,
  confirmationDate: "",
  confirmedBy: "",
  nextReviewDate: "",
  employeeConsentRecorded: false,
  consentDate: "",
  emergencyContactProcedureExplained: false,
  summaryNotes: "",
  contacts: [],
  history: [],
};

const DEFAULT_PERMISSIONS: EmergencyContactsDetailsPermissions = {
  canView: true,
  canEdit: true,
  canViewContactDetails: true,
  canEditContactDetails: true,
  canAddContact: true,
  canDeleteContact: true,
  canConfirmContacts: true,
  canViewHistory: true,
};

const RELATIONSHIP_OPTIONS: Array<{ value: EmergencyContactRelationship; label: string }> = [
  { value: "spouse_partner", label: "Spouse or partner" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "relative", label: "Other relative" },
  { value: "friend", label: "Friend" },
  { value: "carer", label: "Carer" },
  { value: "neighbour", label: "Neighbour" },
  { value: "colleague", label: "Colleague" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: Array<{ value: EmergencyContactStatus; label: string }> = [
  { value: "current", label: "Current" },
  { value: "review_due", label: "Review due" },
  { value: "unverified", label: "Unverified" },
  { value: "unable_to_contact", label: "Unable to contact" },
  { value: "superseded", label: "Superseded" },
  { value: "archived", label: "Archived" },
];

function normaliseContact(value: Partial<EmergencyContactRecord>, index: number): EmergencyContactRecord {
  return {
    ...EMPTY_CONTACT(),
    ...value,
    id: value.id ?? makeId(),
    priorityOrder: value.priorityOrder ?? index + 1,
  };
}

function normaliseValue(value?: Partial<EmergencyContactsDetailsValue>): EmergencyContactsDetailsValue {
  return {
    ...EMPTY_VALUE,
    ...value,
    contacts: value?.contacts?.map(normaliseContact) ?? [],
    history: value?.history ?? [],
  };
}

function cleaned(value: EmergencyContactsDetailsValue): EmergencyContactsDetailsValue {
  return {
    ...value,
    confirmedBy: value.confirmedBy.trim(),
    summaryNotes: value.summaryNotes.trim(),
    contacts: value.contacts.map((contact) => ({
      ...contact,
      fullName: contact.fullName.trim(),
      relationshipOther: contact.relationshipOther.trim(),
      primaryPhone: contact.primaryPhone.trim(),
      secondaryPhone: contact.secondaryPhone.trim(),
      email: contact.email.trim().toLowerCase(),
      addressLine1: contact.addressLine1.trim(),
      addressLine2: contact.addressLine2.trim(),
      townOrCity: contact.townOrCity.trim(),
      county: contact.county.trim(),
      postcode: contact.postcode.trim().toUpperCase(),
      country: contact.country.trim(),
      communicationSupportDetails: contact.communicationSupportDetails.trim(),
      accessibilityOrContactNotes: contact.accessibilityOrContactNotes.trim(),
      notes: contact.notes.trim(),
    })),
  };
}

function getChangedFields(original: EmergencyContactsDetailsValue, current: EmergencyContactsDetailsValue): string[] {
  const before = cleaned(original);
  const after = cleaned(current);
  const changes: string[] = [];
  const rootKeys: Array<keyof Omit<EmergencyContactsDetailsValue, "contacts" | "history">> = [
    "contactsConfirmed",
    "confirmationDate",
    "confirmedBy",
    "nextReviewDate",
    "employeeConsentRecorded",
    "consentDate",
    "emergencyContactProcedureExplained",
    "summaryNotes",
  ];
  rootKeys.forEach((key) => {
    if (before[key] !== after[key]) changes.push(String(key));
  });
  const beforeMap = new Map(before.contacts.map((item) => [item.id, item]));
  after.contacts.forEach((item) => {
    const old = beforeMap.get(item.id);
    if (!old) {
      changes.push(`contacts.${item.id}.added`);
      return;
    }
    (Object.keys(item) as Array<keyof EmergencyContactRecord>).forEach((key) => {
      if (item[key] !== old[key]) changes.push(`contacts.${item.id}.${String(key)}`);
    });
  });
  const afterIds = new Set(after.contacts.map((item) => item.id));
  before.contacts.forEach((item) => {
    if (!afterIds.has(item.id)) changes.push(`contacts.${item.id}.removed`);
  });
  return changes;
}

function validate(value: EmergencyContactsDetailsValue): Errors {
  const errors: Errors = {};
  if (value.contacts.length === 0) errors.contacts = "Add at least one emergency contact.";
  if (value.contactsConfirmed && !value.confirmationDate) errors.confirmationDate = "Enter the confirmation date.";
  if (value.contactsConfirmed && !value.confirmedBy.trim()) errors.confirmedBy = "Enter who confirmed the contacts.";
  if (value.employeeConsentRecorded && !value.consentDate) errors.consentDate = "Enter the consent date.";
  value.contacts.forEach((contact, index) => {
    const prefix = `contacts.${contact.id}`;
    if (!contact.fullName.trim()) errors[`${prefix}.fullName`] = `Enter the name for contact ${index + 1}.`;
    if (!contact.primaryPhone.trim() && !contact.email.trim()) errors[`${prefix}.primaryPhone`] = "Enter a primary phone number or email address.";
    if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email)) errors[`${prefix}.email`] = "Enter a valid email address.";
    if (contact.relationship === "other" && !contact.relationshipOther.trim()) errors[`${prefix}.relationshipOther`] = "Describe the relationship.";
    if (contact.interpreterOrCommunicationSupportRequired && !contact.communicationSupportDetails.trim()) errors[`${prefix}.communicationSupportDetails`] = "Record the communication support required.";
    if (contact.lastConfirmedDate && contact.nextReviewDate && contact.nextReviewDate < contact.lastConfirmedDate) errors[`${prefix}.nextReviewDate`] = "The review date cannot be before the confirmation date.";
  });
  return errors;
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

function relationshipLabel(value: EmergencyContactRelationship) {
  return RELATIONSHIP_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function statusLabel(value: EmergencyContactStatus) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function FieldLabel({ children, required, sensitive }: { children: ReactNode; required?: boolean; sensitive?: boolean }) {
  return (
    <label style={styles.fieldLabel}>
      <span>{children}</span>
      {required ? <span style={styles.requiredMark}>*</span> : null}
      {sensitive ? <span style={styles.sensitiveLabel}><LockKeyhole size={11} /> Restricted</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p role="alert" style={styles.fieldError}><AlertCircle size={12} />{message}</p> : null;
}

function ReadOnlyValue({ value, fallback = "Not recorded", restricted = false }: { value?: string; fallback?: string; restricted?: boolean }) {
  if (restricted) return <span style={styles.restrictedValue}><LockKeyhole size={13} />Restricted</span>;
  return <span style={{ ...styles.readOnlyValue, ...(!value ? styles.readOnlyEmpty : {}) }}>{value || fallback}</span>;
}

function SectionHeader({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <header style={styles.sectionHeader}>
      <span style={styles.sectionIcon}>{icon}</span>
      <div><h3 style={styles.sectionTitle}>{title}</h3><p style={styles.sectionDescription}>{description}</p></div>
    </header>
  );
}

function CheckboxField({ checked, label, description, disabled, onChange }: { checked: boolean; label: string; description?: string; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={styles.checkboxCard}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} disabled={disabled} />
      <span><strong style={styles.checkboxTitle}>{label}</strong>{description ? <span style={styles.checkboxDescription}>{description}</span> : null}</span>
    </label>
  );
}

export default function EmergencyContactsDetails({
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
}: EmergencyContactsDetailsProps) {
  const resolvedPermissions = useMemo(() => ({ ...DEFAULT_PERMISSIONS, ...permissions }), [permissions]);
  const suppliedValue = useMemo(() => normaliseValue(value), [value]);
  const [originalValue, setOriginalValue] = useState(suppliedValue);
  const [draft, setDraft] = useState(suppliedValue);
  const [editing, setEditing] = useState(startInEditMode && resolvedPermissions.canEdit);
  const [expandedIds, setExpandedIds] = useState(suppliedValue.contacts.map((item) => item.id));
  const [errors, setErrors] = useState<Errors>({});
  const [removedContactIds, setRemovedContactIds] = useState<string[]>([]);
  const [localSaving, setLocalSaving] = useState(false);

  const isSaving = saving || localSaving;
  const isDisabled = disabled || isSaving;
  const changedFields = useMemo(() => getChangedFields(originalValue, draft), [originalValue, draft]);
  const isDirty = changedFields.length > 0 || removedContactIds.length > 0;

  useEffect(() => {
    setOriginalValue(suppliedValue);
    setDraft(suppliedValue);
    setExpandedIds(suppliedValue.contacts.map((item) => item.id));
    setErrors({});
    setRemovedContactIds([]);
  }, [suppliedValue]);

  async function audit(action: EmergencyContactsDetailsAuditEvent["action"], extras?: Partial<EmergencyContactsDetailsAuditEvent>) {
    if (!onAudit) return;
    await onAudit({ action, mode, recordId, occurredAt: new Date().toISOString(), ...extras });
  }

  function updateRoot<Key extends keyof EmergencyContactsDetailsValue>(key: Key, nextValue: EmergencyContactsDetailsValue[Key]) {
    setDraft((current) => ({ ...current, [key]: nextValue }));
    setErrors((current) => { const next = { ...current }; delete next[String(key)]; return next; });
  }

  function updateContact<Key extends keyof EmergencyContactRecord>(id: string, key: Key, nextValue: EmergencyContactRecord[Key]) {
    setDraft((current) => ({ ...current, contacts: current.contacts.map((contact) => contact.id === id ? { ...contact, [key]: nextValue } : contact) }));
    setErrors((current) => { const next = { ...current }; delete next[`contacts.${id}.${String(key)}`]; return next; });
  }

  async function beginEditing() {
    if (!resolvedPermissions.canEdit || isDisabled) return;
    setEditing(true);
    await audit("emergency_contacts_edit_started");
  }

  async function cancelEditing() {
    setDraft(originalValue);
    setErrors({});
    setRemovedContactIds([]);
    setEditing(false);
    onCancel?.();
    await audit("emergency_contacts_edit_cancelled");
  }

  function resetChanges() {
    setDraft(originalValue);
    setErrors({});
    setRemovedContactIds([]);
  }

  async function addContact() {
    if (!resolvedPermissions.canAddContact || isDisabled) return;
    const contact = { ...EMPTY_CONTACT(), priorityOrder: draft.contacts.length + 1 };
    setDraft((current) => ({ ...current, contacts: [...current.contacts, contact] }));
    setExpandedIds((current) => [...current, contact.id]);
    await audit("emergency_contact_added", { contactId: contact.id });
  }

  async function removeContact(id: string) {
    if (!resolvedPermissions.canDeleteContact || isDisabled) return;
    const existed = originalValue.contacts.some((item) => item.id === id);
    setDraft((current) => ({ ...current, contacts: current.contacts.filter((item) => item.id !== id).map((item, index) => ({ ...item, priorityOrder: index + 1 })) }));
    if (existed) setRemovedContactIds((current) => current.includes(id) ? current : [...current, id]);
    await audit("emergency_contact_removed", { contactId: id });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resolvedPermissions.canEdit || isDisabled || !onSave) return;
    const validationErrors = validate(draft);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      const firstContactError = Object.keys(validationErrors).find((key) => key.startsWith("contacts."));
      if (firstContactError) {
        const id = firstContactError.split(".")[1];
        setExpandedIds((current) => current.includes(id) ? current : [...current, id]);
      }
      return;
    }
    const cleanValue = cleaned(draft);
    const fields = getChangedFields(originalValue, cleanValue);
    if (!fields.length && !removedContactIds.length) { setEditing(false); return; }
    try {
      setLocalSaving(true);
      await onSave({ value: cleanValue, changedFields: fields, removedContactIds });
      setOriginalValue(cleanValue);
      setDraft(cleanValue);
      setRemovedContactIds([]);
      setErrors({});
      setEditing(false);
      await audit("emergency_contacts_saved", { changedFields: fields });
      if (fields.includes("contactsConfirmed") && cleanValue.contactsConfirmed) await audit("emergency_contacts_confirmed", { changedFields: fields });
    } finally {
      setLocalSaving(false);
    }
  }

  if (!resolvedPermissions.canView) {
    return <section style={styles.accessCard}><span style={styles.accessIcon}><LockKeyhole size={20} /></span><div><h2 style={styles.accessTitle}>Emergency contact information is restricted</h2><p style={styles.accessText}>Your current permission level does not allow access to this record.</p></div></section>;
  }

  return (
    <section style={styles.card}>
      <header style={styles.cardHeader}>
        <div style={styles.identity}>
          <span style={styles.identityIcon}><HeartHandshake size={21} /></span>
          <div style={{ minWidth: 0 }}>
            <div style={styles.titleRow}><h2 style={styles.cardTitle}>Emergency contacts</h2><span style={styles.countBadge}>{draft.contacts.length} contact{draft.contacts.length === 1 ? "" : "s"}</span></div>
            <p style={styles.cardSubtitle}>{recordLabel || (mode === "candidate" ? "Candidate record" : "Employee record")}{recordId !== undefined ? ` · Record ${String(recordId)}` : ""}</p>
          </div>
        </div>
        <div style={styles.headerActions}>{headerActions}{!editing && resolvedPermissions.canEdit ? <button type="button" style={styles.secondaryButton} onClick={beginEditing} disabled={isDisabled}><Pencil size={15} />Edit emergency contacts</button> : null}</div>
      </header>

      {errorMessage ? <div role="alert" style={styles.errorBanner}><AlertCircle size={17} /><span>{errorMessage}</span></div> : null}
      {successMessage ? <div role="status" style={styles.successBanner}><Check size={17} /><span>{successMessage}</span></div> : null}

      <form onSubmit={submit}>
        <div style={styles.content}>
          <section style={styles.section}>
            <SectionHeader icon={<ShieldCheck size={18} />} title="Confirmation and consent" description="Record whether emergency contacts are current, consented to and ready to use if an urgent situation occurs." />
            <div style={styles.checkboxGrid}>
              {editing ? <>
                <CheckboxField checked={draft.contactsConfirmed} label="Contacts confirmed as current" description="The employee or candidate has confirmed the details are up to date." disabled={isDisabled || !resolvedPermissions.canConfirmContacts} onChange={(checked) => updateRoot("contactsConfirmed", checked)} />
                <CheckboxField checked={draft.employeeConsentRecorded} label="Consent recorded" description="Consent has been recorded to hold and use emergency contact details." disabled={isDisabled} onChange={(checked) => updateRoot("employeeConsentRecorded", checked)} />
                <CheckboxField checked={draft.emergencyContactProcedureExplained} label="Emergency contact procedure explained" description="The person understands when and why contacts may be used." disabled={isDisabled} onChange={(checked) => updateRoot("emergencyContactProcedureExplained", checked)} />
              </> : <>
                <ReadOnlyValue value={draft.contactsConfirmed ? "Contacts confirmed as current" : "Contacts not confirmed"} />
                <ReadOnlyValue value={draft.employeeConsentRecorded ? "Consent recorded" : "Consent not recorded"} />
                <ReadOnlyValue value={draft.emergencyContactProcedureExplained ? "Procedure explained" : "Procedure not recorded as explained"} />
              </>}
            </div>
            <div style={styles.formGrid}>
              <div style={styles.field}><FieldLabel>Confirmation date</FieldLabel>{editing ? <><input type="date" value={draft.confirmationDate} onChange={(event) => updateRoot("confirmationDate", event.target.value)} style={{ ...styles.input, ...(errors.confirmationDate ? styles.inputError : {}) }} disabled={isDisabled || !resolvedPermissions.canConfirmContacts} /><FieldError message={errors.confirmationDate} /></> : <ReadOnlyValue value={draft.confirmationDate ? formatDate(draft.confirmationDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Confirmed by</FieldLabel>{editing ? <><input type="text" value={draft.confirmedBy} onChange={(event) => updateRoot("confirmedBy", event.target.value)} style={{ ...styles.input, ...(errors.confirmedBy ? styles.inputError : {}) }} disabled={isDisabled || !resolvedPermissions.canConfirmContacts} /><FieldError message={errors.confirmedBy} /></> : <ReadOnlyValue value={draft.confirmedBy} />}</div>
              <div style={styles.field}><FieldLabel>Consent date</FieldLabel>{editing ? <><input type="date" value={draft.consentDate} onChange={(event) => updateRoot("consentDate", event.target.value)} style={{ ...styles.input, ...(errors.consentDate ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={errors.consentDate} /></> : <ReadOnlyValue value={draft.consentDate ? formatDate(draft.consentDate) : ""} />}</div>
              <div style={styles.field}><FieldLabel>Next overall review</FieldLabel>{editing ? <input type="date" value={draft.nextReviewDate} onChange={(event) => updateRoot("nextReviewDate", event.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={draft.nextReviewDate ? formatDate(draft.nextReviewDate) : ""} />}</div>
              <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Summary notes</FieldLabel>{editing ? <textarea rows={4} value={draft.summaryNotes} onChange={(event) => updateRoot("summaryNotes", event.target.value)} style={styles.textarea} disabled={isDisabled} placeholder="Record any overall emergency contact arrangements or review notes." /> : <ReadOnlyValue value={draft.summaryNotes} fallback="No summary notes recorded" />}</div>
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionActionHeader}><SectionHeader icon={<UsersRound size={18} />} title="Emergency contact records" description="Maintain prioritised contact details and practical information needed during an emergency." />{editing && resolvedPermissions.canAddContact ? <button type="button" style={styles.secondaryButton} onClick={addContact} disabled={isDisabled}><Plus size={15} />Add contact</button> : null}</div>
            <FieldError message={errors.contacts} />
            {draft.contacts.length === 0 ? <div style={styles.emptyState}><UsersRound size={24} /><strong>No emergency contacts recorded</strong><span>Add at least one current emergency contact.</span>{editing && resolvedPermissions.canAddContact ? <button type="button" style={styles.secondaryButton} onClick={addContact} disabled={isDisabled}><Plus size={15} />Add first contact</button> : null}</div> : null}

            <div style={styles.contactList}>
              {draft.contacts.map((contact, index) => {
                const expanded = expandedIds.includes(contact.id);
                const restricted = !resolvedPermissions.canViewContactDetails;
                return (
                  <article key={contact.id} style={styles.contactCard}>
                    <header style={styles.contactHeader}>
                      <button type="button" style={styles.contactToggle} onClick={() => toggleExpanded(contact.id)}>
                        <span style={styles.contactIcon}><UserRound size={17} /></span>
                        <span style={{ minWidth: 0, flex: 1, textAlign: "left" }}><strong style={styles.contactTitle}>{contact.fullName || `Emergency contact ${index + 1}`}</strong><span style={styles.contactSubtitle}>Priority {contact.priorityOrder} · {contact.relationship === "other" ? contact.relationshipOther || "Other relationship" : relationshipLabel(contact.relationship)} · {statusLabel(contact.status)}</span></span>
                        <ChevronDown size={17} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease" }} />
                      </button>
                      {editing && resolvedPermissions.canDeleteContact ? <button type="button" style={styles.iconButton} onClick={() => removeContact(contact.id)} disabled={isDisabled} aria-label={`Remove ${contact.fullName || `contact ${index + 1}`}`}><Trash2 size={15} /></button> : null}
                    </header>

                    {expanded ? <div style={styles.contactBody}>
                      <section style={styles.innerSection}>
                        <SectionHeader icon={<UserRound size={17} />} title="Contact identity" description="Record the contact's name, relationship and priority order." />
                        <div style={styles.formGrid}>
                          <div style={styles.field}><FieldLabel required>Full name</FieldLabel>{editing ? <><input type="text" value={contact.fullName} onChange={(event) => updateContact(contact.id, "fullName", event.target.value)} style={{ ...styles.input, ...(errors[`contacts.${contact.id}.fullName`] ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={errors[`contacts.${contact.id}.fullName`]} /></> : <ReadOnlyValue value={contact.fullName} />}</div>
                          <div style={styles.field}><FieldLabel>Relationship</FieldLabel>{editing ? <select value={contact.relationship} onChange={(event) => updateContact(contact.id, "relationship", event.target.value as EmergencyContactRelationship)} style={styles.input} disabled={isDisabled}>{RELATIONSHIP_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select> : <ReadOnlyValue value={relationshipLabel(contact.relationship)} />}</div>
                          {contact.relationship === "other" ? <div style={styles.field}><FieldLabel required>Relationship details</FieldLabel>{editing ? <><input type="text" value={contact.relationshipOther} onChange={(event) => updateContact(contact.id, "relationshipOther", event.target.value)} style={{ ...styles.input, ...(errors[`contacts.${contact.id}.relationshipOther`] ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={errors[`contacts.${contact.id}.relationshipOther`]} /></> : <ReadOnlyValue value={contact.relationshipOther} />}</div> : null}
                          <div style={styles.field}><FieldLabel>Priority order</FieldLabel>{editing ? <input type="number" min={1} value={contact.priorityOrder} onChange={(event) => updateContact(contact.id, "priorityOrder", Math.max(1, Number(event.target.value) || 1))} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={String(contact.priorityOrder)} />}</div>
                          <div style={styles.field}><FieldLabel>Status</FieldLabel>{editing ? <select value={contact.status} onChange={(event) => updateContact(contact.id, "status", event.target.value as EmergencyContactStatus)} style={styles.input} disabled={isDisabled}>{STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select> : <ReadOnlyValue value={statusLabel(contact.status)} />}</div>
                          <div style={styles.field}><FieldLabel>Preferred contact method</FieldLabel>{editing ? <select value={contact.preferredContactMethod} onChange={(event) => updateContact(contact.id, "preferredContactMethod", event.target.value as EmergencyContactRecord["preferredContactMethod"])} style={styles.input} disabled={isDisabled}><option value="phone">Phone call</option><option value="sms">Text message</option><option value="email">Email</option></select> : <ReadOnlyValue value={contact.preferredContactMethod === "sms" ? "Text message" : contact.preferredContactMethod === "email" ? "Email" : "Phone call"} />}</div>
                        </div>
                      </section>

                      <section style={styles.innerSection}>
                        <SectionHeader icon={<Phone size={17} />} title="Contact details" description="Store reliable telephone, email and address details with restricted access controls." />
                        {restricted ? <div style={styles.restrictedPanel}><LockKeyhole size={17} /><div><strong>Contact details are restricted</strong><p>Your permission level allows the contact record to be seen, but not the personal contact information.</p></div></div> : <div style={styles.formGrid}>
                          <div style={styles.field}><FieldLabel required sensitive>Primary phone</FieldLabel>{editing && resolvedPermissions.canEditContactDetails ? <><div style={styles.inputWithIcon}><Phone size={15} /><input type="tel" value={contact.primaryPhone} onChange={(event) => updateContact(contact.id, "primaryPhone", event.target.value)} style={styles.iconInput} disabled={isDisabled} /></div><FieldError message={errors[`contacts.${contact.id}.primaryPhone`]} /></> : <ReadOnlyValue value={contact.primaryPhone} />}</div>
                          <div style={styles.field}><FieldLabel sensitive>Secondary phone</FieldLabel>{editing && resolvedPermissions.canEditContactDetails ? <div style={styles.inputWithIcon}><Phone size={15} /><input type="tel" value={contact.secondaryPhone} onChange={(event) => updateContact(contact.id, "secondaryPhone", event.target.value)} style={styles.iconInput} disabled={isDisabled} /></div> : <ReadOnlyValue value={contact.secondaryPhone} />}</div>
                          <div style={styles.field}><FieldLabel sensitive>Email</FieldLabel>{editing && resolvedPermissions.canEditContactDetails ? <><div style={styles.inputWithIcon}><Mail size={15} /><input type="email" value={contact.email} onChange={(event) => updateContact(contact.id, "email", event.target.value)} style={styles.iconInput} disabled={isDisabled} /></div><FieldError message={errors[`contacts.${contact.id}.email`]} /></> : <ReadOnlyValue value={contact.email} />}</div>
                          <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel sensitive>Address</FieldLabel>{editing && resolvedPermissions.canEditContactDetails ? <div style={styles.addressGrid}><input type="text" value={contact.addressLine1} onChange={(event) => updateContact(contact.id, "addressLine1", event.target.value)} style={styles.input} disabled={isDisabled} placeholder="Address line 1" /><input type="text" value={contact.addressLine2} onChange={(event) => updateContact(contact.id, "addressLine2", event.target.value)} style={styles.input} disabled={isDisabled} placeholder="Address line 2" /><input type="text" value={contact.townOrCity} onChange={(event) => updateContact(contact.id, "townOrCity", event.target.value)} style={styles.input} disabled={isDisabled} placeholder="Town or city" /><input type="text" value={contact.county} onChange={(event) => updateContact(contact.id, "county", event.target.value)} style={styles.input} disabled={isDisabled} placeholder="County" /><input type="text" value={contact.postcode} onChange={(event) => updateContact(contact.id, "postcode", event.target.value)} style={styles.input} disabled={isDisabled} placeholder="Postcode" /><input type="text" value={contact.country} onChange={(event) => updateContact(contact.id, "country", event.target.value)} style={styles.input} disabled={isDisabled} placeholder="Country" /></div> : <ReadOnlyValue value={[contact.addressLine1, contact.addressLine2, contact.townOrCity, contact.county, contact.postcode, contact.country].filter(Boolean).join(", ")} />}</div>
                        </div>}
                      </section>

                      <section style={styles.innerSection}>
                        <SectionHeader icon={<ShieldCheck size={17} />} title="Authority and communication" description="Clarify what the contact may be told and whether communication support is required." />
                        <div style={styles.checkboxGrid}>{editing ? <>
                          <CheckboxField checked={contact.authorisedForEmergencyContact} label="Authorised emergency contact" description="This person may be contacted in an emergency." disabled={isDisabled} onChange={(checked) => updateContact(contact.id, "authorisedForEmergencyContact", checked)} />
                          <CheckboxField checked={contact.authorisedToReceiveBasicInformation} label="May receive basic information" description="Basic information may be shared where necessary and proportionate." disabled={isDisabled} onChange={(checked) => updateContact(contact.id, "authorisedToReceiveBasicInformation", checked)} />
                          <CheckboxField checked={contact.interpreterOrCommunicationSupportRequired} label="Communication support required" description="Interpreter, accessibility or other support is needed." disabled={isDisabled} onChange={(checked) => updateContact(contact.id, "interpreterOrCommunicationSupportRequired", checked)} />
                        </> : <>
                          <ReadOnlyValue value={contact.authorisedForEmergencyContact ? "Authorised emergency contact" : "Not authorised for emergency contact"} />
                          <ReadOnlyValue value={contact.authorisedToReceiveBasicInformation ? "May receive basic information" : "No authority to receive information recorded"} />
                          <ReadOnlyValue value={contact.interpreterOrCommunicationSupportRequired ? "Communication support required" : "No communication support recorded"} />
                        </>}</div>
                        <div style={styles.formGrid}>
                          {contact.interpreterOrCommunicationSupportRequired ? <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel required>Communication support details</FieldLabel>{editing ? <><textarea rows={3} value={contact.communicationSupportDetails} onChange={(event) => updateContact(contact.id, "communicationSupportDetails", event.target.value)} style={{ ...styles.textarea, ...(errors[`contacts.${contact.id}.communicationSupportDetails`] ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={errors[`contacts.${contact.id}.communicationSupportDetails`]} /></> : <ReadOnlyValue value={contact.communicationSupportDetails} />}</div> : null}
                          <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Accessibility or contact notes</FieldLabel>{editing ? <textarea rows={3} value={contact.accessibilityOrContactNotes} onChange={(event) => updateContact(contact.id, "accessibilityOrContactNotes", event.target.value)} style={styles.textarea} disabled={isDisabled} /> : <ReadOnlyValue value={contact.accessibilityOrContactNotes} />}</div>
                        </div>
                      </section>

                      <section style={styles.innerSection}>
                        <SectionHeader icon={<History size={17} />} title="Review and notes" description="Record when the contact was last confirmed and when it should next be reviewed." />
                        <div style={styles.formGrid}>
                          <div style={styles.field}><FieldLabel>Last confirmed</FieldLabel>{editing ? <input type="date" value={contact.lastConfirmedDate} onChange={(event) => updateContact(contact.id, "lastConfirmedDate", event.target.value)} style={styles.input} disabled={isDisabled} /> : <ReadOnlyValue value={contact.lastConfirmedDate ? formatDate(contact.lastConfirmedDate) : ""} />}</div>
                          <div style={styles.field}><FieldLabel>Next review</FieldLabel>{editing ? <><input type="date" value={contact.nextReviewDate} onChange={(event) => updateContact(contact.id, "nextReviewDate", event.target.value)} style={{ ...styles.input, ...(errors[`contacts.${contact.id}.nextReviewDate`] ? styles.inputError : {}) }} disabled={isDisabled} /><FieldError message={errors[`contacts.${contact.id}.nextReviewDate`]} /></> : <ReadOnlyValue value={contact.nextReviewDate ? formatDate(contact.nextReviewDate) : ""} />}</div>
                          <div style={{ ...styles.field, gridColumn: "1 / -1" }}><FieldLabel>Contact notes</FieldLabel>{editing ? <textarea rows={4} value={contact.notes} onChange={(event) => updateContact(contact.id, "notes", event.target.value)} style={styles.textarea} disabled={isDisabled} /> : <ReadOnlyValue value={contact.notes} />}</div>
                        </div>
                      </section>
                    </div> : null}
                  </article>
                );
              })}
            </div>
          </section>

          {resolvedPermissions.canViewHistory ? <section style={styles.section}><SectionHeader icon={<History size={18} />} title="Record history" description="Review recorded changes and confirmation activity for emergency contacts." />{draft.history.length === 0 ? <div style={styles.emptyState}><History size={22} /><strong>No history recorded</strong><span>Audit history will appear here when changes are saved.</span></div> : <div style={styles.historyList}>{draft.history.map((item) => <article key={item.id} style={styles.historyCard}><span style={styles.historyMarker}><History size={14} /></span><div style={{ flex: 1 }}><div style={styles.historyHeader}><strong>{item.action}</strong><span>{formatDateTime(item.occurredAt)}</span></div><p style={styles.historyText}>Recorded by {item.occurredBy}.</p>{item.notes ? <p style={styles.historyNotes}>{item.notes}</p> : null}</div></article>)}</div>}</section> : null}
        </div>

        {editing ? <footer style={styles.footer}><div style={styles.changeSummary}>{isDirty ? <><span style={styles.unsavedDot} />Unsaved changes</> : <><Check size={14} />No unsaved changes</>}</div><div style={styles.footerActions}><button type="button" style={styles.tertiaryButton} onClick={resetChanges} disabled={!isDirty || isDisabled}><RotateCcw size={14} />Reset</button><button type="button" style={styles.secondaryButton} onClick={cancelEditing} disabled={isDisabled}><X size={15} />Cancel</button><button type="submit" style={styles.primaryButton} disabled={!isDirty || isDisabled || !onSave}>{isSaving ? <Loader2 size={15} className="leo-emergency-spin" /> : <Save size={15} />}{isSaving ? "Saving..." : "Save emergency contacts"}</button></div></footer> : null}
      </form>

      <style>{`@keyframes leo-emergency-spin{to{transform:rotate(360deg)}}.leo-emergency-spin{animation:leo-emergency-spin .8s linear infinite}button:disabled,input:disabled,select:disabled,textarea:disabled{cursor:not-allowed;opacity:.6}input[type="checkbox"]{accent-color:#6E5084}`}</style>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { overflow: "hidden", border: "1px solid #E7DDED", borderRadius: 18, background: "#FFFFFF", boxShadow: "0 12px 32px rgba(71,49,81,.05)" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18, padding: "20px 22px", borderBottom: "1px solid #EEE5F2", background: "linear-gradient(135deg,#FFFFFF 0%,#FCF9FE 100%)" },
  identity: { display: "flex", alignItems: "center", gap: 13, minWidth: 0 },
  identityIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, flex: "0 0 auto", borderRadius: 13, background: "#F2EAF7", color: "#6E5084" },
  titleRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 9 }, cardTitle: { margin: 0, color: "#342B38", fontSize: 17, fontWeight: 800 }, cardSubtitle: { margin: "4px 0 0", color: "#847789", fontSize: 12 },
  countBadge: { display: "inline-flex", border: "1px solid #DED3E4", borderRadius: 999, background: "#F7F2FA", color: "#6E5084", padding: "5px 8px", fontSize: 10, fontWeight: 800 },
  headerActions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 9 }, content: { display: "grid", gap: 18, padding: 22 },
  section: { display: "grid", gap: 17, padding: 20, border: "1px solid #ECE4F0", borderRadius: 15, background: "#FFFFFF" }, innerSection: { display: "grid", gap: 16, padding: 17, border: "1px solid #EEE7F1", borderRadius: 13, background: "#FCFAFD" },
  sectionActionHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }, sectionHeader: { display: "flex", alignItems: "flex-start", gap: 11 }, sectionIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, flex: "0 0 auto", borderRadius: 10, background: "#F5EFF8", color: "#6E5084" }, sectionTitle: { margin: 0, color: "#403545", fontSize: 14, fontWeight: 800 }, sectionDescription: { margin: "4px 0 0", color: "#8B7F90", fontSize: 11, lineHeight: 1.5 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 17 }, checkboxGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }, addressGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }, field: { display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }, fieldLabel: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5, color: "#594D5E", fontSize: 11, fontWeight: 750 }, requiredMark: { color: "#8E5F72" }, sensitiveLabel: { display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 3, borderRadius: 999, background: "#F3EEF5", color: "#75687A", padding: "3px 6px", fontSize: 9, fontWeight: 750 },
  input: { width: "100%", minHeight: 42, boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: 10, outline: "none", background: "#FFFFFF", color: "#3F3543", padding: "10px 11px", font: "inherit", fontSize: 12 }, inputError: { borderColor: "#B97988", boxShadow: "0 0 0 3px rgba(185,121,136,.10)" }, textarea: { width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #DCCFE3", borderRadius: 10, outline: "none", background: "#FFFFFF", color: "#3F3543", padding: 11, font: "inherit", fontSize: 12, lineHeight: 1.55 },
  inputWithIcon: { display: "flex", alignItems: "center", gap: 8, minHeight: 42, boxSizing: "border-box", border: "1px solid #DCCFE3", borderRadius: 10, background: "#FFFFFF", color: "#8B7F90", padding: "0 11px" }, iconInput: { width: "100%", minWidth: 0, border: 0, outline: "none", background: "transparent", color: "#3F3543", padding: "10px 0", font: "inherit", fontSize: 12 },
  checkboxCard: { display: "flex", alignItems: "flex-start", gap: 9, minHeight: 64, boxSizing: "border-box", border: "1px solid #DED3E4", borderRadius: 10, background: "#FAF7FC", color: "#55495A", padding: 11, fontSize: 11, cursor: "pointer" }, checkboxTitle: { display: "block", color: "#55495A", fontSize: 11 }, checkboxDescription: { display: "block", marginTop: 3, color: "#8B7F90", fontSize: 10, lineHeight: 1.4 }, readOnlyValue: { display: "flex", alignItems: "center", minHeight: 42, boxSizing: "border-box", border: "1px solid #EEE7F1", borderRadius: 10, background: "#FBF9FC", color: "#4D414F", padding: "10px 11px", fontSize: 12, lineHeight: 1.45, whiteSpace: "pre-wrap" }, readOnlyEmpty: { color: "#A094A5", fontStyle: "italic" }, restrictedValue: { display: "flex", alignItems: "center", gap: 7, minHeight: 42, boxSizing: "border-box", border: "1px solid #EEE7F1", borderRadius: 10, background: "#F8F5F9", color: "#847888", padding: "10px 11px", fontSize: 11, fontWeight: 700 }, fieldError: { display: "flex", alignItems: "center", gap: 5, margin: 0, color: "#9A5668", fontSize: 10, lineHeight: 1.4 },
  restrictedPanel: { display: "flex", alignItems: "flex-start", gap: 10, border: "1px solid #E5DDE9", borderRadius: 11, background: "#F9F6FA", color: "#746978", padding: 13, fontSize: 11, lineHeight: 1.5 }, contactList: { display: "grid", gap: 13 }, contactCard: { overflow: "hidden", border: "1px solid #E7DFEB", borderRadius: 13, background: "#FFFFFF" }, contactHeader: { display: "flex", alignItems: "center", gap: 9, padding: 10, borderBottom: "1px solid #F0EAF2" }, contactToggle: { display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0, border: 0, background: "transparent", padding: 4, color: "inherit", cursor: "pointer" }, contactIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, flex: "0 0 auto", borderRadius: 10, background: "#F3EDF7", color: "#6E5084" }, contactTitle: { display: "block", overflow: "hidden", color: "#483B4D", fontSize: 12, textOverflow: "ellipsis", whiteSpace: "nowrap" }, contactSubtitle: { display: "block", marginTop: 4, color: "#8B7F90", fontSize: 10 }, contactBody: { display: "grid", gap: 14, padding: 14 },
  historyList: { display: "grid", gap: 12 }, historyCard: { display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 0", borderBottom: "1px solid #F0EAF2" }, historyMarker: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, flex: "0 0 auto", borderRadius: 999, background: "#F1EAF5", color: "#6E5084" }, historyHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, color: "#4A3D4E", fontSize: 11 }, historyText: { margin: "5px 0 0", color: "#7D7182", fontSize: 10, lineHeight: 1.5 }, historyNotes: { margin: "7px 0 0", borderRadius: 8, background: "#FAF7FC", color: "#675A6C", padding: 8, fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap" }, emptyState: { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, minHeight: 130, boxSizing: "border-box", border: "1px dashed #DDD2E3", borderRadius: 12, background: "#FCFAFD", color: "#887C8D", padding: 20, textAlign: "center", fontSize: 11 },
  errorBanner: { display: "flex", alignItems: "flex-start", gap: 9, margin: "18px 22px 0", border: "1px solid #E8CBD2", borderRadius: 11, background: "#FFF7F8", color: "#8B4E5D", padding: "11px 13px", fontSize: 11 }, successBanner: { display: "flex", alignItems: "flex-start", gap: 9, margin: "18px 22px 0", border: "1px solid #CFE6D8", borderRadius: 11, background: "#F5FCF8", color: "#527460", padding: "11px 13px", fontSize: 11 },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, padding: "16px 22px", borderTop: "1px solid #EEE6F1", background: "#FCFAFD" }, changeSummary: { display: "flex", alignItems: "center", gap: 7, color: "#7C7081", fontSize: 11, fontWeight: 650 }, unsavedDot: { width: 7, height: 7, borderRadius: 999, background: "#8A6B9D" }, footerActions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 },
  primaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 38, border: "1px solid #6E5084", borderRadius: 9, background: "#6E5084", color: "#FFFFFF", padding: "8px 13px", fontSize: 11, fontWeight: 800, cursor: "pointer" }, secondaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 38, border: "1px solid #DCCFE3", borderRadius: 9, background: "#FFFFFF", color: "#6E5084", padding: "8px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }, tertiaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 38, border: 0, borderRadius: 9, background: "transparent", color: "#766A7A", padding: "8px 10px", fontSize: 11, fontWeight: 750, cursor: "pointer" }, iconButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, flex: "0 0 auto", border: "1px solid #E4DBE8", borderRadius: 9, background: "#FFFFFF", color: "#766A7A", cursor: "pointer" },
  accessCard: { display: "flex", alignItems: "flex-start", gap: 13, border: "1px solid #E6DCEB", borderRadius: 16, background: "#FBF8FC", padding: 20 }, accessIcon: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, flex: "0 0 auto", borderRadius: 11, background: "#F0E8F4", color: "#6E5084" }, accessTitle: { margin: 0, color: "#493C4E", fontSize: 14, fontWeight: 800 }, accessText: { margin: "5px 0 0", color: "#827687", fontSize: 11, lineHeight: 1.5 },
};