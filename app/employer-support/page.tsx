import Link from "next/link";
import { redirect } from "next/navigation";

import { getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import { createAdminClient } from "@/lib/supabase/admin";
import EmployerSupportShell from "./EmployerSupportShell";
import PaymentConfirmation from "./PaymentConfirmation";
import styles from "./employer-support-portal.module.css";

type Matter = { id:number; title:string|null; status:string|null; matter_type:string|null; subject:string|null; workflow_stage:string|null; created_at:string|null; completed_at:string|null };

export default async function EmployerSupportHomePage({ searchParams }: { searchParams?: Promise<{ payment?: string; session_id?: string }> }) {
  const access = await getEmployerSupportAccess();
  const params = searchParams ? await searchParams : {};
  const paymentSessionId = params.payment === "processing" && typeof params.session_id === "string" ? params.session_id : null;
  if (!access) redirect("/employer-support/sign-in");

  // Access has already been verified above. Use the server-only admin client for
  // product records so Employer Support visibility does not depend on the normal
  // Leo organisation RLS/session context.
  const supabase = createAdminClient();
  const { data: purchases, error: purchasesError } = await (supabase as any).from("leo_employer_support_purchases")
    .select("matter_id").eq("organisation_id", access.organisationId).eq("account_id", access.accountId)
    .eq("status", "provisioned").not("matter_id", "is", null);
  const ids = (purchases ?? []).map((row:{matter_id:number|null}) => row.matter_id).filter((id:number|null):id is number => Number.isInteger(id));

  let matters: Matter[] = [];
  let recordsError = Boolean(purchasesError);
  if (ids.length) {
    const result = await (supabase as any).from("matters")
      .select("id,title,status,matter_type,subject,workflow_stage,created_at,completed_at")
      .eq("organisation_id", access.organisationId).eq("product_source", "employer_support")
      .in("id", ids).order("created_at", { ascending:false });
    if (result.error) recordsError = true;
    matters = result.error ? [] : (result.data ?? []) as Matter[];
  }

  return <EmployerSupportShell><main className={styles.content}>
    {paymentSessionId ? <PaymentConfirmation sessionId={paymentSessionId} /> : null}
    <div className={styles.pageHeader}><div><p className={styles.eyebrow}>Ask Leo Employer Support</p><h1>Your matters</h1><p>Continue an existing employee issue or start support for a separate one.</p></div><Link className={styles.primary} href="/employer-support/start">Start a new matter</Link></div>
    {recordsError ? <section className={styles.loadError}><span>!</span><div><h2>Your matters could not be loaded</h2><p>Nothing has been changed. Refresh the page to try again. If the problem continues, use Help and support.</p></div></section> : matters.length === 0 ? <section className={styles.empty}><div className={styles.emptyVisual} aria-hidden="true"><span>✦</span><i></i><b>Ready</b></div><span className={styles.badge}>Ready when you are</span><h2>No matters yet</h2><p>When you are ready, tell Leo about the employee issue. Your first matter will appear here after purchase.</p><Link className={styles.primary} href="/employer-support/start">Start a matter</Link></section> :
    <section className={styles.grid}>{matters.map(m => <article className={styles.card} key={m.id}><div className={styles.cardTop}><span className={m.status?.toLowerCase()==="completed"?styles.completeBadge:styles.badge}>{m.status || "In progress"}</span><span className={styles.reference}>MAT-{String(m.id).padStart(6,"0")}</span></div><h2>{m.title || m.subject || "Employee matter"}</h2><p>{m.matter_type || "Employer support matter"}</p><div className={styles.stage}><span>Current stage</span><strong>{m.workflow_stage || "Initial assessment"}</strong></div><Link className={styles.secondary} href={"/employer-support/matter/"+m.id}>{m.status?.toLowerCase()==="completed"?"View matter record":"Continue with Ask Leo"}</Link></article>)}</section>}
  </main></EmployerSupportShell>;
}
