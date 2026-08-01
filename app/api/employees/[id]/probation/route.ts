import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AccessContext = {
  organisationId: string;
  role: string;
  permissionKeys: Set<string>;
};

type ProbationBody = {
  action?: unknown;
  probationId?: unknown;
  reviewId?: unknown;
  startDate?: unknown;
  standardEndDate?: unknown;
  currentEndDate?: unknown;
  finalDecisionDeadline?: unknown;
  completedDate?: unknown;
  managerName?: unknown;
  attendees?: unknown;
  progressSummary?: unknown;
  employeeComments?: unknown;
  managerComments?: unknown;
  supportRequired?: unknown;
  agreedActions?: unknown;
  finalOutcome?: unknown;
  extensionReason?: unknown;
  extensionSupport?: unknown;
  extensionEndDate?: unknown;
  terminationReason?: unknown;
  supportSummary?: unknown;
  evidenceSummary?: unknown;
  employeeResponse?: unknown;
  noticeArrangements?: unknown;
  employeeName?: unknown;
};

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function readEmployeeId(
  context: RouteContext,
): Promise<number | null> {
  const { id } = await context.params;
  const employeeId = Number(id);

  return Number.isInteger(employeeId) && employeeId > 0
    ? employeeId
    : null;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed || null;
}

function readPositiveInteger(value: unknown): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requireAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requiredPermissions: string[],
): Promise<
  | { ok: true; access: AccessContext }
  | { ok: false; response: NextResponse }
> {
  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select(
      "id,role,membership_status,access_starts_at,access_ends_at",
    )
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have active access to this organisation.",
        },
        { status: 403 },
      ),
    };
  }

  const now = Date.now();
  const accessStartsAt = membership.access_starts_at
    ? new Date(membership.access_starts_at).getTime()
    : null;
  const accessEndsAt = membership.access_ends_at
    ? new Date(membership.access_ends_at).getTime()
    : null;

  if (
    (accessStartsAt !== null &&
      Number.isFinite(accessStartsAt) &&
      accessStartsAt > now) ||
    (accessEndsAt !== null &&
      Number.isFinite(accessEndsAt) &&
      accessEndsAt <= now)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Your organisation access is not currently active.",
        },
        { status: 403 },
      ),
    };
  }

  const resolvedRole = await resolveRoleForMembership(supabase as any, {
    membershipId: membership.id,
    fallbackRole: membership.role,
  });

  const role = resolvedRole.roleKey;
  const permissionKeys = new Set<string>();

  if (role !== "owner") {
    const { data: permissions, error: permissionsError } =
      await supabase.rpc("leo_effective_permissions", {
        target_organisation_id: organisationId,
      });

    if (permissionsError) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Your employee permissions could not be verified.",
          },
          { status: 403 },
        ),
      };
    }

    for (const permission of permissions ?? []) {
      if (
        permission &&
        typeof permission.permission_key === "string"
      ) {
        permissionKeys.add(permission.permission_key);
      }
    }

    const missingPermission = requiredPermissions.find(
      (permission) => !permissionKeys.has(permission),
    );

    if (missingPermission) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error:
              "You do not have permission to perform this employee action.",
          },
          { status: 403 },
        ),
      };
    }
  }

  return {
    ok: true,
    access: {
      organisationId,
      role,
      permissionKeys,
    },
  };
}

