import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase administrator credentials are not configured.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function contextFor(context: RouteContext, permission: "employees.view" | "employees.manage") {
  const { id } = await context.params;
  const employeeId = Number(id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) return { response: NextResponse.json({success:false,error:"The employee reference is not valid."},{status:400}) };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({success:false,error:"You are not signed in."},{status:401}) };
  const { data: organisationId } = await supabase.rpc("leo_current_organisation_id");
  if (typeof organisationId !== "string" || !organisationId) return { response: NextResponse.json({success:false,error:"Your active organisation could not be resolved."},{status:403}) };
  const { data: membership } = await supabase.from("organisation_memberships")
    .select("id,role").eq("organisation_id",organisationId).eq("user_id",user.id).eq("membership_status","active").maybeSingle();
  if (!membership) return { response: NextResponse.json({success:false,error:"You do not have active access to this organisation."},{status:403}) };
  const resolved = await resolveRoleForMembership(supabase as any,{membershipId:membership.id,fallbackRole:membership.role});
  if (resolved.roleKey !== "owner") {
    const { data: permissions } = await supabase.rpc("leo_effective_permissions",{target_organisation_id:organisationId});
    const keys = new Set((permissions ?? []).map((p:any)=>p?.permission_key).filter(Boolean));
    if (!keys.has(permission)) return { response: NextResponse.json({success:false,error:"You do not have permission to perform this employee action."},{status:403}) };
  }
  const admin = adminClient();
  const { data: employee, error } = await admin.from("employees").select("id").eq("id",employeeId).eq("organisation_id",organisationId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!employee) return { response: NextResponse.json({success:false,error:"The employee record could not be found or accessed."},{status:404}) };
  return { employeeId, admin };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const resolved = await contextFor(context,"employees.view");
    if ("response" in resolved) return resolved.response;
    const { data, error } = await resolved.admin.from("employee_right_to_work")
      .select("*")
      .eq("employee_id",resolved.employeeId).order("created_at",{ascending:false});
    if (error) throw new Error(error.message);

    const records = Array.isArray(data) ? data : [];

    // Talent due-diligence is the source of truth for a candidate converted
    // to an employee. Surface the latest RTW record directly in the employee
    // profile as well, even when an older conversion did not copy it across.
    const { data: candidates, error: candidateError } = await resolved.admin
      .from("leo_talent_candidates")
      .select("id")
      .eq("existing_employee_id", resolved.employeeId)
      .limit(20);
    if (candidateError) throw new Error(candidateError.message);

    const candidateIds = (candidates ?? []).map((row:any) => row.id).filter(Boolean);
    let talentRecord: any = null;
    if (candidateIds.length > 0) {
      const { data: shared, error: sharedError } = await resolved.admin
        .from("leo_talent_candidate_shared_records")
        .select("id,payload,status,updated_at,completed_at")
        .in("candidate_id", candidateIds)
        .eq("component_key", "right_to_work")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (sharedError) throw new Error(sharedError.message);
      talentRecord = Array.isArray(shared) && shared.length > 0 ? shared[0] : null;
    }

    return NextResponse.json(
      {success:true,records,talentRecord},
      {headers:{"Cache-Control":"no-store"}}
    );
  } catch (error) {
    console.error("Employee right to work API failed:",error);
    return NextResponse.json({success:false,error:error instanceof Error?error.message:"Right to work records could not be loaded."},{status:500});
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const resolved = await contextFor(context,"employees.manage");
    if ("response" in resolved) return resolved.response;
    const body = await request.json();
    const { error } = await resolved.admin.from("employee_right_to_work").insert({
      employee_id: resolved.employeeId,
      nationality: body.nationality || "English",
      immigration_status: body.immigrationStatus || null,
      visa_or_permit_type: body.visaOrPermitType || null,
      share_code: body.shareCode || null,
      right_to_work_expiry: body.rightToWorkExpiry || null,
      restrictions: body.restrictions || null,
      check_completed_date: body.checkCompletedDate || null,
      next_review_date: body.nextReviewDate || null,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({success:true});
  } catch (error) {
    console.error("Employee right to work save failed:",error);
    return NextResponse.json({success:false,error:error instanceof Error?error.message:"Right to work record could not be saved."},{status:500});
  }
}
