import { redirect } from "next/navigation";
import { getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import EmployerSupportShell from "../EmployerSupportShell";
import styles from "../employer-support-portal.module.css";

export default async function StartEmployerSupportMatterPage() {
  const access = await getEmployerSupportAccess();
  if (!access) redirect("/employer-support/sign-in");
  return <EmployerSupportShell><main className={styles.content}><div className={styles.narrow}><p className={styles.eyebrow}>Start A New Matter</p><h1>Tell Leo About The Issue</h1><p className={styles.lead}>Each employee issue is kept as a separate Matter. We will ask only for the information needed to understand this issue before payment and provisioning.</p><section className={styles.notice}><strong>Next Build Step</strong><p>The secure Matter setup form and one-off checkout will live here. Payment is not enabled yet, so no charge can accidentally be taken while we build and test.</p></section></div></main></EmployerSupportShell>;
}
