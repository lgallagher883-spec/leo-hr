import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import {
  encryptCareCheckCredentials,
} from "@/lib/carecheck/connection";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  connectionId?: unknown;
  environment?: unknown;
  organisationReference?: unknown;
  username?: unknown;
  password?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase administrator credentials are not configured.");
  }
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Your session is unavailable. Please sign in again." },
        { status: 401 },
      );
    }

    const resolved = await resolveAuthoritativeUserRole(supabase as any, {
      userId: user.id,
      allowedStatuses: ["active", "accepted"],
    });
    const role = text(resolved?.roleKey).toLowerCase();
    const organisationId = resolved?.membership.organisation_id ?? null;

    if (!organisationId || !["owner", "senior", "hr"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Senior or Owner access is required." },
        { status: 403 },
      );
    }

    const connectionId = Number(new URL(request.url).searchParams.get("connectionId"));
    if (!Number.isInteger(connectionId) || connectionId < 1) {
      return NextResponse.json(
        { success: false, error: "The CareCheck connection reference is invalid." },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const connection = await admin
      .from("organisation_connections")
      .select("id,provider_id,status,health_status,secret_reference,connection_settings")
      .eq("id", connectionId)
      .eq("organisation_id", organisationId)
      .eq("is_archived", false)
      .maybeSingle();

    if (connection.error || !connection.data) {
      return NextResponse.json(
        { success: false, error: "The CareCheck connection could not be found." },
        { status: 404 },
      );
    }

    const provider = await admin
      .from("connection_providers")
      .select("provider_key")
      .eq("id", connection.data.provider_id)
      .eq("provider_key", "carecheck")
      .maybeSingle();

    if (provider.error || !provider.data) {
      return NextResponse.json(
        { success: false, error: "This connection is not configured for CareCheck." },
        { status: 400 },
      );
    }

    const settings =
      connection.data.connection_settings &&
      typeof connection.data.connection_settings === "object"
        ? connection.data.connection_settings as Record<string, unknown>
        : {};

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.data.id,
        status: connection.data.status,
        healthStatus: connection.data.health_status,
        environment: text(settings.environment) || "production",
        organisationReference: text(settings.organisation_reference),
        credentialsConfigured: Boolean(connection.data.secret_reference),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "The CareCheck connection could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Your session is unavailable. Please sign in again." },
        { status: 401 },
      );
    }

    const resolved = await resolveAuthoritativeUserRole(supabase as any, {
      userId: user.id,
      allowedStatuses: ["active", "accepted"],
    });
    const role = text(resolved?.roleKey).toLowerCase();
    const organisationId = resolved?.membership.organisation_id ?? null;

    if (!organisationId || !["owner", "senior", "hr"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Senior or Owner access is required." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as Body;
    const connectionId = Number(body.connectionId);
    const environment = text(body.environment);
    const organisationReference = text(body.organisationReference);
    const username = text(body.username);
    const password = typeof body.password === "string" ? body.password : "";

    if (!Number.isInteger(connectionId) || connectionId < 1) {
      return NextResponse.json(
        { success: false, error: "The CareCheck connection reference is invalid." },
        { status: 400 },
      );
    }
    if (!["sandbox", "production"].includes(environment)) {
      return NextResponse.json(
        { success: false, error: "Choose a valid CareCheck environment." },
        { status: 400 },
      );
    }
    if (!organisationReference || !username || !password) {
      return NextResponse.json(
        { success: false, error: "CareCheck organisation reference, username and password are required." },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const lookup = await admin
      .from("organisation_connections")
      .select("id,provider_id,organisation_id")
      .eq("id", connectionId)
      .eq("organisation_id", organisationId)
      .eq("is_archived", false)
      .maybeSingle();

    if (lookup.error || !lookup.data) {
      return NextResponse.json(
        { success: false, error: "The CareCheck connection could not be found." },
        { status: 404 },
      );
    }

    const provider = await admin
      .from("connection_providers")
      .select("provider_key,name")
      .eq("id", lookup.data.provider_id)
      .eq("provider_key", "carecheck")
      .maybeSingle();

    if (provider.error || !provider.data) {
      return NextResponse.json(
        { success: false, error: "This connection is not configured for CareCheck." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const secretReference = encryptCareCheckCredentials({ username, password });
    const update = await admin
      .from("organisation_connections")
      .update({
        secret_reference: secretReference,
        connection_settings: {
          environment,
          organisation_reference: organisationReference,
        },
        status: "Connected",
        health_status: "Not Checked",
        connected_by_user_id: user.id,
        connected_at: now,
        disconnected_at: null,
        reconnect_required_at: null,
        last_error_code: null,
        last_error_message: null,
        last_error_at: null,
      })
      .eq("id", connectionId)
      .eq("organisation_id", organisationId)
      .select("id,organisation_id,provider_id,status,health_status,connection_settings,connected_at")
      .single();

    if (update.error || !update.data) {
      return NextResponse.json(
        { success: false, error: update.error?.message || "The CareCheck connection could not be saved." },
        { status: 500 },
      );
    }

    await admin.from("connection_activity_history").insert({
      organisation_id: organisationId,
      performed_by_user_id: user.id,
      provider_id: lookup.data.provider_id,
      connection_id: connectionId,
      module_key: "Foundations",
      activity_type: "Credentials Configured",
      activity_summary: "CareCheck account connected for this organisation.",
      activity_details: {
        environment,
        organisation_reference: organisationReference,
        credentials_stored: true,
      },
    });

    return NextResponse.json({
      success: true,
      connection: update.data,
      credentialsConfigured: true,
      message: "CareCheck account connected. The password is stored encrypted and will not be displayed again.",
    });
  } catch {
    console.error("CareCheck configuration failed.");
    return NextResponse.json(
      {
        success: false,
        error: "The CareCheck connection could not be configured.",
        code: "CARECHECK_CONFIGURATION_FAILED",
      },
      { status: 500 },
    );
  }
}
