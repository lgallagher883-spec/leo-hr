"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RegisterView =
  | "current"
  | "new"
  | "review"
  | "interview"
  | "checks"
  | "offer"
  | "closed"
  | "archived"
  | "all";

type Candidate = {
  id: string;
  candidate_reference: string | null;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  email: string | null;
  archived_at: string | null;
};

type Vacancy = {
  id: string;
  vacancy_reference: string | null;
  title: string;
  department: string | null;
  location_name: string | null;
  status: string | null;
  archived_at: string | null;
};

type Application = {
  id: string;
  organisation_id: string | number | null;
  application_reference: string | null;
  vacancy_id: string;
  candidate_id: string;
  current_stage_key: string;
  status: string;
  source: string | null;
  submitted_at: string | null;
  last_reviewed_at: string | null;
  manual_score: number | null;
  ai_score: number | null;
  combined_score: number | null;
  recommendation: string | null;
  knockout_failed: boolean | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  candidate: Candidate | null;
  vacancy: Vacancy | null;
};

type PipelineStage = {
  id: string;
  stage_key: string;
  stage_name: string;
  description: string | null;
  stage_group: string;
  display_order: number;
  is_active: boolean;
};

const fallbackStages: PipelineStage[] = [
  {
    id: "new",
    stage_key: "new",
    stage_name: "New",
    description: "Application received and awaiting first review.",
    stage_group: "application",
    display_order: 10,
    is_active: true,
  },
  {
    id: "screening",
    stage_key: "screening",
    stage_name: "Screening",
    description: "Initial eligibility and application screening.",
    stage_group: "application",
    display_order: 20,
    is_active: true,
  },
  {
    id: "review",
    stage_key: "review",
    stage_name: "Review",
    description: "Manual, blind or panel review in progress.",
    stage_group: "application",
    display_order: 30,
    is_active: true,
  },
  {
    id: "interview_1",
    stage_key: "interview_1",
    stage_name: "First Interview",
    description: "Candidate progressing through interview.",
    stage_group: "interview",
    display_order: 40,
    is_active: true,
  },
  {
    id: "interview_2",
    stage_key: "interview_2",
    stage_name: "Further Interview",
    description: "Candidate progressing through a further interview.",
    stage_group: "interview",
    display_order: 50,
    is_active: true,
  },
  {
    id: "checks",
    stage_key: "checks",
    stage_name: "Pre-employment Checks",
    description: "Required checks before appointment.",
    stage_group: "offer",
    display_order: 60,
    is_active: true,
  },
  {
    id: "offer",
    stage_key: "offer",
    stage_name: "Offer",
    description: "Offer preparation or candidate response.",
    stage_group: "offer",
    display_order: 70,
    is_active: true,
  },
  {
    id: "appointed",
    stage_key: "appointed",
    stage_name: "Appointed",
    description: "Offer accepted and appointment underway.",
    stage_group: "appointment",
    display_order: 80,
    is_active: true,
  },
  {
    id: "unsuccessful",
    stage_key: "unsuccessful",
    stage_name: "Unsuccessful",
    description: "Application closed as unsuccessful.",
    stage_group: "closed",
    display_order: 90,
    is_active: true,
  },
  {
    id: "withdrawn",
    stage_key: "withdrawn",
    stage_name: "Withdrawn",
    description: "Candidate withdrew their application.",
    stage_group: "closed",
    display_order: 100,
    is_active: true,
  },
];

