import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PilotCodeRequest = {
  code?: unknown;
};

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: Request) {
  try {
    const configuredCode = process.env.PILOT_ACCESS_CODE?.trim();

    if (!configuredCode) {
      console.error("PILOT_ACCESS_CODE is not configured.");

      return NextResponse.json(
        {
          valid: false,
          error: "Pilot registration is not currently available.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as PilotCodeRequest;
    const submittedCode =
      typeof body.code === "string" ? body.code.trim() : "";

    if (!submittedCode) {
      return NextResponse.json(
        {
          valid: false,
          error: "Enter your pilot access code.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        valid: safeEqual(submittedCode, configuredCode),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Pilot code validation failed:", error);

    return NextResponse.json(
      {
        valid: false,
        error: "The pilot code could not be checked.",
      },
      { status: 500 },
    );
  }
}