import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type PlatformRole = "owner" | "senior" | "manager" | "employee";

type PanelMemberInput = {
  memberName?: unknown;
  memberEmail?: unknown;
  panelRole?: unknown;
  attendanceStatus?: unknown;
  canScore?: unknown;
  displayOrder?: unknown;
};

type InterviewInput = {
  applicationId?: unknown;
  templateId?: unknown;
  stageNumber?: unknown;
  stageName?: unknown;
  interviewType?: unknown;
  status?: unknown;
  scheduledStart?: unknown;
  scheduledEnd?: unknown;
  timezoneName?: unknown;
  location?: unknown;
  meetingUrl?: unknown;
  candidateInstructions?: unknown;
  internalInstructions?: unknown;
  overallScore?: unknown;
  outcome?: unknown;
  outcomeReason?: unknown;
  panelMembers?: unknown;
};

const allowedRoles = new Set<PlatformRole>([
  "owner",
  "senior",
  "manager",
]);

const interviewTypes = new Set([
  "telephone",
  "video",
  "in_person",
  "panel",
  "practical",
  "assessment",
  "presentation",
  "structured",
  "other",
]);

const interviewStatuses = new Set([
  "draft",
  "scheduled",
  "invited",
  "confirmed",
  "reschedule_requested",
  "cancelled",
  "completed",
  "no_show",
]);

const outcomes = new Set([
  "proceed",
  "hold",
  "additional_stage",
  "offer",
  "unsuccessful",
  "withdrawn",
]);

const panelRoles = new Set([
  "chair",
  "member",
  "observer",
  "note_taker",
  "hiring_manager",
]);

const attendanceStatuses = new Set([
  "invited",
  "accepted",
  "declined",
  "tentative",
  "attended",
  "absent",
]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const valueText = text(value);
  return valueText || null;
}

function optionalIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const valueText = text(value);
  const date = new Date(valueText);

  if (!valueText || Number.isNaN(date.getTime())) {
    throw new Error("The interview date and time are invalid.");
  }

  return date.toISOString();
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(
      "The overall score must be zero or a positive number.",
    );
  }

  return number;
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
    .order("is_default_organisation", {
      ascending: false,
    })
    .order("created_at", {
      ascending: true,
    })
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

  const organisationId =
    membershipResult.data?.organisation_id ?? null;
  const role = normaliseRole(membershipResult.data?.role);

  if (!organisationId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error:
            "Leo could not find an active organisation for your account.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    organisationId,
    role,
  };
}

function normalisePanelMembers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const member = item as PanelMemberInput;
    const memberName = text(member.memberName);
    const memberEmail = optionalText(member.memberEmail);
    const panelRole = text(member.panelRole);
    const attendanceStatus = text(
      member.attendanceStatus,
    );

    if (!memberName) {
      throw new Error(
        "Every panel member must have a name.",
      );
    }

    if (!panelRoles.has(panelRole)) {
      throw new Error(
        "One or more interview panel roles are invalid.",
      );
    }

    if (!attendanceStatuses.has(attendanceStatus)) {
      throw new Error(
        "One or more panel attendance statuses are invalid.",
      );
    }

    return {
      member_name: memberName,
      member_email: memberEmail,
      panel_role: panelRole,
      attendance_status: attendanceStatus,
      can_score: member.canScore !== false,
      display_order:
        Number.isInteger(Number(member.displayOrder))
          ? Number(member.displayOrder)
          : index,
    };
  });
}

function getApplicationStageForInterview(
  status: string,
  outcome: string | null,
  stageNumber: number,
) {
  if (outcome === "offer") return "offer";
  if (outcome === "unsuccessful") return "unsuccessful";
  if (outcome === "withdrawn") return "withdrawn";

  if (
    outcome === "additional_stage" ||
    outcome === "proceed"
  ) {
    return `interview_${stageNumber + 1}`;
  }

  if (
    [
      "scheduled",
      "invited",
      "confirmed",
      "reschedule_requested",
      "completed",
    ].includes(status)
  ) {
    return `interview_${stageNumber}`;
  }

  return null;
}

