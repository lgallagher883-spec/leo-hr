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

type ControlAction =
  | "update_capability"
  | "update_module"
  | "update_permission";

type PermissionField =
  | "can_view"
  | "can_use"
  | "can_export"
  | "can_import"
  | "can_sync"
  | "can_manage_settings"
  | "can_reconnect"
  | "can_disconnect"
  | "can_view_activity"
  | "can_view_errors";

type ControlsBody = {
  action?: unknown;
  provider_capability_id?: unknown;
  module_key?: unknown;
  role_key?: unknown;
  permission_field?: unknown;
  enabled?: unknown;
  value?: unknown;
};

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const permittedActions = new Set<ControlAction>([
  "update_capability",
  "update_module",
  "update_permission",
]);

const permittedPermissionFields = new Set<PermissionField>([
  "can_view",
  "can_use",
  "can_export",
  "can_import",
  "can_sync",
  "can_manage_settings",
  "can_reconnect",
  "can_disconnect",
  "can_view_activity",
  "can_view_errors",
]);

const permittedModules = new Set([
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
]);

const permittedRoles = new Set([
  "Owner",
  "HR",
  "Manager",
  "Employee",
  "Platform Administrator",
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

function parsePositiveInteger(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
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

async function getOrganisationConnection(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  {
    organisationId,
    userId,
    providerId,
    connectionId,
    moduleKey,
    activityType,
    summary,
    details,
  }: {
    organisationId: string;
    userId: string;
    providerId: number;
    connectionId: number;
    moduleKey: string;
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
      job_id: null,
      module_key: moduleKey,
      activity_type: activityType,
      activity_summary: summary,
      activity_details: details ?? {},
    });

  if (result.error) {
    console.warn(
      "Connection control activity could not be recorded:",
      result.error,
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

    let body: ControlsBody;

    try {
      body = (await request.json()) as ControlsBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "The connection control request is invalid.",
        },
        { status: 400 },
      );
    }

    const action = text(body.action) as ControlAction;

    if (!permittedActions.has(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "The requested control action is invalid.",
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

    const connectionResult = await getOrganisationConnection(
      supabase,
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

    const providerResult = await (supabase as any)
      .from("connection_providers")
      .select("*")
      .eq("id", connection.provider_id)
      .eq("is_active", true)
      .eq("is_archived", false)
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

    if (action === "update_capability") {
      const providerCapabilityId = parsePositiveInteger(
        body.provider_capability_id,
      );

      if (!providerCapabilityId) {
        return NextResponse.json(
          {
            success: false,
            error: "The provider capability is invalid.",
          },
          { status: 400 },
        );
      }

      if (typeof body.enabled !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error: "The capability setting is invalid.",
          },
          { status: 400 },
        );
      }

      const capabilityResult = await (supabase as any)
        .from("connection_provider_capabilities")
        .select("*")
        .eq("id", providerCapabilityId)
        .eq("provider_id", connection.provider_id)
        .eq("is_active", true)
        .maybeSingle();

      if (
        capabilityResult.error ||
        !capabilityResult.data
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected capability does not belong to this provider.",
          },
          { status: 404 },
        );
      }

      const enabled = body.enabled;
      const capability = capabilityResult.data;

      const saveResult = await (supabase as any)
        .from("organisation_connection_capabilities")
        .upsert(
          {
            connection_id: connectionId,
            provider_capability_id: providerCapabilityId,
            is_enabled: enabled,
            approval_status: enabled
              ? "Approved"
              : "Not Requested",
            approved_by_user_id: enabled
              ? access.user.id
              : null,
            approved_at: enabled ? now : null,
          },
          {
            onConflict:
              "connection_id,provider_capability_id",
          },
        )
        .select("*")
        .single();

      if (saveResult.error || !saveResult.data) {
        return NextResponse.json(
          {
            success: false,
            error:
              saveResult.error?.message ||
              "The capability could not be updated.",
          },
          { status: 500 },
        );
      }

      await recordActivity(supabase, {
        organisationId: access.organisationId,
        userId: access.user.id,
        providerId: provider.id,
        connectionId,
        moduleKey: "Foundations",
        activityType: enabled
          ? "Capability Enabled"
          : "Capability Disabled",
        summary:
          `${capability.name} ${enabled ? "enabled" : "disabled"}.`,
        details: {
          capability_key: capability.capability_key,
          provider_capability_id: providerCapabilityId,
        },
      });

      return NextResponse.json({
        success: true,
        capability: saveResult.data,
        message:
          `${capability.name} has been ${enabled ? "enabled" : "disabled"}.`,
      });
    }

    if (action === "update_module") {
      const moduleKey = text(body.module_key);

      if (!permittedModules.has(moduleKey)) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected LEO module is invalid.",
          },
          { status: 400 },
        );
      }

      if (typeof body.enabled !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error: "The module setting is invalid.",
          },
          { status: 400 },
        );
      }

      const enabled = body.enabled;

      const saveResult = await (supabase as any)
        .from("organisation_connection_modules")
        .upsert(
          {
            connection_id: connectionId,
            module_key: moduleKey,
            is_enabled: enabled,
            allowed_actions: [],
            approved_by_user_id: enabled
              ? access.user.id
              : null,
            approved_at: enabled ? now : null,
          },
          {
            onConflict: "connection_id,module_key",
          },
        )
        .select("*")
        .single();

      if (saveResult.error || !saveResult.data) {
        return NextResponse.json(
          {
            success: false,
            error:
              saveResult.error?.message ||
              "Module access could not be updated.",
          },
          { status: 500 },
        );
      }

      await recordActivity(supabase, {
        organisationId: access.organisationId,
        userId: access.user.id,
        providerId: provider.id,
        connectionId,
        moduleKey,
        activityType: enabled
          ? "Module Enabled"
          : "Module Disabled",
        summary:
          `${provider.name} ${enabled ? "enabled" : "disabled"} for ${moduleKey}.`,
        details: {
          module_key: moduleKey,
        },
      });

      return NextResponse.json({
        success: true,
        module: saveResult.data,
        message:
          `${provider.name} has been ${enabled ? "enabled" : "disabled"} for ${moduleKey}.`,
      });
    }

    const roleKey = text(body.role_key);
    const permissionField = text(
      body.permission_field,
    ) as PermissionField;

    if (!permittedRoles.has(roleKey)) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected role is invalid.",
        },
        { status: 400 },
      );
    }

    if (!permittedPermissionFields.has(permissionField)) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected permission is invalid.",
        },
        { status: 400 },
      );
    }

    if (typeof body.value !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "The permission value is invalid.",
        },
        { status: 400 },
      );
    }

    const existingPermissionResult = await (supabase as any)
      .from("organisation_connection_role_permissions")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("role_key", roleKey)
      .maybeSingle();

    if (existingPermissionResult.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingPermissionResult.error.message ||
            "The current role permissions could not be loaded.",
        },
        { status: 500 },
      );
    }

    const existing = existingPermissionResult.data;

    const permissionValues: Record<
      PermissionField,
      boolean
    > = {
      can_view: existing?.can_view ?? false,
      can_use: existing?.can_use ?? false,
      can_export: existing?.can_export ?? false,
      can_import: existing?.can_import ?? false,
      can_sync: existing?.can_sync ?? false,
      can_manage_settings:
        existing?.can_manage_settings ?? false,
      can_reconnect: existing?.can_reconnect ?? false,
      can_disconnect: existing?.can_disconnect ?? false,
      can_view_activity:
        existing?.can_view_activity ?? false,
      can_view_errors:
        existing?.can_view_errors ?? false,
    };

    permissionValues[permissionField] = body.value;

    const saveResult = await (supabase as any)
      .from("organisation_connection_role_permissions")
      .upsert(
        {
          connection_id: connectionId,
          role_key: roleKey,
          ...permissionValues,
          capability_overrides:
            existing?.capability_overrides ?? {},
        },
        {
          onConflict: "connection_id,role_key",
        },
      )
      .select("*")
      .single();

    if (saveResult.error || !saveResult.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            saveResult.error?.message ||
            "The role permission could not be updated.",
        },
        { status: 500 },
      );
    }

    await recordActivity(supabase, {
      organisationId: access.organisationId,
      userId: access.user.id,
      providerId: provider.id,
      connectionId,
      moduleKey: "Foundations",
      activityType: "Permission Updated",
      summary:
        `${roleKey} permission ${permissionField} updated.`,
      details: {
        role_key: roleKey,
        field: permissionField,
        value: body.value,
      },
    });

    return NextResponse.json({
      success: true,
      permission: saveResult.data,
      message: `${roleKey} permissions have been updated.`,
    });
  } catch (error) {
    console.error("Connection control update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The connection control could not be updated.",
      },
      { status: 500 },
    );
  }
}