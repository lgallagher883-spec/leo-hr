"use client";
import {useState} from "react";
import styles from "../../employer-support-portal.module.css";

export default function MatterCompletion({matterId,status}:{matterId:number;status:string}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [showForm,setShowForm]=useState(false);
 const [outcome,setOutcome]=useState("");
 const complete=status.toLowerCase()==="completed";

 async function finish(){
  const value=outcome.trim();
  if(!value)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/employer-support/matters/"+matterId+"/complete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({outcome:value})});
   const p=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(p.error||"The matter could not be closed.");
   window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:"The matter could not be closed.");}
  finally{setBusy(false)}
 }

 return <section className={styles.completionCard}>
  <div>
   <p className={styles.eyebrow}>{complete?"Matter complete":"When the issue is resolved"}</p>
   <h2>{complete?"Matter record":"Close this matter"}</h2>
   <p>{complete?"This matter is closed. Download the matter bundle when you need a copy of the record. Your private Ask Leo conversation is not included.":"When the issue is resolved, record the outcome and close the matter. The chronology, actions and selected documents will remain in the matter record."}</p>
   {!complete&&showForm?<div className={styles.completionForm}>
    <label htmlFor={"matter-outcome-"+matterId}>Outcome</label>
    <textarea id={"matter-outcome-"+matterId} value={outcome} onChange={e=>setOutcome(e.target.value)} rows={5} placeholder="Briefly record how the matter was resolved." autoFocus />
    <div className={styles.completionFormActions}>
     <button type="button" onClick={finish} disabled={busy||!outcome.trim()}>{busy?"Closing…":"Confirm and close"}</button>
     <button type="button" className={styles.secondaryButton} onClick={()=>{setShowForm(false);setError("");}} disabled={busy}>Cancel</button>
    </div>
   </div>:null}
   {error?<p className={styles.chatError}>{error}</p>:null}
  </div>
  <div className={styles.completionActions}>
   {complete?<a className={styles.bundleButton} href={"/api/employer-support/matters/"+matterId+"/bundle"}>Download matter bundle</a>:null}
   {!complete&&!showForm?<button type="button" onClick={()=>setShowForm(true)}>Close this matter</button>:null}
  </div>
 </section>;
}
