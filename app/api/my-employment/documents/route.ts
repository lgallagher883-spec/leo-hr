import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type DocumentRecord = Record<string, unknown>;

const missingRelationCodes = new Set([
  "42P01",
  "PGRST200",
  "PGRST204",
  "PGRST205",
]);


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

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
  };

  if (candidate.code && missingRelationCodes.has(candidate.code)) {
    return true;
  }

  const message = candidate.message?.toLowerCase() ?? "";

  return (
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  );
}

async function loadDocumentsFromTable(
  supabase: any,
  tableName: string,
  employeeId: number,
) {
  const result = await supabase
    .from(tableName)
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (result.error) {
    if (isMissingRelationError(result.error)) {
      return {
        available: false,
        documents: [] as DocumentRecord[],
      };
    }

    throw result.error;
  }

  return {
    available: true,
    documents: (result.data ?? []) as DocumentRecord[],
  };
}

function normaliseText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = value.trim();
  return parsed || null;
}

function isMedicalDocument(record: Record<string, unknown>) {
  const type =
    normaliseText(record.document_type)?.toLowerCase() ?? "";
  const title =
    normaliseText(record.title)?.toLowerCase() ??
    normaliseText(record.file_name)?.toLowerCase() ??
    "";

  const haystack = `${type} ${title}`;

  return (
    haystack.includes("medical") ||
    haystack.includes("health") ||
    haystack.includes("fit note") ||
    haystack.includes("occupational")
  );
}

function isSensitiveRecruitmentDocument(record: Record<string, unknown>) {
  const type =
    normaliseText(record.document_type)?.toLowerCase() ?? "";
  const title =
    normaliseText(record.title)?.toLowerCase() ??
    normaliseText(record.file_name)?.toLowerCase() ??
    "";

  const haystack = `${type} ${title}`;

  return (
    haystack.includes("right to work") ||
    haystack.includes("passport") ||
    haystack.includes("visa") ||
    haystack.includes("dbs") ||
    haystack.includes("safeguard") ||
    haystack.includes("driving") ||
    haystack.includes("licence") ||
    haystack.includes("qualification") ||
    haystack.includes("certificate") ||
    haystack.includes("registration")
  );
}

