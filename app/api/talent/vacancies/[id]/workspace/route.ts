import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

type Candidate = {
  id: string;
  candidate_reference?: string | null;
  first_name?: string | null;
  middle_names?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  telephone?: string | null;
  phone?: string | null;
  status?: string | null;
  current_stage?: string | null;
  created_at?: string | null;
  archived_at?: string | null;
};

type Application = {
  id: string;
  candidate_id: string | null;
  vacancy_id: string;
  application_reference?: string | null;
  status?: string | null;
  current_stage_key?: string | null;
  stage?: string | null;
  source?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  candidate?: Candidate | Candidate[] | null;
  candidate_name?: string | null;
  candidate_email?: string | null;
};

type DueDiligenceRecord = {
  id: string;
  organisation_id: string | null;
  application_id: string;
  vacancy_id: string;
  candidate_id: string;
  status: string;
  overall_risk_level: string;
  overall_notes: string | null;
  review_required: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  candidate?: Candidate | null;
  application_reference?: string | null;
};

type TableAvailability = {
  publicationChannels: boolean;
  vacancyQuestions: boolean;
  applications: boolean;
  candidates: boolean;
  interviews: boolean;
  dueDiligence: boolean;
  offers: boolean;
  documents: boolean;
  activity: boolean;
};

const initialAvailability: TableAvailability = {
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

  return "Employee";
}

function candidateDisplayName(candidate: Candidate): string {
  const combined =
    `${candidate.first_name ?? ""} ${candidate.last_name ?? ""}`.trim();

  return candidate.full_name || combined || "Candidate";
}

