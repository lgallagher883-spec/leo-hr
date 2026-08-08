"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Disciplinary Procedure";
const resourceId = "disciplinary-procedure";
const resourceSummary =
  "A practical guide to investigating concerns and managing disciplinary action fairly, consistently and in line with the ACAS Code from January 2027.";

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

export default function DisciplinaryProcedurePage() {
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
    anchor.download = "LEO-Disciplinary-Procedure.doc";
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
            <h2>What is a disciplinary procedure?</h2>
            <p>
              A disciplinary procedure is the formal process an employer uses
              to address alleged misconduct or unacceptable workplace
              behaviour. Its purpose is to establish the facts, give the
              employee a fair opportunity to respond and decide whether any
              formal action is justified.
            </p>

            <div className="notice">
              <strong>LEO Professional Recommendation</strong>
              <p>
                Do not move straight to a disciplinary hearing simply because a
                concern has been raised. First decide whether the issue can be
                resolved informally or whether a fair investigation is needed.
                Keep the investigation, hearing and decision-making stages
                separate wherever reasonably practicable.
              </p>
            </div>

            <h2>Informal or formal action?</h2>
            <p>
              Minor concerns may often be resolved through an informal
              management conversation, coaching or a clear reminder of expected
              standards. Formal disciplinary action may be appropriate where
              concerns are serious, repeated, disputed or could lead to a formal
              warning or dismissal.
            </p>

            <h2>Follow a fair process</h2>
            <ul>
              <li>Investigate the concern without unreasonable delay.</li>
              <li>Keep an open mind and distinguish evidence from assumptions.</li>
              <li>Write to the employee explaining the allegations and possible consequences.</li>
              <li>Provide relevant evidence before the hearing.</li>
              <li>Give reasonable notice of the disciplinary hearing.</li>
              <li>Allow the employee to be accompanied where the statutory right applies.</li>
              <li>Listen to the employee&apos;s explanation before deciding the outcome.</li>
              <li>Confirm the decision and reasons in writing.</li>
              <li>Provide a clear right of appeal.</li>
            </ul>

            <h2>Investigation and suspension</h2>
            <p>
              An investigation gathers facts; it does not decide guilt or impose
              a sanction. The investigator should consider evidence that
              supports and challenges the allegation.
            </p>
            <p>
              Suspension should never be automatic or treated as punishment.
              Use it only where there is a genuine reason, such as protecting
              evidence, people or the integrity of the investigation. Keep it
              brief, review it regularly and consider reasonable alternatives.
            </p>

            <h2>Possible outcomes</h2>
            <ul>
              <li>No formal action.</li>
              <li>Informal guidance or management action.</li>
              <li>First written warning.</li>
              <li>Final written warning.</li>
              <li>Dismissal with notice.</li>
              <li>Summary dismissal for gross misconduct, following a fair process.</li>
              <li>Another proportionate sanction where the contract or policy permits it.</li>
            </ul>

            <h2>Warnings</h2>
            <p>
              A warning should explain the misconduct found, the improvement or
              conduct expected, how long the warning will remain active, what
              may happen if further concerns arise and the right of appeal.
              Outcomes should be proportionate and consistent with comparable
              cases, while allowing for relevant differences.
            </p>

            <h2>Gross misconduct</h2>
            <p>
              Gross misconduct is conduct serious enough to justify dismissal
              without notice. Examples should be identified in the disciplinary
              policy, but no allegation should result in automatic dismissal.
              The employer must still investigate, hold a fair hearing and
              consider the employee&apos;s response and any mitigation.
            </p>

            <h2>Common legal risks</h2>
            <ul>
              <li>Deciding the outcome before completing the investigation.</li>
              <li>Using the same person for every stage where separation was reasonably possible.</li>
              <li>Withholding important evidence from the employee.</li>
              <li>Treating suspension as an automatic response.</li>
              <li>Ignoring disability, discrimination, whistleblowing or other protected-right issues.</li>
              <li>Applying inconsistent or disproportionate sanctions.</li>
              <li>Failing to offer a genuine appeal.</li>
            </ul>

            <h2>Key points for employers</h2>
            <ul>
              <li>Resolve minor matters informally where appropriate.</li>
              <li>Investigate before deciding whether formal action is justified.</li>
              <li>Give the employee the allegations, evidence and opportunity to respond.</li>
              <li>Base the outcome on the evidence and act proportionately.</li>
              <li>Keep a clear written record of each significant stage.</li>
              <li>Always provide a right of appeal against a formal outcome.</li>
            </ul>

            <div className="notice">
              <strong>Legal position — January 2027</strong>
              <p>
                This factsheet reflects the law in England &amp; Wales as at
                January 2027. The ACAS Code of Practice sets the minimum
                standard for disciplinary cases. Employment tribunals take the
                Code into account and may adjust compensation where it has been
                unreasonably ignored. Ordinary unfair-dismissal protection
                normally applies after six months&apos; continuous employment,
                while discrimination and automatically unfair dismissal
                protections may apply from the beginning of employment.
              </p>
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Disciplinary Procedure<br />
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
                <Link
                  className="related-link"
                  href="/dashboard/policies/guides"
                >
                  Managing a Disciplinary Process
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/checklists"
                >
                  Disciplinary Process Checklist
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/forms"
                >
                  Disciplinary Hearing Record
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/matters"
                >
                  Open Matters
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}