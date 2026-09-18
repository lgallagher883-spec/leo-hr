"use client";

import { FormEvent, useState } from "react";
import styles from "../employer-support-portal.module.css";

export default function MatterSetupForm(){
 const [employeeName,setEmployeeName]=useState("");const [jobTitle,setJobTitle]=useState("");const [startDate,setStartDate]=useState("");const [manager,setManager]=useState("");const [matterType,setMatterType]=useState("");const [summary,setSummary]=useState("");
 function submit(e:FormEvent){e.preventDefault();}
 return <form className={styles.setupForm} onSubmit={submit}>
  <div className={styles.formSection}><h2>Employee Details</h2><p>Give Leo enough information to identify who this Matter relates to. This does not create a full employee record.</p><label>Employee Name<input value={employeeName} onChange={e=>setEmployeeName(e.target.value)} required/></label><div className={styles.formGrid}><label>Job Title<input value={jobTitle} onChange={e=>setJobTitle(e.target.value)}/></label><label>Employment Start Date<input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label></div><label>Manager Or Relevant Contact<input value={manager} onChange={e=>setManager(e.target.value)}/></label></div>
  <div className={styles.formSection}><h2>What Has Happened?</h2><label>Type Of Issue<select value={matterType} onChange={e=>setMatterType(e.target.value)} required><option value="">Select</option><option>Grievance</option><option>Disciplinary</option><option>Capability Or Performance</option><option>Sickness Or Absence</option><option>Probation</option><option>Conduct Concern</option><option>Flexible Working</option><option>Other Employee Issue</option></select></label><label>Tell Leo What Has Happened<textarea rows={7} value={summary} onChange={e=>setSummary(e.target.value)} required placeholder="Explain the issue in your own words. Include important dates or events if you know them."/></label></div>
  <div className={styles.formSection}><h2>Relevant Documents</h2><p>You will be able to add the contract, relevant policy, complaint or grievance, emails, notes and other evidence securely to the Matter. We will not ask you to upload documents that are not relevant.</p></div>
  <div className={styles.checkoutHold}><strong>Review Before Payment</strong><p>Nothing will be charged from this screen while Employer Support is being built and tested. The final journey will let you review this information before the one-off Matter purchase.</p><button className={styles.primaryButton} disabled>Continue To Review</button></div>
 </form>
}
