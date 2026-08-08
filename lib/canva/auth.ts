import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const CANVA_SCOPES = [
  "design:content:read",
  "design:content:write",
  "design:meta:read",
  "asset:read",
  "asset:write",
  "brandtemplate:content:read",
  "brandtemplate:meta:read",
  "profile:read",
] as const;

export type CanvaTokenPayload = {
  provider?: string;
  access_token?: string;
  refresh_token?: string | null;
  token_type?: string;
  scope?: string | null;
  expires_at?: string;
  created_at?: string;
  refreshed_at?: string;
};

type CanvaTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export type CanvaConnection = {
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

export type CanvaUser = {
  team_user?: {
    user_id?: string;
    team_id?: string;
  };
};

export type CanvaProfile = {
  profile?: {
    display_name?: string;
  };
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

export function getCanvaClientId() {
  return process.env.CANVA_CLIENT_ID || "";
}

export function getCanvaClientSecret() {
  return process.env.CANVA_CLIENT_SECRET || "";
}

export function getCanvaRedirectUri() {
  const redirectUri = process.env.CANVA_REDIRECT_URI?.trim() || "";

  if (!redirectUri) {
    throw new Error("CANVA_REDIRECT_URI is not configured.");
  }

  return redirectUri;
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

export function encryptCanvaTokenPayload(
  payload: CanvaTokenPayload,
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

export function decryptCanvaTokenPayload(
  encryptedSecret: string,
): CanvaTokenPayload {
  const parts = encryptedSecret.split(".");

  if (parts.length !== 4 || parts[0] !== "leo-oauth-v1") {
    throw new Error(
      "The Canva token package is not in a recognised encrypted format.",
    );
  }

  const [, ivPart, authenticationTagPart, encryptedPart] = parts;

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

  return JSON.parse(decrypted.toString("utf8")) as CanvaTokenPayload;
}

export function buildCanvaPkceVerifier(
  sessionReference: string,
  stateHash: string,
) {
  return createHash("sha256")
    .update(`canva-pkce:${sessionReference}:${stateHash}`)
    .digest("base64url");
}

export function buildCanvaPkceChallenge(codeVerifier: string) {
  return createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

export function buildCanvaState(
  sessionReference: string,
  stateHash: string,
) {
  const signature = createHmac("sha256", getStateSigningSecret())
    .update(`canva-state:${sessionReference}:${stateHash}`)
    .digest("base64url");

  return `${sessionReference}.${signature}`;
}

export function verifyCanvaState(
  state: string,
  sessionReference: string,
  stateHash: string,
) {
  const expected = buildCanvaState(sessionReference, stateHash);
  const receivedBuffer = Buffer.from(state);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function canvaBasicAuthHeader() {
  const clientId = getCanvaClientId();
  const clientSecret = getCanvaClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error("Canva OAuth credentials are not configured.");
  }

  return `Basic ${Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8",
  ).toString("base64")}`;
}

export async function exchangeCanvaAuthorizationCode({
  code,
  codeVerifier,
  redirectUri,
}: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<CanvaTokenResponse> {
  const response = await fetch(
    "https://api.canva.com/rest/v1/oauth/token",
    {
      method: "POST",
      headers: {
        Authorization: canvaBasicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    },
  );

  const data = (await response.json()) as CanvaTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Canva did not issue an access token.",
    );
  }

  return data;
}

async function refreshCanvaToken(
  refreshToken: string,
): Promise<CanvaTokenResponse> {
  const response = await fetch(
    "https://api.canva.com/rest/v1/oauth/token",
    {
      method: "POST",
      headers: {
        Authorization: canvaBasicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    },
  );

  const data = (await response.json()) as CanvaTokenResponse;

  if (!response.ok || !data.access_token || !data.refresh_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Canva did not issue refreshed credentials.",
    );
  }

  return data;
}

function tokenIsNearExpiry(payload: CanvaTokenPayload) {
  if (!payload.expires_at) return false;

  const expiresAt = new Date(payload.expires_at).getTime();
  if (!Number.isFinite(expiresAt)) return false;

  return expiresAt <= Date.now() + 5 * 60 * 1000;
}

export async function getCanvaUser(accessToken: string) {
  const response = await fetch(
    "https://api.canva.com/rest/v1/users/me",
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
        `Canva returned HTTP ${response.status} while loading the user.`,
    );
  }

  return (await response.json()) as CanvaUser;
}

export async function getCanvaProfile(accessToken: string) {
  const response = await fetch(
    "https://api.canva.com/rest/v1/users/me/profile",
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
        `Canva returned HTTP ${response.status} while loading the profile.`,
    );
  }

  return (await response.json()) as CanvaProfile;
}

async function getCanvaConnection(connectionId: number) {
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
    throw new Error("The Canva connection could not be found.");
  }

  return result.data as CanvaConnection;
}

async function saveRefreshedCanvaToken(
  connection: CanvaConnection,
  currentPayload: CanvaTokenPayload,
  refreshed: CanvaTokenResponse,
) {
  if (!refreshed.access_token || !refreshed.refresh_token) {
    throw new Error("Canva did not return complete refreshed credentials.");
  }

  const admin = getAdminClient();
  const expiresIn =
    typeof refreshed.expires_in === "number" ? refreshed.expires_in : 14400;
  const tokenExpiresAt = new Date(
    Date.now() + expiresIn * 1000,
  ).toISOString();

  const payload: CanvaTokenPayload = {
    provider: "canva",
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    token_type: refreshed.token_type || currentPayload.token_type || "Bearer",
    scope: refreshed.scope || currentPayload.scope || null,
    expires_at: tokenExpiresAt,
    created_at: currentPayload.created_at || new Date().toISOString(),
    refreshed_at: new Date().toISOString(),
  };

  const authorisedScopes = payload.scope
    ? payload.scope.split(" ").map((item) => item.trim()).filter(Boolean)
    : connection.authorised_scopes || [];

  const update = await admin
    .from("organisation_connections")
    .update({
      secret_reference: encryptCanvaTokenPayload(payload),
      token_expires_at: tokenExpiresAt,
      authorised_scopes: authorisedScopes,
      reconnect_required_at: null,
      last_error_code: null,
      last_error_message: null,
      last_error_at: null,
    })
    .eq("id", connection.id)
    .eq("organisation_id", connection.organisation_id);

  if (update.error) {
    throw new Error(update.error.message);
  }

  return payload;
}

export async function getAuthenticatedCanvaConnection(
  connectionId: number,
  options?: { forceRefresh?: boolean },
) {
  const connection = await getCanvaConnection(connectionId);

  if (connection.status !== "Connected") {
    throw new Error("The Canva connection is not currently connected.");
  }

  if (!connection.secret_reference) {
    throw new Error("The Canva connection has no stored token reference.");
  }

  let tokenPayload = decryptCanvaTokenPayload(connection.secret_reference);

  if (
    tokenPayload.provider !== "canva" ||
    !tokenPayload.access_token
  ) {
    throw new Error("The stored Canva token package is incomplete.");
  }

  let tokenRefreshed = false;

  if (options?.forceRefresh || tokenIsNearExpiry(tokenPayload)) {
    if (!tokenPayload.refresh_token) {
      throw new Error(
        "The Canva access token has expired and no refresh token is available.",
      );
    }

    const refreshed = await refreshCanvaToken(tokenPayload.refresh_token);
    tokenPayload = await saveRefreshedCanvaToken(
      connection,
      tokenPayload,
      refreshed,
    );
    tokenRefreshed = true;
  }

  if (!tokenPayload.access_token) {
    throw new Error("The Canva access token is unavailable.");
  }

  return {
    connection,
    accessToken: tokenPayload.access_token,
    tokenPayload,
    tokenRefreshed,
  };
}

export async function canvaApiRequest<T>(
  connectionId: number,
  path: string,
  init?: RequestInit,
): Promise<{
  data: T;
  connection: CanvaConnection;
  tokenRefreshed: boolean;
}> {
  let authenticated = await getAuthenticatedCanvaConnection(connectionId);

  const execute = (accessToken: string) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    headers.set("Accept", "application/json");

    if (
      init?.body &&
      !headers.has("Content-Type") &&
      !(init.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }

    const url = path.startsWith("https://")
      ? path
      : `https://api.canva.com/rest/v1${path.startsWith("/") ? path : `/${path}`}`;

    return fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  };

  let response = await execute(authenticated.accessToken);

  if (response.status === 401) {
    authenticated = await getAuthenticatedCanvaConnection(connectionId, {
      forceRefresh: true,
    });
    response = await execute(authenticated.accessToken);
  }

  if (!response.ok) {
    throw new Error(
      (await response.text()) ||
        `Canva returned HTTP ${response.status}.`,
    );
  }

  const text = await response.text();

  return {
    data: text ? (JSON.parse(text) as T) : (undefined as T),
    connection: authenticated.connection,
    tokenRefreshed: authenticated.tokenRefreshed,
  };
}