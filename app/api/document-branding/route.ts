import { NextResponse } from "next/server";

import { parseDocumentBrandSettings } from "@/lib/documents/brandSettings";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
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
        { success: false, error: "You must be signed in." },
        { status: 401 },
      );
    }

    const { data: organisationId, error: organisationError } =
      await supabase.rpc("leo_current_organisation_id");

    if (organisationError || !organisationId) {
      return NextResponse.json(
        { success: false, error: "The current organisation could not be resolved." },
        { status: 403 },
      );
    }

    const [profileResult, organisationResult] = await Promise.all([
      supabase
        .from("organisation_public_profiles")
        .select(
          "display_name, logo_url, primary_colour, secondary_colour, metadata",
        )
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      supabase
        .from("organisations")
        .select("name")
        .eq("id", organisationId)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      throw new Error(profileResult.error.message);
    }

    if (organisationResult.error) {
      throw new Error(organisationResult.error.message);
    }

    const branding = parseDocumentBrandSettings(
      (profileResult.data as Record<string, unknown> | null) ?? null,
      organisationResult.data?.name || "Organisation",
    );

    return NextResponse.json({
      success: true,
      organisationId,
      branding,
    });
  } catch (error) {
    console.error("Document branding could not be loaded:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Document branding could not be loaded.",
      },
      { status: 500 },
    );
  }
}
