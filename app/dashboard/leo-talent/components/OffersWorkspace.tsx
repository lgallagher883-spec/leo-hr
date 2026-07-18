"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Loader2,
  Mail,
  Printer,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Row = Record<string, unknown>;
type OfferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "issued"
  | "accepted"
  | "declined"
  | "negotiation"
  | "withdrawn"
  | "appointed"
  | "converted";

type ChecklistKey =
  | "contract_produced"
  | "payroll_notified"
  | "employee_record_created"
  | "equipment_prepared"
  | "induction_booked"
  | "first_day_planned"
  | "it_account_requested"
  | "uniform_prepared"
  | "welcome_email_sent"
  | "policies_assigned"
  | "probation_created"
  | "learning_recommended";

type Checklist = Record<ChecklistKey, boolean>;

type OfferRecord = {
  id: string;
  organisation_id: string | number | null;
  vacancy_id: string | null;
  application_id: string | null;
  candidate_id: string | null;
  candidate_name: string;
  candidate_email: string;
  vacancy_title: string;
  vacancy_reference: string;
  status: OfferStatus;
  offer_type: string;
  offered_salary: string;
  salary_currency: string;
  salary_period: string;
  hours_per_week: string;
  proposed_start_date: string;
  offer_date: string;
  probation_months: string;
  holiday_entitlement: string;
  manager_name: string;
  contract_type: string;
  conditions: string;
  notes: string;
  candidate_response: string;
  responded_at: string;
  accepted_at: string;
  declined_at: string;
  withdrawn_at: string;
  appointment_notes: string;
  checklist: Checklist;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
};

type CandidateOption = {
  id: string;
  applicationId: string | null;
  vacancyId: string | null;
  name: string;
  email: string;
  vacancyTitle: string;
  vacancyReference: string;
  organisationId: string | number | null;
};

const EMPTY_CHECKLIST: Checklist = {
  contract_produced: false,
  payroll_notified: false,
  employee_record_created: false,
  equipment_prepared: false,
  induction_booked: false,
  first_day_planned: false,
  it_account_requested: false,
  uniform_prepared: false,
  welcome_email_sent: false,
  policies_assigned: false,
  probation_created: false,
  learning_recommended: false,
};

const CHECKLIST_LABELS: Array<[ChecklistKey, string]> = [
  ["contract_produced", "Contract produced"],
  ["payroll_notified", "Payroll notified"],
  ["employee_record_created", "Employee record prepared"],
  ["equipment_prepared", "Equipment prepared"],
  ["induction_booked", "Induction booked"],
  ["first_day_planned", "First day planned"],
  ["it_account_requested", "IT account requested"],
  ["uniform_prepared", "Uniform prepared"],
  ["welcome_email_sent", "Welcome email sent"],
  ["policies_assigned", "Policies assigned"],
  ["probation_created", "Probation record prepared"],
  ["learning_recommended", "Leo Learn pathway reviewed"],
];

const OFFER_STATUSES: Array<{ value: OfferStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Awaiting approval" },
  { value: "approved", label: "Approved" },
  { value: "issued", label: "Issued" },
  { value: "accepted", label: "Accepted" },
  { value: "negotiation", label: "Negotiation" },
  { value: "declined", label: "Declined" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "appointed", label: "Appointment in progress" },
  { value: "converted", label: "Converted to employee" },
];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function idValue(value: unknown): string | null {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function dateValue(value: unknown): string {
  const valueText = text(value);
  return valueText ? valueText.slice(0, 10) : "";
}

function nowIso(): string {
  return new Date().toISOString();
}

function humanise(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function candidateName(row: Row): string {
  return (
    text(row.full_name) ||
    `${text(row.first_name)} ${text(row.last_name)}`.trim() ||
    text(row.candidate_name) ||
    text(row.email) ||
    "Candidate"
  );
}

function parseChecklist(value: unknown): Checklist {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...EMPTY_CHECKLIST };
  }

  const source = value as Row;
  return CHECKLIST_LABELS.reduce(
    (result, [key]) => ({ ...result, [key]: source[key] === true }),
    { ...EMPTY_CHECKLIST },
  );
}

