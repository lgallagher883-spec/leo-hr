import { NextResponse } from "next/server";

import { getReminders } from "./_engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const moduleParam = url.searchParams.get("module") || "";
  const limitParam = Number(url.searchParams.get("limit") || "20");

  const result = await getReminders({
    module: moduleParam,
    limit: Number.isFinite(limitParam) ? limitParam : 20,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      role: result.roleKey,
      reminders: result.reminders,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
