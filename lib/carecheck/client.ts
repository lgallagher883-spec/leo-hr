export type CareCheckConfig = {
  environment: "sandbox" | "production";
  username: string;
  password: string;
  organisationReference: string;
};

type CareCheckOrganisationConnection = {
  environment?: unknown;
  username?: unknown;
  password?: unknown;
  organisation_reference?: unknown;
  organisationReference?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateCareCheckConfig(
  config: CareCheckOrganisationConnection,
  source: string,
): CareCheckConfig {
  const environment = text(config.environment);
  const username = text(config.username);
  const password =
    typeof config.password === "string" ? config.password : "";
  const organisationReference =
    text(config.organisation_reference) || text(config.organisationReference);

  if (environment !== "sandbox" && environment !== "production") {
    throw new Error(
      `${source} CareCheck environment must be either 'sandbox' or 'production'`,
    );
  }

  if (!username) {
    throw new Error(`${source} CareCheck username is not configured`);
  }

  if (!password && environment === "production") {
    throw new Error(`${source} CareCheck password is not configured`);
  }

  if (!organisationReference) {
    throw new Error(
      `${source} CareCheck organisation reference is not configured`,
    );
  }

  return {
    environment,
    username,
    password,
    organisationReference,
  };
}

/**
 * Development-only fallback used by Leo's existing CareCheck sandbox.
 *
 * Customer production checks must use resolveCareCheckConfig() with the
 * authenticated organisation's connection. Do not use these environment
 * credentials as a production fallback for customer organisations.
 */
export function getDevelopmentCareCheckConfig(): CareCheckConfig {
  return validateCareCheckConfig(
    {
      environment: process.env.CARECHECK_ENV,
      username: process.env.CARECHECK_USERNAME,
      password: process.env.CARECHECK_PASSWORD,
      organisation_reference: process.env.CARECHECK_ORGANISATION_REFERENCE,
    },
    "Development",
  );
}

/**
 * Resolves provider credentials for one Leo organisation.
 *
 * The caller supplies a loader so this module stays independent of Supabase
 * and does not accidentally query an unscoped connection. The loader must
 * return only the connection belonging to organisationId.
 */
export async function resolveCareCheckConfig({
  organisationId,
  loadOrganisationConnection,
}: {
  organisationId: string;
  loadOrganisationConnection: (
    organisationId: string,
  ) => Promise<CareCheckOrganisationConnection | null>;
}): Promise<CareCheckConfig> {
  if (!organisationId.trim()) {
    throw new Error("Leo organisation is required for CareCheck.");
  }

  const connection = await loadOrganisationConnection(organisationId);

  if (!connection) {
    throw new Error(
      "CareCheck is not connected for this organisation. An Owner or Senior user must connect the organisation's own CareCheck account first.",
    );
  }

  return validateCareCheckConfig(connection, "Organisation");
}

/**
 * Backwards-compatible sandbox accessor while existing development routes are
 * migrated. It must never silently select Leo's credentials in production.
 */
export function getCareCheckConfig(): CareCheckConfig {
  const config = getDevelopmentCareCheckConfig();

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Global CareCheck credentials cannot be used for customer production checks. Resolve the authenticated organisation's CareCheck connection instead.",
    );
  }

  return config;
}


/**
 * Shared production-action gate for every CareCheck SOAP caller.
 *
 * Route-level checks remain in place for clear user-facing errors, but the
 * provider client must also refuse production traffic unless it has been
 * explicitly enabled after the production workflow is verified.
 */
export function assertCareCheckProviderActionAllowed(
  config: CareCheckConfig,
): void {
  if (
    config.environment === "production" &&
    process.env.CARECHECK_PRODUCTION_ACTIONS_ENABLED !== "true"
  ) {
    throw new Error(
      "CareCheck production actions are not enabled.",
    );
  }
}
