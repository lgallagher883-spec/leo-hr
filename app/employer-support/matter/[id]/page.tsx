import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireEmployerSupportMatter } from "@/lib/auth/employerSupportAccess";
import { createClient } from "@/lib/supabase/server";
import EmployerSupportShell from "../../EmployerSupportShell";
import styles from "../../employer-support-portal.module.css";
import EmployerSupportAskLeo from "./EmployerSupportAskLeo";
import MatterTools from "./MatterTools";
import MatterActions from "./MatterActions";
import MatterDocuments from "./MatterDocuments";

export default async function EmployerSupportMatterPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const matterId=Number(id);if(!Number.isInteger(matterId)||matterId<=0)notFound();
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok){if(gate.status===401)redirect("/employer-support/sign-in");notFound();}
 const supabase=await createClient();
 const [{data:matter},{data:actions},{data:documents},{data:timeline}]=await Promise.all([
  (supabase as any).from("matters").select("id,title,status,matter_type,subject,description,workflow_stage,created_at").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle(),
  (supabase as any).from("leo_employer_support_actions").select("id,title,detail,status,due_at").eq("matter_id",matterId).eq("organisation_id",gate.access.organisationId).order("created_at",{ascending:true}),
  (supabase as any).from("matter_documents").select("id,title,document_type,status,file_name,created_at").eq("matter_id",matterId).order("created_at",{ascending:false}),
  (supabase as any).from("matter_timeline").select("id,title,description,event_date,created_at").eq("matter_id",matterId).order("event_date",{ascending:false}).limit(6)
 ]);
 if(!matter)notFound();
 const openActions=(actions??[]).filter((a:any)=>a.status==="open");
 return <EmployerSupportShell><main className={styles.content}>
  <Link href="/employer-support" className={styles.back}>← Back to your Matters</Link>
  <div className={styles.matterHero}><div><p className={styles.eyebrow}>Matter MAT-{String(matter.id).padStart(6,"0")}</p><h1>{matter.title||matter.subject||"Employee Matter"}</h1><p>{matter.matter_type||"Employer Support Matter"} · {matter.status||"In progress"}</p></div><div className={styles.stagePill}><span>Where you are now</span><strong>{matter.workflow_stage||"Initial assessment"}</strong></div></div>
  <div className={styles.matterPulse}><div><span>Next step</span><strong>{openActions[0]?.title||"Continue with Leo"}</strong><small>{openActions[0]?.detail||"Tell Leo what has happened since the Matter began and Leo will guide the next appropriate step."}</small></div><div><span>Actions</span><strong>{openActions.length}</strong><small>{openActions.length===1?"open action":"open actions"}</small></div><div><span>Documents</span><strong>{documents?.length??0}</strong><small>in this Matter</small></div></div>
  <MatterTools matterId={matter.id}/><section className={styles.matterLayout}><div className={styles.matterMain}>
   <MatterActions matterId={matter.id} initialActions={actions??[]}/>
   <MatterDocuments documents={documents??[]}/>
   <EmployerSupportAskLeo matterId={matter.id} matter={{title:matter.title||"",description:matter.description||"",status:matter.status||"",matterType:matter.matter_type||"",subject:matter.subject||""}}/>
  </div><aside className={styles.matterAside}>
   <div className={styles.workspaceCard}><p className={styles.eyebrow}>Your workspace</p><h2>Everything for this Matter</h2>
    <div className={styles.workspaceLink}><span>✓</span><div><strong>Actions & next steps</strong><small>{openActions.length?openActions[0]?.title:"Leo will add clear actions as the Matter develops."}</small></div></div>
    <div className={styles.workspaceLink}><span>↥</span><div><strong>Documents & evidence</strong><small>{documents?.length?documents[0]?.title:"Keep relevant evidence and documents with the Matter."}</small></div></div>
    <div className={styles.workspaceLink}><span>✎</span><div><strong>Letters prepared by Leo</strong><small>Draft correspondence will stay here for review.</small></div></div>
    <div className={styles.workspaceLink}><span>◷</span><div><strong>Matter record</strong><small>{timeline?.length?timeline[0]?.title:"A clear record builds as the Matter progresses."}</small></div></div>
   </div>
   <div className={styles.recordCard}><p className={styles.eyebrow}>Recent activity</p>{timeline?.length?<div className={styles.recordList}>{timeline.map((event:any)=><div key={event.id}><i></i><span><strong>{event.title}</strong><small>{event.description||new Date(event.event_date||event.created_at).toLocaleDateString("en-GB")}</small></span></div>)}</div>:<p className={styles.recordEmpty}>Activity will build here as you work through the Matter.</p>}</div>
   <div className={styles.safeNote}><strong>Private Matter workspace</strong><p>Guidance, documents and progress stay together. You remain responsible for conversations and final decisions.</p></div>
  </aside></section>
 </main></EmployerSupportShell>;
}