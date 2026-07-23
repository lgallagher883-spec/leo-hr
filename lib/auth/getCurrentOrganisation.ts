import "server-only";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export type LeoUserRole = "owner" | "hr" | "manager" | "employee";

export type LeoOrganisationStatus =
  | "trial"
  | "active"
  | "restricted"
  | "cancelled"
  | "archived";

export type LeoSubscriptionStatus =
  | "trialing"
  | "active"
  | "pending_payment"
  | "past_due"
  | "grace"
  | "cancelled"
  | "expired";

export type LeoPlanCode =
  | "free_trial_7_day"
  | "organisation_50"
  | "organisation_150"
  | "organisation_250"
  | "enterprise"
  | string;

export type CurrentOrganisationProfile = {
  userId: string;
  organisationId: string;
  role: LeoUserRole;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  employeeId: string | null;
  managerEmployeeId: string | null;
  metadata: Record<string, unknown>;
};

export type CurrentOrganisationRecord = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  employeeCountBand: string | null;
  status: LeoOrganisationStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  activatedAt: string | null;
  restrictedAt: string | null;
  archivedAt: string | null;
  metadata: Record<string, unknown>;
};

export type CurrentSubscriptionPlan = {
  id: string;
  planCode: LeoPlanCode;
  planName: string;
  employeeProfileLimit: number | null;
  monthlyPricePence: number;
  currency: string;
  billingInterval: string;
  isEnterprise: boolean;
  isPublic: boolean;
  isActive: boolean;
  displayOrder: number | null;
};

export type CurrentOrganisationSubscription = {
  id: string;
  organisationId: string;
  planId: string;
  status: LeoSubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStartedAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelledAt: string | null;
  metadata: Record<string, unknown>;
  plan: CurrentSubscriptionPlan;
};

export type CurrentOrganisationAccess = {
  isAuthenticated: true;
  isOwner: boolean;
  isHr: boolean;
  isManager: boolean;
  isEmployee: boolean;
  isTrial: boolean;
  isPaid: boolean;
  requiresPayment: boolean;
  isPastDue: boolean;
  isInGracePeriod: boolean;
  isRestricted: boolean;
  isCancelled: boolean;
  isArchived: boolean;
  trialHasExpired: boolean;
  canAccessPlatform: boolean;
  canAccessBilling: boolean;
  canManageOrganisation: boolean;
  canManageUsers: boolean;
};

export type CurrentOrganisationContext = {
  user: User;
  profile: CurrentOrganisationProfile;
  organisation: CurrentOrganisationRecord;
  subscription: CurrentOrganisationSubscription;
  access: CurrentOrganisationAccess;
};

export type CurrentOrganisationFailureCode =
  | "unauthenticated"
  | "profile_missing"
  | "organisation_missing"
  | "subscription_missing"
  | "subscription_plan_missing"
  | "invalid_profile_role"
  | "invalid_organisation_status"
  | "invalid_subscription_status"
  | "database_error";

export class CurrentOrganisationError extends Error {
  readonly code: CurrentOrganisationFailureCode;
  readonly causeMessage?: string;

  constructor(
    code: CurrentOrganisationFailureCode,
    message: string,
    causeMessage?: string,
  ) {
    super(message);
    this.name = "CurrentOrganisationError";
    this.code = code;
    this.causeMessage = causeMessage;
  }
}

type RawProfile = {
  user_id: string;
  organisation_id: string | null;
  role: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  employee_id: string | null;
  manager_employee_id: string | null;
  metadata: unknown;
};

type RawOrganisation = {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  employee_count_band: string | null;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  activated_at: string | null;
  restricted_at: string | null;
  archived_at: string | null;
  metadata: unknown;
};

type RawSubscriptionPlan = {
  id: string;
  plan_code: string;
  plan_name: string;
  employee_profile_limit: number | null;
  monthly_price_pence: number;
  currency: string;
  billing_interval: string;
  is_enterprise: boolean;
  is_public: boolean;
  is_active: boolean;
  display_order: number | null;
};

type RawSubscription = {
  id: string;
  organisation_id: string;
  plan_id: string;
  subscription_status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  current_period_started_at: string | null;
  current_period_ends_at: string | null;
  cancelled_at: string | null;
  metadata: unknown;
  subscription_plans: RawSubscriptionPlan | RawSubscriptionPlan[] | null;
};

const VALID_ROLES: readonly LeoUserRole[] = [
  "owner",
  "hr",
  "manager",
  "employee",
];

const VALID_ORGANISATION_STATUSES: readonly LeoOrganisationStatus[] = [
  "trial",
  "active",
  "restricted",
  "cancelled",
  "archived",
];

