import {
  getAuthenticatedMicrosoftConnection,
  microsoftGraphRequest,
} from "@/lib/microsoft/graph";

export type MicrosoftEmailAddress = {
  name?: string;
  address: string;
};

export type MicrosoftMailAttachment = {
  name: string;
  contentType?: string;
  contentBytes: string;
  isInline?: boolean;
  contentId?: string;
};

export type MicrosoftMailMessage = {
  id: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  sentDateTime?: string;
  isRead?: boolean;
  webLink?: string;
  internetMessageId?: string;
  from?: { emailAddress?: MicrosoftEmailAddress };
  toRecipients?: Array<{ emailAddress?: MicrosoftEmailAddress }>;
};

export type MicrosoftMailListResponse = {
  value: MicrosoftMailMessage[];
  "@odata.nextLink"?: string;
};

export type SendMicrosoftMailInput = {
  subject: string;
  body: string;
  bodyType?: "Text" | "HTML";
  to: MicrosoftEmailAddress[];
  cc?: MicrosoftEmailAddress[];
  bcc?: MicrosoftEmailAddress[];
  replyTo?: MicrosoftEmailAddress[];
  attachments?: MicrosoftMailAttachment[];
  importance?: "low" | "normal" | "high";
  saveToSentItems?: boolean;
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

function validAddress(value: string) {
  const address = value.trim().toLowerCase();
  return address.includes("@") ? address : "";
}

function recipients(values: MicrosoftEmailAddress[] = []) {
  const unique = new Map<string, MicrosoftEmailAddress>();

  for (const value of values) {
    const address = validAddress(value.address);
    if (address) unique.set(address, { ...value, address });
  }

  return Array.from(unique.values()).map((email) => ({
    emailAddress: {
      address: email.address,
      ...(email.name?.trim() ? { name: email.name.trim() } : {}),
    },
  }));
}

function attachments(values: MicrosoftMailAttachment[] = []) {
  return values.map((attachment) => {
    if (!attachment.name.trim() || !attachment.contentBytes.trim()) {
      throw new Error("Every email attachment requires a name and content.");
    }

    return {
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: attachment.name.trim(),
      contentType:
        attachment.contentType ?? "application/octet-stream",
      contentBytes: attachment.contentBytes,
      isInline: attachment.isInline ?? false,
      ...(attachment.contentId?.trim()
        ? { contentId: attachment.contentId.trim() }
        : {}),
    };
  });
}

function messagePayload(input: SendMicrosoftMailInput) {
  if (!input.subject.trim()) {
    throw new Error("An email subject is required.");
  }

  if (!input.body.trim()) {
    throw new Error("An email body is required.");
  }

  const toRecipients = recipients(input.to);

  if (!toRecipients.length) {
    throw new Error("At least one valid recipient is required.");
  }

  return {
    subject: input.subject.trim(),
    body: {
      contentType: input.bodyType ?? "HTML",
      content: input.body,
    },
    toRecipients,
    ccRecipients: recipients(input.cc),
    bccRecipients: recipients(input.bcc),
    replyTo: recipients(input.replyTo),
    importance: input.importance ?? "normal",
    attachments: attachments(input.attachments),
  };
}

export async function listRecentMicrosoftMessages(
  connectionId: number,
  options?: { limit?: number; unreadOnly?: boolean },
) {
  await requireScope(connectionId, "Mail.Read");

  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);
  const query = new URLSearchParams({
    $top: String(limit),
    $orderby: "receivedDateTime desc",
    $select:
      "id,subject,bodyPreview,receivedDateTime,sentDateTime,isRead,webLink,internetMessageId,from,toRecipients",
  });

  if (options?.unreadOnly) query.set("$filter", "isRead eq false");

  return microsoftGraphRequest<MicrosoftMailListResponse>(
    connectionId,
    `/me/messages?${query.toString()}`,
  );
}

export async function getMicrosoftMessage(
  connectionId: number,
  messageId: string,
) {
  await requireScope(connectionId, "Mail.Read");

  return microsoftGraphRequest<MicrosoftMailMessage>(
    connectionId,
    `/me/messages/${encodeURIComponent(messageId)}`,
  );
}

export async function createMicrosoftMailDraft(
  connectionId: number,
  input: SendMicrosoftMailInput,
) {
  await requireScope(connectionId, "Mail.Send");

  return microsoftGraphRequest<MicrosoftMailMessage>(
    connectionId,
    "/me/messages",
    {
      method: "POST",
      body: JSON.stringify(messagePayload(input)),
    },
  );
}

export async function sendMicrosoftMailDraft(
  connectionId: number,
  messageId: string,
) {
  await requireScope(connectionId, "Mail.Send");

  return microsoftGraphRequest<void>(
    connectionId,
    `/me/messages/${encodeURIComponent(messageId)}/send`,
    { method: "POST" },
  );
}

export async function sendMicrosoftMail(
  connectionId: number,
  input: SendMicrosoftMailInput,
) {
  await requireScope(connectionId, "Mail.Send");

  return microsoftGraphRequest<void>(
    connectionId,
    "/me/sendMail",
    {
      method: "POST",
      body: JSON.stringify({
        message: messagePayload(input),
        saveToSentItems: input.saveToSentItems ?? true,
      }),
    },
  );
}