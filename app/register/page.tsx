"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normaliseOrganisationWebsite } from "@/lib/url/organisationWebsite";
import { createClient } from "@/lib/supabase/client";
import styles from "./register.module.css";

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
    priceLabel: "£75 per month",
    description: "Subscribe to the Leo HR platform for organisations of this size.",
    actionLabel: "Continue",
    icon: <PeopleIcon />,
  },
  {
    id: "up_to_150",
    number: 3,
    title: "Up to 150 Employees",
    priceLabel: "£125 per month",
    description: "Subscribe to Leo HR platform for organisations of this size.",
    actionLabel: "Continue",
    icon: <GroupIcon />,
  },
  {
    id: "up_to_250",
    number: 4,
    title: "Up to 250 Employees",
    priceLabel: "£175 per month",
    description: "Subscribe to the Leo HR platform for organisations of this size.",
    actionLabel: "Continue",
    icon: <GroupIcon />,
  },
  {
    id: "over_250",
    number: 5,
    title: "Over 250 Employees",
    priceLabel: "Contact us",
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

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pilotCode, setPilotCode] = useState("");
  const [pilotCodeValid, setPilotCodeValid] = useState(false);
  const [checkingPilotCode, setCheckingPilotCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const selectedPlanDetails =
    plans.find((plan) => plan.id === selectedPlan) ?? null;
  const passwordChecks = getPasswordChecks(password);
  const passwordIsValid = Object.values(passwordChecks).every(Boolean);
  const trimmedPilotCode = pilotCode.trim();
  const isPilotRegistration = pilotCodeValid;

  useEffect(() => {
    const requestedPlan = new URLSearchParams(window.location.search).get(
      "plan",
    );

    if (
      requestedPlan === "trial" ||
      requestedPlan === "up_to_50" ||
      requestedPlan === "up_to_150" ||
      requestedPlan === "up_to_250" ||
      requestedPlan === "over_250"
    ) {
      setSelectedPlan(requestedPlan);
    }
  }, []);

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

    if (!selectedPlan) {
      errors.plan =
        "Select either Free 7 Day Trial or a paid subscription to continue.";
    }

    if (!firstName.trim()) errors.firstName = "Enter your first name.";
    if (!lastName.trim()) errors.lastName = "Enter your last name.";
    if (!organisationName.trim()) {
      errors.organisationName = "Enter your organisation name.";
    }

    if (!website.trim()) {
      errors.website = "Enter your organisation website.";
    } else if (!normaliseOrganisationWebsite(website).isValid) {
      errors.website =
        "Enter a valid website address, such as leohr.co.uk.";
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

  async function validatePilotCode() {
    const code = pilotCode.trim();

    if (!code) {
      setPilotCodeValid(false);
      setFieldErrors((current) => ({
        ...current,
        pilotCode: "Enter your pilot access code.",
      }));
      return false;
    }

    setCheckingPilotCode(true);

    try {
      const response = await fetch("/api/register/pilot-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const payload = (await response.json()) as {
        valid?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.valid) {
        setPilotCodeValid(false);
        setFieldErrors((current) => ({
          ...current,
          pilotCode:
            payload.error ||
            "That pilot code is not recognised. Check the code and try again.",
        }));
        return false;
      }

      setPilotCodeValid(true);
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.pilotCode;
        return next;
      });

      return true;
    } catch {
      setPilotCodeValid(false);
      setFieldErrors((current) => ({
        ...current,
        pilotCode: "The pilot code could not be checked. Try again.",
      }));
      return false;
    } finally {
      setCheckingPilotCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    if (!selectedPlan) {
      return;
    }

    if (trimmedPilotCode) {
      const validPilotCode = await validatePilotCode();

      if (!validPilotCode) {
        return;
      }
    } else {
      setPilotCodeValid(false);
    }

    if (selectedPlanDetails?.contactOnly) {
      router.push("/contact?enquiry=enterprise");
      return;
    }

    setLoading(true);

    try {
      const websiteResult = normaliseOrganisationWebsite(website);

      if (!websiteResult.isValid || !websiteResult.canonicalUrl) {
        setFieldErrors((current) => ({
          ...current,
          website: "Enter a valid website address, such as leohr.co.uk.",
        }));
        return;
      }

      const normalizedWebsite = websiteResult.canonicalUrl;

      const planCode = isPilotRegistration
        ? "pilot_6_month"
        : selectedPlan === "trial"
          ? "free_trial_7_day"
          : selectedPlan === "up_to_50"
            ? "organisation_50"
            : selectedPlan === "up_to_150"
              ? "organisation_150"
              : "organisation_250";

      const registrationPlanKey =
        selectedPlan === "up_to_50"
          ? "organisation_50"
          : selectedPlan === "up_to_150"
            ? "organisation_150"
            : selectedPlan === "up_to_250"
              ? "organisation_250"
              : null;

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
            registration_plan_id: selectedPlan,
            registration_plan_code: planCode,
            registration_plan_key: registrationPlanKey,
            registration_intent: isPilotRegistration
              ? "pilot_programme"
              : selectedPlan === "trial"
                ? "free_trial"
                : "paid_subscription",
            pilot_access_code: isPilotRegistration
              ? trimmedPilotCode
              : null,
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
        isPilotRegistration || selectedPlan === "trial"
          ? "Your account has been created. Check your email to confirm your address, then sign in to start your access period."
          : "Your account has been created. Check your email to confirm your address, then sign in to continue to secure billing and activate your subscription."
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
    <main className={styles["register-page"]}>
      <header className={styles["top-bar"]}>
        <div aria-hidden="true" />
        <p>
          Already have an account?{" "}
          <Link href="/login" className={styles["top-login-link"]}>
            Log in
          </Link>
        </p>
      </header>

      <section className={styles["register-shell"]} aria-labelledby="register-title">
        <div className={styles["plan-panel"]}>
          <div className={styles["plan-heading"]}>
            <h1 id="register-title">
              Start using Leo HR<sup>™</sup>
            </h1>
                      </div>

          <div className={styles["plan-intro"]}>
            Every subscription includes the complete Leo HR platform. Pricing is
            based solely on the size of your organisation.
          </div>

          {fieldErrors.plan ? (
            <p className={styles["field-error"]} role="alert">
              {fieldErrors.plan}
            </p>
          ) : null}

          <div className={styles["plans-grid"]}>
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;

              return (
                <article
                  className={`${styles["plan-card"]} ${isSelected ? styles.selected : ""}`}
                  key={plan.id}
                  aria-label={plan.title}
                >
                  <span
                    className={`${styles["plan-number"]} ${isSelected ? styles.selected : ""}`}
                    aria-hidden="true"
                  >
                    {plan.number}
                  </span>

                  {isSelected ? (
                    <span className={styles["selected-check"]} aria-label="Selected plan">
                      <CheckIcon />
                    </span>
                  ) : null}

                  <div className={styles["plan-icon"]} aria-hidden="true">
                    {plan.icon}
                  </div>

                  <h2>{plan.title}</h2>

                  {plan.priceLabel ? (
                    <strong className={styles["price-label"]}>{plan.priceLabel}</strong>
                  ) : null}

                  <p className={styles["plan-description"]}>
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
                    <ul className={styles["feature-list"]}>
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
                      className={styles["plan-action"]}
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

        <div className={styles["form-divider"]} aria-hidden="true" />

        <div className={styles["account-panel"]} id="account-form">
          <div className={styles["account-heading"]}>
            <div>
              <h2>Create your account</h2>
                          </div>
            <span className={styles["plan-pill"]} aria-live="polite">
              {isPilotRegistration
                ? "Pilot Programme · 6 months free"
                : selectedPlanDetails?.title ?? "Select a plan to continue"}
            </span>
          </div>

          {successMessage ? (
            <div className={styles["success-message"]} role="status">
              <div className={styles["success-icon"]} aria-hidden="true">
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
              <div className={styles["name-grid"]}>
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
                label="Business website"
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
                  onBlur={() => {
                    const result = normaliseOrganisationWebsite(website);
                    if (result.isValid && result.canonicalUrl) {
                      setWebsite(result.canonicalUrl);
                    }
                  }}
                  placeholder="https://yourorganisation.co.uk" required
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
                <div className={styles["password-field"]}>
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
                    className={styles["show-password"]}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                <div className={styles["password-strength"]} aria-hidden="true">
                  <span className={passwordChecks.length ? styles.complete : ""} />
                  <span className={passwordChecks.uppercase ? styles.complete : ""} />
                  <span className={passwordChecks.lowercase ? styles.complete : ""} />
                  <span className={passwordChecks.number ? styles.complete : ""} />
                </div>

                <p className={styles["password-help"]} id="password-help">
                  Password must be at least 8 characters and include uppercase,
                  lowercase and a number.
                </p>
              </Field>

              <Field
                id="pilotCode"
                label="Pilot access code (optional)"
                error={fieldErrors.pilotCode}
              >
                <input
                  id="pilotCode"
                  name="pilotCode"
                  type="text"
                  autoComplete="off"
                  value={pilotCode}
                  onChange={(event) => {
                    setPilotCode(event.target.value);
                    setPilotCodeValid(false);
                    if (fieldErrors.pilotCode) {
                      setFieldErrors((current) => {
                        const next = { ...current };
                        delete next.pilotCode;
                        return next;
                      });
                    }
                  }}
                  placeholder="Enter your pilot access code"
                  aria-invalid={Boolean(fieldErrors.pilotCode)}
                  aria-describedby={
                    fieldErrors.pilotCode
                      ? "pilotCode-error pilotCode-help"
                      : "pilotCode-help"
                  }
                />
                <button
                  type="button"
                  className={styles["pilot-check-button"]}
                  onClick={() => void validatePilotCode()}
                  disabled={checkingPilotCode || !trimmedPilotCode}
                >
                  {checkingPilotCode ? "Checking…" : "Validate code"}
                </button>
                {isPilotRegistration ? (
                  <div className={styles["pilot-confirmation"]} role="status">
                    <SmallCheckIcon />
                    <span>
                      Pilot code accepted — your six-month free pilot will be
                      applied when the account is created.
                    </span>
                  </div>
                ) : null}
              </Field>

              <div className={styles["terms-row"]}>
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
                  <Link href="/legal/terms-and-conditions.pdf" target="_blank">
                    Terms of Service
                  </Link>
                  ,{" "}
                  <Link href="/legal/privacy-policy.pdf" target="_blank">
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link href="/legal/acceptable-use-policy.pdf" target="_blank">
                    Acceptable Use Policy
                  </Link>
                  .
                </label>
              </div>

              {fieldErrors.acceptedTerms ? (
                <p
                  className={`${styles["field-error"]} ${styles["terms-error"]}`}
                  id="acceptedTerms-error"
                >
                  {fieldErrors.acceptedTerms}
                </p>
              ) : null}

              {formError ? (
                <div className={styles["form-error"]} role="alert">
                  {formError}
                </div>
              ) : null}

              <button
                type="submit"
                className={styles["create-account-button"]}
                disabled={loading || !selectedPlan}
              >
                {loading
                  ? "Creating account…"
                  : isPilotRegistration
                    ? "Create account and start 6-month pilot"
                    : selectedPlan === "trial"
                      ? "Create account and start free trial"
                      : selectedPlan
                        ? "Create account"
                        : "Select a plan to continue"}
              </button>

              <div className={styles["security-note"]}>
                <LockIcon />
                <span>Your data is secure and encrypted</span>
              </div>
            </form>
          )}
        </div>
      </section>

      <footer className={styles["legal-footer"]}>
        By creating an account, you agree to our{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>,{" "}
        <Link href="/legal/privacy-policy.pdf">Privacy Policy</Link>, and{" "}
        <Link href="/legal/acceptable-use-policy.pdf">Acceptable Use Policy</Link>.
      </footer>
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
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className={styles["field-error"]} id={`${id}-error`}>
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