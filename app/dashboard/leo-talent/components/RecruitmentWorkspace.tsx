"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { supabase } from "@/lib/supabase";

type VacancyStatus =
  | "draft"
  | "approval_required"
  | "approved"
  | "open"
  | "paused"
  | "closed"
  | "filled"
  | "cancelled"
  | "archived";

type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "returned"
  | "declined";

type TalentVacancy = {
  id: string;
  organisation_id: string | null;
  vacancy_reference: string;
  title: string;
  department: string | null;
  location_name: string | null;
  hiring_manager_name: string | null;
  employment_type: string;
  work_pattern: string | null;
  hours_per_week: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
  salary_currency: string;
  salary_visible: boolean;
  number_of_positions: number;
  status: VacancyStatus;
  approval_status: ApprovalStatus;
  opening_date: string | null;
  closing_date: string | null;
  target_start_date: string | null;
  recruitment_lead_name: string | null;
  is_internal_only: boolean;
  accepts_internal_candidates: boolean;
  blind_review_enabled: boolean;
  ai_screening_enabled: boolean;
  safer_recruitment_required: boolean;
  regulated_role: boolean;
  requires_dbs: boolean;
  requires_driving: boolean;
  requires_qualification_checks: boolean;
  required_reference_count: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type RegisterFilter =
  | "current"
  | "draft"
  | "approval"
  | "open"
  | "closed"
  | "archived"
  | "all";

const filterOptions: Array<{
  value: RegisterFilter;
  label: string;
}> = [
  { value: "current", label: "Current" },
  { value: "draft", label: "Draft" },
  { value: "approval", label: "Approval" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const currentStatuses: VacancyStatus[] = [
  "draft",
  "approval_required",
  "approved",
  "open",
  "paused",
];

const closedStatuses: VacancyStatus[] = [
  "closed",
  "filled",
  "cancelled",
];

const styles: Record<string, CSSProperties> = {
  workspace: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  headingBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  eyebrow: {
    margin: 0,
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#2F2435",
    fontSize: "28px",
    lineHeight: 1.2,
    fontWeight: 750,
  },
  description: {
    margin: 0,
    maxWidth: "760px",
    color: "#6F6674",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "1px solid #6E5084",
    borderRadius: "12px",
    background: "#6E5084",
    color: "#FFFFFF",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #DED2E7",
    borderRadius: "12px",
    background: "#FFFFFF",
    color: "#594861",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  metricCard: {
    border: "1px solid #E7DDED",
    borderRadius: "18px",
    background: "#FFFFFF",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(65, 45, 75, 0.05)",
  },
  metricLabel: {
    margin: 0,
    color: "#756B79",
    fontSize: "13px",
    fontWeight: 650,
  },
  metricValue: {
    margin: "8px 0 0",
    color: "#6E5084",
    fontSize: "30px",
    fontWeight: 750,
  },
  panel: {
    border: "1px solid #E7DDED",
    borderRadius: "18px",
    background: "#FFFFFF",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(65, 45, 75, 0.05)",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    padding: "18px",
    borderBottom: "1px solid #EEE6F2",
  },
  searchInput: {
    flex: "1 1 280px",
    minWidth: "220px",
    border: "1px solid #DCCFE5",
    borderRadius: "12px",
    background: "#FBF8FD",
    color: "#2F2435",
    padding: "11px 13px",
    fontSize: "14px",
    outline: "none",
  },
  filters: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterButton: {
    border: "1px solid #DED2E7",
    borderRadius: "999px",
    background: "#FFFFFF",
    color: "#695A70",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  filterButtonActive: {
    border: "1px solid #6E5084",
    borderRadius: "999px",
    background: "#F1EAF6",
    color: "#6E5084",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "980px",
    borderCollapse: "collapse",
  },
  th: {
    padding: "13px 16px",
    background: "#FAF7FC",
    color: "#6F6574",
    fontSize: "12px",
    fontWeight: 750,
    textAlign: "left",
    borderBottom: "1px solid #EEE6F2",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "15px 16px",
    color: "#45394B",
    fontSize: "13px",
    borderBottom: "1px solid #F0EAF3",
    verticalAlign: "top",
  },
  vacancyTitle: {
    margin: 0,
    color: "#34293A",
    fontSize: "14px",
    fontWeight: 750,
  },
  vacancyReference: {
    margin: "4px 0 0",
    color: "#8A7C90",
    fontSize: "12px",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    background: "#F1EAF6",
    color: "#6E5084",
    padding: "6px 9px",
    fontSize: "11px",
    fontWeight: 750,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },
  actionLink: {
    border: 0,
    background: "transparent",
    color: "#6E5084",
    padding: 0,
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  emptyState: {
    padding: "52px 24px",
    textAlign: "center",
  },
  emptyTitle: {
    margin: 0,
    color: "#392F3E",
    fontSize: "18px",
    fontWeight: 750,
  },
  emptyText: {
    margin: "8px auto 0",
    maxWidth: "520px",
    color: "#786E7C",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  message: {
    border: "1px solid #E7DDED",
    borderRadius: "14px",
    background: "#FBF8FD",
    color: "#65586B",
    padding: "14px 16px",
    fontSize: "14px",
  },
  error: {
    border: "1px solid #E7CBD2",
    borderRadius: "14px",
    background: "#FFF8FA",
    color: "#7D4654",
    padding: "14px 16px",
    fontSize: "14px",
  },
};

function normaliseStatus(value: string): string {
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatSalary(vacancy: TalentVacancy): string {
  if (!vacancy.salary_visible) {
    return "Not displayed";
  }

  if (vacancy.salary_min === null && vacancy.salary_max === null) {
    return "Not set";
  }

  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: vacancy.salary_currency || "GBP",
    maximumFractionDigits: 0,
  });

  const salaryPeriod = vacancy.salary_period
    ? ` ${vacancy.salary_period}`
    : "";

  if (
    vacancy.salary_min !== null &&
    vacancy.salary_max !== null &&
    vacancy.salary_min !== vacancy.salary_max
  ) {
    return `${formatter.format(vacancy.salary_min)}–${formatter.format(
      vacancy.salary_max
    )}${salaryPeriod}`;
  }

  const value = vacancy.salary_min ?? vacancy.salary_max;

  return value === null
    ? "Not set"
    : `${formatter.format(value)}${salaryPeriod}`;
}

function matchesRegisterFilter(
  vacancy: TalentVacancy,
  filter: RegisterFilter
): boolean {
  switch (filter) {
    case "current":
      return currentStatuses.includes(vacancy.status);

    case "draft":
      return vacancy.status === "draft";

    case "approval":
      return (
        vacancy.status === "approval_required" ||
        vacancy.approval_status === "pending" ||
        vacancy.approval_status === "returned"
      );

    case "open":
      return vacancy.status === "open";

    case "closed":
      return closedStatuses.includes(vacancy.status);

    case "archived":
      return vacancy.status === "archived" || Boolean(vacancy.archived_at);

    case "all":
    default:
      return true;
  }
}

export default function RecruitmentWorkspace() {
  const [vacancies, setVacancies] = useState<TalentVacancy[]>([]);
  const [activeFilter, setActiveFilter] =
    useState<RegisterFilter>("current");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadVacancies = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage(null);

    const { data, error } = await supabase
      .from("talent_vacancies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setVacancies([]);
      setErrorMessage(
        `Recruitment records could not be loaded. ${error.message}`
      );
    } else {
      setVacancies((data ?? []) as TalentVacancy[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadVacancies();
  }, [loadVacancies]);

  const metrics = useMemo(() => {
    const current = vacancies.filter((vacancy) =>
      currentStatuses.includes(vacancy.status)
    ).length;

    const open = vacancies.filter(
      (vacancy) => vacancy.status === "open"
    ).length;

    const awaitingApproval = vacancies.filter(
      (vacancy) =>
        vacancy.status === "approval_required" ||
        vacancy.approval_status === "pending" ||
        vacancy.approval_status === "returned"
    ).length;

    const saferRecruitment = vacancies.filter(
      (vacancy) =>
        vacancy.safer_recruitment_required &&
        vacancy.status !== "archived" &&
        !closedStatuses.includes(vacancy.status)
    ).length;

    return {
      current,
      open,
      awaitingApproval,
      saferRecruitment,
    };
  }, [vacancies]);

  const filteredVacancies = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase();

    return vacancies.filter((vacancy) => {
      if (!matchesRegisterFilter(vacancy, activeFilter)) {
        return false;
      }

      if (!normalisedSearch) {
        return true;
      }

      const searchableText = [
        vacancy.vacancy_reference,
        vacancy.title,
        vacancy.department,
        vacancy.location_name,
        vacancy.hiring_manager_name,
        vacancy.recruitment_lead_name,
        vacancy.employment_type,
        vacancy.status,
        vacancy.approval_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalisedSearch);
    });
  }, [activeFilter, searchTerm, vacancies]);

  const handleCreateVacancy = useCallback(() => {
    window.location.href = "/dashboard/leo-talent/recruitment/create";
  }, []);

  const handleOpenVacancy = useCallback((vacancyId: string) => {
    window.location.href = `/dashboard/leo-talent/recruitment/${vacancyId}`;
  }, []);

  const handleExport = useCallback(() => {
    if (filteredVacancies.length === 0) {
      setActionMessage("There are no vacancies in the current view to export.");
      return;
    }

    const headings = [
      "Vacancy reference",
      "Title",
      "Department",
      "Location",
      "Hiring manager",
      "Employment type",
      "Positions",
      "Status",
      "Approval status",
      "Opening date",
      "Closing date",
      "Target start date",
      "Safer recruitment required",
      "DBS required",
      "Driving required",
      "Qualification checks required",
    ];

    const escapeCsv = (value: string | number | boolean | null) => {
      const text = value === null ? "" : String(value);
      return `"${text.replaceAll('"', '""')}"`;
    };

    const rows = filteredVacancies.map((vacancy) => [
      vacancy.vacancy_reference,
      vacancy.title,
      vacancy.department,
      vacancy.location_name,
      vacancy.hiring_manager_name,
      vacancy.employment_type,
      vacancy.number_of_positions,
      normaliseStatus(vacancy.status),
      normaliseStatus(vacancy.approval_status),
      vacancy.opening_date,
      vacancy.closing_date,
      vacancy.target_start_date,
      vacancy.safer_recruitment_required,
      vacancy.requires_dbs,
      vacancy.requires_driving,
      vacancy.requires_qualification_checks,
    ]);

    const csv = [
      headings.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = `leo-talent-recruitment-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(downloadUrl);

    setActionMessage(
      `${filteredVacancies.length} recruitment record${
        filteredVacancies.length === 1 ? "" : "s"
      } exported.`
    );
  }, [filteredVacancies]);

  return (
    <section style={styles.workspace}>
      <header style={styles.header}>
        <div style={styles.headingBlock}>
          <p style={styles.eyebrow}>Leo Talent</p>

          <h1 style={styles.title}>Recruitment</h1>

          <p style={styles.description}>
            Create, approve and manage vacancies from initial planning through
            to closure. Recruitment records remain connected to applications,
            candidates, interviews, safer recruitment, offers and onboarding.
          </p>
        </div>

        <div style={styles.actionRow}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => void loadVacancies(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleExport}
          >
            Export current view
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={handleCreateVacancy}
          >
            Create vacancy
          </button>
        </div>
      </header>

      <div style={styles.metrics}>
        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>Current vacancies</p>
          <p style={styles.metricValue}>{metrics.current}</p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>Open for applications</p>
          <p style={styles.metricValue}>{metrics.open}</p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>Awaiting approval</p>
          <p style={styles.metricValue}>{metrics.awaitingApproval}</p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>Safer recruitment roles</p>
          <p style={styles.metricValue}>{metrics.saferRecruitment}</p>
        </article>
      </div>

      {errorMessage ? (
        <div role="alert" style={styles.error}>
          {errorMessage}
        </div>
      ) : null}

      {actionMessage ? (
        <div role="status" style={styles.message}>
          {actionMessage}
        </div>
      ) : null}

      <div style={styles.panel}>
        <div style={styles.controls}>
          <input
            type="search"
            aria-label="Search recruitment records"
            placeholder="Search by vacancy, reference, department or manager"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={styles.searchInput}
          />

          <div style={styles.filters}>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                style={
                  activeFilter === option.value
                    ? styles.filterButtonActive
                    : styles.filterButton
                }
                onClick={() => setActiveFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>Loading recruitment records…</h2>

            <p style={styles.emptyText}>
              Leo is retrieving the latest vacancy information.
            </p>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>
              {vacancies.length === 0
                ? "No vacancies have been created"
                : "No vacancies match this view"}
            </h2>

            <p style={styles.emptyText}>
              {vacancies.length === 0
                ? "Create the first vacancy to begin the recruitment workflow."
                : "Try changing the search term or selecting another register filter."}
            </p>

            {vacancies.length === 0 ? (
              <div style={{ marginTop: "18px" }}>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={handleCreateVacancy}
                >
                  Create vacancy
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Vacancy</th>
                  <th style={styles.th}>Department and location</th>
                  <th style={styles.th}>Manager</th>
                  <th style={styles.th}>Employment</th>
                  <th style={styles.th}>Salary</th>
                  <th style={styles.th}>Closing date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredVacancies.map((vacancy) => (
                  <tr key={vacancy.id}>
                    <td style={styles.td}>
                      <p style={styles.vacancyTitle}>{vacancy.title}</p>

                      <p style={styles.vacancyReference}>
                        {vacancy.vacancy_reference || "Reference not set"}
                      </p>

                      {vacancy.number_of_positions > 1 ? (
                        <p style={styles.vacancyReference}>
                          {vacancy.number_of_positions} positions
                        </p>
                      ) : null}
                    </td>

                    <td style={styles.td}>
                      <div>{vacancy.department || "Department not set"}</div>

                      <div style={{ marginTop: "4px", color: "#84788A" }}>
                        {vacancy.location_name || "Location not set"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      <div>
                        {vacancy.hiring_manager_name ||
                          "Hiring manager not set"}
                      </div>

                      {vacancy.recruitment_lead_name ? (
                        <div style={{ marginTop: "4px", color: "#84788A" }}>
                          Lead: {vacancy.recruitment_lead_name}
                        </div>
                      ) : null}
                    </td>

                    <td style={styles.td}>
                      <div>{vacancy.employment_type || "Not set"}</div>

                      {vacancy.work_pattern ? (
                        <div style={{ marginTop: "4px", color: "#84788A" }}>
                          {vacancy.work_pattern}
                        </div>
                      ) : null}

                      {vacancy.hours_per_week !== null ? (
                        <div style={{ marginTop: "4px", color: "#84788A" }}>
                          {vacancy.hours_per_week} hours per week
                        </div>
                      ) : null}
                    </td>

                    <td style={styles.td}>{formatSalary(vacancy)}</td>

                    <td style={styles.td}>
                      {formatDate(vacancy.closing_date)}
                    </td>

                    <td style={styles.td}>
                      <span style={styles.statusPill}>
                        {normaliseStatus(vacancy.status)}
                      </span>

                      {vacancy.approval_status !== "not_required" ? (
                        <div style={{ marginTop: "7px", color: "#84788A" }}>
                          Approval:{" "}
                          {normaliseStatus(vacancy.approval_status)}
                        </div>
                      ) : null}
                    </td>

                    <td style={styles.td}>
                      <button
                        type="button"
                        style={styles.actionLink}
                        onClick={() => handleOpenVacancy(vacancy.id)}
                      >
                        Open workspace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}