function getApplicationStatusForOutcome(
  outcome: string | null,
) {
  if (outcome === "offer") return "offered";
  if (outcome === "unsuccessful") return "unsuccessful";
  if (outcome === "withdrawn") return "withdrawn";

  if (
    ["proceed", "additional_stage", "hold"].includes(
      outcome ?? "",
    )
  ) {
    return "active";
  }

  return null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase);

    if ("error" in access) {
      return access.error;
    }

    const { organisationId } = access;

    const [
      interviewsResult,
      applicationsResult,
      templatesResult,
    ] = await Promise.all([
      (supabase as any)
        .from("leo_talent_interviews")
        .select(
          `
            id,
            organisation_id,
            interview_reference,
            application_id,
            vacancy_id,
            candidate_id,
            template_id,
            stage_number,
            stage_name,
            interview_type,
            status,
            scheduled_start,
            scheduled_end,
            timezone_name,
            location,
            meeting_url,
            candidate_instructions,
            internal_instructions,
            invitation_sent_at,
            candidate_confirmed_at,
            completed_at,
            overall_score,
            outcome,
            outcome_reason,
            ai_recommendation,
            ai_recommendation_reason,
            calendar_provider,
            calendar_event_id,
            calendar_sync_status,
            created_at,
            updated_at,
            archived_at,
            candidate:leo_talent_candidates (
              id,
              candidate_reference,
              first_name,
              last_name,
              preferred_name,
              email,
              phone
            ),
            vacancy:leo_talent_vacancies (
              id,
              vacancy_reference,
              title,
              department,
              location_name
            ),
            application:leo_talent_applications (
              id,
              application_reference,
              current_stage_key,
              status
            ),
            template:leo_talent_interview_templates (
              id,
              name,
              description,
              stage_name,
              interview_type,
              instructions,
              total_score_available,
              pass_score,
              is_default,
              is_active,
              archived_at
            ),
            panel_members:leo_talent_interview_panel_members (
              id,
              interview_id,
              user_id,
              employee_id,
              member_name,
              member_email,
              panel_role,
              attendance_status,
              can_score,
              display_order,
              created_at,
              updated_at
            ),
            scorecards:leo_talent_interview_scorecards (
              id,
              interview_id,
              reviewer_name,
              status,
              total_score,
              maximum_score,
              recommendation,
              strengths,
              concerns,
              overall_notes,
              submitted_at
            )
          `,
        )
        .eq("organisation_id", organisationId)
        .order("scheduled_start", {
          ascending: true,
          nullsFirst: false,
        }),

      (supabase as any)
        .from("leo_talent_applications")
        .select(
          `
            id,
            application_reference,
            candidate_id,
            vacancy_id,
            current_stage_key,
            status,
            archived_at,
            candidate:leo_talent_candidates (
              id,
              candidate_reference,
              first_name,
              last_name,
              preferred_name,
              email,
              phone
            ),
            vacancy:leo_talent_vacancies (
              id,
              vacancy_reference,
              title,
              department,
              location_name
            )
          `,
        )
        .eq("organisation_id", organisationId)
        .is("archived_at", null)
        .order("updated_at", {
          ascending: false,
        }),

      (supabase as any)
        .from("leo_talent_interview_templates")
        .select(
          `
            id,
            name,
            description,
            stage_name,
            interview_type,
            instructions,
            total_score_available,
            pass_score,
            is_default,
            is_active,
            archived_at
          `,
        )
        .eq("organisation_id", organisationId)
        .eq("is_active", true)
        .is("archived_at", null)
        .order("is_default", {
          ascending: false,
        })
        .order("name", {
          ascending: true,
        }),
    ]);

    if (interviewsResult.error) {
      throw new Error(interviewsResult.error.message);
    }

    if (applicationsResult.error) {
      throw new Error(applicationsResult.error.message);
    }

    if (templatesResult.error) {
      throw new Error(templatesResult.error.message);
    }

    return NextResponse.json({
      success: true,
      interviews: interviewsResult.data ?? [],
      applications: applicationsResult.data ?? [],
      templates: templatesResult.data ?? [],
    });
  } catch (error) {
    console.error(
      "Interview workspace loader failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not load the interview workspace.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase);

    if ("error" in access) {
      return access.error;
    }

    if (!allowedRoles.has(access.role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to schedule interviews.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as InterviewInput;
    const applicationId = text(body.applicationId);
    const stageNumber = Number(body.stageNumber);
    const stageName = text(body.stageName);
    const interviewType = text(body.interviewType);
    const status = text(body.status);
    const outcome = optionalText(body.outcome);

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select the application this interview belongs to.",
        },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(stageNumber) ||
      stageNumber < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The interview stage number must be a whole number of 1 or more.",
        },
        { status: 400 },
      );
    }

    if (!stageName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter a name for this interview stage.",
        },
        { status: 400 },
      );
    }

    if (!interviewTypes.has(interviewType)) {
      return NextResponse.json(
        {
          success: false,
          error: "The interview type is invalid.",
        },
        { status: 400 },
      );
    }

    if (!interviewStatuses.has(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "The interview status is invalid.",
        },
        { status: 400 },
      );
    }

    if (outcome && !outcomes.has(outcome)) {
      return NextResponse.json(
        {
          success: false,
          error: "The interview outcome is invalid.",
        },
        { status: 400 },
      );
    }

    const applicationResult = await (supabase as any)
      .from("leo_talent_applications")
      .select("id, organisation_id, candidate_id, vacancy_id")
      .eq("id", applicationId)
      .eq("organisation_id", access.organisationId)
      .maybeSingle();

    if (
      applicationResult.error ||
      !applicationResult.data
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            applicationResult.error?.message ||
            "The selected application could not be found.",
        },
        { status: 404 },
      );
    }

    const scheduledStart = optionalIsoDate(
      body.scheduledStart,
    );
    const scheduledEnd = optionalIsoDate(
      body.scheduledEnd,
    );

    if (
      scheduledStart &&
      scheduledEnd &&
      new Date(scheduledEnd).getTime() <=
        new Date(scheduledStart).getTime()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The interview end time must be later than the start time.",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const panelMembers = normalisePanelMembers(
      body.panelMembers,
    );

    const insertResult = await (supabase as any)
      .from("leo_talent_interviews")
      .insert({
        organisation_id: access.organisationId,
        application_id: applicationResult.data.id,
        candidate_id:
          applicationResult.data.candidate_id,
        vacancy_id: applicationResult.data.vacancy_id,
        template_id: optionalText(body.templateId),
        stage_number: stageNumber,
        stage_name: stageName,
        interview_type: interviewType,
        status,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        timezone_name:
          text(body.timezoneName) || "Europe/London",
        location: optionalText(body.location),
        meeting_url: optionalText(body.meetingUrl),
        candidate_instructions: optionalText(
          body.candidateInstructions,
        ),
        internal_instructions: optionalText(
          body.internalInstructions,
        ),
        invitation_sent_at: ["invited", "confirmed"].includes(
          status,
        )
          ? now
          : null,
        candidate_confirmed_at:
          status === "confirmed" ? now : null,
        completed_at:
          status === "completed" ? now : null,
        overall_score: optionalNumber(body.overallScore),
        outcome,
        outcome_reason: outcome
          ? optionalText(body.outcomeReason)
          : null,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (insertResult.error || !insertResult.data) {
      throw new Error(
        insertResult.error?.message ||
          "Leo could not create the interview.",
      );
    }

    const interviewId = insertResult.data.id as string;

    if (panelMembers.length > 0) {
      const panelResult = await (supabase as any)
        .from("leo_talent_interview_panel_members")
        .insert(
          panelMembers.map((member) => ({
            ...member,
            interview_id: interviewId,
          })),
        );

      if (panelResult.error) {
        await (supabase as any)
          .from("leo_talent_interviews")
          .delete()
          .eq("id", interviewId);

        throw new Error(
          panelResult.error.message ||
            "Leo could not save the interview panel.",
        );
      }
    }

    const applicationUpdate: Record<string, unknown> = {
      updated_at: now,
    };

    const nextStage = getApplicationStageForInterview(
      status,
      outcome,
      stageNumber,
    );
    const nextStatus =
      getApplicationStatusForOutcome(outcome);

    if (nextStage) {
      applicationUpdate.current_stage_key = nextStage;
    }

    if (nextStatus) {
      applicationUpdate.status = nextStatus;
    }

    if (Object.keys(applicationUpdate).length > 1) {
      const progressionResult = await (supabase as any)
        .from("leo_talent_applications")
        .update(applicationUpdate)
        .eq("id", applicationId)
        .eq("organisation_id", access.organisationId);

      if (progressionResult.error) {
        console.warn(
          "Interview created but application progression could not be updated:",
          progressionResult.error,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        interviewId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Interview creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not create the interview.",
      },
      { status: 500 },
    );
  }
}