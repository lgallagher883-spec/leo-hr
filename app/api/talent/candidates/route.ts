import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";
import {
  findSafeCandidateByOrganisationAndEmail,
  normaliseEmail,
} from "@/lib/talent/candidateDedup";

type PlatformRole = "owner" | "senior" | "manager" | "employee";
type UploadItem = { file: File; type: "cv" | "cover_letter" | "other"; title: string };

const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);
const talentPoolStatuses = new Set(["not_added", "active", "do_not_contact", "withdrawn", "archived"]);
const employmentTypes = new Set(["not_recorded", "full_time", "part_time", "temporary", "fixed_term", "casual", "flexible"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/rtf",
  "text/plain",
  "image/jpeg",
  "image/png",
]);
const maxFileSize = 15 * 1024 * 1024;

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function optionalText(value: unknown): string | null { const result = text(value); return result || null; }
function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();
  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";
  return "employee";
}

async function getAuthorisedContext(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: NextResponse.json({ success: false, error: "Your session is unavailable. Please sign in again." }, { status: 401 }) };

  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;
  if (!organisationId) return { error: NextResponse.json({ success: false, error: "Leo could not find an active organisation for your account." }, { status: 403 }) };
  return { user, organisationId, role: normaliseRole(resolvedRole?.roleKey) };
}

