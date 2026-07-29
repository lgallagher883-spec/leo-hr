import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function createServerSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured."
    );
  }

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured."
    );
  }

  return createAdminClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function requireAuthorisedContext(permissionKey: string) {
  const session = await createSessionClient();

  const {
    data: { user },
    error: userError,
  } = await session.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "You are not signed in." },
        { status: 401 },
      ),
    };
  }

  const admin = createServerSupabaseClient();

  const resolvedRole = await resolveAuthoritativeUserRole(admin as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;

  if (!organisationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (session as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to access knowledge could not be verified.",
        },
        { status: 500 },
      ),
    };
  }

  if (!allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "You do not have permission to access this resource." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    supabase: admin,
    organisationId: String(organisationId),
  };
}

async function resourceBelongsToOrganisation(args: {
  supabase: ReturnType<typeof createServerSupabaseClient>;
  sourceTable: "policy_register" | "company_documents";
  sourceRecordId: number;
  organisationId: string;
}) {
  const { supabase, sourceTable, sourceRecordId, organisationId } = args;

  const { data, error } = await supabase
    .from(sourceTable)
    .select("id")
    .eq("id", sourceRecordId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (!data) {
    return { ok: false as const, error: "The resource could not be found." };
  }

  return { ok: true as const };
}

export async function GET(request: Request) {
  try {
    const access = await requireAuthorisedContext("hr_resources.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const url = new URL(request.url);

    const sourceTable =
      url.searchParams.get("sourceTable");

    const sourceRecordId =
      Number(
        url.searchParams.get(
          "sourceRecordId"
        )
      );

    if (
      sourceTable !==
        "policy_register" &&
      sourceTable !==
        "company_documents"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid source table is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        sourceRecordId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid resource ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const ownership = await resourceBelongsToOrganisation({
      supabase,
      sourceTable,
      sourceRecordId,
      organisationId,
    });

    if (!ownership.ok) {
      return NextResponse.json(
        {
          success: false,
          error: ownership.error,
        },
        {
          status: ownership.error === "The resource could not be found." ? 404 : 500,
        },
      );
    }

    const { data, error } =
      await supabase
        .from(
          "hr_resource_versions"
        )
        .select(
          `
            id,
            version_number,
            resource_name,
            resource_type,
            category,
            responsible_person,
            review_date,
            notes,
            file_name,
            file_path,
            file_url,
            replaced_at
          `
        )
        .eq(
          "source_table",
          sourceTable
        )
        .eq(
          "source_record_id",
          sourceRecordId
        )
        .order(
          "version_number",
          {
            ascending: false,
          }
        );

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      versions: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Version history could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}