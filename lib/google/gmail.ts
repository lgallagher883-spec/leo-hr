import { getGoogleAccessToken } from "./connection";

export type GoogleConnection = {
  id: number | string;
  secret_reference?: string | null;
  token_expires_at?: string | null;
};

const GMAIL_API =
  "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailRequest<T>(
  connection: GoogleConnection,
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken =
    await getGoogleAccessToken(connection);

  const response = await fetch(
    `${GMAIL_API}${endpoint}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Google Gmail request failed (${response.status}).`,
    );
  }

  return response.json();
}

export async function listMessages(
  connection: GoogleConnection,
  maxResults = 25,
) {
  return gmailRequest<{
    messages?: {
      id: string;
      threadId: string;
    }[];
  }>(
    connection,
    `/messages?maxResults=${maxResults}`,
  );
}

export async function getMessage(
  connection: GoogleConnection,
  id: string,
) {
  return gmailRequest(
    connection,
    `/messages/${id}`,
  );
}

export async function listLabels(
  connection: GoogleConnection,
) {
  return gmailRequest<{
    labels: {
      id: string;
      name: string;
    }[];
  }>(connection, "/labels");
}

export async function sendMessage(
  connection: GoogleConnection,
  rawMessage: string,
) {
  return gmailRequest(
    connection,
    "/messages/send",
    {
      method: "POST",
      body: JSON.stringify({
        raw: rawMessage,
      }),
    },
  );
}