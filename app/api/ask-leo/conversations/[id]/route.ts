import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RenameBody = {
  title?: unknown;
};

function readConversationId(value: string): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readTitle(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 140);
}

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

async function getOwnedConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: number,
  organisationId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("ask_leo_conversations")
    .select(
      "id,title,last_message_preview,last_message_at,converted_to_matter_id,converted_to_matter_at,created_at,updated_at"
    )
    .eq("id", conversationId)
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Ask Leo conversation lookup failed:", error);
    return { error: "The conversation could not be verified." };
  }

  if (!data) {
    return { error: "The conversation could not be found." };
  }

  return { conversation: data };
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const conversationId = readConversationId(id);

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: "The conversation reference is invalid." },
      { status: 400 }
    );
  }

  const access = await requireAskLeoAccess();

  if ("response" in access) {
    return access.response;
  }

  const { supabase, user, organisationId } = access;

  const record = await getOwnedConversation(
    supabase,
    conversationId,
    organisationId,
    user.id
  );

  if (record.error) {
    return NextResponse.json(
      { success: false, error: record.error },
      { status: 404 }
    );
  }

  const { data: messages, error: messagesError } = await supabase
    .from("ask_leo_conversation_messages")
    .select("id,role,content,created_at")
    .eq("conversation_id", conversationId)
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (messagesError) {
    console.error("Ask Leo conversation messages could not be loaded:", messagesError);

    return NextResponse.json(
      {
        success: false,
        error: messagesError.message || "Conversation messages could not be loaded.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    conversation: record.conversation,
    messages: messages || [],
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const conversationId = readConversationId(id);

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: "The conversation reference is invalid." },
      { status: 400 }
    );
  }

  let body: RenameBody;

  try {
    body = (await request.json()) as RenameBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "The conversation update could not be read." },
      { status: 400 }
    );
  }

  const title = readTitle(body.title);

  if (!title) {
    return NextResponse.json(
      { success: false, error: "A conversation title is required." },
      { status: 400 }
    );
  }

  const access = await requireAskLeoAccess();

  if ("response" in access) {
    return access.response;
  }

  const { supabase, user, organisationId } = access;

  const record = await getOwnedConversation(
    supabase,
    conversationId,
    organisationId,
    user.id
  );

  if (record.error) {
    return NextResponse.json(
      { success: false, error: record.error },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("ask_leo_conversations")
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .select(
      "id,title,last_message_preview,last_message_at,converted_to_matter_id,converted_to_matter_at,created_at,updated_at"
    )
    .single();

  if (error || !data) {
    console.error("Ask Leo conversation rename failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "The conversation could not be renamed.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    conversation: data,
  });
}
