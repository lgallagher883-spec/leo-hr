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
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    return null;
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
    return null;
  }

  const now = Date.now();
  const accessStartsAt = parseTimestamp(membership.access_starts_at);
  const accessEndsAt = parseTimestamp(membership.access_ends_at);

  if (
    (accessStartsAt !== null && accessStartsAt > now) ||
    (accessEndsAt !== null && accessEndsAt <= now)
  ) {
    return null;
  }

  const { data: employeeLink, error: employeeLinkError } = await supabase
    .from("employee_user_links")
    .select("employee_id")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("link_status", "active")
    .maybeSingle();

  if (employeeLinkError) throw employeeLinkError;
  if (!employeeLink?.employee_id) return null;

  const employeeResult = await supabase
    .from("employees")
    .select("id, organisation_id")
    .eq("id", employeeLink.employee_id)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employeeResult.error) throw employeeResult.error;
  return employeeResult.data as EmployeeRecord | null;
}

function parseTimestamp(
  value: string | null | undefined,
): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

async function loadRightToWorkRecord(
  supabase: any,
  employeeId: number,
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
      .order("created_at", { ascending: false });

    if (result.error) {
      if (isMissingRelationError(result.error)) {
        continue;
      }

      throw result.error;
    }

    const records = (result.data ?? []) as RightToWorkRecord[];

    return records.filter((record) => {
      const type = String(record.document_type ?? record.category ?? "")
        .trim()
        .toLowerCase();
      const title = String(record.title ?? record.file_name ?? "")
        .trim()
        .toLowerCase();
      const haystack = `${type} ${title}`;

      return (
        haystack.includes("right to work") ||
        haystack.includes("passport") ||
        haystack.includes("visa")
      );
    });
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

    const employee = await findEmployee(
      supabase,
      user.id,
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
    );

    const documents = await loadRightToWorkDocuments(
      supabase,
      employee.id,
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