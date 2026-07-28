import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type EmployeeMembership = {
  organisation_id: string | null;
  employee_id: number | null;
};

type DocumentRecord = Record<string, unknown>;

const missingRelationCodes = new Set([
  "42P01",
  "PGRST200",
  "PGRST204",
  "PGRST205",
]);

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
  organisationId: string,
) {
  const result = await supabase
    .from(tableName)
    .select("*")
    .eq("employee_id", employeeId)
    .eq("organisation_id", organisationId)
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

export async function GET() {
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

    const membershipResult = await (supabase as any)
      .from("identity_organisation_memberships")
      .select("organisation_id, employee_id")
      .eq("user_id", user.id)
      .eq("membership_status", "active")
      .not("employee_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (membershipResult.error) {
      console.error(
        "LEO employee documents membership lookup failed:",
        membershipResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Your employee account link could not be checked.",
        },
        { status: 500 },
      );
    }

    const membership =
      membershipResult.data as EmployeeMembership | null;

    if (!membership?.employee_id || !membership.organisation_id) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        documents: [],
      });
    }

    const employeeId = membership.employee_id;
    const organisationId = membership.organisation_id;

    const employeeResult = await (supabase as any)
      .from("employees")
      .select("id, organisation_id")
      .eq("id", employeeId)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (employeeResult.error) {
      console.error(
        "LEO employee documents validation failed:",
        employeeResult.error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Your employee record could not be validated.",
        },
        { status: 500 },
      );
    }

    if (!employeeResult.data) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        documents: [],
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
        organisationId,
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