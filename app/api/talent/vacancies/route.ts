import { NextResponse } from "next/server";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type PlatformRole = "owner" | "senior" | "manager" | "employee";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
    allowedStatuses: ["active", "accepted"],
  });

  const organisationId = resolvedRole?.membership.organisation_id ?? null;

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

  return {
    user,
    organisationId: String(organisationId),
    role: normaliseRole(resolvedRole?.roleKey),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const access = await getAuthorisedContext(supabase as any);

    if ("error" in access) {
      return access.error;
    }

    const result = await (supabase as any)
      .from("leo_talent_vacancies")
      .select("*")
      .eq("organisation_id", access.organisationId)
      .order("created_at", { ascending: false });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({
      success: true,
      vacancies: result.data ?? [],
    });
  } catch (error) {
    console.error("Vacancy register load failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Vacancy records could not be loaded.",
      },
      { status: 500 },
    );
  }
}