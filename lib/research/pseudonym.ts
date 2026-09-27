import "server-only";

import { createHmac } from "node:crypto";

const KEY_PREFIX = "org_v1_";

export function pseudonymiseOrganisationId(organisationId: string): string {
  const secret = process.env.RESEARCH_PSEUDONYM_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("RESEARCH_PSEUDONYM_SECRET must be configured with at least 32 characters.");
  }
  if (!organisationId.trim()) throw new Error("Organisation ID is required.");
  const digest = createHmac("sha256", secret).update(organisationId.trim()).digest("hex");
  return `${KEY_PREFIX}${digest}`;
}
