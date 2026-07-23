"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.6" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 18 18" /><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.4 15.4 0 0 1-3.2 3.8" /><path d="M6.2 6.3A15.6 15.6 0 0 0 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.5-.7" /><path d="M9.9 9.8a3 3 0 0 0 4.2 4.3" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function initialiseRecovery() {
      try {
        const code = searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) setValidSession(Boolean(data.session));
      } catch {
        if (mounted) setValidSession(false);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    initialiseRecovery();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setValidSession(true);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [searchParams]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      setSuccess(true);
      window.setTimeout(() => {
        router.push("/login?password-reset=success");
        router.refresh();
      }, 1200);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not update your password. Please request a new recovery link.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="top-bar">
        <Link href="/" className="logo-link" aria-label="LEO HR home">
          <Image src="/leo-logo.png" alt="LEO HR" width={150} height={68} priority className="leo-logo" />
        </Link>
      </header>

      <section className="auth-card">
        <span className="form-kicker">Secure account recovery</span>

        {checking ? (
          <div className="state" role="status">
            <h1>Checking your recovery link</h1>
            <p>Please wait while LEO™ securely validates the link.</p>
          </div>
        ) : !validSession ? (
          <div className="state" role="alert">
            <h1>This recovery link is no longer valid</h1>
            <p>The link may have expired or already been used. Request a new password reset email to continue.</p>
            <Link href="/forgot-password" className="primary-link">Request a new link</Link>
            <Link href="/login" className="secondary-link">Return to sign in</Link>
          </div>
        ) : success ? (
          <div className="state" role="status">
            <h1>Password updated</h1>
            <p>Your password has been changed securely. You are being returned to the sign-in page.</p>
          </div>
        ) : (
          <>
            <div className="heading">
              <h1>Create a new password</h1>
              <p>Choose a new password for your LEO™ account.</p>
            </div>

            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="password">New password</label>
                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                  />
                  <button type="button" className="show-password" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="confirmPassword">Confirm new password</label>
                <div className="password-field">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                  />
                  <button type="button" className="show-password" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
              </div>

              <p className="password-guidance">Use at least 8 characters. A longer, unique password is strongly recommended.</p>

              {error ? <div className="error-message" role="alert">{error}</div> : null}

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? "Updating password..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </section>

      <footer className="legal-footer">
        <span>© 2026 LEO HR LTD</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>

      <style jsx>{`
        * { box-sizing:border-box; }
        .auth-page { min-height:100dvh; padding:18px; display:flex; flex-direction:column; background:radial-gradient(circle at 10% 10%,rgba(205,178,226,.24),transparent 32%),radial-gradient(circle at 90% 90%,rgba(221,246,236,.65),transparent 30%),#f8f5fb; color:#172036; }
        .top-bar { width:min(760px,100%); margin:0 auto 18px; }
        .logo-link { display:inline-flex; line-height:0; }
        .leo-logo { width:118px; height:auto; }
        .auth-card { width:min(560px,100%); margin:auto; padding:42px; border:1px solid rgba(110,80,132,.14); border-radius:22px; background:rgba(255,255,255,.97); box-shadow:0 24px 70px rgba(55,37,73,.11); }
        .form-kicker { display:inline-flex; align-items:center; min-height:28px; margin-bottom:16px; padding:0 11px; border:1px solid #e0d5ea; border-radius:999px; background:#f8f3fc; color:#6e5084; font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        h1,p { margin-top:0; }
        h1 { margin-bottom:10px; font-size:34px; line-height:1.08; letter-spacing:-.035em; }
        .heading { margin-bottom:26px; }
        .heading p,.state p { margin-bottom:0; color:#747d8d; font-size:14px; line-height:1.55; }
        form,.state { display:grid; gap:18px; }
        .field label { display:block; margin-bottom:8px; font-size:13px; font-weight:700; }
        .password-field { position:relative; }
        input { width:100%; min-height:50px; padding:0 50px 0 15px; border:1px solid #d9cee7; border-radius:11px; color:#172036; font:inherit; font-size:14px; outline:none; }
        input:focus { border-color:#7444a6; box-shadow:0 0 0 4px rgba(110,80,132,.11); }
        .show-password { position:absolute; top:50%; right:10px; width:34px; height:34px; display:grid; place-items:center; border:0; border-radius:8px; background:transparent; color:#7c8493; transform:translateY(-50%); cursor:pointer; }
        .show-password:hover { background:#f4eef9; color:#613897; }
        .password-guidance { margin:-7px 0 0; color:#7a8291; font-size:12px; line-height:1.5; }
        .error-message { padding:12px 13px; border:1px solid #edc7cd; border-radius:10px; background:#fff5f6; color:#9f3342; font-size:12px; line-height:1.5; }
        .primary-button,.primary-link { min-height:50px; display:flex; align-items:center; justify-content:center; border:0; border-radius:11px; background:linear-gradient(135deg,#755194 0%,#62407f 100%); color:#fff; font:inherit; font-size:14px; font-weight:800; text-decoration:none; cursor:pointer; box-shadow:0 10px 22px rgba(87,55,116,.18); }
        .primary-button:disabled { opacity:.62; cursor:not-allowed; box-shadow:none; }
        .secondary-link { justify-self:center; color:#684095; font-size:13px; font-weight:700; text-decoration:none; }
        .secondary-link:hover { text-decoration:underline; }
        .legal-footer { width:min(760px,100%); margin:18px auto 0; display:flex; justify-content:center; gap:16px; color:#8a91a0; font-size:11px; }
        .legal-footer a { color:#777f8f; font-weight:600; text-decoration:none; }
        @media (max-width:560px) { .auth-card{padding:30px 22px;border-radius:17px}h1{font-size:29px}.legal-footer{flex-wrap:wrap}.top-bar{text-align:center} }
      `}</style>
    </main>
  );
}