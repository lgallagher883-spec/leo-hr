"use client";

import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-[#F7F1FC] flex items-center justify-center p-8">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-10">

        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F1FC] text-3xl">
          ✉️
        </div>

        <h1 className="mb-3 text-3xl font-bold text-[#6E5084]">
          Verify your email
        </h1>

        <p className="mb-6 text-gray-600 leading-7">
          We've sent a verification email to your business email address.
          Please click the verification link before signing in to LEO.
        </p>

        <div className="rounded-xl border border-[#E6D8F2] bg-[#FBF8FE] p-5 mb-8">
          <h2 className="font-semibold text-[#6E5084] mb-2">
            What happens next?
          </h2>

          <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700">
            <li>Open the verification email.</li>
            <li>Click the verification link.</li>
            <li>Your LEO organisation will be created automatically.</li>
            <li>You'll be taken straight into your dashboard.</li>
          </ol>
        </div>

        <Link
          href="/login"
          className="block w-full rounded-lg bg-[#6E5084] py-3 text-center font-semibold text-white hover:opacity-90"
        >
          Return to sign in
        </Link>

      </div>
    </main>
  );
}