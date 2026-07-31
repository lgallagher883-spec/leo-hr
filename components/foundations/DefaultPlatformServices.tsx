"use client";

import { useEffect, useMemo, useState } from "react";

type CapabilityKey =
  | "email"
  | "calendar"
  | "meetings"
  | "documents"
  | "cloud_storage"
  | "ai"
  | "voice"
  | "video_generation";

type Provider = {
  id: number;
  provider_key: string;
  name: string;
  category: string;
  setup_status: string;
};

type OrganisationConnection = {
  id: number;
  provider_id: number;
  connection_name: string | null;
  account_display_name: string | null;
  status: string;
  health_status: string;
  is_archived?: boolean | null;
};

type ProviderCapability = {
  id: number;
  provider_id: number;
  capability_key: string;
  capability_group: string;
  name: string;
  setup_status: string;
  is_active: boolean;
};

type ConnectionPreference = {
  id?: number;
  organisation_id?: string;
  capability_key: string;
  connection_id: number;
  created_at?: string;
  updated_at?: string;
};

type ConnectionsResponse = {
  success?: boolean;
  error?: string;
  providers?: Provider[];
  connections?: OrganisationConnection[];
  providerCapabilities?: ProviderCapability[];
  preferences?: ConnectionPreference[];
};

type SavePreferencesResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  preferences?: ConnectionPreference[];
};

type SelectionState = Record<CapabilityKey, number | null>;

type ServiceDefinition = {
  key: CapabilityKey;
  label: string;
  description: string;
  categoryMatches: string[];
  capabilityMatches: string[];
};

const services: ServiceDefinition[] = [
  {
    key: "email",
    label: "Email",
    description:
      "Used when LEO sends approved emails and creates email drafts.",
    categoryMatches: ["email", "communication", "productivity"],
    capabilityMatches: ["email", "mail", "gmail", "outlook"],
  },
  {
    key: "calendar",
    label: "Calendar",
    description:
      "Used for approved calendar events, reminders and scheduling.",
    categoryMatches: ["calendar", "productivity"],
    capabilityMatches: ["calendar", "event", "schedule"],
  },
  {
    key: "meetings",
    label: "Meetings",
    description:
      "Used when LEO creates approved online meetings or meeting links.",
    categoryMatches: ["meetings", "communication", "calendar"],
    capabilityMatches: [
      "meeting",
      "video meeting",
      "conference",
      "teams",
      "zoom",
      "meet",
    ],
  },
  {
    key: "documents",
    label: "Documents",
    description:
      "Used when LEO creates, opens or exports approved documents.",
    categoryMatches: ["documents", "productivity", "cloud storage"],
    capabilityMatches: [
      "document",
      "docs",
      "word",
      "file",
      "export",
    ],
  },
  {
    key: "cloud_storage",
    label: "Cloud Storage",
    description:
      "Used when approved platform files are stored or synchronised externally.",
    categoryMatches: ["cloud storage", "documents", "productivity"],
    capabilityMatches: [
      "storage",
      "drive",
      "onedrive",
      "sharepoint",
      "file",
    ],
  },
  {
    key: "ai",
    label: "AI",
    description:
      "Used for approved external AI services available through Connections.",
    categoryMatches: ["artificial intelligence", "ai"],
    capabilityMatches: [
      "artificial intelligence",
      "ai",
      "generation",
      "assistant",
    ],
  },
  {
    key: "voice",
    label: "Voice",
    description:
      "Used for approved voice generation, narration and audio services.",
    categoryMatches: ["voice", "audio"],
    capabilityMatches: [
      "voice",
      "speech",
      "audio",
      "narration",
      "text to speech",
    ],
  },
  {
    key: "video_generation",
    label: "Video Generation",
    description:
      "Used for approved video creation and AI presenter services.",
    categoryMatches: ["video", "design"],
    capabilityMatches: [
      "video",
      "avatar",
      "presenter",
      "generation",
    ],
  },
];

function createEmptySelections(): SelectionState {
  return {
    email: null,
    calendar: null,
    meetings: null,
    documents: null,
    cloud_storage: null,
    ai: null,
    voice: null,
    video_generation: null,
  };
}

