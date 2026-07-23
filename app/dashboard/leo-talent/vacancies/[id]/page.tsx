"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type VacancyStatus =
  | "draft"
  | "approval_required"
  | "approved"
  | "open"
  | "paused"
  | "closed"
  | "filled"
  | "cancelled"
  | "archived";

type ApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "returned"
  | "declined";

type WorkspaceTab =
  | "overview"
  | "publication"
  | "applications"
  | "candidates"
  | "interviews"
  | "due_diligence"
  | "offers"
  | "documents"
  | "activity"
  | "settings";

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type Vacancy = {
  id: string;
  organisation_id: string | number | null;
  vacancy_reference: string;
  title: string;
  department: string | null;
  location_name: string | null;
  hiring_manager_name: string | null;
  recruitment_lead_name: string | null;
  employment_type: string;
  work_pattern: string | null;
  hours_per_week: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string | null;
  salary_currency: string;
  salary_visible: boolean;
  number_of_positions: number;
  status: VacancyStatus;
  approval_status: ApprovalStatus;
  opening_date: string | null;
  closing_date: string | null;
  target_start_date: string | null;
  is_internal_only: boolean;
  accepts_internal_candidates: boolean;
  blind_review_enabled: boolean;
  ai_screening_enabled: boolean;
  safer_recruitment_required: boolean;
  regulated_role: boolean;
  requires_dbs: boolean;
  requires_driving: boolean;
  requires_qualification_checks: boolean;
  required_reference_count: number;
  archived_at: string | null;
  created_at: string;
  published_at?: string | null;
  role_summary?: string | null;
  responsibilities?: string | null;
  essential_criteria?: string | null;
  desirable_criteria?: string | null;
  benefits?: string | null;
  advert_text?: string | null;
  metadata?: Record<string, unknown> | null;
  updated_at: string;
};

