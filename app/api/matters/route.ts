import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const matterSelect =
  "id, title, status, description, employee_id, matter_type, subject, matter_lead, created_at";

type CreateMatterBody = {
  title?: unknown;
  description?: unknown;
  employeeId?: unknown;
  matterType?: unknown;
  subject?: unknown;
  matterLead?: unknown;
  hasSourceConversation?: unknown;
};

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readEmployeeId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

  return {
    supabase,
    organisationId,
    user,
  };
}

export async function GET() {
  const access = await requirePermission("matters.view");

  if (access.response) {
    return access.response;
  }

  const { supabase, organisationId } = access;

  const [mattersResult, employeesResult] = await Promise.all([
    supabase
      .from("matters")
      .select(matterSelect)
      .order("created_at", { ascending: false }),

    supabase
      .from("employees")
      .select("id, name")
      .eq("organisation_id", organisationId)
      .order("name", { ascending: true }),
  ]);

  if (mattersResult.error) {
    console.error("Matters could not be loaded:", mattersResult.error);

    return NextResponse.json(
      {
        success: false,
        error:
          mattersResult.error.message ||
          "LEO could not load the organisation's matters.",
      },
      { status: 500 },
    );
  }

  if (employeesResult.error) {
    console.error(
      "Employees for Matters could not be loaded:",
      employeesResult.error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          employeesResult.error.message ||
          "LEO could not load the employee list used by Matters.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    matters: mattersResult.data ?? [],
    employees: employeesResult.data ?? [],
  });
}

export async function POST(request: Request) {
  const access = await requirePermission("matters.create");

  if (access.response) {
    return access.response;
  }

  const { supabase, organisationId } = access;

  let body: CreateMatterBody;

  try {
    body = (await request.json()) as CreateMatterBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "The matter information could not be read.",
      },
      { status: 400 },
    );
  }

  const title = readOptionalString(body.title);

  if (!title) {
    return NextResponse.json(
      {
        success: false,
        error: "A matter title is required.",
      },
      { status: 400 },
    );
  }

  const employeeId = readEmployeeId(body.employeeId);

  if (
    body.employeeId !== null &&
    body.employeeId !== undefined &&
    body.employeeId !== "" &&
    !employeeId
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "The selected employee reference is invalid.",
      },
      { status: 400 },
    );
  }

  if (employeeId) {
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (employeeError) {
      console.error("Selected employee could not be checked:", employeeError);

      return NextResponse.json(
        {
          success: false,
          error: "The selected employee could not be verified.",
        },
        { status: 500 },
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected employee is not available to this organisation.",
        },
        { status: 400 },
      );
    }
  }

  const description = readOptionalString(body.description) || "";

  const { data, error } = await supabase
    .from("matters")
    .insert({
      title,
      status: "Open",
      description,
      employee_id: employeeId,
      matter_type: readOptionalString(body.matterType),
      subject: readOptionalString(body.subject) || title,
      matter_lead: readOptionalString(body.matterLead),
    })
    .select(matterSelect)
    .single();

  if (error || !data) {
    console.error("Matter could not be saved:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "The matter could not be saved.",
      },
      { status: 500 },
    );
  }

  // Route B: no Ask Leo conversation will be linked, so the employer's own
  // description becomes the Matter's first real conversation turn.
  if (!body.hasSourceConversation && description) {
    const { error: seedError } = await supabase.from("matter_messages").insert({
      matter_id: data.id,
      role: "user",
      content: description,
    });

    if (seedError) {
      console.error("Matter description could not be seeded as a conversation message:", seedError);
    }
  }

  return NextResponse.json(
    {
      success: true,
      matter: data,
    },
    { status: 201 },
  );
}