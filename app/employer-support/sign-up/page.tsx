"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../employer-support-auth.module.css";

export default function EmployerSupportSignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !organisationName.trim()) {
      setError("Enter your name and organisation name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid work email address.");
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Use at least 8 characters, including uppercase, lowercase and a number.");
      return;
    }
    if (!accepted) {
      setError("You must accept the terms and privacy notice.");
      return;
    }

    setLoading(true);
    try {
      const currentOrigin = window.location.origin;
      // Keep Employer Support confirmation on the exact host where sign-up began.
      // This is especially important for preview/test deployments and leaves the
      // existing Leo HR registration/login flow untouched.
      const appOrigin =
        currentOrigin === "https://leohr.co.uk" || currentOrigin === "https://www.leohr.co.uk"
          ? "https://app.leohr.co.uk"
          : currentOrigin;
      const confirmationRedirectTo = `${appOrigin}/employer-support/auth/confirm`;

      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: confirmationRedirectTo,
          data: {
            registration_source: "employer_support",
            registration_intent: "employer_support",
            plan_code: "employer_support",
            registration_plan_code: "employer_support",
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            organisation_name: organisationName.trim(),
            employee_count_band: employeeCount || null,
          },
        },
      });

      if (signUpError) {
        setError(
          signUpError.message.toLowerCase().includes("already registered")
            ? "An account already exists for this email address. Sign in instead."
            : signUpError.message,
        );
        return;
      }

      if (data.session) {
        window.location.assign("/employer-support/setup");
        return;
      }

      setSent(true);
    } catch {
      setError("Your account could not be created. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <Link className={styles.brand} href="/">Leo HR</Link>
        <p className={styles.eyebrow}>Ask Leo Employer Support</p>
        <h1>{sent ? "Check Your Email" : "Create Your Secure Employer Account"}</h1>
        {sent ? (
          <div className={styles.confirmation}>
            <p>We have sent a confirmation link to <strong>{email.trim().toLowerCase()}</strong>.</p>
            <p>Confirm your email to continue setting up your Matter.</p>
            <Link className={styles.primaryLink} href="/employer-support/sign-in">Go To Sign In</Link>
          </div>
        ) : (
          <>
            <p className={styles.intro}>Create one account for your organisation. You can start and manage separately purchased Matters from the same secure workspace.</p>
            <form onSubmit={submit} className={styles.form}>
              <div className={styles.twoColumns}>
                <label>First Name<input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" /></label>
                <label>Last Name<input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" /></label>
              </div>
              <label>Organisation Name<input value={organisationName} onChange={(e) => setOrganisationName(e.target.value)} autoComplete="organization" /></label>
              <label>Number Of Employees
                <select value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)}>
                  <option value="">Select</option><option value="1-10">1 to 10</option><option value="11-50">11 to 50</option><option value="51-150">51 to 150</option><option value="151-250">151 to 250</option><option value="250+">More than 250</option>
                </select>
              </label>
              <label>Work Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /><span className={styles.hint}>At least 8 characters with uppercase, lowercase and a number.</span></label>
              <label className={styles.check}><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>I agree to Leo HR's terms and privacy notice.</span></label>
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              <button className={styles.primary} disabled={loading}>{loading ? "Creating Account..." : "Create Account"}</button>
            </form>
            <p className={styles.switch}>Already have a Leo account? <Link href="/employer-support/sign-in">Sign In</Link></p>
          </>
        )}
      </section>
      <aside className={styles.aside}>
        <p className={styles.eyebrow}>One Matter At A Time</p>
        <h2>Get Help With The Employee Issue In Front Of You</h2>
        <p>Tell Ask Leo what has happened, add the relevant documents and work through the Matter in one organised place.</p>
        <div className={styles.note}><strong>Your employer account stays with you.</strong><span>Each Matter is purchased and managed separately, so you can return whenever another issue arises.</span></div>
      </aside>
    </main>
  );
}
