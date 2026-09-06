"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string | null; client_id?: string | null } | null;
};

export default function OAuthConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const authorizationId = searchParams.get("authorization_id") || "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [authorizationId]);

  async function load() {
    try {
      if (!authorizationId) {
        throw new Error("The ChatGPT authorisation request is missing its secure request ID.");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        const returnTo = encodeURIComponent(window.location.href);
        router.replace(`/login?returnTo=${returnTo}`);
        return;
      }

      const { data, error: detailsError } =
        await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

      if (detailsError || !data) {
        throw detailsError || new Error("The ChatGPT authorisation request is unavailable.");
      }

      setDetails(data as AuthorizationDetails);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The connection request could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(approved: boolean) {
    if (!authorizationId) return;

    setSubmitting(true);
    setError("");

    try {
      if (approved) {
        const clientId = details?.client?.client_id || null;
        const clientName = details?.client?.name || "ChatGPT";
        const approvalResponse = await fetch("/api/foundations/connections/chatgpt/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId, clientName }),
        });

        const approvalResult = await approvalResponse.json();
        if (!approvalResponse.ok || !approvalResult.success) {
          throw new Error(approvalResult.error || "Leo could not approve the ChatGPT connection.");
        }
      }

      const { data, error: decisionError } = approved
        ? await supabase.auth.oauth.approveAuthorization(authorizationId)
        : await supabase.auth.oauth.denyAuthorization(authorizationId);

      if (decisionError || !data?.redirect_url) {
        throw decisionError || new Error("The authorisation decision could not be completed.");
      }

      window.location.assign(data.redirect_url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The authorisation decision could not be completed.");
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F7F1FC", padding: "48px 20px", fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: 640, margin: "0 auto", background: "white", borderRadius: 20, padding: 32, boxShadow: "0 18px 50px rgba(62, 39, 77, 0.12)" }}>
        <div style={{ color: "#6E5084", fontWeight: 800, letterSpacing: 0.4 }}>LEO HR™</div>
        <h1 style={{ margin: "12px 0 10px", fontSize: 30 }}>Connect ChatGPT to Leo</h1>

        {loading ? (
          <p>Loading secure connection request…</p>
        ) : (
          <>
            <p style={{ lineHeight: 1.6, color: "#4b4550" }}>
              {details?.client?.name || "ChatGPT"} is asking to use Leo as a business assistant connection for your organisation.
            </p>

            <div style={{ margin: "24px 0", padding: 20, background: "#F7F1FC", borderRadius: 14 }}>
              <strong>Initial access is deliberately read-only.</strong>
              <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
                ChatGPT can read approved Company Profile, Employment Framework, Organisation Structure and Company Knowledge information. It cannot edit employees, matters, policies, compliance records, billing, permissions or Leo platform settings.
              </p>
            </div>

            {error && <div style={{ marginBottom: 18, color: "#9b1c1c" }}>{error}</div>}

            {!error && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" disabled={submitting} onClick={() => void decide(true)} style={{ border: 0, borderRadius: 10, padding: "12px 18px", background: "#6E5084", color: "white", fontWeight: 700, cursor: "pointer" }}>
                  {submitting ? "Connecting…" : "Approve connection"}
                </button>
                <button type="button" disabled={submitting} onClick={() => void decide(false)} style={{ border: "1px solid #cfc7d4", borderRadius: 10, padding: "12px 18px", background: "white", color: "#3d3541", fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
