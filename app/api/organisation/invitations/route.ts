import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RoleRecord = {
  id: string;
  role_key: string;
  name: string;
};

type InvitationRecord = {
  id: string;
  organisation_id: string;
  email: string;
  role: string;
  invitation_status: "pending" | "accepted" | "expired" | "cancelled";
  invited_by: string | null;
  expires_at: string | null;
  created_at: string;
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

function isValidEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

async function authoriseOrganisationManager(organisationId: string) {
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

  const { data: membership, error: membershipError } = await admin
    .from("organisation_memberships")
    .select("id, role, membership_status")
    .eq("organisation_id", organisationId)
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
    user,
    admin,
  };
}

async function mapInvitations(
  admin: ReturnType<typeof adminClient>,
  rows: InvitationRecord[],
) {
  const roleKeys = [...new Set(rows.map((row) => row.role))];

  const { data: roles } =
    roleKeys.length > 0
      ? await admin
          .from("roles")
          .select("id, role_key, name")
          .in("role_key", roleKeys)
          .eq("is_active", true)
      : { data: [] as RoleRecord[] };

  const roleMap = new Map(
    ((roles ?? []) as RoleRecord[]).map((role) => [role.role_key, role]),
  );

  return rows.map((row) => {
    const role = roleMap.get(row.role);

    return {
      id: row.id,
      email: row.email,
      role_id: role?.id ?? null,
      role_name: role?.name ?? row.role,
      status: row.invitation_status,
      invited_at: row.created_at,
      expires_at: row.expires_at,
      invited_by_name: null,
    };
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organisationId = searchParams.get("organisationId");

    if (!isUuid(organisationId)) {
      return NextResponse.json(
        { error: "A valid organisation ID is required." },
        { status: 400 },
      );
    }

    const authorisation =
      await authoriseOrganisationManager(organisationId);

    if (!authorisation.ok) {
      return authorisation.response;
    }

    const { admin } = authorisation;
    const now = new Date().toISOString();

    await admin
      .from("organisation_invitations")
      .update({
        invitation_status: "expired",
        updated_at: now,
      })
      .eq("organisation_id", organisationId)
      .eq("invitation_status", "pending")
      .lt("expires_at", now);

    const { data, error } = await admin
      .from("organisation_invitations")
      .select(
        "id, organisation_id, email, role, invitation_status, invited_by, expires_at, created_at",
      )
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const invitations = await mapInvitations(
      admin,
      (data ?? []) as InvitationRecord[],
    );

    return NextResponse.json(
      { invitations },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Organisation invitations GET failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invitations could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      organisationId?: unknown;
      email?: unknown;
      roleId?: unknown;
    };

    if (!isUuid(body.organisationId)) {
      return NextResponse.json(
        { error: "A valid organisation ID is required." },
        { status: 400 },
      );
    }

    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (!isUuid(body.roleId)) {
      return NextResponse.json(
        { error: "Choose a valid organisation role." },
        { status: 400 },
      );
    }

    const organisationId = body.organisationId;
    const email = body.email.trim().toLowerCase();

    const authorisation =
      await authoriseOrganisationManager(organisationId);

    if (!authorisation.ok) {
      return authorisation.response;
    }

    const { admin, user } = authorisation;

    const { data: role, error: roleError } = await admin
      .from("roles")
      .select("id, role_key, name, is_assignable, is_active, is_archived")
      .eq("id", body.roleId)
      .eq("is_assignable", true)
      .eq("is_active", true)
      .eq("is_archived", false)
      .maybeSingle();

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    if (
      !role ||
      !["owner", "senior", "manager", "employee"].includes(role.role_key)
    ) {
      return NextResponse.json(
        { error: "The selected role cannot be assigned." },
        { status: 400 },
      );
    }

    const { data: existingProfile } = await admin
      .from("identity_profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfile?.id) {
      const { data: existingMembership } = await admin
        .from("organisation_memberships")
        .select("id, membership_status")
        .eq("organisation_id", organisationId)
        .eq("user_id", existingProfile.id)
        .maybeSingle();

      if (
        existingMembership &&
        existingMembership.membership_status !== "ended"
      ) {
        return NextResponse.json(
          { error: "This person already has organisation access." },
          { status: 409 },
        );
      }
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await admin
      .from("organisation_invitations")
      .insert({
        organisation_id: organisationId,
        email,
        role: role.role_key,
        invitation_status: "pending",
        invited_by: user.id,
        expires_at: expiresAt,
        metadata: {
          role_id: role.id,
          role_name: role.name,
          source: "organisation_people_access",
        },
        updated_at: now.toISOString(),
      })
      .select(
        "id, organisation_id, email, role, invitation_status, invited_by, expires_at, created_at",
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A pending invitation already exists for this email address.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const [invitation] = await mapInvitations(
      admin,
      [data as InvitationRecord],
    );

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error("Organisation invitations POST failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The invitation could not be created.",
      },
      { status: 500 },
    );
  }
}