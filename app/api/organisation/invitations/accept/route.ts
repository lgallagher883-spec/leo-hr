import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function normaliseEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

async function getSignedInUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

async function findInvitation(
  admin: ReturnType<typeof adminClient>,
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  },
) {
  const metadataInvitationId =
    typeof user.user_metadata?.organisation_invitation_id === "string"
      ? user.user_metadata.organisation_invitation_id
      : null;

  let query = admin
    .from("organisation_invitations")
    .select(
      `
        id,
        organisation_id,
        email,
        role,
        invitation_status,
        invited_by,
        expires_at,
        accepted_at,
        organisations (
          id,
          name
        )
      `,
    );

  if (metadataInvitationId) {
    query = query.eq("id", metadataInvitationId);
  } else {
    query = query
      .ilike("email", normaliseEmail(user.email))
      .eq("invitation_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
  }

  const { data, error } = await query.maybeSingle();

  return { invitation: data, error };
}

export async function GET() {
  try {
    const { user, error: userError } = await getSignedInUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your invitation session has expired. Open the invitation email again." },
        { status: 401 },
      );
    }

    const admin = adminClient();
    const { invitation, error } = await findInvitation(admin, user);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!invitation) {
      return NextResponse.json(
        { error: "No invitation could be found for this account." },
        { status: 404 },
      );
    }

    if (normaliseEmail(invitation.email) !== normaliseEmail(user.email)) {
      return NextResponse.json(
        { error: "This invitation belongs to a different email address." },
        { status: 403 },
      );
    }

    if (invitation.invitation_status !== "pending") {
      return NextResponse.json(
        { error: "This invitation is no longer pending." },
        { status: 409 },
      );
    }

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await admin
        .from("organisation_invitations")
        .update({
          invitation_status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "This invitation has expired. Ask the organisation to resend it." },
        { status: 410 },
      );
    }

    const organisation = Array.isArray(invitation.organisations)
      ? invitation.organisations[0]
      : invitation.organisations;

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          organisationId: invitation.organisation_id,
          organisationName: organisation?.name ?? "your organisation",
          expiresAt: invitation.expires_at,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Invitation details could not be loaded:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The invitation could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: unknown;
      lastName?: unknown;
    };

    const firstName =
      typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName =
      typeof body.lastName === "string" ? body.lastName.trim() : "";

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Enter your first name and last name." },
        { status: 400 },
      );
    }

    if (firstName.length > 100 || lastName.length > 100) {
      return NextResponse.json(
        { error: "Your name is too long." },
        { status: 400 },
      );
    }

    const { user, error: userError } = await getSignedInUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your invitation session has expired. Open the invitation email again." },
        { status: 401 },
      );
    }

    const admin = adminClient();
    const { invitation, error: invitationError } =
      await findInvitation(admin, user);

    if (invitationError) {
      return NextResponse.json(
        { error: invitationError.message },
        { status: 500 },
      );
    }

    if (!invitation) {
      return NextResponse.json(
        { error: "No invitation could be found for this account." },
        { status: 404 },
      );
    }

    if (normaliseEmail(invitation.email) !== normaliseEmail(user.email)) {
      return NextResponse.json(
        { error: "This invitation belongs to a different email address." },
        { status: 403 },
      );
    }

    if (invitation.invitation_status !== "pending") {
      return NextResponse.json(
        { error: "This invitation is no longer pending." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await admin
        .from("organisation_invitations")
        .update({
          invitation_status: "expired",
          updated_at: now,
        })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "This invitation has expired. Ask the organisation to resend it." },
        { status: 410 },
      );
    }

    const displayName = `${firstName} ${lastName}`.trim();

    const { error: identityError } = await admin
      .from("identity_profiles")
      .upsert(
        {
          id: user.id,
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          is_active: true,
          updated_at: now,
        },
        { onConflict: "id" },
      );

    if (identityError) {
      return NextResponse.json(
        { error: identityError.message },
        { status: 500 },
      );
    }

    const { error: profileError } = await admin
      .from("user_profiles")
      .upsert(
        {
          user_id: user.id,
          organisation_id: invitation.organisation_id,
          role: invitation.role,
          first_name: firstName,
          last_name: lastName,
          display_name: displayName,
          is_active: true,
          updated_at: now,
          metadata: {
            source: "organisation_invitation",
            organisation_invitation_id: invitation.id,
          },
        },
        { onConflict: "user_id" },
      );

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
    }

    const { error: membershipError } = await admin
      .from("organisation_memberships")
      .upsert(
        {
          organisation_id: invitation.organisation_id,
          user_id: user.id,
          role: invitation.role,
          membership_status: "active",
          membership_type: "standard",
          invited_by: invitation.invited_by,
          accepted_at: now,
          activated_at: now,
          joined_at: now,
          is_primary_organisation: false,
          is_default_organisation: true,
          updated_at: now,
          updated_by: user.id,
          metadata: {
            source: "organisation_invitation",
            organisation_invitation_id: invitation.id,
          },
        },
        { onConflict: "organisation_id,user_id" },
      );

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 },
      );
    }

    const { error: invitationUpdateError } = await admin
      .from("organisation_invitations")
      .update({
        invitation_status: "accepted",
        accepted_at: now,
        accepted_by: user.id,
        updated_at: now,
      })
      .eq("id", invitation.id)
      .eq("invitation_status", "pending");

    if (invitationUpdateError) {
      return NextResponse.json(
        { error: invitationUpdateError.message },
        { status: 500 },
      );
    }

    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        first_name: firstName,
        last_name: lastName,
        full_name: displayName,
        organisation_id: invitation.organisation_id,
        organisation_role: invitation.role,
        organisation_invitation_id: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        redirectTo: "/dashboard",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Invitation acceptance failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The invitation could not be accepted.",
      },
      { status: 500 },
    );
  }
}