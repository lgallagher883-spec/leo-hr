import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import {
  buildZoomPkceVerifier,
  encryptZoomTokenPayload,
  exchangeZoomAuthorizationCode,
  verifyZoomState,
} from "@/lib/zoom/auth";

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
      `/dashboard/foundations/connections?zoom=${encodeURIComponent(result)}`,
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
    const code =
      requestUrl.searchParams.get("code")?.trim() || "";
    const state =
      requestUrl.searchParams.get("state")?.trim() || "";
    const zoomError =
      requestUrl.searchParams.get("error")?.trim() || "";
    const zoomErrorDescription =
      requestUrl.searchParams
        .get("error_description")
        ?.trim() || "";

    const stateParts = state.split(".");

    if (stateParts.length !== 2) {
      return redirectToConnections(
        origin,
        "invalid-state",
      );
    }

    const [sessionReference] = stateParts;

    const sessionResult = await admin
      .from("connection_auth_sessions")
      .select("*")
      .eq("session_reference", sessionReference)
      .maybeSingle();

    if (sessionResult.error || !sessionResult.data) {
      return redirectToConnections(
        origin,
        "session-not-found",
      );
    }

    const session = sessionResult.data;
    sessionId = session.id;

    if (
      !verifyZoomState(
        state,
        session.session_reference,
        session.state_hash,
      )
    ) {
      await markSessionFailed(
        admin,
        session.id,
        "invalid_state",
        "The Zoom callback state did not match the secure LEO session.",
      );

      return redirectToConnections(
        origin,
        "invalid-state",
      );
    }

    if (session.status !== "Authorisation Started") {
      return redirectToConnections(
        origin,
        "session-used",
      );
    }

    if (
      new Date(session.expires_at).getTime() <=
      Date.now()
    ) {
      await admin
        .from("connection_auth_sessions")
        .update({
          status: "Expired",
          error_code: "session_expired",
          error_message:
            "The Zoom authorisation session expired.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      return redirectToConnections(
        origin,
        "session-expired",
      );
    }

    if (zoomError) {
      await markSessionFailed(
        admin,
        session.id,
        zoomError,
        zoomErrorDescription ||
          "Zoom authorisation was cancelled or refused.",
      );

      if (session.connection_id) {
        await admin
          .from("organisation_connections")
          .update({
            status: "Connection Failed",
            health_status:
              "Authentication Failed",
            last_error_code: zoomError,
            last_error_message:
              zoomErrorDescription ||
              "Zoom authorisation was not completed.",
            last_error_at:
              new Date().toISOString(),
          })
          .eq("id", session.connection_id)
          .eq(
            "organisation_id",
            session.organisation_id,
          );
      }

      return redirectToConnections(
        origin,
        "authorisation-cancelled",
      );
    }

    if (!code) {
      await markSessionFailed(
        admin,
        session.id,
        "missing_code",
        "Zoom did not return an authorisation code.",
      );

      return redirectToConnections(
        origin,
        "missing-code",
      );
    }

    if (!session.connection_id) {
      await markSessionFailed(
        admin,
        session.id,
        "missing_connection",
        "The Zoom authorisation session is not linked to a connection.",
      );

      return redirectToConnections(
        origin,
        "missing-connection",
      );
    }

    const redirectUri =
      typeof session.redirect_uri === "string"
        ? session.redirect_uri.trim()
        : "";

    if (!redirectUri) {
      await markSessionFailed(
        admin,
        session.id,
        "missing_redirect_uri",
        "The Zoom authorisation session does not contain the redirect URI used to start OAuth.",
      );

      return redirectToConnections(
        origin,
        "missing-redirect-uri",
      );
    }

    const codeVerifier =
      buildZoomPkceVerifier(
        session.session_reference,
        session.state_hash,
      );

    await admin
      .from("connection_auth_sessions")
      .update({
        status: "Callback Received",
      })
      .eq("id", session.id);

    let tokenData;

    try {
      tokenData =
        await exchangeZoomAuthorizationCode({
          code,
          codeVerifier,
          redirectUri,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Zoom did not issue an access token.";

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
          health_status:
            "Authentication Failed",
          last_error_code:
            "token_exchange_failed",
          last_error_message: message,
          last_error_at:
            new Date().toISOString(),
        })
        .eq("id", session.connection_id)
        .eq(
          "organisation_id",
          session.organisation_id,
        );

      return redirectToConnections(
        origin,
        "token-exchange-failed",
      );
    }

    const externalAccountId = null;
    const externalWorkspaceId = null;
    const displayName = "Zoom";

    const expiresIn =
      typeof tokenData.expires_in === "number"
        ? tokenData.expires_in
        : 3600;

    const tokenExpiresAt = new Date(
      Date.now() + expiresIn * 1000,
    ).toISOString();

    const authorisedScopes = tokenData.scope
      ? tokenData.scope
          .split(/[,\s]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : Array.isArray(session.requested_scopes)
        ? session.requested_scopes
        : [];

    const encryptedSecret =
      encryptZoomTokenPayload({
        provider: "zoom",
        access_token:
          tokenData.access_token,
        refresh_token:
          tokenData.refresh_token || null,
        token_type:
          tokenData.token_type || "Bearer",
        scope: tokenData.scope || null,
        expires_at: tokenExpiresAt,
        created_at:
          new Date().toISOString(),
        api_url:
          tokenData.api_url || null,
      });

    const now = new Date().toISOString();

    const connectionUpdate = await admin
      .from("organisation_connections")
      .update({
        account_display_name: displayName,
        external_account_id:
          externalAccountId,
        external_tenant_id: null,
        external_workspace_id:
          externalWorkspaceId,
        connected_by_user_id:
          session.initiated_by_user_id,
        connection_owner_user_id:
          session.initiated_by_user_id,
        connected_at: now,
        disconnected_at: null,
        status: "Connected",
        health_status: "Healthy",
        token_expires_at: tokenExpiresAt,
        secret_reference: encryptedSecret,
        authorised_scopes:
          authorisedScopes,
        requested_scopes:
          session.requested_scopes || [],
        last_successful_use_at: now,
        last_failed_use_at: null,
        reconnect_required_at: null,
        last_error_code: null,
        last_error_message: null,
        last_error_at: null,
      })
      .eq("id", session.connection_id)
      .eq(
        "organisation_id",
        session.organisation_id,
      )
      .select("*")
      .single();

    if (
      connectionUpdate.error ||
      !connectionUpdate.data
    ) {
      throw new Error(
        connectionUpdate.error?.message ||
          "The Zoom connection could not be saved.",
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
        organisation_id:
          session.organisation_id,
        performed_by_user_id:
          session.initiated_by_user_id,
        provider_id:
          session.provider_id,
        connection_id:
          session.connection_id,
        job_id: null,
        module_key: "Foundations",
        activity_type:
          "Connection Completed",
        activity_summary:
          "Zoom was connected securely.",
        activity_details: {
          account_display_name:
            displayName,
          external_account_id:
            externalAccountId,
          external_workspace_id:
            externalWorkspaceId,
          authorised_scopes:
            authorisedScopes,
        },
      });

    if (activityResult.error) {
      console.warn(
        "Zoom connection activity could not be recorded:",
        activityResult.error,
      );
    }

    return redirectToConnections(
      origin,
      "connected",
    );
  } catch (error) {
    console.error(
      "Zoom connection callback failed:",
      error,
    );

    if (sessionId) {
      await markSessionFailed(
        admin,
        sessionId,
        "callback_failed",
        error instanceof Error
          ? error.message
          : "The Zoom callback could not be completed.",
      );
    }

    return redirectToConnections(
      origin,
      "callback-failed",
    );
  }
}