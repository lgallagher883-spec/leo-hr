import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveRoleForMembership } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };
type AccessContext = { organisationId: string; role: string; permissionKeys: Set<string> };

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase administrator credentials are not configured.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function readEmployeeId(context: RouteContext) {
  const { id } = await context.params;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

async function requireAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requiredPermissions: string[],
): Promise<{ ok: true; access: AccessContext } | { ok: false; response: NextResponse }> {
  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (organisationError || typeof organisationId !== "string" || !organisationId) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Your active organisation could not be resolved." }, { status: 403 }) };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_memberships")
    .select("id,role,membership_status,access_starts_at,access_ends_at")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .maybeSingle();

  if (membershipError || !membership) {
    return { ok: false, response: NextResponse.json({ success: false, error: "You do not have active access to this organisation." }, { status: 403 }) };
  }

  const now = Date.now();
  const starts = membership.access_starts_at ? new Date(membership.access_starts_at).getTime() : null;
  const ends = membership.access_ends_at ? new Date(membership.access_ends_at).getTime() : null;
  if ((starts !== null && Number.isFinite(starts) && starts > now) || (ends !== null && Number.isFinite(ends) && ends <= now)) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Your organisation access is not currently active." }, { status: 403 }) };
  }

  const resolvedRole = await resolveRoleForMembership(supabase as any, {
    membershipId: membership.id,
    fallbackRole: membership.role,
  });
  const role = resolvedRole.roleKey;
  const permissionKeys = new Set<string>();

  if (role !== "owner") {
    const { data: permissions, error: permissionsError } =
      await supabase.rpc("leo_effective_permissions", { target_organisation_id: organisationId });
    if (permissionsError) {
      return { ok: false, response: NextResponse.json({ success: false, error: "Your employee permissions could not be verified." }, { status: 403 }) };
    }
    for (const permission of permissions ?? []) {
      if (permission && typeof permission.permission_key === "string") permissionKeys.add(permission.permission_key);
    }
    if (requiredPermissions.some((permission) => !permissionKeys.has(permission))) {
      return { ok: false, response: NextResponse.json({ success: false, error: "You do not have permission to perform this employee action." }, { status: 403 }) };
    }
  }

  return { ok: true, access: { organisationId, role, permissionKeys } };
}

async function verifyEmployee(admin: ReturnType<typeof getAdminClient>, organisationId: string, employeeId: number) {
  const result = await admin
    .from("employees")
    .select("id,name")
    .eq("id", employeeId)
    .eq("organisation_id", organisationId)
    .maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function getContext(context: RouteContext, permissions: string[]) {
  const employeeId = await readEmployeeId(context);
  if (!employeeId) return { response: NextResponse.json({ success: false, error: "The employee reference is not valid." }, { status: 400 }) };

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ success: false, error: "You are not signed in." }, { status: 401 }) };

  const access = await requireAccess(supabase, user.id, permissions);
  if (!access.ok) return { response: access.response };

  const admin = getAdminClient();
  const employee = await verifyEmployee(admin, access.access.organisationId, employeeId);
  if (!employee) return { response: NextResponse.json({ success: false, error: "The employee record could not be found or accessed." }, { status: 404 }) };

  return { employeeId, admin };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const resolved = await getContext(context, ["employees.view"]);
    if ("response" in resolved) return resolved.response;

    const result = await resolved.admin
      .from("employee_dbs_checks")
      .select("id,dbs_required,dbs_level,certificate_number,certificate_issue_date,next_check_due,update_service,update_service_id,safeguarding_training_completed,safeguarding_training_expiry,notes,created_at")
      .eq("employee_id", resolved.employeeId)
      .order("created_at", { ascending: false });

    if (result.error) throw new Error(result.error.message);
    return NextResponse.json({ success: true, records: result.data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Employee DBS API failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "DBS / safeguarding records could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const resolved = await getContext(context, ["employees.manage"]);
    if ("response" in resolved) return resolved.response;

    const body = await request.json();
    const record = {
      employee_id: resolved.employeeId,
      dbs_required: body.dbsRequired === "No" ? "No" : "Yes",
      dbs_level: body.dbsRequired === "No" ? null : body.dbsLevel || "Basic",
      certificate_number: body.certificateNumber || null,
      certificate_issue_date: body.certificateIssueDate || null,
      next_check_due: body.nextCheckDue || null,
      update_service: body.updateService || null,
      update_service_id: body.updateServiceId || null,
      safeguarding_training_completed: body.safeguardingTrainingCompleted || null,
      safeguarding_training_expiry: body.safeguardingTrainingExpiry || null,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };

    // Idempotency guard: agentic retries and double-clicks must not create
    // duplicate history rows when the latest DBS decision is identical.
    const latest = await resolved.admin
      .from("employee_dbs_checks")
      .select("id,dbs_required,dbs_level,certificate_number,certificate_issue_date,next_check_due,update_service,update_service_id,safeguarding_training_completed,safeguarding_training_expiry,notes")
      .eq("employee_id", resolved.employeeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest.error) throw new Error(latest.error.message);

    const fields = ["dbs_required","dbs_level","certificate_number","certificate_issue_date","next_check_due","update_service","update_service_id","safeguarding_training_completed","safeguarding_training_expiry","notes"] as const;
    const sameAsLatest = latest.data && fields.every((field) => (latest.data as any)[field] === (record as any)[field]);
    if (sameAsLatest) {
      return NextResponse.json({ success: true, duplicateSuppressed: true });
    }

    const result = await resolved.admin.from("employee_dbs_checks").insert(record);
    if (result.error) throw new Error(result.error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee DBS save failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "DBS / safeguarding record could not be saved." }, { status: 500 });
  }
}
