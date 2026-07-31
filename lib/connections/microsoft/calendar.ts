import {
  getAuthenticatedMicrosoftConnection,
  microsoftGraphRequest,
} from "@/lib/microsoft/graph";

export type MicrosoftEventAttendee = {
  name?: string;
  address: string;
  type?: "required" | "optional" | "resource";
};

export type MicrosoftCalendarEvent = {
  id: string;
  subject?: string;
  body?: {
    contentType?: "text" | "html" | string;
    content?: string;
  };
  bodyPreview?: string;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
  location?: {
    displayName?: string;
  };
  attendees?: Array<{
    type?: string;
    status?: {
      response?: string;
      time?: string;
    };
    emailAddress?: {
      name?: string;
      address?: string;
    };
  }>;
  webLink?: string;
  isCancelled?: boolean;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: string;
  onlineMeeting?: {
    joinUrl?: string;
  } | null;
  lastModifiedDateTime?: string;
};

export type MicrosoftCalendarListResponse = {
  value: MicrosoftCalendarEvent[];
  "@odata.nextLink"?: string;
};

export type MicrosoftCalendarEventInput = {
  subject: string;
  body?: string;
  bodyType?: "Text" | "HTML";
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  location?: string;
  attendees?: MicrosoftEventAttendee[];
  createTeamsMeeting?: boolean;
  transactionId?: string;
  allowNewTimeProposals?: boolean;
  responseRequested?: boolean;
  reminderMinutesBeforeStart?: number;
  showAs?: "free" | "tentative" | "busy" | "oof" | "workingElsewhere";
  sensitivity?: "normal" | "personal" | "private" | "confidential";
};

function normaliseScopes(scopes?: string[] | null) {
  return new Set((scopes ?? []).map((scope) => scope.trim().toLowerCase()));
}

async function requireScope(connectionId: number, requiredScope: string) {
  const authenticated = await getAuthenticatedMicrosoftConnection(connectionId);
  const scopes = normaliseScopes(
    authenticated.connection.authorised_scopes,
  );

  if (!scopes.has(requiredScope.toLowerCase())) {
    throw new Error(
      `The Microsoft connection requires the ${requiredScope} permission. Reconnect Microsoft 365 after adding this delegated permission.`,
    );
  }
}

function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

function mapAttendees(attendees: MicrosoftEventAttendee[] = []) {
  const unique = new Map<string, MicrosoftEventAttendee>();

  for (const attendee of attendees) {
    const address = normaliseEmail(attendee.address);

    if (!address || !address.includes("@")) {
      continue;
    }

    unique.set(address, {
      ...attendee,
      address,
    });
  }

  return Array.from(unique.values()).map((attendee) => ({
    emailAddress: {
      address: attendee.address,
      ...(attendee.name?.trim()
        ? { name: attendee.name.trim() }
        : {}),
    },
    type: attendee.type ?? "required",
  }));
}

function validateInput(input: MicrosoftCalendarEventInput) {
  if (!input.subject.trim()) {
    throw new Error("An event subject is required.");
  }

  const start = new Date(input.startDateTime);
  const end = new Date(input.endDateTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error("The event date and time are invalid.");
  }

  if (end.getTime() <= start.getTime()) {
    throw new Error("The event end time must be later than the start time.");
  }
}

function eventPayload(input: MicrosoftCalendarEventInput) {
  const timeZone = input.timeZone ?? "Europe/London";

  return {
    subject: input.subject.trim(),
    body: {
      contentType: input.bodyType ?? "HTML",
      content: input.body ?? "",
    },
    start: {
      dateTime: input.startDateTime,
      timeZone,
    },
    end: {
      dateTime: input.endDateTime,
      timeZone,
    },
    ...(input.location?.trim()
      ? {
          location: {
            displayName: input.location.trim(),
          },
        }
      : {}),
    attendees: mapAttendees(input.attendees),
    allowNewTimeProposals: input.allowNewTimeProposals ?? true,
    responseRequested: input.responseRequested ?? true,
    reminderMinutesBeforeStart:
      input.reminderMinutesBeforeStart ?? 30,
    isReminderOn: true,
    showAs: input.showAs ?? "busy",
    sensitivity: input.sensitivity ?? "normal",
    isOnlineMeeting: input.createTeamsMeeting ?? false,
    ...(input.createTeamsMeeting
      ? { onlineMeetingProvider: "teamsForBusiness" }
      : {}),
    ...(input.transactionId
      ? { transactionId: input.transactionId }
      : {}),
  };
}

