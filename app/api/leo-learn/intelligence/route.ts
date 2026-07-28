import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { runLeoCore } from "@/leo/core/router";
import { buildDraftDocument } from "@/leo/draft/engine";
import { buildLeoInsight } from "@/leo/insight/engine";
import { searchKnowledge } from "@/leo/knowledge";
import { buildDecisionFramework } from "@/leo/reasoning/decisionFramework";
import { runLeoReasoning } from "@/leo/reasoning/reasoner";
import { runProfessionalThinking } from "@/leo/thinking/model";

export const dynamic = "force-dynamic";

type AccessContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
};

type LearnIntelligenceSection =
  | "dashboard"
  | "library"
  | "pathways"
  | "learning"
  | "qualifications"
  | "ai-studio"
  | "analytics";

type FoundationRow = {
  section: string | null;
  key: string | null;
  value: string | null;
};

type OrganisationMemoryRow = {
  id: string;
  title: string;
  content: string;
  keywords: string[] | null;
  is_active: boolean | null;
};

type LearningSnapshot = {
  employeesTotal: number;
  employeesActive: number;
  modulesTotal: number;
  modulesPublished: number;
  assignmentsTotal: number;
  assignmentsInProgress: number;
  assignmentsCompleted: number;
  assignmentsPastDue: number;
  pathwaysTotal: number;
  pathwaysPublished: number;
  pathwaysDueForReview: number;
  qualificationsTotal: number;
  qualificationsCurrent: number;
  qualificationsDueForRenewal: number;
  qualificationsExpired: number;
  qualificationsPendingVerification: number;
  aiProjectsTotal: number;
  aiProjectsInFlight: number;
  aiProjectsAwaitingReview: number;
};

type LearningModuleRow = {
  id: number;
  status: string | null;
};

type LearningAssignmentRow = {
  id: number;
  status: string | null;
  due_date: string | null;
  progress_percent: number | null;
  manager_validation_status: string | null;
};

type PathwayRow = {
  id: number;
  status: string | null;
  next_review_date: string | null;
};

type QualificationRow = {
  id: number;
  status: string | null;
  verification_status: string | null;
  mandatory: boolean | null;
  expiry_date: string | null;
};

type AIProjectRow = {
  id: number;
  status: string | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function uniqueText(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function toSection(value: string | null): LearnIntelligenceSection {
  const parsed = text(value).toLowerCase();

  switch (parsed) {
    case "library":
    case "pathways":
    case "learning":
    case "qualifications":
    case "ai-studio":
    case "analytics":
    case "dashboard":
      return parsed;
    default:
      return "dashboard";
  }
}

function isPastDue(dateValue: string | null | undefined): boolean {
  if (!dateValue) return false;

  const dueDate = new Date(`${dateValue}T12:00:00`);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate.getTime() < Date.now();
}

async function requireAuthorisedContext(): Promise<
  | { ok: true; context: AccessContext }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      ),
    };
  }

  const { data: organisationId, error: organisationError } = await supabase.rpc(
    "leo_current_organisation_id",
  );

  if (organisationError || typeof organisationId !== "string" || !organisationId) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .in("membership_status", ["active", "accepted"])
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have active access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    context: {
      supabase,
      organisationId,
    },
  };
}

async function loadFoundations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
) {
  const { data, error } = await supabase
    .from("organisation_foundations")
    .select("section,key,value")
    .eq("organisation_id", organisationId);

  if (error) {
    return [] as FoundationRow[];
  }

  return (data || []) as FoundationRow[];
}

async function loadOrganisationMemory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
) {
  const { data, error } = await supabase
    .from("leo_organisation_memory_records")
    .select("id,title,content,keywords,is_active,status")
    .eq("organisation_id", organisationId)
    .eq("is_active", true)
    .in("status", ["approved", "published", "active"])
    .order("updated_at", { ascending: false })
    .limit(80);

  if (error) {
    return [] as OrganisationMemoryRow[];
  }

  return (data || []) as OrganisationMemoryRow[];
}

