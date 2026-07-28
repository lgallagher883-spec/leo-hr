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

export const dynamic = "force-dynamic";

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
  status: string | null;
  is_active: boolean | null;
};

type EmployeeRow = {
  id: number;
  name: string | null;
  status: string | null;
  start_date: string | null;
};

type RightToWorkRow = {
  employee_id: number;
  right_to_work_expiry: string | null;
  next_review_date: string | null;
  created_at: string | null;
};

type DbsRow = {
  employee_id: number;
  dbs_required: string | null;
  next_check_due: string | null;
  update_service: string | null;
  update_service_next_check_due: string | null;
  safeguarding_training_expiry: string | null;
  created_at: string | null;
};

type DrivingRow = {
  employee_id: number;
  drives_for_work: string | null;
  licence_expiry_date: string | null;
  next_dvla_check_due: string | null;
  business_insurance_expiry_date: string | null;
  mot_required: string | null;
  mot_expiry_date: string | null;
  vehicle_ownership: string | null;
  vehicle_used: string | null;
  created_at: string | null;
};

type TrainingRow = {
  employee_id: number;
  refresh_or_expiry_date: string | null;
};

type ComplianceSnapshot = {
  employeeCount: number;
  auditsLoggedLast30Days: number;
  expiringRequirements: number;
  expiredRequirements: number;
  actionsOutstanding: number;
  missingEvidenceFlags: number;
  inspectionReadinessBand: "Ready" | "Watch" | "Critical";
  inspectionReadinessScore: number;
  organisationalRiskLevel: "Low" | "Moderate" | "High";
};

type DraftBody = {
  prompt?: unknown;
  title?: unknown;
  focus?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalise(value: unknown): string {
  return text(value).toLowerCase();
}

function isAffirmative(value: unknown): boolean {
  return ["yes", "true", "required", "active", "confirmed", "completed"].includes(normalise(value));
}

function readDateOnly(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function classifyDate(
  value: string | null | undefined,
  today: Date,
  inThirtyDays: Date,
): "missing" | "expired" | "due_30" | "current" {
  const date = readDateOnly(value);

  if (!date) {
    return "missing";
  }

  if (date.getTime() < today.getTime()) {
    return "expired";
  }

  if (date.getTime() <= inThirtyDays.getTime()) {
    return "due_30";
  }

  return "current";
}

function latestByEmployee<T extends { employee_id: number; created_at?: string | null }>(rows: T[]): Map<number, T> {
  const map = new Map<number, T>();

  for (const row of rows) {
    if (!map.has(row.employee_id)) {
      map.set(row.employee_id, row);
      continue;
    }

    const existing = map.get(row.employee_id);

    if (!existing) {
      map.set(row.employee_id, row);
      continue;
    }

    const existingDate = existing.created_at ? new Date(existing.created_at).getTime() : 0;
    const nextDate = row.created_at ? new Date(row.created_at).getTime() : 0;

    if (nextDate >= existingDate) {
      map.set(row.employee_id, row);
    }
  }

  return map;
}

async function requireComplianceAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You must be signed in to access compliance intelligence.",
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
    target_permission_key: "compliance.view",
    target_user_id: user.id,
  });

  if (permissionError) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your compliance access could not be verified.",
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
          error: "You do not have permission to access compliance intelligence.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    organisationId: String(organisationId),
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

