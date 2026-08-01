import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { downloadEnvelopeDocuments } from "@/lib/docusign/envelopes";
import { createClient } from "@/lib/supabase/server";

type Role = "owner" | "senior" | "manager" | "employee";

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

  const resolved = await resolveAuthoritativeUserRole(
    supabase as any,
    {
      userId: user.id,
      allowedStatuses: ["active"],
    },
  );

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

    const document = await downloadEnvelopeDocuments(
      authorised.admin,
      authorised.organisationId,
      envelopeId,
    );

    return new Response(new Uint8Array(document.data), {
      headers: {
        "Content-Type": document.contentType,
        "Content-Disposition": `attachment; filename="${
          document.fileName || `signed-${envelopeId}.pdf`
        }"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The signed document could not be downloaded.",
      },
      { status: 500 },
    );
  }
}