import {NextResponse} from "next/server";
import {AlignmentType,Document,Footer,Header,PageBreak,PageNumber,Packer,Paragraph,TextRun} from "docx";
import {requireEmployerSupportMatter} from "@/lib/auth/employerSupportAccess";
import {createAdminClient} from "@/lib/supabase/admin";
export const runtime="nodejs";
type Ctx={params:Promise<{id:string}>};
const date=(v?:string|null)=>v?new Date(v).toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Not recorded";
const clean=(v?:string|null)=>v?.trim()||"Not recorded";
export async function GET(_r:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);if(!Number.isSafeInteger(matterId)||matterId<=0)return NextResponse.json({error:"Invalid matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const db=createAdminClient();
 const [{data:matter,error:matterError},{data:timeline,error:timelineError},{data:documents,error:documentsError},{data:actions,error:actionsError},{data:org,error:orgError},{data:profile,error:profileError}]=await Promise.all([
  (db as any).from("matters").select("id,title,subject,description,status,matter_type,workflow_stage,created_at,completed_at").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").single(),
  (db as any).from("matter_timeline").select("title,description,event_date,created_at").eq("matter_id",matterId).order("event_date",{ascending:true}),
  (db as any).from("matter_documents").select("title,document_type,description,status,file_name,content,include_in_bundle,created_at").eq("matter_id",matterId).eq("include_in_bundle",true).order("created_at",{ascending:true}),
  (db as any).from("leo_employer_support_actions").select("title,detail,status,completed_at,created_at").eq("matter_id",matterId).eq("organisation_id",gate.access.organisationId).order("created_at",{ascending:true}),
  (db as any).from("organisations").select("name").eq("id",gate.access.organisationId).maybeSingle(),
  (db as any).from("organisation_public_profiles").select("display_name,primary_colour,secondary_colour").eq("organisation_id",gate.access.organisationId).maybeSingle()
 ]);
 if(matterError){console.error("Employer Support bundle Matter lookup failed:",matterError);return NextResponse.json({error:"The matter could not be checked before preparing the bundle."},{status:500});}
 if(!matter)return NextResponse.json({error:"Matter unavailable."},{status:404});
 if(timelineError||documentsError||actionsError||orgError||profileError){console.error("Employer Support bundle data lookup failed:",{timelineError,documentsError,actionsError,orgError,profileError});return NextResponse.json({error:"The matter bundle could not be prepared completely."},{status:500});}
 if(String(matter.status).toLowerCase()!=="completed")return NextResponse.json({error:"The Matter Bundle is available once this matter has been completed."},{status:409});
 const organisationName=profile?.display_name||org?.name||"Employer";
 const primary=(profile?.primary_colour||"#6E5084").replace("#","").toUpperCase();
 const colour=/^[0-9A-F]{6}$/.test(primary)?primary:"6E5084";
 const ref="MAT-"+String(matter.id).padStart(6,"0");
 const generated=date(new Date().toISOString());
 const heading=(text:string)=>new Paragraph({children:[new TextRun({text,bold:true,size:28,color:colour})],spacing:{before:220,after:120}});
 const line=(text:string)=>new Paragraph({text,spacing:{after:90},style:"Normal"});
 const children:Paragraph[]=[
  new Paragraph({children:[new TextRun({text:"MATTER BUNDLE",bold:true,size:42,color:colour})],alignment:AlignmentType.CENTER,spacing:{before:900,after:220}}),
  new Paragraph({children:[new TextRun({text:organisationName,bold:true,size:26,color:colour})],alignment:AlignmentType.CENTER,spacing:{after:120}}),
  new Paragraph({text:`Bundle reference: ${ref}`,alignment:AlignmentType.CENTER,spacing:{after:70}}),
  new Paragraph({text:`Generated: ${generated}`,alignment:AlignmentType.CENTER,spacing:{after:220}}),
  new Paragraph({children:[new TextRun({text:"Confidential employer record",italics:true,size:18,color:"555555"})],alignment:AlignmentType.CENTER}),
  new Paragraph({children:[new PageBreak()]}),
  heading("Matter overview"),
  line(`Reference: ${ref}`),line(`Status: ${clean(matter.status)}`),line(`Stage: ${clean(matter.workflow_stage)}`),line(`Opened: ${date(matter.created_at)}`),line(`Closed: ${date(matter.completed_at)}`),
  heading("Background"),line(clean(matter.description)),
  heading("Actions and outcome")
 ];
 if(!(actions??[]).length)children.push(line("No separate actions were recorded."));
 for(const a of actions??[])children.push(line(`${a.status==="done"?"Completed":"Open"} — ${clean(a.title)}${a.detail?`: ${a.detail}`:""}${a.completed_at?` (${date(a.completed_at)})`:""}`));
 children.push(heading("Chronology"));
 if(!(timeline??[]).length)children.push(line("No chronology entries were recorded."));
 for(const e of timeline??[])children.push(line(`${date(e.event_date||e.created_at)} — ${clean(e.title)}${e.description?`: ${e.description}`:""}`));
 children.push(heading("Documents and evidence"));
 if(!(documents??[]).length)children.push(line("No documents were marked for inclusion in this bundle."));
 for(const d of documents??[]){children.push(new Paragraph({children:[new TextRun({text:clean(d.title),bold:true,color:colour})],spacing:{before:100,after:60}}));children.push(line(`${clean(d.document_type)}${d.file_name?` · ${d.file_name}`:""}`));if(d.description)children.push(line(d.description));if(d.content)children.push(line(d.content));}
 children.push(heading("Private Ask Leo conversation"),new Paragraph({children:[new TextRun({text:"Not included in this Matter Bundle.",bold:true})],spacing:{after:80}}),line("The private Ask Leo conversation is deliberately excluded. The bundle contains the formal matter record, chronology, actions and selected documents."));
 const header=new Header({children:[new Paragraph({children:[new TextRun({text:`${organisationName} | Matter Bundle`,bold:true,color:colour,size:18})],alignment:AlignmentType.RIGHT})]});
 const footer=new Footer({children:[new Paragraph({text:"Confidential | Ask Leo Employer Support",alignment:AlignmentType.CENTER}),new Paragraph({children:[new TextRun(`${ref} | Page `),new TextRun({children:[PageNumber.CURRENT]})],alignment:AlignmentType.RIGHT})]});
 const buffer=await Packer.toBuffer(new Document({styles:{default:{document:{run:{font:"Arial",size:21,color:"334155"},paragraph:{spacing:{line:300}}}}},sections:[{properties:{page:{margin:{top:900,right:900,bottom:900,left:900}}},headers:{default:header},footers:{default:footer},children}]}));
 const name=`Employer-Support-${ref}-Bundle.docx`;
 return new Response(new Uint8Array(buffer),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","Content-Disposition":`attachment; filename="${name}"`,"Cache-Control":"no-store"}});
}