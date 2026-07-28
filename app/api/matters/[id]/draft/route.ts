import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildDraftDocument } from "@/leo/draft/engine";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type DraftRequestBody = {
  message?: unknown;
  title?: unknown;
  documentType?: unknown;
  organisationId?: unknown;
  organisationKnowledge?: unknown;
  organisationMemory?: unknown;
  policies?: unknown;
};

function readRequiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

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
        { success: false, error: "Your session is unavailable. Please sign in again." },
        { status: 401 }
      ),
    };
  }

  const { data: organisationId, error: organisationError } = await supabase.rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return {
      response: NextResponse.json(
        { success: false, error: "Your active organisation could not be resolved." },
        { status: 403 }
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc("leo_has_permission", {
    target_organisation_id: organisationId,
    target_permission_key: permissionKey,
    target_user_id: user.id,
  });

  if (permissionError) {
    return {
      response: NextResponse.json(
        { success: false, error: "Your permission to draft documents could not be verified." },
        { status: 500 }
      ),
    };
  }

  if (!allowed) {
    return {
      response: NextResponse.json(
        { success: false, error: "You do not have permission to draft documents." },
        { status: 403 }
      ),
    };
  }

  return {
    supabase,
    user,
    organisationId: String(organisationId),
  };
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json({ success: false, error: "The Matter reference is invalid." }, { status: 400 });
  }

  const permission = await requirePermission("matters.update");
  if (permission.response) return permission.response;

  const { supabase, user, organisationId } = permission;

  let body: DraftRequestBody;
  try {
    body = (await request.json()) as DraftRequestBody;
  } catch {
    return NextResponse.json({ success: false, error: "The draft request could not be read." }, { status: 400 });
  }

  const message = readRequiredText(body.message);
  if (!message) {
    return NextResponse.json({ success: false, error: "A message is required to draft a document." }, { status: 400 });
  }

  const draft = buildDraftDocument({
    message,
    matterId,
    organisationId,
    organisationKnowledge: Array.isArray(body.organisationKnowledge) ? body.organisationKnowledge as Array<{ title: string; content: string; keywords?: string[] }> : [],
    organisationMemory: Array.isArray(body.organisationMemory) ? body.organisationMemory as Array<{ title: string; content: string; keywords?: string[] }> : [],
    policies: Array.isArray(body.policies) ? body.policies as Array<{ title?: string; content?: string }> : [],
    documentType: (body.documentType as any) || undefined,
  });

  const documentTitle = readRequiredText(body.title) || draft.title;

  const { data, error } = await supabase
    .from("matter_documents")
    .insert({
      matter_id: matterId,
      version_number: 1,
      title: documentTitle,
      document_type: draft.documentType,
      description: `Leo-generated draft based on the current reasoning and knowledge context.`,
      source: "leo_generated",
      status: "Draft",
      content: draft.content,
      include_in_bundle: true,
      created_by: user.id,
    })
    .select("id,title,document_type,content,status")
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: error?.message || "The draft document could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ success: true, document: data, draft });
}
