import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  countActiveOwnerAssignments,
  resolveAuthoritativeUserRole,
  resolveRoleForMembership,
} from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

type RoleRecord = {
  id: string;
  role_key: string;
  name: string;
  role_level: number;
  is_assignable: boolean;
  is_active: boolean;
  is_archived: boolean;
  organisation_id: string | null;
};

type MembershipRecord = {
  id: string;
  organisation_id: string;
  user_id: string;
  role: string | null;
  membership_status: string;
};

type MembershipRoleRecord = {
  id: string;
  membership_id: string;
  role_id: string;
  is_primary: boolean;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase server environment variables are not configured.",
    );
  }

  return createAdminClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

async function getCurrentUserAuthorisation(organisationId: string) {
  const sessionClient = await createClient();

  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      ),
    };
  }

  const admin = adminClient();

  const resolvedRole = await resolveAuthoritativeUserRole(admin as any, {
    userId: user.id,
    organisationId,
    allowedStatuses: ["active"],
  });

  if (!resolvedRole) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "You do not have access to this organisation." },
        { status: 403 },
      ),
    };
  }

  const callerRole = resolvedRole.roleKey;

  if (!["owner", "senior"].includes(callerRole)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            "Only an Owner or Senior user can change organisation permissions.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    user,
    admin,
    callerRole,
  };
}

