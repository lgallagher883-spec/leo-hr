"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Notice = {
  type: "success" | "error";
  message: string;
} | null;

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDisplayName(user: User | null) {
  if (!user) return "";

  const metadata = user.user_metadata ?? {};

  return (
    metadata.full_name ??
    metadata.name ??
    metadata.display_name ??
    ""
  );
}

export default function MyAccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      setLoading(true);
      setPageError("");

      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !currentUser) {
        setPageError(
          error?.message ||
            "Your account details could not be loaded. Please sign in again.",
        );
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setFullName(getDisplayName(currentUser));
      setLoading(false);
    }

    void loadAccount();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setProfileNotice({
        type: "error",
        message: "Enter your name before saving.",
      });
      return;
    }

    setSavingProfile(true);
    setProfileNotice(null);

    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        display_name: trimmedName,
      },
    });

    if (error) {
      setProfileNotice({
        type: "error",
        message: error.message,
      });
      setSavingProfile(false);
      return;
    }

    setUser(data.user);
    setFullName(getDisplayName(data.user));
    setProfileNotice({
      type: "success",
      message: "Your account details have been updated.",
    });
    setSavingProfile(false);
  }

  async function handlePasswordSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordNotice(null);

    if (newPassword.length < 8) {
      setPasswordNotice({
        type: "error",
        message: "Your new password must contain at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        type: "error",
        message: "The password confirmation does not match.",
      });
      return;
    }

    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordNotice({
        type: "error",
        message: error.message,
      });
      setSavingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordNotice({
      type: "success",
      message: "Your password has been changed successfully.",
    });
    setSavingPassword(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    setPageError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setPageError(error.message);
      setSigningOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="account-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Account</p>
            <h1>My Account</h1>
            <p>Loading your account details.</p>
          </div>
        </div>

        <section className="loading-card" aria-live="polite">
          <div className="loading-line loading-line-wide" />
          <div className="loading-line" />
          <div className="loading-line loading-line-short" />
        </section>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>My Account</h1>
          <p>
            Manage your personal details, password and access to the LEO
            platform.
          </p>
        </div>
      </div>

      {pageError ? (
        <div className="page-alert page-alert-error" role="alert">
          {pageError}
        </div>
      ) : null}

      <div className="account-grid">
        <section className="account-card">
          <div className="card-heading">
            <div>
              <p className="card-eyebrow">Personal details</p>
              <h2>Your profile</h2>
              <p>
                These details are attached to your authenticated LEO account.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="form-stack">
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                maxLength={120}
                disabled={savingProfile}
                required
              />
            </label>

            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={user?.email ?? ""}
                autoComplete="email"
                disabled
              />
              <small>
                Your sign-in email is managed through your authenticated
                account.
              </small>
            </label>

            {profileNotice ? (
              <div
                className={`inline-notice ${
                  profileNotice.type === "success"
                    ? "inline-notice-success"
                    : "inline-notice-error"
                }`}
                role={profileNotice.type === "error" ? "alert" : "status"}
              >
                {profileNotice.message}
              </div>
            ) : null}

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save account details"}
              </button>
            </div>
          </form>
        </section>

        <section className="account-card">
          <div className="card-heading">
            <div>
              <p className="card-eyebrow">Security</p>
              <h2>Change password</h2>
              <p>
                Choose a strong password that you do not use for another
                service.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSave} className="form-stack">
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                disabled={savingPassword}
                required
              />
            </label>

            <label className="field">
              <span>Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                disabled={savingPassword}
                required
              />
            </label>

            {passwordNotice ? (
              <div
                className={`inline-notice ${
                  passwordNotice.type === "success"
                    ? "inline-notice-success"
                    : "inline-notice-error"
                }`}
                role={passwordNotice.type === "error" ? "alert" : "status"}
              >
                {passwordNotice.message}
              </div>
            ) : null}

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={savingPassword}
              >
                {savingPassword ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        </section>

        <section className="account-card account-card-wide">
          <div className="card-heading">
            <div>
              <p className="card-eyebrow">Account information</p>
              <h2>Access details</h2>
              <p>
                A summary of the authenticated account currently using LEO.
              </p>
            </div>
          </div>

          <dl className="detail-grid">
            <div className="detail-item">
              <dt>Email status</dt>
              <dd>
                <span
                  className={
                    user?.email_confirmed_at
                      ? "status-pill status-pill-success"
                      : "status-pill status-pill-pending"
                  }
                >
                  {user?.email_confirmed_at
                    ? "Verified"
                    : "Verification pending"}
                </span>
              </dd>
            </div>

            <div className="detail-item">
              <dt>Account created</dt>
              <dd>{formatDate(user?.created_at)}</dd>
            </div>

            <div className="detail-item">
              <dt>Last sign-in</dt>
              <dd>{formatDate(user?.last_sign_in_at)}</dd>
            </div>

            <div className="detail-item">
              <dt>Account reference</dt>
              <dd className="reference-value">{user?.id ?? "Not available"}</dd>
            </div>
          </dl>
        </section>

        <section className="account-card account-card-wide sign-out-card">
          <div>
            <p className="card-eyebrow">Session</p>
            <h2>Sign out of LEO</h2>
            <p>
              End the current session on this device. You will need to sign in
              again to access the dashboard.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </section>
      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .account-page {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 8px 4px 40px;
    color: #2f2635;
  }

  .page-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
  }

  .eyebrow,
  .card-eyebrow {
    margin: 0 0 8px;
    color: #6e5084;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 8px;
    color: #2d2332;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.08;
    letter-spacing: -0.035em;
  }

  .page-heading p:not(.eyebrow) {
    max-width: 760px;
    margin-bottom: 0;
    color: #6d6371;
    font-size: 1rem;
    line-height: 1.65;
  }

  .page-alert {
    margin-bottom: 20px;
    padding: 14px 16px;
    border: 1px solid;
    border-radius: 14px;
    font-size: 0.94rem;
    line-height: 1.5;
  }

  .page-alert-error {
    border-color: #e7b9bf;
    background: #fff4f5;
    color: #8c2f3d;
  }

  .account-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }

  .account-card,
  .loading-card {
    border: 1px solid #e7dced;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 16px 36px rgba(74, 53, 84, 0.07);
  }

  .account-card {
    padding: 24px;
    overflow: hidden;
  }

  .account-card-wide {
    grid-column: 1 / -1;
  }

  .card-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 22px;
  }

  .card-heading h2,
  .sign-out-card h2 {
    margin-bottom: 8px;
    color: #33283a;
    font-size: 1.28rem;
    line-height: 1.25;
  }

  .card-heading p:not(.card-eyebrow),
  .sign-out-card p:not(.card-eyebrow) {
    margin-bottom: 0;
    color: #756a79;
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .form-stack {
    display: grid;
    gap: 18px;
  }

  .field {
    display: grid;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .field > span {
    color: #403546;
    font-size: 0.88rem;
    font-weight: 750;
  }

  .field input {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    min-height: 46px;
    padding: 11px 13px;
    border: 1px solid #d9cce2;
    border-radius: 12px;
    outline: none;
    background: #ffffff;
    color: #2f2635;
    font: inherit;
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      background 160ms ease;
  }

  .field input:focus {
    border-color: #6e5084;
    box-shadow: 0 0 0 4px rgba(110, 80, 132, 0.12);
  }

  .field input:disabled {
    cursor: not-allowed;
    background: #f7f3f9;
    color: #746c78;
  }

  .field small {
    color: #827786;
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .inline-notice {
    padding: 12px 14px;
    border: 1px solid;
    border-radius: 12px;
    font-size: 0.87rem;
    line-height: 1.45;
  }

  .inline-notice-success {
    border-color: #b9dfcf;
    background: #f3fff9;
    color: #27674d;
  }

  .inline-notice-error {
    border-color: #e7b9bf;
    background: #fff4f5;
    color: #8c2f3d;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 2px;
  }

  button {
    min-height: 42px;
    padding: 10px 16px;
    border-radius: 12px;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 800;
    transition:
      transform 150ms ease,
      box-shadow 150ms ease,
      opacity 150ms ease,
      background 150ms ease;
  }

  button:not(:disabled):hover {
    transform: translateY(-1px);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  .primary-button {
    border: 1px solid #6e5084;
    background: #6e5084;
    color: #ffffff;
    box-shadow: 0 8px 18px rgba(110, 80, 132, 0.2);
  }

  .primary-button:not(:disabled):hover {
    background: #5d4370;
    box-shadow: 0 10px 22px rgba(110, 80, 132, 0.25);
  }

  .secondary-button {
    flex: 0 0 auto;
    border: 1px solid #d2c0dc;
    background: #ffffff;
    color: #6e5084;
  }

  .secondary-button:not(:disabled):hover {
    background: #f8f2fb;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin: 0;
  }

  .detail-item {
    min-width: 0;
    padding: 16px;
    border: 1px solid #eadff0;
    border-radius: 14px;
    background: #fcf9fd;
  }

  .detail-item dt {
    margin-bottom: 7px;
    color: #7b7080;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.035em;
    text-transform: uppercase;
  }

  .detail-item dd {
    margin: 0;
    color: #372d3d;
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.45;
  }

  .reference-value {
    overflow-wrap: anywhere;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      monospace;
    font-size: 0.78rem !important;
    font-weight: 600 !important;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 0.76rem;
    font-weight: 800;
  }

  .status-pill-success {
    background: #eaf9f2;
    color: #27674d;
  }

  .status-pill-pending {
    background: #fff7e8;
    color: #845d19;
  }

  .sign-out-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .loading-card {
    padding: 28px;
  }

  .loading-line {
    width: 62%;
    height: 14px;
    margin-bottom: 14px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      #f0e8f4 25%,
      #f8f3fa 50%,
      #f0e8f4 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite linear;
  }

  .loading-line-wide {
    width: 82%;
    height: 18px;
  }

  .loading-line-short {
    width: 42%;
    margin-bottom: 0;
  }

  @keyframes shimmer {
    from {
      background-position: 200% 0;
    }

    to {
      background-position: -200% 0;
    }
  }

  @media (max-width: 960px) {
    .account-grid {
      grid-template-columns: 1fr;
    }

    .account-card-wide {
      grid-column: auto;
    }

    .detail-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .account-page {
      padding-bottom: 28px;
    }

    .account-card {
      padding: 20px;
      border-radius: 18px;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }

    .sign-out-card {
      align-items: stretch;
      flex-direction: column;
    }

    .secondary-button {
      width: 100%;
    }

    .form-actions {
      justify-content: stretch;
    }

    .primary-button {
      width: 100%;
    }
  }
`;