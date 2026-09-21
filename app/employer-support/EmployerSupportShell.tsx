"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import type { ReactNode } from "react";
import styles from "./employer-support-portal.module.css";

const links = [
  { href: "/employer-support", label: "Your matters" },
  { href: "/employer-support/start", label: "Start a new matter" },
  { href: "/employer-support/help", label: "Help and support" },
  { href: "/employer-support/account", label: "My account" },
];

export default function EmployerSupportShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut,setSigningOut]=useState(false);const [mobileOpen,setMobileOpen]=useState(false);
  async function signOut(){setSigningOut(true);try{const supabase=createClient();await supabase.auth.signOut();router.replace("/employer-support/sign-in");router.refresh();}finally{setSigningOut(false)}}
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
        <div className={styles.sidebarNote}>One secure employer account. Each matter is kept separate.</div><button type="button" className={styles.signOutButton} onClick={signOut} disabled={signingOut}>{signingOut?"Signing out…":"Sign out"}</button>
      </aside>
      <div className={styles.main}>
        <header className={styles.mobileHeader}><Link href="/employer-support" className={styles.brand}>Leo HR</Link><button type="button" className={styles.mobileMenuButton} onClick={()=>setMobileOpen(v=>!v)} aria-expanded={mobileOpen} aria-controls="employer-support-mobile-nav">{mobileOpen?"Close":"Menu"}</button></header>
        {mobileOpen?<div id="employer-support-mobile-nav" className={styles.mobileNav}>{links.map(link=>{const active=link.href==="/employer-support"?pathname===link.href:pathname.startsWith(link.href);return <Link key={link.href} href={link.href} className={active?styles.active:styles.navLink} onClick={()=>setMobileOpen(false)}>{link.label}</Link>})}<button type="button" className={styles.mobileSignOut} onClick={signOut} disabled={signingOut}>{signingOut?"Signing out…":"Sign out"}</button></div>:null}
        {children}
      </div>
    </div>
  );
}
