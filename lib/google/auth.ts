const GOOGLE_AUTH_BASE =
  "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_TOKEN_ENDPOINT =
  "https://oauth2.googleapis.com/token";

const GOOGLE_USERINFO_ENDPOINT =
  "https://www.googleapis.com/oauth2/v3/userinfo";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive",
].join(" ");

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} has not been configured.`);
  }

  return value;
}

export function getGoogleConfig() {
  return {
    clientId: getEnv("GOOGLE_CLIENT_ID"),
    clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: getEnv("GOOGLE_REDIRECT_URI"),
  };
}

export function buildGoogleAuthorisationUrl(state: string) {
  const { clientId, redirectUri } = getGoogleConfig();

  const url = new URL(GOOGLE_AUTH_BASE);

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("scope", GOOGLE_SCOPES);
  url.searchParams.set("state", state);

  return url.toString();
}

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
};

export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } =
    getGoogleConfig();

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(
      "Google authorisation could not be completed.",
    );
  }

  return response.json();
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = getGoogleConfig();

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(
      "Google access token could not be refreshed.",
    );
  }

  return response.json();
}

export type GoogleProfile = {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email: string;
  picture?: string;
};

export async function getGoogleProfile(
  accessToken: string,
): Promise<GoogleProfile> {
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      "Google account details could not be retrieved.",
    );
  }

  return response.json();
}