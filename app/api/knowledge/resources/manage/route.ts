import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ResourceAction =
  | "prepare"
  | "replace"
  | "archive"
  | "restore"
  | "delete";

type SourceTable =
  | "policy_register"
  | "company_documents";

type ManageResourceRequest = {
  action: ResourceAction;

  sourceTable: SourceTable;
  sourceRecordId: number;

  organisationId?: string;

  fileName?: string | null;
  fileUrl?: string | null;
  filePath?: string | null;

  newFileName?: string | null;
  newFileUrl?: string | null;
  newFilePath?: string | null;

  documentId?: string | null;
};

type PolicyRegisterRecord = {
  id: number;
  name: string;
  register_type: string;
  category: string | null;
  next_review_date: string | null;
  responsible_person: string | null;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  version_number: number;
  updated_at: string | null;
};

type CompanyDocumentRecord = {
  id: number;
  name: string;
  document_type: string | null;
  category: string | null;
  responsible_person: string | null;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  version_number: number;
  updated_at: string | null;
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

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as Partial<ManageResourceRequest>;

    const action = body.action;
    const sourceTable = body.sourceTable;
    const sourceRecordId =
      body.sourceRecordId;

    const organisationId =
  body.organisationId?.trim() ||
  "00000000-0000-0000-0000-000000000000";

    if (
      action !== "prepare" &&
      action !== "replace" &&
      action !== "archive" &&
      action !== "restore" &&
      action !== "delete"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid resource action is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      sourceTable !== "policy_register" &&
      sourceTable !== "company_documents"
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
      typeof sourceRecordId !== "number" ||
      !Number.isFinite(sourceRecordId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid source record ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      createServerSupabaseClient();

    const documentId =
      body.documentId?.trim() ||
      buildDocumentId(
        sourceTable,
        sourceRecordId
      );

    if (action === "prepare") {
      return prepareResource({
        organisationId,
        sourceTable,
        sourceRecordId,
        documentId,
        fileName:
          body.fileName || null,
        fileUrl:
          body.fileUrl || null,
      });
    }

    if (action === "replace") {
      return replaceResource({
        supabase,
        organisationId,
        sourceTable,
        sourceRecordId,
        documentId,
        newFileName:
          body.newFileName || null,
        newFilePath:
          body.newFilePath || null,
        newFileUrl:
          body.newFileUrl || null,
      });
    }

    if (action === "archive") {
      return archiveResource({
        supabase,
        sourceTable,
        sourceRecordId,
        documentId,
      });
    }

    if (action === "restore") {
      return restoreResource({
        supabase,
        sourceTable,
        sourceRecordId,
        documentId,
      });
    }

    return deleteResource({
      supabase,
      sourceTable,
      sourceRecordId,
      documentId,
      filePath:
        body.filePath || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown resource management error.",
      },
      {
        status: 500,
      }
    );
  }
}

async function prepareResource({
  organisationId,
  sourceTable,
  sourceRecordId,
  documentId,
  fileName,
  fileUrl,
}: {
  organisationId: string;
  sourceTable: SourceTable;
  sourceRecordId: number;
  documentId: string;
  fileName: string | null;
  fileUrl: string | null;
}) {
  if (!fileName) {
    return NextResponse.json(
      {
        success: false,
        error:
          "The resource does not have a filename.",
      },
      {
        status: 400,
      }
    );
  }

  if (!fileUrl) {
    return NextResponse.json(
      {
        success: false,
        error:
          "The resource does not have an accessible file URL.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !fileName
      .toLowerCase()
      .endsWith(".docx")
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Automatic preparation currently supports DOCX files.",
      },
      {
        status: 400,
      }
    );
  }

  const processResult =
    await processResourceKnowledge({
      organisationId,
      sourceTable,
      sourceRecordId,
      documentId,
      fileName,
      fileUrl,
    });

  if (!processResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: processResult.error,
      },
      {
        status: processResult.status,
      }
    );
  }

  return NextResponse.json({
    success: true,
    action: "prepare",
    message:
      "The resource is ready for Leo.",
    storedChunkCount:
      processResult.storedChunkCount,
  });
}

