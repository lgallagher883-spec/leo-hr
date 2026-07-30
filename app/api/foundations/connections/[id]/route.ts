import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
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

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ConnectionAction =
  | "update_settings"
  | "suspend"
  | "restore"
  | "disconnect";

type UpdateBody = {
  action?: unknown;
  connection_name?: unknown;
  account_display_name?: unknown;
  external_account_id?: unknown;
  external_tenant_id?: unknown;
  external_workspace_id?: unknown;
  sync_enabled?: unknown;
  sync_frequency?: unknown;
};

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const permittedActions = new Set<ConnectionAction>([
  "update_settings",
  "suspend",
  "restore",
  "disconnect",
]);

const syncFrequencies = new Set([
  "Manual",
  "Hourly",
  "Daily",
  "Weekly",
  "Monthly",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const valueText = text(value);
  return valueText || null;
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
          error:
            minimumRole === "Senior"
              ? "Senior or Owner access is required."
              : "You do not have access to Connections.",
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

async function getOrganisationConnection(
  supabase: any,
  connectionId: number,
  organisationId: string,
) {
  return (supabase as any)
    .from("organisation_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("organisation_id", organisationId)
    .eq("is_archived", false)
    .maybeSingle();
}

async function recordActivity(
  supabase: any,
  {
    organisationId,
    userId,
    providerId,
    connectionId,
    activityType,
    summary,
    details,
  }: {
    organisationId: string;
    userId: string;
    providerId: number;
    connectionId: number;
    activityType: string;
    summary: string;
    details?: Record<string, unknown>;
  },
) {
  const result = await (supabase as any)
    .from("connection_activity_history")
    .insert({
      organisation_id: organisationId,
      performed_by_user_id: userId,
      provider_id: providerId,
      connection_id: connectionId,
      job_id: null,
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

export async function GET(
  _request: Request,
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

    const supabase = await createClient();

    const access = await getAuthorisedContext(
      supabase,
      "Senior",
    );

    if ("response" in access) {
      return access.response;
    }

    const admin = getAdminClient();

    const connectionResult = await getOrganisationConnection(
      admin,
      connectionId,
      access.organisationId,
    );

    if (connectionResult.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            connectionResult.error.message ||
            "The connection could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (!connectionResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "The connection could not be found.",
        },
        { status: 404 },
      );
    }

    const connection = connectionResult.data;

    const [
      providerResult,
      providerCapabilitiesResult,
      connectionCapabilitiesResult,
      modulesResult,
      permissionsResult,
      healthResult,
      jobsResult,
      resourcesResult,
      activityResult,
    ] = await Promise.all([
      (admin as any)
        .from("connection_providers")
        .select("*")
        .eq("id", connection.provider_id)
        .eq("is_active", true)
        .eq("is_archived", false)
        .maybeSingle(),

      (admin as any)
        .from("connection_provider_capabilities")
        .select("*")
        .eq("provider_id", connection.provider_id)
        .eq("is_active", true)
        .order("capability_group")
        .order("name"),

      (admin as any)
        .from("organisation_connection_capabilities")
        .select("*")
        .eq("connection_id", connectionId),

      (admin as any)
        .from("organisation_connection_modules")
        .select("*")
        .eq("connection_id", connectionId)
        .order("module_key"),

      (admin as any)
        .from("organisation_connection_role_permissions")
        .select("*")
        .eq("connection_id", connectionId)
        .order("role_key"),

      (admin as any)
        .from("connection_health_checks")
        .select("*")
        .eq("connection_id", connectionId)
        .order("checked_at", { ascending: false })
        .limit(20),

      (admin as any)
        .from("connection_jobs")
        .select("*")
        .eq("connection_id", connectionId)
        .order("requested_at", { ascending: false })
        .limit(50),

      (admin as any)
        .from("connection_external_resources")
        .select("*")
        .eq("connection_id", connectionId)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(50),

      (admin as any)
        .from("connection_activity_history")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const firstError =
      providerResult.error ||
      providerCapabilitiesResult.error ||
      connectionCapabilitiesResult.error ||
      modulesResult.error ||
      permissionsResult.error ||
      healthResult.error ||
      jobsResult.error ||
      resourcesResult.error ||
      activityResult.error;

    if (firstError) {
      return NextResponse.json(
        {
          success: false,
          error:
            firstError.message ||
            "The connection workspace could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      connection,
      provider: providerResult.data ?? null,
      providerCapabilities:
        providerCapabilitiesResult.data ?? [],
      connectionCapabilities:
        connectionCapabilitiesResult.data ?? [],
      modules: modulesResult.data ?? [],
      permissions: permissionsResult.data ?? [],
      healthChecks: healthResult.data ?? [],
      jobs: jobsResult.data ?? [],
      externalResources: resourcesResult.data ?? [],
      activity: activityResult.data ?? [],
    });
  } catch (error) {
    console.error("Connection workspace loader failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The connection workspace could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const supabase = await createClient();

    const access = await getAuthorisedContext(
      supabase,
      "Senior",
    );

    if ("response" in access) {
      return access.response;
    }

    const admin = getAdminClient();

    let body: UpdateBody;

    try {
      body = (await request.json()) as UpdateBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "The connection request is invalid.",
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

    const connectionResult = await getOrganisationConnection(
      admin,
      connectionId,
      access.organisationId,
    );

    if (connectionResult.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            connectionResult.error.message ||
            "The connection could not be checked.",
        },
        { status: 500 },
      );
    }

    if (!connectionResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "The connection could not be found.",
        },
        { status: 404 },
      );
    }

    const connection = connectionResult.data;

    const providerResult = await (admin as any)
      .from("connection_providers")
      .select("*")
      .eq("id", connection.provider_id)
      .maybeSingle();

    if (providerResult.error || !providerResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "The connection provider could not be found.",
        },
        { status: 404 },
      );
    }

    const provider = providerResult.data;
    const now = new Date().toISOString();

    let updateValues: Record<string, unknown>;
    let activityType: string;
    let activitySummary: string;
    let activityDetails: Record<string, unknown> = {};
    let successMessage: string;

    if (action === "update_settings") {
      if (
        body.sync_enabled !== undefined &&
        typeof body.sync_enabled !== "boolean"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "The synchronisation setting is invalid.",
          },
          { status: 400 },
        );
      }

      const syncEnabled = body.sync_enabled === true;
      const syncFrequency =
        text(body.sync_frequency) || "Manual";

      if (!syncFrequencies.has(syncFrequency)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The synchronisation frequency is invalid.",
          },
          { status: 400 },
        );
      }

      updateValues = {
        connection_name:
          optionalText(body.connection_name) || provider.name,
        account_display_name: optionalText(
          body.account_display_name,
        ),
        external_account_id: optionalText(
          body.external_account_id,
        ),
        external_tenant_id: optionalText(
          body.external_tenant_id,
        ),
        external_workspace_id: optionalText(
          body.external_workspace_id,
        ),
        sync_enabled: syncEnabled,
        sync_frequency: syncEnabled
          ? syncFrequency
          : "Manual",
      };

      activityType = "Settings Updated";
      activitySummary =
        `${provider.name} connection settings updated.`;
      activityDetails = {
        sync_enabled: syncEnabled,
        sync_frequency: syncEnabled
          ? syncFrequency
          : "Manual",
      };
      successMessage = "Connection settings updated.";
    } else if (action === "suspend") {
      updateValues = {
        status: "Suspended",
        health_status: "Unavailable",
        suspended_at: now,
        sync_enabled: false,
      };

      activityType = "Suspended";
      activitySummary =
        `${provider.name} connection suspended.`;
      successMessage =
        `${provider.name} has been suspended.`;
    } else if (action === "restore") {
      updateValues = {
        status: connection.connected_at
          ? "Connected"
          : "Connection Pending",
        health_status: "Not Checked",
        suspended_at: null,
      };

      activityType = "Reconnected";
      activitySummary =
        `${provider.name} connection restored.`;
      successMessage =
        `${provider.name} has been restored.`;
    } else {
      if (provider.supports_disconnect === false) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This provider does not support disconnection.",
          },
          { status: 400 },
        );
      }

      updateValues = {
        status: "Disconnected",
        health_status: "Unavailable",
        disconnected_at: now,
        sync_enabled: false,
        token_expires_at: null,
        authorised_scopes: [],
      };

      activityType = "Disconnected";
      activitySummary = `${provider.name} disconnected.`;
      successMessage =
        `${provider.name} has been disconnected.`;
    }

    const updateResult = await (admin as any)
      .from("organisation_connections")
      .update(updateValues)
      .eq("id", connectionId)
      .eq("organisation_id", access.organisationId)
      .select("*")
      .single();

    if (updateResult.error || !updateResult.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            updateResult.error?.message ||
            "The connection could not be updated.",
        },
        { status: 500 },
      );
    }

    await recordActivity(admin, {
      organisationId: access.organisationId,
      userId: access.user.id,
      providerId: connection.provider_id,
      connectionId,
      activityType,
      summary: activitySummary,
      details: activityDetails,
    });

    return NextResponse.json({
      success: true,
      connection: updateResult.data,
      message: successMessage,
    });
  } catch (error) {
    console.error("Connection update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The connection could not be updated.",
      },
      { status: 500 },
    );
  }
}