async function loadSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
) {
  const [
    employeesResult,
    modulesResult,
    assignmentsResult,
    pathwaysResult,
    qualificationsResult,
    aiProjectsResult,
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, status, name, start_date")
      .eq("organisation_id", organisationId),

    supabase
      .from("learning_modules")
      .select("id, status")
      .eq("organisation_id", organisationId)
      .eq("is_archived", false),

    supabase
      .from("learning_assignments")
      .select("id, status, due_date, progress_percent, manager_validation_status, employees!learning_assignments_employee_id_fkey!inner(id, organisation_id)")
      .eq("employees.organisation_id", organisationId)
      .eq("is_archived", false),

    supabase
      .from("development_pathways")
      .select("id, status, next_review_date")
      .eq("organisation_id", organisationId)
      .eq("is_archived", false),

    supabase
      .from("employee_qualifications")
      .select("id, status, verification_status, mandatory, expiry_date, employees!employee_qualifications_employee_id_fkey!inner(id, organisation_id)")
      .eq("employees.organisation_id", organisationId)
      .eq("is_archived", false),

    supabase
      .from("learning_ai_projects")
      .select("id, status")
      .eq("organisation_id", organisationId)
      .eq("is_archived", false),
  ]);

  const employees = (employeesResult.data || []) as Array<{
    id: number;
    name: string | null;
    status: string | null;
    start_date: string | null;
  }>;

  const modules = (modulesResult.data || []) as LearningModuleRow[];
  const assignments = (assignmentsResult.data || []) as LearningAssignmentRow[];
  const pathways = (pathwaysResult.data || []) as PathwayRow[];
  const qualifications = (qualificationsResult.data || []) as QualificationRow[];
  const aiProjects = (aiProjectsResult.data || []) as AIProjectRow[];

  const snapshot: LearningSnapshot = {
    employeesTotal: employees.length,
    employeesActive: employees.filter((row) => text(row.status) !== "Archived").length,
    modulesTotal: modules.length,
    modulesPublished: modules.filter((row) => text(row.status) === "Published").length,
    assignmentsTotal: assignments.length,
    assignmentsInProgress: assignments.filter(
      (row) => text(row.status) === "Assigned" || text(row.status) === "In Progress",
    ).length,
    assignmentsCompleted: assignments.filter((row) => text(row.status) === "Completed").length,
    assignmentsPastDue: assignments.filter(
      (row) => text(row.status) !== "Completed" && text(row.status) !== "Cancelled" && isPastDue(row.due_date),
    ).length,
    pathwaysTotal: pathways.length,
    pathwaysPublished: pathways.filter((row) => text(row.status) === "Published").length,
    pathwaysDueForReview: pathways.filter((row) => isPastDue(row.next_review_date)).length,
    qualificationsTotal: qualifications.length,
    qualificationsCurrent: qualifications.filter((row) => text(row.status) === "Current").length,
    qualificationsDueForRenewal: qualifications.filter(
      (row) => text(row.status) === "Due for Renewal",
    ).length,
    qualificationsExpired: qualifications.filter((row) => text(row.status) === "Expired").length,
    qualificationsPendingVerification: qualifications.filter(
      (row) => text(row.verification_status) === "Pending Verification",
    ).length,
    aiProjectsTotal: aiProjects.length,
    aiProjectsInFlight: aiProjects.filter(
      (row) => ["Draft", "In Progress"].includes(text(row.status)),
    ).length,
    aiProjectsAwaitingReview: aiProjects.filter((row) => text(row.status) === "Awaiting Review").length,
  };

  return {
    snapshot,
    employees,
  };
}

