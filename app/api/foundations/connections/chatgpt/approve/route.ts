import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service configuration is unavailable.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = adminClient();
    const userResult = await supabase.auth.getUser();

    if (userResult.error || !userResult.data.user) {
      return NextResponse.json({ success: false, error: "Please sign in to Leo before approving ChatGPT." }, { status: 401 });
    }

    const role = await resolveAuthoritativeUserRole(supabase, {
      userId: userResult.data.user.id,
      allowedStatuses: ["active", "accepted"],
    });

    if (!role || (role.role !== "Owner" && role.role !== "Senior")) {
      return NextResponse.json({ success: false, error: "Owner or Senior access is required to approve ChatGPT." }, { status: 403 });
    }

    const body = (await request.json()) as { clientId?: unknown; clientName?: unknown };
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
    const clientName = typeof body.clientName === "string" && body.clientName.trim() ? body.clientName.trim() : "ChatGPT";

    if (!clientId) {
      return NextResponse.json({ success: false, error: "The ChatGPT OAuth client ID is unavailable." }, { status: 400 });
    }

    const providerResult = await admin
      .from("connection_providers")
      .select("id")
      .eq("provider_key", "chatgpt")
      .eq("is_active", true)
      .or("is_archived.eq.false,is_archived.is.null")
      .single();

    if (providerResult.error || !providerResult.data) {
      return NextResponse.json({ success: false, error: "The ChatGPT provider is not configured." }, { status: 404 });
    }

    const connectionResult = await admin
      .from("organisation_connections")
      .select("id, connection_settings")
      .eq("organisation_id", role.membership.organisation_id)
      .eq("provider_id", providerResult.data.id)
      .eq("is_archived", false)
      .maybeSingle();

    if (connectionResult.error || !connectionResult.data) {
      return NextResponse.json(
        { success: false, error: "Create the ChatGPT organisation connection in Foundations → Connections before approving it." },
        { status: 409 },
      );
    }

    const existingSettings =
      connectionResult.data.connection_settings && typeof connectionResult.data.connection_settings === "object"
        ? connectionResult.data.connection_settings
        : {};

    const now = new Date().toISOString();
    const updateResult = await admin
      .from("organisation_connections")
      .update({
        status: "Connected",
        health_status: "Healthy",
        external_account_id: clientId,
        account_display_name: clientName,
        connected_by_user_id: userResult.data.user.id,
        approved_by_user_id: userResult.data.user.id,
        connected_at: now,
        approved_at: now,
        last_successful_use_at: now,
        connection_settings: {
          ...existingSettings,
          oauth_client_id: clientId,
          oauth_client_name: clientName,
          access_mode: "read_only",
          mcp_resource: "/api/mcp",
        },
        consent_record: {
          approved_at: now,
          approved_by_user_id: userResult.data.user.id,
          access_mode: "read_only",
          permitted_data: [
            "Company Profile",
            "Employment Framework",
            "Organisation Structure",
            "Company Knowledge",
          ],
          prohibited_actions: [
            "employee writes",
            "matter writes",
            "policy writes",
            "compliance writes",
            "billing changes",
            "permission changes",
            "platform administration",
          ],
        },
        updated_at: now,
      })
      .eq("id", connectionResult.data.id)
      .eq("organisation_id", role.membership.organisation_id)
      .select("id, status, health_status, account_display_name")
      .single();

    if (updateResult.error || !updateResult.data) {
      return NextResponse.json({ success: false, error: updateResult.error?.message || "The ChatGPT connection could not be approved." }, { status: 500 });
    }

    await admin.from("connection_activity_history").insert({
      organisation_id: role.membership.organisation_id,
      performed_by_user_id: userResult.data.user.id,
      provider_id: providerResult.data.id,
      connection_id: connectionResult.data.id,
      job_id: null,
      module_key: "Foundations",
      activity_type: "ChatGPT Connected",
      activity_summary: "ChatGPT read-only business assistant access approved.",
      activity_details: { oauth_client_id: clientId, access_mode: "read_only" },
    });

    return NextResponse.json({ success: true, connection: updateResult.data });
  } catch (error) {
    console.error("ChatGPT connection approval failed:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "The ChatGPT connection could not be approved." }, { status: 500 });
  }
}
