import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type MicrosoftTokenPayload = {
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
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

export type MicrosoftConnection = {
  id: number;
  organisation_id: string;
  provider_id: number;
  account_display_name?: string | null;
  external_account_id?: string | null;
  external_tenant_id?: string | null;
  status?: string | null;
  health_status?: string | null;
  secret_reference?: string | null;
  token_expires_at?: string | null;
  authorised_scopes?: string[] | null;
};

export type AuthenticatedMicrosoftConnection = {
  connection: MicrosoftConnection;
  accessToken: string;
  tokenPayload: MicrosoftTokenPayload;
  tokenRefreshed: boolean;
};

export class MicrosoftGraphError extends Error {
  status: number;
  responseBody: string;

  constructor(
    message: string,
    status: number,
    responseBody = "",
  ) {
    super(message);
    this.name = "MicrosoftGraphError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

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
  const encryptionSecret =
    getEncryptionSecret();

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

  const encrypted = Buffer.concat([
    cipher.update(
      JSON.stringify(payload),
      "utf8",
    ),
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
  const parts =
    encryptedSecret.split(".");

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

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );

  decipher.setAuthTag(
    Buffer.from(
      authenticationTagPart,
      "base64url",
    ),
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(
        encryptedPart,
        "base64url",
      ),
    ),
    decipher.final(),
  ]);

  return JSON.parse(
    decrypted.toString("utf8"),
  ) as MicrosoftTokenPayload;
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

  return (
    expiryTime <=
    Date.now() + 5 * 60 * 1000
  );
}

async function refreshMicrosoftToken(
  tokenPayload: MicrosoftTokenPayload,
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

  if (!tokenPayload.refresh_token) {
    throw new Error(
      "The Microsoft access token has expired and no refresh token is available.",
    );
  }

  const requestBody: Record<
    string,
    string
  > = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token:
      tokenPayload.refresh_token,
  };

  /*
   * A refresh cannot grant additional permissions.
   * Reuse the scopes Microsoft originally authorised.
   */
  if (tokenPayload.scope) {
    requestBody.scope =
      tokenPayload.scope;
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
      body: new URLSearchParams(
        requestBody,
      ),
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

async function saveRefreshedToken(
  connection: MicrosoftConnection,
  currentTokenPayload: MicrosoftTokenPayload,
  refreshedToken: MicrosoftTokenResponse,
) {
  if (!refreshedToken.access_token) {
    throw new Error(
      "Microsoft did not return an access token.",
    );
  }

  const admin = getAdminClient();

  const expiresIn =
    typeof refreshedToken.expires_in ===
    "number"
      ? refreshedToken.expires_in
      : 3600;

  const tokenExpiresAt = new Date(
    Date.now() + expiresIn * 1000,
  ).toISOString();

  const tokenPayload: MicrosoftTokenPayload =
    {
      provider: "microsoft",
      access_token:
        refreshedToken.access_token,
      refresh_token:
        refreshedToken.refresh_token ||
        currentTokenPayload.refresh_token ||
        null,
      token_type:
        refreshedToken.token_type ||
        currentTokenPayload.token_type ||
        "Bearer",
      scope:
        refreshedToken.scope ||
        currentTokenPayload.scope ||
        null,
      expires_at: tokenExpiresAt,
      created_at:
        currentTokenPayload.created_at ||
        new Date().toISOString(),
      refreshed_at:
        new Date().toISOString(),
    };

  const authorisedScopes =
    tokenPayload.scope
      ? tokenPayload.scope
          .split(" ")
          .map((scope) =>
            scope.trim(),
          )
          .filter(Boolean)
      : [];

  const updateResult = await admin
    .from("organisation_connections")
    .update({
      secret_reference:
        encryptTokenPayload(
          tokenPayload,
        ),
      token_expires_at:
        tokenExpiresAt,
      authorised_scopes:
        authorisedScopes,
      reconnect_required_at: null,
      last_error_code: null,
      last_error_message: null,
      last_error_at: null,
    })
    .eq("id", connection.id)
    .eq(
      "organisation_id",
      connection.organisation_id,
    );

  if (updateResult.error) {
    throw new Error(
      updateResult.error.message,
    );
  }

  return tokenPayload;
}

async function getMicrosoftConnection(
  connectionId: number,
) {
  const admin = getAdminClient();

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
        secret_reference,
        token_expires_at,
        authorised_scopes
      `,
    )
    .eq("id", connectionId)
    .eq("is_archived", false)
    .maybeSingle();

  if (
    connectionResult.error ||
    !connectionResult.data
  ) {
    throw new Error(
      "The Microsoft connection could not be found.",
    );
  }

  return connectionResult.data as MicrosoftConnection;
}

export async function getAuthenticatedMicrosoftConnection(
  connectionId: number,
  options?: {
    forceRefresh?: boolean;
  },
): Promise<AuthenticatedMicrosoftConnection> {
  const connection =
    await getMicrosoftConnection(
      connectionId,
    );

  if (
    connection.status !== "Connected"
  ) {
    throw new Error(
      "The Microsoft connection is not currently connected.",
    );
  }

  if (!connection.secret_reference) {
    throw new Error(
      "The Microsoft connection has no stored token reference.",
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

  let tokenRefreshed = false;

  if (
    options?.forceRefresh ||
    tokenIsExpired(tokenPayload)
  ) {
    const refreshedToken =
      await refreshMicrosoftToken(
        tokenPayload,
      );

    tokenPayload =
      await saveRefreshedToken(
        connection,
        tokenPayload,
        refreshedToken,
      );

    tokenRefreshed = true;
  }

  if (!tokenPayload.access_token) {
    throw new Error(
      "The Microsoft access token is unavailable.",
    );
  }

  return {
    connection,
    accessToken:
      tokenPayload.access_token,
    tokenPayload,
    tokenRefreshed,
  };
}

function buildGraphUrl(path: string) {
  if (
    path.startsWith(
      "https://graph.microsoft.com/",
    )
  ) {
    return path;
  }

  const normalisedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `https://graph.microsoft.com/v1.0${normalisedPath}`;
}

async function executeGraphRequest(
  accessToken: string,
  path: string,
  init?: RequestInit,
) {
  const headers = new Headers(
    init?.headers,
  );

  headers.set(
    "Authorization",
    `Bearer ${accessToken}`,
  );

  if (!headers.has("Accept")) {
    headers.set(
      "Accept",
      "application/json",
    );
  }

  if (
    init?.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  return fetch(buildGraphUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function microsoftGraphRequest<T>(
  connectionId: number,
  path: string,
  init?: RequestInit,
): Promise<{
  data: T;
  connection: MicrosoftConnection;
  tokenRefreshed: boolean;
}> {
  let authenticated =
    await getAuthenticatedMicrosoftConnection(
      connectionId,
    );

  let response =
    await executeGraphRequest(
      authenticated.accessToken,
      path,
      init,
    );

  /*
   * Microsoft may reject a token before its recorded
   * expiry. Refresh once and retry the request.
   */
  if (response.status === 401) {
    authenticated =
      await getAuthenticatedMicrosoftConnection(
        connectionId,
        {
          forceRefresh: true,
        },
      );

    response =
      await executeGraphRequest(
        authenticated.accessToken,
        path,
        init,
      );
  }

  if (!response.ok) {
    const responseBody =
      await response.text();

    throw new MicrosoftGraphError(
      responseBody ||
        `Microsoft Graph returned HTTP ${response.status}.`,
      response.status,
      responseBody,
    );
  }

  if (response.status === 204) {
    return {
      data: undefined as T,
      connection:
        authenticated.connection,
      tokenRefreshed:
        authenticated.tokenRefreshed,
    };
  }

  const responseText =
    await response.text();

  const data = responseText
    ? (JSON.parse(responseText) as T)
    : (undefined as T);

  return {
    data,
    connection:
      authenticated.connection,
    tokenRefreshed:
      authenticated.tokenRefreshed,
  };
}