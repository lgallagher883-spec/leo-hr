import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type DocuSignTokenPayload = {
  provider?: string;
  access_token?: string;
  refresh_token?: string | null;
  token_type?: string;
  scope?: string | null;
  expires_at?: string;
  created_at?: string;
  refreshed_at?: string;
  account_id?: string;
  base_uri?: string;
};

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

function getEncryptionKey() {
  const secret =
    process.env.LEO_CONNECTION_ENCRYPTION_KEY ||
    process.env.CONNECTION_TOKEN_ENCRYPTION_KEY ||
    "";

  if (!secret) {
    throw new Error(
      "LEO_CONNECTION_ENCRYPTION_KEY is not configured.",
    );
  }

  return createHash("sha256").update(secret).digest();
}

function decryptTokenPayload(
  encryptedSecret: string,
): DocuSignTokenPayload {
  const parts = encryptedSecret.split(".");

  if (parts.length !== 4 || parts[0] !== "leo-oauth-v1") {
    throw new Error(
      "The DocuSign token package is not in a recognised encrypted format.",
    );
  }

  const [, ivPart, tagPart, encryptedPart] = parts;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encryptedPart, "base64url"),
    ),
    decipher.final(),
  ]);

  return JSON.parse(
    decrypted.toString("utf8"),
  ) as DocuSignTokenPayload;
}

function encryptTokenPayload(
  payload: DocuSignTokenPayload,
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv,
  );

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

