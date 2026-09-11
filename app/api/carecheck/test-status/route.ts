import { NextRequest, NextResponse } from "next/server";

import { pullCareCheckApplicationStatus } from "@/lib/carecheck/status-pull";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error: "CareCheck test status route is disabled in production.",
      },
      { status: 404 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      applicationReference?: unknown;
    };

    const applicationReference =
      typeof body.applicationReference === "string"
        ? body.applicationReference.trim()
        : "";

    if (!applicationReference) {
      return NextResponse.json(
        {
          success: false,
          error: "applicationReference is required.",
        },
        { status: 400 },
      );
    }

    const result = await pullCareCheckApplicationStatus(
      applicationReference,
    );

    return NextResponse.json({
      success: result.success,
      responseCode: result.responseCode,
      responseMessage: result.responseMessage,
      applicationReference: result.applicationReference,
      externalReference: result.externalReference,
      statusCode: result.statusCode,
      statusDescription: result.statusDescription,
      isCurrentStatus: result.isCurrentStatus,
      workingWithVulnerableAdults:
        result.workingWithVulnerableAdults,
      workingWithChildren: result.workingWithChildren,
      rawResponse: result.rawResponse,
    });
  } catch (error) {
    console.error("CareCheck test status pull failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown CareCheck status error",
      },
      { status: 500 },
    );
  }
}
