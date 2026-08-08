import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import {
  zoomApiRequest,
} from "@/lib/zoom/auth";
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

function getConnectionId(
  requestUrl: URL,
) {
  const value =
    requestUrl.searchParams
      .get("connectionId")
      ?.trim() || "";

  const id = Number(value);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

async function requireHealthAccess() {
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

  const resolvedRole =
    await resolveAuthoritativeUserRole(
      admin as any,
      {
        userId: user.id,
        allowedStatuses: ["active"],
      },
    );

  const organisationId =
    resolvedRole?.membership
      .organisation_id ?? null;

  if (!organisationId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error:
            "You do not have access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  if (
    !resolvedRole ||
    !["owner", "senior"].includes(
      resolvedRole.roleKey,
    )
  ) {
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

export async function GET(
  request: Request,
) {
  const requestUrl = new URL(request.url);
  const access =
    await requireHealthAccess();

  if (!access.ok) {
    return access.response;
  }

  const {
    admin,
    organisationId,
    user,
  } = access;

  const connectionId =
    getConnectionId(requestUrl);

  if (!connectionId) {
    return NextResponse.json(
      {
        success: false,
        error:
          "A valid Zoom connection ID is required.",
      },
      { status: 400 },
    );
  }

  const connectionResult = await admin
    .from("organisation_connections")
    .select(
      "id, organisation_id, provider_id, status, account_display_name",
    )
    .eq("id", connectionId)
    .eq(
      "organisation_id",
      organisationId,
    )
    .eq("is_archived", false)
    .maybeSingle();

  if (
    connectionResult.error ||
    !connectionResult.data
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "The Zoom connection could not be found.",
      },
      { status: 404 },
    );
  }

  const now =
    new Date().toISOString();

  try {
    const zoomResult =
      await zoomApiRequest<{
        page_count?: number;
        page_number?: number;
        page_size?: number;
        total_records?: number;
        meetings?: Array<{
          id?: number;
          uuid?: string;
          topic?: string;
          start_time?: string;
        }>;
      }>(
        connectionId,
        "/users/me/meetings?page_size=1",
        {
          method: "GET",
        },
      );

    const externalAccountId = null;
    const externalWorkspaceId = null;

    const accountDisplayName =
      connectionResult.data.account_display_name ||
      "Zoom";

    const updateResult = await admin
      .from("organisation_connections")
      .update({
        account_display_name:
          accountDisplayName,
        external_account_id:
          externalAccountId,
        external_workspace_id:
          externalWorkspaceId,
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
      .eq("id", connectionId)
      .eq(
        "organisation_id",
        organisationId,
      );

    if (updateResult.error) {
      throw new Error(
        updateResult.error.message,
      );
    }

    await admin
      .from("connection_health_checks")
      .insert({
        connection_id: connectionId,
        check_type: "Connection",
        status: "Healthy",
        summary:
          "Zoom connection is healthy and authorised.",
        diagnostic_details: {
          external_account_id:
            externalAccountId,
          external_workspace_id:
            externalWorkspaceId,
          token_refreshed:
            zoomResult.tokenRefreshed,
          meetings_visible:
            Array.isArray(zoomResult.data.meetings)
              ? zoomResult.data.meetings.length
              : 0,
        },
      });

    await admin
      .from("connection_activity_history")
      .insert({
        organisation_id:
          organisationId,
        performed_by_user_id:
          user.id,
        provider_id:
          connectionResult.data
            .provider_id,
        connection_id:
          connectionId,
        job_id: null,
        module_key: "Foundations",
        activity_type:
          "Connection Health Check",
        activity_summary:
          "Zoom connection was verified successfully.",
        activity_details: {
          account_display_name:
            accountDisplayName,
          external_account_id:
            externalAccountId,
          external_workspace_id:
            externalWorkspaceId,
          token_refreshed:
            zoomResult.tokenRefreshed,
          result: "Healthy",
        },
      });

    return NextResponse.json({
      success: true,
      message:
        zoomResult.tokenRefreshed
          ? "Zoom token refreshed and connection verified."
          : "Zoom connection verified.",
      tokenRefreshed:
        zoomResult.tokenRefreshed,
      connection: {
        id: connectionId,
        status: "Connected",
        healthStatus: "Healthy",
        accountDisplayName,
        externalAccountId,
        externalWorkspaceId,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "The Zoom connection health check failed.";

    const lower =
      errorMessage.toLowerCase();

    const reconnectRequired =
      lower.includes("refresh token") ||
      lower.includes(
        "authentication",
      ) ||
      lower.includes("access token") ||
      lower.includes("invalid token") ||
      lower.includes("401");

    await admin
      .from("organisation_connections")
      .update({
        status: reconnectRequired
          ? "Reconnect Required"
          : "Needs Attention",
        health_status:
          reconnectRequired
            ? "Authentication Failed"
            : "Unavailable",
        last_failed_use_at: now,
        last_health_check_at: now,
        reconnect_required_at:
          reconnectRequired
            ? now
            : null,
        last_error_code:
          reconnectRequired
            ? "zoom_reconnect_required"
            : "zoom_health_check_failed",
        last_error_message:
          errorMessage.slice(
            0,
            1000,
          ),
        last_error_at: now,
      })
      .eq("id", connectionId)
      .eq(
        "organisation_id",
        organisationId,
      );

    await admin
      .from("connection_health_checks")
      .insert({
        connection_id: connectionId,
        check_type: "Connection",
        status: reconnectRequired
          ? "Authentication Failed"
          : "Unavailable",
        summary:
          errorMessage.slice(
            0,
            1000,
          ),
        diagnostic_details: {
          reconnect_required:
            reconnectRequired,
        },
      });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status:
          reconnectRequired
            ? 401
            : 502,
      },
    );
  }
}