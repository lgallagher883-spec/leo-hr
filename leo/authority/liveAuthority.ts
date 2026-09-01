import { after } from "next/server";

import type { AuthorityEngineOutput } from "./types";

import {
  findStoredAuthority,
  StoredAuthorityRecord,
  upsertAuthorityRecords,
} from "./store/store";
import {
  buildPersistableAuthorityRecords,
  normaliseSourceUrl,
  parseCandidateAuthorityRecords,
} from "./store/livePersistence";

export type LiveAuthoritySource = {
  url: string;
  title?: string;
};

export type LiveAuthorityResult = {
  required: boolean;
  searched: boolean;
  verifiedCurrent: boolean;
  queriedAt: string;
  evidence: string;
  sources: LiveAuthoritySource[];
  error?: string;
};

// Delimits the prose evidence briefing (unchanged contract) from the
// structured records appended for reusable-authority persistence only.
const STRUCTURED_RECORDS_MARKER =
  "===LEO_STRUCTURED_AUTHORITY_RECORDS===";

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

const CLEARLY_NON_AUTHORITY_REQUESTS = [
  "rewrite this",
  "reword this",
  "make this friendlier",
  "make this more professional",
  "shorten this",
  "proofread this",
  "fix the grammar",
];

function shouldResearchLiveAuthority(
  message: string
): boolean {
  const text = message.trim().toLowerCase();

  if (!text) {
    return false;
  }

  if (
    CLEARLY_NON_AUTHORITY_REQUESTS.some(
      (phrase) =>
        text.startsWith(phrase)
    )
  ) {
    return false;
  }

  // Ask Leo is an HR service. Substantive HR,
  // employment-law, H&S, pensions and regulatory
  // questions should be authority-grounded.
  return true;
}

function buildResearchInput(input: {
  message: string;
  staticAuthority: AuthorityEngineOutput;
  currentDate: string;
}): string {
  const detectedAuthorities =
    input.staticAuthority.applicableAuthorities
      .map((authority) => authority.title)
      .join(", ");

  return `
You are Leo's live UK employment authority researcher.

CURRENT DATE: ${input.currentDate}

EMPLOYER QUESTION:
${input.message}

STATIC TOPIC DETECTION
Routing hints only. Never treat this content as current law.

Detected authorities:
${detectedAuthorities || "None"}

Research the current authoritative position needed to answer the employer accurately.

RESEARCH SCOPE AND STOPPING RULE
- Use the minimum number of directly relevant official sources needed to verify the material propositions in the professional issue map, normally 2 to 6 sources in total.
- Prefer one primary or highest-authority current source for each material proposition. Add a second source only where it materially clarifies practical application, legal status or a genuine conflict.
- Do not collect adjacent, background or merely related authority once the material propositions are adequately supported.
- Stop searching when every material authority-verification question is either supported by a current official source or explicitly marked unresolved.

MANDATORY SOURCE RULES
- Use only the approved official domains available through web search.
- Prefer primary legislation on legislation.gov.uk where the legal text itself matters.
- Use GOV.UK, including HMRC, DWP and Home Office material hosted there, for current statutory rates, thresholds, dates, immigration/right-to-work and government implementation guidance.
- Use ACAS for current workplace guidance and Codes.
- Use HSE for workplace health and safety, including RIDDOR, COSHH, DSE, PPE, manual handling, first aid, workplace welfare, stress and risk-assessment duties.
- Use The Pensions Regulator and GOV.UK for workplace pensions, automatic enrolment, re-enrolment, contributions, postponement, opt-outs, record-keeping and enforcement.
- Include the current Fair Work Agency position and enforcement remit where the question touches pay, holiday pay, SSP, agency workers, labour-market enforcement, record keeping, minimum wage or worker exploitation.
- Use official tribunal/judiciary material only where case law is genuinely relevant. Distinguish ordinary Employment Tribunal decisions from binding appellate authority.
- Do not use blogs, law-firm articles, HR websites, Wikipedia, forums or model memory as authority.

TEMPORAL STATUS RULES
Explicitly distinguish:
- CURRENT: operative now.
- FUTURE_ENACTED: enacted/confirmed but not yet operative.
- PROPOSED: consultation, proposal, policy intention or draft measure.
- HISTORICAL/SUPERSEDED: no longer operative.
- UNCERTAIN: official material does not establish the position clearly.

Never describe FUTURE_ENACTED or PROPOSED material as current law.

FRESHNESS RULES
- Check whether the source is current as at ${input.currentDate}.
- For rates, thresholds, qualifying periods, commencement dates, statutory entitlements or regulatory powers, identify the effective date or tax year where available.
- If legislation has phased commencement or transitional rules, identify that explicitly.
- If sources conflict, prefer the higher legal authority and explain the conflict briefly.
- Never invent a figure, date, legal rule or source.

OUTPUT
Return a concise evidence briefing for another model to use. It must contain:
1. the verified CURRENT legal/regulatory position;
2. FUTURE_ENACTED changes separately, including effective dates;
3. PROPOSED changes separately where materially relevant;
4. important rates, thresholds or transitional rules;
5. practical implications for the employer;
6. any material uncertainty that remains.

Do not draft the final employer-facing answer.

STRUCTURED RECORD OUTPUT
After the evidence briefing above, on new lines, output exactly the marker line below followed by a single fenced json code block. Never place this marker or json block anywhere else in your response.
${STRUCTURED_RECORDS_MARKER}
\`\`\`json
{
  "records": [
    {
      "topic": "short topic slug",
      "title": "short descriptive title",
      "sourceUrl": "https://the-official-source-you-actually-used/...",
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
\`\`\`
Only include a record whose sourceUrl is one of the official sources you genuinely used above and that directly supports the stated proposition. Never invent a sourceUrl, title, date or figure. Omit any proposition you are not confident is current. If nothing qualifies, return {"records": []}.
`;
}

