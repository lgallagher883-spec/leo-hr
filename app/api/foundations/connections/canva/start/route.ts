import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import {
  CANVA_SCOPES,
  buildCanvaPkceChallenge,
  buildCanvaPkceVerifier,
  buildCanvaState,
  getCanvaClientId,
} from "@/lib/canva/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

function redirectToConnections(origin: string, result: string) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/foundations/connections?canva=${encodeURIComponent(result)}`,
      origin,
    ),
  );
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const sessionReference =
      requestUrl.searchParams.get("session")?.trim() || "";

    if (!sessionReference) {
      return redirectToConnections(requestUrl.origin, "invalid-session");
    }

    const clientId = getCanvaClientId();

    if (!clientId) {
      throw new Error("Canva client ID is not configured.");
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL("/login", requestUrl.origin));
    }

    const admin = getAdminClient();

    const sessionResult = await admin
      .from("connection_auth_sessions")
      .select("*")
      .eq("session_reference", sessionReference)
      .maybeSingle();

    if (sessionResult.error || !sessionResult.data) {
      return redirectToConnections(requestUrl.origin, "session-not-found");
    }

    const session = sessionResult.data;

    if (
      session.initiated_by_user_id &&
      session.initiated_by_user_id !== user.id
    ) {
      return redirectToConnections(requestUrl.origin, "access-denied");
    }

    if (
      session.status !== "Created" &&
      session.status !== "Authorisation Started"
    ) {
      return redirectToConnections(requestUrl.origin, "session-used");
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await admin
        .from("connection_auth_sessions")
        .update({
          status: "Expired",
          error_code: "session_expired",
          error_message: "The Canva authorisation session expired.",
        })
        .eq("id", session.id);

      return redirectToConnections(requestUrl.origin, "session-expired");
    }

    const redirectUri = new URL(
      "/api/foundations/connections/canva/callback",
      requestUrl.origin,
    ).toString();
    const state = buildCanvaState(
      session.session_reference,
      session.state_hash,
    );
    const codeVerifier = buildCanvaPkceVerifier(
      session.session_reference,
      session.state_hash,
    );
    const codeChallenge = buildCanvaPkceChallenge(codeVerifier);

    const sessionUpdate = await admin
      .from("connection_auth_sessions")
      .update({
        status: "Authorisation Started",
        redirect_uri: redirectUri,
        requested_scopes: [...CANVA_SCOPES],
        error_code: null,
        error_message: null,
      })
      .eq("id", session.id);

    if (sessionUpdate.error) {
      throw new Error(
        sessionUpdate.error.message ||
          "The Canva authorisation session could not be updated.",
      );
    }

    const authorisationUrl = new URL(
      "https://www.canva.com/api/oauth/authorize",
    );

    authorisationUrl.searchParams.set("code_challenge", codeChallenge);
    authorisationUrl.searchParams.set("code_challenge_method", "s256");
    authorisationUrl.searchParams.set("response_type", "code");
    authorisationUrl.searchParams.set("client_id", clientId);
    authorisationUrl.searchParams.set("scope", CANVA_SCOPES.join(" "));
    authorisationUrl.searchParams.set("state", state);
    authorisationUrl.searchParams.set("redirect_uri", redirectUri);

    return NextResponse.redirect(authorisationUrl);
  } catch (error) {
    console.error("Canva connection start failed:", error);

    const requestUrl = new URL(request.url);
    return redirectToConnections(requestUrl.origin, "start-failed");
  }
}