function getConnectionId(requestUrl: URL): number | null {
  const value =
    requestUrl.searchParams.get("connectionId")?.trim() || "";
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function tokenIsExpired(payload: DocuSignTokenPayload) {
  if (!payload.expires_at) return false;

  const expiry = new Date(payload.expires_at).getTime();

  return (
    Number.isFinite(expiry) &&
    expiry <= Date.now() + 5 * 60 * 1000
  );
}

async function refreshDocuSignToken(
  refreshToken: string,
): Promise<DocuSignTokenResponse> {
  const clientId = getDocuSignClientId();
  const clientSecret = getDocuSignClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error(
      "DocuSign OAuth credentials are not configured.",
    );
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8",
  ).toString("base64");

  const response = await fetch(
    `${getDocuSignAuthBaseUrl()}/oauth/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    },
  );

  const data =
    (await response.json()) as DocuSignTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        "DocuSign did not issue a refreshed access token.",
    );
  }

  return data;
}

export async function GET(request: Request) {
  const admin = getAdminClient();
  const requestUrl = new URL(request.url);
  const connectionId = getConnectionId(requestUrl);

  if (!connectionId) {
    return NextResponse.json(
      {
        success: false,
        error: "A valid DocuSign connection ID is required.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await admin
      .from("organisation_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("is_archived", false)
      .maybeSingle();

    if (result.error || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: "The DocuSign connection could not be found.",
        },
        { status: 404 },
      );
    }

    const connection = result.data;

    if (
      connection.status !== "Connected" ||
      !connection.secret_reference
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The DocuSign connection is not currently connected.",
        },
        { status: 409 },
      );
    }

    let tokenPayload = decryptTokenPayload(
      connection.secret_reference,
    );

    if (
      tokenPayload.provider !== "docusign" ||
      !tokenPayload.access_token
    ) {
      throw new Error(
        "The stored DocuSign token package is incomplete.",
      );
    }

    let tokenRefreshed = false;

    if (tokenIsExpired(tokenPayload)) {
      if (!tokenPayload.refresh_token) {
        throw new Error(
          "The DocuSign access token has expired and no refresh token is available.",
        );
      }

      const refreshed = await refreshDocuSignToken(
        tokenPayload.refresh_token,
      );

      const expiresAt = new Date(
        Date.now() +
          (typeof refreshed.expires_in === "number"
            ? refreshed.expires_in
            : 3600) *
            1000,
      ).toISOString();

      tokenPayload = {
        ...tokenPayload,
        access_token: refreshed.access_token,
        refresh_token:
          refreshed.refresh_token ||
          tokenPayload.refresh_token,
        token_type:
          refreshed.token_type ||
          tokenPayload.token_type ||
          "Bearer",
        scope:
          refreshed.scope ||
          tokenPayload.scope ||
          null,
        expires_at: expiresAt,
        refreshed_at: new Date().toISOString(),
      };

      await admin
        .from("organisation_connections")
        .update({
          secret_reference:
            encryptTokenPayload(tokenPayload),
          token_expires_at: expiresAt,
          authorised_scopes: refreshed.scope
            ? refreshed.scope.split(" ").filter(Boolean)
            : connection.authorised_scopes,
          reconnect_required_at: null,
          last_error_code: null,
          last_error_message: null,
          last_error_at: null,
        })
        .eq("id", connection.id);

      tokenRefreshed = true;
    }

    const userInfoResponse = await fetch(
      `${getDocuSignAuthBaseUrl()}/oauth/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!userInfoResponse.ok) {
      throw new Error(
        `DocuSign returned HTTP ${userInfoResponse.status}.`,
      );
    }

    const userInfo =
      (await userInfoResponse.json()) as DocuSignUserInfo;

    const account =
      userInfo.accounts?.find(
        (item) =>
          item.account_id ===
          connection.external_account_id,
      ) ||
      userInfo.accounts?.find((item) => item.is_default) ||
      userInfo.accounts?.[0];

    if (!account?.account_id || !account.base_uri) {
      throw new Error(
        "DocuSign did not return an eligible account.",
      );
    }

    const now = new Date().toISOString();
    const accountDisplayName =
      account.account_name ||
      userInfo.name ||
      userInfo.email ||
      connection.account_display_name ||
      "DocuSign";

    await admin
      .from("organisation_connections")
      .update({
        account_display_name: accountDisplayName,
        external_account_id: account.account_id,
        external_tenant_id:
          userInfo.sub || connection.external_tenant_id,
        external_workspace_id: account.base_uri,
        status: "Connected",
        health_status: "Healthy",
        last_successful_use_at: now,
        last_health_check_at: now,
        last_failed_use_at: null,
        reconnect_required_at: null,
        last_error_code: null,
        last_error_message: null,
        last_error_at: null,
      })
      .eq("id", connection.id);

    await admin
      .from("connection_health_checks")
      .insert({
        connection_id: connection.id,
        check_type: "Connection",
        status: "Healthy",
        summary:
          "DocuSign connection is healthy and authorised.",
        diagnostic_details: {
          account_id: account.account_id,
          base_uri: account.base_uri,
          token_refreshed: tokenRefreshed,
        },
      });

    await admin
      .from("connection_activity_history")
      .insert({
        organisation_id: connection.organisation_id,
        provider_id: connection.provider_id,
        connection_id: connection.id,
        job_id: null,
        module_key: "Foundations",
        activity_type: "Connection Health Check",
        activity_summary:
          "DocuSign connection was verified successfully.",
        activity_details: {
          account_display_name: accountDisplayName,
          account_id: account.account_id,
          token_refreshed: tokenRefreshed,
        },
      });

    return NextResponse.json({
      success: true,
      message: tokenRefreshed
        ? "DocuSign token refreshed and connection verified."
        : "DocuSign connection verified.",
      tokenRefreshed,
      connection: {
        id: connection.id,
        status: "Connected",
        healthStatus: "Healthy",
        accountDisplayName,
        externalAccountId: account.account_id,
        baseUri: account.base_uri,
      },
    });
  } catch (error) {
    console.error(
      "DocuSign connection health check failed:",
      error,
    );

    const now = new Date().toISOString();
    const errorMessage =
      error instanceof Error
        ? error.message
        : "The DocuSign connection health check failed.";

    const reconnectRequired =
      /refresh token|authentication|unauthor|401/i.test(
        errorMessage,
      );

    await admin
      .from("organisation_connections")
      .update({
        status: reconnectRequired
          ? "Reconnect Required"
          : "Needs Attention",
        health_status: reconnectRequired
          ? "Authentication Failed"
          : "Unavailable",
        last_failed_use_at: now,
        last_health_check_at: now,
        reconnect_required_at: reconnectRequired
          ? now
          : null,
        last_error_code: reconnectRequired
          ? "docusign_reconnect_required"
          : "docusign_health_check_failed",
        last_error_message: errorMessage.slice(0, 1000),
        last_error_at: now,
      })
      .eq("id", connectionId);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}