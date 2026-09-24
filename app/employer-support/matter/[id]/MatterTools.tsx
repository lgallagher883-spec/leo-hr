"use client";
import {ChangeEvent,useState} from "react";
import styles from "../../employer-support-portal.module.css";
import MatterCorrespondence from "./MatterCorrespondence";

export default function MatterTools({matterId}:{matterId:number}){
 const [uploading,setUploading]=useState(false);const [message,setMessage]=useState("");
 async function upload(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;setUploading(true);setMessage("");
  const form=new FormData();form.append("file",file);form.append("documentType","Evidence");form.append("includeInBundle","true");
  try{const r=await fetch(`/api/employer-support/matters/${matterId}/documents`,{method:"POST",body:form});const p=await r.json();if(!r.ok)throw new Error(p.error);setMessage("Added to this matter.");window.location.reload();}catch(err){setMessage(err instanceof Error?err.message:"The file could not be uploaded.");}finally{setUploading(false);e.target.value="";}
 }
 return <div className={styles.matterTools}>
  <label className={styles.toolButton}><span>＋</span><div><strong>{uploading?"Adding document...":"Add document or evidence"}</strong><small>PDF, Word, Excel, text, CSV or image</small></div><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp" onChange={upload} disabled={uploading}/></label>
  <MatterCorrespondence matterId={matterId}/>
  <button type="button" className={styles.toolButton} onClick={()=>{const box=document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Ask Leo"]');box?.scrollIntoView({behavior:"smooth",block:"center"});box?.focus();}}><span>✦</span><div><strong>Ask Leo what to do next</strong><small>Continue with this matter</small></div></button>
  {message?<p className={styles.toolMessage}>{message}</p>:null}
 </div>
}