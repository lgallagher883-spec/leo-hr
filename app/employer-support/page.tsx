import Link from "next/link";
import { redirect } from "next/navigation";

import { getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import { createClient } from "@/lib/supabase/server";
import EmployerSupportShell from "./EmployerSupportShell";
import styles from "./employer-support-portal.module.css";

type Matter = { id:number; title:string|null; status:string|null; matter_type:string|null; subject:string|null; workflow_stage:string|null; created_at:string|null; completed_at:string|null };

export default async function EmployerSupportHomePage() {
  const access = await getEmployerSupportAccess();
  if (!access) redirect("/employer-support/sign-in");

  const supabase = await createClient();
  const { data: purchases } = await (supabase as any).from("leo_employer_support_purchases")
    .select("matter_id").eq("organisation_id", access.organisationId).eq("account_id", access.accountId)
    .eq("status", "provisioned").not("matter_id", "is", null);
  const ids = (purchases ?? []).map((row:{matter_id:number|null}) => row.matter_id).filter((id:number|null):id is number => Number.isInteger(id));

  let matters: Matter[] = [];
  if (ids.length) {
    const result = await (supabase as any).from("matters")
      .select("id,title,status,matter_type,subject,workflow_stage,created_at,completed_at")
      .eq("organisation_id", access.organisationId).eq("product_source", "employer_support")
      .in("id", ids).order("created_at", { ascending:false });
    matters = (result.data ?? []) as Matter[];
  }

  return <EmployerSupportShell><main className={styles.content}>
    <div className={styles.pageHeader}><div><p className={styles.eyebrow}>Ask Leo Employer Support</p><h1>Your Matters</h1><p>Continue an employee issue already in progress or start a separate new Matter.</p></div><Link className={styles.primary} href="/employer-support/start">Start A New Matter</Link></div>
    {matters.length === 0 ? <section className={styles.empty}><span className={styles.badge}>Ready When You Are</span><h2>No Matters Yet</h2><p>When you are ready, tell Leo about the employee issue. Your first Matter will appear here after purchase.</p><Link className={styles.primary} href="/employer-support/start">Start A Matter</Link></section> :
    <section className={styles.grid}>{matters.map(m => <article className={styles.card} key={m.id}><div className={styles.cardTop}><span className={styles.badge}>{m.status || "In Progress"}</span><span className={styles.reference}>MAT-{String(m.id).padStart(6,"0")}</span></div><h2>{m.title || m.subject || "Employee Matter"}</h2><p>{m.matter_type || "Employer Support Matter"}</p><div className={styles.stage}><span>Current Stage</span><strong>{m.workflow_stage || "Initial Assessment"}</strong></div><Link className={styles.secondary} href={"/employer-support/matter/"+m.id}>Continue With Ask Leo</Link></article>)}</section>}
  </main></EmployerSupportShell>;
}
