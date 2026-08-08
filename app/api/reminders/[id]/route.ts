import { NextResponse } from "next/server";

import { mutateReminder } from "../_engine";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        error: "A reminder ID is required.",
      },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: unknown;
    snoozeUntil?: unknown;
  };

  const action = typeof body.action === "string" ? body.action : "";

  if (!["dismiss", "snooze", "read"].includes(action)) {
    return NextResponse.json(
      {
        success: false,
        error: "The reminder action is not supported.",
      },
      { status: 400 },
    );
  }

  const result = await mutateReminder({
    reminderId: id,
    action: action as "dismiss" | "snooze" | "read",
    snoozeUntil:
      typeof body.snoozeUntil === "string" ? body.snoozeUntil : null,
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

  return NextResponse.json({
    success: true,
  });
}
