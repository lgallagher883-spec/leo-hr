import { getGoogleAccessToken } from "./connection";
import type { GoogleConnection } from "./gmail";

const DRIVE_API =
  "https://www.googleapis.com/drive/v3";

async function driveRequest<T>(
  connection: GoogleConnection,
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken =
    await getGoogleAccessToken(connection);

  const response = await fetch(
    `${DRIVE_API}${endpoint}`,
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
      `Google Drive request failed (${response.status}).`,
    );
  }

  return response.json();
}

export async function listFiles(
  connection: GoogleConnection,
  pageSize = 25,
) {
  return driveRequest(
    connection,
    `/files?pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)`,
  );
}

export async function getFile(
  connection: GoogleConnection,
  fileId: string,
) {
  return driveRequest(
    connection,
    `/files/${encodeURIComponent(fileId)}`,
  );
}

export async function searchFiles(
  connection: GoogleConnection,
  query: string,
) {
  return driveRequest(
    connection,
    `/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
  );
}