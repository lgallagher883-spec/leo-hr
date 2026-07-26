import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };
type PlatformRole = "owner" | "senior" | "manager" | "employee";
const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);
const talentPoolStatuses = new Set(["not_added", "active", "do_not_contact", "withdrawn", "archived"]);
const employmentTypes = new Set(["not_recorded", "full_time", "part_time", "temporary", "fixed_term", "casual", "flexible"]);
const allowedMimeTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/rtf", "text/rtf", "text/plain", "image/jpeg", "image/png"]);
const maxFileSize = 15 * 1024 * 1024;

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function optionalText(value: unknown): string | null { const result = text(value); return result || null; }
function normaliseRole(value: unknown): PlatformRole { const role = text(value).toLowerCase(); if (role === "owner") return "owner"; if (role === "senior" || role === "hr") return "senior"; if (role === "manager") return "manager"; return "employee"; }
async function getAuthorisedContext(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: NextResponse.json({ success: false, error: "Your session is unavailable. Please sign in again." }, { status: 401 }) };
  const membershipResult = await supabase.from("organisation_memberships").select("organisation_id, role, membership_status").eq("user_id", user.id).eq("membership_status", "active").order("is_default_organisation", { ascending: false }).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (membershipResult.error) return { error: NextResponse.json({ success: false, error: membershipResult.error.message || "Leo could not verify your organisation access." }, { status: 500 }) };
  const organisationId = membershipResult.data?.organisation_id ?? null;
  if (!organisationId) return { error: NextResponse.json({ success: false, error: "Leo could not find an active organisation for your account." }, { status: 403 }) };
  return { user, organisationId, role: normaliseRole(membershipResult.data?.role) };
}
function payload(input: any, userId: string, existing: any) {
  const firstName = text(input.firstName); const lastName = text(input.lastName);
  if (!firstName) throw new Error("Enter the candidate’s first name."); if (!lastName) throw new Error("Enter the candidate’s last name.");
  const email = optionalText(input.email); if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address or leave the email field empty.");
  const existingEmployeeId = text(input.existingEmployeeId); if (input.isInternalCandidate === true && existingEmployeeId && (!Number.isInteger(Number(existingEmployeeId)) || Number(existingEmployeeId) <= 0)) throw new Error("The employee reference must be a whole number.");
  const yearsExperience = text(input.yearsExperience); if (yearsExperience && (!Number.isFinite(Number(yearsExperience)) || Number(yearsExperience) < 0 || Number(yearsExperience) > 80)) throw new Error("Enter years of experience between 0 and 80, or leave it blank.");
  const doNotContact = input.doNotContact === true; if (doNotContact && !text(input.doNotContactReason)) throw new Error("Add a brief reason when Do Not Contact is selected.");
  const talentPoolStatus = doNotContact ? "do_not_contact" : text(input.talentPoolStatus) || "not_added"; if (!talentPoolStatuses.has(talentPoolStatus)) throw new Error("The talent-pool status is invalid.");
  const preferredEmploymentType = text(input.preferredEmploymentType) || "not_recorded"; if (!employmentTypes.has(preferredEmploymentType)) throw new Error("The preferred employment type is invalid.");
  const consentToContact = input.consentToContact === true && !doNotContact;
  const consentRecordedAt = consentToContact ? (existing.consent_to_contact ? existing.consent_recorded_at ?? new Date().toISOString() : new Date().toISOString()) : null;
  return {
    first_name: firstName, middle_names: optionalText(input.middleNames), last_name: lastName, preferred_name: optionalText(input.preferredName), email,
    phone: optionalText(input.phone), address_line_1: optionalText(input.addressLine1), address_line_2: optionalText(input.addressLine2), town_city: optionalText(input.townCity), county_region: optionalText(input.countyRegion), postcode: optionalText(input.postcode)?.toUpperCase() ?? null, country: optionalText(input.country) ?? "United Kingdom",
    is_internal_candidate: input.isInternalCandidate === true, existing_employee_id: input.isInternalCandidate === true && existingEmployeeId ? Number(existingEmployeeId) : null,
    source: optionalText(input.source), source_detail: optionalText(input.sourceDetail), talent_pool_status: talentPoolStatus, consent_to_contact: consentToContact, consent_recorded_at: consentRecordedAt,
    privacy_notice_version: optionalText(input.privacyNoticeVersion), data_retention_review_date: optionalText(input.dataRetentionReviewDate), do_not_contact: doNotContact, do_not_contact_reason: doNotContact ? optionalText(input.doNotContactReason) : null,
    current_job_title: optionalText(input.currentJobTitle), current_employer: optionalText(input.currentEmployer), years_experience: yearsExperience ? Number(yearsExperience) : null,
    preferred_location: optionalText(input.preferredLocation), preferred_employment_type: preferredEmploymentType, salary_expectations: optionalText(input.salaryExpectations), earliest_start_date: optionalText(input.earliestStartDate),
    general_notes: optionalText(input.generalNotes), summary: optionalText(input.summary), skills: Array.isArray(input.skills) ? Array.from(new Set(input.skills.map((item: unknown) => text(item)).filter(Boolean))) : [], updated_by: userId, updated_at: new Date().toISOString(),
  };
}
function filesFromFormData(formData: FormData) { const result: Array<{ file: File; type: "cv" | "cover_letter" | "other"; title: string }> = []; const cv = formData.get("cv"); const cover = formData.get("coverLetter"); if (cv instanceof File && cv.size) result.push({ file: cv, type: "cv", title: "CV" }); if (cover instanceof File && cover.size) result.push({ file: cover, type: "cover_letter", title: "Cover Letter" }); for (const entry of formData.getAll("supportingDocuments")) if (entry instanceof File && entry.size) result.push({ file: entry, type: "other", title: entry.name.replace(/\.[^.]+$/, "") }); return result; }
async function uploadDocuments(supabase: any, organisationId: string, candidateId: string, files: ReturnType<typeof filesFromFormData>) {
  const paths: string[] = [];
  try { for (const item of files) { if (item.file.size > maxFileSize) throw new Error(`${item.file.name} exceeds the 15 MB upload limit.`); if (item.file.type && !allowedMimeTypes.has(item.file.type)) throw new Error(`${item.file.name} is not an allowed document type.`); const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-"); const filePath = `${organisationId}/${candidateId}/${crypto.randomUUID()}-${safeName}`; const bytes = new Uint8Array(await item.file.arrayBuffer()); const upload = await supabase.storage.from("leo-talent-candidate-documents").upload(filePath, bytes, { cacheControl: "3600", upsert: false, contentType: item.file.type || undefined }); if (upload.error) throw new Error(`${item.file.name} could not be uploaded.`); paths.push(filePath); const record = await supabase.from("leo_talent_candidate_documents").insert({ organisation_id: organisationId, candidate_id: candidateId, document_type: item.type, title: item.title, file_name: item.file.name, file_path: filePath, mime_type: item.file.type || null, file_size_bytes: item.file.size }); if (record.error) throw new Error(`${item.file.name} could not be linked to the candidate record.`); } } catch (error) { if (paths.length) await supabase.storage.from("leo-talent-candidate-documents").remove(paths); throw error; }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params; const supabase = await createClient(); const access = await getAuthorisedContext(supabase as any); if ("error" in access) return access.error;
    if (!writeRoles.has(access.role)) return NextResponse.json({ success: false, error: "You do not have permission to update candidate records." }, { status: 403 });
    const existingResult = await (supabase as any).from("leo_talent_candidates").select("*").eq("id", id).eq("organisation_id", access.organisationId).maybeSingle();
    if (existingResult.error) throw new Error(existingResult.error.message); if (!existingResult.data) return NextResponse.json({ success: false, error: "The candidate record was not found." }, { status: 404 });
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData(); const raw = text(formData.get("candidate")); if (!raw) return NextResponse.json({ success: false, error: "Candidate details were not supplied." }, { status: 400 });
      const update = payload(JSON.parse(raw), access.user.id, existingResult.data); const result = await (supabase as any).from("leo_talent_candidates").update(update).eq("id", id).eq("organisation_id", access.organisationId).select("*").single(); if (result.error) throw new Error(result.error.message);
      const files = filesFromFormData(formData); if (files.length) await uploadDocuments(supabase as any, access.organisationId, id, files);
      return NextResponse.json({ success: true, candidate: result.data });
    }
    const body = await request.json().catch(() => ({})); const action = text(body.action);
    if (action === "archive") { const now = new Date().toISOString(); const result = await (supabase as any).from("leo_talent_candidates").update({ archived_at: now, archived_by: access.user.id, archive_reason: optionalText(body.reason) ?? existingResult.data.archive_reason ?? "Archived from the Candidates workspace.", talent_pool_status: "archived", updated_by: access.user.id, updated_at: now }).eq("id", id).eq("organisation_id", access.organisationId).select("*").single(); if (result.error) throw new Error(result.error.message); return NextResponse.json({ success: true, candidate: result.data }); }
    if (action === "restore") { const result = await (supabase as any).from("leo_talent_candidates").update({ archived_at: null, archived_by: null, archive_reason: null, talent_pool_status: "not_added", updated_by: access.user.id, updated_at: new Date().toISOString() }).eq("id", id).eq("organisation_id", access.organisationId).select("*").single(); if (result.error) throw new Error(result.error.message); return NextResponse.json({ success: true, candidate: result.data }); }
    return NextResponse.json({ success: false, error: "The requested candidate action is not supported." }, { status: 400 });
  } catch (error) { console.error("Candidate update failed:", error); return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Leo could not update the candidate record." }, { status: 500 }); }
}