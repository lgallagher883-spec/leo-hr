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
import { supabase } from "@/lib/supabase";

type TalentPoolStatus =
  | "not_added"
  | "active"
  | "do_not_contact"
  | "withdrawn"
  | "archived";

type CandidateFilter =
  | "current"
  | "talent_pool"
  | "internal"
  | "consent"
  | "retention_review"
  | "do_not_contact"
  | "archived"
  | "all";

type CandidateSkill = string | Record<string, unknown>;

type PreferredEmploymentType =
  | "not_recorded"
  | "full_time"
  | "part_time"
  | "temporary"
  | "fixed_term"
  | "casual"
  | "flexible";

type CandidateDocumentType =
  | "cv"
  | "cover_letter"
  | "other";

type CandidateDocument = {
  id: string;
  candidate_id: string;
  document_type: CandidateDocumentType;
  title: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
};

type CandidateUploadState = {
  cv: File | null;
  coverLetter: File | null;
  supportingDocuments: File[];
};

const emptyUploads = (): CandidateUploadState => ({
  cv: null,
  coverLetter: null,
  supportingDocuments: [],
});

type CandidateApplication = {
  id: string;
  application_reference: string;
  current_stage_key: string;
  status: string;
  submitted_at: string | null;
  updated_at: string;
  vacancy:
    | {
        id: string;
        vacancy_reference: string;
        title: string;
        department: string | null;
        location_name: string | null;
      }
    | null;
};

type TalentCandidate = {
  id: string;
  organisation_id: string | null;
  candidate_reference: string;
  first_name: string;
  middle_names: string | null;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  town_city: string | null;
  county_region: string | null;
  postcode: string | null;
  country: string | null;
  is_internal_candidate: boolean;
  existing_employee_id: number | null;
  source: string | null;
  source_detail: string | null;
  talent_pool_status: TalentPoolStatus;
  consent_to_contact: boolean;
  consent_recorded_at: string | null;
  privacy_notice_version: string | null;
  data_retention_review_date: string | null;
  do_not_contact: boolean;
  do_not_contact_reason: string | null;
  current_job_title: string | null;
  current_employer: string | null;
  years_experience: number | null;
  preferred_location: string | null;
  preferred_employment_type: PreferredEmploymentType;
  salary_expectations: string | null;
  earliest_start_date: string | null;
  general_notes: string | null;
  summary: string | null;
  skills: CandidateSkill[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: string | null;
  archive_reason: string | null;
  applications: CandidateApplication[];
  documents: CandidateDocument[];
};

type CandidateFormState = {
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
  isInternalCandidate: boolean;
  existingEmployeeId: string;
  source: string;
  sourceDetail: string;
  talentPoolStatus: TalentPoolStatus;
  consentToContact: boolean;
  privacyNoticeVersion: string;
  dataRetentionReviewDate: string;
  doNotContact: boolean;
  doNotContactReason: string;
  currentJobTitle: string;
  currentEmployer: string;
  yearsExperience: string;
  preferredLocation: string;
  preferredEmploymentType: PreferredEmploymentType;
  salaryExpectations: string;
  earliestStartDate: string;
  generalNotes: string;
  summary: string;
  skills: string;
};

const emptyForm: CandidateFormState = {
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
  isInternalCandidate: false,
  existingEmployeeId: "",
  source: "",
  sourceDetail: "",
  talentPoolStatus: "not_added",
  consentToContact: false,
  privacyNoticeVersion: "",
  dataRetentionReviewDate: "",
  doNotContact: false,
  doNotContactReason: "",
  currentJobTitle: "",
  currentEmployer: "",
  yearsExperience: "",
  preferredLocation: "",
  preferredEmploymentType: "not_recorded",
  salaryExpectations: "",
  earliestStartDate: "",
  generalNotes: "",
  summary: "",
  skills: "",
};

const filterOptions: Array<{
  value: CandidateFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "current", label: "Current" },
  { value: "talent_pool", label: "Talent Pool" },
  { value: "internal", label: "Internal" },
  { value: "consent", label: "Contact Consent" },
  { value: "retention_review", label: "Retention Review" },
  { value: "do_not_contact", label: "Do Not Contact" },
  { value: "archived", label: "Archived" },
];

