"use client";

import {
  ArrowRight,
  Check,
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

type Row = Record<string, unknown>;

type OfferStatus =
  | "draft"
  | "approval_required"
  | "approved"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired"
  | "superseded";

type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "returned"
  | "declined";

type AppointmentStatus =
  | "pre_employment"
  | "checks_in_progress"
  | "ready_to_start"
  | "employee_creation_pending"
  | "employee_created"
  | "started"
  | "withdrawn"
  | "cancelled";

type OfferRecord = {
  id: string;
  organisation_id: string | null;
  offer_reference: string;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  offer_type: string;
  status: OfferStatus;
  job_title: string;
  department: string;
  location_name: string;
  manager_name: string;
  employment_type: string;
  proposed_start_date: string;
  hours_per_week: string;
  work_pattern: string;
  salary_amount: string;
  salary_period: string;
  salary_currency: string;
  probation_months: string;
  holiday_allowance_days: string;
  notice_period: string;
  conditions_text: string;
  approval_status: ApprovalStatus;
  approval_notes: string;
  sent_at: string;
  response_deadline: string;
  accepted_at: string;
  declined_at: string;
  decline_reason: string;
  withdrawn_at: string;
  withdrawal_reason: string;
  candidate_response_notes: string;
  created_at: string;
  updated_at: string;
};

type AppointmentRecord = {
  id: string;
  organisation_id: string | null;
  appointment_reference: string;
  offer_id: string;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  status: AppointmentStatus;
  agreed_start_date: string;
  actual_start_date: string;
  manager_name: string;
  department: string;
  location_name: string;
  employee_id: string | null;
  recruitment_summary_transferred: boolean;
  documents_transferred: boolean;
  onboarding_transferred: boolean;
  learning_pathway_triggered: boolean;
  handover_completed_at: string;
  handover_notes: string;
};

type CandidateOption = {
  id: string;
  applicationId: string;
  vacancyId: string;
  name: string;
  email: string;
  vacancyTitle: string;
  vacancyReference: string;
  organisationId: string | null;
  department: string;
  locationName: string;
  employmentType: string;
  managerName: string;
};

const OFFER_STATUSES: Array<{ value: OfferStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "approval_required", label: "Approval required" },
  { value: "approved", label: "Approved" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "expired", label: "Expired" },
  { value: "superseded", label: "Superseded" },
];

const APPOINTMENT_STATUSES: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "pre_employment", label: "Pre-employment" },
  { value: "checks_in_progress", label: "Checks in progress" },
  { value: "ready_to_start", label: "Ready to start" },
  { value: "employee_creation_pending", label: "Employee creation pending" },
  { value: "employee_created", label: "Employee created" },
  { value: "started", label: "Started" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "cancelled", label: "Cancelled" },
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

function conditionsToText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return text(value);
}

