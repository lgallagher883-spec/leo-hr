import { NextResponse } from "next/server";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe, getStripePlan } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutBody = {
  planKey?: unknown;
};

type Membership = {
  organisation_id: string;
};

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

  return (identityMembership as Membership | null)?.organisation_id ?? null;
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

    const body = (await request.json()) as CheckoutBody;
    const planKey = typeof body.planKey === "string" ? body.planKey : "";
    const selectedPlan = getStripePlan(planKey);

    if (!selectedPlan) {
      return NextResponse.json(
        { error: "Choose a valid LEO subscription." },
        { status: 400 },
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
        { error: "Only the organisation Owner can start a subscription." },
        { status: 403 },
      );
    }

    const [
      organisationResult,
      subscriptionResult,
      catalogueResult,
    ] = await Promise.all([
      admin
        .from("organisations")
        .select("id, name")
        .eq("id", organisationId)
        .maybeSingle(),
      admin
        .from("leo_organisation_subscriptions")
        .select(
          "id, status, provider_customer_reference, provider_subscription_reference, metadata",
        )
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      admin
        .from("leo_billing_plan_catalogue")
        .select("id, plan_key, status")
        .eq("plan_key", selectedPlan.planKey)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    if (organisationResult.error || !organisationResult.data) {
      return NextResponse.json(
        { error: "The organisation could not be loaded." },
        { status: 404 },
      );
    }

    if (catalogueResult.error || !catalogueResult.data) {
      return NextResponse.json(
        {
          error:
            "The selected subscription is not active in the LEO billing catalogue.",
        },
        { status: 409 },
      );
    }

    const currentSubscription = subscriptionResult.data;

    if (
      currentSubscription?.provider_subscription_reference &&
      ["active", "past_due", "trialing"].includes(currentSubscription.status)
    ) {
      return NextResponse.json(
        {
          error:
            "This organisation already has a Stripe subscription. Use Manage subscription instead.",
        },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    let customerId =
      currentSubscription?.provider_customer_reference ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: organisationResult.data.name,
        metadata: {
          organisation_id: organisationId,
          leo_user_id: user.id,
        },
      });

      customerId = customer.id;
    }

    const appUrl = getAppUrl(request.url);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: organisationId,
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: false,
      billing_address_collection: "required",
      customer_update: {
        address: "auto",
        name: "auto",
      },
      subscription_data: {
        metadata: {
          organisation_id: organisationId,
          leo_plan_key: selectedPlan.planKey,
          employee_capacity: String(selectedPlan.capacity),
          leo_plan_id: catalogueResult.data.id,
        },
      },
      metadata: {
        organisation_id: organisationId,
        leo_plan_key: selectedPlan.planKey,
        employee_capacity: String(selectedPlan.capacity),
        leo_plan_id: catalogueResult.data.id,
        initiated_by: user.id,
      },
      success_url: `${appUrl}/dashboard/billing?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billing?stripe=cancelled`,
    });

    const existingMetadata =
      currentSubscription?.metadata &&
      typeof currentSubscription.metadata === "object" &&
      !Array.isArray(currentSubscription.metadata)
        ? currentSubscription.metadata
        : {};

    const subscriptionPayload = {
      organisation_id: organisationId,
      plan_id: catalogueResult.data.id,
      status: "pending",
      employee_count: selectedPlan.capacity,
      provider_key: "stripe",
      provider_customer_reference: customerId,
      created_by: user.id,
      updated_by: user.id,
      metadata: {
        ...existingMetadata,
        stripe_checkout_session_id: checkoutSession.id,
        stripe_plan_key: selectedPlan.planKey,
      },
    };

    const { error: upsertError } = await admin
      .from("leo_organisation_subscriptions")
      .upsert(subscriptionPayload, {
        onConflict: "organisation_id",
      });

    if (upsertError) {
      console.error("Stripe checkout subscription upsert failed:", upsertError);
      return NextResponse.json(
        {
          error:
            "Stripe Checkout was created, but LEO could not prepare the subscription record.",
        },
        { status: 500 },
      );
    }

    await admin.from("leo_billing_subscription_events").insert({
      organisation_id: organisationId,
      event_type: "stripe_checkout_created",
      previous_status: currentSubscription?.status ?? null,
      new_status: "pending",
      reason: "Stripe Checkout Session created.",
      provider_key: "stripe",
      provider_event_reference: checkoutSession.id,
      actor_user_id: user.id,
      event_payload: {
        checkout_session_id: checkoutSession.id,
        plan_key: selectedPlan.planKey,
        employee_capacity: selectedPlan.capacity,
      },
    });

    return NextResponse.json(
      {
        url: checkoutSession.url,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Stripe checkout failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stripe Checkout could not be started.",
      },
      { status: 500 },
    );
  }
}