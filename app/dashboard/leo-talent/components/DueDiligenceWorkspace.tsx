"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import CandidateEmployeeDetails from "./shared/CandidateEmployeeDetails";
import TalentIntelligencePanel from "./shared/TalentIntelligencePanel";
import IdentityVerificationDetails from "./shared/IdentityVerificationDetails";
import RightToWorkDetails from "./shared/RightToWorkDetails";
import ReferencesDetails from "./shared/ReferencesDetails";
import DBSDetails from "./shared/DBSDetails";
import OverseasChecksDetails from "./shared/OverseasChecksDetails";
import QualificationsDetails from "./shared/QualificationsDetails";
import ProfessionalRegistrationsDetails from "./shared/ProfessionalRegistrationsDetails";
import DrivingDetails from "./shared/DrivingDetails";
import VehicleDetails from "./shared/VehicleDetails";
import SharedDocumentsDetails from "./shared/SharedDocumentsDetails";
import AppointmentDecisionDetails from "./shared/AppointmentDecisionDetails";

type SharedKey =
  | "identity_verification"
  | "right_to_work"
  | "references"
  | "dbs"
  | "overseas_checks"
  | "qualifications"
  | "professional_registrations"
  | "driving"
  | "vehicle"
  | "appointment_decision";

type WorkspaceTab =
  | "overview"
  | "personal"
  | "identity"
  | "right_to_work"
  | "references"
  | "dbs"
  | "overseas"
  | "qualifications"
  | "registrations"
  | "driving"
  | "vehicle"
  | "documents"
  | "decision";

type Candidate = {
  id: string;
  candidate_reference: string;
  first_name: string;
  middle_names: string | null;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
};

type Vacancy = {
  id: string;
  vacancy_reference: string;
  title: string;
  department: string | null;
  location_name: string | null;
  safer_recruitment_required: boolean;
  requires_dbs: boolean;
  dbs_level: string | null;
  requires_driving: boolean;
  requires_qualification_checks: boolean;
  required_reference_count: number;
  overseas_check_required_if_applicable: boolean;
};

type Application = {
  id: string;
  application_reference: string;
  vacancy_id: string;
  candidate_id: string;
  current_stage_key: string;
  status: string;
};

type Profile = {
  id: string;
  organisation_id: string;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  status: string;
  overall_risk_level: string;
  review_required: boolean;
  overall_notes: string | null;
  updated_at: string;
};

type WorkspaceRecord = {
  profile: Profile;
  candidate: Candidate | null;
  vacancy: Vacancy | null;
  application: Application | null;
};

type SharedRecord = {
  id: string;
  component_key: SharedKey;
  payload: Record<string, unknown>;
  status: string | null;
  completed_at?: string | null;
  updated_at: string;
};

type PlatformRole = "owner" | "senior" | "manager" | "employee";

type CandidateDocument = {
  id: string;
  title: string;
  document_type: string;
  file_name: string;
  created_at: string;
  verified_by: string | null;
  verification_notes: string | null;
};

type Notice = { type: "success" | "error"; message: string };

const tabs: Array<{ key: WorkspaceTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "personal", label: "Personal details" },
  { key: "identity", label: "Identity" },
  { key: "right_to_work", label: "Right to Work" },
  { key: "references", label: "References" },
  { key: "dbs", label: "DBS" },
  { key: "overseas", label: "Overseas" },
  { key: "qualifications", label: "Qualifications" },
  { key: "registrations", label: "Professional registrations" },
  { key: "driving", label: "Driving" },
  { key: "vehicle", label: "Vehicle" },
  { key: "documents", label: "Documents" },
  { key: "decision", label: "Appointment decision" },
];

const emptyPayloads: Record<SharedKey, Record<string, unknown>> = {
  identity_verification: {},
  right_to_work: {},
  references: {},
  dbs: {},
  overseas_checks: {},
  qualifications: {},
  professional_registrations: {},
  driving: {},
  vehicle: {},
  appointment_decision: {},
};

function candidateName(candidate: Candidate | null) {
  if (!candidate) return "Candidate";
  return [candidate.first_name, candidate.middle_names, candidate.last_name]
    .filter(Boolean)
    .join(" ");
}

function initials(candidate: Candidate | null) {
  if (!candidate) return "C";
  return `${candidate.first_name?.[0] ?? ""}${candidate.last_name?.[0] ?? ""}`.toUpperCase();
}

