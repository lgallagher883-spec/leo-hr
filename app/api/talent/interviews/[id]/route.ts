import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";
import { synchroniseTalentInterview } from "@/lib/connections/microsoft/talent-interview-sync";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PlatformRole = "owner" | "senior" | "manager" | "employee";

const allowedRoles = new Set<PlatformRole>([
  "owner",
  "senior",
  "manager",
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

  const resolvedRole = await resolveAuthoritativeUserRole(supabase, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  if (!resolvedRole) {
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
    organisationId: resolvedRole.membership.organisation_id,
    role: normaliseRole(resolvedRole.roleKey),
  };
}

function normalisePanelMembers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const member = item as Record<string, unknown>;
    const memberName = text(member.memberName);
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
      member_email: optionalText(member.memberEmail),
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

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
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
            "You do not have permission to update interviews.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const interviewId = text(id);

    if (!interviewId) {
      return NextResponse.json(
        {
          success: false,
          error: "The interview reference is invalid.",
        },
        { status: 400 },
      );
    }

    const existingResult = await (supabase as any)
      .from("leo_talent_interviews")
      .select(
        "id, organisation_id, application_id, candidate_id, vacancy_id, invitation_sent_at, candidate_confirmed_at, completed_at",
      )
      .eq("id", interviewId)
      .eq("organisation_id", access.organisationId)
      .maybeSingle();

    if (existingResult.error || !existingResult.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingResult.error?.message ||
            "The interview could not be found.",
        },
        { status: 404 },
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;
    const action = text(body.action);
    const now = new Date().toISOString();

    if (action === "archive" || action === "restore") {
      const archiveResult = await (supabase as any)
        .from("leo_talent_interviews")
        .update({
          archived_at:
            action === "archive" ? now : null,
          updated_at: now,
        })
        .eq("id", interviewId)
        .eq("organisation_id", access.organisationId);

      if (archiveResult.error) {
        throw new Error(archiveResult.error.message);
      }

      return NextResponse.json({
        success: true,
      });
    }

    if (action === "status") {
      const status = text(body.status);

      if (!interviewStatuses.has(status)) {
        return NextResponse.json(
          {
            success: false,
            error: "The interview status is invalid.",
          },
          { status: 400 },
        );
      }

      const payload: Record<string, unknown> = {
        status,
        updated_at: now,
      };

      if (status === "invited") {
        payload.invitation_sent_at =
          existingResult.data.invitation_sent_at ?? now;
      }

      if (status === "confirmed") {
        payload.invitation_sent_at =
          existingResult.data.invitation_sent_at ?? now;
        payload.candidate_confirmed_at =
          existingResult.data.candidate_confirmed_at ??
          now;
      }

      if (status === "completed") {
        payload.completed_at =
          existingResult.data.completed_at ?? now;
      }

      const statusResult = await (supabase as any)
        .from("leo_talent_interviews")
        .update(payload)
        .eq("id", interviewId)
        .eq("organisation_id", access.organisationId);

      if (statusResult.error) {
        throw new Error(statusResult.error.message);
      }

      const calendarResult = await synchroniseTalentInterview(
        interviewId,
        access.organisationId,
      );

      return NextResponse.json({
        success: true,
        calendarSyncStatus: calendarResult.status,
        calendarWarning: calendarResult.warning,
      });
    }

    const applicationId = text(body.applicationId);
    const stageNumber = Number(body.stageNumber);
    const stageName = text(body.stageName);
    const interviewType = text(body.interviewType);
    const status = text(body.status);
    const outcome = optionalText(body.outcome);

    if (
      applicationId !== existingResult.data.application_id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The interview application cannot be changed.",
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

    const panelMembers = normalisePanelMembers(
      body.panelMembers,
    );

    const payload: Record<string, unknown> = {
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
      overall_score: optionalNumber(body.overallScore),
      outcome,
      outcome_reason: outcome
        ? optionalText(body.outcomeReason)
        : null,
      invitation_sent_at: ["invited", "confirmed"].includes(
        status,
      )
        ? existingResult.data.invitation_sent_at ?? now
        : existingResult.data.invitation_sent_at ?? null,
      candidate_confirmed_at:
        status === "confirmed"
          ? existingResult.data.candidate_confirmed_at ??
            now
          : ["draft", "scheduled", "reschedule_requested"].includes(
                status,
              )
            ? null
            : existingResult.data.candidate_confirmed_at ??
              null,
      completed_at:
        status === "completed"
          ? existingResult.data.completed_at ?? now
          : null,
      updated_at: now,
    };

    const updateResult = await (supabase as any)
      .from("leo_talent_interviews")
      .update(payload)
      .eq("id", interviewId)
      .eq("organisation_id", access.organisationId);

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    const deletePanelResult = await (supabase as any)
      .from("leo_talent_interview_panel_members")
      .delete()
      .eq("interview_id", interviewId);

    if (deletePanelResult.error) {
      throw new Error(
        "The interview was updated, but Leo could not replace the interview panel.",
      );
    }

    if (panelMembers.length > 0) {
      const insertPanelResult = await (supabase as any)
        .from("leo_talent_interview_panel_members")
        .insert(
          panelMembers.map((member) => ({
            ...member,
            interview_id: interviewId,
          })),
        );

      if (insertPanelResult.error) {
        throw new Error(
          "The interview was updated, but Leo could not recreate the interview panel.",
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
        .eq("id", existingResult.data.application_id)
        .eq("organisation_id", access.organisationId);

      if (progressionResult.error) {
        console.warn(
          "Interview updated but application progression could not be updated:",
          progressionResult.error,
        );
      }
    }

    const calendarResult = await synchroniseTalentInterview(
      interviewId,
      access.organisationId,
    );

    return NextResponse.json({
      success: true,
      calendarSyncStatus: calendarResult.status,
      calendarWarning: calendarResult.warning,
    });
  } catch (error) {
    console.error("Interview update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not update the interview.",
      },
      { status: 500 },
    );
  }
}