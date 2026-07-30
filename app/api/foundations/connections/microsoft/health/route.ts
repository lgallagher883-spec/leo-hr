import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type MicrosoftTokenPayload = {
  provider?: string;
  access_token?: string;
  refresh_token?: string | null;
  token_type?: string;
  scope?: string | null;
  expires_at?: string;
  created_at?: string;
  refreshed_at?: string;
};

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
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
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

function getEncryptionKey() {
  const encryptionSecret = getEncryptionSecret();

  if (!encryptionSecret) {
    throw new Error(
      "LEO_CONNECTION_ENCRYPTION_KEY is not configured.",
    );
  }

  return createHash("sha256")
    .update(encryptionSecret)
    .digest();
}

function encryptTokenPayload(
  payload: MicrosoftTokenPayload,
) {
  const key = getEncryptionKey();
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

  const authenticationTag =
    cipher.getAuthTag();

  return [
    "leo-oauth-v1",
    iv.toString("base64url"),
    authenticationTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptTokenPayload(
  encryptedSecret: string,
): MicrosoftTokenPayload {
  const parts = encryptedSecret.split(".");

  if (
    parts.length !== 4 ||
    parts[0] !== "leo-oauth-v1"
  ) {
    throw new Error(
      "The Microsoft token package is not in a recognised encrypted format.",
    );
  }

  const [
    ,
    ivPart,
    authenticationTagPart,
    encryptedPart,
  ] = parts;

  const key = getEncryptionKey();

  const iv = Buffer.from(
    ivPart,
    "base64url",
  );

  const authenticationTag = Buffer.from(
    authenticationTagPart,
    "base64url",
  );

  const encrypted = Buffer.from(
    encryptedPart,
    "base64url",
  );

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    iv,
  );

  decipher.setAuthTag(authenticationTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(
    decrypted.toString("utf8"),
  ) as MicrosoftTokenPayload;
}

function getConnectionId(
  requestUrl: URL,
): number | null {
  const connectionIdValue =
    requestUrl.searchParams
      .get("connectionId")
      ?.trim() || "";

  if (!connectionIdValue) {
    return null;
  }

  const connectionId = Number(
    connectionIdValue,
  );

  if (
    !Number.isInteger(connectionId) ||
    connectionId <= 0
  ) {
    return null;
  }

  return connectionId;
}

function tokenIsExpired(
  tokenPayload: MicrosoftTokenPayload,
) {
  if (!tokenPayload.expires_at) {
    return false;
  }

  const expiryTime = new Date(
    tokenPayload.expires_at,
  ).getTime();

  if (!Number.isFinite(expiryTime)) {
    return false;
  }

  /*
   * Refresh five minutes before actual expiry so a token
   * does not expire while Microsoft Graph is using it.
   */
  return expiryTime <= Date.now() + 5 * 60 * 1000;
}

async function requestMicrosoftProfile(
  accessToken: string,
) {
  return fetch(
    "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );
}

async function refreshMicrosoftToken(
  refreshToken: string,
): Promise<MicrosoftTokenResponse> {
  const clientId =
    getMicrosoftClientId();

  const clientSecret =
    getMicrosoftClientSecret();

  const tenantId =
    getMicrosoftTenantId();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Microsoft OAuth credentials are not configured.",
    );
  }

  const response = await fetch(
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
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope:
          "openid profile email offline_access User.Read",
      }),
      cache: "no-store",
    },
  );

  const tokenData =
    (await response.json()) as MicrosoftTokenResponse;

  if (
    !response.ok ||
    !tokenData.access_token
  ) {
    throw new Error(
      tokenData.error_description ||
        tokenData.error ||
        "Microsoft did not issue a refreshed access token.",
    );
  }

  return tokenData;
}

