import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_ZOOM_SCOPES = [
  "meeting:read:list_meetings",
  "meeting:write:meeting",
] as const;

export type ZoomTokenPayload = {
  provider?: string;
  access_token?: string;
  refresh_token?: string | null;
  token_type?: string;
  scope?: string | null;
  expires_at?: string;
  created_at?: string;
  refreshed_at?: string;
  api_url?: string | null;
};

export type ZoomTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  api_url?: string;
  error?: string;
  error_description?: string;
  reason?: string;
};

export type ZoomConnection = {
  id: number;
  organisation_id: string;
  provider_id: number;
  account_display_name?: string | null;
  external_account_id?: string | null;
  external_tenant_id?: string | null;
  external_workspace_id?: string | null;
  status?: string | null;
  health_status?: string | null;
  secret_reference?: string | null;
  token_expires_at?: string | null;
  authorised_scopes?: string[] | null;
};

export type ZoomUser = {
  id?: string;
  account_id?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  type?: number;
  role_name?: string;
  status?: string;
  timezone?: string;
  pmi?: number;
  personal_meeting_url?: string;
  verified?: number;
  created_at?: string;
  last_login_time?: string;
  language?: string;
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

export function getZoomClientId() {
  return process.env.ZOOM_CLIENT_ID?.trim() || "";
}

export function getZoomClientSecret() {
  return process.env.ZOOM_CLIENT_SECRET?.trim() || "";
}

export function getZoomRedirectUri() {
  const redirectUri = process.env.ZOOM_REDIRECT_URI?.trim() || "";

  if (!redirectUri) {
    throw new Error("ZOOM_REDIRECT_URI is not configured.");
  }

  let parsed: URL;

  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new Error("ZOOM_REDIRECT_URI is not a valid URL.");
  }

  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error(
      "ZOOM_REDIRECT_URI must use HTTPS unless the hostname is localhost.",
    );
  }

  return parsed.toString();
}


export function getZoomScopes(): string[] {
  const configured = process.env.ZOOM_SCOPES?.trim();

  if (!configured) {
    return [...DEFAULT_ZOOM_SCOPES];
  }

  return configured
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function getEncryptionSecret() {
  return (
    process.env.LEO_CONNECTION_ENCRYPTION_KEY ||
    process.env.CONNECTION_TOKEN_ENCRYPTION_KEY ||
    ""
  );
}

function getEncryptionKey() {
  const secret = getEncryptionSecret();

  if (!secret) {
    throw new Error(
      "LEO_CONNECTION_ENCRYPTION_KEY is not configured.",
    );
  }

  return createHash("sha256").update(secret).digest();
}

function getStateSigningSecret() {
  return getEncryptionSecret();
}

export function encryptZoomTokenPayload(
  payload: ZoomTokenPayload,
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

export function decryptZoomTokenPayload(
  encryptedSecret: string,
): ZoomTokenPayload {
  const parts = encryptedSecret.split(".");

  if (parts.length !== 4 || parts[0] !== "leo-oauth-v1") {
    throw new Error(
      "The Zoom token package is not in a recognised encrypted format.",
    );
  }

  const [, ivPart, authenticationTagPart, encryptedPart] =
    parts;

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );

  decipher.setAuthTag(
    Buffer.from(authenticationTagPart, "base64url"),
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);

  return JSON.parse(
    decrypted.toString("utf8"),
  ) as ZoomTokenPayload;
}

export function buildZoomState(
  sessionReference: string,
  stateHash: string,
) {
  const signature = createHmac(
    "sha256",
    getStateSigningSecret(),
  )
    .update(`zoom-state:${sessionReference}:${stateHash}`)
    .digest("base64url");

  return `${sessionReference}.${signature}`;
}

export function verifyZoomState(
  state: string,
  sessionReference: string,
  stateHash: string,
) {
  const expected = buildZoomState(
    sessionReference,
    stateHash,
  );

  const receivedBuffer = Buffer.from(state);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function zoomBasicAuthHeader() {
  const clientId = getZoomClientId();
  const clientSecret = getZoomClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error("Zoom OAuth credentials are not configured.");
  }

  return `Basic ${Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8",
  ).toString("base64")}`;
}

async function readZoomTokenResponse(
  response: Response,
): Promise<ZoomTokenResponse> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as ZoomTokenResponse;
  } catch {
    if (!response.ok) {
      throw new Error(
        `Zoom returned HTTP ${response.status}: ${text}`,
      );
    }

    throw new Error(
      "Zoom returned an unexpected token response.",
    );
  }
}

