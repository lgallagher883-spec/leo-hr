"use client";

import { useState } from "react";
import ResourcePreview from "@/components/resources/ResourcePreview";

import { downloadBrandedWordFromElement, openBrandedPdfFromElement } from "@/lib/documents/browserExport";
const resourceTitle = "Sales Executive Job Description";
const resourceId = "sales-executive";
const resourceSummary =
  "A commercially focused job description for a Sales Executive, with outcomes, responsibilities, skills and adaptable success measures.";

const askLeoPrompt = [
  `I am reviewing the LEO job description "${resourceTitle}".`,
  resourceSummary,
  "Please help me adapt this job description to my organisation and the role I need.",
].join("\n\n");

const askLeoHref =
  `/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
  `&resourceTitle=${encodeURIComponent(resourceTitle)}` +
  `&resourceType=${encodeURIComponent("Job Description")}` +
  `&returnUrl=${encodeURIComponent("/dashboard/policies/job-descriptions/sales-executive")}`;

export default function SalesExecutiveJobDescriptionPage() {
  const [added, setAdded] = useState(false);

  function getExportDocument() {
    const article = document.getElementById("resource-content");
    if (!article) return "";

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${resourceTitle}</title>
<style>
@page{size:A4;margin:18mm}
body{max-width:820px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#334155;line-height:1.65}
h1,h2,h3{color:#6e5084}h1{font-size:30px;margin-bottom:24px}h2{font-size:20px;margin-top:28px}
p,li{font-size:11pt}.role-grid,.outcome-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0 24px}
.role-card,.outcome-card{padding:12px;border:1px solid #e1e5ea;border-radius:10px;background:#f7f1fc}.role-card strong,.outcome-card strong{display:block;color:#6e5084;margin-bottom:5px}
.notice{margin-top:28px;padding:14px;border:1px solid #dcece4;background:#f5fff9}
</style></head><body><h1>${resourceTitle}</h1>${article.innerHTML}</body></html>`;
  }

  async function downloadWord() {
    await downloadBrandedWordFromElement(resourceTitle);
  }

  async function openPdf() {
    await openBrandedPdfFromElement(resourceTitle);
  }

  function addToOrganisationResources() {
    window.alert(
      "Direct saving from the LEO library is not yet persistent. Download the Word version and upload it from HR Resources if you want an organisation-owned copy."
    );
    setAdded(true);
  }

  return (
    <ResourcePreview
      title={resourceTitle}
      category="Job Description"
      summary={resourceSummary}
      topic="Sales"
      resourceId={resourceId}
      lastUpdated="13 September 2026"
      backHref="/dashboard/policies/job-descriptions"
      backLabel="Back to Job Descriptions"
      onWord={downloadWord}
      onPdf={openPdf}
      onPrint={() => window.print()}
      onAddToOrganisationResources={addToOrganisationResources}
      addedToOrganisationResources={added}
      askLeoHref={askLeoHref}
      relatedResources={[
        { title: "Office Manager Job Description", href: "/dashboard/policies/job-descriptions/office-manager" },
      ]}
    >
      <div className="role-grid">
        <div className="role-card"><strong>Reports to</strong>Sales Manager</div>
        <div className="role-card"><strong>Location</strong>[Insert location]</div>
        <div className="role-card"><strong>Working hours</strong>[Insert hours]</div>
      </div>

      <h2>Role purpose</h2>
      <p>
        Build new customer relationships, understand commercial needs and convert suitable
        opportunities into sustainable sales while maintaining a professional customer experience.
      </p>

      <h2>What success looks like</h2>
      <div className="outcome-grid">
        <div className="outcome-card"><strong>Pipeline</strong>Maintain a healthy, accurate pipeline of suitable opportunities.</div>
        <div className="outcome-card"><strong>Customers</strong>Build professional relationships and understand customer needs.</div>
        <div className="outcome-card"><strong>Results</strong>Work towards agreed, reasonable sales objectives and quality standards.</div>
      </div>

      <h2>Core responsibilities</h2>
      <ul>
        <li>Identify and develop prospective customer opportunities.</li>
        <li>Conduct discovery conversations and explain relevant products or services accurately.</li>
        <li>Prepare proposals, follow up opportunities and maintain clear CRM records.</li>
        <li>Work collaboratively with colleagues to support a positive customer experience.</li>
        <li>Keep product, market and competitor knowledge current.</li>
        <li>Follow applicable company policies, sales standards and data protection requirements.</li>
      </ul>

      <h2>Skills and experience</h2>
      <ul>
        <li>Confident communication and relationship-building skills.</li>
        <li>Commercial awareness and a customer-focused approach.</li>
        <li>Ability to organise a pipeline and follow through on commitments.</li>
        <li>Sales experience is desirable; relevant transferable experience may also be suitable.</li>
      </ul>

      <h2>Success measures</h2>
      <p>
        Measures should be set separately and reviewed regularly. They may include appropriate
        activity, pipeline quality, conversion, revenue and customer outcomes. Targets should
        reflect the role and business context.
      </p>

      <div className="notice">
        <strong>LEO practical note</strong>
        <p>
          Keep targets and success measures realistic, transparent and relevant to the role.
          Review the job description when responsibilities materially change.
        </p>
      </div>

      <style jsx>{`
        .role-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:8px}
        .outcome-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
        .role-card,.outcome-card{padding:14px;border:1px solid #e8dfeb;border-radius:12px;background:#f7f1fc;color:#526174}
        .role-card strong,.outcome-card strong{display:block;margin-bottom:5px;color:#6e5084;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
        @media(max-width:720px){.role-grid,.outcome-grid{grid-template-columns:1fr}}
      `}</style>
    </ResourcePreview>
  );
}
