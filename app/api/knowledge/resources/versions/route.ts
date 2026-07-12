import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const sourceTable =
      url.searchParams.get("sourceTable");

    const sourceRecordId =
      Number(
        url.searchParams.get(
          "sourceRecordId"
        )
      );

    if (
      sourceTable !==
        "policy_register" &&
      sourceTable !==
        "company_documents"
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
      !Number.isFinite(
        sourceRecordId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid resource ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      createServerSupabaseClient();

    const { data, error } =
      await supabase
        .from(
          "hr_resource_versions"
        )
        .select(
          `
            id,
            version_number,
            resource_name,
            resource_type,
            category,
            responsible_person,
            review_date,
            notes,
            file_name,
            file_path,
            file_url,
            replaced_at
          `
        )
        .eq(
          "source_table",
          sourceTable
        )
        .eq(
          "source_record_id",
          sourceRecordId
        )
        .order(
          "version_number",
          {
            ascending: false,
          }
        );

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      versions: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Version history could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}