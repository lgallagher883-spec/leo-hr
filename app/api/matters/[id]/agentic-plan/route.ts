import { NextResponse } from "next/server";

import {
  planMatterAdministration,
  type MatterAdministrationEvidence,
} from "@/lib/agentic/matterWorkflow";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function readMatterId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { success: false, error: "Your session is unavailable. Please sign in again." },
      { status: 401 },
    );
  }

  const { data: organisationId, error: organisationError } =
    await supabase.rpc("leo_current_organisation_id");

  if (organisationError || !organisationId) {
    return NextResponse.json(
      { success: false, error: "Your active organisation could not be resolved." },
      { status: 403 },
    );
  }

  const { data: allowed, error: permissionError } = await (supabase as any).rpc(
    "leo_has_permission",
    {
      target_organisation_id: organisationId,
      target_permission_key: "matters.view",
      target_user_id: user.id,
    },
  );

  if (permissionError || !allowed) {
    return NextResponse.json(
      {
        success: false,
        error: permissionError
          ? "Your permission to use Matters could not be verified."
          : "You do not have permission to view this Matter administration plan.",
      },
      { status: permissionError ? 500 : 403 },
    );
  }

  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .select("id,title,subject,description,status,matter_type,matter_lead,employee_id,created_at")
    .eq("id", matterId)
    .maybeSingle();

  if (matterError) {
    console.error("Matter administration plan could not load the Matter:", matterError);
    return NextResponse.json(
      { success: false, error: "The Matter administration plan could not be prepared." },
      { status: 500 },
    );
  }

  if (!matter) {
    return NextResponse.json(
      { success: false, error: "The Matter could not be found or accessed." },
      { status: 404 },
    );
  }

  const [timelineResult, documentResult] = await Promise.all([
    supabase
      .from("matter_timeline")
      .select("title,event_type,event_date,created_at")
      .eq("matter_id", matterId)
      .order("event_date", { ascending: false }),
    supabase
      .from("matter_documents")
      .select("title,document_type,status,source,created_at,include_in_bundle")
      .eq("matter_id", matterId)
      .order("created_at", { ascending: false }),
  ]);

  if (timelineResult.error || documentResult.error) {
    console.error(
      "Matter administration evidence could not be loaded:",
      timelineResult.error || documentResult.error,
    );
    return NextResponse.json(
      { success: false, error: "The Matter administration evidence could not be loaded." },
      { status: 500 },
    );
  }

  const timeline = timelineResult.data ?? [];
  const documents = documentResult.data ?? [];
  const evidence: MatterAdministrationEvidence[] = [
    ...timeline.map((event) => ({
      source: "matter_timeline" as const,
      label: text(event.title) || text(event.event_type) || "Matter chronology event",
      recordedAt: event.event_date || event.created_at,
    })),
    ...documents.map((document) => ({
      source: "matter_document" as const,
      label: text(document.title) || text(document.document_type) || "Matter document",
      recordedAt: document.created_at,
    })),
  ];

  const processOpen = text(matter.status).toLowerCase() !== "closed";
  const proceduralInformationComplete = Boolean(
    text(matter.title) && text(matter.matter_type) && text(matter.matter_lead),
  );
  const approvedTemplateAvailable = documents.some(
    (document) =>
      ["leo_generated", "system_generated"].includes(text(document.source)) &&
      text(document.status).toLowerCase() !== "superseded",
  );

  const plan = planMatterAdministration({
    processOpen,
    newEvidenceAvailable: documents.length > 0,
    proceduralInformationComplete,
    approvedTemplateAvailable,
    // The current Matter schema has no dedicated prerequisite/task record. Leo
    // must not infer completion from chronology or documents alone.
    administrativePrerequisitesSatisfied: false,
    bundleRefreshRequired: processOpen && (timeline.length > 0 || documents.length > 0),
    findingOrCredibilityAssessmentRequested: false,
    sensitiveCorrespondenceRequested: false,
    processOutcomeRequested: false,
    dismissalExecutionRequested: false,
    evidence,
  });

  return NextResponse.json(
    {
      success: true,
      matter: {
        id: matter.id,
        status: matter.status,
        matterType: matter.matter_type,
      },
      plan,
      askLeoInvolved: false,
      limitations: [
        "The current Matter schema does not record dedicated procedural prerequisites, so Agentic Leo will not advance a step from documents or chronology alone.",
      ],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
