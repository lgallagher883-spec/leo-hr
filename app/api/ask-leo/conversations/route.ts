import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ConversationListItem = {
  id: number;
  title: string;
  last_message_preview: string;
  last_message_at: string;
  updated_at: string;
  created_at: string;
};

async function requireAskLeoAccess() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        { success: false, error: "You must be signed in to use Ask Leo." },
        { status: 401 }
      ),
    };
  }

  const {
    data: organisationId,
    error: organisationError,
  } = await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId.trim()
  ) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    supabase,
    user,
    organisationId,
  };
}

export async function GET(request: Request) {
  const access = await requireAskLeoAccess();

  if ("response" in access) {
    return access.response;
  }

  const { supabase, user, organisationId } = access;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  let builder = supabase
    .from("ask_leo_conversations")
    .select(
      "id,title,last_message_preview,last_message_at,updated_at,created_at"
    )
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .is("converted_to_matter_at", null)
    .order("last_message_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);

  if (query) {
    const escaped = query.replace(/,/g, " ").replace(/%/g, "");

    builder = builder.or(
      `title.ilike.%${escaped}%,last_message_preview.ilike.%${escaped}%`
    );
  }

  const { data, error } = await builder;

  if (error) {
    console.error("Ask Leo conversations could not be loaded:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "Ask Leo conversations could not be loaded.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    conversations: (data || []) as ConversationListItem[],
  });
}
