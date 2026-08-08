import { runLeoCore } from "../core/router";
import { runLeoReasoning } from "../reasoning/reasoner";
import { searchKnowledge } from "../knowledge";

export type InsightRisk = {
  title: string;
  severity: "low" | "medium" | "high";
  detail: string;
};

export type InsightTrend = {
  title: string;
  detail: string;
};

export type InsightRecommendation = {
  title: string;
  detail: string;
  actionPath?: string;
  askLeoPrompt?: string;
};

export type InsightEarlyIntervention = {
  title: string;
  detail: string;
};

export type LeoInsightOutput = {
  summary: string;
  risks: InsightRisk[];
  trends: InsightTrend[];
  recommendations: InsightRecommendation[];
  earlyInterventions: InsightEarlyIntervention[];
};

type InsightInput = {
  periodLabel: string;
  periodKey?: "30_days" | "quarter" | "6_months" | "12_months" | "all_time";
  employees?: Array<{ id: number; name: string; status?: string | null; start_date?: string | null }>;
  matters?: Array<{ id: number; title: string; subject?: string | null; status?: string | null; matter_type?: string | null; created_at?: string | null }>;
  sars?: Array<{ id: number; request_title: string; employee_id: number; matter_id?: number | null; status?: string; response_due_date?: string | null; extended_due_date?: string | null; created_at?: string | null }>;
  resources?: Array<{ id: number; name: string; register_type?: string | null }>;
  knowledgeSectionCount?: number;
};

