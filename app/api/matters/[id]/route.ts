import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateMatterBody = {
  status?: unknown;
};

const allowedStatuses = new Set([
  "Open",
  "In Progress",
  "Needs Attention",
  "Closed",
]);

function readMatterId(id: string): number | null {
  const matterId = Number(id);

  return Number.isInteger(matterId) && matterId > 0 ? matterId : null;
}

async function requirePermission(permissionKey: string) {
  const supabase = await createClient();

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

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your active organisation could not be resolved.",
        },
        { status: 403 },
      ),
    };
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: permissionKey,
      target_user_id: user.id,
    },
  );

  if (permissionError) {
    console.error("Matter permission could not be checked:", permissionError);

    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to use Matters could not be verified.",
        },
        { status: 500 },
      ),
    };
  }

  if (!allowed) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "You do not have permission to perform this action.",
        },
        { status: 403 },
      ),
    };
  }

  return { supabase };
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json(
      {
        success: false,
        error: "The matter reference is invalid.",
      },
      { status: 400 },
    );
  }

  let body: UpdateMatterBody;

  try {
    body = (await request.json()) as UpdateMatterBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "The matter update could not be read.",
      },
      { status: 400 },
    );
  }

  if (
    typeof body.status !== "string" ||
    !allowedStatuses.has(body.status)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "The selected matter status is invalid.",
      },
      { status: 400 },
    );
  }

  const permissionKey =
    body.status === "Closed" ? "matters.close" : "matters.update";

  const access = await requirePermission(permissionKey);

  if (access.response) {
    return access.response;
  }

  const { supabase } = access;

  const {
    data: existingMatter,
    error: existingMatterError,
  } = await supabase
    .from("matters")
    .select("id, status")
    .eq("id", matterId)
    .maybeSingle();

  if (existingMatterError) {
    console.error("Matter status could not be checked:", existingMatterError);

    return NextResponse.json(
      {
        success: false,
        error: existingMatterError.message || "The matter could not be checked.",
      },
      { status: 500 },
    );
  }

  if (!existingMatter) {
    return NextResponse.json(
      {
        success: false,
        error: "The matter could not be found or accessed.",
      },
      { status: 404 },
    );
  }

  const { data, error } = await supabase
    .from("matters")
    .update({
      status: body.status,
    })
    .eq("id", matterId)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("Matter status could not be updated:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "The matter status could not be updated.",
      },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        error: "The matter could not be found or accessed.",
      },
      { status: 404 },
    );
  }

  if (existingMatter.status !== body.status) {
    const { error: timelineError } = await supabase
      .from("matter_timeline")
      .insert({
        matter_id: matterId,
        event_type: "status_changed",
        title: "Matter status updated",
        description: `Status changed from ${existingMatter.status} to ${body.status}.`,
        created_by: "System",
      });

    if (timelineError) {
      // Keep status change successful even if chronology logging fails.
      console.error("Matter timeline event could not be created:", timelineError);
    }
  }

  return NextResponse.json({
    success: true,
    matter: data,
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json(
      {
        success: false,
        error: "The matter reference is invalid.",
      },
      { status: 400 },
    );
  }

  const access = await requirePermission("matters.delete");

  if (access.response) {
    return access.response;
  }

  const { supabase } = access;

  const { data, error } = await supabase
    .from("matters")
    .delete()
    .eq("id", matterId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Matter could not be deleted:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "The matter could not be deleted.",
      },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        error: "The matter could not be found or accessed.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    deletedMatterId: data.id,
  });
}