import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveRegistrationIntent } from "@/lib/billing/registrationIntent";
import { ensureEmployerSupportOrganisation } from "@/lib/employer-support/accountProvisioning";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ ok: false }, { status: 401 });

  if (resolveRegistrationIntent(user.user_metadata).kind !== "employer_support") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const organisationName =
    typeof user.user_metadata?.organisation_name === "string"
      ? user.user_metadata.organisation_name.trim()
      : "";
  const employeeCountBand =
    typeof user.user_metadata?.employee_count_band === "string"
      ? user.user_metadata.employee_count_band.trim()
      : null;

  if (!organisationName) {
    return NextResponse.json({ ok: false }, { status: 409 });
  }

  try {
    await ensureEmployerSupportOrganisation({
      userId: user.id,
      organisationName,
      employeeCountBand,
    });
    return NextResponse.json({ ok: true });
  } catch (provisioningError) {
    console.error("Employer Support account repair failed:", provisioningError);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
