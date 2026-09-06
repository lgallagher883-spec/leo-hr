import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "Leo OAuth is not configured." },
      { status: 503 },
    );
  }

  const body = await request.arrayBuffer();
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");
  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);
  headers.set("accept", "application/json");

  const upstream = await fetch(`${supabaseUrl}/auth/v1/oauth/token`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);
  responseHeaders.set("cache-control", "no-store");
  responseHeaders.set("pragma", "no-cache");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
