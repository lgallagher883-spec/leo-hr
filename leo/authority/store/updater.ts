import type {
  AuthorityLegalStatus,
  StoredAuthorityRecord,
} from "./store.ts";
import { upsertAuthorityRecords } from "./store.ts";

const APPROVED_AUTHORITY_DOMAINS = [
  "legislation.gov.uk",
  "gov.uk",
  "www.gov.uk",
  "acas.org.uk",
  "www.acas.org.uk",
  "hse.gov.uk",
  "www.hse.gov.uk",
  "thepensionsregulator.gov.uk",
  "www.thepensionsregulator.gov.uk",
  "judiciary.uk",
  "www.judiciary.uk",
];

type RefreshTopic = {
  key: string;
  label: string;
  instruction: string;
  searchTerms: string[];
};

export type ModelAuthorityRecord = {
  authorityKey?: unknown;
  topic?: unknown;
  title?: unknown;
  sourceUrl?: unknown;
  sourceTitle?: unknown;
  authorityType?: unknown;
  legalStatus?: unknown;
  jurisdiction?: unknown;
  summary?: unknown;
  practicalEffect?: unknown;
  effectiveFrom?: unknown;
  effectiveTo?: unknown;
  sourcePublishedAt?: unknown;
  sourceUpdatedAt?: unknown;
  searchTerms?: unknown;
};

const REFRESH_TOPICS: RefreshTopic[] = [
  {
    key: "statutory-rates",
    label: "Statutory employment rates and thresholds",
    instruction:
      "Verify the currently operative UK employer-facing statutory rates and thresholds, including SSP, National Minimum/Living Wage, family-related statutory pay where officially published, and any material upcoming enacted changes.",
    searchTerms: [
      "ssp", "statutory sick pay", "minimum wage", "national living wage",
      "maternity pay", "paternity pay", "adoption pay", "shared parental pay",
      "statutory pay", "rates", "thresholds"
    ],
  },
  {
    key: "employment-rights-commencement",
    label: "Employment rights and commencement",
    instruction:
      "Verify major current and future-enacted UK employment-rights provisions, commencement dates and transitional arrangements that materially affect employers, especially dismissal qualification, probation-related changes, family rights, flexible working, zero-hours/guaranteed-hours and trade-union changes.",
    searchTerms: [
      "employment rights", "unfair dismissal", "qualifying period",
      "probation", "flexible working", "family leave", "zero hours",
      "guaranteed hours", "trade union", "commencement"
    ],
  },
  {
    key: "fair-work-agency",
    label: "Fair Work Agency",
    instruction:
      "Verify the Fair Work Agency's current remit, powers, enforcement position and commencement timeline. Explicitly separate powers and rights currently in force from future-enacted or proposed changes.",
    searchTerms: [
      "fair work agency", "fwa", "enforcement", "inspection",
      "national minimum wage", "holiday pay", "agency workers",
      "labour market enforcement", "underpayment"
    ],
  },
  {
    key: "acas",
    label: "ACAS Codes and core guidance",
    instruction:
      "Verify current ACAS Codes and material employer guidance affecting disciplinary, grievance, dismissal, absence, reasonable adjustments, redundancy, TUPE, flexible working and settlement agreements. Store only material current or future-enacted changes, not generic prose.",
    searchTerms: [
      "acas", "disciplinary", "grievance", "dismissal", "absence",
      "reasonable adjustments", "redundancy", "tupe",
      "flexible working", "settlement agreement"
    ],
  },
  {
    key: "health-safety",
    label: "Workplace health and safety",
    instruction:
      "Verify current HSE and legislation requirements material to employers, including RIDDOR, risk assessment, COSHH, DSE, manual handling, PPE, first aid, workplace welfare and work-related stress. Capture material current thresholds/tests and future-enacted changes.",
    searchTerms: [
      "hse", "riddor", "risk assessment", "coshh", "dse",
      "manual handling", "ppe", "first aid", "workplace welfare",
      "stress", "health and safety"
    ],
  },
  {
    key: "workplace-pensions",
    label: "Workplace pensions and automatic enrolment",
    instruction:
      "Verify current workplace pension and automatic-enrolment duties using The Pensions Regulator and GOV.UK, including minimum contributions, qualifying earnings, enrolment/re-enrolment, postponement, opt-outs, records and enforcement. Include future-enacted changes only when officially confirmed.",
    searchTerms: [
      "pensions", "workplace pension", "automatic enrolment",
      "auto enrolment", "contributions", "qualifying earnings",
      "re-enrolment", "postponement", "opt out", "pensions regulator"
    ],
  },
  {
    key: "right-to-work",
    label: "Right to work and employer immigration checks",
    instruction:
      "Verify current GOV.UK employer right-to-work checking requirements, statutory excuse requirements, online checks, identity service routes, follow-up checks and material civil-penalty changes.",
    searchTerms: [
      "right to work", "immigration", "statutory excuse", "share code",
      "online check", "identity service provider", "civil penalty"
    ],
  },
  {
    key: "tribunal-appellate",
    label: "Employment tribunal and appellate developments",
    instruction:
      "Identify only recent official Employment Appeal Tribunal or higher-court decisions and exceptional Employment Tribunal decisions that materially change or clarify employer-facing employment-law practice. Distinguish binding appellate authority from non-binding first-instance tribunal decisions.",
    searchTerms: [
      "employment appeal tribunal", "eat", "employment tribunal",
      "case law", "judgment", "appeal"
    ],
  },
];

