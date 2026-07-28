import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";
import { runLeoCore } from "@/leo/core/router";
import { buildDraftDocument } from "@/leo/draft/engine";
import { buildLeoInsight } from "@/leo/insight/engine";
import { searchKnowledge } from "@/leo/knowledge";
import { buildDecisionFramework } from "@/leo/reasoning/decisionFramework";
import { runLeoReasoning } from "@/leo/reasoning/reasoner";
import { runProfessionalThinking } from "@/leo/thinking/model";

type PlatformRole = "owner" | "senior" | "manager" | "employee";

type TalentStage =
  | "vacancies"
  | "applications"
  | "candidates"
  | "interviews"
  | "offers"
  | "due_diligence"
  | "onboarding";

type FoundationRow = {
  section: string | null;
  key: string | null;
  value: string | null;
  source: string | null;
};

type OrganisationMemoryRow = {
  id: string;
  title: string;
  content: string;
  keywords: string[] | null;
  status: string | null;
  is_active: boolean | null;
};

type TalentSnapshot = {
  vacanciesOpen: number;
  vacanciesAwaitingApproval: number;
  applicationsActive: number;
  candidatesActive: number;
  interviewsUpcoming: number;
  offersAwaitingResponse: number;
  dueDiligenceOutstanding: number;
  onboardingInProgress: number;
};

const ALLOWED_STAGES: TalentStage[] = [
  "vacancies",
  "applications",
  "candidates",
  "interviews",
  "offers",
  "due_diligence",
  "onboarding",
];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();

  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";
  return "employee";
}

function asStage(value: string | null): TalentStage {
  const stage = (value || "").trim().toLowerCase();

  if (ALLOWED_STAGES.includes(stage as TalentStage)) {
    return stage as TalentStage;
  }

  return "applications";
}

function stageLabel(stage: TalentStage): string {
  return stage.replaceAll("_", " ");
}

function asCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function getAuthorisedContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "You must be signed in to access Talent intelligence.",
        },
        { status: 401 },
      ),
    };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;

  if (!organisationId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Leo could not find an active organisation for your account.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    userId: user.id,
    organisationId: String(organisationId),
    role: normaliseRole(resolvedRole?.roleKey),
  };
}

async function getSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
): Promise<TalentSnapshot> {
  const nowIso = new Date().toISOString();

  const [
    vacanciesOpen,
    vacanciesAwaitingApproval,
    applicationsActive,
    candidatesActive,
    interviewsUpcoming,
    offersAwaitingResponse,
    dueDiligenceOutstanding,
    onboardingInProgress,
  ] = await Promise.all([
    supabase
      .from("leo_talent_vacancies")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .eq("status", "open"),

    supabase
      .from("leo_talent_vacancies")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .in("status", ["draft", "approval_required", "approved"]),

    supabase
      .from("leo_talent_applications")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .in("status", ["submitted", "active", "on_hold", "offered"]),

    supabase
      .from("leo_talent_candidates")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .is("archived_at", null),

    supabase
      .from("leo_talent_interviews")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .in("status", ["scheduled", "invited", "confirmed", "reschedule_requested"])
      .gte("scheduled_start", nowIso),

    supabase
      .from("leo_talent_offers")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .in("status", ["draft", "approval_required", "approved", "sent", "viewed"]),

    supabase
      .from("leo_talent_safer_recruitment_profiles")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .in("status", ["not_started", "in_progress", "awaiting_information", "blocked"]),

    supabase
      .from("leo_talent_appointments")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .in("status", ["pre_employment", "checks_in_progress", "ready_to_start", "employee_creation_pending"]),
  ]);

  return {
    vacanciesOpen: asCount(vacanciesOpen.count),
    vacanciesAwaitingApproval: asCount(vacanciesAwaitingApproval.count),
    applicationsActive: asCount(applicationsActive.count),
    candidatesActive: asCount(candidatesActive.count),
    interviewsUpcoming: asCount(interviewsUpcoming.count),
    offersAwaitingResponse: asCount(offersAwaitingResponse.count),
    dueDiligenceOutstanding: asCount(dueDiligenceOutstanding.count),
    onboardingInProgress: asCount(onboardingInProgress.count),
  };
}

async function loadFoundations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
) {
  const { data, error } = await supabase
    .from("organisation_foundations")
    .select("section,key,value,source")
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
    .select("id,title,content,keywords,status,is_active")
    .eq("organisation_id", organisationId)
    .eq("is_active", true)
    .in("status", ["approved", "published", "active"])
    .order("updated_at", { ascending: false })
    .limit(60);

  if (error) {
    return [] as OrganisationMemoryRow[];
  }

  return (data || []) as OrganisationMemoryRow[];
}

