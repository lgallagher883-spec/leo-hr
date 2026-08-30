import { NextResponse } from "next/server";
import { refreshAuthorityStore } from "@/leo/authority/store/updater";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return false;
  }

  return (
    request.headers.get("authorization") ===
    `Bearer ${secret}`
  );
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const result =
      await refreshAuthorityStore();

    return NextResponse.json({
      success:
        result.topicsSucceeded > 0,
      refreshedAt:
        new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error(
      "Leo authority refresh route failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Authority refresh failed.",
      },
      { status: 500 }
    );
  }
}
