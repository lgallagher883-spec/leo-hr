import { NextRequest, NextResponse } from "next/server";

import { buildGoogleAuthorisationUrl } from "@/lib/google/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionReference =
      request.nextUrl.searchParams.get("session");

    if (!sessionReference) {
      return NextResponse.json(
        {
          success: false,
          error: "The connection session is invalid.",
        },
        { status: 400 },
      );
    }

    const authorisationUrl =
      buildGoogleAuthorisationUrl(sessionReference);

    return NextResponse.redirect(authorisationUrl);
  } catch (error) {
    console.error(
      "Google authorisation could not be started:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Google authorisation could not be started.",
      },
      { status: 500 },
    );
  }
}