"use client";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
type TimePeriod =
  | "30_days"
  | "quarter"
  | "6_months"
  | "12_months"
  | "all_time";

type EmployeeRecord = {
  id: number;
  name: string;
  status: string | null;
  start_date: string | null;
};

type MatterRecord = {
  id: number;
  title: string;
  subject: string | null;
  status: string | null;
  matter_type: string | null;
  created_at: string | null;
};

type SarRecord = {
  id: number;
  request_title: string;
  employee_id: number;
  matter_id: number | null;
  status: string;
  response_due_date: string;
  extended_due_date: string | null;
  created_at: string;
};

type ResourceRecord = {
  id: number;
  name: string;
  register_type: string;
};

type InsightItem = {
  id: string;
  title: string;
  detail: string;
  actionLabel?: string;
  actionPath?: string;
  askLeoPrompt?: string;
};

type RouterLike = {
  push: (href: string) => void;
};

type InsightPayload = {
  summary?: string;
  risks?: Array<{ title: string; severity: string; detail: string }>;
  trends?: Array<{ title: string; detail: string }>;
  recommendations?: Array<{
    title: string;
    detail: string;
    actionPath?: string;
    askLeoPrompt?: string;
  }>;
  earlyInterventions?: Array<{ title: string; detail: string }>;
};

type ExecutiveBrief = {
  title: string;
  headlineSummary: string;
  supportingCounts: Array<{
    label: string;
    value: string;
  }>;
  risks: Array<{
    title: string;
    detail: string;
  }>;
  trends: Array<{
    title: string;
    detail: string;
  }>;
  recommendations: Array<{
    title: string;
    detail: string;
  }>;
  earlyInterventions: Array<{
    title: string;
    detail: string;
  }>;
};

const periodOptions: Array<{
  value: TimePeriod;
  label: string;
}> = [
  {
    value: "30_days",
    label: "Last 30 days",
  },
  {
    value: "quarter",
    label: "Last quarter",
  },
  {
    value: "6_months",
    label: "Last 6 months",
  },
  {
    value: "12_months",
    label: "Last 12 months",
  },
  {
    value: "all_time",
    label: "All time",
  },
];

