import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureEmployerSupportOrganisation } from "@/lib/employer-support/accountProvisioning";
import { resolveRegistrationIntent } from "@/lib/billing/registrationIntent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findOrganisationId(supabase: any, userId: string) {
  const profile = await supabase.from("user_profiles").select("organisation_id").eq("user_id", userId).maybeSingle();
  if (profile.data?.organisation_id) return profile.data.organisation_id;

  const membership = await supabase.from("organisation_memberships").select("organisation_id").eq("user_id", userId).in("membership_status", ["active", "accepted"]).order("is_default_organisation", { ascending: false }).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (membership.data?.organisation_id) return membership.data.organisation_id;

  const identityMembership = await supabase.from("identity_organisation_memberships").select("organisation_id").eq("user_id", userId).eq("membership_status", "active").order("is_default_organisation", { ascending: false }).order("created_at", { ascending: true }).limit(1).maybeSingle();
  return identityMembership.data?.organisation_id ?? null;
}

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

  if (resolveRegistrationIntent(data.user.user_metadata).kind !== "employer_support") {
    return NextResponse.redirect(new URL("/employer-support/sign-in?error=verification_failed", requestUrl.origin));
  }

  const organisationName =
    typeof data.user.user_metadata?.organisation_name === "string"
      ? data.user.user_metadata.organisation_name.trim()
      : "";
  const employeeCountBand =
    typeof data.user.user_metadata?.employee_count_band === "string"
      ? data.user.user_metadata.employee_count_band.trim()
      : null;

  if (!organisationName) {
    return NextResponse.redirect(new URL("/employer-support/sign-in?error=account_setup_incomplete", requestUrl.origin));
  }

  try {
    await ensureEmployerSupportOrganisation({
      userId: data.user.id,
      organisationName,
      employeeCountBand,
    });
  } catch (provisioningError) {
    console.error("Employer Support confirmation provisioning failed:", provisioningError);
    return NextResponse.redirect(new URL("/employer-support/sign-in?error=account_setup_failed", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/employer-support", requestUrl.origin));
}