export function sourceIsApproved(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    return APPROVED_AUTHORITY_DOMAINS.some(
      (domain) =>
        hostname === domain ||
        hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function readOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.output_text === "string") {
    return record.output_text.trim();
  }

  const output = record.output;

  if (!Array.isArray(output)) {
    return "";
  }

  const parts: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content =
      (item as Record<string, unknown>).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const piece of content) {
      if (!piece || typeof piece !== "object") {
        continue;
      }

      const text =
        (piece as Record<string, unknown>).text;

      if (typeof text === "string" && text.trim()) {
        parts.push(text.trim());
      }
    }
  }

  return parts.join("\n");
}

export function stripCodeFence(value: string): string {
  const trimmed = value.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export function asText(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export function asNullableDate(value: unknown): string | null {
  const text = asText(value);

  if (!text) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? text
    : null;
}

export function asStatus(
  value: unknown
): AuthorityLegalStatus {
  const allowed: AuthorityLegalStatus[] = [
    "current",
    "future_enacted",
    "proposed",
    "historical",
    "superseded",
    "uncertain",
  ];

  return allowed.includes(
    value as AuthorityLegalStatus
  )
    ? (value as AuthorityLegalStatus)
    : "uncertain";
}

// authority_type has a database CHECK constraint (postgres error 23514 if
// violated); unlike legal_status this was never validated against the
// allowed enum before being written, so a model-supplied value outside
// this list must fall back to a known-safe value rather than be sent as-is.
const ALLOWED_AUTHORITY_TYPES = [
  "legislation",
  "government",
  "acas",
  "hse",
  "pensions_regulator",
  "fair_work_agency",
  "tribunal",
  "appellate_case_law",
  "regulator",
];

export function asAuthorityType(value: unknown): string {
  const text = asText(value);

  return ALLOWED_AUTHORITY_TYPES.includes(text)
    ? text
    : "government";
}

export function asSearchTerms(
  value: unknown,
  defaults: string[]
): string[] {
  const supplied = Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim().length > 0
      )
    : [];

  return Array.from(
    new Set(
      [...defaults, ...supplied]
        .map((item) =>
          item.toLowerCase().trim()
        )
        .filter(Boolean)
    )
  ).slice(0, 40);
}

export function sourceDomain(url: string): string {
  return new URL(url).hostname.toLowerCase();
}

function buildPrompt(
  topic: RefreshTopic,
  currentDate: string
): string {
  return `
You maintain Leo HR's verified UK employment authority index.

CURRENT DATE: ${currentDate}

AUTHORITY AREA:
${topic.label}

TASK:
${topic.instruction}

SOURCE RULES:
- Use only the official domains available through the web-search tool.
- Prefer legislation.gov.uk for legislation itself.
- Use GOV.UK for government implementation guidance, HMRC/DWP/Home Office material, statutory rates and official Fair Work Agency information.
- Use ACAS for ACAS Codes and guidance.
- Use HSE for workplace health and safety.
- Use The Pensions Regulator for workplace pensions.
- Use judiciary.uk or official GOV.UK tribunal/judgment material for case law.
- Never use blogs, law-firm articles, HR sites, Wikipedia or forums.
- Do not rely on model memory for a changing fact.

TEMPORAL STATUS IS MANDATORY:
Every record must be classified as exactly one of:
current
future_enacted
proposed
historical
superseded
uncertain

Do not describe a future-enacted provision as current.
Do not describe a consultation or government intention as enacted law.
Use effective dates where an official source gives them.

Return ONLY valid JSON. No markdown.

Shape:
{
  "records": [
    {
      "authorityKey": "stable-lowercase-key",
      "topic": "${topic.key}",
      "title": "short descriptive title",
      "sourceUrl": "https://official-source/...",
      "sourceTitle": "official page or instrument title",
      "authorityType": "legislation|government|acas|hse|pensions_regulator|fair_work_agency|tribunal|appellate_case_law|regulator",
      "legalStatus": "current|future_enacted|proposed|historical|superseded|uncertain",
      "jurisdiction": "england_wales|great_britain|united_kingdom|scotland|northern_ireland",
      "summary": "precise verified rule/change",
      "practicalEffect": "what an employer needs to know or do",
      "effectiveFrom": "YYYY-MM-DD or null",
      "effectiveTo": "YYYY-MM-DD or null",
      "sourcePublishedAt": "YYYY-MM-DD or null",
      "sourceUpdatedAt": "YYYY-MM-DD or null",
      "searchTerms": ["useful", "matching", "terms"]
    }
  ]
}

Return a small number of high-value records. Omit generic material that has not changed and does not contain a concrete legal rule, threshold, commencement position or material employer duty.
`;
}

async function researchTopic(
  topic: RefreshTopic,
  currentDate: string
): Promise<StoredAuthorityRecord[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
  }

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        reasoning: { effort: "low" },
        store: false,
        tools: [
          {
            type: "web_search",
            filters: {
              allowed_domains:
                APPROVED_AUTHORITY_DOMAINS,
            },
            search_context_size: "high",
          },
        ],
        tool_choice: "auto",
        input: buildPrompt(topic, currentDate),
      }),
    }
  );

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(
      `Authority refresh research failed for ${topic.key} (${response.status}): ${rawBody.slice(0, 500)}`
    );
  }

  const payload = JSON.parse(rawBody) as unknown;
  const outputText = stripCodeFence(
    readOutputText(payload)
  );

  if (!outputText) {
    return [];
  }

  const parsed = JSON.parse(outputText) as {
    records?: ModelAuthorityRecord[];
  };

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + 36 * 60 * 60 * 1000
  ).toISOString();

  return (parsed.records || [])
    .map((item) => {
      const authorityKey = asText(
        item.authorityKey
      );
      const sourceUrl = asText(item.sourceUrl);
      const title = asText(item.title);
      const summary = asText(item.summary);

      if (
        !authorityKey ||
        !sourceUrl ||
        !title ||
        !summary ||
        !sourceIsApproved(sourceUrl)
      ) {
        return null;
      }

      const authorityType =
        asAuthorityType(item.authorityType);

      return {
        authority_key: authorityKey,
        topic:
          asText(item.topic) || topic.key,
        title,
        source_url: sourceUrl,
        source_domain:
          sourceDomain(sourceUrl),
        source_title:
          asText(item.sourceTitle) || null,
        authority_type: authorityType,
        legal_status:
          asStatus(item.legalStatus),
        jurisdiction:
          asText(item.jurisdiction) ||
          "england_wales",
        summary,
        practical_effect:
          asText(item.practicalEffect) || null,
        effective_from:
          asNullableDate(item.effectiveFrom),
        effective_to:
          asNullableDate(item.effectiveTo),
        source_published_at:
          asNullableDate(
            item.sourcePublishedAt
          ),
        source_updated_at:
          asNullableDate(item.sourceUpdatedAt),
        verified_at: now.toISOString(),
        expires_at: expiresAt,
        search_terms: asSearchTerms(
          item.searchTerms,
          topic.searchTerms
        ),
        content_hash: null,
        metadata: {
          refreshTopic: topic.key,
          refreshedBy:
            "leo-authority-refresh",
        },
      } satisfies StoredAuthorityRecord;
    })
    .filter(
      (item) => item !== null
    ) as StoredAuthorityRecord[];
}

export async function refreshAuthorityStore(): Promise<{
  topicsAttempted: number;
  topicsSucceeded: number;
  recordsWritten: number;
  errors: string[];
}> {
  const currentDate =
    new Date().toISOString().slice(0, 10);

  let topicsSucceeded = 0;
  let recordsWritten = 0;
  const errors: string[] = [];

  // Sequential on purpose: predictable API usage and easier diagnosis.
  for (const topic of REFRESH_TOPICS) {
    try {
      const records =
        await researchTopic(
          topic,
          currentDate
        );

      await upsertAuthorityRecords(records);

      topicsSucceeded += 1;
      recordsWritten += records.length;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Unknown refresh error for ${topic.key}`;

      console.error(
        `Leo authority refresh failed for ${topic.key}:`,
        error
      );

      errors.push(message);
    }
  }

  return {
    topicsAttempted: REFRESH_TOPICS.length,
    topicsSucceeded,
    recordsWritten,
    errors,
  };
}
