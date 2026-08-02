import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase administrator credentials are not configured.",
    );
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionClient = await createClient();

    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const admin = getAdminClient();
    const resolvedRole = await resolveAuthoritativeUserRole(admin as any, {
      userId: user.id,
      allowedStatuses: ["active"],
    });

    if (!resolvedRole) {
      return NextResponse.json(
        { success: false, error: "No active organisation was found." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const documentResult = await admin
      .from("company_documents")
      .select("id, file_path, file_name")
      .eq("id", id)
      .eq(
        "organisation_id",
        resolvedRole.membership.organisation_id,
      )
      .maybeSingle();

    if (
      documentResult.error ||
      !documentResult.data?.file_path
    ) {
      return NextResponse.json(
        { success: false, error: "The document could not be found." },
        { status: 404 },
      );
    }

    const signedResult = await admin.storage
      .from("company-documents")
      .createSignedUrl(documentResult.data.file_path, 60);

    if (signedResult.error || !signedResult.data?.signedUrl) {
      throw new Error(
        signedResult.error?.message ||
          "A secure document link could not be created.",
      );
    }

    const requestUrl = new URL(request.url);
    const download = requestUrl.searchParams.get("download") === "1";

    if (!download) {
      return NextResponse.redirect(signedResult.data.signedUrl);
    }

    const fileResponse = await fetch(signedResult.data.signedUrl, {
      cache: "no-store",
    });

    if (!fileResponse.ok) {
      throw new Error("The document could not be downloaded.");
    }

    const headers = new Headers(fileResponse.headers);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${String(
        documentResult.data.file_name || "document",
      ).replaceAll('"', "")}"`,
    );
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(fileResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Company document open failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The document could not be opened.",
      },
      { status: 500 },
    );
  }
}