import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type EmployeeMembership = {
  organisation_id: string | null;
  employee_id: number | null;
};

type DatabaseRecord = Record<string, unknown>;

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    code?: string;
    message?: string;
  };

  return (
    candidate.code === "42P01" ||
    candidate.code === "PGRST205" ||
    candidate.message?.toLowerCase().includes("could not find the table") ||
    candidate.message?.toLowerCase().includes("does not exist")
  );
}

async function readOptionalSingleRecord(
  supabase: any,
  table: string,
  employeeId: number,
  organisationId: string,
) {
  const result = await supabase
    .from(table)
    .select("*")
    .eq("employee_id", employeeId)
    .eq("organisation_id", organisationId)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    if (isMissingRelationError(result.error)) {
      return null;
    }

    throw result.error;
  }

  return (result.data ?? null) as DatabaseRecord | null;
}

async function readOptionalRecords(
  supabase: any,
  table: string,
  employeeId: number,
  organisationId: string,
  orderColumn?: string,
) {
  let query = supabase
    .from(table)
    .select("*")
    .eq("employee_id", employeeId)
    .eq("organisation_id", organisationId);

  if (orderColumn) {
    query = query.order(orderColumn, { ascending: false });
  }

  const result = await query;

  if (result.error) {
    if (isMissingRelationError(result.error)) {
      return [];
    }

    throw result.error;
  }

  return (result.data ?? []) as DatabaseRecord[];
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
        "LEO medical API membership lookup failed:",
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
        medicalRecord: null,
        fitNotes: [],
        absenceRecords: [],
      });
    }

    const employeeId = membership.employee_id;
    const organisationId = membership.organisation_id;

    const employeeResult = await (supabase as any)
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (employeeResult.error) {
      console.error(
        "LEO medical API employee validation failed:",
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
        medicalRecord: null,
        fitNotes: [],
        absenceRecords: [],
      });
    }

    let medicalRecord: DatabaseRecord | null = null;

    const possibleMedicalTables = [
      "employee_health_records",
      "employee_medical_records",
      "employee_health_details",
    ];

    for (const table of possibleMedicalTables) {
      medicalRecord = await readOptionalSingleRecord(
        supabase as any,
        table,
        employeeId,
        organisationId,
      );

      if (medicalRecord) {
        break;
      }
    }

    const employeeRecord =
      employeeResult.data as DatabaseRecord;

    if (!medicalRecord) {
      medicalRecord = employeeRecord;
    }

    let fitNotes: DatabaseRecord[] = [];

    const possibleDocumentTables = [
      "employee_documents",
      "employee_document_records",
    ];

    for (const table of possibleDocumentTables) {
      const documents = await readOptionalRecords(
        supabase as any,
        table,
        employeeId,
        organisationId,
        "created_at",
      );

      if (documents.length > 0) {
        fitNotes = documents.filter((record) => {
          const type = String(
            record.document_type ??
              record.evidence_type ??
              record.category ??
              record.type ??
              "",
          ).toLowerCase();

          const title = String(
            record.title ??
              record.document_name ??
              record.file_name ??
              "",
          ).toLowerCase();

          return (
            type.includes("fit_note") ||
            type.includes("fit note") ||
            title.includes("fit note")
          );
        });

        break;
      }
    }

    let absenceRecords: DatabaseRecord[] = [];

    const possibleAbsenceTables = [
      "employee_absence_records",
      "employee_leave_records",
      "employee_absences",
    ];

    for (const table of possibleAbsenceTables) {
      const records = await readOptionalRecords(
        supabase as any,
        table,
        employeeId,
        organisationId,
        "created_at",
      );

      if (records.length > 0) {
        absenceRecords = records.filter((record) => {
          const type = String(
            record.absence_type ??
              record.leave_type ??
              record.category ??
              record.type ??
              "",
          ).toLowerCase();

          return (
            type.includes("sick") ||
            type.includes("medical") ||
            type.includes("health") ||
            type.includes("absence")
          );
        });

        break;
      }
    }

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      medicalRecord,
      fitNotes,
      absenceRecords,
    });
  } catch (error) {
    console.error("LEO medical API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your medical information could not be loaded.",
      },
      { status: 500 },
    );
  }
}