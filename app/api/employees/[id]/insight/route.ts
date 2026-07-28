import { NextRequest, NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";
import { runLeoCore } from "@/leo/core/router";
import { buildLeoInsight } from "@/leo/insight/engine";
import { searchKnowledge } from "@/leo/knowledge";
import { buildDecisionFramework } from "@/leo/reasoning/decisionFramework";
import { runLeoReasoning } from "@/leo/reasoning/reasoner";
import { runProfessionalThinking } from "@/leo/thinking/model";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type LifecycleContext =
  | "employment"
  | "probation"
  | "absence"
  | "development"
  | "compliance"
  | "documents"
  | "employee_relations";

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

const allowedContexts: LifecycleContext[] = [
  "employment",
  "probation",
  "absence",
  "development",
  "compliance",
  "documents",
  "employee_relations",
];

function toEmployeeId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseContext(value: string | null): LifecycleContext {
  const parsed = (value || "").trim().toLowerCase();
  return allowedContexts.includes(parsed as LifecycleContext)
    ? (parsed as LifecycleContext)
    : "employment";
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function requireEmployeesViewAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        { success: false, error: "You are not signed in." },
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
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc("leo_has_permission", {
    target_organisation_id: organisationId,
    target_permission_key: "employees.view",
    target_user_id: user.id,
  });

  if (permissionError) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Employee permission verification failed.",
        },
        { status: 500 },
      ),
    };
  }

  if (!allowed) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have permission to view employee intelligence.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    userId: user.id,
    organisationId: String(organisationId),
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
    .limit(80);

  if (error) {
    return [] as OrganisationMemoryRow[];
  }

  return (data || []) as OrganisationMemoryRow[];
}

async function loadLifecycleSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: number,
  context: LifecycleContext,
) {
  const now = new Date();
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);
  const nowIso = now.toISOString();
  const inThirtyDaysIso = inThirtyDays.toISOString();

  if (context === "employment") {
    const [details, leaveSummary] = await Promise.all([
      supabase
        .from("employee_employment_details")
        .select("manager, probation_end_date, employment_end_date, annual_leave_allowance")
        .eq("employee_id", employeeId)
        .maybeSingle(),
      supabase
        .from("employee_leave_records")
        .select("id, status")
        .eq("employee_id", employeeId)
        .in("status", ["Submitted", "Approved", "Returned"]),
    ]);

    return {
      details: details.data || null,
      leaveActiveCount: (leaveSummary.data || []).length,
    };
  }

  if (context === "probation") {
    const [probation, reviews] = await Promise.all([
      supabase
        .from("employee_probations")
        .select("status, current_end_date, final_decision_deadline")
        .eq("employee_id", employeeId)
        .eq("is_archived", false)
        .maybeSingle(),
      supabase
        .from("probation_reviews")
        .select("id, status, scheduled_date")
        .eq("employee_id", employeeId)
        .eq("is_archived", false),
    ]);

    const pendingReviews = (reviews.data || []).filter((item: any) => text(item.status).toLowerCase() !== "completed").length;

    return {
      probation: probation.data || null,
      pendingReviews,
    };
  }

  if (context === "absence") {
    const records = await supabase
      .from("employee_leave_records")
      .select("id, leave_type, status, start_date, end_date")
      .eq("employee_id", employeeId);

    const activeRecords = (records.data || []).filter((item: any) => {
      const status = text(item.status).toLowerCase();
      return status === "submitted" || status === "approved" || status === "draft";
    }).length;

    return {
      activeRecords,
      recordCount: (records.data || []).length,
    };
  }

  if (context === "development") {
    const [records, probation] = await Promise.all([
      supabase
        .from("employee_development_records")
        .select("id, status, next_review_date")
        .eq("employee_id", employeeId)
        .eq("is_archived", false),
      supabase
        .from("employee_probations")
        .select("status")
        .eq("employee_id", employeeId)
        .eq("is_archived", false)
        .maybeSingle(),
    ]);

    const openRecords = (records.data || []).filter((item: any) => {
      const status = text(item.status).toLowerCase();
      return status !== "completed" && status !== "closed" && status !== "archived";
    }).length;

    return {
      openRecords,
      probationStatus: probation.data?.status || null,
    };
  }

  if (context === "compliance") {
    const [rightToWork, dbs, driving, training] = await Promise.all([
      supabase
        .from("employee_right_to_work")
        .select("next_review_date")
        .eq("employee_id", employeeId)
        .gte("next_review_date", nowIso)
        .lte("next_review_date", inThirtyDaysIso),
      supabase
        .from("employee_dbs_checks")
        .select("next_check_due")
        .eq("employee_id", employeeId)
        .gte("next_check_due", nowIso)
        .lte("next_check_due", inThirtyDaysIso),
      supabase
        .from("employee_driving_checks")
        .select("next_dvla_check_due")
        .eq("employee_id", employeeId)
        .gte("next_dvla_check_due", nowIso)
        .lte("next_dvla_check_due", inThirtyDaysIso),
      supabase
        .from("employee_training_logs")
        .select("refresh_or_expiry_date")
        .eq("employee_id", employeeId)
        .gte("refresh_or_expiry_date", nowIso)
        .lte("refresh_or_expiry_date", inThirtyDaysIso),
    ]);

    return {
      dueSoon:
        (rightToWork.data || []).length +
        (dbs.data || []).length +
        (driving.data || []).length +
        (training.data || []).length,
    };
  }

  if (context === "documents") {
    const documents = await supabase
      .from("employee_documents")
      .select("id, document_type, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(100);

    return {
      documentCount: (documents.data || []).length,
    };
  }

  const [warnings, notes, matters] = await Promise.all([
    supabase
      .from("employee_warnings")
      .select("id, warning_type, date_issued")
      .eq("employee_id", employeeId),
    supabase
      .from("employee_notes")
      .select("id, created_at")
      .eq("employee_id", employeeId),
    supabase
      .from("matters")
      .select("id, title, status, created_at")
      .eq("employee_id", employeeId)
      .neq("status", "Closed"),
  ]);

  return {
    warningCount: (warnings.data || []).length,
    noteCount: (notes.data || []).length,
    openMatterCount: (matters.data || []).length,
  };
}

