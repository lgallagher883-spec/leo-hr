import { NextResponse } from "next/server";

import { authenticateChatGptMcpRequest } from "@/lib/chatgpt/mcpAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const protocolVersion = "2025-06-18";
const DAY_MS = 24 * 60 * 60 * 1000;

type DateStatus = "missing" | "expired" | "due_soon" | "current";

type SafeDueItem = {
  employee_id: number;
  employee_name: string;
  employee_role: string | null;
  item_type: string;
  due_date: string | null;
  status: DateStatus;
};

const tools = [
  {
    name: "leo_get_company_context",
    title: "Get Leo company context",
    description:
      "Read approved organisation Foundations information from Leo, including Company Profile, Employment Framework, Organisation Structure and Company Knowledge. Read-only. Does not return employee or candidate records.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["all", "Company Profile", "Employment Framework", "Organisation Structure", "Company Knowledge"],
          description: "The Foundations section to retrieve.",
        },
      },
      additionalProperties: false,
    },
    securitySchemes: [
      {
        type: "oauth2",
        scopes: ["email", "profile"],
      },
    ],
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "leo_search_employees",
    title: "Search Leo employees",
    description:
      "Search the authenticated organisation's workforce using minimum operational fields only: employee ID, name and position/job title. Does not return email, phone, address, date of birth, start date, manager, leave allowance, payroll, medical, emergency-contact, identity-document, due-diligence evidence, document contents, timeline or audit narrative. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional search text matched against employee name and position/job title only." },
        limit: { type: "integer", minimum: 1, maximum: 100, description: "Maximum results. Defaults to 50." },
      },
      additionalProperties: false,
    },
    securitySchemes: [
      {
        type: "oauth2",
        scopes: ["email", "profile"],
      },
    ],
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "leo_get_employee_overview",
    title: "Get privacy-safe employee overview",
    description:
      "Read one employee's minimum operational overview: employee ID, name, position/job title and privacy-filtered due-diligence/training/qualification type, due date and status. Does not return personal contact details, medical data, document contents, certificate/reference numbers, uploaded evidence, timeline, audit narrative or Matter content. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        employee_id: { type: "integer", minimum: 1, description: "The Leo employee ID." },
        horizon_days: { type: "integer", minimum: 1, maximum: 90, description: "Days used to classify an item as due soon. Defaults to 30." },
      },
      required: ["employee_id"],
      additionalProperties: false,
    },
    securitySchemes: [
      {
        type: "oauth2",
        scopes: ["email", "profile"],
      },
    ],
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "leo_get_attention_summary",
    title: "Get Leo attention summary",
    description:
      "Return a privacy-filtered operational attention summary for the authenticated organisation. Includes due/expired/missing workforce compliance items, open Matter shells, and aggregate learning/onboarding workload. Matter narratives, candidate personal data, employee personal data, medical data, document contents and evidence are excluded. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        horizon_days: { type: "integer", minimum: 1, maximum: 90, description: "Days ahead to treat as due soon. Defaults to 30." },
        limit: { type: "integer", minimum: 1, maximum: 100, description: "Maximum detailed attention items returned. Defaults to 50." },
      },
      additionalProperties: false,
    },
    securitySchemes: [
      {
        type: "oauth2",
        scopes: ["email", "profile"],
      },
    ],
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "leo_search_matters",
    title: "Search privacy-safe Matter summaries",
    description:
      "Read administrative Matter shells only: Matter ID, employee name where linked, Matter type, status and created date. Does not return title, subject, description, allegations, messages, notes, evidence, documents, witness information, medical information, safeguarding details or other Matter narrative. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["all", "Open", "In Progress", "Needs Attention", "Closed"],
          description: "Optional Matter status filter.",
        },
        employee_id: { type: "integer", minimum: 1, description: "Optionally restrict results to one employee in this organisation." },
        limit: { type: "integer", minimum: 1, maximum: 100, description: "Maximum results. Defaults to 50." },
      },
      additionalProperties: false,
    },
    securitySchemes: [
      {
        type: "oauth2",
        scopes: ["email", "profile"],
      },
    ],
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "leo_get_learning_summary",
    title: "Get Leo Learn operational summary",
    description:
      "Return organisation-level Leo Learn operational counts for modules, assignments, pathways and qualifications. Does not return employee document evidence, qualification identifiers, personal contact details or AI Studio project contents. Read-only.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    securitySchemes: [
      {
        type: "oauth2",
        scopes: ["email", "profile"],
      },
    ],
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "leo_get_onboarding_summary",
    title: "Get Leo Talent onboarding summary",
    description:
      "Return aggregate onboarding workload and overdue onboarding checklist items without candidate names, email addresses, phone numbers, CVs, interview notes, payroll details, due-diligence evidence or other candidate personal data. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100, description: "Maximum overdue checklist items returned. Defaults to 50." },
      },
      additionalProperties: false,
    },
    securitySchemes: [
      {
        type: "oauth2",
        scopes: ["email", "profile"],
      },
    ],
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
] as const;

