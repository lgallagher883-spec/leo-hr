"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "../../employer-support-portal.module.css";

type Message={id?:number;role:"user"|"leo";content:string;created_at?:string};

export default function EmployerSupportAskLeo({matterId,matter}:{matterId:number;matter:{title:string;description:string;status:string;matterType:string;subject:string}}){
 const [messages,setMessages]=useState<Message[]>([]);const [message,setMessage]=useState("");const [loading,setLoading]=useState(true);const [sending,setSending]=useState(false);const initialReplyStarted=useRef(false);const [error,setError]=useState("");const end=useRef<HTMLDivElement|null>(null); const closed=matter.status.toLowerCase()==="completed";
 useEffect(()=>{let live=true;fetch("/api/employer-support/matters/"+matterId+"/messages",{cache:"no-store"}).then(async r=>{const p=await r.json();if(!r.ok)throw new Error(p.error);if(live)setMessages(p.messages||[])}).catch(()=>live&&setError("The matter conversation could not be loaded.")).finally(()=>live&&setLoading(false));return()=>{live=false}},[matterId]);
 useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"})},[messages]);
 useEffect(()=>{if(loading||sending||initialReplyStarted.current||messages.length!==1||messages[0]?.role!=="user")return;initialReplyStarted.current=true;void generateLeoReply(messages[0].content,messages,false)},[loading,messages,sending]);

 async function generateLeoReply(text:string,conversationMessages:Message[],appendUser:boolean){
  setError("");setSending(true);
  const userMessage:Message={role:"user",content:text};
  if(appendUser)setMessages(current=>[...current,userMessage]);
  try{
   if(appendUser){const save=await fetch("/api/employer-support/matters/"+matterId+"/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(userMessage)});if(!save.ok)throw new Error("save failed");}
   const response=await fetch("/api/ask-leo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({latestMessage:text,contextType:"matter",activeMatterId:matterId,matter,conversation:conversationMessages.map(m=>({role:m.role,content:m.content})),previousMatters:[]})});
   if(!response.ok||!response.body)throw new Error("Leo unavailable");
   const reader=response.body.getReader();const decoder=new TextDecoder();let leoText="";let buffer="";
   setMessages(current=>[...current,{role:"leo",content:""}]);
   while(true){const {done,value}=await reader.read();buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});const lines=buffer.split("\n");buffer=done?"":lines.pop()||"";for(const line of lines){if(!line.trim())continue;try{const event=JSON.parse(line);if(event.type==="delta"&&typeof event.delta==="string")leoText+=event.delta;if(event.type==="error")throw new Error(event.error||"Leo unavailable");}catch(parseError){if(parseError instanceof SyntaxError)continue;throw parseError;}}setMessages(current=>{const copy=[...current];copy[copy.length-1]={role:"leo",content:leoText};return copy});if(done)break;}
   if(buffer.trim()){try{const event=JSON.parse(buffer);if(event.type==="delta"&&typeof event.delta==="string")leoText+=event.delta;}catch{}}
   if(leoText.trim()){const leoSave=await fetch("/api/employer-support/matters/"+matterId+"/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:"leo",content:leoText.trim()})});if(!leoSave.ok)throw new Error("Leo response could not be saved");}
  }catch{setError("Leo could not complete that message. No changes have been made to the matter outside this conversation.");}
  finally{setSending(false)}
 }

 async function submit(e:FormEvent){e.preventDefault();const text=message.trim();if(!text||sending)return;setMessage("");const existing=[...messages,{role:"user" as const,content:text}];await generateLeoReply(text,existing,true);}
 return <section className={styles.askCard}><div className={styles.askHeading}><span className={styles.leoSpark}>✦</span><div><p className={styles.eyebrow}>Ask Leo</p><h2>Continue with Ask Leo</h2><p>Ask what to do next, update Leo on what has happened, or ask for help preparing a document.</p></div></div><div className={styles.conversation}>{loading?<p>Loading conversation...</p>:sending&&messages.length===1?<div className={styles.leoMessage}><strong>Ask Leo</strong><p>Reviewing the issue and preparing your first guidance…</p></div>:messages.length===0?<div className={styles.leoMessage}>Tell me what has happened and I can help you decide what to do next.</div>:messages.map((m,i)=><div key={m.id??i} className={m.role==="leo"?styles.leoMessage:styles.userMessage}><strong>{m.role==="leo"?"Ask Leo":"You"}</strong><p>{m.content}</p></div>)}<div ref={end}/></div>
 {error?<p className={styles.chatError}>{error}</p>:null}{closed?<div className={styles.closedConversation}><strong>This matter is closed</strong><p>The conversation is now read-only. Your record and bundle remain available.</p></div>:<form className={styles.chatForm} onSubmit={submit}><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask Leo a question or give an update..." rows={4}/><button className={styles.primaryButton} disabled={sending||!message.trim()}>{sending?"Working...":"Send to Leo"}</button></form>}</section>
}
