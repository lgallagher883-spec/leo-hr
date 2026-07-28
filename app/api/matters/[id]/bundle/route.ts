import { NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";
import PDFDocument from "pdfkit";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BundleRequestBody = {
  format?: unknown;
  includeTranscript?: unknown;
};

type BundleFormat = "docx" | "pdf";

type MatterRecord = {
  id: number;
  title: string | null;
  subject: string | null;
  description: string | null;
  status: string | null;
  employee_id: number | null;
  matter_type: string | null;
  matter_lead: string | null;
  created_at: string | null;
};

type EmployeeRecord = {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  start_date: string | null;
};

type OrganisationRecord = {
  id: string;
  name: string | null;
  slug: string | null;
};

type BrandSettings = {
  displayName: string;
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
  headerStyle: "standard" | "minimal" | "none";
  footerStyle: "standard" | "compact" | "none";
  documentMode: "leo" | "letterhead" | "plain";
  confidentialityStatement: string;
  defaultSignatoryName: string;
  defaultSignatoryJobTitle: string;
  signatureBlock: string;
  pageNumbers: boolean;
  confidentialWatermark: boolean;
  defaultOutput: "docx" | "pdf";
};

type MatterMessage = {
  role: string | null;
  content: string | null;
  created_at: string | null;
};

type MatterTimelineEvent = {
  event_type: string | null;
  title: string | null;
  description: string | null;
  event_date: string | null;
  created_at: string | null;
  created_by: string | null;
};

type SarRecord = {
  id: number;
  request_title: string | null;
  request_summary: string | null;
  status: string | null;
  assigned_to: string | null;
  request_received_date: string | null;
  response_due_date: string | null;
  extended_due_date: string | null;
  created_at: string | null;
};

type SarDocumentRecord = {
  id: number;
  sar_id: number;
  document_type: string | null;
  title: string | null;
  review_status: string | null;
  file_name: string | null;
  created_at: string | null;
};

type SarTimelineEvent = {
  id: number;
  sar_id: number;
  title: string | null;
  description: string | null;
  event_type: string | null;
  event_date: string | null;
};

type EmployeeDocumentRecord = {
  id: number;
  title: string | null;
  document_type: string | null;
  file_name: string | null;
  notes: string | null;
  created_at: string | null;
};

type MatterDocumentRecord = {
  id: number;
  document_group_id: string;
  version_number: number;
  title: string | null;
  document_type: string | null;
  description: string | null;
  source: string | null;
  status: string | null;
  file_name: string | null;
  content: string | null;
  include_in_bundle: boolean | null;
  created_at: string | null;
};

type PolicyRecord = {
  id: number;
  name: string | null;
  register_type: string | null;
  status: string | null;
};

type AuditLogRecord = {
  id: number;
  action: string | null;
  action_category: string | null;
  description: string | null;
  user_name: string | null;
  created_at: string | null;
  entity_type: string | null;
  entity_id: string | null;
};

type BundleSection = {
  title: string;
  lines: string[];
};

type BundlePayload = {
  bundleReference: string;
  generatedAt: string;
  generatedAtDisplay: string;
  organisationName: string;
  brand: BrandSettings;
  matter: MatterRecord;
  employee: EmployeeRecord | null;
  sections: BundleSection[];
};

const FALLBACK_TEXT = "Not recorded.";

const DEFAULT_CONFIDENTIALITY_STATEMENT =
  "Confidential. This document contains personal information and is intended only for the named recipient.";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readMetadataString(record: Record<string, unknown>, key: string): string {
  return toText(record[key]);
}

function normaliseHexColour(value: unknown, fallback: string): string {
  const text = toText(value).replace(/^#/, "").toUpperCase();
  return /^[0-9A-F]{6}$/.test(text) ? text : fallback;
}

function parseBrandSettings(
  profile: Record<string, unknown> | null,
  organisation: OrganisationRecord | null,
): BrandSettings {
  const metadata = asRecord(profile?.metadata);
  const settings = asRecord(metadata.document_settings);
  const displayName =
    toText(profile?.display_name) ||
    readMetadataString(settings, "trading_name") ||
    toText(organisation?.name) ||
    "Active organisation";

  const headerStyle = readMetadataString(settings, "header_style");
  const footerStyle = readMetadataString(settings, "footer_style");
  const documentMode = readMetadataString(settings, "document_mode");
  const defaultOutput = readMetadataString(settings, "default_output");

  return {
    displayName,
    logoUrl: toText(profile?.logo_url),
    primaryColour: normaliseHexColour(profile?.primary_colour, "6E5084"),
    secondaryColour: normaliseHexColour(profile?.secondary_colour, "CDB2E2"),
    tradingName: readMetadataString(settings, "trading_name"),
    registeredName: readMetadataString(settings, "registered_name"),
    address: readMetadataString(settings, "address"),
    telephone: readMetadataString(settings, "telephone"),
    email: readMetadataString(settings, "email"),
    companyNumber: readMetadataString(settings, "company_number"),
    vatNumber: readMetadataString(settings, "vat_number"),
    headerStyle:
      headerStyle === "minimal" || headerStyle === "none" ? headerStyle : "standard",
    footerStyle:
      footerStyle === "compact" || footerStyle === "none" ? footerStyle : "standard",
    documentMode:
      documentMode === "letterhead" || documentMode === "plain" ? documentMode : "leo",
    confidentialityStatement:
      readMetadataString(settings, "confidentiality_statement") ||
      DEFAULT_CONFIDENTIALITY_STATEMENT,
    defaultSignatoryName: readMetadataString(settings, "default_signatory_name"),
    defaultSignatoryJobTitle: readMetadataString(settings, "default_signatory_job_title"),
    signatureBlock: readMetadataString(settings, "signature_block"),
    pageNumbers: settings.page_numbers !== false,
    confidentialWatermark: settings.confidential_watermark === true,
    defaultOutput: defaultOutput === "pdf" ? "pdf" : "docx",
  };
}

function readMatterId(id: string): number | null {
  const matterId = Number(id);

  return Number.isInteger(matterId) && matterId > 0 ? matterId : null;
}

function readBundleFormat(value: unknown): BundleFormat {
  if (value === "pdf") {
    return "pdf";
  }

  return "docx";
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatReferenceTimestamp(value: Date): string {
  const pad = (number: number) => String(number).padStart(2, "0");

  return [
    value.getUTCFullYear(),
    pad(value.getUTCMonth() + 1),
    pad(value.getUTCDate()),
    "-",
    pad(value.getUTCHours()),
    pad(value.getUTCMinutes()),
    pad(value.getUTCSeconds()),
  ].join("");
}

function fileSafeDate(value: Date): string {
  return value.toISOString().replace(/[:.]/g, "-");
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();

  return lines.filter((line) => {
    const key = line.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sentenceFragments(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((fragment) => fragment.trim())
    .filter(Boolean);
}

function conciseConversationSummary(messages: MatterMessage[]): string[] {
  if (messages.length === 0) {
    return ["No LEO conversation messages are currently recorded."];
  }

  const userMessages = messages.filter((message) => toText(message.role).toLowerCase() === "user");
  const leoMessages = messages.filter((message) => toText(message.role).toLowerCase() === "leo");

  const facts = dedupeLines(
    userMessages
      .flatMap((message) => sentenceFragments(toText(message.content)))
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length >= 20)
      .slice(0, 6),
  );

  const summary: string[] = [
    `Conversation entries: ${messages.length} (${userMessages.length} user, ${leoMessages.length} LEO).`,
    `Most recent message: ${formatDateTime(messages[messages.length - 1]?.created_at ?? null)}.`,
  ];

  if (facts.length > 0) {
    summary.push("Factual points raised in conversation:");

    for (const fact of facts.slice(0, 5)) {
      summary.push(`- ${fact}`);
    }
  } else {
    summary.push("No sufficiently detailed factual statements were detected in conversation messages.");
  }

  return summary;
}

function fullTranscriptLines(messages: MatterMessage[]): string[] {
  if (messages.length === 0) {
    return ["No transcript available."];
  }

  return messages.map((message) => {
    const role = toText(message.role) || "Unknown";
    const timestamp = formatDateTime(message.created_at);
    const content = toText(message.content) || FALLBACK_TEXT;

    return `[${timestamp}] ${role.toUpperCase()}: ${content}`;
  });
}

function timelineLines(events: MatterTimelineEvent[]): string[] {
  if (events.length === 0) {
    return ["No chronology entries are currently recorded on this matter."];
  }

  return events.map((event) => {
    const when = formatDateTime(event.event_date || event.created_at);
    const title = toText(event.title) || "Untitled chronology event";
    const description = toText(event.description);

    if (!description) {
      return `${when} - ${title}`;
    }

    return `${when} - ${title}: ${description}`;
  });
}

function investigationLines(events: MatterTimelineEvent[]): string[] {
  if (events.length === 0) {
    return ["No investigation activity, findings, decisions or outcome have been recorded yet."];
  }

  const keywords = [
    "investig",
    "finding",
    "decision",
    "outcome",
    "hearing",
    "meeting",
    "evidence",
    "disciplinary",
    "grievance",
  ];

  const filtered = events.filter((event) => {
    const combined = `${toText(event.event_type)} ${toText(event.title)} ${toText(event.description)}`.toLowerCase();

    return keywords.some((keyword) => combined.includes(keyword));
  });

  if (filtered.length === 0) {
    return ["No specific investigation/finding/decision/outcome events were identified from chronology text."];
  }

  return timelineLines(filtered);
}

function appealLines(events: MatterTimelineEvent[], sarTimeline: SarTimelineEvent[]): string[] {
  const allItems = [
    ...events.map((event) => ({
      when: event.event_date || event.created_at,
      title: event.title,
      description: event.description,
    })),
    ...sarTimeline.map((event) => ({
      when: event.event_date,
      title: event.title,
      description: event.description,
    })),
  ];

  const matches = allItems.filter((item) => {
    const text = `${toText(item.title)} ${toText(item.description)}`.toLowerCase();

    return text.includes("appeal") || text.includes("review");
  });

  if (matches.length === 0) {
    return ["No appeal information is currently recorded."];
  }

  return matches.map((item) => {
    const when = formatDateTime(item.when ?? null);
    const title = toText(item.title) || "Appeal event";
    const description = toText(item.description);

    return description ? `${when} - ${title}: ${description}` : `${when} - ${title}`;
  });
}

const MATTER_POLICY_KEYWORDS: Record<string, string[]> = {
  redundancy: [
    "redundancy",
    "restructure",
    "restructuring",
    "consultation",
    "selection criteria",
    "suitable alternative employment",
    "lay off",
    "short time working",
    "appeal",
  ],
  grievance: [
    "grievance",
    "dignity at work",
    "bullying",
    "harassment",
    "equality",
    "equal opportunities",
    "complaints",
    "appeal",
  ],
  disciplinary: [
    "disciplinary",
    "conduct",
    "misconduct",
    "gross misconduct",
    "investigation",
    "suspension",
    "appeal",
  ],
  capability: [
    "capability",
    "performance",
    "performance management",
    "poor performance",
    "improvement plan",
    "reasonable adjustments",
    "appeal",
  ],
  absence: [
    "absence",
    "sickness",
    "sick leave",
    "attendance",
    "fit note",
    "occupational health",
    "reasonable adjustments",
    "return to work",
  ],
  flexible_working: [
    "flexible working",
    "flexible work",
    "working pattern",
    "hours of work",
    "hybrid working",
    "remote working",
  ],
  discrimination: [
    "discrimination",
    "equality",
    "equal opportunities",
    "harassment",
    "dignity at work",
    "reasonable adjustments",
  ],
  whistleblowing: [
    "whistleblowing",
    "protected disclosure",
    "speak up",
    "public interest disclosure",
  ],
  safeguarding: [
    "safeguarding",
    "safer recruitment",
    "child protection",
    "adult safeguarding",
    "dbs",
    "allegations",
  ],
};

function normaliseMatterCategory(value: string): string {
  const lowered = value.toLowerCase();

  if (lowered.includes("redundan") || lowered.includes("restructur")) return "redundancy";
  if (lowered.includes("griev")) return "grievance";
  if (lowered.includes("disciplin") || lowered.includes("misconduct")) return "disciplinary";
  if (lowered.includes("capability") || lowered.includes("performance")) return "capability";
  if (lowered.includes("absence") || lowered.includes("sickness") || lowered.includes("attendance")) return "absence";
  if (lowered.includes("flexible")) return "flexible_working";
  if (lowered.includes("discrimin") || lowered.includes("harass")) return "discrimination";
  if (lowered.includes("whistle") || lowered.includes("protected disclosure")) return "whistleblowing";
  if (lowered.includes("safeguard") || lowered.includes("dbs")) return "safeguarding";

  return "";
}

function getRelevantPolicyKeywords(matter: MatterRecord): string[] {
  const matterText = [
    toText(matter.matter_type),
    toText(matter.title),
    toText(matter.subject),
    toText(matter.description),
  ].join(" ");

  const category = normaliseMatterCategory(matterText);

  if (!category) {
    return [];
  }

  return MATTER_POLICY_KEYWORDS[category] ?? [];
}

function containsRelevantKeyword(value: string, keywords: string[]): boolean {
  const lowered = value.toLowerCase();

  return keywords.some((keyword) => lowered.includes(keyword));
}

function policyLines(
  policies: PolicyRecord[],
  searchableText: string,
  relevantKeywords: string[],
): string[] {
  if (policies.length === 0) {
    return ["No policy register records are available for matching."];
  }

  const loweredSearchableText = searchableText.toLowerCase();

  const matchedPolicies = policies.filter((policy) => {
    const policyText = [
      toText(policy.name),
      toText(policy.register_type),
      toText(policy.status),
    ]
      .join(" ")
      .toLowerCase();

    if (!policyText.trim()) {
      return false;
    }

    const explicitlyMentioned =
      Boolean(toText(policy.name)) &&
      loweredSearchableText.includes(toText(policy.name).toLowerCase());

    const matchesMatterType =
      relevantKeywords.length > 0 &&
      relevantKeywords.some((keyword) => policyText.includes(keyword));

    return explicitlyMentioned || matchesMatterType;
  });

  if (matchedPolicies.length === 0) {
    return [
      relevantKeywords.length > 0
        ? "No policies relevant to this matter type were found in the policy register."
        : "No explicit policy references were detected in the matter records.",
    ];
  }

  return matchedPolicies.map((policy) => {
    const name = toText(policy.name) || "Unnamed policy";
    const type = toText(policy.register_type) || "Policy";
    const status = toText(policy.status) || "Unknown status";

    return `${name} (${type}, ${status})`;
  });
}

function filterRelevantEmployeeDocuments(
  documents: EmployeeDocumentRecord[],
  relevantKeywords: string[],
): EmployeeDocumentRecord[] {
  if (relevantKeywords.length === 0) {
    return [];
  }

  return documents.filter((document) => {
    const documentText = [
      toText(document.title),
      toText(document.document_type),
      toText(document.file_name),
      toText(document.notes),
    ].join(" ");

    return containsRelevantKeyword(documentText, relevantKeywords);
  });
}

function employeeBackgroundLines(employee: EmployeeRecord | null): string[] {
  if (!employee) {
    return ["No linked employee record is attached to this matter."];
  }

  return [
    `Employee name: ${toText(employee.name) || FALLBACK_TEXT}`,
    `Role: ${toText(employee.role) || FALLBACK_TEXT}`,
    `Email: ${toText(employee.email) || FALLBACK_TEXT}`,
    `Employment status: ${toText(employee.status) || FALLBACK_TEXT}`,
    `Start date: ${formatDate(employee.start_date)}`,
  ];
}

function buildEvidenceIndex(
  matterDocuments: MatterDocumentRecord[],
  sarDocuments: SarDocumentRecord[],
): string[] {
  const lines: string[] = [];

  for (const document of matterDocuments) {
    lines.push(
      `Matter document #${document.id}: ${toText(document.title) || "Untitled"} (${toText(document.document_type) || "Document"}, version ${document.version_number}, status: ${toText(document.status) || "Unknown"})${toText(document.file_name) ? ` - ${toText(document.file_name)}` : ""}`,
    );
  }

  for (const document of sarDocuments) {
    lines.push(
      `SAR document #${document.id} (SAR #${document.sar_id}): ${toText(document.title) || "Untitled"} (${toText(document.document_type) || "Document"}, review: ${toText(document.review_status) || "Unknown"}) - ${toText(document.file_name) || "No filename"}`,
    );
  }

  if (lines.length === 0) {
    return ["No indexed evidence or documents are currently linked."];
  }

  return lines;
}

function buildMatterDocumentLines(
  matterDocuments: MatterDocumentRecord[],
): string[] {
  const includedDocuments = matterDocuments.filter(
    (document) => document.include_in_bundle !== false,
  );

  if (includedDocuments.length === 0) {
    return ["No Matter documents are currently marked for inclusion in this bundle."];
  }

  return includedDocuments.flatMap((document) => {
    const heading =
      `${toText(document.title) || "Untitled"} ` +
      `(${toText(document.document_type) || "Document"}, ` +
      `version ${document.version_number}, ` +
      `${toText(document.status) || "Unknown status"}, ` +
      `${toText(document.source) || "Unknown source"})`;

    const lines = [heading];

    if (toText(document.description)) {
      lines.push(`Description: ${toText(document.description)}`);
    }

    if (toText(document.file_name)) {
      lines.push(`File: ${toText(document.file_name)}`);
    }

    if (toText(document.content)) {
      lines.push(`Content: ${toText(document.content)}`);
    }

    lines.push(`Created: ${formatDateTime(document.created_at)}`);

    return lines;
  });
}

function sarLines(sars: SarRecord[], sarTimeline: SarTimelineEvent[], sarDocuments: SarDocumentRecord[]): string[] {
  if (sars.length === 0) {
    return ["No SAR requests are currently linked to this matter."];
  }

  const lines: string[] = [];

  for (const sar of sars) {
    const deadline = sar.extended_due_date || sar.response_due_date;

    lines.push(
      `SAR #${sar.id}: ${toText(sar.request_title) || "Subject Access Request"} | status: ${toText(sar.status) || "Unknown"} | received: ${formatDate(sar.request_received_date)} | deadline: ${formatDate(deadline)} | owner: ${toText(sar.assigned_to) || "Unassigned"}`,
    );

    const relatedTimeline = sarTimeline.filter((event) => event.sar_id === sar.id).slice(0, 5);

    for (const timelineEvent of relatedTimeline) {
      lines.push(
        `  - Record: ${formatDateTime(timelineEvent.event_date)} - ${toText(timelineEvent.title) || "Timeline event"}${toText(timelineEvent.description) ? `: ${toText(timelineEvent.description)}` : ""}`,
      );
    }

    const relatedDocuments = sarDocuments.filter((document) => document.sar_id === sar.id);

    for (const document of relatedDocuments) {
      lines.push(
        `  - Document: ${toText(document.title) || "Untitled"} (${toText(document.document_type) || "Document"}, review: ${toText(document.review_status) || "Unknown"})`,
      );
    }
  }

  return lines;
}

function auditLines(logs: AuditLogRecord[]): string[] {
  if (logs.length === 0) {
    return ["No audit history entries were found for this matter and linked SAR records."];
  }

  return logs.map((log) => {
    const when = formatDateTime(log.created_at);
    const action = toText(log.action) || "Action";
    const actor = toText(log.user_name) || "Unknown user";
    const description = toText(log.description);

    if (description) {
      return `${when} - ${action} by ${actor}: ${description}`;
    }

    return `${when} - ${action} by ${actor}`;
  });
}

function buildSections(args: {
  bundleReference: string;
  generatedAtDisplay: string;
  matter: MatterRecord;
  organisation: OrganisationRecord | null;
  employee: EmployeeRecord | null;
  messages: MatterMessage[];
  timeline: MatterTimelineEvent[];
  sars: SarRecord[];
  sarTimeline: SarTimelineEvent[];
  sarDocuments: SarDocumentRecord[];
  employeeDocuments: EmployeeDocumentRecord[];
  matterDocuments: MatterDocumentRecord[];
  matchedPolicies: string[];
  auditHistory: AuditLogRecord[];
  includeTranscript: boolean;
}): BundleSection[] {
  const {
    bundleReference,
    generatedAtDisplay,
    matter,
    organisation,
    employee,
    messages,
    timeline,
    sars,
    sarTimeline,
    sarDocuments,
    employeeDocuments,
    matterDocuments,
    matchedPolicies,
    auditHistory,
    includeTranscript,
  } = args;

  const chronology = timelineLines(timeline);

  const searchableText = [
    toText(matter.title),
    toText(matter.subject),
    toText(matter.description),
    ...messages.map((message) => toText(message.content)),
    ...timeline.map((event) => `${toText(event.title)} ${toText(event.description)}`),
    ...sars.map((sar) => `${toText(sar.request_title)} ${toText(sar.request_summary)}`),
    ...matterDocuments.map(
      (document) =>
        `${toText(document.title)} ${toText(document.document_type)} ${toText(document.description)} ${toText(document.content)}`,
    ),
  ].join("\n");

  const sections: BundleSection[] = [
    {
      title: "Cover Page and Bundle Reference",
      lines: [
        `Bundle reference: ${bundleReference}`,
        `Matter ID: ${matter.id}`,
        `Matter title: ${toText(matter.title) || FALLBACK_TEXT}`,
        `Organisation: ${toText(organisation?.name) || "Active organisation"}`,
        `Generation date and time: ${generatedAtDisplay}`,
      ],
    },
    {
      title: "Case Background",
      lines: [
        `Subject: ${toText(matter.subject) || toText(matter.title) || FALLBACK_TEXT}`,
        `Matter type: ${toText(matter.matter_type) || FALLBACK_TEXT}`,
        `Matter lead: ${toText(matter.matter_lead) || FALLBACK_TEXT}`,
        `Opened: ${formatDateTime(matter.created_at)}`,
        `Current status: ${toText(matter.status) || FALLBACK_TEXT}`,
        `Background narrative: ${toText(matter.description) || FALLBACK_TEXT}`,
      ],
    },
    {
      title: "Employment Background",
      lines: employeeBackgroundLines(employee),
    },
    {
      title: "Matter Overview and Key Issues",
      lines: [
        `Overview: ${toText(matter.description) || toText(matter.subject) || toText(matter.title) || FALLBACK_TEXT}`,
        `Key issues identified from chronology and conversation:`,
        ...dedupeLines(
          [
            ...timeline
              .map((event) => toText(event.title) || toText(event.description))
              .filter(Boolean)
              .slice(0, 8),
            ...messages
              .filter((message) => toText(message.role).toLowerCase() === "user")
              .map((message) => sentenceFragments(toText(message.content))[0] || "")
              .filter(Boolean)
              .slice(0, 6),
          ]
            .map((line) => (line.length > 220 ? `${line.slice(0, 217)}...` : line))
            .slice(0, 8),
        ).map((line) => `- ${line}`),
      ],
    },
    {
      title: "Factual LEO-Generated Summary",
      lines: conciseConversationSummary(messages),
    },
    {
      title: "Chronology",
      lines: chronology,
    },
    {
      title: "Investigation Activity, Findings, Decisions and Outcome",
      lines: investigationLines(timeline),
    },
    {
      title: "Evidence/Document Index",
      lines: buildEvidenceIndex(matterDocuments, sarDocuments),
    },
    {
      title: "Matter Documents and Correspondence",
      lines: buildMatterDocumentLines(matterDocuments),
    },
    {
      title: "Policies Relied Upon",
      lines: matchedPolicies,
    },
    {
      title: "SAR Requests Linked to the Matter, including Relevant Records and Documents",
      lines: sarLines(sars, sarTimeline, sarDocuments),
    },
    {
      title: "Appeal Information",
      lines: appealLines(timeline, sarTimeline),
    },
    {
      title: "Audit History",
      lines: auditLines(auditHistory),
    },
    {
      title: "Bundle Integrity Statement",
      lines: [
        "This bundle was generated from the live records available in LEO at generation time.",
        "Generation created a read-only export and did not change, close or update the matter record.",
        `Bundle reference: ${bundleReference}`,
        `Generated on: ${generatedAtDisplay}`,
      ],
    },
  ];

  if (includeTranscript) {
    sections.push({
      title: "Appendix: Complete LEO Conversation Transcript",
      lines: fullTranscriptLines(messages),
    });
  }

  return sections;
}

async function requirePermission(permissionKey: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const { data: organisationId, error: organisationError } = await supabase.rpc(
    "leo_current_organisation_id",
  );

  if (organisationError || !organisationId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    console.error("Matter bundle permission could not be checked:", permissionError);

    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to generate Matter Bundles could not be verified.",
        },
        { status: 500 },
      ),
    };
  }

  if (!allowed) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have permission to generate Matter Bundles.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    supabase,
    organisationId: String(organisationId),
    user,
  };
}

async function getMatterScopedToOrganisation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  _organisationId: string,
  matterId: number,
): Promise<MatterRecord | null> {
  const matterSelect =
    "id,title,subject,description,status,employee_id,matter_type,matter_lead,created_at";

  // The matters table has no organisation_id column.
  // Organisation access is enforced by the existing Supabase RLS policies
  // for the authenticated user, matching how the normal Matter page loads.
  const { data, error } = await supabase
    .from("matters")
    .select(matterSelect)
    .eq("id", matterId)
    .maybeSingle();

  if (error) {
    console.error("Matter Bundle matter lookup failed:", error);
    throw new Error(
      error.message || "The matter record could not be loaded for export.",
    );
  }

  return (data as MatterRecord | null) ?? null;
}

