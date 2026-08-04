"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

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
    <main className={styles["login-page"]}>
      <div className={styles["top-bar"]}>
        <p className={styles["register-prompt"]}>
    New to Leo HR™?{" "}
    <Link href="/register" className={styles["text-link"]}>
      Create an account
    </Link>
  </p>
      </div>

      <section className={styles["login-shell"]}>
        <div className={styles["welcome-panel"]}>
          <div className={styles["welcome-content"]}>
            <div className={styles["eyebrow"]}>Leo HR™</div>

            <h1>Welcome back</h1>

            <p className={styles["welcome-copy"]}>
              Sign in to continue managing your people, workplace matters,
              compliance and development from one connected platform.
            </p>

            <div className={styles["support-card"]}>
              <div className={styles["support-icon"]}>
                <ShieldIcon />
              </div>

              <div>
                <strong>Secure access to your organisation</strong>
                <p>
                  Your account and organisation data remain protected by
                  Leo HR™ platform security controls.
                </p>
              </div>
            </div>
          </div>

          <div className={styles["welcome-decoration"]} aria-hidden="true">
            <span
              className={`${styles["decoration-circle"]} ${styles["decoration-circle-one"]}`}
            />
            <span
              className={`${styles["decoration-circle"]} ${styles["decoration-circle-two"]}`}
            />
            <span
              className={`${styles["decoration-circle"]} ${styles["decoration-circle-three"]}`}
            />
          </div>
        </div>

        <div className={styles["form-panel"]}>
          <div className={styles["form-heading"]}>
            <span className={styles["form-kicker"]}>Secure sign in</span>
            <h2>Sign in to Leo HR™</h2>
            <p>Enter the details linked to your Leo HR™ account.</p>
          </div>

          <form onSubmit={signIn} noValidate>
            <div className={styles["field"]}>
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

            <div className={styles["field"]}>
              <label htmlFor="password">Password</label>

              <div className={styles["password-field"]}>
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
                  className={styles["show-password"]}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <div className={styles["forgot-row"]}>
                <Link href="/forgot-password" className={styles["forgot-link"]}>
                  Forgot your password?
                </Link>
              </div>
            </div>

            {error ? (
              <div className={styles["error-message"]} role="alert">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className={styles["sign-in-button"]}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className={styles["security-note"]}>
              <ShieldIcon />
              Protected by Leo HR™ platform security
            </p>
          </form>

          <div className={styles["mobile-register"]}>
            New to Leo HR™?{" "}
            <Link href="/register" className={styles["text-link"]}>
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles["legal-footer"]}>
        <span>© 2026 Leo HR™ LTD</span>
        <Link href="/privacy" className={styles["footer-link"]}>
          Privacy
        </Link>
        <Link href="/terms" className={styles["footer-link"]}>
          Terms
        </Link>
      </footer>
    </main>
  );
}