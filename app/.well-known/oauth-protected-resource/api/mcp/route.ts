import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  return NextResponse.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [`${origin}/auth/v1`],
    scopes_supported: ["email", "profile"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${origin}/dashboard/foundations/connections`,
  });
}
