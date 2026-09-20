"use client";
import {useState} from "react";
import styles from "../../employer-support-portal.module.css";
type Action={id:number;title:string;detail?:string|null;status:string};
export default function MatterActions({matterId,initialActions}:{matterId:number;initialActions:Action[]}){
 const [actions,setActions]=useState(initialActions);const [busy,setBusy]=useState<number|null>(null);
 async function toggle(a:Action){setBusy(a.id);const status=a.status==="done"?"open":"done";try{const r=await fetch(`/api/employer-support/matters/${matterId}/actions`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({actionId:a.id,status})});if(r.ok)setActions(v=>v.map(x=>x.id===a.id?{...x,status}:x));}finally{setBusy(null)}}
 return <section className={styles.actionPanel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>Your next steps</p><h2>Keep the Matter moving</h2></div><span>{actions.filter(a=>a.status==="open").length} open</span></div>
 {actions.length?<div className={styles.actionList}>{actions.map(a=><button key={a.id} onClick={()=>toggle(a)} disabled={busy===a.id} className={a.status==="done"?styles.actionDone:styles.actionRow}><i>{a.status==="done"?"✓":"○"}</i><span><strong>{a.title}</strong>{a.detail?<small>{a.detail}</small>:null}</span></button>)}</div>:<div className={styles.softEmpty}><span>✓</span><div><strong>Nothing waiting on you right now</strong><small>As you work with Leo, clear actions will appear here when something needs doing.</small></div></div>}
 </section>
}