import type { SupabaseClient } from "@supabase/supabase-js";
import { getUsableDocuSignToken } from "./tokens";

export type DocuSignContext = { connection: Record<string, any>; accessToken: string; accountId: string; apiBaseUrl: string };

export async function getDocuSignContext(admin: SupabaseClient, organisationId: string, connectionId?: number | null): Promise<DocuSignContext> {
  let query = admin.from("organisation_connections").select("*, connection_providers!inner(id, provider_key, name)").eq("organisation_id", organisationId).eq("status", "Connected").eq("connection_providers.provider_key", "docusign");
  if (connectionId) query = query.eq("id", connectionId);
  const result = await query.order("connected_at", { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error("No connected DocuSign account is available.");
  const token = await getUsableDocuSignToken(admin, result.data);
  return { connection: result.data, accessToken: token.access_token, accountId: token.account_id, apiBaseUrl: token.base_uri.replace(/\/+$/, "") };
}
export async function docuSignRequest<T>(context: DocuSignContext, path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${context.apiBaseUrl}/restapi/v2.1/accounts/${encodeURIComponent(context.accountId)}${path}`, {
    method,
    headers: { Authorization: `Bearer ${context.accessToken}`, Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (response.status === 204) return {} as T;
  const payload = await response.json().catch(() => ({})) as T & { errorCode?: string; message?: string };
  if (!response.ok) throw new Error(payload.message || payload.errorCode || `DocuSign returned HTTP ${response.status}.`);
  return payload;
}
export async function docuSignBinaryRequest(context: DocuSignContext, path: string): Promise<{ data: Buffer; contentType: string; fileName: string | null }> {
  const response = await fetch(`${context.apiBaseUrl}/restapi/v2.1/accounts/${encodeURIComponent(context.accountId)}${path}`, { headers: { Authorization: `Bearer ${context.accessToken}` }, cache: "no-store" });
  if (!response.ok) throw new Error((await response.text().catch(() => "")) || `DocuSign returned HTTP ${response.status}.`);
  const disposition = response.headers.get("content-disposition") || "";
  return { data: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") || "application/octet-stream", fileName: disposition.match(/filename="?([^"]+)"?/i)?.[1] || null };
}