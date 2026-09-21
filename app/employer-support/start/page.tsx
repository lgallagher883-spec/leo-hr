import { redirect } from "next/navigation";
import { getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import EmployerSupportShell from "../EmployerSupportShell";
import MatterSetupForm from "./MatterSetupForm";
import styles from "../employer-support-portal.module.css";

export default async function StartEmployerSupportMatterPage({searchParams}:{searchParams?:Promise<{payment?:string}>}) {
  const access = await getEmployerSupportAccess();
  const params=searchParams?await searchParams:{};
  if (!access) redirect("/employer-support/sign-in");
  return <EmployerSupportShell><main className={styles.content}><div className={styles.narrow}>{params.payment==="cancelled"?<div className={styles.checkoutCancelled} role="status"><span>←</span><div><strong>No payment was taken</strong><p>You left secure checkout before paying. Your assessment is not a purchased matter, so you can start again whenever you are ready.</p></div></div>:null}<p className={styles.eyebrow}>Start a new matter</p><h1>Tell Leo about the issue</h1><p className={styles.lead}>Each employee issue is kept as a separate matter. Tell Leo briefly what is happening. Leo will explain how Employer Support can help you handle it from beginning to end before you decide whether to proceed.</p><MatterSetupForm/></div></main></EmployerSupportShell>;
}
