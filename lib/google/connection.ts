import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { refreshAccessToken } from "./auth";

export type GoogleConnection = {
  id: number | string;
  secret_reference?: string | null;
  token_expires_at?: string | null;
};

type GoogleTokenPayload = {
  provider: "google";
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  scope: string | null;
  expires_at: string;
  created_at: string;
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
  payload: GoogleTokenPayload,
): string {
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

  const authenticationTag = cipher.getAuthTag();

  return [
    "leo-oauth-v1",
    iv.toString("base64url"),
    authenticationTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptTokenPayload(
  secretReference: string,
): GoogleTokenPayload {
  const parts = secretReference.split(".");

  if (
    parts.length !== 4 ||
    parts[0] !== "leo-oauth-v1"
  ) {
    throw new Error(
      "The stored Google connection secret is invalid.",
    );
  }

  const [, ivValue, tagValue, encryptedValue] =
    parts;

  try {
    const key = getEncryptionKey();

    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivValue, "base64url"),
    );

    decipher.setAuthTag(
      Buffer.from(tagValue, "base64url"),
    );

    const decrypted = Buffer.concat([
      decipher.update(
        Buffer.from(encryptedValue, "base64url"),
      ),
      decipher.final(),
    ]);

    const payload = JSON.parse(
      decrypted.toString("utf8"),
    ) as Partial<GoogleTokenPayload>;

    if (
      payload.provider !== "google" ||
      typeof payload.access_token !== "string" ||
      typeof payload.expires_at !== "string"
    ) {
      throw new Error(
        "The stored Google token payload is incomplete.",
      );
    }

    return {
      provider: "google",
      access_token: payload.access_token,
      refresh_token:
        typeof payload.refresh_token === "string"
          ? payload.refresh_token
          : null,
      token_type:
        typeof payload.token_type === "string"
          ? payload.token_type
          : "Bearer",
      scope:
        typeof payload.scope === "string"
          ? payload.scope
          : null,
      expires_at: payload.expires_at,
      created_at:
        typeof payload.created_at === "string"
          ? payload.created_at
          : new Date().toISOString(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("The stored Google")
    ) {
      throw error;
    }

    throw new Error(
      "The stored Google connection secret could not be decrypted.",
    );
  }
}

function tokenIsUsable(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime();

  if (!Number.isFinite(expiryTime)) {
    return false;
  }

  const refreshBufferMilliseconds = 5 * 60 * 1000;

  return (
    expiryTime - refreshBufferMilliseconds >
    Date.now()
  );
}

async function saveRefreshedTokens(
  connection: GoogleConnection,
  payload: GoogleTokenPayload,
) {
  const admin = getAdminClient();

  const encryptedSecret =
    encryptTokenPayload(payload);

  const now = new Date().toISOString();

  const updateResult = await admin
    .from("organisation_connections")
    .update({
      secret_reference: encryptedSecret,
      token_expires_at: payload.expires_at,
      health_status: "Healthy",
      status: "Connected",
      last_successful_use_at: now,
      last_failed_use_at: null,
      reconnect_required_at: null,
      last_error_code: null,
      last_error_message: null,
      last_error_at: null,
    })
    .eq("id", connection.id);

  if (updateResult.error) {
    throw new Error(
      updateResult.error.message ||
        "The refreshed Google credentials could not be saved.",
    );
  }

  connection.secret_reference = encryptedSecret;
  connection.token_expires_at = payload.expires_at;
}

async function markConnectionFailure(
  connection: GoogleConnection,
  error: unknown,
) {
  try {
    const admin = getAdminClient();
    const now = new Date().toISOString();

    const message =
      error instanceof Error
        ? error.message
        : "The Google connection could not be used.";

    await admin
      .from("organisation_connections")
      .update({
        health_status: "Authentication Failed",
        last_failed_use_at: now,
        last_error_code:
          "google_token_refresh_failed",
        last_error_message: message.slice(0, 1000),
        last_error_at: now,
        reconnect_required_at: now,
      })
      .eq("id", connection.id);
  } catch (recordingError) {
    console.warn(
      "Google connection failure could not be recorded:",
      recordingError,
    );
  }
}

export function readGoogleTokenPayload(
  connection: GoogleConnection,
): GoogleTokenPayload {
  if (!connection.secret_reference) {
    throw new Error(
      "The Google connection does not contain a secure credential reference.",
    );
  }

  return decryptTokenPayload(
    connection.secret_reference,
  );
}

export async function getGoogleAccessToken(
  connection: GoogleConnection,
): Promise<string> {
  try {
    const storedTokens =
      readGoogleTokenPayload(connection);

    if (tokenIsUsable(storedTokens.expires_at)) {
      return storedTokens.access_token;
    }

    if (!storedTokens.refresh_token) {
      throw new Error(
        "The Google refresh token is unavailable. Reconnect Google Workspace.",
      );
    }

    const refreshedTokens =
      await refreshAccessToken(
        storedTokens.refresh_token,
      );

    if (!refreshedTokens.access_token) {
      throw new Error(
        "Google did not return a refreshed access token.",
      );
    }

    const expiresIn =
      typeof refreshedTokens.expires_in === "number"
        ? refreshedTokens.expires_in
        : 3600;

    const refreshedPayload: GoogleTokenPayload = {
      provider: "google",
      access_token:
        refreshedTokens.access_token,
      refresh_token:
        refreshedTokens.refresh_token ||
        storedTokens.refresh_token,
      token_type:
        refreshedTokens.token_type ||
        storedTokens.token_type ||
        "Bearer",
      scope:
        refreshedTokens.scope ||
        storedTokens.scope ||
        null,
      expires_at: new Date(
        Date.now() + expiresIn * 1000,
      ).toISOString(),
      created_at: new Date().toISOString(),
    };

    await saveRefreshedTokens(
      connection,
      refreshedPayload,
    );

    return refreshedPayload.access_token;
  } catch (error) {
    await markConnectionFailure(
      connection,
      error,
    );

    throw error;
  }
}