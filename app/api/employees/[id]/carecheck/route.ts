import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { sendCareCheckCandidateInvite } from "@/lib/carecheck/candidate-invite";
import { pullCareCheckApplicationStatus } from "@/lib/carecheck/status-pull";
import { getOrganisationCareCheckConfig } from "@/lib/carecheck/connection";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };
type CheckKind = "dbs" | "rtw";
const writeRoles = new Set(["owner", "senior", "manager"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
function ref(value: string) {
  return value.replace(/[^A-Za-z0-9_]/g, "");
}
function dbsCode(level: string): "Y" | "XS" | "XE" {
  const v = level.toLowerCase();
  if (v.includes("basic")) return "Y";
  if (v.includes("standard")) return "XS";
  return "XE";
}
function names(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Employee",
    surname: parts.slice(1).join(" ") || "Employee",
  };
}
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase administrator credentials are not configured.");
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const employeeId = Number(id);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return NextResponse.json({ success: false, error: "The employee reference is not valid." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "You are not signed in." }, { status: 401 });

    const role = await resolveAuthoritativeUserRole(supabase as any, {
      userId: user.id,
      allowedStatuses: ["active"],
    });
    if (!role || !writeRoles.has(String(role.roleKey).toLowerCase())) {
      return NextResponse.json({ success: false, error: "You do not have permission to manage CareCheck checks." }, { status: 403 });
    }
    const organisationId = role.membership.organisation_id;
    const admin = adminClient();

    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id,name,email")
      .eq("id", employeeId)
      .eq("organisation_id", organisationId)
      .maybeSingle();
    if (employeeError) throw new Error(employeeError.message);
    if (!employee) return NextResponse.json({ success: false, error: "The employee could not be found." }, { status: 404 });

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const kind = clean(body.kind) as CheckKind;
    const action = clean(body.action);
    if (!["dbs", "rtw"].includes(kind) || !["invite", "refresh_status"].includes(action)) {
      return NextResponse.json({ success: false, error: "The requested CareCheck action is invalid." }, { status: 400 });
    }

    let config;
    try {
      config = await getOrganisationCareCheckConfig(admin, organisationId);
    } catch {
      return NextResponse.json({ success: false, error: "CareCheck is not connected for this organisation." }, { status: 409 });
    }
    if (config.environment === "production" && process.env.CARECHECK_PRODUCTION_ACTIONS_ENABLED !== "true") {
      return NextResponse.json({ success: false, error: "CareCheck production actions are not enabled for this deployment." }, { status: 409 });
    }

    const table = kind === "dbs" ? "employee_dbs_checks" : "employee_right_to_work";
    const { data: latestRows, error: latestError } = await admin
      .from(table)
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (latestError) throw new Error(latestError.message);
    const rows = Array.isArray(latestRows) ? latestRows : [];
    const latest = rows[0] ?? null;
    // Employer updates create new history rows. Provider refreshes must target
    // the most recent row that is actually linked to CareCheck, not simply
    // the newest employer-entered compliance row.
    const linked = rows.find((row) => row?.carecheck && typeof row.carecheck === "object" && clean(row.carecheck.applicationReference));
    const existing = linked?.carecheck && typeof linked.carecheck === "object" ? linked.carecheck : {};

    if (action === "refresh_status") {
      const applicationReference = clean(existing.applicationReference);
      if (!applicationReference) {
        return NextResponse.json({ success: false, error: "No CareCheck application is linked to this employee yet." }, { status: 400 });
      }
      const provider = await pullCareCheckApplicationStatus(applicationReference, config);
      const carecheck = {
        ...existing,
        applicationReference: provider.applicationReference || applicationReference,
        lastCheckedAt: new Date().toISOString(),
        statusCode: provider.statusCode,
        statusDescription: provider.statusDescription,
        isCurrentStatus: provider.isCurrentStatus,
        responseCode: provider.responseCode,
        responseMessage: provider.responseMessage,
        disclosureType: provider.disclosureType,
        resultType: provider.resultType,
        riskAssessment: provider.riskAssessment,
        dbsReference: provider.dbsReference,
        certificateNumber: provider.certificateNumber,
        certificateIssueDate: provider.certificateIssueDate,
        certificateReceivedDate: provider.certificateReceivedDate,
        certificateSeenDate: provider.certificateSeenDate,
        withdrawalReason: provider.withdrawalReason,
        withdrawalDate: provider.withdrawalDate,
        rtwCheckStatus: provider.rtwCheckStatus,
        rtwCheckDate: provider.rtwCheckDate,
      };
      if (!linked?.id) {
        return NextResponse.json({ success: false, error: "The linked CareCheck application record could not be found." }, { status: 409 });
      }
      const { error } = await admin.from(table).update({ carecheck, updated_at: new Date().toISOString() }).eq("id", linked.id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, carecheck });
    }

    if (clean(existing.applicationReference)) {
      return NextResponse.json({ success: false, error: "A CareCheck application is already linked to this employee. Refresh its status instead." }, { status: 409 });
    }
    if (!employee.email) {
      return NextResponse.json({ success: false, error: "Add an email address to the employee before sending a CareCheck invite." }, { status: 400 });
    }

    const person = names(employee.name || "Employee");
    const level = clean(body.dbsLevel) || clean(latest?.dbs_level) || "Basic";
    if (kind === "dbs" && level.toLowerCase().includes("barred")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This DBS selection includes a Barred List requirement. Leo has not yet verified the CareCheck API fields needed to submit that requirement safely. Record the requirement in Leo and initiate this check directly in CareCheck for now.",
        },
        { status: 409 },
      );
    }
    const stamp = Date.now().toString(36);
    const prefix = kind === "dbs" ? "EDBS" : "ERTW";
    const invite = await sendCareCheckCandidateInvite({
      externalReference: ref(`${prefix}${employeeId}${stamp}`),
      candidateReference: ref(`${prefix}EMP${employeeId}`),
      candidateEmailAddress: employee.email,
      candidateFirstName: person.firstName,
      candidateSurname: person.surname,
      checkType: kind === "dbs" ? dbsCode(level) : "D",
      type: kind === "dbs" ? "DI" : "RTW",
    }, config);

    if (!invite.success || !invite.applicationReference) {
      return NextResponse.json({ success: false, error: invite.resultMessage || "CareCheck did not accept the employee invite." }, { status: 502 });
    }

    const provider = await pullCareCheckApplicationStatus(invite.applicationReference, config);
    const now = new Date().toISOString();
    const carecheck = {
      provider: "CareCheck",
      environment: config.environment,
      applicationReference: provider.applicationReference || invite.applicationReference,
      invitedAt: now,
      lastCheckedAt: now,
      statusCode: provider.statusCode,
      statusDescription: provider.statusDescription,
      isCurrentStatus: provider.isCurrentStatus,
      responseCode: provider.responseCode,
      responseMessage: provider.responseMessage,
      disclosureType: provider.disclosureType,
      resultType: provider.resultType,
      riskAssessment: provider.riskAssessment,
      dbsReference: provider.dbsReference,
      certificateNumber: provider.certificateNumber,
      certificateIssueDate: provider.certificateIssueDate,
      certificateReceivedDate: provider.certificateReceivedDate,
      certificateSeenDate: provider.certificateSeenDate,
      rtwCheckStatus: provider.rtwCheckStatus,
      rtwCheckDate: provider.rtwCheckDate,
      providerCheckType: kind === "dbs" ? dbsCode(level) : "D",
      providerInviteType: kind === "dbs" ? "DI" : "RTW",
    };

    // A new provider application is a new compliance event. Never attach it
    // to (or rewrite) an older employer-recorded DBS/RTW history row.
    if (kind === "dbs") {
      const { error } = await admin.from("employee_dbs_checks").insert({
        employee_id: employeeId,
        dbs_required: "Yes",
        dbs_level: level,
        carecheck,
        notes: "DBS application initiated through CareCheck.",
        updated_at: now,
      });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.from("employee_right_to_work").insert({
        employee_id: employeeId,
        nationality: clean(latest?.nationality) || "Not recorded",
        carecheck,
        notes: "Right to Work check initiated through CareCheck.",
        updated_at: now,
      });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ success: true, carecheck });
  } catch (error) {
    console.error("Employee CareCheck action failed.");
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "The CareCheck action could not be completed." }, { status: 500 });
  }
}
