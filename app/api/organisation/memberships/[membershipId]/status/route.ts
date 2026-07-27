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

type MembershipStatus = "active" | "suspended" | "ended";

type MembershipRecord = {
  id: string;
  organisation_id: string;
  user_id: string;
  role: string | null;
  membership_status: string;
  accepted_at: string | null;
  activated_at: string | null;
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

function isMembershipStatus(value: unknown): value is MembershipStatus {
  return value === "active" || value === "suspended" || value === "ended";
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
        { error: "You do not have active access to this organisation." },
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
            "Only an Owner or Senior user can manage organisation access.",
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
  actorUserId: string;
  membershipId: string;
  previousStatus: string;
  nextStatus: MembershipStatus;
  reason: string | null;
}) {
  const {
    admin,
    organisationId,
    actorUserId,
    membershipId,
    previousStatus,
    nextStatus,
    reason,
  } = args;

  try {
    await admin.from("audit_logs").insert({
      organisation_id: organisationId,
      actor_user_id: actorUserId,
      action: `organisation_membership_${nextStatus}`,
      entity_type: "organisation_membership",
      entity_id: membershipId,
      metadata: {
        previous_status: previousStatus,
        new_status: nextStatus,
        reason,
        source: "people_and_access",
      },
    });
  } catch (error) {
    console.warn("Membership status audit event could not be recorded:", error);
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
      status?: unknown;
      reason?: unknown;
    };

    if (!isUuid(body.organisationId)) {
      return NextResponse.json(
        { error: "A valid organisation ID is required." },
        { status: 400 },
      );
    }

    if (!isMembershipStatus(body.status)) {
      return NextResponse.json(
        { error: "Choose a valid access status." },
        { status: 400 },
      );
    }

    const organisationId = body.organisationId;
    const nextStatus = body.status;
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (nextStatus !== "active" && !reason) {
      return NextResponse.json(
        {
          error:
            nextStatus === "suspended"
              ? "Enter a reason for suspending access."
              : "Enter a reason for ending access.",
        },
        { status: 400 },
      );
    }

    const authorisation =
      await getCurrentUserAuthorisation(organisationId);

    if (!authorisation.ok) {
      return authorisation.response;
    }

    const { admin, user, callerRole } = authorisation;

    const { data: targetMembership, error: targetMembershipError } =
      await admin
        .from("organisation_memberships")
        .select(
          "id, organisation_id, user_id, role, membership_status, accepted_at, activated_at",
        )
        .eq("id", membershipId)
        .eq("organisation_id", organisationId)
        .maybeSingle();

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

    const membership = targetMembership as MembershipRecord;
    const currentStatus = String(membership.membership_status);
    const targetResolvedRole = await resolveRoleForMembership(
      admin as any,
      {
        membershipId: membership.id,
        fallbackRole: membership.role,
      },
    );

    const targetRole = targetResolvedRole.roleKey;

    if (currentStatus === nextStatus) {
      const statusLabel =
        nextStatus === "active"
          ? "active"
          : nextStatus === "suspended"
            ? "suspended"
            : "ended";

      return NextResponse.json(
        {
          membership: {
            id: membership.id,
            membership_status: nextStatus,
          },
          message: `This person's access is already ${statusLabel}.`,
        },
        { status: 200 },
      );
    }

    if (currentStatus === "ended" && nextStatus !== "ended") {
      return NextResponse.json(
        {
          error:
            "Ended access cannot be reactivated. Create a new invitation if access needs to be restored.",
        },
        { status: 409 },
      );
    }

    if (
      nextStatus !== "active" &&
      membership.user_id === user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot suspend or end your own organisation access.",
        },
        { status: 409 },
      );
    }

    if (callerRole === "senior" && targetRole === "owner") {
      return NextResponse.json(
        {
          error:
            "A Senior user cannot suspend, reactivate or end an Owner's access.",
        },
        { status: 403 },
      );
    }

    if (targetRole === "owner" && nextStatus !== "active") {
      const ownerCount = await countActiveOwnerAssignments(
        admin as any,
        organisationId,
      );

      if (ownerCount <= 1) {
        return NextResponse.json(
          {
            error:
              "The final active organisation Owner cannot be suspended or have access ended.",
          },
          { status: 409 },
        );
      }
    }

    if (
      nextStatus === "active" &&
      currentStatus !== "suspended"
    ) {
      return NextResponse.json(
        {
          error:
            "Only a suspended membership can be reactivated.",
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    const updates =
      nextStatus === "active"
        ? {
            membership_status: "active",
            accepted_at: membership.accepted_at ?? now,
            activated_at: now,
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null,
            ended_at: null,
            ended_by: null,
            end_reason: null,
            updated_at: now,
          }
        : nextStatus === "suspended"
          ? {
              membership_status: "suspended",
              suspended_at: now,
              suspended_by: user.id,
              suspension_reason: reason,
              is_default_organisation: false,
                updated_at: now,
            }
          : {
              membership_status: "ended",
              ended_at: now,
              ended_by: user.id,
              end_reason: reason,
              is_default_organisation: false,
                updated_at: now,
            };

    const { error: updateError } = await admin
      .from("organisation_memberships")
      .update(updates)
      .eq("id", membershipId)
      .eq("organisation_id", organisationId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    await recordAuditEvent({
      admin,
      organisationId,
      actorUserId: user.id,
      membershipId,
      previousStatus: currentStatus,
      nextStatus,
      reason: nextStatus === "active" ? null : reason,
    });

    const message =
      nextStatus === "active"
        ? "Organisation access has been reactivated."
        : nextStatus === "suspended"
          ? "Organisation access has been suspended."
          : "Organisation access has been ended.";

    return NextResponse.json(
      {
        membership: {
          id: membershipId,
          membership_status: nextStatus,
        },
        message,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Organisation membership status PATCH failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The access status could not be changed.",
      },
      { status: 500 },
    );
  }
}