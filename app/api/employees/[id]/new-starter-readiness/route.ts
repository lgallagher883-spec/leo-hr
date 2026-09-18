import { NextResponse } from "next/server";

import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { assessNewStarterReadiness } from "@/lib/onboarding/newStarterReadiness";
import { prepareNewStarterPlan } from "@/lib/onboarding/newStarterPlan";
import { runNewStarterAutomaticActions } from "@/lib/onboarding/newStarterAutoActions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AccessContext = {
  organisationId: string;
  role: string;
  permissionKeys: Set<string>;
};

function readEmployeeId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requireAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
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
        { success: false, error: "Your active organisation could not be resolved." },
        { status: 403 },
      ),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select("id,role,membership_status,access_starts_at,access_ends_at")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "You do not have active access to this organisation." },
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
    (accessStartsAt !== null && Number.isFinite(accessStartsAt) && accessStartsAt > now) ||
    (accessEndsAt !== null && Number.isFinite(accessEndsAt) && accessEndsAt <= now)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Your organisation access is not currently active." },
        { status: 403 },
      ),
    };
  }

  const resolvedRole = await resolveRoleForMembership(supabase as any, {
    membershipId: membership.id,
    fallbackRole: membership.role,
  });

  const role = resolvedRole.roleKey;
  if (role === "employee") {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Employee accounts cannot run organisation new starter readiness checks." },
        { status: 403 },
      ),
    };
  }

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
          { success: false, error: "Your employee permissions could not be verified." },
          { status: 403 },
        ),
      };
    }

    for (const permission of permissions ?? []) {
      if (permission && typeof permission.permission_key === "string") {
        permissionKeys.add(permission.permission_key);
      }
    }

    if (!permissionKeys.has("employees.view")) {
      return {
        ok: false,
        response: NextResponse.json(
          { success: false, error: "You do not have permission to view this employee readiness check." },
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

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const employeeId = readEmployeeId(id);

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "The employee reference is not valid." },
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
        { success: false, error: "You are not signed in." },
        { status: 401 },
      );
    }

    const access = await requireAccess(supabase, user.id);
    if (!access.ok) return access.response;

    const readiness = await assessNewStarterReadiness({
      supabase,
      organisationId: access.access.organisationId,
      employeeId,
    });
    const plan = prepareNewStarterPlan(readiness);

    return NextResponse.json(
      {
        success: true,
        readiness,
        plan,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("New starter readiness check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not complete the new starter readiness check.",
      },
      { status: 500 },
    );
  }
}


export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const employeeId = readEmployeeId(id);

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "The employee reference is not valid." },
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
        { success: false, error: "You are not signed in." },
        { status: 401 },
      );
    }

    const access = await requireAccess(supabase, user.id);
    if (!access.ok) return access.response;

    const canManageEmployees =
      access.access.role === "owner" ||
      access.access.permissionKeys.has("employees.manage");

    if (!canManageEmployees) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to run automatic new starter preparation.",
        },
        { status: 403 },
      );
    }

    const automaticActions = await runNewStarterAutomaticActions({
      organisationId: access.access.organisationId,
      employeeId,
      userId: user.id,
    });

    const readiness = await assessNewStarterReadiness({
      supabase,
      organisationId: access.access.organisationId,
      employeeId,
    });
    const plan = prepareNewStarterPlan(readiness);

    return NextResponse.json(
      {
        success: true,
        readiness,
        plan,
        automaticActions,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Automatic new starter preparation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Leo could not complete automatic new starter preparation.",
      },
      { status: 500 },
    );
  }
}
