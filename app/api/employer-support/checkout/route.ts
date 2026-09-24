import { NextResponse } from "next/server";

import { EmployerSupportAccessLookupError, getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import { createPendingEmployerSupportPurchase } from "@/lib/employer-support/purchases";
import { getAppUrl, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPLOYER_SUPPORT_LAUNCH_PRICE_PENCE = 9900;

export async function POST(request: Request) {
  let access;
  try {
    access = await getEmployerSupportAccess();
  } catch (error) {
    if (error instanceof EmployerSupportAccessLookupError) {
      return NextResponse.json({ error: "Your Employer Support access could not be checked just now. Please try again." }, { status: 503 });
    }
    throw error;
  }
  if (!access) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });

  const body = await request.json().catch(() => null) as { issue?: unknown } | null;
  const issue = typeof body?.issue === "string" ? body.issue.trim() : "";
  if (issue.length < 20 || issue.length > 6000) {
    return NextResponse.json({ error: "Please provide the situation Leo assessed before continuing." }, { status: 400 });
  }

  try {
    // Safety first: validate the Stripe environment before creating any
    // purchase row, so a blocked preview checkout cannot leave orphaned
    // pending purchases behind.
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
    const isPreviewDeployment = process.env.VERCEL_ENV === "preview";
    const isProductionDeployment = process.env.VERCEL_ENV === "production";
    if (isProductionDeployment && !stripeSecretKey.startsWith("sk_live_")) {
      console.error("Blocked Employer Support checkout: production deployment is not using a Stripe live key.");
      return NextResponse.json(
        { error: "Employer Support payments are not configured for live checkout yet." },
        { status: 503 },
      );
    }
    if (isPreviewDeployment && !stripeSecretKey.startsWith("sk_test_")) {
      console.error("Blocked Employer Support checkout: preview deployment is not using a Stripe test key.");
      return NextResponse.json(
        { error: "Test checkout is not safely configured on this preview yet." },
        { status: 503 },
      );
    }

    const purchase = await createPendingEmployerSupportPurchase({
      organisationId: access.organisationId,
      accountId: access.accountId,
      userId: access.userId,
      initialIssue: issue,
    });

    const stripe = getStripe();
    // Keep preview checkout and its return URLs on the exact preview origin.
    // Production retains the configured canonical application URL.
    const appUrl = isPreviewDeployment
      ? new URL(request.url).origin
      : getAppUrl(request.url);
    let session;
    try {
      session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: String(purchase.id),
      line_items: [{
        price_data: {
          currency: "gbp",
          unit_amount: EMPLOYER_SUPPORT_LAUNCH_PRICE_PENCE,
          product_data: { name: "Ask Leo Employer Support", description: "One Employer Support Matter" },
        },
        quantity: 1,
      }],
      billing_address_collection: "required",
      success_url: `${appUrl}/employer-support?payment=processing&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/employer-support/start?payment=cancelled`,
      metadata: {
        leo_product: "employer_support",
        employer_support_purchase_id: String(purchase.id),
      },
      payment_intent_data: {
        metadata: {
          leo_product: "employer_support",
          employer_support_purchase_id: String(purchase.id),
        },
      },
      });
    } catch (stripeError) {
      const admin = (await import("@/lib/supabase/admin")).createAdminClient();
      const { error: cancelError } = await (admin as any)
        .from("leo_employer_support_purchases")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", purchase.id)
        .eq("organisation_id", access.organisationId)
        .eq("account_id", access.accountId)
        .eq("status", "pending")
        .is("stripe_checkout_session_id", null);
      if (cancelError) console.error("Employer Support failed checkout cleanup could not cancel pending purchase:", cancelError);
      throw stripeError;
    }

    const admin = (await import("@/lib/supabase/admin")).createAdminClient();
    const { data: attachedPurchase, error } = await (admin as any)
      .from("leo_employer_support_purchases")
      .update({
        stripe_checkout_session_id: session.id,
        amount_minor: EMPLOYER_SUPPORT_LAUNCH_PRICE_PENCE,
        currency: "gbp",
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchase.id)
      .eq("organisation_id", access.organisationId)
      .eq("account_id", access.accountId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error || !attachedPurchase) {
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error("Employer Support orphan Stripe session could not be expired:", expireError);
      }
      const { error: cancelError } = await (admin as any)
        .from("leo_employer_support_purchases")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", purchase.id)
        .eq("organisation_id", access.organisationId)
        .eq("account_id", access.accountId)
        .eq("status", "pending");
      if (cancelError) console.error("Employer Support failed session attachment cleanup could not cancel pending purchase:", cancelError);
      throw error ?? new Error("Employer Support purchase was not available to attach to checkout.");
    }

    if (!session.url) {
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error("Employer Support checkout without URL could not be expired:", expireError);
      }
      const { error: cancelError } = await (admin as any)
        .from("leo_employer_support_purchases")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", purchase.id)
        .eq("organisation_id", access.organisationId)
        .eq("account_id", access.accountId)
        .eq("status", "pending");
      if (cancelError) console.error("Employer Support checkout without URL could not cancel pending purchase:", cancelError);
      throw new Error("Stripe did not return a checkout URL.");
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Employer Support checkout failed:", error);
    return NextResponse.json({ error: "The secure payment could not be prepared. Please try again." }, { status: 500 });
  }
}
