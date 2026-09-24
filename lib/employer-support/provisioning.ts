import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureEmployerSupportAccount(
  organisationId: string,
  userId: string,
) {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await (admin as any)
    .from("leo_employer_support_accounts")
    .select("id, organisation_id, status")
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Employer Support account could not be checked: ${existingError.message}`);
  }

  if (existing) return existing;

  const { data, error } = await (admin as any)
    .from("leo_employer_support_accounts")
    .insert({
      organisation_id: organisationId,
      created_by: userId,
      status: "active",
    })
    .select("id, organisation_id, status")
    .single();

  if (error) {
    // The organisation is unique. A simultaneous sign-in/confirmation request
    // may have created the account after our initial lookup, so re-read before
    // treating the insert as a real provisioning failure.
    const { data: concurrent, error: concurrentError } = await (admin as any)
      .from("leo_employer_support_accounts")
      .select("id, organisation_id, status")
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (!concurrentError && concurrent) return concurrent;

    throw new Error(
      `Employer Support account could not be provisioned: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error("Employer Support account could not be provisioned: no account was returned.");
  }

  return data;
}
