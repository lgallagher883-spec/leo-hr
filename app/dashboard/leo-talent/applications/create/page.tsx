"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Vacancy = {
  id: string;
  organisation_id: string | null;
  vacancy_reference: string | null;
  title: string;
  department: string | null;
  location_name: string | null;
  status: string | null;
  closing_date: string | null;
  blind_review_enabled: boolean | null;
  ai_screening_enabled: boolean | null;
  archived_at: string | null;
};

type Candidate = {
  id: string;
  organisation_id: string | null;
  candidate_reference: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  archived_at: string | null;
};

type CandidateMode = "existing" | "new";

type UploadKind =
  | "cv"
  | "application_form"
  | "cover_letter"
  | "supporting_document";

type UploadItem = {
  id: string;
  kind: UploadKind;
  file: File;
};

type NewCandidateForm = {
  firstName: string;
  middleNames: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  sourceDetail: string;
  generalNotes: string;
  consentToContact: boolean;
};

type FieldErrors = Partial<
  Record<
    | "vacancyId"
    | "candidateId"
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "source",
    string
  >
>;

const SOURCE_OPTIONS = [
  "Company website",
  "Job board",
  "Recruitment agency",
  "Employee referral",
  "Direct approach",
  "Talent pool",
  "Internal candidate",
  "Social media",
  "Careers event",
  "Other",
];

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/rtf",
  "text/plain",
  "image/jpeg",
  "image/png",
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const STORAGE_BUCKET = "leo-talent-candidate-documents";

