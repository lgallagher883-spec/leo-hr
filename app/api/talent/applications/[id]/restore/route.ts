import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedStatuses = new Set([
  "active",
  "appointed",
  "withdrawn",
  "unsuccessful",
  "offered",
]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
    };

    const restoredStatus = body.status?.trim() || "active";

    if (!allowedStatuses.has(restoredStatus)) {
      return NextResponse.json(
        { success: false, error: "The requested restored status is not valid." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("leo_talent_applications")
      .update({
        status: restoredStatus,
        archived_at: null,
        archived_by: null,
        archive_reason: null,
        updated_at: now,
        updated_by: user.id,
      })
      .eq("id", id)
      .select("id, application_reference, status, archived_at")
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json(
        {
          success: false,
          error:
            status === 404
              ? "The application could not be found."
              : `The application could not be restored. ${error.message}`,
        },
        { status },
      );
    }

    return NextResponse.json({ success: true, application: data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The application could not be restored.",
      },
      { status: 500 },
    );
  }
}