"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { supabase } from "@/lib/supabase";

type PublicVacancy = {
  organisation_id: string | null;
  organisation_slug: string;
  organisation_name: string;
  logo_url: string | null;
  vacancy_id: string;
  vacancy_reference: string;
  vacancy_slug: string;
  title: string;
  location_name: string | null;
  employment_type: string | null;
  closing_date: string | null;
  blind_review_enabled: boolean;
  ai_screening_enabled: boolean;
};

type VacancyQuestion = {
  id: string;
  organisation_id: string | null;
  vacancy_id: string;
  question_text: string;
  help_text: string | null;
  question_type:
    | "short_text"
    | "long_text"
    | "single_choice"
    | "multiple_choice"
    | "yes_no"
    | "date"
    | "number"
    | "file_upload";
  options: string[];
  is_required: boolean;
  is_knockout: boolean;
  knockout_rule: Record<string, unknown>;
  display_order: number;
};

type ApplicationForm = {
  firstName: string;
  middleNames: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  countyRegion: string;
  postcode: string;
  country: string;
  rightToWork: "" | "yes" | "no";
  currentJobTitle: string;
  currentEmployer: string;
  coverLetter: string;
  consentToContact: boolean;
  privacyAccepted: boolean;
  declarationAccepted: boolean;
};

type FieldErrors = Partial<Record<keyof ApplicationForm | "cv" | "questions", string>>;

type UploadItem = {
  id: string;
  kind: "cv" | "cover_letter" | "supporting_document";
  file: File;
};

const STORAGE_BUCKET = "leo-talent-candidate-documents";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
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

const initialForm: ApplicationForm = {
  firstName: "",
  middleNames: "",
  lastName: "",
  preferredName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  townCity: "",
  countyRegion: "",
  postcode: "",
  country: "United Kingdom",
  rightToWork: "",
  currentJobTitle: "",
  currentEmployer: "",
  coverLetter: "",
  consentToContact: false,
  privacyAccepted: false,
  declarationAccepted: false,
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function optionsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item)).filter(Boolean);
}

function normaliseVacancy(row: any): PublicVacancy {
  return {
    organisation_id: text(row.organisation_id) || null,
    organisation_slug: text(row.organisation_slug),
    organisation_name: text(row.organisation_name) || "Organisation",
    logo_url: text(row.logo_url) || null,
    vacancy_id: text(row.vacancy_id),
    vacancy_reference: text(row.vacancy_reference),
    vacancy_slug: text(row.vacancy_slug),
    title: text(row.title) || "Untitled vacancy",
    location_name: text(row.location_name) || null,
    employment_type: text(row.employment_type) || null,
    closing_date: text(row.closing_date) || null,
    blind_review_enabled: row.blind_review_enabled === true,
    ai_screening_enabled: row.ai_screening_enabled === true,
  };
}

function normaliseQuestion(row: any): VacancyQuestion {
  return {
    id: text(row.id),
    organisation_id: text(row.organisation_id) || null,
    vacancy_id: text(row.vacancy_id),
    question_text: text(row.question_text),
    help_text: text(row.help_text) || null,
    question_type: row.question_type,
    options: optionsFrom(row.options),
    is_required: row.is_required === true,
    is_knockout: row.is_knockout === true,
    knockout_rule: objectOrEmpty(row.knockout_rule),
    display_order:
      typeof row.display_order === "number" ? row.display_order : 0,
  };
}

