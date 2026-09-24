import {NextResponse} from "next/server";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createAdminClient} from "@/lib/supabase/admin";
type Ctx={params:Promise<{id:string;documentId:string}>};
export async function GET(_request:Request,{params}:Ctx){
 const {id,documentId}=await params;const matterId=Number(id);const docId=Number(documentId);
 if(!Number.isSafeInteger(matterId)||matterId<=0||!Number.isSafeInteger(docId)||docId<=0)return NextResponse.json({error:"Invalid document reference."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const db=createAdminClient();
 const {data:matter,error:matterError}=await (db as any).from("matters").select("status").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle();
 if(matterError)return NextResponse.json({error:"The Matter could not be checked."},{status:500});if(!matter)return NextResponse.json({error:"Matter unavailable."},{status:404});
 const {data:document,error}=await (db as any).from("matter_documents").select("id,title,document_type,status,source,content,created_at").eq("id",docId).eq("matter_id",matterId).maybeSingle();
 if(error)return NextResponse.json({error:"The draft could not be loaded."},{status:500});
 if(!document||document.source!=="leo_generated"||document.status!=="Draft"||!document.content)return NextResponse.json({error:"Draft unavailable."},{status:404});
 return NextResponse.json({success:true,document:{id:document.id,title:document.title,documentType:document.document_type,status:document.status,content:document.content,createdAt:document.created_at,closed:String(matter.status).toLowerCase()==="completed"}});
}