const talentPoolOptions: Array<{
  value: TalentPoolStatus;
  label: string;
}> = [
  {
    value: "not_added",
    label: "Not Added",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "do_not_contact",
    label: "Do Not Contact",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

const employmentTypeOptions: Array<{
  value: PreferredEmploymentType;
  label: string;
}> = [
  { value: "not_recorded", label: "Not recorded" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "temporary", label: "Temporary" },
  { value: "fixed_term", label: "Fixed-term" },
  { value: "casual", label: "Casual" },
  { value: "flexible", label: "Flexible" },
];

export default function CandidatesWorkspace() {
  const [candidates, setCandidates] = useState<
    TalentCandidate[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionCandidateId, setActionCandidateId] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<CandidateFilter>("current");

  const [showForm, setShowForm] = useState(false);
  const [editingCandidateId, setEditingCandidateId] =
    useState<string | null>(null);

  const [selectedCandidateId, setSelectedCandidateId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<CandidateFormState>(emptyForm);

  const [uploads, setUploads] =
    useState<CandidateUploadState>(emptyUploads);

  const loadCandidates = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const { data, error: queryError } = await supabase
        .from("leo_talent_candidates")
        .select(
          `
            id,
            organisation_id,
            candidate_reference,
            first_name,
            middle_names,
            last_name,
            preferred_name,
            email,
            phone,
            address_line_1,
            address_line_2,
            town_city,
            county_region,
            postcode,
            country,
            is_internal_candidate,
            existing_employee_id,
            source,
            source_detail,
            talent_pool_status,
            consent_to_contact,
            consent_recorded_at,
            privacy_notice_version,
            data_retention_review_date,
            do_not_contact,
            do_not_contact_reason,
            current_job_title,
            current_employer,
            years_experience,
            preferred_location,
            preferred_employment_type,
            salary_expectations,
            earliest_start_date,
            general_notes,
            summary,
            skills,
            metadata,
            created_by,
            updated_by,
            created_at,
            updated_at,
            archived_at,
            archived_by,
            archive_reason,
            documents:leo_talent_candidate_documents (
              id,
              candidate_id,
              document_type,
              title,
              file_name,
              file_path,
              mime_type,
              file_size_bytes,
              created_at
            ),
            applications:leo_talent_applications (
              id,
              application_reference,
              current_stage_key,
              status,
              submitted_at,
              updated_at,
              vacancy:leo_talent_vacancies (
                id,
                vacancy_reference,
                title,
                department,
                location_name
              )
            )
          `,
        )
        .order("updated_at", {
          ascending: false,
        });

      if (queryError) {
        console.error(
          "Unable to load Leo Talent candidates:",
          queryError,
        );

        setCandidates([]);
        setError(
          "Leo could not load the candidate register. Check that the Talent database foundation has been completed, then try again.",
        );
      } else {
        setCandidates(
          normaliseCandidates(data ?? []),
        );
      }

      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const metrics = useMemo(() => {
    const today = startOfToday();

    return {
      total: candidates.filter(
        (candidate) => !candidate.archived_at,
      ).length,

      activeTalentPool: candidates.filter(
        (candidate) =>
          candidate.talent_pool_status === "active" &&
          !candidate.archived_at,
      ).length,

      internal: candidates.filter(
        (candidate) =>
          candidate.is_internal_candidate &&
          !candidate.archived_at,
      ).length,

      activeApplications: candidates.filter(
        (candidate) =>
          !candidate.archived_at &&
          candidate.applications.some((application) =>
            isActiveApplication(application.status),
          ),
      ).length,

      retentionReview: candidates.filter(
        (candidate) =>
          !candidate.archived_at &&
          candidate.data_retention_review_date !== null &&
          new Date(
            `${candidate.data_retention_review_date}T00:00:00`,
          ).getTime() <= today.getTime(),
      ).length,

      noContact: candidates.filter(
        (candidate) =>
          candidate.do_not_contact &&
          !candidate.archived_at,
      ).length,
    };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const today = startOfToday();

    return candidates.filter((candidate) => {
      const fullName = getCandidateName(candidate)
        .toLowerCase();

      const formalName = [
        candidate.first_name,
        candidate.middle_names,
        candidate.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const skills = normaliseSkills(candidate.skills)
        .join(" ")
        .toLowerCase();

      const applicationSearch =
        candidate.applications
          .map((application) =>
            [
              application.application_reference,
              application.current_stage_key,
              application.status,
              application.vacancy?.title,
              application.vacancy?.vacancy_reference,
              application.vacancy?.department,
              application.vacancy?.location_name,
            ]
              .filter(Boolean)
              .join(" "),
          )
          .join(" ")
          .toLowerCase();

      const matchesSearch =
        search.length === 0 ||
        fullName.includes(search) ||
        formalName.includes(search) ||
        candidate.candidate_reference
          .toLowerCase()
          .includes(search) ||
        candidate.email?.toLowerCase().includes(search) ||
        candidate.phone?.toLowerCase().includes(search) ||
        candidate.postcode
          ?.toLowerCase()
          .includes(search) ||
        candidate.source?.toLowerCase().includes(search) ||
        candidate.source_detail
          ?.toLowerCase()
          .includes(search) ||
        skills.includes(search) ||
        applicationSearch.includes(search);

      let matchesFilter = true;

      switch (activeFilter) {
        case "current":
          matchesFilter =
            candidate.archived_at === null;
          break;

        case "talent_pool":
          matchesFilter =
            candidate.talent_pool_status === "active" &&
            candidate.archived_at === null;
          break;

        case "internal":
          matchesFilter =
            candidate.is_internal_candidate &&
            candidate.archived_at === null;
          break;

        case "consent":
          matchesFilter =
            candidate.consent_to_contact &&
            !candidate.do_not_contact &&
            candidate.archived_at === null;
          break;

        case "retention_review":
          matchesFilter =
            candidate.data_retention_review_date !==
              null &&
            new Date(
              `${candidate.data_retention_review_date}T00:00:00`,
            ).getTime() <= today.getTime() &&
            candidate.archived_at === null;
          break;

        case "do_not_contact":
          matchesFilter =
            candidate.do_not_contact &&
            candidate.archived_at === null;
          break;

        case "archived":
          matchesFilter =
            candidate.archived_at !== null;
          break;

        case "all":
          matchesFilter = true;
          break;
      }

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, candidates, searchTerm]);

  function openCreateForm() {
    setEditingCandidateId(null);
    setForm(emptyForm);
    setUploads(emptyUploads());
    setFormError(null);
    setSelectedCandidateId(null);
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditForm(candidate: TalentCandidate) {
    setEditingCandidateId(candidate.id);

    setForm({
      firstName: candidate.first_name,
      middleNames: candidate.middle_names ?? "",
      lastName: candidate.last_name,
      preferredName: candidate.preferred_name ?? "",
      email: candidate.email ?? "",
      phone: candidate.phone ?? "",
      addressLine1: candidate.address_line_1 ?? "",
      addressLine2: candidate.address_line_2 ?? "",
      townCity: candidate.town_city ?? "",
      countyRegion: candidate.county_region ?? "",
      postcode: candidate.postcode ?? "",
      country: candidate.country ?? "United Kingdom",
      isInternalCandidate:
        candidate.is_internal_candidate,
      existingEmployeeId:
        candidate.existing_employee_id !== null
          ? String(candidate.existing_employee_id)
          : "",
      source: candidate.source ?? "",
      sourceDetail: candidate.source_detail ?? "",
      talentPoolStatus:
        candidate.talent_pool_status,
      consentToContact:
        candidate.consent_to_contact,
      privacyNoticeVersion:
        candidate.privacy_notice_version ?? "",
      dataRetentionReviewDate:
        candidate.data_retention_review_date ?? "",
      doNotContact: candidate.do_not_contact,
      doNotContactReason:
        candidate.do_not_contact_reason ?? "",
      currentJobTitle: candidate.current_job_title ?? "",
      currentEmployer: candidate.current_employer ?? "",
      yearsExperience:
        candidate.years_experience !== null
          ? String(candidate.years_experience)
          : "",
      preferredLocation: candidate.preferred_location ?? "",
      preferredEmploymentType:
        candidate.preferred_employment_type ?? "not_recorded",
      salaryExpectations: candidate.salary_expectations ?? "",
      earliestStartDate: candidate.earliest_start_date ?? "",
      generalNotes: candidate.general_notes ?? "",
      summary: candidate.summary ?? "",
      skills: normaliseSkills(candidate.skills).join(
        ", ",
      ),
    });

    setUploads(emptyUploads());
    setFormError(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    if (!editingCandidateId) {
      setSelectedCandidateId(null);
    }
    setEditingCandidateId(null);
    setForm(emptyForm);
    setUploads(emptyUploads());
    setFormError(null);
  }

  function updateForm<K extends keyof CandidateFormState>(
    key: K,
    value: CandidateFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveCandidate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError(null);
    setError(null);

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = normaliseOptionalText(form.email);

    if (!firstName) {
      setFormError("Enter the candidate’s first name.");
      return;
    }

    if (!lastName) {
      setFormError("Enter the candidate’s last name.");
      return;
    }

    if (email && !isValidEmail(email)) {
      setFormError(
        "Enter a valid email address or leave the email field empty.",
      );
      return;
    }

    if (
      form.isInternalCandidate &&
      form.existingEmployeeId.trim() &&
      !isPositiveWholeNumber(
        form.existingEmployeeId,
      )
    ) {
      setFormError(
        "The employee reference must be a whole number.",
      );
      return;
    }

    if (
      form.yearsExperience.trim() &&
      (!Number.isFinite(Number(form.yearsExperience)) ||
        Number(form.yearsExperience) < 0 ||
        Number(form.yearsExperience) > 80)
    ) {
      setFormError(
        "Enter years of experience between 0 and 80, or leave it blank.",
      );
      return;
    }

    if (
      form.doNotContact &&
      !form.doNotContactReason.trim()
    ) {
      setFormError(
        "Add a brief reason when Do Not Contact is selected.",
      );
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();

    const existingCandidate =
      editingCandidateId !== null
        ? candidates.find(
            (candidate) =>
              candidate.id === editingCandidateId,
          )
        : null;

    const consentWasPreviouslyRecorded =
      existingCandidate?.consent_to_contact ?? false;

    const payload = {
      first_name: firstName,
      middle_names: normaliseOptionalText(
        form.middleNames,
      ),
      last_name: lastName,
      preferred_name: normaliseOptionalText(
        form.preferredName,
      ),
      email,
      phone: normaliseOptionalText(form.phone),
      address_line_1: normaliseOptionalText(
        form.addressLine1,
      ),
      address_line_2: normaliseOptionalText(
        form.addressLine2,
      ),
      town_city: normaliseOptionalText(form.townCity),
      county_region: normaliseOptionalText(
        form.countyRegion,
      ),
      postcode: normaliseOptionalText(
        form.postcode,
      )?.toUpperCase(),
      country:
        normaliseOptionalText(form.country) ??
        "United Kingdom",
      is_internal_candidate:
        form.isInternalCandidate,
      existing_employee_id:
        form.isInternalCandidate &&
        form.existingEmployeeId.trim()
          ? Number(form.existingEmployeeId)
          : null,
      source: normaliseOptionalText(form.source),
      source_detail: normaliseOptionalText(
        form.sourceDetail,
      ),
      talent_pool_status: form.doNotContact
        ? "do_not_contact"
        : form.talentPoolStatus,
      consent_to_contact:
        form.consentToContact &&
        !form.doNotContact,
      consent_recorded_at:
        form.consentToContact &&
        !form.doNotContact
          ? consentWasPreviouslyRecorded
            ? existingCandidate?.consent_recorded_at ??
              now
            : now
          : null,
      privacy_notice_version:
        normaliseOptionalText(
          form.privacyNoticeVersion,
        ),
      data_retention_review_date:
        normaliseOptionalText(
          form.dataRetentionReviewDate,
        ),
      do_not_contact: form.doNotContact,
      do_not_contact_reason: form.doNotContact
        ? normaliseOptionalText(
            form.doNotContactReason,
          )
        : null,
      current_job_title: normaliseOptionalText(
        form.currentJobTitle,
      ),
      current_employer: normaliseOptionalText(
        form.currentEmployer,
      ),
      years_experience: form.yearsExperience.trim()
        ? Number(form.yearsExperience)
        : null,
      preferred_location: normaliseOptionalText(
        form.preferredLocation,
      ),
      preferred_employment_type:
        form.preferredEmploymentType,
      salary_expectations: normaliseOptionalText(
        form.salaryExpectations,
      ),
      earliest_start_date: normaliseOptionalText(
        form.earliestStartDate,
      ),
      general_notes: normaliseOptionalText(
        form.generalNotes,
      ),
      summary: normaliseOptionalText(form.summary),
      skills: parseSkills(form.skills),
      updated_at: now,
    };

    let savedCandidateId = editingCandidateId;
    let savedOrganisationId =
      existingCandidate?.organisation_id ?? null;

    if (editingCandidateId) {
      const { data: updatedCandidate, error: updateError } =
        await supabase
          .from("leo_talent_candidates")
          .update(payload)
          .eq("id", editingCandidateId)
          .select("id, organisation_id")
          .single();

      if (updateError) {
        console.error(
          "Unable to update candidate:",
          updateError,
        );

        setFormError(
          getCandidateSaveError(
            updateError.message,
            "Leo could not update the candidate record.",
          ),
        );

        setSaving(false);
        return;
      }

      savedCandidateId = updatedCandidate.id;
      savedOrganisationId = updatedCandidate.organisation_id;
    } else {
      const { data: createdCandidate, error: insertError } =
        await supabase
          .from("leo_talent_candidates")
          .insert({
            ...payload,
            created_at: now,
          })
          .select("id, organisation_id")
          .single();

      if (insertError) {
        console.error(
          "Unable to create candidate:",
          insertError,
        );

        setFormError(
          getCandidateSaveError(
            insertError.message,
            "Leo could not create the candidate record.",
          ),
        );

        setSaving(false);
        return;
      }

      savedCandidateId = createdCandidate.id;
      savedOrganisationId = createdCandidate.organisation_id;
    }

    if (savedCandidateId && hasSelectedUploads(uploads)) {
      const uploadError = await uploadCandidateDocuments({
        candidateId: savedCandidateId,
        organisationId: savedOrganisationId,
        uploads,
      });

      if (uploadError) {
        setFormError(
          `The candidate record was saved, but ${uploadError}`,
        );
        setSaving(false);
        await loadCandidates(true);
        return;
      }
    }

    setSaving(false);
    setShowForm(false);
    setEditingCandidateId(null);
    setForm(emptyForm);
    setUploads(emptyUploads());
    setFormError(null);

    await loadCandidates(true);

    if (savedCandidateId) {
      setSelectedCandidateId(savedCandidateId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function archiveCandidate(
    candidate: TalentCandidate,
  ) {
    const activeApplications =
      candidate.applications.filter((application) =>
        isActiveApplication(application.status),
      );

    const warning =
      activeApplications.length > 0
        ? `This candidate has ${activeApplications.length} active application${
            activeApplications.length === 1
              ? ""
              : "s"
          }. Archiving the candidate will not delete those application records. Continue?`
        : `Archive ${getCandidateName(
            candidate,
          )}? The record will remain available in the Archived view.`;

    const confirmed = window.confirm(warning);

    if (!confirmed) {
      return;
    }

    setActionCandidateId(candidate.id);
    setError(null);

    const now = new Date().toISOString();

    const { error: archiveError } = await supabase
      .from("leo_talent_candidates")
      .update({
        archived_at: now,
        archive_reason:
          candidate.archive_reason ??
          "Archived from the Candidates workspace.",
        talent_pool_status: "archived",
        updated_at: now,
      })
      .eq("id", candidate.id);

    if (archiveError) {
      console.error(
        "Unable to archive candidate:",
        archiveError,
      );

      setError(
        "Leo could not archive this candidate. No changes were made.",
      );

      setActionCandidateId(null);
      return;
    }

    if (selectedCandidateId === candidate.id) {
      setSelectedCandidateId(null);
    }

    await loadCandidates(true);
    setActionCandidateId(null);
  }

  async function restoreCandidate(
    candidate: TalentCandidate,
  ) {
    setActionCandidateId(candidate.id);
    setError(null);

    const { error: restoreError } = await supabase
      .from("leo_talent_candidates")
      .update({
        archived_at: null,
        archived_by: null,
        archive_reason: null,
        talent_pool_status: "not_added",
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidate.id);

    if (restoreError) {
      console.error(
        "Unable to restore candidate:",
        restoreError,
      );

      setError(
        "Leo could not restore this candidate. No changes were made.",
      );

      setActionCandidateId(null);
      return;
    }

    await loadCandidates(true);
    setActionCandidateId(null);
  }

  async function openCandidateDocument(
    document: CandidateDocument,
  ) {
    setError(null);

    const { data, error: signedUrlError } =
      await supabase.storage
        .from("leo-talent-candidate-documents")
        .createSignedUrl(document.file_path, 60);

    if (signedUrlError || !data?.signedUrl) {
      console.error(
        "Unable to open candidate document:",
        signedUrlError,
      );
      setError(
        "Leo could not open this candidate document.",
      );
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  function exportCurrentView() {
    if (filteredCandidates.length === 0) {
      window.alert(
        "There are no candidates in the current view to export.",
      );

      return;
    }

    const headers = [
      "Candidate Reference",
      "First Name",
      "Middle Names",
      "Last Name",
      "Preferred Name",
      "Email",
      "Phone",
      "Address Line 1",
      "Address Line 2",
      "Town or City",
      "County or Region",
      "Postcode",
      "Country",
      "Internal Candidate",
      "Employee Reference",
      "Source",
      "Source Detail",
      "Talent Pool Status",
      "Consent to Contact",
      "Consent Recorded",
      "Privacy Notice Version",
      "Retention Review Date",
      "Do Not Contact",
      "Do Not Contact Reason",
      "Current Job Title",
      "Current Employer",
      "Years of Experience",
      "Preferred Location",
      "Preferred Employment Type",
      "Salary Expectations",
      "Earliest Start Date",
      "Professional Summary",
      "General Notes",
      "Documents",
      "Skills",
      "Applications",
      "Active Applications",
      "Created",
      "Last Updated",
      "Archived",
    ];

    const rows = filteredCandidates.map(
      (candidate) => [
        candidate.candidate_reference,
        candidate.first_name,
        candidate.middle_names ?? "",
        candidate.last_name,
        candidate.preferred_name ?? "",
        candidate.email ?? "",
        candidate.phone ?? "",
        candidate.address_line_1 ?? "",
        candidate.address_line_2 ?? "",
        candidate.town_city ?? "",
        candidate.county_region ?? "",
        candidate.postcode ?? "",
        candidate.country ?? "",
        candidate.is_internal_candidate
          ? "Yes"
          : "No",
        candidate.existing_employee_id !== null
          ? String(candidate.existing_employee_id)
          : "",
        candidate.source ?? "",
        candidate.source_detail ?? "",
        formatValue(candidate.talent_pool_status),
        candidate.consent_to_contact ? "Yes" : "No",
        candidate.consent_recorded_at ?? "",
        candidate.privacy_notice_version ?? "",
        candidate.data_retention_review_date ?? "",
        candidate.do_not_contact ? "Yes" : "No",
        candidate.do_not_contact_reason ?? "",
        candidate.current_job_title ?? "",
        candidate.current_employer ?? "",
        candidate.years_experience !== null
          ? String(candidate.years_experience)
          : "",
        candidate.preferred_location ?? "",
        formatValue(candidate.preferred_employment_type),
        candidate.salary_expectations ?? "",
        candidate.earliest_start_date ?? "",
        candidate.summary ?? "",
        candidate.general_notes ?? "",
        String(candidate.documents.length),
        normaliseSkills(candidate.skills).join("; "),
        String(candidate.applications.length),
        String(
          candidate.applications.filter((application) =>
            isActiveApplication(application.status),
          ).length,
        ),
        candidate.created_at,
        candidate.updated_at,
        candidate.archived_at ? "Yes" : "No",
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

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `leo-talent-candidates-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div>
        <WorkspaceHeading />

        <div style={loadingPanelStyle}>
          <div style={spinnerStyle} />

          <strong style={loadingTitleStyle}>
            Loading candidates
          </strong>

          <p style={loadingTextStyle}>
            Leo is preparing the candidate register.
          </p>
        </div>
      </div>
    );
  }

  const selectedCandidate = selectedCandidateId
    ? candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null
    : null;

  if (showForm) {
    return (
      <div>
        <div style={standaloneViewHeaderStyle}>
          <button
            type="button"
            style={backButtonStyle}
            onClick={closeForm}
            disabled={saving}
          >
            ← {editingCandidateId ? "Back to candidate" : "Back to register"}
          </button>
        </div>

        <CandidateForm
          form={form}
          uploads={uploads}
          candidateReference={
            editingCandidateId
              ? candidates.find(
                  (candidate) => candidate.id === editingCandidateId,
                )?.candidate_reference ?? null
              : null
          }
          editing={editingCandidateId !== null}
          saving={saving}
          error={formError}
          onUpdate={updateForm}
          onUploadsChange={setUploads}
          onSubmit={saveCandidate}
          onCancel={closeForm}
        />
      </div>
    );
  }

  if (selectedCandidate) {
    return (
      <CandidateProfileView
        candidate={selectedCandidate}
        actioning={actionCandidateId === selectedCandidate.id}
        error={error}
        onBack={() => setSelectedCandidateId(null)}
        onEdit={() => openEditForm(selectedCandidate)}
        onArchive={() => void archiveCandidate(selectedCandidate)}
        onRestore={() => void restoreCandidate(selectedCandidate)}
        onOpenDocument={(document) => void openCandidateDocument(document)}
      />
    );
  }

  return (
    <div>
      <div style={workspaceHeaderStyle}>
        <div>
          <h2 style={workspaceTitleStyle}>
            Candidates
          </h2>


        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => void loadCandidates(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={exportCurrentView}
          >
            Export current view
          </button>

          <button
            type="button"
            style={primaryButtonStyle}
            onClick={openCreateForm}
          >
            Add Candidate
          </button>
        </div>
      </div>

      {error ? (
        <div style={errorPanelStyle}>
          <div>
            <strong style={errorTitleStyle}>
              Candidates could not be updated
            </strong>

            <p style={errorTextStyle}>{error}</p>
          </div>

          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => void loadCandidates(true)}
          >
            Try again
          </button>
        </div>
      ) : null}

      <div style={kpiGridStyle}>
        <KpiCard
          label="Candidates"
          value={String(metrics.total)}
        />

        <KpiCard
          label="Active Talent Pool"
          value={String(metrics.activeTalentPool)}
        />

        <KpiCard
          label="Internal Candidates"
          value={String(metrics.internal)}
        />

        <KpiCard
          label="With Active Applications"
          value={String(metrics.activeApplications)}
        />

        <KpiCard
          label="Retention Review"
          value={String(metrics.retentionReview)}
        />

        <KpiCard
          label="Do Not Contact"
          value={String(metrics.noContact)}
        />
      </div>

      <div style={registerPanelStyle}>
        <div style={registerHeadingStyle}>
          <div>
            <h3 style={panelTitleStyle}>
              Candidate Register
            </h3>

            <p style={panelDescriptionStyle}>
              Search and review candidate details,
              recruitment history, talent-pool status and
              retention controls.
            </p>
          </div>

          <span style={resultCountStyle}>
            {filteredCandidates.length}{" "}
            {filteredCandidates.length === 1
              ? "candidate"
              : "candidates"}
          </span>
        </div>

        <div style={filterAreaStyle}>
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>
              Search candidates
            </span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search by name, email, candidate reference, skill or vacancy"
              style={inputStyle}
            />
          </label>

          <div style={filterButtonRowStyle}>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setActiveFilter(option.value)
                }
                style={
                  activeFilter === option.value
                    ? activeFilterButtonStyle
                    : filterButtonStyle
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filteredCandidates.length === 0 ? (
          <div style={emptyPanelStyle}>
            <div style={emptyIconStyle}>✦</div>

            <strong style={emptyTitleStyle}>
              {candidates.length === 0
                ? "No candidates yet"
                : "No candidates match this view"}
            </strong>

            <p style={emptyTextStyle}>
              {candidates.length === 0
                ? "Candidate records will appear here once recruitment begins."
                : "Try changing the search term or selecting another register view."}
            </p>

            {candidates.length === 0 ? (
              <button
                type="button"
                style={emptyPrimaryButtonStyle}
                onClick={openCreateForm}
              >
                Add first candidate
              </button>
            ) : null}
          </div>
        ) : (
          <div style={candidateListStyle}>
            {filteredCandidates.map((candidate) => {
              const actioning =
                actionCandidateId === candidate.id;

              const activeApplications =
                candidate.applications.filter(
                  (application) =>
                    isActiveApplication(
                      application.status,
                    ),
                );

              const archived =
                candidate.archived_at !== null;

              const skills = normaliseSkills(
                candidate.skills,
              );

              return (
                <article
                  key={candidate.id}
                  style={candidateCardStyle}
                >
                  <div style={candidateHeadingStyle}>
                    <div style={candidateIdentityStyle}>
                      <div style={candidateAvatarStyle}>
                        {getCandidateInitials(candidate)}
                      </div>

                      <div>
                        <h4 style={candidateNameStyle}>
                          {getCandidateName(candidate)}
                        </h4>

                        <p
                          style={
                            candidateReferenceStyle
                          }
                        >
                          {candidate.candidate_reference}
                          {candidate.is_internal_candidate
                            ? " · Internal candidate"
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div style={badgeRowStyle}>
                      <span
                        style={getTalentPoolBadgeStyle(
                          candidate.talent_pool_status,
                        )}
                      >
                        {formatValue(
                          candidate.talent_pool_status,
                        )}
                      </span>

                      {candidate.do_not_contact ? (
                        <span
                          style={doNotContactBadgeStyle}
                        >
                          Do Not Contact
                        </span>
                      ) : candidate.consent_to_contact ? (
                        <span
                          style={consentBadgeStyle}
                        >
                          Contact Consent
                        </span>
                      ) : (
                        <span
                          style={neutralBadgeStyle}
                        >
                          No Contact Consent
                        </span>
                      )}

                      {archived ? (
                        <span
                          style={archivedBadgeStyle}
                        >
                          Archived
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div
                    style={candidateDetailsGridStyle}
                  >
                    <CandidateDetail
                      label="Email"
                      value={
                        candidate.email ??
                        "Not recorded"
                      }
                    />

                    <CandidateDetail
                      label="Phone"
                      value={
                        candidate.phone ??
                        "Not recorded"
                      }
                    />

                    <CandidateDetail
                      label="Location"
                      value={
                        [
                          candidate.town_city,
                          candidate.county_region,
                          candidate.postcode,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                        "Not recorded"
                      }
                    />

                    <CandidateDetail
                      label="Source"
                      value={
                        candidate.source ??
                        "Not recorded"
                      }
                      help={
                        candidate.source_detail ??
                        undefined
                      }
                    />

                    <CandidateDetail
                      label="Applications"
                      value={String(
                        candidate.applications.length,
                      )}
                      help={`${activeApplications.length} active`}
                    />

                    <CandidateDetail
                      label="Retention Review"
                      value={formatDate(
                        candidate.data_retention_review_date,
                      )}
                      help={getRetentionReviewHelp(
                        candidate.data_retention_review_date,
                      )}
                    />
                  </div>

                  {skills.length > 0 ? (
                    <div style={skillsRowStyle}>
                      {skills
                        .slice(0, 6)
                        .map((skill) => (
                          <span
                            key={skill}
                            style={skillBadgeStyle}
                          >
                            {skill}
                          </span>
                        ))}

                      {skills.length > 6 ? (
                        <span style={moreBadgeStyle}>
                          +{skills.length - 6} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {candidate.summary ? (
                    <p style={candidateSummaryStyle}>
                      {candidate.summary}
                    </p>
                  ) : null}

                  <div style={cardActionsStyle}>
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() => {
                        setSelectedCandidateId(candidate.id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Open candidate
                    </button>

                    {!archived ? (
                      <>
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() =>
                            openEditForm(candidate)
                          }
                          disabled={actioning}
                        >
                          Edit candidate
                        </button>

                        <button
                          type="button"
                          style={archiveButtonStyle}
                          onClick={() =>
                            void archiveCandidate(
                              candidate,
                            )
                          }
                          disabled={actioning}
                        >
                          {actioning
                            ? "Archiving…"
                            : "Archive"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        style={primaryButtonStyle}
                        onClick={() =>
                          void restoreCandidate(
                            candidate,
                          )
                        }
                        disabled={actioning}
                      >
                        {actioning
                          ? "Restoring…"
                          : "Restore candidate"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


type CandidateProfileTab =
  | "overview"
  | "applications"
  | "documents"
  | "interviews"
  | "due_diligence"
  | "offers"
  | "onboarding"
  | "timeline"
  | "notes";

function CandidateProfileView({
  candidate,
  actioning,
  error,
  onBack,
  onEdit,
  onArchive,
  onRestore,
  onOpenDocument,
}: {
  candidate: TalentCandidate;
  actioning: boolean;
  error: string | null;
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onOpenDocument: (document: CandidateDocument) => void;
}) {
  const [activeTab, setActiveTab] = useState<CandidateProfileTab>("overview");
  const archived = candidate.archived_at !== null;
  const activeApplications = candidate.applications.filter((application) =>
    isActiveApplication(application.status),
  );
  const skills = normaliseSkills(candidate.skills);

  const tabs: Array<{ value: CandidateProfileTab; label: string }> = [
    { value: "overview", label: "Overview" },
    { value: "applications", label: "Applications" },
    { value: "documents", label: "Documents" },
    { value: "interviews", label: "Interviews" },
    { value: "due_diligence", label: "Due Diligence" },
    { value: "offers", label: "Offers & Appointments" },
    { value: "onboarding", label: "Onboarding" },
    { value: "timeline", label: "Timeline" },
    { value: "notes", label: "Notes" },
  ];

  return (
    <div>
      <div style={profileTopRowStyle}>
        <button type="button" style={backButtonStyle} onClick={onBack}>
          ← Back to register
        </button>

        <div style={headerActionsStyle}>
          {!archived ? (
            <>
              <button type="button" style={secondaryButtonStyle} onClick={onEdit} disabled={actioning}>
                Edit candidate
              </button>
              <button type="button" style={archiveButtonStyle} onClick={onArchive} disabled={actioning}>
                {actioning ? "Archiving…" : "Archive"}
              </button>
            </>
          ) : (
            <button type="button" style={primaryButtonStyle} onClick={onRestore} disabled={actioning}>
              {actioning ? "Restoring…" : "Restore candidate"}
            </button>
          )}
        </div>
      </div>

      {error ? <div style={errorPanelStyle}><p style={errorTextStyle}>{error}</p></div> : null}

      <section style={profileHeroStyle}>
        <div style={profileIdentityRowStyle}>
          <div style={profileAvatarStyle}>{getCandidateInitials(candidate)}</div>
          <div>
            <p style={eyebrowTextStyle}>Candidate profile</p>
            <h2 style={profileNameStyle}>{getCandidateName(candidate)}</h2>
            <p style={candidateReferenceStyle}>
              {candidate.candidate_reference}
              {candidate.is_internal_candidate ? " · Internal candidate" : ""}
            </p>
          </div>
        </div>

        <div style={badgeRowStyle}>
          <span style={getTalentPoolBadgeStyle(candidate.talent_pool_status)}>
            {formatValue(candidate.talent_pool_status)}
          </span>
          {candidate.do_not_contact ? (
            <span style={doNotContactBadgeStyle}>Do Not Contact</span>
          ) : candidate.consent_to_contact ? (
            <span style={consentBadgeStyle}>Contact Consent</span>
          ) : (
            <span style={neutralBadgeStyle}>No Contact Consent</span>
          )}
          {archived ? <span style={archivedBadgeStyle}>Archived</span> : null}
        </div>
      </section>

      <div style={profileMetricsStyle}>
        <KpiCard label="Applications" value={String(candidate.applications.length)} />
        <KpiCard label="Active applications" value={String(activeApplications.length)} />
        <KpiCard label="Documents" value={String(candidate.documents.length)} />
        <KpiCard label="Employee record" value={candidate.existing_employee_id ? "Linked" : "No"} />
      </div>

      <nav aria-label="Candidate profile sections" style={profileTabsStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            style={activeTab === tab.value ? activeProfileTabStyle : profileTabStyle}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" ? (
        <div style={profileGridStyle}>
          <CandidateInformationPanel candidate={candidate} />
          <section style={informationPanelStyle}>
            <h3 style={panelTitleStyle}>Professional profile</h3>
            <div style={informationListStyle}>
              <CandidateDetail label="Current job title" value={candidate.current_job_title ?? "Not recorded"} />
              <CandidateDetail label="Current employer" value={candidate.current_employer ?? "Not recorded"} />
              <CandidateDetail label="Experience" value={candidate.years_experience !== null ? `${candidate.years_experience} years` : "Not recorded"} />
              <CandidateDetail label="Preferred location" value={candidate.preferred_location ?? "Not recorded"} />
              <CandidateDetail label="Employment preference" value={formatValue(candidate.preferred_employment_type)} />
              <CandidateDetail label="Earliest start date" value={formatDate(candidate.earliest_start_date)} />
              <CandidateDetail label="Salary expectations" value={candidate.salary_expectations ?? "Not recorded"} />
            </div>
            {skills.length > 0 ? <div style={skillsRowStyle}>{skills.map((skill) => <span key={skill} style={skillBadgeStyle}>{skill}</span>)}</div> : null}
            {candidate.summary ? <p style={candidateSummaryStyle}>{candidate.summary}</p> : null}
          </section>
          <section style={informationPanelStyle}>
            <h3 style={panelTitleStyle}>Privacy and retention</h3>
            <div style={informationListStyle}>
              <CandidateDetail label="Privacy notice" value={candidate.privacy_notice_version ?? "Not recorded"} />
              <CandidateDetail label="Retention review" value={formatDate(candidate.data_retention_review_date)} help={getRetentionReviewHelp(candidate.data_retention_review_date)} />
              <CandidateDetail label="Future recruitment contact" value={candidate.consent_to_contact ? "Agreed" : "Not agreed"} />
              <CandidateDetail label="Do not contact" value={candidate.do_not_contact ? "Yes" : "No"} help={candidate.do_not_contact_reason ?? undefined} />
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "applications" ? <CandidateApplicationsPanel applications={candidate.applications} /> : null}
      {activeTab === "documents" ? <CandidateDocumentsPanel documents={candidate.documents} onOpen={onOpenDocument} /> : null}
      {activeTab === "notes" ? (
        <section style={informationPanelStyle}>
          <h3 style={panelTitleStyle}>General notes</h3>
          <p style={candidateSummaryStyle}>{candidate.general_notes ?? "No general candidate notes have been recorded."}</p>
        </section>
      ) : null}
      {activeTab === "timeline" ? (
        <section style={informationPanelStyle}>
          <h3 style={panelTitleStyle}>Candidate timeline</h3>
          <div style={timelineListStyle}>
            <TimelineItem title="Candidate record created" date={candidate.created_at} />
            {candidate.applications.map((application) => (
              <TimelineItem key={application.id} title={`Application ${application.application_reference} · ${application.vacancy?.title ?? "Vacancy"}`} date={application.submitted_at ?? application.updated_at} />
            ))}
            <TimelineItem title="Candidate record last updated" date={candidate.updated_at} />
          </div>
        </section>
      ) : null}
      {["interviews", "due_diligence", "offers", "onboarding"].includes(activeTab) ? (
        <ConnectedSectionPlaceholder section={tabs.find((tab) => tab.value === activeTab)?.label ?? "Recruitment activity"} />
      ) : null}
    </div>
  );
}

function ConnectedSectionPlaceholder({ section }: { section: string }) {
  return (
    <section style={connectedPlaceholderStyle}>
      <div style={emptyIconStyle}>✦</div>
      <h3 style={panelTitleStyle}>{section}</h3>
      <p style={emptyTextStyle}>
        Connected {section.toLowerCase()} records will appear here when this candidate progresses through the relevant Leo Talent workspace.
      </p>
    </section>
  );
}

function TimelineItem({ title, date }: { title: string; date: string }) {
  return (
    <div style={timelineItemStyle}>
      <div style={timelineDotStyle} />
      <div>
        <strong style={timelineTitleStyle}>{title}</strong>
        <div style={timelineDateStyle}>{formatDateTime(date)}</div>
      </div>
    </div>
  );
}

function CandidateForm({
  form,
  uploads,
  candidateReference,
  editing,
  saving,
  error,
  onUpdate,
  onUploadsChange,
  onSubmit,
  onCancel,
}: {
  form: CandidateFormState;
  uploads: CandidateUploadState;
  candidateReference: string | null;
  editing: boolean;
  saving: boolean;
  error: string | null;
  onUpdate: <K extends keyof CandidateFormState>(
    key: K,
    value: CandidateFormState[K],
  ) => void;
  onUploadsChange: (uploads: CandidateUploadState) => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      style={formPanelStyle}
    >
      <div style={formHeadingStyle}>
        <div>
          <h3 style={formTitleStyle}>
            {editing
              ? "Edit Candidate"
              : "Add Candidate"}
          </h3>


        </div>

        <button
          type="button"
          style={closeButtonStyle}
          onClick={onCancel}
          disabled={saving}
          aria-label="Close candidate form"
        >
          ×
        </button>
      </div>

      {error ? (
        <div style={formErrorStyle}>{error}</div>
      ) : null}

      <FormSection
        title="Candidate Identity"
        description="Core candidate details used throughout recruitment."
      >
        <div style={threeColumnGridStyle}>
          <ReadOnlyField
            label="Candidate Reference"
            value={candidateReference ?? "Generated when saved"}
            help="Leo creates a unique candidate reference automatically."
          />

          <TextField
            label="First name"
            value={form.firstName}
            onChange={(value) =>
              onUpdate("firstName", value)
            }
            required
            disabled={saving}
          />

          <TextField
            label="Middle names"
            value={form.middleNames}
            onChange={(value) =>
              onUpdate("middleNames", value)
            }
            disabled={saving}
          />

          <TextField
            label="Last name"
            value={form.lastName}
            onChange={(value) =>
              onUpdate("lastName", value)
            }
            required
            disabled={saving}
          />

          <TextField
            label="Preferred name"
            value={form.preferredName}
            onChange={(value) =>
              onUpdate("preferredName", value)
            }
            disabled={saving}
          />

          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) =>
              onUpdate("email", value)
            }
            disabled={saving}
          />

          <TextField
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(value) =>
              onUpdate("phone", value)
            }
            disabled={saving}
          />
        </div>

        <div style={checkboxPanelStyle}>
          <CheckboxField
            label="Internal candidate"
            description="The candidate already has an employee record in this organisation."
            checked={form.isInternalCandidate}
            onChange={(checked) => {
              onUpdate(
                "isInternalCandidate",
                checked,
              );

              if (!checked) {
                onUpdate("existingEmployeeId", "");
              }
            }}
            disabled={saving}
          />

          {form.isInternalCandidate ? (
            <div style={internalReferenceStyle}>
              <TextField
                label="Employee reference"
                type="number"
                value={form.existingEmployeeId}
                onChange={(value) =>
                  onUpdate(
                    "existingEmployeeId",
                    value,
                  )
                }
                help="Use the numeric employee ID from the Employees area."
                disabled={saving}
              />
            </div>
          ) : null}
        </div>
      </FormSection>

      <FormSection
        title="Address"
        description="Optional contact and location information."
      >
        <div style={twoColumnGridStyle}>
          <TextField
            label="Address line 1"
            value={form.addressLine1}
            onChange={(value) =>
              onUpdate("addressLine1", value)
            }
            disabled={saving}
          />

          <TextField
            label="Address line 2"
            value={form.addressLine2}
            onChange={(value) =>
              onUpdate("addressLine2", value)
            }
            disabled={saving}
          />

          <TextField
            label="Town or city"
            value={form.townCity}
            onChange={(value) =>
              onUpdate("townCity", value)
            }
            disabled={saving}
          />

          <TextField
            label="County or region"
            value={form.countyRegion}
            onChange={(value) =>
              onUpdate("countyRegion", value)
            }
            disabled={saving}
          />

          <TextField
            label="Postcode"
            value={form.postcode}
            onChange={(value) =>
              onUpdate("postcode", value)
            }
            disabled={saving}
          />

          <TextField
            label="Country"
            value={form.country}
            onChange={(value) =>
              onUpdate("country", value)
            }
            disabled={saving}
          />
        </div>
      </FormSection>

      <FormSection
        title="Professional Profile"
        description="Maintain reusable professional information that can be populated from an application or CV."
      >
        <div style={twoColumnGridStyle}>
          <TextField
            label="Source"
            value={form.source}
            onChange={(value) => onUpdate("source", value)}
            placeholder="For example: Website, referral or job board"
            disabled={saving}
          />

          <TextField
            label="Source detail"
            value={form.sourceDetail}
            onChange={(value) => onUpdate("sourceDetail", value)}
            placeholder="Campaign, referrer or advert details"
            disabled={saving}
          />

          <TextField
            label="Current job title"
            value={form.currentJobTitle}
            onChange={(value) => onUpdate("currentJobTitle", value)}
            disabled={saving}
          />

          <TextField
            label="Current employer"
            value={form.currentEmployer}
            onChange={(value) => onUpdate("currentEmployer", value)}
            disabled={saving}
          />

          <TextField
            label="Years of experience"
            type="number"
            value={form.yearsExperience}
            onChange={(value) => onUpdate("yearsExperience", value)}
            disabled={saving}
          />

          <TextField
            label="Preferred location"
            value={form.preferredLocation}
            onChange={(value) => onUpdate("preferredLocation", value)}
            disabled={saving}
          />

          <SelectField
            label="Preferred employment type"
            value={form.preferredEmploymentType}
            onChange={(value) =>
              onUpdate(
                "preferredEmploymentType",
                value as PreferredEmploymentType,
              )
            }
            options={employmentTypeOptions}
            disabled={saving}
          />

          <TextField
            label="Salary expectations"
            value={form.salaryExpectations}
            onChange={(value) => onUpdate("salaryExpectations", value)}
            placeholder="Optional candidate expectation or range"
            disabled={saving}
          />

          <TextField
            label="Earliest start date"
            type="date"
            value={form.earliestStartDate}
            onChange={(value) => onUpdate("earliestStartDate", value)}
            disabled={saving}
          />

          <SelectField
            label="Talent-pool status"
            value={form.talentPoolStatus}
            onChange={(value) =>
              onUpdate(
                "talentPoolStatus",
                value as TalentPoolStatus,
              )
            }
            options={talentPoolOptions}
            disabled={saving || form.doNotContact}
          />

          <TextField
            label="Skills"
            value={form.skills}
            onChange={(value) => onUpdate("skills", value)}
            placeholder="Separate skills with commas"
            help="For example: Safeguarding, Excel, team leadership"
            disabled={saving}
          />
        </div>

        <TextAreaField
          label="Professional summary"
          value={form.summary}
          onChange={(value) => onUpdate("summary", value)}
          placeholder="Brief factual summary of the candidate’s experience, strengths or relevant background"
          rows={4}
          disabled={saving}
        />
      </FormSection>

      <FormSection
        title="Documents"
        description="Upload candidate documents for secure storage and future Leo-assisted profile extraction."
      >
        <div style={twoColumnGridStyle}>
          <FileField
            label="CV"
            accept=".pdf,.doc,.docx,.rtf,.txt"
            file={uploads.cv}
            onChange={(file) =>
              onUploadsChange({ ...uploads, cv: file })
            }
            disabled={saving}
          />

          <FileField
            label="Cover letter"
            accept=".pdf,.doc,.docx,.rtf,.txt"
            file={uploads.coverLetter}
            onChange={(file) =>
              onUploadsChange({ ...uploads, coverLetter: file })
            }
            disabled={saving}
          />
        </div>

        <MultiFileField
          label="Supporting documents"
          accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png"
          files={uploads.supportingDocuments}
          onChange={(files) =>
            onUploadsChange({
              ...uploads,
              supportingDocuments: files,
            })
          }
          disabled={saving}
        />

        <div style={informationNoticeStyle}>
          Uploading a CV allows Leo to extract candidate information,
          identify skills and populate relevant profile fields for review
          when CV analysis is enabled.
        </div>
      </FormSection>

      <FormSection
        title="General Notes"
        description="Record reusable candidate information that is not specific to an individual application."
      >
        <TextAreaField
          label="General notes"
          value={form.generalNotes}
          onChange={(value) => onUpdate("generalNotes", value)}
          placeholder="For example: Met at a careers fair, interested in part-time roles or relocating later in the year"
          rows={4}
          disabled={saving}
        />
      </FormSection>

      <FormSection
        title="Privacy and Retention"
        description="Control future contact, privacy-notice evidence and retention review."
      >
        <div style={twoColumnGridStyle}>
          <TextField
            label="Privacy notice version"
            value={form.privacyNoticeVersion}
            onChange={(value) =>
              onUpdate(
                "privacyNoticeVersion",
                value,
              )
            }
            placeholder="For example: Recruitment privacy notice v1.0"
            disabled={saving}
          />

          <TextField
            label="Data-retention review date"
            type="date"
            value={form.dataRetentionReviewDate}
            onChange={(value) =>
              onUpdate(
                "dataRetentionReviewDate",
                value,
              )
            }
            disabled={saving}
          />
        </div>

        <div style={privacyOptionsGridStyle}>
          <CheckboxField
            label="Future recruitment contact"
            description="The candidate has agreed to be contacted about suitable future opportunities."
            checked={form.consentToContact}
            onChange={(checked) => {
              onUpdate(
                "consentToContact",
                checked,
              );

              if (checked) {
                onUpdate("doNotContact", false);
                onUpdate(
                  "doNotContactReason",
                  "",
                );
              }
            }}
            disabled={saving}
          />

          <CheckboxField
            label="Do not contact"
            description="Prevent future recruitment contact until this restriction is removed."
            checked={form.doNotContact}
            onChange={(checked) => {
              onUpdate("doNotContact", checked);

              if (checked) {
                onUpdate(
                  "consentToContact",
                  false,
                );
                onUpdate(
                  "talentPoolStatus",
                  "do_not_contact",
                );
              }
            }}
            disabled={saving}
          />
        </div>

        {form.doNotContact ? (
          <TextAreaField
            label="Do-not-contact reason"
            value={form.doNotContactReason}
            onChange={(value) =>
              onUpdate(
                "doNotContactReason",
                value,
              )
            }
            placeholder="Record the factual reason for this restriction"
            rows={3}
            required
            disabled={saving}
          />
        ) : null}
      </FormSection>

      <div style={formActionsStyle}>
        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          style={primaryButtonStyle}
          disabled={saving}
        >
          {saving
            ? "Saving…"
            : editing
              ? "Save Candidate"
              : "Add Candidate"}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={formSectionStyle}>
      <div style={sectionHeadingStyle}>
        <h4 style={sectionTitleStyle}>{title}</h4>

        <p style={sectionDescriptionStyle}>
          {description}
        </p>
      </div>

      <div style={sectionContentStyle}>
        {children}
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  help,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>
        {label}
        {required ? (
          <span style={requiredStyle}> *</span>
        ) : null}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={inputStyle}
      />

      {help ? (
        <span style={fieldHelpStyle}>{help}</span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows: number;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>
        {label}
        {required ? (
          <span style={requiredStyle}> *</span>
        ) : null}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        style={textAreaStyle}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        style={inputStyle}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help?: string;
}) {
  return (
    <div style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <div style={readOnlyValueStyle}>{value}</div>
      {help ? <span style={fieldHelpStyle}>{help}</span> : null}
    </div>
  );
}

function FileField({
  label,
  accept,
  file,
  onChange,
  disabled = false,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.files?.[0] ?? null)
        }
        style={fileInputStyle}
      />
      <span style={fieldHelpStyle}>
        {file ? file.name : "No file selected"}
      </span>
    </label>
  );
}

function MultiFileField({
  label,
  accept,
  files,
  onChange,
  disabled = false,
}: {
  label: string;
  accept: string;
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input
        type="file"
        accept={accept}
        multiple
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(Array.from(event.target.files ?? []))
        }
        style={fileInputStyle}
      />
      <span style={fieldHelpStyle}>
        {files.length === 0
          ? "No files selected"
          : `${files.length} file${files.length === 1 ? "" : "s"} selected`}
      </span>
    </label>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label style={checkboxFieldStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        disabled={disabled}
        style={checkboxInputStyle}
      />

      <span>
        <strong style={checkboxLabelStyle}>
          {label}
        </strong>

        <span style={checkboxDescriptionStyle}>
          {description}
        </span>
      </span>
    </label>
  );
}

function WorkspaceHeading() {
  return (
    <div style={workspaceHeaderStyle}>
      <div>
        <h2 style={workspaceTitleStyle}>
          Candidates
        </h2>


      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiValueStyle}>{value}</div>

      <div style={kpiLabelStyle}>{label}</div>
    </div>
  );
}

function CandidateDetail({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help?: string;
}) {
  return (
    <div>
      <span style={detailLabelStyle}>{label}</span>

      <strong style={detailValueStyle}>
        {value}
      </strong>

      {help ? (
        <span style={detailHelpStyle}>{help}</span>
      ) : null}
    </div>
  );
}

function CandidateInformationPanel({
  candidate,
}: {
  candidate: TalentCandidate;
}) {
  return (
    <div style={informationPanelStyle}>
      <h5 style={expandedPanelTitleStyle}>
        Candidate Information
      </h5>

      <div style={informationListStyle}>
        <InformationRow
          label="Formal name"
          value={[
            candidate.first_name,
            candidate.middle_names,
            candidate.last_name,
          ]
            .filter(Boolean)
            .join(" ")}
        />

        <InformationRow
          label="Address"
          value={
            [
              candidate.address_line_1,
              candidate.address_line_2,
              candidate.town_city,
              candidate.county_region,
              candidate.postcode,
              candidate.country,
            ]
              .filter(Boolean)
              .join(", ") || "Not recorded"
          }
        />

        <InformationRow
          label="Employee reference"
          value={
            candidate.existing_employee_id !== null
              ? String(
                  candidate.existing_employee_id,
                )
              : "Not linked"
          }
        />

        <InformationRow
          label="Current role"
          value={candidate.current_job_title ?? "Not recorded"}
        />

        <InformationRow
          label="Current employer"
          value={candidate.current_employer ?? "Not recorded"}
        />

        <InformationRow
          label="Preferred employment"
          value={formatValue(candidate.preferred_employment_type)}
        />

        <InformationRow
          label="Earliest start date"
          value={formatDate(candidate.earliest_start_date)}
        />

        <InformationRow
          label="Privacy notice"
          value={
            candidate.privacy_notice_version ??
            "Not recorded"
          }
        />

        <InformationRow
          label="Consent recorded"
          value={formatDateTime(
            candidate.consent_recorded_at,
          )}
        />

        <InformationRow
          label="Created"
          value={formatDateTime(
            candidate.created_at,
          )}
        />

        <InformationRow
          label="Last updated"
          value={formatDateTime(
            candidate.updated_at,
          )}
        />

        {candidate.general_notes ? (
          <InformationRow
            label="General notes"
            value={candidate.general_notes}
          />
        ) : null}

        {candidate.do_not_contact_reason ? (
          <InformationRow
            label="Do-not-contact reason"
            value={
              candidate.do_not_contact_reason
            }
          />
        ) : null}

        {candidate.archive_reason ? (
          <InformationRow
            label="Archive reason"
            value={candidate.archive_reason}
          />
        ) : null}
      </div>
    </div>
  );
}

function CandidateApplicationsPanel({
  applications,
}: {
  applications: CandidateApplication[];
}) {
  const sortedApplications = [...applications].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() -
      new Date(a.updated_at).getTime(),
  );

  return (
    <div style={informationPanelStyle}>
      <h5 style={expandedPanelTitleStyle}>
        Recruitment History
      </h5>

      {sortedApplications.length === 0 ? (
        <p style={noApplicationsStyle}>
          No applications are linked to this candidate.
        </p>
      ) : (
        <div style={applicationHistoryListStyle}>
          {sortedApplications.map((application) => (
            <div
              key={application.id}
              style={applicationHistoryItemStyle}
            >
              <div>
                <strong
                  style={
                    applicationVacancyTitleStyle
                  }
                >
                  {application.vacancy?.title ??
                    "Vacancy unavailable"}
                </strong>

                <span
                  style={
                    applicationHistoryReferenceStyle
                  }
                >
                  {application.application_reference}

                  {application.vacancy
                    ?.vacancy_reference
                    ? ` · ${application.vacancy.vacancy_reference}`
                    : ""}
                </span>
              </div>

              <div
                style={
                  applicationHistoryBadgesStyle
                }
              >
                <span style={neutralBadgeStyle}>
                  {formatValue(
                    application.current_stage_key,
                  )}
                </span>

                <span
                  style={getApplicationStatusStyle(
                    application.status,
                  )}
                >
                  {formatValue(application.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateDocumentsPanel({
  documents,
  onOpen,
}: {
  documents: CandidateDocument[];
  onOpen: (document: CandidateDocument) => void;
}) {
  const sortedDocuments = [...documents].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime(),
  );

  return (
    <div style={informationPanelStyle}>
      <h5 style={expandedPanelTitleStyle}>Documents</h5>
      {sortedDocuments.length === 0 ? (
        <p style={noApplicationsStyle}>
          No candidate documents have been uploaded.
        </p>
      ) : (
        <div style={documentListStyle}>
          {sortedDocuments.map((document) => (
            <button
              key={document.id}
              type="button"
              style={documentButtonStyle}
              onClick={() => onOpen(document)}
            >
              <span>
                <strong style={documentTitleStyle}>
                  {document.title}
                </strong>
                <span style={documentMetaStyle}>
                  {formatValue(document.document_type)} · {document.file_name}
                </span>
              </span>
              <span style={documentOpenStyle}>Open</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InformationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={informationRowStyle}>
      <span style={informationLabelStyle}>
        {label}
      </span>

      <span style={informationValueStyle}>
        {value}
      </span>
    </div>
  );
}

function hasSelectedUploads(uploads: CandidateUploadState) {
  return Boolean(
    uploads.cv ||
      uploads.coverLetter ||
      uploads.supportingDocuments.length > 0,
  );
}

async function uploadCandidateDocuments({
  candidateId,
  organisationId,
  uploads,
}: {
  candidateId: string;
  organisationId: string | null;
  uploads: CandidateUploadState;
}): Promise<string | null> {
  const files: Array<{
    file: File;
    type: CandidateDocumentType;
    title: string;
  }> = [];

  if (uploads.cv) {
    files.push({ file: uploads.cv, type: "cv", title: "CV" });
  }

  if (uploads.coverLetter) {
    files.push({
      file: uploads.coverLetter,
      type: "cover_letter",
      title: "Cover Letter",
    });
  }

  uploads.supportingDocuments.forEach((file) => {
    files.push({
      file,
      type: "other",
      title: file.name.replace(/\.[^.]+$/, ""),
    });
  });

  for (const item of files) {
    if (item.file.size > 15 * 1024 * 1024) {
      return `${item.file.name} exceeds the 15 MB upload limit.`;
    }

    const safeName = item.file.name
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-");
    const filePath = `${organisationId ?? "unassigned"}/${candidateId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("leo-talent-candidate-documents")
      .upload(filePath, item.file, {
        cacheControl: "3600",
        upsert: false,
        contentType: item.file.type || undefined,
      });

    if (uploadError) {
      console.error("Unable to upload candidate document:", uploadError);
      return `${item.file.name} could not be uploaded.`;
    }

    const { error: documentError } = await supabase
      .from("leo_talent_candidate_documents")
      .insert({
        candidate_id: candidateId,
        organisation_id: organisationId,
        document_type: item.type,
        title: item.title,
        file_name: item.file.name,
        file_path: filePath,
        mime_type: item.file.type || null,
        file_size_bytes: item.file.size,
      });

    if (documentError) {
      console.error(
        "Unable to create candidate document record:",
        documentError,
      );
      await supabase.storage
        .from("leo-talent-candidate-documents")
        .remove([filePath]);
      return `${item.file.name} could not be linked to the candidate record.`;
    }
  }

  return null;
}

function normaliseCandidates(
  rows: unknown[],
): TalentCandidate[] {
  return rows.map((row) => {
    const item = row as Record<string, unknown>;

    const rawApplications = Array.isArray(
      item.applications,
    )
      ? item.applications
      : [];

    const applications =
      rawApplications.map((application) => {
        const applicationRecord =
          application as Record<string, unknown>;

        return {
          ...applicationRecord,
          vacancy:
            normaliseRelatedRecord<
              CandidateApplication["vacancy"]
            >(applicationRecord.vacancy),
        } as CandidateApplication;
      });

    const documents = Array.isArray(item.documents)
      ? (item.documents as CandidateDocument[])
      : [];

    return {
      ...item,
      skills: Array.isArray(item.skills)
        ? item.skills
        : [],
      metadata:
        item.metadata &&
        typeof item.metadata === "object" &&
        !Array.isArray(item.metadata)
          ? (item.metadata as Record<
              string,
              unknown
            >)
          : {},
      applications,
      documents,
    } as TalentCandidate;
  });
}

function normaliseRelatedRecord<T>(
  value: unknown,
): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }

  if (value && typeof value === "object") {
    return value as T;
  }

  return null;
}

function normaliseSkills(
  skills: CandidateSkill[],
): string[] {
  return skills
    .map((skill) => {
      if (typeof skill === "string") {
        return skill.trim();
      }

      const possibleName =
        typeof skill.name === "string"
          ? skill.name
          : typeof skill.label === "string"
            ? skill.label
            : "";

      return possibleName.trim();
    })
    .filter(Boolean);
}

function parseSkills(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    ),
  );
}

function getCandidateName(
  candidate: TalentCandidate,
) {
  const preferredName =
    candidate.preferred_name?.trim();

  if (preferredName) {
    return `${preferredName} ${candidate.last_name}`.trim();
  }

  return `${candidate.first_name} ${candidate.last_name}`.trim();
}

function getCandidateInitials(
  candidate: TalentCandidate,
) {
  const first =
    candidate.preferred_name?.trim() ||
    candidate.first_name.trim();

  return `${first.charAt(0)}${candidate.last_name.charAt(
    0,
  )}`.toUpperCase();
}

function isActiveApplication(status: string) {
  return ![
    "withdrawn",
    "rejected",
    "unsuccessful",
    "appointed",
    "archived",
  ].includes(status);
}

function normaliseOptionalText(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPositiveWholeNumber(value: string) {
  const number = Number(value);

  return (
    Number.isInteger(number) &&
    number > 0
  );
}

function startOfToday() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
}

function formatValue(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRetentionReviewHelp(
  value: string | null,
) {
  if (!value) {
    return "No review date set";
  }

  const reviewDate = new Date(`${value}T00:00:00`);
  const today = startOfToday();

  if (reviewDate.getTime() < today.getTime()) {
    return "Review overdue";
  }

  if (reviewDate.getTime() === today.getTime()) {
    return "Review due today";
  }

  const difference =
    reviewDate.getTime() - today.getTime();

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24),
  );

  return days === 1
    ? "Review due tomorrow"
    : `Review due in ${days} days`;
}

function getCandidateSaveError(
  message: string,
  fallback: string,
) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("unique")
  ) {
    return "A current candidate record already uses this email address.";
  }

  return fallback;
}

function escapeCsvValue(value: string) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function getTalentPoolBadgeStyle(
  status: TalentPoolStatus,
): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "4px 8px",
    border: "1px solid",
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  switch (status) {
    case "active":
      return {
        ...base,
        background: "#F5FFF9",
        borderColor: "#CFE5D7",
        color: "#41644D",
      };

    case "do_not_contact":
      return {
        ...base,
        background: "#FFF9EE",
        borderColor: "#E8D9B7",
        color: "#755E2C",
      };

    case "withdrawn":
    case "archived":
      return {
        ...base,
        background: "#F3F4F6",
        borderColor: "#D1D5DB",
        color: "#5B6470",
      };

    default:
      return {
        ...base,
        background: "#F7F1FC",
        borderColor: "#E8DDF0",
        color: "#6E5084",
      };
  }
}

function getApplicationStatusStyle(
  status: string,
): CSSProperties {
  if (
    ["active", "submitted"].includes(status)
  ) {
    return consentBadgeStyle;
  }

  if (
    ["offered", "appointed"].includes(status)
  ) {
    return {
      ...neutralBadgeStyle,
      background: "#F7F1FC",
      borderColor: "#CDB2E2",
      color: "#6E5084",
    };
  }

  return archivedBadgeStyle;
}

const workspaceHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "20px",
};

const workspaceTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
};

const workspaceDescriptionStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "8px",
};

const primaryButtonStyle: CSSProperties = {
  background: "#6E5084",
  color: "#FFFFFF",
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const archiveButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const kpiGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
  marginBottom: "18px",
};

const kpiCardStyle: CSSProperties = {
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "14px",
  padding: "16px",
};

const kpiValueStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "26px",
  fontWeight: 800,
};

const kpiLabelStyle: CSSProperties = {
  marginTop: "6px",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.4,
};

const registerPanelStyle: CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  padding: "18px",
  background: "#FFFFFF",
};

const registerHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "16px",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const panelDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const resultCountStyle: CSSProperties = {
  color: "#6E5084",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "999px",
  padding: "5px 9px",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const filterAreaStyle: CSSProperties = {
  padding: "14px",
  marginBottom: "16px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
};

const fieldStyle: CSSProperties = {
  display: "block",
  width: "100%",
};

const fieldLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "12px",
  fontWeight: 700,
};

const fieldHelpStyle: CSSProperties = {
  display: "block",
  marginTop: "5px",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.4,
};

const requiredStyle: CSSProperties = {
  color: "#6E5084",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "10px 12px",
  background: "#FFFFFF",
  color: "#111827",
  fontSize: "14px",
  outline: "none",
};

const textAreaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const filterButtonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

const filterButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6B7280",
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  padding: "7px 10px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeFilterButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "#F7F1FC",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
};

const candidateListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const candidateCardStyle: CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: "13px",
  padding: "16px",
  background: "#FFFFFF",
};

const candidateHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
};

const candidateIdentityStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const candidateAvatarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  flexShrink: 0,
  borderRadius: "12px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 800,
};

const candidateNameStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "16px",
};

const candidateReferenceStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#6B7280",
  fontSize: "11px",
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "6px",
};

const consentBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "4px 8px",
  background: "#F5FFF9",
  border: "1px solid #CFE5D7",
  color: "#41644D",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const doNotContactBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "4px 8px",
  background: "#FFF9EE",
  border: "1px solid #E8D9B7",
  color: "#755E2C",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const neutralBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "4px 8px",
  background: "#F9FAFB",
  border: "1px solid #D1D5DB",
  color: "#6B7280",
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const archivedBadgeStyle: CSSProperties = {
  ...neutralBadgeStyle,
  background: "#F3F4F6",
  color: "#5B6470",
};

const candidateDetailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(145px, 1fr))",
  gap: "14px",
  marginTop: "16px",
};

const detailLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  color: "#6B7280",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const detailValueStyle: CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "13px",
  lineHeight: 1.4,
};

const detailHelpStyle: CSSProperties = {
  display: "block",
  marginTop: "3px",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.4,
};

const skillsRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "15px",
};

const skillBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "4px 8px",
  borderRadius: "999px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  color: "#6E5084",
  fontSize: "10px",
  fontWeight: 700,
};

const moreBadgeStyle: CSSProperties = {
  ...skillBadgeStyle,
  background: "#F9FAFB",
  borderColor: "#D1D5DB",
  color: "#6B7280",
};

