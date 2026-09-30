import { NextResponse } from "next/server";
import { sendCareCheckCandidateInvite } from "@/lib/carecheck/candidate-invite";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error: "CareCheck test invite route is disabled in production.",
      },
      { status: 404 },
    );
  }

  try {
    const testId = Date.now().toString();

    const result = await sendCareCheckCandidateInvite({
      externalReference: `LEOTEST${testId}`,
      candidateReference: `TEST${testId}`,
      candidateEmailAddress: "test@example.com",
      candidateFirstName: "Test",
      candidateSurname: "Candidate",
      checkType: "X",
      type: "DI",
    });

    return NextResponse.json({
      success: result.success,
      applicationReference: result.applicationReference,
      resultCode: result.resultCode,
      resultMessage: result.resultMessage,
    });
  } catch (error) {
    console.error("CareCheck test invite failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown CareCheck error",
      },
      { status: 500 },
    );
  }
}