function firstRelatedRecord<T>(
  value: T | T[] | null | undefined,
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const vacancyId = id?.trim();

    if (!vacancyId) {
      return NextResponse.json(
        {
          success: false,
          error: "The vacancy reference is invalid.",
        },
        { status: 400 },
      );
    }

    const vacancyResult = await (supabase as any)
      .from("leo_talent_vacancies")
      .select("*")
      .eq("id", vacancyId)
      .single();

    if (vacancyResult.error || !vacancyResult.data) {
      console.error(
        "Talent vacancy workspace could not load the vacancy:",
        vacancyResult.error,
      );

      const status =
        vacancyResult.error?.code === "PGRST116" ? 404 : 500;

      return NextResponse.json(
        {
          success: false,
          error:
            vacancyResult.error?.message ||
            "The vacancy could not be found.",
        },
        { status },
      );
    }

    const vacancy = vacancyResult.data;

    const resolvedRole = await resolveAuthoritativeUserRole(
      supabase as any,
      {
        userId: user.id,
        organisationId: String(vacancy.organisation_id ?? ""),
        allowedStatuses: ["active"],
      },
    );

    if (!resolvedRole) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this vacancy.",
        },
        { status: 403 },
      );
    }

    const userContext = {
      userId: user.id,
      organisationId: resolvedRole.membership.organisation_id,
      role: normaliseRole(resolvedRole.roleKey),
    };

    const availability: TableAvailability = {
      ...initialAvailability,
    };

    const applicationsResult = await (supabase as any)
      .from("leo_talent_applications")
      .select(
        `
          id,
          candidate_id,
          vacancy_id,
          application_reference,
          status,
          current_stage_key,
          source,
          submitted_at,
          created_at,
          updated_at,
          candidate:leo_talent_candidates (
            id,
            candidate_reference,
            first_name,
            middle_names,
            last_name,
            preferred_name,
            full_name,
            email,
            telephone,
            phone,
            archived_at,
            created_at
          )
        `,
      )
      .eq("vacancy_id", vacancyId)
      .order("updated_at", { ascending: false });

    let applications: Application[] = [];

    if (applicationsResult.error) {
      console.warn(
        "Talent vacancy applications could not be loaded:",
        applicationsResult.error,
      );

      availability.applications = false;
      availability.candidates = false;
    } else {
      applications = (
        (applicationsResult.data ?? []) as Application[]
      ).map((application) => {
        const candidate = firstRelatedRecord(application.candidate);

        return {
          ...application,
          stage:
            application.current_stage_key ??
            application.stage ??
            null,
          candidate,
          candidate_name: candidate
            ? candidateDisplayName(candidate)
            : null,
          candidate_email: candidate?.email ?? null,
        };
      });
    }

    const candidateMap = new Map<string, Candidate>();

    for (const application of applications) {
      const candidate = firstRelatedRecord(application.candidate);

      if (candidate && !candidate.archived_at) {
        candidateMap.set(candidate.id, {
          ...candidate,
          current_stage:
            application.current_stage_key ??
            application.stage ??
            null,
          status: application.status ?? null,
        });
      }
    }

    const candidates = Array.from(candidateMap.values());

    async function loadOptionalTable<T>({
      tableName,
      filterColumn,
      availabilityKey,
      orderColumn = "created_at",
      ascending = false,
    }: {
      tableName: string;
      filterColumn: string;
      availabilityKey: keyof TableAvailability;
      orderColumn?: string;
      ascending?: boolean;
    }): Promise<T[]> {
      const result = await (supabase as any)
        .from(tableName)
        .select("*")
        .eq(filterColumn, vacancyId)
        .order(orderColumn, { ascending });

      if (result.error) {
        console.warn(
          `${tableName} could not be loaded:`,
          result.error,
        );

        availability[availabilityKey] = false;
        return [];
      }

      availability[availabilityKey] = true;
      return (result.data ?? []) as T[];
    }

    const [
      publicationChannels,
      vacancyQuestions,
      interviews,
      saferProfiles,
      offers,
      documents,
      activity,
    ] = await Promise.all([
      loadOptionalTable<Record<string, unknown>>({
        tableName: "leo_talent_vacancy_publication_channels",
        filterColumn: "vacancy_id",
        availabilityKey: "publicationChannels",
      }),

      loadOptionalTable<Record<string, unknown>>({
        tableName: "leo_talent_vacancy_questions",
        filterColumn: "vacancy_id",
        availabilityKey: "vacancyQuestions",
        orderColumn: "display_order",
        ascending: true,
      }),

      loadOptionalTable<Record<string, unknown>>({
        tableName: "leo_talent_interviews",
        filterColumn: "vacancy_id",
        availabilityKey: "interviews",
      }),

      loadOptionalTable<DueDiligenceRecord>({
        tableName: "leo_talent_safer_recruitment_profiles",
        filterColumn: "vacancy_id",
        availabilityKey: "dueDiligence",
        orderColumn: "updated_at",
      }),

      loadOptionalTable<Record<string, unknown>>({
        tableName: "leo_talent_offers",
        filterColumn: "vacancy_id",
        availabilityKey: "offers",
      }),

      loadOptionalTable<Record<string, unknown>>({
        tableName: "leo_talent_vacancy_documents",
        filterColumn: "vacancy_id",
        availabilityKey: "documents",
      }),

      loadOptionalTable<Record<string, unknown>>({
        tableName: "talent_analytics_events",
        filterColumn: "entity_id",
        availabilityKey: "activity",
      }),
    ]);

    const applicationMap = new Map(
      applications.map((application) => [
        application.id,
        application,
      ]),
    );

    const dueDiligence = saferProfiles.map((profile) => {
      const application = applicationMap.get(
        profile.application_id,
      );

      const applicationCandidate = application
        ? firstRelatedRecord(application.candidate)
        : null;

      const candidate =
        applicationCandidate ??
        candidateMap.get(profile.candidate_id) ??
        null;

      return {
        ...profile,
        candidate,
        application_reference:
          application?.application_reference ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      workspace: {
        vacancy,
        publicationChannels,
        vacancyQuestions,
        applications,
        candidates,
        interviews,
        dueDiligence,
        offers,
        documents,
        activity,
        availability,
        userContext,
      },
    });
  } catch (error) {
    console.error(
      "Talent vacancy workspace loader failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The vacancy workspace could not be loaded.",
      },
      { status: 500 },
    );
  }
}