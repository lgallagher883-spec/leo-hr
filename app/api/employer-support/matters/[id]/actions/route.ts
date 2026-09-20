import {NextResponse} from "next/server";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createClient} from "@/lib/supabase/server";
type Ctx={params:Promise<{id:string}>};
export async function PATCH(request:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId))return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const body=await request.json();const actionId=Number(body.actionId);const status=body.status==="done"?"done":"open";if(!Number.isInteger(actionId))return NextResponse.json({error:"Invalid action."},{status:400});
 const supabase=await createClient();const {data,error}=await (supabase as any).from("leo_employer_support_actions").update({status,completed_at:status==="done"?new Date().toISOString():null}).eq("id",actionId).eq("matter_id",matterId).eq("organisation_id",gate.access.organisationId).select("id,title,status").single();
 if(error||!data)return NextResponse.json({error:"The action could not be updated."},{status:500});
 await (supabase as any).from("matter_timeline").insert({matter_id:matterId,event_type:"action_updated",title:status==="done"?"Action completed":"Action reopened",description:data.title,event_date:new Date().toISOString(),created_by:"Employer"});
 return NextResponse.json({success:true,action:data});
}