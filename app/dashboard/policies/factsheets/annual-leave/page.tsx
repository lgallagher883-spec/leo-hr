"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Annual Leave & Holiday Entitlement";
const resourceId = "annual-leave";
const resourceSummary =
  "A practical guide to managing annual leave and holiday entitlement fairly and lawfully from January 2027.";

const askLeoPrompt = [
  `I am reviewing the LEO factsheet "${resourceTitle}".`,
  resourceSummary,
  "Please use this factsheet as the context for my question.",
].join("\n\n");

const askLeoHref =
  `/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
  `&resourceTitle=${encodeURIComponent(resourceTitle)}` +
  `&resourceType=${encodeURIComponent("Factsheet")}` +
  `&returnUrl=${encodeURIComponent(
    `/dashboard/policies/factsheets/${resourceId}`
  )}`;

export default function AnnualLeavePage() {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function openPdf() {
    const article = document.getElementById("resource-content");

    if (!article) {
      return;
    }

    const pdfDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${resourceTitle}</title>
          <style>
            @page {
              size: A4;
              margin: 18mm;
            }

            body {
              max-width: 820px;
              margin: 40px auto;
              font-family: Arial, Helvetica, sans-serif;
              color: #334155;
              line-height: 1.65;
            }

            h1,
            h2 {
              color: #6e5084;
            }

            h1 {
              margin-bottom: 24px;
              font-size: 30px;
            }

            h2 {
              margin-top: 28px;
              margin-bottom: 10px;
              font-size: 20px;
            }

            p,
            li {
              font-size: 11pt;
            }

            li + li {
              margin-top: 6px;
            }

            .notice {
              margin-top: 28px;
              padding: 14px;
              border: 1px solid #dcece4;
              background: #f5fff9;
            }
          </style>
        </head>

        <body>
          <h1>${resourceTitle}</h1>
          ${article.innerHTML}
        </body>
      </html>
    `;

    const pdfWindow = window.open("", "_blank");

    if (!pdfWindow) {
      return;
    }

    pdfWindow.document.open();
    pdfWindow.document.write(pdfDocument);
    pdfWindow.document.close();
  }

  function downloadWord() {
    const article = document.getElementById("resource-content");

    if (!article) {
      return;
    }

    const wordDocument = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${resourceTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #334155; line-height: 1.65; }
            h1, h2 { color: #6e5084; }
            h1 { font-size: 30px; }
            h2 { margin-top: 28px; font-size: 20px; }
            .notice { padding: 14px; background: #f5fff9; border: 1px solid #dcece4; }
          </style>
        </head>
        <body>${article.innerHTML}</body>
      </html>
    `;

    const blob = new Blob(["\ufeff", wordDocument], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LEO-Annual-Leave-and-Holiday-Entitlement.doc";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function addToOrganisationResources() {
    setAdded(true);
  }

  return (
    <main className="preview-page">
      <style jsx>{`
        .preview-page {
          min-height: 100%;
          padding: 32px;
          background: linear-gradient(180deg, #fbf8fd 0%, #ffffff 42%);
          color: #334155;
        }

        .page-shell {
          max-width: 1180px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          margin-bottom: 22px;
          color: #6e5084;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding: 30px;
          border: 1px solid #eadff0;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 16px 45px rgba(91, 66, 106, 0.07);
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #8a6a9e;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          color: #6e5084;
          font-size: clamp(32px, 5vw, 46px);
          font-weight: 500;
          letter-spacing: -0.03em;
        }

        .header-copy {
          max-width: 720px;
          margin: 12px 0 0;
          color: #64748b;
          font-size: 16px;
          line-height: 1.7;
        }

        .updated-pill {
          display: inline-flex;
          flex: 0 0 auto;
          min-height: 34px;
          align-items: center;
          padding: 0 12px;
          border-radius: 999px;
          background: #f7f1fc;
          color: #6e5084;
          font-size: 12px;
          font-weight: 600;
        }

        .action-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
          padding: 16px;
          border: 1px solid #eadff0;
          border-radius: 16px;
          background: #ffffff;
        }

        .action-button {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          padding: 0 16px;
          border: 1px solid #dfd4e5;
          border-radius: 12px;
          background: #ffffff;
          color: #6e5084;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }

        .action-button:hover {
          border-color: #cdb2e2;
          background: #faf6fc;
        }

        .action-button.primary {
          border-color: #6e5084;
          background: #6e5084;
          color: #ffffff;
        }

        .action-button.ask-leo {
          gap: 7px;
          border-color: #cdb2e2;
          background: #f7f1fc;
          color: #6e5084;
        }

        .action-button.ask-leo:hover {
          border-color: #b995ce;
          background: #f1e7f7;
        }

        .leo-mark {
          font-size: 16px;
          line-height: 1;
        }

        .action-button.success {
          border-color: #b9d8c6;
          background: #f5fff9;
          color: #536f62;
        }

        .content-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 290px;
          gap: 24px;
          margin-top: 24px;
        }

        .document {
          padding: 42px;
          border: 1px solid #e8dfeb;
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 16px 40px rgba(91, 66, 106, 0.06);
        }

        .document h2 {
          margin: 30px 0 10px;
          color: #6e5084;
          font-size: 21px;
          font-weight: 600;
        }

        .document h2:first-of-type {
          margin-top: 0;
        }

        .document p,
        .document li {
          color: #526174;
          line-height: 1.75;
        }

        .document ul {
          padding-left: 22px;
        }

        .document li + li {
          margin-top: 8px;
        }

        .notice {
          margin-top: 28px;
          padding: 18px;
          border: 1px solid #dcece4;
          border-radius: 14px;
          background: #f5fff9;
        }

        .notice strong {
          display: block;
          color: #536f62;
        }

        .notice p {
          margin: 6px 0 0;
          color: #658073;
          font-size: 14px;
        }

        .side-panel {
          align-self: start;
          position: sticky;
          top: 24px;
          display: grid;
          gap: 18px;
        }

        .side-card {
          padding: 20px;
          border: 1px solid #eadff0;
          border-radius: 16px;
          background: #ffffff;
        }

        .side-card h2 {
          margin: 0;
          color: #6e5084;
          font-size: 18px;
          font-weight: 600;
        }

        .side-card p {
          margin: 8px 0 0;
          color: #718096;
          font-size: 14px;
          line-height: 1.6;
        }

        .related-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }

        .related-link {
          display: block;
          padding: 12px;
          border: 1px solid #eee7f1;
          border-radius: 11px;
          color: #6e5084;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        .related-link:hover {
          background: #faf6fc;
        }

        @media print {
          .back-link,
          .page-header,
          .action-bar,
          .side-panel {
            display: none !important;
          }

          .preview-page {
            padding: 0;
            background: #ffffff;
          }

          .content-layout {
            display: block;
            margin: 0;
          }

          .document {
            padding: 0;
            border: 0;
            box-shadow: none;
          }
        }

        @media (max-width: 880px) {
          .preview-page {
            padding: 20px;
          }

          .page-header,
          .content-layout {
            grid-template-columns: 1fr;
          }

          .page-header {
            display: grid;
          }

          .side-panel {
            position: static;
          }
        }

        @media (max-width: 540px) {
          .preview-page {
            padding: 14px;
          }

          .page-header,
          .document {
            padding: 22px;
          }
        }
      `}</style>

      <div className="page-shell">
        <Link
          className="back-link"
          href="/dashboard/policies/factsheets"
        >
          ← Back to Factsheets
        </Link>

        <header className="page-header">
          <div>
            <p className="eyebrow">Factsheet</p>
            <h1>{resourceTitle}</h1>
            <p className="header-copy">{resourceSummary}</p>
          </div>

          <span className="updated-pill">Updated January 2027</span>
        </header>

        <div className="action-bar">
          <button
            className="action-button primary"
            type="button"
            onClick={downloadWord}
          >
            Word
          </button>

          <button
            className="action-button"
            type="button"
            onClick={openPdf}
          >
            PDF
          </button>

          <button
            className="action-button ask-leo"
            type="button"
            onClick={() => router.push(askLeoHref)}
          >
            <span className="leo-mark" aria-hidden="true">
              ✦
            </span>
            Ask Leo
          </button>

          <button
            className={`action-button ${added ? "success" : ""}`}
            type="button"
            onClick={addToOrganisationResources}
            disabled={added}
          >
            {added ? "Added to organisation resources" : "Add to organisation resources"}
          </button>
        </div>

        <div className="content-layout">
          <article className="document" id="resource-content">
<h2>Annual leave and holiday entitlement</h2>
<p>Annual leave allows employees to take paid time away from work for rest and wellbeing. Employers should manage holiday fairly, consistently and in accordance with statutory and contractual entitlements.</p>

<div className="notice">
<strong>LEO Professional Recommendation</strong>
<p>Publish a clear annual leave policy, encourage employees to book leave throughout the year and operate a transparent approval process. Keep accurate records and avoid creating situations where employees are unable to take their statutory entitlement.</p>
</div>

<h2>Employer responsibilities</h2>
<ul>
<li>Provide at least the statutory minimum paid holiday entitlement.</li>
<li>Explain how leave should be requested and approved.</li>
<li>Keep accurate holiday records.</li>
<li>Apply approval decisions consistently.</li>
<li>Pay holiday correctly, including any contractual enhancements.</li>
</ul>

<h2>Managing annual leave</h2>
<p>Employers may refuse or require leave on particular dates provided they give the required notice and act reasonably. Operational requirements should be balanced with employee wellbeing and fairness across the workforce.</p>

<h2>Carry-over of leave</h2>
<p>Carry-over may arise where legislation, contractual terms or exceptional circumstances permit it. Employers should encourage employees to take leave during the holiday year wherever possible.</p>

<h2>Common legal risks</h2>
<ul>
<li>Failing to provide statutory holiday entitlement.</li>
<li>Incorrect holiday pay calculations.</li>
<li>Applying inconsistent approval decisions.</li>
<li>Refusing leave without reasonable business justification.</li>
<li>Keeping inaccurate holiday records.</li>
</ul>

<h2>Key points for employers</h2>
<ul>
<li>Maintain a clear holiday policy.</li>
<li>Record all annual leave accurately.</li>
<li>Apply approval decisions consistently.</li>
<li>Encourage employees to use their leave.</li>
<li>Deal with disputes promptly and fairly.</li>
</ul>

<div className="notice">
<strong>Legal position — January 2027</strong>
<p>This factsheet reflects the law in England &amp; Wales as at January 2027. Employers should comply with statutory annual leave requirements, contractual obligations and current case law principles when calculating and managing holiday entitlement and holiday pay.</p>
</div>
</article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Annual Leave & Holiday Entitlement<br />
                Resource ID: {resourceId}
                <br />
                Legal status: Current January 2027
                <br />
                Version: 1.0
                <br />
                Last reviewed: January 2027
                <br />
                Next review: January 2028 or earlier if the law changes
              </p>
            </section>

            <section className="side-card">
              <h2>Related resources</h2>
              <div className="related-list">
<Link className="related-link" href="/dashboard/policies/guides">Annual Leave Guide</Link>
<Link className="related-link" href="/dashboard/policies/checklists">Holiday Management Checklist</Link>
<Link className="related-link" href="/dashboard/employees">Employee Leave Records</Link>
<Link className="related-link" href="/dashboard/compliance">Compliance Workspace</Link>
</div></section>
          </aside>
        </div>
      </div>
    </main>
  );
}