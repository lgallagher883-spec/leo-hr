"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./employer-support-portal.module.css";

const links = [
  { href: "/employer-support", label: "Your Matters" },
  { href: "/employer-support/start", label: "Start a new Matter" },
  { href: "/employer-support/help", label: "Help & support" },
  { href: "/employer-support/account", label: "My account" },
];

export default function EmployerSupportShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/employer-support" className={styles.brand}>Leo HR</Link>
        <div className={styles.product}>Ask Leo <span>Employer Support</span></div>
        <nav className={styles.nav} aria-label="Employer Support">
          {links.map((link) => {
            const active = link.href === "/employer-support"
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return <Link key={link.href} href={link.href} className={active ? styles.active : styles.navLink}>{link.label}</Link>;
          })}
        </nav>
        <div className={styles.sidebarNote}>One secure employer account. Each Matter is kept separate.</div>
      </aside>
      <div className={styles.main}>
        <header className={styles.mobileHeader}><Link href="/employer-support" className={styles.brand}>Leo HR</Link><span>Employer Support</span></header>
        {children}
      </div>
    </div>
  );
}
