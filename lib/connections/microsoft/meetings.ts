import {
  getAuthenticatedMicrosoftConnection,
  microsoftGraphRequest,
} from "@/lib/microsoft/graph";

export type MicrosoftOnlineMeeting = {
  id: string;
  subject?: string;
  joinWebUrl?: string;
  startDateTime?: string;
  endDateTime?: string;
  creationDateTime?: string;
  externalId?: string;
};

export type MicrosoftOnlineMeetingInput = {
  subject: string;
  startDateTime: string;
  endDateTime: string;
  externalId?: string;
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

function validateInput(input: MicrosoftOnlineMeetingInput) {
  if (!input.subject.trim()) {
    throw new Error("A meeting subject is required.");
  }

  const start = new Date(input.startDateTime);
  const end = new Date(input.endDateTime);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end.getTime() <= start.getTime()
  ) {
    throw new Error("The meeting date and time are invalid.");
  }
}

export async function createMicrosoftOnlineMeeting(
  connectionId: number,
  input: MicrosoftOnlineMeetingInput,
) {
  await requireScope(connectionId, "OnlineMeetings.ReadWrite");
  validateInput(input);

  return microsoftGraphRequest<MicrosoftOnlineMeeting>(
    connectionId,
    "/me/onlineMeetings",
    {
      method: "POST",
      body: JSON.stringify({
        subject: input.subject.trim(),
        startDateTime: input.startDateTime,
        endDateTime: input.endDateTime,
        ...(input.externalId?.trim()
          ? { externalId: input.externalId.trim() }
          : {}),
      }),
    },
  );
}

export async function updateMicrosoftOnlineMeeting(
  connectionId: number,
  meetingId: string,
  input: MicrosoftOnlineMeetingInput,
) {
  await requireScope(connectionId, "OnlineMeetings.ReadWrite");
  validateInput(input);

  return microsoftGraphRequest<MicrosoftOnlineMeeting>(
    connectionId,
    `/me/onlineMeetings/${encodeURIComponent(meetingId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        subject: input.subject.trim(),
        startDateTime: input.startDateTime,
        endDateTime: input.endDateTime,
      }),
    },
  );
}

export async function getMicrosoftOnlineMeeting(
  connectionId: number,
  meetingId: string,
) {
  await requireScope(connectionId, "OnlineMeetings.ReadWrite");

  return microsoftGraphRequest<MicrosoftOnlineMeeting>(
    connectionId,
    `/me/onlineMeetings/${encodeURIComponent(meetingId)}`,
  );
}

export async function deleteMicrosoftOnlineMeeting(
  connectionId: number,
  meetingId: string,
) {
  await requireScope(connectionId, "OnlineMeetings.ReadWrite");

  return microsoftGraphRequest<void>(
    connectionId,
    `/me/onlineMeetings/${encodeURIComponent(meetingId)}`,
    { method: "DELETE" },
  );
}