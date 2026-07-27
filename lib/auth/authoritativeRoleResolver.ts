import "server-only";

export type CanonicalRoleKey =
  | "owner"
  | "senior"
  | "manager"
  | "employee";

export type CanonicalRole =
  | "Owner"
  | "Senior"
  | "Manager"
  | "Employee";

type MembershipRow = {
  id: string;
  organisation_id: string;
  role: string | null;
  membership_status: string;
  access_starts_at?: string | null;
  access_ends_at?: string | null;
};

type RoleAssignmentRow = {
  is_primary?: boolean | null;
  is_active?: boolean | null;
  starts_at?: string | null;
  expires_at?: string | null;
  role?:
    | {
        role_key?: string | null;
        role_level?: number | null;
      }
    | Array<{
        role_key?: string | null;
        role_level?: number | null;
      }>
    | null;
};

const roleLabelMap: Record<CanonicalRoleKey, CanonicalRole> = {
  owner: "Owner",
  senior: "Senior",
  manager: "Manager",
  employee: "Employee",
};

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function isMembershipTemporallyActive(membership: MembershipRow): boolean {
  const now = Date.now();
  const startsAt = parseTimestamp(membership.access_starts_at ?? null);
  const endsAt = parseTimestamp(membership.access_ends_at ?? null);

  if (startsAt !== null && startsAt > now) {
    return false;
  }

  if (endsAt !== null && endsAt <= now) {
    return false;
  }

  return true;
}

function isAssignmentEffective(assignment: RoleAssignmentRow): boolean {
  if (assignment.is_active === false) {
    return false;
  }

  const now = Date.now();
  const startsAt = parseTimestamp(assignment.starts_at ?? null);
  const endsAt = parseTimestamp(assignment.expires_at ?? null);

  if (startsAt !== null && startsAt > now) {
    return false;
  }

  if (endsAt !== null && endsAt <= now) {
    return false;
  }

  return true;
}

function roleRecordFromAssignment(assignment: RoleAssignmentRow) {
  return Array.isArray(assignment.role)
    ? (assignment.role[0] ?? null)
    : (assignment.role ?? null);
}

export function normaliseRoleKey(value: unknown): CanonicalRoleKey {
  const role = readText(value).toLowerCase();

  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";
  if (role === "employee") return "employee";

  return "employee";
}

export function normaliseRole(value: unknown): CanonicalRole {
  return roleLabelMap[normaliseRoleKey(value)];
}

export async function resolveActiveMembershipForUser(
  supabase: any,
  args: {
    userId: string;
    organisationId?: string;
    allowedStatuses?: string[];
  },
): Promise<MembershipRow | null> {
  const {
    userId,
    organisationId,
    allowedStatuses = ["active"],
  } = args;

  let query = supabase
    .from("organisation_memberships")
    .select(
      "id, organisation_id, role, membership_status, access_starts_at, access_ends_at, is_default_organisation, is_primary_organisation, created_at",
    )
    .eq("user_id", userId)
    .in("membership_status", allowedStatuses);

  if (organisationId) {
    query = query.eq("organisation_id", organisationId);
  } else {
    query = query
      .order("is_primary_organisation", { ascending: false })
      .order("is_default_organisation", { ascending: false })
      .order("created_at", { ascending: true });
  }

  const result = await query.limit(5);

  if (result.error || !Array.isArray(result.data)) {
    return null;
  }

  const memberships = result.data as MembershipRow[];

  const activeMembership = memberships.find((membership) =>
    isMembershipTemporallyActive(membership),
  );

  return activeMembership ?? null;
}

