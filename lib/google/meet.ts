import type { GoogleConnection } from "./gmail";
import { createEvent } from "./calendar";

export type GoogleMeetRequest = {
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: {
    email: string;
  }[];
};

export async function createMeetMeeting(
  connection: GoogleConnection,
  request: GoogleMeetRequest,
) {
  const event = {
    summary: request.summary,
    description: request.description,
    start: {
      dateTime: request.start,
    },
    end: {
      dateTime: request.end,
    },
    attendees: request.attendees ?? [],
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  return createEvent(
    connection,
    "primary",
    event,
  );
}