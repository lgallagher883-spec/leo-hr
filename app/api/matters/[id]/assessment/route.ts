import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { runLeoCore } from "@/leo/core/router";
import { runLeoReasoning } from "@/leo/reasoning/reasoner";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type MatterRecord = {
  id: number;
  title: string | null;
  subject: string | null;
  description: string | null;
  status: string | null;
  matter_type: string | null;
  employee_id: number | null;
};

type EmployeeRecord = {
  id: number;
  name: string | null;
  role: string | null;
};

type MatterMessageRecord = {
  role: "user" | "leo";
  content: string;
};

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
    console.error("Matter assessment permission could not be checked:", permissionError);

    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Your permission to view this Matter could not be verified.",
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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = readMatterId(id);

  if (!matterId) {
    return NextResponse.json(
      { success: false, error: "The Matter reference is invalid." },
      { status: 400 },
    );
  }

  const access = await requirePermission("matters.view");
  if (access.response) return access.response;

  const { supabase } = access;

  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .select("id, title, subject, description, status, matter_type, employee_id")
    .eq("id", matterId)
    .maybeSingle<MatterRecord>();

  if (matterError) {
    console.error("Matter could not be loaded for assessment:", matterError);
    return NextResponse.json(
      { success: false, error: "The Matter could not be verified." },
      { status: 500 },
    );
  }

  if (!matter) {
    return NextResponse.json(
      { success: false, error: "The Matter could not be found or accessed." },
      { status: 404 },
    );
  }

  const { data: messages, error: messagesError } = await supabase
    .from("matter_messages")
    .select("role, content")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (messagesError) {
    console.error("Matter conversation could not be loaded for assessment:", messagesError);
    return NextResponse.json(
      { success: false, error: "The Matter conversation could not be loaded." },
      { status: 500 },
    );
  }

  const conversation = (messages ?? []) as MatterMessageRecord[];

  let employee: EmployeeRecord | null = null;

  if (matter.employee_id) {
    const { data: employeeData } = await supabase
      .from("employees")
      .select("id, name, role")
      .eq("id", matter.employee_id)
      .maybeSingle<EmployeeRecord>();

    employee = employeeData ?? null;
  }

  const matterIdentifiers = [matter.title, matter.subject]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join("\n");

  const employeeLine = employee?.name
    ? `Employee: ${employee.name}${employee.role ? `, ${employee.role}` : ""}`
    : "";

  const transcript = conversation
    .filter((message) => message.role === "user" && message.content?.trim())
    .map((message) => `Employer: ${message.content.trim()}`)
    .join("\n\n");

  // The description is only included separately when it hasn't already been
  // seeded into matter_messages, to avoid feeding the same facts in twice.
  const narrative = transcript || matter.description?.trim() || "";

  const analysisText = [matterIdentifiers, employeeLine, narrative]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  if (!analysisText) {
    return NextResponse.json({
      success: true,
      assessment: {
        understanding:
          "Leo does not yet have enough information recorded against this Matter to form an assessment.",
        risk: "unknown",
        nextStep:
          "Add the details of the situation to this Matter, or continue the conversation with Leo below.",
      },
    });
  }

  const coreResult = runLeoCore(analysisText);
  const reasoningResult = runLeoReasoning(coreResult, analysisText);

  const understanding =
    reasoningResult.professionalInsight ||
    reasoningResult.professionalReality ||
    `This appears to be a ${String(coreResult.intent).replace(/[_-]+/g, " ").toLowerCase()} matter.`;

  const nextStep =
    reasoningResult.decisionFramework.nextQuestion ||
    reasoningResult.decisionFramework.proportionateRecommendation ||
    reasoningResult.immediateNextStep;

  return NextResponse.json({
    success: true,
    assessment: {
      understanding,
      risk: coreResult.risk.overall,
      nextStep,
    },
  });
}
