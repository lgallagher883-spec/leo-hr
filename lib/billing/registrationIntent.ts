import type { StripePlanKey } from "@/lib/stripe";

export type RegistrationIntentKind =
  | "free_trial"
  | "paid_subscription"
  | "pilot_programme"
  | "unknown";

export type RegistrationIntent = {
  kind: RegistrationIntentKind;
  planCode: string | null;
  pendingPlanKey: StripePlanKey | null;
  allowsPlatformTrialAccess: boolean;
};

function readString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalised = value.trim().toLowerCase();
  return normalised.length > 0 ? normalised : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function planCodeToStripePlanKey(
  planCode: string | null,
): StripePlanKey | null {
  if (planCode === "organisation_50") return "organisation_50";
  if (planCode === "organisation_150") return "organisation_150";
  if (planCode === "organisation_250") return "organisation_250";

  return null;
}

export function resolveRegistrationIntent(
  userMetadata: unknown,
): RegistrationIntent {
  const metadata = asRecord(userMetadata);

  const explicitPlanCode = readString(metadata.plan_code);
  const selectedPlanCode = readString(metadata.registration_plan_code);

  const planCode = explicitPlanCode ?? selectedPlanCode;
  const pendingPlanKey = planCodeToStripePlanKey(planCode);

  if (planCode === "free_trial_7_day") {
    return {
      kind: "free_trial",
      planCode,
      pendingPlanKey: null,
      allowsPlatformTrialAccess: true,
    };
  }

  if (planCode === "pilot_6_month") {
    return {
      kind: "pilot_programme",
      planCode,
      pendingPlanKey: null,
      allowsPlatformTrialAccess: true,
    };
  }

  if (pendingPlanKey) {
    return {
      kind: "paid_subscription",
      planCode,
      pendingPlanKey,
      allowsPlatformTrialAccess: false,
    };
  }

  return {
    kind: "unknown",
    planCode,
    pendingPlanKey: null,
    allowsPlatformTrialAccess: false,
  };
}
