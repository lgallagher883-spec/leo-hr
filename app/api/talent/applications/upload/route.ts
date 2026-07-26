import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentTypes = ["cv", "cover_letter", "application_form", "portfolio"] as const;
type DocumentType = (typeof documentTypes)[number];

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
    const middleNames = String(formData.get("middleNames") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const preferredName = String(formData.get("preferredName") ?? "").trim();
    const email = normaliseEmail(String(formData.get("email") ?? ""));
    const phone = String(formData.get("phone") ?? "").trim();
    const isInternalCandidate =
      String(formData.get("isInternalCandidate") ?? "false") === "true";

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

    const files = documentTypes
      .map((type) => ({ type, file: formData.get(type) }))
      .filter((item): item is { type: DocumentType; file: File } =>
        item.file instanceof File && item.file.size > 0,
      );

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

    if (email) {
      const { data: existingCandidate, error: lookupError } = await supabase
        .from("leo_talent_candidates")
        .select("id")
        .eq("organisation_id", vacancy.organisation_id)
        .ilike("email", email)
        .is("archived_at", null)
        .maybeSingle();

      if (lookupError) throw lookupError;
      candidateId = existingCandidate?.id ?? null;
    }

    if (!candidateId) {
      const { data: createdCandidate, error: candidateError } = await supabase
        .from("leo_talent_candidates")
        .insert({
          organisation_id: vacancy.organisation_id,
          first_name: firstName,
          middle_names: middleNames || null,
          last_name: lastName,
          preferred_name: preferredName || null,
          email: email || null,
          phone: phone || null,
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
        },
        created_by: user.id,
        updated_by: user.id,
      } as never)
      .select("id, application_reference")
      .single();

    if (applicationError || !application?.id) {
      throw applicationError ?? new Error("Application record was not returned.");
    }

    for (const { type, file } of files) {
      const path = `${vacancy.organisation_id}/${candidateId}/${application.id}/${crypto.randomUUID()}-${cleanFileName(file.name)}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: storageError } = await supabase.storage
        .from("leo-talent-candidate-documents")
        .upload(path, buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (storageError) throw storageError;
      uploadedPaths.push(path);

      const { error: documentError } = await supabase
        .from("leo_talent_candidate_documents")
        .insert({
          organisation_id: vacancy.organisation_id,
          candidate_id: candidateId,
          vacancy_id: vacancy.id,
          application_id: application.id,
          document_type: type,
          title: displayDocumentType(type),
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