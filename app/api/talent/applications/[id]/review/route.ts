import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("leo_talent_applications")
      .update({
        last_reviewed_at: now,
        last_reviewed_by: user.id,
        updated_at: now,
        updated_by: user.id,
      } as never)
      .eq("id", id)
      .select("id, application_reference, last_reviewed_at")
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error.code === "PGRST116"
              ? "The application could not be found."
              : `Leo could not record the application review. ${error.message}`,
        },
        { status: error.code === "PGRST116" ? 404 : 500 },
      );
    }

    return NextResponse.json({
      success: true,
      application: data,
      message: `${data.application_reference} was marked as reviewed.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not record the application review.",
      },
      { status: 500 },
    );
  }
}