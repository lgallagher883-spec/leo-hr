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
        {
          success: false,
          error: "Unauthorised",
        },
        { status: 401 }
      );
    }

    const {
      data: organisationId,
      error: organisationError,
    } = await supabase.rpc(
      "leo_current_organisation_id"
    );

    if (
      organisationError ||
      typeof organisationId !== "string" ||
      !organisationId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your active organisation could not be resolved.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("organisation_foundations")
      .select(
        "id, section, key, value, source"
      )
      .eq("organisation_id", organisationId)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      facts: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}