function rpcResult(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(id: unknown, code: number, message: string, status = 200) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message },
    },
    { status },
  );
}

function toolResult(id: unknown, payload: Record<string, unknown>) {
  return rpcResult(id, {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  });
}

function oauthChallenge(request: Request, message: string) {
  const origin = new URL(request.url).origin;
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32001, message },
    },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
      },
    },
  );
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isAffirmative(value: unknown): boolean {
  return ["yes", "true", "required", "active", "confirmed", "completed"].includes(text(value).toLowerCase());
}

function readPositiveInteger(value: unknown, fallback: number, maximum: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > maximum) return null;
  return value;
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function classifyDate(value: string | null | undefined, horizonDays: number): DateStatus {
  const date = parseDateOnly(value);
  if (!date) return "missing";

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const horizon = new Date(today.getTime() + horizonDays * DAY_MS);

  if (date.getTime() < today.getTime()) return "expired";
  if (date.getTime() <= horizon.getTime()) return "due_soon";
  return "current";
}

function isPastDue(value: string | null | undefined): boolean {
  const date = parseDateOnly(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return date.getTime() < today.getTime();
}

function latestByEmployee<T extends { employee_id: number; created_at?: string | null }>(rows: T[]): Map<number, T> {
  const map = new Map<number, T>();

  for (const row of rows) {
    const current = map.get(row.employee_id);
    if (!current) {
      map.set(row.employee_id, row);
      continue;
    }

    const currentTime = current.created_at ? new Date(current.created_at).getTime() : 0;
    const nextTime = row.created_at ? new Date(row.created_at).getTime() : 0;
    if (nextTime >= currentTime) map.set(row.employee_id, row);
  }

  return map;
}

async function loadSafeEmployees(
  supabase: any,
  organisationId: string,
) {
  const result = await (supabase as any)
    .from("employees")
    .select("id,name,role,status")
    .eq("organisation_id", organisationId)
    .neq("status", "Archived")
    .order("name", { ascending: true });

  if (result.error) throw new Error("Leo could not retrieve the workforce register.");

  return (result.data || []) as Array<{
    id: number;
    name: string | null;
    role: string | null;
    status: string | null;
  }>;
}

async function loadSafeDueItems(args: {
  supabase: any;
  employees: Array<{ id: number; name: string | null; role: string | null }>;
  horizonDays: number;
}) {
  const { supabase, employees, horizonDays } = args;
  const employeeIds = employees.map((employee) => employee.id);
  if (employeeIds.length === 0) return [] as SafeDueItem[];

  const [rtwResult, dbsResult, drivingResult, trainingResult, qualificationResult] = await Promise.all([
    supabase
      .from("employee_right_to_work")
      .select("employee_id,right_to_work_expiry,next_review_date,created_at")
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("employee_dbs_checks")
      .select("employee_id,dbs_required,dbs_level,next_check_due,update_service,update_service_next_check_due,safeguarding_training_expiry,created_at")
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("employee_driving_checks")
      .select("employee_id,drives_for_work,licence_expiry_date,next_dvla_check_due,business_insurance_expiry_date,mot_required,mot_expiry_date,created_at")
      .in("employee_id", employeeIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("employee_training_logs")
      .select("id,employee_id,training_name,refresh_or_expiry_date")
      .in("employee_id", employeeIds),
    supabase
      .from("employee_qualifications")
      .select("id,employee_id,title,expiry_date,status,renewal_required")
      .in("employee_id", employeeIds)
      .eq("is_archived", false),
  ]);

  const requiredResults = [rtwResult, dbsResult, drivingResult, trainingResult, qualificationResult];
  if (requiredResults.some((result) => result.error)) {
    throw new Error("Leo could not retrieve the privacy-safe due-diligence overview.");
  }

  const rtwByEmployee = latestByEmployee((rtwResult.data || []) as Array<{
    employee_id: number;
    right_to_work_expiry: string | null;
    next_review_date: string | null;
    created_at: string | null;
  }>);

  const dbsByEmployee = latestByEmployee((dbsResult.data || []) as Array<{
    employee_id: number;
    dbs_required: string | null;
    dbs_level: string | null;
    next_check_due: string | null;
    update_service: string | null;
    update_service_next_check_due: string | null;
    safeguarding_training_expiry: string | null;
    created_at: string | null;
  }>);

  const drivingByEmployee = latestByEmployee((drivingResult.data || []) as Array<{
    employee_id: number;
    drives_for_work: string | null;
    licence_expiry_date: string | null;
    next_dvla_check_due: string | null;
    business_insurance_expiry_date: string | null;
    mot_required: string | null;
    mot_expiry_date: string | null;
    created_at: string | null;
  }>);

  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const items: SafeDueItem[] = [];

  const pushItem = (employeeId: number, itemType: string, dueDate: string | null | undefined) => {
    const employee = employeesById.get(employeeId);
    if (!employee) return;

    items.push({
      employee_id: employeeId,
      employee_name: employee.name || `Employee ${employeeId}`,
      employee_role: employee.role || null,
      item_type: itemType,
      due_date: dueDate || null,
      status: classifyDate(dueDate, horizonDays),
    });
  };

  for (const employee of employees) {
    const rtw = rtwByEmployee.get(employee.id);
    pushItem(employee.id, "Right to Work review", rtw?.next_review_date || rtw?.right_to_work_expiry || null);

    const dbs = dbsByEmployee.get(employee.id);
    if (dbs && isAffirmative(dbs.dbs_required)) {
      const level = text(dbs.dbs_level);
      pushItem(employee.id, level ? `DBS ${level}` : "DBS re-check", dbs.next_check_due);
      pushItem(employee.id, "Safeguarding training", dbs.safeguarding_training_expiry);

      if (isAffirmative(dbs.update_service)) {
        pushItem(employee.id, "DBS Update Service check", dbs.update_service_next_check_due);
      }
    }

    const driving = drivingByEmployee.get(employee.id);
    if (driving && isAffirmative(driving.drives_for_work)) {
      pushItem(employee.id, "Driving licence", driving.licence_expiry_date);
      pushItem(employee.id, "DVLA check", driving.next_dvla_check_due);
      pushItem(employee.id, "Business insurance", driving.business_insurance_expiry_date);
      if (isAffirmative(driving.mot_required)) pushItem(employee.id, "MOT", driving.mot_expiry_date);
    }
  }

  for (const row of (trainingResult.data || []) as Array<{
    employee_id: number;
    training_name: string | null;
    refresh_or_expiry_date: string | null;
  }>) {
    pushItem(row.employee_id, `${text(row.training_name) || "Training"} refresh`, row.refresh_or_expiry_date);
  }

  for (const row of (qualificationResult.data || []) as Array<{
    employee_id: number;
    title: string | null;
    expiry_date: string | null;
    status: string | null;
    renewal_required: boolean | null;
  }>) {
    if (row.expiry_date || row.renewal_required === true || text(row.status)) {
      pushItem(row.employee_id, `${text(row.title) || "Qualification"} qualification`, row.expiry_date);
    }
  }

  return items.sort((a, b) => {
    const rank: Record<DateStatus, number> = { expired: 0, missing: 1, due_soon: 2, current: 3 };
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    const aTime = a.due_date ? parseDateOnly(a.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const bTime = b.due_date ? parseDateOnly(b.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

export async function GET() {
  return NextResponse.json({
    service: "Leo HR ChatGPT MCP",
    status: "available",
    mode: "privacy-filtered-read-only",
  });
}

export async function POST(request: Request) {
  let body: {
    jsonrpc?: string;
    id?: unknown;
    method?: string;
    params?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Invalid JSON-RPC request.", 400);
  }

  if (body.method === "initialize") {
    return rpcResult(body.id, {
      protocolVersion,
      capabilities: { tools: {} },
      serverInfo: {
        name: "leo-hr",
        title: "Leo HR",
        version: "0.2.0",
      },
      instructions:
        "Leo HR provides an organisation-approved, privacy-filtered administrative view for Owner and Senior users only. Use only data returned by an approved Leo tool. Never infer access to employee personal details, medical information, uploaded documents, evidence, certificate/reference numbers, candidate personal data, Matter narrative, SAR contents, payroll/banking data or any data not explicitly returned. Leo tools in this version are read-only and must not be represented as having changed records, sent communications or invoked Ask Leo.",
    });
  }

  if (body.method === "notifications/initialized") {
    return new NextResponse(null, { status: 202 });
  }

  if (body.method === "ping") {
    return rpcResult(body.id, {});
  }

  if (body.method === "tools/list") {
    return rpcResult(body.id, { tools });
  }

  if (body.method !== "tools/call") {
    return rpcError(body.id, -32601, "Method not found.");
  }

  const authentication = await authenticateChatGptMcpRequest(request);

  if (!authentication.ok) {
    if (authentication.status === 401) {
      return oauthChallenge(request, authentication.message);
    }

    return rpcError(body.id, -32003, authentication.message, 403);
  }

  const toolName = String(body.params?.name || "");
  const rawArguments = body.params?.arguments;
  const args =
    rawArguments && typeof rawArguments === "object" && !Array.isArray(rawArguments)
      ? (rawArguments as Record<string, unknown>)
      : {};

  if (toolName === "leo_get_company_context") {
    const requestedSection =
      typeof args.section === "string" && args.section.trim() ? args.section.trim() : "all";

    const allowedSections = new Set([
      "all",
      "Company Profile",
      "Employment Framework",
      "Organisation Structure",
      "Company Knowledge",
    ]);

    if (!allowedSections.has(requestedSection)) {
      return rpcError(body.id, -32602, "The requested Foundations section is invalid.");
    }

    let query = authentication.context.supabase
      .from("organisation_foundations")
      .select("section,key,value,source")
      .eq("organisation_id", authentication.context.organisationId)
      .in("section", ["Company Profile", "Employment Framework", "Organisation Structure", "Company Knowledge"])
      .order("section", { ascending: true })
      .order("created_at", { ascending: true });

    if (requestedSection !== "all") query = query.eq("section", requestedSection);

    const result = await query;
    if (result.error) {
      return rpcError(body.id, -32000, "Leo could not retrieve the approved organisation context.", 500);
    }

    const rows = (result.data || []) as Array<{
      section: string;
      key: string;
      value: unknown;
      source: string | null;
    }>;

    const grouped = rows.reduce<Record<string, Record<string, unknown>>>((output, row) => {
      output[row.section] ||= {};
      output[row.section][row.key] = row.value;
      return output;
    }, {});

    return toolResult(body.id, {
      organisation_id: authentication.context.organisationId,
      access_role: authentication.context.role,
      mode: "privacy-filtered-read-only",
      section: requestedSection,
      foundations: grouped,
    });
  }

  if (toolName === "leo_search_employees") {
    const search = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
    const limit = readPositiveInteger(args.limit, 50, 100);
    if (limit === null) return rpcError(body.id, -32602, "The employee result limit must be between 1 and 100.");

    try {
      const employees = await loadSafeEmployees(
        authentication.context.supabase as any,
        authentication.context.organisationId,
      );

      const matching = search
        ? employees.filter((employee) =>
            [employee.name, employee.role]
              .filter((value): value is string => typeof value === "string")
              .some((value) => value.toLowerCase().includes(search)),
          )
        : employees;

      const selected = matching.slice(0, limit).map((employee) => ({
        id: employee.id,
        name: employee.name,
        role: employee.role,
      }));

      return toolResult(body.id, {
        organisation_id: authentication.context.organisationId,
        access_role: authentication.context.role,
        mode: "privacy-filtered-read-only",
        query: search || null,
        returned_count: selected.length,
        total_matching_count: matching.length,
        employees: selected,
      });
    } catch {
      return rpcError(body.id, -32000, "Leo could not retrieve the privacy-safe employee register.", 500);
    }
  }

  if (toolName === "leo_get_employee_overview") {
    const employeeId =
      typeof args.employee_id === "number" && Number.isInteger(args.employee_id) && args.employee_id > 0
        ? args.employee_id
        : null;
    if (!employeeId) return rpcError(body.id, -32602, "A valid employee_id is required.");

    const horizonDays = readPositiveInteger(args.horizon_days, 30, 90);
    if (horizonDays === null) return rpcError(body.id, -32602, "horizon_days must be between 1 and 90.");

    try {
      const employeeResult = await authentication.context.supabase
        .from("employees")
        .select("id,name,role,status")
        .eq("id", employeeId)
        .eq("organisation_id", authentication.context.organisationId)
        .neq("status", "Archived")
        .maybeSingle();

      if (employeeResult.error) return rpcError(body.id, -32000, "Leo could not retrieve the employee overview.", 500);
      if (!employeeResult.data) return rpcError(body.id, -32004, "The employee record could not be found or accessed.", 404);

      const employee = employeeResult.data as { id: number; name: string | null; role: string | null; status: string | null };
      const items = await loadSafeDueItems({
        supabase: authentication.context.supabase,
        employees: [employee],
        horizonDays,
      });

      return toolResult(body.id, {
        organisation_id: authentication.context.organisationId,
        access_role: authentication.context.role,
        mode: "privacy-filtered-read-only",
        employee: {
          id: employee.id,
          name: employee.name,
          role: employee.role,
        },
        due_items: items.map(({ employee_id: _employeeId, employee_name: _employeeName, employee_role: _employeeRole, ...item }) => item),
      });
    } catch {
      return rpcError(body.id, -32000, "Leo could not retrieve the privacy-safe employee overview.", 500);
    }
  }

  if (toolName === "leo_get_attention_summary") {
    const horizonDays = readPositiveInteger(args.horizon_days, 30, 90);
    const limit = readPositiveInteger(args.limit, 50, 100);
    if (horizonDays === null) return rpcError(body.id, -32602, "horizon_days must be between 1 and 90.");
    if (limit === null) return rpcError(body.id, -32602, "The attention result limit must be between 1 and 100.");

    try {
      const employees = await loadSafeEmployees(
        authentication.context.supabase as any,
        authentication.context.organisationId,
      );
      const employeeIds = employees.map((employee) => employee.id);
      const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
      const dueItems = await loadSafeDueItems({
        supabase: authentication.context.supabase,
        employees,
        horizonDays,
      });

      const actionableDueItems = dueItems
        .filter((item) => item.status !== "current")
        .slice(0, limit);

      const [mattersResult, assignmentsResult, qualificationsResult, appointmentsResult, onboardingItemsResult] = await Promise.all([
        employeeIds.length > 0
          ? authentication.context.supabase
              .from("matters")
              .select("id,employee_id,matter_type,status,created_at")
              .in("employee_id", employeeIds)
              .neq("status", "Closed")
              .order("created_at", { ascending: false })
              .limit(limit)
          : Promise.resolve({ data: [], error: null }),
        authentication.context.supabase
          .from("learning_assignments")
          .select("id,status,due_date,employees!learning_assignments_employee_id_fkey!inner(id,organisation_id)")
          .eq("employees.organisation_id", authentication.context.organisationId)
          .eq("is_archived", false),
        authentication.context.supabase
          .from("employee_qualifications")
          .select("id,status,verification_status,expiry_date,employees!employee_qualifications_employee_id_fkey!inner(id,organisation_id)")
          .eq("employees.organisation_id", authentication.context.organisationId)
          .eq("is_archived", false),
        authentication.context.supabase
          .from("leo_talent_appointments")
          .select("id,status")
          .eq("organisation_id", authentication.context.organisationId),
        authentication.context.supabase
          .from("leo_talent_onboarding_items")
          .select("id,status,due_date")
          .eq("organisation_id", authentication.context.organisationId),
      ]);

      if (
        mattersResult.error ||
        assignmentsResult.error ||
        qualificationsResult.error ||
        appointmentsResult.error ||
        onboardingItemsResult.error
      ) {
        return rpcError(body.id, -32000, "Leo could not build the operational attention summary.", 500);
      }

      const matters = ((mattersResult.data || []) as Array<{
        id: number;
        employee_id: number | null;
        matter_type: string | null;
        status: string | null;
        created_at: string | null;
      }>).map((matter) => ({
        id: matter.id,
        employee_name: matter.employee_id ? employeeById.get(matter.employee_id)?.name || null : null,
        matter_type: matter.matter_type,
        status: matter.status,
        created_at: matter.created_at,
        next_admin_step: matter.status === "Needs Attention" ? "Review this Matter in Leo." : "Check the current Matter workflow in Leo.",
      }));

      const assignmentRows = (assignmentsResult.data || []) as Array<{ status: string | null; due_date: string | null }>;
      const qualificationRows = (qualificationsResult.data || []) as Array<{
        status: string | null;
        verification_status: string | null;
        expiry_date: string | null;
      }>;
      const appointmentRows = (appointmentsResult.data || []) as Array<{ status: string | null }>;
      const onboardingRows = (onboardingItemsResult.data || []) as Array<{ status: string | null; due_date: string | null }>;

      const attentionCounts = actionableDueItems.reduce(
        (counts, item) => {
          if (item.status === "missing" || item.status === "expired" || item.status === "due_soon") {
            counts[item.status] += 1;
          }
          return counts;
        },
        { missing: 0, expired: 0, due_soon: 0 } as Record<"missing" | "expired" | "due_soon", number>,
      );

      const learning = {
        assignments_total: assignmentRows.length,
        assignments_overdue: assignmentRows.filter(
          (row) => !["Completed", "Cancelled"].includes(text(row.status)) && isPastDue(row.due_date),
        ).length,
        qualifications_total: qualificationRows.length,
        qualifications_expired: qualificationRows.filter((row) => text(row.status) === "Expired" || isPastDue(row.expiry_date)).length,
        qualifications_pending_verification: qualificationRows.filter(
          (row) => text(row.verification_status) === "Pending Verification",
        ).length,
      };

      const onboarding = {
        appointments_total: appointmentRows.length,
        appointments_open: appointmentRows.filter(
          (row) => !["started", "employment_commenced", "withdrawn", "cancelled"].includes(text(row.status).toLowerCase()),
        ).length,
        checklist_items_total: onboardingRows.length,
        checklist_items_overdue: onboardingRows.filter(
          (row) => !["complete", "not_required"].includes(text(row.status).toLowerCase()) && isPastDue(row.due_date),
        ).length,
      };

      return toolResult(body.id, {
        organisation_id: authentication.context.organisationId,
        access_role: authentication.context.role,
        mode: "privacy-filtered-read-only",
        horizon_days: horizonDays,
        counts: {
          workforce_attention: attentionCounts,
          open_matters: matters.length,
          learning,
          onboarding,
        },
        workforce_attention: actionableDueItems,
        matters,
        learning,
        onboarding,
      });
    } catch {
      return rpcError(body.id, -32000, "Leo could not build the privacy-safe attention summary.", 500);
    }
  }

  if (toolName === "leo_search_matters") {
    const status = typeof args.status === "string" && args.status.trim() ? args.status.trim() : "all";
    const allowedStatuses = new Set(["all", "Open", "In Progress", "Needs Attention", "Closed"]);
    if (!allowedStatuses.has(status)) return rpcError(body.id, -32602, "The Matter status filter is invalid.");

    const employeeId =
      args.employee_id === undefined
        ? null
        : typeof args.employee_id === "number" && Number.isInteger(args.employee_id) && args.employee_id > 0
          ? args.employee_id
          : -1;
    if (employeeId === -1) return rpcError(body.id, -32602, "employee_id must be a positive integer.");

    const limit = readPositiveInteger(args.limit, 50, 100);
    if (limit === null) return rpcError(body.id, -32602, "The Matter result limit must be between 1 and 100.");

    try {
      const employees = await loadSafeEmployees(
        authentication.context.supabase as any,
        authentication.context.organisationId,
      );
      const employeeIds = employees.map((employee) => employee.id);
      const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

      if (employeeId && !employeeIds.includes(employeeId)) {
        return rpcError(body.id, -32004, "The employee record could not be found or accessed.", 404);
      }

      if (employeeIds.length === 0) {
        return toolResult(body.id, {
          organisation_id: authentication.context.organisationId,
          access_role: authentication.context.role,
          mode: "privacy-filtered-read-only",
          returned_count: 0,
          matters: [],
        });
      }

      let matterQuery = authentication.context.supabase
        .from("matters")
        .select("id,employee_id,matter_type,status,created_at")
        .in("employee_id", employeeId ? [employeeId] : employeeIds)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status !== "all") matterQuery = matterQuery.eq("status", status);

      const matterResult = await matterQuery;
      if (matterResult.error) return rpcError(body.id, -32000, "Leo could not retrieve Matter summaries.", 500);

      const matters = ((matterResult.data || []) as Array<{
        id: number;
        employee_id: number | null;
        matter_type: string | null;
        status: string | null;
        created_at: string | null;
      }>).map((matter) => ({
        id: matter.id,
        employee_name: matter.employee_id ? employeeById.get(matter.employee_id)?.name || null : null,
        matter_type: matter.matter_type,
        status: matter.status,
        created_at: matter.created_at,
      }));

      return toolResult(body.id, {
        organisation_id: authentication.context.organisationId,
        access_role: authentication.context.role,
        mode: "privacy-filtered-read-only",
        returned_count: matters.length,
        matters,
      });
    } catch {
      return rpcError(body.id, -32000, "Leo could not retrieve the privacy-safe Matter summaries.", 500);
    }
  }

  if (toolName === "leo_get_learning_summary") {
    try {
      const [modulesResult, assignmentsResult, pathwaysResult, qualificationsResult] = await Promise.all([
        authentication.context.supabase
          .from("learning_modules")
          .select("id,status")
          .eq("organisation_id", authentication.context.organisationId)
          .eq("is_archived", false),
        authentication.context.supabase
          .from("learning_assignments")
          .select("id,status,due_date,manager_validation_status,employees!learning_assignments_employee_id_fkey!inner(id,organisation_id)")
          .eq("employees.organisation_id", authentication.context.organisationId)
          .eq("is_archived", false),
        authentication.context.supabase
          .from("development_pathways")
          .select("id,status,next_review_date")
          .eq("organisation_id", authentication.context.organisationId)
          .eq("is_archived", false),
        authentication.context.supabase
          .from("employee_qualifications")
          .select("id,status,verification_status,expiry_date,employees!employee_qualifications_employee_id_fkey!inner(id,organisation_id)")
          .eq("employees.organisation_id", authentication.context.organisationId)
          .eq("is_archived", false),
      ]);

      if (modulesResult.error || assignmentsResult.error || pathwaysResult.error || qualificationsResult.error) {
        return rpcError(body.id, -32000, "Leo could not retrieve the Leo Learn summary.", 500);
      }

      const modules = (modulesResult.data || []) as Array<{ status: string | null }>;
      const assignments = (assignmentsResult.data || []) as Array<{
        status: string | null;
        due_date: string | null;
        manager_validation_status: string | null;
      }>;
      const pathways = (pathwaysResult.data || []) as Array<{ status: string | null; next_review_date: string | null }>;
      const qualifications = (qualificationsResult.data || []) as Array<{
        status: string | null;
        verification_status: string | null;
        expiry_date: string | null;
      }>;

      return toolResult(body.id, {
        organisation_id: authentication.context.organisationId,
        access_role: authentication.context.role,
        mode: "privacy-filtered-read-only",
        learning: {
          modules_total: modules.length,
          modules_published: modules.filter((row) => text(row.status) === "Published").length,
          assignments_total: assignments.length,
          assignments_in_progress: assignments.filter((row) => ["Assigned", "In Progress"].includes(text(row.status))).length,
          assignments_completed: assignments.filter((row) => text(row.status) === "Completed").length,
          assignments_overdue: assignments.filter(
            (row) => !["Completed", "Cancelled"].includes(text(row.status)) && isPastDue(row.due_date),
          ).length,
          assignments_pending_manager_validation: assignments.filter(
            (row) => text(row.manager_validation_status) === "Pending",
          ).length,
          pathways_total: pathways.length,
          pathways_published: pathways.filter((row) => text(row.status) === "Published").length,
          pathways_due_for_review: pathways.filter((row) => isPastDue(row.next_review_date)).length,
          qualifications_total: qualifications.length,
          qualifications_current: qualifications.filter((row) => text(row.status) === "Current").length,
          qualifications_due_for_renewal: qualifications.filter((row) => text(row.status) === "Due for Renewal").length,
          qualifications_expired: qualifications.filter((row) => text(row.status) === "Expired" || isPastDue(row.expiry_date)).length,
          qualifications_pending_verification: qualifications.filter(
            (row) => text(row.verification_status) === "Pending Verification",
          ).length,
        },
      });
    } catch {
      return rpcError(body.id, -32000, "Leo could not retrieve the privacy-safe Leo Learn summary.", 500);
    }
  }

  if (toolName === "leo_get_onboarding_summary") {
    const limit = readPositiveInteger(args.limit, 50, 100);
    if (limit === null) return rpcError(body.id, -32602, "The onboarding result limit must be between 1 and 100.");

    try {
      const [appointmentsResult, itemsResult] = await Promise.all([
        authentication.context.supabase
          .from("leo_talent_appointments")
          .select("id,status")
          .eq("organisation_id", authentication.context.organisationId),
        authentication.context.supabase
          .from("leo_talent_onboarding_items")
          .select("id,item_name,item_category,status,due_date")
          .eq("organisation_id", authentication.context.organisationId)
          .order("due_date", { ascending: true }),
      ]);

      if (appointmentsResult.error || itemsResult.error) {
        return rpcError(body.id, -32000, "Leo could not retrieve the onboarding summary.", 500);
      }

      const appointments = (appointmentsResult.data || []) as Array<{ status: string | null }>;
      const items = (itemsResult.data || []) as Array<{
        item_name: string | null;
        item_category: string | null;
        status: string | null;
        due_date: string | null;
      }>;

      const overdueItems = items
        .filter((row) => !["complete", "not_required"].includes(text(row.status).toLowerCase()) && isPastDue(row.due_date))
        .slice(0, limit)
        .map((row) => ({
          item_name: row.item_name,
          item_category: row.item_category,
          status: row.status,
          due_date: row.due_date,
        }));

      const appointmentStatusCounts = appointments.reduce<Record<string, number>>((output, row) => {
        const key = text(row.status) || "unknown";
        output[key] = (output[key] || 0) + 1;
        return output;
      }, {});

      const itemStatusCounts = items.reduce<Record<string, number>>((output, row) => {
        const key = text(row.status) || "unknown";
        output[key] = (output[key] || 0) + 1;
        return output;
      }, {});

      return toolResult(body.id, {
        organisation_id: authentication.context.organisationId,
        access_role: authentication.context.role,
        mode: "privacy-filtered-read-only",
        onboarding: {
          appointments_total: appointments.length,
          appointment_status_counts: appointmentStatusCounts,
          checklist_items_total: items.length,
          checklist_status_counts: itemStatusCounts,
          overdue_checklist_items: overdueItems,
        },
      });
    } catch {
      return rpcError(body.id, -32000, "Leo could not retrieve the privacy-safe onboarding summary.", 500);
    }
  }

  return rpcError(body.id, -32602, "Unknown Leo tool.");
}