function normaliseLabel(value?: string | null) {
  if (!value) return "Not recorded";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string) {
  if (["complete", "verified", "cleared", "satisfactory", "approved"].some((word) => status.includes(word))) {
    return { background: "#F1F8F4", border: "#C7E3D1", colour: "#35634A" };
  }
  if (["concern", "failed", "not_cleared", "expired"].some((word) => status.includes(word))) {
    return { background: "#FCF2F4", border: "#E9C8D0", colour: "#8A4252" };
  }
  return { background: "#F7F1FC", border: "#DDCDEB", colour: "#6E5084" };
}

function extractStatus(key: SharedKey, value: any): string | null {
  switch (key) {
    case "identity_verification":
    case "right_to_work":
    case "dbs":
    case "vehicle":
      return value?.status ?? null;
    case "references":
    case "overseas_checks":
    case "qualifications":
    case "professional_registrations":
      return value?.overallStatus ?? null;
    case "driving":
      return value?.checkStatus ?? null;
    case "appointment_decision":
      return value?.outcome ?? null;
  }
}

function isComplete(key: SharedKey, payload: any, vacancy: Vacancy | null) {
  if (key === "dbs" && !vacancy?.requires_dbs) return true;
  if (key === "overseas_checks" && !vacancy?.overseas_check_required_if_applicable) return true;
  if (key === "qualifications" && !vacancy?.requires_qualification_checks) return true;
  if (key === "driving" && !vacancy?.requires_driving) return true;
  if (key === "vehicle" && !vacancy?.requires_driving) return true;

  const status = extractStatus(key, payload);
  return [
    "verified",
    "complete",
    "satisfactory",
    "active",
    "approved",
    "not_required",
    "cleared",
    "cleared_with_conditions",
  ].includes(status ?? "");
}

