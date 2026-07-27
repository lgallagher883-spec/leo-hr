import { NextResponse } from "next/server";

import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
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
          error: "You are not signed in.",
        },
        { status: 401 }
      );
    }

    const accessResult = await requireAccess(
      supabase,
      user.id,
      ["employees.view"]
    );

    if (!accessResult.ok) {
      return accessResult.response;
    }

    const { organisationId } =
      accessResult.access;

    const {
      data: employees,
      error: employeesError,
    } = await supabase
      .from("employees")
      .select(
        "id,name,role,email,start_date,status"
      )
      .eq("organisation_id", organisationId)
      .order("name", { ascending: true });

    if (employeesError) {
      console.error(
        "Employees query failed:",
        employeesError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            employeesError.message ||
            "Employees could not be loaded.",
        },
        { status: 500 }
      );
    }

    const employeeIds = (employees ?? []).map(
      (employee) => employee.id
    );

    let employmentDetails: Array<{
      id?: number;
      employee_id: number;
      manager: string | null;
      probation_end_date: string | null;
      employment_end_date: string | null;
      reason_for_leaving: string | null;
      annual_leave_allowance: string | null;
    }> = [];

    if (employeeIds.length > 0) {
      const { data, error } = await supabase
        .from("employee_employment_details")
        .select(
          "id,employee_id,manager,probation_end_date,employment_end_date,reason_for_leaving,annual_leave_allowance"
        )
        .in("employee_id", employeeIds);

      if (error) {
        console.warn(
          "Employee employment details could not be loaded:",
          error
        );
      } else {
        employmentDetails = data ?? [];
      }
    }

    const detailsByEmployeeId = new Map(
      employmentDetails.map((details) => [
        details.employee_id,
        details,
      ])
    );

    return NextResponse.json(
      {
        success: true,
        employees: (employees ?? []).map(
          (employee) => ({
            ...employee,
            employmentDetails:
              detailsByEmployeeId.get(
                employee.id
              ) ?? null,
          })
        ),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Employees API failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load employees.",
      },
      { status: 500 }
    );
  }
}

type AccessContext = {
  organisationId: string;
  role: string;
  permissionKeys: Set<string>;
};

async function requireAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requiredPermissions: string[]
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
          error:
            "Your active organisation could not be resolved.",
        },
        { status: 403 }
      ),
    };
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("organisation_memberships")
      .select(
        "id,role,membership_status,access_starts_at,access_ends_at"
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
          error:
            "You do not have active access to this organisation.",
        },
        { status: 403 }
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
          error:
            "Your organisation access is not currently active.",
        },
        { status: 403 }
      ),
    };
  }

  const resolvedRole = await resolveRoleForMembership(
    supabase as any,
    {
      membershipId: membership.id,
      fallbackRole: membership.role,
    }
  );
  const role = resolvedRole.roleKey;
  const permissionKeys = new Set<string>();

  if (role !== "owner") {
    const { data: permissions, error: permissionsError } =
      await supabase.rpc("leo_effective_permissions", {
        target_organisation_id: organisationId,
      });

    if (permissionsError) {
      console.error(
        "Employee permission lookup failed:",
        permissionsError
      );

      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error:
              "Your employee permissions could not be verified.",
          },
          { status: 403 }
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
      (permission) => !permissionKeys.has(permission)
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
          { status: 403 }
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