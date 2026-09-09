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
        { success: false, error: "You are not signed in." },
        { status: 401 },
      );
    }

    const { data: organisationId, error: organisationError } =
      await supabase.rpc("leo_current_organisation_id");

    if (
      organisationError ||
      typeof organisationId !== "string" ||
      !organisationId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("organisation_memberships")
      .select("id,role,membership_status,access_starts_at,access_ends_at")
      .eq("organisation_id", organisationId)
      .eq("user_id", user.id)
      .eq("membership_status", "active")
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have active access to this organisation.",
        },
        { status: 403 },
      );
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
      return NextResponse.json(
        {
          success: false,
          error: "Your organisation access is not currently active.",
        },
        { status: 403 },
      );
    }

    const resolvedRole = await resolveRoleForMembership(supabase as any, {
      membershipId: membership.id,
      fallbackRole: membership.role,
    });

    return NextResponse.json(
      {
        success: true,
        organisationId,
        role: normaliseRole(resolvedRole.roleKey),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Current access API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your organisation access could not be resolved.",
      },
      { status: 500 },
    );
  }
}

function normaliseRole(value: unknown): "Owner" | "Senior" | "Manager" | "Employee" {
  const role = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";

  return "Employee";
}
