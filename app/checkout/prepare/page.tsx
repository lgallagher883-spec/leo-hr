"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const allowedPlans = new Set(["organisation_50", "organisation_150", "organisation_250"]);

function CheckoutPrepareContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPreparing, setIsPreparing] = useState(true);

  const plan = useMemo(() => {
    const providedPlan = searchParams.get("plan");
    return providedPlan && allowedPlans.has(providedPlan) ? providedPlan : null;
  }, [searchParams]);

  useEffect(() => {
    if (!plan) {
      setError("The selected plan could not be verified.");
      setIsPreparing(false);
      return;
    }

    let cancelled = false;

    async function prepareCheckout() {
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planKey: plan }),
        });

        const result = (await response.json()) as { url?: string; error?: string };

        if (cancelled) {
          return;
        }

        if (!response.ok || !result.url) {
          throw new Error(result.error || "Stripe Checkout could not be started.");
        }

        window.location.assign(result.url);
      } catch (checkoutError) {
        if (!cancelled) {
          setError(
            checkoutError instanceof Error
              ? checkoutError.message
              : "Stripe Checkout could not be started.",
          );
          setIsPreparing(false);
        }
      }
    }

    void prepareCheckout();

    return () => {
      cancelled = true;
    };
  }, [plan]);

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.card} role="alert">
          <h1>We couldn’t start secure payment</h1>
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()} style={styles.button}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card} role="status" aria-live="polite">
        <div style={styles.spinner} aria-hidden="true" />
        <h1>Taking you to secure payment…</h1>
        <p>Your Leo HR subscription is being prepared. You'll be redirected to Stripe securely.</p>
        <p style={styles.note}>
          Payments are processed securely by Stripe. Leo HR never stores your card details.
        </p>
      </div>
    </main>
  );
}

export default function CheckoutPreparePage() {
  return (
    <Suspense fallback={<CheckoutPrepareFallback />}>
      <CheckoutPrepareContent />
    </Suspense>
  );
}

function CheckoutPrepareFallback() {
  return (
    <main style={styles.page}>
      <div style={styles.card} role="status" aria-live="polite">
        <div style={styles.spinner} aria-hidden="true" />
        <h1>Taking you to secure payment…</h1>
        <p>Your Leo HR subscription is being prepared. You'll be redirected to Stripe securely.</p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    background: "#fbf9fc",
    color: "#2f2933",
  } as const,
  card: {
    width: "100%",
    maxWidth: "560px",
    padding: "36px",
    borderRadius: "24px",
    border: "1px solid #e8deee",
    background: "#ffffff",
    boxShadow: "0 18px 48px rgba(77, 55, 90, 0.08)",
    textAlign: "center" as const,
  },
  spinner: {
    width: "42px",
    height: "42px",
    margin: "0 auto 20px",
    border: "4px solid rgba(110, 80, 132, 0.16)",
    borderTopColor: "#6e5084",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
  },
  note: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#523b63",
  },
  button: {
    marginTop: "12px",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid #6e5084",
    background: "#6e5084",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 750,
  },
};
