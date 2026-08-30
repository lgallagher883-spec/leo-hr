// Leo HR employee driving self-service API.
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type DatabaseRecord = Record<string, unknown>;

const uploadTypes = new Map([
  ["Driving licence", "Driving"],
  ["Insurance", "Insurance"],
  ["MOT", "Driving"],
  ["Other driving document", "Driving"],
]);

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

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
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
    .select("membership_status")
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

  const { data: link, error: linkError } = await supabase
    .from("employee_user_links")
    .select("employee_id")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .eq("link_status", "active")
    .maybeSingle();

  if (linkError) throw new Error(linkError.message);

  if (!link?.employee_id) {
    return { ok: true as const, context: null };
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
    return { ok: true as const, context: null };
  }

  return {
    ok: true as const,
    context: {
      organisationId,
      employeeId: employee.data.id as number,
      employeeName: employee.data.name || "Employee",
      user,
    },
  };
}

async function readDriving(employeeId: number) {
  const admin = getAdminClient();

  const record = await admin
    .from("employee_driving_checks")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (record.error) throw new Error(record.error.message);

  const documents = await admin
    .from("employee_documents")
    .select("id,title,document_type,file_name,file_path,file_type,notes,created_at")
    .eq("employee_id", employeeId)
    .in("document_type", ["Driving", "Insurance"])
    .order("created_at", { ascending: false });

  if (documents.error) throw new Error(documents.error.message);

  return {
    driving: (record.data ?? null) as DatabaseRecord | null,
    documents: documents.data ?? [],
  };
}

export async function GET(request: Request) {
  try {
    const resolved = await resolveEmployee();

    if (!resolved.ok) return resolved.response;

    if (!resolved.context) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        driving: null,
        documents: [],
      });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const documentId = url.searchParams.get("documentId");

    if (action === "open" && documentId) {
      const admin = getAdminClient();

      const document = await admin
        .from("employee_documents")
        .select("id,employee_id,document_type,file_path,file_name")
        .eq("id", documentId)
        .eq("employee_id", resolved.context.employeeId)
        .in("document_type", ["Driving", "Insurance"])
        .maybeSingle();

      if (document.error) throw new Error(document.error.message);

      if (!document.data) {
        return NextResponse.json(
          { success: false, error: "The document could not be found." },
          { status: 404 },
        );
      }

      const signed = await admin.storage
        .from("employee-documents")
        .createSignedUrl(document.data.file_path, 60);

      if (signed.error || !signed.data?.signedUrl) {
        throw new Error(signed.error?.message || "The document could not be opened.");
      }

      return NextResponse.json({
        success: true,
        signedUrl: signed.data.signedUrl,
        fileName: document.data.file_name,
      });
    }

    const data = await readDriving(resolved.context.employeeId);

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      ...data,
    });
  } catch (error) {
    console.error("Leo HR driving API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your driving information could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const resolved = await resolveEmployee();

    if (!resolved.ok) return resolved.response;

    if (!resolved.context) {
      return NextResponse.json(
        { success: false, error: "Your account is not linked to an employee record." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const uploadType =
      typeof formData.get("uploadType") === "string"
        ? String(formData.get("uploadType"))
        : "";

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { success: false, error: "Choose a document to upload." },
        { status: 400 },
      );
    }

    const storedType = uploadTypes.get(uploadType);

    if (!storedType) {
      return NextResponse.json(
        { success: false, error: "Choose a valid driving document type." },
        { status: 400 },
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "The selected file is larger than 25 MB." },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const now = new Date().toISOString();
    const filePath = `${resolved.context.employeeId}/${Date.now()}-${safeFileName(file.name)}`;
    const title = `${uploadType} - ${file.name}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const upload = await admin.storage
      .from("employee-documents")
      .upload(filePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upload.error) throw new Error(upload.error.message);

    const document = await admin
      .from("employee_documents")
      .insert({
        employee_id: resolved.context.employeeId,
        title,
        document_type: storedType,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || null,
        notes: `Uploaded by employee · ${uploadType}`,
        updated_at: now,
      })
      .select("id,title,document_type,file_name,file_path,file_type,notes,created_at")
      .single();

    if (document.error || !document.data) {
      await admin.storage.from("employee-documents").remove([filePath]);
      throw new Error(document.error?.message || "The document could not be saved.");
    }

    const timeline = await admin.from("employee_timeline").insert({
      employee_id: resolved.context.employeeId,
      event_type: "Document Uploaded",
      title: `${uploadType} uploaded`,
      description: `${uploadType} was uploaded through employee self-service.`,
      status: "Completed",
      source_module: "Employee self-service",
      source_record_id: String(document.data.id),
      metadata: {
        employee_document_id: document.data.id,
        document_type: storedType,
        upload_type: uploadType,
        file_name: file.name,
      },
      event_date: now,
      created_by: resolved.context.user.id,
      created_at: now,
    });

    if (timeline.error) {
      console.warn("Driving document timeline event could not be written:", timeline.error);
    }

    return NextResponse.json(
      { success: true, document: document.data },
      { status: 201 },
    );
  } catch (error) {
    console.error("Leo HR driving document upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "The document could not be uploaded.",
      },
      { status: 500 },
    );
  }
}