const candidateSummaryStyle: CSSProperties = {
  margin: "15px 0 0",
  padding: "12px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  color: "#4B5563",
  fontSize: "12px",
  lineHeight: 1.6,
};

const expandedAreaStyle: CSSProperties = {
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid #EEF0F2",
};

const expandedGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "12px",
};

const informationPanelStyle: CSSProperties = {
  padding: "14px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const expandedPanelTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  color: "#111827",
  fontSize: "13px",
};

const informationListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const informationRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "130px minmax(0, 1fr)",
  gap: "10px",
  paddingBottom: "8px",
  borderBottom: "1px solid #E5E7EB",
};

const informationLabelStyle: CSSProperties = {
  color: "#6B7280",
  fontSize: "11px",
  fontWeight: 700,
};

const informationValueStyle: CSSProperties = {
  color: "#374151",
  fontSize: "11px",
  lineHeight: 1.5,
  overflowWrap: "anywhere",
};

const applicationHistoryListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const applicationHistoryItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  padding: "10px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "9px",
};

const applicationVacancyTitleStyle: CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "12px",
};

const applicationHistoryReferenceStyle: CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "10px",
};

const applicationHistoryBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "5px",
};

const noApplicationsStyle: CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: "12px",
};

const cardActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "16px",
  paddingTop: "14px",
  borderTop: "1px solid #EEF0F2",
};

