import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { getGoogleProfile } from "@/lib/google/auth";
import { getGoogleAccessToken } from "@/lib/google/connection";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConnectionRecord = {
  id: number;
  organisation_id: string;
  provider_id: number;
  account_display_name: string | null;
  external_account_id: string | null;
  status: string;
  health_status: string | null;
  secret_reference: string | null;
};

type GoogleProfile = {
  sub?: string;
  name?: string;
  email?: string;
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

function getConnectionId(requestUrl: URL) {
  const rawValue =
    requestUrl.searchParams.get("connectionId")?.trim() ?? "";

  if (!/^\d+$/.test(rawValue)) {
    return null;
  }

  const connectionId = Number(rawValue);

  return Number.isSafeInteger(connectionId) && connectionId > 0
    ? connectionId
    : null;
}

async function requireConnectionHealthAccess() {
  const sessionClient = await createClient();

  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 },
      ),
    };
  }

  const admin = getAdminClient();

  const resolvedRole = await resolveAuthoritativeUserRole(admin as any, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;

  if (!organisationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  if (!resolvedRole) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  if (!["owner", "senior"].includes(resolvedRole.roleKey)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "Only an Owner or Senior user can verify organisation connections.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    user,
    admin,
    organisationId,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const connectionId = getConnectionId(requestUrl);

  if (!connectionId) {
    return NextResponse.json(
      {
        success: false,
        error: "A valid Google connection ID is required.",
      },
      { status: 400 },
    );
  }

  const authorisation = await requireConnectionHealthAccess();

  if (!authorisation.ok) {
    return authorisation.response;
  }

  const { admin, user, organisationId } = authorisation;

  const connectionResult = await admin
    .from("organisation_connections")
    .select(
      `
        id,
        organisation_id,
        provider_id,
        account_display_name,
        external_account_id,
        status,
        health_status,
        secret_reference,
        connection_providers!inner (
          id,
          name,
          provider_key
        )
      `,
    )
    .eq("id", connectionId)
    .eq("organisation_id", organisationId)
    .eq("is_archived", false)
    .maybeSingle();

  if (connectionResult.error || !connectionResult.data) {
    return NextResponse.json(
      {
        success: false,
        error: "The Google Workspace connection could not be found.",
      },
      { status: 404 },
    );
  }

  const connection = connectionResult.data as any;
  const provider = connection.connection_providers;
  const providerName =
    typeof provider?.name === "string"
      ? provider.name.toLowerCase()
      : "";
  const providerKey =
    typeof provider?.provider_key === "string"
      ? provider.provider_key.toLowerCase()
      : "";

  if (
    !providerName.includes("google") &&
    !providerKey.includes("google")
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "The selected connection is not a Google Workspace connection.",
      },
      { status: 400 },
    );
  }

  if (connection.status !== "Connected") {
    return NextResponse.json(
      {
        success: false,
        error:
          "The Google Workspace connection is not currently connected.",
      },
      { status: 409 },
    );
  }

  if (!connection.secret_reference) {
    return NextResponse.json(
      {
        success: false,
        error:
          "The Google Workspace connection has no stored token reference.",
      },
      { status: 409 },
    );
  }

  try {
    /*
     * getGoogleAccessToken owns token decryption and refresh.
     * It returns a usable access token and securely saves a
     * refreshed token package where refresh is required.
     */
    const accessToken = await getGoogleAccessToken(connection);
    const profile = (await getGoogleProfile(
      accessToken,
    )) as GoogleProfile;

    const now = new Date().toISOString();
    const accountDisplayName =
      profile.name ||
      profile.email ||
      connection.account_display_name ||
      "Google Workspace";

    const updateResult = await admin
      .from("organisation_connections")
      .update({
        account_display_name: accountDisplayName,
        external_account_id:
          profile.sub || connection.external_account_id,
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
      .eq("id", connection.id)
      .eq("organisation_id", connection.organisation_id);

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    const activityResult = await admin
      .from("connection_activity_history")
      .insert({
        organisation_id: connection.organisation_id,
        performed_by_user_id: user.id,
        provider_id: connection.provider_id,
        connection_id: connection.id,
        job_id: null,
        module_key: "Foundations",
        activity_type: "Connection Health Check",
        activity_summary:
          "Google Workspace connection was verified successfully.",
        activity_details: {
          account_display_name: accountDisplayName,
          account_email: profile.email || null,
          external_account_id:
            profile.sub || connection.external_account_id,
          result: "Healthy",
        },
      });

    if (activityResult.error) {
      console.warn(
        "Google health-check activity could not be recorded:",
        activityResult.error,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Google Workspace connection verified.",
      connection: {
        id: connection.id,
        status: "Connected",
        healthStatus: "Healthy",
        accountDisplayName,
        externalAccountId:
          profile.sub || connection.external_account_id,
      },
    });
  } catch (error) {
    console.error(
      "Google Workspace connection health check failed:",
      error,
    );

    const now = new Date().toISOString();
    const errorMessage =
      error instanceof Error
        ? error.message
        : "The Google Workspace connection health check failed.";

    const normalisedError = errorMessage.toLowerCase();
    const reconnectionRequired =
      normalisedError.includes("refresh token") ||
      normalisedError.includes("invalid_grant") ||
      normalisedError.includes("unauthorised") ||
      normalisedError.includes("unauthorized") ||
      normalisedError.includes("authentication") ||
      normalisedError.includes("sign-in") ||
      normalisedError.includes("reconnect");

    const failureUpdate = await admin
      .from("organisation_connections")
      .update({
        status: reconnectionRequired
          ? "Reconnect Required"
          : "Needs Attention",
        health_status: reconnectionRequired
          ? "Authentication Failed"
          : "Unavailable",
        last_failed_use_at: now,
        last_health_check_at: now,
        reconnect_required_at: reconnectionRequired
          ? now
          : null,
        last_error_code: reconnectionRequired
          ? "google_reconnect_required"
          : "google_health_check_failed",
        last_error_message: errorMessage.slice(0, 1000),
        last_error_at: now,
      })
      .eq("id", connection.id)
      .eq("organisation_id", connection.organisation_id);

    if (failureUpdate.error) {
      console.warn(
        "Google connection failure state could not be saved:",
        failureUpdate.error,
      );
    }

    const activityResult = await admin
      .from("connection_activity_history")
      .insert({
        organisation_id: connection.organisation_id,
        performed_by_user_id: user.id,
        provider_id: connection.provider_id,
        connection_id: connection.id,
        job_id: null,
        module_key: "Foundations",
        activity_type: "Connection Health Check Failed",
        activity_summary:
          "Google Workspace connection could not be verified.",
        activity_details: {
          result: reconnectionRequired
            ? "Reconnect Required"
            : "Needs Attention",
          error: errorMessage.slice(0, 1000),
        },
      });

    if (activityResult.error) {
      console.warn(
        "Google failed health-check activity could not be recorded:",
        activityResult.error,
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        reconnectRequired: reconnectionRequired,
      },
      { status: reconnectionRequired ? 401 : 500 },
    );
  }
}