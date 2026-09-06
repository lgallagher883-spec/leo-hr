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

  const issuer = `${origin}/auth/v1`;

  return NextResponse.json({
    issuer,
    authorization_endpoint: `${supabaseUrl}/auth/v1/oauth/authorize`,
    token_endpoint: `${supabaseUrl}/auth/v1/oauth/token`,
    jwks_uri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
    userinfo_endpoint: `${supabaseUrl}/auth/v1/oauth/userinfo`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["openid", "email", "profile"],
  });
}