function buildSectionMessage(section: LearnIntelligenceSection, snapshot: LearningSnapshot): string {
  const sectionFocus: Record<LearnIntelligenceSection, string> = {
    dashboard:
      "learning priorities, capability development signals, professional-development momentum and immediate next actions",
    library:
      "content quality, learning coverage, review cadence and gaps in role readiness learning",
    pathways:
      "pathway sequencing, progression quality, onboarding depth and manager-led development planning",
    learning:
      "assignment completion, overdue learning recovery, manager validation and capability uplift",
    qualifications:
      "qualification compliance, renewal risk mitigation, evidence standards and verification quality",
    "ai-studio":
      "learning design acceleration, professional quality controls and practical publication readiness",
    analytics:
      "cross-workforce capability trends, compliance-driven training risk, and practical development strategy",
  };

  return [
    `Leo Learn section: ${section}.`,
    `Active employees: ${snapshot.employeesActive}.`,
    `Learning modules available: ${snapshot.modulesTotal}, with ${snapshot.modulesPublished} published.`,
    `Assignments active: ${snapshot.assignmentsInProgress} of ${snapshot.assignmentsTotal}.`,
    `Assignments completed: ${snapshot.assignmentsCompleted}.`,
    `Assignments past due: ${snapshot.assignmentsPastDue}.`,
    `Pathways published: ${snapshot.pathwaysPublished} of ${snapshot.pathwaysTotal}.`,
    `Pathways due review: ${snapshot.pathwaysDueForReview}.`,
    `Qualifications current: ${snapshot.qualificationsCurrent} of ${snapshot.qualificationsTotal}.`,
    `Qualifications due for renewal: ${snapshot.qualificationsDueForRenewal}.`,
    `Qualifications expired: ${snapshot.qualificationsExpired}.`,
    `Qualifications pending verification: ${snapshot.qualificationsPendingVerification}.`,
    `AI Studio projects in flight: ${snapshot.aiProjectsInFlight} of ${snapshot.aiProjectsTotal}.`,
    `AI Studio projects awaiting review: ${snapshot.aiProjectsAwaitingReview}.`,
    `Focus on ${sectionFocus[section]}.`,
    "Provide contextual learning recommendations, capability insights, compliance-driven training guidance, draft learning plans and practical professional development suggestions.",
    "Ground all recommendations in organisation foundations and approved organisation memory when available.",
  ].join(" ");
}

function buildComplianceGuidance(snapshot: LearningSnapshot): string[] {
  const guidance: string[] = [];

  if (snapshot.qualificationsExpired > 0) {
    guidance.push(
      `Prioritise expired credentials first by assigning immediate refresher learning and manager validation for ${snapshot.qualificationsExpired} record${snapshot.qualificationsExpired === 1 ? "" : "s"}.`,
    );
  }

  if (snapshot.qualificationsDueForRenewal > 0) {
    guidance.push(
      `Create a renewal pathway for at-risk qualifications and set due dates for the ${snapshot.qualificationsDueForRenewal} credential${snapshot.qualificationsDueForRenewal === 1 ? "" : "s"} due for renewal.`,
    );
  }

  if (snapshot.qualificationsPendingVerification > 0) {
    guidance.push(
      `Close verification gaps by scheduling evidence checks for ${snapshot.qualificationsPendingVerification} pending record${snapshot.qualificationsPendingVerification === 1 ? "" : "s"}.`,
    );
  }

  if (guidance.length === 0) {
    guidance.push(
      "Maintain compliance confidence by continuing scheduled renewal and verification checks, with evidence quality spot-checks each cycle.",
    );
  }

  return guidance;
}

