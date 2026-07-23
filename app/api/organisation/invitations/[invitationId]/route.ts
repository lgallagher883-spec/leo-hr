import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
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

async function authoriseInvitationManager(
  invitationId: string,
  organisationId?: string,
) {
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

  const { data: invitation, error: invitationError } = await admin
    .from("organisation_invitations")
    .select(
      "id, organisation_id, email, role, invitation_status, expires_at, created_at",
    )
    .eq("id", invitationId)
    .maybeSingle();

  if (invitationError) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: invitationError.message },
        { status: 500 },
      ),
    };
  }

  if (!invitation) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "The invitation could not be found." },
        { status: 404 },
      ),
    };
  }

  if (organisationId && invitation.organisation_id !== organisationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "The invitation does not belong to this organisation." },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await admin
    .from("organisation_memberships")
    .select("id, role, membership_status")
    .eq("organisation_id", invitation.organisation_id)
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .maybeSingle();

  if (membershipError) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: membershipError.message },
        { status: 500 },
      ),
    };
  }

  if (!membership) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "You do not have access to this organisation." },
        { status: 403 },
      ),
    };
  }

  if (!["owner", "senior"].includes(String(membership.role).toLowerCase())) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Only an Owner or Senior user can manage invitations." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    admin,
    user,
    invitation,
  };
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { invitationId } = await context.params;

    if (!isUuid(invitationId)) {
      return NextResponse.json(
        { error: "A valid invitation ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      organisationId?: unknown;
    };

    const organisationId =
      typeof body.organisationId === "string"
        ? body.organisationId
        : undefined;

    if (organisationId && !isUuid(organisationId)) {
      return NextResponse.json(
        { error: "A valid organisation ID is required." },
        { status: 400 },
      );
    }

    const authorisation = await authoriseInvitationManager(
      invitationId,
      organisationId,
    );

    if (!authorisation.ok) {
      return authorisation.response;
    }

    const { admin, invitation, user } = authorisation;

    if (invitation.invitation_status === "accepted") {
      return NextResponse.json(
        { error: "An accepted invitation cannot be resent." },
        { status: 409 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await admin
      .from("organisation_invitations")
      .update({
        invitation_token: crypto.randomUUID(),
        invitation_status: "pending",
        invited_by: user.id,
        expires_at: expiresAt,
        cancelled_at: null,
        updated_at: now.toISOString(),
        metadata: {
          resent_at: now.toISOString(),
          resent_by: user.id,
          source: "organisation_people_access",
        },
      })
      .eq("id", invitationId)
      .select(
        "id, email, role, invitation_status, expires_at, created_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        invitation: {
          id: data.id,
          email: data.email,
          role_id: null,
          role_name: data.role,
          status: data.invitation_status,
          invited_at: data.created_at,
          expires_at: data.expires_at,
          invited_by_name: null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Organisation invitation resend failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The invitation could not be resent.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { invitationId } = await context.params;

    if (!isUuid(invitationId)) {
      return NextResponse.json(
        { error: "A valid invitation ID is required." },
        { status: 400 },
      );
    }

    const authorisation =
      await authoriseInvitationManager(invitationId);

    if (!authorisation.ok) {
      return authorisation.response;
    }

    const { admin, invitation, user } = authorisation;

    if (invitation.invitation_status === "accepted") {
      return NextResponse.json(
        { error: "An accepted invitation cannot be cancelled." },
        { status: 409 },
      );
    }

    if (invitation.invitation_status === "cancelled") {
      return NextResponse.json(
        { error: "This invitation has already been cancelled." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await admin
      .from("organisation_invitations")
      .update({
        invitation_status: "cancelled",
        cancelled_at: now,
        updated_at: now,
        metadata: {
          cancelled_at: now,
          cancelled_by: user.id,
          source: "organisation_people_access",
        },
      })
      .eq("id", invitationId)
      .select(
        "id, email, role, invitation_status, expires_at, created_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        invitation: {
          id: data.id,
          email: data.email,
          role_id: null,
          role_name: data.role,
          status: data.invitation_status,
          invited_at: data.created_at,
          expires_at: data.expires_at,
          invited_by_name: null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Organisation invitation cancellation failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The invitation could not be cancelled.",
      },
      { status: 500 },
    );
  }
}