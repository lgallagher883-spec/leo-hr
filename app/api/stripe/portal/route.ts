import { NextResponse } from "next/server";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveOrganisationId(userId: string) {
  const admin = createAdminClient();

  const { data: legacyMembership } = await admin
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (legacyMembership?.organisation_id) {
    return legacyMembership.organisation_id as string;
  }

  const { data: identityMembership, error } = await admin
    .from("identity_organisation_memberships")
    .select("organisation_id")
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return identityMembership?.organisation_id ?? null;
}

export async function POST(request: Request) {
  try {
    const sessionClient = await createClient();

    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const organisationId = await resolveOrganisationId(user.id);

    if (!organisationId) {
      return NextResponse.json(
        { error: "No active organisation is linked to your account." },
        { status: 403 },
      );
    }

    const admin = createAdminClient();

    const resolvedRole = await resolveAuthoritativeUserRole(admin as any, {
      userId: user.id,
      organisationId,
      allowedStatuses: ["active"],
    });

    if (!resolvedRole || resolvedRole.roleKey !== "owner") {
      return NextResponse.json(
        { error: "Only the organisation Owner can manage the subscription." },
        { status: 403 },
      );
    }

    const { data: subscription, error } = await admin
      .from("leo_organisation_subscriptions")
      .select("provider_customer_reference")
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (error || !subscription?.provider_customer_reference) {
      return NextResponse.json(
        { error: "No Stripe customer is connected to this organisation." },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    const appUrl = getAppUrl(request.url);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.provider_customer_reference,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json(
      { url: portalSession.url },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Stripe customer portal failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Stripe customer portal could not be opened.",
      },
      { status: 500 },
    );
  }
}