const emptyPanelStyle: CSSProperties = {
  padding: "28px",
  background: "#F9FAFB",
  border: "1px dashed #D1D5DB",
  borderRadius: "12px",
  textAlign: "center",
};

const emptyIconStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "22px",
  marginBottom: "8px",
};

const emptyTitleStyle: CSSProperties = {
  display: "block",
  color: "#111827",
  fontSize: "14px",
};

const emptyTextStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.6,
};

const emptyPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  marginTop: "14px",
};

const formPanelStyle: CSSProperties = {
  marginBottom: "18px",
  padding: "20px",
  background: "#FFFFFF",
  border: "1px solid #CDB2E2",
  borderRadius: "14px",
};

const formHeadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "18px",
};

const formDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "13px",
  lineHeight: 1.5,
};

const closeButtonStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  flexShrink: 0,
  border: "1px solid #D1D5DB",
  borderRadius: "9px",
  background: "#FFFFFF",
  color: "#6B7280",
  fontSize: "20px",
  cursor: "pointer",
};

const formErrorStyle: CSSProperties = {
  marginBottom: "16px",
  padding: "11px 12px",
  background: "#FFF9EE",
  border: "1px solid #E8D9B7",
  borderRadius: "10px",
  color: "#755E2C",
  fontSize: "12px",
  lineHeight: 1.5,
};

const formSectionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "210px minmax(0, 1fr)",
  gap: "18px",
  padding: "18px 0",
  borderTop: "1px solid #EEF0F2",
};

const sectionHeadingStyle: CSSProperties = {
  paddingRight: "10px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: "14px",
};

const sectionDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.5,
};

const sectionContentStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
};

const threeColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "12px",
};

const privacyOptionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "12px",
};

const checkboxPanelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "13px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "11px",
};

const checkboxFieldStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px",
  background: "#F9FAFB",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  cursor: "pointer",
};

const checkboxInputStyle: CSSProperties = {
  marginTop: "2px",
  width: "16px",
  height: "16px",
  accentColor: "#6E5084",
};

const checkboxLabelStyle: CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "12px",
};

const checkboxDescriptionStyle: CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "11px",
  lineHeight: 1.45,
};

const internalReferenceStyle: CSSProperties = {
  maxWidth: "320px",
};

const formActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  paddingTop: "18px",
  borderTop: "1px solid #EEF0F2",
};

const errorPanelStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
  padding: "14px",
  border: "1px solid #E8D9B7",
  borderRadius: "12px",
  background: "#FFF9EE",
};

const errorTitleStyle: CSSProperties = {
  color: "#5F4A22",
  fontSize: "13px",
};

const errorTextStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#765E32",
  fontSize: "12px",
  lineHeight: 1.5,
};

const loadingPanelStyle: CSSProperties = {
  padding: "38px",
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  background: "#F9FAFB",
  textAlign: "center",
};

const spinnerStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  margin: "0 auto 12px",
  border: "3px solid #E8DDF0",
  borderTopColor: "#6E5084",
  borderRadius: "999px",
};

const loadingTitleStyle: CSSProperties = {
  color: "#111827",
  fontSize: "14px",
};

const loadingTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "13px",
};

const readOnlyValueStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #E5E7EB",
  borderRadius: "10px",
  padding: "10px 12px",
  background: "#F9FAFB",
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 700,
};

const fileInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  padding: "9px 10px",
  background: "#FFFFFF",
  color: "#374151",
  fontSize: "12px",
};

const informationNoticeStyle: CSSProperties = {
  padding: "12px 14px",
  background: "#F7F1FC",
  border: "1px solid #E8DDF0",
  borderRadius: "10px",
  color: "#5E4B68",
  fontSize: "12px",
  lineHeight: 1.55,
};

const documentListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const documentButtonStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  padding: "10px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "9px",
  textAlign: "left",
  cursor: "pointer",
};

const documentTitleStyle: CSSProperties = {
  display: "block",
  color: "#374151",
  fontSize: "12px",
};

