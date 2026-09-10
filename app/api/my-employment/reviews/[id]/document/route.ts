import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase administrator credentials are not configured.");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const reviewId = Number(id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) return NextResponse.json({ success:false, error:"The review reference is not valid." }, { status:400 });

    const supabase = await createClient();
    const { data:{ user }, error:userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ success:false, error:"You must be signed in to view this review." }, { status:401 });

    const { data:organisationId, error:organisationError } = await supabase.rpc("leo_current_organisation_id");
    if (organisationError || typeof organisationId !== "string" || !organisationId) return NextResponse.json({ success:false, error:"Your active organisation could not be resolved." }, { status:403 });

    const { data:link, error:linkError } = await supabase.from("employee_user_links").select("employee_id").eq("organisation_id", organisationId).eq("user_id", user.id).eq("link_status", "active").maybeSingle();
    if (linkError) throw new Error(linkError.message);
    if (!link?.employee_id) return NextResponse.json({ success:false, error:"No employee record is linked to this account." }, { status:403 });

    const admin = adminClient();
    const employee = await admin.from("employees").select("id,name").eq("id", link.employee_id).eq("organisation_id", organisationId).maybeSingle();
    if (employee.error) throw new Error(employee.error.message);
    if (!employee.data) return NextResponse.json({ success:false, error:"Your employee record could not be found." }, { status:404 });

    const review = await admin.from("probation_reviews").select("id,employee_id,review_type,scheduled_date,completed_date,status,manager_name,attendees,employee_comments,manager_comments,progress_summary,support_required,agreed_actions").eq("id", reviewId).eq("employee_id", employee.data.id).eq("is_archived", false).maybeSingle();
    if (review.error) throw new Error(review.error.message);
    if (!review.data) return NextResponse.json({ success:false, error:"The review could not be found." }, { status:404 });
    if (review.data.status !== "Completed") return NextResponse.json({ success:false, error:"Only completed reviews can be printed." }, { status:409 });

    const pdf = await buildPdf(employee.data.name, review.data);
    return new Response(new Uint8Array(pdf), { status:200, headers:{ "Content-Type":"application/pdf", "Content-Disposition":"inline; filename=\"probation-review-" + reviewId + ".pdf\"", "Cache-Control":"no-store" } });
  } catch (error) {
    return NextResponse.json({ success:false, error:error instanceof Error ? error.message : "The review document could not be generated." }, { status:500 });
  }
}

async function buildPdf(employeeName:string, review:any): Promise<Buffer> {
  return new Promise((resolve,reject) => {
    const doc = new PDFDocument({ size:"A4", margin:54 });
    const chunks:Buffer[]=[];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(20).fillColor("#6E5084").text("Probation Review Record");
    doc.moveDown(0.4); doc.fontSize(11).fillColor("#4B5563").text(employeeName); doc.moveDown(1);
    const section=(title:string,value:string|null)=>{ doc.fontSize(10).fillColor("#6E5084").text(title); doc.fontSize(10.5).fillColor("#1F2937").text(value || "Not recorded", { lineGap:3 }); doc.moveDown(0.7); };
    section("Review", review.review_type);
    section("Review held", review.completed_date);
    section("Manager", review.manager_name);
    section("Attendees", review.attendees);
    section("Review summary", review.progress_summary);
    section("Your comments", review.employee_comments);
    section("Manager comments", review.manager_comments);
    section("Support agreed", review.support_required);
    section("Agreed actions", review.agreed_actions);
    doc.end();
  });
}