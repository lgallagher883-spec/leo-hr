import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ConnectionAction =
  | "begin_connection"
  | "test_connection"
  | "manual_sync";

type ActionBody = {
  action?: unknown;
};

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const permittedActions = new Set<ConnectionAction>([
  "begin_connection",
  "test_connection",
  "manual_sync",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();

  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";

  return "Employee";
}

function parseConnectionId(value: string): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  return id;
}

async function getAuthorisedContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  minimumRole: PlatformRole,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(
    supabase as any,
    {
      userId: user.id,
      allowedStatuses: ["active", "accepted"],
    },
  );

  const organisationId =
    resolvedRole?.membership.organisation_id ?? null;

  const role = normaliseRole(resolvedRole?.roleKey);

  if (!organisationId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error:
            "Leo could not find an active organisation for your account.",
        },
        { status: 403 },
      ),
    };
  }

  if (roleRank[role] < roleRank[minimumRole]) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Senior or Owner access is required.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    organisationId,
    role,
  };
}

async function getConnectionAndProvider(
  supabase: Awaited<ReturnType<typeof createClient>>,
  connectionId: number,
  organisationId: string,
) {
  const connectionResult = await (supabase as any)
    .from("organisation_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("organisation_id", organisationId)
    .eq("is_archived", false)
    .maybeSingle();

  if (connectionResult.error || !connectionResult.data) {
    return {
      error:
        connectionResult.error?.message ||
        "The connection could not be found.",
      connection: null,
      provider: null,
    };
  }

  const providerResult = await (supabase as any)
    .from("connection_providers")
    .select("*")
    .eq("id", connectionResult.data.provider_id)
    .eq("is_active", true)
    .eq("is_archived", false)
    .maybeSingle();

  if (providerResult.error || !providerResult.data) {
    return {
      error:
        providerResult.error?.message ||
        "The connection provider could not be found.",
      connection: null,
      provider: null,
    };
  }

  return {
    error: null,
    connection: connectionResult.data,
    provider: providerResult.data,
  };
}

async function recordActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    organisationId,
    userId,
    providerId,
    connectionId,
    jobId,
    activityType,
    summary,
    details,
  }: {
    organisationId: string;
    userId: string;
    providerId: number;
    connectionId: number;
    jobId?: number | null;
    activityType: string;
    summary: string;
    details?: Record<string, unknown> | null;
  },
) {
  const result = await (supabase as any)
    .from("connection_activity_history")
    .insert({
      organisation_id: organisationId,
      performed_by_user_id: userId,
      provider_id: providerId,
      connection_id: connectionId,
      job_id: jobId ?? null,
      module_key: "Foundations",
      activity_type: activityType,
      activity_summary: summary,
      activity_details: details ?? {},
    });

  if (result.error) {
    console.warn(
      "Connection activity could not be recorded:",
      result.error,
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const connectionId = parseConnectionId(id);

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: "The connection reference is invalid.",
        },
        { status: 400 },
      );
    }

    let body: ActionBody;

    try {
      body = (await request.json()) as ActionBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "The connection action is invalid.",
        },
        { status: 400 },
      );
    }

    const action = text(body.action) as ConnectionAction;

    if (!permittedActions.has(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "The requested connection action is invalid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const access = await getAuthorisedContext(
      supabase,
      "Senior",
    );

    if ("response" in access) {
      return access.response;
    }

    const lookup = await getConnectionAndProvider(
      supabase,
      connectionId,
      access.organisationId,
    );

    if (
      lookup.error ||
      !lookup.connection ||
      !lookup.provider
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            lookup.error ||
            "The connection could not be found.",
        },
        { status: 404 },
      );
    }

    const connection = lookup.connection;
    const provider = lookup.provider;
    const now = new Date().toISOString();

    if (action === "begin_connection") {
      if (provider.setup_status !== "Available") {
        return NextResponse.json({
          success: true,
          message:
            `${provider.name} is prepared in the Connections framework, ` +
            "but its secure provider authorisation route has not been activated yet.",
        });
      }

      const sessionReference = randomUUID();
      const stateHash = randomUUID();

      const sessionResult = await (supabase as any)
        .from("connection_auth_sessions")
        .insert({
          organisation_id: access.organisationId,
          initiated_by_user_id: access.user.id,
          provider_id: provider.id,
          connection_id: connectionId,
          session_reference: sessionReference,
          state_hash: stateHash,
          requested_scopes: [],
          status: "Created",
          expires_at: new Date(
            Date.now() + 15 * 60 * 1000,
          ).toISOString(),
        })
        .select("*")
        .single();

      if (sessionResult.error || !sessionResult.data) {
        return NextResponse.json(
          {
            success: false,
            error:
              sessionResult.error?.message ||
              "The secure connection session could not be created.",
          },
          { status: 500 },
        );
      }

      const connectionResult = await (supabase as any)
        .from("organisation_connections")
        .update({
          status: "Connection Pending",
          health_status: "Configuration Required",
        })
        .eq("id", connectionId)
        .eq("organisation_id", access.organisationId)
        .select("*")
        .single();

      if (
        connectionResult.error ||
        !connectionResult.data
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              connectionResult.error?.message ||
              "The connection could not be prepared.",
          },
          { status: 500 },
        );
      }

      await recordActivity(supabase, {
        organisationId: access.organisationId,
        userId: access.user.id,
        providerId: provider.id,
        connectionId,
        activityType: "Connection Started",
        summary:
          `Secure connection started for ${provider.name}.`,
        details: {
          session_reference: sessionReference,
        },
      });

      return NextResponse.json({
        success: true,
        connection: connectionResult.data,
        session: sessionResult.data,
        message:
          `The secure ${provider.name} connection session has been prepared. ` +
          "The provider-specific server authorisation route is the next implementation step.",
      });
    }

    if (action === "test_connection") {
      const jobResult = await (supabase as any)
        .from("connection_jobs")
        .insert({
          organisation_id: access.organisationId,
          requested_by_user_id: access.user.id,
          connection_id: connectionId,
          module_key: "Foundations",
          action_key: "test_connection",
          direction: "Test",
          title: `Test ${provider.name} connection`,
          status: "Preparing",
          progress_percent: 10,
          started_at: now,
          request_payload: {},
          response_payload: {},
        })
        .select("*")
        .single();

      if (jobResult.error || !jobResult.data) {
        return NextResponse.json(
          {
            success: false,
            error:
              jobResult.error?.message ||
              "The connection test could not be started.",
          },
          { status: 500 },
        );
      }

      const liveConnection =
        connection.status === "Connected";

      const healthStatus = liveConnection
        ? "Healthy"
        : provider.setup_status === "Available"
          ? "Configuration Required"
          : "Unavailable";

      const summary = liveConnection
        ? `${provider.name} connection is available.`
        : provider.setup_status === "Available"
          ? `${provider.name} requires authorisation or configuration.`
          : `${provider.name} provider activation is not available yet.`;

      const healthResult = await (supabase as any)
        .from("connection_health_checks")
        .insert({
          connection_id: connectionId,
          check_type: "Connection",
          status: healthStatus,
          summary,
          diagnostic_details: {
            provider_setup_status: provider.setup_status,
            connection_status: connection.status,
          },
        });

      if (healthResult.error) {
        return NextResponse.json(
          {
            success: false,
            error:
              healthResult.error.message ||
              "The connection health check could not be recorded.",
          },
          { status: 500 },
        );
      }

      const connectionUpdateResult = await (
        supabase as any
      )
        .from("organisation_connections")
        .update({
          health_status: healthStatus,
          last_health_check_at: now,
          last_error_message:
            healthStatus === "Healthy" ? null : summary,
          last_error_at:
            healthStatus === "Healthy" ? null : now,
        })
        .eq("id", connectionId)
        .eq("organisation_id", access.organisationId)
        .select("*")
        .single();

      if (
        connectionUpdateResult.error ||
        !connectionUpdateResult.data
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              connectionUpdateResult.error?.message ||
              "The connection status could not be updated.",
          },
          { status: 500 },
        );
      }

      const jobStatus =
        healthStatus === "Healthy"
          ? "Completed"
          : "Partially Completed";

      const jobUpdateResult = await (supabase as any)
        .from("connection_jobs")
        .update({
          status: jobStatus,
          progress_percent: 100,
          completed_at: now,
          error_message:
            healthStatus === "Healthy" ? null : summary,
          response_payload: {
            health_status: healthStatus,
            summary,
          },
        })
        .eq("id", jobResult.data.id)
        .eq("connection_id", connectionId)
        .select("*")
        .single();

      if (
        jobUpdateResult.error ||
        !jobUpdateResult.data
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              jobUpdateResult.error?.message ||
              "The connection test job could not be completed.",
          },
          { status: 500 },
        );
      }

      await recordActivity(supabase, {
        organisationId: access.organisationId,
        userId: access.user.id,
        providerId: provider.id,
        connectionId,
        jobId: jobResult.data.id,
        activityType: "Connection Tested",
        summary,
        details: {
          health_status: healthStatus,
        },
      });

      return NextResponse.json({
        success: true,
        connection: connectionUpdateResult.data,
        job: jobUpdateResult.data,
        healthStatus,
        message: summary,
      });
    }

    if (connection.status !== "Connected") {
      return NextResponse.json(
        {
          success: false,
          error:
            "The provider must be connected before synchronisation can run.",
        },
        { status: 400 },
      );
    }

    if (provider.supports_background_sync === false) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This provider does not support synchronisation.",
        },
        { status: 400 },
      );
    }

    const syncJobResult = await (supabase as any)
      .from("connection_jobs")
      .insert({
        organisation_id: access.organisationId,
        requested_by_user_id: access.user.id,
        connection_id: connectionId,
        module_key: "Foundations",
        action_key: "manual_sync",
        direction: "Synchronise",
        title: `Synchronise ${provider.name}`,
        status: "Queued",
        progress_percent: 0,
        request_payload: {},
        response_payload: {},
      })
      .select("*")
      .single();

    if (syncJobResult.error || !syncJobResult.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            syncJobResult.error?.message ||
            "The synchronisation job could not be created.",
        },
        { status: 500 },
      );
    }

    await recordActivity(supabase, {
      organisationId: access.organisationId,
      userId: access.user.id,
      providerId: provider.id,
      connectionId,
      jobId: syncJobResult.data.id,
      activityType: "Synchronisation Started",
      summary:
        `${provider.name} synchronisation queued.`,
      details: null,
    });

    return NextResponse.json(
      {
        success: true,
        job: syncJobResult.data,
        message:
          `${provider.name} synchronisation has been queued. ` +
          "A provider worker will process it once that integration is active.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Connection action failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The connection action could not be completed.",
      },
      { status: 500 },
    );
  }
}