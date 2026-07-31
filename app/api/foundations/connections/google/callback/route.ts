import {
  createCipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import {
  exchangeCodeForTokens,
  getGoogleProfile,
} from "@/lib/google/auth";

export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof getAdminClient>;

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getEncryptionSecret() {
  return (
    process.env.LEO_CONNECTION_ENCRYPTION_KEY ||
    process.env.CONNECTION_TOKEN_ENCRYPTION_KEY ||
    ""
  );
}

function encryptTokenPayload(
  payload: Record<string, unknown>,
) {
  const encryptionSecret = getEncryptionSecret();

  if (!encryptionSecret) {
    throw new Error(
      "LEO_CONNECTION_ENCRYPTION_KEY is not configured.",
    );
  }

  const key = createHash("sha256")
    .update(encryptionSecret)
    .digest();

  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    key,
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  const authenticationTag = cipher.getAuthTag();

  return [
    "leo-oauth-v1",
    iv.toString("base64url"),
    authenticationTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function redirectToConnections(
  origin: string,
  result: string,
) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/foundations/connections?google=${encodeURIComponent(
        result,
      )}`,
      origin,
    ),
  );
}

async function markSessionFailed(
  admin: AdminClient,
  sessionId: number,
  errorCode: string,
  errorMessage: string,
) {
  const result = await admin
    .from("connection_auth_sessions")
    .update({
      status: "Failed",
      error_code: errorCode,
      error_message: errorMessage.slice(0, 1000),
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (result.error) {
    console.warn(
      "Google OAuth failure could not be recorded:",
      result.error,
    );
  }
}

async function markConnectionFailed(
  admin: AdminClient,
  connectionId: number,
  organisationId: string,
  errorCode: string,
  errorMessage: string,
) {
  const result = await admin
    .from("organisation_connections")
    .update({
      status: "Connection Failed",
      health_status: "Authentication Failed",
      last_error_code: errorCode,
      last_error_message: errorMessage.slice(0, 1000),
      last_error_at: new Date().toISOString(),
      last_failed_use_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("organisation_id", organisationId);

  if (result.error) {
    console.warn(
      "Google connection failure could not be recorded:",
      result.error,
    );
  }
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const admin = getAdminClient();

  let sessionId: number | null = null;
  let connectionId: number | null = null;
  let organisationId: string | null = null;

  try {
    const code =
      request.nextUrl.searchParams.get("code")?.trim() ||
      "";

    const state =
      request.nextUrl.searchParams.get("state")?.trim() ||
      "";

    const googleError =
      request.nextUrl.searchParams.get("error")?.trim() ||
      "";

    const googleErrorDescription =
      request.nextUrl.searchParams
        .get("error_description")
        ?.trim() || "";

    if (!state) {
      return redirectToConnections(
        origin,
        "invalid-state",
      );
    }

    /*
     * Newer start routes use "sessionReference.stateHash".
     * The fallback also accepts the original session-reference-only
     * format so existing Google authorisation sessions remain usable.
     */
    const stateParts = state.split(".");
    const sessionReference = stateParts[0];
    const returnedStateHash =
      stateParts.length === 2 ? stateParts[1] : null;

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

    const session = sessionResult.data as any;

    sessionId = session.id;
    connectionId = session.connection_id;
    organisationId = session.organisation_id;

    if (
      returnedStateHash &&
      session.state_hash !== returnedStateHash
    ) {
      await markSessionFailed(
        admin,
        session.id,
        "invalid_state",
        "The Google callback state did not match the secure LEO session.",
      );

      return redirectToConnections(
        origin,
        "invalid-state",
      );
    }

    if (
      !["Created", "Authorisation Started"].includes(
        session.status,
      )
    ) {
      return redirectToConnections(
        origin,
        "session-used",
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
            "The Google authorisation session expired.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      return redirectToConnections(
        origin,
        "session-expired",
      );
    }

    if (googleError) {
      const message =
        googleErrorDescription ||
        "Google authorisation was cancelled or refused.";

      await markSessionFailed(
        admin,
        session.id,
        googleError,
        message,
      );

      if (
        session.connection_id &&
        session.organisation_id
      ) {
        await markConnectionFailed(
          admin,
          session.connection_id,
          session.organisation_id,
          googleError,
          message,
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
        "Google did not return an authorisation code.",
      );

      return redirectToConnections(
        origin,
        "missing-code",
      );
    }

    if (
      !session.connection_id ||
      !session.organisation_id
    ) {
      await markSessionFailed(
        admin,
        session.id,
        "missing_connection",
        "The Google authorisation session is not linked to a connection.",
      );

      return redirectToConnections(
        origin,
        "missing-connection",
      );
    }

    const callbackReceived = await admin
      .from("connection_auth_sessions")
      .update({
        status: "Callback Received",
        error_code: null,
        error_message: null,
      })
      .eq("id", session.id);

    if (callbackReceived.error) {
      throw new Error(
        callbackReceived.error.message ||
          "The Google callback could not be recorded.",
      );
    }

    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token) {
      throw new Error(
        "Google did not issue an access token.",
      );
    }

    const profile = await getGoogleProfile(
      tokens.access_token,
    );

    const now = new Date().toISOString();
    const expiresIn =
      typeof tokens.expires_in === "number"
        ? tokens.expires_in
        : 3600;

    const tokenExpiresAt = new Date(
      Date.now() + expiresIn * 1000,
    ).toISOString();

    const authorisedScopes = tokens.scope
      ? tokens.scope
          .split(" ")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : Array.isArray(session.requested_scopes)
        ? session.requested_scopes
        : [];

    const encryptedSecret = encryptTokenPayload({
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_type: tokens.token_type || "Bearer",
      scope: tokens.scope || null,
      expires_at: tokenExpiresAt,
      created_at: now,
    });

    const accountDisplayName =
      profile.name || profile.email || "Google Workspace";

    const connectionUpdate = await admin
      .from("organisation_connections")
      .update({
        account_display_name: accountDisplayName,
        external_account_id: profile.sub,
        external_tenant_id: null,
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
        authorised_scopes: authorisedScopes,
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
      .eq("organisation_id", session.organisation_id)
      .select("*")
      .single();

    if (
      connectionUpdate.error ||
      !connectionUpdate.data
    ) {
      throw new Error(
        connectionUpdate.error?.message ||
          "The Google Workspace connection could not be saved.",
      );
    }

    const sessionCompletion = await admin
      .from("connection_auth_sessions")
      .update({
        status: "Completed",
        completed_at: now,
        error_code: null,
        error_message: null,
      })
      .eq("id", session.id);

    if (sessionCompletion.error) {
      console.warn(
        "Google OAuth session completion could not be recorded:",
        sessionCompletion.error,
      );
    }

    const activityResult = await admin
      .from("connection_activity_history")
      .insert({
        organisation_id: session.organisation_id,
        performed_by_user_id:
          session.initiated_by_user_id,
        provider_id: session.provider_id,
        connection_id: session.connection_id,
        job_id: null,
        module_key: "Foundations",
        activity_type: "Connection Completed",
        activity_summary:
          "Google Workspace was connected securely.",
        activity_details: {
          account_display_name: accountDisplayName,
          account_email: profile.email,
          external_account_id: profile.sub,
          authorised_scopes: authorisedScopes,
        },
      });

    if (activityResult.error) {
      console.warn(
        "Google connection activity could not be recorded:",
        activityResult.error,
      );
    }

    return redirectToConnections(origin, "connected");
  } catch (error) {
    console.error(
      "Google authorisation callback failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "The Google callback could not be completed.";

    if (sessionId) {
      await markSessionFailed(
        admin,
        sessionId,
        "callback_failed",
        message,
      );
    }

    if (connectionId && organisationId) {
      await markConnectionFailed(
        admin,
        connectionId,
        organisationId,
        "callback_failed",
        message,
      );
    }

    return redirectToConnections(
      origin,
      "callback-failed",
    );
  }
}