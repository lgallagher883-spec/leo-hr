import {NextResponse} from "next/server";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
type Ctx={params:Promise<{id:string}>};
export async function PATCH(request:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId))return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const guard=createAdminClient();const {data:matter,error:matterError}=await (guard as any).from("matters").select("status").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle();if(matterError)return NextResponse.json({error:"The matter could not be checked before changing its actions."},{status:500});if(!matter)return NextResponse.json({error:"Matter unavailable."},{status:404});if(String(matter.status).toLowerCase()==="completed")return NextResponse.json({error:"This matter is closed and cannot be changed."},{status:409});
 const body=await request.json();const actionId=Number(body.actionId);const status=body.status==="done"?"done":"open";if(!Number.isInteger(actionId))return NextResponse.json({error:"Invalid action."},{status:400});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please sign in again."},{status:401});const {data,error}=await (supabase as any).from("leo_employer_support_actions").update({status,completed_at:status==="done"?new Date().toISOString():null}).eq("id",actionId).eq("matter_id",matterId).eq("organisation_id",gate.access.organisationId).select("id,title,status").single();
 if(error||!data)return NextResponse.json({error:"The action could not be updated."},{status:500});
 const {error:timelineError}=await (supabase as any).from("matter_timeline").insert({matter_id:matterId,event_type:"action_updated",title:status==="done"?"Action completed":"Action reopened",description:data.title,event_date:new Date().toISOString(),created_by:user.id});
 if(timelineError)console.error("Employer Support action update timeline entry failed:",timelineError);
 return NextResponse.json({success:true,action:data,timelineRecorded:!timelineError});
}