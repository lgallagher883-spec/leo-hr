import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_verification_code", requestUrl.origin)
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(exchangeError.message)}`,
        requestUrl.origin
      )
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL("/login?error=unable_to_load_user", requestUrl.origin)
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("organisation_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.organisation_id) {
    return NextResponse.redirect(
      new URL("/login?error=registration_profile_missing", requestUrl.origin)
    );
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("organisation_subscriptions")
    .select(
      `
        subscription_status,
        trial_started_at,
        trial_ends_at,
        subscription_plans (
          plan_code
        )
      `
    )
    .eq("organisation_id", profile.organisation_id)
    .in("subscription_status", [
      "trialing",
      "active",
      "pending_payment",
      "past_due",
      "grace",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError || !subscription) {
    return NextResponse.redirect(
      new URL("/login?error=subscription_missing", requestUrl.origin)
    );
  }

  if (subscription.subscription_status === "trialing") {
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  if (subscription.subscription_status === "active") {
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/dashboard/billing", requestUrl.origin));
}