async function loadSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
): Promise<{ snapshot: ComplianceSnapshot; employees: EmployeeRow[] }> {
  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id,name,status,start_date")
    .eq("organisation_id", organisationId)
    .order("name", { ascending: true });

  if (employeesError) {
    throw new Error(employeesError.message || "Employees could not be loaded.");
  }

  const employeeRows = (employees || []) as EmployeeRow[];
  const employeeIds = employeeRows.map((row) => row.id);

  if (employeeIds.length === 0) {
    return {
      employees: [],
      snapshot: {
        employeeCount: 0,
        auditsLoggedLast30Days: 0,
        expiringRequirements: 0,
        expiredRequirements: 0,
        actionsOutstanding: 0,
        missingEvidenceFlags: 0,
        inspectionReadinessBand: "Ready",
        inspectionReadinessScore: 100,
        organisationalRiskLevel: "Low",
      },
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const inThirtyDays = new Date(today);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);

  const [
    rightToWorkResult,
    dbsResult,
    drivingResult,
    trainingResult,
    complianceAuditResult,
  ] = await Promise.all([
    supabase
      .from("employee_right_to_work")
      .select("employee_id,right_to_work_expiry,next_review_date,created_at")
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),

    supabase
      .from("employee_dbs_checks")
      .select(
        "employee_id,dbs_required,next_check_due,update_service,update_service_next_check_due,safeguarding_training_expiry,created_at",
      )
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),

    supabase
      .from("employee_driving_checks")
      .select(
        "employee_id,drives_for_work,licence_expiry_date,next_dvla_check_due,business_insurance_expiry_date,mot_required,mot_expiry_date,vehicle_ownership,vehicle_used,created_at",
      )
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),

    supabase
      .from("employee_training_logs")
      .select("employee_id,refresh_or_expiry_date")
      .in("employee_id", employeeIds),

    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", organisationId)
      .eq("action_category", "Compliance")
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const rightToWorkRows = (rightToWorkResult.data || []) as RightToWorkRow[];
  const dbsRows = (dbsResult.data || []) as DbsRow[];
  const drivingRows = (drivingResult.data || []) as DrivingRow[];
  const trainingRows = (trainingResult.data || []) as TrainingRow[];

  const rightToWorkByEmployee = latestByEmployee(rightToWorkRows);
  const dbsByEmployee = latestByEmployee(dbsRows);
  const drivingByEmployee = latestByEmployee(drivingRows);

  const trainingByEmployee = new Map<number, TrainingRow[]>();

  for (const row of trainingRows) {
    const existing = trainingByEmployee.get(row.employee_id) || [];
    existing.push(row);
    trainingByEmployee.set(row.employee_id, existing);
  }

  let expiredRequirements = 0;
  let expiringRequirements = 0;
  let missingEvidenceFlags = 0;

  for (const employee of employeeRows) {
    const rightToWork = rightToWorkByEmployee.get(employee.id);

    if (!rightToWork) {
      missingEvidenceFlags += 1;
    } else {
      const status = classifyDate(
        rightToWork.next_review_date || rightToWork.right_to_work_expiry,
        today,
        inThirtyDays,
      );

      if (status === "missing") {
        missingEvidenceFlags += 1;
      } else if (status === "expired") {
        expiredRequirements += 1;
      } else if (status === "due_30") {
        expiringRequirements += 1;
      }
    }

    const dbs = dbsByEmployee.get(employee.id);

    if (!dbs) {
      missingEvidenceFlags += 1;
    } else {
      const dbsRequired = isAffirmative(dbs.dbs_required);

      if (dbsRequired) {
        const dbsStatus = classifyDate(dbs.next_check_due, today, inThirtyDays);

        if (dbsStatus === "missing") {
          missingEvidenceFlags += 1;
        } else if (dbsStatus === "expired") {
          expiredRequirements += 1;
        } else if (dbsStatus === "due_30") {
          expiringRequirements += 1;
        }

        const safeguardingStatus = classifyDate(dbs.safeguarding_training_expiry, today, inThirtyDays);

        if (safeguardingStatus === "missing") {
          missingEvidenceFlags += 1;
        } else if (safeguardingStatus === "expired") {
          expiredRequirements += 1;
        } else if (safeguardingStatus === "due_30") {
          expiringRequirements += 1;
        }
      }

      const updateServiceActive = isAffirmative(dbs.update_service);

      if (updateServiceActive) {
        const updateStatus = classifyDate(dbs.update_service_next_check_due, today, inThirtyDays);

        if (updateStatus === "missing") {
          missingEvidenceFlags += 1;
        } else if (updateStatus === "expired") {
          expiredRequirements += 1;
        } else if (updateStatus === "due_30") {
          expiringRequirements += 1;
        }
      }
    }

    const driving = drivingByEmployee.get(employee.id);

    if (driving && isAffirmative(driving.drives_for_work)) {
      const drivingDates = [
        driving.licence_expiry_date,
        driving.next_dvla_check_due,
        driving.business_insurance_expiry_date,
      ];

      for (const dateValue of drivingDates) {
        const status = classifyDate(dateValue, today, inThirtyDays);

        if (status === "missing") {
          missingEvidenceFlags += 1;
        } else if (status === "expired") {
          expiredRequirements += 1;
        } else if (status === "due_30") {
          expiringRequirements += 1;
        }
      }

      const personalVehicle =
        normalise(driving.vehicle_ownership).includes("personal") ||
        normalise(driving.vehicle_used).includes("personal") ||
        isAffirmative(driving.mot_required);

      if (personalVehicle) {
        const motStatus = classifyDate(driving.mot_expiry_date, today, inThirtyDays);

        if (motStatus === "missing") {
          missingEvidenceFlags += 1;
        } else if (motStatus === "expired") {
          expiredRequirements += 1;
        } else if (motStatus === "due_30") {
          expiringRequirements += 1;
        }
      }
    }

    const trainingItems = trainingByEmployee.get(employee.id) || [];

    if (trainingItems.length === 0) {
      missingEvidenceFlags += 1;
    } else {
      for (const training of trainingItems) {
        const status = classifyDate(training.refresh_or_expiry_date, today, inThirtyDays);

        if (status === "expired") {
          expiredRequirements += 1;
        } else if (status === "due_30") {
          expiringRequirements += 1;
        }
      }
    }
  }

  const actionsOutstanding = expiredRequirements + expiringRequirements + missingEvidenceFlags;

  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        expiredRequirements * 4 -
        expiringRequirements * 2 -
        Math.ceil(missingEvidenceFlags * 2.5),
    ),
  );

  const inspectionReadinessBand: ComplianceSnapshot["inspectionReadinessBand"] =
    readinessScore >= 80 ? "Ready" : readinessScore >= 60 ? "Watch" : "Critical";

  const organisationalRiskLevel: ComplianceSnapshot["organisationalRiskLevel"] =
    actionsOutstanding >= 80 || inspectionReadinessBand === "Critical"
      ? "High"
      : actionsOutstanding >= 30 || inspectionReadinessBand === "Watch"
        ? "Moderate"
        : "Low";

  return {
    employees: employeeRows,
    snapshot: {
      employeeCount: employeeRows.length,
      auditsLoggedLast30Days: complianceAuditResult.count || 0,
      expiringRequirements,
      expiredRequirements,
      actionsOutstanding,
      missingEvidenceFlags,
      inspectionReadinessBand,
      inspectionReadinessScore: readinessScore,
      organisationalRiskLevel,
    },
  };
}

