import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  resolveCareCheckConfig,
  type CareCheckConfig,
} from "./client";

type CareCheckSecretPayload = {
  provider: "carecheck";
  username: string;
  password: string;
  created_at: string;
};

type OrganisationConnection = {
  id: number | string;
  organisation_id: string;
  status?: string | null;
  secret_reference?: string | null;
  connection_settings?: Record<string, unknown> | null;
};

function encryptionKey(): Buffer {
  const secret =
    process.env.LEO_CONNECTION_ENCRYPTION_KEY ||
    process.env.CONNECTION_TOKEN_ENCRYPTION_KEY ||
    "";

  if (!secret) {
    throw new Error("LEO_CONNECTION_ENCRYPTION_KEY is not configured.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptCareCheckCredentials(input: {
  username: string;
  password: string;
}): string {
  const username = input.username.trim();

  if (!username || !input.password) {
    throw new Error("CareCheck username and password are required.");
  }

  const payload: CareCheckSecretPayload = {
    provider: "carecheck",
    username,
    password: input.password,
    created_at: new Date().toISOString(),
  };

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  return [
    "leo-carecheck-v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptCareCheckCredentials(
  secretReference: string,
): CareCheckSecretPayload {
  const parts = secretReference.split(".");

  if (parts.length !== 4 || parts[0] !== "leo-carecheck-v1") {
    throw new Error("The stored CareCheck credential is invalid.");
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(parts[1], "base64url"),
    );

    decipher.setAuthTag(Buffer.from(parts[2], "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(parts[3], "base64url")),
      decipher.final(),
    ]);

    const payload = JSON.parse(
      decrypted.toString("utf8"),
    ) as Partial<CareCheckSecretPayload>;

    if (
      payload.provider !== "carecheck" ||
      typeof payload.username !== "string" ||
      !payload.username.trim() ||
      typeof payload.password !== "string" ||
      !payload.password
    ) {
      throw new Error("The stored CareCheck credential is incomplete.");
    }

    return {
      provider: "carecheck",
      username: payload.username.trim(),
      password: payload.password,
      created_at:
        typeof payload.created_at === "string"
          ? payload.created_at
          : new Date().toISOString(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("The stored CareCheck")
    ) {
      throw error;
    }

    throw new Error(
      "The stored CareCheck credential could not be decrypted.",
    );
  }
}

async function loadConnection(
  admin: SupabaseClient,
  organisationId: string,
): Promise<OrganisationConnection | null> {
  const result = await admin
    .from("organisation_connections")
    .select(
      "id,organisation_id,status,secret_reference,connection_settings,provider:connection_providers!inner(provider_key)",
    )
    .eq("organisation_id", organisationId)
    .eq("connection_providers.provider_key", "carecheck")
    .in("status", ["Connected", "Limited"])
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data as OrganisationConnection | null) ?? null;
}

export async function getOrganisationCareCheckConfig(
  admin: SupabaseClient,
  organisationId: string,
): Promise<CareCheckConfig> {
  return resolveCareCheckConfig({
    organisationId,
    loadOrganisationConnection: async (scopedOrganisationId) => {
      const connection = await loadConnection(admin, scopedOrganisationId);

      if (!connection?.secret_reference) {
        return null;
      }

      const credentials = decryptCareCheckCredentials(
        connection.secret_reference,
      );
      const settings =
        connection.connection_settings &&
        typeof connection.connection_settings === "object"
          ? connection.connection_settings
          : {};

      return {
        environment: settings.environment,
        username: credentials.username,
        password: credentials.password,
        organisation_reference: settings.organisation_reference,
      };
    },
  });
}
