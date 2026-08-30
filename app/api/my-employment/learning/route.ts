// Leo HR employee learning self-service API.
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DataRecord = Record<string, unknown>;

function asRecords(value: unknown): DataRecord[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is DataRecord =>
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item),
  );
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase administrator credentials are not configured.");
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function resolveEmployee() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "You must be signed in to view your learning.",
        },
        { status: 401 },
      ),
    };
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (
    organisationError ||
    typeof organisationId !== "string" ||
    !organisationId
  ) {
    return {
      ok: false as const,
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
    .select("membership_status,access_starts_at,access_ends_at")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .eq("membership_status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false as const,
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

  const starts = membership.access_starts_at
    ? new Date(membership.access_starts_at).getTime()
    : null;

  const ends = membership.access_ends_at
    ? new Date(membership.access_ends_at).getTime()
    : null;

  if (
    (starts !== null && Number.isFinite(starts) && starts > now) ||
    (ends !== null && Number.isFinite(ends) && ends <= now)
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          success: false,
          error: "Your organisation access is not currently active.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: link, error: linkError } = await supabase
    .from("employee_user_links")
    .select("employee_id")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .eq("link_status", "active")
    .maybeSingle();

  if (linkError) {
    throw new Error(linkError.message);
  }

  if (!link?.employee_id) {
    return {
      ok: true as const,
      employeeId: null,
      organisationId,
    };
  }

  const admin: any = getAdminClient();

  const employee = await admin
    .from("employees")
    .select("id")
    .eq("id", link.employee_id)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (employee.error) {
    throw new Error(employee.error.message);
  }

  return {
    ok: true as const,
    employeeId: employee.data?.id ?? null,
    organisationId,
  };
}

function uniqueIds(rows: DataRecord[], key: string) {
  return Array.from(
    new Set(
      rows
        .map((row) => row[key])
        .filter(
          (value): value is string | number =>
            typeof value === "string" || typeof value === "number",
        ),
    ),
  );
}

export async function GET() {
  try {
    const resolved = await resolveEmployee();

    if (!resolved.ok) {
      return resolved.response;
    }

    if (!resolved.employeeId) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        assignments: [],
        certificates: [],
      });
    }

    const admin: any = getAdminClient();

    /*
     * IMPORTANT:
     * The live learning_assignments table does NOT contain
     * development_pathway_id, assignment_type, assigned_at,
     * start_date or progress_percentage.
     *
     * Module assignments live in learning_assignments.
     * Development pathway assignments live in pathway_assignments.
     * We read each table using its real live columns, then map both
     * into the single response shape already expected by My Learning.
     */

    const [moduleAssignmentsResult, pathwayAssignmentsResult] =
      await Promise.all([
        admin
          .from("learning_assignments")
          .select(
            [
              "id",
              "employee_id",
              "learning_module_id",
              "assignment_source",
              "assigned_date",
              "due_date",
              "status",
              "progress_percent",
              "completed_at",
              "started_at",
              "manager_validation_required",
              "is_archived",
            ].join(","),
          )
          .eq("employee_id", resolved.employeeId)
          .eq("is_archived", false)
          .neq("status", "Removed")
          .order("due_date", { ascending: true, nullsFirst: false }),

        admin
          .from("pathway_assignments")
          .select(
            [
              "id",
              "employee_id",
              "pathway_id",
              "assignment_source",
              "assigned_date",
              "start_date",
              "target_completion_date",
              "actual_completion_date",
              "status",
              "progress_percent",
              "is_archived",
            ].join(","),
          )
          .eq("employee_id", resolved.employeeId)
          .eq("is_archived", false)
          .order("target_completion_date", {
            ascending: true,
            nullsFirst: false,
          }),
      ]);

    if (moduleAssignmentsResult.error) {
      throw new Error(moduleAssignmentsResult.error.message);
    }

    if (pathwayAssignmentsResult.error) {
      throw new Error(pathwayAssignmentsResult.error.message);
    }

    const moduleAssignments = asRecords(moduleAssignmentsResult.data);
    const pathwayAssignments = asRecords(pathwayAssignmentsResult.data);

    const moduleIds = uniqueIds(moduleAssignments, "learning_module_id");
    const pathwayIds = uniqueIds(pathwayAssignments, "pathway_id");

    const modulesById = new Map<string, DataRecord>();
    const pathwaysById = new Map<string, DataRecord>();

    if (moduleIds.length > 0) {
      const moduleResult = await admin
        .from("learning_modules")
        .select("id,title,description,estimated_duration_minutes")
        .in("id", moduleIds);

      if (moduleResult.error) {
        throw new Error(moduleResult.error.message);
      }

      for (const module of asRecords(moduleResult.data)) {
        if (module.id !== null && module.id !== undefined) {
          modulesById.set(String(module.id), module);
        }
      }
    }

    if (pathwayIds.length > 0) {
      const pathwayResult = await admin
        .from("development_pathways")
        .select("id,title,description")
        .in("id", pathwayIds);

      if (pathwayResult.error) {
        throw new Error(pathwayResult.error.message);
      }

      for (const pathway of asRecords(pathwayResult.data)) {
        if (pathway.id !== null && pathway.id !== undefined) {
          pathwaysById.set(String(pathway.id), pathway);
        }
      }
    }

    const moduleItems = moduleAssignments.map((assignment) => {
      const moduleId = assignment.learning_module_id;

      return {
        id: assignment.id,
        employee_id: assignment.employee_id,
        learning_module_id: moduleId ?? null,
        development_pathway_id: null,
        assignment_type:
          typeof assignment.assignment_source === "string"
            ? assignment.assignment_source
            : "Learning",
        assigned_at:
          typeof assignment.assigned_date === "string"
            ? assignment.assigned_date
            : null,
        start_date:
          typeof assignment.started_at === "string"
            ? assignment.started_at
            : null,
        due_date:
          typeof assignment.due_date === "string"
            ? assignment.due_date
            : null,
        status:
          typeof assignment.status === "string"
            ? assignment.status
            : "Not Started",
        progress_percentage:
          typeof assignment.progress_percent === "number"
            ? assignment.progress_percent
            : 0,
        completed_at:
          typeof assignment.completed_at === "string"
            ? assignment.completed_at
            : null,
        manager_validation_required:
          assignment.manager_validation_required === true,
        learning_modules:
          moduleId !== null && moduleId !== undefined
            ? modulesById.get(String(moduleId)) ?? null
            : null,
        development_pathways: null,
      };
    });

    const pathwayItems = pathwayAssignments.map((assignment) => {
      const pathwayId = assignment.pathway_id;
      const numericId =
        typeof assignment.id === "number"
          ? assignment.id
          : Number(assignment.id ?? 0);

      return {
        // Negative IDs avoid key collisions with learning_assignments IDs.
        id: numericId > 0 ? -numericId : numericId,
        employee_id: assignment.employee_id,
        learning_module_id: null,
        development_pathway_id: pathwayId ?? null,
        assignment_type:
          typeof assignment.assignment_source === "string"
            ? assignment.assignment_source
            : "Development",
        assigned_at:
          typeof assignment.assigned_date === "string"
            ? assignment.assigned_date
            : null,
        start_date:
          typeof assignment.start_date === "string"
            ? assignment.start_date
            : null,
        due_date:
          typeof assignment.target_completion_date === "string"
            ? assignment.target_completion_date
            : null,
        status:
          typeof assignment.status === "string"
            ? assignment.status
            : "Not Started",
        progress_percentage:
          typeof assignment.progress_percent === "number"
            ? assignment.progress_percent
            : 0,
        completed_at:
          typeof assignment.actual_completion_date === "string"
            ? assignment.actual_completion_date
            : null,
        manager_validation_required: false,
        learning_modules: null,
        development_pathways:
          pathwayId !== null && pathwayId !== undefined
            ? pathwaysById.get(String(pathwayId)) ?? null
            : null,
      };
    });

    const assignments = [...moduleItems, ...pathwayItems].sort((a, b) => {
      const aDue = a.due_date || "9999-12-31";
      const bDue = b.due_date || "9999-12-31";
      return aDue.localeCompare(bDue);
    });

    let certificates: DataRecord[] = [];

    const issued = await admin
      .from("learning_certificates_issued")
      .select("*")
      .eq("employee_id", resolved.employeeId)
      .order("created_at", { ascending: false });

    if (!issued.error) {
      certificates = asRecords(issued.data);
    }

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      assignments,
      certificates,
    });
  } catch (error) {
    console.error("Leo HR employee learning API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your learning information could not be loaded.",
      },
      { status: 500 },
    );
  }
}