function normalise(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function includesAny(value: string, matches: string[]): boolean {
  const normalisedValue = normalise(value);

  return matches.some((match) =>
    normalisedValue.includes(normalise(match)),
  );
}

export default function DefaultPlatformServices() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connections, setConnections] = useState<
    OrganisationConnection[]
  >([]);
  const [providerCapabilities, setProviderCapabilities] = useState<
    ProviderCapability[]
  >([]);

  const [savedSelections, setSavedSelections] =
    useState<SelectionState>(createEmptySelections);

  const [selections, setSelections] =
    useState<SelectionState>(createEmptySelections);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadDefaultServices();
  }, []);

  async function loadDefaultServices() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/foundations/connections",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as ConnectionsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Default platform services could not be loaded.",
        );
      }

      const loadedProviders = result.providers || [];
      const loadedConnections = result.connections || [];
      const loadedCapabilities =
        result.providerCapabilities || [];

      const loadedSelections = createEmptySelections();

      for (const preference of result.preferences || []) {
        const capabilityKey =
          preference.capability_key as CapabilityKey;

        if (
          Object.prototype.hasOwnProperty.call(
            loadedSelections,
            capabilityKey,
          )
        ) {
          loadedSelections[capabilityKey] =
            Number(preference.connection_id) || null;
        }
      }

      setProviders(loadedProviders);
      setConnections(loadedConnections);
      setProviderCapabilities(loadedCapabilities);
      setSavedSelections(loadedSelections);
      setSelections(loadedSelections);
    } catch (error) {
      console.error(
        "Default platform services could not be loaded:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Default platform services could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  const connectedConnections = useMemo(
    () =>
      connections.filter(
        (connection) =>
          connection.status === "Connected" &&
          connection.is_archived !== true,
      ),
    [connections],
  );

  const providerMap = useMemo(
    () =>
      new Map(
        providers.map((provider) => [
          provider.id,
          provider,
        ]),
      ),
    [providers],
  );

  const optionsByService = useMemo(() => {
    const result = new Map<
      CapabilityKey,
      OrganisationConnection[]
    >();

    for (const service of services) {
      const eligibleConnections =
        connectedConnections.filter((connection) => {
          const provider = providerMap.get(
            connection.provider_id,
          );

          if (!provider) return false;

          const categoryMatch = includesAny(
            provider.category,
            service.categoryMatches,
          );

          const providerIdentity = `${provider.provider_key} ${provider.name}`;
          const meetingsProviderMatch =
            service.key === "meetings" &&
            includesAny(providerIdentity, [
              "microsoft",
              "microsoft 365",
              "office 365",
              "google workspace",
              "google",
            ]);

          const matchingCapabilities =
            providerCapabilities.filter(
              (capability) =>
                capability.provider_id === provider.id &&
                capability.is_active &&
                capability.setup_status !== "Unavailable",
            );

          const capabilityMatch =
            matchingCapabilities.some(
              (capability) =>
                includesAny(
                  capability.capability_key,
                  service.capabilityMatches,
                ) ||
                includesAny(
                  capability.capability_group,
                  service.capabilityMatches,
                ) ||
                includesAny(
                  capability.name,
                  service.capabilityMatches,
                ),
            );

          return (
            categoryMatch ||
            capabilityMatch ||
            meetingsProviderMatch
          );
        });

      result.set(service.key, eligibleConnections);
    }

    return result;
  }, [
    connectedConnections,
    providerCapabilities,
    providerMap,
  ]);

  function getConnectionLabel(
    connection: OrganisationConnection,
  ): string {
    const provider = providerMap.get(
      connection.provider_id,
    );

    const accountName =
      connection.account_display_name?.trim() ||
      connection.connection_name?.trim();

    if (!provider) {
      return accountName || `Connection ${connection.id}`;
    }

    return accountName
      ? `${provider.name} — ${accountName}`
      : provider.name;
  }

  function handleSelectionChange(
    capabilityKey: CapabilityKey,
    value: string,
  ) {
    setSelections((current) => ({
      ...current,
      [capabilityKey]:
        value === "" ? null : Number(value),
    }));

    setMessage("");
    setErrorMessage("");
  }

  function restoreSuggestedDefaults() {
    const suggestedSelections =
      createEmptySelections();

    for (const service of services) {
      const options =
        optionsByService.get(service.key) || [];

      suggestedSelections[service.key] =
        options.length > 0 ? options[0].id : null;
    }

    setSelections(suggestedSelections);
    setMessage(
      "Suggested defaults restored. Select Save Default Services to apply them.",
    );
    setErrorMessage("");
  }

  async function saveDefaultServices() {
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/foundations/connections",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "save_preferences",
            preferences: selections,
          }),
        },
      );

      const result =
        (await response.json()) as SavePreferencesResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Default platform services could not be saved.",
        );
      }

      const updatedSelections = createEmptySelections();

      for (const preference of result.preferences || []) {
        const capabilityKey =
          preference.capability_key as CapabilityKey;

        if (
          Object.prototype.hasOwnProperty.call(
            updatedSelections,
            capabilityKey,
          )
        ) {
          updatedSelections[capabilityKey] =
            Number(preference.connection_id) || null;
        }
      }

      setSavedSelections(updatedSelections);
      setSelections(updatedSelections);

      setMessage(
        result.message ||
          "Default platform services saved.",
      );
    } catch (error) {
      console.error(
        "Default platform services could not be saved:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Default platform services could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  const hasUnsavedChanges = services.some(
    (service) =>
      selections[service.key] !==
      savedSelections[service.key],
  );

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>
            Default Platform Services
          </h2>

          <p style={descriptionStyle}>
            Choose which connected providers LEO should use by
            default throughout the platform. These settings do not
            reconnect providers or change their existing permissions.
          </p>
        </div>

        {hasUnsavedChanges && (
          <span style={unsavedBadgeStyle}>
            Unsaved changes
          </span>
        )}
      </div>

      {errorMessage && (
        <div style={errorStyle}>{errorMessage}</div>
      )}

      {message && (
        <div style={messageStyle}>{message}</div>
      )}

      {loading ? (
        <div style={loadingStyle}>
          Loading default platform services...
        </div>
      ) : (
        <>
          <div style={serviceGridStyle}>
            {services.map((service) => {
              const options =
                optionsByService.get(service.key) || [];

              return (
                <div
                  key={service.key}
                  style={serviceCardStyle}
                >
                  <label
                    htmlFor={`default-service-${service.key}`}
                    style={labelStyle}
                  >
                    {service.label}
                  </label>

                  <p style={serviceDescriptionStyle}>
                    {service.description}
                  </p>

                  <select
                    id={`default-service-${service.key}`}
                    value={
                      selections[service.key]?.toString() ||
                      ""
                    }
                    onChange={(event) =>
                      handleSelectionChange(
                        service.key,
                        event.target.value,
                      )
                    }
                    style={selectStyle}
                  >
                    <option value="">
                      {options.length > 0
                        ? "No default selected"
                        : "No connected provider available"}
                    </option>

                    {options.map((connection) => (
                      <option
                        key={connection.id}
                        value={connection.id}
                      >
                        {getConnectionLabel(connection)}
                      </option>
                    ))}
                  </select>

                  {options.length === 0 && (
                    <div style={helperTextStyle}>
                      Connect a provider with this capability
                      before selecting a default.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={actionsStyle}>
            <button
              type="button"
              onClick={restoreSuggestedDefaults}
              disabled={saving}
              style={{
                ...secondaryButtonStyle,
                opacity: saving ? 0.6 : 1,
              }}
            >
              Restore Suggested Defaults
            </button>

            <button
              type="button"
              onClick={() =>
                void saveDefaultServices()
              }
              disabled={saving || !hasUnsavedChanges}
              style={{
                ...primaryButtonStyle,
                opacity:
                  saving || !hasUnsavedChanges ? 0.6 : 1,
                cursor:
                  saving || !hasUnsavedChanges
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : "Save Default Services"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: "20px",
  marginBottom: "20px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "20px",
  fontWeight: 800,
};

const descriptionStyle: React.CSSProperties = {
  maxWidth: "820px",
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const unsavedBadgeStyle: React.CSSProperties = {
  flexShrink: 0,
  padding: "5px 9px",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const serviceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(270px, 1fr))",
  gap: "12px",
};

const serviceCardStyle: React.CSSProperties = {
  padding: "15px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 800,
};

const serviceDescriptionStyle: React.CSSProperties = {
  minHeight: "38px",
  margin: "5px 0 11px",
  color: "#6B7280",
  fontSize: "12px",
  lineHeight: 1.45,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "#FFFFFF",
  color: "#374151",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  fontSize: "13px",
};

const helperTextStyle: React.CSSProperties = {
  marginTop: "7px",
  color: "#9CA3AF",
  fontSize: "11px",
  lineHeight: 1.4,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  fontWeight: 800,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  fontWeight: 800,
  cursor: "pointer",
};

const loadingStyle: React.CSSProperties = {
  padding: "24px",
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px dashed #D1D5DB",
  borderRadius: "11px",
  textAlign: "center",
};

const errorStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#FEF2F2",
  color: "#991B1B",
  border: "1px solid #FECACA",
  borderRadius: "10px",
  fontSize: "13px",
};

const messageStyle: React.CSSProperties = {
  padding: "12px",
  marginBottom: "14px",
  background: "#F5FFF9",
  color: "#365C48",
  border: "1px solid #CFE8DA",
  borderRadius: "10px",
  fontSize: "13px",
};