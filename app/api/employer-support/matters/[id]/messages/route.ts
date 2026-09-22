import { NextResponse } from "next/server";

import { requireEmployerSupportMatter } from "@/lib/auth/employerSupportAccess";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

function matterIdFrom(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = matterIdFrom(id);
  if (!matterId) return NextResponse.json({ success:false, error:"Invalid Matter reference." }, { status:400 });

  const gate = await requireEmployerSupportMatter(matterId);
  if (!gate.ok) return NextResponse.json({ success:false, error:"Matter unavailable." }, { status:gate.status });

  const supabase = createAdminClient();
  const { data:matter, error:matterError } = await (supabase as any).from("matters").select("id,description")
    .eq("id",matterId).eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle();
  if (matterError) return NextResponse.json({ success:false, error:"The Matter conversation could not be loaded." }, { status:500 });
  if (!matter) return NextResponse.json({ success:false, error:"Matter unavailable." }, { status:404 });

  const { data, error } = await (supabase as any).from("matter_messages")
    .select("id,matter_id,role,content,created_at").eq("matter_id",matterId)
    .order("created_at",{ascending:true}).order("id",{ascending:true});
  if (error) return NextResponse.json({ success:false, error:"The Matter conversation could not be loaded." }, { status:500 });

  let messages=data??[];
  if(messages.length===0 && matter.description?.trim()){
    const seeded=await (supabase as any).from("matter_messages").insert({matter_id:matterId,role:"user",content:matter.description.trim()})
      .select("id,matter_id,role,content,created_at").single();
    if(seeded.error) return NextResponse.json({success:false,error:"The Matter conversation could not be prepared."},{status:500});
    if(seeded.data) messages=[seeded.data];
  }
  return NextResponse.json({success:true,messages});
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const matterId = matterIdFrom(id);
  if (!matterId) return NextResponse.json({ success:false, error:"Invalid Matter reference." }, { status:400 });

  const gate = await requireEmployerSupportMatter(matterId);
  if (!gate.ok) return NextResponse.json({ success:false, error:"Matter unavailable." }, { status:gate.status });

  const supabase = createAdminClient();
  const { data:matter, error:matterError } = await (supabase as any).from("matters").select("id,status").eq("id",matterId)
    .eq("organisation_id",gate.access.organisationId).eq("product_source","employer_support").maybeSingle();
  if(matterError) return NextResponse.json({success:false,error:"The Matter could not be checked before saving the message."},{status:500});
  if(!matter) return NextResponse.json({success:false,error:"Matter unavailable."},{status:404});
  if(String(matter.status).toLowerCase()==="completed") return NextResponse.json({success:false,error:"This matter is closed and its conversation is read-only."},{status:409});

  const body=await request.json().catch(()=>null) as {role?:unknown;content?:unknown}|null;
  const role=body?.role==="leo"?"leo":body?.role==="user"?"user":null;
  const content=typeof body?.content==="string"?body.content.trim().slice(0,12000):"";
  if(!role||!content) return NextResponse.json({success:false,error:"Role and content are required."},{status:400});

  const {data,error}=await (supabase as any).from("matter_messages").insert({matter_id:matterId,role,content})
    .select("id,matter_id,role,content,created_at").single();
  if(error||!data) return NextResponse.json({success:false,error:"The Matter message could not be saved."},{status:500});
  return NextResponse.json({success:true,message:data},{status:201});
}
