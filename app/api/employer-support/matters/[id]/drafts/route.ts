import {NextResponse} from "next/server";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
type Ctx={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId))return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const admin=createAdminClient();const {data:matter,error:matterError}=await (admin as any).from("matters").select("status").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle();
 if(matterError)return NextResponse.json({error:"The matter could not be checked before saving the draft."},{status:500});
 if(!matter)return NextResponse.json({error:"Matter unavailable."},{status:404});
 if(String(matter.status).toLowerCase()==="completed")return NextResponse.json({error:"This matter is closed and drafts can no longer be added."},{status:409});
 const body=await request.json().catch(()=>null) as {title?:unknown;content?:unknown;documentType?:unknown}|null;
 const rawTitle=typeof body?.title==="string"?body.title.trim():"";const content=typeof body?.content==="string"?body.content.trim():"";const rawDocumentType=typeof body?.documentType==="string"?body.documentType.trim():"";
 if(!rawTitle||!content)return NextResponse.json({error:"A title and draft are required."},{status:400});
 if(rawTitle.length>180)return NextResponse.json({error:"The draft title is too long."},{status:400});
 if(content.length>50000)return NextResponse.json({error:"This draft is too long to save as one document."},{status:400});
 if(rawDocumentType.length>80)return NextResponse.json({error:"The document type is too long."},{status:400});
 const title=rawTitle;const documentType=rawDocumentType||"Leo draft";
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please sign in again."},{status:401});
 const {data,error}=await (supabase as any).from("matter_documents").insert({matter_id:matterId,title,document_type:documentType||"Leo draft",description:"Draft prepared with Ask Leo for employer review.",source:"leo_generated",status:"Draft",content,include_in_bundle:true,created_by:user.id,version_number:1}).select("id,title,status,document_type,created_at").single();
 if(error||!data)return NextResponse.json({error:"The draft could not be saved."},{status:500});
 const {error:timelineError}=await (supabase as any).from("matter_timeline").insert({matter_id:matterId,event_type:"leo_draft_saved",title:"Leo draft saved",description:title,event_date:new Date().toISOString(),created_by:user.id});
 if(timelineError)console.error("Employer Support draft timeline entry failed:",timelineError);
 return NextResponse.json({success:true,document:data,timelineRecorded:!timelineError},{status:201});
}