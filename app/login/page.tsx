"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.6" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.4 15.4 0 0 1-3.2 3.8" />
      <path d="M6.2 6.3A15.6 15.6 0 0 0 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.5-.7" />
      <path d="M9.9 9.8a3 3 0 0 0 4.2 4.3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 5.5 5.7v5.4c0 4.4 2.7 8 6.5 9.4 3.8-1.4 6.5-5 6.5-9.4V5.7L12 3Z" />
      <path d="m9.5 12 1.6 1.6 3.5-3.8" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalisedEmail = email.trim().toLowerCase();

    if (!normalisedEmail || !password) {
      setError("Enter your business email and password.");
      return;
    }

    const supabase = createClient();

    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalisedEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in. Please check your details and try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="top-bar">
        <Link href="/" className="logo-link" aria-label="LEO HR home">
          <Image
            src="/leo-logo.png"
            alt="LEO HR"
            width={150}
            height={68}
            priority
            className="leo-logo"
          />
        </Link>

        <p className="register-prompt">
          New to LEO™?{" "}
          <Link href="/register" className="text-link">
            Create an account
          </Link>
        </p>
      </div>

      <section className="login-shell">
        <div className="welcome-panel">
          <div className="welcome-content">
            <div className="eyebrow">LEO HR</div>

            <h1>Welcome back</h1>

            <p className="welcome-copy">
              Sign in to continue managing your people, workplace matters,
              compliance and development from one connected platform.
            </p>

            <div className="support-card">
              <div className="support-icon">
                <ShieldIcon />
              </div>

              <div>
                <strong>Secure access to your organisation</strong>
                <p>
                  Your account and organisation data remain protected by
                  LEO™ platform security controls.
                </p>
              </div>
            </div>
          </div>

          <div className="welcome-decoration" aria-hidden="true">
            <span className="decoration-circle decoration-circle-one" />
            <span className="decoration-circle decoration-circle-two" />
            <span className="decoration-circle decoration-circle-three" />
          </div>
        </div>

        <div className="form-panel">
          <div className="form-heading">
            <span className="form-kicker">Account access</span>
            <h2>Sign in to LEO™</h2>
            <p>Enter the details linked to your LEO™ account.</p>
          </div>

          <form onSubmit={signIn} noValidate>
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

            <div className="field">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  aria-invalid={Boolean(error)}
                  disabled={loading}
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error ? (
              <div className="error-message" role="alert">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="sign-in-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="security-note">
              <ShieldIcon />
              Secure access powered by LEO™ HR
            </p>
          </form>

          <div className="mobile-register">
            New to LEO™?{" "}
            <Link href="/register" className="text-link">
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="legal-footer">
        <span>© 2026 LEO HR LTD</span>
        <Link href="/privacy" className="footer-link">
          Privacy
        </Link>
        <Link href="/terms" className="footer-link">
          Terms
        </Link>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .login-page {
          min-height: 100dvh;
          padding: 18px 38px 14px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 8% 8%,
              rgba(205, 178, 226, 0.22),
              transparent 30%
            ),
            radial-gradient(
              circle at 92% 92%,
              rgba(221, 246, 236, 0.6),
              transparent 28%
            ),
            #f8f5fb;
          color: #172036;
        }

        .top-bar {
          width: min(1180px, 100%);
          min-height: 34px;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-link {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          line-height: 0;
        }

        .leo-logo {
          width: 118px;
          height: auto;
          object-fit: contain;
        }

        .register-prompt {
          margin: 0;
          color: #6f7888;
          font-size: 13px;
        }

        .text-link,
        .forgot-link,
        .footer-link {
          color: #684095;
          font-weight: 700;
          text-decoration: none;
        }

        .text-link:hover,
        .forgot-link:hover,
        .footer-link:hover {
          text-decoration: underline;
        }

        .login-shell {
          width: min(1180px, 100%);
          height: calc(100dvh - 92px);
          max-height: 760px;
          min-height: 610px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
          overflow: hidden;
          border: 1px solid rgba(110, 80, 132, 0.12);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow:
            0 24px 70px rgba(55, 37, 73, 0.11),
            0 3px 14px rgba(55, 37, 73, 0.04);
        }

        .welcome-panel {
          position: relative;
          min-width: 0;
          padding: 58px;
          overflow: hidden;
          background:
            linear-gradient(
              150deg,
              rgba(110, 80, 132, 0.98),
              rgba(91, 61, 119, 0.97)
            );
          color: #fff;
        }

        .welcome-content {
          position: relative;
          z-index: 2;
          max-width: 540px;
        }

        .eyebrow,
        .form-kicker {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .eyebrow {
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.1);
          color: #f8f2fc;
        }

        h1,
        h2,
        p {
          margin-top: 0;
        }

        h1 {
          max-width: 480px;
          margin-bottom: 16px;
          font-size: clamp(42px, 4.3vw, 66px);
          line-height: 0.98;
          letter-spacing: -0.045em;
        }

        .welcome-copy {
          max-width: 520px;
          margin-bottom: 30px;
          color: rgba(255, 255, 255, 0.83);
          font-size: 17px;
          line-height: 1.65;
        }

        .support-card {
          max-width: 480px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 17px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
        }

        .support-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.13);
          color: #fff;
        }

        .support-card strong {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .support-card p {
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          line-height: 1.5;
        }

        .welcome-decoration {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .decoration-circle {
          position: absolute;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 999px;
        }

        .decoration-circle-one {
          width: 320px;
          height: 320px;
          right: -110px;
          top: -90px;
        }

        .decoration-circle-two {
          width: 220px;
          height: 220px;
          right: 52px;
          bottom: -110px;
        }

        .decoration-circle-three {
          width: 90px;
          height: 90px;
          right: 54px;
          top: 230px;
          background: rgba(255, 255, 255, 0.035);
        }

        .form-panel {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 44px 54px;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.98),
              rgba(252, 250, 254, 0.98)
            );
        }

        .form-heading {
          margin-bottom: 26px;
        }

        .form-kicker {
          margin-bottom: 12px;
          border: 1px solid #e0d5ea;
          background: #f8f3fc;
          color: #6e5084;
        }

        h2 {
          margin-bottom: 8px;
          color: #172036;
          font-size: 31px;
          line-height: 1.08;
          letter-spacing: -0.03em;
        }

        .form-heading p {
          margin-bottom: 0;
          color: #747d8d;
          font-size: 14px;
          line-height: 1.5;
        }

        form {
          display: grid;
          gap: 18px;
        }

        .field {
          min-width: 0;
        }

        .field label {
          display: block;
          margin-bottom: 8px;
          color: #172036;
          font-size: 13px;
          font-weight: 700;
        }

        .password-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .forgot-link {
          margin-bottom: 8px;
          font-size: 12px;
        }

        input {
          width: 100%;
          min-height: 50px;
          padding: 0 15px;
          border: 1px solid #d9cee7;
          border-radius: 11px;
          background: #fff;
          color: #172036;
          font: inherit;
          font-size: 14px;
          outline: none;
          box-shadow:
            0 1px 2px rgba(36, 28, 52, 0.02),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease,
            background 150ms ease;
        }

        input::placeholder {
          color: #9299a7;
        }

        input:hover {
          border-color: #c8b5dd;
        }

        input:focus {
          border-color: #7444a6;
          box-shadow:
            0 0 0 4px rgba(110, 80, 132, 0.11),
            0 5px 14px rgba(64, 43, 87, 0.05);
        }

        input[aria-invalid="true"] {
          border-color: #b84b59;
          background: #fffafb;
        }

        input:disabled {
          cursor: not-allowed;
          opacity: 0.68;
        }

        .password-field {
          position: relative;
        }

        .password-field input {
          padding-right: 50px;
        }

        .show-password {
          position: absolute;
          top: 50%;
          right: 10px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #7c8493;
          transform: translateY(-50%);
          cursor: pointer;
        }

        .show-password:hover,
        .show-password:focus-visible {
          background: #f4eef9;
          color: #613897;
          outline: none;
        }

        .show-password:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .error-message {
          margin-top: -4px;
          padding: 12px 13px;
          border: 1px solid #edc7cd;
          border-radius: 10px;
          background: #fff5f6;
          color: #9f3342;
          font-size: 12px;
          line-height: 1.5;
        }

        .sign-in-button {
          min-height: 50px;
          border: 0;
          border-radius: 11px;
          background:
            linear-gradient(135deg, #755194 0%, #62407f 100%);
          color: #fff;
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(87, 55, 116, 0.18);
          transition:
            transform 150ms ease,
            box-shadow 150ms ease,
            opacity 150ms ease;
        }

        .sign-in-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 13px 27px rgba(87, 55, 116, 0.24);
        }

        .sign-in-button:focus-visible {
          outline: 3px solid rgba(110, 80, 132, 0.2);
          outline-offset: 3px;
        }

        .sign-in-button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
          box-shadow: none;
        }

        .security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 0;
          color: #7a8291;
          font-size: 11.5px;
        }

        .security-note :global(svg) {
          width: 16px;
          height: 16px;
        }

        .mobile-register {
          display: none;
          margin-top: 22px;
          text-align: center;
          color: #727b8a;
          font-size: 13px;
        }

        .legal-footer {
          width: min(1180px, 100%);
          margin: 10px auto 0;
          display: flex;
          justify-content: center;
          gap: 16px;
          color: #8a91a0;
          font-size: 11px;
        }

        .footer-link {
          color: #777f8f;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .login-page {
            min-height: 100vh;
            padding: 18px;
            overflow: visible;
          }

          .top-bar {
            margin-bottom: 14px;
          }

          .login-shell {
            height: auto;
            min-height: 0;
            max-height: none;
            grid-template-columns: 1fr;
          }

          .welcome-panel {
            padding: 38px 30px;
          }

          h1 {
            font-size: 42px;
          }

          .welcome-copy {
            margin-bottom: 0;
            font-size: 15px;
          }

          .support-card {
            display: none;
          }

          .form-panel {
            padding: 34px 30px;
          }

          .legal-footer {
            flex-wrap: wrap;
          }
        }

        @media (max-width: 560px) {
          .top-bar {
            justify-content: center;
          }

          .leo-logo {
            width: 104px;
          }

          .register-prompt {
            display: none;
          }

          .login-shell {
            border-radius: 17px;
          }

          .welcome-panel {
            padding: 30px 22px;
          }

          h1 {
            margin-bottom: 10px;
            font-size: 35px;
          }

          .welcome-copy {
            font-size: 14px;
            line-height: 1.5;
          }

          .form-panel {
            padding: 30px 22px;
          }

          h2 {
            font-size: 26px;
          }

          .mobile-register {
            display: block;
          }

          .legal-footer {
            margin-top: 14px;
          }
        }

        @media (min-width: 901px) and (max-height: 730px) {
          .login-page {
            padding-top: 8px;
            padding-bottom: 8px;
          }

          .top-bar {
            margin-bottom: 7px;
          }

          .login-shell {
            height: calc(100dvh - 58px);
            min-height: 560px;
          }

          .welcome-panel {
            padding: 42px;
          }

          h1 {
            font-size: 52px;
          }

          .welcome-copy {
            margin-bottom: 22px;
            font-size: 15px;
          }

          .form-panel {
            padding-block: 28px;
          }

          .form-heading {
            margin-bottom: 18px;
          }

          form {
            gap: 14px;
          }

          input,
          .sign-in-button {
            min-height: 45px;
          }

          .legal-footer {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}