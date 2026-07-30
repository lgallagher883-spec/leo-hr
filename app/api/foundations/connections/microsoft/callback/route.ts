import {
  createCipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type MicrosoftTokenResponse = {
  token_type?: string;
  scope?: string;
  expires_in?: number;
  ext_expires_in?: number;
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type MicrosoftUser = {
  id?: string;
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
};

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

function getMicrosoftClientSecret() {
  return (
    process.env.MICROSOFT_CLIENT_SECRET ||
    process.env.AZURE_AD_CLIENT_SECRET ||
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

  const plaintext = JSON.stringify(payload);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
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

function decodeJwtPayload(
  token: string | undefined,
): Record<string, unknown> {
  if (!token) {
    return {};
  }

  try {
    const parts = token.split(".");

    if (parts.length < 2) {
      return {};
    }

    return JSON.parse(
      Buffer.from(parts[1], "base64url").toString(
        "utf8",
      ),
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function redirectToConnections(
  origin: string,
  result: string,
) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/foundations/connections?microsoft=${encodeURIComponent(
        result,
      )}`,
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

    const microsoftError =
      requestUrl.searchParams.get("error")?.trim() || "";

    const microsoftErrorDescription =
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

    const [sessionReference, stateHash] = stateParts;

    const sessionResult = await admin
      .from("connection_auth_sessions")
      .select("*")
      .eq("session_reference", sessionReference)
      .maybeSingle();

    if (
      sessionResult.error ||
      !sessionResult.data
    ) {
      return redirectToConnections(
        origin,
        "session-not-found",
      );
    }

    const session = sessionResult.data;
    sessionId = session.id;

    if (session.state_hash !== stateHash) {
      await markSessionFailed(
        admin,
        session.id,
        "invalid_state",
        "The Microsoft callback state did not match the secure LEO session.",
      );

      return redirectToConnections(
        origin,
        "invalid-state",
      );
    }

    if (
      session.status !== "Authorisation Started"
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
            "The Microsoft authorisation session expired.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      return redirectToConnections(
        origin,
        "session-expired",
      );
    }

    if (microsoftError) {
      await markSessionFailed(
        admin,
        session.id,
        microsoftError,
        microsoftErrorDescription ||
          "Microsoft authorisation was cancelled or refused.",
      );

      if (session.connection_id) {
        await admin
          .from("organisation_connections")
          .update({
            status: "Connection Failed",
            health_status: "Authentication Failed",
            last_error_code: microsoftError,
            last_error_message:
              microsoftErrorDescription ||
              "Microsoft authorisation was not completed.",
            last_error_at: new Date().toISOString(),
          })
          .eq("id", session.connection_id);
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
        "Microsoft did not return an authorisation code.",
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
        "The Microsoft authorisation session is not linked to a connection.",
      );

      return redirectToConnections(
        origin,
        "missing-connection",
      );
    }

    const clientId = getMicrosoftClientId();
    const clientSecret = getMicrosoftClientSecret();
    const tenantId = getMicrosoftTenantId();

    if (!clientId || !clientSecret) {
      throw new Error(
        "Microsoft OAuth credentials are not configured.",
      );
    }

    const redirectUri =
      session.redirect_uri ||
      new URL(
        "/api/foundations/connections/microsoft/callback",
        origin,
      ).toString();

    await admin
      .from("connection_auth_sessions")
      .update({
        status: "Callback Received",
      })
      .eq("id", session.id);

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(
        tenantId,
      )}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          scope: Array.isArray(
            session.requested_scopes,
          )
            ? session.requested_scopes.join(" ")
            : "openid profile email offline_access User.Read",
        }),
        cache: "no-store",
      },
    );

    const tokenData =
      (await tokenResponse.json()) as MicrosoftTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      const tokenError =
        tokenData.error || "token_exchange_failed";

      const tokenErrorDescription =
        tokenData.error_description ||
        "Microsoft did not issue an access token.";

      await markSessionFailed(
        admin,
        session.id,
        tokenError,
        tokenErrorDescription,
      );

      await admin
        .from("organisation_connections")
        .update({
          status: "Connection Failed",
          health_status: "Authentication Failed",
          last_error_code: tokenError,
          last_error_message: tokenErrorDescription,
          last_error_at: new Date().toISOString(),
        })
        .eq("id", session.connection_id);

      return redirectToConnections(
        origin,
        "token-exchange-failed",
      );
    }

    const profileResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const profile = profileResponse.ok
      ? ((await profileResponse.json()) as MicrosoftUser)
      : {};

    const jwtPayload = decodeJwtPayload(
      tokenData.id_token,
    );

    const externalTenantId =
      typeof jwtPayload.tid === "string"
        ? jwtPayload.tid
        : null;

    const accountDisplayName =
      profile.displayName ||
      profile.mail ||
      profile.userPrincipalName ||
      "Microsoft 365";

    const expiresIn =
      typeof tokenData.expires_in === "number"
        ? tokenData.expires_in
        : 3600;

    const tokenExpiresAt = new Date(
      Date.now() + expiresIn * 1000,
    ).toISOString();

    const authorisedScopes = tokenData.scope
      ? tokenData.scope
          .split(" ")
          .map((scope) => scope.trim())
          .filter(Boolean)
      : Array.isArray(session.requested_scopes)
        ? session.requested_scopes
        : [];

    /*
     * The value stored in secret_reference is encrypted using
     * AES-256-GCM. Raw Microsoft tokens are never stored in plain text.
     */
    const encryptedSecret = encryptTokenPayload({
      provider: "microsoft",
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
        account_display_name: accountDisplayName,
        external_account_id: profile.id || null,
        external_tenant_id: externalTenantId,
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
          "The Microsoft connection could not be saved.",
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
        "Microsoft OAuth session completion could not be recorded:",
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
          "Microsoft 365 was connected securely.",
        activity_details: {
          account_display_name: accountDisplayName,
          external_account_id: profile.id || null,
          external_tenant_id: externalTenantId,
          authorised_scopes: authorisedScopes,
        },
      });

    if (activityResult.error) {
      console.warn(
        "Microsoft connection activity could not be recorded:",
        activityResult.error,
      );
    }

    return redirectToConnections(
      origin,
      "connected",
    );
  } catch (error) {
    console.error(
      "Microsoft connection callback failed:",
      error,
    );

    if (sessionId) {
      await markSessionFailed(
        admin,
        sessionId,
        "callback_failed",
        error instanceof Error
          ? error.message
          : "The Microsoft callback could not be completed.",
      );
    }

    return redirectToConnections(
      origin,
      "callback-failed",
    );
  }
}