async function buildBundlePayload(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
  matterId: number;
  includeTranscript: boolean;
}): Promise<BundlePayload | null> {
  const { supabase, organisationId, matterId, includeTranscript } = args;

  const matter = await getMatterScopedToOrganisation(supabase, organisationId, matterId);

  if (!matter) {
    return null;
  }

  const [
    { data: organisationData },
    brandProfileResult,
    employeeResult,
    messagesResult,
    timelineResult,
    sarResult,
    policyResult,
    matterDocumentsResult,
  ] = await Promise.all([
      supabase
        .from("organisations")
        .select("id,name,slug")
        .eq("id", organisationId)
        .maybeSingle(),
      supabase
        .from("organisation_public_profiles")
        .select("display_name,logo_url,primary_colour,secondary_colour,metadata")
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      matter.employee_id
        ? supabase
            .from("employees")
            .select("id,name,email,role,status,start_date")
            .eq("id", matter.employee_id)
            .eq("organisation_id", organisationId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("matter_messages")
        .select("role,content,created_at")
        .eq("matter_id", matter.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("matter_timeline")
        .select("event_type,title,description,event_date,created_at,created_by")
        .eq("matter_id", matter.id)
        .order("event_date", { ascending: true }),
      supabase
        .from("employee_sars")
        .select(
          "id,request_title,request_summary,status,assigned_to,request_received_date,response_due_date,extended_due_date,created_at",
        )
        .eq("matter_id", matter.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("policy_register")
        .select("id,name,register_type,status")
        .eq("is_archived", false)
        .order("name", { ascending: true }),
      supabase
        .from("matter_documents")
        .select(
          "id,document_group_id,version_number,title,document_type,description,source,status,file_name,content,include_in_bundle,created_at",
        )
        .eq("matter_id", matter.id)
        .order("created_at", { ascending: true })
        .order("version_number", { ascending: true }),
    ]);

  if (brandProfileResult.error) {
    console.error("Brand settings query for Matter Bundle failed:", brandProfileResult.error);
  }

  if (employeeResult.error) {
    console.error("Employee query for Matter Bundle failed:", employeeResult.error);
  }

  if (messagesResult.error) {
    console.error("Matter messages query for Matter Bundle failed:", messagesResult.error);
  }

  if (timelineResult.error) {
    console.error("Matter timeline query for Matter Bundle failed:", timelineResult.error);
  }

  if (sarResult.error) {
    console.error("SAR query for Matter Bundle failed:", sarResult.error);
  }

  if (policyResult.error) {
    console.error("Policy query for Matter Bundle failed:", policyResult.error);
  }

  if (matterDocumentsResult.error) {
    console.error(
      "Matter documents query for Matter Bundle failed:",
      matterDocumentsResult.error,
    );
  }

  const messages = (messagesResult.data ?? []) as MatterMessage[];
  const timeline = (timelineResult.data ?? []) as MatterTimelineEvent[];
  const sars = (sarResult.data ?? []) as SarRecord[];
  const matterDocuments = (matterDocumentsResult.data ?? []) as MatterDocumentRecord[];

  const sarIds = sars.map((sar) => sar.id);

  const [sarDocumentsResult, sarTimelineResult] = await Promise.all([
    sarIds.length > 0
      ? supabase
          .from("employee_sar_documents")
          .select("id,sar_id,document_type,title,review_status,file_name,created_at")
          .in("sar_id", sarIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    sarIds.length > 0
      ? supabase
          .from("employee_sar_timeline")
          .select("id,sar_id,title,description,event_type,event_date")
          .in("sar_id", sarIds)
          .order("event_date", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (sarDocumentsResult.error) {
    console.error("SAR document query for Matter Bundle failed:", sarDocumentsResult.error);
  }

  if (sarTimelineResult.error) {
    console.error("SAR timeline query for Matter Bundle failed:", sarTimelineResult.error);
  }

  const employeeDocumentsResult = matter.employee_id
    ? await supabase
        .from("employee_documents")
        .select("id,title,document_type,file_name,notes,created_at")
        .eq("employee_id", matter.employee_id)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (employeeDocumentsResult.error) {
    console.error("Employee documents query for Matter Bundle failed:", employeeDocumentsResult.error);
  }

  const [entityAuditResult, sarAuditResult] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id,action,action_category,description,user_name,created_at,entity_type,entity_id")
      .eq("organisation_id", organisationId)
      .eq("entity_type", "Matter")
      .eq("entity_id", String(matter.id))
      .order("created_at", { ascending: true }),
    sarIds.length > 0
      ? supabase
          .from("audit_logs")
          .select("id,action,action_category,description,user_name,created_at,entity_type,entity_id")
          .eq("organisation_id", organisationId)
          .in("entity_type", ["SAR", "SAR Document"])
          .in(
            "entity_id",
            sarIds.map((id) => String(id)),
          )
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (entityAuditResult.error) {
    console.error("Matter audit history query failed:", entityAuditResult.error);
  }

  if (sarAuditResult.error) {
    console.error("SAR audit history query failed:", sarAuditResult.error);
  }

  const allAuditLogs = dedupeAuditLogs([
    ...((entityAuditResult.data ?? []) as AuditLogRecord[]),
    ...((sarAuditResult.data ?? []) as AuditLogRecord[]),
  ]);

  const policyCandidates = (policyResult.data ?? []) as PolicyRecord[];

  const searchableText = [
    toText(matter.title),
    toText(matter.subject),
    toText(matter.description),
    ...messages.map((message) => toText(message.content)),
    ...timeline.map((event) => `${toText(event.title)} ${toText(event.description)}`),
    ...sars.map((sar) => `${toText(sar.request_title)} ${toText(sar.request_summary)}`),
  ].join("\n");

  const relevantPolicyKeywords = getRelevantPolicyKeywords(matter);
  const matchedPolicies = policyLines(
    policyCandidates,
    searchableText,
    relevantPolicyKeywords,
  );
  const relevantEmployeeDocuments = filterRelevantEmployeeDocuments(
    (employeeDocumentsResult.data ?? []) as EmployeeDocumentRecord[],
    relevantPolicyKeywords,
  );

  const generationDate = new Date();
  const generatedAt = generationDate.toISOString();
  const generatedAtDisplay = formatDateTime(generatedAt);
  const bundleReference = `MB-${matter.id}-${formatReferenceTimestamp(generationDate)}`;

  const organisation = (organisationData as OrganisationRecord | null) ?? null;
  const brand = parseBrandSettings(
    (brandProfileResult.data as Record<string, unknown> | null) ?? null,
    organisation,
  );

  const sections = buildSections({
    bundleReference,
    generatedAtDisplay,
    matter,
    organisation,
    employee: (employeeResult.data as EmployeeRecord | null) ?? null,
    messages,
    timeline,
    sars,
    sarTimeline: (sarTimelineResult.data ?? []) as SarTimelineEvent[],
    sarDocuments: (sarDocumentsResult.data ?? []) as SarDocumentRecord[],
    employeeDocuments: relevantEmployeeDocuments,
    matterDocuments,
    matchedPolicies,
    auditHistory: allAuditLogs,
    includeTranscript,
  });

  return {
    bundleReference,
    generatedAt,
    generatedAtDisplay,
    organisationName: brand.displayName,
    brand,
    matter,
    employee: (employeeResult.data as EmployeeRecord | null) ?? null,
    sections,
  };
}

function dedupeAuditLogs(logs: AuditLogRecord[]): AuditLogRecord[] {
  const seen = new Set<string>();

  return logs.filter((log) => {
    const key = `${log.id}|${toText(log.created_at)}|${toText(log.action)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}


async function loadBrandImage(url: string): Promise<{ data: Buffer; type: "png" | "jpg" } | null> {
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    const type: "png" | "jpg" =
      contentType.includes("png") || url.toLowerCase().includes(".png") ? "png" : "jpg";

    return { data: Buffer.from(await response.arrayBuffer()), type };
  } catch (error) {
    console.warn("Organisation logo could not be loaded for the Matter Bundle:", error);
    return null;
  }
}

async function buildDocx(payload: BundlePayload): Promise<Buffer> {
  const { brand } = payload;
  const logo = await loadBrandImage(brand.logoUrl);
  const titleColour = brand.documentMode === "plain" ? "000000" : brand.primaryColour;

  const children: Paragraph[] = [];

  if (logo) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logo.data,
            type: logo.type,
            transformation: { width: 140, height: 70 },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Matter Bundle",
          bold: true,
          size: 42,
          color: titleColour,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: payload.organisationName,
          bold: true,
          size: 26,
          color: titleColour,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: `Bundle reference: ${payload.bundleReference}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      text: `Generated: ${payload.generatedAtDisplay}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
    }),
  );

  if (brand.confidentialWatermark) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "CONFIDENTIAL",
            bold: true,
            color: brand.secondaryColour,
            size: 30,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
      }),
    );
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  for (const section of payload.sections) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 28,
            color: titleColour,
          }),
        ],
        spacing: { before: 200, after: 120 },
      }),
    );

    for (const line of section.lines) {
      children.push(
        line.startsWith("- ")
          ? new Paragraph({
              text: line.slice(2),
              bullet: { level: 0 },
              spacing: { after: 80 },
            })
          : new Paragraph({ text: line, spacing: { after: 80 } }),
      );
    }
  }

  if (brand.signatureBlock || brand.defaultSignatoryName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Authorised signatory", bold: true, color: titleColour }),
        ],
        spacing: { before: 260, after: 100 },
      }),
      new Paragraph({
        text: brand.signatureBlock || brand.defaultSignatoryName,
        spacing: { after: 60 },
      }),
    );

    if (brand.defaultSignatoryName && brand.signatureBlock) {
      children.push(new Paragraph({ text: brand.defaultSignatoryName, spacing: { after: 40 } }));
    }

    if (brand.defaultSignatoryJobTitle) {
      children.push(new Paragraph({ text: brand.defaultSignatoryJobTitle, spacing: { after: 80 } }));
    }
  }

  const headerChildren: Paragraph[] = [];
  if (brand.headerStyle !== "none") {
    headerChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: brand.headerStyle === "minimal" ? payload.organisationName : `${payload.organisationName} | Matter Bundle`,
            bold: true,
            color: titleColour,
            size: 18,
          }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    );
  }

  const footerChildren: Paragraph[] = [];
  if (brand.footerStyle !== "none") {
    const identityParts = brand.footerStyle === "compact"
      ? [payload.organisationName, brand.companyNumber ? `Company ${brand.companyNumber}` : ""].filter(Boolean)
      : [
          payload.organisationName,
          brand.address,
          brand.telephone,
          brand.email,
          brand.companyNumber ? `Company ${brand.companyNumber}` : "",
          brand.vatNumber ? `VAT ${brand.vatNumber}` : "",
        ].filter(Boolean);

    footerChildren.push(
      new Paragraph({
        text: identityParts.join(" | "),
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 40 },
      }),
      new Paragraph({
        text: brand.confidentialityStatement,
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
    );

    if (brand.pageNumbers) {
      footerChildren.push(
        new Paragraph({
          children: [new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] })],
          alignment: AlignmentType.CENTER,
        }),
      );
    }
  }

  const document = new Document({
    sections: [
      {
        properties: {},
        headers: headerChildren.length
          ? { default: new Header({ children: headerChildren }) }
          : undefined,
        footers: footerChildren.length
          ? { default: new Footer({ children: footerChildren }) }
          : undefined,
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

async function buildPdf(payload: BundlePayload): Promise<Buffer> {
  const { brand } = payload;
  const logo = await loadBrandImage(brand.logoUrl);
  const pdf = new PDFDocument({ margin: 50, size: "A4", autoFirstPage: true });
  const chunks: Buffer[] = [];

  pdf.on("data", (chunk) => chunks.push(chunk as Buffer));

  const primary = `#${brand.documentMode === "plain" ? "000000" : brand.primaryColour}`;
  const secondary = `#${brand.secondaryColour}`;

  const drawHeaderAndFooter = () => {
    const pageBottom = pdf.page.height - 35;

    if (brand.headerStyle !== "none") {
      pdf.save();
      pdf.fillColor(primary).fontSize(8).text(
        brand.headerStyle === "minimal"
          ? payload.organisationName
          : `${payload.organisationName} | Matter Bundle`,
        50,
        24,
        { align: "right", width: pdf.page.width - 100 },
      );
      pdf.restore();
    }

    if (brand.footerStyle !== "none") {
      const identityParts = brand.footerStyle === "compact"
        ? [payload.organisationName, brand.companyNumber ? `Company ${brand.companyNumber}` : ""].filter(Boolean)
        : [payload.organisationName, brand.address, brand.telephone, brand.email].filter(Boolean);

      pdf.save();
      pdf.fillColor("#444444").fontSize(7).text(identityParts.join(" | "), 50, pageBottom - 22, {
        align: "center",
        width: pdf.page.width - 100,
      });
      pdf.text(brand.confidentialityStatement, 50, pageBottom - 10, {
        align: "center",
        width: pdf.page.width - 100,
      });
      if (brand.pageNumbers) {
        pdf.text(`Page ${pageIndex}`, 50, pageBottom + 2, {
          align: "center",
          width: pdf.page.width - 100,
        });
      }
      pdf.restore();
    }
  };

  let pageIndex = 1;

  pdf.on("pageAdded", () => {
    pageIndex += 1;
    drawHeaderAndFooter();
  });

  drawHeaderAndFooter();

  if (logo) {
    try {
      pdf.image(logo.data, { fit: [140, 70], align: "center" });
      pdf.moveDown(0.5);
    } catch (error) {
      console.warn("Organisation logo could not be drawn in the PDF Matter Bundle:", error);
    }
  }

  pdf.fillColor(primary).fontSize(22).text("Matter Bundle", { align: "center" });
  pdf.moveDown(0.5);
  pdf.fontSize(12).text(payload.organisationName, { align: "center" });
  pdf.moveDown(0.4);
  pdf.fillColor("#000000").fontSize(11).text(`Bundle reference: ${payload.bundleReference}`, { align: "center" });
  pdf.moveDown(0.2);
  pdf.text(`Generated: ${payload.generatedAtDisplay}`, { align: "center" });

  if (brand.confidentialWatermark) {
    pdf.moveDown(1);
    pdf.fillColor(secondary).fontSize(18).text("CONFIDENTIAL", { align: "center" });
  }

  for (const section of payload.sections) {
    pdf.addPage();
    pdf.fillColor(primary).fontSize(16).text(section.title);
    pdf.moveDown(0.6);

    for (const line of section.lines) {
      pdf.fillColor("#000000").fontSize(10.5).text(
        line.startsWith("- ") ? `- ${line.slice(2)}` : line,
        line.startsWith("- ") ? { indent: 18, paragraphGap: 5 } : { paragraphGap: 5 },
      );
    }
  }

  if (brand.signatureBlock || brand.defaultSignatoryName) {
    pdf.moveDown(1.2);
    pdf.fillColor(primary).fontSize(11).text("Authorised signatory");
    pdf.fillColor("#000000").fontSize(10.5).text(brand.signatureBlock || brand.defaultSignatoryName);
    if (brand.defaultSignatoryName && brand.signatureBlock) pdf.text(brand.defaultSignatoryName);
    if (brand.defaultSignatoryJobTitle) pdf.text(brand.defaultSignatoryJobTitle);
  }

  pdf.end();

  return new Promise((resolve, reject) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });
}

async function writeBundleAuditEvent(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organisationId: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  payload: BundlePayload;
  format: BundleFormat;
  includeTranscript: boolean;
}): Promise<void> {
  const { supabase, organisationId, user, payload, format, includeTranscript } = args;

  const fullName = toText(user.user_metadata?.full_name);
  const displayName = toText(user.user_metadata?.name);
  const userName = fullName || displayName || user.email || "System user";

  const { error } = await supabase.from("audit_logs").insert({
    organisation_id: organisationId,
    user_id: user.id,
    user_name: userName,
    user_email: user.email || null,
    action: "Matter bundle generated",
    action_category: "Matter",
    entity_type: "Matter",
    entity_id: String(payload.matter.id),
    entity_name: toText(payload.matter.subject) || toText(payload.matter.title) || `Matter ${payload.matter.id}`,
    description: `Matter bundle generated in ${format.toUpperCase()} format${includeTranscript ? " with" : " without"} transcript appendix.`,
    metadata: {
      bundle_reference: payload.bundleReference,
      generated_at: payload.generatedAt,
      format,
      include_transcript: includeTranscript,
    },
    source_page: `/dashboard/matters/${payload.matter.id}`,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("Matter bundle audit event was not written:", error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json(
      {
        success: false,
        error: "The matter reference is invalid.",
      },
      { status: 400 },
    );
  }

  let body: BundleRequestBody;

  try {
    body = (await request.json()) as BundleRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "The bundle request body could not be read.",
      },
      { status: 400 },
    );
  }

  const format = readBundleFormat(body.format);
  const includeTranscript = readBoolean(body.includeTranscript);

  const access = await requirePermission("matters.view");

  if (access.response) {
    return access.response;
  }

  const { supabase, organisationId, user } = access;

  try {
    const payload = await buildBundlePayload({
      supabase,
      organisationId,
      matterId,
      includeTranscript,
    });

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "The matter could not be found or is outside your organisation scope.",
        },
        { status: 404 },
      );
    }

    const now = new Date();
    const fileStem = `matter-${payload.matter.id}-bundle-${fileSafeDate(now)}`;

    let bytes: Buffer;
    let contentType: string;
    let extension: "docx" | "pdf";

    if (format === "pdf") {
      bytes = await buildPdf(payload);
      contentType = "application/pdf";
      extension = "pdf";
    } else {
      bytes = await buildDocx(payload);
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      extension = "docx";
    }

    await writeBundleAuditEvent({
      supabase,
      organisationId,
      user,
      payload,
      format,
      includeTranscript,
    });

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=\"${fileStem}.${extension}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Matter bundle could not be generated:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The matter bundle could not be generated.",
      },
      { status: 500 },
    );
  }
}