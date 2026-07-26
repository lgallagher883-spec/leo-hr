import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PlatformRole = "owner" | "senior" | "manager" | "employee";

type SharedKey =
  | "identity_verification"
  | "right_to_work"
  | "references"
  | "dbs"
  | "overseas_checks"
  | "qualifications"
  | "professional_registrations"
  | "driving"
  | "vehicle"
  | "appointment_decision";

const writeRoles = new Set<PlatformRole>(["owner", "senior", "manager"]);
const sharedKeys = new Set<SharedKey>([
  "identity_verification",
  "right_to_work",
  "references",
  "dbs",
  "overseas_checks",
  "qualifications",
  "professional_registrations",
  "driving",
  "vehicle",
  "appointment_decision",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const result = text(value);
  return result || null;
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();

  if (role === "owner") return "owner";
  if (role === "senior" || role === "hr") return "senior";
  if (role === "manager") return "manager";

  return "employee";
}

async function getAuthorisedContext(supabase: any) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const membershipResult = await supabase
    .from("organisation_memberships")
    .select("organisation_id, role, membership_status")
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .order("is_default_organisation", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipResult.error) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error:
            membershipResult.error.message ||
            "Leo could not verify your organisation access.",
        },
        { status: 500 },
      ),
    };
  }

  const organisationId = membershipResult.data?.organisation_id ?? null;
  const role = normaliseRole(membershipResult.data?.role);

  if (!organisationId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Leo could not find an active organisation for your account.",
        },
        { status: 403 },
      ),
    };
  }

  return { user, organisationId, role };
}

function extractStatus(key: SharedKey, value: any): string | null {
  switch (key) {
    case "identity_verification":
    case "right_to_work":
    case "dbs":
    case "vehicle":
      return optionalText(value?.status);
    case "references":
    case "overseas_checks":
    case "qualifications":
    case "professional_registrations":
      return optionalText(value?.overallStatus);
    case "driving":
      return optionalText(value?.checkStatus);
    case "appointment_decision":
      return optionalText(value?.outcome);
  }
}

function isComplete(key: SharedKey, payload: any, vacancy: any) {
  if (key === "dbs" && !vacancy?.requires_dbs) return true;
  if (
    key === "overseas_checks" &&
    !vacancy?.overseas_check_required_if_applicable
  )
    return true;
  if (key === "qualifications" && !vacancy?.requires_qualification_checks)
    return true;
  if (key === "driving" && !vacancy?.requires_driving) return true;
  if (key === "vehicle" && !vacancy?.requires_driving) return true;

  const status = extractStatus(key, payload);

  return [
    "verified",
    "complete",
    "satisfactory",
    "active",
    "approved",
    "not_required",
    "cleared",
    "cleared_with_conditions",
  ].includes(status ?? "");
}

