import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createClient as createSessionClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await createSessionClient();

    const {
      data: { user },
      error: userError,
    } = await session.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    const { data: organisationId, error: organisationError } = await session.rpc(
      "leo_current_organisation_id"
    );

    if (organisationError || !organisationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 }
      );
    }

    const { data: allowed, error: permissionError } = await (session as any).rpc(
      "leo_has_permission",
      {
        target_organisation_id: organisationId,
        target_permission_key: "hr_resources.view",
        target_user_id: user.id,
      }
    );

    if (permissionError || !allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to access knowledge health.",
        },
        { status: permissionError ? 500 : 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "NEXT_PUBLIC_SUPABASE_URL is missing.",
        },
        { status: 500 }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "SUPABASE_SERVICE_ROLE_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { count, error } = await supabase
      .from("knowledge_chunks")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "LEO Knowledge storage connection is working.",
      knowledgeChunkCount: count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown knowledge connection error.",
      },
      { status: 500 }
    );
  }
}