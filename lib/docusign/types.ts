export type SignatureSourceModule = "Talent" | "Employees" | "Matters" | "Documents" | "Policies" | "Other";
export type SignatureEnvelopeStatus = "created" | "sent" | "delivered" | "completed" | "declined" | "voided" | "expired" | "error";

export type SignatureRecipient = {
  name: string;
  email: string;
  routingOrder?: number;
  roleName?: string;
};

export type CreateSignatureEnvelopeInput = {
  organisationId: string;
  connectionId: number;
  sourceModule: SignatureSourceModule;
  sourceRecordId: string;
  sourceDocumentId?: string | null;
  documentName: string;
  documentBase64: string;
  documentExtension?: string;
  emailSubject: string;
  emailMessage?: string;
  recipients: SignatureRecipient[];
  sendImmediately?: boolean;
  createdByUserId: string;
};

export type DocuSignTokenPayload = {
  provider: "docusign";
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  scope?: string | null;
  expires_at?: string | null;
  created_at?: string;
  account_id: string;
  base_uri: string;
};

export type DocuSignEnvelopeResponse = {
  envelopeId?: string;
  status?: string;
  statusDateTime?: string;
  uri?: string;
  errorCode?: string;
  message?: string;
};

export type DocuSignEnvelopeStatusResponse = {
  envelopeId?: string;
  status?: string;
  statusChangedDateTime?: string;
  sentDateTime?: string;
  deliveredDateTime?: string;
  completedDateTime?: string;
  declinedDateTime?: string;
  voidedDateTime?: string;
  expireDateTime?: string;
  errorCode?: string;
  message?: string;
};