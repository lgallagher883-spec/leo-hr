import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
      reason?: string;
    };

    const reason = body.reason?.trim() || "Archived from the application register";
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("leo_talent_applications")
      .update({
        status: "archived",
        archived_at: now,
        archived_by: user.id,
        archive_reason: reason,
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
              : `The application could not be archived. ${error.message}`,
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
            : "The application could not be archived.",
      },
      { status: 500 },
    );
  }
}