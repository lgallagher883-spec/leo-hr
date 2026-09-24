import { NextResponse } from "next/server";

import { EmployerSupportAccessLookupError, getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import { provisionEmployerSupportMatterFromPurchase } from "@/lib/employer-support/purchases";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICE_PENCE = 9900;

export async function POST(request: Request) {
  let access;
  try {
    access = await getEmployerSupportAccess();
  } catch (error) {
    if (error instanceof EmployerSupportAccessLookupError) {
      console.error("Employer Support payment access lookup failed:", error);
      return NextResponse.json({ error: "Your Employer Support access could not be checked just now. Please try again." }, { status: 503 });
    }
    throw error;
  }
  if (!access) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { sessionId?: unknown } | null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Payment reference is invalid." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const purchaseId = Number(session.metadata?.employer_support_purchase_id ?? session.client_reference_id);

    const isPreviewDeployment = process.env.VERCEL_ENV === "preview";
    const isProductionDeployment = process.env.VERCEL_ENV === "production";
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
    if (isPreviewDeployment && !stripeSecretKey.startsWith("sk_test_")) {
      return NextResponse.json({ error: "Employer Support test payments are not configured safely." }, { status: 503 });
    }
    if (isProductionDeployment && !stripeSecretKey.startsWith("sk_live_")) {
      return NextResponse.json({ error: "Employer Support live payments are not configured yet." }, { status: 503 });
    }
    const expectedLiveMode = isProductionDeployment;

    if (
      session.livemode !== expectedLiveMode ||
      session.metadata?.leo_product !== "employer_support" ||
      session.mode !== "payment" ||
      session.payment_status !== "paid" ||
      session.amount_total !== PRICE_PENCE ||
      session.currency?.toLowerCase() !== "gbp" ||
      !Number.isSafeInteger(purchaseId) ||
      purchaseId <= 0
    ) {
      return NextResponse.json({ error: "Payment has not been verified." }, { status: 409 });
    }

    const admin = createAdminClient();
    const { data: purchase, error: purchaseError } = await (admin as any)
      .from("leo_employer_support_purchases")
      .select("id,organisation_id,account_id,status,matter_id,stripe_checkout_session_id")
      .eq("id", purchaseId)
      .eq("organisation_id", access.organisationId)
      .eq("account_id", access.accountId)
      .maybeSingle();

    if (purchaseError) {
      console.error("Employer Support payment purchase lookup failed:", purchaseError);
      return NextResponse.json({ error: "Your payment record could not be checked just now. Please try again." }, { status: 503 });
    }
    if (!purchase || purchase.stripe_checkout_session_id !== session.id) {
      return NextResponse.json({ error: "This payment does not belong to this Employer Support account." }, { status: 403 });
    }

    if (purchase.status === "provisioned" && purchase.matter_id) {
      return NextResponse.json({ matterId: purchase.matter_id, alreadyProvisioned: true });
    }

    if (purchase.status !== "pending" && purchase.status !== "paid") {
      return NextResponse.json({ error: "This purchase cannot be provisioned." }, { status: 409 });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

    if (purchase.status === "pending") {
      const { error: paidError } = await (admin as any)
        .from("leo_employer_support_purchases")
        .update({
          status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          amount_minor: session.amount_total,
          currency: session.currency,
          purchased_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseId)
        .eq("organisation_id", access.organisationId)
        .eq("account_id", access.accountId)
        .eq("status", "pending");

      if (paidError) throw paidError;
    }

    const matterId = await provisionEmployerSupportMatterFromPurchase(String(purchaseId));
    return NextResponse.json({ matterId });
  } catch (error) {
    console.error("Employer Support payment confirmation failed:", error);
    return NextResponse.json({ error: "We could not finish preparing your matter just now. Please refresh shortly." }, { status: 500 });
  }
}