export default function InsightsPage() {
  const router = useRouter();

  const [period, setPeriod] =
    useState<TimePeriod>("quarter");

  const [employees, setEmployees] =
    useState<EmployeeRecord[]>([]);

  const [matters, setMatters] =
    useState<MatterRecord[]>([]);

  const [sars, setSars] =
    useState<SarRecord[]>([]);

  const [resources, setResources] =
    useState<ResourceRecord[]>([]);

  const [
    knowledgeSectionCount,
    setKnowledgeSectionCount,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [insightPayload, setInsightPayload] =
    useState<InsightPayload | null>(null);

  const [briefGeneratedAt, setBriefGeneratedAt] =
    useState<Date | null>(null);

  const [briefActionState, setBriefActionState] =
    useState<"idle" | "generating" | "downloading">("idle");

  const [briefNotice, setBriefNotice] =
    useState("");

  useEffect(() => {
    void loadInsightsData();
  }, [period]);

  useEffect(() => {
    setBriefGeneratedAt(null);
    setBriefNotice("");
  }, [period]);

  async function loadInsightsData() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/insights?period=${encodeURIComponent(period)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.error ||
            "Insights data could not be loaded."
        );
      }

      setEmployees(
        Array.isArray(result.employees)
          ? (result.employees as EmployeeRecord[])
          : []
      );

      setMatters(
        Array.isArray(result.matters)
          ? (result.matters as MatterRecord[])
          : []
      );

      setSars(
        Array.isArray(result.sars)
          ? (result.sars as SarRecord[])
          : []
      );

      setResources(
        Array.isArray(result.resources)
          ? (result.resources as ResourceRecord[])
          : []
      );

      setKnowledgeSectionCount(
        typeof result.knowledgeSectionCount ===
          "number"
          ? result.knowledgeSectionCount
          : 0
      );

      setInsightPayload(
        result?.insight && typeof result.insight === "object"
          ? result.insight
          : null
      );

      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Error loading Insights:",
        error
      );

      setEmployees([]);
      setMatters([]);
      setSars([]);
      setResources([]);
      setKnowledgeSectionCount(0);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }

  const periodStart = useMemo(
    () => getPeriodStart(period),
    [period]
  );

  const periodLabel = useMemo(
    () =>
      periodOptions.find(
        (option) =>
          option.value === period
      )?.label || "Selected period",
    [period]
  );

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          employee.status !== "Archived"
      ),
    [employees]
  );

  const periodJoiners = useMemo(
    () =>
      activeEmployees.filter(
        (employee) =>
          isWithinPeriod(
            employee.start_date,
            periodStart
          )
      ),
    [activeEmployees, periodStart]
  );

  const periodMatters = useMemo(
    () =>
      matters.filter((matter) =>
        isWithinPeriod(
          matter.created_at,
          periodStart
        )
      ),
    [matters, periodStart]
  );

  const openMatters = useMemo(
    () =>
      matters.filter(
        (matter) =>
          !isClosedMatterStatus(
            matter.status
          )
      ),
    [matters]
  );

  const closedMattersInPeriod =
    useMemo(
      () =>
        periodMatters.filter((matter) =>
          isClosedMatterStatus(
            matter.status
          )
        ),
      [periodMatters]
    );

  const activeSars = useMemo(
    () =>
      sars.filter(
        (sar) =>
          sar.status !== "Completed" &&
          sar.status !== "Closed"
      ),
    [sars]
  );

  const completedSars = useMemo(
    () =>
      sars.filter(
        (sar) =>
          sar.status === "Completed" ||
          sar.status === "Closed"
      ),
    [sars]
  );

  const sarsDueSoon = useMemo(
    () =>
      activeSars.filter(
        (sar) =>
          getSarDeadlineState(sar) ===
          "Due Soon"
      ),
    [activeSars]
  );

  const sarsPastDeadline =
    useMemo(
      () =>
        activeSars.filter(
          (sar) =>
            getSarDeadlineState(sar) ===
            "Past planned date"
        ),
      [activeSars]
    );

  const mattersByType = useMemo(
    () =>
      countBy(
        periodMatters,
        (matter) =>
          matter.matter_type ||
          "General"
      ),
    [periodMatters]
  );

  const longestOpenMatter =
    useMemo(
      () =>
        [...openMatters]
          .filter((matter) =>
            Boolean(matter.created_at)
          )
          .sort(
            (first, second) =>
              new Date(
                first.created_at || ""
              ).getTime() -
              new Date(
                second.created_at || ""
              ).getTime()
          )[0] || null,
      [openMatters]
    );

  const averageOpenMatterAge =
    useMemo(() => {
      if (openMatters.length === 0) {
        return null;
      }

      const totalDays =
        openMatters.reduce(
          (total, matter) =>
            total +
            daysSince(
              matter.created_at
            ),
          0
        );

      return Math.round(
        totalDays /
          openMatters.length
      );
    }, [openMatters]);

  const organisationContext =
    useMemo(
      () =>
        buildInsightsContext({
          periodLabel,
          activeEmployees,
          periodJoiners,
          openMatters,
          periodMatters,
          closedMattersInPeriod,
          mattersByType,
          averageOpenMatterAge,
          longestOpenMatter,
          activeSars,
          completedSars,
          sarsDueSoon,
          sarsPastDeadline,
          resources,
          knowledgeSectionCount,
        }),
      [
        activeEmployees,
        activeSars,
        averageOpenMatterAge,
        closedMattersInPeriod,
        completedSars,
        knowledgeSectionCount,
        longestOpenMatter,
        mattersByType,
        openMatters,
        periodJoiners,
        periodLabel,
        periodMatters,
        resources,
        sarsDueSoon,
        sarsPastDeadline,
      ]
    );

  const executiveBrief = useMemo<ExecutiveBrief>(
    () => ({
      title: `Executive Insight Brief · ${periodLabel}`,
      headlineSummary:
        insightPayload?.summary ||
        `${periodLabel} summary: ${periodMatters.length} ${periodMatters.length === 1 ? "matter" : "matters"} were opened, ${openMatters.length} remain open, and ${activeSars.length} active ${activeSars.length === 1 ? "SAR is" : "SARs are"} currently recorded.`,
      supportingCounts: [
        {
          label: "Active employees",
          value: String(activeEmployees.length),
        },
        {
          label: `Joiners · ${periodLabel}`,
          value: String(periodJoiners.length),
        },
        {
          label: `New Matters · ${periodLabel}`,
          value: String(periodMatters.length),
        },
        {
          label: "Open Matters",
          value: String(openMatters.length),
        },
        {
          label: "Active SARs",
          value: String(activeSars.length),
        },
        {
          label: "SARs due soon",
          value: String(sarsDueSoon.length),
        },
        {
          label: "SARs past planned date",
          value: String(sarsPastDeadline.length),
        },
        {
          label: "HR Resources",
          value: String(resources.length),
        },
        {
          label: "Knowledge available",
          value: String(knowledgeSectionCount),
        },
      ],
      risks: (insightPayload?.risks || []).map((risk) => ({
        title: risk.title,
        detail: risk.detail,
      })),
      trends: (insightPayload?.trends || []).map((trend) => ({
        title: trend.title,
        detail: trend.detail,
      })),
      recommendations: (insightPayload?.recommendations || []).map((recommendation) => ({
        title: recommendation.title,
        detail: recommendation.detail,
      })),
      earlyInterventions: (insightPayload?.earlyInterventions || []).map((intervention) => ({
        title: intervention.title,
        detail: intervention.detail,
      })),
    }),
    [
      activeEmployees.length,
      activeSars.length,
      insightPayload?.earlyInterventions,
      insightPayload?.recommendations,
      insightPayload?.risks,
      insightPayload?.summary,
      insightPayload?.trends,
      knowledgeSectionCount,
      openMatters.length,
      periodJoiners.length,
      periodLabel,
      periodMatters.length,
      resources.length,
      sarsDueSoon.length,
      sarsPastDeadline.length,
    ]
  );

  const recommendations =
    useMemo<InsightItem[]>(() => {
      const items: InsightItem[] = [];

      const payloadRecommendations = insightPayload?.recommendations || [];
      payloadRecommendations.forEach((recommendation, index) => {
        items.push({
          id: `payload-recommendation-${index}`,
          title: recommendation.title,
          detail: recommendation.detail,
          actionLabel: recommendation.actionPath ? "Open" : undefined,
          actionPath: recommendation.actionPath,
          askLeoPrompt: recommendation.askLeoPrompt,
        });
      });

      if (sarsPastDeadline.length > 0) {
        items.push({
          id: "sar-past-date",
          title:
            "Review SAR response dates",
          detail: `${sarsPastDeadline.length} open Subject Access ${
            sarsPastDeadline.length === 1
              ? "Request has"
              : "Requests have"
          } passed the response date currently recorded.`,
          actionLabel:
            "Open SAR Requests",
          actionPath:
            "/dashboard/sar-requests",
          askLeoPrompt:
            "Review the Subject Access Requests that have passed their recorded response dates and recommend what should happen next.",
        });
      }

      if (sarsDueSoon.length > 0) {
        items.push({
          id: "sar-due-soon",
          title:
            "Prepare upcoming SAR work",
          detail: `${sarsDueSoon.length} open Subject Access ${
            sarsDueSoon.length === 1
              ? "Request is"
              : "Requests are"
          } approaching the recorded response date.`,
          actionLabel:
            "Open SAR Requests",
          actionPath:
            "/dashboard/sar-requests",
          askLeoPrompt:
            "Review the Subject Access Requests approaching their response dates and recommend the work that should be prioritised.",
        });
      }

      if (openMatters.length > 0) {
        items.push({
          id: "open-matters",
          title:
            "Review open workplace Matters",
          detail: `${openMatters.length} ${
            openMatters.length === 1
              ? "Matter remains"
              : "Matters remain"
          } open. A short review will help confirm that each has a clear current stage and next action.`,
          actionLabel:
            "Open Matters",
          actionPath:
            "/dashboard/matters",
          askLeoPrompt:
            "Review the organisation's open workplace Matters and identify which should be prioritised.",
        });
      }

      if (longestOpenMatter) {
        items.push({
          id: "longest-open-matter",
          title:
            "Confirm the next step on the longest-running Matter",
          detail: `${
            longestOpenMatter.subject ||
            longestOpenMatter.title
          } has been open for ${daysSince(
            longestOpenMatter.created_at
          )} days. I would check that it has a clear owner, current stage and next action.`,
          actionLabel: "Open Matter",
          actionPath:
            `/dashboard/matters/${longestOpenMatter.id}`,
          askLeoPrompt:
            `Review the Matter "${
              longestOpenMatter.subject ||
              longestOpenMatter.title
            }" and recommend the most appropriate next step.`,
        });
      }

      if (
        knowledgeSectionCount > 0
      ) {
        items.push({
          id: "knowledge-review",
          title:
            "Keep organisational knowledge current",
          detail: `${knowledgeSectionCount} active knowledge ${
            knowledgeSectionCount === 1
              ? "section is"
              : "sections are"
          } available to Leo. Continue preparing the policies and resources most likely to support live workplace Matters.`,
          actionLabel:
            "Open HR Resources",
          actionPath:
            "/dashboard/hr-resources",
          askLeoPrompt:
            "Review the organisation's HR Resources and recommend which resources should be prepared or reviewed next.",
        });
      }

      if (items.length === 0) {
        items.push({
          id: "steady-position",
          title:
            "No immediate priorities identified",
          detail:
            "The current records do not show anything requiring immediate attention. Continue routine reviews and keep records up to date.",
        });
      }

      return items;
    }, [
      insightPayload?.recommendations,
      knowledgeSectionCount,
      longestOpenMatter,
      openMatters.length,
      sarsDueSoon.length,
      sarsPastDeadline.length,
    ]);

  const observations =
    useMemo<InsightItem[]>(() => {
      const items: InsightItem[] = [];

      (insightPayload?.risks || []).forEach((risk, index) => {
        items.push({
          id: `payload-risk-${index}`,
          title: risk.title,
          detail: risk.detail,
        });
      });

      (insightPayload?.trends || []).forEach((trend, index) => {
        items.push({
          id: `payload-trend-${index}`,
          title: trend.title,
          detail: trend.detail,
        });
      });

      (insightPayload?.earlyInterventions || []).forEach((intervention, index) => {
        items.push({
          id: `payload-intervention-${index}`,
          title: intervention.title,
          detail: intervention.detail,
        });
      });

      const leadingMatterType =
        Object.entries(
          mattersByType
        ).sort(
          (first, second) =>
            second[1] - first[1]
        )[0];

      if (leadingMatterType) {
        items.push({
          id: "leading-matter-type",
          title:
            "Most common Matter type",
          detail: `${
            leadingMatterType[0]
          } is the most frequently recorded Matter type during ${periodLabel.toLowerCase()}, with ${
            leadingMatterType[1]
          } ${
            leadingMatterType[1] === 1
              ? "record"
              : "records"
          }.`,
          actionLabel:
            "View Matters",
          actionPath:
            "/dashboard/matters",
        });
      }

      if (
        averageOpenMatterAge !== null
      ) {
        items.push({
          id: "matter-age",
          title: "Open Matter age",
          detail: `Open Matters have been active for an average of ${averageOpenMatterAge} ${
            averageOpenMatterAge === 1
              ? "day"
              : "days"
          } as at today.`,
          actionLabel:
            "Review open Matters",
          actionPath:
            "/dashboard/matters",
        });
      }

      if (activeSars.length === 0) {
        items.push({
          id: "no-active-sars",
          title:
            "No active SAR workload",
          detail:
            "There are currently no open Subject Access Requests recorded.",
          actionLabel:
            "Open SAR Requests",
          actionPath:
            "/dashboard/sar-requests",
        });
      }

      if (periodJoiners.length > 0) {
        items.push({
          id: "joiners",
          title:
            "Recent workforce growth",
          detail: `${periodJoiners.length} ${
            periodJoiners.length === 1
              ? "employee joined"
              : "employees joined"
          } during ${periodLabel.toLowerCase()}.`,
          actionLabel:
            "Open Employees",
          actionPath:
            "/dashboard/employees",
        });
      }

      return items;
    }, [
      activeSars.length,
      averageOpenMatterAge,
      insightPayload?.earlyInterventions,
      insightPayload?.risks,
      insightPayload?.trends,
      mattersByType,
      periodJoiners.length,
      periodLabel,
    ]);

  function discussWithLeo(
    request: string
  ) {
    openAskLeo(
      router,
      request,
      organisationContext
    );
  }

  async function writeInsightsAuditEvent({
    action,
    description,
    metadata,
  }: {
    action: string;
    description: string;
    metadata: Record<string, unknown>;
  }) {
    try {
      const response = await fetch("/api/insights/brief-audit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          action,
          description,
          period,
          periodLabel,
          metadata,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        console.warn(
          "Insights audit event was not saved:",
          result?.error || `Request failed with status ${response.status}`
        );
      }
    } catch (error) {
      console.warn(
        "Insights audit event was not saved:",
        error
      );
    }
  }

  async function generateExecutiveBrief() {
    const generatedAt = new Date();

    setBriefActionState("generating");
    setBriefGeneratedAt(generatedAt);
    setBriefNotice("The executive brief is ready.");

    await writeInsightsAuditEvent({
      action: "Executive Insight Brief created",
      description: `An Executive Insight Brief was created for ${periodLabel.toLowerCase()}.`,
      metadata: {
        period,
        period_label: periodLabel,
        generated_at: generatedAt.toISOString(),
        active_employees: activeEmployees.length,
        period_matters: periodMatters.length,
        open_matters: openMatters.length,
        active_sars: activeSars.length,
      },
    });

    setBriefActionState("idle");
  }

  async function downloadExecutiveBrief() {
    if (!briefGeneratedAt) {
      return;
    }

    setBriefActionState("downloading");

    const lines = [
      executiveBrief.title,
      `Generated: ${briefGeneratedAt.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      `Reporting period: ${periodLabel}`,
      "",
      "Headline summary",
      executiveBrief.headlineSummary,
      "",
      "Supporting counts",
      ...executiveBrief.supportingCounts.map(
        (item) => `${item.label}: ${item.value}`
      ),
      "",
      "Key risks",
      ...formatBriefItems(executiveBrief.risks),
      "",
      "Notable trends",
      ...formatBriefItems(executiveBrief.trends),
      "",
      "Priority recommendations",
      ...formatBriefItems(executiveBrief.recommendations),
      "",
      "Early interventions",
      ...formatBriefItems(executiveBrief.earlyInterventions),
    ];

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leo-executive-insight-brief-${period}-${toDateStamp(
      briefGeneratedAt
    )}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);

    await writeInsightsAuditEvent({
      action: "Executive Insight Brief downloaded",
      description: `The Executive Insight Brief for ${periodLabel.toLowerCase()} was downloaded.`,
      metadata: {
        period,
        period_label: periodLabel,
        generated_at: briefGeneratedAt.toISOString(),
        export_format: "txt",
      },
    });

    setBriefNotice("The executive brief has been downloaded.");
    setBriefActionState("idle");
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            Insights
          </h1>

          <p style={subtitleStyle}>
            A professional overview of
            your organisation, highlighting
            trends, priorities and areas
            worth reviewing.
          </p>

          <div style={updatedStyle}>
            Last updated:{" "}
            {lastUpdated
              ? lastUpdated.toLocaleString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )
              : "Loading"}
          </div>
        </div>

        <div style={headerActionStyle}>
          <label style={periodLabelStyle}>
            Time period
          </label>

          <select
            value={period}
            onChange={(event) =>
              setPeriod(
                event.target
                  .value as TimePeriod
              )
            }
            style={periodSelectStyle}
          >
            {periodOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            onClick={() =>
              void generateExecutiveBrief()
            }
            style={primaryActionButtonStyle}
            disabled={
              loading ||
              briefActionState !==
                "idle"
            }
          >
            {briefGeneratedAt
              ? "Regenerate executive brief"
              : "Generate executive brief"}
          </button>

          <button
            type="button"
            onClick={() =>
              void downloadExecutiveBrief()
            }
            style={secondaryActionButtonStyle}
            disabled={
              !briefGeneratedAt ||
              briefActionState !==
                "idle"
            }
          >
            Download brief
          </button>
        </div>
      </div>

      {loading ? (
        <div style={loadingStyle}>
          Preparing organisation
          insights...
        </div>
      ) : (
        <>
          {briefGeneratedAt ? (
            <Section
              title="Executive Insight Brief"
              subtitle={`Generated for ${periodLabel.toLowerCase()} on ${briefGeneratedAt.toLocaleString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}.`}
              accent
            >
              <div style={briefPanelStyle}>
                <div style={briefHeaderStyle}>
                  <div>
                    <h3 style={briefTitleStyle}>
                      {executiveBrief.title}
                    </h3>

                    <p style={briefHeadlineStyle}>
                      {executiveBrief.headlineSummary}
                    </p>
                  </div>

                  {briefNotice ? (
                    <div style={briefNoticeStyle}>
                      {briefNotice}
                    </div>
                  ) : null}
                </div>

                <div
                  style={briefCountsGridStyle}
                >
                  {executiveBrief.supportingCounts.map(
                    (item) => (
                      <article
                        key={item.label}
                        style={briefCountCardStyle}
                      >
                        <span
                          style={briefCountLabelStyle}
                        >
                          {item.label}
                        </span>

                        <strong
                          style={briefCountValueStyle}
                        >
                          {item.value}
                        </strong>
                      </article>
                    )
                  )}
                </div>

                <div
                  style={briefSectionsGridStyle}
                >
                  <BriefListSection
                    title="Key risks"
                    items={executiveBrief.risks}
                    emptyMessage="No immediate risk pattern was identified for this period."
                  />

                  <BriefListSection
                    title="Notable trends"
                    items={executiveBrief.trends}
                    emptyMessage="No notable trend was identified for this period."
                  />

                  <BriefListSection
                    title="Priority recommendations"
                    items={executiveBrief.recommendations}
                    emptyMessage="No priority recommendation is currently recorded."
                  />

                  <BriefListSection
                    title="Early interventions"
                    items={executiveBrief.earlyInterventions}
                    emptyMessage="No early intervention is currently recorded."
                  />
                </div>
              </div>
            </Section>
          ) : null}

          <Section
            title="Executive overview"
            subtitle={`Current organisation position. Period-based measures use ${periodLabel.toLowerCase()}.`}
          >
            <div
              style={executiveGridStyle}
            >
              <MetricCard
                label="Active employees"
                value={
                  activeEmployees.length
                }
                detail="Current active workforce"
                tone="neutral"
              />

              <MetricCard
                label="Open Matters"
                value={
                  openMatters.length
                }
                detail="Current open workload"
                tone="purple"
              />

              <MetricCard
                label={`New Matters · ${periodLabel}`}
                value={
                  periodMatters.length
                }
                detail="Opened during selected period"
                tone="blue"
              />

              <MetricCard
                label="Active SARs"
                value={activeSars.length}
                detail="Currently open requests"
                tone="neutral"
              />

              <MetricCard
                label="HR Resources"
                value={resources.length}
                detail="Registered resources"
                tone="green"
              />

              <MetricCard
                label="Knowledge available"
                value={
                  knowledgeSectionCount
                }
                detail="Active sections available to Leo"
                tone="green"
              />

              <MetricCard
                label={`Joiners · ${periodLabel}`}
                value={
                  periodJoiners.length
                }
                detail="Employees starting in selected period"
                tone="blue"
              />

              
            </div>
          </Section>

          <Section
            title="Recommendations"
            subtitle="Based on the information currently available, these are the areas I would recommend reviewing first."
            accent
          >
            <InsightList
              items={recommendations}
              router={router}
              context={organisationContext}
            />
          </Section>

          <Section
            title="Professional observations"
            subtitle="Patterns and context identified from the selected reporting period."
          >
            <div
              style={observationGridStyle}
            >
              {observations.map(
                (item) => (
                  <ObservationCard
                    key={item.id}
                    item={item}
                    onOpen={() => {
                      if (
                        item.actionPath
                      ) {
                        router.push(
                          item.actionPath
                        );
                      }
                    }}
                  />
                )
              )}
            </div>
          </Section>

          <Section
            title="Matter intelligence"
            subtitle={`Workplace Matter activity during ${periodLabel.toLowerCase()}.`}
          >
            <div style={metricGridStyle}>
              <SmallMetric
                label="Opened"
                value={
                  periodMatters.length
                }
              />

              <SmallMetric
                label="Closed"
                value={
                  closedMattersInPeriod.length
                }
              />

              <SmallMetric
                label="Currently open"
                value={
                  openMatters.length
                }
              />

              <SmallMetric
                label="Average age of open Matters"
                value={
                  averageOpenMatterAge ===
                  null
                    ? "No open Matters"
                    : `${averageOpenMatterAge} days`
                }
              />

              <SmallMetric
                label="Longest open Matter"
                value={
                  longestOpenMatter
                    ? `${daysSince(
                        longestOpenMatter.created_at
                      )} days`
                    : "None"
                }
              />
            </div>

            <CategoryBreakdown
              title={`Matters by type · ${periodLabel}`}
              values={mattersByType}
              emptyMessage="No Matters were opened during the selected period."
            />

            <ModuleActions
              openLabel="Open Matters"
              onOpen={() =>
                router.push(
                  "/dashboard/matters"
                )
              }
              askLabel="Discuss Matter trends with Leo"
              onAsk={() =>
                discussWithLeo(
                  `Review the organisation's Matter activity for ${periodLabel.toLowerCase()} and identify any useful observations or actions.`
                )
              }
            />
          </Section>

          <Section
            title="Workforce intelligence"
            subtitle={`Workforce measures for ${periodLabel.toLowerCase()}.`}
          >
            <div style={metricGridStyle}>
              <SmallMetric
                label="Headcount"
                value={
                  activeEmployees.length
                }
              />

              <SmallMetric
                label={`Joiners · ${periodLabel}`}
                value={
                  periodJoiners.length
                }
              />

              <SmallMetric
                label="Leavers"
                value="Connect leaver dates"
                muted
              />

              <SmallMetric
                label="Probation reviews"
                value="Connect probation data"
                muted
              />

              <SmallMetric
                label="Service anniversaries"
                value="Ready to connect"
                muted
              />

              <SmallMetric
                label="Fixed-term contracts"
                value="Connect employment data"
                muted
              />
            </div>

            <ModuleActions
              openLabel="Open Employees"
              onOpen={() =>
                router.push(
                  "/dashboard/employees"
                )
              }
              askLabel="Discuss workforce changes with Leo"
              onAsk={() =>
                discussWithLeo(
                  `Review the workforce information for ${periodLabel.toLowerCase()} and identify any useful actions or observations.`
                )
              }
            />
          </Section>

          <Section
            title="Absence intelligence"
            subtitle="This section is ready to receive live employee absence data."
          >
            <PlaceholderGrid
              items={[
                "Short-term absence",
                "Long-term absence",
                "Repeat absence",
                "Stress-related absence",
                `Average days lost · ${periodLabel}`,
                "Bradford indicators",
              ]}
            />

            <ModuleActions
              openLabel="Open Employees"
              onOpen={() =>
                router.push(
                  "/dashboard/employees"
                )
              }
              askLabel="Discuss absence management with Leo"
              onAsk={() =>
                discussWithLeo(
                  "Review the organisation information currently available and explain what absence information should be monitored or reviewed next."
                )
              }
            />
          </Section>

          <Section
            title="Compliance intelligence"
            subtitle="A calm organisation-level view of employee compliance records."
          >
            <PlaceholderGrid
              items={[
                "Overall compliance",
                "Right to Work",
                "DBS and safeguarding",
                "Driving checks",
                "Business insurance",
                "Mandatory training",
                "Qualifications",
                "Professional registrations",
              ]}
            />

            <ModuleActions
              openLabel="Open Compliance"
              onOpen={() =>
                router.push(
                  "/dashboard/compliance"
                )
              }
              askLabel="Discuss compliance priorities with Leo"
              onAsk={() =>
                discussWithLeo(
                  "Review the organisation information currently available and help me prioritise the employee compliance areas that should be checked."
                )
              }
            />
          </Section>

          <Section
            title="Learning intelligence"
            subtitle="Training and development measures will populate as Leo Learn is completed."
          >
            <PlaceholderGrid
              items={[
                "Training completion",
                "Mandatory training",
                "Training due",
                "Training past review date",
                "Manager completion",
                "Learning participation",
              ]}
            />

            <ModuleActions
              openLabel="Open Leo Learn"
              onOpen={() =>
                router.push(
                  "/dashboard/learn"
                )
              }
              askLabel="Discuss learning priorities with Leo"
              onAsk={() =>
                discussWithLeo(
                  "Review the organisation information currently available and suggest sensible learning and training priorities."
                )
              }
            />
          </Section>

          <Section
            title="Recruitment intelligence"
            subtitle="Recruitment measures will populate as Leo Talent is completed."
          >
            <PlaceholderGrid
              items={[
                "Open vacancies",
                "Applicants",
                "Interviews",
                "Offers",
                "Offer acceptance",
                `Average time to hire · ${periodLabel}`,
              ]}
            />

            <ModuleActions
              openLabel="Open Leo Talent"
              onOpen={() =>
                router.push(
                  "/dashboard/talent"
                )
              }
              askLabel="Discuss recruitment priorities with Leo"
              onAsk={() =>
                discussWithLeo(
                  "Review the organisation information currently available and suggest sensible recruitment priorities."
                )
              }
            />
          </Section>

          <Section
            title="Employee relations intelligence"
            subtitle={`Employee-relations activity during ${periodLabel.toLowerCase()}.`}
          >
            <div style={metricGridStyle}>
              {[
                "Grievance",
                "Disciplinary",
                "Investigation",
                "Capability",
                "Performance",
                "Flexible Working",
              ].map((type) => (
                <SmallMetric
                  key={type}
                  label={type}
                  value={getMatterTypeCount(
                    mattersByType,
                    type
                  )}
                />
              ))}

              <SmallMetric
                label="Repeat issues"
                value="Pattern detection ready to connect"
                muted
              />

              <SmallMetric
                label="Appeals"
                value="Connect appeal records"
                muted
              />
            </div>

            <ModuleActions
              openLabel="Open Matters"
              onOpen={() =>
                router.push(
                  "/dashboard/matters"
                )
              }
              askLabel="Discuss employee-relations patterns"
              onAsk={() =>
                discussWithLeo(
                  `Review the employee-relations Matter information for ${periodLabel.toLowerCase()} and explain any supported patterns or actions.`
                )
              }
            />
          </Section>

          <Section
            title="HR Resources intelligence"
            subtitle="Coverage and knowledge readiness across organisation resources."
          >
            <div style={metricGridStyle}>
              <SmallMetric
                label="Registered resources"
                value={resources.length}
              />

              <SmallMetric
                label="Policies"
                value={countResourcesByType(
                  resources,
                  "policy"
                )}
              />

              <SmallMetric
                label="Risk assessments"
                value={countResourcesByType(
                  resources,
                  "risk"
                )}
              />

              <SmallMetric
                label="Contracts"
                value={countResourcesByType(
                  resources,
                  "contract"
                )}
              />

              <SmallMetric
                label="Handbooks"
                value={countResourcesByType(
                  resources,
                  "handbook"
                )}
              />

              <SmallMetric
                label="Knowledge sections"
                value={
                  knowledgeSectionCount
                }
              />

              <SmallMetric
                label="Reviews due"
                value="Connect review dates"
                muted
              />

              <SmallMetric
                label="Most-used resources"
                value="Connect usage data"
                muted
              />
            </div>

            <ModuleActions
              openLabel="Open HR Resources"
              onOpen={() =>
                router.push(
                  "/dashboard/hr-resources"
                )
              }
              askLabel="Discuss resource priorities with Leo"
              onAsk={() =>
                discussWithLeo(
                  "Review the organisation's HR Resource and knowledge position and recommend which resources should be prepared or reviewed next."
                )
              }
            />
          </Section>

          <Section
            title="SAR intelligence"
            subtitle="Current Subject Access Request workload and timing."
          >
            <div style={metricGridStyle}>
              <SmallMetric
                label="Active SARs"
                value={activeSars.length}
              />

              <SmallMetric
                label="Due within 7 days"
                value={
                  sarsDueSoon.length
                }
              />

              <SmallMetric
                label="Past recorded response date"
                value={
                  sarsPastDeadline.length
                }
              />

              <SmallMetric
                label="Completed"
                value={
                  completedSars.length
                }
              />

              <SmallMetric
                label={`Average completion time · ${periodLabel}`}
                value="Available once completion dates are connected"
                muted
              />

              <SmallMetric
                label="Disclosure preparation"
                value="Open SAR workspaces"
                muted
              />
            </div>

            <ModuleActions
              openLabel="Open SAR Requests"
              onOpen={() =>
                router.push(
                  "/dashboard/sar-requests"
                )
              }
              askLabel="Discuss SAR priorities with Leo"
              onAsk={() =>
                discussWithLeo(
                  "Review the organisation's current Subject Access Request workload and recommend what should be prioritised."
                )
              }
            />
          </Section>

          <Section
            title="Audit intelligence"
            subtitle="System activity and assurance measures will populate from Audit Logs."
          >
            <PlaceholderGrid
              items={[
                "Recent activity",
                "Record changes",
                "Document changes",
                "Deleted records",
                "Permission changes",
                "Large exports",
              ]}
            />

            <ModuleActions
              openLabel="Open Audit Logs"
              onOpen={() =>
                router.push(
                  "/dashboard/audit-logs"
                )
              }
              askLabel="Discuss audit activity with Leo"
              onAsk={() =>
                discussWithLeo(
                  "Review the organisation information currently available and explain what audit activity should be monitored."
                )
              }
            />
          </Section>
        </>
      )}
    </div>
  );
}

