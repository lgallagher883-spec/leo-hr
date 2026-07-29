import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export type OrganisationMemoryRecord = {
  id: string;
  organisation_id: string;
  title: string;
  content: string;
  category: string | null;
  keywords: string[] | null;
  source: string | null;
  status: string | null;
  is_active: boolean;
  supersedes_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type OrganisationMemoryRequest = {
  organisationId?: string;
  title?: string;
  content?: string;
  category?: string;
  keywords?: string[];
  source?: string;
  status?: string;
  isActive?: boolean;
  supersedesId?: string | null;
};

function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!secretKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
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
      .from("leo_organisation_memory_records")
      .select("*")
      .eq("organisation_id", organisationId)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      records: (data || []) as OrganisationMemoryRecord[],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown organisation memory error.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAuthorisedContext("hr_resources.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const body = (await request.json()) as Partial<OrganisationMemoryRequest>;

    const title = body.title?.trim();
    const content = body.content?.trim();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "title and content are required." },
        { status: 400 }
      );
    }

    const record = {
      organisation_id: organisationId,
      title,
      content,
      category: body.category?.trim() || "other",
      keywords: body.keywords?.filter(Boolean) || [],
      source: body.source?.trim() || "user_instruction",
      status: body.status?.trim() || "approved",
      is_active: body.isActive ?? true,
      supersedes_id: body.supersedesId || null,
    };

    const { data, error } = await supabase
      .from("leo_organisation_memory_records")
      .insert(record)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: data as OrganisationMemoryRecord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown organisation memory error.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireAuthorisedContext("hr_resources.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const body = (await request.json()) as Partial<OrganisationMemoryRequest> & { id?: string };

    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required." },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};

    if (body.title) update.title = body.title.trim();
    if (body.content) update.content = body.content.trim();
    if (body.category) update.category = body.category.trim();
    if (body.keywords) update.keywords = body.keywords.filter(Boolean);
    if (body.source) update.source = body.source.trim();
    if (body.status) update.status = body.status.trim();
    if (typeof body.isActive === "boolean") update.is_active = body.isActive;
    if (typeof body.supersedesId === "string" || body.supersedesId === null) update.supersedes_id = body.supersedesId;

    const { data, error } = await supabase
      .from("leo_organisation_memory_records")
      .update(update)
      .eq("id", id)
      .eq("organisation_id", organisationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: data as OrganisationMemoryRecord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown organisation memory error.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireAuthorisedContext("hr_resources.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access;

    const url = new URL(request.url);
    const id = url.searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("leo_organisation_memory_records")
      .delete()
      .eq("id", id)
      .eq("organisation_id", organisationId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown organisation memory error.",
      },
      { status: 500 }
    );
  }
}
