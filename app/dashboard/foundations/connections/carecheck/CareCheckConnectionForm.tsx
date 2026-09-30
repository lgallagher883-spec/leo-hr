"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CareCheckConnectionForm({
  connectionId,
}: {
  connectionId: number;
}) {
  const router = useRouter();
  const [environment, setEnvironment] = useState("production");
  const [organisationReference, setOrganisationReference] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(connectionId) || connectionId < 1) {
      setError("Open CareCheck from Foundations → Connections before configuring the account.");
      setLoadFailed(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadConnection() {
      try {
        const response = await fetch(
          `/api/foundations/connections/carecheck/configure?connectionId=${connectionId}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as {
          success?: boolean;
          connection?: {
            environment?: string;
            organisationReference?: string;
            credentialsConfigured?: boolean;
          };
        };

        if (!response.ok || !result.success || !result.connection) {
          throw new Error("CareCheck settings could not be loaded.");
        }

        if (!cancelled) {
          setEnvironment(result.connection.environment || "production");
          setOrganisationReference(result.connection.organisationReference || "");
          setCredentialsConfigured(result.connection.credentialsConfigured === true);
          setLoadFailed(false);
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
          setError(
            "CareCheck settings could not be loaded. Return to Connections and try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadConnection();
    return () => {
      cancelled = true;
    };
  }, [connectionId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!Number.isInteger(connectionId) || connectionId < 1) {
      setError("Open CareCheck from Foundations → Connections before configuring the account.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/foundations/connections/carecheck/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          environment,
          organisationReference,
          username,
          password,
        }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.error || "CareCheck could not be connected.");
      }
      setPassword("");
      setConnected(true);
      setMessage(
        result.message ||
          "CareCheck account saved securely. Return to Connections to run the connection test.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "CareCheck could not be connected.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
      <button type="button" onClick={() => router.push("/dashboard/foundations/connections")} style={{ border: 0, background: "transparent", cursor: "pointer", marginBottom: 20 }}>
        ← Back to Connections
      </button>
      <h1 style={{ color: "#6E5084", marginBottom: 8 }}>
        {credentialsConfigured ? "Update CareCheck" : "Connect CareCheck"}
      </h1>
      <p style={{ color: "#7D7D7D", lineHeight: 1.6 }}>
        Connect this organisation’s own CareCheck account. DBS and Right to Work checks will be processed under that employer’s CareCheck account, not Leo HR’s account.
      </p>
      <div style={{ background: "#F7F1FC", borderRadius: 12, padding: 16, margin: "20px 0" }}>
        The CareCheck username and password are encrypted server-side. After saving, the password is not returned to this page or displayed again.
      </div>
      {error && <div style={{ padding: 12, marginBottom: 16, border: "1px solid #b42318", borderRadius: 8 }}>{error}</div>}
      {message && <div style={{ padding: 12, marginBottom: 16, border: "1px solid #6E5084", borderRadius: 8 }}>{message}</div>}
      {connected ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => router.push("/dashboard/foundations/connections")}
            style={{ padding: "11px 18px", border: 0, borderRadius: 8, background: "#6E5084", color: "white", cursor: "pointer" }}
          >
            Return to Connections
          </button>
          <div style={{ alignSelf: "center", color: "#7D7D7D", fontSize: 13 }}>
            Use Test Connection there to check the saved CareCheck configuration.
          </div>
        </div>
      ) : null}
      {loading ? (
        <div style={{ color: "#7D7D7D", marginBottom: 16 }}>Loading CareCheck settings…</div>
      ) : null}
      <form onSubmit={submit} aria-busy={loading}>
        <label style={labelStyle}>Environment</label>
        <select value={environment} onChange={(event) => setEnvironment(event.target.value)} style={inputStyle}>
          <option value="production">Production</option>
          <option value="sandbox">Sandbox</option>
        </select>

        <label style={labelStyle}>CareCheck organisation reference</label>
        <input value={organisationReference} onChange={(event) => setOrganisationReference(event.target.value)} autoComplete="off" required style={inputStyle} />

        <label style={labelStyle}>CareCheck username</label>
        <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required style={inputStyle} />

        <label style={labelStyle}>CareCheck password</label>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required style={inputStyle} />

        <button type="submit" disabled={saving || connected || loading || loadFailed} style={{ marginTop: 20, padding: "11px 18px", border: 0, borderRadius: 8, background: "#6E5084", color: "white", cursor: saving || connected || loading || loadFailed ? "default" : "pointer", opacity: connected || loading || loadFailed ? 0.55 : 1 }}>
          {saving
            ? "Saving…"
            : connected
              ? "CareCheck saved"
              : credentialsConfigured
                ? "Update CareCheck"
                : "Connect CareCheck"}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: "block", marginTop: 18, marginBottom: 6, fontWeight: 600, color: "#6E5084" } as const;
const inputStyle = { width: "100%", padding: "11px 12px", border: "1px solid #d8d1dc", borderRadius: 8, background: "white" } as const;
