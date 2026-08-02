import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unixToIso(value: number | null | undefined) {
  return typeof value === "number"
    ? new Date(value * 1000).toISOString()
    : null;
}

function stripeId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }

  return null;
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "paused":
      return "suspended";
    case "canceled":
      return "cancelled";
    case "trialing":
      return "trialing";
    case "incomplete":
    case "incomplete_expired":
    default:
      return "pending";
  }
}

function mapInvoiceStatus(status: Stripe.Invoice.Status | null) {
  switch (status) {
    case "open":
      return "open";
    case "paid":
      return "paid";
    case "void":
      return "void";
    case "uncollectible":
      return "uncollectible";
    case "draft":
    default:
      return "draft";
  }
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const legacySubscription = (invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }).subscription;

  const legacyId = stripeId(legacySubscription);

  if (legacyId) {
    return legacyId;
  }

  const parent = (
    invoice as Stripe.Invoice & {
      parent?: {
        subscription_details?: {
          subscription?: string | Stripe.Subscription | null;
        } | null;
      } | null;
    }
  ).parent;

  return stripeId(parent?.subscription_details?.subscription);
}

async function findOrganisationFromSubscription(
  subscription: Stripe.Subscription,
) {
  const organisationId = subscription.metadata.organisation_id;

  if (organisationId) {
    return organisationId;
  }

  const customerId = stripeId(subscription.customer);

  if (!customerId) {
    return null;
  }

  const admin = createAdminClient();

  const { data } = await admin
    .from("leo_organisation_subscriptions")
    .select("organisation_id")
    .eq("provider_customer_reference", customerId)
    .maybeSingle();

  return data?.organisation_id ?? null;
}

async function findOrganisationFromInvoice(invoice: Stripe.Invoice) {
  const subscriptionReference = invoiceSubscriptionId(invoice);

  if (subscriptionReference) {
    const admin = createAdminClient();

    const { data } = await admin
      .from("leo_organisation_subscriptions")
      .select("organisation_id")
      .eq("provider_subscription_reference", subscriptionReference)
      .maybeSingle();

    if (data?.organisation_id) {
      return data.organisation_id;
    }
  }

  const customerId = stripeId(invoice.customer);

  if (!customerId) {
    return null;
  }

  const admin = createAdminClient();

  const { data } = await admin
    .from("leo_organisation_subscriptions")
    .select("organisation_id")
    .eq("provider_customer_reference", customerId)
    .maybeSingle();

  return data?.organisation_id ?? null;
}

async function synchroniseSubscription(
  subscription: Stripe.Subscription,
  providerEventReference: string,
) {
  const organisationId =
    await findOrganisationFromSubscription(subscription);

  if (!organisationId) {
    throw new Error(
      `No LEO organisation could be resolved for Stripe subscription ${subscription.id}.`,
    );
  }

  const admin = createAdminClient();
  const status = mapSubscriptionStatus(subscription.status);
  const customerId = stripeId(subscription.customer);
  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? null;
  const planKey = subscription.metadata.leo_plan_key || null;
  const planId = subscription.metadata.leo_plan_id || null;
  const capacityFromMetadata = Number(
    subscription.metadata.employee_capacity || "",
  );
  const capacity =
    Number.isSafeInteger(capacityFromMetadata) && capacityFromMetadata > 0
      ? capacityFromMetadata
      : null;

  const { data: existing } = await admin
    .from("leo_organisation_subscriptions")
    .select("id, status, employee_count, metadata")
    .eq("organisation_id", organisationId)
    .maybeSingle();

  const existingMetadata =
    existing?.metadata &&
    typeof existing.metadata === "object" &&
    !Array.isArray(existing.metadata)
      ? existing.metadata
      : {};

  const payload = {
    organisation_id: organisationId,
    plan_id: planId || undefined,
    status,
    employee_count: capacity ?? existing?.employee_count ?? 1,
    current_period_starts_at: unixToIso(item?.current_period_start),
    current_period_ends_at: unixToIso(item?.current_period_end),
    provider_key: "stripe",
    provider_customer_reference: customerId,
    provider_subscription_reference: subscription.id,
    cancellation_requested_at: subscription.cancel_at_period_end
      ? new Date().toISOString()
      : null,
    cancelled_at:
      status === "cancelled"
        ? unixToIso(subscription.canceled_at) ?? new Date().toISOString()
        : null,
    metadata: {
      ...existingMetadata,
      stripe_price_id: priceId,
      stripe_plan_key: planKey,
      stripe_cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_latest_event_reference: providerEventReference,
    },
  };

  const { data: savedSubscription, error } = await admin
    .from("leo_organisation_subscriptions")
    .upsert(payload, {
      onConflict: "organisation_id",
    })
    .select("id, status")
    .single();

  if (error) {
    throw error;
  }

  if (status === "active") {
    await admin
      .from("leo_organisation_trials")
      .update({
        status: "converted",
        converted_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
      })
      .eq("organisation_id", organisationId)
      .in("status", ["pending", "active"]);
  }

  const { error: entitlementError } = await admin.rpc(
    "leo_sync_organisation_entitlement",
    {
      p_organisation_id: organisationId,
    },
  );

  if (entitlementError) {
    throw entitlementError;
  }

  await admin.from("leo_billing_subscription_events").upsert(
    {
      organisation_id: organisationId,
      subscription_id: savedSubscription.id,
      event_type: "stripe_subscription_synchronised",
      previous_status: existing?.status ?? null,
      new_status: savedSubscription.status,
      reason: "Stripe subscription webhook processed.",
      provider_key: "stripe",
      provider_event_reference: providerEventReference,
      event_payload: {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        stripe_price_id: priceId,
        stripe_status: subscription.status,
      },
    },
    {
      onConflict: "provider_key,provider_event_reference",
      ignoreDuplicates: true,
    },
  );
}

