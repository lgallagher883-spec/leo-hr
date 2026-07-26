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