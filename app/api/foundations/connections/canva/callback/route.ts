import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import {
  buildCanvaPkceVerifier,
  encryptCanvaTokenPayload,
  exchangeCanvaAuthorizationCode,
  getCanvaProfile,
  getCanvaRedirectUri,
  getCanvaUser,
  verifyCanvaState,
} from "@/lib/canva/auth";

export const dynamic = "force-dynamic";

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

function redirectToConnections(origin: string, result: string) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/foundations/connections?canva=${encodeURIComponent(result)}`,
      origin,
    ),
  );
}

async function markSessionFailed(
  admin: ReturnType<typeof getAdminClient>,
  sessionId: number,
  errorCode: string,
  errorMessage: string,
) {
  await admin
    .from("connection_auth_sessions")
    .update({
      status: "Failed",
      error_code: errorCode,
      error_message: errorMessage.slice(0, 1000),
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const admin = getAdminClient();
  let sessionId: number | null = null;

  try {
    const code = requestUrl.searchParams.get("code")?.trim() || "";
    const state = requestUrl.searchParams.get("state")?.trim() || "";
    const canvaError = requestUrl.searchParams.get("error")?.trim() || "";
    const canvaErrorDescription =
      requestUrl.searchParams.get("error_description")?.trim() || "";

    const stateParts = state.split(".");

    if (stateParts.length !== 2) {
      return redirectToConnections(origin, "invalid-state");
    }

    const [sessionReference] = stateParts;

    const sessionResult = await admin
      .from("connection_auth_sessions")
      .select("*")
      .eq("session_reference", sessionReference)
      .maybeSingle();

    if (sessionResult.error || !sessionResult.data) {
      return redirectToConnections(origin, "session-not-found");
    }

    const session = sessionResult.data;
    sessionId = session.id;

    if (
      !verifyCanvaState(
        state,
        session.session_reference,
        session.state_hash,
      )
    ) {
      await markSessionFailed(
        admin,
        session.id,
        "invalid_state",
        "The Canva callback state did not match the secure LEO session.",
      );
      return redirectToConnections(origin, "invalid-state");
    }

    if (session.status !== "Authorisation Started") {
      return redirectToConnections(origin, "session-used");
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await admin
        .from("connection_auth_sessions")
        .update({
          status: "Expired",
          error_code: "session_expired",
          error_message: "The Canva authorisation session expired.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      return redirectToConnections(origin, "session-expired");
    }

    if (canvaError) {
      await markSessionFailed(
        admin,
        session.id,
        canvaError,
        canvaErrorDescription ||
          "Canva authorisation was cancelled or refused.",
      );

      if (session.connection_id) {
        await admin
          .from("organisation_connections")
          .update({
            status: "Connection Failed",
            health_status: "Authentication Failed",
            last_error_code: canvaError,
            last_error_message:
              canvaErrorDescription ||
              "Canva authorisation was not completed.",
            last_error_at: new Date().toISOString(),
          })
          .eq("id", session.connection_id)
          .eq("organisation_id", session.organisation_id);
      }

      return redirectToConnections(origin, "authorisation-cancelled");
    }

    if (!code) {
      await markSessionFailed(
        admin,
        session.id,
        "missing_code",
        "Canva did not return an authorisation code.",
      );
      return redirectToConnections(origin, "missing-code");
    }

    if (!session.connection_id) {
      await markSessionFailed(
        admin,
        session.id,
        "missing_connection",
        "The Canva authorisation session is not linked to a connection.",
      );
      return redirectToConnections(origin, "missing-connection");
    }

    const redirectUri = session.redirect_uri || getCanvaRedirectUri();
    const codeVerifier = buildCanvaPkceVerifier(
      session.session_reference,
      session.state_hash,
    );

    await admin
      .from("connection_auth_sessions")
      .update({ status: "Callback Received" })
      .eq("id", session.id);

    let tokenData;

    try {
      tokenData = await exchangeCanvaAuthorizationCode({
        code,
        codeVerifier,
        redirectUri,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Canva did not issue an access token.";

      await markSessionFailed(
        admin,
        session.id,
        "token_exchange_failed",
        message,
      );

      await admin
        .from("organisation_connections")
        .update({
          status: "Connection Failed",
          health_status: "Authentication Failed",
          last_error_code: "token_exchange_failed",
          last_error_message: message,
          last_error_at: new Date().toISOString(),
        })
        .eq("id", session.connection_id)
        .eq("organisation_id", session.organisation_id);

      return redirectToConnections(origin, "token-exchange-failed");
    }

    const [userResult, profileResult] = await Promise.all([
      getCanvaUser(tokenData.access_token!),
      getCanvaProfile(tokenData.access_token!),
    ]);

    const userId = userResult.team_user?.user_id || null;
    const teamId = userResult.team_user?.team_id || null;
    const displayName =
      profileResult.profile?.display_name || "Canva";

    const expiresIn =
      typeof tokenData.expires_in === "number"
        ? tokenData.expires_in
        : 14400;
    const tokenExpiresAt = new Date(
      Date.now() + expiresIn * 1000,
    ).toISOString();
    const authorisedScopes = tokenData.scope
      ? tokenData.scope.split(" ").map((item) => item.trim()).filter(Boolean)
      : Array.isArray(session.requested_scopes)
        ? session.requested_scopes
        : [];

    const encryptedSecret = encryptCanvaTokenPayload({
      provider: "canva",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || "Bearer",
      scope: tokenData.scope || null,
      expires_at: tokenExpiresAt,
      created_at: new Date().toISOString(),
    });

    const now = new Date().toISOString();

    const connectionUpdate = await admin
      .from("organisation_connections")
      .update({
        account_display_name: displayName,
        external_account_id: userId,
        external_tenant_id: null,
        external_workspace_id: teamId,
        connected_by_user_id: session.initiated_by_user_id,
        connection_owner_user_id: session.initiated_by_user_id,
        connected_at: now,
        disconnected_at: null,
        status: "Connected",
        health_status: "Healthy",
        token_expires_at: tokenExpiresAt,
        secret_reference: encryptedSecret,
        authorised_scopes: authorisedScopes,
        requested_scopes: session.requested_scopes || [],
        last_successful_use_at: now,
        last_failed_use_at: null,
        reconnect_required_at: null,
        last_error_code: null,
        last_error_message: null,
        last_error_at: null,
      })
      .eq("id", session.connection_id)
      .eq("organisation_id", session.organisation_id)
      .select("*")
      .single();

    if (connectionUpdate.error || !connectionUpdate.data) {
      throw new Error(
        connectionUpdate.error?.message ||
          "The Canva connection could not be saved.",
      );
    }

    await admin
      .from("connection_auth_sessions")
      .update({
        status: "Completed",
        completed_at: now,
        error_code: null,
        error_message: null,
      })
      .eq("id", session.id);

    const activityResult = await admin
      .from("connection_activity_history")
      .insert({
        organisation_id: session.organisation_id,
        performed_by_user_id: session.initiated_by_user_id,
        provider_id: session.provider_id,
        connection_id: session.connection_id,
        job_id: null,
        module_key: "Foundations",
        activity_type: "Connection Completed",
        activity_summary: "Canva was connected securely.",
        activity_details: {
          account_display_name: displayName,
          external_account_id: userId,
          external_workspace_id: teamId,
          authorised_scopes: authorisedScopes,
        },
      });

    if (activityResult.error) {
      console.warn(
        "Canva connection activity could not be recorded:",
        activityResult.error,
      );
    }

    return redirectToConnections(origin, "connected");
  } catch (error) {
    console.error("Canva connection callback failed:", error);

    if (sessionId) {
      await markSessionFailed(
        admin,
        sessionId,
        "callback_failed",
        error instanceof Error
          ? error.message
          : "The Canva callback could not be completed.",
      );
    }

    return redirectToConnections(origin, "callback-failed");
  }
}