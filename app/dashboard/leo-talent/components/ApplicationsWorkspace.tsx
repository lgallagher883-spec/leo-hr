"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { supabase } from "@/lib/supabase";
import TalentIntelligencePanel from "./shared/TalentIntelligencePanel";

type ApplicationStatus =
  | "draft"
  | "submitted"
  | "active"
  | "on_hold"
  | "withdrawn"
  | "rejected"
  | "unsuccessful"
  | "offered"
  | "appointed"
  | "archived";

type ApplicationRecommendation =
  | "strong_proceed"
  | "proceed"
  | "hold"
  | "do_not_proceed"
  | "manual_review_required";

type RegisterFilter =
  | "current"
  | "new"
  | "screening"
  | "review"
  | "interview"
  | "checks"
  | "offer"
  | "closed"
  | "archived"
  | "all";

type CandidateSummary = {
  id: string;
  candidate_reference: string;
  first_name: string;
  middle_names: string | null;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  is_internal_candidate: boolean;
  existing_employee_id: number | null;
  archived_at: string | null;
};

type VacancySummary = {
  id: string;
  organisation_id: string | null;
  vacancy_reference: string;
  title: string;
  department: string | null;
  location_name: string | null;
  status: string;
  closing_date: string | null;
  blind_review_enabled: boolean;
  ai_screening_enabled: boolean;
  safer_recruitment_required: boolean;
  requires_dbs: boolean;
  dbs_level: string | null;
  required_reference_count: number;
  overseas_check_required_if_applicable: boolean;
};

type TalentApplication = {
  id: string;
  organisation_id: string | null;
  application_reference: string;
  vacancy_id: string;
  candidate_id: string;
  current_stage_key: string;
  status: ApplicationStatus;
  source: string | null;
  submitted_at: string | null;
  last_reviewed_at: string | null;
  last_reviewed_by: string | null;
  blind_review_enabled: boolean;
  ai_screening_enabled: boolean;
  manual_score: number | null;
  ai_score: number | null;
  combined_score: number | null;
  recommendation: ApplicationRecommendation | null;
  recommendation_reason: string | null;
  knockout_failed: boolean;
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
  closed_at: string | null;
  closed_reason: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archive_reason: string | null;
  candidate: CandidateSummary | null;
  vacancy: VacancySummary | null;
};

type PipelineStage = {
  id: string;
  stage_key: string;
  stage_name: string;
  description: string | null;
  stage_group:
    | "application"
    | "interview"
    | "offer"
    | "appointment"
    | "closed";
  display_order: number;
  is_active: boolean;
};

type EditingApplication = {
  id: string;
  stage: string;
  status: ApplicationStatus;
};



type VacancyOption = VacancySummary;

type UploadDocument = {
  type: "cv" | "cover_letter" | "application_form" | "portfolio";
  file: File | null;
};

type UploadForm = {
  vacancyId: string;
  source: string;
  sourceDetail: string;
  firstName: string;
  middleNames: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  isInternalCandidate: boolean;
};

type IndeedRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  appliedAt: string;
  raw: Record<string, string>;
  selected: boolean;
  issue: string | null;
};

type ImportProvider = {
  key: string;
  name: string;
  description: string;
  available: boolean;
};

type SupabaseApplicationRow = Omit<
  TalentApplication,
  "candidate" | "vacancy"
> & {
  candidate:
    | CandidateSummary
    | CandidateSummary[]
    | null;
  vacancy:
    | VacancySummary
    | VacancySummary[]
    | null;
};



const importProviders: ImportProvider[] = [
  { key: "indeed", name: "Indeed", description: "Import candidates from an Indeed CSV export.", available: true },
  { key: "linkedin", name: "LinkedIn", description: "Direct LinkedIn application import.", available: false },
  { key: "reed", name: "Reed", description: "Import applications received through Reed.", available: false },
  { key: "totaljobs", name: "Totaljobs", description: "Import applications received through Totaljobs.", available: false },
  { key: "website", name: "Employer website", description: "Connect an employer-hosted application form.", available: false },
  { key: "email", name: "Email inbox", description: "Import applications from a recruitment mailbox.", available: false },
  { key: "agency", name: "Recruitment agency", description: "Receive structured agency submissions.", available: false },
  { key: "spreadsheet", name: "CSV / Excel", description: "Import a general application spreadsheet.", available: false },
  { key: "other", name: "Other source", description: "Configure another application source.", available: false },
];

const emptyUploadForm: UploadForm = {
  vacancyId: "",
  source: "email",
  sourceDetail: "",
  firstName: "",
  middleNames: "",
  lastName: "",
  preferredName: "",
  email: "",
  phone: "",
  isInternalCandidate: false,
};

