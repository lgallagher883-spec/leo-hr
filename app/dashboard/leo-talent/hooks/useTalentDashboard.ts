"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type TalentDashboardMetrics = {
  liveVacancies: number;
  applicationsReceived: number;
  activeCandidates: number;
  upcomingInterviews: number;
  offersAwaitingResponse: number;
  dueDiligenceOutstanding: number;
};

type OrganisationMembership = {
  organisation_id: string;
};

type CandidateApplicationRow = {
  candidate_id: string | null;
  status: string | null;
};

type DueDiligenceRow = {
  id: string;
  status: string | null;
  review_required: boolean | null;
};

const EMPTY_METRICS: TalentDashboardMetrics = {
  liveVacancies: 0,
  applicationsReceived: 0,
  activeCandidates: 0,
  upcomingInterviews: 0,
  offersAwaitingResponse: 0,
  dueDiligenceOutstanding: 0,
};

const ACTIVE_APPLICATION_STATUSES = [
  "submitted",
  "active",
  "on_hold",
];

const UPCOMING_INTERVIEW_STATUSES = [
  "scheduled",
  "invited",
  "confirmed",
  "reschedule_requested",
];

const AWAITING_OFFER_STATUSES = [
  "draft",
  "prepared",
  "approved",
  "issued",
  "sent",
  "awaiting_response",
];

const COMPLETED_DUE_DILIGENCE_STATUSES = [
  "complete",
  "completed",
  "cleared",
  "closed",
  "cancelled",
  "withdrawn",
];

function normaliseStatus(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "The Talent dashboard information could not be loaded.";
}

export default function useTalentDashboard() {
  const supabase = useMemo(() => createClient(), []);

  const [metrics, setMetrics] =
    useState<TalentDashboardMetrics>(EMPTY_METRICS);
  const [organisationId, setOrganisationId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] =
    useState<string | null>(null);

  const resolveOrganisationId =
    useCallback(async (): Promise<string> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error(
          "You must be signed in to view the Talent dashboard.",
        );
      }

      const membershipResult = await supabase
        .from("organisation_memberships")
        .select("organisation_id")
        .eq("user_id", user.id)
        .eq("membership_status", "active")
        .order("is_default_organisation", {
          ascending: false,
        })
        .order("created_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (membershipResult.error) {
        throw new Error(membershipResult.error.message);
      }

      const membership =
        membershipResult.data as OrganisationMembership | null;

      if (!membership?.organisation_id) {
        throw new Error(
          "Leo could not find an active organisation for your account.",
        );
      }

      return membership.organisation_id;
    }, [supabase]);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const resolvedOrganisationId =
          organisationId ?? (await resolveOrganisationId());

        if (!organisationId) {
          setOrganisationId(resolvedOrganisationId);
        }

        const now = new Date().toISOString();

        const [
          vacanciesResult,
          applicationsResult,
          candidateApplicationsResult,
          interviewsResult,
          offersResult,
          dueDiligenceResult,
        ] = await Promise.all([
          supabase
            .from("leo_talent_vacancies")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "organisation_id",
              resolvedOrganisationId,
            )
            .eq("status", "open"),

          supabase
            .from("leo_talent_applications")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "organisation_id",
              resolvedOrganisationId,
            ),

          supabase
            .from("leo_talent_applications")
            .select("candidate_id,status")
            .eq(
              "organisation_id",
              resolvedOrganisationId,
            )
            .in(
              "status",
              ACTIVE_APPLICATION_STATUSES,
            ),

          supabase
            .from("leo_talent_interviews")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "organisation_id",
              resolvedOrganisationId,
            )
            .in(
              "status",
              UPCOMING_INTERVIEW_STATUSES,
            )
            .gte("scheduled_start", now),

          supabase
            .from("leo_talent_offers")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "organisation_id",
              resolvedOrganisationId,
            )
            .in(
              "status",
              AWAITING_OFFER_STATUSES,
            ),

          supabase
            .from(
              "leo_talent_safer_recruitment_profiles",
            )
            .select("id,status,review_required")
            .eq(
              "organisation_id",
              resolvedOrganisationId,
            ),
        ]);

        const firstError =
          vacanciesResult.error ??
          applicationsResult.error ??
          candidateApplicationsResult.error ??
          interviewsResult.error ??
          offersResult.error ??
          dueDiligenceResult.error;

        if (firstError) {
          throw new Error(firstError.message);
        }

        const candidateApplicationRows =
          (candidateApplicationsResult.data ??
            []) as CandidateApplicationRow[];

        const activeCandidateIds = new Set(
          candidateApplicationRows
            .filter((application) =>
              ACTIVE_APPLICATION_STATUSES.includes(
                normaliseStatus(application.status),
              ),
            )
            .map((application) => application.candidate_id)
            .filter(
              (candidateId): candidateId is string =>
                Boolean(candidateId),
            ),
        );

        const dueDiligenceRows =
          (dueDiligenceResult.data ??
            []) as DueDiligenceRow[];

        const dueDiligenceOutstanding =
          dueDiligenceRows.filter((profile) => {
            const status = normaliseStatus(profile.status);

            return (
              profile.review_required === true ||
              !COMPLETED_DUE_DILIGENCE_STATUSES.includes(
                status,
              )
            );
          }).length;

        setMetrics({
          liveVacancies: vacanciesResult.count ?? 0,
          applicationsReceived:
            applicationsResult.count ?? 0,
          activeCandidates: activeCandidateIds.size,
          upcomingInterviews:
            interviewsResult.count ?? 0,
          offersAwaitingResponse:
            offersResult.count ?? 0,
          dueDiligenceOutstanding,
        });

        setLastUpdatedAt(new Date().toISOString());
      } catch (loadError) {
        console.error(
          "Talent dashboard could not be loaded:",
          loadError,
        );

        setMetrics(EMPTY_METRICS);
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      organisationId,
      resolveOrganisationId,
      supabase,
    ],
  );

  const refresh = useCallback(async () => {
    await loadDashboard(true);
  }, [loadDashboard]);

  useEffect(() => {
    void loadDashboard(false);
  }, [loadDashboard]);

  return {
    metrics,
    organisationId,
    loading,
    refreshing,
    error,
    lastUpdatedAt,
    refresh,
  };
}