async function getMicrosoftCalendarEventInternal(
  connectionId: number,
  eventId: string,
) {
  const query = new URLSearchParams({
    $select:
      "id,subject,body,bodyPreview,start,end,location,attendees,webLink,isCancelled,isOnlineMeeting,onlineMeetingProvider,onlineMeeting,lastModifiedDateTime",
  });

  return microsoftGraphRequest<MicrosoftCalendarEvent>(
    connectionId,
    `/me/events/${encodeURIComponent(eventId)}?${query.toString()}`,
  );
}

async function waitForTeamsJoinUrl(
  connectionId: number,
  eventId: string,
) {
  let latest:
    | Awaited<ReturnType<typeof getMicrosoftCalendarEventInternal>>
    | null = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    latest = await getMicrosoftCalendarEventInternal(
      connectionId,
      eventId,
    );

    if (latest.data.onlineMeeting?.joinUrl) {
      return latest;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 250 * (attempt + 1)),
    );
  }

  return latest;
}

export async function listMicrosoftCalendarEvents(
  connectionId: number,
  options?: {
    startDateTime?: string;
    endDateTime?: string;
    limit?: number;
  },
) {
  await requireScope(connectionId, "Calendars.ReadWrite");

  const startDateTime =
    options?.startDateTime ?? new Date().toISOString();
  const endDateTime =
    options?.endDateTime ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);

  const query = new URLSearchParams({
    startDateTime,
    endDateTime,
    $top: String(limit),
    $orderby: "start/dateTime",
    $select:
      "id,subject,bodyPreview,start,end,location,attendees,webLink,isCancelled,isOnlineMeeting,onlineMeetingProvider,onlineMeeting,lastModifiedDateTime",
  });

  return microsoftGraphRequest<MicrosoftCalendarListResponse>(
    connectionId,
    `/me/calendarView?${query.toString()}`,
  );
}

export async function getMicrosoftCalendarEvent(
  connectionId: number,
  eventId: string,
) {
  await requireScope(connectionId, "Calendars.ReadWrite");

  if (!eventId.trim()) {
    throw new Error("A Microsoft calendar event ID is required.");
  }

  return getMicrosoftCalendarEventInternal(
    connectionId,
    eventId.trim(),
  );
}

export async function createMicrosoftCalendarEvent(
  connectionId: number,
  input: MicrosoftCalendarEventInput,
) {
  await requireScope(connectionId, "Calendars.ReadWrite");
  validateInput(input);

  const created = await microsoftGraphRequest<MicrosoftCalendarEvent>(
    connectionId,
    "/me/events",
    {
      method: "POST",
      body: JSON.stringify(eventPayload(input)),
    },
  );

  if (!input.createTeamsMeeting) {
    return created;
  }

  return (
    (await waitForTeamsJoinUrl(connectionId, created.data.id)) ??
    created
  );
}

export async function updateMicrosoftCalendarEvent(
  connectionId: number,
  eventId: string,
  input: MicrosoftCalendarEventInput,
) {
  await requireScope(connectionId, "Calendars.ReadWrite");
  validateInput(input);

  if (!eventId.trim()) {
    throw new Error("A Microsoft calendar event ID is required.");
  }

  await microsoftGraphRequest<void>(
    connectionId,
    `/me/events/${encodeURIComponent(eventId.trim())}`,
    {
      method: "PATCH",
      body: JSON.stringify(eventPayload(input)),
    },
  );

  return (
    (await waitForTeamsJoinUrl(connectionId, eventId.trim())) ??
    getMicrosoftCalendarEventInternal(connectionId, eventId.trim())
  );
}

export async function cancelMicrosoftCalendarEvent(
  connectionId: number,
  eventId: string,
  comment?: string,
) {
  await requireScope(connectionId, "Calendars.ReadWrite");

  if (!eventId.trim()) {
    throw new Error("A Microsoft calendar event ID is required.");
  }

  return microsoftGraphRequest<void>(
    connectionId,
    `/me/events/${encodeURIComponent(eventId.trim())}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({
        comment:
          comment?.trim() ||
          "This interview has been cancelled through LEO Talent.",
      }),
    },
  );
}

export async function deleteMicrosoftCalendarEvent(
  connectionId: number,
  eventId: string,
) {
  await requireScope(connectionId, "Calendars.ReadWrite");

  if (!eventId.trim()) {
    throw new Error("A Microsoft calendar event ID is required.");
  }

  return microsoftGraphRequest<void>(
    connectionId,
    `/me/events/${encodeURIComponent(eventId.trim())}`,
    {
      method: "DELETE",
    },
  );
}