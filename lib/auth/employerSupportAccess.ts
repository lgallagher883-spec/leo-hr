import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmployerSupportAccess = {
  userId: string;
  organisationId: string;
  accountId: string;
  accountStatus: "active" | "suspended" | "closed";
};

type MembershipRow = {
  organisation_id: string;
};

type AccountRow = {
  id: string;
  organisation_id: string;
  status: EmployerSupportAccess["accountStatus"];
};

function membershipIsCurrentlyEffective(
  startsAt: string | null,
  endsAt: string | null,
) {
  const now = Date.now();
  const start = startsAt ? Date.parse(startsAt) : null;
  const end = endsAt ? Date.parse(endsAt) : null;

  if (start !== null && Number.isFinite(start) && start > now) return false;
  if (end !== null && Number.isFinite(end) && end < now) return false;
  return true;
}

export async function getEmployerSupportAccess(): Promise<EmployerSupportAccess | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: memberships, error: membershipError } = await (supabase as any)
    .from("organisation_memberships")
    .select(
      "organisation_id, membership_status, access_starts_at, access_ends_at, is_primary_organisation, is_default_organisation, created_at",
    )
    .eq("user_id", user.id)
    .in("membership_status", ["active", "accepted"])
    .order("is_primary_organisation", { ascending: false })
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true });

  if (membershipError || !Array.isArray(memberships)) return null;

  for (const membership of memberships) {
    if (
      !membershipIsCurrentlyEffective(
        membership.access_starts_at ?? null,
        membership.access_ends_at ?? null,
      )
    ) {
      continue;
    }

    const organisationId = (membership as MembershipRow).organisation_id;
    const { data: account, error: accountError } = await (supabase as any)
      .from("leo_employer_support_accounts")
      .select("id, organisation_id, status")
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (accountError || !account) continue;

    const row = account as AccountRow;
    if (row.status !== "active") continue;

    return {
      userId: user.id,
      organisationId: row.organisation_id,
      accountId: row.id,
      accountStatus: row.status,
    };
  }

  return null;
}

export async function requireEmployerSupportMatter(
  matterId: number,
): Promise<
  | { ok: true; access: EmployerSupportAccess }
  | { ok: false; status: 401 | 403 | 404 }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401 };

  const access = await getEmployerSupportAccess();
  if (!access) return { ok: false, status: 403 };

  // Authentication and Employer Support account access have already been
  // verified above. Product purchases are intentionally read server-side so
  // normal Leo organisation RLS does not hide an otherwise valid paid Matter.
  const admin = createAdminClient();
  const { data: purchase, error } = await (admin as any)
    .from("leo_employer_support_purchases")
    .select("id")
    .eq("organisation_id", access.organisationId)
    .eq("account_id", access.accountId)
    .eq("matter_id", matterId)
    .eq("status", "provisioned")
    .maybeSingle();

  if (error || !purchase) return { ok: false, status: 404 };

  return { ok: true, access };
}
