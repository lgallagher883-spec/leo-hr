import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmployerSupportMatter } from "@/lib/auth/employerSupportAccess";
import { createClient } from "@/lib/supabase/server";
const MAX=25*1024*1024;const BUCKET="matter-documents";
const ALLOWED_MIME_TYPES=new Set([
 "application/pdf",
 "application/msword",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 "application/vnd.ms-excel",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 "text/plain","text/csv",
 "image/jpeg","image/png","image/webp",
]);
const ALLOWED_EXTENSIONS=new Set(["pdf","doc","docx","xls","xlsx","txt","csv","jpg","jpeg","png","webp"]);
function safe(n:string){return n.normalize("NFKD").replace(/[^\w.\-() ]+/g,"").replace(/\s+/g,"-").slice(0,180)||"document"}
type Ctx={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId)||matterId<=0)return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const guard=createAdminClient();const {data:matter,error:matterError}=await (guard as any).from("matters").select("status").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle();if(matterError)return NextResponse.json({error:"The matter could not be checked before uploading. Please try again."},{status:500});if(!matter)return NextResponse.json({error:"Matter unavailable."},{status:404});if(String(matter.status).toLowerCase()==="completed")return NextResponse.json({error:"This matter is closed and documents can no longer be added."},{status:409});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please sign in again."},{status:401});
 let path:string|null=null;
 try{const form=await request.formData();const file=form.get("file");if(!(file instanceof File)||file.size<=0)return NextResponse.json({error:"Choose a file to upload."},{status:400});if(file.size>MAX)return NextResponse.json({error:"The file is larger than the 25 MB limit."},{status:400});
  const extension=file.name.includes(".")?file.name.split(".").pop()?.toLowerCase()??"":"";
  if(!ALLOWED_EXTENSIONS.has(extension)||!ALLOWED_MIME_TYPES.has(file.type))return NextResponse.json({error:"That file type is not supported. Upload a PDF, Word, Excel, text, CSV, JPG, PNG or WebP file."},{status:400});
  path=`${gate.access.organisationId}/employer-support/${matterId}/${Date.now()}-${crypto.randomUUID()}-${safe(file.name)}`;
  const {error:up}=await guard.storage.from(BUCKET).upload(path,Buffer.from(await file.arrayBuffer()),{contentType:file.type||"application/octet-stream",upsert:false});if(up)throw up;
  const {data,error}=await (supabase as any).from("matter_documents").insert({matter_id:matterId,title:file.name,document_type:"Evidence",source:"uploaded",status:"Final",file_name:file.name,storage_path:path,mime_type:file.type||"application/octet-stream",file_size_bytes:file.size,include_in_bundle:true,created_by:user.id,version_number:1}).select("id,title,document_type,status,file_name,created_at").single();
  if(error||!data)throw error||new Error("Document record could not be saved.");
  const {error:timelineError}=await (supabase as any).from("matter_timeline").insert({matter_id:matterId,event_type:"document_added",title:"Document added",description:file.name,event_date:new Date().toISOString(),created_by:user.id});
  if(timelineError)console.error("Employer Support document timeline entry failed:",timelineError);
  return NextResponse.json({success:true,document:data,timelineRecorded:!timelineError},{status:201});
 }catch(e){if(path)await guard.storage.from(BUCKET).remove([path]);console.error("Employer Support document upload failed:",e);return NextResponse.json({error:"The document could not be added to this Matter."},{status:500})}
}