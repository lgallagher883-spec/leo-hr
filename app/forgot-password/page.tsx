"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5.5 5.7v5.4c0 4.4 2.7 8 6.5 9.4 3.8-1.4 6.5-5 6.5-9.4V5.7L12 3Z" />
      <path d="m9.5 12 1.6 1.6 3.5-3.8" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalisedEmail = email.trim().toLowerCase();
    if (!normalisedEmail) {
      setError("Enter the email address linked to your LEO™ account.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalisedEmail,
        { redirectTo },
      );

      if (resetError) throw resetError;
      setSent(true);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not send the password reset email. Please try again.",
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
        <Link href="/login" className="text-link">Back to sign in</Link>
      </header>

      <section className="auth-shell">
        <div className="intro-panel">
          <div className="eyebrow">Account recovery</div>
          <h1>Reset your password</h1>
          <p>
            Enter the email address linked to your account and we will send you a secure recovery link.
          </p>

          <div className="support-card">
            <div className="support-icon"><ShieldIcon /></div>
            <div>
              <strong>Secure recovery</strong>
              <p>The recovery link can only be used to update the password for the account it was issued to.</p>
            </div>
          </div>
        </div>

        <div className="form-panel">
          {sent ? (
            <div className="success-state" role="status">
              <span className="form-kicker">Email sent</span>
              <h2>Check your inbox</h2>
              <p>
                If an account exists for <strong>{email.trim().toLowerCase()}</strong>, a password reset email has been sent.
              </p>
              <p className="help-text">Check your spam or junk folder if it does not arrive within a few minutes.</p>
              <button type="button" className="primary-button" onClick={() => setSent(false)}>
                Send another link
              </button>
              <Link href="/login" className="secondary-link">Return to sign in</Link>
            </div>
          ) : (
            <>
              <div className="form-heading">
                <span className="form-kicker">Forgotten password</span>
                <h2>Request a reset link</h2>
                <p>Use the business email address associated with your LEO™ account.</p>
              </div>

              <form onSubmit={submit} noValidate>
                <div className="field">
                  <label htmlFor="email">Business email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@business.co.uk"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError("");
                    }}
                    aria-invalid={Boolean(error)}
                    disabled={loading}
                  />
                </div>

                {error ? <div className="error-message" role="alert">{error}</div> : null}

                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? "Sending reset link..." : "Send reset link"}
                </button>

                <Link href="/login" className="secondary-link">Back to sign in</Link>
              </form>
            </>
          )}
        </div>
      </section>

      <footer className="legal-footer">
        <span>© 2026 LEO HR LTD</span>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </footer>

      <style jsx>{`
        * { box-sizing: border-box; }
        .auth-page { min-height: 100dvh; padding: 18px 38px 14px; background: radial-gradient(circle at 8% 8%, rgba(205,178,226,.22), transparent 30%), radial-gradient(circle at 92% 92%, rgba(221,246,236,.6), transparent 28%), #f8f5fb; color: #172036; }
        .top-bar { width: min(1180px,100%); margin: 0 auto 10px; display:flex; align-items:center; justify-content:space-between; }
        .logo-link { display:inline-flex; line-height:0; }
        .leo-logo { width:118px; height:auto; object-fit:contain; }
        .text-link, .secondary-link, .legal-footer a { color:#684095; font-weight:700; text-decoration:none; }
        .text-link:hover, .secondary-link:hover, .legal-footer a:hover { text-decoration:underline; }
        .auth-shell { width:min(1180px,100%); min-height:610px; margin:0 auto; display:grid; grid-template-columns:minmax(0,1.08fr) minmax(420px,.92fr); overflow:hidden; border:1px solid rgba(110,80,132,.12); border-radius:22px; background:rgba(255,255,255,.94); box-shadow:0 24px 70px rgba(55,37,73,.11),0 3px 14px rgba(55,37,73,.04); }
        .intro-panel { padding:58px; background:linear-gradient(150deg,rgba(110,80,132,.98),rgba(91,61,119,.97)); color:#fff; }
        .eyebrow,.form-kicker { display:inline-flex; align-items:center; min-height:28px; padding:0 11px; border-radius:999px; font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .eyebrow { margin-bottom:20px; border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.1); }
        .form-kicker { margin-bottom:12px; border:1px solid #e0d5ea; background:#f8f3fc; color:#6e5084; }
        h1,h2,p { margin-top:0; }
        h1 { margin-bottom:16px; font-size:clamp(42px,4.3vw,66px); line-height:.98; letter-spacing:-.045em; }
        .intro-panel>p { max-width:520px; margin-bottom:30px; color:rgba(255,255,255,.83); font-size:17px; line-height:1.65; }
        .support-card { max-width:480px; display:flex; gap:14px; padding:17px; border:1px solid rgba(255,255,255,.16); border-radius:14px; background:rgba(255,255,255,.08); }
        .support-icon { width:38px; height:38px; flex:0 0 auto; display:grid; place-items:center; border-radius:11px; background:rgba(255,255,255,.13); }
        .support-card strong { display:block; margin-bottom:5px; font-size:14px; }
        .support-card p { margin:0; color:rgba(255,255,255,.72); font-size:12px; line-height:1.5; }
        .form-panel { display:flex; flex-direction:column; justify-content:center; padding:44px 54px; background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(252,250,254,.98)); }
        .form-heading { margin-bottom:26px; }
        h2 { margin-bottom:8px; font-size:31px; line-height:1.08; letter-spacing:-.03em; }
        .form-heading p,.success-state p { color:#747d8d; font-size:14px; line-height:1.55; }
        form,.success-state { display:grid; gap:18px; }
        .field label { display:block; margin-bottom:8px; font-size:13px; font-weight:700; }
        input { width:100%; min-height:50px; padding:0 15px; border:1px solid #d9cee7; border-radius:11px; background:#fff; color:#172036; font:inherit; font-size:14px; outline:none; }
        input:focus { border-color:#7444a6; box-shadow:0 0 0 4px rgba(110,80,132,.11); }
        input[aria-invalid="true"] { border-color:#b84b59; background:#fffafb; }
        .error-message { padding:12px 13px; border:1px solid #edc7cd; border-radius:10px; background:#fff5f6; color:#9f3342; font-size:12px; line-height:1.5; }
        .primary-button { min-height:50px; border:0; border-radius:11px; background:linear-gradient(135deg,#755194 0%,#62407f 100%); color:#fff; font:inherit; font-size:14px; font-weight:800; cursor:pointer; box-shadow:0 10px 22px rgba(87,55,116,.18); }
        .primary-button:disabled { cursor:not-allowed; opacity:.62; box-shadow:none; }
        .secondary-link { justify-self:center; font-size:13px; }
        .help-text { margin-top:-8px !important; font-size:12px !important; }
        .legal-footer { width:min(1180px,100%); margin:10px auto 0; display:flex; justify-content:center; gap:16px; color:#8a91a0; font-size:11px; }
        @media (max-width:900px) { .auth-page{padding:18px}.auth-shell{grid-template-columns:1fr;min-height:0}.intro-panel{padding:38px 30px}.form-panel{padding:34px 30px}.support-card{display:none} }
        @media (max-width:560px) { .top-bar{justify-content:center}.top-bar>.text-link{display:none}.auth-shell{border-radius:17px}.intro-panel{padding:30px 22px}.form-panel{padding:30px 22px}h1{font-size:35px}h2{font-size:26px}.legal-footer{flex-wrap:wrap} }
      `}</style>
    </main>
  );
}