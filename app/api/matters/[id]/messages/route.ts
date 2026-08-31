import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreateMessageBody = {
  role?: unknown;
  content?: unknown;
};

const messageSelect = "id, matter_id, role, content, created_at";

function readMatterId(id: string): number | null {
  const matterId = Number(id);
  return Number.isInteger(matterId) && matterId > 0 ? matterId : null;
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
        { status: 401 },
      ),
    };
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    console.error("Matter-message permission could not be checked:", permissionError);

    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to use Matter conversations could not be verified.",
        },
        { status: 500 },
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
        { status: 403 },
      ),
    };
  }

  return { supabase };
}

async function verifyMatterAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matterId: number,
) {
  const { data, error } = await supabase
    .from("matters")
    .select("id, description")
    .eq("id", matterId)
    .maybeSingle();

  if (error) {
    console.error("Matter could not be checked for conversation access:", error);
    return { error: "The Matter could not be verified." };
  }

  if (!data) {
    return { error: "The Matter could not be found or accessed." };
  }

  return { matter: data };
}

// Legacy/description-only Matters have no matter_messages yet - seed the
// employer's own description as the first turn, once, on first read.
async function ensureSeededConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  matterId: number,
  description: string | null,
) {
  const trimmedDescription = description?.trim();

  if (!trimmedDescription) {
    return null;
  }

  const { count, error: countError } = await supabase
    .from("matter_messages")
    .select("id", { count: "exact", head: true })
    .eq("matter_id", matterId);

  if (countError || (count ?? 0) > 0) {
    return null;
  }

  const { data: seeded, error: seedError } = await supabase
    .from("matter_messages")
    .insert({
      matter_id: matterId,
      role: "user",
      content: trimmedDescription,
    })
    .select(messageSelect)
    .single();

  if (seedError) {
    console.error("Matter description could not be seeded as a conversation message:", seedError);
    return null;
  }

  return seeded;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json(
      { success: false, error: "The Matter reference is invalid." },
      { status: 400 },
    );
  }

  const access = await requirePermission("matters.view");
  if (access.response) return access.response;

  const { supabase } = access;
  const matterAccess = await verifyMatterAccess(supabase, matterId);

  if (matterAccess.error) {
    return NextResponse.json(
      { success: false, error: matterAccess.error },
      { status: matterAccess.error.includes("found") ? 404 : 500 },
    );
  }

  const { data, error } = await supabase
    .from("matter_messages")
    .select(messageSelect)
    .eq("matter_id", matterId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Matter conversation could not be loaded:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "The Matter conversation could not be loaded.",
      },
      { status: 500 },
    );
  }

  let messages = data ?? [];

  if (messages.length === 0) {
    const seeded = await ensureSeededConversation(
      supabase,
      matterId,
      matterAccess.matter?.description ?? null,
    );

    if (seeded) {
      messages = [seeded];
    }
  }

  return NextResponse.json({
    success: true,
    messages,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json(
      { success: false, error: "The Matter reference is invalid." },
      { status: 400 },
    );
  }

  let body: CreateMessageBody;

  try {
    body = (await request.json()) as CreateMessageBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "The conversation message could not be read." },
      { status: 400 },
    );
  }

  if (body.role !== "user" && body.role !== "leo") {
    return NextResponse.json(
      { success: false, error: "The conversation-message role is invalid." },
      { status: 400 },
    );
  }

  if (typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json(
      { success: false, error: "A conversation message is required." },
      { status: 400 },
    );
  }

  const access = await requirePermission("matters.update");
  if (access.response) return access.response;

  const { supabase } = access;
  const matterAccess = await verifyMatterAccess(supabase, matterId);

  if (matterAccess.error) {
    return NextResponse.json(
      { success: false, error: matterAccess.error },
      { status: matterAccess.error.includes("found") ? 404 : 500 },
    );
  }

  const { data, error } = await supabase
    .from("matter_messages")
    .insert({
      matter_id: matterId,
      role: body.role,
      content: body.content.trim(),
    })
    .select(messageSelect)
    .single();

  if (error || !data) {
    console.error("Matter conversation message could not be saved:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "The conversation message could not be saved.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: data,
    },
    { status: 201 },
  );
}