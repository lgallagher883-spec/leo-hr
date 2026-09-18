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
  const numericPurchaseId = Number(purchaseId);
  if (!Number.isSafeInteger(numericPurchaseId) || numericPurchaseId <= 0) {
    throw new Error("Employer Support purchase reference is invalid.");
  }

  const admin = createAdminClient();
  const { data, error } = await (admin as any).rpc(
    "leo_provision_employer_support_matter",
    { p_purchase_id: numericPurchaseId },
  );

  if (error) {
    throw new Error(`Employer Support Matter could not be provisioned: ${error.message}`);
  }

  const matterId = Number(data);
  if (!Number.isSafeInteger(matterId) || matterId <= 0) {
    throw new Error("Employer Support Matter provisioning returned an invalid Matter reference.");
  }

  return matterId;
}
