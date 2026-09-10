import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string; documentId: string }> };

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase administrator credentials are not configured.");
  }

  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }

async function requireTalentPermission(supabase: any, permissionKey: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Your session is unavailable. Please sign in again." }, { status: 401 }) };
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: "Your active organisation could not be resolved." }, { status: 403 }) };
  }

  const { data: allowed, error: permissionError } = await supabase.rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    },
  );

  if (permissionError || !allowed) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: permissionError ? "Your Talent permission could not be verified." : "You do not have permission to access this candidate document." }, { status: permissionError ? 500 : 403 }) };
  }

  return { ok: true as const, organisationId: String(organisationId) };
}
export async function GET(_request: Request, context: RouteContext) {
  try { const { id, documentId } = await context.params; const supabase = await createClient(); const access = await requireTalentPermission(supabase as any, "leo_talent.view"); if (!access.ok) return access.response; const organisationId = access.organisationId; const result = await (supabase as any).from("leo_talent_candidate_documents").select("id, candidate_id, file_path, file_name").eq("id", documentId).eq("candidate_id", id).eq("organisation_id", organisationId).maybeSingle(); if (result.error) throw new Error(result.error.message); if (!result.data) return NextResponse.json({ success: false, error: "The candidate document was not found." }, { status: 404 }); const signed = await getAdminClient().storage.from("leo-talent-candidate-documents").createSignedUrl(result.data.file_path, 60); if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message || "Leo could not create a secure document link."); return NextResponse.json({ success: true, url: signed.data.signedUrl, fileName: result.data.file_name }); } catch (error) { console.error("Candidate document open failed:", error); return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Leo could not open this candidate document." }, { status: 500 }); }
}
export async function DELETE(_request: Request, context: RouteContext) {
  try { const { id, documentId } = await context.params; const supabase = await createClient(); const access = await requireTalentPermission(supabase as any, "leo_talent.manage"); if (!access.ok) return access.response; const organisationId = access.organisationId; const result = await (supabase as any).from("leo_talent_candidate_documents").select("id, file_path").eq("id", documentId).eq("candidate_id", id).eq("organisation_id", organisationId).maybeSingle(); if (result.error) throw new Error(result.error.message); if (!result.data) return NextResponse.json({ success: false, error: "The candidate document was not found." }, { status: 404 }); const removed = await getAdminClient().storage.from("leo-talent-candidate-documents").remove([text(result.data.file_path)]); if (removed.error) throw new Error(removed.error.message); const deleted = await (supabase as any).from("leo_talent_candidate_documents").delete().eq("id", documentId).eq("candidate_id", id).eq("organisation_id", organisationId); if (deleted.error) throw new Error(deleted.error.message); return NextResponse.json({ success: true }); } catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Leo could not delete this candidate document." }, { status: 500 }); }
}