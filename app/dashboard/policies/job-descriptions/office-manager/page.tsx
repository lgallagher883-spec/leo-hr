"use client";

import { useState } from "react";
import ResourcePreview from "@/components/resources/ResourcePreview";

const resourceTitle = "Office Manager Job Description";
const resourceId = "office-manager";
const resourceSummary =
  "A practical job description for an Office Manager, with a clear role purpose, responsibilities, reporting lines and person requirements.";

const askLeoPrompt = [
  `I am reviewing the LEO job description "${resourceTitle}".`,
  resourceSummary,
  "Please help me adapt this job description to my organisation and the role I need.",
].join("\n\n");

const askLeoHref =
  `/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
  `&resourceTitle=${encodeURIComponent(resourceTitle)}` +
  `&resourceType=${encodeURIComponent("Job Description")}` +
  `&returnUrl=${encodeURIComponent("/dashboard/policies/job-descriptions/office-manager")}`;

export default function OfficeManagerJobDescriptionPage() {
  const [added, setAdded] = useState(false);

  function getExportDocument() {
    const article = document.getElementById("resource-content");
    if (!article) return "";

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${resourceTitle}</title>
<style>
@page{size:A4;margin:18mm}
body{max-width:820px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#334155;line-height:1.65}
h1,h2,h3{color:#6e5084}h1{font-size:30px;margin-bottom:24px}h2{font-size:20px;margin-top:28px}h3{font-size:16px;margin-top:22px}
p,li{font-size:11pt}.role-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0 24px}
.role-card{padding:12px;border:1px solid #e1e5ea;border-radius:10px;background:#f7f1fc}.role-card strong{display:block;color:#6e5084;font-size:9pt;text-transform:uppercase}
.notice{margin-top:28px;padding:14px;border:1px solid #dcece4;background:#f5fff9}
</style></head><body><h1>${resourceTitle}</h1>${article.innerHTML}</body></html>`;
  }

  function downloadWord() {
    const html = getExportDocument();
    if (!html) return;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LEO-Office-Manager-Job-Description.doc";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function openPdf() {
    const html = getExportDocument();
    if (!html) return;
    const pdfWindow = window.open("", "_blank");
    if (!pdfWindow) return;
    pdfWindow.document.open();
    pdfWindow.document.write(html);
    pdfWindow.document.close();
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
      topic="Administration"
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
        { title: "Sales Executive Job Description", href: "/dashboard/policies/job-descriptions/sales-executive" },
      ]}
    >
      <div className="role-grid">
        <div className="role-card"><strong>Reports to</strong>Managing Director</div>
        <div className="role-card"><strong>Department</strong>Administration</div>
        <div className="role-card"><strong>Location</strong>[Insert location]</div>
        <div className="role-card"><strong>Working hours</strong>[Insert hours]</div>
      </div>

      <h2>Role purpose</h2>
      <p>
        To keep the day-to-day office running smoothly, provide reliable administrative support
        and help create an organised, professional working environment.
      </p>

      <h2>Key responsibilities</h2>
      <ul>
        <li>Coordinate day-to-day office administration, supplies, facilities and routine services.</li>
        <li>Maintain accurate records, calendars and business documentation.</li>
        <li>Support managers with meetings, correspondence and administrative tasks.</li>
        <li>Act as a professional first point of contact for visitors, suppliers and general enquiries.</li>
        <li>Coordinate office procedures and identify practical improvements.</li>
        <li>Handle business information appropriately and maintain confidentiality.</li>
      </ul>

      <h2>Person requirements</h2>
      <ul>
        <li>Strong organisation and prioritisation skills.</li>
        <li>Clear written and verbal communication.</li>
        <li>Confident using common office software and systems.</li>
        <li>Reliable, discreet and comfortable working independently.</li>
        <li>Previous administration or office coordination experience is desirable.</li>
      </ul>

      <h2>Role review</h2>
      <p>
        This job description describes the main requirements of the role. Duties may reasonably
        develop as the organisation changes and should be reviewed with the employee where
        material changes are proposed.
      </p>

      <div className="notice">
        <strong>LEO practical note</strong>
        <p>
          Adapt responsibilities and person requirements to the genuine needs of the role. Avoid
          criteria that are unnecessary or could create unjustified barriers for applicants.
        </p>
      </div>

      <style jsx>{`
        .role-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:8px}
        .role-card{padding:14px;border:1px solid #e8dfeb;border-radius:12px;background:#f7f1fc;color:#526174}
        .role-card strong{display:block;margin-bottom:5px;color:#6e5084;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
        @media(max-width:620px){.role-grid{grid-template-columns:1fr}}
      `}</style>
    </ResourcePreview>
  );
}
