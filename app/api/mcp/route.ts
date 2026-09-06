import { NextResponse } from "next/server";

import { authenticateChatGptMcpRequest } from "@/lib/chatgpt/mcpAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const protocolVersion = "2025-06-18";

const tools = [
  {
    name: "leo_get_company_context",
    title: "Get Leo company context",
    description:
      "Read approved organisation Foundations information from Leo, including company profile, employment framework, organisation structure and company knowledge. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: [
            "all",
            "Company Profile",
            "Employment Framework",
            "Organisation Structure",
            "Company Knowledge",
          ],
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
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "leo_search_employees",
    title: "Search Leo employees",
    description:
      "Read the authenticated organisation's employee register. Optionally search by name, role, email or status. Includes manager and employment/probation details where recorded. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional search text matched against name, role, email and status." },
        status: { type: "string", enum: ["all", "Active", "Former Employee", "Archived"], description: "Optional status filter." },
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
    name: "leo_get_employee",
    title: "Get Leo employee",
    description:
      "Read one employee belonging to the authenticated organisation. Optionally include the employee timeline and related audit events. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        employee_id: { type: "integer", minimum: 1, description: "The Leo employee ID." },
        include_timeline: { type: "boolean", description: "Include employee timeline and related audit events." },
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
  const resourceMetadata = `${origin}/.well-known/oauth-protected-resource`;

  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32001, message },
    },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadata}", scope="email profile"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "WWW-Authenticate",
      },
    },
  );
}