function buildInsightsContext({
  periodLabel,
  activeEmployees,
  periodJoiners,
  openMatters,
  periodMatters,
  closedMattersInPeriod,
  mattersByType,
  averageOpenMatterAge,
  longestOpenMatter,
  activeSars,
  completedSars,
  sarsDueSoon,
  sarsPastDeadline,
  resources,
  knowledgeSectionCount,
}: {
  periodLabel: string;
  activeEmployees: EmployeeRecord[];
  periodJoiners: EmployeeRecord[];
  openMatters: MatterRecord[];
  periodMatters: MatterRecord[];
  closedMattersInPeriod: MatterRecord[];
  mattersByType: Record<
    string,
    number
  >;
  averageOpenMatterAge:
    | number
    | null;
  longestOpenMatter:
    | MatterRecord
    | null;
  activeSars: SarRecord[];
  completedSars: SarRecord[];
  sarsDueSoon: SarRecord[];
  sarsPastDeadline: SarRecord[];
  resources: ResourceRecord[];
  knowledgeSectionCount: number;
}) {
  const matterTypeLines =
    Object.entries(
      mattersByType
    ).length > 0
      ? Object.entries(
          mattersByType
        )
          .sort(
            (first, second) =>
              second[1] - first[1]
          )
          .map(
            ([type, count]) =>
              `- ${type}: ${count}`
          )
          .join("\n")
      : "- No Matters recorded during the selected period";

  const resourceTypeLines = [
    `- Policies: ${countResourcesByType(
      resources,
      "policy"
    )}`,
    `- Risk assessments: ${countResourcesByType(
      resources,
      "risk"
    )}`,
    `- Contracts: ${countResourcesByType(
      resources,
      "contract"
    )}`,
    `- Handbooks: ${countResourcesByType(
      resources,
      "handbook"
    )}`,
  ].join("\n");

  return `
LEO INSIGHTS CONTEXT

Reporting period:
${periodLabel}

Workforce:
- Active employees: ${activeEmployees.length}
- Joiners during the selected period: ${periodJoiners.length}

Matters:
- Currently open: ${openMatters.length}
- Opened during the selected period: ${periodMatters.length}
- Closed during the selected period: ${closedMattersInPeriod.length}
- Average age of currently open Matters: ${
    averageOpenMatterAge === null
      ? "No open Matters"
      : `${averageOpenMatterAge} days`
  }
- Longest-running open Matter: ${
    longestOpenMatter
      ? `${
          longestOpenMatter.subject ||
          longestOpenMatter.title
        } — ${daysSince(
          longestOpenMatter.created_at
        )} days`
      : "None"
  }

Matters by type:
${matterTypeLines}

Subject Access Requests:
- Active SARs: ${activeSars.length}
- Completed or closed SARs: ${completedSars.length}
- Due within 7 days: ${sarsDueSoon.length}
- Past the currently recorded response date: ${sarsPastDeadline.length}

HR Resources:
- Registered resources: ${resources.length}
${resourceTypeLines}
- Active knowledge sections available to Leo: ${knowledgeSectionCount}

Professional instructions:
Use the organisation data above directly.
Do not ask the employer to repeat information already included.
Do not invent figures, trends, departments, managers, absence information, compliance results or outcomes that are not provided.
Keep observations proportionate to the organisation's size and the limited sample.
Distinguish clearly between supported observations and areas where more data is needed.
`.trim();
}

