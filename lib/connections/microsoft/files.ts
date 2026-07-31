import {
  getAuthenticatedMicrosoftConnection,
  microsoftGraphRequest,
} from "@/lib/microsoft/graph";

export type MicrosoftDriveItem = {
  id: string;
  name: string;
  size?: number;
  webUrl?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  folder?: { childCount?: number };
  file?: { mimeType?: string; hashes?: Record<string, string> };
  parentReference?: {
    driveId?: string;
    id?: string;
    path?: string;
  };
  "@microsoft.graph.downloadUrl"?: string;
};

export type MicrosoftDriveListResponse = {
  value: MicrosoftDriveItem[];
  "@odata.nextLink"?: string;
};

export type MicrosoftSharingLink = {
  id?: string;
  link?: {
    type?: string;
    scope?: string;
    webUrl?: string;
    preventsDownload?: boolean;
  };
  expirationDateTime?: string;
};

export type MicrosoftUploadSession = {
  uploadUrl: string;
  expirationDateTime?: string;
  nextExpectedRanges?: string[];
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

function encodeDrivePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function validateName(name: string, label: string) {
  if (!name.trim()) throw new Error(`${label} is required.`);
}

export async function listMicrosoftDriveItems(
  connectionId: number,
  folderItemId?: string,
) {
  await requireScope(connectionId, "Files.ReadWrite");

  const path = folderItemId
    ? `/me/drive/items/${encodeURIComponent(folderItemId)}/children`
    : "/me/drive/root/children";

  return microsoftGraphRequest<MicrosoftDriveListResponse>(
    connectionId,
    `${path}?$select=id,name,size,webUrl,createdDateTime,lastModifiedDateTime,folder,file,parentReference`,
  );
}

export async function createMicrosoftDriveFolder(
  connectionId: number,
  folderName: string,
  parentItemId?: string,
) {
  await requireScope(connectionId, "Files.ReadWrite");
  validateName(folderName, "A folder name");

  const path = parentItemId
    ? `/me/drive/items/${encodeURIComponent(parentItemId)}/children`
    : "/me/drive/root/children";

  return microsoftGraphRequest<MicrosoftDriveItem>(
    connectionId,
    path,
    {
      method: "POST",
      body: JSON.stringify({
        name: folderName.trim(),
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
      }),
    },
  );
}

export async function uploadSmallMicrosoftDriveFile(
  connectionId: number,
  input: {
    fileName: string;
    content: ArrayBuffer | Uint8Array | Buffer | string;
    folderPath?: string;
    contentType?: string;
    conflictBehavior?: "rename" | "replace" | "fail";
  },
) {
  await requireScope(connectionId, "Files.ReadWrite");
  validateName(input.fileName, "A file name");

  const pathParts = [
    input.folderPath ? encodeDrivePath(input.folderPath) : "",
    encodeURIComponent(input.fileName.trim()),
  ].filter(Boolean);

  const conflict =
    input.conflictBehavior ?? "rename";

  return microsoftGraphRequest<MicrosoftDriveItem>(
    connectionId,
    `/me/drive/root:/${pathParts.join("/")}:/content?@microsoft.graph.conflictBehavior=${conflict}`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          input.contentType ?? "application/octet-stream",
      },
      body: input.content as BodyInit,
    },
  );
}

export async function createMicrosoftDriveUploadSession(
  connectionId: number,
  input: {
    fileName: string;
    folderPath?: string;
    conflictBehavior?: "rename" | "replace" | "fail";
  },
) {
  await requireScope(connectionId, "Files.ReadWrite");
  validateName(input.fileName, "A file name");

  const pathParts = [
    input.folderPath ? encodeDrivePath(input.folderPath) : "",
    encodeURIComponent(input.fileName.trim()),
  ].filter(Boolean);

  return microsoftGraphRequest<MicrosoftUploadSession>(
    connectionId,
    `/me/drive/root:/${pathParts.join("/")}:/createUploadSession`,
    {
      method: "POST",
      body: JSON.stringify({
        item: {
          name: input.fileName.trim(),
          "@microsoft.graph.conflictBehavior":
            input.conflictBehavior ?? "rename",
        },
      }),
    },
  );
}

export async function getMicrosoftDriveItem(
  connectionId: number,
  itemId: string,
) {
  await requireScope(connectionId, "Files.ReadWrite");

  return microsoftGraphRequest<MicrosoftDriveItem>(
    connectionId,
    `/me/drive/items/${encodeURIComponent(itemId)}?$select=id,name,size,webUrl,createdDateTime,lastModifiedDateTime,folder,file,parentReference,@microsoft.graph.downloadUrl`,
  );
}

export async function createMicrosoftDriveSharingLink(
  connectionId: number,
  itemId: string,
  options?: {
    type?: "view" | "edit" | "embed";
    scope?: "anonymous" | "organization" | "users";
    expirationDateTime?: string;
    retainInheritedPermissions?: boolean;
  },
) {
  await requireScope(connectionId, "Files.ReadWrite");

  return microsoftGraphRequest<MicrosoftSharingLink>(
    connectionId,
    `/me/drive/items/${encodeURIComponent(itemId)}/createLink`,
    {
      method: "POST",
      body: JSON.stringify({
        type: options?.type ?? "view",
        scope: options?.scope ?? "organization",
        retainInheritedPermissions:
          options?.retainInheritedPermissions ?? true,
        ...(options?.expirationDateTime
          ? { expirationDateTime: options.expirationDateTime }
          : {}),
      }),
    },
  );
}

export async function deleteMicrosoftDriveItem(
  connectionId: number,
  itemId: string,
) {
  await requireScope(connectionId, "Files.ReadWrite");

  return microsoftGraphRequest<void>(
    connectionId,
    `/me/drive/items/${encodeURIComponent(itemId)}`,
    { method: "DELETE" },
  );
}