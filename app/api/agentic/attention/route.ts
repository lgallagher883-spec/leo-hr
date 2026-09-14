import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase administrator credentials are not configured.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function issueStillNeedsHuman(admin: ReturnType<typeof getAdminClient>, employeeId: number, metadata: Record<string, unknown>) {
  const classification = text(metadata.classification);

  if (classification === "right_to_work") {
    const result = await admin
      .from("employee_right_to_work")
      .select("id,check_completed_date")
      .eq("employee_id", employeeId)
      .not("check_completed_date", "is", null)
      .limit(1);
    if (result.error) throw new Error(result.error.message);
    return (result.data ?? []).length === 0;
  }

  if (classification === "dbs") {
    const result = await admin
      .from("employee_dbs_checks")
      .select("id,dbs_required,certificate_issue_date")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (result.error) throw new Error(result.error.message);
    const latest = result.data?.[0];
    if (!latest) return true;
    if (text(latest.dbs_required).toLowerCase() === "no") return false;
    return !latest.certificate_issue_date;
  }

  if (classification === "driving") {
    const result = await admin
      .from("employee_driving_checks")
      .select("id,drives_for_work,dvla_check_completed")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (result.error) throw new Error(result.error.message);
    const latest = result.data?.[0];
    if (!latest) return true;
    if (text(latest.drives_for_work).toLowerCase() === "no") return false;
    return text(latest.dvla_check_completed).toLowerCase() !== "yes";
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: "You are not signed in." }, { status: 401 });
    }

    const { data: organisationId, error: organisationError } = await supabase.rpc("leo_current_organisation_id");
    if (organisationError || typeof organisationId !== "string" || !organisationId) {
      return NextResponse.json({ success: false, error: "Your active organisation could not be resolved." }, { status: 403 });
    }

    const employeeIdFilter = numberValue(request.nextUrl.searchParams.get("employeeId"));
    const admin = getAdminClient();

    let employeeQuery = admin
      .from("employees")
      .select("id,name,status,start_date")
      .eq("organisation_id", organisationId)
      .neq("status", "Archived");

    if (employeeIdFilter) employeeQuery = employeeQuery.eq("id", employeeIdFilter);

    const employeesResult = await employeeQuery;
    if (employeesResult.error) throw new Error(employeesResult.error.message);

    const employees = employeesResult.data ?? [];
    const employeeIds = employees.map((employee) => Number(employee.id)).filter((id) => Number.isInteger(id) && id > 0);
    if (employeeIds.length === 0) {
      return NextResponse.json({ success: true, items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const timelineResult = await admin
      .from("employee_timeline")
      .select("id,employee_id,event_type,title,description,status,source_module,source_record_id,metadata,event_date,created_at")
      .in("employee_id", employeeIds)
      .eq("source_module", "Agentic Leo")
      .eq("status", "Needs Review")
      .order("created_at", { ascending: false })
      .limit(100);

    if (timelineResult.error) throw new Error(timelineResult.error.message);

    const employeeById = new Map(employees.map((employee) => [Number(employee.id), employee]));
    const items = [];

    for (const event of timelineResult.data ?? []) {
      const employeeId = Number(event.employee_id);
      const employee = employeeById.get(employeeId);
      if (!employee) continue;
      const metadata = event.metadata && typeof event.metadata === "object"
        ? (event.metadata as Record<string, unknown>)
        : {};

      const stillNeedsHuman = await issueStillNeedsHuman(admin, employeeId, metadata);
      if (!stillNeedsHuman) continue;

      items.push({
        id: `timeline:${event.id}`,
        employeeId,
        employeeName: employee.name || "Employee",
        title: event.title || "Leo needs your help",
        detail: event.description || "Leo cannot safely complete this item without human input.",
        category: text(metadata.classification) || "agentic_exception",
        sourceRecordId: event.source_record_id || null,
        createdAt: event.created_at || event.event_date || null,
        destination: `/dashboard/employees/${employeeId}`,
      });
    }

    return NextResponse.json({ success: true, items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Agentic attention API failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Agentic attention could not be loaded.",
    }, { status: 500 });
  }
}