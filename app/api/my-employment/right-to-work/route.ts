import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EmployeeRecord = {
  id: number;
  organisation_id: string | null;
};

type RightToWorkRecord = Record<string, unknown>;

const missingRelationCodes = new Set([
  "42P01",
  "PGRST200",
  "PGRST204",
  "PGRST205",
]);

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false;

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

async function findEmployee(
  supabase: any,
  userId: string,
  userEmail: string,
) {
  const membershipResult = await supabase
    .from("identity_organisation_memberships")
    .select("organisation_id, employee_id")
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .not("employee_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (!membershipResult.error && membershipResult.data?.employee_id) {
    const employeeResult = await supabase
      .from("employees")
      .select("id, organisation_id")
      .eq("id", membershipResult.data.employee_id)
      .eq(
        "organisation_id",
        membershipResult.data.organisation_id,
      )
      .maybeSingle();

    if (employeeResult.error) {
      throw employeeResult.error;
    }

    return employeeResult.data as EmployeeRecord | null;
  }

  const organisationResult = await supabase.rpc(
    "leo_current_organisation_id",
  );

  if (
    organisationResult.error ||
    typeof organisationResult.data !== "string" ||
    !organisationResult.data
  ) {
    return null;
  }

  const employeeResult = await supabase
    .from("employees")
    .select("id, organisation_id")
    .eq("organisation_id", organisationResult.data)
    .ilike("email", userEmail)
    .limit(1)
    .maybeSingle();

  if (employeeResult.error) {
    throw employeeResult.error;
  }

  return employeeResult.data as EmployeeRecord | null;
}

async function loadRightToWorkRecord(
  supabase: any,
  employeeId: number,
  organisationId: string,
) {
  const tables = [
    "employee_right_to_work",
    "employee_right_to_work_checks",
    "right_to_work_checks",
    "leo_employee_right_to_work",
  ];

  for (const tableName of tables) {
    const result = await supabase
      .from(tableName)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      if (isMissingRelationError(result.error)) {
        continue;
      }

      throw result.error;
    }

    return {
      record: (result.data ?? null) as RightToWorkRecord | null,
      sourceTable: tableName,
    };
  }

  return {
    record: null,
    sourceTable: null,
  };
}

async function loadRightToWorkDocuments(
  supabase: any,
  employeeId: number,
  organisationId: string,
) {
  const tables = [
    "employee_documents",
    "leo_employee_documents",
    "employee_document_records",
  ];

  for (const tableName of tables) {
    const result = await supabase
      .from(tableName)
      .select("*")
      .eq("employee_id", employeeId)
      .eq("organisation_id", organisationId)
      .or(
        "document_type.ilike.%right to work%,document_type.ilike.%passport%,document_type.ilike.%visa%,category.ilike.%right to work%",
      )
      .order("created_at", { ascending: false });

    if (result.error) {
      if (
        isMissingRelationError(result.error) ||
        result.error.code === "42703"
      ) {
        continue;
      }

      throw result.error;
    }

    return (result.data ?? []) as RightToWorkRecord[];
  }

  return [] as RightToWorkRecord[];
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
          error:
            "You must be signed in to view your Right to Work record.",
        },
        { status: 401 },
      );
    }

    const userEmail =
      typeof user.email === "string"
        ? user.email.trim().toLowerCase()
        : "";

    if (!userEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your account does not have an email address linked to it.",
        },
        { status: 409 },
      );
    }

    const employee = await findEmployee(
      supabase,
      user.id,
      userEmail,
    );

    if (!employee?.id || !employee.organisation_id) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        rightToWork: null,
        documents: [],
      });
    }

    const rightToWorkResult = await loadRightToWorkRecord(
      supabase,
      employee.id,
      employee.organisation_id,
    );

    const documents = await loadRightToWorkDocuments(
      supabase,
      employee.id,
      employee.organisation_id,
    );

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      rightToWork: rightToWorkResult.record,
      documents,
      sourceTable: rightToWorkResult.sourceTable,
    });
  } catch (error) {
    console.error("My Right to Work API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your Right to Work record could not be loaded.",
      },
      { status: 500 },
    );
  }
}