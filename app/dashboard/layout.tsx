import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import DashboardShell, {
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

type LinkedRoleRow = {
  roles?:
    | {
        name?: string | null;
        slug?: string | null;
        role_key?: string | null;
      }
    | Array<{
        name?: string | null;
        slug?: string | null;
        role_key?: string | null;
      }>
    | null;
};

function normaliseRole(value: string | null | undefined): DashboardAccessRole {
  const role = value?.trim().toLowerCase();

  if (role === "employee") return "employee";
  if (role === "manager") return "manager";
  if (role === "senior") return "senior";
  if (role === "owner") return "owner";

  return "employee";
}

function extractLinkedRole(row: LinkedRoleRow | null): string | null {
  if (!row?.roles) return null;

  const roleRecord = Array.isArray(row.roles) ? row.roles[0] : row.roles;

  return (
    roleRecord?.slug ??
    roleRecord?.role_key ??
    roleRecord?.name ??
    null
  );
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

    if (membership.role) {
      activeRole = normaliseRole(membership.role);
    }
  }

  /*
   * membership_roles is the preferred role-assignment model.
   * The legacy organisation_memberships.role value remains a safe fallback
   * while existing organisations are migrated.
   */
  if (membership && organisationId) {
    const linkedRoleResult = await (supabase as any)
      .from("membership_roles")
      .select(
        `
          roles (
            name,
            slug,
            role_key
          )
        `,
      )
      .eq("membership_id", membership.id)
      .limit(1)
      .maybeSingle();

    if (!linkedRoleResult.error && linkedRoleResult.data) {
      const linkedRole = extractLinkedRole(
        linkedRoleResult.data as LinkedRoleRow,
      );

      if (linkedRole) {
        activeRole = normaliseRole(linkedRole);
      }
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

  if (
    !platformAccessResult.error &&
    platformAccessResult.data === true
  ) {
    activeRole = "owner";
  }

  return (
    <DashboardShell
      accessRole={activeRole}
      organisationId={organisationId}
      userId={user.id}
    >
      {children}
    </DashboardShell>
  );
}