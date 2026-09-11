"use client";

import { useState } from "react";

type CareCheckState = {
  provider?: string | null;
  environment?: string | null;
  applicationReference?: string | null;
  invitedAt?: string | null;
  lastCheckedAt?: string | null;
  statusCode?: string | null;
  statusDescription?: string | null;
  isCurrentStatus?: boolean | null;
  vacancyDbsLevel?: string | null;
};

type CareCheckDBSPanelProps = {
  profileId: string;
  candidateEmail?: string | null;
  required: boolean;
  dbsLevel?: string | null;
  careCheck?: CareCheckState | null;
  canManage: boolean;
  onUpdated: () => Promise<void> | void;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Not recorded";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function CareCheckDBSPanel({
  profileId,
  candidateEmail,
  required,
  dbsLevel,
  careCheck,
  canManage,
  onUpdated,
}: CareCheckDBSPanelProps) {
  const [busy, setBusy] = useState<"invite" | "refresh" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applicationReference = careCheck?.applicationReference?.trim() || "";
  const hasApplication = Boolean(applicationReference);

  async function run(action: "invite" | "refresh_status") {
    setBusy(action === "invite" ? "invite" : "refresh");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/talent/due-diligence/${profileId}/carecheck`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "CareCheck could not complete the requested action.",
        );
      }

      setMessage(
        action === "invite"
          ? "CareCheck invite sent and tracking connected."
          : "CareCheck status refreshed.",
      );

      await onUpdated();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "CareCheck could not complete the requested action.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      style={{
        marginBottom: "16px",
        border: "1px solid #DDCDEB",
        borderRadius: "16px",
        background: "#FBF8FD",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: "#6E5084",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            CareCheck
          </div>
          <h3
            style={{
              margin: "5px 0 0",
              color: "#3B3040",
              fontSize: "16px",
            }}
          >
            DBS provider tracking
          </h3>
          <p
            style={{
              margin: "6px 0 0",
              maxWidth: "680px",
              color: "#756A79",
              fontSize: "12px",
              lineHeight: 1.55,
            }}
          >
            Send the candidate to CareCheck and keep the current provider
            status connected to this due-diligence record.
          </p>
        </div>

        <span
          style={{
            border: "1px solid #DCCBE7",
            borderRadius: "999px",
            background: "#F7F1FC",
            color: "#6E5084",
            padding: "6px 9px",
            fontSize: "10px",
            fontWeight: 800,
          }}
        >
          Development
        </span>
      </div>

      {!required ? (
        <div
          style={{
            marginTop: "14px",
            color: "#7B707F",
            fontSize: "12px",
          }}
        >
          This vacancy is not marked as requiring a DBS check.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <Info
              label="Vacancy DBS level"
              value={dbsLevel || "Not set"}
            />
            <Info
              label="Candidate email"
              value={candidateEmail || "Not recorded"}
            />
            <Info
              label="CareCheck reference"
              value={applicationReference || "Not sent"}
            />
            <Info
              label="Current status"
              value={
                careCheck?.statusDescription ||
                careCheck?.statusCode ||
                "Not sent"
              }
            />
            <Info
              label="Invite sent"
              value={formatDateTime(careCheck?.invitedAt)}
            />
            <Info
              label="Last checked"
              value={formatDateTime(careCheck?.lastCheckedAt)}
            />
          </div>

          {message ? (
            <div
              style={{
                marginTop: "12px",
                border: "1px solid #CFE6D8",
                borderRadius: "10px",
                background: "#F5FCF8",
                color: "#527460",
                padding: "10px 12px",
                fontSize: "11px",
              }}
            >
              {message}
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                marginTop: "12px",
                border: "1px solid #E8CBD2",
                borderRadius: "10px",
                background: "#FFF7F8",
                color: "#8B4E5D",
                padding: "10px 12px",
                fontSize: "11px",
              }}
            >
              {error}
            </div>
          ) : null}

          {canManage ? (
            <div
              style={{
                display: "flex",
                gap: "9px",
                flexWrap: "wrap",
                marginTop: "14px",
              }}
            >
              {!hasApplication ? (
                <button
                  type="button"
                  disabled={busy !== null || !candidateEmail}
                  onClick={() => void run("invite")}
                  style={{
                    border: "1px solid #6E5084",
                    borderRadius: "9px",
                    background: "#6E5084",
                    color: "#FFFFFF",
                    padding: "9px 12px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor:
                      busy !== null || !candidateEmail
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      busy !== null || !candidateEmail ? 0.55 : 1,
                  }}
                >
                  {busy === "invite"
                    ? "Sending..."
                    : "Send CareCheck invite"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void run("refresh_status")}
                  style={{
                    border: "1px solid #6E5084",
                    borderRadius: "9px",
                    background: "#FFFFFF",
                    color: "#6E5084",
                    padding: "9px 12px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: busy !== null ? "not-allowed" : "pointer",
                    opacity: busy !== null ? 0.55 : 1,
                  }}
                >
                  {busy === "refresh"
                    ? "Refreshing..."
                    : "Refresh CareCheck status"}
                </button>
              )}
            </div>
          ) : null}

          {!candidateEmail && !hasApplication ? (
            <div
              style={{
                marginTop: "10px",
                color: "#8A5B65",
                fontSize: "11px",
              }}
            >
              Add the candidate email address before sending an invite.
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #E9E1ED",
        borderRadius: "10px",
        background: "#FFFFFF",
        padding: "11px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: "#817586",
          fontSize: "9px",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "5px",
          color: "#443848",
          fontSize: "11px",
          fontWeight: 700,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}
