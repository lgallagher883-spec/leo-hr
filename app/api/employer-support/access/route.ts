import { NextResponse } from "next/server";
import { getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getEmployerSupportAccess();
  if (!access) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
