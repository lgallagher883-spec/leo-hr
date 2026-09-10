import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function invitationErrorPage(message: string, status = 400) {
  const safeMessage = escapeHtml(message);

  return htmlResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Leo HR invitation</title></head><body style="margin:0;font-family:Segoe UI,Arial,sans-serif;background:#f8f5fb;color:#2f2635"><main style="min-height:100vh;display:grid;place-items:center;padding:24px"><section style="max-width:560px;background:#fff;border:1px solid #e8dff0;border-radius:18px;padding:30px;box-shadow:0 20px 50px rgba(55,37,73,.1);text-align:center"><h1 style="margin:0 0 12px;font-size:28px">We could not open this invitation</h1><p style="margin:0;color:#6f7888;line-height:1.6">${safeMessage}</p></section></main></body></html>`,
    status,
  );
}

function invitationContinuePage(tokenHash: string) {
  const safeTokenHash = escapeHtml(tokenHash);

  return htmlResponse(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Continue to Leo HR</title>
</head>
<body style="margin:0;font-family:Segoe UI,Arial,sans-serif;background:#f8f5fb;color:#2f2635">
  <main style="min-height:100vh;display:grid;place-items:center;padding:24px">
    <section style="width:min(520px,100%);background:#fff;border:1px solid #e8dff0;border-radius:18px;padding:30px;box-shadow:0 20px 50px rgba(55,37,73,.1);text-align:center">
      <div style="display:inline-flex;margin-bottom:14px;padding:7px 11px;border:1px solid #e2d6eb;border-radius:999px;background:#f8f3fc;color:#6e5084;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase">Secure invitation</div>
      <h1 style="margin:0 0 12px;font-size:30px">Continue to Leo HR</h1>
      <p style="margin:0 0 24px;color:#6f7888;line-height:1.6">Click below to verify your invitation and continue setting up your access.</p>
      <form method="post" action="/auth/invite-confirm">
        <input type="hidden" name="token_hash" value="${safeTokenHash}">
        <input type="hidden" name="type" value="invite">
        <button type="submit" style="width:100%;min-height:51px;border:0;border-radius:11px;background:linear-gradient(135deg,#755194,#62407f);color:#fff;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 10px 22px rgba(87,55,116,.2)">Verify invitation and continue</button>
      </form>
      <p style="margin:18px 0 0;color:#7a8291;font-size:12px;line-height:1.55">For your security, the invitation is only verified after you click the button above.</p>
    </section>
  </main>
</body>
</html>`);
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

  // Important: do not verify the token on GET. Corporate email security
  // scanners frequently pre-open links. Consuming the one-time invite token
  // during that automated GET would make the link fail for the actual user.
  return invitationContinuePage(tokenHash);
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/x-www-form-urlencoded") && !contentType.includes("multipart/form-data")) {
    return invitationErrorPage("This invitation request is invalid.", 400);
  }

  const formData = await request.formData();
  const tokenHashValue = formData.get("token_hash");
  const typeValue = formData.get("type");
  const tokenHash = typeof tokenHashValue === "string" ? tokenHashValue : "";
  const type = typeof typeValue === "string" ? typeValue : "";

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
    303,
  );
}