export async function GET(request: Request) {
  const admin = getAdminClient();
  const requestUrl = new URL(request.url);

  const connectionId =
    getConnectionId(requestUrl);

  if (!connectionId) {
    return NextResponse.json(
      {
        success: false,
        error:
          "A valid Microsoft connection ID is required.",
      },
      { status: 400 },
    );
  }

  try {
    const connectionResult = await admin
      .from("organisation_connections")
      .select(
        `
          id,
          organisation_id,
          provider_id,
          account_display_name,
          external_account_id,
          external_tenant_id,
          status,
          health_status,
          secret_reference
        `,
      )
      .eq("id", connectionId)
      .eq("is_archived", false)
      .maybeSingle();

    if (
      connectionResult.error ||
      !connectionResult.data
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The Microsoft connection could not be found.",
        },
        { status: 404 },
      );
    }

    const connection =
      connectionResult.data;

    if (
      connection.status !== "Connected"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The Microsoft connection is not currently connected.",
        },
        { status: 409 },
      );
    }

    if (!connection.secret_reference) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The Microsoft connection has no stored token reference.",
        },
        { status: 409 },
      );
    }

    let tokenPayload =
      decryptTokenPayload(
        connection.secret_reference,
      );

    if (
      tokenPayload.provider !==
        "microsoft" ||
      !tokenPayload.access_token
    ) {
      throw new Error(
        "The stored Microsoft token package is incomplete.",
      );
    }

    let accessToken =
      tokenPayload.access_token;

    let tokenWasRefreshed = false;

    /*
     * Refresh before calling Graph when the stored
     * access token is already expired or near expiry.
     */
    if (tokenIsExpired(tokenPayload)) {
      if (!tokenPayload.refresh_token) {
        throw new Error(
          "The Microsoft access token has expired and no refresh token is available.",
        );
      }

      const refreshedToken =
        await refreshMicrosoftToken(
          tokenPayload.refresh_token,
        );

      const expiresIn =
        typeof refreshedToken.expires_in ===
        "number"
          ? refreshedToken.expires_in
          : 3600;

      const tokenExpiresAt = new Date(
        Date.now() + expiresIn * 1000,
      ).toISOString();

      tokenPayload = {
        provider: "microsoft",
        access_token:
          refreshedToken.access_token,
        refresh_token:
          refreshedToken.refresh_token ||
          tokenPayload.refresh_token,
        token_type:
          refreshedToken.token_type ||
          tokenPayload.token_type ||
          "Bearer",
        scope:
          refreshedToken.scope ||
          tokenPayload.scope ||
          null,
        expires_at: tokenExpiresAt,
        created_at:
          tokenPayload.created_at ||
          new Date().toISOString(),
        refreshed_at:
          new Date().toISOString(),
      };

      accessToken =
  refreshedToken.access_token!;

      const encryptedSecret =
        encryptTokenPayload(tokenPayload);

      const authorisedScopes =
        refreshedToken.scope
          ? refreshedToken.scope
              .split(" ")
              .map((scope) =>
                scope.trim(),
              )
              .filter(Boolean)
          : [];

      const tokenSaveResult =
        await admin
          .from(
            "organisation_connections",
          )
          .update({
            secret_reference:
              encryptedSecret,
            token_expires_at:
              tokenExpiresAt,
            authorised_scopes:
              authorisedScopes,
            reconnect_required_at:
              null,
            last_error_code: null,
            last_error_message: null,
            last_error_at: null,
          })
          .eq("id", connection.id);

      if (tokenSaveResult.error) {
        throw new Error(
          tokenSaveResult.error.message,
        );
      }

      tokenWasRefreshed = true;
    }

    let profileResponse =
      await requestMicrosoftProfile(
        accessToken,
      );

    /*
     * Microsoft may reject a token before its recorded
     * expiry. On a 401 response, refresh and retry once.
     */
    if (
      profileResponse.status === 401 &&
      !tokenWasRefreshed
    ) {
      if (!tokenPayload.refresh_token) {
        throw new Error(
          "Microsoft rejected the access token and no refresh token is available.",
        );
      }

      const refreshedToken =
        await refreshMicrosoftToken(
          tokenPayload.refresh_token,
        );

      const expiresIn =
        typeof refreshedToken.expires_in ===
        "number"
          ? refreshedToken.expires_in
          : 3600;

      const tokenExpiresAt = new Date(
        Date.now() + expiresIn * 1000,
      ).toISOString();

      tokenPayload = {
        provider: "microsoft",
        access_token:
          refreshedToken.access_token,
        refresh_token:
          refreshedToken.refresh_token ||
          tokenPayload.refresh_token,
        token_type:
          refreshedToken.token_type ||
          tokenPayload.token_type ||
          "Bearer",
        scope:
          refreshedToken.scope ||
          tokenPayload.scope ||
          null,
        expires_at: tokenExpiresAt,
        created_at:
          tokenPayload.created_at ||
          new Date().toISOString(),
        refreshed_at:
          new Date().toISOString(),
      };

      accessToken =
  refreshedToken.access_token!;

      const encryptedSecret =
        encryptTokenPayload(tokenPayload);

      const authorisedScopes =
        refreshedToken.scope
          ? refreshedToken.scope
              .split(" ")
              .map((scope) =>
                scope.trim(),
              )
              .filter(Boolean)
          : [];

      const tokenSaveResult =
        await admin
          .from(
            "organisation_connections",
          )
          .update({
            secret_reference:
              encryptedSecret,
            token_expires_at:
              tokenExpiresAt,
            authorised_scopes:
              authorisedScopes,
            reconnect_required_at:
              null,
            last_error_code: null,
            last_error_message: null,
            last_error_at: null,
          })
          .eq("id", connection.id);

      if (tokenSaveResult.error) {
        throw new Error(
          tokenSaveResult.error.message,
        );
      }

      tokenWasRefreshed = true;

      profileResponse =
        await requestMicrosoftProfile(
          accessToken,
        );
    }

    const now =
      new Date().toISOString();

    if (!profileResponse.ok) {
      const errorText =
        await profileResponse.text();

      const authenticationFailed =
        profileResponse.status === 401;

      await admin
        .from(
          "organisation_connections",
        )
        .update({
          status: authenticationFailed
            ? "Reconnect Required"
            : "Needs Attention",
          health_status:
            authenticationFailed
              ? "Authentication Failed"
              : "Unavailable",
          last_failed_use_at: now,
          last_health_check_at: now,
          reconnect_required_at:
            authenticationFailed
              ? now
              : null,
          last_error_code:
            authenticationFailed
              ? "microsoft_authentication_failed"
              : "microsoft_health_check_failed",
          last_error_message:
            errorText.slice(0, 1000) ||
            `Microsoft Graph returned HTTP ${profileResponse.status}.`,
          last_error_at: now,
        })
        .eq("id", connection.id);

      return NextResponse.json(
        {
          success: false,
          error: authenticationFailed
            ? "Microsoft could not refresh or verify the connection. Reconnection is required."
            : "Microsoft could not verify the connection.",
          status:
            profileResponse.status,
        },
        {
          status:
            authenticationFailed
              ? 401
              : 502,
        },
      );
    }

    const profile =
      (await profileResponse.json()) as MicrosoftUser;

    const accountDisplayName =
      profile.displayName ||
      profile.mail ||
      profile.userPrincipalName ||
      connection.account_display_name ||
      "Microsoft 365";

    const updateResult = await admin
      .from("organisation_connections")
      .update({
        account_display_name:
          accountDisplayName,
        external_account_id:
          profile.id ||
          connection.external_account_id,
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

    if (updateResult.error) {
      throw new Error(
        updateResult.error.message,
      );
    }

    if (tokenWasRefreshed) {
      const refreshActivityResult =
        await admin
          .from(
            "connection_activity_history",
          )
          .insert({
            organisation_id:
              connection.organisation_id,
            provider_id:
              connection.provider_id,
            connection_id:
              connection.id,
            job_id: null,
            module_key:
              "Foundations",
            activity_type:
              "Connection Token Refreshed",
            activity_summary:
              "Microsoft 365 access was refreshed securely.",
            activity_details: {
              account_display_name:
                accountDisplayName,
              result: "Refreshed",
            },
          });

      if (
        refreshActivityResult.error
      ) {
        console.warn(
          "Microsoft token-refresh activity could not be recorded:",
          refreshActivityResult.error,
        );
      }
    }

    const activityResult =
      await admin
        .from(
          "connection_activity_history",
        )
        .insert({
          organisation_id:
            connection.organisation_id,
          provider_id:
            connection.provider_id,
          connection_id:
            connection.id,
          job_id: null,
          module_key:
            "Foundations",
          activity_type:
            "Connection Health Check",
          activity_summary:
            "Microsoft 365 connection was verified successfully.",
          activity_details: {
            account_display_name:
              accountDisplayName,
            external_account_id:
              profile.id || null,
            result: "Healthy",
            token_refreshed:
              tokenWasRefreshed,
          },
        });

    if (activityResult.error) {
      console.warn(
        "Microsoft health-check activity could not be recorded:",
        activityResult.error,
      );
    }

    return NextResponse.json({
      success: true,
      message:
        tokenWasRefreshed
          ? "Microsoft 365 token refreshed and connection verified."
          : "Microsoft 365 connection verified.",
      tokenRefreshed:
        tokenWasRefreshed,
      connection: {
        id: connection.id,
        status: "Connected",
        healthStatus: "Healthy",
        accountDisplayName,
        externalAccountId:
          profile.id ||
          connection.external_account_id,
      },
    });
  } catch (error) {
    console.error(
      "Microsoft connection health check failed:",
      error,
    );

    const now =
      new Date().toISOString();

    const errorMessage =
      error instanceof Error
        ? error.message
        : "The Microsoft connection health check failed.";

    const reconnectionRequired =
      errorMessage
        .toLowerCase()
        .includes("refresh token") ||
      errorMessage
        .toLowerCase()
        .includes("authentication") ||
      errorMessage
        .toLowerCase()
        .includes("sign-in");

    await admin
      .from("organisation_connections")
      .update({
        status: reconnectionRequired
          ? "Reconnect Required"
          : "Needs Attention",
        health_status:
          reconnectionRequired
            ? "Authentication Failed"
            : "Unavailable",
        last_failed_use_at: now,
        last_health_check_at: now,
        reconnect_required_at:
          reconnectionRequired
            ? now
            : null,
        last_error_code:
          reconnectionRequired
            ? "microsoft_reconnect_required"
            : "microsoft_health_check_failed",
        last_error_message:
          errorMessage.slice(0, 1000),
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