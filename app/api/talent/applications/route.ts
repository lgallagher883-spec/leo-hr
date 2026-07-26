
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const [applicationsResult, stagesResult] = await Promise.all([
      supabase
        .from("leo_talent_applications")
        .select(`
          id,
          organisation_id,
          application_reference,
          vacancy_id,
          candidate_id,
          current_stage_key,
          status,
          source,
          submitted_at,
          last_reviewed_at,
          manual_score,
          ai_score,
          combined_score,
          recommendation,
          knockout_failed,
          created_at,
          updated_at,
          archived_at,
          candidate:leo_talent_candidates (
            id,
            candidate_reference,
            first_name,
            last_name,
            preferred_name,
            email,
            archived_at
          ),
          vacancy:leo_talent_vacancies (
            id,
            vacancy_reference,
            title,
            department,
            location_name,
            status,
            archived_at
          )
        `)
        .order("updated_at", { ascending: false }),
      supabase
        .from("leo_talent_pipeline_stages")
        .select(
          "id, stage_key, stage_name, description, stage_group, display_order, is_active",
        )
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

    if (applicationsResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: `Leo could not load the application register. ${applicationsResult.error.message}`,
        },
        { status: 500 },
      );
    }

    const applications = (applicationsResult.data ?? []).map((row) => ({
      ...row,
      candidate: Array.isArray(row.candidate)
        ? row.candidate[0] ?? null
        : row.candidate,
      vacancy: Array.isArray(row.vacancy)
        ? row.vacancy[0] ?? null
        : row.vacancy,
    }));

    return NextResponse.json({
      success: true,
      applications,
      stages:
        !stagesResult.error && stagesResult.data?.length
          ? stagesResult.data
          : [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load applications.",
      },
      { status: 500 },
    );
  }
}