function openAskLeo(
  router: RouterLike,
  prompt: string,
  context: string
) {
  const fullPrompt = `${context}

EMPLOYER REQUEST

${prompt}`;

  router.push(
    `/dashboard/ask-leo?prompt=${encodeURIComponent(
      fullPrompt
    )}`
  );
}

function Section({
  title,
  subtitle,
  accent = false,
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        ...sectionStyle,
        ...(accent
          ? accentSectionStyle
          : {}),
      }}
    >
      <div style={sectionHeaderStyle}>
        <h2 style={sectionTitleStyle}>
          {title}
        </h2>

        {subtitle && (
          <p style={sectionSubtitleStyle}>
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function BriefListSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: Array<{
    title: string;
    detail: string;
  }>;
  emptyMessage: string;
}) {
  return (
    <section style={briefListSectionStyle}>
      <h4 style={briefListTitleStyle}>
        {title}
      </h4>

      {items.length === 0 ? (
        <p style={briefEmptyStyle}>
          {emptyMessage}
        </p>
      ) : (
        <div style={briefListStyle}>
          {items.map((item) => (
            <article
              key={`${title}-${item.title}`}
              style={briefListItemStyle}
            >
              <strong style={briefItemTitleStyle}>
                {item.title}
              </strong>

              <p style={briefItemTextStyle}>
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone:
    | "neutral"
    | "purple"
    | "blue"
    | "green"
    | "amber";
}) {
  return (
    <div
      style={{
        ...metricCardStyle,
        ...getMetricToneStyle(
          tone
        ),
      }}
    >
      <div style={metricLabelStyle}>
        {label}
      </div>

      <div style={metricValueStyle}>
        {value}
      </div>

      <div style={metricDetailStyle}>
        {detail}
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        ...smallMetricStyle,
        ...(muted
          ? mutedMetricStyle
          : {}),
      }}
    >
      <div
        style={smallMetricLabelStyle}
      >
        {label}
      </div>

      <div
        style={smallMetricValueStyle}
      >
        {value}
      </div>
    </div>
  );
}

function InsightList({
  items,
  router,
  context,
}: {
  items: InsightItem[];
  router: RouterLike;
  context: string;
}) {
  return (
    <div style={insightListStyle}>
      {items.map((item) => (
        <div
          key={item.id}
          style={insightItemStyle}
        >
          <div style={insightContentStyle}>
            <div
              style={insightTitleStyle}
            >
              {item.title}
            </div>

            <div
              style={insightDetailStyle}
            >
              {item.detail}
            </div>

            {(item.actionPath ||
              item.askLeoPrompt) && (
              <div
                style={
                  insightActionStyle
                }
              >
                {item.actionPath && (
                  <button
                    onClick={() =>
                      router.push(
                        item.actionPath!
                      )
                    }
                    style={smallButtonStyle}
                  >
                    {item.actionLabel ||
                      "Open"}
                  </button>
                )}

                {item.askLeoPrompt && (
                  <button
                    onClick={() =>
                      openAskLeo(
                        router,
                        item.askLeoPrompt!,
                        context
                      )
                    }
                    style={
                      askLeoButtonStyle
                    }
                  >
                    Ask Leo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ObservationCard({
  item,
  onOpen,
}: {
  item: InsightItem;
  onOpen: () => void;
}) {
  return (
    <div
      style={observationCardStyle}
    >
      <div
        style={observationTitleStyle}
      >
        {item.title}
      </div>

      <div
        style={observationDetailStyle}
      >
        {item.detail}
      </div>

      {item.actionPath && (
        <button
          onClick={onOpen}
          style={textButtonStyle}
        >
          {item.actionLabel ||
            "Open"}
        </button>
      )}
    </div>
  );
}

function CategoryBreakdown({
  title,
  values,
  emptyMessage,
}: {
  title: string;
  values: Record<
    string,
    number
  >;
  emptyMessage: string;
}) {
  const entries =
    Object.entries(values).sort(
      (first, second) =>
        second[1] - first[1]
    );

  const highest =
    entries[0]?.[1] || 1;

  return (
    <div style={breakdownStyle}>
      <div
        style={breakdownTitleStyle}
      >
        {title}
      </div>

      {entries.length === 0 ? (
        <div
          style={emptyMessageStyle}
        >
          {emptyMessage}
        </div>
      ) : (
        <div
          style={breakdownListStyle}
        >
          {entries.map(
            ([label, value]) => (
              <div
                key={label}
                style={
                  breakdownItemStyle
                }
              >
                <div
                  style={
                    breakdownHeaderStyle
                  }
                >
                  <span>{label}</span>
                  <strong>
                    {value}
                  </strong>
                </div>

                <div
                  style={barTrackStyle}
                >
                  <div
                    style={{
                      ...barFillStyle,
                      width: `${
                        (value /
                          highest) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function PlaceholderGrid({
  items,
}: {
  items: string[];
}) {
  return (
    <div style={metricGridStyle}>
      {items.map((item) => (
        <SmallMetric
          key={item}
          label={item}
          value="Ready to connect"
          muted
        />
      ))}
    </div>
  );
}

function ModuleActions({
  openLabel,
  askLabel,
  onOpen,
  onAsk,
}: {
  openLabel: string;
  askLabel: string;
  onOpen: () => void;
  onAsk: () => void;
}) {
  return (
    <div
      style={moduleActionsStyle}
    >
      <button
        onClick={onOpen}
        style={secondaryButtonStyle}
      >
        {openLabel}
      </button>

      <button
        onClick={onAsk}
        style={askLeoButtonStyle}
      >
        {askLabel}
      </button>
    </div>
  );
}

function getPeriodStart(
  period: TimePeriod
): Date | null {
  if (period === "all_time") {
    return null;
  }

  const date = new Date();

  if (period === "30_days") {
    date.setDate(
      date.getDate() - 30
    );
    return date;
  }

  if (period === "quarter") {
    date.setMonth(
      date.getMonth() - 3
    );
    return date;
  }

  if (period === "6_months") {
    date.setMonth(
      date.getMonth() - 6
    );
    return date;
  }

  date.setFullYear(
    date.getFullYear() - 1
  );

  return date;
}

function isWithinPeriod(
  value: string | null,
  periodStart: Date | null
) {
  if (!value) {
    return false;
  }

  if (!periodStart) {
    return true;
  }

  const date = new Date(value);

  return (
    Number.isFinite(
      date.getTime()
    ) &&
    date >= periodStart
  );
}

function isClosedMatterStatus(
  status: string | null
) {
  return (
    status === "Closed" ||
    status === "Completed"
  );
}

function daysSince(
  value: string | null
) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() -
        date.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function countBy<T>(
  records: T[],
  getKey: (record: T) => string
): Record<string, number> {
  return records.reduce<
    Record<string, number>
  >((counts, record) => {
    const key = getKey(record);

    counts[key] =
      (counts[key] || 0) + 1;

    return counts;
  }, {});
}

function getMatterTypeCount(
  counts: Record<
    string,
    number
  >,
  requestedType: string
) {
  const entry =
    Object.entries(counts).find(
      ([type]) =>
        type
          .toLowerCase()
          .includes(
            requestedType.toLowerCase()
          )
    );

  return entry?.[1] || 0;
}

function countResourcesByType(
  resources: ResourceRecord[],
  searchValue: string
) {
  return resources.filter(
    (resource) =>
      `${resource.name} ${resource.register_type}`
        .toLowerCase()
        .includes(
          searchValue.toLowerCase()
        )
  ).length;
}

function getSarDeadlineState(
  sar: SarRecord
):
  | "On track"
  | "Due Soon"
  | "Past planned date"
  | "Completed" {
  if (
    sar.status === "Completed" ||
    sar.status === "Closed"
  ) {
    return "Completed";
  }

  const effectiveDeadline =
    sar.extended_due_date ||
    sar.response_due_date;

  const deadline = new Date(
    `${effectiveDeadline}T23:59:59`
  );

  const differenceInDays =
    Math.ceil(
      (deadline.getTime() -
        Date.now()) /
        (1000 * 60 * 60 * 24)
    );

  if (differenceInDays < 0) {
    return "Past planned date";
  }

  if (differenceInDays <= 7) {
    return "Due Soon";
  }

  return "On track";
}

function formatBriefItems(
  items: Array<{
    title: string;
    detail: string;
  }>
) {
  if (items.length === 0) {
    return ["- No items recorded."];
  }

  return items.flatMap((item) => [
    `- ${item.title}`,
    `  ${item.detail}`,
  ]);
}

function toDateStamp(date: Date) {
  const year = String(
    date.getFullYear()
  );

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMetricToneStyle(
  tone:
    | "neutral"
    | "purple"
    | "blue"
    | "green"
    | "amber"
): React.CSSProperties {
  if (tone === "purple") {
    return {
      background: "#FBF8FD",
      borderColor: "#E8DDF0",
    };
  }

  if (tone === "blue") {
    return {
      background: "#F7FAFF",
      borderColor: "#DCE8F8",
    };
  }

  if (tone === "green") {
    return {
      background: "#F7FFF9",
      borderColor: "#D7F1DE",
    };
  }

  if (tone === "amber") {
    return {
      background: "#FFFCF5",
      borderColor: "#F2E3BC",
    };
  }

  return {
    background: "#FFFFFF",
    borderColor: "#E5E7EB",
  };
}

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1450px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "20px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "28px",
  fontWeight: 700,
};

const subtitleStyle: React.CSSProperties = {
  margin: "7px 0 0",
  maxWidth: "760px",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const updatedStyle: React.CSSProperties = {
  marginTop: "9px",
  color: "#9CA3AF",
  fontSize: "11px",
};

const headerActionStyle: React.CSSProperties = {
  minWidth: "190px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const primaryActionButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "10px",
  background: "#1D4ED8",
  color: "#FFFFFF",
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryActionButtonStyle: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  color: "#374151",
  padding: "10px 12px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const periodLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "5px",
  color: "#6B7280",
  fontSize: "11px",
  fontWeight: 700,
};

const periodSelectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 11px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  background: "#FFFFFF",
  color: "#374151",
  fontSize: "13px",
};

const loadingStyle: React.CSSProperties = {
  padding: "30px",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  background: "#FFFFFF",
  color: "#6B7280",
  textAlign: "center",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "18px",
  padding: "20px",
  border: "1px solid #E5E7EB",
  borderRadius: "15px",
  background: "#FFFFFF",
};

const accentSectionStyle: React.CSSProperties = {
  borderColor: "#E8DDF0",
  background: "#FBF8FD",
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: "16px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "17px",
  fontWeight: 700,
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.55,
};

const briefPanelStyle: React.CSSProperties = {
  display: "grid",
  gap: "20px",
};

const briefHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const briefTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "18px",
  fontWeight: 700,
};

const briefHeadlineStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#4B5563",
  fontSize: "13px",
  lineHeight: 1.65,
  maxWidth: "78ch",
};

const briefNoticeStyle: React.CSSProperties = {
  borderRadius: "999px",
  background: "#EEF2FF",
  color: "#4338CA",
  padding: "8px 12px",
  fontSize: "11px",
  fontWeight: 700,
};

const briefCountsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "10px",
};

const briefCountCardStyle: React.CSSProperties = {
  padding: "14px",
  border: "1px solid #DCE8F8",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const briefCountLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#6B7280",
  fontSize: "11px",
};

const briefCountValueStyle: React.CSSProperties = {
  display: "block",
  marginTop: "8px",
  color: "#111827",
  fontSize: "18px",
};

const briefSectionsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "12px",
};

const briefListSectionStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
  padding: "14px",
};

const briefListTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
};

const briefListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
  marginTop: "12px",
};

const briefListItemStyle: React.CSSProperties = {
  display: "grid",
  gap: "5px",
};

const briefItemTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "12px",
};

const briefItemTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.6,
};

const briefEmptyStyle: React.CSSProperties = {
  margin: "12px 0 0",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.55,
};

const executiveGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "11px",
};

const metricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "10px",
};

const metricCardStyle: React.CSSProperties = {
  minHeight: "105px",
  padding: "15px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const metricLabelStyle: React.CSSProperties = {
  marginBottom: "8px",
  color: "#6B7280",
  fontSize: "11px",
};

const metricValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: 700,
};

const metricDetailStyle: React.CSSProperties = {
  marginTop: "7px",
  color: "#6B7280",
  fontSize: "10px",
  lineHeight: 1.45,
};

const smallMetricStyle: React.CSSProperties = {
  minHeight: "82px",
  padding: "13px",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
  background: "#FFFFFF",
};

const mutedMetricStyle: React.CSSProperties = {
  background: "#FAFAFA",
};

const smallMetricLabelStyle: React.CSSProperties = {
  marginBottom: "8px",
  color: "#6B7280",
  fontSize: "11px",
};

const smallMetricValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.4,
};

const insightListStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const insightItemStyle: React.CSSProperties = {
  padding: "13px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FFFFFF",
};

const insightContentStyle: React.CSSProperties = {
  minWidth: 0,
};

const insightTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
};

const insightDetailStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.55,
};

const insightActionStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "10px",
};

const observationGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "10px",
};

const observationCardStyle: React.CSSProperties = {
  padding: "14px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FAFAFA",
};

const observationTitleStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: "13px",
  fontWeight: 700,
};

const observationDetailStyle: React.CSSProperties = {
  marginTop: "6px",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.55,
};

const breakdownStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "14px",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  background: "#FAFAFA",
};

const breakdownTitleStyle: React.CSSProperties = {
  marginBottom: "12px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const breakdownListStyle: React.CSSProperties = {
  display: "grid",
  gap: "11px",
};

const breakdownItemStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
};

const breakdownHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  color: "#4B5563",
  fontSize: "11px",
};

const barTrackStyle: React.CSSProperties = {
  height: "7px",
  borderRadius: "999px",
  background: "#E5E7EB",
  overflow: "hidden",
};

const barFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "#8B6B9D",
};

const emptyMessageStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
};

const moduleActionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "9px",
  marginTop: "16px",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  background: "#FFFFFF",
  color: "#4B5563",
  padding: "8px 11px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const smallButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  padding: "6px 9px",
};

const askLeoButtonStyle: React.CSSProperties = {
  border: "1px solid #D8C8E5",
  borderRadius: "9px",
  background: "#F7F1FC",
  color: "#6E5084",
  padding: "8px 11px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const textButtonStyle: React.CSSProperties = {
  marginTop: "9px",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};