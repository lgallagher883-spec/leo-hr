import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const authorization = request.headers.get("authorization");

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "Leo OAuth is not configured." },
      { status: 503 },
    );
  }

  if (!authorization) {
    return NextResponse.json(
      { error: "Missing bearer token." },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${supabaseUrl}/auth/v1/oauth/userinfo`, {
    headers: {
      authorization,
      accept: "application/json",
    },
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);
  responseHeaders.set("cache-control", "no-store");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
