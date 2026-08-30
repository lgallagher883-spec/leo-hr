// Leo HR employee reviews self-service API.
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
        { success: false, error: "You must be signed in to view your reviews." },
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
      .select("membership_status")
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

    const { data: link, error: linkError } = await supabase
      .from("employee_user_links")
      .select("employee_id")
      .eq("organisation_id", organisationId)
      .eq("user_id", user.id)
      .eq("link_status", "active")
      .maybeSingle();

    if (linkError) throw new Error(linkError.message);

    if (!link?.employee_id) {
      return NextResponse.json({
        success: true,
        employeeLinked: false,
        reviews: [],
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
        reviews: [],
      });
    }

    const reviews = await admin
      .from("probation_reviews")
      .select(
        "id,probation_id,employee_id,review_type,review_week,scheduled_date,completed_date,status,manager_name,employee_comments,manager_comments,progress_summary,support_required,agreed_actions",
      )
      .eq("employee_id", employee.data.id)
      .eq("is_archived", false)
      .order("scheduled_date", { ascending: true });

    if (reviews.error) throw new Error(reviews.error.message);

    return NextResponse.json({
      success: true,
      employeeLinked: true,
      reviews: reviews.data ?? [],
    });
  } catch (error) {
    console.error("Leo HR employee reviews API failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your reviews could not be loaded.",
      },
      { status: 500 },
    );
  }
}
