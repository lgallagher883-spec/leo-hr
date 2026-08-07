import { createAdminClient } from "@/lib/supabase/admin";

export type TrialProvisioningResult = {
  activated: boolean;
  trialId: string | null;
  entitlementId: string | null;
};

type TrialRow = {
  id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
};

function sevenDaysAfter(value: string) {
  const start = new Date(value);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid free-trial start date.");
  }

  return new Date(
    start.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
}

async function synchroniseEntitlement(
  admin: ReturnType<typeof createAdminClient>,
  organisationId: string,
) {
  const { error: syncError } = await (admin as any).rpc(
    "leo_sync_organisation_entitlement",
    {
      p_organisation_id: organisationId,
    },
  );

  if (syncError) {
    throw syncError;
  }

  const { data: entitlement, error: entitlementError } = await admin
    .from("leo_organisation_entitlements")
    .select("id")
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (entitlementError) {
    throw entitlementError;
  }

  return entitlement?.id ?? null;
}

async function getTrial(
  admin: ReturnType<typeof createAdminClient>,
  organisationId: string,
) {
  const { data, error } = await admin
    .from("leo_organisation_trials")
    .select("id, status, starts_at, ends_at")
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as TrialRow | null) ?? null;
}

export async function ensureFreeTrialProvisioning(
  organisationId: string,
): Promise<TrialProvisioningResult> {
  const admin = createAdminClient();
  let trial = await getTrial(admin, organisationId);

  if (!trial) {
    const startsAt = new Date().toISOString();
    const endsAt = sevenDaysAfter(startsAt);

    const { data: createdTrial, error: createError } = await admin
      .from("leo_organisation_trials")
      .insert({
        organisation_id: organisationId,
        status: "active",
        starts_at: startsAt,
        ends_at: endsAt,
        extension_count: 0,
        metadata: {
          source: "self_service_verification",
          trial_type: "free_trial_7_day",
        },
      })
      .select("id, status, starts_at, ends_at")
      .single();

    if (createError) {
      /*
       * organisation_id is unique. If two confirmation requests race, do not
       * create or restart a second trial: re-read the authoritative row.
       */
      if ((createError as { code?: string }).code === "23505") {
        trial = await getTrial(admin, organisationId);
      } else {
        throw createError;
      }
    } else {
      trial = createdTrial as TrialRow;
    }
  }

  if (!trial) {
    throw new Error("The free-trial record could not be created.");
  }

  if (trial.status === "pending") {
    const startsAt = trial.starts_at ?? new Date().toISOString();
    const endsAt = trial.ends_at ?? sevenDaysAfter(startsAt);

    const { data: activatedTrial, error: activateError } = await admin
      .from("leo_organisation_trials")
      .update({
        status: "active",
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .eq("id", trial.id)
      .eq("status", "pending")
      .select("id, status, starts_at, ends_at")
      .single();

    if (activateError) {
      throw activateError;
    }

    trial = activatedTrial as TrialRow;
  }

  /*
   * A free trial is single-use. Never restart an expired, ended, cancelled
   * or converted trial when the confirmation link is revisited.
   */
  if (
    trial.status === "expired" ||
    trial.status === "ended" ||
    trial.status === "cancelled" ||
    trial.status === "converted"
  ) {
    const entitlementId = await synchroniseEntitlement(admin, organisationId);

    return {
      activated: false,
      trialId: trial.id,
      entitlementId,
    };
  }

  if (trial.status !== "active" || !trial.starts_at || !trial.ends_at) {
    throw new Error("The free-trial record is not in a valid active state.");
  }

  /*
   * Do not restart the clock if an active row has already reached its end.
   * Mark it expired, synchronise access, and return without reactivation.
   */
  if (new Date(trial.ends_at).getTime() <= Date.now()) {
    const { error: expiryError } = await admin
      .from("leo_organisation_trials")
      .update({
        status: "expired",
        ended_at: new Date().toISOString(),
      })
      .eq("id", trial.id)
      .eq("status", "active");

    if (expiryError) {
      throw expiryError;
    }

    const entitlementId = await synchroniseEntitlement(admin, organisationId);

    return {
      activated: false,
      trialId: trial.id,
      entitlementId,
    };
  }

  const entitlementId = await synchroniseEntitlement(admin, organisationId);

  return {
    activated: true,
    trialId: trial.id,
    entitlementId,
  };
}