async function synchroniseInvoice(
  invoice: Stripe.Invoice,
  providerEventReference: string,
) {
  const organisationId = await findOrganisationFromInvoice(invoice);

  if (!organisationId) {
    throw new Error(
      `No LEO organisation could be resolved for Stripe invoice ${invoice.id}.`,
    );
  }

  const admin = createAdminClient();
  const stripeSubscriptionReference = invoiceSubscriptionId(invoice);

  const { data: leoSubscription } = await admin
    .from("leo_organisation_subscriptions")
    .select("id")
    .eq("organisation_id", organisationId)
    .maybeSingle();

  const currency = invoice.currency
    ? invoice.currency.toUpperCase()
    : "GBP";

  const invoiceReference =
    invoice.number || invoice.id;

  const { error } = await admin
    .from("leo_billing_invoices")
    .upsert(
      {
        organisation_id: organisationId,
        subscription_id: leoSubscription?.id ?? null,
        invoice_reference: invoiceReference,
        provider_key: "stripe",
        provider_invoice_reference: invoice.id,
        status: mapInvoiceStatus(invoice.status),
        currency_code: currency,
        subtotal_pence: Math.max(invoice.subtotal ?? 0, 0),
        tax_pence: Math.max(
          (invoice.total ?? 0) - (invoice.subtotal ?? 0),
          0,
        ),
        total_pence: Math.max(invoice.total ?? 0, 0),
        issued_at: unixToIso(invoice.created),
        due_at: unixToIso(invoice.due_date),
        paid_at:
          invoice.status === "paid"
            ? unixToIso(invoice.status_transitions?.paid_at)
            : null,
        hosted_invoice_url: invoice.hosted_invoice_url,
        invoice_document_path: null,
        metadata: {
          stripe_subscription_reference: stripeSubscriptionReference,
          stripe_customer_reference: stripeId(invoice.customer),
          stripe_latest_event_reference: providerEventReference,
          stripe_invoice_pdf: invoice.invoice_pdf,
        },
      },
      {
        onConflict: "organisation_id,invoice_reference",
      },
    );

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await synchroniseSubscription(
          event.data.object as Stripe.Subscription,
          event.id,
        );
        break;
      }

      case "invoice.created":
      case "invoice.finalized":
      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.voided":
      case "invoice.marked_uncollectible": {
        await synchroniseInvoice(
          event.data.object as Stripe.Invoice,
          event.id,
        );
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook ${event.type} failed:`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stripe webhook processing failed.",
      },
      { status: 500 },
    );
  }
}