export default function DueDiligenceWorkspace() {
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [shared, setShared] = useState<Record<SharedKey, SharedRecord | null>>({
    identity_verification: null,
    right_to_work: null,
    references: null,
    dbs: null,
    overseas_checks: null,
    qualifications: null,
    professional_registrations: null,
    driving: null,
    vehicle: null,
    appointment_decision: null,
  });
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<SharedKey | "personal" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [role, setRole] = useState<PlatformRole>("employee");

  const selected = useMemo(
    () => records.find((item) => item.profile.id === selectedProfileId) ?? null,
    [records, selectedProfileId],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((item) =>
      [
        candidateName(item.candidate),
        item.candidate?.candidate_reference,
        item.application?.application_reference,
        item.vacancy?.title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [records, search]);

  const valueFor = useCallback(
    (key: SharedKey) => (shared[key]?.payload ?? emptyPayloads[key]) as any,
    [shared],
  );

  const requirements = useMemo(() => {
    if (!selected) return [];
    const vacancy = selected.vacancy;
    return [
      { key: "identity_verification" as SharedKey, label: "Identity verification", required: true },
      { key: "right_to_work" as SharedKey, label: "Right to Work", required: true },
      { key: "references" as SharedKey, label: "References", required: true },
      { key: "dbs" as SharedKey, label: "DBS", required: Boolean(vacancy?.requires_dbs) },
      { key: "overseas_checks" as SharedKey, label: "Overseas checks", required: Boolean(vacancy?.overseas_check_required_if_applicable) },
      { key: "qualifications" as SharedKey, label: "Qualifications", required: Boolean(vacancy?.requires_qualification_checks) },
      { key: "professional_registrations" as SharedKey, label: "Professional registrations", required: Boolean(vacancy?.requires_qualification_checks) },
      { key: "driving" as SharedKey, label: "Driving", required: Boolean(vacancy?.requires_driving) },
      { key: "vehicle" as SharedKey, label: "Vehicle", required: Boolean(vacancy?.requires_driving) },
    ];
  }, [selected]);

  const setError = (message: string) => setNotice({ type: "error", message });
  const setSuccess = (message: string) => setNotice({ type: "success", message });

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const response = await fetch("/api/talent/due-diligence", {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Due diligence could not be loaded.");
      }

      const assembled = (result.records ?? []) as WorkspaceRecord[];
      const roleValue = String(result.role ?? "employee").toLowerCase();
      setRole(
        roleValue === "owner"
          ? "owner"
          : roleValue === "senior"
            ? "senior"
            : roleValue === "manager"
              ? "manager"
              : "employee",
      );
      setRecords(assembled);
      setSelectedProfileId((current) =>
        assembled.some((item) => item.profile.id === current)
          ? current
          : assembled[0]?.profile.id ?? null,
      );
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Due diligence could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetails = useCallback(async (record: WorkspaceRecord, clearNotice = true) => {
    setDetailLoading(true);
    if (clearNotice) setNotice(null);

    try {
      const response = await fetch(
        `/api/talent/due-diligence/${record.profile.id}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Candidate due diligence details could not be loaded.",
        );
      }

      const next: Record<SharedKey, SharedRecord | null> = {
        identity_verification: null,
        right_to_work: null,
        references: null,
        dbs: null,
        overseas_checks: null,
        qualifications: null,
        professional_registrations: null,
        driving: null,
        vehicle: null,
        appointment_decision: null,
      };

      ((result.sharedRecords ?? []) as SharedRecord[]).forEach((item) => {
        next[item.component_key] = item;
      });

      setShared(next);
      setDocuments((result.documents ?? []) as CandidateDocument[]);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Candidate due diligence details could not be loaded.",
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => {
    if (selected) void loadDetails(selected);
  }, [selectedProfileId, loadDetails]);

  async function saveShared(
    key: SharedKey,
    payload: any,
    message: string,
  ) {
    if (!selected) return;

    setSavingKey(key);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/talent/due-diligence/${selected.profile.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_shared",
            key,
            value: payload.value ?? payload,
          }),
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "The record could not be saved.");
      }

      await loadDetails(selected, false);
      setSuccess(message);
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "The record could not be saved.",
      );
      throw error;
    } finally {
      setSavingKey(null);
    }
  }

  async function savePersonal(value: any) {
    if (!selected?.candidate) return;

    setSavingKey("personal");
    setNotice(null);

    try {
      const response = await fetch(
        `/api/talent/due-diligence/${selected.profile.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_personal",
            value,
          }),
        },
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Personal details could not be saved.",
        );
      }

      const candidate = result.candidate as Candidate;
      setRecords((current) =>
        current.map((item) =>
          item.profile.id === selected.profile.id
            ? { ...item, candidate }
            : item,
        ),
      );
      setSuccess("Personal details saved.");
    } catch (error) {
      console.error(error);
      setError(
        error instanceof Error
          ? error.message
          : "Personal details could not be saved.",
      );
      throw error;
    } finally {
      setSavingKey(null);
    }
  }

  const candidateValue = selected?.candidate
    ? {
        firstName: selected.candidate.first_name,
        middleNames: selected.candidate.middle_names ?? "",
        lastName: selected.candidate.last_name,
        preferredName: selected.candidate.preferred_name ?? "",
        personalEmail: selected.candidate.email ?? "",
        personalTelephone: selected.candidate.phone ?? "",
        country: selected.candidate.country ?? "United Kingdom",
      }
    : {};

  const sharedProps = (key: SharedKey) => ({
    mode: "candidate" as const,
    recordId: selected?.candidate?.id,
    recordLabel: candidateName(selected?.candidate ?? null),
    value: valueFor(key),
    saving: savingKey === key,
    onSave: (payload: any) => saveShared(key, payload, `${tabs.find((tab) => tab.key === activeTab)?.label ?? "Record"} saved.`),
    onAudit: async () => undefined,
    permissions:
      key === "appointment_decision"
        ? {
            canEdit: role === "owner" || role === "senior",
            canMakeDecision: role === "owner" || role === "senior",
          }
        : undefined,
  });

  const appointmentDecisionOutcome =
    typeof shared.appointment_decision?.payload?.outcome === "string"
      ? shared.appointment_decision.payload.outcome
      : "pending";

  if (loading) {
    return <Shell><Empty title="Loading due diligence" text="Leo is preparing the candidate register." /></Shell>;
  }

  return (
    <Shell>
      <header style={styles.pageHeader}>
        <div>
          <p style={styles.eyebrow}>Leo Talent</p>
          <h1 style={styles.pageTitle}>Due diligence</h1>
          <p style={styles.pageDescription}>
            Complete and verify every role-specific pre-employment check through the shared candidate record.
          </p>
        </div>
        <button type="button" style={styles.secondaryButton} onClick={() => void loadWorkspace()}>
          Refresh
        </button>
      </header>

      {notice ? <div style={{ ...styles.notice, ...(notice.type === "error" ? styles.noticeError : styles.noticeSuccess) }}><span>{notice.message}</span><button type="button" style={styles.noticeClose} onClick={() => setNotice(null)}>×</button></div> : null}

      <TalentIntelligencePanel stage="due_diligence" />

      <div style={styles.workspaceGrid}>
        <aside style={styles.register}>
          <div style={styles.registerHeader}>
            <h2 style={styles.panelTitle}>Candidate register</h2>
            <input style={styles.search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidate or vacancy" />
          </div>
          <div style={styles.registerList}>
            {filtered.length === 0 ? <Empty title="No candidates" text="Candidates appear here when they enter pre-employment checks." compact /> : filtered.map((item) => {
              const active = item.profile.id === selectedProfileId;
              return <button key={item.profile.id} type="button" style={{ ...styles.registerItem, ...(active ? styles.registerItemActive : {}) }} onClick={() => { setSelectedProfileId(item.profile.id); setActiveTab("overview"); }}>
                <span style={styles.avatar}>{initials(item.candidate)}</span>
                <span style={styles.registerText}>
                  <strong>{candidateName(item.candidate)}</strong>
                  <small>{item.vacancy?.title ?? "Vacancy not found"}</small>
                  <Status status={item.profile.status} />
                </span>
              </button>;
            })}
          </div>
        </aside>

        <main style={styles.detail}>
          {!selected ? <Empty title="Select a candidate" text="Choose a candidate to manage their pre-employment checks." /> : detailLoading ? <Empty title="Loading candidate record" text="Leo is preparing the shared record." /> : <>
            <div style={styles.candidateHeader}>
              <div style={styles.candidateIdentity}>
                <span style={styles.largeAvatar}>{initials(selected.candidate)}</span>
                <div>
                  <p style={styles.eyebrow}>{selected.application?.application_reference ?? "Application"}</p>
                  <h2 style={styles.candidateName}>{candidateName(selected.candidate)}</h2>
                  <p style={styles.candidateMeta}>{selected.vacancy?.title ?? "Vacancy"}{selected.vacancy?.department ? ` · ${selected.vacancy.department}` : ""}</p>
                </div>
              </div>
            </div>

            {appointmentDecisionOutcome === "ready_for_appointment" ? (
              <div style={styles.overrideWarning}>
                Appointment readiness override is active: Ready for appointment was set manually. Outstanding checks remain visible and unchanged.
              </div>
            ) : null}
            {appointmentDecisionOutcome === "not_ready" || appointmentDecisionOutcome === "withdrawn" ? (
              <div style={styles.blockWarning}>
                Appointment progression is blocked by the current appointment decision.
              </div>
            ) : null}

            <nav style={styles.tabs}>
              {tabs.map((tab) => <button key={tab.key} type="button" style={{ ...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {}) }} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
            </nav>

            <div style={styles.tabContent}>
              {activeTab === "overview" ? <Overview record={selected} requirements={requirements} shared={shared} /> : null}
              {activeTab === "personal" ? <CandidateEmployeeDetails mode="candidate" recordId={selected.candidate?.id} recordLabel={candidateName(selected.candidate)} value={candidateValue} saving={savingKey === "personal"} onSave={savePersonal} /> : null}
              {activeTab === "identity" ? <IdentityVerificationDetails {...sharedProps("identity_verification")} /> : null}
              {activeTab === "right_to_work" ? <RightToWorkDetails {...sharedProps("right_to_work")} /> : null}
              {activeTab === "references" ? <ReferencesDetails {...sharedProps("references")} value={{ ...valueFor("references"), referencesRequired: true, minimumReferencesRequired: selected.vacancy?.required_reference_count ?? 1 }} /> : null}
              {activeTab === "dbs" ? <DBSDetails {...sharedProps("dbs")} value={{ ...valueFor("dbs"), roleRequiresDBS: Boolean(selected.vacancy?.requires_dbs), requirement: selected.vacancy?.requires_dbs ? (selected.vacancy?.dbs_level ?? "enhanced") : "not_required" }} /> : null}
              {activeTab === "overseas" ? <OverseasChecksDetails {...sharedProps("overseas_checks")} value={{ ...valueFor("overseas_checks"), overseasChecksRequired: Boolean(selected.vacancy?.overseas_check_required_if_applicable) }} /> : null}
              {activeTab === "qualifications" ? <QualificationsDetails {...sharedProps("qualifications")} value={{ ...valueFor("qualifications"), qualificationRequiredForRole: Boolean(selected.vacancy?.requires_qualification_checks) }} /> : null}
              {activeTab === "registrations" ? <ProfessionalRegistrationsDetails {...sharedProps("professional_registrations")} /> : null}
              {activeTab === "driving" ? <DrivingDetails {...sharedProps("driving")} value={{ ...valueFor("driving"), drivingRequiredForRole: Boolean(selected.vacancy?.requires_driving), requirementStatus: selected.vacancy?.requires_driving ? "required" : "not_required" }} /> : null}
              {activeTab === "vehicle" ? <VehicleDetails {...sharedProps("vehicle")} value={{ ...valueFor("vehicle"), vehicleRequiredForRole: Boolean(selected.vacancy?.requires_driving) }} /> : null}
              {activeTab === "documents" ? <SharedDocumentsDetails documents={documents.map((item) => ({ id: item.id, title: item.title, category: item.document_type, uploadedAt: item.created_at, uploadedBy: item.verified_by ?? undefined, notes: item.verification_notes ?? undefined, fileName: item.file_name }))} /> : null}
              {activeTab === "decision" ? <AppointmentDecisionDetails {...sharedProps("appointment_decision")} value={{ ...valueFor("appointment_decision"), saferRecruitmentRequired: Boolean(selected.vacancy?.safer_recruitment_required), proposedStartDate: "" }} /> : null}
            </div>
          </>}
        </main>
      </div>
    </Shell>
  );
}

function Overview({
  record,
  requirements,
  shared,
}: {
  record: WorkspaceRecord;
  requirements: Array<{ key: SharedKey; label: string; required: boolean }>;
  shared: Record<SharedKey, SharedRecord | null>;
}) {
  return <div style={styles.stack}>
    <section style={styles.card}>
      <h3 style={styles.cardTitle}>Current position</h3>
      <div style={styles.summaryGrid}>
        <Summary label="Candidate reference" value={record.candidate?.candidate_reference ?? "Not recorded"} />
        <Summary label="Application reference" value={record.application?.application_reference ?? "Not recorded"} />
        <Summary label="Vacancy" value={record.vacancy?.title ?? "Not recorded"} />
        <Summary label="Stage" value={normaliseLabel(record.application?.current_stage_key)} />
        <Summary label="Required references" value={String(record.vacancy?.required_reference_count ?? 1)} />
      </div>
    </section>
    <section style={styles.card}>
      <h3 style={styles.cardTitle}>Role-specific check position</h3>
      <div style={styles.requirementList}>
        {requirements.map((item) => {
          const status = shared[item.key]?.status ?? (item.required ? "not_started" : "not_required");
          return <div key={item.key} style={styles.requirementRow}><div><strong>{item.label}</strong><small>{item.required ? "Required for this appointment" : "Not required by the vacancy"}</small></div><Status status={status} /></div>;
        })}
      </div>
    </section>
    <section style={styles.leoPanel}><span style={styles.leoIcon}>✦</span><div><h3>Leo guidance</h3><p>Complete each required check through the shared record. The appointment decision should only be finalised after the employer has reviewed the evidence, any discrepancy and any temporary condition.</p></div></section>
  </div>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div style={styles.page}>{children}</div>;
}
function Status({ status }: { status: string }) {
  const tone = statusTone(status);
  return <span style={{ ...styles.status, background: tone.background, borderColor: tone.border, color: tone.colour }}>{normaliseLabel(status)}</span>;
}
function Summary({ label, value }: { label: string; value: string }) {
  return <div style={styles.summary}><span>{label}</span><strong>{value}</strong></div>;
}
function Empty({ title, text, compact = false }: { title: string; text: string; compact?: boolean }) {
  return <div style={{ ...styles.empty, minHeight: compact ? 170 : 360 }}><span style={styles.emptyIcon}>✦</span><h3>{title}</h3><p>{text}</p></div>;
}

const styles: Record<string, React.CSSProperties> = {
  page: { width: "100%", minWidth: 0, color: "#2F2933" },
  pageHeader: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18 },
  eyebrow: { margin: 0, color: "#6E5084", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" },
  pageTitle: { margin: "5px 0 7px", fontSize: 28 },
  pageDescription: { margin: 0, color: "#6D6671", lineHeight: 1.6 },
  secondaryButton: { border: "1px solid #D8CBE1", borderRadius: 10, background: "#fff", color: "#6E5084", padding: "9px 13px", fontWeight: 700, cursor: "pointer" },
  notice: { display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 14px", marginBottom: 18, border: "1px solid", borderRadius: 12, fontSize: 13 },
  noticeSuccess: { background: "#F1F8F4", borderColor: "#C7E3D1", color: "#35634A" },
  noticeError: { background: "#FCF2F4", borderColor: "#E9C8D0", color: "#8A4252" },
  noticeClose: { border: 0, background: "transparent", color: "inherit", cursor: "pointer", fontSize: 20 },
  workspaceGrid: { display: "grid", gridTemplateColumns: "minmax(270px,330px) minmax(0,1fr)", gap: 18, alignItems: "start" },
  register: { border: "1px solid #E8DFF0", borderRadius: 18, background: "#fff", overflow: "hidden", position: "sticky", top: 18 },
  registerHeader: { display: "grid", gap: 12, padding: 18, borderBottom: "1px solid #EEE7F3" },
  panelTitle: { margin: 0, fontSize: 16 },
  search: { width: "100%", boxSizing: "border-box", border: "1px solid #DCD3E2", borderRadius: 10, padding: "10px 11px" },
  registerList: { maxHeight: 760, overflowY: "auto" },
  registerItem: { width: "100%", display: "flex", gap: 11, padding: "14px 16px", border: 0, borderBottom: "1px solid #F1ECF4", background: "#fff", textAlign: "left", cursor: "pointer" },
  registerItemActive: { background: "#F7F1FC", boxShadow: "inset 4px 0 0 #6E5084" },
  avatar: { width: 38, height: 38, display: "grid", placeItems: "center", flex: "0 0 auto", borderRadius: 12, background: "#EFE4F7", color: "#6E5084", fontWeight: 800 },
  registerText: { minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5, fontSize: 13 },
  detail: { minWidth: 0, border: "1px solid #E8DFF0", borderRadius: 18, background: "#fff", overflow: "hidden" },
  candidateHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap", padding: 22 },
  candidateIdentity: { display: "flex", alignItems: "center", gap: 14 },
  largeAvatar: { width: 54, height: 54, display: "grid", placeItems: "center", borderRadius: 16, background: "#EFE4F7", color: "#6E5084", fontWeight: 800 },
  candidateName: { margin: "4px 0", fontSize: 21 },
  candidateMeta: { margin: 0, color: "#77707C", fontSize: 12 },
  overrideWarning: { margin: "0 22px 14px", padding: "11px 12px", borderRadius: 10, border: "1px solid #CDAE8B", background: "#FFF4E6", color: "#7A4A14", fontSize: 12, lineHeight: 1.5 },
  blockWarning: { margin: "0 22px 14px", padding: "11px 12px", borderRadius: 10, border: "1px solid #E9C8D0", background: "#FCF2F4", color: "#8A4252", fontSize: 12, lineHeight: 1.5 },
  tabs: { display: "flex", gap: 3, padding: "10px 16px 0", borderBottom: "1px solid #EDE7F1", overflowX: "auto" },
  tab: { border: 0, borderBottomWidth: 3, borderBottomStyle: "solid", borderBottomColor: "transparent", background: "transparent", padding: "10px 11px", color: "#776F7C", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 650, fontSize: 12 },
  tabActive: { color: "#6E5084", borderBottomColor: "#6E5084" },
  tabContent: { padding: 20 },
  stack: { display: "grid", gap: 16 },
  card: { display: "grid", gap: 14, padding: 18, border: "1px solid #E9E1EE", borderRadius: 15 },
  cardTitle: { margin: 0, fontSize: 15 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 },
  summary: { display: "grid", gap: 5, padding: 12, border: "1px solid #EEE6F3", borderRadius: 11, background: "#FAF7FC", fontSize: 11 },
  requirementList: { display: "grid", gap: 9 },
  requirementRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 11, border: "1px solid #E9E1EE", borderRadius: 11 },
  status: { display: "inline-flex", width: "fit-content", padding: "4px 8px", border: "1px solid", borderRadius: 999, fontSize: 10, fontWeight: 750 },
  leoPanel: { display: "flex", gap: 12, padding: 17, border: "1px solid #DCCBE8", borderRadius: 15, background: "#F7F1FC" },
  leoIcon: { width: 34, height: 34, display: "grid", placeItems: "center", flex: "0 0 auto", borderRadius: 11, background: "#fff", color: "#6E5084" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center", color: "#7C7481" },
  emptyIcon: { width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 14, background: "#F1E8F7", color: "#6E5084" },
};