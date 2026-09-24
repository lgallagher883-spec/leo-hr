import {NextResponse} from "next/server";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createAdminClient} from "@/lib/supabase/admin";

export const dynamic="force-dynamic";
const BUCKET="matter-documents";
type Ctx={params:Promise<{id:string;documentId:string}>};

export async function GET(_request:Request,{params}:Ctx){
 const {id,documentId}=await params;const matterId=Number(id);const docId=Number(documentId);
 if(!Number.isSafeInteger(matterId)||matterId<=0||!Number.isSafeInteger(docId)||docId<=0)return NextResponse.json({error:"The document reference is invalid."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const admin=createAdminClient();
 const {data:document,error}=await (admin as any).from("matter_documents").select("id,matter_id,storage_path,file_name,source").eq("id",docId).eq("matter_id",matterId).maybeSingle();
 if(error)return NextResponse.json({error:"The document could not be verified."},{status:500});
 if(!document?.storage_path)return NextResponse.json({error:"This document does not have an uploaded file."},{status:404});
 if(document.source!=="uploaded")return NextResponse.json({error:"This document is not an uploaded Employer Support file."},{status:403});
 const expectedPrefix=`${gate.access.organisationId}/employer-support/${matterId}/`;
 if(!String(document.storage_path).startsWith(expectedPrefix))return NextResponse.json({error:"This document is not available in Employer Support."},{status:403});
 const signed=await admin.storage.from(BUCKET).createSignedUrl(document.storage_path,60);
 if(signed.error||!signed.data?.signedUrl)return NextResponse.json({error:"The document could not be opened."},{status:500});
 return NextResponse.json({success:true,url:signed.data.signedUrl,fileName:document.file_name});
}
