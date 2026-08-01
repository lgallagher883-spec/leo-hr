import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AccessContext = {
  organisationId: string;
  role: string;
  permissionKeys: Set<string>;
};

type ContactInput = {
  contactNumber?: unknown;
  fullName?: unknown;
  relationship?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
};

type EmergencyContactsBody = {
  contacts?: unknown;
};

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function readEmployeeId(
  context: RouteContext,
): Promise<number | null> {
  const { id } = await context.params;
  const employeeId = Number(id);

  return Number.isInteger(employeeId) && employeeId > 0
    ? employeeId
    : null;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function readContactNumber(value: unknown): 1 | 2 | null {
  const parsed = Number(value);

  return parsed === 1 || parsed === 2 ? parsed : null;
}

async function requireAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requiredPermissions: string[],
): Promise<
  | { ok: true; access: AccessContext }
  | { ok: false; response: NextResponse }
> {
  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select(
      "id,role,membership_status,access_starts_at,access_ends_at",
    )
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have active access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  const now = Date.now();
  const accessStartsAt = membership.access_starts_at
    ? new Date(membership.access_starts_at).getTime()
    : null;
  const accessEndsAt = membership.access_ends_at
    ? new Date(membership.access_ends_at).getTime()
    : null;

  if (
    (accessStartsAt !== null &&
      Number.isFinite(accessStartsAt) &&
      accessStartsAt > now) ||
    (accessEndsAt !== null &&
      Number.isFinite(accessEndsAt) &&
      accessEndsAt <= now)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your organisation access is not currently active.",
        },
        { status: 403 },
      ),
    };
  }

  const resolvedRole = await resolveRoleForMembership(supabase as any, {
    membershipId: membership.id,
    fallbackRole: membership.role,
  });

  const role = resolvedRole.roleKey;
  const permissionKeys = new Set<string>();

  if (role !== "owner") {
    const { data: permissions, error: permissionsError } =
      await supabase.rpc("leo_effective_permissions", {
        target_organisation_id: organisationId,
      });

    if (permissionsError) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Your employee permissions could not be verified.",
          },
          { status: 403 },
        ),
      };
    }

    for (const permission of permissions ?? []) {
      if (
        permission &&
        typeof permission.permission_key === "string"
      ) {
        permissionKeys.add(permission.permission_key);
      }
    }

    const missingPermission = requiredPermissions.find(
      (permission) => !permissionKeys.has(permission),
    );

    if (missingPermission) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error:
              "You do not have permission to perform this employee action.",
          },
          { status: 403 },
        ),
      };
    }
  }

  return {
    ok: true,
    access: {
      organisationId,
      role,
      permissionKeys,
    },
  };
}

async function verifyEmployee(
  admin: ReturnType<typeof getAdminClient>,
  organisationId: string,
  employeeId: number,
) {
  const result = await admin
    .from("employees")
    .select("id,name")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const employeeId = await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee reference is not valid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.view"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const admin = getAdminClient();
    const employee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const contactsResult = await admin
      .from("employee_emergency_contacts")
      .select(
        "id,employee_id,contact_number,full_name,relationship,phone,email,address,created_at,updated_at",
      )
      .eq("employee_id", employeeId)
      .order("contact_number", { ascending: true });

    if (contactsResult.error) {
      throw new Error(contactsResult.error.message);
    }

    return NextResponse.json(
      {
        success: true,
        contacts: contactsResult.data ?? [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Emergency contacts API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Emergency contacts could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const employeeId = await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee reference is not valid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.manage"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as EmergencyContactsBody;
    const rawContacts = Array.isArray(body.contacts)
      ? (body.contacts as ContactInput[])
      : [];

    const contacts = rawContacts
      .map((contact) => {
        const contactNumber = readContactNumber(contact.contactNumber);

        if (!contactNumber) return null;

        return {
          employee_id: employeeId,
          contact_number: contactNumber,
          full_name: readOptionalString(contact.fullName),
          relationship: readOptionalString(contact.relationship),
          phone: readOptionalString(contact.phone),
          email: readOptionalString(contact.email),
          address: readOptionalString(contact.address),
          updated_at: new Date().toISOString(),
        };
      })
      .filter(
        (
          contact,
        ): contact is {
          employee_id: number;
          contact_number: 1 | 2;
          full_name: string | null;
          relationship: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          updated_at: string;
        } => contact !== null,
      );

    const hasContactOne = contacts.some(
      (contact) => contact.contact_number === 1,
    );
    const hasContactTwo = contacts.some(
      (contact) => contact.contact_number === 2,
    );

    if (!hasContactOne || !hasContactTwo) {
      return NextResponse.json(
        {
          success: false,
          error: "Both emergency contact records must be provided.",
        },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const employee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const upsertResult = await admin
      .from("employee_emergency_contacts")
      .upsert(contacts, {
        onConflict: "employee_id,contact_number",
      })
      .select(
        "id,employee_id,contact_number,full_name,relationship,phone,email,address,created_at,updated_at",
      );

    if (upsertResult.error) {
      throw new Error(upsertResult.error.message);
    }

    const now = new Date().toISOString();
    const userName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : user.email || "System user";

    const auditResult = await admin.from("audit_logs").insert({
      organisation_id: accessResult.access.organisationId,
      user_id: user.id,
      user_name: userName,
      user_email: user.email || null,
      action: "Emergency contacts updated",
      action_category: "Employee",
      entity_type: "Employee",
      entity_id: String(employeeId),
      entity_name: employee.name,
      description: `${employee.name}'s emergency contacts were updated.`,
      new_values: {
        contacts: contacts.map((contact) => ({
          contact_number: contact.contact_number,
          full_name: contact.full_name,
          relationship: contact.relationship,
          phone: contact.phone,
          email: contact.email,
        })),
      },
      metadata: {
        source_module: "Employees",
        employee_section: "Emergency Contacts",
      },
      source_page: `/dashboard/employees/${employeeId}`,
      ip_address:
        request.headers
          .get("x-forwarded-for")
          ?.split(",")[0]
          ?.trim() || null,
      user_agent: request.headers.get("user-agent"),
      created_at: now,
    });

    if (auditResult.error) {
      console.warn(
        "Emergency contacts audit event could not be written:",
        auditResult.error,
      );
    }

    const timelineResult = await admin
      .from("employee_timeline")
      .insert({
        organisation_id: accessResult.access.organisationId,
        employee_id: employeeId,
        event_type: "Emergency Contacts Updated",
        title: "Emergency contacts updated",
        description: "The employee's emergency contact details were updated.",
        status: "Completed",
        source_module: "Employees",
        source_record_id: String(employeeId),
        metadata: {
          contact_numbers: [1, 2],
        },
        event_date: now,
        created_by: user.id,
        created_at: now,
      });

    if (timelineResult.error) {
      console.warn(
        "Emergency contacts timeline event could not be written:",
        timelineResult.error,
      );
    }

    const sortedContacts = [...(upsertResult.data ?? [])].sort(
      (a, b) => a.contact_number - b.contact_number,
    );

    return NextResponse.json({
      success: true,
      contacts: sortedContacts,
    });
  } catch (error) {
    console.error("Emergency contacts update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Emergency contacts could not be saved.",
      },
      { status: 500 },
    );
  }
}