import {NextResponse} from "next/server";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createAdminClient} from "@/lib/supabase/admin";
type Ctx={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId))return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const body=await request.json().catch(()=>null) as {outcome?:unknown}|null;const outcome=typeof body?.outcome==="string"?body.outcome.trim().slice(0,2000):"";
 if(!outcome)return NextResponse.json({error:"Add a short outcome before completing the Matter."},{status:400});
 const supabase=createAdminClient();const now=new Date().toISOString();
 const {data:updated,error}=await (supabase as any).from("matters").update({status:"Completed",workflow_stage:"Matter concluded",completed_at:now}).eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").select("id").maybeSingle();
 if(error||!updated)return NextResponse.json({error:"The matter could not be closed."},{status:500});
 const {error:timelineError}=await (supabase as any).from("matter_timeline").insert({matter_id:matterId,event_type:"matter_completed",title:"Matter completed",description:outcome,event_date:now,created_by:"Employer"});
 if(timelineError)return NextResponse.json({error:"The matter was closed but the outcome could not be added to the record."},{status:500});
 return NextResponse.json({success:true});
}