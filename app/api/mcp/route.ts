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

export async function GET() {
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

  if (toolName !== "leo_get_company_context") {
    return rpcError(body.id, -32602, "Unknown Leo tool.");
  }

  const requestedSection =
    typeof args.section === "string" && args.section.trim()
      ? args.section.trim()
      : "all";

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
    .in("section", [
      "Company Profile",
      "Employment Framework",
      "Organisation Structure",
      "Company Knowledge",
    ])
    .order("section", { ascending: true })
    .order("created_at", { ascending: true });

  if (requestedSection !== "all") {
    query = query.eq("section", requestedSection);
  }

  const result = await query;

  if (result.error) {
    return rpcError(
      body.id,
      -32000,
      "Leo could not retrieve the approved organisation context.",
      500,
    );
  }

  const rows = (result.data || []) as Array<{
    section: string;
    key: string;
    value: unknown;
    source: string | null;
  }>;

  const grouped = rows.reduce<Record<string, Record<string, unknown>>>(
    (output, row) => {
      output[row.section] ||= {};
      output[row.section][row.key] = row.value;
      return output;
    },
    {},
  );

  const payload = {
    organisation_id: authentication.context.organisationId,
    access_role: authentication.context.role,
    mode: "read-only",
    section: requestedSection,
    foundations: grouped,
  };

  return rpcResult(body.id, {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  });
}
