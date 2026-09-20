"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "../../employer-support-portal.module.css";

type Message={id?:number;role:"user"|"leo";content:string;created_at?:string};

export default function EmployerSupportAskLeo({matterId,matter}:{matterId:number;matter:{title:string;description:string;status:string;matterType:string;subject:string}}){
 const [messages,setMessages]=useState<Message[]>([]);const [message,setMessage]=useState("");const [loading,setLoading]=useState(true);const [sending,setSending]=useState(false);const [error,setError]=useState("");const end=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{let live=true;fetch("/api/employer-support/matters/"+matterId+"/messages",{cache:"no-store"}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error);if(live)setMessages(p.messages||[])}).catch(()=>live&&setError("The Matter conversation could not be loaded.")).finally(()=>live&&setLoading(false));return()=>{live=false}},[matterId]);
 useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"})},[messages]);

 async function submit(e:FormEvent){e.preventDefault();const text=message.trim();if(!text||sending)return;setError("");setSending(true);setMessage("");
  const userMessage:Message={role:"user",content:text};setMessages(current=>[...current,userMessage]);
  try{
   const save=await fetch("/api/employer-support/matters/"+matterId+"/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(userMessage)});
   if(!save.ok)throw new Error("save failed");
   const response=await fetch("/api/ask-leo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({latestMessage:text,contextType:"matter",activeMatterId:matterId,matter,conversation:[...messages,userMessage].map(m=>({role:m.role,content:m.content})),previousMatters:[]})});
   if(!response.ok||!response.body)throw new Error("Leo unavailable");
   const reader=response.body.getReader();const decoder=new TextDecoder();let leoText="";
   setMessages(current=>[...current,{role:"leo",content:""}]);
   while(true){const {done,value}=await reader.read();if(done)break;leoText+=decoder.decode(value,{stream:true});setMessages(current=>{const copy=[...current];copy[copy.length-1]={role:"leo",content:leoText};return copy})}
   if(leoText.trim()){const leoSave=await fetch("/api/employer-support/matters/"+matterId+"/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:"leo",content:leoText.trim()})});if(!leoSave.ok)throw new Error("Leo response could not be saved");}
  }catch{setError("Leo could not complete that message. Your Matter has not been changed outside this conversation.");}
  finally{setSending(false)}
 }
 return <section className={styles.askCard}><div className={styles.askHeading}><span className={styles.leoSpark}>✦</span><div><p className={styles.eyebrow}>Ask Leo</p><h2>Continue this Matter with Leo</h2><p>Tell Leo what has changed, ask what to do next, or work through the next stage together.</p></div></div><div className={styles.conversation}>{loading?<p>Loading conversation...</p>:messages.length===0?<div className={styles.leoMessage}>Tell me what has happened and I will help you work through the Matter from here.</div>:messages.map((m,i)=><div key={m.id??i} className={m.role==="leo"?styles.leoMessage:styles.userMessage}><strong>{m.role==="leo"?"Ask Leo":"You"}</strong><p>{m.content}</p></div>)}<div ref={end}/></div>
 {error?<p className={styles.chatError}>{error}</p>:null}<form className={styles.chatForm} onSubmit={submit}><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tell Leo what has happened or what you need to do next..." rows={4}/><button className={styles.primaryButton} disabled={sending||!message.trim()}>{sending?"Leo is thinking...":"Send to Leo"}</button></form></section>
}
