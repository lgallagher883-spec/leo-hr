import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureEmployerSupportAccount } from "@/lib/employer-support/provisioning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (!tokenHash || type !== "email") {
    return NextResponse.redirect(new URL("/employer-support/sign-in?error=verification_failed", requestUrl.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(new URL("/employer-support/sign-in?error=verification_failed", requestUrl.origin));
  }

  const { data: profile } = await supabase.from("user_profiles").select("organisation_id").eq("user_id", data.user.id).maybeSingle();
  const organisationId = profile?.organisation_id ?? null;

  if (!organisationId) {
    return NextResponse.redirect(new URL("/employer-support/sign-in?error=account_setup_incomplete", requestUrl.origin));
  }

  try {
    await ensureEmployerSupportAccount(organisationId, data.user.id);
  } catch (error) {
    console.error("Employer Support confirmation provisioning failed:", error);
    return NextResponse.redirect(new URL("/employer-support/sign-in?error=account_setup_failed", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/employer-support", requestUrl.origin));
}