type PublicationChannel = {
  id: string;
  organisation_id: string | null;
  vacancy_id: string;
  channel_name: string;
  channel_type: string;
  external_reference?: string | null;
  published_url?: string | null;
  status: string;
  published_at?: string | null;
  closed_at?: string | null;
  connection_provider_key?: string | null;
  connection_payload?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type VacancyQuestion = {
  id: string;
  organisation_id: string | null;
  vacancy_id: string;
  question_text: string;
  help_text?: string | null;
  question_type: string;
  options: unknown[];
  is_required: boolean;
  is_knockout: boolean;
  knockout_rule: Record<string, unknown>;
  blind_review_excluded: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type Application = {
  id: string;
  candidate_id: string | null;
  vacancy_id: string;
  application_reference?: string | null;
  status?: string | null;
  stage?: string | null;
  source?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  candidate_name?: string | null;
  candidate_email?: string | null;
};

type Candidate = {
  id: string;
  vacancy_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  telephone?: string | null;
  phone?: string | null;
  status?: string | null;
  current_stage?: string | null;
  created_at?: string | null;
};

type Interview = {
  id: string;
  vacancy_id: string;
  candidate_id?: string | null;
  candidate_name?: string | null;
  interview_type?: string | null;
  scheduled_at?: string | null;
  start_time?: string | null;
  location?: string | null;
  status?: string | null;
  outcome?: string | null;
  created_at?: string | null;
};

type DueDiligenceRecord = {
  id: string;
  vacancy_id: string;
  candidate_id?: string | null;
  candidate_name?: string | null;
  check_type?: string | null;
  status?: string | null;
  requested_at?: string | null;
  completed_at?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type Offer = {
  id: string;
  vacancy_id: string;
  candidate_id?: string | null;
  candidate_name?: string | null;
  status?: string | null;
  offered_salary?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  proposed_start_date?: string | null;
  issued_at?: string | null;
  responded_at?: string | null;
  created_at?: string | null;
};

type TalentDocument = {
  id: string;
  vacancy_id: string;
  title?: string | null;
  document_type?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type ActivityEvent = {
  id: string;
  vacancy_id?: string | null;
  entity_id?: string | null;
  event_type?: string | null;
  action?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  actor_name?: string | null;
  created_at?: string | null;
};

type UserContext = {
  userId: string | null;
  organisationId: string | number | null;
  role: PlatformRole;
};

type TableAvailability = Record<
  | "publicationChannels"
  | "vacancyQuestions"
  | "applications"
  | "candidates"
  | "interviews"
  | "dueDiligence"
  | "offers"
  | "documents"
  | "activity",
  boolean
>;

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "publication", label: "Publication" },
  { id: "applications", label: "Applications" },
  { id: "candidates", label: "Candidates" },
  { id: "interviews", label: "Interviews" },
  { id: "due_diligence", label: "Due Diligence" },
  { id: "offers", label: "Offers & Appointments" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
];

const emptyAvailability: TableAvailability = {
  publicationChannels: true,
  vacancyQuestions: true,
  applications: true,
  candidates: true,
  interviews: true,
  dueDiligence: true,
  offers: true,
  documents: true,
  activity: true,
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();
  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";
  if (role === "employee") return "Employee";
  return "Owner";
}

function humanise(value?: string | null): string {
  if (!value) return "Not set";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null, includeTime = false): string {
  if (!value) return "Not set";
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(parsed);
}

function formatSalary(
  minimum: number | null,
  maximum: number | null,
  currency = "GBP",
  period?: string | null,
): string {
  if (minimum === null && maximum === null) return "Not set";

  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
    maximumFractionDigits: 0,
  });

  const suffix = period ? ` ${period}` : "";

  if (minimum !== null && maximum !== null && minimum !== maximum) {
    return `${formatter.format(minimum)}–${formatter.format(maximum)}${suffix}`;
  }

  return `${formatter.format(minimum ?? maximum ?? 0)}${suffix}`;
}

function candidateDisplayName(candidate: Candidate): string {
  const combined = `${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim();
  return candidate.full_name || combined || "Candidate";
}

function applicationDisplayName(application: Application): string {
  return application.candidate_name || application.candidate_email || "Candidate";
}

function todayIso(): string {
  return new Date().toISOString();
}

export default function VacancyWorkspacePage() {
  const params = useParams<{ vacancyId?: string; id?: string }>();
  const router = useRouter();
  const rawVacancyId = params?.vacancyId ?? params?.id;
  const vacancyId = Array.isArray(rawVacancyId) ? rawVacancyId[0] : rawVacancyId;

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [publicationChannels, setPublicationChannels] = useState<PublicationChannel[]>([]);
  const [vacancyQuestions, setVacancyQuestions] = useState<VacancyQuestion[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [dueDiligence, setDueDiligence] = useState<DueDiligenceRecord[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [documents, setDocuments] = useState<TalentDocument[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [availability, setAvailability] = useState<TableAvailability>(emptyAvailability);
  const [userContext, setUserContext] = useState<UserContext>({
    userId: null,
    organisationId: null,
    role: "Owner",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentType, setDocumentType] = useState("Job description");
  const [documentNotes, setDocumentNotes] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("manual");
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionHelpText, setQuestionHelpText] = useState("");
  const [questionType, setQuestionType] = useState("long_text");
  const [questionRequired, setQuestionRequired] = useState(false);
  const [questionKnockout, setQuestionKnockout] = useState(false);

  const canManage = roleRank[userContext.role] >= roleRank.Manager;
  const canAdminister = roleRank[userContext.role] >= roleRank.Senior;
  const isOwner = userContext.role === "Owner";

  const loadUserContext = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      let profile: Record<string, unknown> | null = null;

      for (const column of ["user_id", "auth_user_id", "id"]) {
        const result = await (supabase as any)
          .from("user_profiles")
          .select("*")
          .eq(column, user.id)
          .limit(1);

        if (!result.error && result.data?.length) {
          profile = result.data[0] as Record<string, unknown>;
          break;
        }
      }

      setUserContext({
        userId: user.id,
        organisationId:
          (profile?.organisation_id as string | number | null) ?? null,
        role: normaliseRole(
          profile?.platform_role ?? profile?.role ?? profile?.access_level,
        ),
      });
    } catch (error) {
      console.warn("Talent user context could not be loaded:", error);
    }
  }, []);

  const safeLoad = useCallback(
    async <T,>(
      tableName: string,
      filterColumn: string,
      key: keyof TableAvailability,
      orderColumn = "created_at",
    ): Promise<T[]> => {
      const result = await (supabase as any)
  .from(tableName)
  .select("*")
  .eq(filterColumn, vacancyId)
        .order(orderColumn, { ascending: false });

      if (result.error) {
        console.warn(`${tableName} could not be loaded:`, result.error.message);
        setAvailability((current) => ({ ...current, [key]: false }));
        return [];
      }

      setAvailability((current) => ({ ...current, [key]: true }));
      return (result.data ?? []) as T[];
    },
    [vacancyId],
  );

  const loadWorkspace = useCallback(
    async (refresh = false) => {
      if (!vacancyId) {
        setErrorMessage("This vacancy could not be identified.");
        setLoading(false);
        return;
      }

      refresh ? setRefreshing(true) : setLoading(true);
      setErrorMessage("");
      setActionMessage("");

      const vacancyResult = await supabase
        .from("leo_talent_vacancies")
        .select("*")
        .eq("id", vacancyId)
        .single();

      if (vacancyResult.error || !vacancyResult.data) {
        setVacancy(null);
        setErrorMessage(
          `The vacancy could not be loaded. ${vacancyResult.error?.message ?? ""}`,
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setVacancy(vacancyResult.data as Vacancy);

      const [
        publicationChannelRows,
        vacancyQuestionRows,
        applicationRows,
        candidateRows,
        interviewRows,
        dueDiligenceRows,
        offerRows,
        documentRows,
        activityRows,
      ] = await Promise.all([
        safeLoad<PublicationChannel>(
          "leo_talent_vacancy_publication_channels",
          "vacancy_id",
          "publicationChannels",
          "created_at",
        ),
        safeLoad<VacancyQuestion>(
          "leo_talent_vacancy_questions",
          "vacancy_id",
          "vacancyQuestions",
          "display_order",
        ),
        safeLoad<Application>("leo_talent_applications", "vacancy_id", "applications"),
        safeLoad<Candidate>("leo_talent_candidates", "vacancy_id", "candidates"),
        safeLoad<Interview>("leo_talent_interviews", "vacancy_id", "interviews"),
        safeLoad<DueDiligenceRecord>(
          "leo_talent_due_diligence",
          "vacancy_id",
          "dueDiligence",
        ),
        safeLoad<Offer>("leo_talent_offers", "vacancy_id", "offers"),
        safeLoad<TalentDocument>("leo_talent_vacancy_documents", "vacancy_id", "documents"),
        safeLoad<ActivityEvent>(
          "talent_analytics_events",
          "entity_id",
          "activity",
        ),
      ]);

      setPublicationChannels(publicationChannelRows);
      setVacancyQuestions(
        [...vacancyQuestionRows].sort((a, b) => a.display_order - b.display_order),
      );
      setApplications(applicationRows);
      setCandidates(candidateRows);
      setInterviews(interviewRows);
      setDueDiligence(dueDiligenceRows);
      setOffers(offerRows);
      setDocuments(documentRows);
      setActivity(activityRows);

      setLoading(false);
      setRefreshing(false);
    },
    [safeLoad, vacancyId],
  );

  useEffect(() => {
    void loadUserContext();
    void loadWorkspace();
  }, [loadUserContext, loadWorkspace]);

  const metrics = useMemo(() => {
    const activeApplications = applications.filter(
      (item) =>
        !["withdrawn", "rejected", "declined", "appointed"].includes(
          text(item.status).toLowerCase(),
        ),
    ).length;

    const scheduledInterviews = interviews.filter(
      (item) =>
        ["scheduled", "confirmed", "planned"].includes(
          text(item.status).toLowerCase(),
        ),
    ).length;

    const outstandingChecks = dueDiligence.filter(
      (item) =>
        !["complete", "completed", "verified", "not_required"].includes(
          text(item.status).toLowerCase(),
        ),
    ).length;

    const activeOffers = offers.filter((item) =>
      ["draft", "pending", "issued", "offered", "accepted"].includes(
        text(item.status).toLowerCase(),
      ),
    ).length;

    return {
      activeApplications,
      candidates: candidates.length,
      scheduledInterviews,
      outstandingChecks,
      activeOffers,
    };
  }, [applications, candidates, dueDiligence, interviews, offers]);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((item) =>
      [
        item.application_reference,
        item.candidate_name,
        item.candidate_email,
        item.status,
        item.stage,
        item.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [applications, searchTerm]);

  const filteredCandidates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return candidates;
    return candidates.filter((item) =>
      [
        candidateDisplayName(item),
        item.email,
        item.telephone,
        item.phone,
        item.status,
        item.current_stage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [candidates, searchTerm]);

  const recordActivity = useCallback(
    async (eventType: string, description: string, metadata?: Record<string, unknown>) => {
      try {
        const { error } = await (supabase as any)
  .from("talent_analytics_events")
  .insert({
          organisation_id: vacancy?.organisation_id ?? userContext.organisationId,
          event_type: eventType,
          entity_type: "vacancy",
          entity_id: vacancyId,
          actor_user_id: userContext.userId,
          description,
          metadata: metadata ?? {},
          created_at: todayIso(),
        });

        if (error) {
          console.warn("Talent activity could not be recorded:", error.message);
        }
      } catch (error) {
        console.warn("Talent activity could not be recorded:", error);
      }
    },
    [userContext, vacancy?.organisation_id, vacancyId],
  );

  const publicVacancyPath = vacancyId ? `/careers/${vacancyId}` : "";

  const publicVacancyUrl = useMemo(() => {
    if (!publicVacancyPath) return "";
    if (typeof window === "undefined") return publicVacancyPath;
    return `${window.location.origin}${publicVacancyPath}`;
  }, [publicVacancyPath]);

  const updatePublicationSettings = useCallback(
    async (updates: Record<string, unknown>, successMessage: string) => {
      if (!vacancy || !canManage) {
        setErrorMessage("You do not have access to change publication settings.");
        return;
      }

      setWorkingAction("publication-settings");
      setErrorMessage("");
      setActionMessage("");

      const nextMetadata = { ...(vacancy.metadata ?? {}), ...updates };
      const { error } = await supabase
        .from("leo_talent_vacancies")
        .update({
  metadata: nextMetadata,
  updated_at: todayIso(),
  updated_by: userContext.userId,
} as any)
        .eq("id", vacancy.id);

      if (error) {
        setErrorMessage(`Publication settings could not be saved. ${error.message}`);
        setWorkingAction(null);
        return;
      }

      await recordActivity("vacancy_publication_settings_updated", successMessage, updates);
      setActionMessage(successMessage);
      setWorkingAction(null);
      await loadWorkspace(true);
    },
    [canManage, loadWorkspace, recordActivity, userContext.userId, vacancy],
  );

  const publishVacancy = useCallback(async () => {
    if (!vacancy || !canManage) {
      setErrorMessage("You do not have access to publish this vacancy.");
      return;
    }

    if (!vacancy.title.trim() || !vacancy.advert_text?.trim()) {
      setErrorMessage("Add a vacancy title and advert text before publishing.");
      setActiveTab("overview");
      return;
    }

    if (vacancy.closing_date) {
      const closing = new Date(`${vacancy.closing_date}T23:59:59`);
      if (closing.getTime() < Date.now()) {
        setErrorMessage("The closing date has passed. Update it before publishing.");
        return;
      }
    }

    setWorkingAction("publish-vacancy");
    setErrorMessage("");
    setActionMessage("");

    const now = todayIso();
    const vacancyUpdate = await supabase
      .from("leo_talent_vacancies")
      .update({
        status: "open",
        approval_status:
          vacancy.approval_status === "not_required" ? "approved" : vacancy.approval_status,
        published_at: now,
        opening_date: vacancy.opening_date ?? now.slice(0, 10),
        updated_at: now,
        updated_by: userContext.userId,
      })
      .eq("id", vacancy.id);

    if (vacancyUpdate.error) {
      setErrorMessage(`The vacancy could not be published. ${vacancyUpdate.error.message}`);
      setWorkingAction(null);
      return;
    }

    const publicRouteResult = await supabase
      .from("leo_public_careers_vacancies")
      .select("organisation_slug, vacancy_slug")
      .eq("vacancy_id", vacancy.id)
      .maybeSingle();

    if (publicRouteResult.error || !publicRouteResult.data) {
      setErrorMessage(
        `The vacancy was opened, but its public Careers route could not be resolved. ${publicRouteResult.error?.message ?? "Check the public careers view and publication rules."}`,
      );
      setWorkingAction(null);
      await loadWorkspace(true);
      return;
    }

    const organisationSlug =
  publicRouteResult.data.organisation_slug ?? "";

const vacancySlug =
  publicRouteResult.data.vacancy_slug ?? "";

const resolvedPublicPath = `/careers/${encodeURIComponent(
  organisationSlug,
)}/${encodeURIComponent(vacancySlug)}`;

    const resolvedPublicUrl =
      typeof window === "undefined"
        ? resolvedPublicPath
        : `${window.location.origin}${resolvedPublicPath}`;

    const existingLeoChannel = publicationChannels.find(
      (channel) => channel.channel_name.toLowerCase() === "leo careers",
    );

    const channelPayload = {
      organisation_id: vacancy.organisation_id,
      vacancy_id: vacancy.id,
      channel_name: "LEO Careers",
      channel_type: "leo_careers",
      published_url: resolvedPublicUrl,
      status: "published",
      published_at: now,
      closed_at: null,
      updated_at: now,
    };

    const channelResult = existingLeoChannel
      ? await supabase
          .from("leo_talent_vacancy_publication_channels")
          .update(channelPayload as any)
          .eq("id", existingLeoChannel.id)
      : await supabase
          .from("leo_talent_vacancy_publication_channels")
          .insert(channelPayload as any)

    if (channelResult.error) {
      setErrorMessage(
        `The vacancy was opened, but its LEO Careers channel could not be recorded. ${channelResult.error.message}`,
      );
      setWorkingAction(null);
      await loadWorkspace(true);
      return;
    }

    await recordActivity("vacancy_published", "Vacancy published to LEO Careers.", {
      public_url: resolvedPublicUrl,
    });
    setActionMessage("Vacancy published to LEO Careers.");
    setWorkingAction(null);
    await loadWorkspace(true);
  }, [
    canManage,
    loadWorkspace,
    publicVacancyPath,
    publicVacancyUrl,
    publicationChannels,
    recordActivity,
    userContext.userId,
    vacancy,
  ]);

  const unpublishVacancy = useCallback(async () => {
    if (!vacancy || !canManage) {
      setErrorMessage("You do not have access to unpublish this vacancy.");
      return;
    }

    if (!window.confirm("Remove this vacancy from all published channels? Existing applications will be retained.")) return;

    setWorkingAction("unpublish-vacancy");
    setErrorMessage("");
    const now = todayIso();

    const vacancyResult = await supabase
      .from("leo_talent_vacancies")
      .update({ status: "paused", updated_at: now, updated_by: userContext.userId })
      .eq("id", vacancy.id);

    if (vacancyResult.error) {
      setErrorMessage(`The vacancy could not be unpublished. ${vacancyResult.error.message}`);
      setWorkingAction(null);
      return;
    }

    const channelResult = await supabase
      .from("leo_talent_vacancy_publication_channels")
      .update({ status: "closed", closed_at: now, updated_at: now })
      .eq("vacancy_id", vacancy.id)
      .eq("status", "published");

    if (channelResult.error) {
      setErrorMessage(`Publication channels could not all be closed. ${channelResult.error.message}`);
      setWorkingAction(null);
      await loadWorkspace(true);
      return;
    }

    await recordActivity("vacancy_unpublished", "Vacancy removed from published channels.");
    setActionMessage("Vacancy unpublished. Existing applications remain available.");
    setWorkingAction(null);
    await loadWorkspace(true);
  }, [canManage, loadWorkspace, recordActivity, userContext.userId, vacancy]);

  const addPublicationChannel = useCallback(async () => {
    if (!vacancy || !canManage || !newChannelName.trim()) {
      setErrorMessage("Add a publication channel name.");
      return;
    }

        setWorkingAction("add-publication-channel");
    setErrorMessage("");

    const now = todayIso();

    const { error } = await (supabase as any)
      .from("leo_talent_vacancy_publication_channels")
      .insert({
        organisation_id: vacancy.organisation_id,
        vacancy_id: vacancy.id,
        channel_name: newChannelName.trim(),
        channel_type: newChannelType,
        published_url: newChannelUrl.trim() || null,
        status: newChannelUrl.trim() ? "published" : "planned",
        published_at: newChannelUrl.trim() ? now : null,
        connection_payload: {},
        created_at: now,
        updated_at: now,
      } as any);

    if (error) {
      setErrorMessage(`The publication channel could not be added. ${error.message}`);
      setWorkingAction(null);
      return;
    }

    await recordActivity("vacancy_publication_channel_added", `Publication channel added: ${newChannelName.trim()}.`);
    setNewChannelName("");
    setNewChannelType("manual");
    setNewChannelUrl("");
    setActionMessage("Publication channel added.");
    setWorkingAction(null);
    await loadWorkspace(true);
  }, [canManage, loadWorkspace, newChannelName, newChannelType, newChannelUrl, recordActivity, vacancy]);

  const updateChannelStatus = useCallback(async (channel: PublicationChannel, status: string) => {
    if (!canManage) return;
    setWorkingAction(`channel-${channel.id}`);
    setErrorMessage("");
    const now = todayIso();
    const { error } = await supabase
      .from("leo_talent_vacancy_publication_channels")
      .update({
        status,
        published_at: status === "published" ? channel.published_at ?? now : channel.published_at,
        closed_at: status === "closed" ? now : null,
        updated_at: now,
      })
      .eq("id", channel.id);

    if (error) {
      setErrorMessage(`The channel could not be updated. ${error.message}`);
      setWorkingAction(null);
      return;
    }
    await recordActivity("vacancy_publication_channel_updated", `${channel.channel_name} marked ${humanise(status)}.`);
    setWorkingAction(null);
    await loadWorkspace(true);
  }, [canManage, loadWorkspace, recordActivity]);

  const addVacancyQuestion = useCallback(async () => {
    if (!vacancy || !canManage || !questionText.trim()) {
      setErrorMessage("Enter the application question.");
      return;
    }

        setWorkingAction("add-vacancy-question");
    setErrorMessage("");

    const now = todayIso();

    const { error } = await (supabase as any)
      .from("leo_talent_vacancy_questions")
      .insert({
        organisation_id: vacancy.organisation_id,
        vacancy_id: vacancy.id,
        question_text: questionText.trim(),
        help_text: questionHelpText.trim() || null,
        question_type: questionType,
        options: [],
        is_required: questionRequired,
        is_knockout: questionKnockout,
        knockout_rule: {},
        blind_review_excluded: false,
        display_order: vacancyQuestions.length,
        is_active: true,
        created_at: now,
        updated_at: now,
      } as any);

    if (error) {
      setErrorMessage(`The application question could not be added. ${error.message}`);
      setWorkingAction(null);
      return;
    }

    await recordActivity("vacancy_question_added", "Application question added.", { question: questionText.trim() });
    setQuestionText("");
    setQuestionHelpText("");
    setQuestionType("long_text");
    setQuestionRequired(false);
    setQuestionKnockout(false);
    setActionMessage("Application question added.");
    setWorkingAction(null);
    await loadWorkspace(true);
  }, [canManage, loadWorkspace, questionHelpText, questionKnockout, questionRequired, questionText, questionType, recordActivity, vacancy, vacancyQuestions.length]);

  const toggleVacancyQuestion = useCallback(async (question: VacancyQuestion, updates: Partial<VacancyQuestion>) => {
    if (!canManage) return;
    setWorkingAction(`question-${question.id}`);
    setErrorMessage("");
        const { error } = await (supabase as any)
      .from("leo_talent_vacancy_questions")
      .update({
        ...updates,
        updated_at: todayIso(),
      } as any)
      .eq("id", question.id);

    if (error) {
      setErrorMessage(`The application question could not be updated. ${error.message}`);
      setWorkingAction(null);
      return;
    }
    setWorkingAction(null);
    await loadWorkspace(true);
  }, [canManage, loadWorkspace]);

  const deleteVacancyQuestion = useCallback(async (question: VacancyQuestion) => {
    if (!canManage || !window.confirm("Delete this application question?")) return;
    setWorkingAction(`question-${question.id}`);
    const { error } = await supabase
      .from("leo_talent_vacancy_questions")
      .delete()
      .eq("id", question.id);
    if (error) {
      setErrorMessage(`The application question could not be deleted. ${error.message}`);
      setWorkingAction(null);
      return;
    }
    await recordActivity("vacancy_question_deleted", "Application question deleted.", { question: question.question_text });
    setWorkingAction(null);
    await loadWorkspace(true);
  }, [canManage, loadWorkspace, recordActivity]);

  const updateVacancyStatus = useCallback(
    async (
      nextStatus: VacancyStatus,
      nextApprovalStatus?: ApprovalStatus,
      confirmation?: string,
    ) => {
      if (!vacancy || !canManage) {
        setErrorMessage("You do not have access to update this vacancy.");
        return;
      }

      if (confirmation && !window.confirm(confirmation)) return;

      setWorkingAction(nextStatus);
      setErrorMessage("");
      setActionMessage("");

      const payload: Partial<Vacancy> = {
        status: nextStatus,
        updated_at: todayIso(),
      };

      if (nextApprovalStatus) payload.approval_status = nextApprovalStatus;
      if (nextStatus === "archived") payload.archived_at = todayIso();
      if (vacancy.status === "archived" && nextStatus !== "archived") {
        payload.archived_at = null;
      }

          const { error } = await (supabase as any)
      .from("leo_talent_vacancies")
      .update(payload as any)
      .eq("id", vacancy.id);

      if (error) {
        setErrorMessage(`The vacancy could not be updated. ${error.message}`);
        setWorkingAction(null);
        return;
      }

      const eventType = `vacancy_${nextStatus}`;
      await recordActivity(
        eventType,
        `Vacancy status changed to ${humanise(nextStatus)}.`,
        { previous_status: vacancy.status, new_status: nextStatus },
      );

      setActionMessage(`Vacancy updated to ${humanise(nextStatus)}.`);
      setWorkingAction(null);
      await loadWorkspace(true);
    },
    [canManage, loadWorkspace, recordActivity, vacancy],
  );

  const updateApproval = useCallback(
    async (approvalStatus: ApprovalStatus, status: VacancyStatus) => {
      if (!vacancy || !canAdminister) {
        setErrorMessage("Senior or Owner access is required to approve vacancies.");
        return;
      }

      setWorkingAction(`approval-${approvalStatus}`);
      setErrorMessage("");

      const { error } = await supabase
        .from("leo_talent_vacancies")
        .update({
          approval_status: approvalStatus,
          status,
          updated_at: todayIso(),
        })
        .eq("id", vacancy.id);

      if (error) {
        setErrorMessage(`Approval could not be recorded. ${error.message}`);
        setWorkingAction(null);
        return;
      }

      await recordActivity(
        `vacancy_approval_${approvalStatus}`,
        `Vacancy approval marked ${humanise(approvalStatus)}.`,
      );

      setActionMessage(`Approval marked ${humanise(approvalStatus)}.`);
      setWorkingAction(null);
      await loadWorkspace(true);
    },
    [canAdminister, loadWorkspace, recordActivity, vacancy],
  );

  const handleDelete = useCallback(async () => {
    if (!vacancy || !isOwner) {
      setErrorMessage("Only an Owner can permanently delete a vacancy.");
      return;
    }

    if (
      applications.length > 0 ||
      candidates.length > 0 ||
      interviews.length > 0 ||
      offers.length > 0
    ) {
      setErrorMessage(
        "This vacancy has connected recruitment records and cannot be deleted. Archive it instead.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Permanently delete this vacancy? This cannot be undone.",
    );
    if (!confirmed) return;

    setWorkingAction("delete");

    const { error } = await supabase
      .from("leo_talent_vacancies")
      .delete()
      .eq("id", vacancy.id);

    if (error) {
      setErrorMessage(`The vacancy could not be deleted. ${error.message}`);
      setWorkingAction(null);
      return;
    }

    router.push("/dashboard/leo-talent");
  }, [applications.length, candidates.length, interviews.length, isOwner, offers.length, router, vacancy]);

  const uploadDocument = useCallback(async () => {
    if (!vacancy || !documentFile || !documentTitle.trim()) {
      setErrorMessage("Add a document title and select a file.");
      return;
    }

    if (!canManage) {
      setErrorMessage("You do not have access to upload vacancy documents.");
      return;
    }

    setWorkingAction("upload-document");
    setErrorMessage("");
    setActionMessage("");

    const safeName = documentFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${vacancy.organisation_id ?? "organisation"}/${vacancy.id}/${Date.now()}-${safeName}`;

    const uploadResult = await supabase.storage
      .from("talent-documents")
      .upload(path, documentFile, { upsert: false });

    if (uploadResult.error) {
      setErrorMessage(`The file could not be uploaded. ${uploadResult.error.message}`);
      setWorkingAction(null);
      return;
    }

        const insertResult = await (supabase as any)
      .from("leo_talent_vacancy_documents")
      .insert({
        organisation_id: vacancy.organisation_id,
        vacancy_id: vacancy.id,
        title: documentTitle.trim(),
        document_type: documentType,
        file_name: documentFile.name,
        file_path: path,
        file_type: documentFile.type || null,
        notes: documentNotes.trim() || null,
        uploaded_by: userContext.userId,
        created_at: todayIso(),
        updated_at: todayIso(),
      } as any);

    if (insertResult.error) {
      await supabase.storage.from("talent-documents").remove([path]);
      setErrorMessage(
        `The document record could not be saved. ${insertResult.error.message}`,
      );
      setWorkingAction(null);
      return;
    }

    await recordActivity("vacancy_document_uploaded", `Document uploaded: ${documentTitle.trim()}.`);

    setDocumentTitle("");
    setDocumentType("Job description");
    setDocumentNotes("");
    setDocumentFile(null);
    setActionMessage("Document uploaded.");
    setWorkingAction(null);
    await loadWorkspace(true);
  }, [
    canManage,
    documentFile,
    documentNotes,
    documentTitle,
    documentType,
    loadWorkspace,
    recordActivity,
    userContext.userId,
    vacancy,
  ]);

  const openDocument = useCallback(async (document: TalentDocument) => {
    if (!document.file_path) {
      setErrorMessage("This document does not have a stored file path.");
      return;
    }

    const result = await supabase.storage
      .from("talent-documents")
      .createSignedUrl(document.file_path, 60);

    if (result.error || !result.data?.signedUrl) {
      setErrorMessage(
        `The document could not be opened. ${result.error?.message ?? ""}`,
      );
      return;
    }

    window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
  }, []);

  if (loading) {
    return (
      <main style={styles.page}>
        <StatePanel
          title="Loading vacancy workspace…"
          description="Leo is retrieving the vacancy and its connected recruitment records."
        />
      </main>
    );
  }

  if (!vacancy) {
    return (
      <main style={styles.page}>
        <StatePanel
          title="Vacancy unavailable"
          description={errorMessage || "This vacancy could not be found."}
          action={
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => router.push("/dashboard/leo-talent")}
            >
              Return to Leo Talent
            </button>
          }
        />
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.headerCard}>
        <div style={styles.headerMain}>
          <button
            type="button"
            style={styles.backButton}
            onClick={() => router.push("/dashboard/leo-talent")}
          >
            ← Back to Leo Talent
          </button>

          <div style={styles.headingRow}>
            <div>
              <p style={styles.eyebrow}>LEO TALENT · {vacancy.vacancy_reference}</p>
              <h1 style={styles.pageTitle}>{vacancy.title}</h1>
              <p style={styles.pageDescription}>
                {vacancy.department || "Department not set"} ·{" "}
                {vacancy.location_name || "Location not set"} ·{" "}
                {vacancy.employment_type}
              </p>
            </div>

            <div style={styles.statusStack}>
              <span style={styles.statusPill}>{humanise(vacancy.status)}</span>
              {vacancy.approval_status !== "not_required" ? (
                <span style={styles.approvalPill}>
                  Approval: {humanise(vacancy.approval_status)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => void loadWorkspace(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          {canManage && vacancy.status === "draft" ? (
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => void updateVacancyStatus("open", "approved")}
              disabled={workingAction !== null}
            >
              Open vacancy
            </button>
          ) : null}

          {canManage && vacancy.status === "paused" ? (
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => void updateVacancyStatus("open")}
              disabled={workingAction !== null}
            >
              Reopen vacancy
            </button>
          ) : null}
        </div>
      </header>

      {errorMessage ? (
        <div role="alert" style={styles.errorMessage}>
          {errorMessage}
        </div>
      ) : null}

      {actionMessage ? (
        <div role="status" style={styles.successMessage}>
          {actionMessage}
        </div>
      ) : null}

      <section style={styles.metrics}>
        <Metric label="Active applications" value={metrics.activeApplications} />
        <Metric label="Candidates" value={metrics.candidates} />
        <Metric label="Scheduled interviews" value={metrics.scheduledInterviews} />
        <Metric label="Outstanding checks" value={metrics.outstandingChecks} />
        <Metric label="Active offers" value={metrics.activeOffers} />
      </section>

      <nav style={styles.tabBar} aria-label="Vacancy workspace">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            style={activeTab === tab.id ? styles.tabActive : styles.tab}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm("");
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <OverviewTab vacancy={vacancy} canManage={canManage} onStatus={updateVacancyStatus} />
      ) : null}

      {activeTab === "publication" ? (
        <PublicationTab
          vacancy={vacancy}
          channels={publicationChannels}
          questions={vacancyQuestions}
          channelsAvailable={availability.publicationChannels}
          questionsAvailable={availability.vacancyQuestions}
          canManage={canManage}
          workingAction={workingAction}
          publicUrl={publicVacancyUrl || publicVacancyPath}
          newChannelName={newChannelName}
          newChannelType={newChannelType}
          newChannelUrl={newChannelUrl}
          questionText={questionText}
          questionHelpText={questionHelpText}
          questionType={questionType}
          questionRequired={questionRequired}
          questionKnockout={questionKnockout}
          onNewChannelName={setNewChannelName}
          onNewChannelType={setNewChannelType}
          onNewChannelUrl={setNewChannelUrl}
          onQuestionText={setQuestionText}
          onQuestionHelpText={setQuestionHelpText}
          onQuestionType={setQuestionType}
          onQuestionRequired={setQuestionRequired}
          onQuestionKnockout={setQuestionKnockout}
          onPublish={() => void publishVacancy()}
          onUnpublish={() => void unpublishVacancy()}
          onAddChannel={() => void addPublicationChannel()}
          onChannelStatus={(channel, status) => void updateChannelStatus(channel, status)}
          onAddQuestion={() => void addVacancyQuestion()}
          onQuestionUpdate={(question, updates) => void toggleVacancyQuestion(question, updates)}
          onQuestionDelete={(question) => void deleteVacancyQuestion(question)}
          onSettings={(updates, message) => void updatePublicationSettings(updates, message)}
        />
      ) : null}

      {activeTab === "applications" ? (
        <ApplicationsTab
          records={filteredApplications}
          allCount={applications.length}
          available={availability.applications}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          vacancyId={vacancy.id}
          router={router}
        />
      ) : null}

      {activeTab === "candidates" ? (
        <CandidatesTab
          records={filteredCandidates}
          allCount={candidates.length}
          available={availability.candidates}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          vacancyId={vacancy.id}
          router={router}
        />
      ) : null}

      {activeTab === "interviews" ? (
        <InterviewsTab
          records={interviews}
          available={availability.interviews}
          vacancyId={vacancy.id}
          router={router}
        />
      ) : null}

      {activeTab === "due_diligence" ? (
        <DueDiligenceTab
          vacancy={vacancy}
          records={dueDiligence}
          available={availability.dueDiligence}
          vacancyId={vacancy.id}
          router={router}
        />
      ) : null}

      {activeTab === "offers" ? (
        <OffersTab
          records={offers}
          available={availability.offers}
          vacancyId={vacancy.id}
          router={router}
        />
      ) : null}

      {activeTab === "documents" ? (
        <DocumentsTab
          records={documents}
          available={availability.documents}
          canManage={canManage}
          documentTitle={documentTitle}
          documentType={documentType}
          documentNotes={documentNotes}
          onTitle={setDocumentTitle}
          onType={setDocumentType}
          onNotes={setDocumentNotes}
          onFile={setDocumentFile}
          onUpload={() => void uploadDocument()}
          onOpen={(document) => void openDocument(document)}
          uploading={workingAction === "upload-document"}
        />
      ) : null}

      {activeTab === "activity" ? (
        <ActivityTab records={activity} available={availability.activity} />
      ) : null}

      {activeTab === "settings" ? (
        <SettingsTab
          vacancy={vacancy}
          canManage={canManage}
          canAdminister={canAdminister}
          isOwner={isOwner}
          workingAction={workingAction}
          onStatus={updateVacancyStatus}
          onApproval={updateApproval}
          onDelete={() => void handleDelete()}
        />
      ) : null}
    </main>
  );
}