const viewOptions: Array<{ value: RegisterView; label: string }> = [
  { value: "current", label: "Current" },
  { value: "new", label: "New" },
  { value: "review", label: "Review" },
  { value: "interview", label: "Interview" },
  { value: "checks", label: "Checks" },
  { value: "offer", label: "Offer" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const closedStatuses = new Set([
  "withdrawn",
  "rejected",
  "unsuccessful",
  "appointed",
]);

function humanise(value: string | null | undefined): string {
  if (!value) return "Not set";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCandidateName(candidate: Candidate | null): string {
  if (!candidate) return "Candidate unavailable";

  const firstName =
    candidate.preferred_name?.trim() ||
    candidate.first_name?.trim() ||
    "";

  const name = `${firstName} ${candidate.last_name ?? ""}`.trim();
  return name || candidate.email || "Candidate";
}

function csvCell(value: unknown): string {
  const normalised =
    value === null || value === undefined ? "" : String(value);
  return `"${normalised.replaceAll('"', '""')}"`;
}

export default function ApplicationsPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>(fallbackStages);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState<RegisterView>("current");
  const [vacancyFilter, setVacancyFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadApplications = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");

    const [applicationsResult, stagesResult] = await Promise.all([
      supabase
        .from("leo_talent_applications")
        .select(
          `
            id,
            organisation_id,
            application_reference,
            vacancy_id,
            candidate_id,
            current_stage_key,
            status,
            source,
            submitted_at,
            last_reviewed_at,
            manual_score,
            ai_score,
            combined_score,
            recommendation,
            knockout_failed,
            created_at,
            updated_at,
            archived_at,
            candidate:leo_talent_candidates (
              id,
              candidate_reference,
              first_name,
              last_name,
              preferred_name,
              email,
              archived_at
            ),
            vacancy:leo_talent_vacancies (
              id,
              vacancy_reference,
              title,
              department,
              location_name,
              status,
              archived_at
            )
          `,
        )
        .order("updated_at", { ascending: false }),
      supabase
        .from("leo_talent_pipeline_stages")
        .select(
          "id, stage_key, stage_name, description, stage_group, display_order, is_active",
        )
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

    if (applicationsResult.error) {
      console.error(
        "Leo Talent applications could not be loaded:",
        applicationsResult.error,
      );
      setApplications([]);
      setError(
        `Leo could not load the application register. ${applicationsResult.error.message}`,
      );
    } else {
      setApplications(
        (applicationsResult.data ?? []).map((row) => {
          const raw = row as unknown as Application & {
            candidate: Candidate | Candidate[] | null;
            vacancy: Vacancy | Vacancy[] | null;
          };

          return {
            ...raw,
            candidate: Array.isArray(raw.candidate)
              ? raw.candidate[0] ?? null
              : raw.candidate,
            vacancy: Array.isArray(raw.vacancy)
              ? raw.vacancy[0] ?? null
              : raw.vacancy,
          };
        }),
      );
    }

    if (!stagesResult.error && stagesResult.data?.length) {
      setStages(stagesResult.data as PipelineStage[]);
    } else {
      setStages(fallbackStages);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const stageMap = useMemo(
    () => new Map(stages.map((stage) => [stage.stage_key, stage])),
    [stages],
  );

  const vacancyOptions = useMemo(() => {
    const records = new Map<string, string>();

    applications.forEach((application) => {
      if (application.vacancy) {
        records.set(application.vacancy.id, application.vacancy.title);
      }
    });

    return Array.from(records.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [applications]);

  const sourceOptions = useMemo(() => {
    return Array.from(
      new Set(
        applications
          .map((application) => application.source?.trim())
          .filter((source): source is string => Boolean(source)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const metrics = useMemo(() => {
    const live = applications.filter(
      (application) =>
        !application.archived_at &&
        application.status !== "archived",
    );

    return {
      active: live.filter(
        (application) => !closedStatuses.has(application.status),
      ).length,
      newApplications: live.filter(
        (application) => application.current_stage_key === "new",
      ).length,
      review: live.filter((application) =>
        ["screening", "review"].includes(application.current_stage_key),
      ).length,
      interview: live.filter((application) =>
        application.current_stage_key.startsWith("interview"),
      ).length,
      checks: live.filter(
        (application) => application.current_stage_key === "checks",
      ).length,
      offers: live.filter(
        (application) =>
          application.current_stage_key === "offer" ||
          application.status === "offered",
      ).length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const archived =
        application.status === "archived" ||
        application.archived_at !== null;

      const closed = closedStatuses.has(application.status);

      let matchesView = true;

      switch (activeView) {
        case "current":
          matchesView = !archived && !closed;
          break;
        case "new":
          matchesView =
            !archived && application.current_stage_key === "new";
          break;
        case "review":
          matchesView =
            !archived &&
            ["screening", "review"].includes(
              application.current_stage_key,
            );
          break;
        case "interview":
          matchesView =
            !archived &&
            application.current_stage_key.startsWith("interview");
          break;
        case "checks":
          matchesView =
            !archived && application.current_stage_key === "checks";
          break;
        case "offer":
          matchesView =
            !archived &&
            (application.current_stage_key === "offer" ||
              application.status === "offered");
          break;
        case "closed":
          matchesView = !archived && closed;
          break;
        case "archived":
          matchesView = archived;
          break;
        case "all":
          matchesView = true;
          break;
      }

      const matchesVacancy =
        vacancyFilter === "all" ||
        application.vacancy_id === vacancyFilter;

      const matchesSource =
        sourceFilter === "all" ||
        application.source === sourceFilter;

      const haystack = [
        application.application_reference,
        getCandidateName(application.candidate),
        application.candidate?.candidate_reference,
        application.candidate?.email,
        application.vacancy?.title,
        application.vacancy?.vacancy_reference,
        application.vacancy?.department,
        application.vacancy?.location_name,
        application.source,
        application.current_stage_key,
        application.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesView &&
        matchesVacancy &&
        matchesSource &&
        (!search || haystack.includes(search))
      );
    });
  }, [
    activeView,
    applications,
    searchTerm,
    sourceFilter,
    vacancyFilter,
  ]);

  const archiveApplication = useCallback(
    async (application: Application) => {
      const confirmed = window.confirm(
        `Archive ${application.application_reference || "this application"}? The record will remain available in the Archived view.`,
      );

      if (!confirmed) return;

      setWorkingId(application.id);
      setError("");

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("leo_talent_applications")
        .update({
          status: "archived",
          archived_at: now,
          updated_at: now,
        })
        .eq("id", application.id);

      if (updateError) {
        setError(
          `The application could not be archived. ${updateError.message}`,
        );
      } else {
        setNotice("Application archived.");
        await loadApplications(true);
      }

      setWorkingId(null);
    },
    [loadApplications],
  );

  const restoreApplication = useCallback(
    async (application: Application) => {
      setWorkingId(application.id);
      setError("");

      const restoredStatus = application.current_stage_key === "appointed"
        ? "appointed"
        : application.current_stage_key === "withdrawn"
          ? "withdrawn"
          : application.current_stage_key === "unsuccessful"
            ? "unsuccessful"
            : application.current_stage_key === "offer"
              ? "offered"
              : "active";

      const { error: updateError } = await supabase
        .from("leo_talent_applications")
        .update({
          status: restoredStatus,
          archived_at: null,
          archive_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (updateError) {
        setError(
          `The application could not be restored. ${updateError.message}`,
        );
      } else {
        setNotice("Application restored.");
        await loadApplications(true);
      }

      setWorkingId(null);
    },
    [loadApplications],
  );

  function exportCurrentView() {
    if (!filteredApplications.length) {
      window.alert("There are no applications in this view to export.");
      return;
    }

    const rows = [
      [
        "Application reference",
        "Candidate",
        "Candidate email",
        "Vacancy",
        "Vacancy reference",
        "Department",
        "Stage",
        "Status",
        "Source",
        "Submitted",
        "Last reviewed",
      ],
      ...filteredApplications.map((application) => [
        application.application_reference ?? "",
        getCandidateName(application.candidate),
        application.candidate?.email ?? "",
        application.vacancy?.title ?? "",
        application.vacancy?.vacancy_reference ?? "",
        application.vacancy?.department ?? "",
        stageMap.get(application.current_stage_key)?.stage_name ??
          humanise(application.current_stage_key),
        humanise(application.status),
        application.source ?? "",
        application.submitted_at ?? "",
        application.last_reviewed_at ?? "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leo-talent-applications-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <StatePanel
          title="Loading applications…"
          description="Leo is retrieving the application register and recruitment pipeline."
        />
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>LEO TALENT</p>
          <h1 style={styles.title}>Applications</h1>
          <p style={styles.description}>
            Review applications, record decisions and manage candidate
            progression through one connected recruitment journey.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => void loadApplications(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={exportCurrentView}
          >
            Export current view
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              router.push("/dashboard/leo-talent/applications/create")
            }
          >
            New Application
          </button>
        </div>
      </header>

      {error ? (
        <div role="alert" style={styles.errorMessage}>
          {error}
        </div>
      ) : null}

      {notice ? (
        <div role="status" style={styles.successMessage}>
          {notice}
        </div>
      ) : null}

      <section style={styles.metrics}>
        <Metric label="Active applications" value={metrics.active} />
        <Metric label="New" value={metrics.newApplications} />
        <Metric label="Awaiting review" value={metrics.review} />
        <Metric label="In interview" value={metrics.interview} />
        <Metric label="Checks" value={metrics.checks} />
        <Metric label="Offers" value={metrics.offers} />
      </section>

      <section style={styles.pipelinePanel}>
        <div style={styles.sectionHeading}>
          <div>
            <h2 style={styles.sectionTitle}>Recruitment pipeline</h2>
            <p style={styles.sectionDescription}>
              Live application volume across each stage.
            </p>
          </div>
        </div>

        <div style={styles.pipelineGrid}>
          {stages
            .filter(
              (stage) =>
                !["unsuccessful", "withdrawn"].includes(stage.stage_key),
            )
            .map((stage) => {
              const count = applications.filter(
                (application) =>
                  !application.archived_at &&
                  application.status !== "archived" &&
                  application.current_stage_key === stage.stage_key,
              ).length;

              return (
                <button
                  key={stage.stage_key}
                  type="button"
                  style={styles.pipelineCard}
                  onClick={() => {
                    if (stage.stage_key === "new") setActiveView("new");
                    else if (
                      ["screening", "review"].includes(stage.stage_key)
                    )
                      setActiveView("review");
                    else if (stage.stage_key.startsWith("interview"))
                      setActiveView("interview");
                    else if (stage.stage_key === "checks")
                      setActiveView("checks");
                    else if (stage.stage_key === "offer")
                      setActiveView("offer");
                    else setActiveView("all");
                  }}
                >
                  <span style={styles.pipelineValue}>{count}</span>
                  <span style={styles.pipelineLabel}>
                    {stage.stage_name}
                  </span>
                </button>
              );
            })}
        </div>
      </section>

      <section style={styles.registerPanel}>
        <div style={styles.sectionHeading}>
          <div>
            <h2 style={styles.sectionTitle}>Application register</h2>
            <p style={styles.sectionDescription}>
              {filteredApplications.length} application
              {filteredApplications.length === 1 ? "" : "s"} in this view.
            </p>
          </div>
        </div>

        <div style={styles.viewTabs}>
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              style={
                activeView === option.value
                  ? styles.viewTabActive
                  : styles.viewTab
              }
              onClick={() => setActiveView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div style={styles.filters}>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search candidate, vacancy, reference or source"
            style={styles.searchInput}
          />

          <select
            value={vacancyFilter}
            onChange={(event) => setVacancyFilter(event.target.value)}
            style={styles.select}
            aria-label="Filter by vacancy"
          >
            <option value="all">All vacancies</option>
            {vacancyOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            style={styles.select}
            aria-label="Filter by source"
          >
            <option value="all">All sources</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        {filteredApplications.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No applications match this view</h3>
            <p style={styles.emptyText}>
              Add an application or adjust the search and filters.
            </p>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() =>
                router.push("/dashboard/leo-talent/applications/create")
              }
            >
              New Application
            </button>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Vacancy</th>
                  <th style={styles.th}>Stage</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Source</th>
                  <th style={styles.th}>Applied</th>
                  <th style={styles.th}>Last reviewed</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((application) => {
                  const isArchived =
                    application.status === "archived" ||
                    application.archived_at !== null;

                  return (
                    <tr key={application.id}>
                      <td style={styles.td}>
                        <strong style={styles.primaryText}>
                          {getCandidateName(application.candidate)}
                        </strong>
                        <span style={styles.secondaryText}>
                          {application.application_reference ||
                            application.candidate?.candidate_reference ||
                            "Reference not set"}
                        </span>
                        {application.candidate?.email ? (
                          <span style={styles.secondaryText}>
                            {application.candidate.email}
                          </span>
                        ) : null}
                      </td>

                      <td style={styles.td}>
                        <strong style={styles.primaryText}>
                          {application.vacancy?.title ||
                            "Vacancy unavailable"}
                        </strong>
                        <span style={styles.secondaryText}>
                          {[
                            application.vacancy?.department,
                            application.vacancy?.location_name,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Details not set"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.stagePill}>
                          {stageMap.get(application.current_stage_key)
                            ?.stage_name ??
                            humanise(application.current_stage_key)}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.statusPill}>
                          {humanise(application.status)}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {application.source || "Not set"}
                      </td>

                      <td style={styles.td}>
                        {formatDate(
                          application.submitted_at ||
                            application.created_at,
                        )}
                      </td>

                      <td style={styles.td}>
                        {formatDate(application.last_reviewed_at)}
                      </td>

                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button
                            type="button"
                            style={styles.linkButton}
                            onClick={() =>
                              router.push(
                                `/dashboard/leo-talent/applications/${application.id}`,
                              )
                            }
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            style={styles.linkButton}
                            disabled={workingId === application.id}
                            onClick={() =>
                              isArchived
                                ? void restoreApplication(application)
                                : void archiveApplication(application)
                            }
                          >
                            {workingId === application.id
                              ? "Working…"
                              : isArchived
                                ? "Restore"
                                : "Archive"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article style={styles.metricCard}>
      <p style={styles.metricLabel}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
    </article>
  );
}

function StatePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section style={styles.statePanel}>
      <h1 style={styles.stateTitle}>{title}</h1>
      <p style={styles.stateText}>{description}</p>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    maxWidth: "1500px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    padding: "24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  eyebrow: {
    margin: "0 0 7px",
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  title: {
    margin: 0,
    color: "#111827",
    fontSize: "30px",
    lineHeight: 1.2,
  },
  description: {
    margin: "8px 0 0",
    maxWidth: "760px",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    minHeight: "40px",
    padding: "9px 14px",
    background: "#6E5084",
    border: "1px solid #6E5084",
    borderRadius: "10px",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: "40px",
    padding: "9px 14px",
    background: "#FFFFFF",
    border: "1px solid #CDB2E2",
    borderRadius: "10px",
    color: "#6E5084",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  errorMessage: {
    padding: "13px 15px",
    background: "#FFF8FA",
    border: "1px solid #E7CBD2",
    borderRadius: "12px",
    color: "#7D4654",
    fontSize: "13px",
  },
  successMessage: {
    padding: "13px 15px",
    background: "#F5FFF9",
    border: "1px solid #CFE9DA",
    borderRadius: "12px",
    color: "#38634A",
    fontSize: "13px",
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
    gap: "12px",
  },
  metricCard: {
    padding: "17px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "14px",
  },
  metricLabel: {
    margin: 0,
    color: "#6B7280",
    fontSize: "12px",
    fontWeight: 700,
  },
  metricValue: {
    margin: "8px 0 0",
    color: "#6E5084",
    fontSize: "28px",
    fontWeight: 800,
  },
  pipelinePanel: {
    padding: "22px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  registerPanel: {
    minWidth: 0,
    padding: "22px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "19px",
  },
  sectionDescription: {
    margin: "6px 0 0",
    color: "#6B7280",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  pipelineGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "10px",
  },
  pipelineCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "6px",
    padding: "14px",
    background: "#FAFAFB",
    border: "1px solid #ECEEF1",
    borderRadius: "12px",
    cursor: "pointer",
    textAlign: "left",
  },
  pipelineValue: {
    color: "#6E5084",
    fontSize: "24px",
    fontWeight: 800,
  },
  pipelineLabel: {
    color: "#4B5563",
    fontSize: "12px",
    fontWeight: 700,
  },
  viewTabs: {
    display: "flex",
    gap: "8px",
    paddingBottom: "14px",
    overflowX: "auto",
  },
  viewTab: {
    flex: "0 0 auto",
    padding: "8px 11px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "9px",
    color: "#6B7280",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  viewTabActive: {
    flex: "0 0 auto",
    padding: "8px 11px",
    background: "#F7F1FC",
    border: "1px solid #CDB2E2",
    borderRadius: "9px",
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 2fr) minmax(180px, 1fr) minmax(170px, 1fr)",
    gap: "10px",
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "42px",
    padding: "10px 12px",
    background: "#FAFAFB",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    color: "#111827",
    fontSize: "13px",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "42px",
    padding: "10px 12px",
    background: "#FFFFFF",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    color: "#111827",
    fontSize: "13px",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "1050px",
    borderCollapse: "collapse",
  },
  th: {
    padding: "11px 12px",
    background: "#FAFAFB",
    borderBottom: "1px solid #E5E7EB",
    color: "#6B7280",
    fontSize: "11px",
    fontWeight: 800,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "13px 12px",
    borderBottom: "1px solid #EEF0F2",
    color: "#374151",
    fontSize: "13px",
    verticalAlign: "top",
  },
  primaryText: {
    display: "block",
    color: "#1F2937",
    fontSize: "13px",
  },
  secondaryText: {
    display: "block",
    marginTop: "4px",
    color: "#6B7280",
    fontSize: "11px",
  },
  stagePill: {
    display: "inline-flex",
    padding: "5px 8px",
    background: "#F7F1FC",
    borderRadius: "999px",
    color: "#6E5084",
    fontSize: "11px",
    fontWeight: 750,
  },
  statusPill: {
    display: "inline-flex",
    padding: "5px 8px",
    background: "#F3F4F6",
    borderRadius: "999px",
    color: "#4B5563",
    fontSize: "11px",
    fontWeight: 750,
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  linkButton: {
    border: 0,
    background: "transparent",
    color: "#6E5084",
    padding: 0,
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "44px 20px",
    textAlign: "center",
  },
  emptyTitle: {
    margin: 0,
    color: "#374151",
    fontSize: "16px",
  },
  emptyText: {
    margin: 0,
    color: "#6B7280",
    fontSize: "13px",
  },
  statePanel: {
    padding: "44px 24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    textAlign: "center",
  },
  stateTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "21px",
  },
  stateText: {
    margin: "8px auto 0",
    maxWidth: "620px",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
};