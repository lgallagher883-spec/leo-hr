import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json(
      { error: "Leo OAuth is not configured." },
      { status: 503 },
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(`${supabaseUrl}/auth/v1/oauth/authorize`);
  incoming.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  return NextResponse.redirect(target, 307);
}