function OverviewTab({
  vacancy,
  canManage,
  onStatus,
}: {
  vacancy: Vacancy;
  canManage: boolean;
  onStatus: (
    status: VacancyStatus,
    approval?: ApprovalStatus,
    confirmation?: string,
  ) => Promise<void>;
}) {
  return (
    <div style={styles.contentGrid}>
      <section style={styles.panel}>
        <SectionHeading
          title="Vacancy Overview"
          description="The core employment and campaign details for this vacancy."
        />

        <div style={styles.detailGrid}>
          <Detail label="Vacancy reference" value={vacancy.vacancy_reference} />
          <Detail label="Department" value={vacancy.department || "Not set"} />
          <Detail label="Location" value={vacancy.location_name || "Not set"} />
          <Detail
            label="Hiring manager"
            value={vacancy.hiring_manager_name || "Not set"}
          />
          <Detail
            label="Recruitment lead"
            value={vacancy.recruitment_lead_name || "Not set"}
          />
          <Detail label="Employment type" value={vacancy.employment_type} />
          <Detail label="Working pattern" value={vacancy.work_pattern || "Not set"} />
          <Detail
            label="Hours per week"
            value={
              vacancy.hours_per_week !== null
                ? `${vacancy.hours_per_week} hours`
                : "Not set"
            }
          />
          <Detail
            label="Salary"
            value={
              vacancy.salary_visible
                ? formatSalary(
                    vacancy.salary_min,
                    vacancy.salary_max,
                    vacancy.salary_currency,
                    vacancy.salary_period,
                  )
                : "Not displayed"
            }
          />
          <Detail
            label="Positions"
            value={String(vacancy.number_of_positions)}
          />
          <Detail label="Opening date" value={formatDate(vacancy.opening_date)} />
          <Detail label="Closing date" value={formatDate(vacancy.closing_date)} />
          <Detail
            label="Target start date"
            value={formatDate(vacancy.target_start_date)}
          />
        </div>
      </section>

      <aside style={styles.sideColumn}>
        <section style={styles.panel}>
          <SectionHeading
            title="Recruitment Controls"
            description="Controls applied to applications and review."
          />

          <ControlLine
            label="Internal-only vacancy"
            enabled={vacancy.is_internal_only}
          />
          <ControlLine
            label="Accept internal candidates"
            enabled={vacancy.accepts_internal_candidates}
          />
          <ControlLine
            label="Blind review"
            enabled={vacancy.blind_review_enabled}
          />
          <ControlLine
            label="AI-assisted screening"
            enabled={vacancy.ai_screening_enabled}
          />
        </section>

        <section style={styles.panel}>
          <SectionHeading
            title="Due Diligence Requirements"
            description="Checks expected before appointment."
          />

          <ControlLine
            label="Due Diligence workflow"
            enabled={vacancy.safer_recruitment_required}
          />
          <ControlLine label="Regulated role" enabled={vacancy.regulated_role} />
          <ControlLine label="DBS" enabled={vacancy.requires_dbs} />
          <ControlLine label="Driving checks" enabled={vacancy.requires_driving} />
          <ControlLine
            label="Qualification checks"
            enabled={vacancy.requires_qualification_checks}
          />
          <Detail
            label="References required"
            value={String(vacancy.required_reference_count)}
          />
        </section>

        {canManage &&
        ["open", "approved", "approval_required"].includes(vacancy.status) ? (
          <section style={styles.panel}>
            <SectionHeading
              title="Campaign Control"
              description="Temporarily stop or close the recruitment campaign."
            />

            <div style={styles.buttonColumn}>
              {vacancy.status === "open" ? (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() =>
                    void onStatus(
                      "paused",
                      undefined,
                      "Pause this vacancy? Applications already received will remain available.",
                    )
                  }
                >
                  Pause vacancy
                </button>
              ) : null}

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() =>
                  void onStatus(
                    "closed",
                    undefined,
                    "Close this vacancy to new applications?",
                  )
                }
              >
                Close vacancy
              </button>
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function PublicationTab({
  vacancy,
  channels,
  questions,
  channelsAvailable,
  questionsAvailable,
  canManage,
  workingAction,
  publicUrl,
  newChannelName,
  newChannelType,
  newChannelUrl,
  questionText,
  questionHelpText,
  questionType,
  questionRequired,
  questionKnockout,
  onNewChannelName,
  onNewChannelType,
  onNewChannelUrl,
  onQuestionText,
  onQuestionHelpText,
  onQuestionType,
  onQuestionRequired,
  onQuestionKnockout,
  onPublish,
  onUnpublish,
  onAddChannel,
  onChannelStatus,
  onAddQuestion,
  onQuestionUpdate,
  onQuestionDelete,
  onSettings,
}: {
  vacancy: Vacancy;
  channels: PublicationChannel[];
  questions: VacancyQuestion[];
  channelsAvailable: boolean;
  questionsAvailable: boolean;
  canManage: boolean;
  workingAction: string | null;
  publicUrl: string;
  newChannelName: string;
  newChannelType: string;
  newChannelUrl: string;
  questionText: string;
  questionHelpText: string;
  questionType: string;
  questionRequired: boolean;
  questionKnockout: boolean;
  onNewChannelName: (value: string) => void;
  onNewChannelType: (value: string) => void;
  onNewChannelUrl: (value: string) => void;
  onQuestionText: (value: string) => void;
  onQuestionHelpText: (value: string) => void;
  onQuestionType: (value: string) => void;
  onQuestionRequired: (value: boolean) => void;
  onQuestionKnockout: (value: boolean) => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onAddChannel: () => void;
  onChannelStatus: (channel: PublicationChannel, status: string) => void;
  onAddQuestion: () => void;
  onQuestionUpdate: (question: VacancyQuestion, updates: Partial<VacancyQuestion>) => void;
  onQuestionDelete: (question: VacancyQuestion) => void;
  onSettings: (updates: Record<string, unknown>, message: string) => void;
}) {
  const metadata = vacancy.metadata ?? {};
  const published = vacancy.status === "open" && Boolean(vacancy.published_at);
  const liveChannels = channels.filter((channel) => channel.status === "published").length;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      window.prompt("Copy this public vacancy link:", publicUrl);
    }
  };

  return (
    <div style={styles.settingsGrid}>
      <section style={styles.publicationHero}>
        <div>
          <p style={styles.eyebrow}>VACANCY PUBLICATION</p>
          <h2 style={styles.publicationTitle}>
            {published ? "This vacancy is live" : "Prepare and publish this vacancy"}
          </h2>
          <p style={styles.publicationDescription}>
            Control the public advert, application experience and every channel used to promote this role.
          </p>
        </div>
        <div style={styles.publicationHeroActions}>
          <span style={published ? styles.livePill : styles.draftPill}>
            {published ? `Live on ${liveChannels || 1} channel${liveChannels === 1 ? "" : "s"}` : humanise(vacancy.status)}
          </span>
          {canManage ? (
            published ? (
              <button type="button" style={styles.secondaryButton} onClick={onUnpublish} disabled={workingAction !== null}>
                {workingAction === "unpublish-vacancy" ? "Unpublishing…" : "Unpublish vacancy"}
              </button>
            ) : (
              <button type="button" style={styles.primaryButton} onClick={onPublish} disabled={workingAction !== null}>
                {workingAction === "publish-vacancy" ? "Publishing…" : "Publish vacancy"}
              </button>
            )
          ) : null}
        </div>
      </section>

      <div style={styles.contentGrid}>
        <section style={styles.panel}>
          <SectionHeading title="Public Vacancy" description="The candidate-facing link and core advert readiness." />
          <div style={styles.readinessGrid}>
            <ReadinessItem label="Vacancy title" ready={Boolean(vacancy.title.trim())} />
            <ReadinessItem label="Advert text" ready={Boolean(vacancy.advert_text?.trim())} />
            <ReadinessItem label="Closing date" ready={Boolean(vacancy.closing_date)} />
            <ReadinessItem label="Application questions" ready={questions.length > 0} optional />
          </div>
          <div style={styles.publicLinkBox}>
            <div style={{ minWidth: 0 }}>
              <span style={styles.detailLabel}>Public URL</span>
              <div style={styles.publicLinkText}>{publicUrl}</div>
            </div>
            <div style={styles.buttonRow}>
              <button type="button" style={styles.secondaryButton} onClick={() => void copyLink()}>Copy link</button>
              <button type="button" style={styles.secondaryButton} onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}>Preview</button>
            </div>
          </div>
          <div style={styles.detailGrid}>
            <Detail label="Published" value={formatDate(vacancy.published_at, true)} />
            <Detail label="Applications open" value={formatDate(vacancy.opening_date)} />
            <Detail label="Closing date" value={formatDate(vacancy.closing_date)} />
            <Detail label="Visibility" value={vacancy.is_internal_only ? "Internal only" : "Public"} />
          </div>
        </section>

        <aside style={styles.sideColumn}>
          <section style={styles.panel}>
            <SectionHeading title="Candidate Experience" description="Set what applicants must provide." />
            <ToggleSetting
              label="Accept online applications"
              description="Allow candidates to apply through the public vacancy page."
              checked={metadata.accept_online_applications !== false}
              disabled={!canManage || workingAction !== null}
              onChange={(checked) => onSettings({ accept_online_applications: checked }, "Online application setting updated.")}
            />
            <ToggleSetting
              label="Require CV"
              description="Candidates must upload a current CV before submission."
              checked={metadata.require_cv === true}
              disabled={!canManage || workingAction !== null}
              onChange={(checked) => onSettings({ require_cv: checked }, "CV requirement updated.")}
            />
            <ToggleSetting
              label="Require cover letter"
              description="Candidates must provide a supporting statement or cover letter."
              checked={metadata.require_cover_letter === true}
              disabled={!canManage || workingAction !== null}
              onChange={(checked) => onSettings({ require_cover_letter: checked }, "Cover letter requirement updated.")}
            />
            <ToggleSetting
              label="Automatic acknowledgement"
              description="Prepare an acknowledgement when an application is submitted."
              checked={metadata.automatic_acknowledgement !== false}
              disabled={!canManage || workingAction !== null}
              onChange={(checked) => onSettings({ automatic_acknowledgement: checked }, "Acknowledgement setting updated.")}
            />
          </section>
        </aside>
      </div>

      <section style={styles.panel}>
        <SectionHeading title="Publication Channels" description="Track every place where this vacancy is planned, published, paused or closed." />
        {!channelsAvailable ? (
          <UnavailableState table="leo_talent_vacancy_publication_channels" />
        ) : (
          <>
            {channels.length === 0 ? (
              <EmptyState title="No publication channels" description="Publish to LEO Careers or add an external channel below." />
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Channel</th><th style={styles.th}>Type</th><th style={styles.th}>Status</th><th style={styles.th}>Published</th><th style={styles.th}>Link</th><th style={styles.th}>Action</th></tr></thead>
                  <tbody>
                    {channels.map((channel) => (
                      <tr key={channel.id}>
                        <td style={styles.td}><strong>{channel.channel_name}</strong></td>
                        <td style={styles.td}>{humanise(channel.channel_type)}</td>
                        <td style={styles.td}><span style={styles.inlinePill}>{humanise(channel.status)}</span></td>
                        <td style={styles.td}>{formatDate(channel.published_at, true)}</td>
                        <td style={styles.td}>{channel.published_url ? <button type="button" style={styles.linkButton} onClick={() => window.open(channel.published_url || "", "_blank", "noopener,noreferrer")}>Open link</button> : "Not recorded"}</td>
                        <td style={styles.td}>
                          {canManage ? (
                            <select value={channel.status} onChange={(event) => onChannelStatus(channel, event.target.value)} style={styles.compactSelect} disabled={workingAction !== null}>
                              <option value="planned">Planned</option><option value="published">Published</option><option value="paused">Paused</option><option value="closed">Closed</option>
                            </select>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {canManage ? (
              <div style={styles.inlineFormGrid}>
                <FieldLabel label="Channel name"><input value={newChannelName} onChange={(event) => onNewChannelName(event.target.value)} style={styles.input} placeholder="e.g. LinkedIn" /></FieldLabel>
                <FieldLabel label="Channel type"><select value={newChannelType} onChange={(event) => onNewChannelType(event.target.value)} style={styles.input}><option value="manual">Manual</option><option value="job_board">Job board</option><option value="company_website">Company website</option><option value="social">Social media</option><option value="connection">Connection</option></select></FieldLabel>
                <FieldLabel label="Published URL"><input value={newChannelUrl} onChange={(event) => onNewChannelUrl(event.target.value)} style={styles.input} placeholder="Optional" /></FieldLabel>
                <button type="button" style={styles.primaryButton} onClick={onAddChannel} disabled={workingAction !== null}>{workingAction === "add-publication-channel" ? "Adding…" : "Add channel"}</button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section style={styles.panel}>
        <SectionHeading title="Application Questions" description="Build the vacancy-specific questions candidates complete when they apply." />
        {!questionsAvailable ? (
          <UnavailableState table="leo_talent_vacancy_questions" />
        ) : (
          <div style={styles.questionLayout}>
            <div>
              {questions.length === 0 ? <EmptyState title="No custom questions" description="Candidates will complete only the standard application fields until questions are added." /> : (
                <div style={styles.cardList}>
                  {questions.map((question, index) => (
                    <article key={question.id} style={styles.questionCard}>
                      <div style={styles.questionNumber}>{index + 1}</div>
                      <div style={{ flex: "1 1 360px" }}>
                        <h3 style={styles.listCardTitle}>{question.question_text}</h3>
                        <p style={styles.listCardText}>{humanise(question.question_type)}{question.help_text ? ` · ${question.help_text}` : ""}</p>
                        <div style={styles.questionFlags}>
                          {question.is_required ? <span style={styles.inlinePill}>Required</span> : null}
                          {question.is_knockout ? <span style={styles.warningPill}>Knockout</span> : null}
                          {!question.is_active ? <span style={styles.disabledPill}>Inactive</span> : null}
                        </div>
                      </div>
                      {canManage ? (
                        <div style={styles.listCardActions}>
                          <button type="button" style={styles.linkButton} onClick={() => onQuestionUpdate(question, { is_active: !question.is_active })} disabled={workingAction !== null}>{question.is_active ? "Deactivate" : "Activate"}</button>
                          <button type="button" style={styles.deleteLinkButton} onClick={() => onQuestionDelete(question)} disabled={workingAction !== null}>Delete</button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
            {canManage ? (
              <aside style={styles.questionBuilder}>
                <h3 style={styles.listCardTitle}>Add a question</h3>
                <div style={styles.formStack}>
                  <FieldLabel label="Question"><textarea value={questionText} onChange={(event) => onQuestionText(event.target.value)} style={styles.textarea} rows={3} /></FieldLabel>
                  <FieldLabel label="Help text"><input value={questionHelpText} onChange={(event) => onQuestionHelpText(event.target.value)} style={styles.input} placeholder="Optional guidance" /></FieldLabel>
                  <FieldLabel label="Answer type"><select value={questionType} onChange={(event) => onQuestionType(event.target.value)} style={styles.input}><option value="long_text">Long text</option><option value="short_text">Short text</option><option value="yes_no">Yes / No</option><option value="number">Number</option><option value="date">Date</option><option value="file">File upload</option></select></FieldLabel>
                  <label style={styles.checkboxLine}><input type="checkbox" checked={questionRequired} onChange={(event) => onQuestionRequired(event.target.checked)} /> Required question</label>
                  <label style={styles.checkboxLine}><input type="checkbox" checked={questionKnockout} onChange={(event) => onQuestionKnockout(event.target.checked)} /> Knockout question</label>
                  <button type="button" style={styles.primaryButton} onClick={onAddQuestion} disabled={workingAction !== null}>{workingAction === "add-vacancy-question" ? "Adding…" : "Add question"}</button>
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function ReadinessItem({ label, ready, optional = false }: { label: string; ready: boolean; optional?: boolean }) {
  return <div style={styles.readinessItem}><span style={ready ? styles.readinessReady : styles.readinessMissing}>{ready ? "✓" : "!"}</span><span>{label}{optional ? " (optional)" : ""}</span></div>;
}

function ToggleSetting({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return <label style={styles.toggleSetting}><div><div style={styles.toggleLabel}>{label}</div><div style={styles.toggleDescription}>{description}</div></div><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /></label>;
}

function ApplicationsTab({
  records,
  allCount,
  available,
  searchTerm,
  onSearch,
  vacancyId,
  router,
}: {
  records: Application[];
  allCount: number;
  available: boolean;
  searchTerm: string;
  onSearch: (value: string) => void;
  vacancyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <section style={styles.panel}>
      <SectionHeading
        title="Applications"
        description="Review every application connected to this vacancy."
        action={
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              router.push(
                `/dashboard/leo-talent/applications/create?vacancyId=${vacancyId}`,
              )
            }
          >
            Add application
          </button>
        }
      />

      {!available ? (
        <UnavailableState table="leo_talent_applications" />
      ) : (
        <>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search applications"
            style={styles.searchInput}
          />

          {records.length === 0 ? (
            <EmptyState
              title={allCount === 0 ? "No applications yet" : "No applications match"}
              description={
                allCount === 0
                  ? "Applications linked to this vacancy will appear here."
                  : "Try changing the search term."
              }
            />
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Candidate</th>
                    <th style={styles.th}>Reference</th>
                    <th style={styles.th}>Stage</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Submitted</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td style={styles.td}>
                        <strong>{applicationDisplayName(record)}</strong>
                        {record.candidate_email ? (
                          <div style={styles.muted}>{record.candidate_email}</div>
                        ) : null}
                      </td>
                      <td style={styles.td}>
                        {record.application_reference || "Not set"}
                      </td>
                      <td style={styles.td}>{humanise(record.stage)}</td>
                      <td style={styles.td}>
                        <span style={styles.inlinePill}>{humanise(record.status)}</span>
                      </td>
                      <td style={styles.td}>
                        {formatDate(record.submitted_at || record.created_at)}
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.linkButton}
                          onClick={() =>
                            router.push(
                              `/dashboard/leo-talent/applications/${record.id}`,
                            )
                          }
                        >
                          Open application
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CandidatesTab({
  records,
  allCount,
  available,
  searchTerm,
  onSearch,
  vacancyId,
  router,
}: {
  records: Candidate[];
  allCount: number;
  available: boolean;
  searchTerm: string;
  onSearch: (value: string) => void;
  vacancyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <section style={styles.panel}>
      <SectionHeading
        title="Candidates"
        description="Candidate records connected to this vacancy."
        action={
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              router.push(`/dashboard/leo-talent/candidates/create?vacancyId=${vacancyId}`)
            }
          >
            Add candidate
          </button>
        }
      />

      {!available ? (
        <UnavailableState table="leo_talent_candidates" />
      ) : (
        <>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search candidates"
            style={styles.searchInput}
          />

          {records.length === 0 ? (
            <EmptyState
              title={allCount === 0 ? "No candidates yet" : "No candidates match"}
              description={
                allCount === 0
                  ? "Candidate records linked to this vacancy will appear here."
                  : "Try changing the search term."
              }
            />
          ) : (
            <div style={styles.cardList}>
              {records.map((record) => (
                <article key={record.id} style={styles.listCard}>
                  <div>
                    <h3 style={styles.listCardTitle}>
                      {candidateDisplayName(record)}
                    </h3>
                    <p style={styles.listCardText}>
                      {record.email || "Email not recorded"}
                      {(record.telephone || record.phone)
                        ? ` · ${record.telephone || record.phone}`
                        : ""}
                    </p>
                  </div>

                  <div style={styles.listCardActions}>
                    <span style={styles.inlinePill}>
                      {humanise(record.current_stage || record.status)}
                    </span>
                    <button
                      type="button"
                      style={styles.linkButton}
                      onClick={() =>
                        router.push(`/dashboard/leo-talent/candidates/${record.id}`)
                      }
                    >
                      Open candidate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function InterviewsTab({
  records,
  available,
  vacancyId,
  router,
}: {
  records: Interview[];
  available: boolean;
  vacancyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <section style={styles.panel}>
      <SectionHeading
        title="Interviews"
        description="Plan interviews, record outcomes and keep the selection process connected."
        action={
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              router.push(`/dashboard/leo-talent/interviews/create?vacancyId=${vacancyId}`)
            }
          >
            Schedule interview
          </button>
        }
      />

      {!available ? (
        <UnavailableState table="leo_talent_interviews" />
      ) : records.length === 0 ? (
        <EmptyState
          title="No interviews scheduled"
          description="Interviews linked to this vacancy will appear here."
        />
      ) : (
        <div style={styles.cardList}>
          {records.map((record) => (
            <article key={record.id} style={styles.listCard}>
              <div>
                <h3 style={styles.listCardTitle}>
                  {record.candidate_name || "Candidate interview"}
                </h3>
                <p style={styles.listCardText}>
                  {humanise(record.interview_type)} ·{" "}
                  {formatDate(record.scheduled_at || record.start_time, true)}
                  {record.location ? ` · ${record.location}` : ""}
                </p>
              </div>

              <div style={styles.listCardActions}>
                <span style={styles.inlinePill}>
                  {humanise(record.outcome || record.status)}
                </span>
                <button
                  type="button"
                  style={styles.linkButton}
                  onClick={() =>
                    router.push(`/dashboard/leo-talent/interviews/${record.id}`)
                  }
                >
                  Open interview
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DueDiligenceTab({
  vacancy,
  records,
  available,
  vacancyId,
  router,
}: {
  vacancy: Vacancy;
  records: DueDiligenceRecord[];
  available: boolean;
  vacancyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const requiredChecks = [
    vacancy.safer_recruitment_required ? "Standard Due Diligence" : null,
    vacancy.required_reference_count > 0
      ? `${vacancy.required_reference_count} reference${
          vacancy.required_reference_count === 1 ? "" : "s"
        }`
      : null,
    vacancy.requires_dbs ? "DBS" : null,
    vacancy.requires_driving ? "Driving checks" : null,
    vacancy.requires_qualification_checks ? "Qualification verification" : null,
    vacancy.regulated_role ? "Regulated role controls" : null,
  ].filter(Boolean);

  return (
    <div style={styles.contentGrid}>
      <section style={styles.panel}>
        <SectionHeading
          title="Due Diligence Register"
          description="Track the checks required before a candidate can be appointed."
          action={
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() =>
                router.push(
                  `/dashboard/leo-talent/due-diligence/create?vacancyId=${vacancyId}`,
                )
              }
            >
              Add check
            </button>
          }
        />

        {!available ? (
          <UnavailableState table="leo_talent_due_diligence" />
        ) : records.length === 0 ? (
          <EmptyState
            title="No checks recorded"
            description="Candidate Due Diligence records will appear here."
          />
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Candidate</th>
                  <th style={styles.th}>Check</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Completed</th>
                  <th style={styles.th}>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td style={styles.td}>
                      {record.candidate_name || "Candidate"}
                    </td>
                    <td style={styles.td}>{humanise(record.check_type)}</td>
                    <td style={styles.td}>
                      <span style={styles.inlinePill}>
                        {humanise(record.status)}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(record.completed_at)}</td>
                    <td style={styles.td}>{formatDate(record.expiry_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside style={styles.sideColumn}>
        <section style={styles.panel}>
          <SectionHeading
            title="Required for This Vacancy"
            description="Controls set when the vacancy was created."
          />

          {requiredChecks.length === 0 ? (
            <p style={styles.muted}>No enhanced checks have been selected.</p>
          ) : (
            <div style={styles.checkList}>
              {requiredChecks.map((item) => (
                <div key={item} style={styles.checkItem}>
                  <span style={styles.checkIcon}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}

function OffersTab({
  records,
  available,
  vacancyId,
  router,
}: {
  records: Offer[];
  available: boolean;
  vacancyId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <section style={styles.panel}>
      <SectionHeading
        title="Offers & Appointments"
        description="Issue offers, record responses and convert accepted candidates into employees."
        action={
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              router.push(`/dashboard/leo-talent/offers/create?vacancyId=${vacancyId}`)
            }
          >
            Create offer
          </button>
        }
      />

      {!available ? (
        <UnavailableState table="leo_talent_offers" />
      ) : records.length === 0 ? (
        <EmptyState
          title="No offers created"
          description="Offers connected to this vacancy will appear here."
        />
      ) : (
        <div style={styles.cardList}>
          {records.map((record) => (
            <article key={record.id} style={styles.listCard}>
              <div>
                <h3 style={styles.listCardTitle}>
                  {record.candidate_name || "Candidate offer"}
                </h3>
                <p style={styles.listCardText}>
                  {record.offered_salary !== null &&
                  record.offered_salary !== undefined
                    ? formatSalary(
                        record.offered_salary,
                        record.offered_salary,
                        record.salary_currency || "GBP",
                        record.salary_period,
                      )
                    : "Salary not recorded"}
                  {" · "}
                  Start {formatDate(record.proposed_start_date)}
                </p>
              </div>

              <div style={styles.listCardActions}>
                <span style={styles.inlinePill}>{humanise(record.status)}</span>
                <button
                  type="button"
                  style={styles.linkButton}
                  onClick={() =>
                    router.push(`/dashboard/leo-talent/offers/${record.id}`)
                  }
                >
                  Open offer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DocumentsTab({
  records,
  available,
  canManage,
  documentTitle,
  documentType,
  documentNotes,
  onTitle,
  onType,
  onNotes,
  onFile,
  onUpload,
  onOpen,
  uploading,
}: {
  records: TalentDocument[];
  available: boolean;
  canManage: boolean;
  documentTitle: string;
  documentType: string;
  documentNotes: string;
  onTitle: (value: string) => void;
  onType: (value: string) => void;
  onNotes: (value: string) => void;
  onFile: (file: File | null) => void;
  onUpload: () => void;
  onOpen: (document: TalentDocument) => void;
  uploading: boolean;
}) {
  return (
    <div style={styles.contentGrid}>
      <section style={styles.panel}>
        <SectionHeading
          title="Vacancy Documents"
          description="Store job descriptions, adverts, selection materials and appointment documents."
        />

        {!available ? (
          <UnavailableState table="leo_talent_vacancy_documents" />
        ) : records.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
            description="Documents attached to this vacancy will appear here."
          />
        ) : (
          <div style={styles.cardList}>
            {records.map((record) => (
              <article key={record.id} style={styles.listCard}>
                <div>
                  <h3 style={styles.listCardTitle}>
                    {record.title || record.file_name || "Vacancy document"}
                  </h3>
                  <p style={styles.listCardText}>
                    {record.document_type || "Document"} ·{" "}
                    {formatDate(record.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  style={styles.linkButton}
                  onClick={() => onOpen(record)}
                >
                  Open document
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {canManage ? (
        <aside style={styles.sideColumn}>
          <section style={styles.panel}>
            <SectionHeading
              title="Upload Document"
              description="Add a file to the vacancy record."
            />

            <div style={styles.formStack}>
              <FieldLabel label="Document title">
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(event) => onTitle(event.target.value)}
                  style={styles.input}
                />
              </FieldLabel>

              <FieldLabel label="Document type">
                <select
                  value={documentType}
                  onChange={(event) => onType(event.target.value)}
                  style={styles.input}
                >
                  <option>Job description</option>
                  <option>Person specification</option>
                  <option>Job advert</option>
                  <option>Interview pack</option>
                  <option>Scoring matrix</option>
                  <option>Approval record</option>
                  <option>Offer document</option>
                  <option>Appointment document</option>
                  <option>Other</option>
                </select>
              </FieldLabel>

              <FieldLabel label="File">
                <input
                  type="file"
                  onChange={(event) => onFile(event.target.files?.[0] ?? null)}
                  style={styles.fileInput}
                />
              </FieldLabel>

              <FieldLabel label="Notes">
                <textarea
                  value={documentNotes}
                  onChange={(event) => onNotes(event.target.value)}
                  style={styles.textarea}
                  rows={3}
                />
              </FieldLabel>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={onUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Upload document"}
              </button>
            </div>
          </section>
        </aside>
      ) : null}
    </div>
  );
}

function ActivityTab({
  records,
  available,
}: {
  records: ActivityEvent[];
  available: boolean;
}) {
  return (
    <section style={styles.panel}>
      <SectionHeading
        title="Vacancy Activity"
        description="A chronological record of important actions and status changes."
      />

      {!available ? (
        <UnavailableState table="talent_analytics_events" />
      ) : records.length === 0 ? (
        <EmptyState
          title="No activity recorded"
          description="Audit events for this vacancy will appear here."
        />
      ) : (
        <div style={styles.timeline}>
          {records.map((record) => (
            <article key={record.id} style={styles.timelineItem}>
              <div style={styles.timelineMarker}>✦</div>
              <div>
                <h3 style={styles.timelineTitle}>
                  {humanise(record.event_type || record.action)}
                </h3>
                <p style={styles.timelineText}>
                  {record.description ||
                    (record.metadata
                      ? JSON.stringify(record.metadata)
                      : "Vacancy activity recorded.")}
                </p>
                <p style={styles.timelineDate}>
                  {formatDate(record.created_at, true)}
                  {record.actor_name ? ` · ${record.actor_name}` : ""}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsTab({
  vacancy,
  canManage,
  canAdminister,
  isOwner,
  workingAction,
  onStatus,
  onApproval,
  onDelete,
}: {
  vacancy: Vacancy;
  canManage: boolean;
  canAdminister: boolean;
  isOwner: boolean;
  workingAction: string | null;
  onStatus: (
    status: VacancyStatus,
    approval?: ApprovalStatus,
    confirmation?: string,
  ) => Promise<void>;
  onApproval: (approval: ApprovalStatus, status: VacancyStatus) => Promise<void>;
  onDelete: () => void;
}) {
  return (
    <div style={styles.settingsGrid}>
      <section style={styles.panel}>
        <SectionHeading
          title="Vacancy Status"
          description="Control the vacancy lifecycle without losing recruitment records."
        />

        {!canManage ? (
          <p style={styles.muted}>
            Manager, Senior or Owner access is required to change vacancy status.
          </p>
        ) : (
          <div style={styles.settingsActions}>
            {vacancy.status === "open" ? (
              <ActionCard
                title="Pause vacancy"
                description="Temporarily stop the campaign while retaining applications."
                button="Pause"
                onClick={() =>
                  void onStatus(
                    "paused",
                    undefined,
                    "Pause this vacancy?",
                  )
                }
                disabled={workingAction !== null}
              />
            ) : null}

            {["draft", "approved", "paused", "closed"].includes(vacancy.status) ? (
              <ActionCard
                title="Open vacancy"
                description="Make the vacancy available for applications."
                button="Open"
                onClick={() => void onStatus("open", "approved")}
                disabled={workingAction !== null}
              />
            ) : null}

            {!["filled", "cancelled", "archived"].includes(vacancy.status) ? (
              <ActionCard
                title="Mark filled"
                description="Record that the required appointment has been made."
                button="Mark filled"
                onClick={() =>
                  void onStatus(
                    "filled",
                    undefined,
                    "Mark this vacancy as filled?",
                  )
                }
                disabled={workingAction !== null}
              />
            ) : null}

            {!["cancelled", "archived"].includes(vacancy.status) ? (
              <ActionCard
                title="Cancel vacancy"
                description="End the campaign without making an appointment."
                button="Cancel vacancy"
                onClick={() =>
                  void onStatus(
                    "cancelled",
                    undefined,
                    "Cancel this vacancy? Existing records will be retained.",
                  )
                }
                disabled={workingAction !== null}
              />
            ) : null}

            {vacancy.status !== "archived" ? (
              <ActionCard
                title="Archive vacancy"
                description="Remove the vacancy from current registers while retaining its history."
                button="Archive"
                onClick={() =>
                  void onStatus(
                    "archived",
                    undefined,
                    "Archive this vacancy?",
                  )
                }
                disabled={workingAction !== null}
              />
            ) : (
              <ActionCard
                title="Restore vacancy"
                description="Return this vacancy to the closed register."
                button="Restore"
                onClick={() => void onStatus("closed")}
                disabled={workingAction !== null}
              />
            )}
          </div>
        )}
      </section>

      <section style={styles.panel}>
        <SectionHeading
          title="Approval"
          description="Senior and Owner users can record the vacancy approval outcome."
        />

        {!canAdminister ? (
          <p style={styles.muted}>
            Senior or Owner access is required to approve or return vacancies.
          </p>
        ) : (
          <div style={styles.buttonRow}>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => void onApproval("approved", "approved")}
              disabled={workingAction !== null}
            >
              Approve vacancy
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => void onApproval("returned", "draft")}
              disabled={workingAction !== null}
            >
              Return for changes
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => void onApproval("declined", "cancelled")}
              disabled={workingAction !== null}
            >
              Decline vacancy
            </button>
          </div>
        )}
      </section>

      <section style={styles.dangerPanel}>
        <SectionHeading
          title="Permanent Deletion"
          description="Deleting a vacancy cannot be undone and is blocked when connected records exist."
        />

        {isOwner ? (
          <button
            type="button"
            style={styles.dangerButton}
            onClick={onDelete}
            disabled={workingAction !== null}
          >
            Permanently delete vacancy
          </button>
        ) : (
          <p style={styles.muted}>Only an Owner can permanently delete a vacancy.</p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article style={styles.metricCard}>
      <p style={styles.metricLabel}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
    </article>
  );
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div style={styles.sectionHeading}>
      <div>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={styles.sectionDescription}>{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detail}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

function ControlLine({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div style={styles.controlLine}>
      <span>{label}</span>
      <span style={enabled ? styles.enabledPill : styles.disabledPill}>
        {enabled ? "Enabled" : "Not required"}
      </span>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div style={styles.emptyState}>
      <h3 style={styles.emptyTitle}>{title}</h3>
      <p style={styles.emptyText}>{description}</p>
    </div>
  );
}

function UnavailableState({ table }: { table: string }) {
  return (
    <div style={styles.unavailableState}>
      <h3 style={styles.emptyTitle}>Workspace not connected yet</h3>
      <p style={styles.emptyText}>
        The <code>{table}</code> table is not available or cannot currently be read.
        The vacancy workspace will begin using it automatically once the table and
        permissions are in place.
      </p>
    </div>
  );
}

function StatePanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section style={styles.statePanel}>
      <h1 style={styles.stateTitle}>{title}</h1>
      <p style={styles.stateText}>{description}</p>
      {action ? <div style={{ marginTop: 18 }}>{action}</div> : null}
    </section>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function ActionCard({
  title,
  description,
  button,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  button: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <article style={styles.actionCard}>
      <div>
        <h3 style={styles.actionCardTitle}>{title}</h3>
        <p style={styles.actionCardText}>{description}</p>
      </div>
      <button
        type="button"
        style={styles.secondaryButton}
        onClick={onClick}
        disabled={disabled}
      >
        {button}
      </button>
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    maxWidth: "1500px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  headerCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
    padding: "24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  headerMain: {
    flex: "1 1 700px",
  },
  backButton: {
    border: 0,
    background: "transparent",
    color: "#6E5084",
    padding: 0,
    marginBottom: "16px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  headingRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: "0 0 7px",
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.07em",
  },
  pageTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "30px",
    lineHeight: 1.2,
  },
  pageDescription: {
    margin: "8px 0 0",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  statusStack: {
    display: "flex",
    alignItems: "flex-end",
    flexDirection: "column",
    gap: "7px",
  },
  statusPill: {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "#F1EAF6",
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 800,
  },
  approvalPill: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#F7F1FC",
    color: "#6B5875",
    fontSize: "11px",
    fontWeight: 700,
  },
  headerActions: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    flexWrap: "wrap",
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "12px",
  },
  metricCard: {
    padding: "17px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "14px",
  },
  metricLabel: {
    margin: 0,
    color: "#6B7280",
    fontSize: "12px",
    fontWeight: 700,
  },
  metricValue: {
    margin: "8px 0 0",
    color: "#6E5084",
    fontSize: "28px",
    fontWeight: 800,
  },
  tabBar: {
    display: "flex",
    gap: "8px",
    padding: "10px",
    overflowX: "auto",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "14px",
  },
  tab: {
    flex: "0 0 auto",
    padding: "9px 12px",
    background: "#FFFFFF",
    border: "1px solid transparent",
    borderRadius: "10px",
    color: "#6B7280",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tabActive: {
    flex: "0 0 auto",
    padding: "9px 12px",
    background: "#F7F1FC",
    border: "1px solid #CDB2E2",
    borderRadius: "10px",
    color: "#6E5084",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
    gap: "16px",
    alignItems: "start",
  },
  sideColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  panel: {
    minWidth: 0,
    padding: "22px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  dangerPanel: {
    padding: "22px",
    background: "#FFF9FA",
    border: "1px solid #E7CBD2",
    borderRadius: "16px",
  },
  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "19px",
  },
  sectionDescription: {
    margin: "6px 0 0",
    maxWidth: "760px",
    color: "#6B7280",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "12px",
  },
  detail: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "14px",
    background: "#FAFAFB",
    border: "1px solid #ECEEF1",
    borderRadius: "12px",
  },
  detailLabel: {
    color: "#6B7280",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  detailValue: {
    color: "#1F2937",
    fontSize: "14px",
    fontWeight: 650,
  },
  controlLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "11px 0",
    borderBottom: "1px solid #EEF0F2",
    color: "#374151",
    fontSize: "13px",
  },
  enabledPill: {
    padding: "5px 8px",
    background: "#F5FFF9",
    borderRadius: "999px",
    color: "#38634A",
    fontSize: "11px",
    fontWeight: 800,
  },
  disabledPill: {
    padding: "5px 8px",
    background: "#F3F4F6",
    borderRadius: "999px",
    color: "#6B7280",
    fontSize: "11px",
    fontWeight: 700,
  },
  primaryButton: {
    minHeight: "40px",
    padding: "9px 14px",
    background: "#6E5084",
    border: "1px solid #6E5084",
    borderRadius: "10px",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: "40px",
    padding: "9px 14px",
    background: "#FFFFFF",
    border: "1px solid #CDB2E2",
    borderRadius: "10px",
    color: "#6E5084",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  dangerButton: {
    minHeight: "40px",
    padding: "9px 14px",
    background: "#FFFFFF",
    border: "1px solid #C96B82",
    borderRadius: "10px",
    color: "#9F4058",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  buttonColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  errorMessage: {
    padding: "13px 15px",
    background: "#FFF8FA",
    border: "1px solid #E7CBD2",
    borderRadius: "12px",
    color: "#7D4654",
    fontSize: "13px",
  },
  successMessage: {
    padding: "13px 15px",
    background: "#F5FFF9",
    border: "1px solid #CFE9DA",
    borderRadius: "12px",
    color: "#38634A",
    fontSize: "13px",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "16px",
    padding: "11px 12px",
    background: "#FAFAFB",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    color: "#111827",
    fontSize: "14px",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "760px",
    borderCollapse: "collapse",
  },
  th: {
    padding: "11px 12px",
    background: "#FAFAFB",
    borderBottom: "1px solid #E5E7EB",
    color: "#6B7280",
    fontSize: "11px",
    fontWeight: 800,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "13px 12px",
    borderBottom: "1px solid #EEF0F2",
    color: "#374151",
    fontSize: "13px",
    verticalAlign: "top",
  },
  muted: {
    margin: "4px 0 0",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  inlinePill: {
    display: "inline-flex",
    padding: "5px 8px",
    background: "#F1EAF6",
    borderRadius: "999px",
    color: "#6E5084",
    fontSize: "11px",
    fontWeight: 750,
  },
  linkButton: {
    border: 0,
    background: "transparent",
    color: "#6E5084",
    padding: 0,
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  listCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    padding: "15px",
    background: "#FAFAFB",
    border: "1px solid #ECEEF1",
    borderRadius: "12px",
  },
  listCardTitle: {
    margin: 0,
    color: "#1F2937",
    fontSize: "14px",
  },
  listCardText: {
    margin: "5px 0 0",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  listCardActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  emptyState: {
    padding: "42px 18px",
    textAlign: "center",
  },
  unavailableState: {
    padding: "30px 18px",
    background: "#FAFAFB",
    border: "1px dashed #D1D5DB",
    borderRadius: "12px",
    textAlign: "center",
  },
  emptyTitle: {
    margin: 0,
    color: "#374151",
    fontSize: "16px",
  },
  emptyText: {
    margin: "7px auto 0",
    maxWidth: "600px",
    color: "#6B7280",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  checkList: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },
  checkItem: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#374151",
    fontSize: "13px",
  },
  checkIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    background: "#F5FFF9",
    borderRadius: "50%",
    color: "#38634A",
    fontWeight: 800,
  },
  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    color: "#374151",
    fontSize: "12px",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "40px",
    padding: "9px 11px",
    background: "#FFFFFF",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    color: "#111827",
    fontSize: "13px",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 11px",
    background: "#FFFFFF",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    color: "#111827",
    fontSize: "13px",
    resize: "vertical",
  },
  fileInput: {
    width: "100%",
    color: "#374151",
    fontSize: "12px",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "28px minmax(0, 1fr)",
    gap: "12px",
    paddingBottom: "14px",
    borderBottom: "1px solid #EEF0F2",
  },
  timelineMarker: {
    color: "#6E5084",
    fontSize: "18px",
  },
  timelineTitle: {
    margin: 0,
    color: "#1F2937",
    fontSize: "14px",
  },
  timelineText: {
    margin: "5px 0 0",
    color: "#4B5563",
    fontSize: "13px",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  timelineDate: {
    margin: "5px 0 0",
    color: "#8A919C",
    fontSize: "11px",
  },
  settingsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  settingsActions: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "12px",
  },
  actionCard: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "16px",
    padding: "16px",
    background: "#FAFAFB",
    border: "1px solid #ECEEF1",
    borderRadius: "12px",
  },
  actionCardTitle: {
    margin: 0,
    color: "#1F2937",
    fontSize: "14px",
  },
  actionCardText: {
    margin: "6px 0 0",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  statePanel: {
    padding: "44px 24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    textAlign: "center",
  },
  stateTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "21px",
  },
  stateText: {
    margin: "8px auto 0",
    maxWidth: "620px",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  publicationHero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    padding: "24px",
    background: "linear-gradient(135deg, #F7F1FC 0%, #F5FFF9 100%)",
    border: "1px solid #DED0E8",
    borderRadius: "16px",
  },
  publicationTitle: { margin: 0, color: "#1F2937", fontSize: "24px" },
  publicationDescription: { margin: "7px 0 0", maxWidth: "720px", color: "#5F6670", fontSize: "13px", lineHeight: 1.6 },
  publicationHeroActions: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  livePill: { display: "inline-flex", padding: "7px 11px", borderRadius: "999px", background: "#EAF8F0", color: "#2F6847", fontSize: "12px", fontWeight: 800 },
  draftPill: { display: "inline-flex", padding: "7px 11px", borderRadius: "999px", background: "#FFFFFF", color: "#6E5084", border: "1px solid #CDB2E2", fontSize: "12px", fontWeight: 800 },
  readinessGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px", marginBottom: "16px" },
  readinessItem: { display: "flex", alignItems: "center", gap: "8px", padding: "11px", background: "#FAFAFB", border: "1px solid #ECEEF1", borderRadius: "10px", color: "#374151", fontSize: "12px", fontWeight: 700 },
  readinessReady: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "21px", height: "21px", borderRadius: "50%", background: "#EAF8F0", color: "#2F6847", fontWeight: 900 },
  readinessMissing: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "21px", height: "21px", borderRadius: "50%", background: "#FFF4E8", color: "#9A5B1D", fontWeight: 900 },
  publicLinkBox: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap", padding: "14px", marginBottom: "14px", background: "#F7F1FC", border: "1px solid #DED0E8", borderRadius: "12px" },
  publicLinkText: { marginTop: "5px", color: "#4B3B58", fontSize: "13px", overflowWrap: "anywhere" },
  toggleSetting: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px", padding: "12px 0", borderBottom: "1px solid #EEF0F2", cursor: "pointer" },
  toggleLabel: { color: "#374151", fontSize: "13px", fontWeight: 750 },
  toggleDescription: { marginTop: "4px", color: "#6B7280", fontSize: "11px", lineHeight: 1.45 },
  compactSelect: { minHeight: "34px", padding: "6px 8px", background: "#FFFFFF", border: "1px solid #D1D5DB", borderRadius: "8px", color: "#374151", fontSize: "12px" },
  inlineFormGrid: { display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(150px, .7fr) minmax(220px, 1.2fr) auto", gap: "12px", alignItems: "end", marginTop: "18px", paddingTop: "18px", borderTop: "1px solid #EEF0F2" },
  questionLayout: { display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: "16px", alignItems: "start" },
  questionCard: { display: "flex", alignItems: "flex-start", gap: "13px", flexWrap: "wrap", padding: "15px", background: "#FAFAFB", border: "1px solid #ECEEF1", borderRadius: "12px" },
  questionNumber: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", flex: "0 0 28px", borderRadius: "9px", background: "#F1EAF6", color: "#6E5084", fontSize: "12px", fontWeight: 900 },
  questionFlags: { display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "8px" },
  warningPill: { display: "inline-flex", padding: "5px 8px", background: "#FFF4E8", borderRadius: "999px", color: "#8A551E", fontSize: "11px", fontWeight: 750 },
  questionBuilder: { padding: "16px", background: "#FAFAFB", border: "1px solid #ECEEF1", borderRadius: "12px" },
  checkboxLine: { display: "flex", alignItems: "center", gap: "8px", color: "#374151", fontSize: "12px", fontWeight: 650 },
  deleteLinkButton: { border: 0, background: "transparent", color: "#9F4058", padding: 0, fontSize: "13px", fontWeight: 750, cursor: "pointer" },
};