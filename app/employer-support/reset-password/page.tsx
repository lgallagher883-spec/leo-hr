"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../employer-support-auth.module.css";

export default function EmployerSupportResetPasswordPage() {
  const searchParams = useSearchParams();
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [ready,setReady]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(false);

  useEffect(()=>{const supabase=createClient();const code=searchParams.get("code");
    if(!code){setError("This recovery link is not valid.");return;}
    supabase.auth.exchangeCodeForSession(code).then(({data,error})=>{
      if(error||!data.session)setError("This recovery link has expired or is not valid.");
      else setReady(true);
    });
  },[searchParams]);

  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");
    if(password.length<8){setError("Use at least 8 characters.");return;}
    if(password!==confirm){setError("The passwords do not match.");return;}
    setLoading(true);
    const supabase=createClient();
    const {error:updateError}=await supabase.auth.updateUser({password});
    if(updateError){setError(updateError.message);setLoading(false);return;}
    await supabase.auth.signOut();setSuccess(true);setLoading(false);
  }

  return <main className={styles.page}><section className={styles.panel}>
    <Link className={styles.brand} href="/">Leo HR</Link>
    <p className={styles.eyebrow}>Ask Leo Employer Support</p>
    <h1>{success?"Password Updated":"Create A New Password"}</h1>
    {success?<div className={styles.confirmation}><p>Your password has been changed securely.</p><Link className={styles.primaryLink} href="/employer-support/sign-in">Return To Employer Support Sign In</Link></div>:
    <><p className={styles.intro}>Reset the password for your Employer Support account.</p>
    {error?<p className={styles.error} role="alert">{error}</p>:null}
    {ready?<form className={styles.form} onSubmit={submit}>
      <label>New Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/></label>
      <label>Confirm New Password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password"/></label>
      <button className={styles.primary} disabled={loading}>{loading?"Updating...":"Update Password"}</button>
    </form>:null}
    {!ready&&error?<p className={styles.switch}><Link href="/employer-support/forgot-password">Request A New Link</Link></p>:null}</>}
  </section><aside className={styles.aside}><p className={styles.eyebrow}>Secure Account Recovery</p><h2>Employer Support Stays Separate</h2><p>This recovery journey returns you only to your Ask Leo Employer Support workspace.</p></aside></main>;
}
