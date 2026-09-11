import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PlatformRole = "Owner" | "Senior" | "Manager" | "Employee";

const roleRank: Record<PlatformRole, number> = {
  Employee: 1,
  Manager: 2,
  Senior: 3,
  Owner: 4,
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseRole(value: unknown): PlatformRole {
  const role = text(value).toLowerCase();

  if (role === "owner") return "Owner";
  if (role === "senior" || role === "hr") return "Senior";
  if (role === "manager") return "Manager";

  return "Employee";
}

function parseConnectionId(value: string | null): number | null {
  if (!value) return null;

  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  return id;
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getAuthorisedContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  minimumRole: PlatformRole,
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your session is unavailable. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const resolvedRole = await resolveAuthoritativeUserRole(
    supabase as any,
    {
      userId: user.id,
      allowedStatuses: ["active", "accepted"],
    },
  );

  const organisationId =
    resolvedRole?.membership.organisation_id ?? null;

  const role = normaliseRole(resolvedRole?.roleKey);

  if (!organisationId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error:
            "Leo could not find an active organisation for your account.",
        },
        { status: 403 },
      ),
    };
  }

  if (roleRank[role] < roleRank[minimumRole]) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Senior or Owner access is required.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    organisationId,
    role,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const connectionId = parseConnectionId(
      url.searchParams.get("connectionId"),
    );

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: "The CareCheck connection reference is invalid.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const access = await getAuthorisedContext(
      supabase,
      "Senior",
    );

    if ("response" in access) {
      return access.response;
    }

    const admin = getAdminClient();

    const connectionResult = await (admin as any)
      .from("organisation_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("organisation_id", access.organisationId)
      .eq("is_archived", false)
      .maybeSingle();

    if (
      connectionResult.error ||
      !connectionResult.data
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            connectionResult.error?.message ||
            "The CareCheck connection could not be found.",
        },
        { status: 404 },
      );
    }

    const connection = connectionResult.data;

    const providerResult = await (admin as any)
      .from("connection_providers")
      .select("id,provider_key,name")
      .eq("id", connection.provider_id)
      .eq("is_active", true)
      .eq("is_archived", false)
      .maybeSingle();

    if (
      providerResult.error ||
      !providerResult.data
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "The CareCheck provider could not be found.",
        },
        { status: 404 },
      );
    }

    const providerKey = text(
      providerResult.data.provider_key,
    ).toLowerCase();

    if (providerKey !== "carecheck") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This connection is not configured for CareCheck.",
        },
        { status: 400 },
      );
    }

    const connectionSettings =
      connection.connection_settings &&
      typeof connection.connection_settings === "object"
        ? connection.connection_settings
        : {};

    const environment =
      text(connectionSettings.environment) ||
      text(process.env.CARECHECK_ENVIRONMENT) ||
      "sandbox";

    const organisationReference =
      text(connectionSettings.organisation_reference) ||
      text(process.env.CARECHECK_ORGANISATION_REFERENCE);

    const username = text(process.env.CARECHECK_USERNAME);
    const password = text(process.env.CARECHECK_PASSWORD);

    const wsdlUrl =
      text(process.env.CARECHECK_WSDL_URL) ||
      "https://www.matrixscreening.com/cheqsdemo41/ws/candidateInviteService/candidateInvite.wsdl";

    if (!organisationReference) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The CareCheck organisation reference is not configured.",
        },
        { status: 500 },
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The CareCheck server credentials are not configured.",
        },
        { status: 500 },
      );
    }

    const healthStartedAt = Date.now();

    let wsdlResponse: Response;

    try {
      wsdlResponse = await fetch(wsdlUrl, {
        method: "GET",
        headers: {
          Accept: "text/xml, application/xml",
        },
        cache: "no-store",
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "CareCheck could not be reached.",
        },
        { status: 502 },
      );
    }

    const responseText = await wsdlResponse.text();

    const appearsToBeWsdl =
      responseText.includes("<wsdl:definitions") ||
      responseText.includes("<definitions");

    if (!wsdlResponse.ok || !appearsToBeWsdl) {
      return NextResponse.json(
        {
          success: false,
          error:
            `CareCheck returned an unexpected WSDL response ` +
            `(HTTP ${wsdlResponse.status}).`,
        },
        { status: 502 },
      );
    }

    const latencyMs = Date.now() - healthStartedAt;

    return NextResponse.json({
      success: true,
      message:
        "CareCheck sandbox is reachable and the LEO connection configuration is available.",
      healthStatus: "Configuration Valid",
      connectionId,
      provider: "CareCheck",
      environment,
      organisationReference,
      endpointReachable: true,
      credentialsConfigured: true,
      wsdlReachable: true,
      latencyMs,
      authenticatedSoapVerified: false,
    });
  } catch (error) {
    console.error("CareCheck health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The CareCheck connection health check failed.",
      },
      { status: 500 },
    );
  }
}