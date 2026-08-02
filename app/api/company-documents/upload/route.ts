import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UploadDetails = {
  name?: unknown;
  originalFileName?: unknown;
};

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

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(request: Request) {
  const uploadedPaths: string[] = [];

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      );
    }

    const resolvedRole = await resolveAuthoritativeUserRole(
      supabase as any,
      {
        userId: user.id,
        allowedStatuses: ["active"],
      },
    );

    if (!resolvedRole) {
      return NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      );
    }

    if (!["owner", "senior"].includes(resolvedRole.roleKey)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only an Owner or Senior user can upload or replace company documents.",
        },
        { status: 403 },
      );
    }

    const organisationId =
      resolvedRole.membership.organisation_id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Supabase service-role environment variables are unavailable.",
      );
    }

    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const formData = await request.formData();
    const action = text(formData.get("action"));

    if (action === "replace") {
      const documentId = text(formData.get("documentId"));
      const replacementFile = formData.get("file");

      if (!documentId) {
        return NextResponse.json(
          { success: false, error: "The document reference is missing." },
          { status: 400 },
        );
      }

      if (!(replacementFile instanceof File)) {
        return NextResponse.json(
          { success: false, error: "Choose a replacement document." },
          { status: 400 },
        );
      }

      const fileExtension = extension(replacementFile.name);
      if (!["doc", "docx", "pdf"].includes(fileExtension)) {
        return NextResponse.json(
          {
            success: false,
            error: `${replacementFile.name} is not a supported Word or PDF document.`,
          },
          { status: 400 },
        );
      }

      const { data: current, error: currentError } = await admin
        .from("company_documents")
        .select(
          "id, organisation_id, name, notes, document_type, document_group_id, version_number, status",
        )
        .eq("id", documentId)
        .eq("organisation_id", organisationId)
        .maybeSingle();

      if (currentError || !current) {
        return NextResponse.json(
          { success: false, error: "The document could not be found." },
          { status: 404 },
        );
      }

      const currentFolder = text(current.document_type);
      if (!allowedFolders.has(currentFolder)) {
        return NextResponse.json(
          { success: false, error: "The document folder is invalid." },
          { status: 400 },
        );
      }

      const folderSlug = currentFolder
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const path =
        `${organisationId}/${folderSlug}/` +
        `${Date.now()}-${crypto.randomUUID()}-${safeFileName(replacementFile.name)}`;

      const bytes = Buffer.from(await replacementFile.arrayBuffer());
      const uploadResult = await admin.storage
        .from("company-documents")
        .upload(path, bytes, {
          contentType: replacementFile.type || undefined,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult.error) {
        throw new Error(
          uploadResult.error.message ||
            "The replacement document could not be uploaded.",
        );
      }

      uploadedPaths.push(path);

      const groupId = current.document_group_id || crypto.randomUUID();
      const currentVersion = current.version_number || 1;

      const { data: replacement, error: replacementError } = await admin
        .from("company_documents")
        .insert({
          organisation_id: organisationId,
          name: current.name,
          notes: current.notes,
          document_type: currentFolder,
          file_name: replacementFile.name,
          file_path: path,
          file_url: null,
          status: "active",
          document_group_id: groupId,
          version_number: currentVersion + 1,
          previous_version_id: current.id,
        })
        .select("id")
        .single();

      if (replacementError || !replacement) {
        throw new Error(
          replacementError?.message ||
            "The replacement document record could not be created.",
        );
      }

      const { error: archiveError } = await admin
        .from("company_documents")
        .update({
          status: "archived",
          archived_at: new Date().toISOString(),
          document_group_id: groupId,
          version_number: currentVersion,
          replaced_by_id: replacement.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id)
        .eq("organisation_id", organisationId);

      if (archiveError) {
        await admin
          .from("company_documents")
          .delete()
          .eq("id", replacement.id)
          .eq("organisation_id", organisationId);
        throw new Error(
          "The existing document could not be archived, so no replacement was made.",
        );
      }

      uploadedPaths.length = 0;

      return NextResponse.json({
        success: true,
        replaced: true,
        documentId: replacement.id,
      });
    }

    const folder = text(formData.get("folder"));
    const notes = text(formData.get("notes")) || null;
    const rawDocuments = text(formData.get("documents"));
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (!allowedFolders.has(folder)) {
      return NextResponse.json(
        { success: false, error: "The document folder is invalid." },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Choose at least one document." },
        { status: 400 },
      );
    }

    let details: UploadDetails[] = [];

    try {
      details = JSON.parse(rawDocuments);
    } catch {
      return NextResponse.json(
        { success: false, error: "The document details are invalid." },
        { status: 400 },
      );
    }

    if (!Array.isArray(details) || details.length !== files.length) {
      return NextResponse.json(
        { success: false, error: "The document details do not match the files." },
        { status: 400 },
      );
    }

    const rows: Record<string, unknown>[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const name = text(details[index]?.name);
      const fileExtension = extension(file.name);

      if (!name) {
        throw new Error(`A document name is missing for ${file.name}.`);
      }

      if (!["doc", "docx", "pdf"].includes(fileExtension)) {
        throw new Error(`${file.name} is not a supported Word or PDF document.`);
      }

      const folderSlug = folder
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const path =
        `${organisationId}/${folderSlug}/` +
        `${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;

      const bytes = Buffer.from(await file.arrayBuffer());

      const uploadResult = await admin.storage
        .from("company-documents")
        .upload(path, bytes, {
          contentType: file.type || undefined,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult.error) {
        throw new Error(
          uploadResult.error.message ||
            `${file.name} could not be uploaded.`,
        );
      }

      uploadedPaths.push(path);


      rows.push({
        organisation_id: organisationId,
        name,
        notes,
        document_type: folder,
        file_name: file.name,
        file_path: path,
        file_url: null,
        status: "active",
        version_number: 1,
      });
    }

    const insertResult = await admin
      .from("company_documents")
      .insert(rows);

    if (insertResult.error) {
      throw new Error(
        insertResult.error.message ||
          "The company document records could not be saved.",
      );
    }

    return NextResponse.json({
      success: true,
      uploaded: rows.length,
    });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey) {
        const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        await admin.storage.from("company-documents").remove(uploadedPaths);
      }
    }

    console.error("Company document upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The company documents could not be uploaded.",
      },
      { status: 500 },
    );
  }
}