import { NextResponse } from "next/server";

import { getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getEmployerSupportAccess();

  if (!access) {
    return NextResponse.json(
      { success: false, error: "Employer Support access is unavailable." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const { data: purchases, error: purchaseError } = await (supabase as any)
    .from("leo_employer_support_purchases")
    .select("id, matter_id, purchased_at, provisioned_at")
    .eq("organisation_id", access.organisationId)
    .eq("account_id", access.accountId)
    .eq("status", "provisioned")
    .not("matter_id", "is", null)
    .order("created_at", { ascending: false });

  if (purchaseError) {
    console.error("Employer Support purchases could not be loaded:", purchaseError);
    return NextResponse.json(
      { success: false, error: "Your Matters could not be loaded." },
      { status: 500 },
    );
  }

  const matterIds = (purchases ?? [])
    .map((purchase: { matter_id?: number | null }) => purchase.matter_id)
    .filter((id: number | null | undefined): id is number => Number.isInteger(id));

  if (matterIds.length === 0) {
    return NextResponse.json({ success: true, matters: [] });
  }

  const { data: matters, error: matterError } = await (supabase as any)
    .from("matters")
    .select(
      "id, title, status, description, matter_type, subject, matter_lead, created_at",
    )
    .eq("organisation_id", access.organisationId)
    .in("id", matterIds)
    .order("created_at", { ascending: false });

  if (matterError) {
    console.error("Employer Support Matters could not be loaded:", matterError);
    return NextResponse.json(
      { success: false, error: "Your Matters could not be loaded." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, matters: matters ?? [] });
}
