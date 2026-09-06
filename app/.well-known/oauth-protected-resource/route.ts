import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "Leo OAuth is not configured." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [`${origin}/auth/v1`],
    scopes_supported: ["openid", "email", "profile"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${origin}/dashboard/foundations/connections`,
  });
}
