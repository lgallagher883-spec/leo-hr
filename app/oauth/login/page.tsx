"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function OAuthLoginPage() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) throw result.error;

      const requestedReturnTo = searchParams.get("returnTo") || "/dashboard/foundations/connections";
      const returnTo = requestedReturnTo.startsWith(window.location.origin)
        ? requestedReturnTo
        : requestedReturnTo.startsWith("/")
          ? `${window.location.origin}${requestedReturnTo}`
          : `${window.location.origin}/dashboard/foundations/connections`;

      window.location.assign(returnTo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in to Leo.");
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F7F1FC", padding: "48px 20px", fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: 520, margin: "0 auto", background: "white", borderRadius: 20, padding: 32, boxShadow: "0 18px 50px rgba(62, 39, 77, 0.12)" }}>
        <div style={{ color: "#6E5084", fontWeight: 800 }}>LEO HR™</div>
        <h1>Sign in to approve ChatGPT</h1>
        <p style={{ color: "#4b4550", lineHeight: 1.6 }}>Use your existing Leo account. After sign-in, Leo will return you to the ChatGPT connection approval screen.</p>

        <form onSubmit={signIn}>
          <label style={{ display: "block", marginTop: 20, fontWeight: 700 }}>Business email</label>
          <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} style={{ width: "100%", boxSizing: "border-box", marginTop: 8, padding: 12, border: "1px solid #cfc7d4", borderRadius: 10 }} />

          <label style={{ display: "block", marginTop: 16, fontWeight: 700 }}>Password</label>
          <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ width: "100%", boxSizing: "border-box", marginTop: 8, padding: 12, border: "1px solid #cfc7d4", borderRadius: 10 }} />

          {error && <div style={{ color: "#9b1c1c", marginTop: 16 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ marginTop: 22, border: 0, borderRadius: 10, padding: "12px 18px", background: "#6E5084", color: "white", fontWeight: 700, cursor: "pointer" }}>
            {loading ? "Signing in…" : "Continue securely"}
          </button>
        </form>
      </section>
    </main>
  );
}
