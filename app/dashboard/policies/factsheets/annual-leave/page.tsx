"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Annual Leave & Holiday Entitlement";
const resourceId = "annual-leave";
const resourceSummary =
  "A practical guide to calculating, paying and managing annual leave fairly and lawfully, with practical examples for common working patterns.";

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
    window.alert(
      "Direct saving from the LEO library is not yet persistent. Download the Word version and upload it from HR Resources if you want an organisation-owned copy.",
    );
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

          <span className="updated-pill">Reviewed 12 September 2026</span>
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
<p>Most workers are entitled to 5.6 weeks of paid statutory holiday each leave year. For someone working five days a week this is normally 28 days. Statutory entitlement is capped at 28 days for workers who work more than five days a week, although contracts can provide more.</p>

<div className="notice">
<strong>LEO Professional Recommendation</strong>
<p>Record the holiday year, statutory and contractual entitlement, bank-holiday treatment, request rules, carry-over rules and holiday-pay method. Keep the calculation used for starters, leavers and irregular-hours workers so the decision can be checked later.</p>
</div>

<h2>Regular-hours workers</h2>
<ul>
<li><strong>Five days a week:</strong> 5 × 5.6 = 28 days statutory leave.</li>
<li><strong>Three days a week:</strong> 3 × 5.6 = 16.8 days statutory leave.</li>
<li><strong>First-year monthly accrual:</strong> an employer may use one-twelfth of annual entitlement for each month. A five-day worker with 28 days annual entitlement accrues 7 days after three months: 28 ÷ 12 × 3.</li>
</ul>

<h2>Irregular-hours and part-year workers</h2>
<p>For leave years beginning on or after 1 April 2024, statutory leave for irregular-hours and part-year workers is normally accrued at 12.07% of hours worked in each pay period.</p>
<ul>
<li><strong>30 hours worked:</strong> 30 × 12.07% = 3.621 hours, rounded to 4 hours because a fraction of 0.5 hours or more rounds up.</li>
<li><strong>68 hours worked:</strong> 68 × 12.07% = 8.2076 hours, rounded to 8 hours.</li>
</ul>
<p>If contractual holiday is greater than the statutory minimum, the percentage used for additional contractual entitlement may need to be adjusted.</p>

<h2>Holiday pay</h2>
<p>A worker must receive the holiday pay required by the Working Time Regulations and their contract. For regular-hours workers, at least four weeks of statutory leave must reflect normal remuneration. This can include payments such as regular overtime, commission and certain status-related payments where they form part of normal pay. The remaining 1.6 weeks may be paid at basic rate unless the contract provides more.</p>
<p>For irregular-hours and part-year workers, employers can use rolled-up holiday pay for leave years beginning on or after 1 April 2024 where the statutory conditions are met. It should be calculated and shown separately from basic pay. Rolled-up holiday pay is not the statutory method for regular-hours workers.</p>

<h2>Carry-over</h2>
<ul>
<li>Check the contract or policy for permitted carry-over of contractual leave.</li>
<li>If a regular-hours worker cannot take statutory leave because of sickness, up to four weeks can normally be carried forward, subject to the statutory time limit.</li>
<li>Irregular-hours and part-year workers can have different sickness carry-over rules and may carry up to 5.6 weeks in the circumstances provided by law.</li>
<li>Untaken statutory leave must be capable of carrying over where family-related leave prevented the worker from taking it.</li>
<li>A worker may also gain carry-over rights where the employer failed to provide a reasonable opportunity to take leave, failed to encourage them to take it, or failed to warn that leave would otherwise be lost.</li>
</ul>

<h2>Requesting, refusing and requiring leave</h2>
<p>Employers can set a reasonable holiday-request process and may refuse requested dates for genuine business reasons. Employers can also require leave to be taken at particular times if the required notice is given. Apply rules consistently and avoid practices that make it unrealistic for workers to take their statutory entitlement.</p>

<h2>Starter and leaver checks</h2>
<ul>
<li>Confirm the leave year and working pattern.</li>
<li>Calculate accrued entitlement to the relevant date.</li>
<li>Deduct leave already taken.</li>
<li>Check contractual rules for enhanced leave.</li>
<li>On termination, pay for accrued untaken statutory leave and deal with excess leave only where a lawful contractual deduction is available.</li>
</ul>

<h2>Decision record</h2>
<ul>
<li>Worker type: regular hours, irregular hours or part-year.</li>
<li>Working pattern and hours used.</li>
<li>Statutory entitlement and any contractual enhancement.</li>
<li>Calculation method and rounding.</li>
<li>Leave taken, carried over and remaining.</li>
<li>Holiday-pay method and pay elements included.</li>
</ul>

<div className="notice">
<strong>Legal review — 11 September 2026</strong>
<p>Reviewed against current GOV.UK holiday entitlement and holiday pay guidance for England and Wales. The 12.07% accrual method applies to qualifying irregular-hours and part-year workers for leave years beginning on or after 1 April 2024. Check current official guidance where sickness, family leave, variable pay or unusual working patterns make the calculation more complex.</p>
</div>
</article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Annual Leave & Holiday Entitlement<br />
                Resource ID: {resourceId}
                <br />
                Legal status: Current 11 September 2026
                <br />
                Version: 1.1
                <br />
                Last reviewed: 11 September 2026
                <br />
                Next review: March 2027 or earlier if the law changes
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