function conditionsFromText(value: string): unknown[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapOffer(
  row: Row,
  candidate: Row | undefined,
): OfferRecord {
  return {
    id: String(row.id),
    organisation_id: idValue(row.organisation_id),
    offer_reference: text(row.offer_reference),
    application_id: String(row.application_id),
    vacancy_id: String(row.vacancy_id),
    candidate_id: String(row.candidate_id),
    candidate_name: candidate ? candidateName(candidate) : "Candidate",
    candidate_email: candidate ? text(candidate.email) : "",
    offer_type: text(row.offer_type) || "conditional",
    status: (text(row.status) || "draft") as OfferStatus,
    job_title: text(row.job_title) || "Vacancy",
    department: text(row.department),
    location_name: text(row.location_name),
    manager_name: text(row.manager_name),
    employment_type: text(row.employment_type) || "permanent",
    proposed_start_date: dateValue(row.proposed_start_date),
    hours_per_week:
      row.hours_per_week === null || row.hours_per_week === undefined
        ? ""
        : String(row.hours_per_week),
    work_pattern: text(row.work_pattern),
    salary_amount:
      row.salary_amount === null || row.salary_amount === undefined
        ? ""
        : String(row.salary_amount),
    salary_period: text(row.salary_period) || "year",
    salary_currency: text(row.salary_currency) || "GBP",
    probation_months:
      row.probation_months === null || row.probation_months === undefined
        ? "3"
        : String(row.probation_months),
    holiday_allowance_days:
      row.holiday_allowance_days === null || row.holiday_allowance_days === undefined
        ? ""
        : String(row.holiday_allowance_days),
    notice_period: text(row.notice_period),
    conditions_text: conditionsToText(row.conditions),
    approval_status: (text(row.approval_status) || "not_required") as ApprovalStatus,
    approval_notes: text(row.approval_notes),
    sent_at: dateValue(row.sent_at),
    response_deadline: dateValue(row.response_deadline),
    accepted_at: dateValue(row.accepted_at),
    declined_at: dateValue(row.declined_at),
    decline_reason: text(row.decline_reason),
    withdrawn_at: dateValue(row.withdrawn_at),
    withdrawal_reason: text(row.withdrawal_reason),
    candidate_response_notes: text(row.candidate_response_notes),
    created_at: text(row.created_at),
    updated_at: text(row.updated_at),
  };
}

function mapAppointment(row: Row): AppointmentRecord {
  return {
    id: String(row.id),
    organisation_id: idValue(row.organisation_id),
    appointment_reference: text(row.appointment_reference),
    offer_id: String(row.offer_id),
    application_id: String(row.application_id),
    vacancy_id: String(row.vacancy_id),
    candidate_id: String(row.candidate_id),
    status: (text(row.status) || "pre_employment") as AppointmentStatus,
    agreed_start_date: dateValue(row.agreed_start_date),
    actual_start_date: dateValue(row.actual_start_date),
    manager_name: text(row.manager_name),
    department: text(row.department),
    location_name: text(row.location_name),
    employee_id: idValue(row.employee_id),
    recruitment_summary_transferred: row.recruitment_summary_transferred === true,
    documents_transferred: row.documents_transferred === true,
    onboarding_transferred: row.onboarding_transferred === true,
    learning_pathway_triggered: row.learning_pathway_triggered === true,
    handover_completed_at: dateValue(row.handover_completed_at),
    handover_notes: text(row.handover_notes),
  };
}

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function OffersWorkspace() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<OfferRecord | null>(null);
  const [appointmentDraft, setAppointmentDraft] = useState<AppointmentRecord | null>(null);
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
    setSuccessMessage("");

    try {
      const response = await fetch("/api/talent/offers", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "Offers and appointments could not be loaded.");
      }

      const candidateRows = (payload.candidates ?? []) as Row[];
      const applicationRows = (payload.applications ?? []) as Row[];
      const vacancyRows = (payload.vacancies ?? []) as Row[];
      const candidateById = new Map(candidateRows.map((row) => [String(row.id), row]));
      const vacancyById = new Map(vacancyRows.map((row) => [String(row.id), row]));
      const mappedOffers = ((payload.offers ?? []) as Row[]).map((row) =>
        mapOffer(row, candidateById.get(String(row.candidate_id))),
      );

      setOffers(mappedOffers);
      setAppointments(((payload.appointments ?? []) as Row[]).map(mapAppointment));
      setSelectedId((current) =>
        mappedOffers.some((offer) => offer.id === current) ? current : "",
      );

      const existingApplicationIds = new Set(mappedOffers.map((offer) => offer.application_id));
      const candidateOptions = applicationRows
        .filter((application) => !existingApplicationIds.has(String(application.id)))
        .map((application) => {
          const candidateId = String(application.candidate_id ?? "");
          const vacancyId = String(application.vacancy_id ?? "");
          const candidate = candidateById.get(candidateId);
          const vacancy = vacancyById.get(vacancyId);

          return {
            id: candidateId,
            applicationId: String(application.id),
            vacancyId,
            name: candidate ? candidateName(candidate) : "Candidate",
            email: candidate ? text(candidate.email) : "",
            vacancyTitle:
              text(vacancy?.job_title) || text(vacancy?.title) ||
              text(vacancy?.vacancy_title) || "Vacancy",
            vacancyReference:
              text(vacancy?.vacancy_reference) || text(vacancy?.reference),
            organisationId:
              idValue(application.organisation_id) ||
              idValue(candidate?.organisation_id) ||
              idValue(vacancy?.organisation_id),
            department: text(vacancy?.department),
            locationName: text(vacancy?.location_name) || text(vacancy?.location),
            employmentType:
              text(vacancy?.employment_type) || text(vacancy?.contract_type) || "permanent",
            managerName:
              text(vacancy?.manager_name) || text(vacancy?.hiring_manager_name),
          };
        })
        .filter((option) => option.id && option.applicationId && option.vacancyId && option.organisationId);

      setCandidates(candidateOptions);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Offers and appointments could not be loaded.",
      );
      setOffers([]);
      setAppointments([]);
      setCandidates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const selected = offers.find((offer) => offer.id === selectedId) ?? null;
    setDraft(selected ? { ...selected } : null);

    const appointment = appointments.find((item) => item.offer_id === selectedId) ?? null;
    setAppointmentDraft(appointment ? { ...appointment } : null);
  }, [appointments, offers, selectedId]);

  const filteredOffers = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesQuery =
        !normalisedQuery ||
        [
          offer.candidate_name,
          offer.candidate_email,
          offer.job_title,
          offer.offer_reference,
          offer.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalisedQuery);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          !["declined", "withdrawn", "expired", "superseded"].includes(offer.status)) ||
        offer.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [offers, query, statusFilter]);

  const metrics = useMemo(
    () => ({
      active: offers.filter(
        (offer) => !["declined", "withdrawn", "expired", "superseded"].includes(offer.status),
      ).length,
      approval: offers.filter((offer) => offer.status === "approval_required").length,
      response: offers.filter((offer) => ["sent", "viewed"].includes(offer.status)).length,
      accepted: offers.filter((offer) => offer.status === "accepted").length,
      ready: appointments.filter((appointment) => appointment.status === "ready_to_start").length,
    }),
    [appointments, offers],
  );

  const updateDraft = <K extends keyof OfferRecord>(key: K, value: OfferRecord[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateAppointmentDraft = <K extends keyof AppointmentRecord>(
    key: K,
    value: AppointmentRecord[K],
  ) => {
    setAppointmentDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const createOffer = async (applicationId: string) => {
    if (!applicationId) return;
    setWorking("create");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/talent/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "The offer could not be created.");
      }
      setSuccessMessage("Offer created. Complete the terms before sending it.");
      await loadData(true);
      setSelectedId(String(payload.offer.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The offer could not be created.");
    } finally {
      setWorking("");
    }
  };

  const saveOffer = async () => {
    if (!draft) return;
    if (!draft.job_title.trim() || !draft.employment_type.trim()) {
      setErrorMessage("Job title and employment type are required.");
      return;
    }

    setWorking("save");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/talent/offers/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_offer",
          offer: { ...draft, conditions: conditionsFromText(draft.conditions_text) },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "The offer could not be saved.");
      }
      setSuccessMessage("Offer saved.");
      await loadData(true);
      setSelectedId(draft.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The offer could not be saved.");
    } finally {
      setWorking("");
    }
  };

  const setOfferStatus = (status: OfferStatus) => {
    if (!draft) return;

    const today = new Date().toISOString().slice(0, 10);

    setDraft({
      ...draft,
      status,
      approval_status:
        status === "approval_required"
          ? "pending"
          : status === "approved"
            ? "approved"
            : draft.approval_status,
      sent_at: status === "sent" && !draft.sent_at ? today : draft.sent_at,
      accepted_at: status === "accepted" ? today : draft.accepted_at,
      declined_at: status === "declined" ? today : draft.declined_at,
      withdrawn_at: status === "withdrawn" ? today : draft.withdrawn_at,
    });
  };

  const acceptOfferAndStartOnboarding = async () => {
    if (!draft) return;
    setWorking("accept");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/talent/offers/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          acceptedAt: draft.accepted_at || new Date().toISOString().slice(0, 10),
          proposedStartDate: draft.proposed_start_date,
          candidateResponseNotes: draft.candidate_response_notes,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "The offer acceptance could not be recorded.");
      }
      setSuccessMessage("Offer accepted. The candidate will now appear in Onboarding.");
      await loadData(true);
      setSelectedId(draft.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The offer acceptance could not be recorded.");
    } finally {
      setWorking("");
    }
  };

  const saveAppointment = async () => {
    if (!draft || !appointmentDraft) return;
    setWorking("appointment");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/talent/offers/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_appointment", appointment: appointmentDraft }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "The appointment could not be saved.");
      }
      setSuccessMessage("Appointment record saved.");
      await loadData(true);
      setSelectedId(draft.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The appointment could not be saved.");
    } finally {
      setWorking("");
    }
  };

  const convertToEmployee = async () => {
    if (!draft || !appointmentDraft) return;
    if (!["ready_to_start", "employee_creation_pending"].includes(appointmentDraft.status)) {
      setErrorMessage("Set the appointment to Ready to start before creating the employee record.");
      return;
    }

    setWorking("convert");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/talent/offers/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "Employee conversion failed.");
      }
      setSuccessMessage("Candidate converted to an employee.");
      await loadData(true);
      if (payload.employeeId) router.push(`/dashboard/employees/${payload.employeeId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Employee conversion failed.");
    } finally {
      setWorking("");
    }
  };

  const exportCsv = () => {
    const headings = [
      "Offer reference",
      "Candidate",
      "Vacancy",
      "Status",
      "Approval",
      "Salary",
      "Hours",
      "Proposed start date",
    ];

    const rows = filteredOffers.map((offer) => [
      offer.offer_reference,
      offer.candidate_name,
      offer.job_title,
      humanise(offer.status),
      humanise(offer.approval_status),
      offer.salary_amount,
      offer.hours_per_week,
      offer.proposed_start_date,
    ]);

    const csv = [headings, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>LEO TALENT</p>
          <h1 style={styles.title}>Offers & Appointments</h1>
          <p style={styles.description}>
            Prepare offers, record candidate decisions and complete the handover
            from successful applicant to employee.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => void loadData(true)}
            disabled={refreshing}
          >
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
        <Metric label="Ready to start" value={metrics.ready} />
      </section>

      <section style={styles.registerPanel}>
        <div style={styles.registerHeading}>
          <div>
            <h2 style={styles.panelTitle}>Offer register</h2>
            <p style={styles.panelDescription}>
              Review every offer in one list. Open a record only when you need to
              view or update its full offer and appointment details.
            </p>
          </div>
          <span style={styles.resultCount}>
            {filteredOffers.length} {filteredOffers.length === 1 ? "offer" : "offers"}
          </span>
        </div>

        <div style={styles.registerTools}>
          <div style={styles.createBoxWide}>
            <label style={styles.label}>Create offer for</label>
            <select
              style={styles.input}
              value=""
              onChange={(event) => void createOffer(event.target.value)}
              disabled={working === "create"}
            >
              <option value="">Select applicant</option>
              {candidates.map((candidate) => (
                <option key={candidate.applicationId} value={candidate.applicationId}>
                  {candidate.name} · {candidate.vacancyTitle}
                </option>
              ))}
            </select>
          </div>

          <label style={styles.searchWide}>
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search candidate, vacancy or offer reference"
            />
          </label>

          <select
            style={styles.statusSelect}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="active">Active offers</option>
            <option value="all">All statuses</option>
            {OFFER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {filteredOffers.length === 0 ? (
          <div style={styles.empty}>
            <UserCheck size={24} />
            <strong>No offers match this view</strong>
            <span>Select an applicant above to create an offer.</span>
          </div>
        ) : (
          <div style={styles.registerList}>
            {filteredOffers.map((offer) => {
              const expanded = offer.id === selectedId;
              const appointment = appointments.find((item) => item.offer_id === offer.id);

              return (
                <article key={offer.id} style={expanded ? styles.registerCardExpanded : styles.registerCard}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(expanded ? "" : offer.id)}
                    style={styles.registerRowButton}
                    aria-expanded={expanded}
                  >
                    <div style={styles.registerPrimary}>
                      <strong style={styles.registerCandidate}>{offer.candidate_name}</strong>
                      <span style={styles.registerVacancy}>{offer.job_title}</span>
                      <small style={styles.registerReference}>{offer.offer_reference}</small>
                    </div>

                    <div style={styles.registerMeta}>
                      <span style={styles.registerMetaLabel}>Start date</span>
                      <strong>{offer.proposed_start_date || "Not set"}</strong>
                    </div>

                    <div style={styles.registerMeta}>
                      <span style={styles.registerMetaLabel}>Appointment</span>
                      <strong>{appointment ? humanise(appointment.status) : "Not created"}</strong>
                    </div>

                    <div style={styles.registerStatusArea}>
                      <span style={styles.badge}>{humanise(offer.status)}</span>
                      <span style={styles.expandLabel}>{expanded ? "Close" : "Open"}</span>
                    </div>
                  </button>

                  {expanded ? (
                    <div style={styles.offerDetail}>
              <main style={styles.main}>
              {!draft ? (
              <div style={styles.largeEmpty}>
              <Sparkles size={28} />
              <h2>Select or create an offer</h2>
              <p>The offer and appointment record will appear here.</p>
              </div>
              ) : (
              <>
              <section style={styles.hero}>
              <div>
              <p style={styles.eyebrow}>CANDIDATE JOURNEY</p>
              <h2 style={styles.heroTitle}>{draft.candidate_name}</h2>
              <p style={styles.description}>
              {draft.job_title} · {draft.offer_reference}
              </p>
              </div>
              <span style={styles.heroStatus}>{humanise(draft.status)}</span>
              </section>

              <Journey
              offerStatus={draft.status}
              appointmentStatus={appointmentDraft?.status ?? null}
              />

              <section style={styles.panel}>
              <SectionHeading
              title="Offer"
              description="Record the proposed employment terms and candidate decision."
              />

              <div style={styles.formGrid}>
              <Field label="Offer status">
              <select
              style={styles.input}
              value={draft.status}
              onChange={(event) =>
              setOfferStatus(event.target.value as OfferStatus)
              }
              >
              {OFFER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
              {status.label}
              </option>
              ))}
              </select>
              </Field>

              <Field label="Offer type">
              <select
              style={styles.input}
              value={draft.offer_type}
              onChange={(event) =>
              updateDraft("offer_type", event.target.value)
              }
              >
              <option value="conditional">Conditional</option>
              <option value="unconditional">Unconditional</option>
              <option value="verbal">Verbal</option>
              <option value="revised">Revised</option>
              </select>
              </Field>

              <Field label="Approval status">
              <select
              style={styles.input}
              value={draft.approval_status}
              onChange={(event) =>
              updateDraft(
              "approval_status",
              event.target.value as ApprovalStatus,
              )
              }
              >
              <option value="not_required">Not required</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="returned">Returned</option>
              <option value="declined">Declined</option>
              </select>
              </Field>

              <Field label="Job title">
              <input
              style={styles.input}
              value={draft.job_title}
              onChange={(event) =>
              updateDraft("job_title", event.target.value)
              }
              />
              </Field>

              <Field label="Employment type">
              <input
              style={styles.input}
              value={draft.employment_type}
              onChange={(event) =>
              updateDraft("employment_type", event.target.value)
              }
              />
              </Field>

              <Field label="Proposed start date">
              <input
              style={styles.input}
              type="date"
              value={draft.proposed_start_date}
              onChange={(event) =>
              updateDraft("proposed_start_date", event.target.value)
              }
              />
              </Field>

              <Field label="Salary">
              <input
              style={styles.input}
              type="number"
              min="0"
              step="0.01"
              value={draft.salary_amount}
              onChange={(event) =>
              updateDraft("salary_amount", event.target.value)
              }
              />
              </Field>

              <Field label="Salary period">
              <select
              style={styles.input}
              value={draft.salary_period}
              onChange={(event) =>
              updateDraft("salary_period", event.target.value)
              }
              >
              <option value="hour">Per hour</option>
              <option value="day">Per day</option>
              <option value="week">Per week</option>
              <option value="month">Per month</option>
              <option value="year">Per year</option>
              <option value="fixed">Fixed amount</option>
              </select>
              </Field>

              <Field label="Hours per week">
              <input
              style={styles.input}
              type="number"
              min="0"
              step="0.25"
              value={draft.hours_per_week}
              onChange={(event) =>
              updateDraft("hours_per_week", event.target.value)
              }
              />
              </Field>

              <Field label="Probation months">
              <select
              style={styles.input}
              value={draft.probation_months}
              onChange={(event) =>
              updateDraft("probation_months", event.target.value)
              }
              >
              {[0, 1, 2, 3, 4, 5, 6].map((months) => (
              <option key={months} value={String(months)}>
              {months === 0 ? "No probation" : `${months} months`}
              </option>
              ))}
              </select>
              </Field>

              <Field label="Holiday allowance (days)">
              <input
              style={styles.input}
              type="number"
              min="0"
              step="0.5"
              value={draft.holiday_allowance_days}
              onChange={(event) =>
              updateDraft("holiday_allowance_days", event.target.value)
              }
              />
              </Field>

              <Field label="Notice period">
              <input
              style={styles.input}
              value={draft.notice_period}
              onChange={(event) =>
              updateDraft("notice_period", event.target.value)
              }
              />
              </Field>

              <Field label="Manager">
              <input
              style={styles.input}
              value={draft.manager_name}
              onChange={(event) =>
              updateDraft("manager_name", event.target.value)
              }
              />
              </Field>

              <Field label="Department">
              <input
              style={styles.input}
              value={draft.department}
              onChange={(event) =>
              updateDraft("department", event.target.value)
              }
              />
              </Field>

              <Field label="Location">
              <input
              style={styles.input}
              value={draft.location_name}
              onChange={(event) =>
              updateDraft("location_name", event.target.value)
              }
              />
              </Field>

              <Field label="Response deadline">
              <input
              style={styles.input}
              type="date"
              value={draft.response_deadline}
              onChange={(event) =>
              updateDraft("response_deadline", event.target.value)
              }
              />
              </Field>
              </div>

              <Field label="Conditions">
              <textarea
              style={styles.textarea}
              rows={4}
              value={draft.conditions_text}
              onChange={(event) =>
              updateDraft("conditions_text", event.target.value)
              }
              placeholder="Enter one condition per line."
              />
              </Field>

              <Field label="Approval notes">
              <textarea
              style={styles.textarea}
              rows={3}
              value={draft.approval_notes}
              onChange={(event) =>
              updateDraft("approval_notes", event.target.value)
              }
              />
              </Field>

              <Field label="Candidate response notes">
              <textarea
              style={styles.textarea}
              rows={3}
              value={draft.candidate_response_notes}
              onChange={(event) =>
              updateDraft("candidate_response_notes", event.target.value)
              }
              />
              </Field>

              {draft.status === "declined" ? (
              <Field label="Decline reason">
              <textarea
              style={styles.textarea}
              rows={3}
              value={draft.decline_reason}
              onChange={(event) =>
              updateDraft("decline_reason", event.target.value)
              }
              />
              </Field>
              ) : null}

              {draft.status === "withdrawn" ? (
              <Field label="Withdrawal reason">
              <textarea
              style={styles.textarea}
              rows={3}
              value={draft.withdrawal_reason}
              onChange={(event) =>
              updateDraft("withdrawal_reason", event.target.value)
              }
              />
              </Field>
              ) : null}

              <div style={styles.actionRow}>
              <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => window.print()}
              >
              <Printer size={16} />
              Print
              </button>
              <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
              setSuccessMessage(
              "Offer letter generation is ready for connection to Leo Draft.",
              )
              }
              >
              <FileText size={16} />
              Generate offer letter
              </button>
              <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
              draft.candidate_email
              ? (window.location.href = `mailto:${draft.candidate_email}`)
              : setErrorMessage("No candidate email is recorded.")
              }
              >
              <Mail size={16} />
              Email candidate
              </button>
              {draft.status !== "accepted" ? (
              <button
              type="button"
              style={styles.primaryButton}
              onClick={() => void acceptOfferAndStartOnboarding()}
              disabled={working === "accept"}
              >
              {working === "accept" ? (
              <Loader2 size={16} className="animate-spin" />
              ) : (
              <UserCheck size={16} />
              )}
              Accept offer & start onboarding
              </button>
              ) : null}
              <button
              type="button"
              style={styles.primaryButton}
              onClick={() => void saveOffer()}
              disabled={working === "save"}
              >
              {working === "save" ? (
              <Loader2 size={16} className="animate-spin" />
              ) : (
              <Save size={16} />
              )}
              Save offer
              </button>
              </div>
              </section>

              {appointmentDraft ? (
              <section style={styles.panel}>
              <SectionHeading
              title="Appointment"
              description="Manage the accepted candidate's pre-employment and employee handover."
              />

              <div style={styles.formGrid}>
              <Field label="Appointment reference">
              <input
              style={styles.input}
              value={appointmentDraft.appointment_reference}
              disabled
              />
              </Field>

              <Field label="Appointment status">
              <select
              style={styles.input}
              value={appointmentDraft.status}
              onChange={(event) =>
              updateAppointmentDraft(
              "status",
              event.target.value as AppointmentStatus,
              )
              }
              >
              {APPOINTMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
              {status.label}
              </option>
              ))}
              </select>
              </Field>

              <Field label="Agreed start date">
              <input
              style={styles.input}
              type="date"
              value={appointmentDraft.agreed_start_date}
              onChange={(event) =>
              updateAppointmentDraft(
              "agreed_start_date",
              event.target.value,
              )
              }
              />
              </Field>

              <Field label="Actual start date">
              <input
              style={styles.input}
              type="date"
              value={appointmentDraft.actual_start_date}
              onChange={(event) =>
              updateAppointmentDraft(
              "actual_start_date",
              event.target.value,
              )
              }
              />
              </Field>
              </div>

              <div style={styles.transferGrid}>
              <TransferToggle
              label="Recruitment summary transferred"
              checked={appointmentDraft.recruitment_summary_transferred}
              onChange={(checked) =>
              updateAppointmentDraft(
              "recruitment_summary_transferred",
              checked,
              )
              }
              />
              <TransferToggle
              label="Documents transferred"
              checked={appointmentDraft.documents_transferred}
              onChange={(checked) =>
              updateAppointmentDraft("documents_transferred", checked)
              }
              />
              <TransferToggle
              label="Onboarding transferred"
              checked={appointmentDraft.onboarding_transferred}
              onChange={(checked) =>
              updateAppointmentDraft("onboarding_transferred", checked)
              }
              />
              <TransferToggle
              label="Leo Learn pathway triggered"
              checked={appointmentDraft.learning_pathway_triggered}
              onChange={(checked) =>
              updateAppointmentDraft(
              "learning_pathway_triggered",
              checked,
              )
              }
              />
              </div>

              <Field label="Handover notes">
              <textarea
              style={styles.textarea}
              rows={4}
              value={appointmentDraft.handover_notes}
              onChange={(event) =>
              updateAppointmentDraft("handover_notes", event.target.value)
              }
              />
              </Field>

              <div style={styles.convertBox}>
              <div>
              <h3 style={styles.convertTitle}>
              Convert Candidate to Employee
              </h3>
              <p style={styles.panelDescription}>
              Creates the employee record and preserves the recruitment
              and appointment history.
              </p>
              </div>

              <div style={styles.actionRow}>
              <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => void saveAppointment()}
              disabled={working === "appointment"}
              >
              <Save size={16} />
              Save appointment
              </button>

              <button
              type="button"
              style={styles.convertButton}
              onClick={() => void convertToEmployee()}
              disabled={
              working === "convert" ||
              !["ready_to_start", "employee_creation_pending"].includes(
              appointmentDraft.status,
              )
              }
              >
              {working === "convert" ? (
              <Loader2 size={17} className="animate-spin" />
              ) : (
              <UserPlus size={17} />
              )}
              Convert Candidate to Employee
              <ArrowRight size={17} />
              </button>
              </div>
              </div>
              </section>
              ) : draft.status === "accepted" ? (
              <section style={styles.notice}>
              Save the accepted offer to create its appointment record.
              </section>
              ) : null}
              </>
              )}
              </main>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={styles.panelHeader}>
      <div>
        <h2 style={styles.panelTitle}>{title}</h2>
        <p style={styles.panelDescription}>{description}</p>
      </div>
    </div>
  );
}

function TransferToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={checked ? styles.transferDone : styles.transferItem}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Journey({
  offerStatus,
  appointmentStatus,
}: {
  offerStatus: OfferStatus;
  appointmentStatus: AppointmentStatus | null;
}) {
  const stages = ["Application", "Interview", "Due Diligence", "Offer", "Appointment", "Employee"];

  let index = 3;

  if (offerStatus === "accepted") index = 4;
  if (
    appointmentStatus &&
    ["employee_created", "started"].includes(appointmentStatus)
  ) {
    index = 5;
  }

  return (
    <section style={styles.journey}>
      {stages.map((stage, stageIndex) => (
        <div style={styles.journeyStage} key={stage}>
          <span
            style={
              stageIndex < index
                ? styles.stageDone
                : stageIndex === index
                  ? styles.stageCurrent
                  : styles.stageFuture
            }
          >
            {stageIndex < index ? <Check size={14} /> : stageIndex + 1}
          </span>
          <strong>{stage}</strong>
          {stageIndex < stages.length - 1 ? (
            <ArrowRight size={15} style={styles.journeyArrow} />
          ) : null}
        </div>
      ))}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { width: "100%", color: "#1F2937" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
    padding: 24,
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    marginBottom: 16,
  },
  headerActions: { display: "flex", flexWrap: "wrap", gap: 10 },
  eyebrow: {
    margin: "0 0 7px",
    color: "#6E5084",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  title: { margin: 0, fontSize: 30, lineHeight: 1.15, color: "#111827" },
  description: {
    margin: "8px 0 0",
    color: "#6B7280",
    lineHeight: 1.6,
    maxWidth: 780,
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  metric: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 15,
    padding: 17,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  registerPanel: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: 20,
  },
  registerHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  resultCount: {
    borderRadius: 999,
    background: "#F7F1FC",
    border: "1px solid #E8DAF2",
    color: "#6E5084",
    padding: "7px 11px",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  registerTools: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 1fr) minmax(280px, 1.5fr) minmax(180px, 0.65fr)",
    gap: 12,
    alignItems: "end",
    padding: 14,
    marginBottom: 14,
    borderRadius: 14,
    background: "#FAFAFB",
    border: "1px solid #ECEEF1",
  },
  createBoxWide: { minWidth: 0 },
  searchWide: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 42,
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    padding: "0 11px",
    background: "#FFFFFF",
  },
  statusSelect: {
    width: "100%",
    minHeight: 42,
    boxSizing: "border-box",
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    padding: "10px 11px",
    background: "#FFFFFF",
    color: "#111827",
    font: "inherit",
  },
  registerList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  registerCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    background: "#FFFFFF",
    overflow: "hidden",
  },
  registerCardExpanded: {
    border: "1px solid #CDB2E2",
    borderRadius: 14,
    background: "#FFFFFF",
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(82, 60, 99, 0.08)",
  },
  registerRowButton: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "minmax(240px, 1.7fr) minmax(120px, 0.7fr) minmax(150px, 0.9fr) auto",
    gap: 16,
    alignItems: "center",
    border: 0,
    background: "transparent",
    padding: 16,
    textAlign: "left",
    cursor: "pointer",
    color: "#1F2937",
  },
  registerPrimary: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0,
  },
  registerCandidate: { color: "#111827", fontSize: 15 },
  registerVacancy: { color: "#4B5563", fontSize: 14 },
  registerReference: { color: "#9CA3AF", fontSize: 12 },
  registerMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
  },
  registerMetaLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  registerStatusArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  expandLabel: {
    color: "#6E5084",
    fontSize: 13,
    fontWeight: 800,
  },
  offerDetail: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "0 16px 16px",
    borderTop: "1px solid #EEE7F3",
    background: "#FCFAFD",
  },
  workspaceGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(270px, 340px) minmax(0, 1fr)",
    gap: 16,
    alignItems: "start",
  },
  sidebar: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: 16,
    position: "sticky",
    top: 16,
    maxHeight: "calc(100vh - 32px)",
    overflow: "auto",
  },
  main: { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 },
  panel: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: 22,
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  panelTitle: { margin: 0, fontSize: 18, color: "#111827" },
  panelDescription: {
    margin: "5px 0 0",
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 1.55,
  },
  createBox: {
    padding: 13,
    borderRadius: 13,
    background: "#F7F1FC",
    border: "1px solid #E8DAF2",
    marginBottom: 12,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    padding: "10px 11px",
    background: "#FFFFFF",
    color: "#111827",
    font: "inherit",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    padding: "10px 11px",
    background: "#FFFFFF",
    color: "#111827",
    font: "inherit",
    resize: "vertical",
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    padding: "0 10px",
    marginBottom: 10,
  },
  offerList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    marginTop: 12,
  },
  offerCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    background: "#FFFFFF",
    padding: 13,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    color: "#4B5563",
  },
  offerCardActive: {
    border: "1px solid #CDB2E2",
    borderRadius: 12,
    background: "#F7F1FC",
    padding: 13,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 5,
    color: "#4B5563",
  },
  offerCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    color: "#111827",
  },
  badge: {
    display: "inline-flex",
    borderRadius: 999,
    background: "#F3F4F6",
    padding: "4px 8px",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  hero: {
    background: "linear-gradient(135deg, #F7F1FC 0%, #FFFFFF 100%)",
    border: "1px solid #E5D9EF",
    borderRadius: 18,
    padding: 22,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  heroTitle: { margin: 0, fontSize: 25, color: "#111827" },
  heroStatus: {
    borderRadius: 999,
    background: "#FFFFFF",
    border: "1px solid #CDB2E2",
    padding: "7px 11px",
    color: "#6E5084",
    fontSize: 13,
    fontWeight: 800,
  },
  journey: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(90px, 1fr))",
    gap: 8,
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: 18,
    overflowX: "auto",
  },
  journeyStage: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    position: "relative",
    minWidth: 110,
    fontSize: 13,
  },
  stageDone: {
    width: 27,
    height: 27,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "#F5FFF9",
    border: "1px solid #B7DEC7",
    color: "#276749",
    fontWeight: 800,
  },
  stageCurrent: {
    width: 27,
    height: 27,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "#6E5084",
    color: "#FFFFFF",
    fontWeight: 800,
  },
  stageFuture: {
    width: 27,
    height: 27,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "#F3F4F6",
    color: "#6B7280",
    fontWeight: 800,
  },
  journeyArrow: { marginLeft: "auto", color: "#9CA3AF" },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 14,
    marginBottom: 14,
  },
  field: { display: "block", marginBottom: 14 },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 4,
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: 0,
    borderRadius: 10,
    padding: "10px 14px",
    background: "#6E5084",
    color: "#FFFFFF",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    padding: "10px 13px",
    background: "#FFFFFF",
    color: "#374151",
    fontWeight: 700,
    cursor: "pointer",
  },
  transferGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
    marginBottom: 16,
  },
  transferItem: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: 12,
    background: "#FFFFFF",
    color: "#4B5563",
  },
  transferDone: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    border: "1px solid #CDE5D6",
    borderRadius: 12,
    padding: 12,
    background: "#F5FFF9",
    color: "#276749",
  },
  convertBox: {
    marginTop: 16,
    borderRadius: 15,
    padding: 17,
    background: "#F7F1FC",
    border: "1px solid #DCC9E9",
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
  },
  convertTitle: { margin: 0, color: "#3F2F4E" },
  convertButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: 0,
    borderRadius: 11,
    padding: "12px 15px",
    background: "#6E5084",
    color: "#FFFFFF",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 7,
    padding: "24px 12px",
    color: "#6B7280",
  },
  largeEmpty: {
    minHeight: 420,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    textAlign: "center",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
    padding: 30,
    color: "#6B7280",
  },
  statePanel: {
    minHeight: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 18,
  },
  notice: {
    padding: 16,
    borderRadius: 12,
    background: "#F7F1FC",
    border: "1px solid #DCC9E9",
    color: "#5A416C",
  },
  error: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 11,
    background: "#FFF7F7",
    border: "1px solid #F2CACA",
    color: "#8A2E2E",
  },
  success: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 11,
    background: "#F5FFF9",
    border: "1px solid #CDE5D6",
    color: "#276749",
  },
};