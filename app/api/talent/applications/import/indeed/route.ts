import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ImportRow = {
  rowNumber?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  appliedAt?: string;
  raw?: Record<string, string>;
};

function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

function toIsoDateTime(value: string | undefined) {
  const text = value?.trim();
  if (!text) return new Date().toISOString();
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "You are not signed in." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      vacancyId?: string;
      importFileName?: string;
      rows?: ImportRow[];
    };

    const vacancyId = body.vacancyId?.trim();
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const importFileName = body.importFileName?.trim() || "Indeed CSV";

    if (!vacancyId || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "A vacancy and at least one applicant are required." },
        { status: 400 },
      );
    }

    const { data: vacancy, error: vacancyError } = await supabase
      .from("leo_talent_vacancies")
      .select("id, organisation_id, blind_review_enabled, ai_screening_enabled")
      .eq("id", vacancyId)
      .single();

    if (vacancyError || !vacancy?.organisation_id) {
      return NextResponse.json(
        { success: false, error: "The selected vacancy could not be found." },
        { status: vacancyError?.code === "PGRST116" ? 404 : 500 },
      );
    }

    let imported = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const row of rows) {
      const rowNumber = row.rowNumber ?? imported + skipped + failures.length + 2;
      const firstName = row.firstName?.trim() ?? "";
      const lastName = row.lastName?.trim() ?? "";
      const email = normaliseEmail(row.email ?? "");

      if (!firstName || !lastName) {
        failures.push(`Row ${rowNumber}: Candidate name is missing.`);
        continue;
      }

      try {
        let candidateId: string | null = null;

        if (email) {
          const { data: existingCandidate, error: lookupError } = await supabase
            .from("leo_talent_candidates")
            .select("id")
            .eq("organisation_id", vacancy.organisation_id)
            .ilike("email", email)
            .is("archived_at", null)
            .maybeSingle();

          if (lookupError) throw lookupError;
          candidateId = existingCandidate?.id ?? null;
        }

        if (!candidateId) {
          const { data: createdCandidate, error: candidateError } = await supabase
            .from("leo_talent_candidates")
            .insert({
              organisation_id: vacancy.organisation_id,
              first_name: firstName,
              last_name: lastName,
              email: email || null,
              phone: row.phone?.trim() || null,
              is_internal_candidate: false,
              source: "indeed",
              source_detail: importFileName,
              metadata: {
                intake_route: "indeed_csv",
                indeed_row: row.raw ?? {},
              },
              created_by: user.id,
              updated_by: user.id,
            } as never)
            .select("id")
            .single();

          if (candidateError || !createdCandidate?.id) {
            throw candidateError ?? new Error("Candidate record was not returned.");
          }

          candidateId = createdCandidate.id;
        }

        const { data: duplicate, error: duplicateError } = await supabase
          .from("leo_talent_applications")
          .select("id")
          .eq("vacancy_id", vacancy.id)
          .eq("candidate_id", candidateId)
          .maybeSingle();

        if (duplicateError) throw duplicateError;
        if (duplicate?.id) {
          skipped += 1;
          continue;
        }

        const { error: applicationError } = await supabase
          .from("leo_talent_applications")
          .insert({
            organisation_id: vacancy.organisation_id,
            vacancy_id: vacancy.id,
            candidate_id: candidateId,
            current_stage_key: "new",
            status: "active",
            source: "indeed",
            submitted_at: toIsoDateTime(row.appliedAt),
            blind_review_enabled: vacancy.blind_review_enabled,
            ai_screening_enabled: vacancy.ai_screening_enabled,
            metadata: {
              intake_route: "indeed_csv",
              import_file: importFileName,
              indeed_row_number: rowNumber,
              original_data: row.raw ?? {},
            },
            created_by: user.id,
            updated_by: user.id,
          } as never);

        if (applicationError) throw applicationError;
        imported += 1;
      } catch (rowError) {
        failures.push(
          `Row ${rowNumber}: ${
            rowError instanceof Error ? rowError.message : "Unknown import error."
          }`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      failures,
      message: `${imported} imported, ${skipped} duplicate${
        skipped === 1 ? "" : "s"
      } skipped${failures.length ? `, ${failures.length} failed` : ""}.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not complete the Indeed import.",
      },
      { status: 500 },
    );
  }
}