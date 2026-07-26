import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlatformRole =
  | "owner"
  | "senior"
  | "manager"
  | "employee";

const writeRoles = new Set<PlatformRole>([
  "owner",
  "senior",
  "manager",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();

  if (role === "owner") {
    return "owner";
  }

  if (role === "senior" || role === "hr") {
    return "senior";
  }

  if (role === "manager") {
    return "manager";
  }

  return "employee";
}

async function accessContext(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error:
            "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const membership = await supabase
    .from("organisation_memberships")
    .select("organisation_id, role")
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .order("is_default_organisation", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (membership.error) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: membership.error.message,
        },
        { status: 500 },
      ),
    };
  }

  if (!membership.data?.organisation_id) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error:
            "Leo could not find an active organisation for your account.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    organisationId: membership.data.organisation_id,
    role: normaliseRole(membership.data.role),
  };
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const access = await accessContext(supabase as any);

  if ("error" in access) {
    return access.error;
  }

  const candidate = await (supabase as any)
    .from("leo_talent_candidates")
    .select("id")
    .eq("id", id)
    .eq("organisation_id", access.organisationId)
    .maybeSingle();

  if (candidate.error) {
    return NextResponse.json(
      {
        success: false,
        error: candidate.error.message,
      },
      { status: 500 },
    );
  }

  if (!candidate.data) {
    return NextResponse.json(
      {
        success: false,
        error: "The candidate record was not found.",
      },
      { status: 404 },
    );
  }

  const documents = await (supabase as any)
    .from("leo_talent_candidate_documents")
    .select(
      `
        id,
        candidate_id,
        document_type,
        title,
        file_name,
        file_path,
        mime_type,
        file_size_bytes,
        created_at
      `,
    )
    .eq("candidate_id", id)
    .eq("organisation_id", access.organisationId)
    .order("created_at", {
      ascending: false,
    });

  if (documents.error) {
    return NextResponse.json(
      {
        success: false,
        error: documents.error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    documents: documents.data ?? [],
  });
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: writeRoles.size
        ? "Add documents by editing the candidate record."
        : "Document upload is unavailable.",
    },
    { status: 405 },
  );
}