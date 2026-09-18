"use client";

import { FormEvent, useState } from "react";
import styles from "../employer-support-portal.module.css";

export default function MatterSetupForm(){
 const [issue,setIssue]=useState("");const [assessment,setAssessment]=useState("");const [loading,setLoading]=useState(false);const [checkoutLoading,setCheckoutLoading]=useState(false);const [error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault();if(loading)return;setLoading(true);setError("");setAssessment("");
  try{const response=await fetch("/api/employer-support/assessment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({issue})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Assessment failed");setAssessment(payload.assessment);}
  catch(err){setError(err instanceof Error?err.message:"Leo could not assess the issue just now.");}finally{setLoading(false)}
 }
 async function checkout(){if(checkoutLoading||!assessment)return;setCheckoutLoading(true);setError("");try{const response=await fetch("/api/employer-support/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({issue})});const payload=await response.json();if(!response.ok||!payload.url)throw new Error(payload.error||"Payment could not be prepared.");window.location.assign(payload.url);}catch(err){setError(err instanceof Error?err.message:"Payment could not be prepared.");setCheckoutLoading(false);}}
 return <div className={styles.setupForm}>
  <form className={styles.formSection} onSubmit={submit}>
   <h2>What Is Happening?</h2>
   <p>You do not need to know which HR process applies. Tell Leo briefly what has happened and what you are concerned about. No Matter is created at this stage.</p>
   <label>Tell Leo About The Situation<textarea rows={8} value={issue} onChange={e=>setIssue(e.target.value)} required minLength={20} maxLength={6000} placeholder="For example, an employee has raised a grievance against their manager and I have not dealt with one before."/></label>
   <button className={styles.primaryButton} disabled={loading||issue.trim().length<20}>{loading?"Leo Is Looking At This...":"See How Leo Can Help"}</button>
  </form>
  {error?<p className={styles.chatError}>{error}</p>:null}
  {assessment?<section className={styles.assessmentCard}><p className={styles.eyebrow}>How Ask Leo Can Help</p><h2>Support For Your Situation</h2><div className={styles.assessmentText}>{assessment}</div><div className={styles.assessmentIncluded}><span>One Matter</span><span>Guidance From Start To Finish</span><span>Letters And Documents Included</span></div><div className={styles.launchPrice}><strong>£99</strong><span>Launch Price Per Matter</span></div><button className={styles.primaryButton} onClick={checkout} disabled={checkoutLoading}>{checkoutLoading?"Preparing Secure Payment...":"Get Ask Leo Support For This Matter"}</button><p className={styles.paymentNote}>£99 one-off payment. No subscription required. Your Matter will only be created after payment is confirmed.</p></section>:null}
 </div>
}
