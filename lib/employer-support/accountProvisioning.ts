import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureEmployerSupportAccount } from "@/lib/employer-support/provisioning";

type EmployerSupportIdentity = {
  userId: string;
  organisationName: string;
  employeeCountBand?: string | null;
};

export async function ensureEmployerSupportOrganisation(input: EmployerSupportIdentity) {
  const admin = createAdminClient();

  const existingMembership = await (admin as any)
    .from("organisation_memberships")
    .select("organisation_id")
    .eq("user_id", input.userId)
    .in("membership_status", ["active", "accepted"])
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let organisationId = existingMembership.data?.organisation_id ?? null;

  if (!organisationId) {
    const existingProfile = await (admin as any)
      .from("user_profiles")
      .select("organisation_id")
      .eq("user_id", input.userId)
      .maybeSingle();
    organisationId = existingProfile.data?.organisation_id ?? null;
  }

  if (!organisationId) {
    const organisationResult = await (admin as any)
      .from("organisations")
      .insert({
        name: input.organisationName,
        employee_count_band: input.employeeCountBand ?? null,
        status: "active",
      })
      .select("id")
      .single();

    if (organisationResult.error || !organisationResult.data?.id) {
      throw new Error(`Employer Support organisation could not be created: ${organisationResult.error?.message ?? "unknown error"}`);
    }

    organisationId = organisationResult.data.id;

    const membershipResult = await (admin as any)
      .from("organisation_memberships")
      .insert({
        organisation_id: organisationId,
        user_id: input.userId,
        role: "employee",
        membership_status: "active",
        is_primary_organisation: true,
        is_default_organisation: true,
      });

    if (membershipResult.error) {
      await (admin as any).from("organisations").delete().eq("id", organisationId);
      throw new Error(`Employer Support membership could not be created: ${membershipResult.error.message}`);
    }
  }

  await ensureEmployerSupportAccount(organisationId, input.userId);
  return organisationId;
}
