import { getGoogleAccessToken } from "./connection";
import type { GoogleConnection } from "./gmail";

const CALENDAR_API =
  "https://www.googleapis.com/calendar/v3";

async function calendarRequest<T>(
  connection: GoogleConnection,
  endpoint: string,
  init?: RequestInit,
): Promise<T> {
  const accessToken =
    await getGoogleAccessToken(connection);

  const response = await fetch(
    `${CALENDAR_API}${endpoint}`,
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
      `Google Calendar request failed (${response.status}).`,
    );
  }

  return response.json();
}

export async function listCalendars(
  connection: GoogleConnection,
) {
  return calendarRequest(
    connection,
    "/users/me/calendarList",
  );
}

export async function listEvents(
  connection: GoogleConnection,
  calendarId = "primary",
) {
  return calendarRequest(
    connection,
    `/calendars/${encodeURIComponent(
      calendarId,
    )}/events`,
  );
}

export async function createEvent(
  connection: GoogleConnection,
  calendarId: string,
  event: Record<string, unknown>,
) {
  return calendarRequest(
    connection,
    `/calendars/${encodeURIComponent(
      calendarId,
    )}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      body: JSON.stringify(event),
    },
  );
}