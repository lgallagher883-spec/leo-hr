import { NextResponse } from "next/server";
import { requireEmployerSupportMatter } from "@/lib/auth/employerSupportAccess";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx={params:Promise<{id:string}>};
export async function GET(_r:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId))return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const supabase=createAdminClient();
 const [actions,docs,timeline]=await Promise.all([
  (supabase as any).from("leo_employer_support_actions").select("id,title,detail,status,due_at,created_at,completed_at").eq("matter_id",matterId).eq("organisation_id",gate.access.organisationId).order("created_at",{ascending:true}),
  (supabase as any).from("matter_documents").select("id,title,document_type,status,file_name,created_at,include_in_bundle").eq("matter_id",matterId).order("created_at",{ascending:false}),
  (supabase as any).from("matter_timeline").select("id,event_type,title,description,event_date,created_at").eq("matter_id",matterId).order("event_date",{ascending:false}).limit(20)
 ]);
 if(actions.error||docs.error||timeline.error)return NextResponse.json({error:"The matter workspace could not be loaded."},{status:500});
 return NextResponse.json({actions:actions.data??[],documents:docs.data??[],timeline:timeline.data??[]});
}
