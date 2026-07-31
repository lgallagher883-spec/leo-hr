import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "The Supabase service-role configuration is unavailable."
    );
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type CreateConnectionBody = {
  action?: unknown;
  preferences?: unknown;
  provider_id?: unknown;
  connection_name?: unknown;
  account_display_name?: unknown;
  external_account_id?: unknown;
  external_tenant_id?: unknown;
  external_workspace_id?: unknown;
  sync_enabled?: unknown;
  sync_frequency?: unknown;
};

type PreferenceCapability =
  | "email"
  | "calendar"
  | "meetings"
  | "documents";

type PreferenceSelection = Record<
  PreferenceCapability,
  number | null
>;

const preferenceCapabilities: PreferenceCapability[] = [
  "email",
  "calendar",
  "meetings",
  "documents",
];

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const moduleKeys = [
  "Foundations",
  "Ask Leo",
  "Matters",
  "Employees",
  "Compliance",
  "Policies",
  "Documents",
  "SAR Requests",
  "Insights",
  "Audit Logs",
  "Leo Learn",
  "AI Studio",
  "Learning Library",
  "Development Pathways",
  "Qualifications and Certificates",
  "Leo Talent",
  "Billing",
  "Platform Administration",
];

const roleKeys = [
  "Owner",
  "HR",
  "Manager",
  "Employee",
  "Platform Administrator",
];

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

function parsePreferenceSelections(
  value: unknown,
): PreferenceSelection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const selections = {} as PreferenceSelection;

  for (const capability of preferenceCapabilities) {
    const rawValue = source[capability];

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      selections[capability] = null;
      continue;
    }

    const connectionId = Number(rawValue);

    if (!Number.isInteger(connectionId) || connectionId < 1) {
      return null;
    }

    selections[capability] = connectionId;
  }

  return selections;
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();

  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";

  return "Employee";
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

  const resolvedRole = await resolveAuthoritativeUserRole(supabase as any, {
    userId: user.id,
    allowedStatuses: ["active", "accepted"],
  });

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

