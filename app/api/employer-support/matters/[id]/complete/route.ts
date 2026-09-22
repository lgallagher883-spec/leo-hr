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
 const {data:current,error:currentError}=await (supabase as any).from("matters").select("status,workflow_stage").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle();
 if(currentError||!current)return NextResponse.json({error:"Matter unavailable."},{status:404});
 if(String(current.status).toLowerCase()==="completed")return NextResponse.json({success:true,alreadyCompleted:true});
 const {count:openActionCount,error:actionError}=await (supabase as any).from("leo_employer_support_actions").select("id",{count:"exact",head:true}).eq("matter_id",matterId).eq("organisation_id",gate.access.organisationId).eq("status","open");
 if(actionError)return NextResponse.json({error:"The matter could not be checked before closing."},{status:500});
 if((openActionCount??0)>0)return NextResponse.json({error:`Complete the remaining ${openActionCount} open action${openActionCount===1?"":"s"} before closing this matter.`},{status:409});
 const {data:updated,error}=await (supabase as any).from("matters").update({status:"Completed",workflow_stage:"Matter concluded",completed_at:now}).eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").select("id").maybeSingle();
 if(error||!updated)return NextResponse.json({error:"The matter could not be closed."},{status:500});
 const {error:timelineError}=await (supabase as any).from("matter_timeline").insert({matter_id:matterId,event_type:"matter_completed",title:"Matter completed",description:outcome,event_date:now,created_by:"Employer"});
 if(timelineError){
  const {error:rollbackError}=await (supabase as any).from("matters").update({status:current.status,workflow_stage:current.workflow_stage,completed_at:null}).eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").eq("status","Completed").eq("completed_at",now);
  if(rollbackError)console.error("Employer Support completion rollback failed:",rollbackError);
  return NextResponse.json({error:rollbackError?"The matter was closed, but part of its completion record could not be saved. Please contact support.":"The completion record could not be saved, so the matter has been left open. Please try again."},{status:500});
 }
 return NextResponse.json({success:true});
}