import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SourceTable = "policy_register" | "company_documents";

function createAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase administrator credentials are not configured.");
  }

  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function bucketFor(sourceTable: SourceTable) {
  return sourceTable === "policy_register"
    ? "policy-documents"
    : "company-documents";
}

function safeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_") || "document";
}

async function authorisedContext(permissionKey: string) {
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

  const admin = createAdmin();
  const resolvedRole = await resolveAuthoritativeUserRole(admin as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;

  if (!organisationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Your active organisation could not be resolved." },
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

  if (permissionError || !allowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: permissionError
            ? "Your permission to access HR resources could not be verified."
            : "You do not have permission to access HR resources.",
        },
        { status: permissionError ? 500 : 403 },
      ),
    };
  }

  return {
    ok: true as const,
    admin,
    organisationId: String(organisationId),
  };
}

function parseSourceTable(value: unknown): SourceTable | null {
  return value === "policy_register" || value === "company_documents"
    ? value
    : null;
}

export async function POST(request: Request) {
  try {
    const access = await authorisedContext("hr_resources.manage");
    if (!access.ok) return access.response;

    const formData = await request.formData();
    const sourceTable = parseSourceTable(formData.get("sourceTable"));
    const file = formData.get("file");

    if (!sourceTable) {
      return NextResponse.json(
        { success: false, error: "A valid resource type is required." },
        { status: 400 },
      );
    }

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { success: false, error: "Choose a file to upload." },
        { status: 400 },
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "The selected file is larger than 25 MB." },
        { status: 400 },
      );
    }

    const resourceType =
      typeof formData.get("resourceType") === "string"
        ? String(formData.get("resourceType")).trim().toLowerCase()
        : "resource";

    const folder =
      resourceType.replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-") ||
      "resource";

    const filePath =
      `${access.organisationId}/${folder}/${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const upload = await access.admin.storage
      .from(bucketFor(sourceTable))
      .upload(filePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    return NextResponse.json(
      {
        success: true,
        filePath,
        fileName: file.name,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Secure HR resource upload failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The resource file could not be uploaded.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const access = await authorisedContext("hr_resources.view");
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const sourceTable = parseSourceTable(url.searchParams.get("sourceTable"));
    const rawId = Number(url.searchParams.get("id"));

    if (!sourceTable || !Number.isFinite(rawId) || rawId <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid resource reference is required." },
        { status: 400 },
      );
    }

    const resource = await access.admin
      .from(sourceTable)
      .select("id,file_path,file_name")
      .eq("id", rawId)
      .eq("organisation_id", access.organisationId)
      .maybeSingle();

    if (resource.error) {
      throw new Error(resource.error.message);
    }

    if (!resource.data?.file_path) {
      return NextResponse.json(
        { success: false, error: "The resource could not be found." },
        { status: 404 },
      );
    }

    const signed = await access.admin.storage
      .from(bucketFor(sourceTable))
      .createSignedUrl(resource.data.file_path, 60);

    if (signed.error || !signed.data?.signedUrl) {
      throw new Error(
        signed.error?.message || "A secure resource link could not be created.",
      );
    }

    return NextResponse.redirect(signed.data.signedUrl);
  } catch (error) {
    console.error("Secure HR resource open failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The resource could not be opened.",
      },
      { status: 500 },
    );
  }
}
