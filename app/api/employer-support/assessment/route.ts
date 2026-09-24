import { NextResponse } from "next/server";

import { EmployerSupportAccessLookupError, getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import { buildEmployerSupportPrePurchasePrompt } from "@/lib/employer-support/prePurchasePrompt";

export async function POST(request: Request) {
  let access;
  try {
    access = await getEmployerSupportAccess();
  } catch (error) {
    if (error instanceof EmployerSupportAccessLookupError) {
      return NextResponse.json({success:false,error:"Your Employer Support access could not be checked just now. Please try again."},{status:503});
    }
    throw error;
  }
  if (!access) return NextResponse.json({ success:false,error:"Please sign in to continue." },{status:401});

  const body=await request.json().catch(()=>null) as {issue?:unknown}|null;
  const issue=typeof body?.issue==="string"?body.issue.trim():"";
  if(issue.length<20) return NextResponse.json({success:false,error:"Please tell Leo a little more about what has happened."},{status:400});
  if(issue.length>6000) return NextResponse.json({success:false,error:"Please keep the initial description under 6,000 characters. You can add the full detail once your Matter begins."},{status:400});

  try {
    const apiKey=process.env.OPENAI_API_KEY?.trim()??"";
    if(!apiKey) return NextResponse.json({success:false,error:"Leo's assessment service is not configured just now."},{status:503});
    const OpenAI=(await import("openai")).default;
    const client=new OpenAI({apiKey});
    const completion=await client.chat.completions.create({
      model:"gpt-4o",
      temperature:0.35,
      messages:[
        {role:"system",content:buildEmployerSupportPrePurchasePrompt(issue)},
        {role:"user",content:"Explain how Ask Leo Employer Support can help me with this situation."},
      ],
    });
    const assessment=completion.choices[0]?.message?.content?.trim();
    if(!assessment) throw new Error("No assessment returned");
    return NextResponse.json({success:true,assessment});
  } catch(error) {
    console.error("Employer Support pre-purchase assessment failed:",error);
    return NextResponse.json({success:false,error:"Leo could not assess the issue just now. Please try again."},{status:500});
  }
}