function candidatePayload(input: any, userId: string) {
  const firstName = text(input.firstName);
  const lastName = text(input.lastName);
  if (!firstName) throw new Error("Enter the candidate’s first name.");
  if (!lastName) throw new Error("Enter the candidate’s last name.");

  const email = normaliseEmail(input.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address or leave the email field empty.");

  const existingEmployeeId = text(input.existingEmployeeId);
  if (input.isInternalCandidate === true && existingEmployeeId && (!Number.isInteger(Number(existingEmployeeId)) || Number(existingEmployeeId) <= 0)) throw new Error("The employee reference must be a whole number.");

  const yearsExperience = text(input.yearsExperience);
  if (yearsExperience && (!Number.isFinite(Number(yearsExperience)) || Number(yearsExperience) < 0 || Number(yearsExperience) > 80)) throw new Error("Enter years of experience between 0 and 80, or leave it blank.");

  const doNotContact = input.doNotContact === true;
  if (doNotContact && !text(input.doNotContactReason)) throw new Error("Add a brief reason when Do Not Contact is selected.");

  const talentPoolStatus = doNotContact ? "do_not_contact" : text(input.talentPoolStatus) || "not_added";
  if (!talentPoolStatuses.has(talentPoolStatus)) throw new Error("The talent-pool status is invalid.");

  const preferredEmploymentType = text(input.preferredEmploymentType) || "not_recorded";
  if (!employmentTypes.has(preferredEmploymentType)) throw new Error("The preferred employment type is invalid.");

  const consentToContact = input.consentToContact === true && !doNotContact;
  const skills = Array.isArray(input.skills) ? Array.from(new Set(input.skills.map((item: unknown) => text(item)).filter(Boolean))) : [];

  return {
    first_name: firstName,
    middle_names: optionalText(input.middleNames),
    last_name: lastName,
    preferred_name: optionalText(input.preferredName),
    email,
    phone: optionalText(input.phone),
    address_line_1: optionalText(input.addressLine1),
    address_line_2: optionalText(input.addressLine2),
    town_city: optionalText(input.townCity),
    county_region: optionalText(input.countyRegion),
    postcode: optionalText(input.postcode)?.toUpperCase() ?? null,
    country: optionalText(input.country) ?? "United Kingdom",
    is_internal_candidate: input.isInternalCandidate === true,
    existing_employee_id: input.isInternalCandidate === true && existingEmployeeId ? Number(existingEmployeeId) : null,
    source: optionalText(input.source),
    source_detail: optionalText(input.sourceDetail),
    talent_pool_status: talentPoolStatus,
    consent_to_contact: consentToContact,
    privacy_notice_version: optionalText(input.privacyNoticeVersion),
    data_retention_review_date: optionalText(input.dataRetentionReviewDate),
    do_not_contact: doNotContact,
    do_not_contact_reason: doNotContact ? optionalText(input.doNotContactReason) : null,
    current_job_title: optionalText(input.currentJobTitle),
    current_employer: optionalText(input.currentEmployer),
    years_experience: yearsExperience ? Number(yearsExperience) : null,
    preferred_location: optionalText(input.preferredLocation),
    preferred_employment_type: preferredEmploymentType,
    salary_expectations: optionalText(input.salaryExpectations),
    earliest_start_date: optionalText(input.earliestStartDate),
    general_notes: optionalText(input.generalNotes),
    summary: optionalText(input.summary),
    skills,
    updated_by: userId,
  };
}

function filesFromFormData(formData: FormData): UploadItem[] {
  const result: UploadItem[] = [];
  const cv = formData.get("cv");
  const coverLetter = formData.get("coverLetter");
  if (cv instanceof File && cv.size > 0) result.push({ file: cv, type: "cv", title: "CV" });
  if (coverLetter instanceof File && coverLetter.size > 0) result.push({ file: coverLetter, type: "cover_letter", title: "Cover Letter" });
  for (const entry of formData.getAll("supportingDocuments")) {
    if (entry instanceof File && entry.size > 0) result.push({ file: entry, type: "other", title: entry.name.replace(/\.[^.]+$/, "") });
  }
  return result;
}

async function uploadDocuments(supabase: any, organisationId: string, candidateId: string, files: UploadItem[]) {
  const uploadedPaths: string[] = [];
  try {
    for (const item of files) {
      if (item.file.size > maxFileSize) throw new Error(`${item.file.name} exceeds the 15 MB upload limit.`);
      if (item.file.type && !allowedMimeTypes.has(item.file.type)) throw new Error(`${item.file.name} is not an allowed document type.`);
      const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
      const filePath = `${organisationId}/${candidateId}/${crypto.randomUUID()}-${safeName}`;
      const bytes = new Uint8Array(await item.file.arrayBuffer());
      const uploadResult = await supabase.storage.from("leo-talent-candidate-documents").upload(filePath, bytes, {
        cacheControl: "3600",
        upsert: false,
        contentType: item.file.type || undefined,
      });
      if (uploadResult.error) throw new Error(`${item.file.name} could not be uploaded.`);
      uploadedPaths.push(filePath);

      const documentResult = await supabase.from("leo_talent_candidate_documents").insert({
        organisation_id: organisationId,
        candidate_id: candidateId,
        document_type: item.type,
        title: item.title,
        file_name: item.file.name,
        file_path: filePath,
        mime_type: item.file.type || null,
        file_size_bytes: item.file.size,
      });
      if (documentResult.error) throw new Error(`${item.file.name} could not be linked to the candidate record.`);
    }
  } catch (error) {
    if (uploadedPaths.length > 0) await supabase.storage.from("leo-talent-candidate-documents").remove(uploadedPaths);
    throw error;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);
    if ("error" in access) return access.error;

    const result = await (supabase as any)
      .from("leo_talent_candidates")
      .select(`
        id, organisation_id, candidate_reference, first_name, middle_names, last_name, preferred_name,
        email, phone, address_line_1, address_line_2, town_city, county_region, postcode, country,
        is_internal_candidate, existing_employee_id, source, source_detail, talent_pool_status,
        consent_to_contact, consent_recorded_at, privacy_notice_version, data_retention_review_date,
        do_not_contact, do_not_contact_reason, current_job_title, current_employer, years_experience,
        preferred_location, preferred_employment_type, salary_expectations, earliest_start_date,
        general_notes, summary, skills, metadata, created_by, updated_by, created_at, updated_at,
        archived_at, archived_by, archive_reason,
        documents:leo_talent_candidate_documents (
          id, candidate_id, document_type, title, file_name, file_path, mime_type, file_size_bytes, created_at
        ),
        applications:leo_talent_applications (
          id, application_reference, current_stage_key, status, submitted_at, updated_at,
          vacancy:leo_talent_vacancies (id, vacancy_reference, title, department, location_name)
        )
      `)
      .eq("organisation_id", access.organisationId)
      .order("updated_at", { ascending: false });

    if (result.error) throw new Error(result.error.message);
    return NextResponse.json({ success: true, candidates: result.data ?? [] });
  } catch (error) {
    console.error("Candidate register load failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Leo could not load the candidate register." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);
    if ("error" in access) return access.error;
    if (!writeRoles.has(access.role)) return NextResponse.json({ success: false, error: "You do not have permission to create candidate records." }, { status: 403 });

    const formData = await request.formData();
    const rawCandidate = text(formData.get("candidate"));
    if (!rawCandidate) return NextResponse.json({ success: false, error: "Candidate details were not supplied." }, { status: 400 });
    const input = JSON.parse(rawCandidate);
    const payload = candidatePayload(input, access.user.id);
    const now = new Date().toISOString();

    let candidateRecord: any = null;
    let created = false;

    if (payload.email) {
      const dedupe = await findSafeCandidateByOrganisationAndEmail(
        supabase as any,
        access.organisationId,
        payload.email,
      );

      if (dedupe.matched && dedupe.candidate) {
        candidateRecord = dedupe.candidate;
      }
    }

    if (!candidateRecord) {
      const result = await (supabase as any).from("leo_talent_candidates").insert({
        ...payload,
        organisation_id: access.organisationId,
        created_by: access.user.id,
        created_at: now,
        updated_at: now,
        consent_recorded_at: payload.consent_to_contact ? now : null,
      }).select("*").single();
      if (result.error) throw new Error(result.error.message);
      candidateRecord = result.data;
      created = true;
    } else {
      const touched = await (supabase as any)
        .from("leo_talent_candidates")
        .update({
          updated_at: now,
          updated_by: access.user.id,
        })
        .eq("id", candidateRecord.id)
        .eq("organisation_id", access.organisationId)
        .select("*")
        .single();

      if (touched.error) throw new Error(touched.error.message);
      candidateRecord = touched.data;
    }

    const files = filesFromFormData(formData);
    if (files.length > 0) {
      await uploadDocuments(
        supabase as any,
        access.organisationId,
        candidateRecord.id,
        files,
      );
    }

    return NextResponse.json(
      { success: true, candidate: candidateRecord, created },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Candidate creation failed:", error);
    const message = error instanceof Error ? error.message : "Leo could not create the candidate record.";
    const status = message.includes("Enter ") || message.includes("invalid") || message.includes("limit") || message.includes("allowed") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}