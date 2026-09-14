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
  disclosureType?: string | null;
  rtwCheckStatus?: string | null;
  rtwCheckDate?: string | null;
};

type Props = {
  profileId: string;
  candidateEmail?: string | null;
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

export default function CareCheckRTWPanel({
  profileId,
  candidateEmail,
  careCheck,
  canManage,
  onUpdated,
}: Props) {
  const [busy, setBusy] = useState<"invite" | "refresh" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applicationReference = careCheck?.applicationReference?.trim() || "";
  const hasApplication = Boolean(applicationReference);
  const developmentActionsAvailable = process.env.NODE_ENV !== "production";

  async function run(action: "invite" | "refresh_status") {
    setBusy(action === "invite" ? "invite" : "refresh");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/talent/due-diligence/${profileId}/carecheck-rtw`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error ||
            "CareCheck could not complete the requested Right to Work action.",
        );
      }

      setMessage(
        action === "invite"
          ? "CareCheck Right to Work invite sent and tracking connected."
          : "CareCheck Right to Work status refreshed.",
      );

      await onUpdated();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "CareCheck could not complete the requested Right to Work action.",
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
            Right to Work provider tracking
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
            Send the candidate a remote Right to Work check through CareCheck
            and keep the provider status linked to this due-diligence record.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          marginTop: "16px",
        }}
      >
        <Info label="Candidate email" value={candidateEmail || "Not recorded"} />
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
        <Info label="Invite sent" value={formatDateTime(careCheck?.invitedAt)} />
        <Info
          label="Last checked"
          value={formatDateTime(careCheck?.lastCheckedAt)}
        />
        <Info
          label="RTW result status"
          value={careCheck?.rtwCheckStatus || "Not yet reported"}
        />
        <Info
          label="RTW check date"
          value={careCheck?.rtwCheckDate || "Not yet reported"}
        />
      </div>

      <div
        style={{
          marginTop: "12px",
          border: "1px solid #E4D9EA",
          borderRadius: "10px",
          background: "#FFFFFF",
          color: "#746A79",
          padding: "10px 12px",
          fontSize: "11px",
          lineHeight: 1.5,
        }}
      >
        Leo keeps the CareCheck provider result separate from the employer&apos;s
        final Right to Work verification record. A provider completion will not
        automatically mark the person as verified until the result has been
        reviewed.
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

      {canManage && developmentActionsAvailable ? (
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
              style={buttonStyle(busy !== null || !candidateEmail, true)}
            >
              {busy === "invite"
                ? "Sending..."
                : "Send CareCheck RTW invite"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void run("refresh_status")}
              style={buttonStyle(busy !== null, false)}
            >
              {busy === "refresh"
                ? "Refreshing..."
                : "Refresh CareCheck RTW status"}
            </button>
          )}
        </div>
      ) : null}

      {!developmentActionsAvailable ? (
        <div
          style={{
            marginTop: "12px",
            color: "#7B707F",
            fontSize: "11px",
            lineHeight: 1.5,
          }}
        >
          Provider actions remain disabled in production until CareCheck issues
          Leo&apos;s production credentials and organisation reference.
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
    </section>
  );
}

function buttonStyle(disabled: boolean, primary: boolean) {
  return {
    border: "1px solid #6E5084",
    borderRadius: "9px",
    background: primary ? "#6E5084" : "#FFFFFF",
    color: primary ? "#FFFFFF" : "#6E5084",
    padding: "9px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
  } as const;
}

function Info({ label, value }: { label: string; value: string }) {
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