const documentMetaStyle: CSSProperties = {
  display: "block",
  marginTop: "4px",
  color: "#6B7280",
  fontSize: "10px",
};

const documentOpenStyle: CSSProperties = {
  color: "#6E5084",
  fontSize: "11px",
  fontWeight: 800,
};


const standaloneViewHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
  marginBottom: 16,
};

const backButtonStyle: CSSProperties = {
  border: "1px solid #DED2E7",
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#6E5084",
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 750,
  cursor: "pointer",
};

const profileTopRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};

const profileHeroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
  border: "1px solid #E7DDED",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: 22,
  boxShadow: "0 8px 24px rgba(65, 45, 75, 0.05)",
  marginBottom: 16,
};

const profileIdentityRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const profileAvatarStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: 58,
  height: 58,
  borderRadius: 16,
  background: "#F1EAF6",
  color: "#6E5084",
  fontSize: 20,
  fontWeight: 800,
};

const eyebrowTextStyle: CSSProperties = {
  margin: "0 0 4px",
  color: "#6E5084",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const profileNameStyle: CSSProperties = {
  margin: 0,
  color: "#2F2435",
  fontSize: 28,
  lineHeight: 1.2,
};

const profileMetricsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const profileTabsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  borderBottom: "1px solid #E7DDED",
  paddingBottom: 12,
  marginBottom: 18,
};

const profileTabStyle: CSSProperties = {
  border: "1px solid #DED2E7",
  borderRadius: 999,
  background: "#FFFFFF",
  color: "#695A70",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 750,
  cursor: "pointer",
};

const activeProfileTabStyle: CSSProperties = {
  ...profileTabStyle,
  borderColor: "#6E5084",
  background: "#F1EAF6",
  color: "#6E5084",
};

const profileGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 14,
};

const connectedPlaceholderStyle: CSSProperties = {
  border: "1px dashed #D8C9E2",
  borderRadius: 16,
  background: "#FBF8FD",
  padding: 36,
  textAlign: "center",
};

const timelineListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  marginTop: 14,
};

const timelineItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const timelineDotStyle: CSSProperties = {
  width: 10,
  height: 10,
  marginTop: 5,
  borderRadius: 999,
  background: "#6E5084",
  flex: "0 0 auto",
};

const timelineTitleStyle: CSSProperties = {
  color: "#3B3040",
  fontSize: 14,
};

const timelineDateStyle: CSSProperties = {
  marginTop: 3,
  color: "#817486",
  fontSize: 12,
};