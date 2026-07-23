"use client";

import {
  FormEvent,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PlanId = "trial" | "up_to_50" | "up_to_150" | "up_to_250" | "over_250";

type Plan = {
  id: PlanId;
  number: number;
  title: string;
  priceLabel?: string;
  description: string;
  actionLabel: string;
  icon: ReactNode;
  features?: string[];
  contactOnly?: boolean;
};

const plans: Plan[] = [
  {
    id: "trial",
    number: 1,
    title: "Free 7 Day Trial",
    priceLabel: "FREE",
    description: "Explore the complete Leo HR platform for seven days.",
    actionLabel: "Start free trial",
    icon: <GiftIcon />,
    features: ["No payment details", "Full platform", "Cancels automatically"],
  },
  {
    id: "up_to_50",
    number: 2,
    title: "Up to 50 Employees",
    description: "Complete Leo HR platform for organisations of this size.",
    actionLabel: "Continue",
    icon: <PeopleIcon />,
  },
  {
    id: "up_to_150",
    number: 3,
    title: "Up to 150 Employees",
    description: "Complete Leo HR platform for organisations of this size.",
    actionLabel: "Continue",
    icon: <GroupIcon />,
  },
  {
    id: "up_to_250",
    number: 4,
    title: "Up to 250 Employees",
    description: "Complete Leo HR platform for organisations of this size.",
    actionLabel: "Continue",
    icon: <GroupIcon />,
  },
  {
    id: "over_250",
    number: 5,
    title: "Over 250 Employees",
    description: "Large organisations receive tailored implementation and pricing.",
    actionLabel: "Contact us",
    icon: <BuildingIcon />,
    contactOnly: true,
  },
];

function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

function isValidWebsite(value: string) {
  if (!value.trim()) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("trial");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const selectedPlanDetails = plans.find((plan) => plan.id === selectedPlan) ?? plans[0];
  const passwordChecks = getPasswordChecks(password);
  const passwordIsValid = Object.values(passwordChecks).every(Boolean);

  function selectPlan(plan: Plan) {
    if (plan.contactOnly) {
      router.push("/contact?enquiry=enterprise");
      return;
    }

    setSelectedPlan(plan.id);
    setFormError("");

    requestAnimationFrame(() => {
      document
        .getElementById("account-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = "Enter your first name.";
    if (!lastName.trim()) errors.lastName = "Enter your last name.";
    if (!organisationName.trim()) {
      errors.organisationName = "Enter your organisation name.";
    }

    if (!isValidWebsite(website)) {
      errors.website = "Enter a complete website address beginning with http:// or https://.";
    }

    if (!email.trim()) {
      errors.email = "Enter your business email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Create a password.";
    } else if (!passwordIsValid) {
      errors.password =
        "Use at least 8 characters, including uppercase, lowercase and a number.";
    }

    if (!acceptedTerms) {
      errors.acceptedTerms = "You must accept the terms and policies.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    if (selectedPlanDetails.contactOnly) {
      router.push("/contact?enquiry=enterprise");
      return;
    }

    setLoading(true);

    try {
      const normalizedWebsite = website.trim() ? website.trim() : null;

      const planCode =
        selectedPlan === "trial"
          ? "free_trial_7_day"
          : selectedPlan === "up_to_50"
            ? "organisation_50"
            : selectedPlan === "up_to_150"
              ? "organisation_150"
              : "organisation_250";

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            registration_source: "self_service",
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            organisation_name: organisationName.trim(),
            website_url: normalizedWebsite,
            plan_code: planCode,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setFormError(
            "An account already exists for this email address. Log in instead."
          );
        } else {
          setFormError(error.message);
        }
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Your account has been created. Check your email to confirm your address, then log in to start using Leo HR."
      );
    } catch {
      setFormError(
        "Leo HR could not create your account. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <header className="top-bar">
        <div aria-hidden="true" />
        <p>
          Already have an account?{" "}
          <Link href="/login" className="top-login-link">
            Log in
          </Link>
        </p>
      </header>

      <section className="register-shell" aria-labelledby="register-title">
        <div className="plan-panel">
          <div className="plan-heading">
            <h1 id="register-title">
              Start using Leo HR<sup>™</sup>
            </h1>
            <p>Choose how you’d like to get started.</p>
          </div>

          <div className="plan-intro">
            Every subscription includes the complete Leo HR platform. Pricing is
            based solely on the size of your organisation.
          </div>

          <div className="plans-grid">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;

              return (
                <article
                  className={`plan-card ${isSelected ? "selected" : ""}`}
                  key={plan.id}
                  aria-label={plan.title}
                >
                  <span
                    className={`plan-number ${isSelected ? "selected" : ""}`}
                    aria-hidden="true"
                  >
                    {plan.number}
                  </span>

                  {isSelected ? (
                    <span className="selected-check" aria-label="Selected plan">
                      <CheckIcon />
                    </span>
                  ) : null}

                  <div className="plan-icon" aria-hidden="true">
                    {plan.icon}
                  </div>

                  <h2>{plan.title}</h2>

                  {plan.priceLabel ? (
                    <strong className="price-label">{plan.priceLabel}</strong>
                  ) : null}

                  <p className="plan-description">
                    {plan.description.split("\n").map((line, index) => (
                      <span key={`${plan.id}-${line}`}>
                        {line}
                        {index < plan.description.split("\n").length - 1 ? (
                          <br />
                        ) : null}
                      </span>
                    ))}
                  </p>

                  {plan.features ? (
                    <ul className="feature-list">
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <span aria-hidden="true">
                            <SmallCheckIcon />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {plan.id === "trial" && isSelected ? null : (
                    <button
                      type="button"
                      className="plan-action"
                      onClick={() => selectPlan(plan)}
                      aria-pressed={!plan.contactOnly && isSelected}
                    >
                      {isSelected && !plan.contactOnly
                        ? "Selected"
                        : plan.actionLabel}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="form-divider" aria-hidden="true" />

        <div className="account-panel" id="account-form">
          <div className="account-heading">
            <div>
              <h2>Create your account</h2>
              <p>Enter your details to start using Leo HR.</p>
            </div>
            <span className="plan-pill" aria-live="polite">
              {selectedPlanDetails.title}
            </span>
          </div>

          {successMessage ? (
            <div className="success-message" role="status">
              <div className="success-icon" aria-hidden="true">
                <CheckIcon />
              </div>
              <div>
                <strong>Account created</strong>
                <p>{successMessage}</p>
                <Link href="/login">Go to log in</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="name-grid">
                <Field
                  id="firstName"
                  label="First name"
                  error={fieldErrors.firstName}
                >
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="First name"
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    aria-describedby={
                      fieldErrors.firstName ? "firstName-error" : undefined
                    }
                  />
                </Field>

                <Field
                  id="lastName"
                  label="Last name"
                  error={fieldErrors.lastName}
                >
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Last name"
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    aria-describedby={
                      fieldErrors.lastName ? "lastName-error" : undefined
                    }
                  />
                </Field>
              </div>

              <Field
                id="organisationName"
                label="Organisation name"
                error={fieldErrors.organisationName}
              >
                <input
                  id="organisationName"
                  name="organisationName"
                  type="text"
                  autoComplete="organization"
                  value={organisationName}
                  onChange={(event) => setOrganisationName(event.target.value)}
                  placeholder="Your organisation name"
                  aria-invalid={Boolean(fieldErrors.organisationName)}
                  aria-describedby={
                    fieldErrors.organisationName
                      ? "organisationName-error"
                      : undefined
                  }
                />
              </Field>

              <Field
                id="website"
                label="Website (optional)"
                error={fieldErrors.website}
              >
                <input
                  id="website"
                  name="website"
                  type="url"
                  autoComplete="url"
                  inputMode="url"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://yourorganisation.co.uk"
                  aria-invalid={Boolean(fieldErrors.website)}
                  aria-describedby={
                    fieldErrors.website ? "website-error" : undefined
                  }
                />
              </Field>

              <Field
                id="email"
                label="Business email"
                error={fieldErrors.email}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@yourorganisation.co.uk"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                />
              </Field>

              <Field
                id="password"
                label="Password"
                error={fieldErrors.password}
              >
                <div className="password-field">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a strong password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby="password-help password-error"
                  />
                  <button
                    type="button"
                    className="show-password"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                <div className="password-strength" aria-hidden="true">
                  <span className={passwordChecks.length ? "complete" : ""} />
                  <span className={passwordChecks.uppercase ? "complete" : ""} />
                  <span className={passwordChecks.lowercase ? "complete" : ""} />
                  <span className={passwordChecks.number ? "complete" : ""} />
                </div>

                <p className="password-help" id="password-help">
                  Password must be at least 8 characters and include uppercase,
                  lowercase and a number.
                </p>
              </Field>

              <div className="terms-row">
                <input
                  id="acceptedTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  aria-invalid={Boolean(fieldErrors.acceptedTerms)}
                  aria-describedby={
                    fieldErrors.acceptedTerms
                      ? "acceptedTerms-error"
                      : undefined
                  }
                />
                <label htmlFor="acceptedTerms">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank">
                    Terms of Service
                  </Link>
                  ,{" "}
                  <Link href="/privacy" target="_blank">
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link href="/acceptable-use" target="_blank">
                    Acceptable Use Policy
                  </Link>
                  .
                </label>
              </div>

              {fieldErrors.acceptedTerms ? (
                <p className="field-error terms-error" id="acceptedTerms-error">
                  {fieldErrors.acceptedTerms}
                </p>
              ) : null}

              {formError ? (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              ) : null}

              <button
                type="submit"
                className="create-account-button"
                disabled={loading}
              >
                {loading
                  ? "Creating account…"
                  : selectedPlan === "trial"
                    ? "Create account and start free trial"
                    : "Create account"}
              </button>

              <div className="security-note">
                <LockIcon />
                <span>Your data is secure and encrypted</span>
              </div>
            </form>
          )}
        </div>
      </section>

      <footer className="legal-footer">
        By creating an account, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link>,{" "}
        <Link href="/privacy">Privacy Policy</Link>, and{" "}
        <Link href="/acceptable-use">Acceptable Use Policy</Link>.
      </footer>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          background: #f7fbf9;
        }

        :global(body) {
          margin: 0;
          background:
            radial-gradient(circle at 50% 5%, rgba(247, 241, 252, 0.88), transparent 34%),
            linear-gradient(135deg, #f7fbf9 0%, #f8f4fc 48%, #f5fff9 100%);
          color: #131c31;
        }

        :global(a) {
          color: inherit;
        }

        :global(button),
        :global(input) {
          font: inherit;
        }

        .register-page {
          height: 100dvh;
          min-height: 720px;
          padding: 14px 38px 12px;
          overflow: hidden;
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .top-bar {
          min-height: 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1440px;
          margin: 0 auto 10px;
        }

        .top-bar p {
          margin: 0 0 0 auto;
          font-size: 11px;
          color: #172036;
        }

        .top-login-link {
          margin-left: 8px;
          color: #64409a;
          text-underline-offset: 3px;
        }

        .register-shell {
          display: grid;
          height: calc(100dvh - 76px);
          max-height: 900px;
          grid-template-columns: minmax(0, 1.08fr) 1px minmax(420px, 0.92fr);
          gap: 0;
          max-width: 1440px;
          margin: 0 auto;
          padding: 22px 30px;
          border: 1px solid rgba(116, 128, 145, 0.18);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow:
            0 18px 45px rgba(45, 58, 74, 0.09),
            0 2px 8px rgba(45, 58, 74, 0.05);
          backdrop-filter: blur(12px);
        }

        .plan-panel {
          padding: 0 30px 0 12px;
          min-height: 0;
        }

        .plan-heading {
          padding-bottom: 12px;
          border-bottom: 1px solid #d9dee7;
        }

        .plan-heading h1 {
          margin: 0;
          font-size: clamp(30px, 2.25vw, 38px);
          line-height: 1.04;
          letter-spacing: -1.3px;
          color: #121c30;
        }

        .plan-heading sup {
          margin-left: 3px;
          font-size: 11px;
          vertical-align: top;
          letter-spacing: 0;
        }

        .plan-heading p {
          margin: 4px 0 0;
          color: #626b7c;
          font-size: 15px;
        }

        .plan-intro {
          max-width: 465px;
          margin: 11px 0 12px;
          font-size: 13.5px;
          line-height: 1.45;
          color: #161f32;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 11px;
          align-items: stretch;
        }

        .plan-card {
          position: relative;
          min-height: 226px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 31px 13px 12px;
          border: 1px solid #d8dee8;
          border-radius: 9px;
          background: linear-gradient(180deg, #ffffff 0%, #fefefe 100%);
          text-align: center;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            transform 160ms ease;
        }

        .plan-card:hover {
          transform: translateY(-2px);
          border-color: #c8b3dd;
          box-shadow: 0 12px 24px rgba(92, 58, 135, 0.08);
        }

        .plan-card.selected {
          border: 1.5px solid #6e3da4;
          background:
            radial-gradient(circle at 50% 28%, rgba(247, 241, 252, 0.78), transparent 42%),
            #fff;
          box-shadow: 0 0 0 1px rgba(110, 61, 164, 0.04);
        }

        .plan-number,
        .selected-check {
          position: absolute;
          top: 10px;
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 999px;
        }

        .plan-number {
          left: 10px;
          background: #edf0f4;
          color: #192236;
          font-size: 12px;
          font-weight: 650;
        }

        .plan-number.selected {
          color: #fff;
          background: #69409d;
        }

        .selected-check {
          right: 10px;
          color: #fff;
          background: #69409d;
        }

        .selected-check :global(svg) {
          width: 17px;
          height: 17px;
        }

        .plan-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          margin: 0 0 8px;
          border-radius: 999px;
          color: #6e3da4;
          background: #f5f0fa;
        }

        .plan-icon :global(svg) {
          width: 29px;
          height: 29px;
        }

        .plan-card h2 {
          min-height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          font-size: 11px;
          line-height: 1.32;
          letter-spacing: -0.25px;
          color: #121a2d;
        }

        .plan-card.selected h2 {
          color: #65359c;
        }

        .price-label {
          display: block;
          margin-top: -4px;
          color: #08a94f;
          font-size: 11px;
        }

        .plan-description {
          min-height: 34px;
          margin: 4px 0 0;
          color: #30384a;
          font-size: 11.5px;
          line-height: 1.4;
          white-space: normal;
        }

        .feature-list {
          width: 100%;
          display: grid;
          gap: 5px;
          margin: 8px 0 0;
          padding: 0 0 0 3px;
          list-style: none;
          text-align: left;
          color: #283144;
          font-size: 11px;
        }

        .feature-list li {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .feature-list span {
          width: 15px;
          height: 15px;
          display: grid;
          place-items: center;
          color: #0bab55;
          flex: 0 0 auto;
        }

        .feature-list :global(svg) {
          width: 15px;
          height: 15px;
        }

        .plan-action {
          width: min(150px, 100%);
          min-height: 34px;
          margin-top: auto;
          border: 1.5px solid #6e3da4;
          border-radius: 7px;
          background: #fff;
          color: #613897;
          font-weight: 700;
          cursor: pointer;
          transition:
            color 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease;
        }

        .plan-action:hover,
        .plan-action:focus-visible {
          color: #fff;
          background: #6e3da4;
          box-shadow: 0 6px 14px rgba(110, 61, 164, 0.2);
          outline: none;
        }

        .plan-card.selected .plan-action {
          color: #fff;
          background: #6e3da4;
        }

        .form-divider {
          width: 1px;
          min-height: 100%;
          background: #d8dde5;
        }

        .account-panel {
          padding: 4px 18px 0 32px;
          min-height: 0;
          scroll-margin-top: 24px;
        }

        .account-panel form {
          padding: 0;
        }

        .account-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 14px;
        }

        .account-heading h2 {
          margin: 0;
          font-size: 23px;
          line-height: 1.2;
          letter-spacing: -0.7px;
          color: #131c30;
        }

        .account-heading p {
          margin: 4px 0 0;
          color: #697285;
          font-size: 12px;
          line-height: 1.5;
        }

        .plan-pill {
          display: inline-flex;
          align-items: center;
          min-height: 31px;
          padding: 0 11px;
          border: 1px solid #dfd4ea;
          border-radius: 10px;
          background: linear-gradient(180deg, #fbf8fe 0%, #f7f1fc 100%);
          color: #633b91;
          font-size: 11px;
          font-weight: 750;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(76, 48, 104, 0.04);
        }

        form {
          display: grid;
          gap: 12px;
        }

        .name-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        :global(.field) {
          min-width: 0;
        }

        :global(.field label) {
          display: block;
          margin-bottom: 5px;
          color: #172036;
          font-size: 12px;
          font-weight: 650;
          letter-spacing: -0.01em;
        }

        :global(.field input[type="text"]),
        :global(.field input[type="email"]),
        :global(.field input[type="url"]),
        :global(.field input[type="password"]) {
          width: 100%;
          min-height: 43px;
          padding: 0 16px;
          border: 1px solid #d9cee7;
          border-radius: 9px;
          background: #ffffff;
          color: #172036;
          font-size: 11px;
          line-height: 1.2;
          outline: none;
          box-shadow:
            0 1px 2px rgba(36, 28, 52, 0.02),
            inset 0 0 0 1px rgba(255, 255, 255, 0.55);
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease,
            background 150ms ease;
        }

        :global(.field input::placeholder) {
          color: #8a91a1;
          opacity: 1;
        }

        :global(.field input:hover) {
          border-color: #c8b5dd;
          background: #fff;
        }

        :global(.field input:focus) {
          border-color: #7444a6;
          background: #fff;
          box-shadow:
            0 0 0 4px rgba(110, 80, 132, 0.11),
            0 5px 14px rgba(64, 43, 87, 0.05);
        }

        :global(.field input[aria-invalid="true"]) {
          border-color: #b84b59;
          background: #fffafb;
          box-shadow: 0 0 0 4px rgba(184, 75, 89, 0.08);
        }

        :global(.password-field) {
          position: relative;
        }

        :global(.password-field input) {
          padding-right: 50px !important;
        }

        :global(.show-password) {
          position: absolute;
          top: 50%;
          right: 12px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          background: transparent;
          color: #7d8493;
          transform: translateY(-50%);
          cursor: pointer;
          border-radius: 8px;
        }

        :global(.show-password:hover),
        :global(.show-password:focus-visible) {
          color: #613897;
          background: #f4eef9;
          outline: none;
        }

        :global(.show-password svg) {
          width: 22px;
          height: 22px;
        }

        :global(.password-strength) {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 7px;
          width: 190px;
          margin-top: 7px;
        }

        :global(.password-strength span) {
          height: 5px;
          border-radius: 999px;
          background: #dde1e8;
          transition:
            background 160ms ease,
            transform 160ms ease;
        }

        :global(.password-strength span.complete) {
          background: #70419f;
          transform: scaleY(1.05);
        }

        :global(.password-help) {
          margin: 5px 0 0;
          color: #747b89;
          font-size: 10.5px;
          line-height: 1.35;
        }

        :global(.field-error) {
          margin: 6px 0 0;
          color: #a52d3c;
          font-size: 12px;
          line-height: 1.4;
        }

        .terms-row {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          margin-top: 2px;
          padding: 10px 12px;
          border: 1px solid #ddd3e8;
          border-radius: 9px;
          background: #fcfafd;
        }

        .terms-row input {
          appearance: none;
          -webkit-appearance: none;
          width: 17px;
          height: 17px;
          margin: 1px 0 0;
          border: 1.5px solid #b9afc6;
          border-radius: 5px;
          background: #fff;
          flex: 0 0 auto;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition:
            border-color 150ms ease,
            background 150ms ease,
            box-shadow 150ms ease;
        }

        .terms-row input::before {
          content: "";
          width: 9px;
          height: 5px;
          border-left: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: rotate(-45deg) scale(0);
          transform-origin: center;
          transition: transform 120ms ease;
          margin-top: -2px;
        }

        .terms-row input:checked {
          border-color: #6e3da4;
          background: #6e3da4;
          box-shadow: 0 0 0 3px rgba(110, 61, 164, 0.1);
        }

        .terms-row input:checked::before {
          transform: rotate(-45deg) scale(1);
        }

        .terms-row input:focus-visible {
          outline: none;
          box-shadow: 0 0 0 4px rgba(110, 61, 164, 0.14);
        }

        .terms-row label {
          color: #354055;
          font-size: 11px;
          line-height: 1.65;
        }

        .terms-row a,
        .legal-footer a,
        .success-message a {
          color: #663b94;
          text-underline-offset: 2px;
        }

        .terms-error {
          margin-top: -11px;
        }

        .form-error {
          padding: 12px 14px;
          border: 1px solid #edc5ca;
          border-radius: 8px;
          background: #fff6f7;
          color: #972d3b;
          font-size: 11px;
          line-height: 1.5;
        }

        .create-account-button {
          width: 100%;
          min-height: 43px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(90deg, #7440a5 0%, #5f3492 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 7px 16px rgba(103, 56, 151, 0.16);
          transition:
            transform 150ms ease,
            box-shadow 150ms ease,
            opacity 150ms ease;
        }

        .create-account-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(103, 56, 151, 0.22);
        }

        .create-account-button:focus-visible {
          outline: 3px solid rgba(110, 80, 132, 0.22);
          outline-offset: 3px;
        }

        .create-account-button:disabled {
          opacity: 0.68;
          cursor: wait;
        }

        .security-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 2px;
          color: #6f788a;
          font-size: 12px;
        }

        .security-note :global(svg) {
          width: 23px;
          height: 23px;
          flex: 0 0 auto;
        }

        .success-message {
          display: flex;
          gap: 11px;
          padding: 18px;
          border: 1px solid #bfe4cf;
          border-radius: 10px;
          background: #f3fcf7;
          color: #1c5534;
        }

        .success-message strong {
          display: block;
          margin-bottom: 5px;
          color: #16462b;
        }

        .success-message p {
          margin: 0 0 12px;
          font-size: 10.5px;
          line-height: 1.35;
        }

        .success-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #1fa35b;
          color: #fff;
          flex: 0 0 auto;
        }

        .success-icon :global(svg) {
          width: 19px;
          height: 19px;
        }

        .legal-footer {
          max-width: 1440px;
          margin: 9px auto 0;
          text-align: center;
          color: #586174;
          font-size: 11px;
          line-height: 1.6;
        }


        @media (min-width: 861px) and (max-height: 820px) {
          .register-page {
            padding-top: 8px;
            padding-bottom: 8px;
          }

          .top-bar {
            margin-bottom: 6px;
          }

          .register-shell {
            height: calc(100dvh - 54px);
            padding-top: 16px;
            padding-bottom: 16px;
          }

          .plan-heading h1 {
            font-size: 29px;
          }

          .plan-heading p {
            font-size: 13px;
          }

          .plan-intro {
            margin-block: 8px;
            font-size: 12px;
          }

          .plan-card {
            min-height: 205px;
            padding-top: 28px;
          }

          .plan-icon {
            width: 42px;
            height: 42px;
          }

          .plan-icon :global(svg) {
            width: 25px;
            height: 25px;
          }

          .account-heading {
            margin-bottom: 10px;
          }

          form {
            gap: 9px;
          }

          :global(.field input[type="text"]),
          :global(.field input[type="email"]),
          :global(.field input[type="url"]),
          :global(.field input[type="password"]) {
            min-height: 39px;
          }

          .terms-row {
            padding-block: 8px;
          }

          .create-account-button {
            min-height: 40px;
          }

          .legal-footer {
            display: none;
          }
        }

        @media (max-width: 1180px) {
          .register-page {
            padding-inline: 24px;
          }

          .register-shell {
            grid-template-columns: minmax(0, 1fr) 1px minmax(390px, 0.86fr);
            padding-inline: 24px;
          }

          .plan-panel {
            padding-left: 6px;
            padding-right: 28px;
          }

          .account-panel {
            padding-right: 8px;
            padding-left: 34px;
          }

          .plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .register-page {
            height: auto;
            min-height: 100vh;
            padding: 20px 16px;
            overflow: visible;
          }

          .top-bar {
            margin-bottom: 14px;
          }

          .register-shell {
            display: block;
            height: auto;
            max-height: none;
            padding: 24px;
          }

          .plan-panel,
          .account-panel {
            padding: 0;
          }

          .form-divider {
            width: 100%;
            height: 1px;
            min-height: 1px;
            margin: 34px 0;
          }

          .account-panel {
            scroll-margin-top: 16px;
          }
        }

        @media (max-width: 560px) {
          .register-page {
            padding: 16px 10px;
          }

          .top-bar {
            padding-inline: 4px;
          }

          .top-bar p {
            font-size: 11px;
          }

          .register-shell {
            padding: 22px 16px;
            border-radius: 16px;
          }

          .plan-heading h1 {
            font-size: 34px;
          }

          .plan-heading p {
            font-size: 14px;
          }

          .plans-grid,
          .name-grid {
            grid-template-columns: 1fr;
          }

          .plan-card {
            min-height: 285px;
          }

          .account-heading {
            flex-direction: column;
            margin-bottom: 22px;
          }

          .account-heading h2 {
            font-size: 25px;
          }

          .plan-pill {
            white-space: normal;
          }

          :global(.password-strength) {
            grid-template-columns: repeat(4, 1fr);
          }

          .legal-footer {
            padding-inline: 8px;
          }
        }
      `}</style>
    </main>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

const iconStyle: CSSProperties = {
  width: "100%",
  height: "100%",
};

function GiftIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle}
      aria-hidden="true"
    >
      <path d="M7 20h34v21H7z" />
      <path d="M4 13h40v9H4z" />
      <path d="M24 13v28" />
      <path d="M24 13H14.5a5.5 5.5 0 1 1 5.5-5.5c0 3.5 4 5.5 4 5.5Z" />
      <path d="M24 13h9.5A5.5 5.5 0 1 0 28 7.5c0 3.5-4 5.5-4 5.5Z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle}
      aria-hidden="true"
    >
      <circle cx="19" cy="16" r="7" />
      <path d="M6 40v-5c0-6 5.5-10 13-10s13 4 13 10v5" />
      <path d="M31 11a6 6 0 0 1 0 12" />
      <path d="M34 27c5 .8 8 3.8 8 8v5" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle}
      aria-hidden="true"
    >
      <circle cx="24" cy="13" r="6" />
      <circle cx="10.5" cy="20" r="5" />
      <circle cx="37.5" cy="20" r="5" />
      <path d="M14 40v-4.5C14 30 18 27 24 27s10 3 10 8.5V40" />
      <path d="M2.5 40v-3.5c0-4.5 3.2-7 8-7 1.5 0 2.9.3 4 .8" />
      <path d="M45.5 40v-3.5c0-4.5-3.2-7-8-7-1.5 0-2.9.3-4 .8" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyle}
      aria-hidden="true"
    >
      <path d="M8 42V10h22v32" />
      <path d="M30 22h10v20" />
      <path d="M4 42h40" />
      <path d="M14 16h3M22 16h3M14 23h3M22 23h3M14 30h3M22 30h3" />
      <path d="M15 42v-6h8v6" />
      <path d="M35 28h2M35 34h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SmallCheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 10 4 4 10-10" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.3 3.1" />
      <path d="M6.1 6.1C3.7 8 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}