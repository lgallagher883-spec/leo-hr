import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requirePlatformAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "You are not signed in." },
        { status: 401 },
      ),
    };
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("leo_is_platform_administrator");

  if (adminError || isAdmin !== true) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Platform administrator access is required." },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, user };
}

export async function GET() {
  const access = await requirePlatformAdmin();
  if (!access.ok) return access.response;

  const admin = createAdminClient();
  const checkedAt = new Date().toISOString();

  const [
    databaseCheck,
    platformValidation,
    securityAlerts,
    connectionFailures,
  ] = await Promise.all([
    admin
      .from("organisations")
      .select("id", { count: "exact", head: true }),
    admin
      .from("leo_platform_health")
      .select("*")
      .maybeSingle(),
    admin
      .from("leo_security_alerts")
      .select(
        "id,severity,status,title,last_detected_at,occurrence_count,organisation_id",
      )
      .not("status", "in", '("resolved","closed")')
      .order("last_detected_at", { ascending: false })
      .limit(20),
    admin
      .from("leo_connection_health_checks")
      .select(
        "id,organisation_id,health_status,check_type,error_code,error_summary,checked_at",
      )
      .in("health_status", ["Error", "Failed", "Degraded", "Unhealthy"])
      .order("checked_at", { ascending: false })
      .limit(20),
  ]);

  const databaseHealthy = !databaseCheck.error;
  const validation = platformValidation.data ?? null;
  const validationHealthy =
    !platformValidation.error &&
    (!validation ||
      (Number(validation.failed_checks ?? 0) === 0 &&
        Number(validation.critical_failures ?? 0) === 0));

  const openAlerts = securityAlerts.data ?? [];
  const criticalAlerts = openAlerts.filter((alert) =>
    ["critical", "high"].includes(
      String(alert.severity ?? "").toLowerCase(),
    ),
  );

  const connectionIssues = connectionFailures.data ?? [];

  const overallHealthy =
    databaseHealthy &&
    validationHealthy &&
    criticalAlerts.length === 0 &&
    connectionIssues.length === 0;

  return NextResponse.json({
    success: true,
    checkedAt,
    overallStatus: overallHealthy ? "Healthy" : "Attention",
    deployment: {
      environment: process.env.VERCEL_ENV || "unknown",
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      region: process.env.VERCEL_REGION || null,
    },
    checks: {
      database: {
        status: databaseHealthy ? "Healthy" : "Failed",
        error: databaseCheck.error?.message ?? null,
      },
      platformValidation: {
        status: validationHealthy ? "Healthy" : "Attention",
        latest: validation,
        error: platformValidation.error?.message ?? null,
      },
      securityAlerts: {
        status: criticalAlerts.length === 0 ? "Healthy" : "Attention",
        openCount: openAlerts.length,
        highOrCriticalCount: criticalAlerts.length,
        recent: openAlerts,
        error: securityAlerts.error?.message ?? null,
      },
      connectionHealth: {
        status: connectionIssues.length === 0 ? "Healthy" : "Attention",
        issueCount: connectionIssues.length,
        recent: connectionIssues,
        error: connectionFailures.error?.message ?? null,
      },
    },
  });
}
