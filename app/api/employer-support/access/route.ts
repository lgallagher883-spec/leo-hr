import { NextResponse } from "next/server";
import {
  EmployerSupportAccessLookupError,
  getEmployerSupportAccess,
} from "@/lib/auth/employerSupportAccess";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access = await getEmployerSupportAccess();
    if (!access) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EmployerSupportAccessLookupError) {
      console.error("Employer Support access check failed:", error);
      return NextResponse.json(
        { ok: false, error: "Employer Support access could not be checked. Please try again." },
        { status: 503 },
      );
    }
    throw error;
  }
}
