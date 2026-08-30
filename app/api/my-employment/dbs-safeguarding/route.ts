// Leo HR employee self-service API.
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase administrator credentials are not configured.");
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to view this information." },
        { status: 401 },
      );
    }

    const { data: organisationId, error: organisationError } =
      await supabase.rpc("leo_current_organisation_id");

    if (organisationError || typeof organisationId !== "string" || !organisationId) {
      return NextResponse.json(
        { success: false, error: "Your active organisation could not be resolved." },
        { status: 403 },
      );
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
      return NextResponse.json(
        { success: false, error: "You do not have active access to this organisation." },
        { status: 403 },
      );
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
      return NextResponse.json(
        { success: false, error: "Your organisation access is not currently active." },
        { status: 403 },
      );
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
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        dbs: null,
      });
    }

    const admin = getAdminClient();

    const employee = await admin
      .from("employees")
      .select("id")
      .eq("id", link.employee_id)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (employee.error) throw new Error(employee.error.message);

    if (!employee.data) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        dbs: null,
      });
    }

    const record = await admin
      .from("employee_dbs_checks")
      .select("*")
      .eq("employee_id", employee.data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (record.error) throw new Error(record.error.message);

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      dbs: record.data ?? null,
    });
  } catch (error) {
    console.error("Leo HR employee self-service API failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "This information could not be loaded.",
      },
      { status: 500 },
    );
  }
}
