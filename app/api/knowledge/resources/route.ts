import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type KnowledgeChunkRow = {
  source_table: string | null;
  source_record_id: number | null;
  created_at: string | null;
  is_active: boolean;
};

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

export async function GET(request: Request) {
  try {
    const access = await requireAuthorisedContext("hr_resources.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const { data, error } = await supabase
      .from("knowledge_chunks")
      .select(
        `
          source_table,
          source_record_id,
          created_at,
          is_active
        `
      )
      .eq("organisation_id", organisationId);

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

    const rows =
      (data || []) as KnowledgeChunkRow[];

    const grouped = new Map<
      string,
      {
        sourceTable: string;
        sourceRecordId: number;
        sectionCount: number;
        activeSectionCount: number;
        lastPreparedAt: string | null;
      }
    >();

    for (const row of rows) {
      if (
        !row.source_table ||
        typeof row.source_record_id !== "number"
      ) {
        continue;
      }

      const key =
        `${row.source_table}:${row.source_record_id}`;

      const existing = grouped.get(key);

      if (existing) {
        existing.sectionCount += 1;

        if (row.is_active) {
          existing.activeSectionCount += 1;
        }

        if (
          row.created_at &&
          (!existing.lastPreparedAt ||
            new Date(row.created_at).getTime() >
              new Date(
                existing.lastPreparedAt
              ).getTime())
        ) {
          existing.lastPreparedAt =
            row.created_at;
        }

        continue;
      }

      grouped.set(key, {
        sourceTable: row.source_table,
        sourceRecordId:
          row.source_record_id,
        sectionCount: 1,
        activeSectionCount:
          row.is_active ? 1 : 0,
        lastPreparedAt:
          row.created_at || null,
      });
    }

    return NextResponse.json({
      success: true,
      organisationId,

      resources: Array.from(
        grouped.entries()
      ).map(([key, value]) => ({
        key,
        ...value,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown knowledge status error.",
      },
      {
        status: 500,
      }
    );
  }
}