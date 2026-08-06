import { NextResponse } from "next/server";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { resolveRegistrationIntent } from "@/lib/billing/registrationIntent";
import { normaliseOrganisationWebsite } from "@/lib/url/organisationWebsite";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrganisationProfile = {
  organisation_id: string | null;
};

type OrganisationMembership = {
  organisation_id: string;
};

type TrialRecord = {
  status: string;
  starts_at: string | null;
  ends_at: string | null;
};

type SubscriptionRecord = {
  status: string;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
};

type EntitlementRecord = {
  access_status: string;
  effective_from: string | null;
  effective_until: string | null;
};

function isCurrentlyEffective(
  effectiveFrom: string | null,
  effectiveUntil: string | null,
  now: number,
) {
  const startsAt = effectiveFrom ? new Date(effectiveFrom).getTime() : null;
  const endsAt = effectiveUntil ? new Date(effectiveUntil).getTime() : null;

  if (startsAt !== null && (Number.isNaN(startsAt) || startsAt > now)) {
    return false;
  }

  if (endsAt !== null && (Number.isNaN(endsAt) || endsAt <= now)) {
    return false;
  }

  return true;
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
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_verification_code", requestUrl.origin),
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(exchangeError.message)}`,
        requestUrl.origin,
      ),
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL("/login?error=unable_to_load_user", requestUrl.origin),
    );
  }

  const invitationId =
    typeof user.user_metadata?.organisation_invitation_id === "string"
      ? user.user_metadata.organisation_invitation_id
      : null;

  if (invitationId) {
    return NextResponse.redirect(
      new URL("/auth/accept-invitation", requestUrl.origin),
    );
  }

  const organisationId = await resolveOrganisationId(supabase, user.id);
  const registrationIntent = resolveRegistrationIntent(user.user_metadata);

  if (!organisationId) {
    return NextResponse.redirect(
      new URL("/login?error=registration_profile_missing", requestUrl.origin),
    );
  }

  const websiteFromMetadataRaw = user.user_metadata?.website_url;
  const websiteFromMetadata =
    typeof websiteFromMetadataRaw === "string" ? websiteFromMetadataRaw : "";

  if (websiteFromMetadata.trim()) {
    const websiteResult = normaliseOrganisationWebsite(websiteFromMetadata);

    if (!websiteResult.isValid || !websiteResult.canonicalUrl) {
      return NextResponse.redirect(
        new URL(
          "/login?error=invalid_organisation_website",
          requestUrl.origin,
        ),
      );
    }

    const { error: websiteUpdateError } = await supabase
      .from("organisations")
      .update({ website_url: websiteResult.canonicalUrl })
      .eq("id", organisationId);

    if (websiteUpdateError) {
      console.error(
        "Auth callback organisation website normalisation failed:",
        websiteUpdateError,
      );

      return NextResponse.redirect(
        new URL("/login?error=organisation_website_unavailable", requestUrl.origin),
      );
    }
  }

  const [trialResult, subscriptionResult, entitlementResult] =
    await Promise.all([
      supabase
        .from("leo_organisation_trials")
        .select("status, starts_at, ends_at")
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      supabase
        .from("leo_organisation_subscriptions")
        .select(
          "status, current_period_starts_at, current_period_ends_at",
        )
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      supabase
        .from("leo_organisation_entitlements")
        .select("access_status, effective_from, effective_until")
        .eq("organisation_id", organisationId)
        .maybeSingle(),
    ]);

  const billingReadError =
    trialResult.error ||
    subscriptionResult.error ||
    entitlementResult.error;

  if (billingReadError) {
    console.error("Auth callback billing lookup failed:", billingReadError);

    return NextResponse.redirect(
      new URL("/login?error=billing_status_unavailable", requestUrl.origin),
    );
  }

  const trial = trialResult.data as TrialRecord | null;
  const subscription =
    subscriptionResult.data as SubscriptionRecord | null;
  const entitlement =
    entitlementResult.data as EntitlementRecord | null;

  const now = Date.now();

  const hasActiveTrial =
    registrationIntent.allowsPlatformTrialAccess &&
    trial?.status === "active" &&
    isCurrentlyEffective(trial.starts_at, trial.ends_at, now);

  const hasActiveEntitlement =
    Boolean(entitlement) &&
    ["active", "trial", "trialing", "grace"].includes(
      entitlement?.access_status ?? "",
    ) &&
    isCurrentlyEffective(
      entitlement?.effective_from ?? null,
      entitlement?.effective_until ?? null,
      now,
    );

  const hasActiveSubscription =
    Boolean(subscription) &&
    ["active", "trialing", "grace"].includes(
      subscription?.status ?? "",
    ) &&
    isCurrentlyEffective(
      subscription?.current_period_starts_at ?? null,
      subscription?.current_period_ends_at ?? null,
      now,
    );

  if (
    hasActiveTrial ||
    hasActiveEntitlement ||
    hasActiveSubscription
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", requestUrl.origin),
    );
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase as any, {
    userId: user.id,
    organisationId,
    allowedStatuses: ["active", "accepted"],
  });

  const shouldAutoStartCheckout =
    resolvedRole?.roleKey === "owner" &&
    registrationIntent.pendingPlanKey &&
    !hasActiveSubscription &&
    !hasActiveEntitlement;

  if (shouldAutoStartCheckout) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/billing?autostart=${registrationIntent.pendingPlanKey}`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/billing", requestUrl.origin),
  );
}