async function verifyEmployee(
  admin: ReturnType<typeof getAdminClient>,
  organisationId: string,
  employeeId: number,
) {
  const result = await admin
    .from("employees")
    .select("id,name,start_date")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const employeeId = await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee reference is not valid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.view"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const admin = getAdminClient();
    const employee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const probationResult = await admin
      .from("employee_probations")
      .select(
        "id,employee_id,status,probation_start_date,standard_end_date,current_end_date,final_decision_deadline,extension_reason,extension_start_date,extension_end_date,final_outcome,final_outcome_date",
      )
      .eq("employee_id", employeeId)
      .eq("is_archived", false)
      .maybeSingle();

    if (probationResult.error) {
      throw new Error(probationResult.error.message);
    }

    let reviews: unknown[] = [];

    if (probationResult.data) {
      const reviewsResult = await admin
        .from("probation_reviews")
        .select(
          "id,probation_id,employee_id,review_type,review_week,scheduled_date,completed_date,status,manager_name,attendees,employee_comments,manager_comments,progress_summary,support_required,agreed_actions",
        )
        .eq("probation_id", probationResult.data.id)
        .eq("is_archived", false)
        .order("scheduled_date", { ascending: true });

      if (reviewsResult.error) {
        throw new Error(reviewsResult.error.message);
      }

      reviews = reviewsResult.data ?? [];
    }

    return NextResponse.json(
      {
        success: true,
        employee,
        probation: probationResult.data ?? null,
        reviews,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Probation API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The probation workspace could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const employeeId = await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee reference is not valid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.manage"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as ProbationBody;
    const action = readOptionalString(body.action);

    if (action !== "start") {
      return NextResponse.json(
        {
          success: false,
          error: "The requested probation action is not supported.",
        },
        { status: 400 },
      );
    }

    const startDate = readOptionalString(body.startDate);
    const standardEndDate = readOptionalString(body.standardEndDate);
    const finalDecisionDeadline = readOptionalString(
      body.finalDecisionDeadline,
    );

    if (!startDate || !standardEndDate || !finalDecisionDeadline) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Probation start, standard end and final decision dates are required.",
        },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const employee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    const existing = await admin
      .from("employee_probations")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("is_archived", false)
      .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      return NextResponse.json(
        {
          success: false,
          error: "An active probation record already exists.",
        },
        { status: 409 },
      );
    }

    const probationResult = await admin
      .from("employee_probations")
      .insert({
        employee_id: employeeId,
        status: "Active",
        probation_start_date: startDate,
        standard_end_date: standardEndDate,
        current_end_date: standardEndDate,
        final_decision_deadline: finalDecisionDeadline,
      })
      .select(
        "id,employee_id,status,probation_start_date,standard_end_date,current_end_date,final_decision_deadline,extension_reason,extension_start_date,extension_end_date,final_outcome,final_outcome_date",
      )
      .single();

    if (probationResult.error || !probationResult.data) {
      throw new Error(
        probationResult.error?.message ||
          "The probation record could not be created.",
      );
    }

    const reviews = [
      {
        probation_id: probationResult.data.id,
        employee_id: employeeId,
        review_type: "Initial Check-in",
        review_week: 2,
        scheduled_date: addDays(startDate, 14),
        status: "Scheduled",
      },
      {
        probation_id: probationResult.data.id,
        employee_id: employeeId,
        review_type: "First Review",
        review_week: 4,
        scheduled_date: addDays(startDate, 28),
        status: "Scheduled",
      },
      {
        probation_id: probationResult.data.id,
        employee_id: employeeId,
        review_type: "Progress Review",
        review_week: 8,
        scheduled_date: addDays(startDate, 56),
        status: "Scheduled",
      },
      {
        probation_id: probationResult.data.id,
        employee_id: employeeId,
        review_type: "Final Review",
        review_week: 12,
        scheduled_date: addDays(startDate, 84),
        status: "Scheduled",
      },
    ];

    const reviewsResult = await admin
      .from("probation_reviews")
      .insert(reviews)
      .select(
        "id,probation_id,employee_id,review_type,review_week,scheduled_date,completed_date,status,manager_name,attendees,employee_comments,manager_comments,progress_summary,support_required,agreed_actions",
      );

    if (reviewsResult.error) {
      await admin
        .from("employee_probations")
        .delete()
        .eq("id", probationResult.data.id);

      throw new Error(
        "The probation record was not saved because the review schedule could not be created.",
      );
    }

    await writeProbationEvents({
      admin,
      request,
      user,
      organisationId: accessResult.access.organisationId,
      employee,
      title: "Probation started",
      description: `${employee.name}'s probation period was started.`,
      sourceRecordId: String(probationResult.data.id),
      metadata: {
        probation_start_date: startDate,
        standard_end_date: standardEndDate,
        final_decision_deadline: finalDecisionDeadline,
      },
    });

    return NextResponse.json(
      {
        success: true,
        probation: probationResult.data,
        reviews: reviewsResult.data ?? [],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Probation creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The probation record could not be created.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const employeeId = await readEmployeeId(context);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee reference is not valid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not signed in.",
        },
        { status: 401 },
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.manage"],
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const body = (await request.json().catch(() => ({}))) as ProbationBody;
    const action = readOptionalString(body.action);

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: "A probation action is required.",
        },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const employee = await verifyEmployee(
      admin,
      accessResult.access.organisationId,
      employeeId,
    );

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The employee record could not be found or accessed.",
        },
        { status: 404 },
      );
    }

    if (action === "save_review") {
      const reviewId = readPositiveInteger(body.reviewId);
      const completedDate = readOptionalString(body.completedDate);
      const managerName = readOptionalString(body.managerName);
      const progressSummary = readOptionalString(body.progressSummary);

      if (!reviewId || !completedDate || !managerName || !progressSummary) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Review reference, actual review date, manager and summary are required.",
          },
          { status: 400 },
        );
      }

      const reviewResult = await admin
        .from("probation_reviews")
        .update({
          completed_date: completedDate,
          status: "Completed",
          manager_name: managerName,
          attendees: readOptionalString(body.attendees),
          progress_summary: progressSummary,
          employee_comments: readOptionalString(body.employeeComments),
          manager_comments: readOptionalString(body.managerComments),
          support_required: readOptionalString(body.supportRequired),
          agreed_actions: readOptionalString(body.agreedActions),
        })
        .eq("id", reviewId)
        .eq("employee_id", employeeId)
        .select(
          "id,probation_id,employee_id,review_type,review_week,scheduled_date,completed_date,status,manager_name,attendees,employee_comments,manager_comments,progress_summary,support_required,agreed_actions",
        )
        .single();

      if (reviewResult.error || !reviewResult.data) {
        throw new Error(
          reviewResult.error?.message ||
            "The probation review could not be saved.",
        );
      }

      await writeProbationEvents({
        admin,
        request,
        user,
        organisationId: accessResult.access.organisationId,
        employee,
        title: "Probation review completed",
        description: `${reviewResult.data.review_type} was completed for ${employee.name}.`,
        sourceRecordId: String(reviewResult.data.id),
        metadata: {
          probation_id: reviewResult.data.probation_id,
          review_type: reviewResult.data.review_type,
          completed_date: reviewResult.data.completed_date,
        },
      });

      return NextResponse.json({
        success: true,
        review: reviewResult.data,
      });
    }

    if (action === "final_outcome") {
      const probationId = readPositiveInteger(body.probationId);
      const reviewId = readPositiveInteger(body.reviewId);
      const completedDate = readOptionalString(body.completedDate);
      const managerName = readOptionalString(body.managerName);
      const progressSummary = readOptionalString(body.progressSummary);
      const finalOutcome = readOptionalString(body.finalOutcome);

      if (
        !probationId ||
        !reviewId ||
        !completedDate ||
        !managerName ||
        !progressSummary ||
        !finalOutcome
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Probation, review, date, manager, summary and final outcome are required.",
          },
          { status: 400 },
        );
      }

      const probationResult = await admin
        .from("employee_probations")
        .select("*")
        .eq("id", probationId)
        .eq("employee_id", employeeId)
        .eq("is_archived", false)
        .maybeSingle();

      if (probationResult.error) {
        throw new Error(probationResult.error.message);
      }

      if (!probationResult.data) {
        return NextResponse.json(
          {
            success: false,
            error: "The probation record could not be found or accessed.",
          },
          { status: 404 },
        );
      }

      if (finalOutcome === "Terminate Contract") {
        const documentsResult = await admin
          .from("probation_documents")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("probation_id", probationId)
          .eq("is_archived", false);

        if (documentsResult.error) {
          throw new Error(
            "Leo could not confirm whether the probation documents have been uploaded.",
          );
        }

        if (!documentsResult.count || documentsResult.count < 1) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Probation documents must be uploaded before Terminate Contract can be recorded.",
            },
            { status: 400 },
          );
        }
      }

      const reviewResult = await admin
        .from("probation_reviews")
        .update({
          completed_date: completedDate,
          status: "Completed",
          manager_name: managerName,
          attendees: readOptionalString(body.attendees),
          progress_summary: progressSummary,
          employee_comments: readOptionalString(body.employeeComments),
          manager_comments: readOptionalString(body.managerComments),
          support_required:
            finalOutcome === "Extend Probation"
              ? readOptionalString(body.extensionSupport)
              : null,
          agreed_actions:
            finalOutcome === "Extend Probation"
              ? "Probation extended for four weeks."
              : null,
        })
        .eq("id", reviewId)
        .eq("employee_id", employeeId)
        .select("*")
        .single();

      if (reviewResult.error || !reviewResult.data) {
        throw new Error(
          reviewResult.error?.message ||
            "The Final Review could not be saved.",
        );
      }

      let finalProbation = probationResult.data;

      if (finalOutcome === "Permanent Employment") {
        const update = await admin
          .from("employee_probations")
          .update({
            status: "Passed",
            final_outcome: "Pass Probation",
            final_outcome_date: completedDate,
            current_end_date: probationResult.data.standard_end_date,
          })
          .eq("id", probationId)
          .eq("employee_id", employeeId)
          .select("*")
          .single();

        if (update.error || !update.data) {
          throw new Error(
            update.error?.message ||
              "Permanent employment could not be confirmed.",
          );
        }

        finalProbation = update.data;
      }

      if (finalOutcome === "Extend Probation") {
        const extensionReason = readOptionalString(body.extensionReason);
        const extensionSupport = readOptionalString(body.extensionSupport);
        const extensionEndDate = readOptionalString(body.extensionEndDate);

        if (!extensionReason || !extensionSupport || !extensionEndDate) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Record why probation is being extended, the support provided and the extension end date.",
            },
            { status: 400 },
          );
        }

        const update = await admin
          .from("employee_probations")
          .update({
            status: "Extended",
            current_end_date: extensionEndDate,
            extension_start_date: probationResult.data.standard_end_date,
            extension_end_date: extensionEndDate,
            extension_reason: extensionReason,
            final_outcome: "Extend Probation",
            final_outcome_date: completedDate,
          })
          .eq("id", probationId)
          .eq("employee_id", employeeId)
          .select("*")
          .single();

        if (update.error || !update.data) {
          throw new Error(
            update.error?.message || "Probation could not be extended.",
          );
        }

        const extensionReview = await admin
          .from("probation_reviews")
          .insert({
            probation_id: probationId,
            employee_id: employeeId,
            review_type: "Extension Review",
            scheduled_date: extensionEndDate,
            status: "Scheduled",
            support_required: extensionSupport,
            agreed_actions: extensionReason,
          });

        if (extensionReview.error) {
          throw new Error(
            "Probation was extended, but the Extension Review could not be created.",
          );
        }

        finalProbation = update.data;
      }

      if (finalOutcome === "Terminate Contract") {
        const terminationReason = readOptionalString(body.terminationReason);
        const supportSummary = readOptionalString(body.supportSummary);
        const evidenceSummary = readOptionalString(body.evidenceSummary);
        const employeeResponse = readOptionalString(body.employeeResponse);
        const noticeArrangements = readOptionalString(
          body.noticeArrangements,
        );

        if (
          !terminationReason ||
          !supportSummary ||
          !evidenceSummary ||
          !employeeResponse ||
          !noticeArrangements
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Complete each brief termination summary before recording the decision.",
            },
            { status: 400 },
          );
        }

        const decisionResult = await admin
          .from("probation_decisions")
          .insert({
            probation_id: probationId,
            employee_id: employeeId,
            decision: "Terminate Contract",
            decision_date: completedDate,
            effective_date: completedDate,
            decision_maker: managerName,
            review_meeting_date: completedDate,
            attendees: readOptionalString(body.attendees),
            decision_reason: terminationReason,
            support_provided: supportSummary,
            evidence_considered: evidenceSummary,
            employee_response: employeeResponse,
            notice_arrangements: noticeArrangements,
            final_summary: `${employee.name}'s contract was terminated following the Final Review.`,
            approved_at: new Date().toISOString(),
          });

        if (decisionResult.error) {
          throw new Error(
            decisionResult.error.message ||
              "The termination decision record could not be saved.",
          );
        }

        const update = await admin
          .from("employee_probations")
          .update({
            status: "Contract Terminated",
            final_outcome: "Terminate Contract",
            final_outcome_date: completedDate,
          })
          .eq("id", probationId)
          .eq("employee_id", employeeId)
          .select("*")
          .single();

        if (update.error || !update.data) {
          throw new Error(
            update.error?.message ||
              "The decision was recorded, but the probation status could not be updated.",
          );
        }

        finalProbation = update.data;
      }

      await writeProbationEvents({
        admin,
        request,
        user,
        organisationId: accessResult.access.organisationId,
        employee,
        title: "Probation final outcome recorded",
        description: `${finalOutcome} was recorded for ${employee.name}.`,
        sourceRecordId: String(probationId),
        metadata: {
          final_outcome: finalOutcome,
          final_outcome_date: completedDate,
          review_id: reviewId,
        },
      });

      return NextResponse.json({
        success: true,
        probation: finalProbation,
        review: reviewResult.data,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "The requested probation action is not supported.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Probation update failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The probation action could not be completed.",
      },
      { status: 500 },
    );
  }
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("The probation start date is invalid.");
  }

  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

