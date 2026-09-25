import {NextResponse} from "next/server";
import {Document,Packer,Paragraph,TextRun} from "docx";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createAdminClient} from "@/lib/supabase/admin";
type Ctx={params:Promise<{id:string;documentId:string}>};
function safeName(value:string){return value.normalize("NFKD").replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"-").slice(0,100)||"Leo-draft"}
export async function GET(_request:Request,{params}:Ctx){
 const {id,documentId}=await params;const matterId=Number(id),docId=Number(documentId);
 if(!Number.isSafeInteger(matterId)||matterId<=0||!Number.isSafeInteger(docId)||docId<=0)return NextResponse.json({error:"Invalid document reference."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const db=createAdminClient();
 const {data:document,error}=await (db as any).from("matter_documents").select("id,title,status,source,content").eq("id",docId).eq("matter_id",matterId).maybeSingle();
 if(error)return NextResponse.json({error:"The draft could not be loaded."},{status:500});
 if(!document||document.source!=="leo_generated"||document.status!=="Draft"||!document.content)return NextResponse.json({error:"Draft unavailable."},{status:404});
 const lines=String(document.content).replace(/\r\n/g,"\n").split("\n");
 const children=lines.map((line:string)=>new Paragraph({spacing:{after:line.trim()?120:80},children:line.trim()?[new TextRun({text:line,font:"Arial",size:21})]:[]}));
 const doc=new Document({styles:{default:{document:{run:{font:"Arial",size:21},paragraph:{spacing:{line:276}}}}},sections:[{properties:{page:{margin:{top:1134,right:1134,bottom:1134,left:1134}}},children}]});
 const buffer=await Packer.toBuffer(doc);
 return new NextResponse(new Uint8Array(buffer),{status:200,headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":`attachment; filename="${safeName(document.title)}-DRAFT.docx"`,"Cache-Control":"private, no-store"}});
}
