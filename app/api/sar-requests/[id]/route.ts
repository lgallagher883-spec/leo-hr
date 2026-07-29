import { NextResponse } from "next/server";

import {
  assertSarOwnership,
  insertSarTimelineEvent,
  optionalText,
  parseInteger,
  readText,
  requireSarAccess,
} from "../_access";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ChecklistField =
  | "identity_verified"
  | "collection_complete"
  | "review_complete"
  | "redaction_complete"
  | "disclosure_sent";

const checklistFields = new Set<ChecklistField>([
  "identity_verified",
  "collection_complete",
  "review_complete",
  "redaction_complete",
  "disclosure_sent",
]);

function checklistTitle(field: ChecklistField, checked: boolean) {
  const labels: Record<ChecklistField, string> = {
    identity_verified: "Identity verification",
    collection_complete: "Record collection",
    review_complete: "Record review",
    redaction_complete: "Redaction",
    disclosure_sent: "Disclosure",
  };

  return `${labels[field]} ${checked ? "completed" : "reopened"}`;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const access = await requireSarAccess("sar_requests.view");

    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    const sarId = parseInteger(id);

    if (!sarId) {
      return NextResponse.json(
        {
          success: false,
          error: "The SAR reference is not valid.",
        },
        { status: 400 },
      );
    }

    const { supabase, organisationId } = access.context;

    const ownership = await assertSarOwnership(
      supabase,
      organisationId,
      sarId,
    );

    if (!ownership.ok) {
      return ownership.response;
    }

    const body = await request.json().catch(() => ({}));
    const action = readText(body.action);

    if (action === "updateDetails") {
      const status = readText(body.status);
      const assignedTo = optionalText(body.assignedTo);
      const scopeNotes = optionalText(body.scopeNotes);
      const extensionApplied = body.extensionApplied === true;
      const extensionReason = optionalText(body.extensionReason);
      const extendedDueDate = optionalText(body.extendedDueDate);

      if (extensionApplied && !extendedDueDate) {
        return NextResponse.json(
          {
            success: false,
            error: "Enter the extended deadline.",
          },
          { status: 400 },
        );
      }

      if (extensionApplied && !extensionReason) {
        return NextResponse.json(
          {
            success: false,
            error: "Record the reason for the extension.",
          },
          { status: 400 },
        );
      }

      const { data: existingSar, error: existingError } = await supabase
        .from("employee_sars")
        .select("id,status,closed_at")
        .eq("id", sarId)
        .maybeSingle();

      if (existingError || !existingSar) {
        return NextResponse.json(
          {
            success: false,
            error: "The SAR request could not be found.",
          },
          { status: 404 },
        );
      }

      const updateValues = {
        status,
        assigned_to: assignedTo,
        scope_notes: scopeNotes,
        extension_applied: extensionApplied,
        extension_reason: extensionApplied ? extensionReason : null,
        extended_due_date: extensionApplied ? extendedDueDate : null,
        closed_at:
          status === "Closed" || status === "Completed"
            ? existingSar.closed_at || new Date().toISOString()
            : null,
      };

      const { data: sar, error } = await supabase
        .from("employee_sars")
        .update(updateValues)
        .eq("id", sarId)
        .select("*")
        .single();

      if (error || !sar) {
        throw new Error(error?.message || "The SAR details could not be saved.");
      }

      if (existingSar.status !== sar.status) {
        await insertSarTimelineEvent(supabase, {
          sarId,
          eventType: "status_changed",
          title: "SAR status updated",
          description: `Status changed from ${existingSar.status} to ${sar.status}.`,
          createdBy: assignedTo || "User",
        });
      }

      return NextResponse.json({ success: true, sar });
    }

    if (action === "toggleChecklist") {
      const field = readText(body.field) as ChecklistField;
      const checked = body.checked === true;

      if (!checklistFields.has(field)) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected progress field is invalid.",
          },
          { status: 400 },
        );
      }

      const additionalValues: Record<string, unknown> = {};

      if (field === "identity_verified") {
        additionalValues.identity_verified_at = checked
          ? new Date().toISOString()
          : null;
      }

      if (field === "disclosure_sent") {
        additionalValues.disclosure_sent_at = checked
          ? new Date().toISOString()
          : null;
      }

      const { data: sar, error } = await supabase
        .from("employee_sars")
        .update({
          [field]: checked,
          ...additionalValues,
        })
        .eq("id", sarId)
        .select("*")
        .single();

      if (error || !sar) {
        throw new Error(error?.message || "The progress item could not be updated.");
      }

      await insertSarTimelineEvent(supabase, {
        sarId,
        eventType: "progress_updated",
        title: checklistTitle(field, checked),
        description: checked
          ? "The progress item was marked complete."
          : "The progress item was reopened.",
      });

      return NextResponse.json({ success: true, sar });
    }

    return NextResponse.json(
      {
        success: false,
        error: "The requested SAR action is not supported.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("SAR update API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The SAR details could not be saved.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const access = await requireSarAccess("sar_requests.view");

    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    const sarId = parseInteger(id);

    if (!sarId) {
      return NextResponse.json(
        {
          success: false,
          error: "The SAR reference is not valid.",
        },
        { status: 400 },
      );
    }

    const { supabase, organisationId } = access.context;

    const ownership = await assertSarOwnership(
      supabase,
      organisationId,
      sarId,
    );

    if (!ownership.ok) {
      return ownership.response;
    }

    const { data: documents } = await supabase
      .from("employee_sar_documents")
      .select("file_path")
      .eq("sar_id", sarId);

    const { error: deleteSarError } = await supabase
      .from("employee_sars")
      .delete()
      .eq("id", sarId);

    if (deleteSarError) {
      throw new Error(deleteSarError.message || "The SAR could not be deleted.");
    }

    const filePaths = (documents || [])
      .map((document) => (typeof document.file_path === "string" ? document.file_path : ""))
      .filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage.from("hr-resources").remove(filePaths);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SAR deletion API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The SAR could not be deleted.",
      },
      { status: 500 },
    );
  }
}
