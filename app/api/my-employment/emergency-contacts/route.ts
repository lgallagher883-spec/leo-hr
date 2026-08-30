// Leo HR employee emergency contacts self-service API.
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type ContactInput = {
  contactNumber?: unknown;
  fullName?: unknown;
  relationship?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase administrator credentials are not configured.");
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveEmployee() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "You must be signed in." },
        { status: 401 },
      ),
    };
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Your active organisation could not be resolved." },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select("membership_status,access_starts_at,access_ends_at")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "You do not have active access to this organisation." },
        { status: 403 },
      ),
    };
  }

  const now = Date.now();
  const start = membership.access_starts_at
    ? new Date(membership.access_starts_at).getTime()
    : null;
  const end = membership.access_ends_at
    ? new Date(membership.access_ends_at).getTime()
    : null;

  if (
    (start !== null && Number.isFinite(start) && start > now) ||
    (end !== null && Number.isFinite(end) && end <= now)
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Your organisation access is not currently active." },
        { status: 403 },
      ),
    };
  }

  const { data: link, error: linkError } = await supabase
    .from("employee_user_links")
    .select("employee_id")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .eq("link_status", "active")
    .maybeSingle();

  if (linkError) throw new Error(linkError.message);

  if (!link?.employee_id) {
    return {
      ok: true as const,
      context: null,
    };
  }

  const admin = getAdminClient();
  const employee = await admin
    .from("employees")
    .select("id,name")
    .eq("id", link.employee_id)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employee.error) throw new Error(employee.error.message);

  if (!employee.data) {
    return {
      ok: true as const,
      context: null,
    };
  }

  return {
    ok: true as const,
    context: {
      organisationId,
      employeeId: employee.data.id,
      employeeName: employee.data.name || "Employee",
      user,
    },
  };
}

async function readContacts(employeeId: number) {
  const admin = getAdminClient();

  const result = await admin
    .from("employee_emergency_contacts")
    .select(
      "id,employee_id,contact_number,full_name,relationship,phone,email,address,created_at,updated_at",
    )
    .eq("employee_id", employeeId)
    .order("contact_number", { ascending: true });

  if (result.error) throw new Error(result.error.message);

  return result.data ?? [];
}

export async function GET() {
  try {
    const resolved = await resolveEmployee();

    if (!resolved.ok) return resolved.response;

    if (!resolved.context) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        contacts: [],
      });
    }

    const contacts = await readContacts(resolved.context.employeeId);

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      contacts,
    });
  } catch (error) {
    console.error("Leo HR emergency contacts API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your emergency contacts could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const resolved = await resolveEmployee();

    if (!resolved.ok) return resolved.response;

    if (!resolved.context) {
      return NextResponse.json(
        { success: false, error: "Your account is not linked to an employee record." },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { contacts?: ContactInput[] }
      | null;

    if (!Array.isArray(body?.contacts)) {
      return NextResponse.json(
        { success: false, error: "Emergency contact details are required." },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const { employeeId, organisationId, employeeName, user } = resolved.context;

    for (const input of body.contacts.slice(0, 2)) {
      const contactNumber = Number(input.contactNumber);

      if (contactNumber !== 1 && contactNumber !== 2) {
        continue;
      }

      const payload = {
        full_name: text(input.fullName) || null,
        relationship: text(input.relationship) || null,
        phone: text(input.phone) || null,
        email: text(input.email) || null,
        address: text(input.address) || null,
        updated_at: new Date().toISOString(),
      };

      const hasAnyValue = Object.entries(payload).some(
        ([key, value]) => key !== "updated_at" && Boolean(value),
      );

      const existing = await admin
        .from("employee_emergency_contacts")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("contact_number", contactNumber)
        .maybeSingle();

      if (existing.error) throw new Error(existing.error.message);

      if (!hasAnyValue) {
        if (existing.data?.id) {
          const removal = await admin
            .from("employee_emergency_contacts")
            .delete()
            .eq("id", existing.data.id)
            .eq("employee_id", employeeId);

          if (removal.error) throw new Error(removal.error.message);
        }

        continue;
      }

      if (existing.data?.id) {
        const update = await admin
          .from("employee_emergency_contacts")
          .update(payload)
          .eq("id", existing.data.id)
          .eq("employee_id", employeeId);

        if (update.error) throw new Error(update.error.message);
      } else {
        const insert = await admin
          .from("employee_emergency_contacts")
          .insert({
            employee_id: employeeId,
            contact_number: contactNumber,
            ...payload,
          });

        if (insert.error) throw new Error(insert.error.message);
      }
    }

    const contacts = await readContacts(employeeId);

    const audit = await admin.from("audit_logs").insert({
      organisation_id: organisationId,
      user_id: user.id,
      user_name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : user.email || "Employee",
      user_email: user.email || null,
      action: "Emergency contacts updated",
      action_category: "Employee",
      entity_type: "Employee",
      entity_id: String(employeeId),
      entity_name: employeeName,
      description: `${employeeName} updated their emergency contact details.`,
      metadata: {
        source_module: "Employee self-service",
      },
      source_page: "/dashboard/my-employment/emergency-contacts",
      created_at: new Date().toISOString(),
    });

    if (audit.error) {
      console.warn("Emergency contacts audit event could not be written:", audit.error);
    }

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      contacts,
    });
  } catch (error) {
    console.error("Leo HR emergency contacts update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your emergency contacts could not be saved.",
      },
      { status: 500 },
    );
  }
}
