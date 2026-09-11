import { careCheckConfig } from "./client";
import { createCareCheckWsSecurityHeader } from "./ws-security";

const CARECHECK_SANDBOX_CANDIDATE_INVITE_ENDPOINT =
  "https://ebulk.wards.mrisoftware.com/cheqs_test3/ws/candidateInviteService";

type CareCheckCandidateInviteInput = {
  externalReference: string;
  candidateReference: string;
  candidateEmailAddress: string;
  candidateFirstName: string;
  candidateSurname: string;
  checkType: string;
  type: string;
};

export type CareCheckCandidateInviteResult = {
  success: boolean;
  applicationReference: string | null;
  resultCode: string | null;
  resultMessage: string | null;
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

function buildCandidateInviteEnvelope(
  input: CareCheckCandidateInviteInput,
): string {
  const securityHeader = createCareCheckWsSecurityHeader({
    username: careCheckConfig.username,
    password: careCheckConfig.password,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:ebul="http://disclosure.capitarvs.co.uk/schema/ebulkws" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header>
    ${securityHeader}
  </soapenv:Header>
  <soapenv:Body>
    <ebul:EbulkCandidateInviteRequest>
      <ebul:externalReference>${escapeXml(input.externalReference)}</ebul:externalReference>
      <ebul:candidateReference>${escapeXml(input.candidateReference)}</ebul:candidateReference>
      <ebul:candidateEmailAddress>${escapeXml(input.candidateEmailAddress)}</ebul:candidateEmailAddress>
      <ebul:candidateFirstName>${escapeXml(input.candidateFirstName)}</ebul:candidateFirstName>
      <ebul:candidateSurname>${escapeXml(input.candidateSurname)}</ebul:candidateSurname>
      <ebul:checkType>${escapeXml(input.checkType)}</ebul:checkType>
      <ebul:type>${escapeXml(input.type)}</ebul:type>
      <ebul:organisationReference>${escapeXml(
        careCheckConfig.organisationReference,
      )}</ebul:organisationReference>
    </ebul:EbulkCandidateInviteRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export async function sendCareCheckCandidateInvite(
  input: CareCheckCandidateInviteInput,
): Promise<CareCheckCandidateInviteResult> {
  if (careCheckConfig.environment !== "sandbox") {
    throw new Error(
      "Production CareCheck candidate invites are not configured yet.",
    );
  }

  if (!input.externalReference.trim()) {
    throw new Error("CareCheck externalReference is required.");
  }

  if (!input.candidateReference.trim()) {
    throw new Error("CareCheck candidateReference is required.");
  }

  if (!input.candidateEmailAddress.trim()) {
    throw new Error("Candidate email address is required.");
  }

  if (!input.candidateFirstName.trim()) {
    throw new Error("Candidate first name is required.");
  }

  if (!input.candidateSurname.trim()) {
    throw new Error("Candidate surname is required.");
  }

  const envelope = buildCandidateInviteEnvelope(input);

  console.log("CARECHECK SOAP REQUEST");
  console.log(envelope);

  const response = await fetch(
    CARECHECK_SANDBOX_CANDIDATE_INVITE_ENDPOINT,
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

  console.log("CARECHECK HTTP STATUS", response.status);
  console.log("CARECHECK RESPONSE");
  console.log(rawResponse);

  const applicationReference = getTagValue(
    rawResponse,
    "applicationReference",
  );

  const resultCode = getTagValue(rawResponse, "resultCode");
  const resultMessage = getTagValue(rawResponse, "resultMessage");
  const faultString = getTagValue(rawResponse, "faultstring");
  const validationError = getTagValue(rawResponse, "ValidationError");

  if (faultString) {
    throw new Error(
      validationError
        ? `CareCheck SOAP fault: ${faultString} — ${validationError}`
        : `CareCheck SOAP fault: ${faultString}`,
    );
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `CareCheck returned HTTP ${response.status}: ${rawResponse}`,
    );
  }

  return {
    success: resultCode === "OK",
    applicationReference,
    resultCode,
    resultMessage,
    rawResponse,
  };
}