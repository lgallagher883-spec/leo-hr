import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureEmployerSupportAccount } from "@/lib/employer-support/provisioning";
import { resolveRegistrationIntent } from "@/lib/billing/registrationIntent";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ ok: false }, { status: 401 });

  if (resolveRegistrationIntent(user.user_metadata).kind !== "employer_support") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const membership = await (supabase as any).from("organisation_memberships").select("organisation_id").eq("user_id", user.id).in("membership_status", ["active", "accepted"]).order("is_default_organisation", { ascending: false }).order("created_at", { ascending: true }).limit(1).maybeSingle();
  let organisationId = membership.data?.organisation_id ?? null;

  if (!organisationId) {
    const profile = await supabase.from("user_profiles").select("organisation_id").eq("user_id", user.id).maybeSingle();
    organisationId = profile.data?.organisation_id ?? null;
  }

  if (!organisationId) return NextResponse.json({ ok: false }, { status: 409 });

  try {
    await ensureEmployerSupportAccount(organisationId, user.id);
    return NextResponse.json({ ok: true });
  } catch (provisioningError) {
    console.error("Employer Support account repair failed:", provisioningError);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