export function buildLeoInsight(input: InsightInput): LeoInsightOutput {
  const periodStart = getPeriodStart(input.periodKey);
  const activeMatters = (input.matters || []).filter((matter) => !isClosedMatterStatus(matter.status));
  const activeSars = (input.sars || []).filter((sar) => sar.status !== "Completed" && sar.status !== "Closed");
  const dueSoonSars = activeSars.filter((sar) => isDueSoon(sar.response_due_date));
  const pastDueSars = activeSars.filter((sar) => isPastDue(sar.response_due_date));
  const periodMatters = (input.matters || []).filter((matter) => isWithinPeriod(matter.created_at, periodStart));
  const periodSars = (input.sars || []).filter((sar) => isWithinPeriod(sar.created_at, periodStart));
  const joiners = (input.employees || []).filter((employee) => isWithinPeriod(employee.start_date, periodStart));
  const knowledgeReady = (input.knowledgeSectionCount || 0) > 0;

  const message = [
    input.periodLabel,
    activeMatters.length,
    activeSars.length,
    dueSoonSars.length,
    pastDueSars.length,
    joiners.length,
    knowledgeReady ? "knowledge-ready" : "knowledge-light",
  ].join(" ");

  const core = runLeoCore(message);
  const reasoning = runLeoReasoning(core, message);
  const knowledge = searchKnowledge({ message, organisationKnowledge: [] });

  const risks: InsightRisk[] = [];
  if (pastDueSars.length > 0) {
    risks.push({
      title: "SAR deadlines are slipping",
      severity: "high",
      detail: `${pastDueSars.length} active SAR${pastDueSars.length === 1 ? "" : "s"} are past the recorded response date.`,
    });
  }
  if (activeMatters.length > 0) {
    risks.push({
      title: "Open matters may be aging without clear intervention",
      severity: "medium",
      detail: `${activeMatters.length} matter${activeMatters.length === 1 ? "" : "s"} remain open and may need a fresh review of stage and owner.`,
    });
  }
  if (dueSoonSars.length > 0) {
    risks.push({
      title: "Upcoming deadlines need prioritisation",
      severity: "medium",
      detail: `${dueSoonSars.length} active SAR${dueSoonSars.length === 1 ? "" : "s"} are approaching their response date.`,
    });
  }
  if (risks.length === 0) {
    risks.push({
      title: "No immediate risk pattern identified",
      severity: "low",
      detail: "The current snapshot does not show a material risk trend based on available records.",
    });
  }

  const trends: InsightTrend[] = [];
  if (joiners.length > 0) {
    trends.push({
      title: "Workforce growth is present",
      detail: `${joiners.length} new starter${joiners.length === 1 ? "" : "s"} were recorded in the selected period.`,
    });
  }
  if (periodMatters.length > 0) {
    trends.push({
      title: "Matter activity was recorded in the selected period",
      detail: `${periodMatters.length} matter${periodMatters.length === 1 ? " was" : "s were"} opened during ${input.periodLabel.toLowerCase()}.`,
    });
  }
  if (activeMatters.length > 0) {
    trends.push({
      title: "Matter workload remains active",
      detail: `${activeMatters.length} open matter${activeMatters.length === 1 ? "" : "s"} indicate continuing operational demand.`,
    });
  }
  if (periodSars.length > 0) {
    trends.push({
      title: "SAR demand remains visible",
      detail: `${periodSars.length} subject access ${periodSars.length === 1 ? "request was" : "requests were"} recorded during ${input.periodLabel.toLowerCase()}.`,
    });
  }
  if (knowledge.sources.length > 0) {
    trends.push({
      title: "Knowledge is available for proactive support",
      detail: `${knowledge.sources.length} knowledge source${knowledge.sources.length === 1 ? "" : "s"} were surfaced to inform the recommendation.`,
    });
  }
  if (trends.length === 0) {
    trends.push({
      title: "No notable trend identified",
      detail: "The available data is too limited to support a strong trend observation.",
    });
  }

  const recommendations: InsightRecommendation[] = [
    {
      title: "Review the highest-risk open case first",
      detail: "Prioritise the most urgent open matter or SAR so the next action is clear and the response remains proportionate.",
      actionPath: "/dashboard/matters",
      askLeoPrompt: "Review the organisation's current workload and identify the highest-priority matter that should be addressed next.",
    },
  ];
  if (pastDueSars.length > 0) {
    recommendations.push({
      title: "Escalate overdue SAR handling",
      detail: "Overdue SARs should be reviewed immediately for ownership, timing and any escalation requirement.",
      actionPath: "/dashboard/sar-requests",
      askLeoPrompt: "Review the overdue SARs and recommend what should happen next.",
    });
  }
  if (knowledgeReady) {
    recommendations.push({
      title: "Refresh the most relevant HR resources",
      detail: "Use the available knowledge base to update or prepare the policies and resources most likely to support live cases.",
      actionPath: "/dashboard/hr-resources",
      askLeoPrompt: "Review the organisation's HR resources and recommend which should be prepared or refreshed next.",
    });
  }

  const earlyInterventions: InsightEarlyIntervention[] = [];
  if (pastDueSars.length > 0) {
    earlyInterventions.push({
      title: "Intervene on overdue SARs",
      detail: "Contact the responsible owner and confirm the next action, deadline and communications plan.",
    });
  }
  if (activeMatters.length > 0) {
    earlyInterventions.push({
      title: "Reconfirm the current stage for open matters",
      detail: "Make sure each active matter has an owner, next step and an expected review point.",
    });
  }
  if (joiners.length > 0) {
    earlyInterventions.push({
      title: "Support new joiners with onboarding readiness",
      detail: "Use the new starter data to ensure onboarding, documents and policy access are in place early.",
    });
  }
  if (earlyInterventions.length === 0) {
    earlyInterventions.push({
      title: "Maintain routine oversight",
      detail: "Continue regular review of the current data set and update records as new issues emerge.",
    });
  }

  return {
    summary: `${input.periodLabel} summary: ${periodMatters.length} ${periodMatters.length === 1 ? "matter" : "matters"} opened, ${activeMatters.length} open ${activeMatters.length === 1 ? "matter" : "matters"}, ${activeSars.length} active ${activeSars.length === 1 ? "SAR" : "SARs"}. ${reasoning.professionalRecommendation}`.slice(0, 240),
    risks,
    trends,
    recommendations,
    earlyInterventions,
  };
}

function getPeriodStart(periodKey: InsightInput["periodKey"]): Date | null {
  const now = new Date();

  switch (periodKey) {
    case "30_days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return start;
    }
    case "quarter": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return start;
    }
    case "6_months": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      return start;
    }
    case "12_months": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 12);
      return start;
    }
    case "all_time":
      return null;
    default: {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return start;
    }
  }
}

function isClosedMatterStatus(status: string | null | undefined) {
  return status === "Closed" || status === "Completed" || status === "Archived";
}

function isDueSoon(value: string | null | undefined) {
  if (!value) return false;
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;
  const deltaDays = Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return deltaDays >= 0 && deltaDays <= 7;
}

function isPastDue(value: string | null | undefined) {
  if (!value) return false;
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;
  return dueDate.getTime() < Date.now();
}

function isWithinPeriod(value: string | null | undefined, periodStart: Date | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (!periodStart) return true;
  return date.getTime() >= periodStart.getTime();
}