export async function GET(request: Request) {
  const accept = request.headers.get("accept") || "";

  // MCP Streamable HTTP clients may probe the endpoint with GET and
  // Accept: text/event-stream. Leo is a stateless JSON-only MCP server and
  // does not expose an SSE listener, so the MCP transport requires 405 here.
  if (accept.includes("text/event-stream")) {
    return new NextResponse(null, {
      status: 405,
      headers: {
        Allow: "POST",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Keep a lightweight browser/monitor health response for ordinary GETs.
  return NextResponse.json({
    service: "Leo HR ChatGPT MCP",
    status: "available",
    mode: "read-only",
  });
}

export async function POST(request: Request) {
  if (!request.headers.get("authorization")) {
    return oauthChallenge(request, "Authentication is required to connect ChatGPT to Leo HR.");
  }

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

  const authentication = await authenticateChatGptMcpRequest(request);

  if (!authentication.ok) {
    if (authentication.status === 401) {
      return oauthChallenge(request, authentication.message);
    }

    return rpcError(body.id, -32003, authentication.message, 403);
  }

  if (body.method === "initialize") {
    return rpcResult(body.id, {
      protocolVersion,
      capabilities: { tools: {} },
      serverInfo: {
        name: "leo-hr",
        title: "Leo HR",
        version: "0.1.0",
      },
      instructions:
        "Leo HR provides organisation-approved, read-only business context. Do not infer access to data that is not returned by a Leo tool.",
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
      "all", "Company Profile", "Employment Framework", "Organisation Structure", "Company Knowledge",
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

    const rows = (result.data || []) as Array<{ section: string; key: string; value: unknown; source: string | null }>;
    const grouped = rows.reduce<Record<string, Record<string, unknown>>>((output, row) => {
      output[row.section] ||= {};
      output[row.section][row.key] = row.value;
      return output;
    }, {});

    return toolResult(body.id, {
      organisation_id: authentication.context.organisationId,
      access_role: authentication.context.role,
      mode: "read-only",
      section: requestedSection,
      foundations: grouped,
    });
  }

  if (toolName === "leo_search_employees") {
    const search = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
    const status = typeof args.status === "string" && args.status.trim() ? args.status.trim() : "all";
    const allowedStatuses = new Set(["all", "Active", "Former Employee", "Archived"]);
    if (!allowedStatuses.has(status)) {
      return rpcError(body.id, -32602, "The employee status filter is invalid.");
    }

    const limit = typeof args.limit === "number" && Number.isInteger(args.limit) ? args.limit : 50;
    if (limit < 1 || limit > 100) {
      return rpcError(body.id, -32602, "The employee result limit must be between 1 and 100.");
    }

    let employeeQuery = authentication.context.supabase
      .from("employees")
      .select("id,name,role,email,start_date,status")
      .eq("organisation_id", authentication.context.organisationId)
      .order("name", { ascending: true });

    if (status !== "all") employeeQuery = employeeQuery.eq("status", status);

    const employeeResult = await employeeQuery;
    if (employeeResult.error) {
      return rpcError(body.id, -32000, "Leo could not retrieve the employee register.", 500);
    }

    const allEmployees = (employeeResult.data || []) as Array<{
      id: number; name: string; role: string | null; email: string | null; start_date: string | null; status: string | null;
    }>;

    const matching = search
      ? allEmployees.filter((employee) =>
          [employee.name, employee.role, employee.email, employee.status]
            .filter((value): value is string => typeof value === "string")
            .some((value) => value.toLowerCase().includes(search)))
      : allEmployees;

    const selected = matching.slice(0, limit);
    const ids = selected.map((employee) => employee.id);
    let details: Array<{
      employee_id: number; manager: string | null; probation_end_date: string | null;
      employment_end_date: string | null; reason_for_leaving: string | null; annual_leave_allowance: string | null;
    }> = [];

    if (ids.length > 0) {
      const detailResult = await authentication.context.supabase
        .from("employee_employment_details")
        .select("employee_id,manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance")
        .in("employee_id", ids);
      if (detailResult.error) {
        return rpcError(body.id, -32000, "Leo could not retrieve employee employment details.", 500);
      }
      details = detailResult.data || [];
    }

    const detailsById = new Map(details.map((item) => [item.employee_id, item]));
    const employees = selected.map((employee) => ({
      ...employee,
      employment_details: detailsById.get(employee.id) ?? null,
    }));

    return toolResult(body.id, {
      organisation_id: authentication.context.organisationId,
      access_role: authentication.context.role,
      mode: "read-only",
      query: search || null,
      status,
      returned_count: employees.length,
      total_matching_count: matching.length,
      employees,
    });
  }

  if (toolName === "leo_get_employee") {
    const employeeId =
      typeof args.employee_id === "number" && Number.isInteger(args.employee_id) && args.employee_id > 0
        ? args.employee_id : null;

    if (!employeeId) return rpcError(body.id, -32602, "A valid employee_id is required.");
    if (args.include_timeline !== undefined && typeof args.include_timeline !== "boolean") {
      return rpcError(body.id, -32602, "include_timeline must be true or false.");
    }

    const includeTimeline = args.include_timeline === true;
    const employeeResult = await authentication.context.supabase
      .from("employees")
      .select("id,name,role,email,status,start_date")
      .eq("id", employeeId)
      .eq("organisation_id", authentication.context.organisationId)
      .maybeSingle();

    if (employeeResult.error) return rpcError(body.id, -32000, "Leo could not retrieve the employee record.", 500);
    if (!employeeResult.data) return rpcError(body.id, -32004, "The employee record could not be found or accessed.", 404);

    const employmentResult = await authentication.context.supabase
      .from("employee_employment_details")
      .select("employee_id,manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance")
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (employmentResult.error) {
      return rpcError(body.id, -32000, "Leo could not retrieve the employee employment details.", 500);
    }

    let timeline: Array<Record<string, unknown>> = [];
    if (includeTimeline) {
      const [timelineResult, auditResult] = await Promise.all([
        authentication.context.supabase
          .from("employee_timeline")
          .select("id,event_type,title,description,status,source_module,event_date,created_at")
          .eq("employee_id", employeeId)
          .eq("organisation_id", authentication.context.organisationId)
          .order("event_date", { ascending: false }).limit(200),
        authentication.context.supabase
          .from("audit_logs")
          .select("id,action,action_category,entity_type,description,source_page,created_at")
          .eq("organisation_id", authentication.context.organisationId)
          .eq("entity_type", "Employee")
          .eq("entity_id", String(employeeId))
          .order("created_at", { ascending: false }).limit(100),
      ]);

      if (timelineResult.error || auditResult.error) {
        return rpcError(body.id, -32000, "Leo could not retrieve the employee timeline.", 500);
      }

      const timelineRows = (timelineResult.data || []) as Array<{
        id: string | number;
        event_type: string | null;
        title: string | null;
        description: string | null;
        status: string | null;
        source_module: string | null;
        event_date: string | null;
        created_at: string | null;
      }>;

      const auditRows = (auditResult.data || []) as Array<{
        id: string | number;
        action: string | null;
        action_category: string | null;
        entity_type: string | null;
        description: string | null;
        source_page: string | null;
        created_at: string | null;
      }>;

      timeline = [
        ...timelineRows.map((record) => ({
          id: `employee-timeline-${record.id}`, date: record.event_date || record.created_at,
          title: record.title || record.event_type || "Employee activity",
          description: record.description || "An event was recorded against this employee.",
          status: record.status, source: record.source_module || record.event_type || "Employees",
          source_type: "employee_timeline",
        })),
        ...auditRows.map((record) => ({
          id: `audit-${record.id}`, date: record.created_at,
          title: record.action || "Employee record updated",
          description: record.description || "A recorded action affected this employee.",
          category: record.action_category, source: record.source_page || "Audit Logs", source_type: "audit_log",
        })),
      ].sort((a, b) => {
        const aTime = a.date ? new Date(String(a.date)).getTime() : 0;
        const bTime = b.date ? new Date(String(b.date)).getTime() : 0;
        return bTime - aTime;
      });
    }

    return toolResult(body.id, {
      organisation_id: authentication.context.organisationId,
      access_role: authentication.context.role,
      mode: "read-only",
      employee: { ...employeeResult.data, employment_details: employmentResult.data ?? null },
      ...(includeTimeline ? { timeline } : {}),
    });
  }

  return rpcError(body.id, -32602, "Unknown Leo tool.");
}