import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RoleRecord = {
  id: string;
  role_key: string;
  name: string;
};

type EmployeeRecord = {
  id: number;
  organisation_id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  status: string | null;
  department: string | null;
  archived_at: string | null;
};

type InvitationRecord = {
  id: string;
  organisation_id: string;
  employee_id: number | null;
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

function parseEmployeeId(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function isValidEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

function isEligibleEmployeeStatus(value: string | null) {
  const status = value?.trim().toLowerCase();

  if (!status) return true;

  return ![
    "archived",
    "ended",
    "inactive",
    "left",
    "leaver",
    "terminated",
    "dismissed",
  ].includes(status);
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

  if (!["owner", "senior"].includes(resolvedRole.roleKey)) {
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
  const employeeIds = [
    ...new Set(
      rows
        .map((row) => row.employee_id)
        .filter((value): value is number => value !== null),
    ),
  ];

  const [rolesResult, employeesResult] = await Promise.all([
    roleKeys.length > 0
      ? admin
          .from("roles")
          .select("id, role_key, name")
          .in("role_key", roleKeys)
          .eq("is_active", true)
      : Promise.resolve({ data: [] as RoleRecord[] }),
    employeeIds.length > 0
      ? admin
          .from("employees")
          .select(
            "id, organisation_id, name, role, email, status, department, archived_at",
          )
          .in("id", employeeIds)
      : Promise.resolve({ data: [] as EmployeeRecord[] }),
  ]);

  const roleMap = new Map(
    ((rolesResult.data ?? []) as RoleRecord[]).map((role) => [
      role.role_key,
      role,
    ]),
  );

  const employeeMap = new Map(
    ((employeesResult.data ?? []) as EmployeeRecord[]).map((employee) => [
      employee.id,
      employee,
    ]),
  );

  return rows.map((row) => {
    const role = roleMap.get(row.role);
    const employee =
      row.employee_id !== null ? employeeMap.get(row.employee_id) : undefined;

    return {
      id: row.id,
      employee_id: row.employee_id,
      employee_name: employee?.name ?? null,
      employee_job_title: employee?.role ?? null,
      employee_department: employee?.department ?? null,
      employee_status: employee?.status ?? null,
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
        "id, organisation_id, employee_id, email, role, invitation_status, invited_by, expires_at, created_at",
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
      employeeId?: unknown;
      roleId?: unknown;
    };

    if (!isUuid(body.organisationId)) {
      return NextResponse.json(
        { error: "A valid organisation ID is required." },
        { status: 400 },
      );
    }

    const employeeId = parseEmployeeId(body.employeeId);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Choose a valid employee." },
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

    const authorisation =
      await authoriseOrganisationManager(organisationId);

    if (!authorisation.ok) {
      return authorisation.response;
    }

    const { admin, user } = authorisation;

    const [{ data: role, error: roleError }, employeeResult] =
      await Promise.all([
        admin
          .from("roles")
          .select("id, role_key, name, is_assignable, is_active, is_archived")
          .eq("id", body.roleId)
          .eq("is_assignable", true)
          .eq("is_active", true)
          .eq("is_archived", false)
          .maybeSingle(),
        admin
          .from("employees")
          .select(
            "id, organisation_id, name, role, email, status, department, archived_at",
          )
          .eq("id", employeeId)
          .eq("organisation_id", organisationId)
          .maybeSingle(),
      ]);

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    if (
      !role ||
      !["owner", "senior", "manager", "employee"].includes(role.role_key)
    ) {
      return NextResponse.json(
        { error: "The selected permission cannot be assigned." },
        { status: 400 },
      );
    }

    if (employeeResult.error) {
      return NextResponse.json(
        { error: employeeResult.error.message },
        { status: 500 },
      );
    }

    const employee = employeeResult.data as EmployeeRecord | null;

    if (!employee) {
      return NextResponse.json(
        { error: "The selected employee could not be found." },
        { status: 404 },
      );
    }

    if (employee.archived_at) {
      return NextResponse.json(
        { error: "Archived employees cannot be invited." },
        { status: 409 },
      );
    }

    if (!isEligibleEmployeeStatus(employee.status)) {
      return NextResponse.json(
        {
          error:
            "This employee is not currently eligible for portal access.",
        },
        { status: 409 },
      );
    }

    if (!isValidEmail(employee.email)) {
      return NextResponse.json(
        {
          error:
            "Add a valid work email to the employee record before inviting them.",
        },
        { status: 409 },
      );
    }

    const email = employee.email.trim().toLowerCase();

    const { data: pendingInvitation, error: pendingInvitationError } =
      await admin
        .from("organisation_invitations")
        .select("id")
        .eq("organisation_id", organisationId)
        .eq("invitation_status", "pending")
        .or(`employee_id.eq.${employeeId},email.ilike.${email}`)
        .maybeSingle();

    if (pendingInvitationError) {
      return NextResponse.json(
        { error: pendingInvitationError.message },
        { status: 500 },
      );
    }

    if (pendingInvitation) {
      return NextResponse.json(
        {
          error:
            "A pending invitation already exists for this employee.",
        },
        { status: 409 },
      );
    }

    const { data: organisationMemberships, error: membershipsError } =
      await admin
        .from("organisation_memberships")
        .select("user_id, membership_status")
        .eq("organisation_id", organisationId)
        .neq("membership_status", "ended");

    if (membershipsError) {
      return NextResponse.json(
        { error: membershipsError.message },
        { status: 500 },
      );
    }

    for (const membership of organisationMemberships ?? []) {
      if (!membership.user_id) continue;

      const { data: memberUserData, error: memberUserError } =
        await admin.auth.admin.getUserById(membership.user_id);

      if (memberUserError) {
        console.warn(
          "Could not inspect an existing organisation user:",
          memberUserError,
        );
        continue;
      }

      const memberEmail =
        memberUserData.user?.email?.trim().toLowerCase() ?? "";

      if (memberEmail === email) {
        return NextResponse.json(
          { error: "This employee already has organisation access." },
          { status: 409 },
        );
      }
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 5 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await admin
      .from("organisation_invitations")
      .insert({
        organisation_id: organisationId,
        employee_id: employeeId,
        email,
        role: role.role_key,
        invitation_status: "pending",
        invited_by: user.id,
        expires_at: expiresAt,
        metadata: {
          employee_id: employeeId,
          employee_name: employee.name,
          role_id: role.id,
          role_name: role.name,
          source: "organisation_people_access",
        },
        updated_at: now.toISOString(),
      })
      .select(
        "id, organisation_id, employee_id, email, role, invitation_status, invited_by, expires_at, created_at",
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "A pending invitation already exists for this employee.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const redirectTo =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || origin;

    const { error: inviteEmailError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${redirectTo}/auth/accept-invitation`,
        data: {
          organisation_invitation_id: data.id,
          organisation_id: organisationId,
          organisation_role: role.role_key,
          employee_id: employeeId,
          invited_by: user.id,
        },
      });

    if (inviteEmailError) {
      console.error(
        "Supabase invitation email failed:",
        inviteEmailError,
      );

      await admin
        .from("organisation_invitations")
        .delete()
        .eq("id", data.id);

      return NextResponse.json(
        {
          error:
            inviteEmailError.message ||
            "The invitation email could not be sent.",
        },
        { status: 502 },
      );
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