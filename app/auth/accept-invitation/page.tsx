"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Invitation = {
  id: string;
  email: string;
  role: string;
  organisationId: string;
  organisationName: string;
  expiresAt: string;
};

function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AcceptInvitationPage() {
  const router = useRouter();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function establishInvitationSession() {
      const currentUrl = new URL(window.location.href);
      const code = currentUrl.searchParams.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          throw exchangeError;
        }

        currentUrl.searchParams.delete("code");
        window.history.replaceState({}, "", currentUrl.toString());
      }

      const hashParameters = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const accessToken = hashParameters.get("access_token");
      const refreshToken = hashParameters.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        let subscription:
          | ReturnType<typeof supabase.auth.onAuthStateChange>["data"]["subscription"]
          | null = null;

        const timeout = window.setTimeout(() => {
          subscription?.unsubscribe();
          reject(
            new Error(
              "Your invitation session could not be opened. Please use the newest invitation email.",
            ),
          );
        }, 5000);

        const authListener = supabase.auth.onAuthStateChange(
          (_event, nextSession) => {
            if (!nextSession) {
              return;
            }

            window.clearTimeout(timeout);
            authListener.data.subscription.unsubscribe();
            resolve();
          },
        );

        subscription = authListener.data.subscription;
      });
    }

    async function loadInvitation() {
      try {
        await establishInvitationSession();

        const response = await fetch(
          "/api/organisation/invitations/accept",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: { Accept: "application/json" },
          },
        );

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload?.error || "The invitation could not be loaded.",
          );
        }

        if (active) {
          setInvitation(payload.invitation);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "The invitation could not be loaded.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInvitation();

    return () => {
      active = false;
    };
  }, []);

  async function acceptInvitation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter your first name and last name.");
      return;
    }

    if (password.length < 8) {
      setError("Create a password containing at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const { error: passwordError } =
        await supabase.auth.updateUser({
          password,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
          },
        });

      if (passwordError) {
        throw passwordError;
      }

      const response = await fetch(
        "/api/organisation/invitations/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || "The invitation could not be accepted.",
        );
      }

      router.replace(payload?.redirectTo || "/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The invitation could not be accepted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <div className="brand">
          <Image
            src="/leo-logo.png"
            alt="LEO HR"
            width={145}
            height={66}
            priority
          />
        </div>

        {loading ? (
          <div className="state">
            <div className="spinner" />
            <h1>Opening your invitation</h1>
            <p>Please wait while LEO verifies your secure invitation.</p>
          </div>
        ) : error && !invitation ? (
          <div className="state">
            <span className="badge error-badge">Invitation unavailable</span>
            <h1>We could not open this invitation</h1>
            <p>{error}</p>
          </div>
        ) : invitation ? (
          <>
            <div className="heading">
              <span className="badge">Organisation invitation</span>
              <h1>Join {invitation.organisationName}</h1>
              <p>
                Complete your account details to access LEO as a{" "}
                <strong>{roleLabel(invitation.role)}</strong>.
              </p>
            </div>

            <div className="summary">
              <div>
                <span>Email</span>
                <strong>{invitation.email}</strong>
              </div>
              <div>
                <span>Access level</span>
                <strong>{roleLabel(invitation.role)}</strong>
              </div>
            </div>

            <form onSubmit={acceptInvitation}>
              <div className="row">
                <label>
                  <span>First name</span>
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    autoComplete="given-name"
                    disabled={submitting}
                  />
                </label>

                <label>
                  <span>Last name</span>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    autoComplete="family-name"
                    disabled={submitting}
                  />
                </label>
              </div>

              <label>
                <span>Create password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={submitting}
                />
              </label>

              <label>
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  disabled={submitting}
                />
              </label>

              {error ? (
                <div className="error" role="alert">
                  {error}
                </div>
              ) : null}

              <button type="submit" disabled={submitting}>
                {submitting
                  ? "Joining organisation..."
                  : "Accept invitation and continue"}
              </button>
            </form>

            <p className="note">
              This invitation joins an existing organisation. It does not
              create a customer account or a new subscription.
            </p>
          </>
        ) : null}
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 28px;
          background:
            radial-gradient(
              circle at 12% 10%,
              rgba(205, 178, 226, 0.28),
              transparent 32%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(221, 246, 236, 0.72),
              transparent 30%
            ),
            #f8f5fb;
          color: #172036;
        }

        .card {
          width: min(680px, 100%);
          padding: 38px;
          border: 1px solid rgba(110, 80, 132, 0.14);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.97);
          box-shadow: 0 24px 70px rgba(55, 37, 73, 0.12);
        }

        .brand {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .brand :global(img) {
          width: 118px;
          height: auto;
        }

        .heading,
        .state {
          text-align: center;
        }

        .badge {
          display: inline-flex;
          margin-bottom: 14px;
          padding: 7px 11px;
          border: 1px solid #e2d6eb;
          border-radius: 999px;
          background: #f8f3fc;
          color: #6e5084;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .error-badge {
          border-color: #efcbd0;
          background: #fff5f6;
          color: #a43b49;
        }

        h1 {
          margin: 0 0 10px;
          font-size: clamp(30px, 5vw, 42px);
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .heading p,
        .state p {
          margin: 0;
          color: #6f7888;
          line-height: 1.6;
        }

        .summary {
          margin: 26px 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .summary div {
          padding: 14px;
          border: 1px solid #e8dff0;
          border-radius: 13px;
          background: #fcfafe;
        }

        .summary span,
        label span {
          display: block;
          margin-bottom: 6px;
          color: #747d8d;
          font-size: 12px;
          font-weight: 700;
        }

        .summary strong {
          display: block;
          overflow-wrap: anywhere;
          font-size: 14px;
        }

        form {
          display: grid;
          gap: 16px;
        }

        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        input {
          width: 100%;
          min-height: 49px;
          padding: 0 14px;
          border: 1px solid #d9cee7;
          border-radius: 11px;
          background: #fff;
          color: #172036;
          font: inherit;
          outline: none;
        }

        input:focus {
          border-color: #7444a6;
          box-shadow: 0 0 0 4px rgba(110, 80, 132, 0.11);
        }

        .error {
          padding: 12px 13px;
          border: 1px solid #edc7cd;
          border-radius: 10px;
          background: #fff5f6;
          color: #9f3342;
          font-size: 13px;
          line-height: 1.5;
        }

        button {
          min-height: 51px;
          border: 0;
          border-radius: 11px;
          background: linear-gradient(135deg, #755194, #62407f);
          color: #fff;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(87, 55, 116, 0.2);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .note {
          margin: 20px 0 0;
          color: #7a8291;
          font-size: 12px;
          line-height: 1.55;
          text-align: center;
        }

        .spinner {
          width: 34px;
          height: 34px;
          margin: 8px auto 22px;
          border: 3px solid #e6dceb;
          border-top-color: #6e5084;
          border-radius: 999px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 600px) {
          .page {
            padding: 16px;
          }

          .card {
            padding: 26px 20px;
            border-radius: 18px;
          }

          .summary,
          .row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}