import { redirect } from "next/navigation";
import { getEmployerSupportAccess } from "@/lib/auth/employerSupportAccess";
import EmployerSupportShell from "../EmployerSupportShell";
import MatterSetupForm from "./MatterSetupForm";
import styles from "../employer-support-portal.module.css";

export default async function StartEmployerSupportMatterPage() {
  const access = await getEmployerSupportAccess();
  if (!access) redirect("/employer-support/sign-in");
  return <EmployerSupportShell><main className={styles.content}><div className={styles.narrow}><p className={styles.eyebrow}>Start A New Matter</p><h1>Tell Leo About The Issue</h1><p className={styles.lead}>Each employee issue is kept as a separate Matter. Tell Leo briefly what is happening. Leo will explain how Employer Support can help you handle it from beginning to end before you decide whether to proceed.</p><MatterSetupForm/></div></main></EmployerSupportShell>;
}
