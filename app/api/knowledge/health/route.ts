import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "NEXT_PUBLIC_SUPABASE_URL is missing.",
        },
        { status: 500 }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: "SUPABASE_SERVICE_ROLE_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { count, error } = await supabase
      .from("knowledge_chunks")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "LEO Knowledge storage connection is working.",
      knowledgeChunkCount: count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown knowledge connection error.",
      },
      { status: 500 }
    );
  }
}