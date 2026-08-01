import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthoritativeUserRole } from "@/lib/auth/authoritativeRoleResolver";

type Role = "owner"|"senior"|"manager"|"employee";
const writeRoles=new Set<Role>(["owner","senior","manager"]);
function adminClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error("Supabase administrator credentials are not configured.");
  return createAdmin(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}
async function access(){
  const supabase=await createClient();
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user) return {error:NextResponse.json({success:false,error:"Please sign in again."},{status:401})};
  const resolved=await resolveAuthoritativeUserRole(supabase as any,{userId:user.id,allowedStatuses:["active"]});
  const organisationId=resolved?.membership.organisation_id?.toString()||"";
  const role=(resolved?.roleKey||"employee").toLowerCase() as Role;
  if(!organisationId) return {error:NextResponse.json({success:false,error:"No active organisation was found."},{status:403})};
  return {user,organisationId,role,admin:adminClient()};
}
import { createSignatureEnvelope } from "@/lib/docusign/envelopes";
import type { SignatureRecipient, SignatureSourceModule } from "@/lib/docusign/types";

const text=(v:unknown)=>typeof v==="string"?v.trim():"";
const validEmail=(v:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function GET(request:Request){
  try{
    const a=await access(); if("error" in a) return a.error;
    const url=new URL(request.url);
    const sourceModule=text(url.searchParams.get("sourceModule"));
    const sourceRecordId=text(url.searchParams.get("sourceRecordId"));
    let query=a.admin.from("signature_envelopes").select("*").eq("organisation_id",a.organisationId).order("created_at",{ascending:false});
    if(sourceModule) query=query.eq("source_module",sourceModule);
    if(sourceRecordId) query=query.eq("source_record_id",sourceRecordId);
    const result=await query.limit(200);
    if(result.error) throw new Error(result.error.message);
    return NextResponse.json({success:true,envelopes:result.data||[]});
  }catch(error){
    return NextResponse.json({success:false,error:error instanceof Error?error.message:"Signature envelopes could not be loaded."},{status:500});
  }
}

export async function POST(request:Request){
  try{
    const a=await access(); if("error" in a) return a.error;
    if(!writeRoles.has(a.role)) return NextResponse.json({success:false,error:"You do not have permission to send documents for signature."},{status:403});
    const body=await request.json().catch(()=>({}));
    const recipients=Array.isArray(body.recipients)?body.recipients as SignatureRecipient[]:[];
    const connectionId=Number(body.connectionId);
    if(!text(body.documentName)||!text(body.documentBase64)||!text(body.sourceModule)||!text(body.sourceRecordId)||!text(body.emailSubject)||!Number.isInteger(connectionId)||connectionId<=0){
      return NextResponse.json({success:false,error:"Document, source record, email subject and connection are required."},{status:400});
    }
    if(!recipients.length||recipients.some(r=>!text(r.name)||!validEmail(text(r.email)))){
      return NextResponse.json({success:false,error:"At least one recipient with a valid name and email address is required."},{status:400});
    }
    const envelope=await createSignatureEnvelope(a.admin,{
      organisationId:a.organisationId,
      connectionId,
      sourceModule:text(body.sourceModule) as SignatureSourceModule,
      sourceRecordId:text(body.sourceRecordId),
      sourceDocumentId:text(body.sourceDocumentId)||null,
      documentName:text(body.documentName),
      documentBase64:text(body.documentBase64),
      documentExtension:text(body.documentExtension)||undefined,
      emailSubject:text(body.emailSubject),
      emailMessage:text(body.emailMessage)||undefined,
      recipients,
      sendImmediately:body.sendImmediately!==false,
      createdByUserId:a.user.id,
    });
    return NextResponse.json({success:true,envelope},{status:201});
  }catch(error){
    return NextResponse.json({success:false,error:error instanceof Error?error.message:"The document could not be sent for signature."},{status:500});
  }
}