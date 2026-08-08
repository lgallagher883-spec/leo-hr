import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { resolveRegistrationIntent } from "@/lib/billing/registrationIntent";
import { createClient } from "@/lib/supabase/server";
import DashboardShell, {
  type DashboardBillingGuard,
  type DashboardAccessRole,
} from "./DashboardShell";

type MembershipRoleRow = {
  id?: string | null;
  role?: string | null;
  membership_status?: string | null;
  is_primary_organisation?: boolean | null;
  is_default_organisation?: boolean | null;
  organisation_id?: string | null;
};

type TrialRecord = {
  status: string;
  starts_at: string | null;
  ends_at: string | null;
};

type SubscriptionRecord = {
  status: string;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
};

type EntitlementRecord = {
  access_status: string;
  effective_from: string | null;
  effective_until: string | null;
};

const billingAllowedRoutes = ["/dashboard/billing", "/dashboard/my-account"];

function isCurrentlyEffective(
  effectiveFrom: string | null,
  effectiveUntil: string | null,
  now: number,
) {
  const startsAt = effectiveFrom ? new Date(effectiveFrom).getTime() : null;
  const endsAt = effectiveUntil ? new Date(effectiveUntil).getTime() : null;

  if (startsAt !== null && (Number.isNaN(startsAt) || startsAt > now)) {
    return false;
  }

  if (endsAt !== null && (Number.isNaN(endsAt) || endsAt <= now)) {
    return false;
  }

  return true;
}

function normaliseRole(value: string | null | undefined): DashboardAccessRole {
  const role = value?.trim().toLowerCase();

  if (role === "employee") return "employee";
  if (role === "manager") return "manager";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "owner") return "owner";

  return "employee";
}

function routeIsWithin(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isBillingRouteAllowed(pathname: string) {
  return billingAllowedRoutes.some((route) => routeIsWithin(pathname, route));
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  let activeRole: DashboardAccessRole = "employee";
  let organisationId: string | null = null;
  let billingGuard: DashboardBillingGuard = {
    hasPlatformAccess: true,
    billingRedirectPlanKey: null,
  };

  const membershipResult = await (supabase as any)
    .from("organisation_memberships")
    .select(
      "id, organisation_id, role, membership_status, is_primary_organisation, is_default_organisation",
    )
    .eq("user_id", user.id)
    .in("membership_status", ["active", "accepted"])
    .order("is_primary_organisation", { ascending: false })
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const membership = membershipResult.data as MembershipRoleRow | null;

  if (membership) {
    organisationId = membership.organisation_id ?? null;

    if (membership.id) {
      const resolvedRole = await resolveRoleForMembership(
        supabase as any,
        {
          membershipId: membership.id,
          fallbackRole: membership.role,
        },
      );

      activeRole = resolvedRole.roleKey;
    } else if (membership.role) {
      activeRole = normaliseRole(membership.role);
    }
  }

  /*
   * Platform administrators must always receive the management shell,
   * even when they do not have an organisation membership or their
   * organisation membership is recorded as employee.
   */
  const platformAccessResult = await (supabase as any).rpc(
    "leo_is_platform_administrator",
  );

  const isPlatformAdministrator =
    !platformAccessResult.error &&
    platformAccessResult.data === true;

  if (isPlatformAdministrator) {
    activeRole = "owner";
  }

  /*
   * Platform administrators are internal LEO management users.
   * They must not be subscription-gated by an organisation's
   * customer billing state.
   *
   * Normal customer organisations still follow the full trial,
   * subscription and entitlement checks below.
   */
  if (organisationId && !isPlatformAdministrator) {
    const registrationIntent = resolveRegistrationIntent(user.user_metadata);

    const [trialResult, subscriptionResult, entitlementResult] =
      await Promise.all([
        supabase
          .from("leo_organisation_trials")
          .select("status, starts_at, ends_at")
          .eq("organisation_id", organisationId)
          .maybeSingle(),
        supabase
          .from("leo_organisation_subscriptions")
          .select("status, current_period_starts_at, current_period_ends_at")
          .eq("organisation_id", organisationId)
          .maybeSingle(),
        supabase
          .from("leo_organisation_entitlements")
          .select("access_status, effective_from, effective_until")
          .eq("organisation_id", organisationId)
          .maybeSingle(),
      ]);

    if (!trialResult.error && !subscriptionResult.error && !entitlementResult.error) {
      const trial = trialResult.data as TrialRecord | null;
      const subscription = subscriptionResult.data as SubscriptionRecord | null;
      const entitlement = entitlementResult.data as EntitlementRecord | null;
      const now = Date.now();

      const hasActiveTrial =
        registrationIntent.allowsPlatformTrialAccess &&
        trial?.status === "active" &&
        isCurrentlyEffective(trial.starts_at, trial.ends_at, now);

      const hasActiveSubscription =
        Boolean(subscription) &&
        ["active", "trialing", "grace"].includes(subscription?.status ?? "") &&
        isCurrentlyEffective(
          subscription?.current_period_starts_at ?? null,
          subscription?.current_period_ends_at ?? null,
          now,
        );

      const hasActiveEntitlement =
        Boolean(entitlement) &&
        ["active", "trial", "trialing", "grace"].includes(
          entitlement?.access_status ?? "",
        ) &&
        isCurrentlyEffective(
          entitlement?.effective_from ?? null,
          entitlement?.effective_until ?? null,
          now,
        );

      const hasPlatformAccess =
        hasActiveTrial || hasActiveSubscription || hasActiveEntitlement;

      const canAutoStartCheckout =
        activeRole === "owner" &&
        registrationIntent.pendingPlanKey &&
        !hasActiveSubscription &&
        !hasActiveEntitlement;

      billingGuard = {
        hasPlatformAccess,
        billingRedirectPlanKey: canAutoStartCheckout
          ? registrationIntent.pendingPlanKey
          : null,
      };
    }
  }

  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-leo-pathname") ?? "/dashboard";

  if (!billingGuard.hasPlatformAccess && !isBillingRouteAllowed(pathname)) {
    const target = billingGuard.billingRedirectPlanKey
      ? `/dashboard/billing?autostart=${billingGuard.billingRedirectPlanKey}`
      : "/dashboard/billing";

    redirect(target);
  }

  return (
    <DashboardShell
      accessRole={activeRole}
      organisationId={organisationId}
      userId={user.id}
      billingGuard={billingGuard}
    >
      {children}
    </DashboardShell>
  );
}