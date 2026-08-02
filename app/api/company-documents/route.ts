import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function requireOrganisationAccess(
  allowedRoles: Array<"owner" | "senior" | "manager">,
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
        { success: false, error: "You must be signed in." },
        { status: 401 },
      ),
    };
  }

  const admin = getAdminClient();
  const resolvedRole = await resolveAuthoritativeUserRole(admin as any, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  if (!resolvedRole) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "No active organisation is linked to your account.",
        },
        { status: 403 },
      ),
    };
  }

  if (!allowedRoles.includes(resolvedRole.roleKey as any)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have permission to manage company documents.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    user,
    admin,
    organisationId: resolvedRole.membership.organisation_id,
  };
}

export async function GET(request: Request) {
  try {
    const access = await requireOrganisationAccess([
      "owner",
      "senior",
      "manager",
    ]);

    if (!access.ok) {
      return access.response;
    }

    const requestUrl = new URL(request.url);
    const folder = requestUrl.searchParams.get("folder")?.trim() || "";
    const groupId = requestUrl.searchParams.get("groupId")?.trim() || "";

    let query = access.admin
      .from("company_documents")
      .select(
        "id, name, notes, document_type, file_name, file_path, created_at, updated_at, status, archived_at, document_group_id, version_number, previous_version_id, replaced_by_id",
      )
      .eq("organisation_id", access.organisationId);

    if (groupId) {
      query = query
        .eq("document_group_id", groupId)
        .order("version_number", { ascending: false });
    } else {
      if (!folder) {
        return NextResponse.json(
          { success: false, error: "A document folder is required." },
          { status: 400 },
        );
      }

      query = query
        .eq("document_type", folder)
        .or("status.is.null,status.eq.active")
        .order("name", { ascending: true });
    }

    const result = await query;

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({
      success: true,
      documents: result.data ?? [],
    });
  } catch (error) {
    console.error("Company documents could not be loaded:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Company documents could not be loaded.",
      },
      { status: 500 },
    );
  }
}