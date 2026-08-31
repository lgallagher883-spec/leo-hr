import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ConvertBody = {
  matterId?: unknown;
};

function readConversationId(value: string): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readMatterId(value: unknown): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requirePermission(permissionKey: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 }
      ),
    };
  }

  const { data: organisationId, error: organisationError } = await supabase.rpc(
    "leo_current_organisation_id"
  );

  if (organisationError || !organisationId) {
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

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    }
  );

  if (permissionError) {
    console.error("Ask Leo conversion permission check failed:", permissionError);

    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to update Matters could not be verified.",
        },
        { status: 500 }
      ),
    };
  }

  if (!allowed) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have permission to perform this action.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    supabase,
    organisationId: String(organisationId),
    user,
  };
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const conversationId = readConversationId(id);

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: "The conversation reference is invalid." },
      { status: 400 }
    );
  }

  let body: ConvertBody;

  try {
    body = (await request.json()) as ConvertBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "The conversion request could not be read." },
      { status: 400 }
    );
  }

  const matterId = readMatterId(body.matterId);

  if (!matterId) {
    return NextResponse.json(
      { success: false, error: "A valid Matter reference is required." },
      { status: 400 }
    );
  }

  const access = await requirePermission("matters.update");

  if ("response" in access) {
    return access.response;
  }

  const { supabase, organisationId, user } = access;

  const { data: conversation, error: conversationError } = await supabase
    .from("ask_leo_conversations")
    .select(
      "id, organisation_id, user_id, converted_to_matter_id, converted_to_matter_at"
    )
    .eq("id", conversationId)
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .single();

  if (conversationError || !conversation) {
    console.error("Ask Leo conversation lookup failed for conversion:", conversationError);

    return NextResponse.json(
      {
        success: false,
        error: "The Ask Leo conversation could not be found.",
      },
      { status: 404 }
    );
  }

  if (
    conversation.converted_to_matter_id &&
    Number(conversation.converted_to_matter_id) !== matterId
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "This conversation has already been linked to another Matter.",
      },
      { status: 409 }
    );
  }

  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .select("id")
    .eq("id", matterId)
    .maybeSingle();

  if (matterError) {
    console.error("Matter lookup failed for Ask Leo conversion:", matterError);

    return NextResponse.json(
      {
        success: false,
        error: "The Matter could not be verified.",
      },
      { status: 500 }
    );
  }

  if (!matter) {
    return NextResponse.json(
      {
        success: false,
        error: "The Matter could not be found or accessed.",
      },
      { status: 404 }
    );
  }

  const { data: sourceMessages, error: sourceMessagesError } = await supabase
    .from("ask_leo_conversation_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (sourceMessagesError) {
    console.error("Ask Leo messages could not be loaded for conversion:", sourceMessagesError);

    return NextResponse.json(
      {
        success: false,
        error: "The Ask Leo conversation history could not be loaded.",
      },
      { status: 500 }
    );
  }

  const rows = (sourceMessages || []).map((message) => ({
    matter_id: matterId,
    role: message.role,
    content: message.content,
    created_at: message.created_at,
    source_ask_leo_conversation_id: conversationId,
    source_ask_leo_message_id: message.id,
  }));

  if (rows.length > 0) {
    const { data: alreadyCopied, error: alreadyCopiedError } = await supabase
      .from("matter_messages")
      .select("source_ask_leo_message_id")
      .eq("matter_id", matterId)
      .in(
        "source_ask_leo_message_id",
        rows.map((row) => row.source_ask_leo_message_id),
      );

    if (alreadyCopiedError) {
      console.error("Matter messages could not be checked before conversion:", alreadyCopiedError);

      return NextResponse.json(
        {
          success: false,
          error: "The Ask Leo conversation could not be linked to the Matter messages.",
        },
        { status: 500 }
      );
    }

    const alreadyCopiedIds = new Set(
      (alreadyCopied || []).map((row) => row.source_ask_leo_message_id),
    );

    const newRows = rows.filter(
      (row) => !alreadyCopiedIds.has(row.source_ask_leo_message_id),
    );

    if (newRows.length > 0) {
      const { error: insertError } = await supabase.from("matter_messages").insert(newRows);

      if (insertError) {
        console.error("Ask Leo messages could not be copied into Matter:", insertError);

        return NextResponse.json(
          {
            success: false,
            error:
              insertError.message ||
              "The Ask Leo conversation could not be linked to the Matter messages.",
          },
          { status: 500 }
        );
      }
    }
  }

  const convertedAt =
    conversation.converted_to_matter_at || new Date().toISOString();

  const { error: updateConversationError } = await supabase
    .from("ask_leo_conversations")
    .update({
      converted_to_matter_id: matterId,
      converted_to_matter_at: convertedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id);

  if (updateConversationError) {
    console.error("Ask Leo conversion metadata update failed:", updateConversationError);

    return NextResponse.json(
      {
        success: false,
        error: "The conversation conversion status could not be updated.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    conversationId,
    matterId,
    copiedMessageCount: rows.length,
  });
}
