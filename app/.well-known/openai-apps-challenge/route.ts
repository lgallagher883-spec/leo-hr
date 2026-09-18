import { NextResponse } from "next/server";

const OPENAI_APPS_CHALLENGE_TOKEN =
  "_Tm4s8zLNdU5C_OTJ5HJvzaXjtPYfhdH_aZjSuysqog";

export async function GET() {
  return new NextResponse(OPENAI_APPS_CHALLENGE_TOKEN, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