function formatDate(value: string | null): string {
  if (!value) return "Open until filled";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function humanise(value: string | null): string {
  if (!value) return "Not stated";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export default function PublicApplicationPage() {
  const params = useParams<{
    organisationSlug: string;
    vacancySlug: string;
  }>();

  const organisationSlug = decodeURIComponent(params.organisationSlug || "");
  const vacancySlug = decodeURIComponent(params.vacancySlug || "");

  const [vacancy, setVacancy] = useState<PublicVacancy | null>(null);
  const [questions, setQuestions] = useState<VacancyQuestion[]>([]);
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submittedReference, setSubmittedReference] = useState("");

  const draftKey = useMemo(
    () => `leo-careers-draft:${organisationSlug}:${vacancySlug}`,
    [organisationSlug, vacancySlug],
  );

  const loadPage = useCallback(async () => {
    setLoading(true);
    setPageError("");

    const { data: vacancyData, error: vacancyError } = await supabase
      .from("leo_public_careers_vacancies")
      .select("*")
      .eq("organisation_slug", organisationSlug)
      .eq("vacancy_slug", vacancySlug)
      .maybeSingle();

    if (vacancyError) {
      setPageError(
        `This application page could not be loaded. ${vacancyError.message}`,
      );
      setLoading(false);
      return;
    }

    if (!vacancyData) {
      setPageError("This vacancy is no longer available for applications.");
      setLoading(false);
      return;
    }

    const currentVacancy = normaliseVacancy(vacancyData);
    setVacancy(currentVacancy);

    const { data: questionData, error: questionError } = await supabase
      .from("leo_talent_vacancy_questions")
      .select(
        "id, organisation_id, vacancy_id, question_text, help_text, question_type, options, is_required, is_knockout, knockout_rule, display_order",
      )
      .eq("vacancy_id", currentVacancy.vacancy_id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (questionError) {
      setPageError(
        `The vacancy loaded, but its application questions could not be retrieved. ${questionError.message}`,
      );
      setLoading(false);
      return;
    }

    setQuestions((questionData ?? []).map((row: any) => normaliseQuestion(row)));

    const savedDraft = window.localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as {
          form?: Partial<ApplicationForm>;
          answers?: Record<string, unknown>;
        };

        setForm((current) => ({
          ...current,
          ...(parsed.form ?? {}),
          privacyAccepted: false,
          declarationAccepted: false,
        }));
        setAnswers(parsed.answers ?? {});
        setNotice("Your saved draft has been restored on this device.");
      } catch {
        window.localStorage.removeItem(draftKey);
      }
    }

    setLoading(false);
  }, [draftKey, organisationSlug, vacancySlug]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  function updateField<K extends keyof ApplicationForm>(
    field: K,
    value: ApplicationForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function updateAnswer(questionId: string, value: unknown) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
    setErrors((current) => {
      if (!current.questions) return current;
      const next = { ...current };
      delete next.questions;
      return next;
    });
  }

  function addFiles(
    kind: UploadItem["kind"],
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    const accepted: UploadItem[] = [];
    const messages: string[] = [];

    for (const file of files) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        messages.push(`${file.name} is not an accepted file type.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        messages.push(`${file.name} is larger than the 15 MB limit.`);
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
      if (kind === "cv") {
        setErrors((current) => {
          const next = { ...current };
          delete next.cv;
          return next;
        });
      }
    }

    setPageError(messages.join(" "));
  }

  function removeUpload(id: string) {
    setUploads((current) => current.filter((item) => item.id !== id));
  }

  function saveDraft() {
    setSavingDraft(true);
    setPageError("");

    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        form: {
          ...form,
          privacyAccepted: false,
          declarationAccepted: false,
        },
        answers,
      }),
    );

    setNotice("Draft saved on this device.");
    window.setTimeout(() => setSavingDraft(false), 350);
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};

    if (!form.firstName.trim()) next.firstName = "Enter your first name.";
    if (!form.lastName.trim()) next.lastName = "Enter your last name.";

    if (!form.email.trim()) {
      next.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!form.phone.trim()) next.phone = "Enter your telephone number.";
    if (!form.addressLine1.trim()) next.addressLine1 = "Enter your address.";
    if (!form.townCity.trim()) next.townCity = "Enter your town or city.";
    if (!form.postcode.trim()) next.postcode = "Enter your postcode.";
    if (!form.rightToWork) {
      next.rightToWork = "Confirm whether you currently have the right to work in the UK.";
    }

    if (!uploads.some((item) => item.kind === "cv")) {
      next.cv = "Upload your CV.";
    }

    const unansweredRequired = questions.some((question) => {
      if (!question.is_required) return false;
      const answer = answers[question.id];

      if (Array.isArray(answer)) return answer.length === 0;
      return answer === undefined || answer === null || String(answer).trim() === "";
    });

    if (unansweredRequired) {
      next.questions = "Complete all required application questions.";
    }

    if (!form.privacyAccepted) {
      next.privacyAccepted = "Confirm that you have read the privacy information.";
    }

    if (!form.declarationAccepted) {
      next.declarationAccepted = "Confirm the application declaration.";
    }

    return next;
  }

  async function uploadDocuments(
    candidateId: string,
    applicationId: string,
    organisationId: string | null,
  ) {
    const uploadedDocumentIds = new Map<string, string>();

    for (const upload of uploads) {
      const safeName = sanitiseFileName(upload.file.name);
      const path = [
        organisationId || "unassigned",
        candidateId,
        applicationId,
        `${Date.now()}-${crypto.randomUUID()}-${safeName}`,
      ].join("/");

      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, upload.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: upload.file.type,
        });

      if (storageError) throw storageError;

      const { data: documentData, error: documentError } = await supabase
        .from("leo_talent_candidate_documents")
        .insert({
          organisation_id: organisationId,
          candidate_id: candidateId,
          vacancy_id: vacancy?.vacancy_id,
          application_id: applicationId,
          document_type: upload.kind,
          title:
            upload.kind === "cv"
              ? "CV"
              : upload.kind === "cover_letter"
                ? "Cover letter"
                : "Supporting document",
          file_name: upload.file.name,
          file_path: path,
          mime_type: upload.file.type || null,
          file_size_bytes: upload.file.size,
          visible_to_candidate: true,
          metadata: {
            source: "public_application",
          },
        })
        .select("id")
        .single();

      if (documentError || !documentData) {
        throw new Error(
          documentError?.message ||
            "A document record could not be created.",
        );
      }

      uploadedDocumentIds.set(upload.id, String(documentData.id));
    }

    return uploadedDocumentIds;
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError("");
    setNotice("");

    if (!vacancy) {
      setPageError("This vacancy is no longer available.");
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setPageError("Please review the highlighted information before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      const now = new Date().toISOString();
      const normalisedEmail = form.email.trim().toLowerCase();

      if (!vacancy.organisation_id) {
        throw new Error(
          "This vacancy is not connected to an organisation and cannot accept applications.",
        );
      }

      const {
        data: existingCandidateRows,
        error: candidateLookupError,
      } = await supabase
        .from("leo_talent_candidates")
        .select("id")
        .eq("organisation_id", vacancy.organisation_id)
        .ilike("email", normalisedEmail)
        .is("archived_at", null)
        .limit(1);

      if (candidateLookupError) throw candidateLookupError;

      let candidateId = existingCandidateRows?.[0]?.id
        ? String(existingCandidateRows[0].id)
        : "";

      if (!candidateId) {
        const { data: candidateData, error: candidateError } = await supabase
          .from("leo_talent_candidates")
          .insert({
            organisation_id: vacancy.organisation_id,
            first_name: form.firstName.trim(),
            middle_names: optionalText(form.middleNames),
            last_name: form.lastName.trim(),
            preferred_name: optionalText(form.preferredName),
            email: normalisedEmail,
            phone: optionalText(form.phone),
            address_line_1: optionalText(form.addressLine1),
            address_line_2: optionalText(form.addressLine2),
            town_city: optionalText(form.townCity),
            county_region: optionalText(form.countyRegion),
            postcode: optionalText(form.postcode),
            country: optionalText(form.country) || "United Kingdom",
            source: "Company website",
            source_detail: "LEO Careers public application",
            talent_pool_status: form.consentToContact ? "active" : "not_added",
            consent_to_contact: form.consentToContact,
            consent_recorded_at: form.consentToContact ? now : null,
            privacy_notice_version: "LEO Careers public application",
            current_job_title: optionalText(form.currentJobTitle),
            current_employer: optionalText(form.currentEmployer),
            metadata: {
              created_from: "public_application",
              right_to_work_self_declaration: form.rightToWork,
            },
          })
          .select("id")
          .single();

        if (candidateError || !candidateData) {
          throw new Error(
            candidateError?.message ||
              "Your candidate record could not be created.",
          );
        }

        candidateId = String(candidateData.id);
      }

      const { data: duplicateRows, error: duplicateError } = await supabase
        .from("leo_talent_applications")
        .select("id, application_reference")
        .eq("vacancy_id", vacancy.vacancy_id)
        .eq("candidate_id", candidateId)
        .limit(1);

      if (duplicateError) throw duplicateError;

      if (duplicateRows?.length) {
        throw new Error(
          `An application for this vacancy already exists${
            duplicateRows[0].application_reference
              ? ` (${duplicateRows[0].application_reference})`
              : ""
          }.`,
        );
      }

      const { data: applicationData, error: applicationError } = await supabase
        .from("leo_talent_applications")
        .insert({
          organisation_id: vacancy.organisation_id,
          vacancy_id: vacancy.vacancy_id,
          candidate_id: candidateId,
          current_stage_key: "new",
          status: "submitted",
          source: "Company website",
          submitted_at: now,
          blind_review_enabled: vacancy.blind_review_enabled,
          ai_screening_enabled: vacancy.ai_screening_enabled,
          metadata: {
            source: "public_application",
            cover_letter: optionalText(form.coverLetter),
            right_to_work_self_declaration: form.rightToWork,
            privacy_accepted_at: now,
            declaration_accepted_at: now,
          },
        })
        .select("id, application_reference")
        .single();

      if (applicationError || !applicationData) {
        throw new Error(
          applicationError?.message ||
            "Your application could not be created.",
        );
      }

      const applicationId = String(applicationData.id);

      await uploadDocuments(
        candidateId,
        applicationId,
        vacancy.organisation_id,
      );

      const answerRows = questions
        .filter((question) => {
          const answer = answers[question.id];
          return (
            answer !== undefined &&
            answer !== null &&
            (Array.isArray(answer)
              ? answer.length > 0
              : String(answer).trim() !== "")
          );
        })
        .map((question) => {
          const answer = answers[question.id];
          return {
            organisation_id: vacancy.organisation_id,
            application_id: applicationId,
            vacancy_question_id: question.id,
            question_snapshot: question.question_text,
            answer_text: Array.isArray(answer)
              ? answer.join(", ")
              : String(answer),
            answer_json: {
  value: Array.isArray(answer)
    ? answer.map((item) => String(item))
    : String(answer),
  question_type: question.question_type,
},
          };
        });

      if (answerRows.length) {
        const { error: answerError } = await supabase
          .from("leo_talent_application_answers")
          .insert(answerRows);

        if (answerError) throw answerError;
      }

      window.localStorage.removeItem(draftKey);
      setSubmittedReference(
        text(applicationData.application_reference) || "Submitted",
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Your application could not be submitted.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  function renderQuestion(question: VacancyQuestion) {
    const value = answers[question.id];

    if (question.question_type === "long_text") {
      return (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
          rows={6}
        />
      );
    }

    if (
      question.question_type === "short_text" ||
      question.question_type === "date" ||
      question.question_type === "number"
    ) {
      return (
        <input
          type={
            question.question_type === "date"
              ? "date"
              : question.question_type === "number"
                ? "number"
                : "text"
          }
          value={typeof value === "string" ? value : ""}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
        />
      );
    }

    if (question.question_type === "yes_no") {
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
        >
          <option value="">Select an answer</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    }

    if (question.question_type === "single_choice") {
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
        >
          <option value="">Select an answer</option>
          {question.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (question.question_type === "multiple_choice") {
      const selected = Array.isArray(value) ? value.map(String) : [];

      return (
        <div className="checkboxGroup">
          {question.options.map((option) => (
            <label key={option} className="choiceRow">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option);
                  updateAnswer(question.id, next);
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <p className="fieldHelp">
        File questions are completed using the supporting document upload below.
      </p>
    );
  }

  if (loading) {
    return (
      <main className="statePage">
        <span className="spinner" aria-hidden="true" />
        <h1>Loading application…</h1>
        <p>LEO is preparing the application form.</p>
        <style jsx>{stateStyles}</style>
      </main>
    );
  }

  if (submittedReference && vacancy) {
    return (
      <main className="statePage">
        <span className="successIcon" aria-hidden="true">
          ✓
        </span>
        <h1>Application submitted</h1>
        <p>
          Your application for <strong>{vacancy.title}</strong> has been sent to{" "}
          {vacancy.organisation_name}.
        </p>
        <div className="referenceBox">
          <span>Application reference</span>
          <strong>{submittedReference}</strong>
        </div>
        <Link
          href={`/careers/${encodeURIComponent(
            vacancy.organisation_slug,
          )}/${encodeURIComponent(vacancy.vacancy_slug)}`}
          className="primaryButton"
        >
          Return to vacancy
        </Link>
        <style jsx>{stateStyles}</style>
      </main>
    );
  }

  if (!vacancy) {
    return (
      <main className="statePage">
        <span className="errorIcon" aria-hidden="true">
          !
        </span>
        <h1>Application unavailable</h1>
        <p>{pageError || "This vacancy is no longer accepting applications."}</p>
        <Link href="/careers" className="primaryButton">
          View current vacancies
        </Link>
        <style jsx>{stateStyles}</style>
      </main>
    );
  }

  return (
    <main className="applicationPage">
      <header className="siteHeader">
        <Link href="/careers" className="brandLink">
          <span className="brandMark" aria-hidden="true">
            ✦
          </span>
          <span>
            <strong>LEO</strong>
            <small>Careers</small>
          </span>
        </Link>

        <Link
          href={`/careers/${encodeURIComponent(
            vacancy.organisation_slug,
          )}/${encodeURIComponent(vacancy.vacancy_slug)}`}
          className="headerLink"
        >
          Return to vacancy
        </Link>
      </header>

      <section className="applicationHero">
        <div className="organisationLine">
          {vacancy.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vacancy.logo_url}
              alt={`${vacancy.organisation_name} logo`}
              className="organisationLogo"
            />
          ) : (
            <span className="organisationInitial">
              {vacancy.organisation_name.charAt(0).toUpperCase()}
            </span>
          )}

          <div>
            <p className="eyebrow">APPLICATION FOR</p>
            <p className="organisationName">{vacancy.organisation_name}</p>
          </div>
        </div>

        <h1>{vacancy.title}</h1>
        <p>
          Complete the form below and review your information carefully before
          submitting.
        </p>

        <div className="vacancyMeta">
          <span>{vacancy.vacancy_reference}</span>
          <span>{vacancy.location_name || "Location not stated"}</span>
          <span>{humanise(vacancy.employment_type)}</span>
          <span>Closes {formatDate(vacancy.closing_date)}</span>
        </div>
      </section>

      <form onSubmit={submitApplication} className="pageGrid">
        <div className="formColumn">
          {pageError ? <div className="errorBanner">{pageError}</div> : null}
          {notice ? <div className="noticeBanner">{notice}</div> : null}

          <section className="formCard">
            <p className="eyebrow">YOUR DETAILS</p>
            <h2>Personal information</h2>

            <div className="fieldGrid">
              <label>
                <span>First name *</span>
                <input
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                />
                {errors.firstName ? (
                  <small className="fieldError">{errors.firstName}</small>
                ) : null}
              </label>

              <label>
                <span>Middle name(s)</span>
                <input
                  value={form.middleNames}
                  onChange={(event) =>
                    updateField("middleNames", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Last name *</span>
                <input
                  value={form.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                />
                {errors.lastName ? (
                  <small className="fieldError">{errors.lastName}</small>
                ) : null}
              </label>

              <label>
                <span>Preferred name</span>
                <input
                  value={form.preferredName}
                  onChange={(event) =>
                    updateField("preferredName", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Email address *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
                {errors.email ? (
                  <small className="fieldError">{errors.email}</small>
                ) : null}
              </label>

              <label>
                <span>Telephone number *</span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
                {errors.phone ? (
                  <small className="fieldError">{errors.phone}</small>
                ) : null}
              </label>
            </div>
          </section>

          <section className="formCard">
            <p className="eyebrow">ADDRESS</p>
            <h2>Contact address</h2>

            <div className="fieldGrid">
              <label className="fullField">
                <span>Address line 1 *</span>
                <input
                  value={form.addressLine1}
                  onChange={(event) =>
                    updateField("addressLine1", event.target.value)
                  }
                />
                {errors.addressLine1 ? (
                  <small className="fieldError">{errors.addressLine1}</small>
                ) : null}
              </label>

              <label className="fullField">
                <span>Address line 2</span>
                <input
                  value={form.addressLine2}
                  onChange={(event) =>
                    updateField("addressLine2", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Town or city *</span>
                <input
                  value={form.townCity}
                  onChange={(event) =>
                    updateField("townCity", event.target.value)
                  }
                />
                {errors.townCity ? (
                  <small className="fieldError">{errors.townCity}</small>
                ) : null}
              </label>

              <label>
                <span>County or region</span>
                <input
                  value={form.countyRegion}
                  onChange={(event) =>
                    updateField("countyRegion", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Postcode *</span>
                <input
                  value={form.postcode}
                  onChange={(event) =>
                    updateField("postcode", event.target.value)
                  }
                />
                {errors.postcode ? (
                  <small className="fieldError">{errors.postcode}</small>
                ) : null}
              </label>

              <label>
                <span>Country</span>
                <input
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="formCard">
            <p className="eyebrow">ELIGIBILITY</p>
            <h2>Right to work</h2>

            <label>
              <span>Do you currently have the right to work in the UK? *</span>
              <select
                value={form.rightToWork}
                onChange={(event) =>
                  updateField(
                    "rightToWork",
                    event.target.value as ApplicationForm["rightToWork"],
                  )
                }
              >
                <option value="">Select an answer</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              {errors.rightToWork ? (
                <small className="fieldError">{errors.rightToWork}</small>
              ) : null}
            </label>

            <p className="fieldHelp">
              Evidence will only be requested at the appropriate stage of the
              recruitment process.
            </p>
          </section>

          <section className="formCard">
            <p className="eyebrow">CURRENT EXPERIENCE</p>
            <h2>Employment information</h2>

            <div className="fieldGrid">
              <label>
                <span>Current job title</span>
                <input
                  value={form.currentJobTitle}
                  onChange={(event) =>
                    updateField("currentJobTitle", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Current employer</span>
                <input
                  value={form.currentEmployer}
                  onChange={(event) =>
                    updateField("currentEmployer", event.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="formCard">
            <p className="eyebrow">DOCUMENTS</p>
            <h2>Upload your application documents</h2>

            <div className="uploadGrid">
              <label className="uploadBox">
                <span>CV *</span>
                <small>PDF, Word, RTF, text or image. Maximum 15 MB.</small>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png"
                  onChange={(event) => addFiles("cv", event)}
                />
              </label>

              <label className="uploadBox">
                <span>Cover letter</span>
                <small>Optional supporting document.</small>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png"
                  onChange={(event) => addFiles("cover_letter", event)}
                />
              </label>

              <label className="uploadBox">
                <span>Supporting document</span>
                <small>Portfolio or other relevant evidence.</small>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png"
                  onChange={(event) =>
                    addFiles("supporting_document", event)
                  }
                />
              </label>
            </div>

            {errors.cv ? (
              <small className="fieldError blockError">{errors.cv}</small>
            ) : null}

            {uploads.length ? (
              <div className="uploadList">
                {uploads.map((upload) => (
                  <div key={upload.id}>
                    <span>{upload.file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeUpload(upload.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <label className="fullField">
              <span>Covering statement</span>
              <textarea
                rows={7}
                value={form.coverLetter}
                onChange={(event) =>
                  updateField("coverLetter", event.target.value)
                }
                placeholder="Explain why you are interested in the role and what you would bring."
              />
            </label>
          </section>

          {questions.length ? (
            <section className="formCard">
              <p className="eyebrow">APPLICATION QUESTIONS</p>
              <h2>Role-specific questions</h2>

              <div className="questionList">
                {questions.map((question, index) => (
                  <label key={question.id} className="questionField">
                    <span>
                      {index + 1}. {question.question_text}
                      {question.is_required ? " *" : ""}
                    </span>
                    {question.help_text ? (
                      <small>{question.help_text}</small>
                    ) : null}
                    {renderQuestion(question)}
                  </label>
                ))}
              </div>

              {errors.questions ? (
                <small className="fieldError blockError">
                  {errors.questions}
                </small>
              ) : null}
            </section>
          ) : null}

          <section className="formCard">
            <p className="eyebrow">CONSENT AND DECLARATION</p>
            <h2>Review before submitting</h2>

            <label className="choiceRow">
              <input
                type="checkbox"
                checked={form.consentToContact}
                onChange={(event) =>
                  updateField("consentToContact", event.target.checked)
                }
              />
              <span>
                I consent to being contacted about suitable future vacancies.
              </span>
            </label>

            <label className="choiceRow">
              <input
                type="checkbox"
                checked={form.privacyAccepted}
                onChange={(event) =>
                  updateField("privacyAccepted", event.target.checked)
                }
              />
              <span>
                I confirm that I have read the organisation&apos;s candidate
                privacy information. *
              </span>
            </label>
            {errors.privacyAccepted ? (
              <small className="fieldError blockError">
                {errors.privacyAccepted}
              </small>
            ) : null}

            <label className="choiceRow">
              <input
                type="checkbox"
                checked={form.declarationAccepted}
                onChange={(event) =>
                  updateField("declarationAccepted", event.target.checked)
                }
              />
              <span>
                I confirm that the information in this application is complete
                and accurate to the best of my knowledge. *
              </span>
            </label>
            {errors.declarationAccepted ? (
              <small className="fieldError blockError">
                {errors.declarationAccepted}
              </small>
            ) : null}
          </section>
        </div>

        <aside className="sideColumn">
          <section className="summaryCard">
            <p className="eyebrow">APPLICATION SUMMARY</p>
            <h2>{vacancy.title}</h2>

            <dl>
              <div>
                <dt>Employer</dt>
                <dd>{vacancy.organisation_name}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{vacancy.location_name || "Not stated"}</dd>
              </div>
              <div>
                <dt>Closing date</dt>
                <dd>{formatDate(vacancy.closing_date)}</dd>
              </div>
            </dl>

            <button
              type="submit"
              className="primaryButton fullButton"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>

            <button
              type="button"
              className="secondaryButton fullButton"
              onClick={saveDraft}
              disabled={savingDraft || submitting}
            >
              {savingDraft ? "Saving…" : "Save draft on this device"}
            </button>

            <p className="smallPrint">
              Saved drafts remain only in this browser until you submit the
              application.
            </p>
          </section>
        </aside>
      </form>

      <footer className="siteFooter">
        <span>Powered by LEO Careers</span>
        <span>Employment intelligence for employers in England &amp; Wales.</span>
      </footer>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          background: #ffffff;
          color: #20262a;
        }

        .applicationPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 95% 0%, rgba(110, 80, 132, 0.08), transparent 30rem),
            linear-gradient(180deg, #f5fff9 0, #ffffff 34rem);
        }

        .siteHeader,
        .applicationHero,
        .pageGrid,
        .siteFooter {
          width: min(1180px, calc(100% - 40px));
          margin-inline: auto;
        }

        .siteHeader {
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brandLink {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          color: #2b2033;
          text-decoration: none;
        }

        .brandMark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #6e5084;
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(110, 80, 132, 0.2);
        }

        .brandLink strong,
        .brandLink small {
          display: block;
        }

        .brandLink strong {
          font-size: 18px;
          letter-spacing: 0.08em;
        }

        .brandLink small {
          color: #6e5084;
          font-size: 12px;
        }

        .headerLink {
          color: #6e5084;
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
        }

        .applicationHero {
          margin-top: 28px;
          border: 1px solid rgba(110, 80, 132, 0.14);
          border-radius: 25px;
          background: linear-gradient(135deg, #ffffff, #f5fff9);
          padding: 38px;
          box-shadow: 0 22px 58px rgba(49, 39, 57, 0.08);
        }

        .organisationLine {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .organisationLogo,
        .organisationInitial {
          width: 58px;
          height: 58px;
          border-radius: 15px;
        }

        .organisationLogo {
          object-fit: contain;
          border: 1px solid #e5e8e7;
          background: #ffffff;
          padding: 7px;
        }

        .organisationInitial {
          display: grid;
          place-items: center;
          background: #6e5084;
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #6e5084;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.12em;
        }

        .organisationName {
          margin: 0;
          color: #3c463f;
          font-weight: 750;
        }

        .applicationHero h1 {
          margin: 28px 0 0;
          color: #251d2b;
          font-size: clamp(40px, 6vw, 66px);
          line-height: 1.03;
          letter-spacing: -0.05em;
        }

        .applicationHero > p {
          max-width: 760px;
          margin: 20px 0 0;
          color: #5f6b65;
          line-height: 1.75;
        }

        .vacancyMeta {
          margin-top: 24px;
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .vacancyMeta span {
          border-radius: 999px;
          background: #ffffff;
          padding: 8px 11px;
          color: #58645e;
          font-size: 12px;
        }

        .pageGrid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(290px, 0.65fr);
          gap: 24px;
          align-items: start;
          padding-bottom: 74px;
        }

        .formColumn {
          display: grid;
          gap: 24px;
        }

        .sideColumn {
          position: sticky;
          top: 20px;
        }

        .formCard,
        .summaryCard {
          border: 1px solid #e1e7e4;
          border-radius: 20px;
          background: #ffffff;
          padding: 28px;
          box-shadow: 0 12px 34px rgba(49, 57, 53, 0.055);
        }

        .formCard h2,
        .summaryCard h2 {
          margin: 0;
          color: #29212f;
          font-size: clamp(27px, 3.4vw, 39px);
          line-height: 1.12;
          letter-spacing: -0.035em;
        }

        .fieldGrid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        label {
          display: grid;
          gap: 7px;
          color: #46514b;
          font-size: 13px;
          font-weight: 750;
        }

        .fullField {
          grid-column: 1 / -1;
          margin-top: 20px;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid #d8dfdb;
          border-radius: 10px;
          background: #ffffff;
          padding: 12px 13px;
          color: #26302b;
          font: inherit;
          font-size: 14px;
          outline: none;
        }

        input,
        select {
          min-height: 46px;
        }

        textarea {
          resize: vertical;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #6e5084;
          box-shadow: 0 0 0 3px rgba(110, 80, 132, 0.12);
        }

        .fieldHelp {
          margin: 12px 0 0;
          color: #748079;
          font-size: 12px;
          line-height: 1.6;
        }

        .fieldError {
          color: #a3475b;
          font-size: 12px;
          font-weight: 700;
        }

        .blockError {
          display: block;
          margin-top: 12px;
        }

        .uploadGrid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .uploadBox {
          min-height: 150px;
          align-content: center;
          border: 1px dashed #c8d1cc;
          border-radius: 14px;
          background: #fbfdfc;
          padding: 18px;
          cursor: pointer;
        }

        .uploadBox small {
          color: #76817b;
          font-weight: 500;
          line-height: 1.5;
        }

        .uploadBox input {
          border: 0;
          padding: 0;
          min-height: auto;
        }

        .uploadList {
          margin-top: 18px;
          display: grid;
          gap: 10px;
        }

        .uploadList > div {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          border: 1px solid #e4e9e6;
          border-radius: 10px;
          padding: 11px 13px;
          font-size: 13px;
        }

        .uploadList button {
          border: 0;
          background: transparent;
          color: #a3475b;
          cursor: pointer;
          font-weight: 750;
        }

        .questionList {
          margin-top: 22px;
          display: grid;
          gap: 22px;
        }

        .questionField > small {
          color: #77817c;
          font-weight: 500;
        }

        .checkboxGroup {
          display: grid;
          gap: 9px;
        }

        .choiceRow {
          grid-template-columns: auto 1fr;
          align-items: start;
          margin-top: 16px;
          font-weight: 600;
          line-height: 1.6;
        }

        .choiceRow input {
          width: 18px;
          height: 18px;
          min-height: 0;
          margin-top: 3px;
        }

        .summaryCard dl {
          margin: 22px 0;
        }

        .summaryCard dl > div {
          border-top: 1px solid #edf0ee;
          padding: 13px 0;
        }

        .summaryCard dt {
          color: #7a847f;
          font-size: 11px;
          text-transform: uppercase;
        }

        .summaryCard dd {
          margin: 5px 0 0;
          color: #354039;
          font-size: 13px;
          font-weight: 750;
        }

        .primaryButton,
        .secondaryButton {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          padding: 0 18px;
          font: inherit;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          text-decoration: none;
        }

        .primaryButton {
          border: 1px solid #6e5084;
          background: #6e5084;
          color: #ffffff;
        }

        .secondaryButton {
          margin-top: 12px;
          border: 1px solid #d8d2dc;
          background: #ffffff;
          color: #604772;
        }

        .fullButton {
          width: 100%;
        }

        .primaryButton:disabled,
        .secondaryButton:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .smallPrint {
          margin: 15px 0 0;
          color: #78827d;
          font-size: 12px;
          line-height: 1.55;
        }

        .errorBanner,
        .noticeBanner {
          border-radius: 13px;
          padding: 14px 16px;
          font-size: 13px;
          line-height: 1.6;
        }

        .errorBanner {
          border: 1px solid #efc6cf;
          background: #fff4f6;
          color: #8f3f52;
        }

        .noticeBanner {
          border: 1px solid #cce4d8;
          background: #f5fff9;
          color: #3f7058;
        }

        .siteFooter {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid #e7ebe9;
          padding: 27px 0 35px;
          color: #707b75;
          font-size: 12px;
        }

        @media (max-width: 980px) {
          .pageGrid {
            grid-template-columns: 1fr;
          }

          .sideColumn {
            position: static;
          }
        }

        @media (max-width: 760px) {
          .siteHeader,
          .applicationHero,
          .pageGrid,
          .siteFooter {
            width: min(100% - 28px, 1180px);
          }

          .applicationHero {
            padding: 27px 23px;
          }

          .fieldGrid,
          .uploadGrid {
            grid-template-columns: 1fr;
          }

          .fullField {
            grid-column: auto;
          }

          .siteFooter {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}

const stateStyles = `
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    background: #f5fff9;
  }

  .statePage {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at 90% 5%, rgba(110, 80, 132, 0.1), transparent 28rem),
      #f5fff9;
    padding: 30px;
    color: #25202a;
    text-align: center;
  }

  .statePage h1 {
    margin: 20px 0 8px;
    font-size: clamp(30px, 5vw, 48px);
    letter-spacing: -0.04em;
  }

  .statePage p {
    max-width: 560px;
    margin: 0;
    color: #66716c;
    line-height: 1.7;
  }

  .spinner,
  .successIcon,
  .errorIcon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border-radius: 50%;
  }

  .spinner {
    border: 3px solid #dfe7e2;
    border-top-color: #6e5084;
    animation: spin 800ms linear infinite;
  }

  .successIcon {
    background: #ffffff;
    color: #4d7b63;
    font-weight: 850;
  }

  .errorIcon {
    background: #fff3f5;
    color: #a64d61;
    font-weight: 850;
  }

  .referenceBox {
    margin-top: 24px;
    border: 1px solid #dfe7e2;
    border-radius: 13px;
    background: #ffffff;
    padding: 15px 20px;
  }

  .referenceBox span,
  .referenceBox strong {
    display: block;
  }

  .referenceBox span {
    color: #76817b;
    font-size: 11px;
    text-transform: uppercase;
  }

  .referenceBox strong {
    margin-top: 5px;
    color: #6e5084;
    font-size: 18px;
  }

  .primaryButton {
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 24px;
    border: 1px solid #6e5084;
    border-radius: 11px;
    background: #6e5084;
    padding: 0 18px;
    color: #ffffff;
    font: inherit;
    font-size: 14px;
    font-weight: 750;
    text-decoration: none;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;