const VALID_SUBSCRIPTION_STATUSES: readonly LeoSubscriptionStatus[] = [
  "trialing",
  "active",
  "pending_payment",
  "past_due",
  "grace",
  "cancelled",
  "expired",
];

function asRecord(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function isRole(value: string): value is LeoUserRole {
  return VALID_ROLES.includes(value as LeoUserRole);
}

function isOrganisationStatus(
  value: string,
): value is LeoOrganisationStatus {
  return VALID_ORGANISATION_STATUSES.includes(
    value as LeoOrganisationStatus,
  );
}

function isSubscriptionStatus(
  value: string,
): value is LeoSubscriptionStatus {
  return VALID_SUBSCRIPTION_STATUSES.includes(
    value as LeoSubscriptionStatus,
  );
}

function getSinglePlan(
  value: RawSubscription["subscription_plans"],
): RawSubscriptionPlan | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function hasExpired(dateValue: string | null): boolean {
  if (!dateValue) {
    return false;
  }

  const timestamp = Date.parse(dateValue);

  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

function buildAccess(
  role: LeoUserRole,
  organisationStatus: LeoOrganisationStatus,
  subscriptionStatus: LeoSubscriptionStatus,
  trialEndsAt: string | null,
): CurrentOrganisationAccess {
  const isTrial = subscriptionStatus === "trialing";
  const isPaid = subscriptionStatus === "active";
  const requiresPayment = subscriptionStatus === "pending_payment";
  const isPastDue = subscriptionStatus === "past_due";
  const isInGracePeriod = subscriptionStatus === "grace";
  const isCancelled =
    organisationStatus === "cancelled" ||
    subscriptionStatus === "cancelled" ||
    subscriptionStatus === "expired";
  const isArchived = organisationStatus === "archived";
  const trialHasExpired = isTrial && hasExpired(trialEndsAt);
  const isRestricted =
    organisationStatus === "restricted" ||
    requiresPayment ||
    isPastDue ||
    trialHasExpired;

  const canAccessPlatform =
    !isArchived &&
    !isCancelled &&
    !isRestricted &&
    (isTrial || isPaid || isInGracePeriod);

  const canAccessBilling =
    !isArchived &&
    (role === "owner" || role === "hr");

  const canManageOrganisation =
    !isArchived &&
    !isCancelled &&
    role === "owner";

  const canManageUsers =
    !isArchived &&
    !isCancelled &&
    (role === "owner" || role === "hr");

  return {
    isAuthenticated: true,
    isOwner: role === "owner",
    isHr: role === "hr",
    isManager: role === "manager",
    isEmployee: role === "employee",
    isTrial,
    isPaid,
    requiresPayment,
    isPastDue,
    isInGracePeriod,
    isRestricted,
    isCancelled,
    isArchived,
    trialHasExpired,
    canAccessPlatform,
    canAccessBilling,
    canManageOrganisation,
    canManageUsers,
  };
}

export async function getCurrentOrganisation(): Promise<CurrentOrganisationContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new CurrentOrganisationError(
      "database_error",
      "LEO could not validate the current authentication session.",
      userError.message,
    );
  }

  if (!user) {
    throw new CurrentOrganisationError(
      "unauthenticated",
      "No authenticated user session is available.",
    );
  }

  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select(
      "user_id, organisation_id, role, first_name, last_name, display_name, employee_id, manager_employee_id, metadata",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new CurrentOrganisationError(
      "database_error",
      "LEO could not load the current user profile.",
      profileError.message,
    );
  }

  if (!profileData) {
    throw new CurrentOrganisationError(
      "profile_missing",
      "The authenticated user does not have a LEO user profile.",
    );
  }

  const rawProfile = profileData as RawProfile;

  if (!rawProfile.organisation_id) {
    throw new CurrentOrganisationError(
      "organisation_missing",
      "The current user profile is not linked to an organisation.",
    );
  }

  if (!isRole(rawProfile.role)) {
    throw new CurrentOrganisationError(
      "invalid_profile_role",
      "The current user profile contains an unsupported role.",
    );
  }

  const { data: organisationData, error: organisationError } = await supabase
    .from("organisations")
    .select(
      "id, name, slug, website_url, employee_count_band, status, trial_started_at, trial_ends_at, activated_at, restricted_at, archived_at, metadata",
    )
    .eq("id", rawProfile.organisation_id)
    .maybeSingle();

  if (organisationError) {
    throw new CurrentOrganisationError(
      "database_error",
      "LEO could not load the current organisation.",
      organisationError.message,
    );
  }

  if (!organisationData) {
    throw new CurrentOrganisationError(
      "organisation_missing",
      "The organisation linked to the current user profile does not exist.",
    );
  }

  const rawOrganisation = organisationData as RawOrganisation;

  if (!isOrganisationStatus(rawOrganisation.status)) {
    throw new CurrentOrganisationError(
      "invalid_organisation_status",
      "The current organisation contains an unsupported status.",
    );
  }

  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from("organisation_subscriptions")
    .select(
      `
        id,
        organisation_id,
        plan_id,
        subscription_status,
        trial_started_at,
        trial_ends_at,
        current_period_started_at,
        current_period_ends_at,
        cancelled_at,
        metadata,
        subscription_plans (
          id,
          plan_code,
          plan_name,
          employee_profile_limit,
          monthly_price_pence,
          currency,
          billing_interval,
          is_enterprise,
          is_public,
          is_active,
          display_order
        )
      `,
    )
    .eq("organisation_id", rawProfile.organisation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    throw new CurrentOrganisationError(
      "database_error",
      "LEO could not load the current organisation subscription.",
      subscriptionError.message,
    );
  }

  if (!subscriptionData) {
    throw new CurrentOrganisationError(
      "subscription_missing",
      "The current organisation does not have a subscription record.",
    );
  }

  const rawSubscription = subscriptionData as unknown as RawSubscription;

  if (!isSubscriptionStatus(rawSubscription.subscription_status)) {
    throw new CurrentOrganisationError(
      "invalid_subscription_status",
      "The current organisation subscription contains an unsupported status.",
    );
  }

  const rawPlan = getSinglePlan(rawSubscription.subscription_plans);

  if (!rawPlan) {
    throw new CurrentOrganisationError(
      "subscription_plan_missing",
      "The current organisation subscription is not linked to a plan.",
    );
  }

  const profile: CurrentOrganisationProfile = {
    userId: rawProfile.user_id,
    organisationId: rawProfile.organisation_id,
    role: rawProfile.role,
    firstName: rawProfile.first_name,
    lastName: rawProfile.last_name,
    displayName: rawProfile.display_name,
    employeeId: rawProfile.employee_id,
    managerEmployeeId: rawProfile.manager_employee_id,
    metadata: asRecord(rawProfile.metadata),
  };

  const organisation: CurrentOrganisationRecord = {
    id: rawOrganisation.id,
    name: rawOrganisation.name,
    slug: rawOrganisation.slug,
    websiteUrl: rawOrganisation.website_url,
    employeeCountBand: rawOrganisation.employee_count_band,
    status: rawOrganisation.status,
    trialStartedAt: rawOrganisation.trial_started_at,
    trialEndsAt: rawOrganisation.trial_ends_at,
    activatedAt: rawOrganisation.activated_at,
    restrictedAt: rawOrganisation.restricted_at,
    archivedAt: rawOrganisation.archived_at,
    metadata: asRecord(rawOrganisation.metadata),
  };

  const plan: CurrentSubscriptionPlan = {
    id: rawPlan.id,
    planCode: rawPlan.plan_code,
    planName: rawPlan.plan_name,
    employeeProfileLimit: rawPlan.employee_profile_limit,
    monthlyPricePence: rawPlan.monthly_price_pence,
    currency: rawPlan.currency,
    billingInterval: rawPlan.billing_interval,
    isEnterprise: rawPlan.is_enterprise,
    isPublic: rawPlan.is_public,
    isActive: rawPlan.is_active,
    displayOrder: rawPlan.display_order,
  };

  const subscription: CurrentOrganisationSubscription = {
    id: rawSubscription.id,
    organisationId: rawSubscription.organisation_id,
    planId: rawSubscription.plan_id,
    status: rawSubscription.subscription_status,
    trialStartedAt: rawSubscription.trial_started_at,
    trialEndsAt: rawSubscription.trial_ends_at,
    currentPeriodStartedAt: rawSubscription.current_period_started_at,
    currentPeriodEndsAt: rawSubscription.current_period_ends_at,
    cancelledAt: rawSubscription.cancelled_at,
    metadata: asRecord(rawSubscription.metadata),
    plan,
  };

  const effectiveTrialEnd =
    subscription.trialEndsAt ?? organisation.trialEndsAt;

  return {
    user,
    profile,
    organisation,
    subscription,
    access: buildAccess(
      profile.role,
      organisation.status,
      subscription.status,
      effectiveTrialEnd,
    ),
  };
}

export async function getCurrentOrganisationOrNull(): Promise<CurrentOrganisationContext | null> {
  try {
    return await getCurrentOrganisation();
  } catch (error) {
    if (
      error instanceof CurrentOrganisationError &&
      error.code === "unauthenticated"
    ) {
      return null;
    }

    throw error;
  }
}