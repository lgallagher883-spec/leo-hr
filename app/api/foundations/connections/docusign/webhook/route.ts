import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic="force-dynamic";

function admin(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error("Supabase administrator credentials are not configured.");
  return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}
function verify(raw:string,signature:string){
  const secret=process.env.DOCUSIGN_CONNECT_HMAC_SECRET||"";
  if(!secret||!signature) return false;
  const expected=Buffer.from(createHmac("sha256",secret).update(raw,"utf8").digest("base64"));
  const actual=Buffer.from(signature);
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export async function POST(request:Request){
  try{
    const raw=await request.text();
    if(!verify(raw,request.headers.get("x-docusign-signature-1")||"")){
      return NextResponse.json({success:false,error:"Invalid DocuSign webhook signature."},{status:401});
    }
    const body=JSON.parse(raw) as Record<string,any>;
    const envelopeId=body?.data?.envelopeId||body?.envelopeId||body?.EnvelopeStatus?.EnvelopeID||"";
    const providerStatus=body?.data?.envelopeSummary?.status||body?.status||body?.EnvelopeStatus?.Status||"";
    if(!envelopeId) return NextResponse.json({success:false,error:"Webhook envelope ID was missing."},{status:400});
    const db=admin();
    const found=await db.from("signature_envelopes").select("*").eq("provider_key","docusign").eq("provider_envelope_id",envelopeId).maybeSingle();
    if(found.error) throw new Error(found.error.message);
    if(!found.data) return NextResponse.json({success:true,ignored:true});
    const allowed=["created","sent","delivered","completed","declined","voided","expired"];
    const status=allowed.includes(String(providerStatus).toLowerCase())?String(providerStatus).toLowerCase():"error";
    const now=new Date().toISOString();
    const timestamps:Record<string,string>={};
    if(status==="sent") timestamps.sent_at=now;
    if(status==="delivered") timestamps.delivered_at=now;
    if(status==="completed") timestamps.completed_at=now;
    if(status==="declined") timestamps.declined_at=now;
    if(status==="voided") timestamps.voided_at=now;
    const update=await db.from("signature_envelopes").update({
      status,provider_status:providerStatus||null,...timestamps,last_status_checked_at:now,
      metadata:{...(found.data.metadata||{}),last_webhook_received_at:now,last_webhook_event:body?.event||body?.eventType||providerStatus||null},
      updated_at:now,
    }).eq("id",found.data.id);
    if(update.error) throw new Error(update.error.message);
    return NextResponse.json({success:true});
  }catch(error){
    console.error("DocuSign webhook failed:",error);
    return NextResponse.json({success:false,error:error instanceof Error?error.message:"The DocuSign webhook could not be processed."},{status:500});
  }
}