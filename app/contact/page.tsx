import Link from "next/link";
import styles from "./contact.module.css";

type ContactPageProps = {
  searchParams: Promise<{
    enquiry?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({
  searchParams,
}: ContactPageProps) {
  const params = await searchParams;
  const enquiry = firstValue(params.enquiry);
  const enterpriseEnquiry = enquiry === "enterprise";

  const emailSubject = enterpriseEnquiry
    ? "LEO HR Enterprise enquiry"
    : "LEO HR enquiry";

  const emailHref = `mailto:office@leohr.co.uk?subject=${encodeURIComponent(
    emailSubject,
  )}`;

  return (
    <main className={styles.contactPage}>
      <section className={styles.contactHero}>
        <div>
          <p className={styles.eyebrow}>LEO HR™</p>
          <h1>
            {enterpriseEnquiry
              ? "Talk to us about LEO HR for larger organisations"
              : "Contact LEO HR"}
          </h1>
          <p className={styles.heroCopy}>
            {enterpriseEnquiry
              ? "For organisations with more than 250 employees, we will work with you directly to understand your requirements and agree the right subscription arrangement."
              : "Questions about LEO HR, subscriptions or the platform? Get in touch and we will point you in the right direction."}
          </p>
        </div>
      </section>

      <section className={styles.contactGrid}>
        <article className={`${styles.contactCard} ${styles.primaryCard}`}>
          <p className={styles.cardKicker}>
            {enterpriseEnquiry ? "Enterprise enquiry" : "General enquiry"}
          </p>
          <h2>Email LEO HR</h2>
          <p>
            Send your enquiry to{" "}
            <a href="mailto:office@leohr.co.uk">office@leohr.co.uk</a>. If you
            are enquiring about an organisation with more than 250 employees,
            include the approximate organisation size and anything you would
            like us to know about your requirements.
          </p>

          <a href={emailHref} className={styles.primaryButton}>
            Email LEO HR
          </a>
        </article>

        <article className={styles.contactCard}>
          <p className={styles.cardKicker}>Already using LEO?</p>
          <h2>Subscription &amp; billing</h2>
          <p>
            If you are already signed in, manage your current trial,
            subscription, billing details and invoices from the Billing &amp;
            Subscription workspace.
          </p>

          <Link href="/dashboard/billing" className={styles.secondaryButton}>
            Open Billing &amp; Subscription
          </Link>
        </article>
      </section>

      <section className={styles.contactNote}>
        <div>
          <p className={styles.cardKicker}>Not ready to contact us yet?</p>
          <h2>Explore LEO HR</h2>
          <p>
            You can return to the website or create an account when you are
            ready to start your 7-day free trial.
          </p>
        </div>

        <div className={styles.noteActions}>
          <Link href="/" className={styles.secondaryButton}>
            Return to LEO HR
          </Link>
          <Link href="/register" className={styles.primaryButton}>
            Start free trial
          </Link>
        </div>
      </section>
    </main>
  );
}