export async function exchangeZoomAuthorizationCode({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}): Promise<ZoomTokenResponse> {
  const response = await fetch(
    "https://zoom.us/oauth/token",
    {
      method: "POST",
      headers: {
        Authorization: zoomBasicAuthHeader(),
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    },
  );

  const data = await readZoomTokenResponse(response);

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.reason ||
        data.error ||
        "Zoom did not issue an access token.",
    );
  }

  return data;
}

async function refreshZoomToken(
  refreshToken: string,
): Promise<ZoomTokenResponse> {
  const response = await fetch(
    "https://zoom.us/oauth/token",
    {
      method: "POST",
      headers: {
        Authorization: zoomBasicAuthHeader(),
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    },
  );

  const data = await readZoomTokenResponse(response);

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.reason ||
        data.error ||
        "Zoom did not issue refreshed credentials.",
    );
  }

  return data;
}

function tokenIsNearExpiry(
  payload: ZoomTokenPayload,
) {
  if (!payload.expires_at) return false;

  const expiresAt = new Date(
    payload.expires_at,
  ).getTime();

  if (!Number.isFinite(expiresAt)) return false;

  return expiresAt <= Date.now() + 5 * 60 * 1000;
}

function normaliseApiBase(
  apiUrl?: string | null,
) {
  const candidate =
    apiUrl?.trim() ||
    "https://api.zoom.us/v2";

  const withoutTrailingSlash =
    candidate.replace(/\/+$/, "");

  if (withoutTrailingSlash.endsWith("/v2")) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/v2`;
}

export async function getZoomUser(
  accessToken: string,
  apiUrl?: string | null,
) {
  const response = await fetch(
    `${normaliseApiBase(apiUrl)}/users/me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      (await response.text()) ||
        `Zoom returned HTTP ${response.status} while loading the user.`,
    );
  }

  return (await response.json()) as ZoomUser;
}