async function getProfile(supabase: any, organisationId: string, id: string) {
  return (supabase as any)
    .from("leo_talent_safer_recruitment_profiles")
    .select("*")
    .eq("id", id)
    .eq("organisation_id", organisationId)
    .maybeSingle();
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) return access.error;

    const profileResult = await getProfile(
      supabase,
      access.organisationId,
      id,
    );

    if (profileResult.error) throw new Error(profileResult.error.message);

    if (!profileResult.data) {
      return NextResponse.json(
        { success: false, error: "The due diligence record was not found." },
        { status: 404 },
      );
    }

    const profile = profileResult.data;

    const [sharedResult, documentsResult] = await Promise.all([
      (supabase as any)
        .from("leo_talent_candidate_shared_records")
        .select("id,component_key,payload,status,updated_at")
        .eq("organisation_id", access.organisationId)
        .eq("candidate_id", profile.candidate_id)
        .eq("application_id", profile.application_id),
      (supabase as any)
        .from("leo_talent_candidate_documents")
        .select(
          "id,title,document_type,file_name,created_at,verified_by,verification_notes",
        )
        .eq("organisation_id", access.organisationId)
        .eq("candidate_id", profile.candidate_id)
        .order("created_at", { ascending: false }),
    ]);

    if (sharedResult.error) throw new Error(sharedResult.error.message);
    if (documentsResult.error) throw new Error(documentsResult.error.message);

    return NextResponse.json({
      success: true,
      sharedRecords: sharedResult.data ?? [],
      documents: documentsResult.data ?? [],
    });
  } catch (error) {
    console.error("Due diligence detail loading failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Candidate due diligence details could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) return access.error;

    if (!writeRoles.has(access.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update due diligence records.",
        },
        { status: 403 },
      );
    }

    const profileResult = await getProfile(
      supabase,
      access.organisationId,
      id,
    );

    if (profileResult.error) throw new Error(profileResult.error.message);

    if (!profileResult.data) {
      return NextResponse.json(
        { success: false, error: "The due diligence record was not found." },
        { status: 404 },
      );
    }

    const profile = profileResult.data;
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action);
    const now = new Date().toISOString();

    if (action === "save_personal") {
      const value = (body.value ?? {}) as Record<string, unknown>;
      const firstName = text(value.firstName);
      const lastName = text(value.lastName);

      if (!firstName || !lastName) {
        return NextResponse.json(
          {
            success: false,
            error: "The candidate's first name and last name are required.",
          },
          { status: 400 },
        );
      }

      const candidateUpdate = {
        first_name: firstName,
        middle_names: optionalText(value.middleNames),
        last_name: lastName,
        preferred_name: optionalText(value.preferredName),
        email: optionalText(value.personalEmail),
        phone: optionalText(value.personalTelephone),
        country: optionalText(value.country),
        updated_at: now,
      };

      const candidateResult = await (supabase as any)
        .from("leo_talent_candidates")
        .update(candidateUpdate)
        .eq("id", profile.candidate_id)
        .eq("organisation_id", access.organisationId)
        .select(
          "id,candidate_reference,first_name,middle_names,last_name,preferred_name,email,phone,country",
        )
        .single();

      if (candidateResult.error) {
        throw new Error(
          candidateResult.error.message ||
            "Personal details could not be saved.",
        );
      }

      return NextResponse.json({
        success: true,
        candidate: candidateResult.data,
      });
    }

    if (action === "save_shared") {
      const key = text(body.key) as SharedKey;

      if (!sharedKeys.has(key)) {
        return NextResponse.json(
          { success: false, error: "The due diligence record type is invalid." },
          { status: 400 },
        );
      }

      const payload =
        body.value && typeof body.value === "object"
          ? (body.value as Record<string, unknown>)
          : {};

      const vacancyResult = await (supabase as any)
        .from("leo_talent_vacancies")
        .select(
          "requires_dbs,requires_driving,requires_qualification_checks,overseas_check_required_if_applicable",
        )
        .eq("id", profile.vacancy_id)
        .eq("organisation_id", access.organisationId)
        .maybeSingle();

      if (vacancyResult.error) throw new Error(vacancyResult.error.message);

      const status = extractStatus(key, payload);
      const complete = isComplete(key, payload, vacancyResult.data);

      const sharedResult = await (supabase as any)
        .from("leo_talent_candidate_shared_records")
        .upsert(
          {
            organisation_id: access.organisationId,
            candidate_id: profile.candidate_id,
            application_id: profile.application_id,
            vacancy_id: profile.vacancy_id,
            safer_recruitment_profile_id: profile.id,
            component_key: key,
            payload,
            status,
            completed_at: complete ? now : null,
            updated_at: now,
          },
          {
            onConflict:
              "organisation_id,candidate_id,application_id,component_key",
          },
        )
        .select("id,component_key,payload,status,updated_at")
        .single();

      if (sharedResult.error) {
        throw new Error(
          sharedResult.error.message || "The record could not be saved.",
        );
      }

      const profileUpdate = await (supabase as any)
        .from("leo_talent_safer_recruitment_profiles")
        .update({ status: "in_progress", updated_at: now })
        .eq("id", profile.id)
        .eq("organisation_id", access.organisationId);

      if (profileUpdate.error) {
        console.warn(
          "Due diligence record saved but profile status was not updated:",
          profileUpdate.error,
        );
      }

      return NextResponse.json({
        success: true,
        sharedRecord: sharedResult.data,
      });
    }

    return NextResponse.json(
      { success: false, error: "The requested due diligence action is invalid." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Due diligence update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The due diligence record could not be saved.",
      },
      { status: 500 },
    );
  }
}