function buildContextMessage(
  employeeName: string,
  context: LifecycleContext,
  snapshot: Record<string, unknown>,
) {
  const summary = JSON.stringify(snapshot);

  if (context === "employment") {
    return `Employee lifecycle intelligence for employment for ${employeeName}. Prioritise proportionate employment oversight, role clarity, and active leave interface. Snapshot: ${summary}.`;
  }

  if (context === "probation") {
    return `Employee lifecycle intelligence for probation for ${employeeName}. Focus on timely reviews, support plans, and decision deadlines. Snapshot: ${summary}.`;
  }

  if (context === "absence") {
    return `Employee lifecycle intelligence for leave and absence for ${employeeName}. Focus on status progression, continuity planning, and fair case handling. Exclude medical record details. Snapshot: ${summary}.`;
  }

  if (context === "development") {
    return `Employee lifecycle intelligence for development for ${employeeName}. Focus on sustained performance conversations, milestones, and completion of active plans. Snapshot: ${summary}.`;
  }

  if (context === "compliance") {
    return `Employee lifecycle intelligence for compliance for ${employeeName}. Focus on upcoming checks, expiry controls, and evidence completeness. Snapshot: ${summary}.`;
  }

  if (context === "documents") {
    return `Employee lifecycle intelligence for documents for ${employeeName}. Focus on document completeness, retrieval readiness, and record quality. Snapshot: ${summary}.`;
  }

  return `Employee lifecycle intelligence for employee relations for ${employeeName}. Focus on balanced case notes, warning progression, and linked matters. Snapshot: ${summary}.`;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const permission = await requireEmployeesViewAccess();

  if ("response" in permission) {
    return permission.response;
  }

  const { id } = await context.params;
  const employeeId = toEmployeeId(id);

  if (!employeeId) {
    return NextResponse.json(
      {
        success: false,
        error: "The employee reference is invalid.",
      },
      { status: 400 },
    );
  }

  const lifecycleContext = parseContext(request.nextUrl.searchParams.get("context"));

  const { supabase, organisationId } = permission;

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, name, status, start_date")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employeeError || !employee) {
    return NextResponse.json(
      {
        success: false,
        error: "The employee could not be loaded.",
      },
      { status: 404 },
    );
  }

  const [snapshot, foundations, organisationMemory] = await Promise.all([
    loadLifecycleSnapshot(supabase, employeeId, lifecycleContext),
    loadFoundations(supabase, organisationId),
    loadOrganisationMemory(supabase, organisationId),
  ]);

  const message = buildContextMessage(employee.name || `Employee ${employeeId}`, lifecycleContext, snapshot);

  const organisationKnowledge = foundations
    .map((item) => ({
      id: `${text(item.section) || "foundation"}:${text(item.key) || "value"}`,
      type: "operational_rule" as const,
      title: `${text(item.section) || "Foundation"} · ${text(item.key) || "Item"}`,
      content: text(item.value),
      keywords: [text(item.section), text(item.key)].filter(Boolean),
      source: "foundation" as const,
      active: true,
      organisationId,
    }))
    .filter((item) => item.content.length > 0);

  const memoryItems = organisationMemory.map((item) => ({
    id: item.id,
    organisationId,
    type: "operational_rule" as const,
    title: item.title,
    content: item.content,
    keywords: item.keywords || [],
    active: item.is_active !== false,
    source: "system" as const,
  }));

  const knowledge = searchKnowledge({
    message,
    organisationMemory: memoryItems,
    organisationKnowledge,
  });

  const core = runLeoCore(message);
  const thinking = runProfessionalThinking(message);
  const reasoning = runLeoReasoning(core, message);
  const framework = buildDecisionFramework(core, reasoning, message);
  const insight = buildLeoInsight({
    periodLabel: `${employee.name} ${lifecycleContext} intelligence`,
    employees: [
      {
        id: employeeId,
        name: employee.name || `Employee ${employeeId}`,
        status: employee.status,
        start_date: employee.start_date,
      },
    ],
    knowledgeSectionCount: knowledge.sources.length,
  });

  const recommendations = [
    ...reasoning.recommendedSteps.slice(0, 2),
    ...insight.recommendations.map((item) => item.detail).slice(0, 2),
  ];

  const risks = [
    ...insight.risks.map((item) => `${item.title}: ${item.detail}`),
  ];

  return NextResponse.json({
    success: true,
    intelligence: {
      summary: reasoning.professionalInsight || insight.summary,
      nextStep:
        reasoning.immediateNextStep ||
        framework.decisionSequence[0] ||
        thinking.responseAim ||
        "Review the current section and confirm the next action.",
      recommendations: uniqueText(recommendations).slice(0, 4),
      risks: uniqueText(risks).slice(0, 3),
      knowledge: {
        sourceCount: knowledge.sources.length,
      },
      grounding: {
        foundationsCount: foundations.length,
        organisationMemoryCount: organisationMemory.length,
      },
    },
  });
}

function uniqueText(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}