async function writeProbationEvents({
  admin,
  request,
  user,
  organisationId,
  employee,
  title,
  description,
  sourceRecordId,
  metadata,
}: {
  admin: ReturnType<typeof getAdminClient>;
  request: NextRequest;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  organisationId: string;
  employee: {
    id: number;
    name: string;
  };
  title: string;
  description: string;
  sourceRecordId: string;
  metadata: Record<string, unknown>;
}) {
  const now = new Date().toISOString();

  const userName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email || "System user";

  const auditResult = await admin.from("audit_logs").insert({
    organisation_id: organisationId,
    user_id: user.id,
    user_name: userName,
    user_email: user.email || null,
    action: title,
    action_category: "Employee",
    entity_type: "Employee",
    entity_id: String(employee.id),
    entity_name: employee.name,
    description,
    new_values: metadata,
    metadata: {
      source_module: "Probation",
      ...metadata,
    },
    source_page: `/dashboard/employees/${employee.id}`,
    ip_address:
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() || null,
    user_agent: request.headers.get("user-agent"),
    created_at: now,
  });

  if (auditResult.error) {
    console.warn(
      "Probation audit event could not be written:",
      auditResult.error,
    );
  }

  const timelineResult = await admin
    .from("employee_timeline")
    .insert({
      organisation_id: organisationId,
      employee_id: employee.id,
      event_type: "Probation",
      title,
      description,
      status: "Completed",
      source_module: "Probation",
      source_record_id: sourceRecordId,
      metadata,
      event_date: now,
      created_by: user.id,
      created_at: now,
    });

  if (timelineResult.error) {
    console.warn(
      "Probation timeline event could not be written:",
      timelineResult.error,
    );
  }
}