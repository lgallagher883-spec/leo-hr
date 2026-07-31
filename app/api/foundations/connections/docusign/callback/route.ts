import {
  createCipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type DocuSignTokenResponse = {
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

type DocuSignUserInfo = {
  sub?: string;
  name?: string;
  email?: string;
  accounts?: Array<{
    account_id?: string;
    account_name?: string;
    base_uri?: string;
    is_default?: boolean;
  }>;
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

function getDocuSignClientId() {
  return process.env.DOCUSIGN_CLIENT_ID || "";
}

function getDocuSignClientSecret() {
  return process.env.DOCUSIGN_CLIENT_SECRET || "";
}

function getDocuSignAuthBaseUrl() {
  return (
    process.env.DOCUSIGN_AUTH_BASE_URL ||
    "https://account-d.docusign.com"
  ).replace(/\/+$/, "");
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
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  return [
    "leo-oauth-v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function redirectToConnections(
  origin: string,
  result: string,
) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/foundations/connections?docusign=${encodeURIComponent(
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
    const providerError =
      requestUrl.searchParams.get("error")?.trim() || "";
    const providerErrorDescription =
      requestUrl.searchParams
        .get("error_description")
        ?.trim() || "";

    const stateParts = state.split(".");

    if (stateParts.length !== 2) {
      return redirectToConnections(origin, "invalid-state");
    }

    const [sessionReference, stateHash] = stateParts;

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

    if (session.state_hash !== stateHash) {
      await markSessionFailed(
        admin,
        session.id,
        "invalid_state",
        "The DocuSign callback state did not match the secure LEO session.",
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
          error_message:
            "The DocuSign authorisation session expired.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", session.id);

      return redirectToConnections(origin, "session-expired");
    }

    if (providerError) {
      await markSessionFailed(
        admin,
        session.id,
        providerError,
        providerErrorDescription ||
          "DocuSign authorisation was cancelled or refused.",
      );

      if (session.connection_id) {
        await admin
          .from("organisation_connections")
          .update({
            status: "Connection Failed",
            health_status: "Authentication Failed",
            last_error_code: providerError,
            last_error_message:
              providerErrorDescription ||
              "DocuSign authorisation was not completed.",
            last_error_at: new Date().toISOString(),
          })
          .eq("id", session.connection_id);
      }

      return redirectToConnections(
        origin,
        "authorisation-cancelled",
      );
    }

    if (!code || !session.connection_id) {
      await markSessionFailed(
        admin,
        session.id,
        "missing_callback_data",
        "DocuSign did not return the required callback information.",
      );

      return redirectToConnections(origin, "missing-code");
    }

    const clientId = getDocuSignClientId();
    const clientSecret = getDocuSignClientSecret();

    if (!clientId || !clientSecret) {
      throw new Error(
        "DocuSign OAuth credentials are not configured.",
      );
    }

    const redirectUri =
      session.redirect_uri ||
      new URL(
        "/api/foundations/connections/docusign/callback",
        origin,
      ).toString();

    await admin
      .from("connection_auth_sessions")
      .update({ status: "Callback Received" })
      .eq("id", session.id);

    const basicCredentials = Buffer.from(
      `${clientId}:${clientSecret}`,
      "utf8",
    ).toString("base64");

    const tokenResponse = await fetch(
      `${getDocuSignAuthBaseUrl()}/oauth/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicCredentials}`,
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
        cache: "no-store",
      },
    );

    const tokenData =
      (await tokenResponse.json()) as DocuSignTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      const tokenError =
        tokenData.error || "token_exchange_failed";
      const tokenErrorDescription =
        tokenData.error_description ||
        "DocuSign did not issue an access token.";

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

    const userInfoResponse = await fetch(
      `${getDocuSignAuthBaseUrl()}/oauth/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!userInfoResponse.ok) {
      throw new Error(
        "DocuSign authorised the account but did not return account information.",
      );
    }

    const userInfo =
      (await userInfoResponse.json()) as DocuSignUserInfo;

    const account =
      userInfo.accounts?.find((item) => item.is_default) ||
      userInfo.accounts?.[0];

    if (
      !account?.account_id ||
      !account.base_uri
    ) {
      throw new Error(
        "DocuSign did not return an eligible eSignature account.",
      );
    }

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

    const encryptedSecret = encryptTokenPayload({
      provider: "docusign",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_type: tokenData.token_type || "Bearer",
      scope: tokenData.scope || null,
      expires_at: tokenExpiresAt,
      created_at: new Date().toISOString(),
      account_id: account.account_id,
      base_uri: account.base_uri,
    });

    const now = new Date().toISOString();
    const accountDisplayName =
      account.account_name ||
      userInfo.name ||
      userInfo.email ||
      "DocuSign";

    const connectionUpdate = await admin
      .from("organisation_connections")
      .update({
        account_display_name: accountDisplayName,
        external_account_id: account.account_id,
        external_tenant_id: userInfo.sub || null,
        external_workspace_id: account.base_uri,
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

    if (connectionUpdate.error || !connectionUpdate.data) {
      throw new Error(
        connectionUpdate.error?.message ||
          "The DocuSign connection could not be saved.",
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

    await admin
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
          "DocuSign was connected securely.",
        activity_details: {
          account_display_name: accountDisplayName,
          account_id: account.account_id,
          base_uri: account.base_uri,
          authorised_scopes: authorisedScopes,
        },
      });

    return redirectToConnections(origin, "connected");
  } catch (error) {
    console.error(
      "DocuSign connection callback failed:",
      error,
    );

    if (sessionId) {
      await markSessionFailed(
        admin,
        sessionId,
        "callback_failed",
        error instanceof Error
          ? error.message
          : "The DocuSign callback could not be completed.",
      );
    }

    return redirectToConnections(origin, "callback-failed");
  }
}