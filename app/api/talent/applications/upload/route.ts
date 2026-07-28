import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findSafeCandidateByOrganisationAndEmail } from "@/lib/talent/candidateDedup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentTypes = ["cv", "cover_letter", "application_form", "portfolio"] as const;
type DocumentType = (typeof documentTypes)[number];

type UploadedDocument = {
  type: DocumentType | "other";
  file: File;
  title: string;
  slotKey: string;
};

type ApplicationProfile = {
  firstName: string;
  middleNames: string | null;
  lastName: string;
  preferredName: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  townCity: string | null;
  countyRegion: string | null;
  postcode: string | null;
  country: string | null;
  currentJobTitle: string | null;
  currentEmployer: string | null;
  yearsExperience: number | null;
  preferredLocation: string | null;
  preferredEmploymentType: string | null;
  salaryExpectations: string | null;
  earliestStartDate: string | null;
  skills: string[];
  professionalSummary: string | null;
};

function cleanFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "document";
}

function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result || null;
}

function normalisePostcode(value: string | null) {
  return value ? value.toUpperCase() : null;
}

function normaliseYearsExperience(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 80) return null;
  return parsed;
}

function parseSkills(formData: FormData) {
  const direct = optionalText(formData.get("skills"));
  const many = formData
    .getAll("skills")
    .filter((entry): entry is string => typeof entry === "string")
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (many.length > 0) {
    return Array.from(new Set(many));
  }

  if (!direct) {
    return [];
  }

  return Array.from(
    new Set(
      direct
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEmptyText(value: unknown) {
  return !hasText(value);
}

function isEmptySkills(value: unknown) {
  if (!Array.isArray(value)) return true;
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean).length === 0;
}

function buildProfileFieldUpdates(existingCandidate: any, profile: ApplicationProfile) {
  const updates: Record<string, unknown> = {};

  if (isEmptyText(existingCandidate.first_name) && hasText(profile.firstName)) {
    updates.first_name = profile.firstName;
  }
  if (isEmptyText(existingCandidate.middle_names) && hasText(profile.middleNames)) {
    updates.middle_names = profile.middleNames;
  }
  if (isEmptyText(existingCandidate.last_name) && hasText(profile.lastName)) {
    updates.last_name = profile.lastName;
  }
  if (isEmptyText(existingCandidate.preferred_name) && hasText(profile.preferredName)) {
    updates.preferred_name = profile.preferredName;
  }
  if (isEmptyText(existingCandidate.email) && hasText(profile.email)) {
    updates.email = profile.email;
  }
  if (isEmptyText(existingCandidate.phone) && hasText(profile.phone)) {
    updates.phone = profile.phone;
  }

  if (isEmptyText(existingCandidate.address_line_1) && hasText(profile.addressLine1)) {
    updates.address_line_1 = profile.addressLine1;
  }
  if (isEmptyText(existingCandidate.address_line_2) && hasText(profile.addressLine2)) {
    updates.address_line_2 = profile.addressLine2;
  }
  if (isEmptyText(existingCandidate.town_city) && hasText(profile.townCity)) {
    updates.town_city = profile.townCity;
  }
  if (isEmptyText(existingCandidate.county_region) && hasText(profile.countyRegion)) {
    updates.county_region = profile.countyRegion;
  }
  if (isEmptyText(existingCandidate.postcode) && hasText(profile.postcode)) {
    updates.postcode = profile.postcode;
  }
  if (isEmptyText(existingCandidate.country) && hasText(profile.country)) {
    updates.country = profile.country;
  }

  if (
    isEmptyText(existingCandidate.current_job_title) &&
    hasText(profile.currentJobTitle)
  ) {
    updates.current_job_title = profile.currentJobTitle;
  }
  if (
    isEmptyText(existingCandidate.current_employer) &&
    hasText(profile.currentEmployer)
  ) {
    updates.current_employer = profile.currentEmployer;
  }
  if (
    (existingCandidate.years_experience === null ||
      existingCandidate.years_experience === undefined) &&
    profile.yearsExperience !== null
  ) {
    updates.years_experience = profile.yearsExperience;
  }
  if (
    isEmptyText(existingCandidate.preferred_location) &&
    hasText(profile.preferredLocation)
  ) {
    updates.preferred_location = profile.preferredLocation;
  }
  if (
    (isEmptyText(existingCandidate.preferred_employment_type) ||
      existingCandidate.preferred_employment_type === "not_recorded") &&
    hasText(profile.preferredEmploymentType) &&
    profile.preferredEmploymentType !== "not_recorded"
  ) {
    updates.preferred_employment_type = profile.preferredEmploymentType;
  }
  if (
    isEmptyText(existingCandidate.salary_expectations) &&
    hasText(profile.salaryExpectations)
  ) {
    updates.salary_expectations = profile.salaryExpectations;
  }
  if (
    isEmptyText(existingCandidate.earliest_start_date) &&
    hasText(profile.earliestStartDate)
  ) {
    updates.earliest_start_date = profile.earliestStartDate;
  }

  if (isEmptySkills(existingCandidate.skills) && profile.skills.length > 0) {
    updates.skills = profile.skills;
  }
  if (isEmptyText(existingCandidate.summary) && hasText(profile.professionalSummary)) {
    updates.summary = profile.professionalSummary;
  }

  return updates;
}

function displayDocumentType(type: DocumentType) {
  if (type === "cv") return "Curriculum vitae";
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function POST(request: Request) {
  const uploadedPaths: string[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "You are not signed in." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const vacancyId = String(formData.get("vacancyId") ?? "").trim();
    const source = String(formData.get("source") ?? "email").trim();
    const sourceDetail = String(formData.get("sourceDetail") ?? "").trim();
    const firstName = String(formData.get("firstName") ?? "").trim();
    const middleNames = optionalText(formData.get("middleNames"));
    const lastName = String(formData.get("lastName") ?? "").trim();
    const preferredName = optionalText(formData.get("preferredName"));
    const emailValue = optionalText(formData.get("email"));
    const email = emailValue ? normaliseEmail(emailValue) : "";
    const phone = optionalText(formData.get("phone"));
    const isInternalCandidate =
      String(formData.get("isInternalCandidate") ?? "false") === "true";

    const profile: ApplicationProfile = {
      firstName,
      middleNames,
      lastName,
      preferredName,
      email: email || null,
      phone,
      addressLine1: optionalText(formData.get("addressLine1")),
      addressLine2: optionalText(formData.get("addressLine2")),
      townCity: optionalText(formData.get("townCity")),
      countyRegion: optionalText(formData.get("countyRegion")),
      postcode: normalisePostcode(optionalText(formData.get("postcode"))),
      country: optionalText(formData.get("country")),
      currentJobTitle: optionalText(formData.get("currentJobTitle")),
      currentEmployer: optionalText(formData.get("currentEmployer")),
      yearsExperience: normaliseYearsExperience(formData.get("yearsExperience")),
      preferredLocation: optionalText(formData.get("preferredLocation")),
      preferredEmploymentType: optionalText(formData.get("preferredEmploymentType")),
      salaryExpectations: optionalText(formData.get("salaryExpectations")),
      earliestStartDate: optionalText(formData.get("earliestStartDate")),
      skills: parseSkills(formData),
      professionalSummary:
        optionalText(formData.get("professionalSummary")) ??
        optionalText(formData.get("summary")),
    };

    if (!vacancyId || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "Vacancy, first name and last name are required." },
        { status: 400 },
      );
    }

    const cv = formData.get("cv");
    if (!(cv instanceof File) || cv.size === 0) {
      return NextResponse.json(
        { success: false, error: "Upload the candidate's CV before saving." },
        { status: 400 },
      );
    }

    const files: UploadedDocument[] = documentTypes
      .map((type) => ({ type, file: formData.get(type) }))
      .filter((item): item is { type: DocumentType; file: File } =>
        item.file instanceof File && item.file.size > 0,
      )
      .map((item) => ({
        ...item,
        title: displayDocumentType(item.type),
        slotKey: item.type,
      }));

    const supportingDocuments = formData
      .getAll("supportingDocuments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
      .map((file, index) => ({
        type: "other" as const,
        file,
        title: file.name.replace(/\.[^.]+$/, "") || "Supporting Document",
        slotKey: `supporting_document_${index + 1}`,
      }));

    files.push(...supportingDocuments);

    const oversized = files.find((item) => item.file.size > 15 * 1024 * 1024);
    if (oversized) {
      return NextResponse.json(
        {
          success: false,
          error: `${oversized.file.name} is larger than the 15 MB upload limit.`,
        },
        { status: 400 },
      );
    }

    const { data: vacancy, error: vacancyError } = await supabase
      .from("leo_talent_vacancies")
      .select("id, organisation_id, blind_review_enabled, ai_screening_enabled")
      .eq("id", vacancyId)
      .single();

    if (vacancyError || !vacancy?.organisation_id) {
      return NextResponse.json(
        { success: false, error: "The selected vacancy could not be found." },
        { status: vacancyError?.code === "PGRST116" ? 404 : 500 },
      );
    }

    let candidateId: string | null = null;
    let existingCandidate: any = null;

    if (email) {
      const dedupe = await findSafeCandidateByOrganisationAndEmail(
        supabase,
        vacancy.organisation_id,
        email,
        {
          select:
            "id, first_name, middle_names, last_name, preferred_name, email, phone, address_line_1, address_line_2, town_city, county_region, postcode, country, current_job_title, current_employer, years_experience, preferred_location, preferred_employment_type, salary_expectations, earliest_start_date, skills, summary",
        },
      );

      existingCandidate = dedupe.matched ? dedupe.candidate : null;
      candidateId = dedupe.matched && dedupe.candidate?.id ? dedupe.candidate.id : null;
    }

    if (candidateId && existingCandidate) {
      const candidateFieldUpdates = buildProfileFieldUpdates(existingCandidate, profile);
      if (Object.keys(candidateFieldUpdates).length > 0) {
        const { error: candidateUpdateError } = await supabase
          .from("leo_talent_candidates")
          .update({
            ...candidateFieldUpdates,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", candidateId)
          .eq("organisation_id", vacancy.organisation_id);

        if (candidateUpdateError) throw candidateUpdateError;
      }
    }

    if (!candidateId) {
      const { data: createdCandidate, error: candidateError } = await supabase
        .from("leo_talent_candidates")
        .insert({
          organisation_id: vacancy.organisation_id,
          first_name: firstName,
          middle_names: middleNames,
          last_name: lastName,
          preferred_name: preferredName,
          email: email || null,
          phone,
          address_line_1: profile.addressLine1,
          address_line_2: profile.addressLine2,
          town_city: profile.townCity,
          county_region: profile.countyRegion,
          postcode: profile.postcode,
          country: profile.country,
          current_job_title: profile.currentJobTitle,
          current_employer: profile.currentEmployer,
          years_experience: profile.yearsExperience,
          preferred_location: profile.preferredLocation,
          preferred_employment_type: profile.preferredEmploymentType || "not_recorded",
          salary_expectations: profile.salaryExpectations,
          earliest_start_date: profile.earliestStartDate,
          skills: profile.skills,
          summary: profile.professionalSummary,
          is_internal_candidate: isInternalCandidate,
          source,
          source_detail: sourceDetail || null,
          metadata: { intake_route: "cv_upload" },
          created_by: user.id,
          updated_by: user.id,
        } as never)
        .select("id")
        .single();

      if (candidateError || !createdCandidate?.id) {
        throw candidateError ?? new Error("Candidate record was not returned.");
      }

      candidateId = createdCandidate.id;
    }

    const { data: duplicate, error: duplicateError } = await supabase
      .from("leo_talent_applications")
      .select("id, application_reference")
      .eq("vacancy_id", vacancy.id)
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (duplicateError) throw duplicateError;
    if (duplicate?.id) {
      return NextResponse.json(
        {
          success: false,
          error: `This candidate already has application ${duplicate.application_reference} for the selected vacancy.`,
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const { data: application, error: applicationError } = await supabase
      .from("leo_talent_applications")
      .insert({
        organisation_id: vacancy.organisation_id,
        vacancy_id: vacancy.id,
        candidate_id: candidateId,
        current_stage_key: "new",
        status: "active",
        source,
        submitted_at: now,
        blind_review_enabled: vacancy.blind_review_enabled,
        ai_screening_enabled: vacancy.ai_screening_enabled,
        metadata: {
          intake_route: "cv_upload",
          source_detail: sourceDetail || null,
          application_profile: profile,
        },
        created_by: user.id,
        updated_by: user.id,
      } as never)
      .select("id, application_reference")
      .single();

    if (applicationError || !application?.id) {
      throw applicationError ?? new Error("Application record was not returned.");
    }

    for (const { type, file, title, slotKey } of files) {
      const path = `${vacancy.organisation_id}/${candidateId}/${application.id}/${slotKey}-${cleanFileName(file.name)}`;

      const { data: existingDocumentRow, error: existingDocumentError } = await supabase
        .from("leo_talent_candidate_documents")
        .select("id")
        .eq("organisation_id", vacancy.organisation_id)
        .eq("candidate_id", candidateId)
        .eq("application_id", application.id)
        .eq("file_path", path)
        .maybeSingle();

      if (existingDocumentError) throw existingDocumentError;
      if (existingDocumentRow?.id) {
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: storageError } = await supabase.storage
        .from("leo-talent-candidate-documents")
        .upload(path, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (storageError) {
        if (!storageError.message.toLowerCase().includes("already exists")) {
          throw storageError;
        }
      } else {
        uploadedPaths.push(path);
      }

      const { error: documentError } = await supabase
        .from("leo_talent_candidate_documents")
        .insert({
          organisation_id: vacancy.organisation_id,
          candidate_id: candidateId,
          vacancy_id: vacancy.id,
          application_id: application.id,
          document_type: type,
          title,
          file_name: file.name,
          file_path: path,
          mime_type: file.type || null,
          file_size_bytes: file.size,
          is_sensitive: false,
          visible_to_candidate: false,
          metadata: { intake_route: "applications_workspace" },
          uploaded_by: user.id,
        } as never);

      if (documentError) throw documentError;
    }

    return NextResponse.json({
      success: true,
      applicationReference: application.application_reference,
      message: `${application.application_reference} was created and the CV was uploaded successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not create this application.",
      },
      { status: 500 },
    );
  }
}