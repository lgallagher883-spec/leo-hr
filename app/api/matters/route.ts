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

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Your session is unavailable. Please sign in again.",
      },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("matters")
    .select(matterSelect)
    .order("id", { ascending: false });

  if (error) {
    console.error("Matters could not be loaded:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    matters: data || [],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: "Your session is unavailable. Please sign in again.",
      },
      { status: 401 },
    );
  }

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

  if (body.employeeId !== null && body.employeeId !== undefined && !employeeId) {
    return NextResponse.json(
      {
        success: false,
        error: "The selected employee reference is invalid.",
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("matters")
    .insert({
      title,
      status: "Open",
      description: readOptionalString(body.description) || "",
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

  return NextResponse.json(
    {
      success: true,
      matter: data,
    },
    { status: 201 },
  );
}