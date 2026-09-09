import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function invitationErrorPage(message: string, status = 400) {
  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Leo HR invitation</title></head><body style="margin:0;font-family:Segoe UI,Arial,sans-serif;background:#f8f5fb;color:#2f2635"><main style="min-height:100vh;display:grid;place-items:center;padding:24px"><section style="max-width:560px;background:#fff;border:1px solid #e8dff0;border-radius:18px;padding:30px;box-shadow:0 20px 50px rgba(55,37,73,.1);text-align:center"><h1 style="margin:0 0 12px;font-size:28px">We could not open this invitation</h1><p style="margin:0;color:#6f7888;line-height:1.6">${safeMessage}</p></section></main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (!tokenHash || type !== "invite") {
    return invitationErrorPage(
      "This invitation link is incomplete. Please use the newest invitation email you received.",
    );
  }

  const supabase = await createClient();

  const {
    data: { session, user },
    error,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "invite",
  });

  if (error || !session || !user) {
    console.error("Invitation token verification failed:", error);
    return invitationErrorPage(
      "This invitation link is invalid or has expired. Ask your organisation to resend the invitation.",
      401,
    );
  }

  const invitationId =
    typeof user.user_metadata?.organisation_invitation_id === "string"
      ? user.user_metadata.organisation_invitation_id
      : null;

  if (!invitationId) {
    await supabase.auth.signOut();
    return invitationErrorPage(
      "This account is not linked to a Leo HR organisation invitation. Ask your organisation to resend the invitation.",
      403,
    );
  }

  return NextResponse.redirect(
    new URL("/auth/accept-invitation", requestUrl.origin),
  );
}
