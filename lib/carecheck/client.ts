type CareCheckConfig = {
  environment: "sandbox" | "production";
  username: string;
  password: string;
  organisationReference: string;
};

export function getCareCheckConfig(): CareCheckConfig {
  const environment = process.env.CARECHECK_ENV;
  const username = process.env.CARECHECK_USERNAME?.trim();
  const password = process.env.CARECHECK_PASSWORD;
  const organisationReference =
    process.env.CARECHECK_ORGANISATION_REFERENCE?.trim();

  if (environment !== "sandbox" && environment !== "production") {
    throw new Error(
      "CARECHECK_ENV must be either 'sandbox' or 'production'",
    );
  }

  if (!username) {
    throw new Error("CARECHECK_USERNAME is not configured");
  }

  if (!password) {
    throw new Error("CARECHECK_PASSWORD is not configured");
  }

  if (!organisationReference) {
    throw new Error(
      "CARECHECK_ORGANISATION_REFERENCE is not configured",
    );
  }

  return {
    environment,
    username,
    password,
    organisationReference,
  };
}