function mapOffer(row: Row): OfferRecord {
  return {
    id: String(row.id),
    organisation_id:
      (row.organisation_id as string | number | null | undefined) ?? null,
    vacancy_id: idValue(row.vacancy_id),
    application_id: idValue(row.application_id),
    candidate_id: idValue(row.candidate_id),
    candidate_name: text(row.candidate_name) || "Candidate",
    candidate_email: text(row.candidate_email),
    vacancy_title: text(row.vacancy_title) || text(row.job_title) || "Vacancy",
    vacancy_reference: text(row.vacancy_reference),
    status: (text(row.status || row.offer_status).toLowerCase() || "draft") as OfferStatus,
    offer_type: text(row.offer_type) || "Conditional offer",
    offered_salary: row.offered_salary === null || row.offered_salary === undefined ? "" : String(row.offered_salary),
    salary_currency: text(row.salary_currency) || "GBP",
    salary_period: text(row.salary_period) || "per annum",
    hours_per_week: row.hours_per_week === null || row.hours_per_week === undefined ? "" : String(row.hours_per_week),
    proposed_start_date: dateValue(row.proposed_start_date || row.start_date),
    offer_date: dateValue(row.offer_date || row.issued_at),
    probation_months: row.probation_months === null || row.probation_months === undefined ? "3" : String(row.probation_months),
    holiday_entitlement: text(row.holiday_entitlement),
    manager_name: text(row.manager_name || row.hiring_manager_name),
    contract_type: text(row.contract_type || row.employment_type),
    conditions: text(row.conditions || row.offer_conditions),
    notes: text(row.notes),
    candidate_response: text(row.candidate_response) || "Awaiting response",
    responded_at: dateValue(row.responded_at),
    accepted_at: dateValue(row.accepted_at),
    declined_at: dateValue(row.declined_at),
    withdrawn_at: dateValue(row.withdrawn_at),
    appointment_notes: text(row.appointment_notes),
    checklist: parseChecklist(row.appointment_checklist || row.onboarding_checklist),
    employee_id: idValue(row.employee_id),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at),
  };
}

