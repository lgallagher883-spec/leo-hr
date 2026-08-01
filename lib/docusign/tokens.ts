import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocuSignTokenPayload } from "./types";

type RefreshResponse = { access_token?: string; refresh_token?: string; token_type?: string; expires_in?: number; scope?: string; error?: string; error_description?: string };

function key(): Buffer {
  const secret = process.env.LEO_CONNECTION_ENCRYPTION_KEY || process.env.CONNECTION_TOKEN_ENCRYPTION_KEY || "";
  if (!secret) throw new Error("LEO_CONNECTION_ENCRYPTION_KEY is not configured.");
  return createHash("sha256").update(secret).digest();
}
function authBase(): string {
  return (process.env.DOCUSIGN_AUTH_BASE_URL || "https://account-d.docusign.com").replace(/\/+$/, "");
}
export function encryptDocuSignToken(payload: DocuSignTokenPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return ["leo-oauth-v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}
export function decryptDocuSignToken(secretReference: string): DocuSignTokenPayload {
  const parts = secretReference.split(".");
  if (parts.length !== 4 || parts[0] !== "leo-oauth-v1") throw new Error("The DocuSign token package is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(parts[1], "base64url"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]);
  const payload = JSON.parse(decrypted.toString("utf8")) as DocuSignTokenPayload;
  if (payload.provider !== "docusign" || !payload.access_token || !payload.account_id || !payload.base_uri) throw new Error("The DocuSign token package is incomplete.");
  return payload;
}
function expired(payload: DocuSignTokenPayload): boolean {
  if (!payload.expires_at) return false;
  const value = new Date(payload.expires_at).getTime();
  return Number.isFinite(value) && value <= Date.now() + 300000;
}
async function refresh(refreshToken: string): Promise<RefreshResponse> {
  const clientId = process.env.DOCUSIGN_CLIENT_ID || "";
  const clientSecret = process.env.DOCUSIGN_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) throw new Error("DocuSign OAuth credentials are not configured.");
  const response = await fetch(`${authBase()}/oauth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    cache: "no-store",
  });
  const data = await response.json() as RefreshResponse;
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || "DocuSign token refresh failed.");
  return data;
}
export async function getUsableDocuSignToken(admin: SupabaseClient, connection: Record<string, any>): Promise<DocuSignTokenPayload> {
  if (!connection.secret_reference) throw new Error("The DocuSign connection has no stored credential.");
  const current = decryptDocuSignToken(connection.secret_reference);
  if (!expired(current)) return current;
  if (!current.refresh_token) throw new Error("The DocuSign connection must be reconnected.");
  const result = await refresh(current.refresh_token);
  const next: DocuSignTokenPayload = { ...current, access_token: result.access_token!, refresh_token: result.refresh_token || current.refresh_token, token_type: result.token_type || "Bearer", scope: result.scope || current.scope, expires_at: new Date(Date.now() + (result.expires_in || 3600) * 1000).toISOString() };
  const update = await admin.from("organisation_connections").update({ secret_reference: encryptDocuSignToken(next), token_expires_at: next.expires_at, status: "Connected", health_status: "Healthy", last_successful_use_at: new Date().toISOString(), reconnect_required_at: null, last_error_code: null, last_error_message: null, last_error_at: null }).eq("id", connection.id).eq("organisation_id", connection.organisation_id);
  if (update.error) throw new Error(update.error.message);
  return next;
}