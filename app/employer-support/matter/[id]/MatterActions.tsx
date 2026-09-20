"use client";
import {useState} from "react";
import styles from "../../employer-support-portal.module.css";
type Action={id:number;title:string;detail?:string|null;status:string};
export default function MatterActions({matterId,initialActions}:{matterId:number;initialActions:Action[]}){
 const [actions,setActions]=useState(initialActions);const [busy,setBusy]=useState<number|null>(null);const [adding,setAdding]=useState(false);
 async function toggle(a:Action){setBusy(a.id);const status=a.status==="done"?"open":"done";try{const r=await fetch(`/api/employer-support/matters/${matterId}/actions`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({actionId:a.id,status})});if(r.ok)setActions(v=>v.map(x=>x.id===a.id?{...x,status}:x));}finally{setBusy(null)}}
 async function add(){const title=window.prompt("What needs to happen next?")?.trim();if(!title)return;const detail=window.prompt("Add a short note for this step (optional)")?.trim()||"";setAdding(true);try{const r=await fetch(`/api/employer-support/matters/${matterId}/actions/create`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,detail})});const p=await r.json();if(r.ok)setActions(v=>[...v,p.action]);}finally{setAdding(false)}}
 return <section className={styles.actionPanel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>Next steps</p><h2>Actions for this matter</h2></div><div className={styles.panelControls}><span>{actions.filter(a=>a.status==="open").length} open</span><button type="button" onClick={add} disabled={adding}>{adding?"Adding...":"+ Add step"}</button></div></div>
 {actions.length?<div className={styles.actionList}>{actions.map(a=><button key={a.id} onClick={()=>toggle(a)} disabled={busy===a.id} className={a.status==="done"?styles.actionDone:styles.actionRow}><i>{a.status==="done"?"✓":"○"}</i><span><strong>{a.title}</strong>{a.detail?<small>{a.detail}</small>:null}</span></button>)}</div>:<div className={styles.softEmpty}><span>✓</span><div><strong>No actions at the moment</strong><small>Actions agreed while working with Leo will appear here.</small></div></div>}
 </section>
}