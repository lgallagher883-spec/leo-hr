import { NextRequest, NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";
import { buildDraftDocument } from "@/leo/draft/engine";

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

type DraftRequestBody = {
  context?: unknown;
  prompt?: unknown;
  title?: unknown;
};

type OrganisationMemoryRow = {
  title: string;
  content: string;
  keywords: string[] | null;
  status: string | null;
  is_active: boolean | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toEmployeeId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseContext(value: unknown): LifecycleContext {
  const parsed = text(value).toLowerCase();

  switch (parsed) {
    case "probation":
    case "absence":
    case "development":
    case "compliance":
    case "documents":
    case "employee_relations":
      return parsed;
    default:
      return "employment";
  }
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
          error: "You do not have permission to generate employee drafts.",
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

async function loadOrganisationMemory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
) {
  const { data, error } = await supabase
    .from("leo_organisation_memory_records")
    .select("title,content,keywords,status,is_active")
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

function buildPrompt(
  employeeName: string,
  context: LifecycleContext,
  prompt: string,
) {
  const base = `Employee: ${employeeName}. Lifecycle context: ${context}.`;

  if (context === "absence") {
    return `${base} Do not include or infer confidential medical details. Focus on fair process, status clarity and proportionate communication. Request: ${prompt}`;
  }

  if (context === "compliance") {
    return `${base} Focus on compliance actions, evidence quality, due dates and practical next steps. Request: ${prompt}`;
  }

  if (context === "employee_relations") {
    return `${base} Focus on factual records, balanced language, and proportionate employee-relations handling. Request: ${prompt}`;
  }

  return `${base} Produce a practical, professional HR draft aligned to this lifecycle section. Request: ${prompt}`;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

  let body: DraftRequestBody;

  try {
    body = (await request.json()) as DraftRequestBody;
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
        error: "A prompt is required to generate a draft.",
      },
      { status: 400 },
    );
  }

  const lifecycleContext = parseContext(body.context);
  const { supabase, organisationId } = permission;

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, name")
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

  const organisationMemory = await loadOrganisationMemory(supabase, organisationId);

  const draft = buildDraftDocument({
    message: buildPrompt(employee.name || `Employee ${employeeId}`, lifecycleContext, prompt),
    matterId: employeeId,
    organisationId,
    organisationMemory: organisationMemory.map((item) => ({
      title: item.title,
      content: item.content,
      keywords: item.keywords || [],
    })),
    documentType: "general_hr_document",
  });

  const title = text(body.title) || `${employee.name || "Employee"} ${lifecycleContext.replaceAll("_", " ")} draft`;

  return NextResponse.json({
    success: true,
    draft: {
      ...draft,
      title,
      confidentiality: lifecycleContext === "absence" ? "Medical records were excluded from this draft context." : undefined,
    },
  });
}