const initialCandidateForm: NewCandidateForm = {
  firstName: "",
  middleNames: "",
  lastName: "",
  preferredName: "",
  email: "",
  phone: "",
  sourceDetail: "",
  generalNotes: "",
  consentToContact: false,
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normaliseEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

function candidateName(candidate: Candidate): string {
  const firstName =
    candidate.preferred_name?.trim() ||
    candidate.first_name?.trim() ||
    "";
  return `${firstName} ${candidate.last_name ?? ""}`.trim() || "Candidate";
}

function formatDate(value: string | null): string {
  if (!value) return "No closing date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function sanitiseFileName(fileName: string): string {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()}`
    : "";

  const base = fileName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "document"}${extension.toLowerCase()}`;
}

function documentTypeFor(kind: UploadKind):
  | "cv"
  | "cover_letter"
  | "supporting_document" {
  if (kind === "cv") return "cv";
  if (kind === "cover_letter") return "cover_letter";
  return "supporting_document";
}

function uploadLabel(kind: UploadKind): string {
  switch (kind) {
    case "cv":
      return "CV";
    case "application_form":
      return "Application form";
    case "cover_letter":
      return "Cover letter";
    case "supporting_document":
      return "Supporting document";
  }
}

export default function CreateApplicationPage() {
  const router = useRouter();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const [vacancyId, setVacancyId] = useState("");
  const [candidateMode, setCandidateMode] =
    useState<CandidateMode>("new");
  const [candidateId, setCandidateId] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateForm, setCandidateForm] =
    useState<NewCandidateForm>(initialCandidateForm);

  const [source, setSource] = useState("");
  const [sourceDetail, setSourceDetail] = useState("");
  const [submittedAt, setSubmittedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const loadPage = useCallback(async () => {
    setLoading(true);
    setPageError("");

    const [vacancyResult, candidateResult] = await Promise.all([
      supabase
        .from("leo_talent_vacancies")
        .select(
          `
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
            archived_at
          `,
        )
        .is("archived_at", null)
        .in("status", ["open", "approved", "draft"])
        .order("created_at", { ascending: false }),
      supabase
        .from("leo_talent_candidates")
        .select(
          `
            id,
            organisation_id,
            candidate_reference,
            first_name,
            last_name,
            preferred_name,
            email,
            phone,
            archived_at
          `,
        )
        .is("archived_at", null)
        .order("last_name", { ascending: true }),
    ]);

    if (vacancyResult.error) {
      setPageError(
        `Leo could not load vacancies. ${vacancyResult.error.message}`,
      );
      setVacancies([]);
    } else {
      setVacancies((vacancyResult.data ?? []) as Vacancy[]);
    }

    if (candidateResult.error) {
      setPageError((current) =>
        current
          ? `${current} Leo could not load candidates. ${candidateResult.error.message}`
          : `Leo could not load candidates. ${candidateResult.error.message}`,
      );
      setCandidates([]);
    } else {
      setCandidates((candidateResult.data ?? []) as Candidate[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const selectedVacancy = useMemo(
    () => vacancies.find((vacancy) => vacancy.id === vacancyId) ?? null,
    [vacancies, vacancyId],
  );

  const selectedCandidate = useMemo(
    () =>
      candidates.find((candidate) => candidate.id === candidateId) ??
      null,
    [candidates, candidateId],
  );

  const filteredCandidates = useMemo(() => {
    const search = candidateSearch.trim().toLowerCase();

    if (!search) return candidates.slice(0, 50);

    return candidates
      .filter((candidate) => {
        const haystack = [
          candidateName(candidate),
          candidate.email,
          candidate.phone,
          candidate.candidate_reference,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      })
      .slice(0, 50);
  }, [candidateSearch, candidates]);

  function updateCandidateField<K extends keyof NewCandidateForm>(
    field: K,
    value: NewCandidateForm[K],
  ) {
    setCandidateForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field as keyof FieldErrors]) return current;

      const next = { ...current };
      delete next[field as keyof FieldErrors];
      return next;
    });
  }

  function changeCandidateMode(mode: CandidateMode) {
    setCandidateMode(mode);
    setCandidateId("");
    setErrors((current) => {
      const next = { ...current };
      delete next.candidateId;
      delete next.firstName;
      delete next.lastName;
      delete next.email;
      delete next.phone;
      return next;
    });
  }

  function addFiles(
    kind: UploadKind,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) return;

    const nextErrors: string[] = [];
    const accepted: UploadItem[] = [];

    for (const file of files) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        nextErrors.push(
          `${file.name} is not an accepted document type.`,
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextErrors.push(
          `${file.name} is larger than the 15 MB upload limit.`,
        );
        continue;
      }

      accepted.push({
        id: crypto.randomUUID(),
        kind,
        file,
      });
    }

    if (accepted.length) {
      setUploads((current) => [...current, ...accepted]);
    }

    if (nextErrors.length) {
      setPageError(nextErrors.join(" "));
    } else {
      setPageError("");
    }
  }

  function removeUpload(id: string) {
    setUploads((current) =>
      current.filter((upload) => upload.id !== id),
    );
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};

    if (!vacancyId) {
      next.vacancyId = "Select the vacancy for this application.";
    }

    if (candidateMode === "existing") {
      if (!candidateId) {
        next.candidateId = "Select an existing candidate.";
      }
    } else {
      if (!candidateForm.firstName.trim()) {
        next.firstName = "Enter the candidate's first name.";
      }

      if (!candidateForm.lastName.trim()) {
        next.lastName = "Enter the candidate's last name.";
      }

      if (!candidateForm.email.trim() && !candidateForm.phone.trim()) {
        next.email =
          "Enter at least an email address or telephone number.";
        next.phone =
          "Enter at least an email address or telephone number.";
      }

      if (
        candidateForm.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          candidateForm.email.trim(),
        )
      ) {
        next.email = "Enter a valid email address.";
      }
    }

    if (!source) {
      next.source = "Select where the application came from.";
    }

    return next;
  }

  async function findDuplicateCandidate(
    email: string | null,
  ): Promise<Candidate | null> {
    if (!email) return null;

    const { data, error } = await supabase
      .from("leo_talent_candidates")
      .select(
        `
          id,
          organisation_id,
          candidate_reference,
          first_name,
          last_name,
          preferred_name,
          email,
          phone,
          archived_at
        `,
      )
      .ilike("email", email)
      .is("archived_at", null)
      .limit(1);

    if (error || !data?.length) return null;
    return data[0] as Candidate;
  }

  async function uploadCandidateDocuments(
    candidateRecordId: string,
    organisationId: string | null,
    applicationId: string,
  ): Promise<string[]> {
    const warnings: string[] = [];

    for (const upload of uploads) {
      const safeFileName = sanitiseFileName(upload.file.name);
      const path = [
        organisationId || "unassigned",
        candidateRecordId,
        applicationId,
        `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`,
      ].join("/");

      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, upload.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: upload.file.type,
        });

      if (storageError) {
        warnings.push(
          `${upload.file.name} could not be uploaded: ${storageError.message}`,
        );
        continue;
      }

      const { error: documentError } = await (supabase as any)
        .from("leo_talent_candidate_documents")
        .insert({
          organisation_id: organisationId,
          candidate_id: candidateRecordId,
          document_type: documentTypeFor(upload.kind),
          title: uploadLabel(upload.kind),
          file_name: upload.file.name,
          file_path: path,
          mime_type: upload.file.type || null,
          size_bytes: upload.file.size,
          metadata: {
            application_id: applicationId,
            application_document_type: upload.kind,
            source: "application_creation",
          },
          updated_at: new Date().toISOString(),
        });

      if (documentError) {
        warnings.push(
          `${upload.file.name} was uploaded but its document record could not be created: ${documentError.message}`,
        );
      }
    }

    return warnings;
  }

  async function writeAuditEvent(
    applicationId: string,
    candidateRecordId: string,
    organisationId: string | null,
  ) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await (supabase as any).from("talent_analytics_events").insert({
        organisation_id: organisationId,
        event_type: "application_created",
        entity_type: "application",
        entity_id: applicationId,
        actor_user_id: user?.id ?? null,
        metadata: {
          vacancy_id: vacancyId,
          candidate_id: candidateRecordId,
          source,
        },
      });
    } catch (auditError) {
      console.warn(
        "Application audit event could not be recorded:",
        auditError,
      );
    }
  }

  async function saveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError("");
    setPageMessage("");

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setPageError(
        "Please review the highlighted information before saving.",
      );
      return;
    }

    if (!selectedVacancy) {
      setPageError(
        "The selected vacancy is no longer available. Refresh the page and choose another vacancy.",
      );
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();
    const organisationId = selectedVacancy.organisation_id;
    let resolvedCandidateId = candidateId;
    let createdNewCandidate = false;

    try {
      if (candidateMode === "new") {
        const email = normaliseEmail(candidateForm.email);
        const duplicateCandidate = await findDuplicateCandidate(email);

        if (duplicateCandidate) {
          const useExisting = window.confirm(
            `${candidateName(duplicateCandidate)} already has a candidate record with this email address. Select OK to use the existing record, or Cancel to return to the form.`,
          );

          if (!useExisting) {
            setSaving(false);
            return;
          }

          resolvedCandidateId = duplicateCandidate.id;
        } else {
          const { data: createdCandidate, error: candidateError } =
            await supabase
              .from("leo_talent_candidates")
              .insert({
                organisation_id: organisationId,
                first_name: candidateForm.firstName.trim(),
                middle_names: optionalText(
                  candidateForm.middleNames,
                ),
                last_name: candidateForm.lastName.trim(),
                preferred_name: optionalText(
                  candidateForm.preferredName,
                ),
                email,
                phone: optionalText(candidateForm.phone),
                source,
                source_detail:
                  optionalText(candidateForm.sourceDetail) ||
                  optionalText(sourceDetail),
                talent_pool_status: "active",
                consent_to_contact:
                  candidateForm.consentToContact,
                consent_recorded_at:
                  candidateForm.consentToContact ? now : null,
                do_not_contact: false,
                general_notes: optionalText(
                  candidateForm.generalNotes,
                ),
                metadata: {
                  created_from: "new_application",
                },
                created_at: now,
                updated_at: now,
              })
              .select("id")
              .single();

          if (candidateError || !createdCandidate) {
            throw new Error(
              candidateError?.message ||
                "The candidate record could not be created.",
            );
          }

          resolvedCandidateId = String(createdCandidate.id);
          createdNewCandidate = true;
        }
      }

      const { data: existingApplication, error: duplicateError } =
        await supabase
          .from("leo_talent_applications")
          .select("id, application_reference")
          .eq("vacancy_id", vacancyId)
          .eq("candidate_id", resolvedCandidateId)
          .not("status", "eq", "archived")
          .limit(1);

      if (duplicateError) {
        throw new Error(duplicateError.message);
      }

      if (existingApplication?.length) {
        const existing = existingApplication[0];
        const openExisting = window.confirm(
          `This candidate already has an application for the selected vacancy${
            existing.application_reference
              ? ` (${existing.application_reference})`
              : ""
          }. Select OK to open it.`,
        );

        if (openExisting) {
          router.push(
            `/dashboard/leo-talent/applications/${existing.id}`,
          );
        }

        setSaving(false);
        return;
      }

      const submittedTimestamp = submittedAt
        ? new Date(`${submittedAt}T12:00:00`).toISOString()
        : now;

      const { data: createdApplication, error: applicationError } =
        await supabase
          .from("leo_talent_applications")
          .insert({
            organisation_id: organisationId,
            vacancy_id: vacancyId,
            candidate_id: resolvedCandidateId,
            current_stage_key: "new",
            status: "submitted",
            source,
            submitted_at: submittedTimestamp,
            blind_review_enabled:
              selectedVacancy.blind_review_enabled ?? false,
            ai_screening_enabled:
              selectedVacancy.ai_screening_enabled ?? false,
            knockout_failed: false,
            recommendation_reason: optionalText(internalNotes),
            created_at: now,
            updated_at: now,
          })
          .select("id, application_reference")
          .single();

      if (applicationError || !createdApplication) {
        if (createdNewCandidate) {
          await supabase
            .from("leo_talent_candidates")
            .delete()
            .eq("id", resolvedCandidateId);
        }

        throw new Error(
          applicationError?.message ||
            "The application record could not be created.",
        );
      }

      const applicationId = String(createdApplication.id);

      const uploadWarnings = await uploadCandidateDocuments(
        resolvedCandidateId,
        organisationId,
        applicationId,
      );

      await writeAuditEvent(
        applicationId,
        resolvedCandidateId,
        organisationId,
      );

      if (uploadWarnings.length) {
        setPageMessage(
          "The application was created, but one or more documents need attention.",
        );
        setPageError(uploadWarnings.join(" "));
        setSaving(false);
        return;
      }

      router.push(
        `/dashboard/leo-talent/applications/${applicationId}`,
      );
    } catch (saveError) {
      console.error("Application could not be created:", saveError);

      setPageError(
        saveError instanceof Error
          ? `Leo could not create this application. ${saveError.message}`
          : "Leo could not create this application.",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.statePanel}>
          <h1 style={styles.stateTitle}>Loading application form…</h1>
          <p style={styles.stateText}>
            Leo is retrieving vacancies and candidate records.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>LEO TALENT</p>
          <h1 style={styles.title}>New Application</h1>
          <p style={styles.description}>
            Record an application, connect it to a vacancy and candidate,
            and preserve the documents needed for review.
          </p>
        </div>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() =>
            router.push("/dashboard/leo-talent/applications")
          }
          disabled={saving}
        >
          Cancel
        </button>
      </header>

      {pageError ? (
        <div role="alert" style={styles.errorMessage}>
          {pageError}
        </div>
      ) : null}

      {pageMessage ? (
        <div role="status" style={styles.successMessage}>
          {pageMessage}
        </div>
      ) : null}

      <form onSubmit={saveApplication} style={styles.form}>
        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.step}>STEP 1</p>
              <h2 style={styles.sectionTitle}>Vacancy</h2>
              <p style={styles.sectionDescription}>
                Choose the role this application relates to.
              </p>
            </div>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>Vacancy *</span>
            <select
              value={vacancyId}
              onChange={(event) => {
                setVacancyId(event.target.value);
                setErrors((current) => {
                  const next = { ...current };
                  delete next.vacancyId;
                  return next;
                });
              }}
              style={
                errors.vacancyId
                  ? styles.inputError
                  : styles.input
              }
            >
              <option value="">Select a vacancy</option>
              {vacancies.map((vacancy) => (
                <option key={vacancy.id} value={vacancy.id}>
                  {vacancy.title}
                  {vacancy.vacancy_reference
                    ? ` · ${vacancy.vacancy_reference}`
                    : ""}
                </option>
              ))}
            </select>
            {errors.vacancyId ? (
              <span style={styles.fieldError}>
                {errors.vacancyId}
              </span>
            ) : null}
          </label>

          {selectedVacancy ? (
            <div style={styles.summaryPanel}>
              <div>
                <span style={styles.summaryLabel}>Vacancy</span>
                <strong style={styles.summaryValue}>
                  {selectedVacancy.title}
                </strong>
              </div>
              <div>
                <span style={styles.summaryLabel}>Department</span>
                <strong style={styles.summaryValue}>
                  {selectedVacancy.department || "Not set"}
                </strong>
              </div>
              <div>
                <span style={styles.summaryLabel}>Location</span>
                <strong style={styles.summaryValue}>
                  {selectedVacancy.location_name || "Not set"}
                </strong>
              </div>
              <div>
                <span style={styles.summaryLabel}>Closing date</span>
                <strong style={styles.summaryValue}>
                  {formatDate(selectedVacancy.closing_date)}
                </strong>
              </div>
            </div>
          ) : null}

          {!vacancies.length ? (
            <div style={styles.inlineNotice}>
              No available vacancies were found. Create or open a vacancy
              before recording an application.
            </div>
          ) : null}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.step}>STEP 2</p>
              <h2 style={styles.sectionTitle}>Candidate</h2>
              <p style={styles.sectionDescription}>
                Connect an existing candidate or create a reusable
                candidate profile.
              </p>
            </div>
          </div>

          <div style={styles.modeTabs}>
            <button
              type="button"
              style={
                candidateMode === "new"
                  ? styles.modeTabActive
                  : styles.modeTab
              }
              onClick={() => changeCandidateMode("new")}
            >
              New candidate
            </button>
            <button
              type="button"
              style={
                candidateMode === "existing"
                  ? styles.modeTabActive
                  : styles.modeTab
              }
              onClick={() => changeCandidateMode("existing")}
            >
              Existing candidate
            </button>
          </div>

          {candidateMode === "existing" ? (
            <div style={styles.stack}>
              <label style={styles.field}>
                <span style={styles.label}>Find candidate</span>
                <input
                  type="search"
                  value={candidateSearch}
                  onChange={(event) =>
                    setCandidateSearch(event.target.value)
                  }
                  placeholder="Search name, email, telephone or reference"
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Candidate *</span>
                <select
                  value={candidateId}
                  onChange={(event) => {
                    setCandidateId(event.target.value);
                    setErrors((current) => {
                      const next = { ...current };
                      delete next.candidateId;
                      return next;
                    });
                  }}
                  style={
                    errors.candidateId
                      ? styles.inputError
                      : styles.input
                  }
                >
                  <option value="">Select a candidate</option>
                  {filteredCandidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidateName(candidate)}
                      {candidate.email
                        ? ` · ${candidate.email}`
                        : ""}
                    </option>
                  ))}
                </select>
                {errors.candidateId ? (
                  <span style={styles.fieldError}>
                    {errors.candidateId}
                  </span>
                ) : null}
              </label>

              {selectedCandidate ? (
                <div style={styles.summaryPanel}>
                  <div>
                    <span style={styles.summaryLabel}>Candidate</span>
                    <strong style={styles.summaryValue}>
                      {candidateName(selectedCandidate)}
                    </strong>
                  </div>
                  <div>
                    <span style={styles.summaryLabel}>Email</span>
                    <strong style={styles.summaryValue}>
                      {selectedCandidate.email || "Not set"}
                    </strong>
                  </div>
                  <div>
                    <span style={styles.summaryLabel}>Telephone</span>
                    <strong style={styles.summaryValue}>
                      {selectedCandidate.phone || "Not set"}
                    </strong>
                  </div>
                  <div>
                    <span style={styles.summaryLabel}>Reference</span>
                    <strong style={styles.summaryValue}>
                      {selectedCandidate.candidate_reference ||
                        "Generated by Leo"}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div style={styles.gridTwo}>
              <label style={styles.field}>
                <span style={styles.label}>First name *</span>
                <input
                  value={candidateForm.firstName}
                  onChange={(event) =>
                    updateCandidateField(
                      "firstName",
                      event.target.value,
                    )
                  }
                  style={
                    errors.firstName
                      ? styles.inputError
                      : styles.input
                  }
                />
                {errors.firstName ? (
                  <span style={styles.fieldError}>
                    {errors.firstName}
                  </span>
                ) : null}
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Middle name(s)</span>
                <input
                  value={candidateForm.middleNames}
                  onChange={(event) =>
                    updateCandidateField(
                      "middleNames",
                      event.target.value,
                    )
                  }
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Last name *</span>
                <input
                  value={candidateForm.lastName}
                  onChange={(event) =>
                    updateCandidateField(
                      "lastName",
                      event.target.value,
                    )
                  }
                  style={
                    errors.lastName
                      ? styles.inputError
                      : styles.input
                  }
                />
                {errors.lastName ? (
                  <span style={styles.fieldError}>
                    {errors.lastName}
                  </span>
                ) : null}
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Preferred name</span>
                <input
                  value={candidateForm.preferredName}
                  onChange={(event) =>
                    updateCandidateField(
                      "preferredName",
                      event.target.value,
                    )
                  }
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Email address</span>
                <input
                  type="email"
                  value={candidateForm.email}
                  onChange={(event) =>
                    updateCandidateField("email", event.target.value)
                  }
                  style={
                    errors.email
                      ? styles.inputError
                      : styles.input
                  }
                />
                {errors.email ? (
                  <span style={styles.fieldError}>
                    {errors.email}
                  </span>
                ) : null}
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Telephone</span>
                <input
                  type="tel"
                  value={candidateForm.phone}
                  onChange={(event) =>
                    updateCandidateField("phone", event.target.value)
                  }
                  style={
                    errors.phone
                      ? styles.inputError
                      : styles.input
                  }
                />
                {errors.phone ? (
                  <span style={styles.fieldError}>
                    {errors.phone}
                  </span>
                ) : null}
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Source detail</span>
                <input
                  value={candidateForm.sourceDetail}
                  onChange={(event) =>
                    updateCandidateField(
                      "sourceDetail",
                      event.target.value,
                    )
                  }
                  placeholder="Agency, referrer, job board or campaign"
                  style={styles.input}
                />
              </label>

              <label style={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={candidateForm.consentToContact}
                  onChange={(event) =>
                    updateCandidateField(
                      "consentToContact",
                      event.target.checked,
                    )
                  }
                />
                <span>
                  Candidate consent to future recruitment contact has
                  been recorded.
                </span>
              </label>

              <label
                style={{
                  ...styles.field,
                  gridColumn: "1 / -1",
                }}
              >
                <span style={styles.label}>
                  General candidate notes
                </span>
                <textarea
                  value={candidateForm.generalNotes}
                  onChange={(event) =>
                    updateCandidateField(
                      "generalNotes",
                      event.target.value,
                    )
                  }
                  rows={4}
                  style={styles.textarea}
                  placeholder="Reusable candidate information only. Application-specific notes belong below."
                />
              </label>
            </div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.step}>STEP 3</p>
              <h2 style={styles.sectionTitle}>Application details</h2>
              <p style={styles.sectionDescription}>
                Record how and when the application was received.
              </p>
            </div>
          </div>

          <div style={styles.gridTwo}>
            <label style={styles.field}>
              <span style={styles.label}>Source *</span>
              <select
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.source;
                    return next;
                  });
                }}
                style={
                  errors.source
                    ? styles.inputError
                    : styles.input
                }
              >
                <option value="">Select a source</option>
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.source ? (
                <span style={styles.fieldError}>
                  {errors.source}
                </span>
              ) : null}
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Source detail</span>
              <input
                value={sourceDetail}
                onChange={(event) =>
                  setSourceDetail(event.target.value)
                }
                placeholder="Job board, agency, referrer or campaign"
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Application received</span>
              <input
                type="date"
                value={submittedAt}
                onChange={(event) =>
                  setSubmittedAt(event.target.value)
                }
                style={styles.input}
              />
            </label>

            <label
              style={{
                ...styles.field,
                gridColumn: "1 / -1",
              }}
            >
              <span style={styles.label}>Initial internal notes</span>
              <textarea
                value={internalNotes}
                onChange={(event) =>
                  setInternalNotes(event.target.value)
                }
                rows={5}
                style={styles.textarea}
                placeholder="Record factual information relevant to this application. Avoid unnecessary sensitive information."
              />
              <span style={styles.helpText}>
                These notes are retained with the initial application
                record for later review.
              </span>
            </label>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.step}>STEP 4</p>
              <h2 style={styles.sectionTitle}>Documents</h2>
              <p style={styles.sectionDescription}>
                Upload the documents supplied with the application. Each
                file must be no larger than 15 MB.
              </p>
            </div>
          </div>

          <div style={styles.uploadGrid}>
            <UploadControl
              label="CV"
              description="Candidate curriculum vitae."
              multiple={false}
              onChange={(event) => addFiles("cv", event)}
            />
            <UploadControl
              label="Application form"
              description="Completed employer application form."
              multiple={false}
              onChange={(event) =>
                addFiles("application_form", event)
              }
            />
            <UploadControl
              label="Cover letter"
              description="Cover letter or supporting statement."
              multiple={false}
              onChange={(event) =>
                addFiles("cover_letter", event)
              }
            />
            <UploadControl
              label="Other documents"
              description="Additional evidence supplied by the candidate."
              multiple
              onChange={(event) =>
                addFiles("supporting_document", event)
              }
            />
          </div>

          {uploads.length ? (
            <div style={styles.fileList}>
              {uploads.map((upload) => (
                <div key={upload.id} style={styles.fileRow}>
                  <div>
                    <strong style={styles.fileName}>
                      {upload.file.name}
                    </strong>
                    <span style={styles.fileMeta}>
                      {uploadLabel(upload.kind)} ·{" "}
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    style={styles.linkButton}
                    onClick={() => removeUpload(upload.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.inlineNotice}>
              No documents selected. You can still create the
              application and upload documents later.
            </div>
          )}
        </section>

        <section style={styles.actionBar}>
          <div>
            <strong style={styles.actionTitle}>
              Create application
            </strong>
            <p style={styles.actionText}>
              The application will start at the New stage and open in
              its individual workspace.
            </p>
          </div>

          <div style={styles.actionButtons}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
                router.push("/dashboard/leo-talent/applications")
              }
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.primaryButton}
              disabled={saving || !vacancies.length}
            >
              {saving ? "Creating application…" : "Create Application"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}

function UploadControl({
  label,
  description,
  multiple,
  onChange,
}: {
  label: string;
  description: string;
  multiple: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label style={styles.uploadCard}>
      <span style={styles.uploadTitle}>{label}</span>
      <span style={styles.uploadDescription}>{description}</span>
      <span style={styles.uploadButton}>
        {multiple ? "Choose files" : "Choose file"}
      </span>
      <input
        type="file"
        multiple={multiple}
        accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png"
        onChange={onChange}
        style={styles.hiddenInput}
      />
    </label>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    maxWidth: "1300px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    padding: "24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  eyebrow: {
    margin: "0 0 7px",
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  title: {
    margin: 0,
    color: "#111827",
    fontSize: "30px",
    lineHeight: 1.2,
  },
  description: {
    margin: "8px 0 0",
    maxWidth: "760px",
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    padding: "24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  sectionHeading: {
    marginBottom: "20px",
  },
  step: {
    margin: "0 0 6px",
    color: "#6E5084",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px",
  },
  sectionDescription: {
    margin: "7px 0 0",
    color: "#6B7280",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "16px",
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },
  label: {
    color: "#374151",
    fontSize: "12px",
    fontWeight: 750,
  },
  input: {
    width: "100%",
    minHeight: "43px",
    boxSizing: "border-box",
    padding: "10px 12px",
    background: "#FFFFFF",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    color: "#111827",
    fontSize: "13px",
    outline: "none",
  },
  inputError: {
    width: "100%",
    minHeight: "43px",
    boxSizing: "border-box",
    padding: "10px 12px",
    background: "#FFF8FA",
    border: "1px solid #C88495",
    borderRadius: "10px",
    color: "#111827",
    fontSize: "13px",
    outline: "none",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    background: "#FFFFFF",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    color: "#111827",
    fontFamily: "inherit",
    fontSize: "13px",
    lineHeight: 1.55,
    resize: "vertical",
  },
  fieldError: {
    color: "#9A445B",
    fontSize: "11px",
    fontWeight: 650,
  },
  helpText: {
    color: "#6B7280",
    fontSize: "11px",
    lineHeight: 1.45,
  },
  checkboxField: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    paddingTop: "25px",
    color: "#4B5563",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  modeTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  modeTab: {
    padding: "9px 13px",
    background: "#FFFFFF",
    border: "1px solid #D1D5DB",
    borderRadius: "9px",
    color: "#6B7280",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  modeTabActive: {
    padding: "9px 13px",
    background: "#F7F1FC",
    border: "1px solid #CDB2E2",
    borderRadius: "9px",
    color: "#6E5084",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  summaryPanel: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: "14px",
    marginTop: "16px",
    padding: "16px",
    background: "#FAFAFB",
    border: "1px solid #ECEEF1",
    borderRadius: "12px",
  },
  summaryLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#6B7280",
    fontSize: "10px",
    fontWeight: 750,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    display: "block",
    color: "#374151",
    fontSize: "12px",
    lineHeight: 1.45,
  },
  uploadGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "12px",
  },
  uploadCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
    padding: "17px",
    background: "#FAFAFB",
    border: "1px dashed #CDB2E2",
    borderRadius: "12px",
    cursor: "pointer",
  },
  uploadTitle: {
    color: "#374151",
    fontSize: "13px",
    fontWeight: 800,
  },
  uploadDescription: {
    minHeight: "36px",
    color: "#6B7280",
    fontSize: "11px",
    lineHeight: 1.5,
  },
  uploadButton: {
    padding: "7px 10px",
    background: "#F7F1FC",
    borderRadius: "8px",
    color: "#6E5084",
    fontSize: "11px",
    fontWeight: 750,
  },
  hiddenInput: {
    display: "none",
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "16px",
  },
  fileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "11px 13px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
  },
  fileName: {
    display: "block",
    color: "#374151",
    fontSize: "12px",
    wordBreak: "break-word",
  },
  fileMeta: {
    display: "block",
    marginTop: "4px",
    color: "#6B7280",
    fontSize: "10px",
  },
  inlineNotice: {
    marginTop: "14px",
    padding: "12px 14px",
    background: "#FAFAFB",
    border: "1px solid #ECEEF1",
    borderRadius: "10px",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    padding: "20px 24px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
  },
  actionTitle: {
    color: "#374151",
    fontSize: "14px",
  },
  actionText: {
    margin: "5px 0 0",
    color: "#6B7280",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  actionButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    minHeight: "42px",
    padding: "10px 15px",
    background: "#6E5084",
    border: "1px solid #6E5084",
    borderRadius: "10px",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  secondaryButton: {
    minHeight: "42px",
    padding: "10px 15px",
    background: "#FFFFFF",
    border: "1px solid #CDB2E2",
    borderRadius: "10px",
    color: "#6E5084",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
  },
  linkButton: {
    padding: 0,
    background: "transparent",
    border: 0,
    color: "#6E5084",
    fontSize: "11px",
    fontWeight: 750,
    cursor: "pointer",
  },
  errorMessage: {
    padding: "13px 15px",
    background: "#FFF8FA",
    border: "1px solid #E7CBD2",
    borderRadius: "12px",
    color: "#7D4654",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  successMessage: {
    padding: "13px 15px",
    background: "#F5FFF9",
    border: "1px solid #CFE9DA",
    borderRadius: "12px",
    color: "#38634A",
    fontSize: "13px",
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
};