export async function resolveRoleForMembership(
  supabase: any,
  args: {
    membershipId: string;
    fallbackRole: unknown;
  },
): Promise<{
    roleKey: CanonicalRoleKey;
    role: CanonicalRole;
    source: "assignment" | "membership_fallback" | "default_employee";
  }> {
  const { membershipId, fallbackRole } = args;

  const assignmentResult = await supabase
    .from("membership_roles")
    .select(
      `
        is_primary,
        is_active,
        starts_at,
        expires_at,
        role:roles!inner (
          role_key,
          role_level
        )
      `,
    )
    .eq("membership_id", membershipId)
    .eq("is_active", true);

  if (!assignmentResult.error && Array.isArray(assignmentResult.data)) {
    const candidateAssignments = (assignmentResult.data as RoleAssignmentRow[])
      .filter((assignment) => isAssignmentEffective(assignment))
      .sort((left, right) => {
        const leftPrimary = left.is_primary === true;
        const rightPrimary = right.is_primary === true;

        if (leftPrimary !== rightPrimary) {
          return leftPrimary ? -1 : 1;
        }

        const leftRole = roleRecordFromAssignment(left);
        const rightRole = roleRecordFromAssignment(right);

        const leftLevel = Number.isFinite(Number(leftRole?.role_level))
          ? Number(leftRole?.role_level)
          : -1;
        const rightLevel = Number.isFinite(Number(rightRole?.role_level))
          ? Number(rightRole?.role_level)
          : -1;

        return rightLevel - leftLevel;
      });

    const selectedRole = roleRecordFromAssignment(candidateAssignments[0]);

    if (selectedRole?.role_key) {
      const roleKey = normaliseRoleKey(selectedRole.role_key);

      return {
        roleKey,
        role: roleLabelMap[roleKey],
        source: "assignment",
      };
    }
  }

  const fallbackRoleKey = normaliseRoleKey(fallbackRole);

  if (readText(fallbackRole)) {
    return {
      roleKey: fallbackRoleKey,
      role: roleLabelMap[fallbackRoleKey],
      source: "membership_fallback",
    };
  }

  return {
    roleKey: "employee",
    role: "Employee",
    source: "default_employee",
  };
}

export async function resolveAuthoritativeUserRole(
  supabase: any,
  args: {
    userId: string;
    organisationId?: string;
    allowedStatuses?: string[];
  },
): Promise<{
  membership: MembershipRow;
  roleKey: CanonicalRoleKey;
  role: CanonicalRole;
  source: "assignment" | "membership_fallback" | "default_employee";
} | null> {
  const membership = await resolveActiveMembershipForUser(supabase, args);

  if (!membership) {
    return null;
  }

  const resolvedRole = await resolveRoleForMembership(supabase, {
    membershipId: membership.id,
    fallbackRole: membership.role,
  });

  return {
    membership,
    roleKey: resolvedRole.roleKey,
    role: resolvedRole.role,
    source: resolvedRole.source,
  };
}

export async function countActiveOwnerAssignments(
  supabase: any,
  organisationId: string,
): Promise<number> {
  const result = await supabase
    .from("membership_roles")
    .select(
      `
        is_active,
        starts_at,
        expires_at,
        role:roles!inner (
          role_key
        ),
        membership:organisation_memberships!inner (
          organisation_id,
          membership_status,
          access_starts_at,
          access_ends_at
        )
      `,
    )
    .eq("membership.organisation_id", organisationId)
    .eq("membership.membership_status", "active")
    .eq("is_active", true);

  if (result.error || !Array.isArray(result.data)) {
    return 0;
  }

  const now = Date.now();

  return (result.data as Array<
    RoleAssignmentRow & {
      membership?:
        | {
            access_starts_at?: string | null;
            access_ends_at?: string | null;
          }
        | Array<{
            access_starts_at?: string | null;
            access_ends_at?: string | null;
          }>
        | null;
    }
  >)
    .filter((assignment) => {
      if (!isAssignmentEffective(assignment)) {
        return false;
      }

      const roleRecord = roleRecordFromAssignment(assignment);
      if (normaliseRoleKey(roleRecord?.role_key) !== "owner") {
        return false;
      }

      const membershipRecord = Array.isArray(assignment.membership)
        ? (assignment.membership[0] ?? null)
        : (assignment.membership ?? null);

      const startsAt = parseTimestamp(membershipRecord?.access_starts_at ?? null);
      const endsAt = parseTimestamp(membershipRecord?.access_ends_at ?? null);

      if (startsAt !== null && startsAt > now) {
        return false;
      }

      if (endsAt !== null && endsAt <= now) {
        return false;
      }

      return true;
    })
    .length;
}
