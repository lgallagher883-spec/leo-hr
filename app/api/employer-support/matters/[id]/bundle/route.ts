import {NextResponse} from "next/server";
import {Document,Packer,Paragraph,TextRun,HeadingLevel} from "docx";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createAdminClient} from "@/lib/supabase/admin";
export const runtime="nodejs";
type Ctx={params:Promise<{id:string}>};
const date=(v?:string|null)=>v?new Date(v).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";
export async function GET(_r:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId))return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const supabase=createAdminClient();
 const [{data:matter,error:matterError},{data:timeline,error:timelineError},{data:documents,error:documentsError},{data:actions,error:actionsError}]=await Promise.all([
  (supabase as any).from("matters").select("id,title,subject,description,status,matter_type,workflow_stage,created_at,completed_at").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").single(),
  (supabase as any).from("matter_timeline").select("title,description,event_date,created_at").eq("matter_id",matterId).order("event_date",{ascending:true}),
  (supabase as any).from("matter_documents").select("title,document_type,description,status,file_name,content,include_in_bundle,created_at").eq("matter_id",matterId).eq("include_in_bundle",true).order("created_at",{ascending:true}),
  (supabase as any).from("leo_employer_support_actions").select("title,detail,status,completed_at,created_at").eq("matter_id",matterId).eq("organisation_id",gate.access.organisationId).order("created_at",{ascending:true})
 ]);
 if(matterError||!matter)return NextResponse.json({error:"Matter unavailable."},{status:404});
 if(timelineError||documentsError||actionsError)return NextResponse.json({error:"The matter bundle could not be prepared completely."},{status:500});
 const children:any[]=[new Paragraph({text:"Matter Bundle",heading:HeadingLevel.TITLE}),new Paragraph({children:[new TextRun({text:`MAT-${String(matter.id).padStart(6,"0")} · Employer Support`,bold:true})]}),new Paragraph({text:matter.title||matter.subject||"Employee relations Matter"}),new Paragraph({text:`Status: ${matter.status||"Open"} · Stage: ${matter.workflow_stage||"Initial assessment"}`}),new Paragraph({text:`Created: ${date(matter.created_at)}`}),new Paragraph({text:"Matter summary",heading:HeadingLevel.HEADING_1}),new Paragraph({text:matter.description||"No summary recorded."})];
 children.push(new Paragraph({text:"Actions and outcomes",heading:HeadingLevel.HEADING_1}));
 for(const a of actions??[])children.push(new Paragraph({text:`${a.status==="done"?"Completed":"Open"} — ${a.title}${a.detail?`: ${a.detail}`:""}${a.completed_at?` (${date(a.completed_at)})`:""}`}));
 children.push(new Paragraph({text:"Matter chronology",heading:HeadingLevel.HEADING_1}));
 for(const e of timeline??[])children.push(new Paragraph({text:`${date(e.event_date||e.created_at)} — ${e.title}${e.description?`: ${e.description}`:""}`}));
 children.push(new Paragraph({text:"Documents and evidence",heading:HeadingLevel.HEADING_1}));
 if(!(documents??[]).length)children.push(new Paragraph({text:"No documents are currently marked for inclusion."}));
 for(const d of documents??[]){children.push(new Paragraph({children:[new TextRun({text:d.title||"Untitled document",bold:true})]}));children.push(new Paragraph({text:`${d.document_type||"Document"} · ${d.status||""}${d.file_name?` · ${d.file_name}`:""}`}));if(d.content)children.push(new Paragraph({text:d.content}));}
 children.push(new Paragraph({text:"Private Ask Leo conversation",heading:HeadingLevel.HEADING_1}),new Paragraph({children:[new TextRun({text:"Not included in this Matter Bundle.",bold:true})]}),new Paragraph({text:"The private Ask Leo conversation is deliberately excluded. This bundle contains the Matter record, actions and documents selected for the Matter."}));
 const buffer=await Packer.toBuffer(new Document({sections:[{children}]}));const name=`Employer-Support-MAT-${String(matter.id).padStart(6,"0")}-Bundle.docx`;
 return new Response(new Uint8Array(buffer),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":`attachment; filename="${name}"`,"Cache-Control":"no-store"}});
}