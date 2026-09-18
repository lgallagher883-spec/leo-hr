import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type EmployerSupportPurchaseDraft = {
  id: string;
  organisation_id: string;
  account_id: string;
  status: "pending" | "paid" | "provisioned" | "refunded" | "cancelled";
  initial_issue: string | null;
};

export async function createPendingEmployerSupportPurchase(input: {
  organisationId: string;
  accountId: string;
  userId: string;
  initialIssue: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("leo_employer_support_purchases")
    .insert({
      organisation_id: input.organisationId,
      account_id: input.accountId,
      purchased_by: input.userId,
      status: "pending",
      initial_issue: input.initialIssue.trim(),
    })
    .select("id,organisation_id,account_id,status,initial_issue")
    .single();
  if (error || !data) throw new Error(`Employer Support purchase could not be prepared: ${error?.message ?? "unknown error"}`);
  return data as EmployerSupportPurchaseDraft;
}

export async function provisionEmployerSupportMatterFromPurchase(purchaseId: string) {
  const admin = createAdminClient();
  const { data: purchase, error: purchaseError } = await (admin as any)
    .from("leo_employer_support_purchases")
    .select("id,organisation_id,account_id,matter_id,status,initial_issue,purchased_by")
    .eq("id", purchaseId)
    .maybeSingle();
  if (purchaseError || !purchase) throw new Error("Employer Support purchase could not be loaded.");
  if (purchase.status === "provisioned" && purchase.matter_id) return purchase.matter_id;
  if (purchase.status !== "paid") throw new Error("Employer Support Matter cannot be provisioned before payment is confirmed.");

  const issue=(purchase.initial_issue || "").trim();
  if(!issue) throw new Error("Employer Support purchase has no initial issue to provision.");

  // Re-check immediately before insertion so a normal Stripe retry cannot create a second Matter.
  const { data: latest } = await (admin as any)
    .from("leo_employer_support_purchases")
    .select("matter_id,status")
    .eq("id", purchase.id)
    .maybeSingle();

  if (latest?.status === "provisioned" && latest?.matter_id) {
    return latest.matter_id;
  }

  const { data: matter, error: matterError } = await (admin as any)
    .from("matters")
    .insert({
      organisation_id: purchase.organisation_id,
      product_source: "employer_support",
      title: "Employer Support Matter",
      subject: "Employee relations issue",
      matter_type: "Employer Support",
      description: issue,
      status: "Open",
      workflow_stage: "Initial Assessment",
    })
    .select("id")
    .single();
  if (matterError || !matter) throw new Error(`Employer Support Matter could not be created: ${matterError?.message ?? "unknown error"}`);

  const { error: linkError } = await (admin as any)
    .from("leo_employer_support_purchases")
    .update({ matter_id:matter.id,status:"provisioned",provisioned_at:new Date().toISOString() })
    .eq("id", purchase.id)
    .eq("status", "paid");
  if(linkError) throw new Error(`Employer Support purchase could not be linked to its Matter: ${linkError.message}`);
  return matter.id as number;
}
