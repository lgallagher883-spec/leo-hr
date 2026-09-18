"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../employer-support-auth.module.css";

export default function EmployerSupportSignInPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setError("");
    if(!email.trim()||!password){setError("Enter your work email and password.");return;}
    setLoading(true);
    try{
      const supabase=createClient();
      const {error:signInError}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
      if(signInError){setError("We could not sign you in with those details.");return;}
      window.location.assign("/employer-support");
    }catch{setError("Sign in is temporarily unavailable. Please try again.");}
    finally{setLoading(false);}
  }

  return <main className={styles.page}>
    <section className={styles.panel}>
      <Link className={styles.brand} href="/">Leo HR</Link>
      <p className={styles.eyebrow}>Ask Leo Employer Support</p>
      <h1>Welcome Back</h1>
      <p className={styles.intro}>Sign in to continue an existing Matter or start a new one.</p>
      <form onSubmit={submit} className={styles.form}>
        <label>Work Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>
        <div className={styles.formActions}><Link href="/employer-support/forgot-password">Forgotten your password?</Link></div>
        {error?<p className={styles.error} role="alert">{error}</p>:null}
        <button className={styles.primary} disabled={loading}>{loading?"Signing In...":"Sign In"}</button>
      </form>
      <p className={styles.switch}>New to Ask Leo Employer Support? <Link href="/employer-support/sign-up">Create Account</Link></p>
    </section>
    <aside className={styles.aside}>
      <p className={styles.eyebrow}>Your Matters</p>
      <h2>Pick Up Exactly Where You Left Off</h2>
      <p>Your Matter history, documents, next steps and Ask Leo guidance stay together in your secure Employer Support workspace.</p>
      <div className={styles.note}><strong>Returning with a different employee issue?</strong><span>Sign in to the same employer account and choose Start A New Matter.</span></div>
    </aside>
  </main>;
}