function csvCell(value: unknown): string {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

export default function OffersWorkspace() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<OfferRecord | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setErrorMessage("");

    const [offersResult, candidatesResult, applicationsResult, vacanciesResult] =
      await Promise.all([
        supabase.from("talent_offers").select("*").order("created_at", { ascending: false }),
        supabase.from("talent_candidates").select("*").order("created_at", { ascending: false }),
        supabase.from("talent_applications").select("*").order("created_at", { ascending: false }),
        supabase.from("talent_vacancies").select("*").order("created_at", { ascending: false }),
      ]);

    if (offersResult.error) {
      setErrorMessage(`Offers could not be loaded. ${offersResult.error.message}`);
      setOffers([]);
    } else {
      const mapped = (offersResult.data ?? []).map((row) => mapOffer(row as Row));
      setOffers(mapped);
      setSelectedId((current) => current || mapped[0]?.id || "");
    }

    const applicationRows = (applicationsResult.data ?? []) as Row[];
    const vacancyRows = (vacanciesResult.data ?? []) as Row[];
    const candidateRows = (candidatesResult.data ?? []) as Row[];

    const applicationByCandidate = new Map<string, Row>();
    applicationRows.forEach((application) => {
      const candidateId = idValue(application.candidate_id);
      if (candidateId && !applicationByCandidate.has(candidateId)) {
        applicationByCandidate.set(candidateId, application);
      }
    });

    const vacancyById = new Map<string, Row>();
    vacancyRows.forEach((vacancy) => vacancyById.set(String(vacancy.id), vacancy));

    setCandidates(
      candidateRows.map((candidate) => {
        const candidateId = String(candidate.id);
        const application = applicationByCandidate.get(candidateId);
        const vacancyId = idValue(application?.vacancy_id || candidate.vacancy_id);
        const vacancy = vacancyId ? vacancyById.get(vacancyId) : undefined;

        return {
          id: candidateId,
          applicationId: idValue(application?.id),
          vacancyId,
          name: candidateName(candidate),
          email: text(candidate.email),
          vacancyTitle: text(vacancy?.title || vacancy?.vacancy_title) || "Vacancy not linked",
          vacancyReference: text(vacancy?.vacancy_reference || vacancy?.reference),
          organisationId:
            (candidate.organisation_id as string | number | null | undefined) ??
            (vacancy?.organisation_id as string | number | null | undefined) ??
            null,
        };
      }),
    );

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const selected = offers.find((offer) => offer.id === selectedId) ?? null;
    setDraft(selected ? { ...selected, checklist: { ...selected.checklist } } : null);
  }, [offers, selectedId]);

  const filteredOffers = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesQuery =
        !normalisedQuery ||
        [
          offer.candidate_name,
          offer.candidate_email,
          offer.vacancy_title,
          offer.vacancy_reference,
          offer.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalisedQuery);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          !["declined", "withdrawn", "converted"].includes(offer.status)) ||
        offer.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [offers, query, statusFilter]);

  const metrics = useMemo(
    () => ({
      active: offers.filter((offer) => !["declined", "withdrawn", "converted"].includes(offer.status)).length,
      approval: offers.filter((offer) => offer.status === "pending_approval").length,
      response: offers.filter((offer) => ["approved", "issued"].includes(offer.status)).length,
      accepted: offers.filter((offer) => offer.status === "accepted").length,
      ready: offers.filter((offer) => {
        const complete = Object.values(offer.checklist).filter(Boolean).length;
        return ["accepted", "appointed"].includes(offer.status) && complete === CHECKLIST_LABELS.length;
      }).length,
    }),
    [offers],
  );

  const updateDraft = <K extends keyof OfferRecord>(key: K, value: OfferRecord[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const createOffer = async (candidateId: string) => {
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate) return;

    setWorking("create");
    setErrorMessage("");

    const payload = {
      organisation_id: candidate.organisationId,
      vacancy_id: candidate.vacancyId,
      application_id: candidate.applicationId,
      candidate_id: candidate.id,
      candidate_name: candidate.name,
      candidate_email: candidate.email || null,
      vacancy_title: candidate.vacancyTitle,
      vacancy_reference: candidate.vacancyReference || null,
      status: "draft",
      offer_type: "Conditional offer",
      salary_currency: "GBP",
      salary_period: "per annum",
      probation_months: 3,
      candidate_response: "Awaiting response",
      appointment_checklist: EMPTY_CHECKLIST,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    const result = await supabase.from("talent_offers").insert(payload).select("*").single();

    if (result.error) {
      setErrorMessage(`The offer could not be created. ${result.error.message}`);
      setWorking("");
      return;
    }

    const created = mapOffer(result.data as Row);
    setOffers((current) => [created, ...current]);
    setSelectedId(created.id);
    setSuccessMessage("Offer created. Complete the terms before issuing it.");
    setWorking("");
  };

  const saveOffer = async () => {
    if (!draft) return;
    if (!draft.candidate_name.trim() || !draft.vacancy_title.trim()) {
      setErrorMessage("The candidate and vacancy must be identified.");
      return;
    }

    setWorking("save");
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      status: draft.status,
      offer_type: draft.offer_type || null,
      offered_salary: draft.offered_salary ? Number(draft.offered_salary) : null,
      salary_currency: draft.salary_currency || "GBP",
      salary_period: draft.salary_period || null,
      hours_per_week: draft.hours_per_week ? Number(draft.hours_per_week) : null,
      proposed_start_date: draft.proposed_start_date || null,
      offer_date: draft.offer_date || null,
      probation_months: draft.probation_months ? Number(draft.probation_months) : null,
      holiday_entitlement: draft.holiday_entitlement || null,
      manager_name: draft.manager_name || null,
      contract_type: draft.contract_type || null,
      conditions: draft.conditions || null,
      notes: draft.notes || null,
      candidate_response: draft.candidate_response || null,
      responded_at: draft.responded_at || null,
      accepted_at: draft.accepted_at || null,
      declined_at: draft.declined_at || null,
      withdrawn_at: draft.withdrawn_at || null,
      appointment_notes: draft.appointment_notes || null,
      appointment_checklist: draft.checklist,
      updated_at: nowIso(),
    };

    const result = await supabase.from("talent_offers").update(payload).eq("id", draft.id).select("*").single();

    if (result.error) {
      setErrorMessage(`The offer could not be saved. ${result.error.message}`);
      setWorking("");
      return;
    }

    const saved = mapOffer(result.data as Row);
    setOffers((current) => current.map((offer) => (offer.id === saved.id ? saved : offer)));
    setSuccessMessage("Offer and appointment record saved.");
    setWorking("");
  };

  const setStatus = async (status: OfferStatus) => {
    if (!draft) return;
    const today = new Date().toISOString().slice(0, 10);
    const next: OfferRecord = {
      ...draft,
      status,
      offer_date: status === "issued" && !draft.offer_date ? today : draft.offer_date,
      candidate_response:
        status === "accepted"
          ? "Accepted"
          : status === "declined"
            ? "Declined"
            : status === "negotiation"
              ? "Negotiation"
              : status === "withdrawn"
                ? "Withdrawn"
                : draft.candidate_response,
      responded_at: ["accepted", "declined", "negotiation"].includes(status) ? today : draft.responded_at,
      accepted_at: status === "accepted" ? today : draft.accepted_at,
      declined_at: status === "declined" ? today : draft.declined_at,
      withdrawn_at: status === "withdrawn" ? today : draft.withdrawn_at,
    };
    setDraft(next);
  };

  const convertToEmployee = async () => {
    if (!draft) return;
    if (!["accepted", "appointed"].includes(draft.status)) {
      setErrorMessage("The offer must be accepted before the candidate can become an employee.");
      return;
    }

    setWorking("convert");
    setErrorMessage("");
    setSuccessMessage("");

    const rpcResult = await supabase.rpc("convert_talent_candidate_to_employee", {
      p_offer_id: draft.id,
    });

    if (rpcResult.error) {
      setErrorMessage(
        `Employee conversion is ready in the interface, but the database conversion function is not available or failed: ${rpcResult.error.message}`,
      );
      setWorking("");
      return;
    }

    const employeeId =
      typeof rpcResult.data === "string" || typeof rpcResult.data === "number"
        ? String(rpcResult.data)
        : idValue((rpcResult.data as Row | null)?.employee_id);

    await supabase
      .from("talent_offers")
      .update({
        status: "converted",
        employee_id: employeeId,
        updated_at: nowIso(),
      })
      .eq("id", draft.id);

    setSuccessMessage("Candidate converted to an employee. Recruitment history remains linked.");
    setWorking("");
    await loadData(true);

    if (employeeId) {
      router.push(`/dashboard/employees/${employeeId}`);
    }
  };

  const exportCsv = () => {
    const headings = [
      "Candidate",
      "Vacancy",
      "Reference",
      "Status",
      "Salary",
      "Hours",
      "Start date",
      "Response",
    ];
    const rows = filteredOffers.map((offer) => [
      offer.candidate_name,
      offer.vacancy_title,
      offer.vacancy_reference,
      humanise(offer.status),
      offer.offered_salary,
      offer.hours_per_week,
      offer.proposed_start_date,
      offer.candidate_response,
    ]);
    const csv = [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leo-talent-offers-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={styles.statePanel}>
        <Loader2 size={24} className="animate-spin" />
        <strong>Loading offers and appointments…</strong>
      </div>
    );
  }

  const checklistCompleted = draft
    ? Object.values(draft.checklist).filter(Boolean).length
    : 0;
  const checklistPercent = Math.round((checklistCompleted / CHECKLIST_LABELS.length) * 100);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>LEO TALENT</p>
          <h1 style={styles.title}>Offers & Appointments</h1>
          <p style={styles.description}>
            Complete the journey from successful candidate to accepted offer,
            appointment, onboarding and employee creation in one connected workspace.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button type="button" style={styles.secondaryButton} onClick={() => void loadData(true)} disabled={refreshing}>
            <RefreshCw size={16} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button type="button" style={styles.secondaryButton} onClick={exportCsv}>
            <Download size={16} />
            Export current view
          </button>
        </div>
      </header>

      {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}
      {successMessage ? <div style={styles.success}>{successMessage}</div> : null}

      <section style={styles.metrics}>
        <Metric label="Active offers" value={metrics.active} />
        <Metric label="Awaiting approval" value={metrics.approval} />
        <Metric label="Awaiting response" value={metrics.response} />
        <Metric label="Accepted" value={metrics.accepted} />
        <Metric label="Ready for employee" value={metrics.ready} />
      </section>

      <div style={styles.workspaceGrid}>
        <aside style={styles.sidebar}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Recruitment journeys</h2>
              <p style={styles.panelDescription}>Select an offer or begin one for a successful candidate.</p>
            </div>
          </div>

          <div style={styles.createBox}>
            <label style={styles.label}>Create offer for</label>
            <select
              style={styles.input}
              value=""
              onChange={(event) => void createOffer(event.target.value)}
              disabled={working === "create"}
            >
              <option value="">Select candidate</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name} · {candidate.vacancyTitle}
                </option>
              ))}
            </select>
          </div>

          <label style={styles.search}>
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search candidate or vacancy"
            />
          </label>

          <select style={styles.input} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="active">Active journeys</option>
            <option value="all">All statuses</option>
            {OFFER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <div style={styles.offerList}>
            {filteredOffers.length === 0 ? (
              <div style={styles.empty}>
                <UserCheck size={24} />
                <strong>No offers match this view</strong>
                <span>Select a successful candidate above to begin the appointment journey.</span>
              </div>
            ) : (
              filteredOffers.map((offer) => (
                <button
                  key={offer.id}
                  type="button"
                  onClick={() => setSelectedId(offer.id)}
                  style={offer.id === selectedId ? styles.offerCardActive : styles.offerCard}
                >
                  <div style={styles.offerCardTop}>
                    <strong>{offer.candidate_name}</strong>
                    <span style={styles.badge}>{humanise(offer.status)}</span>
                  </div>
                  <span>{offer.vacancy_title}</span>
                  <small>{offer.vacancy_reference || "No vacancy reference"}</small>
                </button>
              ))
            )}
          </div>
        </aside>

        <main style={styles.main}>
          {!draft ? (
            <div style={styles.largeEmpty}>
              <Sparkles size={28} />
              <h2>Select or create an offer</h2>
              <p>
                The complete offer, appointment and onboarding journey will appear here.
              </p>
            </div>
          ) : (
            <>
              <section style={styles.hero}>
                <div>
                  <p style={styles.eyebrow}>CANDIDATE JOURNEY</p>
                  <h2 style={styles.heroTitle}>{draft.candidate_name}</h2>
                  <p style={styles.description}>
                    {draft.vacancy_title}
                    {draft.vacancy_reference ? ` · ${draft.vacancy_reference}` : ""}
                  </p>
                </div>
                <span style={styles.heroStatus}>{humanise(draft.status)}</span>
              </section>

              <Journey status={draft.status} />

              <section style={styles.panel}>
                <SectionHeading
                  title="Offer"
                  description="Record the proposed employment terms and keep every version connected to this candidate."
                />

                <div style={styles.formGrid}>
                  <Field label="Offer status">
                    <select style={styles.input} value={draft.status} onChange={(event) => void setStatus(event.target.value as OfferStatus)}>
                      {OFFER_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Offer type">
                    <select style={styles.input} value={draft.offer_type} onChange={(event) => updateDraft("offer_type", event.target.value)}>
                      <option>Verbal offer</option>
                      <option>Conditional offer</option>
                      <option>Unconditional offer</option>
                      <option>Revised offer</option>
                      <option>Appointment confirmation</option>
                    </select>
                  </Field>
                  <Field label="Offer date">
                    <input style={styles.input} type="date" value={draft.offer_date} onChange={(event) => updateDraft("offer_date", event.target.value)} />
                  </Field>
                  <Field label="Proposed start date">
                    <input style={styles.input} type="date" value={draft.proposed_start_date} onChange={(event) => updateDraft("proposed_start_date", event.target.value)} />
                  </Field>
                  <Field label="Salary">
                    <input style={styles.input} type="number" min="0" step="0.01" value={draft.offered_salary} onChange={(event) => updateDraft("offered_salary", event.target.value)} />
                  </Field>
                  <Field label="Salary period">
                    <select style={styles.input} value={draft.salary_period} onChange={(event) => updateDraft("salary_period", event.target.value)}>
                      <option value="per annum">Per annum</option>
                      <option value="per hour">Per hour</option>
                      <option value="per month">Per month</option>
                      <option value="per week">Per week</option>
                    </select>
                  </Field>
                  <Field label="Hours per week">
                    <input style={styles.input} type="number" min="0" step="0.25" value={draft.hours_per_week} onChange={(event) => updateDraft("hours_per_week", event.target.value)} />
                  </Field>
                  <Field label="Contract">
                    <input style={styles.input} value={draft.contract_type} onChange={(event) => updateDraft("contract_type", event.target.value)} placeholder="Permanent, fixed-term, casual…" />
                  </Field>
                  <Field label="Probation">
                    <select style={styles.input} value={draft.probation_months} onChange={(event) => updateDraft("probation_months", event.target.value)}>
                      <option value="0">No probation</option>
                      <option value="3">3 months</option>
                      <option value="4">4 months</option>
                      <option value="5">5 months</option>
                    </select>
                  </Field>
                  <Field label="Holiday entitlement">
                    <input style={styles.input} value={draft.holiday_entitlement} onChange={(event) => updateDraft("holiday_entitlement", event.target.value)} placeholder="For example, 28 days including bank holidays" />
                  </Field>
                  <Field label="Manager">
                    <input style={styles.input} value={draft.manager_name} onChange={(event) => updateDraft("manager_name", event.target.value)} />
                  </Field>
                </div>

                <Field label="Conditions">
                  <textarea style={styles.textarea} rows={4} value={draft.conditions} onChange={(event) => updateDraft("conditions", event.target.value)} placeholder="References, Right to Work, DBS, qualification checks or other conditions." />
                </Field>
                <Field label="Offer notes">
                  <textarea style={styles.textarea} rows={4} value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} />
                </Field>

                <div style={styles.actionRow}>
                  <button type="button" style={styles.secondaryButton} onClick={() => window.print()}>
                    <Printer size={16} /> Print
                  </button>
                  <button type="button" style={styles.secondaryButton} onClick={() => setSuccessMessage("Offer letter generation is ready for connection to Leo Draft.")}>
                    <FileText size={16} /> Generate offer letter
                  </button>
                  <button type="button" style={styles.secondaryButton} onClick={() => draft.candidate_email ? (window.location.href = `mailto:${draft.candidate_email}`) : setErrorMessage("No candidate email is recorded.")}>
                    <Mail size={16} /> Email candidate
                  </button>
                  <button type="button" style={styles.primaryButton} onClick={() => void saveOffer()} disabled={working === "save"}>
                    {working === "save" ? <Loader2 size={16} /> : <Save size={16} />}
                    Save offer
                  </button>
                </div>
              </section>

              <section style={styles.twoColumn}>
                <div style={styles.panel}>
                  <SectionHeading
                    title="Candidate response"
                    description="Record the candidate’s response without losing the original offer history."
                  />
                  <div style={styles.formGrid}>
                    <Field label="Response">
                      <select style={styles.input} value={draft.candidate_response} onChange={(event) => updateDraft("candidate_response", event.target.value)}>
                        <option>Awaiting response</option>
                        <option>Accepted</option>
                        <option>Declined</option>
                        <option>Negotiation</option>
                        <option>Withdrawn</option>
                      </select>
                    </Field>
                    <Field label="Response date">
                      <input style={styles.input} type="date" value={draft.responded_at} onChange={(event) => updateDraft("responded_at", event.target.value)} />
                    </Field>
                  </div>
                  <div style={styles.responseActions}>
                    <button type="button" style={styles.responseButton} onClick={() => void setStatus("accepted")}><Check size={15} /> Accept</button>
                    <button type="button" style={styles.responseButton} onClick={() => void setStatus("negotiation")}>Negotiation</button>
                    <button type="button" style={styles.responseButton} onClick={() => void setStatus("declined")}>Decline</button>
                    <button type="button" style={styles.responseButton} onClick={() => void setStatus("withdrawn")}>Withdraw</button>
                  </div>
                </div>

                <div style={styles.panel}>
                  <SectionHeading
                    title="Appointment readiness"
                    description="Leo keeps the appointment moving once the offer is accepted."
                  />
                  <div style={styles.progressHeader}>
                    <strong>{checklistCompleted} of {CHECKLIST_LABELS.length} complete</strong>
                    <span>{checklistPercent}%</span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${checklistPercent}%` }} />
                  </div>
                  <p style={styles.panelDescription}>
                    {draft.status === "accepted" || draft.status === "appointed"
                      ? checklistPercent === 100
                        ? "The appointment is ready to convert into an employee record."
                        : "Complete the remaining appointment and onboarding actions."
                      : "The checklist becomes active once the offer is accepted."}
                  </p>
                </div>
              </section>

              <section style={styles.panel}>
                <SectionHeading
                  title="Appointment & onboarding"
                  description="Complete pre-start preparation here. There is no separate onboarding register to maintain."
                />

                <div style={styles.checklistGrid}>
                  {CHECKLIST_LABELS.map(([key, label]) => {
                    const checked = draft.checklist[key];
                    return (
                      <button
                        type="button"
                        key={key}
                        style={checked ? styles.checkItemDone : styles.checkItem}
                        onClick={() =>
                          updateDraft("checklist", {
                            ...draft.checklist,
                            [key]: !checked,
                          })
                        }
                        disabled={!["accepted", "appointed", "converted"].includes(draft.status)}
                      >
                        {checked ? <CheckCircle2 size={19} /> : <Circle size={19} />}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>

                <Field label="Appointment notes">
                  <textarea style={styles.textarea} rows={4} value={draft.appointment_notes} onChange={(event) => updateDraft("appointment_notes", event.target.value)} placeholder="Record first-day arrangements, manager handover, equipment details or agreed exceptions." />
                </Field>

                <div style={styles.convertBox}>
                  <div>
                    <h3 style={styles.convertTitle}>Convert Candidate to Employee</h3>
                    <p style={styles.panelDescription}>
                      Creates the employee, preserves the recruitment history and prepares the probation,
                      compliance and Leo Learn handover through the database conversion function.
                    </p>
                  </div>
                  <button
                    type="button"
                    style={styles.convertButton}
                    onClick={() => void convertToEmployee()}
                    disabled={working === "convert" || !["accepted", "appointed"].includes(draft.status)}
                  >
                    {working === "convert" ? <Loader2 size={17} /> : <UserPlus size={17} />}
                    Convert Candidate to Employee
                    <ArrowRight size={17} />
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div style={styles.panelHeader}>
      <div>
        <h2 style={styles.panelTitle}>{title}</h2>
        <p style={styles.panelDescription}>{description}</p>
      </div>
    </div>
  );
}

function Journey({ status }: { status: OfferStatus }) {
  const stages = ["Application", "Interview", "Due Diligence", "Offer", "Appointment", "Employee"];
  const index =
    status === "converted" ? 5 :
    status === "appointed" ? 4 :
    status === "accepted" ? 4 :
    ["issued", "approved", "pending_approval", "draft", "negotiation"].includes(status) ? 3 : 3;

  return (
    <section style={styles.journey}>
      {stages.map((stage, stageIndex) => (
        <div style={styles.journeyStage} key={stage}>
          <span style={stageIndex < index ? styles.stageDone : stageIndex === index ? styles.stageCurrent : styles.stageFuture}>
            {stageIndex < index ? <Check size={14} /> : stageIndex + 1}
          </span>
          <strong>{stage}</strong>
          {stageIndex < stages.length - 1 ? <ArrowRight size={15} style={styles.journeyArrow} /> : null}
        </div>
      ))}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { width: "100%", color: "#1F2937" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", padding: 24, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, marginBottom: 16 },
  headerActions: { display: "flex", flexWrap: "wrap", gap: 10 },
  eyebrow: { margin: "0 0 7px", color: "#6E5084", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em" },
  title: { margin: 0, fontSize: 30, lineHeight: 1.15, color: "#111827" },
  description: { margin: "8px 0 0", color: "#6B7280", lineHeight: 1.6, maxWidth: 780 },
  metrics: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 },
  metric: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 15, padding: 17, display: "flex", flexDirection: "column", gap: 8 },
  workspaceGrid: { display: "grid", gridTemplateColumns: "minmax(270px, 340px) minmax(0, 1fr)", gap: 16, alignItems: "start" },
  sidebar: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 16, position: "sticky", top: 16, maxHeight: "calc(100vh - 32px)", overflow: "auto" },
  main: { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 },
  panel: { background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 22 },
  panelHeader: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 16 },
  panelTitle: { margin: 0, fontSize: 18, color: "#111827" },
  panelDescription: { margin: "5px 0 0", color: "#6B7280", fontSize: 14, lineHeight: 1.55 },
  createBox: { padding: 13, borderRadius: 13, background: "#F7F1FC", border: "1px solid #E8DAF2", marginBottom: 12 },
  label: { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#374151" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #D1D5DB", borderRadius: 10, padding: "10px 11px", background: "#FFFFFF", color: "#111827", font: "inherit" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #D1D5DB", borderRadius: 10, padding: "10px 11px", background: "#FFFFFF", color: "#111827", font: "inherit", resize: "vertical" },
  search: { display: "flex", alignItems: "center", gap: 8, border: "1px solid #D1D5DB", borderRadius: 10, padding: "0 10px", marginBottom: 10 },
  offerList: { display: "flex", flexDirection: "column", gap: 9, marginTop: 12 },
  offerCard: { border: "1px solid #E5E7EB", borderRadius: 12, background: "#FFFFFF", padding: 13, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, color: "#4B5563" },
  offerCardActive: { border: "1px solid #CDB2E2", borderRadius: 12, background: "#F7F1FC", padding: 13, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, color: "#4B5563" },
  offerCardTop: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", color: "#111827" },
  badge: { display: "inline-flex", borderRadius: 999, background: "#F3F4F6", padding: "4px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" },
  hero: { background: "linear-gradient(135deg, #F7F1FC 0%, #FFFFFF 100%)", border: "1px solid #E5D9EF", borderRadius: 18, padding: 22, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" },
  heroTitle: { margin: 0, fontSize: 25, color: "#111827" },
  heroStatus: { borderRadius: 999, background: "#FFFFFF", border: "1px solid #CDB2E2", padding: "7px 11px", color: "#6E5084", fontSize: 13, fontWeight: 800 },
  journey: { display: "grid", gridTemplateColumns: "repeat(6, minmax(90px, 1fr))", gap: 8, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 18, overflowX: "auto" },
  journeyStage: { display: "flex", alignItems: "center", gap: 7, position: "relative", minWidth: 110, fontSize: 13 },
  stageDone: { width: 27, height: 27, borderRadius: 999, display: "grid", placeItems: "center", background: "#F5FFF9", border: "1px solid #B7DEC7", color: "#276749", fontWeight: 800 },
  stageCurrent: { width: 27, height: 27, borderRadius: 999, display: "grid", placeItems: "center", background: "#6E5084", color: "#FFFFFF", fontWeight: 800 },
  stageFuture: { width: 27, height: 27, borderRadius: 999, display: "grid", placeItems: "center", background: "#F3F4F6", color: "#6B7280", fontWeight: 800 },
  journeyArrow: { marginLeft: "auto", color: "#9CA3AF" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 14 },
  field: { display: "block", marginBottom: 14 },
  actionRow: { display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 9, marginTop: 4 },
  primaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: 0, borderRadius: 10, padding: "10px 14px", background: "#6E5084", color: "#FFFFFF", fontWeight: 800, cursor: "pointer" },
  secondaryButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #D1D5DB", borderRadius: 10, padding: "10px 13px", background: "#FFFFFF", color: "#374151", fontWeight: 700, cursor: "pointer" },
  responseActions: { display: "flex", flexWrap: "wrap", gap: 8 },
  responseButton: { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #D1D5DB", borderRadius: 999, padding: "8px 11px", background: "#FFFFFF", cursor: "pointer", fontWeight: 700 },
  twoColumn: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 },
  progressHeader: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 9 },
  progressTrack: { height: 9, borderRadius: 999, overflow: "hidden", background: "#EEE7F3" },
  progressFill: { height: "100%", borderRadius: 999, background: "#6E5084" },
  checklistGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 16 },
  checkItem: { display: "flex", alignItems: "center", gap: 9, border: "1px solid #E5E7EB", borderRadius: 12, padding: 12, background: "#FFFFFF", color: "#4B5563", textAlign: "left", cursor: "pointer" },
  checkItemDone: { display: "flex", alignItems: "center", gap: 9, border: "1px solid #CDE5D6", borderRadius: 12, padding: 12, background: "#F5FFF9", color: "#276749", textAlign: "left", cursor: "pointer" },
  convertBox: { marginTop: 16, borderRadius: 15, padding: 17, background: "#F7F1FC", border: "1px solid #DCC9E9", display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" },
  convertTitle: { margin: 0, color: "#3F2F4E" },
  convertButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: 0, borderRadius: 11, padding: "12px 15px", background: "#6E5084", color: "#FFFFFF", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 7, padding: "24px 12px", color: "#6B7280" },
  largeEmpty: { minHeight: 420, display: "grid", placeItems: "center", alignContent: "center", textAlign: "center", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18, padding: 30, color: "#6B7280" },
  statePanel: { minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 18 },
  error: { marginBottom: 14, padding: 12, borderRadius: 11, background: "#FFF7F7", border: "1px solid #F2CACA", color: "#8A2E2E" },
  success: { marginBottom: 14, padding: 12, borderRadius: 11, background: "#F5FFF9", border: "1px solid #CDE5D6", color: "#276749" },
};
