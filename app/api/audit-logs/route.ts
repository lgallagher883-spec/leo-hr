import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAuditAccess() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { response: NextResponse.json({ success:false,error:"You must be signed in to view audit logs."},{status:401}) };
  const { data: organisationId, error: organisationError } = await supabase.rpc("leo_current_organisation_id");
  if (organisationError || !organisationId) return { response: NextResponse.json({ success:false,error:"Your active organisation could not be resolved."},{status:403}) };
  const { data: allowed, error: permissionError } = await (supabase as any).rpc("leo_has_permission",{
    target_organisation_id: organisationId,
    target_permission_key:"audit_logs.view",
    target_user_id:user.id,
  });
  if (permissionError) return { response: NextResponse.json({success:false,error:"Your permission to view audit logs could not be verified."},{status:500}) };
  if (!allowed) return { response: NextResponse.json({success:false,error:"You do not have permission to view audit logs."},{status:403}) };
  return { supabase, organisationId };
}

export async function GET() {
  try {
    const access = await requireAuditAccess();
    if ((access as any).response) return (access as any).response;
    const { supabase, organisationId } = access as any;

    /*
        {
          success: false,
          error:
            "You must be signed in to view audit logs.",
        },
        { status: 401 }
      );
    }

    */
    const [
      auditResult,
      employeeResult,
      matterResult,
      sarResult,
    ] = await Promise.all([
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(5000),

      supabase
        .from("employees")
        .select("id,name")
        .eq("organisation_id", organisationId)
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("matters")
        .select(
          "id,title,subject,employee_id"
        ),

      supabase
        .from("employee_sars")
        .select(
          "id,request_title,employee_id"
        ),
    ]);

    if (auditResult.error) {
      console.error(
        "Audit logs query failed:",
        auditResult.error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            auditResult.error.message ||
            "Audit logs could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (employeeResult.error) {
      console.error(
        "Audit employees query failed:",
        employeeResult.error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            employeeResult.error.message ||
            "Employee data could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (matterResult.error) {
      console.error(
        "Audit Matters query failed:",
        matterResult.error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            matterResult.error.message ||
            "Matter data could not be loaded.",
        },
        { status: 500 }
      );
    }

    if (sarResult.error) {
      console.error(
        "Audit SAR query failed:",
        sarResult.error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            sarResult.error.message ||
            "SAR data could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        logs:
          auditResult.data || [],
        employees:
          employeeResult.data || [],
        matters:
          matterResult.data || [],
        sars:
          sarResult.data || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Audit Logs API failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Audit data could not be loaded.",
      },
      { status: 500 }
    );
  }
}