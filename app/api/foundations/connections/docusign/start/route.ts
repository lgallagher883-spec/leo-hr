import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DOCUSIGN_SCOPES = ["signature", "extended"];

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getDocuSignClientId() {
  return process.env.DOCUSIGN_CLIENT_ID || "";
}

function getDocuSignAuthBaseUrl() {
  return (
    process.env.DOCUSIGN_AUTH_BASE_URL ||
    "https://account-d.docusign.com"
  ).replace(/\/+$/, "");
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const sessionReference =
      requestUrl.searchParams.get("session")?.trim() || "";

    if (!sessionReference) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/foundations/connections?docusign=invalid-session",
          requestUrl.origin,
        ),
      );
    }

    const clientId = getDocuSignClientId();

    if (!clientId) {
      throw new Error(
        "DOCUSIGN_CLIENT_ID is not configured.",
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/auth/login", requestUrl.origin),
      );
    }

    const admin = getAdminClient();

    const sessionResult = await admin
      .from("connection_auth_sessions")
      .select("*")
      .eq("session_reference", sessionReference)
      .maybeSingle();

    if (sessionResult.error || !sessionResult.data) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/foundations/connections?docusign=session-not-found",
          requestUrl.origin,
        ),
      );
    }

    const session = sessionResult.data;

    if (
      session.initiated_by_user_id &&
      session.initiated_by_user_id !== user.id
    ) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/foundations/connections?docusign=access-denied",
          requestUrl.origin,
        ),
      );
    }

    if (
      session.status !== "Created" &&
      session.status !== "Authorisation Started"
    ) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/foundations/connections?docusign=session-used",
          requestUrl.origin,
        ),
      );
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await admin
        .from("connection_auth_sessions")
        .update({
          status: "Expired",
          error_code: "session_expired",
          error_message:
            "The DocuSign authorisation session expired.",
        })
        .eq("id", session.id);

      return NextResponse.redirect(
        new URL(
          "/dashboard/foundations/connections?docusign=session-expired",
          requestUrl.origin,
        ),
      );
    }

    const callbackUrl = new URL(
      "/api/foundations/connections/docusign/callback",
      requestUrl.origin,
    ).toString();

    const state = `${session.session_reference}.${session.state_hash}`;

    const sessionUpdate = await admin
      .from("connection_auth_sessions")
      .update({
        status: "Authorisation Started",
        redirect_uri: callbackUrl,
        requested_scopes: DOCUSIGN_SCOPES,
        error_code: null,
        error_message: null,
      })
      .eq("id", session.id);

    if (sessionUpdate.error) {
      throw new Error(
        sessionUpdate.error.message ||
          "The DocuSign authorisation session could not be updated.",
      );
    }

    const authorisationUrl = new URL(
      `${getDocuSignAuthBaseUrl()}/oauth/auth`,
    );

    authorisationUrl.searchParams.set("response_type", "code");
    authorisationUrl.searchParams.set("scope", DOCUSIGN_SCOPES.join(" "));
    authorisationUrl.searchParams.set("client_id", clientId);
    authorisationUrl.searchParams.set("redirect_uri", callbackUrl);
    authorisationUrl.searchParams.set("state", state);

    return NextResponse.redirect(authorisationUrl);
  } catch (error) {
    console.error("DocuSign connection start failed:", error);

    const requestUrl = new URL(request.url);

    return NextResponse.redirect(
      new URL(
        "/dashboard/foundations/connections?docusign=start-failed",
        requestUrl.origin,
      ),
    );
  }
}