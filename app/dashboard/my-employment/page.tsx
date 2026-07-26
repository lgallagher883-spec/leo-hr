"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type MyEmploymentResponse={
 success:boolean;
 employee?:{name:string;role:string|null;status:string|null;startDate:string|null};
 error?:string;
};

export default function MyEmploymentPage(){
 const router=useRouter();
 const [data,setData]=useState<MyEmploymentResponse|null>(null);
 const [loading,setLoading]=useState(true);

 useEffect(()=>{
  fetch("/api/my-employment",{cache:"no-store"})
   .then(r=>r.json())
   .then(setData)
   .finally(()=>setLoading(false));
 },[]);

 return (
<main style={pageStyle}>
<header style={headerStyle}>
<div>
<p style={eyebrowStyle}>Employee workspace</p>
<h1 style={titleStyle}>My Employment</h1>
<p style={subtitleStyle}>
{loading?"Loading your employment record...":data?.employee?`Welcome ${data.employee.name}.`:data?.error??"Review your employment information and open the areas available to you."}
</p>
</div>
<button type="button" onClick={()=>router.push("/dashboard/employee")} style={secondaryButtonStyle}>Back to dashboard</button>
</header>

<section style={introCardStyle}>
<div style={iconStyle}>✓</div>
<div>
<h2 style={introTitleStyle}>Current employment</h2>
<p style={introTextStyle}>
{loading?"Loading…":data?.employee?`${data.employee.role??"Employee"} • ${data.employee.status??"Unknown status"}`:"Employment record unavailable."}
</p>
</div>
</section>

<section style={gridStyle}>
{card("Employment details","Review your role, manager and employment dates.","View employment details",()=>router.push("/dashboard/my-employment/details"))}
{card("Leave","Review leave information.","Open leave",()=>router.push("/dashboard/my-employment/leave"))}
{card("Learning","View assigned learning.","Open learning",()=>router.push("/dashboard/my-employment/learning"))}
{card("Documents","Access your documents.","Open documents",()=>router.push("/dashboard/my-employment/documents"))}
{card("Upcoming reviews","Review upcoming reviews.","View reviews",()=>router.push("/dashboard/my-employment/reviews"))}
{card("Emergency contacts","Maintain emergency contacts.","Open emergency contacts",()=>router.push("/dashboard/my-employment/emergency-contacts"))}
{card("Medical & fit notes","Medical records.","Open medical",()=>router.push("/dashboard/my-employment/medical"))}
{card("Checks & compliance","Right to Work, DBS and driving.","Open checks",()=>router.push("/dashboard/my-employment/right-to-work"))}
</section>
</main>);
}

function card(title:string,description:string,actionLabel:string,onClick:()=>void){
return <button type="button" onClick={onClick} style={cardStyle}><span style={cardTitleStyle}>{title}</span><span style={cardDescriptionStyle}>{description}</span><span style={cardActionStyle}>{actionLabel}<span>→</span></span></button>
}

const pageStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#6E5084",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "30px",
  lineHeight: 1.2,
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const subtitleStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#6B7280",
  fontSize: "15px",
  lineHeight: 1.5,
};

const secondaryButtonStyle: CSSProperties = {
  background: "#FFFFFF",
  color: "#6E5084",
  border: "1px solid #CDB2E2",
  padding: "11px 16px",
  borderRadius: "11px",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(110, 80, 132, 0.08)",
};

const introCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "14px",
  marginBottom: "24px",
  padding: "20px",
  background: "#F7F1FC",
  border: "1px solid #E9D5FF",
  borderRadius: "18px",
  boxShadow: "0 8px 22px rgba(110, 80, 132, 0.06)",
};

const iconStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  minWidth: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "#F5FFF9",
  color: "#2F7D57",
  fontSize: "16px",
  fontWeight: 800,
};

const introTitleStyle: CSSProperties = {
  margin: 0,
  color: "#6E5084",
  fontSize: "17px",
  lineHeight: 1.4,
  fontWeight: 700,
};

const introTextStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#4B5563",
  fontSize: "14px",
  lineHeight: 1.55,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
};

const cardStyle: CSSProperties = {
  width: "100%",
  minHeight: "210px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "16px",
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "18px",
  padding: "24px",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
};

const cardTitleStyle: CSSProperties = {
  color: "#111827",
  fontSize: "17px",
  lineHeight: 1.35,
  fontWeight: 700,
};

const cardDescriptionStyle: CSSProperties = {
  flex: 1,
  color: "#6B7280",
  fontSize: "14px",
  lineHeight: 1.55,
};

const cardActionStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  paddingTop: "16px",
  borderTop: "1px solid #F0EAF4",
  color: "#6E5084",
  fontSize: "14px",
  fontWeight: 700,
};