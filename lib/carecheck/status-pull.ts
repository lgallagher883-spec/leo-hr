import { careCheckConfig } from "./client";
import { createCareCheckWsSecurityHeader } from "./ws-security";

const CARECHECK_SANDBOX_STATUS_PULL_ENDPOINT =
  "https://ebulk.wards.mrisoftware.com/cheqs_test3/ws/statusPullService";

export type CareCheckStatusResult = {
  success: boolean;
  responseCode: string | null;
  responseMessage: string | null;
  applicationReference: string | null;
  externalReference: string | null;
  statusCode: string | null;
  statusDescription: string | null;
  isCurrentStatus: boolean | null;
  workingWithVulnerableAdults: string | null;
  workingWithChildren: string | null;
  rawResponse: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getTagValue(xml: string, tagName: string): string | null {
  const expression = new RegExp(
    `<(?:[A-Za-z0-9_-]+:)?${tagName}[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?${tagName}>`,
    "i",
  );

  const match = xml.match(expression);

  return match?.[1]?.trim() || null;
}

function readBoolean(value: string | null): boolean | null {
  if (value === null) return null;

  const normalised = value.trim().toLowerCase();

  if (normalised === "true" || normalised === "yes") return true;
  if (normalised === "false" || normalised === "no") return false;

  return null;
}

function buildStatusPullEnvelope(applicationReference: string): string {
  const securityHeader = createCareCheckWsSecurityHeader({
    username: careCheckConfig.username,
    password: careCheckConfig.password,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:stat="http://disclosure.capitarvs.co.uk/schema/ebulkws/StatusPull/">
  <soapenv:Header>
    ${securityHeader}
  </soapenv:Header>
  <soapenv:Body>
    <stat:StatusPullRequest>
      <stat:applicationStatusRequest>
        <stat:ApplicationReference>${escapeXml(applicationReference)}</stat:ApplicationReference>
      </stat:applicationStatusRequest>
    </stat:StatusPullRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export async function pullCareCheckApplicationStatus(
  applicationReference: string,
): Promise<CareCheckStatusResult> {
  if (careCheckConfig.environment !== "sandbox") {
    throw new Error(
      "Production CareCheck status pull is not configured yet.",
    );
  }

  const reference = applicationReference.trim();

  if (!reference) {
    throw new Error("CareCheck application reference is required.");
  }

  const envelope = buildStatusPullEnvelope(reference);

  const response = await fetch(
    CARECHECK_SANDBOX_STATUS_PULL_ENDPOINT,
    {
      method: "POST",
      headers: {
        "Accept-Encoding": "gzip,deflate",
        "Content-Type": "text/xml;charset=UTF-8",
        SOAPAction: '""',
        "User-Agent": "LEO-HR-CareCheck/1.0",
      },
      body: envelope,
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    },
  );

  const rawResponse = await response.text();

  const faultString = getTagValue(rawResponse, "faultstring");

  if (faultString) {
    throw new Error(`CareCheck SOAP fault: ${faultString}`);
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `CareCheck returned HTTP ${response.status}: ${rawResponse}`,
    );
  }

  const responseCode = getTagValue(rawResponse, "ResponseCode");
  const responseMessage = getTagValue(rawResponse, "ResponseMessage");
  const returnedApplicationReference = getTagValue(
    rawResponse,
    "ApplicationReference",
  );
  const externalReference = getTagValue(rawResponse, "ExternalRef");
  const statusCode = getTagValue(rawResponse, "StatusCode");
  const statusDescription = getTagValue(
    rawResponse,
    "StatusDescription",
  );
  const isCurrentStatus = readBoolean(
    getTagValue(rawResponse, "IsCurrentStatus"),
  );
  const workingWithVulnerableAdults = getTagValue(
    rawResponse,
    "WorkingWithVulnerableAdults",
  );
  const workingWithChildren = getTagValue(
    rawResponse,
    "WorkingWithChildren",
  );

  return {
    success: responseCode === "OK",
    responseCode,
    responseMessage,
    applicationReference:
      returnedApplicationReference || reference,
    externalReference,
    statusCode,
    statusDescription,
    isCurrentStatus,
    workingWithVulnerableAdults,
    workingWithChildren,
    rawResponse,
  };
}