function buildCapabilityInsights(snapshot: LearningSnapshot): string[] {
  const insights: string[] = [];

  if (snapshot.assignmentsInProgress > snapshot.assignmentsCompleted) {
    insights.push(
      "More people are currently in learning than completing it, indicating strong activity but potential completion drag.",
    );
  }

  if (snapshot.assignmentsPastDue > 0) {
    insights.push(
      `Past-due assignments indicate capability friction that may require manager-led support and sequencing changes (${snapshot.assignmentsPastDue} overdue).`,
    );
  }

  if (snapshot.pathwaysPublished === 0 && snapshot.modulesPublished > 0) {
    insights.push(
      "Published learning exists without published pathways, suggesting an opportunity to convert ad hoc learning into structured progression.",
    );
  }

  if (snapshot.modulesPublished === 0) {
    insights.push(
      "No published modules are currently available, which limits organisation-wide capability progression.",
    );
  }

  if (insights.length === 0) {
    insights.push(
      "Current learning and pathway signals indicate a stable capability baseline, with room to deepen role-specific progression plans.",
    );
  }

  return insights;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const section = toSection(url.searchParams.get("section"));

    const auth = await requireAuthorisedContext();

    if (!auth.ok) {
      return auth.response;
    }

    const { supabase, organisationId } = auth.context;

    const [{ snapshot, employees }, foundations, organisationMemory] = await Promise.all([
      loadSnapshot(supabase, organisationId),
      loadFoundations(supabase, organisationId),
      loadOrganisationMemory(supabase, organisationId),
    ]);

    const organisationKnowledge = foundations
      .map((item, index) => ({
        id: `${text(item.section) || "foundation"}-${text(item.key) || "item"}-${index}`,
        type: "organisation_memory" as const,
        title: `${text(item.section) || "Foundation"} · ${text(item.key) || "Item"}`,
        content: text(item.value),
        keywords: [text(item.section), text(item.key)].filter(Boolean),
        source: "foundation" as const,
        active: true,
      }))
      .filter((item) => Boolean(item.content));

    const organisationMemoryItems = organisationMemory.map((item) => ({
      id: item.id,
      organisationId,
      type: "operational_rule" as const,
      title: item.title,
      content: item.content,
      keywords: item.keywords || [],
      active: item.is_active !== false,
      source: "system" as const,
    }));

    const draftMemory = organisationMemory.map((item) => ({
      title: item.title,
      content: item.content,
      keywords: item.keywords || [],
    }));

    const contextMessage = buildSectionMessage(section, snapshot);
    const thinking = runProfessionalThinking(contextMessage);
    const core = runLeoCore(contextMessage);
    const reasoning = runLeoReasoning(core, contextMessage);
    const decision = buildDecisionFramework(core, reasoning, contextMessage);

    const knowledge = searchKnowledge({
      message: contextMessage,
      organisationKnowledge,
      organisationMemory: organisationMemoryItems,
    });

    const draft = buildDraftDocument({
      message: contextMessage,
      matterId: 0,
      organisationId,
      organisationKnowledge,
      organisationMemory: draftMemory,
      documentType: "general_hr_document",
    });

    const insight = buildLeoInsight({
      periodLabel: `Leo Learn ${section} intelligence snapshot`,
      employees: employees.slice(0, 80).map((employee) => ({
        id: employee.id,
        name: employee.name || `Employee ${employee.id}`,
        status: employee.status,
        start_date: employee.start_date,
      })),
      knowledgeSectionCount: knowledge.sources.length,
    });

    const recommendations = uniqueText([
      ...reasoning.recommendedSteps.slice(0, 3),
      ...insight.recommendations.map((item) => item.detail).slice(0, 2),
    ]).slice(0, 5);

    const professionalDevelopmentSuggestions = uniqueText([
      "Schedule monthly manager-led development reviews for employees with active learning assignments.",
      "Convert repeated learning assignments into role-based pathways to strengthen progression consistency.",
      "Pair low-completion cohorts with practical coaching and shorter milestone-based learning checks.",
      ...insight.earlyInterventions.map((item) => item.detail).slice(0, 2),
    ]).slice(0, 5);

    return NextResponse.json({
      success: true,
      intelligence: {
        section,
        summary: reasoning.professionalInsight || insight.summary,
        nextStep:
          reasoning.immediateNextStep ||
          decision.nextQuestion ||
          "Review the highest-risk learning and compliance items, then assign owners and dates.",
        recommendations,
        capabilityInsights: buildCapabilityInsights(snapshot),
        complianceGuidance: buildComplianceGuidance(snapshot),
        developmentSuggestions: uniqueText(insight.recommendations.map((item) => item.detail)).slice(0, 4),
        professionalDevelopmentSuggestions,
        draftLearningPlan: {
          title: `Draft ${section.replace("-", " ")} learning plan`,
          summary: draft.summary,
          actions: uniqueText([
            ...reasoning.recommendedSteps,
            ...insight.recommendations.map((item) => item.detail),
          ]).slice(0, 4),
        },
        decisionFramework: {
          sequence: decision.decisionSequence,
          proportionateRecommendation: decision.proportionateRecommendation,
          nextQuestion: decision.nextQuestion,
          confidenceStatement: decision.confidenceStatement,
        },
        thinking: {
          employerObjective: thinking.employerObjective,
          conversationMode: thinking.conversationMode,
          responseDepth: thinking.responseDepth,
          responseAim: thinking.responseAim,
        },
        grounding: {
          foundationsCount: organisationKnowledge.length,
          organisationMemoryCount: organisationMemory.length,
          knowledgeSourceCount: knowledge.sources.length,
          snapshot,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo Learn intelligence could not be generated.",
      },
      { status: 500 },
    );
  }
}