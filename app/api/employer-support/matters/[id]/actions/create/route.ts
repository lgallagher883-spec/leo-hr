import {NextResponse} from "next/server";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
type Ctx={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId))return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const guard=createAdminClient();const {data:matter,error:matterError}=await (guard as any).from("matters").select("status").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle();if(matterError)return NextResponse.json({error:"The matter could not be checked before changing its actions."},{status:500});if(!matter)return NextResponse.json({error:"Matter unavailable."},{status:404});if(String(matter.status).toLowerCase()==="completed")return NextResponse.json({error:"This matter is closed and cannot be changed."},{status:409});
 const body=await request.json().catch(()=>null) as {title?:unknown;detail?:unknown}|null;const title=typeof body?.title==="string"?body.title.trim():"";const detail=typeof body?.detail==="string"?body.detail.trim():"";
 if(!title)return NextResponse.json({error:"An action title is required."},{status:400});
 if(title.length>180)return NextResponse.json({error:"The action title is too long."},{status:400});
 if(detail.length>1000)return NextResponse.json({error:"The action detail is too long."},{status:400});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please sign in again."},{status:401});
 const {data,error}=await (supabase as any).from("leo_employer_support_actions").insert({organisation_id:gate.access.organisationId,matter_id:matterId,title,detail:detail||null,status:"open",created_by:user.id}).select("id,title,detail,status").single();
 if(error||!data)return NextResponse.json({error:"The next step could not be added."},{status:500});
 const {error:timelineError}=await (supabase as any).from("matter_timeline").insert({matter_id:matterId,event_type:"action_added",title:"Next step added",description:title,event_date:new Date().toISOString(),created_by:user.id});
 if(timelineError)console.error("Employer Support action timeline entry failed:",timelineError);
 return NextResponse.json({success:true,action:data,timelineRecorded:!timelineError},{status:201});
}