function uniqueText(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildInsightMessage(snapshot: ComplianceSnapshot) {
  return [
    "Organisation compliance intelligence briefing.",
    `Employees in scope: ${snapshot.employeeCount}.`,
    `Compliance audits logged in the last 30 days: ${snapshot.auditsLoggedLast30Days}.`,
    `Actions outstanding across compliance registers: ${snapshot.actionsOutstanding}.`,
    `Expired requirements: ${snapshot.expiredRequirements}.`,
    `Requirements expiring within 30 days: ${snapshot.expiringRequirements}.`,
    `Missing evidence flags: ${snapshot.missingEvidenceFlags}.`,
    `Inspection readiness: ${snapshot.inspectionReadinessBand} (${snapshot.inspectionReadinessScore}/100).`,
    `Organisational risk level: ${snapshot.organisationalRiskLevel}.`,
    "Provide practical, professionally actionable recommendations covering audits, actions, expiring requirements, inspection readiness and organisational risk.",
    "Ground recommendations in organisation foundations and approved organisation memory.",
  ].join(" ");
}

export async function GET() {
  try {
    const access = await requireComplianceAccess();

    if ("response" in access) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const [{ snapshot, employees }, foundations, organisationMemory] = await Promise.all([
      loadSnapshot(supabase, organisationId),
      loadFoundations(supabase, organisationId),
      loadOrganisationMemory(supabase, organisationId),
    ]);

    const organisationKnowledge = foundations
      .map((item, index) => ({
        id: `${text(item.section) || "foundation"}-${text(item.key) || "item"}-${index}`,
        type: "operational_rule" as const,
        title: `${text(item.section) || "Foundation"} · ${text(item.key) || "Item"}`,
        content: text(item.value),
        keywords: [text(item.section), text(item.key)].filter(Boolean),
        source: "foundation" as const,
        active: true,
        organisationId,
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

    const message = buildInsightMessage(snapshot);
    const thinking = runProfessionalThinking(message);
    const core = runLeoCore(message);
    const reasoning = runLeoReasoning(core, message);
    const framework = buildDecisionFramework(core, reasoning, message);

    const knowledge = searchKnowledge({
      message,
      organisationKnowledge,
      organisationMemory: organisationMemoryItems,
    });

    const draft = buildDraftDocument({
      message,
      matterId: 0,
      organisationId,
      organisationKnowledge,
      organisationMemory: draftMemory,
      documentType: "general_hr_document",
    });

    const insight = buildLeoInsight({
      periodLabel: "Compliance intelligence snapshot",
      employees: employees.slice(0, 80).map((employee) => ({
        id: employee.id,
        name: employee.name || `Employee ${employee.id}`,
        status: employee.status,
        start_date: employee.start_date,
      })),
      knowledgeSectionCount: knowledge.sources.length,
    });

    const recommendations = [
      ...reasoning.recommendedSteps.slice(0, 3),
      ...insight.recommendations.map((item) => item.detail).slice(0, 2),
    ];

    const risks = [
      ...reasoning.employerRisks.slice(0, 2),
      ...insight.risks.map((item) => `${item.title}: ${item.detail}`).slice(0, 2),
    ];

    return NextResponse.json({
      success: true,
      intelligence: {
        summary: reasoning.professionalInsight || insight.summary,
        nextStep:
          reasoning.immediateNextStep ||
          framework.nextQuestion ||
          "Review the highest-risk compliance actions and assign ownership.",
        recommendations: uniqueText(recommendations).slice(0, 5),
        risks: uniqueText(risks).slice(0, 4),
        knowledge: {
          sourceCount: knowledge.sources.length,
        },
        grounding: {
          foundationsCount: organisationKnowledge.length,
          organisationMemoryCount: draftMemory.length,
        },
        readiness: {
          band: snapshot.inspectionReadinessBand,
          score: snapshot.inspectionReadinessScore,
        },
        risk: {
          level: snapshot.organisationalRiskLevel,
          actionsOutstanding: snapshot.actionsOutstanding,
        },
        snapshot,
        draft: {
          summary: draft.summary,
          rationale: draft.rationale.slice(0, 2),
        },
        thinking: {
          employerObjective: thinking.employerObjective,
          responseAim: thinking.responseAim,
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
            : "Compliance intelligence could not be generated.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireComplianceAccess();

    if ("response" in access) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    let body: DraftBody;

    try {
      body = (await request.json()) as DraftBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "The draft request could not be read.",
        },
        { status: 400 },
      );
    }

    const prompt = text(body.prompt);

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "A prompt is required to generate a compliance draft.",
        },
        { status: 400 },
      );
    }

    const [{ snapshot }, foundations, organisationMemory] = await Promise.all([
      loadSnapshot(supabase, organisationId),
      loadFoundations(supabase, organisationId),
      loadOrganisationMemory(supabase, organisationId),
    ]);

    const focus = text(body.focus) || "compliance management";

    const organisationKnowledge = foundations
      .map((item, index) => ({
        id: `${text(item.section) || "foundation"}-${text(item.key) || "item"}-${index}`,
        type: "operational_rule" as const,
        title: `${text(item.section) || "Foundation"} · ${text(item.key) || "Item"}`,
        content: text(item.value),
        keywords: [text(item.section), text(item.key)].filter(Boolean),
        source: "foundation" as const,
        active: true,
        organisationId,
      }))
      .filter((item) => Boolean(item.content));

    const draft = buildDraftDocument({
      message: [
        `Generate a professional compliance draft focused on ${focus}.`,
        `Organisation snapshot: ${JSON.stringify(snapshot)}.`,
        "Draft requirements: include specific actions, ownership suggestions, audit and evidence controls, expiring requirement management, inspection readiness and organisational risk mitigations.",
        `Request: ${prompt}`,
      ].join(" "),
      matterId: 0,
      organisationId,
      organisationKnowledge,
      organisationMemory: organisationMemory.map((item) => ({
        title: item.title,
        content: item.content,
        keywords: item.keywords || [],
      })),
      documentType: "general_hr_document",
    });

    return NextResponse.json({
      success: true,
      draft: {
        ...draft,
        title: text(body.title) || `Compliance draft · ${focus}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The compliance draft could not be generated.",
      },
      { status: 500 },
    );
  }
}