async function getZoomConnection(
  connectionId: number,
) {
  const admin = getAdminClient();

  const result = await admin
    .from("organisation_connections")
    .select(
      `
        id,
        organisation_id,
        provider_id,
        account_display_name,
        external_account_id,
        external_tenant_id,
        external_workspace_id,
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

  if (result.error || !result.data) {
    throw new Error(
      "The Zoom connection could not be found.",
    );
  }

  return result.data as ZoomConnection;
}

async function saveRefreshedZoomToken(
  connection: ZoomConnection,
  currentPayload: ZoomTokenPayload,
  refreshed: ZoomTokenResponse,
) {
  if (!refreshed.access_token) {
    throw new Error(
      "Zoom did not return complete refreshed credentials.",
    );
  }

  const admin = getAdminClient();

  const expiresIn =
    typeof refreshed.expires_in === "number"
      ? refreshed.expires_in
      : 3600;

  const tokenExpiresAt = new Date(
    Date.now() + expiresIn * 1000,
  ).toISOString();

  const payload: ZoomTokenPayload = {
    provider: "zoom",
    access_token: refreshed.access_token,
    refresh_token:
      refreshed.refresh_token ||
      currentPayload.refresh_token ||
      null,
    token_type:
      refreshed.token_type ||
      currentPayload.token_type ||
      "Bearer",
    scope:
      refreshed.scope ||
      currentPayload.scope ||
      null,
    expires_at: tokenExpiresAt,
    created_at:
      currentPayload.created_at ||
      new Date().toISOString(),
    refreshed_at: new Date().toISOString(),
    api_url:
      refreshed.api_url ||
      currentPayload.api_url ||
      null,
  };

  const authorisedScopes = payload.scope
    ? payload.scope
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : connection.authorised_scopes || [];

  const update = await admin
    .from("organisation_connections")
    .update({
      secret_reference:
        encryptZoomTokenPayload(payload),
      token_expires_at: tokenExpiresAt,
      authorised_scopes: authorisedScopes,
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

  if (update.error) {
    throw new Error(update.error.message);
  }

  return payload;
}

export async function getAuthenticatedZoomConnection(
  connectionId: number,
  options?: { forceRefresh?: boolean },
) {
  const connection = await getZoomConnection(
    connectionId,
  );

  if (connection.status !== "Connected") {
    throw new Error(
      "The Zoom connection is not currently connected.",
    );
  }

  if (!connection.secret_reference) {
    throw new Error(
      "The Zoom connection has no stored token reference.",
    );
  }

  let tokenPayload = decryptZoomTokenPayload(
    connection.secret_reference,
  );

  if (
    tokenPayload.provider !== "zoom" ||
    !tokenPayload.access_token
  ) {
    throw new Error(
      "The stored Zoom token package is incomplete.",
    );
  }

  let tokenRefreshed = false;

  if (
    options?.forceRefresh ||
    tokenIsNearExpiry(tokenPayload)
  ) {
    if (!tokenPayload.refresh_token) {
      throw new Error(
        "The Zoom access token has expired and no refresh token is available.",
      );
    }

    const refreshed = await refreshZoomToken(
      tokenPayload.refresh_token,
    );

    tokenPayload = await saveRefreshedZoomToken(
      connection,
      tokenPayload,
      refreshed,
    );

    tokenRefreshed = true;
  }

  if (!tokenPayload.access_token) {
    throw new Error(
      "The Zoom access token is unavailable.",
    );
  }

  return {
    connection,
    accessToken: tokenPayload.access_token,
    tokenPayload,
    tokenRefreshed,
  };
}

export async function zoomApiRequest<T>(
  connectionId: number,
  path: string,
  init?: RequestInit,
): Promise<{
  data: T;
  connection: ZoomConnection;
  tokenRefreshed: boolean;
}> {
  let authenticated =
    await getAuthenticatedZoomConnection(connectionId);

  const execute = (
    accessToken: string,
    apiUrl?: string | null,
  ) => {
    const headers = new Headers(init?.headers);

    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
    headers.set("Accept", "application/json");

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

    const url = path.startsWith("https://")
      ? path
      : `${normaliseApiBase(apiUrl)}${
          path.startsWith("/") ? path : `/${path}`
        }`;

    return fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  };

  let response = await execute(
    authenticated.accessToken,
    authenticated.tokenPayload.api_url,
  );

  if (response.status === 401) {
    authenticated =
      await getAuthenticatedZoomConnection(
        connectionId,
        {
          forceRefresh: true,
        },
      );

    response = await execute(
      authenticated.accessToken,
      authenticated.tokenPayload.api_url,
    );
  }

  if (!response.ok) {
    throw new Error(
      (await response.text()) ||
        `Zoom returned HTTP ${response.status}.`,
    );
  }

  const text = await response.text();

  return {
    data: (
      text ? JSON.parse(text) : null
    ) as T,
    connection: authenticated.connection,
    tokenRefreshed:
      authenticated.tokenRefreshed,
  };
}

export async function getZoomConnectionHealth(
  connectionId: number,
) {
  const authenticated =
    await getAuthenticatedZoomConnection(
      connectionId,
    );

  const user = await getZoomUser(
    authenticated.accessToken,
    authenticated.tokenPayload.api_url,
  );

  return {
    connection: authenticated.connection,
    user,
    tokenRefreshed:
      authenticated.tokenRefreshed,
    healthy: Boolean(user.id),
  };
}