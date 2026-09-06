import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalised = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalised.padEnd(
      normalised.length + ((4 - (normalised.length % 4)) % 4),
      "=",
    );

    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

export type ChatGptMcpContext = {
  supabase: ReturnType<typeof createSupabaseClient>;
  userId: string;
  organisationId: string;
  role: "Owner" | "Senior";
  oauthClientId: string;
  connectionId: number;
};

export async function authenticateChatGptMcpRequest(
  request: Request,
): Promise<
  | { ok: true; context: ChatGptMcpContext }
  | { ok: false; status: 401 | 403; message: string }
> {
  const token = readBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "A Leo OAuth access token is required.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      status: 401,
      message: "Leo authentication is not configured.",
    };
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const userResult = await supabase.auth.getUser(token);

  if (userResult.error || !userResult.data.user) {
    return {
      ok: false,
      status: 401,
      message: "The Leo OAuth token is invalid or has expired.",
    };
  }

  const jwtPayload = decodeJwtPayload(token);
  const oauthClientId =
    typeof jwtPayload?.client_id === "string"
      ? jwtPayload.client_id.trim()
      : "";

  if (!oauthClientId) {
    return {
      ok: false,
      status: 401,
      message: "This token was not issued to an approved OAuth client.",
    };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(supabase as any, {
    userId: userResult.data.user.id,
    allowedStatuses: ["active", "accepted"],
  });

  if (!resolvedRole) {
    return {
      ok: false,
      status: 403,
      message: "No active Leo organisation is available for this account.",
    };
  }

  if (resolvedRole.role !== "Owner" && resolvedRole.role !== "Senior") {
    return {
      ok: false,
      status: 403,
      message: "Owner or Senior access is required to use Leo from ChatGPT.",
    };
  }

  const providerResult = await (supabase as any)
    .from("connection_providers")
    .select("id")
    .eq("provider_key", "chatgpt")
    .eq("is_active", true)
    .or("is_archived.eq.false,is_archived.is.null")
    .maybeSingle();

  if (providerResult.error || !providerResult.data?.id) {
    return {
      ok: false,
      status: 403,
      message: "The ChatGPT connection is not available in Leo.",
    };
  }

  const connectionResult = await (supabase as any)
    .from("organisation_connections")
    .select(
      "id, status, external_account_id, connection_settings, is_archived",
    )
    .eq("organisation_id", resolvedRole.membership.organisation_id)
    .eq("provider_id", providerResult.data.id)
    .eq("is_archived", false)
    .maybeSingle();

  if (connectionResult.error || !connectionResult.data) {
    return {
      ok: false,
      status: 403,
      message:
        "ChatGPT has not been connected for this Leo organisation. An Owner or Senior user must approve it in Connections first.",
    };
  }

  const connection = connectionResult.data as {
    id: number;
    status: string | null;
    external_account_id: string | null;
    connection_settings: Record<string, unknown> | null;
  };

  const approvedClientId =
    (typeof connection.connection_settings?.oauth_client_id === "string"
      ? connection.connection_settings.oauth_client_id
      : connection.external_account_id) || "";

  if (connection.status !== "Connected" || approvedClientId !== oauthClientId) {
    return {
      ok: false,
      status: 403,
      message:
        "This ChatGPT OAuth client has not been approved for the current Leo organisation.",
    };
  }

  return {
    ok: true,
    context: {
      supabase,
      userId: userResult.data.user.id,
      organisationId: resolvedRole.membership.organisation_id,
      role: resolvedRole.role,
      oauthClientId,
      connectionId: Number(connection.id),
    },
  };
}