const filterOptions: Array<{
  value: RegisterFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "current", label: "Current" },
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "review", label: "Manager Review" },
  { value: "interview", label: "Interview" },
  { value: "checks", label: "Pre-emp Checks" },
  { value: "offer", label: "Offers" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const fallbackStages: PipelineStage[] = [
  {
    id: "new",
    stage_key: "new",
    stage_name: "New",
    description: "Application received and awaiting first review.",
    stage_group: "application",
    display_order: 10,
    is_active: true,
  },
  {
    id: "screening",
    stage_key: "screening",
    stage_name: "Screening",
    description: "Initial eligibility and application screening.",
    stage_group: "application",
    display_order: 20,
    is_active: true,
  },
  {
    id: "review",
    stage_key: "review",
    stage_name: "Manager Review",
    description: "Manual, blind or panel review in progress.",
    stage_group: "application",
    display_order: 30,
    is_active: true,
  },
  {
    id: "interview_1",
    stage_key: "interview_1",
    stage_name: "First Interview",
    description: "Candidate progressing through the first interview.",
    stage_group: "interview",
    display_order: 40,
    is_active: true,
  },
  {
    id: "interview_2",
    stage_key: "interview_2",
    stage_name: "Further Interview",
    description: "Candidate progressing through a further interview.",
    stage_group: "interview",
    display_order: 50,
    is_active: true,
  },
  {
    id: "checks",
stage_key: "checks",
stage_name: "Pre-emp Checks",
description: "Due diligence and pre-emp checks.",
stage_group: "offer",
display_order: 60,
is_active: true,
  },
  {
    id: "offer",
    stage_key: "offer",
    stage_name: "Offers",
    description: "Offer preparation or candidate response.",
    stage_group: "offer",
    display_order: 70,
    is_active: true,
  },
  {
    id: "appointed",
    stage_key: "appointed",
    stage_name: "Appointed",
    description: "Offer accepted and appointment underway.",
    stage_group: "appointment",
    display_order: 80,
    is_active: true,
  },
  {
    id: "unsuccessful",
    stage_key: "unsuccessful",
    stage_name: "Unsuccessful",
    description: "Application closed as unsuccessful.",
    stage_group: "closed",
    display_order: 90,
    is_active: true,
  },
  {
    id: "withdrawn",
    stage_key: "withdrawn",
    stage_name: "Withdrawn",
    description: "Candidate withdrew their application.",
    stage_group: "closed",
    display_order: 100,
    is_active: true,
  },
];

const editableStatuses: ApplicationStatus[] = [
  "draft",
  "submitted",
  "active",
  "on_hold",
  "withdrawn",
  "rejected",
  "unsuccessful",
  "offered",
  "appointed",
];

const closedStatuses: ApplicationStatus[] = [
  "withdrawn",
  "rejected",
  "unsuccessful",
  "appointed",
];

const styles: Record<string, CSSProperties> = {
  workspace: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
  },
  headingGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    maxWidth: "780px",
  },
  eyebrow: {
    margin: 0,
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#302536",
    fontSize: "28px",
    lineHeight: 1.2,
    fontWeight: 780,
  },
  description: {
    margin: 0,
    color: "#716676",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "1px solid #6E5084",
    borderRadius: "12px",
    background: "#6E5084",
    color: "#FFFFFF",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #DCCFE5",
    borderRadius: "12px",
    background: "#FFFFFF",
    color: "#594861",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #E4CBD2",
    borderRadius: "10px",
    background: "#FFF9FA",
    color: "#865161",
    padding: "8px 11px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  textButton: {
    border: 0,
    background: "transparent",
    color: "#6E5084",
    padding: 0,
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
  },
  metrics: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(165px, 1fr))",
    gap: "14px",
  },
  metricCard: {
    border: "1px solid #E7DDED",
    borderRadius: "18px",
    background: "#FFFFFF",
    padding: "17px",
    boxShadow: "0 8px 24px rgba(70, 48, 82, 0.05)",
  },
  metricLabel: {
    margin: 0,
    color: "#766B7B",
    fontSize: "12px",
    lineHeight: 1.4,
    fontWeight: 700,
  },
  metricValue: {
    margin: "8px 0 0",
    color: "#6E5084",
    fontSize: "29px",
    lineHeight: 1,
    fontWeight: 800,
  },
  panel: {
    border: "1px solid #E7DDED",
    borderRadius: "18px",
    background: "#FFFFFF",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(70, 48, 82, 0.05)",
  },
  panelHeader: {
    padding: "18px",
    borderBottom: "1px solid #EEE6F2",
  },
  panelTitle: {
    margin: 0,
    color: "#3C3042",
    fontSize: "16px",
    fontWeight: 780,
  },
  panelText: {
    margin: "5px 0 0",
    color: "#796E7E",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  pipelineGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "10px",
    padding: "16px",
  },
  pipelineCard: {
    border: "1px solid #EAE1EF",
    borderRadius: "14px",
    background: "#FBF8FD",
    padding: "13px",
  },
  pipelineName: {
    margin: 0,
    color: "#65566C",
    fontSize: "12px",
    fontWeight: 700,
  },
  pipelineCount: {
    margin: "7px 0 0",
    color: "#6E5084",
    fontSize: "22px",
    fontWeight: 800,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    padding: "18px",
    borderBottom: "1px solid #EEE6F2",
  },
  searchInput: {
    flex: "1 1 300px",
    minWidth: "220px",
    border: "1px solid #DCCFE5",
    borderRadius: "12px",
    background: "#FBF8FD",
    color: "#302536",
    padding: "11px 13px",
    fontSize: "14px",
    outline: "none",
  },
  filters: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexWrap: "wrap",
  },
  filterButton: {
    border: "1px solid #DED2E7",
    borderRadius: "999px",
    background: "#FFFFFF",
    color: "#695B70",
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  activeFilterButton: {
    border: "1px solid #6E5084",
    borderRadius: "999px",
    background: "#F1EAF6",
    color: "#6E5084",
    padding: "7px 11px",
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "1260px",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 14px",
    background: "#FAF7FC",
    color: "#6C6171",
    fontSize: "11px",
    fontWeight: 800,
    textAlign: "left",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: "1px solid #EEE6F2",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px",
    color: "#493D4F",
    fontSize: "13px",
    verticalAlign: "top",
    borderBottom: "1px solid #F0EAF3",
  },
  strongText: {
    margin: 0,
    color: "#362B3B",
    fontSize: "13px",
    fontWeight: 780,
  },
  subtleText: {
    margin: "4px 0 0",
    color: "#887C8D",
    fontSize: "11px",
    lineHeight: 1.4,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    background: "#F1EAF6",
    color: "#6E5084",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: 750,
    whiteSpace: "nowrap",
  },
  neutralPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    background: "#F4F1F5",
    color: "#665E69",
    padding: "5px 8px",
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  select: {
    width: "100%",
    minWidth: "125px",
    border: "1px solid #DCCFE5",
    borderRadius: "9px",
    background: "#FFFFFF",
    color: "#46394C",
    padding: "8px 9px",
    fontSize: "12px",
    outline: "none",
  },
  rowActions: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    flexWrap: "wrap",
    minWidth: "175px",
  },
  message: {
    border: "1px solid #E4D8EB",
    borderRadius: "14px",
    background: "#FBF8FD",
    color: "#64576A",
    padding: "14px 16px",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  error: {
    border: "1px solid #E7CBD2",
    borderRadius: "14px",
    background: "#FFF8FA",
    color: "#7F4958",
    padding: "14px 16px",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
  },
  emptyTitle: {
    margin: 0,
    color: "#3C3042",
    fontSize: "18px",
    fontWeight: 780,
  },
  emptyText: {
    margin: "8px auto 0",
    maxWidth: "540px",
    color: "#796F7D",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  modalBackdrop: { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(40, 31, 45, 0.46)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal: { width: "min(760px, 100%)", maxHeight: "92vh", overflowY: "auto", border: "1px solid #E7DDED", borderRadius: "20px", background: "#FFFFFF", boxShadow: "0 24px 70px rgba(48, 37, 54, 0.24)" },
  modalWide: { width: "min(1040px, 100%)" },
  modalHeader: { display: "flex", justifyContent: "space-between", gap: "16px", padding: "20px", borderBottom: "1px solid #EEE6F2" },
  modalBody: { display: "flex", flexDirection: "column", gap: "18px", padding: "20px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap", padding: "18px 20px", borderTop: "1px solid #EEE6F2" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { color: "#5F5265", fontSize: "12px", fontWeight: 750 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #DCCFE5", borderRadius: "11px", background: "#FFFFFF", color: "#302536", padding: "10px 12px", fontSize: "13px", outline: "none" },
  helpText: { margin: 0, color: "#867A8B", fontSize: "11px", lineHeight: 1.45 },
  providerGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  providerCard: { textAlign: "left", border: "1px solid #E5DAEB", borderRadius: "14px", background: "#FFFFFF", padding: "15px", cursor: "pointer" },
  providerDisabled: { opacity: 0.62, cursor: "not-allowed", background: "#FAF8FB" },
  providerTitle: { margin: 0, color: "#3C3042", fontSize: "14px", fontWeight: 780 },
  providerText: { margin: "5px 0 0", color: "#7A6F7F", fontSize: "12px", lineHeight: 1.45 },
  comingSoon: { display: "inline-flex", marginTop: "9px", borderRadius: "999px", background: "#F1EAF6", color: "#6E5084", padding: "4px 7px", fontSize: "10px", fontWeight: 750 },
  documentRow: { display: "grid", gridTemplateColumns: "150px minmax(220px, 1fr)", gap: "12px", alignItems: "center" },
  importTable: { width: "100%", minWidth: "760px", borderCollapse: "collapse" },
  checkboxRow: { display: "flex", alignItems: "center", gap: "8px", color: "#5F5265", fontSize: "13px" },
  summaryBox: { border: "1px solid #E5DAEB", borderRadius: "14px", background: "#FBF8FD", padding: "14px", color: "#64576A", fontSize: "13px", lineHeight: 1.5 },
};

function firstRelatedRecord<T>(
  value: T | T[] | null | undefined,
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normaliseApplications(
  rows: unknown[],
): TalentApplication[] {
  return (rows as SupabaseApplicationRow[]).map((row) => ({
    ...row,
    candidate: firstRelatedRecord(row.candidate),
    vacancy: firstRelatedRecord(row.vacancy),
  }));
}

function getCandidateName(
  candidate: CandidateSummary | null,
): string {
  if (!candidate) {
    return "Candidate record unavailable";
  }

  const preferredName =
    candidate.preferred_name?.trim() ||
    candidate.first_name.trim();

  return [preferredName, candidate.last_name]
    .filter(Boolean)
    .join(" ");
}

function formatValue(value: string | null | undefined): string {
  if (!value) {
    return "Not recorded";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatScore(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  return `${Math.round(value)}%`;
}

function getStageName(
  stageKey: string,
  stageMap: Map<string, PipelineStage>,
): string {
  return (
    stageMap.get(stageKey)?.stage_name ??
    formatValue(stageKey)
  );
}

function escapeCsvValue(
  value: string | number | boolean | null | undefined,
): string {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  return `"${text.replaceAll('"', '""')}"`;
}

function isArchived(
  application: TalentApplication,
): boolean {
  return (
    application.status === "archived" ||
    application.archived_at !== null
  );
}

function isClosed(
  application: TalentApplication,
): boolean {
  return (
    closedStatuses.includes(application.status) &&
    !isArchived(application)
  );
}




function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function splitCandidateName(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "Not recorded" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) ?? "Not recorded" };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"' && quoted && next === '"') { current += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { values.push(current.trim()); current = ""; continue; }
    current += character;
  }
  values.push(current.trim());
  return values;
}

function parseIndeedCsv(text: string): IndeedRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const findValue = (record: Record<string, string>, candidates: string[]) => {
    for (const candidate of candidates) {
      const key = Object.keys(record).find((header) => header === candidate || header.includes(candidate));
      if (key && record[key]) return record[key];
    }
    return "";
  };
   return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const raw = headers.reduce<Record<string, string>>((record, header, headerIndex) => { record[header || `column_${headerIndex + 1}`] = values[headerIndex] ?? ""; return record; }, {});
    let firstName = findValue(raw, ["first name", "firstname", "given name"]);
    let lastName = findValue(raw, ["last name", "lastname", "surname", "family name"]);
    if (!firstName || !lastName) {
      const split = splitCandidateName(findValue(raw, ["candidate name", "applicant name", "name"]));
      firstName ||= split.firstName; lastName ||= split.lastName;
    }
    const email = normaliseEmail(findValue(raw, ["email address", "email"]));
    const phone = findValue(raw, ["phone number", "telephone", "mobile", "phone"]);
    const appliedAt = findValue(raw, ["application date", "applied date", "date applied", "submitted at", "submitted"]);
    const issue = !firstName || !lastName ? "Candidate name is missing." : !email ? "Email is missing; a new candidate record will be created without duplicate email matching." : null;
    return { rowNumber: index + 2, firstName, lastName, email, phone, appliedAt, raw, selected: true, issue };
  });
}

export default function ApplicationsWorkspace() {
  const [applications, setApplications] = useState<
    TalentApplication[]
  >([]);

  const [pipelineStages, setPipelineStages] =
    useState<PipelineStage[]>(fallbackStages);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<RegisterFilter>("current");

  const [editingApplication, setEditingApplication] =
    useState<EditingApplication | null>(null);

  const [savingApplicationId, setSavingApplicationId] =
    useState<string | null>(null);

  const [actionApplicationId, setActionApplicationId] =
    useState<string | null>(null);

  const [vacancies, setVacancies] = useState<VacancyOption[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedImportProvider, setSelectedImportProvider] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState<UploadForm>(emptyUploadForm);
  const [uploadDocuments, setUploadDocuments] = useState<UploadDocument[]>([
    { type: "cv", file: null },
    { type: "cover_letter", file: null },
    { type: "application_form", file: null },
    { type: "portfolio", file: null },
  ]);
  const [savingIntake, setSavingIntake] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [indeedVacancyId, setIndeedVacancyId] = useState("");
  const [indeedFileName, setIndeedFileName] = useState("");
  const [indeedRows, setIndeedRows] = useState<IndeedRow[]>([]);
  const [indeedImportResult, setIndeedImportResult] = useState<string | null>(null);


  const loadApplications = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      setActionMessage(null);

      const [applicationsResult, stagesResult, vacanciesResult] =
        await Promise.all([
          supabase
            .from("leo_talent_applications")
            .select(
              `
                id,
                organisation_id,
                application_reference,
                vacancy_id,
                candidate_id,
                current_stage_key,
                status,
                source,
                submitted_at,
                last_reviewed_at,
                last_reviewed_by,
                blind_review_enabled,
                ai_screening_enabled,
                manual_score,
                ai_score,
                combined_score,
                recommendation,
                recommendation_reason,
                knockout_failed,
                withdrawn_at,
                withdrawal_reason,
                closed_at,
                closed_reason,
                created_at,
                updated_at,
                archived_at,
                archive_reason,
                candidate:leo_talent_candidates (
                  id,
                  candidate_reference,
                  first_name,
                  middle_names,
                  last_name,
                  preferred_name,
                  email,
                  phone,
                  is_internal_candidate,
                  existing_employee_id,
                  archived_at
                ),
                vacancy:leo_talent_vacancies (
                  id,
                  organisation_id,
                  vacancy_reference,
                  title,
                  department,
                  location_name,
                  status,
                  closing_date,
                  blind_review_enabled,
                  ai_screening_enabled,
                  safer_recruitment_required,
                  requires_dbs,
                  dbs_level,
                  required_reference_count,
                  overseas_check_required_if_applicable
                )
              `,
            )
            .order("updated_at", {
              ascending: false,
            }),

          supabase
            .from("leo_talent_pipeline_stages")
            .select(
              `
                id,
                stage_key,
                stage_name,
                description,
                stage_group,
                display_order,
                is_active
              `,
            )
            .eq("is_active", true)
            .order("display_order", {
              ascending: true,
            }),

          supabase
            .from("leo_talent_vacancies")
            .select("id, organisation_id, vacancy_reference, title, department, location_name, status, closing_date, blind_review_enabled, ai_screening_enabled, safer_recruitment_required, requires_dbs, dbs_level, required_reference_count, overseas_check_required_if_applicable")
            .is("archived_at", null)
            .order("created_at", { ascending: false }),
        ]);

      if (applicationsResult.error) {
        console.error(
          "Unable to load Leo Talent applications:",
          applicationsResult.error,
        );

        setApplications([]);
        setError(
          "Leo could not load the application register. Check that the Talent database foundation has been completed, then try again.",
        );
      } else {
        setApplications(
          normaliseApplications(
            applicationsResult.data ?? [],
          ),
        );
      }

      if (
        !stagesResult.error &&
        stagesResult.data &&
        stagesResult.data.length > 0
      ) {
        setPipelineStages(
          stagesResult.data as PipelineStage[],
        );
      } else {
        setPipelineStages(fallbackStages);
      }

      if (!vacanciesResult.error) {
        setVacancies((vacanciesResult.data ?? []) as VacancyOption[]);
      } else {
        console.error("Unable to load vacancies for application intake:", vacanciesResult.error);
        setVacancies([]);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const stageMap = useMemo(() => {
    return new Map(
      pipelineStages.map((stage) => [
        stage.stage_key,
        stage,
      ]),
    );
  }, [pipelineStages]);

  const metrics = useMemo(() => {
    const visibleApplications = applications.filter(
      (application) => !isArchived(application),
    );

    return {
      total: visibleApplications.length,
      newApplications: visibleApplications.filter(
        (application) =>
          application.current_stage_key === "new",
      ).length,
      awaitingReview: visibleApplications.filter(
        (application) =>
          ["screening", "review"].includes(
            application.current_stage_key,
          ),
      ).length,
      interviews: visibleApplications.filter(
        (application) =>
          application.current_stage_key.startsWith(
            "interview",
          ),
      ).length,
      checks: visibleApplications.filter(
        (application) =>
          application.current_stage_key === "checks",
      ).length,
      offers: visibleApplications.filter(
        (application) =>
          application.current_stage_key === "offer" ||
          application.status === "offered",
      ).length,
    };
  }, [applications]);

  const pipelineSummary = useMemo(() => {
    return pipelineStages.map((stage) => ({
      ...stage,
      count: applications.filter(
        (application) =>
          application.current_stage_key ===
            stage.stage_key &&
          !isArchived(application),
      ).length,
    }));
  }, [applications, pipelineStages]);

  const filteredApplications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const candidateName = getCandidateName(
        application.candidate,
      ).toLowerCase();

      const searchableValues = [
        application.application_reference,
        candidateName,
        application.candidate?.candidate_reference,
        application.candidate?.email,
        application.candidate?.phone,
        application.vacancy?.title,
        application.vacancy?.vacancy_reference,
        application.vacancy?.department,
        application.vacancy?.location_name,
        application.source,
      ]
        .filter(
          (
            value,
          ): value is string =>
            typeof value === "string",
        )
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        search.length === 0 ||
        searchableValues.includes(search);

      let matchesFilter = true;

      switch (activeFilter) {
        case "current":
          matchesFilter =
            !isClosed(application) &&
            !isArchived(application);
          break;

        case "new":
          matchesFilter =
            application.current_stage_key === "new" &&
            !isArchived(application);
          break;

        case "screening":
          matchesFilter =
            application.current_stage_key ===
              "screening" &&
            !isArchived(application);
          break;

        case "review":
          matchesFilter =
            application.current_stage_key === "review" &&
            !isArchived(application);
          break;

        case "interview":
          matchesFilter =
            application.current_stage_key.startsWith(
              "interview",
            ) &&
            !isArchived(application);
          break;

        case "checks":
          matchesFilter =
            application.current_stage_key === "checks" &&
            !isArchived(application);
          break;

        case "offer":
          matchesFilter =
            (application.current_stage_key === "offer" ||
              application.status === "offered") &&
            !isArchived(application);
          break;

        case "closed":
          matchesFilter = isClosed(application);
          break;

        case "archived":
          matchesFilter = isArchived(application);
          break;

        case "all":
          matchesFilter = true;
          break;
      }

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, applications, searchTerm]);

  function beginEditing(
    application: TalentApplication,
  ) {
    setEditingApplication({
      id: application.id,
      stage: application.current_stage_key,
      status: application.status,
    });

    setActionMessage(null);
  }

  function cancelEditing() {
    setEditingApplication(null);
  }

  async function saveApplicationChanges(
    application: TalentApplication,
  ) {
    if (
      !editingApplication ||
      editingApplication.id !== application.id
    ) {
      return;
    }

    setSavingApplicationId(application.id);
    setError(null);
    setActionMessage(null);

    const statusChanged =
      editingApplication.status !== application.status;

    const stageChanged =
      editingApplication.stage !==
      application.current_stage_key;

    if (!statusChanged && !stageChanged) {
      setEditingApplication(null);
      setSavingApplicationId(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/talent/applications/${application.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentStageKey: editingApplication.stage,
            status: editingApplication.status,
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Leo could not save the application changes.",
        );
      }

      setEditingApplication(null);
      setActionMessage(
        result?.message ||
          `${application.application_reference} was updated successfully.`,
      );

      await loadApplications(true);
    } catch (updateError) {
      console.error(
        "Unable to update application:",
        updateError,
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Leo could not save the application changes. No further records were changed.",
      );
    } finally {
      setSavingApplicationId(null);
    }
  }

  async function markReviewed(
    application: TalentApplication,
  ) {
    setActionApplicationId(application.id);
    setError(null);
    setActionMessage(null);

    try {
      const response = await fetch(
        `/api/talent/applications/${application.id}/review`,
        { method: "POST" },
      );

      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Leo could not record the application review.",
        );
      }

      setActionMessage(
        result?.message ||
          `${application.application_reference} was marked as reviewed.`,
      );

      await loadApplications(true);
    } catch (reviewError) {
      console.error(
        "Unable to mark application reviewed:",
        reviewError,
      );

      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Leo could not record the application review.",
      );
    } finally {
      setActionApplicationId(null);
    }
  }

  async function archiveApplication(
    application: TalentApplication,
  ) {
    const confirmed = window.confirm(
      `Archive ${application.application_reference}? The record will remain available in the Archived view.`,
    );

    if (!confirmed) {
      return;
    }

    setActionApplicationId(application.id);
    setError(null);
    setActionMessage(null);

    try {
      const response = await fetch(
        `/api/talent/applications/${application.id}/archive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: "Archived from the application register",
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Leo could not archive this application.",
        );
      }

      setEditingApplication(null);
      setActionMessage(
        result?.message ||
          `${application.application_reference} was archived.`,
      );

      await loadApplications(true);
    } catch (archiveError) {
      console.error(
        "Unable to archive application:",
        archiveError,
      );

      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Leo could not archive this application. No changes were made.",
      );
    } finally {
      setActionApplicationId(null);
    }
  }

  async function restoreApplication(
    application: TalentApplication,
  ) {
    setActionApplicationId(application.id);
    setError(null);
    setActionMessage(null);

    try {
      const response = await fetch(
        `/api/talent/applications/${application.id}/restore`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active" }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Leo could not restore this application.",
        );
      }

      setActionMessage(
        result?.message ||
          `${application.application_reference} was restored.`,
      );

      await loadApplications(true);
    } catch (restoreError) {
      console.error(
        "Unable to restore application:",
        restoreError,
      );

      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Leo could not restore this application. No changes were made.",
      );
    } finally {
      setActionApplicationId(null);
    }
  }


  function resetUploadForm() {
    setUploadForm(emptyUploadForm);
    setUploadDocuments([
      { type: "cv", file: null },
      { type: "cover_letter", file: null },
      { type: "application_form", file: null },
      { type: "portfolio", file: null },
    ]);
    setIntakeError(null);
  }

  function closeUpload() {
    if (savingIntake) return;
    setUploadOpen(false);
    resetUploadForm();
  }

  function closeImport() {
    if (savingIntake) return;
    setImportOpen(false);
    setSelectedImportProvider(null);
    setIndeedVacancyId("");
    setIndeedFileName("");
    setIndeedRows([]);
    setIndeedImportResult(null);
    setIntakeError(null);
  }

  async function submitUploadApplication() {
    setIntakeError(null);
    setActionMessage(null);

    const vacancy = vacancies.find(
      (item) => item.id === uploadForm.vacancyId,
    );

    const cv = uploadDocuments.find(
      (document) => document.type === "cv",
    )?.file;

    if (!vacancy) {
      setIntakeError(
        "Select the vacancy this application relates to.",
      );
      return;
    }

    if (
      !uploadForm.firstName.trim() ||
      !uploadForm.lastName.trim()
    ) {
      setIntakeError(
        "Enter the candidate's first and last name.",
      );
      return;
    }

    if (!cv) {
      setIntakeError(
        "Upload the candidate's CV before saving the application.",
      );
      return;
    }

    const oversizedDocument = uploadDocuments.find(
      (document) =>
        document.file &&
        document.file.size > 15 * 1024 * 1024,
    );

    if (oversizedDocument?.file) {
      setIntakeError(
        `${oversizedDocument.file.name} is larger than the 15 MB upload limit.`,
      );
      return;
    }

    setSavingIntake(true);

    try {
      const formData = new FormData();

      formData.set("vacancyId", uploadForm.vacancyId);
      formData.set("source", uploadForm.source);
      formData.set("sourceDetail", uploadForm.sourceDetail);
      formData.set("firstName", uploadForm.firstName);
      formData.set("middleNames", uploadForm.middleNames);
      formData.set("lastName", uploadForm.lastName);
      formData.set("preferredName", uploadForm.preferredName);
      formData.set("email", uploadForm.email);
      formData.set("phone", uploadForm.phone);
      formData.set(
        "isInternalCandidate",
        String(uploadForm.isInternalCandidate),
      );

      for (const document of uploadDocuments) {
        if (document.file) {
          formData.set(document.type, document.file);
        }
      }

      const response = await fetch(
        "/api/talent/applications/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = (await response.json().catch(() => null)) as
        | {
            applicationReference?: string;
            message?: string;
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Leo could not create this application.",
        );
      }

      setUploadOpen(false);
      resetUploadForm();
      setActionMessage(
        result?.message ||
          `${result?.applicationReference || "The application"} was created and the CV was uploaded successfully.`,
      );

      await loadApplications(true);
    } catch (uploadError) {
      console.error(
        "Unable to create uploaded application:",
        uploadError,
      );

      setIntakeError(
        uploadError instanceof Error
          ? uploadError.message
          : "Leo could not create this application. No further applications were imported.",
      );
    } finally {
      setSavingIntake(false);
    }
  }

  async function readIndeedFile(file: File | null) {
    setIntakeError(null);
    setIndeedImportResult(null);
    setIndeedRows([]);
     setIndeedFileName(file?.name ?? "");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setIntakeError("For launch, Indeed imports must use a CSV export file."); return; }
    const rows = parseIndeedCsv(await file.text());
    if (rows.length === 0) { setIntakeError("No applicant rows were found in this CSV file."); return; }
    setIndeedRows(rows);
  }

  async function importIndeedApplications() {
    setIntakeError(null);
    setIndeedImportResult(null);

    const vacancy = vacancies.find(
      (item) => item.id === indeedVacancyId,
    );

    const selectedRows = indeedRows.filter(
      (row) => row.selected,
    );

    if (!vacancy) {
      setIntakeError(
        "Select the vacancy these Indeed applications relate to.",
      );
      return;
    }

    if (selectedRows.length === 0) {
      setIntakeError(
        "Select at least one applicant to import.",
      );
      return;
    }

    if (
      selectedRows.some(
        (row) =>
          !row.firstName.trim() ||
          !row.lastName.trim(),
      )
    ) {
      setIntakeError(
        "Every selected row must include a candidate name.",
      );
      return;
    }

    setSavingIntake(true);

    try {
      const response = await fetch(
        "/api/talent/applications/import/indeed",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vacancyId: indeedVacancyId,
            importFileName: indeedFileName,
            rows: selectedRows.map((row) => ({
              rowNumber: row.rowNumber,
              firstName: row.firstName,
              lastName: row.lastName,
              email: row.email,
              phone: row.phone,
              appliedAt: row.appliedAt,
              raw: row.raw,
            })),
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as
        | {
            imported?: number;
            skipped?: number;
            failures?: string[];
            message?: string;
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Leo could not complete the Indeed import.",
        );
      }

      const imported = result?.imported ?? 0;
      const skipped = result?.skipped ?? 0;
      const failures = result?.failures ?? [];

      const summary =
        result?.message ||
        `${imported} imported, ${skipped} duplicate${
          skipped === 1 ? "" : "s"
        } skipped${
          failures.length
            ? `, ${failures.length} failed`
            : ""
        }.`;

      setIndeedImportResult(summary);
      setActionMessage(`Indeed import completed: ${summary}`);

      if (failures.length > 0) {
        setIntakeError(failures.slice(0, 5).join(" "));
      }

      await loadApplications(true);
    } catch (importError) {
      console.error(
        "Unable to import Indeed applications:",
        importError,
      );

      setIntakeError(
        importError instanceof Error
          ? importError.message
          : "Leo could not complete the Indeed import.",
      );
    } finally {
      setSavingIntake(false);
    }
  }

  function exportCurrentView() {
    if (filteredApplications.length === 0) {
      setActionMessage(
        "There are no applications in the current view to export.",
      );
      return;
    }

    const headers = [
      "Application Reference",
      "Candidate",
      "Candidate Reference",
      "Candidate Email",
      "Candidate Telephone",
      "Vacancy",
      "Vacancy Reference",
      "Department",
      "Location",
      "Stage",
      "Status",
      "Source",
      "Submitted",
      "Last Reviewed",
      "Manual Score",
      "AI Score",
      "Combined Score",
      "Recommendation",
      "Knockout Failed",
      "Internal Candidate",
      "Blind Review",
      "AI Screening",
      "Created",
      "Last Updated",
    ];

    const rows = filteredApplications.map(
      (application) => [
        application.application_reference,
        getCandidateName(application.candidate),
        application.candidate?.candidate_reference ?? "",
        application.candidate?.email ?? "",
        application.candidate?.phone ?? "",
        application.vacancy?.title ?? "",
        application.vacancy?.vacancy_reference ?? "",
        application.vacancy?.department ?? "",
        application.vacancy?.location_name ?? "",
        getStageName(
          application.current_stage_key,
          stageMap,
        ),
        formatValue(application.status),
        application.source ?? "",
        application.submitted_at ?? "",
        application.last_reviewed_at ?? "",
        formatScore(application.manual_score),
        formatScore(application.ai_score),
        formatScore(application.combined_score),
        application.recommendation
          ? formatValue(application.recommendation)
          : "",
        application.knockout_failed ? "Yes" : "No",
        application.candidate?.is_internal_candidate
          ? "Yes"
          : "No",
        application.blind_review_enabled ? "Yes" : "No",
        application.ai_screening_enabled ? "Yes" : "No",
        application.created_at,
        application.updated_at,
      ],
    );

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(","),
      ),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });

    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = `leo-talent-applications-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(downloadUrl);

    setActionMessage(
      `${filteredApplications.length} application${
        filteredApplications.length === 1 ? "" : "s"
      } exported.`,
    );
  }

  function openCandidate(
  application: TalentApplication,
) {
  if (!application.candidate_id) {
    setError(
      "This application is not connected to a candidate record.",
    );
    return;
  }

  window.location.href = `/dashboard/leo-talent?section=candidates&candidateId=${application.candidate_id}`;
}

  function openVacancy(
    application: TalentApplication,
  ) {
    if (!application.vacancy_id) {
      setError(
        "This application is not connected to a vacancy record.",
      );
      return;
    }

   window.location.href = `/dashboard/leo-talent/vacancies/${application.vacancy_id}`;
  }

  return (
    <section style={styles.workspace}>
      <header style={styles.header}>
        <div style={styles.headingGroup}>
          <p style={styles.eyebrow}>Leo Talent</p>

          <h1 style={styles.title}>Applications</h1>

          <p style={styles.description}>
            Review applications, record decisions and manage
            candidate progression through each stage of the hiring
            process.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button type="button" style={styles.primaryButton} onClick={() => { setIntakeError(null); setUploadOpen(true); }}>
            Upload CV
          </button>

          <button type="button" style={styles.secondaryButton} onClick={() => { setIntakeError(null); setImportOpen(true); }}>
            Import applications
                    </button>

          <button
            type="button"
            style={{
              ...styles.secondaryButton,
              ...(refreshing
                ? styles.disabledButton
                : {}),
            }}
            disabled={refreshing}
            onClick={() => void loadApplications(true)}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={exportCurrentView}
          >
            Export current view
          </button>
        </div>
      </header>

      <div style={styles.metrics}>
        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>
            Applications
          </p>
          <p style={styles.metricValue}>{metrics.total}</p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>
            New applications
          </p>
          <p style={styles.metricValue}>
            {metrics.newApplications}
          </p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>
            Awaiting review
          </p>
          <p style={styles.metricValue}>
            {metrics.awaitingReview}
          </p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>
            At interview
          </p>
          <p style={styles.metricValue}>
            {metrics.interviews}
          </p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>
            Pre-emp Checks
          </p>
          <p style={styles.metricValue}>{metrics.checks}</p>
        </article>

        <article style={styles.metricCard}>
          <p style={styles.metricLabel}>At offers</p>
          <p style={styles.metricValue}>{metrics.offers}</p>
        </article>
      </div>

      {error ? (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      ) : null}

      {actionMessage ? (
        <div role="status" style={styles.message}>
          {actionMessage}
        </div>
      ) : null}

      <TalentIntelligencePanel stage="applications" />

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>
            Overview
          </h2>

        </div>

        <div style={styles.pipelineGrid}>
          {pipelineSummary.map((stage) => (
            <article
              key={stage.id}
              style={styles.pipelineCard}
              title={stage.description ?? stage.stage_name}
            >
              <p style={styles.pipelineName}>
                {stage.stage_name}
              </p>

              <p style={styles.pipelineCount}>
                {stage.count}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.controls}>
          <input
            type="search"
            aria-label="Search applications"
            placeholder="Search by candidate, vacancy, application reference or department"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            style={styles.searchInput}
          />

          <div style={styles.filters}>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                style={
                  activeFilter === option.value
                    ? styles.activeFilterButton
                    : styles.filterButton
                }
                onClick={() =>
                  setActiveFilter(option.value)
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>
              Loading applications…
            </h2>

            <p style={styles.emptyText}>
              Leo is retrieving the current application
              register and application overview.
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>
              {applications.length === 0
                ? "No applications yet"
                : "No applications match this view"}
            </h2>

            <p style={styles.emptyText}>
              {applications.length === 0
                ? "Applications will appear here when candidates apply for an open vacancy."
                : "Try changing the search term or selecting another register filter."}
            </p>

            {applications.length === 0 ? (
              <div style={{ ...styles.headerActions, justifyContent: "center", marginTop: "18px" }}>
                <button type="button" style={styles.primaryButton} onClick={() => setUploadOpen(true)}>Upload CV</button>
                <button type="button" style={styles.secondaryButton} onClick={() => setImportOpen(true)}>Import applications</button>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Vacancy</th>
                  <th style={styles.th}>Stage</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Scores</th>
                  <th style={styles.th}>
                    Recommendation
                  </th>
                  <th style={styles.th}>
                    Last reviewed
                  </th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map(
                  (application) => {
                    const editing =
                      editingApplication?.id ===
                      application.id;

                    const busy =
                      savingApplicationId ===
                        application.id ||
                      actionApplicationId ===
                        application.id;

                    return (
                      <tr key={application.id}>
                        <td style={styles.td}>
                          <p style={styles.strongText}>
                            {getCandidateName(
                              application.candidate,
                            )}
                          </p>

                          <p style={styles.subtleText}>
                            {application
                              .application_reference}
                          </p>

                          <p style={styles.subtleText}>
                            {application.candidate
                              ?.candidate_reference ??
                              "Candidate reference unavailable"}
                          </p>

                          {application.candidate
                            ?.is_internal_candidate ? (
                            <span
                              style={{
                                ...styles.neutralPill,
                                marginTop: "7px",
                              }}
                            >
                              Internal candidate
                            </span>
                          ) : null}
                        </td>

                        <td style={styles.td}>
                          <p style={styles.strongText}>
                            {application.vacancy?.title ??
                              "Vacancy unavailable"}
                          </p>

                          <p style={styles.subtleText}>
                            {application.vacancy
                              ?.vacancy_reference ??
                              "Reference unavailable"}
                          </p>

                          <p style={styles.subtleText}>
                            {[
                              application.vacancy
                                ?.department,
                              application.vacancy
                                ?.location_name,
                            ]
                              .filter(Boolean)
                              .join(" · ") ||
                              "Department and location not recorded"}
                          </p>
                        </td>

                        <td style={styles.td}>
                          {editing ? (
                            <select
                              aria-label={`Stage for ${application.application_reference}`}
                              style={styles.select}
                              value={
                                editingApplication.stage
                              }
                              onChange={(event) =>
                                setEditingApplication(
                                  (current) =>
                                    current
                                      ? {
                                          ...current,
                                          stage:
                                            event.target
                                              .value,
                                        }
                                      : current,
                                )
                              }
                            >
                              {pipelineStages.map(
                                (stage) => (
                                  <option
                                    key={stage.stage_key}
                                    value={stage.stage_key}
                                  >
                                    {stage.stage_name}
                                  </option>
                                ),
                              )}
                            </select>
                          ) : (
                            <span style={styles.statusPill}>
                              {getStageName(
                                application.current_stage_key,
                                stageMap,
                              )}
                            </span>
                          )}
                        </td>

                        <td style={styles.td}>
                          {editing ? (
                            <select
                              aria-label={`Status for ${application.application_reference}`}
                              style={styles.select}
                              value={
                                editingApplication.status
                              }
                              onChange={(event) =>
                                setEditingApplication(
                                  (current) =>
                                    current
                                      ? {
                                          ...current,
                                          status:
                                            event.target
                                              .value as ApplicationStatus,
                                        }
                                      : current,
                                )
                              }
                            >
                              {editableStatuses.map(
                                (status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {formatValue(status)}
                                  </option>
                                ),
                              )}
                            </select>
                          ) : (
                            <span style={styles.neutralPill}>
                              {formatValue(
                                application.status,
                              )}
                            </span>
                          )}

                          {application.knockout_failed ? (
                            <p
                              style={{
                                ...styles.subtleText,
                                color: "#865161",
                              }}
                            >
                              Screening response requires
                              review
                            </p>
                          ) : null}
                        </td>

                        <td style={styles.td}>
                          <p style={styles.subtleText}>
                            Manual:{" "}
                            {formatScore(
                              application.manual_score,
                            ) || "—"}
                          </p>

                          <p style={styles.subtleText}>
                            AI:{" "}
                            {formatScore(
                              application.ai_score,
                            ) || "—"}
                          </p>

                          <p style={styles.subtleText}>
                            Combined:{" "}
                            {formatScore(
                              application.combined_score,
                            ) || "—"}
                          </p>
                        </td>

                        <td style={styles.td}>
                          <p style={styles.strongText}>
                            {application.recommendation
                              ? formatValue(
                                  application.recommendation,
                                )
                              : "Not recorded"}
                          </p>

                          {application.recommendation_reason ? (
                            <p style={styles.subtleText}>
                              {
                                application.recommendation_reason
                              }
                            </p>
                          ) : null}
                        </td>

                        <td style={styles.td}>
                          <p style={styles.strongText}>
                            {formatDateTime(
                              application.last_reviewed_at,
                            )}
                          </p>

                          <p style={styles.subtleText}>
                            Updated{" "}
                            {formatDateTime(
                              application.updated_at,
                            )}
                          </p>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.rowActions}>
                            {editing ? (
                              <>
                                <button
                                  type="button"
                                  style={{
                                    ...styles.primaryButton,
                                    ...(busy
                                      ? styles.disabledButton
                                      : {}),
                                  }}
                                  disabled={busy}
                                  onClick={() =>
                                    void saveApplicationChanges(
                                      application,
                                    )
                                  }
                                >
                                  {savingApplicationId ===
                                  application.id
                                    ? "Saving…"
                                    : "Save"}
                                </button>

                                <button
                                  type="button"
                                  style={styles.secondaryButton}
                                  disabled={busy}
                                  onClick={cancelEditing}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  style={styles.textButton}
                                  onClick={() =>
                                    openCandidate(
                                      application,
                                    )
                                  }
                                >
                                  Open candidate
                                </button>

                                <button
                                  type="button"
                                  style={styles.textButton}
                                  onClick={() =>
                                    openVacancy(application)
                                  }
                                >
                                  Open vacancy
                                </button>

                                {!isArchived(application) ? (
                                  <>
                                    <button
                                      type="button"
                                      style={styles.textButton}
                                      disabled={busy}
                                      onClick={() =>
                                        beginEditing(
                                          application,
                                        )
                                      }
                                    >
                                      Edit stage
                                    </button>

                                    <button
                                      type="button"
                                      style={styles.textButton}
                                      disabled={busy}
                                      onClick={() =>
                                        void markReviewed(
                                          application,
                                        )
                                      }
                                    >
                                      {actionApplicationId ===
                                      application.id
                                        ? "Working…"
                                        : "Mark reviewed"}
                                    </button>

                                    <button
                                      type="button"
                                      style={styles.dangerButton}
                                      disabled={busy}
                                      onClick={() =>
                                        void archiveApplication(
                                          application,
                                        )
                                      }
                                    >
                                      Archive
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    style={styles.secondaryButton}
                                    disabled={busy}
                                    onClick={() =>
                                      void restoreApplication(
                                        application,
                                      )
                                    }
                                  >
                                    {actionApplicationId ===
                                    application.id
                                      ? "Restoring…"
                                      : "Restore"}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {uploadOpen ? (
        <div style={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeUpload(); }}>
          <section style={styles.modal} role="dialog" aria-modal="true" aria-labelledby="upload-cv-title">
            <header style={styles.modalHeader}>
              <div>
                <h2 id="upload-cv-title" style={styles.panelTitle}>Upload CV</h2>
                <p style={styles.panelText}>Create or match the candidate, create their application and store the CV against the selected vacancy.</p>
              </div>
              <button type="button" style={styles.textButton} onClick={closeUpload} disabled={savingIntake}>Close</button>
            </header>
            <div style={styles.modalBody}>
              {intakeError ? <div role="alert" style={styles.error}>{intakeError}</div> : null}
              <div style={styles.formGrid}>
                <label style={styles.field}><span style={styles.label}>Vacancy *</span><select style={styles.input} value={uploadForm.vacancyId} onChange={(event) => setUploadForm((current) => ({ ...current, vacancyId: event.target.value }))}><option value="">Select vacancy</option>{vacancies.map((vacancy) => <option key={vacancy.id} value={vacancy.id}>{vacancy.vacancy_reference} · {vacancy.title}</option>)}</select></label>
                <label style={styles.field}><span style={styles.label}>Application source *</span><select style={styles.input} value={uploadForm.source} onChange={(event) => setUploadForm((current) => ({ ...current, source: event.target.value }))}><option value="indeed">Indeed</option><option value="email">Email</option><option value="employer_website">Employer website</option><option value="linkedin">LinkedIn</option><option value="reed">Reed</option><option value="totaljobs">Totaljobs</option><option value="recruitment_agency">Recruitment agency</option><option value="employee_referral">Employee referral</option><option value="internal">Internal application</option><option value="other">Other</option></select></label>
                <label style={styles.field}><span style={styles.label}>Source details</span><input style={styles.input} value={uploadForm.sourceDetail} onChange={(event) => setUploadForm((current) => ({ ...current, sourceDetail: event.target.value }))} placeholder="Agency name, mailbox or other detail" /></label>
                <label style={styles.checkboxRow}><input type="checkbox" checked={uploadForm.isInternalCandidate} onChange={(event) => setUploadForm((current) => ({ ...current, isInternalCandidate: event.target.checked }))} />Internal candidate</label>
              </div>
              <div style={styles.formGrid}>
                <label style={styles.field}><span style={styles.label}>First name *</span><input style={styles.input} value={uploadForm.firstName} onChange={(event) => setUploadForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
                <label style={styles.field}><span style={styles.label}>Middle names</span><input style={styles.input} value={uploadForm.middleNames} onChange={(event) => setUploadForm((current) => ({ ...current, middleNames: event.target.value }))} /></label>
                <label style={styles.field}><span style={styles.label}>Last name *</span><input style={styles.input} value={uploadForm.lastName} onChange={(event) => setUploadForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
                <label style={styles.field}><span style={styles.label}>Preferred name</span><input style={styles.input} value={uploadForm.preferredName} onChange={(event) => setUploadForm((current) => ({ ...current, preferredName: event.target.value }))} /></label>
                <label style={styles.field}><span style={styles.label}>Email</span><input type="email" style={styles.input} value={uploadForm.email} onChange={(event) => setUploadForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label style={styles.field}><span style={styles.label}>Telephone</span><input type="tel" style={styles.input} value={uploadForm.phone} onChange={(event) => setUploadForm((current) => ({ ...current, phone: event.target.value }))} /></label>
              </div>
              <div style={styles.field}>
                <span style={styles.label}>Application documents</span>
                {uploadDocuments.map((document, index) => <label key={document.type} style={styles.documentRow}><span style={styles.label}>{document.type === "cv" ? "CV *" : formatValue(document.type)}</span><input type="file" accept=".pdf,.doc,.docx,.rtf,.txt,.odt" style={styles.input} onChange={(event) => { const file = event.target.files?.[0] ?? null; setUploadDocuments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, file } : item)); }} /></label>)}
                <p style={styles.helpText}>Accepted documents: PDF, Word, RTF, text and ODT. Maximum 15 MB per file.</p>
              </div>
            </div>
            <footer style={styles.modalFooter}><button type="button" style={styles.secondaryButton} onClick={closeUpload} disabled={savingIntake}>Cancel</button><button type="button" style={{ ...styles.primaryButton, ...(savingIntake ? styles.disabledButton : {}) }} disabled={savingIntake} onClick={() => void submitUploadApplication()}>{savingIntake ? "Saving application…" : "Save application"}</button></footer>
          </section>
        </div>
      ) : null}

      {importOpen ? (
        <div style={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeImport(); }}>
          <section style={{ ...styles.modal, ...(selectedImportProvider === "indeed" ? styles.modalWide : {}) }} role="dialog" aria-modal="true" aria-labelledby="import-title">
            <header style={styles.modalHeader}>
              <div><h2 id="import-title" style={styles.panelTitle}>{selectedImportProvider === "indeed" ? "Import from Indeed" : "Import applications"}</h2><p style={styles.panelText}>{selectedImportProvider === "indeed" ? "Upload an Indeed CSV export, preview the applicants and import them into one LEO vacancy." : "Choose where the applications are coming from."}</p></div>
              <button type="button" style={styles.textButton} onClick={closeImport} disabled={savingIntake}>Close</button>
            </header>
            <div style={styles.modalBody}>
              {intakeError ? <div role="alert" style={styles.error}>{intakeError}</div> : null}
              {selectedImportProvider !== "indeed" ? (
                <div style={styles.providerGrid}>{importProviders.map((provider) => <button key={provider.key} type="button" style={{ ...styles.providerCard, ...(!provider.available ? styles.providerDisabled : {}) }} disabled={!provider.available} onClick={() => provider.available && setSelectedImportProvider(provider.key)}><p style={styles.providerTitle}>{provider.name}</p><p style={styles.providerText}>{provider.description}</p>{provider.available ? <span style={styles.comingSoon}>Available now</span> : <span style={styles.comingSoon}>Coming soon</span>}</button>)}</div>
              ) : (
                <>
                  <div style={styles.formGrid}>
                    <label style={styles.field}><span style={styles.label}>Vacancy *</span><select style={styles.input} value={indeedVacancyId} onChange={(event) => setIndeedVacancyId(event.target.value)}><option value="">Select vacancy</option>{vacancies.map((vacancy) => <option key={vacancy.id} value={vacancy.id}>{vacancy.vacancy_reference} · {vacancy.title}</option>)}</select></label>
                    <label style={styles.field}><span style={styles.label}>Indeed CSV export *</span><input type="file" accept=".csv,text/csv" style={styles.input} onChange={(event) => void readIndeedFile(event.target.files?.[0] ?? null)} /><p style={styles.helpText}>{indeedFileName || "No file selected"}</p></label>
                  </div>
                  {indeedImportResult ? <div role="status" style={styles.message}>{indeedImportResult}</div> : null}
                  {indeedRows.length > 0 ? <><div style={styles.summaryBox}>{indeedRows.filter((row) => row.selected).length} of {indeedRows.length} applicants selected for import. Candidate email is used to match existing records where available.</div><div style={styles.tableWrapper}><table style={styles.importTable}><thead><tr><th style={styles.th}>Import</th><th style={styles.th}>Candidate</th><th style={styles.th}>Email</th><th style={styles.th}>Telephone</th><th style={styles.th}>Applied</th><th style={styles.th}>Review</th></tr></thead><tbody>{indeedRows.map((row, index) => <tr key={`${row.rowNumber}-${row.email}-${index}`}><td style={styles.td}><input type="checkbox" checked={row.selected} onChange={(event) => setIndeedRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, selected: event.target.checked } : item))} /></td><td style={styles.td}><input aria-label={`First name row ${row.rowNumber}`} style={styles.input} value={row.firstName} onChange={(event) => setIndeedRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, firstName: event.target.value } : item))} /><input aria-label={`Last name row ${row.rowNumber}`} style={{ ...styles.input, marginTop: "7px" }} value={row.lastName} onChange={(event) => setIndeedRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, lastName: event.target.value } : item))} /></td><td style={styles.td}>{row.email || "Not supplied"}</td><td style={styles.td}>{row.phone || "Not supplied"}</td><td style={styles.td}>{row.appliedAt || "Import date"}</td><td style={styles.td}>{row.issue ? <span style={styles.subtleText}>{row.issue}</span> : <span style={styles.statusPill}>Ready</span>}</td></tr>)}</tbody></table></div></> : <div style={styles.summaryBox}>Export the applicant list from Indeed as CSV, then upload it here. LEO will preview the rows before creating any records.</div>}
                </>
              )}
            </div>
            <footer style={styles.modalFooter}>{selectedImportProvider === "indeed" ? <button type="button" style={styles.secondaryButton} onClick={() => { setSelectedImportProvider(null); setIndeedRows([]); setIndeedFileName(""); setIntakeError(null); }}>Back</button> : null}<button type="button" style={styles.secondaryButton} onClick={closeImport} disabled={savingIntake}>Cancel</button>{selectedImportProvider === "indeed" ? <button type="button" style={{ ...styles.primaryButton, ...(savingIntake ? styles.disabledButton : {}) }} disabled={savingIntake || indeedRows.length === 0} onClick={() => void importIndeedApplications()}>{savingIntake ? "Importing…" : "Import selected"}</button> : null}</footer>
          </section>
        </div>
      ) : null}

        </section>
  );
}