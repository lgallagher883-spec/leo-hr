import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireEmployerSupportMatter } from "@/lib/auth/employerSupportAccess";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Ctx={params:Promise<{id:string}>};
const TYPES={
 investigation_invitation:"Investigation meeting invitation",
 disciplinary_invitation:"Disciplinary hearing invitation",
 grievance_acknowledgement:"Grievance acknowledgement",
 grievance_meeting_invitation:"Grievance meeting invitation",
 outcome_letter:"Outcome letter",
} as const;
type CorrespondenceType=keyof typeof TYPES;

export async function POST(request:Request,{params}:Ctx){
 const {id}=await params;const matterId=Number(id);
 if(!Number.isSafeInteger(matterId)||matterId<=0)return NextResponse.json({error:"Invalid Matter."},{status:400});
 const gate=await requireEmployerSupportMatter(matterId);if(!gate.ok)return NextResponse.json({error:"Matter unavailable."},{status:gate.status});
 const auth=await createClient();const {data:{user},error:userError}=await auth.auth.getUser();
 if(userError||!user)return NextResponse.json({error:"Please sign in again."},{status:401});
 const body=await request.json().catch(()=>null) as {type?:unknown;instructions?:unknown}|null;
 const type=typeof body?.type==="string"&&body.type in TYPES?body.type as CorrespondenceType:null;
 const instructions=typeof body?.instructions==="string"?body.instructions.trim():"";
 if(!type)return NextResponse.json({error:"Choose the correspondence you want Leo to prepare."},{status:400});
 if(instructions.length>2000)return NextResponse.json({error:"Keep the drafting instructions under 2,000 characters."},{status:400});
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"Leo's drafting service is not configured just now."},{status:503});

 const db=createAdminClient();
 const [{data:matter,error:matterError},{data:actions,error:actionsError}]=await Promise.all([
  (db as any).from("matters").select("id,title,subject,description,status,matter_type,workflow_stage").eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle(),
  (db as any).from("leo_employer_support_actions").select("title,detail,status").eq("matter_id",matterId).eq("organisation_id",gate.access.organisationId).order("created_at",{ascending:true})
 ]);
 if(matterError||actionsError)return NextResponse.json({error:"The Matter could not be checked before drafting."},{status:500});
 if(!matter)return NextResponse.json({error:"Matter unavailable."},{status:404});
 if(String(matter.status).toLowerCase()==="completed")return NextResponse.json({error:"This matter is closed and new correspondence can no longer be prepared."},{status:409});

 const prompt=`Prepare a genuine employer-to-employee HR letter for an England and Wales employment matter.
Document required: ${TYPES[type]}.
Write the actual correspondence, not advice, analysis, commentary, a checklist or an HR reasoning summary.
Use calm, neutral, professional British English. Do not invent facts, dates, allegations, names, meeting arrangements, policy clauses or decisions.
Where a necessary detail is unknown, use a clear square-bracket placeholder such as [Employee name], [date], [time], [location], [manager name].
Do not state that dismissal or any sanction has been decided unless the supplied Matter record expressly records that outcome.
For investigation correspondence, make clear that the meeting is fact-finding and is not itself disciplinary action.
For disciplinary hearing correspondence, describe allegations neutrally and preserve an open mind on outcome.
For grievance correspondence, avoid prejudging the complaint or findings.
Return only the letter itself, beginning with "Private and confidential" and including a useful subject line.

Matter record:
Title: ${matter.title||""}
Subject: ${matter.subject||""}
Matter type: ${matter.matter_type||""}
Stage: ${matter.workflow_stage||""}
Original issue: ${matter.description||""}
Recorded actions: ${(actions??[]).map((a:any)=>`${a.status}: ${a.title}${a.detail?` — ${a.detail}`:""}`).join("\n")||"None recorded"}
Employer drafting instructions: ${instructions||"No additional instructions supplied."}`;

 try{
  const {default:OpenAIClient}=await import("openai");
  const client=new OpenAIClient({apiKey:process.env.OPENAI_API_KEY});
  const completion=await client.chat.completions.create({model:"gpt-4o",temperature:0.2,messages:[{role:"system",content:"You draft careful employer-facing HR correspondence. Never invent missing case facts."},{role:"user",content:prompt}]});
  const drafted=completion.choices[0]?.message?.content?.trim();
  if(!drafted)return NextResponse.json({error:"Leo could not prepare the correspondence just now."},{status:502});
  const title=TYPES[type];
  const {data:document,error:documentError}=await (db as any).from("matter_documents").insert({matter_id:matterId,title,document_type:title,source:"leo_generated",status:"Draft",content:drafted,include_in_bundle:true,created_by:user.id,version_number:1}).select("id,title,document_type,status,created_at").single();
  if(documentError||!document)return NextResponse.json({error:"The draft was prepared but could not be added to the Matter record."},{status:500});
  const {error:timelineError}=await (db as any).from("matter_timeline").insert({matter_id:matterId,event_type:"document_drafted",title:"Draft correspondence prepared",description:title,event_date:new Date().toISOString(),created_by:user.id});
  if(timelineError)console.error("Employer Support correspondence timeline entry failed:",timelineError);
  return NextResponse.json({success:true,document,content:drafted,timelineRecorded:!timelineError},{status:201});
 }catch(error){console.error("Employer Support correspondence generation failed:",error);return NextResponse.json({error:"Leo could not prepare the correspondence just now."},{status:500});}
}