async function recordAuditEvent(args: {
  admin: ReturnType<typeof adminClient>;
  organisationId: string;
  userId: string;
  membershipId: string;
  previousRole: string | null;
  nextRole: RoleRecord;
}) {
  const {
    admin,
    organisationId,
    userId,
    membershipId,
    previousRole,
    nextRole,
  } = args;

  try {
    await admin.from("audit_logs").insert({
      organisation_id: organisationId,
      actor_user_id: userId,
      action: "organisation_membership_role_changed",
      entity_type: "organisation_membership",
      entity_id: membershipId,
      metadata: {
        previous_role: previousRole,
        new_role: nextRole.role_key,
        new_role_name: nextRole.name,
        source: "people_and_access",
      },
    });
  } catch (error) {
    console.warn("Role change audit event could not be recorded:", error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { membershipId } = await context.params;

    if (!isUuid(membershipId)) {
      return NextResponse.json(
        { error: "A valid membership ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      organisationId?: unknown;
      roleId?: unknown;
    };

    if (!isUuid(body.organisationId)) {
      return NextResponse.json(
        { error: "A valid organisation ID is required." },
        { status: 400 },
      );
    }

    if (!isUuid(body.roleId)) {
      return NextResponse.json(
        { error: "Choose a valid permission." },
        { status: 400 },
      );
    }

    const organisationId = body.organisationId;
    const roleId = body.roleId;

    const authorisation =
      await getCurrentUserAuthorisation(organisationId);

    if (!authorisation.ok) {
      return authorisation.response;
    }

    const { admin, user, callerRole } = authorisation;

    const [
      { data: targetMembership, error: targetMembershipError },
      { data: nextRole, error: nextRoleError },
    ] = await Promise.all([
      admin
        .from("organisation_memberships")
        .select("id, organisation_id, user_id, role, membership_status")
        .eq("id", membershipId)
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      admin
        .from("roles")
        .select(
          "id, role_key, name, role_level, is_assignable, is_active, is_archived, organisation_id",
        )
        .eq("id", roleId)
        .eq("is_assignable", true)
        .eq("is_active", true)
        .eq("is_archived", false)
        .maybeSingle(),
    ]);

    if (targetMembershipError) {
      return NextResponse.json(
        { error: targetMembershipError.message },
        { status: 500 },
      );
    }

    if (!targetMembership) {
      return NextResponse.json(
        { error: "The organisation member could not be found." },
        { status: 404 },
      );
    }

    if (targetMembership.membership_status !== "active") {
      return NextResponse.json(
        {
          error:
            "Permissions can only be changed for an active organisation member.",
        },
        { status: 409 },
      );
    }

    if (nextRoleError) {
      return NextResponse.json(
        { error: nextRoleError.message },
        { status: 500 },
      );
    }

    if (!nextRole) {
      return NextResponse.json(
        { error: "The selected permission cannot be assigned." },
        { status: 400 },
      );
    }

    const selectedRole = nextRole as RoleRecord;

    if (
      selectedRole.organisation_id &&
      selectedRole.organisation_id !== organisationId
    ) {
      return NextResponse.json(
        {
          error:
            "The selected permission does not belong to this organisation.",
        },
        { status: 403 },
      );
    }

    const allowedRoleKeys = ["owner", "senior", "manager", "employee"];

    if (!allowedRoleKeys.includes(selectedRole.role_key)) {
      return NextResponse.json(
        { error: "The selected permission cannot be assigned." },
        { status: 400 },
      );
    }

    const targetResolvedRole = await resolveRoleForMembership(
      admin as any,
      {
        membershipId: targetMembership.id,
        fallbackRole: targetMembership.role,
      },
    );

    const currentRoleKey = targetResolvedRole.roleKey;

    if (callerRole === "senior") {
      if (currentRoleKey === "owner") {
        return NextResponse.json(
          {
            error:
              "A Senior user cannot change an Owner's permission.",
          },
          { status: 403 },
        );
      }

      if (selectedRole.role_key === "owner") {
        return NextResponse.json(
          {
            error:
              "Only an Owner can assign another organisation Owner.",
          },
          { status: 403 },
        );
      }
    }

    if (currentRoleKey === selectedRole.role_key) {
      return NextResponse.json(
        {
          membership: {
            id: targetMembership.id,
            role: selectedRole,
          },
          message: `${selectedRole.name} is already assigned.`,
        },
        { status: 200 },
      );
    }

    if (
      currentRoleKey === "owner" &&
      selectedRole.role_key !== "owner"
    ) {
      const ownerCount = await countActiveOwnerAssignments(
        admin as any,
        organisationId,
      );

      if (ownerCount <= 1) {
        return NextResponse.json(
          {
            error:
              "The final active organisation Owner cannot be reassigned. Assign another Owner first.",
          },
          { status: 409 },
        );
      }
    }

    const { data: existingAssignments, error: existingAssignmentsError } =
      await admin
        .from("membership_roles")
        .select(
          "id, membership_id, role_id, is_primary, is_active, starts_at, expires_at",
        )
        .eq("membership_id", membershipId);

    if (existingAssignmentsError) {
      return NextResponse.json(
        { error: existingAssignmentsError.message },
        { status: 500 },
      );
    }

    const assignments =
      (existingAssignments ?? []) as MembershipRoleRecord[];

    const existingTargetAssignment = assignments.find(
      (assignment) => assignment.role_id === selectedRole.id,
    );

    const now = new Date().toISOString();

    if (existingTargetAssignment) {
      const { error: targetAssignmentError } = await admin
        .from("membership_roles")
        .update({
          is_active: true,
          is_primary: true,
          starts_at: now,
          expires_at: null,
          assigned_by: user.id,
          assigned_at: now,
          assignment_reason:
            "Assigned through Organisation access management.",
          revoked_by: null,
          revoked_at: null,
          revocation_reason: null,
          updated_at: now,
        })
        .eq("id", existingTargetAssignment.id);

      if (targetAssignmentError) {
        return NextResponse.json(
          { error: targetAssignmentError.message },
          { status: 500 },
        );
      }
    } else {
      const { error: insertAssignmentError } = await admin
        .from("membership_roles")
        .insert({
          membership_id: membershipId,
          role_id: selectedRole.id,
          is_primary: true,
          is_active: true,
          starts_at: now,
          expires_at: null,
          assigned_by: user.id,
          assigned_at: now,
          assignment_reason:
            "Assigned through Organisation access management.",
          updated_at: now,
        });

      if (insertAssignmentError) {
        return NextResponse.json(
          { error: insertAssignmentError.message },
          { status: 500 },
        );
      }
    }

    const otherActiveAssignmentIds = assignments
      .filter(
        (assignment) =>
          assignment.role_id !== selectedRole.id &&
          assignment.is_active,
      )
      .map((assignment) => assignment.id);

    if (otherActiveAssignmentIds.length > 0) {
      const { error: revokeAssignmentsError } = await admin
        .from("membership_roles")
        .update({
          is_active: false,
          is_primary: false,
          revoked_by: user.id,
          revoked_at: now,
          revocation_reason: `Replaced with ${selectedRole.name} through Organisation access management.`,
          updated_at: now,
        })
        .in("id", otherActiveAssignmentIds);

      if (revokeAssignmentsError) {
        return NextResponse.json(
          { error: revokeAssignmentsError.message },
          { status: 500 },
        );
      }
    }

    const { error: membershipUpdateError } = await admin
      .from("organisation_memberships")
      .update({
        role: selectedRole.role_key,
        updated_by: user.id,
        updated_at: now,
      })
      .eq("id", membershipId)
      .eq("organisation_id", organisationId);

    if (membershipUpdateError) {
      return NextResponse.json(
        { error: membershipUpdateError.message },
        { status: 500 },
      );
    }

    await recordAuditEvent({
      admin,
      organisationId,
      userId: user.id,
      membershipId,
      previousRole: targetMembership.role,
      nextRole: selectedRole,
    });

    return NextResponse.json(
      {
        membership: {
          id: membershipId,
          role: {
            id: selectedRole.id,
            role_key: selectedRole.role_key,
            name: selectedRole.name,
            role_level: selectedRole.role_level,
          },
        },
        message: `Permission changed to ${selectedRole.name}.`,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Organisation membership role PATCH failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The permission could not be changed.",
      },
      { status: 500 },
    );
  }
}