function buildStoredEvidence(
  records: StoredAuthorityRecord[]
): string {
  return records
    .map((record) => {
      const dates = [
        record.effective_from
          ? `Effective from: ${record.effective_from}`
          : "",
        record.effective_to
          ? `Effective to: ${record.effective_to}`
          : "",
      ]
        .filter(Boolean)
        .join(". ");

      return [
        `[${record.legal_status.toUpperCase()}] ${record.title}`,
        `Verified: ${record.verified_at}`,
        dates,
        `Rule: ${record.summary}`,
        record.practical_effect
          ? `Employer effect: ${record.practical_effect}`
          : "",
        `Official source: ${record.source_url}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function collectWebSources(
  output: unknown
): LiveAuthoritySource[] {
  const found =
    new Map<string, LiveAuthoritySource>();

  function visit(value: unknown): void {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    const record =
      value as Record<string, unknown>;

    const url =
      typeof record.url === "string" &&
      record.url.startsWith("http")
        ? record.url
        : null;

    if (url) {
      const title =
        typeof record.title === "string"
          ? record.title
          : undefined;

      found.set(url, { url, title });
    }

    for (
      const nested of Object.values(record)
    ) {
      visit(nested);
    }
  }

  visit(output);

  return Array.from(found.values());
}

function collectCitedSources(
  evidence: string,
  payload: unknown
): LiveAuthoritySource[] {
  const availableSources = collectWebSources(payload);
  const titlesByUrl = new Map(
    availableSources.map((source) => [normaliseSourceUrl(source.url), source.title])
  );
  const citedUrls = Array.from(
    evidence.matchAll(/https?:\/\/[^\s)\]]+/g),
    (match) => match[0]
  );
  const citedSources = new Map<string, LiveAuthoritySource>();

  for (const rawUrl of citedUrls) {
    const url = normaliseSourceUrl(rawUrl);

    if (!url || !sourceIsApproved(url) || citedSources.has(url)) {
      continue;
    }

    citedSources.set(url, {
      url,
      title: titlesByUrl.get(url),
    });

    if (citedSources.size === 6) {
      break;
    }
  }

  return Array.from(citedSources.values());
}

function sourceIsApproved(url: string): boolean {
  try {
    const hostname =
      new URL(url).hostname.toLowerCase();

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

  const record =
    payload as Record<string, unknown>;

  if (
    typeof record.output_text === "string"
  ) {
    return record.output_text.trim();
  }

  const output = record.output;

  if (!Array.isArray(output)) {
    return "";
  }

  const textParts: string[] = [];

  for (const item of output) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const content =
      (item as Record<string, unknown>)
        .content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      if (
        !contentItem ||
        typeof contentItem !== "object"
      ) {
        continue;
      }

      const text =
        (
          contentItem as Record<
            string,
            unknown
          >
        ).text;

      if (
        typeof text === "string" &&
        text.trim()
      ) {
        textParts.push(text.trim());
      }
    }
  }

  return textParts.join("\n\n");
}

export async function researchLiveAuthority(
  input: {
    message: string;
    staticAuthority: AuthorityEngineOutput;
    storedAuthorityQuery?: string;
  }
): Promise<LiveAuthorityResult> {
  const queriedAt =
    new Date().toISOString();

  const required =
    shouldResearchLiveAuthority(
      input.message
    );

  if (!required) {
    return {
      required: false,
      searched: false,
      verifiedCurrent: false,
      queriedAt,
      evidence:
        "No live authority research was required for this request.",
      sources: [],
    };
  }

  // FAST PATH:
  // Use Leo's independently refreshed authority store
  // when it contains relevant records verified within
  // the freshness window. Match against the concise
  // employer/issue terms, not the formatted research query.
  const stored =
    await findStoredAuthority(
      input.storedAuthorityQuery || input.message
    );

  const forceLiveAuthority =
    process.env.NODE_ENV === "development" &&
    process.env.ASK_LEO_FORCE_LIVE_AUTHORITY === "true";

  if (
    !forceLiveAuthority &&
    stored.fresh &&
    stored.sufficient &&
    stored.records.length > 0
  ) {
    return {
      required: true,
      searched: false,
      verifiedCurrent: true,
      queriedAt,
      evidence: [
        "VERIFIED AUTHORITY STORE RESULT",
        "The following official-source records were independently refreshed within Leo's freshness window.",
        "",
        buildStoredEvidence(
          stored.records
        ),
      ].join("\n"),
      sources: stored.records.map(
        (record) => ({
          url: record.source_url,
          title:
            record.source_title ||
            record.title,
        })
      ),
    };
  }

  // SAFETY FALLBACK:
  // If the store has no fresh relevant record,
  // perform a live official-source lookup before Leo answers.
  const apiKey =
    process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      required,
      searched: false,
      verifiedCurrent: false,
      queriedAt,
      evidence:
        "Current authority could not be verified because the live research service is unavailable. Do not guess current legal, statutory, regulatory, pensions or health-and-safety facts.",
      sources: [],
      error:
        "OPENAI_API_KEY is not configured.",
    };
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          reasoning: {
            effort: "low",
          },
          max_tool_calls: 2,
          store: false,
          tools: [
            {
              type: "web_search",
              filters: {
                allowed_domains:
                  APPROVED_AUTHORITY_DOMAINS,
              },
              search_context_size:
                "low",
            },
          ],
          tool_choice: "auto",
          include: [
            "web_search_call.action.sources",
          ],
          input:
            buildResearchInput({
              message: input.message,
              staticAuthority:
                input.staticAuthority,
              currentDate:
                queriedAt.slice(0, 10),
            }),
        }),
      }
    );

    const rawBody =
      await response.text();

    if (!response.ok) {
      throw new Error(
        `OpenAI live authority request failed (${response.status}): ${rawBody.slice(0, 500)}`
      );
    }

    const payload =
      JSON.parse(rawBody) as unknown;

    const rawOutputText =
      readOutputText(payload);

    const markerIndex = rawOutputText.indexOf(
      STRUCTURED_RECORDS_MARKER
    );

    const evidence = (
      markerIndex === -1
        ? rawOutputText
        : rawOutputText.slice(0, markerIndex)
    ).trim();

    const structuredSection =
      markerIndex === -1
        ? ""
        : rawOutputText.slice(
            markerIndex +
              STRUCTURED_RECORDS_MARKER.length
          );

    const sources = collectCitedSources(
      evidence,
      payload
    );

    const searched =
      sources.length > 0;

    const verifiedCurrent =
      searched &&
      evidence.length > 0;

    // Best-effort reusable-authority persistence. Must never affect
    // this response, so preparation and the write are both isolated.
    try {
      const candidateRecords =
        parseCandidateAuthorityRecords(
          structuredSection
        );
      const persistableRecords =
        buildPersistableAuthorityRecords({
          candidates: candidateRecords,
          citedSources: sources,
          searched,
          verifiedCurrent,
          evidence,
        });

      if (persistableRecords.length > 0) {
        after(async () => {
          try {
            await upsertAuthorityRecords(
              persistableRecords
            );
          } catch (persistError) {
            console.error(
              "Leo ad-hoc live authority persistence failed:",
              persistError
            );
          }
        });
      }
    } catch (prepareError) {
      console.error(
        "Leo ad-hoc live authority persistence preparation failed:",
        prepareError
      );
    }

    return {
      required,
      searched,
      verifiedCurrent,
      queriedAt,
      evidence:
        evidence ||
        "Live authority research returned no usable evidence. Current legal or regulatory facts must not be guessed.",
      sources,
      error:
        stored.error &&
        !stored.available
          ? stored.error
          : undefined,
    };
  } catch (error) {
    console.error(
      "Leo live authority research failed:",
      error
    );

    return {
      required,
      searched: false,
      verifiedCurrent: false,
      queriedAt,
      evidence:
        "Live authoritative research could not be completed. Do not state changing legal, statutory, regulatory, pensions or health-and-safety facts as verified current facts.",
      sources: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown live authority research error.",
    };
  }
}
