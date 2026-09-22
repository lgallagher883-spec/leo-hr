"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./employer-support-portal.module.css";

export default function PaymentConfirmation({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("We’re securely checking your payment and preparing your matter…");
  const [error,setError]=useState(false);

  useEffect(() => {
    let cancelled = false;
    async function confirm() {
      try{
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
        setError(true);
        setMessage(data.error || "We could not finish preparing your matter just now. Please try again shortly. You will not be asked to pay again from this screen.");
      }catch{
        if(!cancelled){setError(true);setMessage("We could not finish preparing your matter just now. Please try again shortly. You will not be asked to pay again from this screen.");}
      }
    }
    void confirm();
    return () => { cancelled = true; };
  }, [router, sessionId]);

  return <section className={error?styles.paymentProblem:styles.paymentPreparing} role="status" aria-live="polite">
    <span aria-hidden="true">{error?"!":"✦"}</span>
    <div><strong>{error?"Your matter is still being prepared":"Preparing your matter"}</strong><p>{message}</p>{error?<button type="button" onClick={()=>window.location.reload()}>Try again</button>:null}</div>
  </section>;
}
