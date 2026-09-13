export type DocumentLayout = "branded" | "plain";
export type HeaderStyle = "standard" | "minimal" | "none";
export type FooterStyle = "standard" | "compact" | "none";
export type DefaultOutput = "docx" | "pdf";

export type DocumentBrandSettings = {
  organisationName: string;
  logoUrl: string;
  primaryColour: string;
  secondaryColour: string;
  tradingName: string;
  registeredName: string;
  address: string;
  telephone: string;
  email: string;
  companyNumber: string;
  vatNumber: string;
  headerStyle: HeaderStyle;
  footerStyle: FooterStyle;
  confidentialityStatement: string;
  pageNumbers: boolean;
  confidentialWatermark: boolean;
  defaultOutput: DefaultOutput;
  documentLayout: DocumentLayout;
};

export const DEFAULT_CONFIDENTIALITY_STATEMENT =
  "Confidential. This document contains personal information and is intended only for the named recipient.";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normaliseHexColour(value: unknown, fallback: string): string {
  const candidate = text(value).replace(/^#/, "").toUpperCase();
  return /^[0-9A-F]{6}$/.test(candidate) ? `#${candidate}` : fallback;
}

export function parseDocumentBrandSettings(
  profile: Record<string, unknown> | null | undefined,
  fallbackOrganisationName = "Organisation",
): DocumentBrandSettings {
  const metadata = asRecord(profile?.metadata);
  const settings = asRecord(metadata.document_settings);
  const header = text(settings.header_style);
  const footer = text(settings.footer_style);
  const output = text(settings.default_output);
  const layout = text(settings.document_layout);
  const organisationName =
    text(profile?.display_name) ||
    text(settings.trading_name) ||
    fallbackOrganisationName;

  return {
    organisationName,
    logoUrl: text(profile?.logo_url),
    primaryColour: normaliseHexColour(profile?.primary_colour, "#6E5084"),
    secondaryColour: normaliseHexColour(profile?.secondary_colour, "#F7F1FC"),
    tradingName: text(settings.trading_name),
    registeredName: text(settings.registered_name),
    address: text(settings.address),
    telephone: text(settings.telephone),
    email: text(settings.email),
    companyNumber: text(settings.company_number),
    vatNumber: text(settings.vat_number),
    headerStyle:
      header === "minimal" || header === "none" ? header : "standard",
    footerStyle:
      footer === "compact" || footer === "none" ? footer : "standard",
    confidentialityStatement:
      text(settings.confidentiality_statement) ||
      DEFAULT_CONFIDENTIALITY_STATEMENT,
    pageNumbers: settings.page_numbers !== false,
    confidentialWatermark: settings.confidential_watermark === true,
    defaultOutput: output === "pdf" ? "pdf" : "docx",
    documentLayout: layout === "plain" ? "plain" : "branded",
  };
}
