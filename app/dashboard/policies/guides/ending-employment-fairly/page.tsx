"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Ending Employment Fairly";
const resourceId = "ending-employment-fairly";
const resourceSummary =
  "A concise employer guide to handling resignation, dismissal, fixed-term expiry and other departures fairly, lawfully and consistently.";

const askLeoPrompt = [
  `I am reviewing the LEO guide "${resourceTitle}".`,
  resourceSummary,
  "Please use this guide as the context for my question.",
].join("\n\n");

const askLeoHref =
  `/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
  `&resourceTitle=${encodeURIComponent(resourceTitle)}` +
  `&resourceType=${encodeURIComponent("Guide")}` +
  `&returnUrl=${encodeURIComponent(
    `/dashboard/policies/guides/${resourceId}`
  )}`;

export default function EndingEmploymentFairlyPage() {
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

            .document h3 {
          margin: 22px 0 8px;
          color: #6e5084;
          font-size: 17px;
          font-weight: 600;
        }

        .document section + section {
          margin-top: 30px;
        }

        .tip {
          margin-top: 28px;
          padding: 16px 18px;
          border-left: 4px solid #6e5084;
          border-radius: 0 12px 12px 0;
          background: #f7f1fc;
        }

        .tip strong {
          color: #6e5084;
        }

        .tip p {
          margin-bottom: 0;
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
    anchor.download = "LEO-Ending-Employment-Fairly.doc";
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
          href="/dashboard/policies/guides"
        >
          ← Back to Guides
        </Link>

        <header className="page-header">
          <div>
            <p className="eyebrow">Guide</p>
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
            <section>
              <h2>Purpose of this guide</h2>
              <p>
                Employment can end through resignation, dismissal, redundancy,
                expiry of a fixed-term contract, retirement by agreement or another
                lawful route. Employers should identify the correct reason, follow
                the appropriate process and complete the departure accurately.
              </p>
            </section>

            <section>
              <h2>Before you begin</h2>
              <ul>
                <li>Confirm why employment is ending.</li>
                <li>Check the contract, policy and notice terms.</li>
                <li>Review length of service and statutory protections.</li>
                <li>Consider discrimination, whistleblowing and automatically unfair reasons.</li>
                <li>Identify any outstanding pay, holiday, benefits or property.</li>
              </ul>
            </section>

            <section>
              <h2>Step 1 – Identify the correct route</h2>
              <p>
                The process should match the reason for termination.
              </p>
              <ul>
                <li><strong>Resignation:</strong> confirm the employee&apos;s intention and notice.</li>
                <li><strong>Conduct:</strong> follow a fair disciplinary process.</li>
                <li><strong>Capability:</strong> address performance or health through the correct procedure.</li>
                <li><strong>Redundancy:</strong> consult, select fairly and consider alternatives.</li>
                <li><strong>Fixed-term expiry:</strong> consult and assess whether the reason is redundancy or another dismissal reason.</li>
                <li><strong>Mutual agreement:</strong> record the agreed terms clearly and consider legal advice.</li>
              </ul>
            </section>

            <section>
              <h2>Step 2 – Confirm resignation carefully</h2>
              <p>
                A resignation should be clear and unambiguous. If an employee resigns
                in anger or uses uncertain language, allow a short opportunity to
                clarify before treating employment as ended.
              </p>
              <ul>
                <li>Ask for written confirmation.</li>
                <li>Confirm the final working day.</li>
                <li>Check notice requirements.</li>
                <li>Discuss handover and outstanding work.</li>
                <li>Avoid pressuring the employee to resign.</li>
              </ul>
            </section>

            <section>
              <h2>Step 3 – Follow a fair dismissal process</h2>
              <p>
                Before dismissing, ensure there is a potentially fair reason and
                a reasonable process. The employee should understand the concerns,
                see the relevant evidence and have a proper opportunity to respond.
              </p>
              <ul>
                <li>Investigate and gather current evidence.</li>
                <li>Invite the employee to the appropriate meeting.</li>
                <li>Allow accompaniment where required.</li>
                <li>Consider the employee&apos;s explanation and mitigation.</li>
                <li>Consider alternatives to dismissal.</li>
                <li>Offer an appeal.</li>
              </ul>
            </section>

            <section>
              <h2>Step 4 – Check notice and termination date</h2>
              <p>
                Confirm the correct contractual or statutory notice entitlement.
                Decide whether the employee will work notice, be placed on garden
                leave or receive payment in lieu where the contract permits it.
              </p>
              <p>
                Summary dismissal without notice should only be used for conduct
                that genuinely amounts to gross misconduct after a fair process.
              </p>
            </section>

            <section>
              <h2>Step 5 – Calculate final payments</h2>
              <p>The final payment may include:</p>
              <ul>
                <li>salary up to the termination date;</li>
                <li>notice pay or payment in lieu;</li>
                <li>payment for accrued but untaken holiday;</li>
                <li>deductions authorised by contract or law;</li>
                <li>commission, bonus or expenses where due;</li>
                <li>statutory or enhanced redundancy pay where applicable; and</li>
                <li>benefits ending or continuing during notice.</li>
              </ul>
            </section>

            <section>
              <h2>Step 6 – Confirm the outcome in writing</h2>
              <p>
                The termination letter should accurately reflect the reason and
                process. It should confirm:
              </p>
              <ul>
                <li>the termination date;</li>
                <li>the reason for dismissal where applicable;</li>
                <li>notice arrangements;</li>
                <li>final pay and holiday;</li>
                <li>return of property and confidentiality obligations;</li>
                <li>appeal rights where applicable; and</li>
                <li>any agreed reference arrangements.</li>
              </ul>
            </section>

            <section>
              <h2>Step 7 – Complete the offboarding process</h2>
              <ul>
                <li>Recover equipment, keys, passes and documents.</li>
                <li>Remove systems and building access at the appropriate time.</li>
                <li>Complete payroll and pension notifications.</li>
                <li>Preserve relevant employment records securely.</li>
                <li>Arrange a handover and communicate the departure appropriately.</li>
                <li>Remind the employee of continuing confidentiality or restrictive covenants.</li>
              </ul>
            </section>

            <section>
              <h2>Step 8 – Handle references consistently</h2>
              <p>
                Employers are not generally required to provide a reference unless
                a contractual, regulatory or agreed obligation applies. Any
                reference provided should be accurate, fair and not misleading.
              </p>
              <p>
                Follow a consistent reference policy and avoid including unsupported
                opinion or confidential information.
              </p>
            </section>

            <section>
              <h2>Common mistakes to avoid</h2>
              <ul>
                <li>Using the wrong process for the reason employment is ending.</li>
                <li>Treating an emotional statement as an immediate resignation.</li>
                <li>Failing to consider discrimination or whistleblowing risk.</li>
                <li>Calculating notice or holiday pay incorrectly.</li>
                <li>Using summary dismissal without proper justification.</li>
                <li>Failing to offer an appeal where one is required.</li>
                <li>Removing access too early or too late.</li>
              </ul>
            </section>

            <div className="tip">
              <strong>LEO Professional Recommendation</strong>
              <p>
                Keep the reason, process, decision, notice and final payments
                clearly aligned. A termination letter should reflect what actually
                happened and match the evidence and records held.
              </p>
            </div>

            <div className="notice">
              <strong>Legal position — January 2027</strong>
              <p>
                Ordinary unfair dismissal protection generally applies after six
                months&apos; continuous employment from 1 January 2027. Employers
                should still follow a fair process and consider discrimination,
                whistleblowing, family leave, health and safety and other
                automatically unfair dismissal protections, which may apply from
                the start of employment.
              </p>
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Ending employment
                <br />
                Resource ID: {resourceId}
                <br />
                Last reviewed: January 2027
              </p>
            </section>

            <section className="side-card">
              <h2>Related resources</h2>
              <div className="related-list">
                <Link
                  className="related-link"
                  href="/dashboard/policies/checklists/employee-exit-checklist"
                >
                  Employee Exit Checklist
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/guides/managing-redundancy"
                >
                  Managing Redundancy
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/guides/performance-management"
                >
                  Performance Management
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/letters/probation-termination"
                >
                  Termination During or at the End of Probation
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}