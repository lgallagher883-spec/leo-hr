import { NextResponse } from "next/server";

import {
  calculateInitialDeadline,
  employeeBelongsToOrganisation,
  insertSarTimelineEvent,
  matterBelongsToOrganisation,
  optionalText,
  parseInteger,
  readText,
  requireSarAccess,
  safeFileName,
  validateSarUploadFile,
} from "./_access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await requireSarAccess("sar_requests.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access.context;

    const [sarResult, employeeResult] = await Promise.all([
      supabase
        .from("employee_sars")
        .select(
          `
            id,
            employee_id,
            matter_id,
            request_title,
            request_received_date,
            response_due_date,
            extended_due_date,
            status,
            assigned_to,
            identity_verified,
            collection_complete,
            review_complete,
            redaction_complete,
            disclosure_sent,
            created_at
          `,
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("employees")
        .select("id,name")
        .eq("organisation_id", organisationId)
        .order("name", {
          ascending: true,
        }),
    ]);

    if (sarResult.error) {
      console.error("Error loading SAR requests:", sarResult.error);

      return NextResponse.json(
        {
          success: false,
          error:
            sarResult.error.message ||
            "SAR requests could not be loaded.",
        },
        { status: 500 },
      );
    }

    if (employeeResult.error) {
      console.error("Error loading SAR employees:", employeeResult.error);

      return NextResponse.json(
        {
          success: false,
          error:
            employeeResult.error.message ||
            "Employee records could not be loaded.",
        },
        { status: 500 },
      );
    }

    const employeeIds = (employeeResult.data || []).map(({ id }) => id);

    const matterResult = employeeIds.length
      ? await supabase
          .from("matters")
          .select("id,title,subject,employee_id")
          .in("employee_id", employeeIds)
      : { data: [], error: null };

    if (matterResult.error) {
      console.error("Error loading SAR matters:", matterResult.error);

      return NextResponse.json(
        {
          success: false,
          error:
            matterResult.error.message ||
            "Matter records could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        sarRequests: sarResult.data || [],
        employees: employeeResult.data || [],
        matters: matterResult.data || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("SAR Requests API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "SAR requests could not be loaded.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const uploadedPaths: string[] = [];

  try {
    const access = await requireSarAccess("sar_requests.view");

    if (!access.ok) {
      return access.response;
    }

    const { supabase, organisationId } = access.context;

    const formData = await request.formData();

    const employeeId = parseInteger(formData.get("employeeId"));
    const matterIdRaw = parseInteger(formData.get("matterId"));
    const requestTitle = readText(formData.get("requestTitle"));
    const requestSummary = optionalText(formData.get("requestSummary"));
    const receivedDate = readText(formData.get("receivedDate"));
    const assignedTo = optionalText(formData.get("assignedTo"));
    const requestSource = optionalText(formData.get("requestSource"));
    const requestFile = formData.get("requestFile");

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Select the employee linked to this SAR.",
        },
        { status: 400 },
      );
    }

    if (!receivedDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter the date the SAR was received.",
        },
        { status: 400 },
      );
    }

    const responseDueDate = calculateInitialDeadline(receivedDate);

    if (!responseDueDate) {
      return NextResponse.json(
        {
          success: false,
          error: "The SAR received date is invalid.",
        },
        { status: 400 },
      );
    }

    const employeeAllowed = await employeeBelongsToOrganisation(
      supabase,
      organisationId,
      employeeId,
    );

    if (!employeeAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: "The selected employee is not available in your organisation.",
        },
        { status: 403 },
      );
    }

    const matterId = matterIdRaw ?? null;

    if (matterId !== null) {
      const matterAllowed = await matterBelongsToOrganisation(
        supabase,
        organisationId,
        matterId,
      );

      if (!matterAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected Matter is not available in your organisation.",
          },
          { status: 403 },
        );
      }
    }

    const { data: sarRecord, error: sarError } = await supabase
      .from("employee_sars")
      .insert({
        employee_id: employeeId,
        matter_id: matterId,
        request_title: requestTitle || "Subject Access Request",
        request_summary: requestSummary,
        request_received_date: receivedDate,
        response_due_date: responseDueDate,
        status: "Received",
        request_source: requestSource,
        assigned_to: assignedTo,
      })
      .select("id,employee_id,request_title")
      .single();

    if (sarError || !sarRecord) {
      throw new Error(sarError?.message || "SAR record was not created.");
    }

    if (requestFile instanceof File && requestFile.size > 0) {
      const fileError = validateSarUploadFile(requestFile);

      if (fileError) {
        return NextResponse.json(
          {
            success: false,
            error: fileError,
          },
          { status: 400 },
        );
      }

      const filePath =
        `sar-requests/${sarRecord.employee_id}/${sarRecord.id}/` +
        `${Date.now()}-${safeFileName(requestFile.name)}`;

      const bytes = new Uint8Array(await requestFile.arrayBuffer());

      const uploadResult = await supabase.storage
        .from("hr-resources")
        .upload(filePath, bytes, {
          upsert: false,
          contentType: requestFile.type || "application/octet-stream",
        });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message || "The request file could not be uploaded.");
      }

      uploadedPaths.push(filePath);

      const { error: updateError } = await supabase
        .from("employee_sars")
        .update({
          request_file_name: requestFile.name,
          request_file_path: filePath,
          request_file_type: requestFile.type || null,
          request_file_size: requestFile.size,
        })
        .eq("id", sarRecord.id);

      if (updateError) {
        throw new Error(updateError.message || "The SAR file details could not be saved.");
      }

      const { error: documentError } = await supabase
        .from("employee_sar_documents")
        .insert({
          sar_id: sarRecord.id,
          employee_id: sarRecord.employee_id,
          document_type: "Original Request",
          title: requestFile.name,
          file_name: requestFile.name,
          file_path: filePath,
          file_type: requestFile.type || null,
          file_size: requestFile.size,
          review_status: "Not Reviewed",
        });

      if (documentError) {
        throw new Error(documentError.message || "The uploaded request file could not be recorded.");
      }
    }

    await insertSarTimelineEvent(supabase, {
      sarId: sarRecord.id,
      eventType: "sar_received",
      title: "SAR received",
      description: matterId
        ? "The Subject Access Request was recorded and linked to an existing Matter."
        : "The Subject Access Request was recorded without a linked Matter.",
      createdBy: assignedTo || "User",
    });

    return NextResponse.json(
      {
        success: true,
        sar: {
          id: sarRecord.id,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedPaths.length > 0) {
      const access = await requireSarAccess("sar_requests.view");

      if (access.ok) {
        await access.context.supabase.storage
          .from("hr-resources")
          .remove(uploadedPaths);
      }
    }

    console.error("SAR creation API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The SAR could not be created.",
      },
      { status: 500 },
    );
  }
}