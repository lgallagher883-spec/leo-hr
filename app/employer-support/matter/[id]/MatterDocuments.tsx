"use client";
import {useState} from "react";
import styles from "../../employer-support-portal.module.css";
type Doc={id:number;title:string;document_type:string;status:string;file_name?:string|null;created_at:string};
export default function MatterDocuments({documents}:{documents:Doc[]}){
 const [open,setOpen]=useState(false);const drafts=documents.filter(d=>d.document_type==="Leo draft"||d.status==="Draft");
 return <section className={styles.documentPanel}><div className={styles.panelHeading}><div><p className={styles.eyebrow}>Documents</p><h2>Documents and evidence</h2></div>{documents.length?<button type="button" className={styles.textButton} onClick={()=>setOpen(v=>!v)}>{open?"Show less":"View all"}</button>:null}</div>
 {documents.length?<div className={styles.documentList}>{documents.slice(0,open?documents.length:3).map(d=><div key={d.id} className={styles.documentRow}><span className={d.status==="Draft"?styles.draftIcon:styles.fileIcon}>{d.status==="Draft"?"✎":"↥"}</span><div><strong>{d.title}</strong><small>{d.document_type} · {d.status} · {new Date(d.created_at).toLocaleDateString("en-GB")}</small></div>{d.status==="Draft"?<em>Review before use</em>:<em>Evidence</em>}</div>)}</div>:<div className={styles.softEmpty}><span>↥</span><div><strong>No documents yet</strong><small>Upload relevant evidence or documents for this matter.</small></div></div>}
 {drafts.length>0?<p className={styles.draftReminder}>Documents prepared by Leo remain drafts until you review and use them.</p>:null}
 </section>
}