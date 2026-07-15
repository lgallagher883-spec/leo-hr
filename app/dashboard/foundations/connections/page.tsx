"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Provider = {
  id: number;
  provider_key: string;
  name: string;
  category: string;
  description: string | null;
  website_url: string | null;
  documentation_url: string | null;
  logo_url: string | null;
  authentication_type: string;
  connection_scope: string;
  supports_multiple_connections: boolean;
  supports_webhooks: boolean;
  supports_background_sync: boolean;
  supports_import: boolean;
  supports_export: boolean;
  supports_disconnect: boolean;
  requires_admin_approval: boolean;
  setup_status: string;
  display_order: number;
  configuration_schema: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

type OrganisationConnection = {
  id: number;
  organisation_id: string | null;
  provider_id: number;
  connection_name: string | null;
  account_display_name: string | null;
  external_account_id: string | null;
  external_tenant_id: string | null;
  external_workspace_id: string | null;
  authentication_type: string;
  status: string;
  health_status: string;
  connection_owner_user_id: string | null;
  connected_by_user_id: string | null;
  approved_by_user_id: string | null;
  connected_at: string | null;
  approved_at: string | null;
  disconnected_at: string | null;
  suspended_at: string | null;
  last_successful_use_at: string | null;
  last_failed_use_at: string | null;
  last_health_check_at: string | null;
  token_expires_at: string | null;
  reconnect_required_at: string | null;
  last_sync_at: string | null;
  next_sync_at: string | null;
  sync_enabled: boolean;
  sync_frequency: string | null;
  authorised_scopes: unknown[];
  requested_scopes: unknown[];
  connection_settings: Record<string, unknown>;
  usage_settings: Record<string, unknown>;
  consent_record: Record<string, unknown>;
  last_error_code: string | null;
  last_error_message: string | null;
  last_error_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProviderCapability = {
  id: number;
  provider_id: number;
  capability_key: string;
  name: string;
  description: string | null;
  capability_group: string;
  direction: string;
  risk_level: string;
  requires_separate_consent: boolean;
  default_enabled: boolean;
  setup_status: string;
  is_active: boolean;
};

type ConnectionCapability = {
  id: number;
  connection_id: number;
  provider_capability_id: number;
  is_enabled: boolean;
  approval_status: string;
  approved_by_user_id: string | null;
  approved_at: string | null;
  configuration: Record<string, unknown>;
};

type ConnectionModule = {
  id: number;
  connection_id: number;
  module_key: string;
  is_enabled: boolean;
  allowed_actions: string[];
  configuration: Record<string, unknown>;
  approved_by_user_id: string | null;
  approved_at: string | null;
};

type RolePermission = {
  id: number;
  connection_id: number;
  role_key: string;
  can_view: boolean;
  can_use: boolean;
  can_export: boolean;
  can_import: boolean;
  can_sync: boolean;
  can_manage_settings: boolean;
  can_reconnect: boolean;
  can_disconnect: boolean;
  can_view_activity: boolean;
  can_view_errors: boolean;
  capability_overrides: Record<string, unknown>;
};

type HealthCheck = {
  id: number;
  connection_id: number;
  check_type: string;
  status: string;
  summary: string;
  diagnostic_details: Record<string, unknown>;
  checked_at: string;
  next_check_at: string | null;
};

type ConnectionJob = {
  id: number;
  connection_id: number;
  module_key: string;
  action_key: string;
  direction: string;
  title: string | null;
  status: string;
  progress_percent: number;
  result_url: string | null;
  result_file_path: string | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_code: string | null;
  error_message: string | null;
};

type ExternalResource = {
  id: number;
  connection_id: number;
  module_key: string;
  leo_reference_type: string | null;
  leo_reference_id: number | null;
  external_resource_type: string;
  external_resource_id: string;
  external_name: string | null;
  external_url: string | null;
  sync_direction: string;
  sync_status: string;
  last_synced_at: string | null;
  created_at: string;
};

type ConnectionActivity = {
  id: number;
  provider_id: number | null;
  connection_id: number | null;
  job_id: number | null;
  module_key: string | null;
  activity_type: string;
  activity_summary: string;
  activity_details: Record<string, unknown>;
  created_at: string;
};

type WorkspaceTab =
  | "Overview"
  | "Capabilities"
  | "Module Access"
  | "Permissions"
  | "Synchronisation"
  | "Health & Errors"
  | "Jobs & Resources"
  | "Activity";

const categories = [
  "All",
  "Artificial Intelligence",
  "Design",
  "Voice",
  "Video",
  "Email",
  "Calendar",
  "Communication",
  "Meetings",
  "Cloud Storage",
  "Documents",
  "Accounting",
  "Finance",
  "Productivity",
  "Automation",
  "Identity",
  "Learning",
  "Forms",
  "Electronic Signature",
  "Data and Analytics",
  "Other",
];

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

const syncFrequencies = [
  "Manual",
  "Hourly",
  "Daily",
  "Weekly",
  "Monthly",
];

export default function ConnectionsPage() {
  const router = useRouter();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [connections, setConnections] = useState<
    OrganisationConnection[]
  >([]);

  const [selectedProvider, setSelectedProvider] =
    useState<Provider | null>(null);

  const [selectedConnection, setSelectedConnection] =
    useState<OrganisationConnection | null>(null);

  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>("Overview");

  const [providerCapabilities, setProviderCapabilities] = useState<
    ProviderCapability[]
  >([]);

  const [connectionCapabilities, setConnectionCapabilities] =
    useState<ConnectionCapability[]>([]);

  const [connectionModules, setConnectionModules] = useState<
    ConnectionModule[]
  >([]);

  const [rolePermissions, setRolePermissions] = useState<
    RolePermission[]
  >([]);

  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>(
    []
  );

  const [jobs, setJobs] = useState<ConnectionJob[]>([]);

  const [externalResources, setExternalResources] = useState<
    ExternalResource[]
  >([]);

  const [activity, setActivity] = useState<ConnectionActivity[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [connectionName, setConnectionName] = useState("");
  const [accountDisplayName, setAccountDisplayName] = useState("");
  const [externalAccountId, setExternalAccountId] = useState("");
  const [externalTenantId, setExternalTenantId] = useState("");
  const [externalWorkspaceId, setExternalWorkspaceId] =
    useState("");

  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState("Manual");

  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadConnectionsPage();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      const connection =
        connections.find(
          (item) => item.provider_id === selectedProvider.id
        ) || null;

      setSelectedConnection(connection);

      if (connection) {
        populateConnection(connection);
        void loadConnectionWorkspace(connection, selectedProvider);
      } else {
        resetConnectionForm();
        void loadProviderCapabilities(selectedProvider.id);
      }
    }
  }, [selectedProvider?.id, connections]);

  async function loadConnectionsPage() {
    setLoading(true);
    setErrorMessage("");

    const [providersResult, connectionsResult] = await Promise.all([
      supabase
        .from("connection_providers")
        .select("*")
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("display_order")
        .order("name"),

      supabase
        .from("organisation_connections")
        .select("*")
        .eq("is_archived", false)
        .order("updated_at", { ascending: false }),
    ]);

    if (providersResult.error || connectionsResult.error) {
      console.error(
        "Error loading Connections:",
        providersResult.error || connectionsResult.error
      );

      setErrorMessage("Connections could not be loaded.");
      setLoading(false);
      return;
    }

    setProviders((providersResult.data || []) as Provider[]);
    setConnections(
      (connectionsResult.data || []) as OrganisationConnection[]
    );

    setLoading(false);
  }

  async function loadProviderCapabilities(providerId: number) {
    const { data, error } = await supabase
      .from("connection_provider_capabilities")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .order("capability_group")
      .order("name");

    if (error) {
      console.error("Error loading provider capabilities:", error);
      setErrorMessage("Provider capabilities could not be loaded.");
      return;
    }

    setProviderCapabilities(
      (data || []) as ProviderCapability[]
    );

    setConnectionCapabilities([]);
    setConnectionModules([]);
    setRolePermissions([]);
    setHealthChecks([]);
    setJobs([]);
    setExternalResources([]);
    setActivity([]);
  }

  async function loadConnectionWorkspace(
    connection: OrganisationConnection,
    provider: Provider
  ) {
    setWorkspaceLoading(true);
    setErrorMessage("");

    const [
      providerCapabilitiesResult,
      connectionCapabilitiesResult,
      moduleResult,
      permissionsResult,
      healthResult,
      jobsResult,
      resourcesResult,
      activityResult,
    ] = await Promise.all([
      supabase
        .from("connection_provider_capabilities")
        .select("*")
        .eq("provider_id", provider.id)
        .eq("is_active", true)
        .order("capability_group")
        .order("name"),

      supabase
        .from("organisation_connection_capabilities")
        .select("*")
        .eq("connection_id", connection.id),

      supabase
        .from("organisation_connection_modules")
        .select("*")
        .eq("connection_id", connection.id)
        .order("module_key"),

      supabase
        .from("organisation_connection_role_permissions")
        .select("*")
        .eq("connection_id", connection.id)
        .order("role_key"),

      supabase
        .from("connection_health_checks")
        .select("*")
        .eq("connection_id", connection.id)
        .order("checked_at", { ascending: false })
        .limit(20),

      supabase
        .from("connection_jobs")
        .select("*")
        .eq("connection_id", connection.id)
        .order("requested_at", { ascending: false })
        .limit(50),

      supabase
        .from("connection_external_resources")
        .select("*")
        .eq("connection_id", connection.id)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false })
        .limit(50),

      supabase
        .from("connection_activity_history")
        .select("*")
        .eq("connection_id", connection.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const firstError =
      providerCapabilitiesResult.error ||
      connectionCapabilitiesResult.error ||
      moduleResult.error ||
      permissionsResult.error ||
      healthResult.error ||
      jobsResult.error ||
      resourcesResult.error ||
      activityResult.error;

    if (firstError) {
      console.error(
        "Error loading connection workspace:",
        firstError
      );

      setErrorMessage(
        "The connection workspace could not be loaded."
      );

      setWorkspaceLoading(false);
      return;
    }

    setProviderCapabilities(
      (providerCapabilitiesResult.data ||
        []) as ProviderCapability[]
    );

    setConnectionCapabilities(
      (connectionCapabilitiesResult.data ||
        []) as ConnectionCapability[]
    );

    setConnectionModules(
      (moduleResult.data || []) as ConnectionModule[]
    );

    setRolePermissions(
      (permissionsResult.data || []) as RolePermission[]
    );

    setHealthChecks((healthResult.data || []) as HealthCheck[]);
    setJobs((jobsResult.data || []) as ConnectionJob[]);

    setExternalResources(
      (resourcesResult.data || []) as ExternalResource[]
    );

    setActivity(
      (activityResult.data || []) as ConnectionActivity[]
    );

    setWorkspaceLoading(false);
  }

  function populateConnection(connection: OrganisationConnection) {
    setConnectionName(connection.connection_name || "");
    setAccountDisplayName(connection.account_display_name || "");
    setExternalAccountId(connection.external_account_id || "");
    setExternalTenantId(connection.external_tenant_id || "");
    setExternalWorkspaceId(connection.external_workspace_id || "");
    setSyncEnabled(connection.sync_enabled);
    setSyncFrequency(connection.sync_frequency || "Manual");
  }

  function resetConnectionForm() {
    setConnectionName("");
    setAccountDisplayName("");
    setExternalAccountId("");
    setExternalTenantId("");
    setExternalWorkspaceId("");
    setSyncEnabled(false);
    setSyncFrequency("Manual");
    setProviderCapabilities([]);
    setConnectionCapabilities([]);
    setConnectionModules([]);
    setRolePermissions([]);
    setHealthChecks([]);
    setJobs([]);
    setExternalResources([]);
    setActivity([]);
  }

  async function createConnectionRecord() {
    if (!selectedProvider) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const initialStatus =
      selectedProvider.setup_status === "Available" ||
      selectedProvider.authentication_type === "Manual"
        ? "Connection Pending"
        : "Not Connected";

    const { data, error } = await supabase
      .from("organisation_connections")
      .insert({
        provider_id: selectedProvider.id,
        connection_name:
          connectionName.trim() || selectedProvider.name,
        account_display_name:
          accountDisplayName.trim() || null,
        external_account_id:
          externalAccountId.trim() || null,
        external_tenant_id:
          externalTenantId.trim() || null,
        external_workspace_id:
          externalWorkspaceId.trim() || null,
        authentication_type:
          selectedProvider.authentication_type,
        status: initialStatus,
        health_status:
          selectedProvider.setup_status === "Available"
            ? "Configuration Required"
            : "Not Checked",
        sync_enabled: syncEnabled,
        sync_frequency: syncEnabled ? syncFrequency : "Manual",
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error creating connection record:", error);

      setErrorMessage(
        "The connection record could not be created."
      );

      setSaving(false);
      return;
    }

    await seedConnectionControls(
      data as OrganisationConnection,
      selectedProvider
    );

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: data.id,
      jobId: null,
      moduleKey: "Foundations",
      activityType: "Connection Requested",
      summary: `${selectedProvider.name} connection created.`,
      details: {
        authentication_type:
          selectedProvider.authentication_type,
        provider_setup_status:
          selectedProvider.setup_status,
      },
    });

    setSelectedConnection(data as OrganisationConnection);

    setMessage(
      selectedProvider.setup_status === "Available"
        ? `${selectedProvider.name} is ready for secure authorisation.`
        : `${selectedProvider.name} has been added to Connections. The live provider authorisation route is not enabled yet.`
    );

    setSaving(false);
    await loadConnectionsPage();
  }

  async function seedConnectionControls(
    connection: OrganisationConnection,
    provider: Provider
  ) {
    const { data: capabilities } = await supabase
      .from("connection_provider_capabilities")
      .select("*")
      .eq("provider_id", provider.id)
      .eq("is_active", true);

    if (capabilities && capabilities.length > 0) {
      await supabase
        .from("organisation_connection_capabilities")
        .upsert(
          capabilities.map((capability) => ({
            connection_id: connection.id,
            provider_capability_id: capability.id,
            is_enabled: capability.default_enabled,
            approval_status: capability.default_enabled
              ? "Approved"
              : "Not Requested",
          })),
          {
            onConflict:
              "connection_id,provider_capability_id",
          }
        );
    }

    await supabase
      .from("organisation_connection_modules")
      .upsert(
        moduleKeys.map((moduleKey) => ({
          connection_id: connection.id,
          module_key: moduleKey,
          is_enabled:
            moduleKey === "Foundations" ||
            (provider.category === "Design" &&
              moduleKey === "AI Studio") ||
            (provider.category === "Voice" &&
              moduleKey === "AI Studio"),
          allowed_actions: [],
        })),
        {
          onConflict: "connection_id,module_key",
        }
      );

    await supabase
      .from("organisation_connection_role_permissions")
      .upsert(
        roleKeys.map((roleKey) => ({
          connection_id: connection.id,
          role_key: roleKey,
          can_view:
            roleKey === "Owner" ||
            roleKey === "HR" ||
            roleKey === "Platform Administrator",
          can_use:
            roleKey === "Owner" ||
            roleKey === "HR" ||
            roleKey === "Platform Administrator",
          can_export:
            roleKey === "Owner" ||
            roleKey === "HR" ||
            roleKey === "Platform Administrator",
          can_import:
            roleKey === "Owner" ||
            roleKey === "HR" ||
            roleKey === "Platform Administrator",
          can_sync:
            roleKey === "Owner" ||
            roleKey === "Platform Administrator",
          can_manage_settings:
            roleKey === "Owner" ||
            roleKey === "Platform Administrator",
          can_reconnect:
            roleKey === "Owner" ||
            roleKey === "Platform Administrator",
          can_disconnect:
            roleKey === "Owner" ||
            roleKey === "Platform Administrator",
          can_view_activity:
            roleKey === "Owner" ||
            roleKey === "HR" ||
            roleKey === "Platform Administrator",
          can_view_errors:
            roleKey === "Owner" ||
            roleKey === "Platform Administrator",
        })),
        {
          onConflict: "connection_id,role_key",
        }
      );
  }

  async function saveConnectionOverview() {
    if (!selectedProvider || !selectedConnection) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("organisation_connections")
      .update({
        connection_name:
          connectionName.trim() || selectedProvider.name,
        account_display_name:
          accountDisplayName.trim() || null,
        external_account_id:
          externalAccountId.trim() || null,
        external_tenant_id:
          externalTenantId.trim() || null,
        external_workspace_id:
          externalWorkspaceId.trim() || null,
        sync_enabled: syncEnabled,
        sync_frequency: syncEnabled ? syncFrequency : "Manual",
      })
      .eq("id", selectedConnection.id)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error updating connection:", error);
      setErrorMessage("The connection could not be updated.");
      setSaving(false);
      return;
    }

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey: "Foundations",
      activityType: "Settings Updated",
      summary: `${selectedProvider.name} connection settings updated.`,
      details: {
        sync_enabled: syncEnabled,
        sync_frequency: syncEnabled ? syncFrequency : "Manual",
      },
    });

    setSelectedConnection(data as OrganisationConnection);
    setMessage("Connection settings updated.");
    setSaving(false);

    await loadConnectionsPage();
  }

  async function beginSecureConnection() {
    if (!selectedProvider || !selectedConnection) return;

    if (selectedProvider.setup_status !== "Available") {
      setMessage(
        `${selectedProvider.name} is prepared in the Connections framework, but its secure provider authorisation route has not been activated yet.`
      );
      return;
    }

    const sessionReference = crypto.randomUUID();
    const stateHash = crypto.randomUUID();

    const { error } = await supabase
      .from("connection_auth_sessions")
      .insert({
        provider_id: selectedProvider.id,
        connection_id: selectedConnection.id,
        session_reference: sessionReference,
        state_hash: stateHash,
        requested_scopes: [],
        status: "Created",
        expires_at: new Date(
          Date.now() + 15 * 60 * 1000
        ).toISOString(),
      });

    if (error) {
      setErrorMessage(
        "The secure connection session could not be created."
      );
      return;
    }

    await supabase
      .from("organisation_connections")
      .update({
        status: "Connection Pending",
        health_status: "Configuration Required",
      })
      .eq("id", selectedConnection.id);

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey: "Foundations",
      activityType: "Connection Started",
      summary: `Secure connection started for ${selectedProvider.name}.`,
      details: {
        session_reference: sessionReference,
      },
    });

    setMessage(
      `The secure ${selectedProvider.name} connection session has been prepared. The provider-specific server authorisation route is the next implementation step.`
    );

    await refreshSelectedConnection();
  }

  async function testConnection() {
    if (!selectedProvider || !selectedConnection) return;

    const { data: job, error: jobError } = await supabase
      .from("connection_jobs")
      .insert({
        connection_id: selectedConnection.id,
        module_key: "Foundations",
        action_key: "test_connection",
        direction: "Test",
        title: `Test ${selectedProvider.name} connection`,
        status: "Preparing",
        progress_percent: 10,
      })
      .select("*")
      .single();

    if (jobError || !job) {
      setErrorMessage("The connection test could not be started.");
      return;
    }

    const liveConnection =
      selectedConnection.status === "Connected";

    const healthStatus = liveConnection
      ? "Healthy"
      : selectedProvider.setup_status === "Available"
        ? "Configuration Required"
        : "Unavailable";

    const summary = liveConnection
      ? `${selectedProvider.name} connection is available.`
      : selectedProvider.setup_status === "Available"
        ? `${selectedProvider.name} requires authorisation or configuration.`
        : `${selectedProvider.name} provider activation is not available yet.`;

    await supabase.from("connection_health_checks").insert({
      connection_id: selectedConnection.id,
      check_type: "Connection",
      status: healthStatus,
      summary,
      diagnostic_details: {
        provider_setup_status: selectedProvider.setup_status,
        connection_status: selectedConnection.status,
      },
    });

    await supabase
      .from("organisation_connections")
      .update({
        health_status: healthStatus,
        last_health_check_at: new Date().toISOString(),
        last_error_message:
          healthStatus === "Healthy" ? null : summary,
        last_error_at:
          healthStatus === "Healthy"
            ? null
            : new Date().toISOString(),
      })
      .eq("id", selectedConnection.id);

    await supabase
      .from("connection_jobs")
      .update({
        status:
          healthStatus === "Healthy"
            ? "Completed"
            : "Partially Completed",
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        error_message:
          healthStatus === "Healthy" ? null : summary,
      })
      .eq("id", job.id);

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: job.id,
      moduleKey: "Foundations",
      activityType: "Connection Tested",
      summary,
      details: {
        health_status: healthStatus,
      },
    });

    setMessage(summary);
    await refreshSelectedConnection();
  }

  async function suspendConnection() {
    if (!selectedProvider || !selectedConnection) return;

    const confirmed = window.confirm(
      `Suspend ${selectedProvider.name}?\n\nLeo will stop using this connection until it is restored.`
    );

    if (!confirmed) return;

    await supabase
      .from("organisation_connections")
      .update({
        status: "Suspended",
        health_status: "Unavailable",
        suspended_at: new Date().toISOString(),
        sync_enabled: false,
      })
      .eq("id", selectedConnection.id);

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey: "Foundations",
      activityType: "Suspended",
      summary: `${selectedProvider.name} connection suspended.`,
      details: null,
    });

    setMessage(`${selectedProvider.name} has been suspended.`);
    await refreshSelectedConnection();
  }

  async function restoreConnection() {
    if (!selectedProvider || !selectedConnection) return;

    await supabase
      .from("organisation_connections")
      .update({
        status:
          selectedConnection.connected_at
            ? "Connected"
            : "Connection Pending",
        health_status: "Not Checked",
        suspended_at: null,
      })
      .eq("id", selectedConnection.id);

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey: "Foundations",
      activityType: "Reconnected",
      summary: `${selectedProvider.name} connection restored.`,
      details: null,
    });

    setMessage(`${selectedProvider.name} has been restored.`);
    await refreshSelectedConnection();
  }

  async function disconnectConnection() {
    if (!selectedProvider || !selectedConnection) return;

    const confirmed = window.confirm(
      `Disconnect ${selectedProvider.name}?\n\nLeo will stop using the account. Existing activity, exported resources and audit history will remain preserved.`
    );

    if (!confirmed) return;

    await supabase
      .from("organisation_connections")
      .update({
        status: "Disconnected",
        health_status: "Unavailable",
        disconnected_at: new Date().toISOString(),
        sync_enabled: false,
        token_expires_at: null,
        authorised_scopes: [],
      })
      .eq("id", selectedConnection.id);

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey: "Foundations",
      activityType: "Disconnected",
      summary: `${selectedProvider.name} disconnected.`,
      details: null,
    });

    setMessage(`${selectedProvider.name} has been disconnected.`);
    await refreshSelectedConnection();
  }

  async function toggleCapability(
    capability: ProviderCapability,
    enabled: boolean
  ) {
    if (!selectedProvider || !selectedConnection) return;

    const existing = connectionCapabilities.find(
      (item) =>
        item.provider_capability_id === capability.id
    );

    const payload = {
      connection_id: selectedConnection.id,
      provider_capability_id: capability.id,
      is_enabled: enabled,
      approval_status: enabled ? "Approved" : "Not Requested",
      approved_at: enabled ? new Date().toISOString() : null,
    };

    const result = existing
      ? await supabase
          .from("organisation_connection_capabilities")
          .update(payload)
          .eq("id", existing.id)
      : await supabase
          .from("organisation_connection_capabilities")
          .insert(payload);

    if (result.error) {
      setErrorMessage("The capability could not be updated.");
      return;
    }

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey: "Foundations",
      activityType: enabled
        ? "Capability Enabled"
        : "Capability Disabled",
      summary: `${capability.name} ${enabled ? "enabled" : "disabled"}.`,
      details: {
        capability_key: capability.capability_key,
      },
    });

    await loadConnectionWorkspace(
      selectedConnection,
      selectedProvider
    );
  }

  async function toggleModule(
    moduleKey: string,
    enabled: boolean
  ) {
    if (!selectedProvider || !selectedConnection) return;

    const existing = connectionModules.find(
      (item) => item.module_key === moduleKey
    );

    const payload = {
      connection_id: selectedConnection.id,
      module_key: moduleKey,
      is_enabled: enabled,
      approved_at: enabled ? new Date().toISOString() : null,
    };

    const result = existing
      ? await supabase
          .from("organisation_connection_modules")
          .update(payload)
          .eq("id", existing.id)
      : await supabase
          .from("organisation_connection_modules")
          .insert({
            ...payload,
            allowed_actions: [],
          });

    if (result.error) {
      setErrorMessage("Module access could not be updated.");
      return;
    }

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey,
      activityType: enabled
        ? "Module Enabled"
        : "Module Disabled",
      summary: `${selectedProvider.name} ${enabled ? "enabled" : "disabled"} for ${moduleKey}.`,
      details: null,
    });

    await loadConnectionWorkspace(
      selectedConnection,
      selectedProvider
    );
  }

  async function updateRolePermission(
    roleKey: string,
    field: keyof Omit<
      RolePermission,
      | "id"
      | "connection_id"
      | "role_key"
      | "capability_overrides"
    >,
    value: boolean
  ) {
    if (!selectedProvider || !selectedConnection) return;

    const existing = rolePermissions.find(
      (item) => item.role_key === roleKey
    );

    const current: Partial<RolePermission> = existing || {
      can_view: false,
      can_use: false,
      can_export: false,
      can_import: false,
      can_sync: false,
      can_manage_settings: false,
      can_reconnect: false,
      can_disconnect: false,
      can_view_activity: false,
      can_view_errors: false,
    };

    const payload = {
      connection_id: selectedConnection.id,
      role_key: roleKey,
      can_view: current.can_view || false,
      can_use: current.can_use || false,
      can_export: current.can_export || false,
      can_import: current.can_import || false,
      can_sync: current.can_sync || false,
      can_manage_settings:
        current.can_manage_settings || false,
      can_reconnect: current.can_reconnect || false,
      can_disconnect: current.can_disconnect || false,
      can_view_activity:
        current.can_view_activity || false,
      can_view_errors: current.can_view_errors || false,
      [field]: value,
    };

    const result = existing
      ? await supabase
          .from("organisation_connection_role_permissions")
          .update(payload)
          .eq("id", existing.id)
      : await supabase
          .from("organisation_connection_role_permissions")
          .insert(payload);

    if (result.error) {
      setErrorMessage("The role permission could not be updated.");
      return;
    }

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey: "Foundations",
      activityType: "Permission Updated",
      summary: `${roleKey} permission ${String(field)} updated.`,
      details: {
        field,
        value,
      },
    });

    await loadConnectionWorkspace(
      selectedConnection,
      selectedProvider
    );
  }

  async function queueManualSync() {
    if (!selectedProvider || !selectedConnection) return;

    if (selectedConnection.status !== "Connected") {
      setErrorMessage(
        "The provider must be connected before synchronisation can run."
      );
      return;
    }

    const { data, error } = await supabase
      .from("connection_jobs")
      .insert({
        connection_id: selectedConnection.id,
        module_key: "Foundations",
        action_key: "manual_sync",
        direction: "Synchronise",
        title: `Synchronise ${selectedProvider.name}`,
        status: "Queued",
        progress_percent: 0,
      })
      .select("*")
      .single();

    if (error || !data) {
      setErrorMessage(
        "The synchronisation job could not be created."
      );
      return;
    }

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: data.id,
      moduleKey: "Foundations",
      activityType: "Synchronisation Started",
      summary: `${selectedProvider.name} synchronisation queued.`,
      details: null,
    });

    setMessage(
      `${selectedProvider.name} synchronisation has been queued. A provider worker will process it once that integration is active.`
    );

    await loadConnectionWorkspace(
      selectedConnection,
      selectedProvider
    );
  }

  async function archiveExternalResource(
    resource: ExternalResource
  ) {
    if (!selectedProvider || !selectedConnection) return;

    const confirmed = window.confirm(
      `Unlink "${resource.external_name || resource.external_resource_type}"?\n\nThe external item will not be deleted.`
    );

    if (!confirmed) return;

    await supabase
      .from("connection_external_resources")
      .update({
        sync_status: "Unlinked",
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", resource.id);

    await recordActivity({
      providerId: selectedProvider.id,
      connectionId: selectedConnection.id,
      jobId: null,
      moduleKey: resource.module_key,
      activityType: "Resource Unlinked",
      summary: `${resource.external_name || resource.external_resource_type} unlinked.`,
      details: {
        external_resource_id:
          resource.external_resource_id,
      },
    });

    await loadConnectionWorkspace(
      selectedConnection,
      selectedProvider
    );
  }

  async function refreshSelectedConnection() {
    if (!selectedProvider || !selectedConnection) return;

    const { data } = await supabase
      .from("organisation_connections")
      .select("*")
      .eq("id", selectedConnection.id)
      .single();

    if (data) {
      setSelectedConnection(data as OrganisationConnection);
      populateConnection(data as OrganisationConnection);
      await loadConnectionWorkspace(
        data as OrganisationConnection,
        selectedProvider
      );
    }

    await loadConnectionsPage();
  }

  async function recordActivity({
    providerId,
    connectionId,
    jobId,
    moduleKey,
    activityType,
    summary,
    details,
  }: {
    providerId: number | null;
    connectionId: number | null;
    jobId: number | null;
    moduleKey: string | null;
    activityType: string;
    summary: string;
    details: Record<string, unknown> | null;
  }) {
    const { error } = await supabase
      .from("connection_activity_history")
      .insert({
        provider_id: providerId,
        connection_id: connectionId,
        job_id: jobId,
        module_key: moduleKey,
        activity_type: activityType,
        activity_summary: summary,
        activity_details: details || {},
      });

    if (error) {
      console.error(
        "Error recording connection activity:",
        error
      );
    }
  }

  const connectionMap = useMemo(
    () =>
      new Map(
        connections.map((connection) => [
          connection.provider_id,
          connection,
        ])
      ),
    [connections]
  );

  const filteredProviders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return providers.filter((provider) => {
      const connection = connectionMap.get(provider.id);

      const matchesSearch =
        !search ||
        provider.name.toLowerCase().includes(search) ||
        provider.category.toLowerCase().includes(search) ||
        (provider.description || "")
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        provider.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Connected" &&
          connection?.status === "Connected") ||
        (statusFilter === "Available" &&
          provider.setup_status === "Available" &&
          connection?.status !== "Connected") ||
        (statusFilter === "Needs Attention" &&
          [
            "Needs Attention",
            "Reconnect Required",
            "Connection Failed",
            "Suspended",
          ].includes(connection?.status || "")) ||
        (statusFilter === "Not Connected" &&
          (!connection ||
            connection.status === "Not Connected" ||
            connection.status === "Disconnected")) ||
        (statusFilter === "Planned" &&
          provider.setup_status === "Planned");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [
    providers,
    connectionMap,
    searchTerm,
    categoryFilter,
    statusFilter,
  ]);

  const connectedCount = connections.filter(
    (connection) => connection.status === "Connected"
  ).length;

  const attentionCount = connections.filter((connection) =>
    [
      "Needs Attention",
      "Reconnect Required",
      "Connection Failed",
      "Suspended",
    ].includes(connection.status)
  ).length;

  const availableCount = providers.filter(
    (provider) => provider.setup_status === "Available"
  ).length;

  const plannedCount = providers.filter(
    (provider) => provider.setup_status === "Planned"
  ).length;
    if (selectedProvider) {
    const connectionStatus =
      selectedConnection?.status || "Not Connected";

    const capabilityGroups = Array.from(
      new Set(
        providerCapabilities.map(
          (capability) => capability.capability_group
        )
      )
    );

    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelectedProvider(null);
            setSelectedConnection(null);
            setActiveTab("Overview");
            setMessage("");
            setErrorMessage("");
          }}
          style={backButtonStyle}
        >
          ← Back to Connections
        </button>

        <div style={providerHeaderStyle}>
          <div>
            <div style={badgeRowStyle}>
              <span style={primaryBadgeStyle}>
                {connectionStatus}
              </span>

              <span style={secondaryBadgeStyle}>
                {selectedProvider.category}
              </span>

              <span style={secondaryBadgeStyle}>
                {selectedProvider.authentication_type}
              </span>

              <span style={secondaryBadgeStyle}>
                {selectedProvider.setup_status}
              </span>
            </div>

            <h1 style={providerTitleStyle}>
              {selectedProvider.name}
            </h1>

            <p style={providerDescriptionStyle}>
              {selectedProvider.description ||
                "No provider description has been added."}
            </p>
          </div>

          <div style={providerHealthStyle}>
            <div style={providerHealthLabelStyle}>
              Connection Health
            </div>

            <div style={providerHealthValueStyle}>
              {selectedConnection?.health_status ||
                "Not Checked"}
            </div>
          </div>
        </div>

        <div style={tabNavigationStyle}>
          {(
            [
              "Overview",
              "Capabilities",
              "Module Access",
              "Permissions",
              "Synchronisation",
              "Health & Errors",
              "Jobs & Resources",
              "Activity",
            ] as WorkspaceTab[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={
                activeTab === tab
                  ? activeTabButtonStyle
                  : tabButtonStyle
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {errorMessage && (
          <div style={errorStyle}>{errorMessage}</div>
        )}

        {message && (
          <div style={messageStyle}>{message}</div>
        )}

        {workspaceLoading ? (
          <div style={emptyStateStyle}>
            Loading connection workspace...
          </div>
        ) : (
          <>
            {activeTab === "Overview" && (
              <div>
                <SectionHeading
                  title="Overview"
                  description="Maintain the organisation account, connection state and approved provider configuration."
                />

                {!selectedConnection ? (
                  <div>
                    <div style={noticeStyle}>
                      {selectedProvider.setup_status ===
                      "Available"
                        ? `${selectedProvider.name} is available to connect. Create the organisation connection record before authorising the account.`
                        : `${selectedProvider.name} is included in the Connections framework. Its live provider authorisation route is not active yet, but you can prepare the organisation settings now.`}
                    </div>

                    <div style={formPanelStyle}>
                      <div style={formGridStyle}>
                        <FormField label="Connection name">
                          <input
                            value={connectionName}
                            onChange={(event) =>
                              setConnectionName(
                                event.target.value
                              )
                            }
                            placeholder={`${selectedProvider.name} connection`}
                            style={inputStyle}
                          />
                        </FormField>

                        <FormField label="Account display name">
                          <input
                            value={accountDisplayName}
                            onChange={(event) =>
                              setAccountDisplayName(
                                event.target.value
                              )
                            }
                            placeholder="Optional"
                            style={inputStyle}
                          />
                        </FormField>
                      </div>

                      <div style={formGridStyle}>
                        <FormField label="External account ID">
                          <input
                            value={externalAccountId}
                            onChange={(event) =>
                              setExternalAccountId(
                                event.target.value
                              )
                            }
                            placeholder="Optional"
                            style={inputStyle}
                          />
                        </FormField>

                        <FormField label="External tenant ID">
                          <input
                            value={externalTenantId}
                            onChange={(event) =>
                              setExternalTenantId(
                                event.target.value
                              )
                            }
                            placeholder="Optional"
                            style={inputStyle}
                          />
                        </FormField>
                      </div>

                      <FormField label="External workspace ID">
                        <input
                          value={externalWorkspaceId}
                          onChange={(event) =>
                            setExternalWorkspaceId(
                              event.target.value
                            )
                          }
                          placeholder="Optional"
                          style={inputStyle}
                        />
                      </FormField>

                      <div style={optionGridStyle}>
                        <ToggleCard
                          label="Enable synchronisation"
                          description="Allow scheduled synchronisation after the provider integration becomes active."
                          checked={syncEnabled}
                          onChange={setSyncEnabled}
                        />
                      </div>

                      {syncEnabled && (
                        <FormField label="Synchronisation frequency">
                          <select
                            value={syncFrequency}
                            onChange={(event) =>
                              setSyncFrequency(
                                event.target.value
                              )
                            }
                            style={inputStyle}
                          >
                            {syncFrequencies.map(
                              (frequency) => (
                                <option key={frequency}>
                                  {frequency}
                                </option>
                              )
                            )}
                          </select>
                        </FormField>
                      )}

                      <div style={formActionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            void createConnectionRecord()
                          }
                          disabled={saving}
                          style={primaryButtonStyle}
                        >
                          {saving
                            ? "Preparing..."
                            : "Prepare Connection"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={detailGridStyle}>
                      <DetailCard
                        label="Status"
                        value={selectedConnection.status}
                      />

                      <DetailCard
                        label="Health"
                        value={
                          selectedConnection.health_status
                        }
                      />

                      <DetailCard
                        label="Connected"
                        value={
                          selectedConnection.connected_at
                            ? new Date(
                                selectedConnection.connected_at
                              ).toLocaleString("en-GB")
                            : "Not connected"
                        }
                      />

                      <DetailCard
                        label="Last successful use"
                        value={
                          selectedConnection.last_successful_use_at
                            ? new Date(
                                selectedConnection.last_successful_use_at
                              ).toLocaleString("en-GB")
                            : "No successful use recorded"
                        }
                      />
                    </div>

                    <div style={formGridStyle}>
                      <FormField label="Connection name">
                        <input
                          value={connectionName}
                          onChange={(event) =>
                            setConnectionName(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </FormField>

                      <FormField label="Account display name">
                        <input
                          value={accountDisplayName}
                          onChange={(event) =>
                            setAccountDisplayName(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </FormField>
                    </div>

                    <div style={formGridStyle}>
                      <FormField label="External account ID">
                        <input
                          value={externalAccountId}
                          onChange={(event) =>
                            setExternalAccountId(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </FormField>

                      <FormField label="External tenant ID">
                        <input
                          value={externalTenantId}
                          onChange={(event) =>
                            setExternalTenantId(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </FormField>
                    </div>

                    <FormField label="External workspace ID">
                      <input
                        value={externalWorkspaceId}
                        onChange={(event) =>
                          setExternalWorkspaceId(
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </FormField>

                    <div style={optionGridStyle}>
                      <ToggleCard
                        label="Enable synchronisation"
                        description="Allow this provider to run approved synchronisation jobs."
                        checked={syncEnabled}
                        onChange={setSyncEnabled}
                      />
                    </div>

                    {syncEnabled && (
                      <FormField label="Synchronisation frequency">
                        <select
                          value={syncFrequency}
                          onChange={(event) =>
                            setSyncFrequency(
                              event.target.value
                            )
                          }
                          style={inputStyle}
                        >
                          {syncFrequencies.map(
                            (frequency) => (
                              <option key={frequency}>
                                {frequency}
                              </option>
                            )
                          )}
                        </select>
                      </FormField>
                    )}

                    <div style={providerActionPanelStyle}>
                      <div>
                        <h3 style={providerActionTitleStyle}>
                          Connection Actions
                        </h3>

                        <p
                          style={
                            providerActionDescriptionStyle
                          }
                        >
                          Authorisation and provider secrets
                          are handled through secure
                          server-side routes, never in this
                          browser page.
                        </p>
                      </div>

                      <div style={providerActionButtonsStyle}>
                        {selectedConnection.status ===
                          "Suspended" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void restoreConnection()
                            }
                            style={secondaryButtonStyle}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void suspendConnection()
                            }
                            style={secondaryButtonStyle}
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            void testConnection()
                          }
                          style={secondaryButtonStyle}
                        >
                          Test Connection
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void beginSecureConnection()
                          }
                          style={primaryButtonStyle}
                        >
                          {selectedConnection.status ===
                            "Connected"
                            ? "Reconnect"
                            : "Connect Securely"}
                        </button>

                        {selectedProvider.supports_disconnect && (
                          <button
                            type="button"
                            onClick={() =>
                              void disconnectConnection()
                            }
                            style={archiveButtonStyle}
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={splitActionsStyle}>
                      <div />

                      <button
                        type="button"
                        onClick={() =>
                          void saveConnectionOverview()
                        }
                        disabled={saving}
                        style={primaryButtonStyle}
                      >
                        {saving
                          ? "Saving..."
                          : "Save Settings"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Capabilities" && (
              <div>
                <SectionHeading
                  title="Capabilities"
                  description="Choose exactly what Leo may do through this provider."
                />

                {!selectedConnection ? (
                  <div style={emptyStateStyle}>
                    Prepare the organisation connection before
                    enabling provider capabilities.
                  </div>
                ) : providerCapabilities.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No provider capabilities have been configured
                    yet.
                  </div>
                ) : (
                  <div style={capabilityGroupListStyle}>
                    {capabilityGroups.map((group) => (
                      <div
                        key={group}
                        style={capabilityGroupStyle}
                      >
                        <h3 style={capabilityGroupTitleStyle}>
                          {group}
                        </h3>

                        <div style={capabilityGridStyle}>
                          {providerCapabilities
                            .filter(
                              (capability) =>
                                capability.capability_group ===
                                group
                            )
                            .map((capability) => {
                              const connectionCapability =
                                connectionCapabilities.find(
                                  (item) =>
                                    item.provider_capability_id ===
                                    capability.id
                                );

                              const enabled =
                                connectionCapability?.is_enabled ||
                                false;

                              return (
                                <ToggleCard
                                  key={capability.id}
                                  label={capability.name}
                                  description={
                                    capability.description ||
                                    `${capability.direction} capability`
                                  }
                                  detail={`${capability.direction} · ${capability.risk_level} · ${capability.setup_status}`}
                                  checked={enabled}
                                  disabled={
                                    capability.setup_status ===
                                    "Unavailable"
                                  }
                                  onChange={(value) =>
                                    void toggleCapability(
                                      capability,
                                      value
                                    )
                                  }
                                />
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Module Access" && (
              <div>
                <SectionHeading
                  title="Module Access"
                  description="Control which Leo workspaces may use this provider."
                />

                {!selectedConnection ? (
                  <div style={emptyStateStyle}>
                    Prepare the organisation connection before
                    configuring module access.
                  </div>
                ) : (
                  <div style={moduleGridStyle}>
                    {moduleKeys.map((moduleKey) => {
                      const moduleAccess =
                        connectionModules.find(
                          (item) =>
                            item.module_key === moduleKey
                        );

                      return (
                        <ToggleCard
                          key={moduleKey}
                          label={moduleKey}
                          description={getModuleDescription(
                            moduleKey
                          )}
                          checked={
                            moduleAccess?.is_enabled || false
                          }
                          onChange={(value) =>
                            void toggleModule(
                              moduleKey,
                              value
                            )
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Permissions" && (
              <div>
                <SectionHeading
                  title="Permissions"
                  description="Set what each platform role may do with this connection."
                />

                {!selectedConnection ? (
                  <div style={emptyStateStyle}>
                    Prepare the organisation connection before
                    configuring permissions.
                  </div>
                ) : (
                  <div style={permissionTableWrapStyle}>
                    <table style={permissionTableStyle}>
                      <thead>
                        <tr>
                          <th style={permissionHeaderStyle}>
                            Role
                          </th>
                          <th style={permissionHeaderStyle}>
                            View
                          </th>
                          <th style={permissionHeaderStyle}>
                            Use
                          </th>
                          <th style={permissionHeaderStyle}>
                            Export
                          </th>
                          <th style={permissionHeaderStyle}>
                            Import
                          </th>
                          <th style={permissionHeaderStyle}>
                            Sync
                          </th>
                          <th style={permissionHeaderStyle}>
                            Settings
                          </th>
                          <th style={permissionHeaderStyle}>
                            Reconnect
                          </th>
                          <th style={permissionHeaderStyle}>
                            Disconnect
                          </th>
                          <th style={permissionHeaderStyle}>
                            Activity
                          </th>
                          <th style={permissionHeaderStyle}>
                            Errors
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {roleKeys.map((roleKey) => {
                          const permission =
                            rolePermissions.find(
                              (item) =>
                                item.role_key === roleKey
                            );

                          const permissionFields: Array<{
                            key: keyof Omit<
                              RolePermission,
                              | "id"
                              | "connection_id"
                              | "role_key"
                              | "capability_overrides"
                            >;
                            value: boolean;
                          }> = [
                            {
                              key: "can_view",
                              value:
                                permission?.can_view ||
                                false,
                            },
                            {
                              key: "can_use",
                              value:
                                permission?.can_use ||
                                false,
                            },
                            {
                              key: "can_export",
                              value:
                                permission?.can_export ||
                                false,
                            },
                            {
                              key: "can_import",
                              value:
                                permission?.can_import ||
                                false,
                            },
                            {
                              key: "can_sync",
                              value:
                                permission?.can_sync ||
                                false,
                            },
                            {
                              key: "can_manage_settings",
                              value:
                                permission?.can_manage_settings ||
                                false,
                            },
                            {
                              key: "can_reconnect",
                              value:
                                permission?.can_reconnect ||
                                false,
                            },
                            {
                              key: "can_disconnect",
                              value:
                                permission?.can_disconnect ||
                                false,
                            },
                            {
                              key: "can_view_activity",
                              value:
                                permission?.can_view_activity ||
                                false,
                            },
                            {
                              key: "can_view_errors",
                              value:
                                permission?.can_view_errors ||
                                false,
                            },
                          ];

                          return (
                            <tr key={roleKey}>
                              <td
                                style={
                                  permissionRoleCellStyle
                                }
                              >
                                {roleKey}
                              </td>

                              {permissionFields.map(
                                (field) => (
                                  <td
                                    key={field.key}
                                    style={
                                      permissionCellStyle
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={(event) =>
                                        void updateRolePermission(
                                          roleKey,
                                          field.key,
                                          event.target
                                            .checked
                                        )
                                      }
                                    />
                                  </td>
                                )
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Synchronisation" && (
              <div>
                <SectionHeading
                  title="Synchronisation"
                  description="Control scheduled and manual data exchange with the provider."
                />

                {!selectedConnection ? (
                  <div style={emptyStateStyle}>
                    Prepare the organisation connection before
                    configuring synchronisation.
                  </div>
                ) : (
                  <>
                    <div style={detailGridStyle}>
                      <DetailCard
                        label="Enabled"
                        value={
                          selectedConnection.sync_enabled
                            ? "Yes"
                            : "No"
                        }
                      />

                      <DetailCard
                        label="Frequency"
                        value={
                          selectedConnection.sync_frequency ||
                          "Manual"
                        }
                      />

                      <DetailCard
                        label="Last sync"
                        value={
                          selectedConnection.last_sync_at
                            ? new Date(
                                selectedConnection.last_sync_at
                              ).toLocaleString("en-GB")
                            : "No synchronisation recorded"
                        }
                      />

                      <DetailCard
                        label="Next sync"
                        value={
                          selectedConnection.next_sync_at
                            ? new Date(
                                selectedConnection.next_sync_at
                              ).toLocaleString("en-GB")
                            : "Not scheduled"
                        }
                      />
                    </div>

                    <div style={formPanelStyle}>
                      <div style={optionGridStyle}>
                        <ToggleCard
                          label="Enable scheduled synchronisation"
                          description="Allow Leo to queue approved synchronisation work for this provider."
                          checked={syncEnabled}
                          onChange={setSyncEnabled}
                        />
                      </div>

                      <FormField label="Frequency">
                        <select
                          value={syncFrequency}
                          onChange={(event) =>
                            setSyncFrequency(
                              event.target.value
                            )
                          }
                          disabled={!syncEnabled}
                          style={inputStyle}
                        >
                          {syncFrequencies.map(
                            (frequency) => (
                              <option key={frequency}>
                                {frequency}
                              </option>
                            )
                          )}
                        </select>
                      </FormField>

                      <div style={formActionsStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            void saveConnectionOverview()
                          }
                          disabled={saving}
                          style={secondaryButtonStyle}
                        >
                          Save Schedule
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void queueManualSync()
                          }
                          style={primaryButtonStyle}
                        >
                          Run Manual Sync
                        </button>
                      </div>
                    </div>

                    <div style={noticeStyle}>
                      Synchronisation jobs are safely queued in
                      Leo. A provider-specific server worker
                      performs the external API work after that
                      integration is activated.
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "Health & Errors" && (
              <div>
                <div style={sectionHeaderStyle}>
                  <SectionHeading
                    title="Health & Errors"
                    description="Review connection tests, availability, permissions and recent failures."
                  />

                  {selectedConnection && (
                    <button
                      type="button"
                      onClick={() =>
                        void testConnection()
                      }
                      style={primaryButtonStyle}
                    >
                      Test Connection
                    </button>
                  )}
                </div>

                {!selectedConnection ? (
                  <div style={emptyStateStyle}>
                    No connection health information is
                    available.
                  </div>
                ) : (
                  <>
                    {(selectedConnection.last_error_message ||
                      selectedConnection.last_error_code) && (
                      <div style={errorDetailStyle}>
                        <div style={errorDetailTitleStyle}>
                          Latest Connection Issue
                        </div>

                        <div style={errorDetailTextStyle}>
                          {selectedConnection.last_error_message ||
                            selectedConnection.last_error_code}
                        </div>

                        {selectedConnection.last_error_at && (
                          <div style={mutedStyle}>
                            {new Date(
                              selectedConnection.last_error_at
                            ).toLocaleString("en-GB")}
                          </div>
                        )}
                      </div>
                    )}

                    {healthChecks.length === 0 ? (
                      <div style={emptyStateStyle}>
                        No health checks have been recorded.
                      </div>
                    ) : (
                      <div style={listStyle}>
                        {healthChecks.map((check) => (
                          <div
                            key={check.id}
                            style={standardCardStyle}
                          >
                            <div style={cardHeaderStyle}>
                              <div>
                                <div style={eyebrowStyle}>
                                  {check.check_type}
                                </div>

                                <h4 style={cardTitleStyle}>
                                  {check.status}
                                </h4>
                              </div>

                              <div style={mutedStyle}>
                                {new Date(
                                  check.checked_at
                                ).toLocaleString("en-GB")}
                              </div>
                            </div>

                            <p
                              style={cardDescriptionStyle}
                            >
                              {check.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "Jobs & Resources" && (
              <div>
                <SectionHeading
                  title="Jobs & Resources"
                  description="Review imports, exports, synchronisation jobs and linked external items."
                />

                {!selectedConnection ? (
                  <div style={emptyStateStyle}>
                    No jobs or external resources are
                    available.
                  </div>
                ) : (
                  <div style={twoColumnWorkspaceStyle}>
                    <div>
                      <h3 style={subsectionTitleStyle}>
                        Recent Jobs
                      </h3>

                      {jobs.length === 0 ? (
                        <div style={emptyCompactStyle}>
                          No connection jobs have been
                          recorded.
                        </div>
                      ) : (
                        <div style={listStyle}>
                          {jobs.map((job) => (
                            <div
                              key={job.id}
                              style={standardCardStyle}
                            >
                              <div
                                style={cardHeaderStyle}
                              >
                                <div>
                                  <div
                                    style={eyebrowStyle}
                                  >
                                    {job.direction} ·{" "}
                                    {job.module_key}
                                  </div>

                                  <h4
                                    style={cardTitleStyle}
                                  >
                                    {job.title ||
                                      job.action_key}
                                  </h4>
                                </div>

                                <span
                                  style={primaryBadgeStyle}
                                >
                                  {job.status}
                                </span>
                              </div>

                              <div
                                style={
                                  jobProgressTrackStyle
                                }
                              >
                                <div
                                  style={{
                                    ...jobProgressBarStyle,
                                    width: `${job.progress_percent}%`,
                                  }}
                                />
                              </div>

                              <div style={mutedStyle}>
                                {job.progress_percent}% ·{" "}
                                {new Date(
                                  job.requested_at
                                ).toLocaleString("en-GB")}
                              </div>

                              {job.error_message && (
                                <div style={jobErrorStyle}>
                                  {job.error_message}
                                </div>
                              )}

                              {job.result_url && (
                                <div
                                  style={cardActionsStyle}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      window.open(
                                        job.result_url!,
                                        "_blank",
                                        "noopener,noreferrer"
                                      )
                                    }
                                    style={
                                      secondaryButtonStyle
                                    }
                                  >
                                    Open Result
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 style={subsectionTitleStyle}>
                        Linked Resources
                      </h3>

                      {externalResources.length === 0 ? (
                        <div style={emptyCompactStyle}>
                          No external resources are linked.
                        </div>
                      ) : (
                        <div style={listStyle}>
                          {externalResources.map(
                            (resource) => (
                              <div
                                key={resource.id}
                                style={standardCardStyle}
                              >
                                <div
                                  style={
                                    cardHeaderStyle
                                  }
                                >
                                  <div>
                                    <div
                                      style={
                                        eyebrowStyle
                                      }
                                    >
                                      {
                                        resource.external_resource_type
                                      }{" "}
                                      · {resource.module_key}
                                    </div>

                                    <h4
                                      style={
                                        cardTitleStyle
                                      }
                                    >
                                      {resource.external_name ||
                                        resource.external_resource_id}
                                    </h4>
                                  </div>

                                  <span
                                    style={
                                      secondaryBadgeStyle
                                    }
                                  >
                                    {resource.sync_status}
                                  </span>
                                </div>

                                <div
                                  style={
                                    assignmentDetailGridStyle
                                  }
                                >
                                  <DetailItem
                                    label="Direction"
                                    value={
                                      resource.sync_direction
                                    }
                                  />

                                  <DetailItem
                                    label="Last Synced"
                                    value={
                                      resource.last_synced_at
                                        ? new Date(
                                            resource.last_synced_at
                                          ).toLocaleString(
                                            "en-GB"
                                          )
                                        : "Not synced"
                                    }
                                  />
                                </div>

                                <div
                                  style={
                                    cardActionsStyle
                                  }
                                >
                                  {resource.external_url && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        window.open(
                                          resource.external_url!,
                                          "_blank",
                                          "noopener,noreferrer"
                                        )
                                      }
                                      style={
                                        secondaryButtonStyle
                                      }
                                    >
                                      Open External Item
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void archiveExternalResource(
                                        resource
                                      )
                                    }
                                    style={
                                      archiveButtonStyle
                                    }
                                  >
                                    Unlink
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Activity" && (
              <div>
                <SectionHeading
                  title="Activity"
                  description="A permanent history of connection, permission, health, export and synchronisation activity."
                />

                {!selectedConnection ||
                activity.length === 0 ? (
                  <div style={emptyStateStyle}>
                    No connection activity has been recorded.
                  </div>
                ) : (
                  <div style={timelineStyle}>
                    {activity.map((record) => (
                      <div
                        key={record.id}
                        style={timelineItemStyle}
                      >
                        <div style={timelineDotStyle} />

                        <div style={flexStyle}>
                          <div style={cardHeaderStyle}>
                            <div>
                              <div style={eyebrowStyle}>
                                {record.activity_type}
                                {record.module_key
                                  ? ` · ${record.module_key}`
                                  : ""}
                              </div>

                              <div
                                style={
                                  timelineSummaryStyle
                                }
                              >
                                {record.activity_summary}
                              </div>
                            </div>

                            <div style={mutedStyle}>
                              {new Date(
                                record.created_at
                              ).toLocaleString("en-GB")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={pageHeaderStyle}>
        <div>
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/foundations")
            }
            style={backButtonStyle}
          >
            ← Back to Foundations
          </button>

          <h1 style={pageTitleStyle}>Connections</h1>

          <p style={pageDescriptionStyle}>
            Connect trusted platforms and control exactly how
            Leo may use them across the organisation.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      {message && (
        <div style={messageStyle}>{message}</div>
      )}

      <div style={summaryGridStyle}>
        <SummaryCard
          label="Connected"
          value={String(connectedCount)}
        />

        <SummaryCard
          label="Available"
          value={String(availableCount)}
        />

        <SummaryCard
          label="Needs Attention"
          value={String(attentionCount)}
        />

        <SummaryCard
          label="Planned Providers"
          value={String(plannedCount)}
        />
      </div>

      <div style={toolbarStyle}>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          placeholder="Search providers..."
          style={inputStyle}
        />

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
          style={inputStyle}
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          style={inputStyle}
        >
          <option>All</option>
          <option>Connected</option>
          <option>Available</option>
          <option>Needs Attention</option>
          <option>Not Connected</option>
          <option>Planned</option>
        </select>
      </div>

      {loading ? (
        <div style={emptyStateStyle}>
          Loading connections...
        </div>
      ) : filteredProviders.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>✦</div>

          <h3 style={emptyTitleStyle}>
            No connections found
          </h3>

          <p style={emptyDescriptionStyle}>
            Adjust the search or filters to find a provider.
          </p>
        </div>
      ) : (
        <div style={categorySectionListStyle}>
          {categories
            .filter((category) => category !== "All")
            .map((category) => {
              const categoryProviders =
                filteredProviders.filter(
                  (provider) =>
                    provider.category === category
                );

              if (categoryProviders.length === 0) {
                return null;
              }

              return (
                <section
                  key={category}
                  style={providerCategoryStyle}
                >
                  <div style={categoryHeaderStyle}>
                    <h2 style={categoryTitleStyle}>
                      {category}
                    </h2>

                    <span style={categoryCountStyle}>
                      {categoryProviders.length}
                    </span>
                  </div>

                  <div style={providerGridStyle}>
                    {categoryProviders.map((provider) => {
                      const connection =
                        connectionMap.get(provider.id);

                      const displayStatus =
                        connection?.status ||
                        (provider.setup_status ===
                        "Available"
                          ? "Available"
                          : provider.setup_status);

                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setActiveTab("Overview");
                            setMessage("");
                            setErrorMessage("");
                          }}
                          style={providerCardStyle}
                        >
                          <div style={cardHeaderStyle}>
                            <div>
                              <div style={badgeRowStyle}>
                                <span
                                  style={
                                    primaryBadgeStyle
                                  }
                                >
                                  {displayStatus}
                                </span>

                                <span
                                  style={
                                    secondaryBadgeStyle
                                  }
                                >
                                  {
                                    provider.authentication_type
                                  }
                                </span>
                              </div>

                              <h3
                                style={
                                  providerCardTitleStyle
                                }
                              >
                                {provider.name}
                              </h3>
                            </div>

                            {connection &&
                              connection.health_status !==
                                "Not Checked" && (
                                <span
                                  style={
                                    secondaryBadgeStyle
                                  }
                                >
                                  {
                                    connection.health_status
                                  }
                                </span>
                              )}
                          </div>

                          <p
                            style={
                              providerCardDescriptionStyle
                            }
                          >
                            {provider.description ||
                              "No provider description has been added."}
                          </p>

                          <div
                            style={
                              providerFeatureRowStyle
                            }
                          >
                            {provider.supports_import && (
                              <span
                                style={
                                  smallFeatureBadgeStyle
                                }
                              >
                                Import
                              </span>
                            )}

                            {provider.supports_export && (
                              <span
                                style={
                                  smallFeatureBadgeStyle
                                }
                              >
                                Export
                              </span>
                            )}

                            {provider.supports_background_sync && (
                              <span
                                style={
                                  smallFeatureBadgeStyle
                                }
                              >
                                Sync
                              </span>
                            )}

                            {provider.supports_webhooks && (
                              <span
                                style={
                                  smallFeatureBadgeStyle
                                }
                              >
                                Webhooks
                              </span>
                            )}
                          </div>

                          <div
                            style={
                              providerCardFooterStyle
                            }
                          >
                            <span>
                              {connection?.account_display_name ||
                                provider.connection_scope}
                            </span>

                            <span style={openLabelStyle}>
                              Open →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={sectionHeadingStyle}>
      <h2 style={sectionHeadingTitleStyle}>{title}</h2>

      <p style={sectionHeadingDescriptionStyle}>
        {description}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={formFieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function ToggleCard({
  label,
  description,
  detail,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description: string;
  detail?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      style={{
        ...toggleCardStyle,
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />

      <span style={flexStyle}>
        <span style={toggleTitleStyle}>{label}</span>

        <span style={toggleDescriptionStyle}>
          {description}
        </span>

        {detail && (
          <span style={toggleDetailStyle}>{detail}</span>
        )}
      </span>
    </label>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={summaryValueStyle}>{value}</div>
      <div style={summaryLabelStyle}>{label}</div>
    </div>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={detailCardStyle}>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailCardValueStyle}>{value}</div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div style={detailLabelStyle}>{label}</div>
      <div style={detailValueStyle}>{value}</div>
    </div>
  );
}

function getModuleDescription(
  moduleKey: string
): string {
  const descriptions: Record<string, string> = {
    Foundations:
      "Manage the connection and organisation settings.",
    "Ask Leo":
      "Use the provider in approved Leo conversations.",
    Matters:
      "Use the provider within approved workplace matters.",
    Employees:
      "Use the provider within approved employee workflows.",
    Compliance:
      "Use the provider for approved compliance activity.",
    Policies:
      "Import, export or create approved policy content.",
    Documents:
      "Import, export, link or synchronise documents.",
    "SAR Requests":
      "Use the provider in approved information request workflows.",
    Insights:
      "Use approved external data for reporting and insights.",
    "Audit Logs":
      "Include provider activity in audit reporting.",
    "Leo Learn":
      "Use the provider across learning and development.",
    "AI Studio":
      "Create or export AI Studio content through the provider.",
    "Learning Library":
      "Import, export or link learning resources.",
    "Development Pathways":
      "Use the provider in pathway creation and delivery.",
    "Qualifications and Certificates":
      "Use the provider for approved credential evidence.",
    "Leo Talent":
      "Use the provider in approved talent workflows.",
    Billing:
      "Use the provider for approved billing activity.",
    "Platform Administration":
      "Allow platform-level administration of the connection.",
  };

  return (
    descriptions[moduleKey] ||
    "Allow this Leo module to use the connection."
  );
}

const pageHeaderStyle: React.CSSProperties = {
  marginBottom: "20px",
};

const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "30px",
  fontWeight: 800,
};

const pageDescriptionStyle: React.CSSProperties = {
  maxWidth: "820px",
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const backButtonStyle: React.CSSProperties = {
  padding: 0,
  marginBottom: "14px",
  background: "transparent",
  color: "#6E5084",
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const archiveButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "11px",
  marginBottom: "18px",
};

const summaryCardStyle: React.CSSProperties = {
  padding: "15px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "13px",
};

const summaryValueStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "24px",
  fontWeight: 800,
};

const summaryLabelStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6B7280",
  fontSize: "12px",
};

const toolbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 220px 210px",
  gap: "10px",
  marginBottom: "20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "#FFFFFF",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  fontSize: "14px",
};

const categorySectionListStyle: React.CSSProperties = {
  display: "grid",
  gap: "24px",
};

const providerCategoryStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const categoryHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
};

const categoryTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "18px",
};

const categoryCountStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const providerGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "13px",
};

const providerCardStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "210px",
  display: "flex",
  flexDirection: "column",
  padding: "17px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  textAlign: "left",
  cursor: "pointer",
};

const providerCardTitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#111827",
  fontSize: "17px",
};

const providerCardDescriptionStyle: React.CSSProperties = {
  flex: 1,
  margin: "12px 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.55,
};

const providerFeatureRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "6px",
  flexWrap: "wrap",
};

const smallFeatureBadgeStyle: React.CSSProperties = {
  padding: "4px 7px",
  background: "#F9FAFB",
  color: "#6B7280",
  border: "1px solid #E5E7EB",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 700,
};

const providerCardFooterStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginTop: "15px",
  paddingTop: "12px",
  borderTop: "1px solid #E5E7EB",
  color: "#6B7280",
  fontSize: "12px",
};

const openLabelStyle: React.CSSProperties = {
  color: "#6E5084",
  fontWeight: 800,
};

const providerHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  padding: "20px",
  marginBottom: "16px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "15px",
};

const providerTitleStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#111827",
  fontSize: "26px",
};

const providerDescriptionStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const providerHealthStyle: React.CSSProperties = {
  minWidth: "170px",
  padding: "12px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const providerHealthLabelStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "11px",
};

const providerHealthValueStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#6E5084",
  fontSize: "13px",
  fontWeight: 800,
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap",
};

const primaryBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 8px",
  background: "#F7F1FC",
  color: "#6E5084",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const secondaryBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 8px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #E5E7EB",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
};

const tabNavigationStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const tabButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeTabButtonStyle: React.CSSProperties = {
  ...tabButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const sectionHeadingStyle: React.CSSProperties = {
  marginBottom: "18px",
};

const sectionHeadingTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "20px",
};

const sectionHeadingDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "14px",
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
  marginBottom: "18px",
};

const detailCardStyle: React.CSSProperties = {
  padding: "14px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const detailLabelStyle: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "11px",
};

const detailCardValueStyle: React.CSSProperties = {
  marginTop: "5px",
  color: "#111827",
  fontSize: "14px",
  fontWeight: 700,
};

const detailValueStyle: React.CSSProperties = {
  marginTop: "3px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const formPanelStyle: React.CSSProperties = {
  padding: "18px",
  marginBottom: "18px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "14px",
};

const formFieldStyle: React.CSSProperties = {
  marginTop: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 700,
};

const optionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const toggleCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "13px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const toggleTitleStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 800,
};

const toggleDescriptionStyle: React.CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.45,
};

const toggleDetailStyle: React.CSSProperties = {
  display: "block",
  marginTop: "5px",
  color: "#9CA3AF",
  fontSize: "10px",
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "18px",
};

const splitActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "18px",
};

const providerActionPanelStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  padding: "16px",
  marginTop: "18px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const providerActionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "15px",
};

const providerActionDescriptionStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.5,
};

const providerActionButtonsStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const capabilityGroupListStyle: React.CSSProperties = {
  display: "grid",
  gap: "18px",
};

const capabilityGroupStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const capabilityGroupTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const capabilityGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "10px",
};

const moduleGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "10px",
};

const permissionTableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const permissionTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "1100px",
  borderCollapse: "collapse",
  background: "#FFFFFF",
};

const permissionHeaderStyle: React.CSSProperties = {
  padding: "11px",
  background: "#F9FAFB",
  color: "#6B7280",
  borderBottom: "1px solid #E5E7EB",
  fontSize: "11px",
  textAlign: "center",
};

const permissionRoleCellStyle: React.CSSProperties = {
  padding: "12px",
  color: "#374151",
  borderBottom: "1px solid #E5E7EB",
  fontSize: "13px",
  fontWeight: 800,
};

const permissionCellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #E5E7EB",
  textAlign: "center",
};

const twoColumnWorkspaceStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "18px",
};

const subsectionTitleStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#111827",
  fontSize: "16px",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "11px",
};

const standardCardStyle: React.CSSProperties = {
  padding: "15px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6E5084",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const cardTitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#111827",
  fontSize: "15px",
};

const cardDescriptionStyle: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#4B5563",
  fontSize: "13px",
  lineHeight: 1.5,
};

const cardActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap",
  marginTop: "14px",
};

const assignmentDetailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "12px",
  marginTop: "14px",
};

const jobProgressTrackStyle: React.CSSProperties = {
  height: "7px",
  margin: "13px 0 8px",
  background: "#F3F4F6",
  borderRadius: "999px",
  overflow: "hidden",
};

const jobProgressBarStyle: React.CSSProperties = {
  height: "100%",
  background: "#6E5084",
  borderRadius: "999px",
};

const jobErrorStyle: React.CSSProperties = {
  marginTop: "10px",
  padding: "9px",
  background: "#FEF2F2",
  color: "#991B1B",
  borderRadius: "8px",
  fontSize: "12px",
};

const errorDetailStyle: React.CSSProperties = {
  padding: "14px",
  marginBottom: "14px",
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  borderRadius: "11px",
};

const errorDetailTitleStyle: React.CSSProperties = {
  color: "#991B1B",
  fontWeight: 800,
};

const errorDetailTextStyle: React.CSSProperties = {
  margin: "6px 0",
  color: "#7F1D1D",
  fontSize: "13px",
};

const timelineStyle: React.CSSProperties = {
  display: "grid",
};

const timelineItemStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  padding: "13px 0",
  borderBottom: "1px solid #E5E7EB",
};

const timelineDotStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "10px",
  height: "10px",
  marginTop: "5px",
  background: "#6E5084",
  borderRadius: "999px",
};

const timelineSummaryStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 600,
};

const flexStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const mutedStyle: React.CSSProperties = {
  color: "#6B7280",
  fontSize: "12px",
};

const noticeStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  fontSize: "13px",
  lineHeight: 1.5,
};

const emptyStateStyle: React.CSSProperties = {
  padding: "32px 20px",
  background: "#F9FAFB",
  color: "#6B7280",
  border: "1px dashed #D1D5DB",
  borderRadius: "13px",
  textAlign: "center",
};

const emptyCompactStyle: React.CSSProperties = {
  padding: "20px",
  background: "#F9FAFB",
  color: "#6B7280",
  border: "1px dashed #D1D5DB",
  borderRadius: "11px",
  textAlign: "center",
  fontSize: "13px",
};

const emptyIconStyle: React.CSSProperties = {
  marginBottom: "8px",
  color: "#6E5084",
  fontSize: "22px",
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
};

const emptyDescriptionStyle: React.CSSProperties = {
  margin: "7px 0 0",
  fontSize: "14px",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
};