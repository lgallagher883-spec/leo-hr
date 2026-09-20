"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "../employer-support-auth.module.css";

export default function EmployerSupportForgotPasswordPage(){
 const[email,setEmail]=useState("");const[loading,setLoading]=useState(false);const[error,setError]=useState("");const[sent,setSent]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");if(!email.trim()||!email.includes("@")){setError("Enter your work email address.");return;}setLoading(true);try{
  const current=window.location.origin;
  const origin=current==="https://leohr.co.uk"||current==="https://www.leohr.co.uk"?"https://app.leohr.co.uk":current;
  const supabase=createClient();const {error:resetError}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:`${origin}/employer-support/reset-password`});
  if(resetError)throw resetError;setSent(true);
 }catch{setError("We could not send the reset email. Please try again.");}finally{setLoading(false);}}
 return <main className={styles.page}><section className={styles.panel}><Link className={styles.brand} href="/">Leo HR</Link><p className={styles.eyebrow}>Ask Leo Employer Support</p><h1>{sent?"Check Your Email":"Reset Your Password"}</h1>{sent?<div className={styles.confirmation}><p>If an account is registered for that email address, a secure password reset link has been sent.</p><Link className={styles.primaryLink} href="/employer-support/sign-in">Back To Sign In</Link></div>:<><p className={styles.intro}>Enter the work email address for your Employer Support account.</p><form className={styles.form} onSubmit={submit}><label>Work Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>{error?<p className={styles.error} role="alert">{error}</p>:null}<button className={styles.primary} disabled={loading}>{loading?"Sending...":"Send Reset Link"}</button></form><p className={styles.switch}><Link href="/employer-support/sign-in">Back To Sign In</Link></p></>}</section><aside className={styles.aside}><p className={styles.eyebrow}>Secure Account Recovery</p><h2>Get Back To Your Matter Safely</h2><p>The reset link is sent to your registered email address. Your Matter information is not included in the email.</p></aside></main>;
}