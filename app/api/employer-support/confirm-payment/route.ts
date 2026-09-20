import { NextResponse } from "next/server";

import { getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import { provisionEmployerSupportMatterFromPurchase } from "@/lib/employer-support/purchases";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICE_PENCE = 9900;

export async function POST(request: Request) {
  const access = await getEmployerSupportAccess();
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

    if (
      session.livemode ||
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

    if (purchaseError || !purchase || purchase.stripe_checkout_session_id !== session.id) {
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
    return NextResponse.json({ error: "Payment was received but the Matter is still being prepared. Please refresh shortly." }, { status: 500 });
  }
}
