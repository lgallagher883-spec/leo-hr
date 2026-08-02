import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedFolders = new Set([
  "Policy",
  "Procedure",
  "Employee Handbook",
  "Contract",
  "Offer Letter",
  "Company Form",
  "Risk Assessment",
  "Health & Safety",
  "Template",
  "Other Document",
]);

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

async function requireManagerAccess() {
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

  if (!["owner", "senior"].includes(resolvedRole.roleKey)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Only an Owner or Senior user can change company documents.",
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

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireManagerAccess();

    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanText(body.action, 40);

    const currentResult = await access.admin
      .from("company_documents")
      .select("id, organisation_id")
      .eq("id", id)
      .eq("organisation_id", access.organisationId)
      .maybeSingle();

    if (currentResult.error || !currentResult.data) {
      return NextResponse.json(
        { success: false, error: "The document could not be found." },
        { status: 404 },
      );
    }

    const changes: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === "rename") {
      const name = cleanText(body.name, 180);

      if (!name) {
        return NextResponse.json(
          { success: false, error: "Enter a document name." },
          { status: 400 },
        );
      }

      changes.name = name;
    } else if (action === "edit") {
      const name = cleanText(body.name, 180);

      if (!name) {
        return NextResponse.json(
          { success: false, error: "Enter a document name." },
          { status: 400 },
        );
      }

      changes.name = name;
      changes.notes = cleanText(body.notes, 600) || null;
    } else if (action === "move") {
      const folder = cleanText(body.folder, 80);

      if (!allowedFolders.has(folder)) {
        return NextResponse.json(
          { success: false, error: "The document folder is invalid." },
          { status: 400 },
        );
      }

      changes.document_type = folder;
    } else if (action === "archive") {
      changes.status = "archived";
      changes.archived_at = new Date().toISOString();
    } else {
      return NextResponse.json(
        { success: false, error: "The document action is invalid." },
        { status: 400 },
      );
    }

    const updateResult = await access.admin
      .from("company_documents")
      .update(changes)
      .eq("id", id)
      .eq("organisation_id", access.organisationId);

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company document update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be updated.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireManagerAccess();

    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;

    const documentResult = await access.admin
      .from("company_documents")
      .select("id, file_path")
      .eq("id", id)
      .eq("organisation_id", access.organisationId)
      .maybeSingle();

    if (documentResult.error || !documentResult.data) {
      return NextResponse.json(
        { success: false, error: "The document could not be found." },
        { status: 404 },
      );
    }

    if (documentResult.data.file_path) {
      const storageResult = await access.admin.storage
        .from("company-documents")
        .remove([documentResult.data.file_path]);

      if (storageResult.error) {
        throw new Error(storageResult.error.message);
      }
    }

    const deleteResult = await access.admin
      .from("company_documents")
      .delete()
      .eq("id", id)
      .eq("organisation_id", access.organisationId);

    if (deleteResult.error) {
      throw new Error(deleteResult.error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company document deletion failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be deleted.",
      },
      { status: 500 },
    );
  }
}