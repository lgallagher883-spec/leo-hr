"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentConfirmation({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("Payment received. Preparing your Matter…");

  useEffect(() => {
    let cancelled = false;
    async function confirm() {
      const response = await fetch("/api/employer-support/confirm-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (response.ok && data.matterId) {
        router.replace("/employer-support/matter/" + data.matterId);
        router.refresh();
        return;
      }
      setMessage(data.error || "Your payment is confirmed. Your Matter is still being prepared; please refresh shortly.");
    }
    void confirm();
    return () => { cancelled = true; };
  }, [router, sessionId]);

  return <div role="status" aria-live="polite">{message}</div>;
}
