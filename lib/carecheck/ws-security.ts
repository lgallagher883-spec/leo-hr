import { createHash, randomBytes } from "crypto";

type WsSecurityHeaderOptions = {
  username: string;
  password: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function createCareCheckWsSecurityHeader({
  username,
  password,
}: WsSecurityHeaderOptions): string {
  const nonceBytes = randomBytes(16);
  const nonceBase64 = nonceBytes.toString("base64");

  /*
   * SoapUI generates the UsernameToken Created value first.
   * Its separate Timestamp Created value is generated a few
   * milliseconds afterwards.
   *
   * The password digest MUST use the UsernameToken Created value.
   */
  const tokenCreatedDate = new Date();
  const tokenCreated = tokenCreatedDate.toISOString();

  const timestampCreatedDate = new Date(
    tokenCreatedDate.getTime() + 3,
  );

  const timestampCreated =
    timestampCreatedDate.toISOString();

  const expires = new Date(
    timestampCreatedDate.getTime() + 5 * 60 * 1000,
  ).toISOString();

  const digestInput = Buffer.concat([
    nonceBytes,
    Buffer.from(tokenCreated, "utf8"),
    Buffer.from(password, "utf8"),
  ]);

  const passwordDigest = createHash("sha1")
    .update(digestInput)
    .digest("base64");

  const usernameTokenId =
    `UsernameToken-${randomBytes(16)
      .toString("hex")
      .toUpperCase()}`;

  const timestampId =
    `TS-${randomBytes(16)
      .toString("hex")
      .toUpperCase()}`;

  return `
<wsse:Security
  soapenv:mustUnderstand="1"
  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <wsu:Timestamp wsu:Id="${timestampId}">
    <wsu:Created>${timestampCreated}</wsu:Created>
    <wsu:Expires>${expires}</wsu:Expires>
  </wsu:Timestamp>
  <wsse:UsernameToken wsu:Id="${usernameTokenId}">
    <wsse:Username>${escapeXml(username)}</wsse:Username>
    <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">${passwordDigest}</wsse:Password>
    <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonceBase64}</wsse:Nonce>
    <wsu:Created>${tokenCreated}</wsu:Created>
  </wsse:UsernameToken>
</wsse:Security>`.trim();
}