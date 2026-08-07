import { NextResponse } from "next/server";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { ensureFreeTrialProvisioning } from "@/lib/billing/freeTrialProvisioning";
import { resolveRegistrationIntent } from "@/lib/billing/registrationIntent";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrganisationProfile = {
  organisation_id: string | null;
};

type OrganisationMembership = {
  organisation_id: string;
};

function resolveSafeRedirectPath(requestUrl: URL, fallbackPath: string) {
  const requestedPath = requestUrl.searchParams.get("next");

  if (!requestedPath) {
    return fallbackPath;
  }

  const parsedTarget = new URL(requestedPath, requestUrl.origin);

  if (parsedTarget.origin !== requestUrl.origin) {
    return fallbackPath;
  }

  return `${parsedTarget.pathname}${parsedTarget.search}${parsedTarget.hash}`;
}

async function resolveOrganisationId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organisation_id")
    .eq("user_id", userId)
    .maybeSingle();

  const profileOrganisationId = (profile as OrganisationProfile | null)
    ?.organisation_id;

  if (profileOrganisationId) {
    return profileOrganisationId;
  }

  const { data: legacyMembership } = await supabase
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if ((legacyMembership as OrganisationMembership | null)?.organisation_id) {
    return (legacyMembership as OrganisationMembership).organisation_id;
  }

  const { data: identityMembership } = await (supabase as any)
    .from("identity_organisation_memberships")
    .select("organisation_id")
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (identityMembership as OrganisationMembership | null)
    ?.organisation_id ?? null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", requestUrl.origin),
    );
  }

  if (type !== "email") {
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", requestUrl.origin),
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", requestUrl.origin),
    );
  }

  const organisationId = await resolveOrganisationId(supabase, data.user.id);
  const registrationIntent = resolveRegistrationIntent(data.user.user_metadata);

  if (!organisationId) {
    return NextResponse.redirect(
      new URL("/login?error=registration_profile_missing", requestUrl.origin),
    );
  }

  if (registrationIntent.kind === "free_trial") {
    await ensureFreeTrialProvisioning(organisationId);
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase as any, {
    userId: data.user.id,
    organisationId,
    allowedStatuses: ["active", "accepted"],
  });

  const defaultRedirectPath =
    registrationIntent.pendingPlanKey &&
    resolvedRole?.roleKey === "owner" &&
    registrationIntent.kind === "paid_subscription"
      ? `/checkout/prepare?plan=${registrationIntent.pendingPlanKey}`
      : "/dashboard";

  const safeRedirectPath = resolveSafeRedirectPath(
    requestUrl,
    defaultRedirectPath,
  );

  return NextResponse.redirect(new URL(safeRedirectPath, requestUrl.origin));
}
