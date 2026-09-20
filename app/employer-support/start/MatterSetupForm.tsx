"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "../employer-support-portal.module.css";

function cleanAssessment(value:string){
 return value.replace(/\*\*/g,"").replace(/^#{1,6}\s*/gm,"").trim();
}

export default function MatterSetupForm(){
 const [issue,setIssue]=useState("");const [assessment,setAssessment]=useState("");const [loading,setLoading]=useState(false);const [checkoutLoading,setCheckoutLoading]=useState(false);const [error,setError]=useState("");
 const summary=useMemo(()=>cleanAssessment(assessment),[assessment]);
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
  {assessment?<section className={styles.assessmentExperience}>
    <div className={styles.assessmentHero}>
      <div><p className={styles.eyebrow}>Leo Understands The Issue</p><h2>You Do Not Have To Handle This Alone</h2><p className={styles.assessmentIntro}>Leo can guide this employee matter from the next step through to a documented outcome, while you stay in control of the decisions.</p></div>
      <div className={styles.matterVisual} aria-hidden="true"><span>Issue</span><i>→</i><span>Guidance</span><i>→</i><span>Outcome</span></div>
    </div>
    <div className={styles.assessmentColumns}>
      <div className={styles.assessmentSummary}><p className={styles.eyebrow}>What Leo Has Identified</p><div className={styles.assessmentText}>{summary}</div></div>
      <div className={styles.supportPlan}><p className={styles.eyebrow}>What You Get</p><h3>Leo stays with the Matter.</h3>
       <div className={styles.supportItem}><b>01</b><span><strong>Clear next steps</strong><small>Know what to do, when to do it and what to consider.</small></span></div>
       <div className={styles.supportItem}><b>02</b><span><strong>Letters & documents</strong><small>Draft the practical paperwork needed as the Matter develops.</small></span></div>
       <div className={styles.supportItem}><b>03</b><span><strong>Process & risk guidance</strong><small>Spot procedural issues before they become bigger problems.</small></span></div>
       <div className={styles.supportItem}><b>04</b><span><strong>One organised workspace</strong><small>Keep the guidance, evidence and progress together through to outcome.</small></span></div>
      </div>
    </div>
    <div className={styles.purchasePanel}>
      <div><p className={styles.eyebrow}>One Matter · One Payment</p><div className={styles.launchPrice}><strong>£99</strong><span>launch price</span></div><p>No subscription. Support, guidance, letters and documents through to completion.</p></div>
      <div className={styles.purchaseAction}><button className={styles.primaryButton} onClick={checkout} disabled={checkoutLoading}>{checkoutLoading?"Preparing Secure Payment...":"Get Support With This Matter — £99"}</button><small>Your Matter is created only after secure payment is confirmed.</small></div>
    </div>
   </section>:null}
 </div>
}