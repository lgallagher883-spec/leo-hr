import { NextResponse } from "next/server";

import {
  assertSarOwnership,
  insertSarTimelineEvent,
  parseInteger,
  readText,
  requireSarAccess,
} from "../../_access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const access = await requireSarAccess("sar_requests.view");

    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    const sarId = parseInteger(id);

    if (!sarId) {
      return NextResponse.json(
        {
          success: false,
          error: "The SAR reference is not valid.",
        },
        { status: 400 },
      );
    }

    const { supabase, organisationId } = access.context;

    const ownership = await assertSarOwnership(
      supabase,
      organisationId,
      sarId,
    );

    if (!ownership.ok) {
      return ownership.response;
    }

    const body = await request.json().catch(() => ({}));

    const eventType = readText(body.eventType) || "manual_entry";
    const title = readText(body.title);
    const description = readText(body.description);
    const createdBy = readText(body.createdBy);

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a chronology title.",
        },
        { status: 400 },
      );
    }

    await insertSarTimelineEvent(supabase, {
      sarId,
      eventType,
      title,
      description: description || null,
      createdBy: createdBy || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SAR timeline API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The chronology entry could not be added.",
      },
      { status: 500 },
    );
  }
}
