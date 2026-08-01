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

function readEmployeeId(value: string): number | null {
  const employeeId = Number(value);

  return Number.isInteger(employeeId) && employeeId > 0
    ? employeeId
    : null;
}

function safeFileName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

  return cleaned || "document";
}

function readOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
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
              "You do not have permission to perform this employee document action.",
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
  employeeId: number,
) {
  const result = await supabase
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
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const employeeId = readEmployeeId(id);

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

    const { organisationId } = accessResult.access;
    const employee = await verifyEmployee(
      supabase,
      organisationId,
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

    const documentId = request.nextUrl.searchParams.get("documentId");
    const action = request.nextUrl.searchParams.get("action");

    if (documentId && action === "open") {
      const admin = getAdminClient();

      const documentResult = await admin
        .from("employee_documents")
        .select(
          "id,employee_id,file_path,file_name",
        )
        .eq("id", documentId)
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (documentResult.error) {
        throw new Error(documentResult.error.message);
      }

      if (!documentResult.data) {
        return NextResponse.json(
          {
            success: false,
            error: "The document could not be found or accessed.",
          },
          { status: 404 },
        );
      }

      const signedUrlResult = await admin.storage
        .from("employee-documents")
        .createSignedUrl(documentResult.data.file_path, 60);

      if (
        signedUrlResult.error ||
        !signedUrlResult.data?.signedUrl
      ) {
        throw new Error(
          signedUrlResult.error?.message ||
            "The document could not be opened.",
        );
      }

      return NextResponse.json({
        success: true,
        signedUrl: signedUrlResult.data.signedUrl,
        fileName: documentResult.data.file_name,
      });
    }

    const admin = getAdminClient();

    const documentsResult = await admin
      .from("employee_documents")
      .select(
        "id,title,document_type,file_name,file_path,file_type,notes,created_at",
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (documentsResult.error) {
      throw new Error(documentsResult.error.message);
    }

    return NextResponse.json(
      {
        success: true,
        documents: documentsResult.data ?? [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Employee documents API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Employee documents could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const employeeId = readEmployeeId(id);

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
      ["employees.create"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const { organisationId } = accessResult.access;
    const employee = await verifyEmployee(
      supabase,
      organisationId,
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

    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Choose a file to upload.",
        },
        { status: 400 },
      );
    }

    if (fileValue.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected file is empty.",
        },
        { status: 400 },
      );
    }

    if (fileValue.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected file is larger than 25 MB.",
        },
        { status: 400 },
      );
    }

    const title =
      readOptionalString(formData.get("title")) ||
      fileValue.name;
    const documentType =
      readOptionalString(formData.get("documentType")) ||
      "Other";
    const notes = readOptionalString(formData.get("notes"));
    const now = new Date().toISOString();
    const filePath = `${employeeId}/${Date.now()}-${safeFileName(
      fileValue.name,
    )}`;

    const admin = getAdminClient();
    const fileBytes = new Uint8Array(await fileValue.arrayBuffer());

    const uploadResult = await admin.storage
      .from("employee-documents")
      .upload(filePath, fileBytes, {
        contentType:
          fileValue.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    const documentResult = await admin
      .from("employee_documents")
      .insert({
        employee_id: employeeId,
        title,
        document_type: documentType,
        file_name: fileValue.name,
        file_path: filePath,
        file_type: fileValue.type || null,
        notes,
        updated_at: now,
      })
      .select(
        "id,title,document_type,file_name,file_path,file_type,notes,created_at",
      )
      .single();

    if (documentResult.error || !documentResult.data) {
      await admin.storage
        .from("employee-documents")
        .remove([filePath]);

      throw new Error(
        documentResult.error?.message ||
          "The document record could not be saved.",
      );
    }

    const timelineResult = await admin
      .from("employee_timeline")
      .insert({
        employee_id: employeeId,
        event_type: "Document Uploaded",
        title: "Employee document uploaded",
        description: `${title} was added to the employee document record.`,
        status: "Completed",
        source_module: "Employees",
        source_record_id: String(documentResult.data.id),
        metadata: {
          employee_document_id: documentResult.data.id,
          document_type: documentType,
          file_name: fileValue.name,
          file_path: filePath,
        },
        event_date: now,
        created_by: user.id,
        created_at: now,
      });

    if (timelineResult.error) {
      console.warn(
        "Employee document timeline event could not be created:",
        timelineResult.error,
      );
    }

    const auditResult = await admin
      .from("audit_logs")
      .insert({
        organisation_id: organisationId,
        user_id: user.id,
        user_name:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : user.email || "System user",
        user_email: user.email || null,
        action: "Employee document uploaded",
        action_category: "Document",
        entity_type: "Employee",
        entity_id: String(employeeId),
        entity_name: employee.name,
        description: `${title} was uploaded to ${employee.name}'s employee record.`,
        new_values: {
          document_id: documentResult.data.id,
          document_type: documentType,
          file_name: fileValue.name,
        },
        metadata: {
          source_module: "Employees",
          file_path: filePath,
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
        "Employee document audit event could not be created:",
        auditResult.error,
      );
    }

    return NextResponse.json(
      {
        success: true,
        document: documentResult.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Employee document upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The employee document could not be uploaded.",
      },
      { status: 500 },
    );
  }
}