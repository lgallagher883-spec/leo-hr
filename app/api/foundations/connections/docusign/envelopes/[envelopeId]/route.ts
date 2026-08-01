import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import {
  refreshSignatureEnvelope,
  resendSignatureEnvelope,
  voidSignatureEnvelope,
} from "@/lib/docusign/envelopes";
import { createClient } from "@/lib/supabase/server";

type Role = "owner" | "senior" | "manager" | "employee";

const writeRoles = new Set<Role>(["owner", "senior", "manager"]);

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createAdmin(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function access() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const resolved = await resolveAuthoritativeUserRole(supabase as any, {
    userId: user.id,
    allowedStatuses: ["active"],
  });

  const organisationId =
    resolved?.membership.organisation_id?.toString() || "";

  const role = (
    resolved?.roleKey || "employee"
  ).toLowerCase() as Role;

  if (!organisationId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "No active organisation was found.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    organisationId,
    role,
    admin: adminClient(),
  };
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ envelopeId: string }>;
  },
) {
  try {
    const authorised = await access();

    if ("error" in authorised) {
      return authorised.error;
    }

    const { envelopeId } = await params;

    const envelope = await refreshSignatureEnvelope(
      authorised.admin,
      authorised.organisationId,
      envelopeId,
    );

    return NextResponse.json({
      success: true,
      envelope,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The signature status could not be refreshed.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ envelopeId: string }>;
  },
) {
  try {
    const authorised = await access();

    if ("error" in authorised) {
      return authorised.error;
    }

    if (!writeRoles.has(authorised.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to change this envelope.",
        },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { envelopeId } = await params;

    if (body.action === "resend") {
      const envelope = await resendSignatureEnvelope(
        authorised.admin,
        authorised.organisationId,
        envelopeId,
      );

      return NextResponse.json({
        success: true,
        envelope,
      });
    }

    if (body.action === "void") {
      const reason =
        typeof body.reason === "string" ? body.reason.trim() : "";

      if (!reason) {
        return NextResponse.json(
          {
            success: false,
            error: "Enter a reason for voiding the envelope.",
          },
          { status: 400 },
        );
      }

      const envelope = await voidSignatureEnvelope(
        authorised.admin,
        authorised.organisationId,
        envelopeId,
        reason,
      );

      return NextResponse.json({
        success: true,
        envelope,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unsupported envelope action.",
      },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The envelope could not be updated.",
      },
      { status: 500 },
    );
  }
}