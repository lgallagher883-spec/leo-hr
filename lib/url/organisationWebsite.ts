export type OrganisationWebsiteValidationResult =
  | { isValid: true; canonicalUrl: string | null }
  | { isValid: false; canonicalUrl: null };

function hasSupportedProtocol(value: string) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value);
}

function trimRootSlash(url: URL) {
  const hasDefaultPath = url.pathname === "/";
  const hasQueryOrHash = Boolean(url.search || url.hash);

  if (hasDefaultPath && !hasQueryOrHash) {
    return `${url.protocol}//${url.host}`;
  }

  return url.toString();
}

export function normaliseOrganisationWebsite(
  value: string,
): OrganisationWebsiteValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      isValid: true,
      canonicalUrl: null,
    };
  }

  const candidate = hasSupportedProtocol(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        isValid: false,
        canonicalUrl: null,
      };
    }

    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return {
        isValid: false,
        canonicalUrl: null,
      };
    }

    if (parsed.username || parsed.password) {
      return {
        isValid: false,
        canonicalUrl: null,
      };
    }

    const canonicalUrl = trimRootSlash(parsed);

    return {
      isValid: true,
      canonicalUrl,
    };
  } catch {
    return {
      isValid: false,
      canonicalUrl: null,
    };
  }
}
