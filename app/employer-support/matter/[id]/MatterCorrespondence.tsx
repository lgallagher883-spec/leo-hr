"use client";
import {FormEvent,useState} from "react";
import styles from "../../employer-support-portal.module.css";
const OPTIONS=[
 ["investigation_invitation","Investigation meeting invitation"],
 ["disciplinary_invitation","Disciplinary hearing invitation"],
 ["grievance_acknowledgement","Grievance acknowledgement"],
 ["grievance_meeting_invitation","Grievance meeting invitation"],
 ["outcome_letter","Outcome letter"],
] as const;
export default function MatterCorrespondence({matterId}:{matterId:number}){
 const [open,setOpen]=useState(false);const [type,setType]=useState<(typeof OPTIONS)[number][0]>("investigation_invitation");const [instructions,setInstructions]=useState("");const [working,setWorking]=useState(false);const [error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault();if(working)return;setWorking(true);setError("");
  try{const r=await fetch(`/api/employer-support/matters/${matterId}/correspondence`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,instructions})});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"The draft could not be prepared.");window.location.reload();}catch(e){setError(e instanceof Error?e.message:"The draft could not be prepared.");}finally{setWorking(false)}
 }
 if(!open)return <button type="button" className={styles.toolButton} onClick={()=>setOpen(true)}><span>✎</span><div><strong>Prepare correspondence</strong><small>Create a draft letter for this matter</small></div></button>;
 return <form onSubmit={submit} className={styles.correspondenceForm}><div className={styles.correspondenceHeading}><div><strong>Prepare correspondence</strong><small>Leo will create a draft for you to review before use.</small></div><button type="button" className={styles.textButton} onClick={()=>setOpen(false)} disabled={working}>Cancel</button></div>
  <label><span>Letter type</span><select value={type} onChange={e=>setType(e.target.value as typeof type)} disabled={working}>{OPTIONS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  <label><span>Anything Leo should know for this letter?</span><textarea value={instructions} onChange={e=>setInstructions(e.target.value)} maxLength={2000} rows={4} placeholder="Optional — for example, meeting date, time, location or the name of the manager conducting it." disabled={working}/></label>
  <div className={styles.correspondenceFooter}><small>{instructions.length}/2000</small><button className={styles.primaryButton} disabled={working}>{working?"Preparing draft…":"Prepare draft"}</button></div>
  {error?<p className={styles.chatError}>{error}</p>:null}
 </form>;
}
