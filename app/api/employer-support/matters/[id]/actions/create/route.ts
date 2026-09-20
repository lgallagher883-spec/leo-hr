import {NextResponse} from "next/server";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createClient} from "@/lib/supabase/server";
type Ctx={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId))return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const body=await request.json().catch(()=>null) as {title?:unknown;detail?:unknown}|null;const title=typeof body?.title==="string"?body.title.trim().slice(0,180):"";const detail=typeof body?.detail==="string"?body.detail.trim().slice(0,1000):"";
 if(!title)return NextResponse.json({error:"An action title is required."},{status:400});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 const {data,error}=await (supabase as any).from("leo_employer_support_actions").insert({organisation_id:gate.access.organisationId,matter_id:matterId,title,detail:detail||null,status:"open",created_by:user?.id??null}).select("id,title,detail,status").single();
 if(error||!data)return NextResponse.json({error:"The next step could not be added."},{status:500});
 await (supabase as any).from("matter_timeline").insert({matter_id:matterId,event_type:"action_added",title:"Next step added",description:title,event_date:new Date().toISOString(),created_by:"Employer"});
 return NextResponse.json({success:true,action:data},{status:201});
}