function buildStageMessage(stage: TalentStage, snapshot: TalentSnapshot) {
  const focusByStage: Record<TalentStage, string> = {
    vacancies:
      "vacancy design, role clarity, criteria quality, and fair attraction decisions",
    applications:
      "fair shortlist decisions, evidence-led progression, and consistent applicant handling",
    candidates:
      "candidate quality, profile completeness, and contact and retention controls",
    interviews:
      "structured interviewing, panel consistency, and proportionate interview decisions",
    offers:
      "offer quality, approval controls, and safe progression to appointment",
    due_diligence:
      "pre-employment checks, verification quality, and risk-based appointment readiness",
    onboarding:
      "new starter readiness, mandatory steps, and safe transition into employment",
  };

  return [
    `Leo Talent lifecycle stage: ${stageLabel(stage)}.`,
    `Open vacancies: ${snapshot.vacanciesOpen}.`,
    `Vacancies awaiting approval: ${snapshot.vacanciesAwaitingApproval}.`,
    `Active applications: ${snapshot.applicationsActive}.`,
    `Active candidates: ${snapshot.candidatesActive}.`,
    `Upcoming interviews: ${snapshot.interviewsUpcoming}.`,
    `Offers awaiting response: ${snapshot.offersAwaitingResponse}.`,
    `Due diligence outstanding: ${snapshot.dueDiligenceOutstanding}.`,
    `Onboarding in progress: ${snapshot.onboardingInProgress}.`,
    `Focus on ${focusByStage[stage]}.`,
    "Ground recommendations in organisation knowledge and approved organisation memory where available.",
  ].join(" ");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const stage = asStage(url.searchParams.get("stage"));

    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase);

    if ("error" in access) {
      return access.error;
    }

    const [snapshot, foundations, memoryRecords] = await Promise.all([
      getSnapshot(supabase, access.organisationId),
      loadFoundations(supabase, access.organisationId),
      loadOrganisationMemory(supabase, access.organisationId),
    ]);

    const organisationKnowledge = foundations
      .filter((row) => text(row.value))
      .map((row, index) => ({
        id: `${text(row.section) || "foundation"}-${text(row.key) || "item"}-${index}`,
        type: "organisation_memory" as const,
        title: text(row.key) || "Foundation",
        content: text(row.value),
        keywords: [text(row.section), text(row.key)].filter(Boolean),
        source: "foundation" as const,
        active: true,
      }));

    const organisationMemory = memoryRecords.map((row) => ({
      title: row.title,
      content: row.content,
      keywords: row.keywords || [],
    }));

    const organisationMemoryItems = memoryRecords.map((row) => ({
      id: row.id,
      organisationId: access.organisationId,
      type: "operational_rule" as const,
      title: row.title,
      content: row.content,
      keywords: row.keywords || [],
      active: row.is_active !== false,
      source: "user_instruction" as const,
    }));

    const stageMessage = buildStageMessage(stage, snapshot);

    const thinking = runProfessionalThinking(stageMessage);
    const core = runLeoCore(stageMessage);
    const reasoning = runLeoReasoning(core, stageMessage);
    const decision = buildDecisionFramework(core, reasoning, stageMessage);

    const knowledge = searchKnowledge({
      message: stageMessage,
      organisationKnowledge,
      organisationMemory: organisationMemoryItems,
    });

    const draft = buildDraftDocument({
      message: stageMessage,
      matterId: 0,
      organisationId: access.organisationId,
      organisationKnowledge,
      organisationMemory,
      documentType: "general_hr_document",
    });

    const insight = buildLeoInsight({
      periodLabel: `Talent ${stageLabel(stage)} intelligence snapshot`,
      knowledgeSectionCount: knowledge.sources.length,
    });

    return NextResponse.json({
      success: true,
      intelligence: {
        stage,
        summary: reasoning.professionalRecommendation,
        nextStep: reasoning.immediateNextStep,
        recommendations: reasoning.recommendedSteps.slice(0, 4),
        risks: reasoning.employerRisks.slice(0, 3),
        decisionFramework: {
          sequence: decision.decisionSequence,
          proportionateRecommendation: decision.proportionateRecommendation,
          nextQuestion: decision.nextQuestion,
          confidenceStatement: decision.confidenceStatement,
        },
        knowledge: {
          sourceCount: knowledge.sources.length,
          sources: knowledge.sources.slice(0, 4).map((source) => ({
            title: source.title,
            type: source.type,
            confidence: source.confidence,
          })),
        },
        draft: {
          summary: draft.summary,
          rationale: draft.rationale.slice(0, 2),
        },
        insight: {
          summary: insight.summary,
          recommendations: insight.recommendations.slice(0, 2),
          risks: insight.risks.slice(0, 2),
        },
        thinking: {
          employerObjective: thinking.employerObjective,
          conversationMode: thinking.conversationMode,
          responseDepth: thinking.responseDepth,
          responseAim: thinking.responseAim,
        },
        grounding: {
          organisationId: access.organisationId,
          foundationsCount: organisationKnowledge.length,
          organisationMemoryCount: organisationMemory.length,
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
            : "Talent intelligence could not be generated.",
      },
      { status: 500 },
    );
  }
}