async function replaceResource({
  supabase,
  organisationId,
  sourceTable,
  sourceRecordId,
  documentId,
  newFileName,
  newFilePath,
  newFileUrl,
}: {
  supabase: ReturnType<
    typeof createServerSupabaseClient
  >;

  organisationId: string;
  sourceTable: SourceTable;
  sourceRecordId: number;
  documentId: string;

  newFileName: string | null;
  newFilePath: string | null;
  newFileUrl: string | null;
}) {
  if (
    !newFileName ||
    !newFilePath ||
    !newFileUrl
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "The replacement file details are incomplete.",
      },
      {
        status: 400,
      }
    );
  }

  const currentResource =
    await loadCurrentResource({
      supabase,
      sourceTable,
      sourceRecordId,
    });

  if (!currentResource.success) {
    return NextResponse.json(
      {
        success: false,
        error: currentResource.error,
      },
      {
        status: 404,
      }
    );
  }

  const resource =
    currentResource.resource;

  const currentVersion =
    Number(resource.version_number) || 1;

  const nextVersion =
    currentVersion + 1;

  const versionRow =
    sourceTable === "policy_register"
      ? buildPolicyVersionRow(
          resource as PolicyRegisterRecord,
          sourceTable,
          sourceRecordId,
          currentVersion
        )
      : buildDocumentVersionRow(
          resource as CompanyDocumentRecord,
          sourceTable,
          sourceRecordId,
          currentVersion
        );

  const {
  error: versionError,
} = await supabase
  .from("hr_resource_versions")
  .insert(
    versionRow as Record<string, unknown>
  );

  if (versionError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The current version could not be preserved: ${versionError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  const updatedAt =
    new Date().toISOString();

  const {
    error: updateError,
  } = await supabase
    .from(sourceTable)
    .update({
      file_name: newFileName,
      file_path: newFilePath,
      file_url: newFileUrl,
      version_number: nextVersion,
      updated_at: updatedAt,
    })
    .eq("id", sourceRecordId);

  if (updateError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The replacement resource could not be activated: ${updateError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  let storedChunkCount = 0;
  let knowledgePrepared = false;
  let knowledgeWarning: string | null =
    null;

  if (
    newFileName
      .toLowerCase()
      .endsWith(".docx")
  ) {
    const processResult =
      await processResourceKnowledge({
        organisationId,
        sourceTable,
        sourceRecordId,
        documentId,
        fileName: newFileName,
        fileUrl: newFileUrl,
      });

    if (processResult.success) {
      storedChunkCount =
        processResult.storedChunkCount;

      knowledgePrepared = true;
    } else {
      knowledgeWarning =
        processResult.error;
    }
  } else {
    const { error: deactivateError } =
      await supabase
        .from("knowledge_chunks")
        .update({
          is_active: false,
        })
        .eq("document_id", documentId);

    if (deactivateError) {
      knowledgeWarning =
        `The new version was saved, but the previous active knowledge could not be deactivated: ${deactivateError.message}`;
    } else {
      knowledgeWarning =
        "The new version is stored. Automatic knowledge preparation currently supports DOCX files.";
    }
  }

  return NextResponse.json({
    success: true,
    action: "replace",

    message:
      knowledgePrepared
        ? `Version ${nextVersion} is now active and ready for Leo.`
        : `Version ${nextVersion} is now active.`,

    previousVersion:
      currentVersion,

    currentVersion:
      nextVersion,

    storedChunkCount,

    knowledgePrepared,

    warning:
      knowledgeWarning,
  });
}

async function archiveResource({
  supabase,
  sourceTable,
  sourceRecordId,
  documentId,
}: {
  supabase: ReturnType<
    typeof createServerSupabaseClient
  >;

  sourceTable: SourceTable;
  sourceRecordId: number;
  documentId: string;
}) {
  const archivedAt =
    new Date().toISOString();

  const {
    error: recordError,
  } = await supabase
    .from(sourceTable)
    .update({
      is_archived: true,
      archived_at: archivedAt,
    })
    .eq("id", sourceRecordId);

  if (recordError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The resource could not be archived: ${recordError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  const {
    error: chunksError,
  } = await supabase
    .from("knowledge_chunks")
    .update({
      is_active: false,
    })
    .eq("document_id", documentId);

  if (chunksError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The resource was archived, but Leo's active knowledge could not be updated: ${chunksError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    success: true,
    action: "archive",
    message:
      "The resource has been archived and removed from Leo's active knowledge.",
  });
}

async function restoreResource({
  supabase,
  sourceTable,
  sourceRecordId,
  documentId,
}: {
  supabase: ReturnType<
    typeof createServerSupabaseClient
  >;

  sourceTable: SourceTable;
  sourceRecordId: number;
  documentId: string;
}) {
  const {
    error: recordError,
  } = await supabase
    .from(sourceTable)
    .update({
      is_archived: false,
      archived_at: null,
    })
    .eq("id", sourceRecordId);

  if (recordError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The resource could not be restored: ${recordError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  const {
    error: chunksError,
  } = await supabase
    .from("knowledge_chunks")
    .update({
      is_active: true,
    })
    .eq("document_id", documentId);

  if (chunksError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The resource was restored, but Leo's active knowledge could not be updated: ${chunksError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    success: true,
    action: "restore",
    message:
      "The resource has been restored and is available to Leo again.",
  });
}

async function deleteResource({
  supabase,
  sourceTable,
  sourceRecordId,
  documentId,
  filePath,
}: {
  supabase: ReturnType<
    typeof createServerSupabaseClient
  >;

  sourceTable: SourceTable;
  sourceRecordId: number;
  documentId: string;
  filePath: string | null;
}) {
  const {
    error: chunksError,
  } = await supabase
    .from("knowledge_chunks")
    .delete()
    .eq("document_id", documentId);

  if (chunksError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The resource knowledge could not be removed: ${chunksError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  const {
    error: versionsError,
  } = await supabase
    .from("hr_resource_versions")
    .delete()
    .eq("source_table", sourceTable)
    .eq(
      "source_record_id",
      sourceRecordId
    );

  if (versionsError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The resource version history could not be removed: ${versionsError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  if (filePath) {
    const bucket =
      sourceTable === "policy_register"
        ? "policy-documents"
        : "company-documents";

    const {
      error: storageError,
    } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (storageError) {
      return NextResponse.json(
        {
          success: false,
          error:
            `The stored file could not be removed: ${storageError.message}`,
        },
        {
          status: 500,
        }
      );
    }
  }

  const {
    error: recordError,
  } = await supabase
    .from(sourceTable)
    .delete()
    .eq("id", sourceRecordId);

  if (recordError) {
    return NextResponse.json(
      {
        success: false,
        error:
          `The resource record could not be deleted: ${recordError.message}`,
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    success: true,
    action: "delete",
    message:
      "The resource has been permanently deleted.",
  });
}

async function loadCurrentResource({
  supabase,
  sourceTable,
  sourceRecordId,
}: {
  supabase: ReturnType<
    typeof createServerSupabaseClient
  >;

  sourceTable: SourceTable;
  sourceRecordId: number;
}): Promise<
  | {
      success: true;
      resource:
        | PolicyRegisterRecord
        | CompanyDocumentRecord;
    }
  | {
      success: false;
      error: string;
    }
> {
  const fields =
    sourceTable === "policy_register"
      ? `
          id,
          name,
          register_type,
          category,
          next_review_date,
          responsible_person,
          notes,
          file_name,
          file_path,
          file_url,
          version_number,
          updated_at
        `
      : `
          id,
          name,
          document_type,
          category,
          responsible_person,
          notes,
          file_name,
          file_path,
          file_url,
          version_number,
          updated_at
        `;

  const {
    data,
    error,
  } = await supabase
    .from(sourceTable)
    .select(fields)
    .eq("id", sourceRecordId)
    .single();

  if (error || !data) {
    return {
      success: false,
      error:
        error?.message ||
        "The resource could not be found.",
    };
  }

  return {
    success: true,
    resource:
      data as unknown as
        | PolicyRegisterRecord
        | CompanyDocumentRecord,
  };
}

function buildPolicyVersionRow(
  resource: PolicyRegisterRecord,
  sourceTable: SourceTable,
  sourceRecordId: number,
  versionNumber: number
) {
  return {
    source_table: sourceTable,
    source_record_id:
      sourceRecordId,

    version_number:
      versionNumber,

    resource_name:
      resource.name,

    resource_type:
      resource.register_type,

    category:
      resource.category,

    responsible_person:
      resource.responsible_person,

    review_date:
      resource.next_review_date,

    notes:
      resource.notes,

    file_name:
      resource.file_name,

    file_path:
      resource.file_path,

    file_url:
      resource.file_url,
  };
}

function buildDocumentVersionRow(
  resource: CompanyDocumentRecord,
  sourceTable: SourceTable,
  sourceRecordId: number,
  versionNumber: number
) {
  return {
    source_table: sourceTable,
    source_record_id:
      sourceRecordId,

    version_number:
      versionNumber,

    resource_name:
      resource.name,

    resource_type:
      resource.document_type,

    category:
      resource.category,

    responsible_person:
      resource.responsible_person,

    review_date: null,

    notes:
      resource.notes,

    file_name:
      resource.file_name,

    file_path:
      resource.file_path,

    file_url:
      resource.file_url,
  };
}

async function processResourceKnowledge({
  organisationId,
  sourceTable,
  sourceRecordId,
  documentId,
  fileName,
  fileUrl,
}: {
  organisationId: string;
  sourceTable: SourceTable;
  sourceRecordId: number;
  documentId: string;
  fileName: string;
  fileUrl: string;
}): Promise<
  | {
      success: true;
      storedChunkCount: number;
    }
  | {
      success: false;
      status: number;
      error: string;
    }
> {
  const processResponse =
    await fetch(
      new URL(
        "/api/knowledge/process",
        getBaseUrl()
      ),
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          documentId,
          organisationId,
          fileName,
          fileUrl,
          sourceTable,
          sourceRecordId,
        }),
      }
    );

  const result =
    await processResponse.json();

  if (
    !processResponse.ok ||
    !result.success
  ) {
    return {
      success: false,
      status:
        processResponse.status || 500,
      error:
        result.error ||
        "Leo could not prepare this resource.",
    };
  }

  return {
    success: true,
    storedChunkCount:
      result.storedChunkCount || 0,
  };
}

function buildDocumentId(
  sourceTable: SourceTable,
  sourceRecordId: number
) {
  if (
    sourceTable === "policy_register"
  ) {
    return `policy-register-${sourceRecordId}`;
  }

  return `company-document-${sourceRecordId}`;
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}