async function loadLinkedRecruitmentDocuments(
  supabase: any,
  employeeId: number,
  organisationId: string,
) {
  const candidatesResult = await (supabase as any)
    .from("leo_talent_candidates")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("existing_employee_id", employeeId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (candidatesResult.error) {
    throw candidatesResult.error;
  }

  const candidateIds = (Array.isArray(candidatesResult.data)
    ? candidatesResult.data
    : [])
    .map((item: unknown) =>
      normaliseText((item as { id?: unknown }).id),
    )
    .filter((item: string | null): item is string => Boolean(item));

  if (candidateIds.length === 0) {
    return [] as DocumentRecord[];
  }

  const documentsResult = await (supabase as any)
    .from("leo_talent_candidate_documents")
    .select("*")
    .eq("organisation_id", organisationId)
    .in("candidate_id", candidateIds)
    .order("created_at", { ascending: false });

  if (documentsResult.error) {
    throw documentsResult.error;
  }

  return (Array.isArray(documentsResult.data) ? documentsResult.data : [])
    .filter(
      (item: unknown) =>
        !isMedicalDocument(item as Record<string, unknown>),
    )
    .filter(
      (item: unknown) =>
        !isSensitiveRecruitmentDocument(item as Record<string, unknown>),
    )
    .map((item: unknown) => {
      const row = item as Record<string, unknown>;

      return {
        ...row,
        source_module: "Talent",
        source_table: "leo_talent_candidate_documents",
        source_record_id: row.id,
        recruitment_source: true,
        visible_to_employee: true,
        deletion_locked: true,
        permanent_recruitment_record: true,
      };
    }) as DocumentRecord[];
}

export async function GET(request: Request) {
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
          error: "Your signed-in account could not be confirmed.",
        },
        { status: 401 },
      );
    }

    const canonicalResult = await resolveCanonicalEmployee(
      supabase,
      user.id,
    );

    if (!canonicalResult.ok) {
      return canonicalResult.response;
    }

    if (!canonicalResult.context) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        documents: [],
      });
    }

    const { employeeId, organisationId } = canonicalResult.context;

    const requestUrl = new URL(request.url);
    const documentId = requestUrl.searchParams.get("documentId");
    const action = requestUrl.searchParams.get("action");

    if (documentId && action === "open") {
      const admin = getAdminClient();
      const requestedSource =
        requestUrl.searchParams.get("sourceTable") ||
        "employee_documents";

      if (requestedSource === "leo_talent_candidate_documents") {
        const candidatesResult = await admin
          .from("leo_talent_candidates")
          .select("id")
          .eq("organisation_id", organisationId)
          .eq("existing_employee_id", employeeId)
          .is("archived_at", null);

        if (candidatesResult.error) {
          throw new Error(candidatesResult.error.message);
        }

        const candidateIds = (candidatesResult.data ?? [])
          .map((candidate) => candidate.id)
          .filter((candidateId): candidateId is string =>
            typeof candidateId === "string" && Boolean(candidateId),
          );

        if (candidateIds.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "The document could not be found or accessed.",
            },
            { status: 404 },
          );
        }

        const documentResult = await admin
          .from("leo_talent_candidate_documents")
          .select("id,candidate_id,file_path,file_name")
          .eq("id", documentId)
          .eq("organisation_id", organisationId)
          .in("candidate_id", candidateIds)
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
          .from("leo-talent-candidate-documents")
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

      if (requestedSource !== "employee_documents") {
        return NextResponse.json(
          {
            success: false,
            error: "This document source cannot be opened here.",
          },
          { status: 400 },
        );
      }

      const documentResult = await admin
        .from("employee_documents")
        .select("id,employee_id,file_path,file_name")
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

    const possibleTables = [
      "employee_documents",
      "leo_employee_documents",
      "employee_document_records",
    ];

    let documents: DocumentRecord[] = [];
    let sourceTable: string | null = null;

    for (const tableName of possibleTables) {
      const result = await loadDocumentsFromTable(
        supabase,
        tableName,
        employeeId,
      );

      if (!result.available) {
        continue;
      }

      documents = result.documents;
      sourceTable = tableName;
      break;
    }

    if (documents.length === 0) {
      try {
        documents = await loadLinkedRecruitmentDocuments(
          supabase,
          employeeId,
          organisationId,
        );

        if (documents.length > 0) {
          sourceTable = "leo_talent_candidate_documents";
        }
      } catch (fallbackError) {
        console.warn(
          "LEO employee documents recruitment fallback failed:",
          fallbackError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      documents,
      sourceTable,
    });
  } catch (error) {
    console.error("LEO employee documents API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your employment documents could not be loaded.",
      },
      { status: 500 },
    );
  }
}

type CanonicalEmployeeContext = {
  organisationId: string;
  employeeId: number;
};

async function resolveCanonicalEmployee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<
  | { ok: true; context: CanonicalEmployeeContext | null }
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
    .select("membership_status,access_starts_at,access_ends_at")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .limit(1)
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
  const accessStartsAt = parseTimestamp(membership.access_starts_at);
  const accessEndsAt = parseTimestamp(membership.access_ends_at);

  if (
    (accessStartsAt !== null && accessStartsAt > now) ||
    (accessEndsAt !== null && accessEndsAt <= now)
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

  const { data: employeeLink, error: employeeLinkError } = await supabase
    .from("employee_user_links")
    .select("employee_id")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("link_status", "active")
    .maybeSingle();

  if (employeeLinkError) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            employeeLinkError.message ||
            "Your employee account link could not be checked.",
        },
        { status: 500 },
      ),
    };
  }

  if (!employeeLink?.employee_id) {
    return { ok: true, context: null };
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id,organisation_id")
    .eq("id", employeeLink.employee_id)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employeeError) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your employee record could not be validated.",
        },
        { status: 500 },
      ),
    };
  }

  if (!employee) {
    return { ok: true, context: null };
  }

  return {
    ok: true,
    context: { organisationId, employeeId: employee.id },
  };
}

function parseTimestamp(
  value: string | null | undefined,
): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