async function writeActivity(
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
    details: Record<string, unknown>;
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
      activity_details: details,
    });

  if (result.error) {
    console.warn(
      "Connection activity could not be recorded:",
      result.error,
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = getAdminClient();

    const access = await getAuthorisedContext(
      supabase,
      "Senior",
    );

    if ("response" in access) {
      return access.response;
    }

    const [
      providersResult,
      connectionsResult,
      providerCapabilitiesResult,
      preferencesResult,
    ] = await Promise.all([
  (admin as any)
    .from("connection_providers")
    .select("*")
    .eq("is_active", true)
    .or("is_archived.eq.false,is_archived.is.null")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true }),

  (admin as any)
    .from("organisation_connections")
    .select("*")
    .eq("organisation_id", access.organisationId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false }),

      (admin as any)
        .from("connection_provider_capabilities")
        .select("*")
        .eq("is_active", true)
        .order("capability_group", { ascending: true })
        .order("name", { ascending: true }),

      (admin as any)
        .from("organisation_connection_preferences")
        .select("*")
        .eq("organisation_id", access.organisationId)
        .order("capability_key", { ascending: true }),
    ]);

    if (providersResult.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            providersResult.error.message ||
            "Connection providers could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (connectionsResult.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            connectionsResult.error.message ||
            "Organisation connections could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (providerCapabilitiesResult.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            providerCapabilitiesResult.error.message ||
            "Provider capabilities could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (preferencesResult.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            preferencesResult.error.message ||
            "Primary provider preferences could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      providers: providersResult.data ?? [],
      connections: connectionsResult.data ?? [],
      providerCapabilities:
        providerCapabilitiesResult.data ?? [],
      preferences: preferencesResult.data ?? [],
    });
  } catch (error) {
    console.error("Connections loader failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Connections could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = getAdminClient();

    const access = await getAuthorisedContext(
      supabase,
      "Senior",
    );

    if ("response" in access) {
      return access.response;
    }

    let body: CreateConnectionBody;

    try {
      body = (await request.json()) as CreateConnectionBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "The connection request is invalid.",
        },
        { status: 400 },
      );
    }

    const requestedAction = text(body.action);

    if (requestedAction === "save_preferences") {
      const selections = parsePreferenceSelections(
        body.preferences,
      );

      if (!selections) {
        return NextResponse.json(
          {
            success: false,
            error: "The primary provider selections are invalid.",
          },
          { status: 400 },
        );
      }

      const selectedConnectionIds = Array.from(
        new Set(
          preferenceCapabilities
            .map((capability) => selections[capability])
            .filter((connectionId): connectionId is number =>
              typeof connectionId === "number",
            ),
        ),
      );

      if (selectedConnectionIds.length > 0) {
        const eligibleConnectionsResult = await (admin as any)
          .from("organisation_connections")
          .select("id, provider_id, status, is_archived")
          .eq("organisation_id", access.organisationId)
          .eq("status", "Connected")
          .eq("is_archived", false)
          .in("id", selectedConnectionIds);

        if (eligibleConnectionsResult.error) {
          return NextResponse.json(
            {
              success: false,
              error:
                eligibleConnectionsResult.error.message ||
                "The selected connections could not be validated.",
            },
            { status: 500 },
          );
        }

        const eligibleIds = new Set(
          (eligibleConnectionsResult.data ?? []).map(
            (connection: { id: number }) => Number(connection.id),
          ),
        );

        const invalidConnectionId = selectedConnectionIds.find(
          (connectionId) => !eligibleIds.has(connectionId),
        );

        if (invalidConnectionId) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Only active, connected providers from this organisation can be selected.",
            },
            { status: 400 },
          );
        }
      }

      for (const capability of preferenceCapabilities) {
        const connectionId = selections[capability];

        if (connectionId === null) {
          const deleteResult = await (admin as any)
            .from("organisation_connection_preferences")
            .delete()
            .eq("organisation_id", access.organisationId)
            .eq("capability_key", capability);

          if (deleteResult.error) {
            return NextResponse.json(
              {
                success: false,
                error:
                  deleteResult.error.message ||
                  `The ${capability} preference could not be cleared.`,
              },
              { status: 500 },
            );
          }

          continue;
        }

        const saveResult = await (admin as any)
          .from("organisation_connection_preferences")
          .upsert(
            {
              organisation_id: access.organisationId,
              capability_key: capability,
              connection_id: connectionId,
              created_by_user_id: access.user.id,
              updated_by_user_id: access.user.id,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "organisation_id,capability_key",
            },
          );

        if (saveResult.error) {
          return NextResponse.json(
            {
              success: false,
              error:
                saveResult.error.message ||
                `The ${capability} preference could not be saved.`,
            },
            { status: 500 },
          );
        }
      }

      const savedPreferencesResult = await (admin as any)
        .from("organisation_connection_preferences")
        .select("*")
        .eq("organisation_id", access.organisationId)
        .order("capability_key", { ascending: true });

      if (savedPreferencesResult.error) {
        return NextResponse.json(
          {
            success: false,
            error:
              savedPreferencesResult.error.message ||
              "The saved primary provider preferences could not be loaded.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        preferences: savedPreferencesResult.data ?? [],
        message: "Primary providers updated.",
      });
    }

    const providerId = Number(body.provider_id);

    if (!Number.isInteger(providerId) || providerId < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "The connection provider is invalid.",
        },
        { status: 400 },
      );
    }

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
          error: "The synchronisation frequency is invalid.",
        },
        { status: 400 },
      );
    }

    const providerResult = await (admin as any)
      .from("connection_providers")
      .select("*")
      .eq("id", providerId)
      .eq("is_active", true)
      .or("is_archived.eq.false,is_archived.is.null")
      .single();

    if (providerResult.error || !providerResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected provider could not be found.",
        },
        { status: 404 },
      );
    }

    const provider = providerResult.data;

    const existingResult = await (admin as any)
      .from("organisation_connections")
      .select("*")
      .eq("organisation_id", access.organisationId)
      .eq("provider_id", providerId)
      .eq("is_archived", false)
      .maybeSingle();

    if (existingResult.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Leo could not confirm whether this provider is already connected.",
        },
        { status: 500 },
      );
    }

    if (
      existingResult.data &&
      !provider.supports_multiple_connections
    ) {
      return NextResponse.json({
        success: true,
        connection: existingResult.data,
        message:
          "The existing connection record has been opened.",
      });
    }

    const initialStatus =
      provider.setup_status === "Available" ||
      provider.authentication_type === "Manual"
        ? "Connection Pending"
        : "Not Connected";

    const connectionResult = await (admin as any)
      .from("organisation_connections")
      .insert({
        organisation_id: access.organisationId,
        provider_id: providerId,
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
        authentication_type: provider.authentication_type,
        status: initialStatus,
        health_status:
          provider.setup_status === "Available"
            ? "Configuration Required"
            : "Not Checked",
        connection_owner_user_id: access.user.id,
        connected_by_user_id: access.user.id,
        sync_enabled: syncEnabled,
        sync_frequency: syncEnabled
          ? syncFrequency
          : "Manual",
      })
      .select("*")
      .single();

    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            connectionResult.error?.message ||
            "The connection record could not be created.",
        },
        { status: 500 },
      );
    }

    const connection = connectionResult.data;

    const capabilitiesResult = await (admin as any)
      .from("connection_provider_capabilities")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_active", true);

    if (
      !capabilitiesResult.error &&
      capabilitiesResult.data?.length
    ) {
      const capabilitySeedResult = await (admin as any)
        .from("organisation_connection_capabilities")
        .upsert(
          capabilitiesResult.data.map(
            (capability: Record<string, any>) => ({
              connection_id: connection.id,
              provider_capability_id: capability.id,
              is_enabled: capability.default_enabled,
              approval_status: capability.default_enabled
                ? "Approved"
                : "Not Requested",
              approved_by_user_id: capability.default_enabled
                ? access.user.id
                : null,
              approved_at: capability.default_enabled
                ? new Date().toISOString()
                : null,
            }),
          ),
          {
            onConflict:
              "connection_id,provider_capability_id",
          },
        );

      if (capabilitySeedResult.error) {
        console.warn(
          "Connection capabilities could not be seeded:",
          capabilitySeedResult.error,
        );
      }
    }

    const moduleSeedResult = await (admin as any)
      .from("organisation_connection_modules")
      .upsert(
        moduleKeys.map((moduleKey) => {
          const enabled =
            moduleKey === "Foundations" ||
            ((provider.category === "Design" ||
              provider.category === "Voice") &&
              moduleKey === "AI Studio");

          return {
            connection_id: connection.id,
            module_key: moduleKey,
            is_enabled: enabled,
            allowed_actions: [],
            approved_by_user_id: enabled
              ? access.user.id
              : null,
            approved_at: enabled
              ? new Date().toISOString()
              : null,
          };
        }),
        {
          onConflict: "connection_id,module_key",
        },
      );

    if (moduleSeedResult.error) {
      console.warn(
        "Connection modules could not be seeded:",
        moduleSeedResult.error,
      );
    }

    const roleSeedResult = await (admin as any)
      .from("organisation_connection_role_permissions")
      .upsert(
        roleKeys.map((roleKey) => {
          const hrAccess =
            roleKey === "Owner" ||
            roleKey === "HR" ||
            roleKey === "Platform Administrator";

          const administratorAccess =
            roleKey === "Owner" ||
            roleKey === "Platform Administrator";

          return {
            connection_id: connection.id,
            role_key: roleKey,
            can_view: hrAccess,
            can_use: hrAccess,
            can_export: hrAccess,
            can_import: hrAccess,
            can_sync: administratorAccess,
            can_manage_settings: administratorAccess,
            can_reconnect: administratorAccess,
            can_disconnect: administratorAccess,
            can_view_activity: hrAccess,
            can_view_errors: administratorAccess,
          };
        }),
        {
          onConflict: "connection_id,role_key",
        },
      );

    if (roleSeedResult.error) {
      console.warn(
        "Connection permissions could not be seeded:",
        roleSeedResult.error,
      );
    }

    await writeActivity(admin as any, {
      organisationId: access.organisationId,
      userId: access.user.id,
      providerId,
      connectionId: connection.id,
      activityType: "Connection Requested",
      summary: `${provider.name} connection created.`,
      details: {
        authentication_type: provider.authentication_type,
        provider_setup_status: provider.setup_status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        connection,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Connection creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The connection record could not be created.",
      },
      { status: 500 },
    );
  }
}