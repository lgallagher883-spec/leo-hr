import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MICROSOFT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "Calendars.ReadWrite",
  "Mail.Read",
  "Mail.Send",
  "Files.ReadWrite",
  "OnlineMeetings.ReadWrite",
];

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

function getMicrosoftClientId() {
  return (
    process.env.MICROSOFT_CLIENT_ID ||
    process.env.AZURE_AD_CLIENT_ID ||
    ""
  );
}

function getMicrosoftTenantId() {
  return (
    process.env.MICROSOFT_TENANT_ID ||
    process.env.AZURE_AD_TENANT_ID ||
    "common"
  );
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const sessionReference =
      requestUrl.searchParams.get("session")?.trim() || "";

    if (!sessionReference) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/foundations/connections?microsoft=invalid-session",
          requestUrl.origin,
        ),
      );
    }

    const clientId = getMicrosoftClientId();

    if (!clientId) {
      throw new Error(
        "Microsoft client ID is not configured.",
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

    if (
      sessionResult.error ||
      !sessionResult.data
    ) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/foundations/connections?microsoft=session-not-found",
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
          "/dashboard/foundations/connections?microsoft=access-denied",
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
          "/dashboard/foundations/connections?microsoft=session-used",
          requestUrl.origin,
        ),
      );
    }

    if (
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      await admin
        .from("connection_auth_sessions")
        .update({
          status: "Expired",
          error_code: "session_expired",
          error_message:
            "The Microsoft authorisation session expired.",
        })
        .eq("id", session.id);

      return NextResponse.redirect(
        new URL(
          "/dashboard/foundations/connections?microsoft=session-expired",
          requestUrl.origin,
        ),
      );
    }

    const callbackUrl = new URL(
      "/api/foundations/connections/microsoft/callback",
      requestUrl.origin,
    ).toString();

    /*
     * The state contains both values already generated and stored
     * by LEO. The callback verifies them against the database.
     */
    const state = `${session.session_reference}.${session.state_hash}`;

    const sessionUpdate = await admin
      .from("connection_auth_sessions")
      .update({
        status: "Authorisation Started",
        redirect_uri: callbackUrl,
        requested_scopes: MICROSOFT_SCOPES,
        error_code: null,
        error_message: null,
      })
      .eq("id", session.id);

    if (sessionUpdate.error) {
      throw new Error(
        sessionUpdate.error.message ||
          "The Microsoft authorisation session could not be updated.",
      );
    }

    const tenantId = getMicrosoftTenantId();

    const authorisationUrl = new URL(
      `https://login.microsoftonline.com/${encodeURIComponent(
        tenantId,
      )}/oauth2/v2.0/authorize`,
    );

    authorisationUrl.searchParams.set(
      "client_id",
      clientId,
    );
    authorisationUrl.searchParams.set(
      "response_type",
      "code",
    );
    authorisationUrl.searchParams.set(
      "redirect_uri",
      callbackUrl,
    );
    authorisationUrl.searchParams.set(
      "response_mode",
      "query",
    );
    authorisationUrl.searchParams.set(
      "scope",
      MICROSOFT_SCOPES.join(" "),
    );
    authorisationUrl.searchParams.set("state", state);
    authorisationUrl.searchParams.set(
      "prompt",
      "select_account",
    );

    return NextResponse.redirect(authorisationUrl);
  } catch (error) {
    console.error(
      "Microsoft connection start failed:",
      error,
    );

    const requestUrl = new URL(request.url);

    return NextResponse.redirect(
      new URL(
        "/dashboard/foundations/connections?microsoft=start-failed",
        requestUrl.origin,
      ),
    );
  }
}