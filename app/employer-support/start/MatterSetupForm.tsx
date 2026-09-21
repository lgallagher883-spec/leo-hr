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
   <h2>What is happening?</h2>
   <p>You do not need to know which HR process applies. Tell Leo briefly what has happened and what you are concerned about. No matter is created at this stage.</p>
   <label>Tell Leo about the situation<textarea rows={8} value={issue} onChange={e=>{setIssue(e.target.value);if(assessment)setAssessment("");}} required minLength={20} maxLength={6000} placeholder="For example, an employee has raised a grievance against their manager and I have not dealt with one before."/></label>
   <button className={styles.primaryButton} disabled={loading||issue.trim().length<20}>{loading?"Leo is looking at this...":"See how Leo can help"}</button>
  </form>
  {error?<p className={styles.chatError}>{error}</p>:null}
  {assessment?<section className={styles.assessmentExperience}>
    <div className={styles.assessmentHero}>
      <div className={styles.heroCopy}><span className={styles.leoSpark}>✦</span><p className={styles.eyebrow}>Leo understands your situation</p><h2>Let's turn this headache into a clear plan.</h2><p className={styles.assessmentIntro}>Leo has picked out what matters in your situation. If you continue, that understanding becomes a working matter with guidance, documents and a clear record through to the outcome.</p><div className={styles.heroPromises}><span>Clear next step</span><span>Documents prepared</span><span>Support to outcome</span></div></div>
    </div>
    <div className={styles.assessmentColumnsWide}>
      <div className={styles.assessmentSummary}><p className={styles.eyebrow}>Leo's initial view</p><h3>Here's what Leo sees in your situation</h3><div className={styles.assessmentText}>{summary}</div><div className={styles.reassuranceStrip}><strong>You stay in control.</strong><span>Leo keeps you clear on the process, paperwork and next step.</span></div></div>
      <div className={styles.supportPlan}><p className={styles.eyebrow}>How Leo can help you</p><h3>Support that stays with you through the matter</h3>
       <div className={styles.supportItem}><b>01</b><span><strong>Know your next move</strong><small>Leo turns the situation into clear, manageable next steps.</small></span></div>
       <div className={styles.supportItem}><b>02</b><span><strong>Have the paperwork prepared</strong><small>Get the letters and practical documents you need as the matter develops.</small></span></div>
       <div className={styles.supportItem}><b>03</b><span><strong>Handle it with confidence</strong><small>Leo highlights process and risk points at the stage they matter.</small></span></div>
       <div className={styles.supportItem}><b>04</b><span><strong>Keep everything together</strong><small>Your guidance, evidence, documents and progress stay with the matter.</small></span></div>
      </div>
    </div>
    <div className={styles.journeySection}><p className={styles.eyebrow}>From here to a documented outcome</p><h3>Leo stays with the matter as it develops.</h3><p className={styles.assessmentIntro}>You will know what needs attention next, have the paperwork prepared when you need it, and keep the evidence and decisions together in one place.</p></div><div className={styles.purchasePanel}>
      <div><p className={styles.eyebrow}>Ready when you are</p><div className={styles.launchPrice}><strong>£99</strong><span>one-off launch price</span></div><p>Bring Leo into this matter now and keep the support with you through to the documented outcome. No subscription.</p></div>
      <div className={styles.purchaseAction}><button className={styles.primaryButton} onClick={checkout} disabled={checkoutLoading}>{checkoutLoading?"Preparing secure payment...":"Get support with this matter — £99"}</button><small>Your matter is created only after secure payment is confirmed.</small></div>
    </div>
   </section>:null}
 </div>
}