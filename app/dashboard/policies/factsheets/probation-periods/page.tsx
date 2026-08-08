"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Probation Periods & Reviews";
const resourceId = "probation-periods";
const resourceSummary =
  "A practical guide to setting, managing, reviewing and concluding probation fairly under the six-month unfair-dismissal qualifying period in force from January 2027.";

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

export default function ProbationPeriodsPage() {
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
    anchor.download = "LEO-Probation-Periods-and-Reviews.doc";
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
            <h2>What is a probation period?</h2>
            <p>
              A probation period is a contractual assessment period at the
              beginning of employment. It allows the employer and employee to
              decide whether the role is suitable while expectations, support,
              conduct, attendance and performance are reviewed.
            </p>
            <p>
              There is no legal requirement to use probation and no statutory
              maximum length. However, probation does not remove employment
              rights, and it should never be treated as a period in which an
              employee can be dismissed without proper consideration.
            </p>

            <div className="notice">
              <strong>LEO professional recommendation</strong>
              <p>
                Use an initial probation period of no more than three months in
                most roles. This gives the employer time to assess suitability
                while preserving scope for one clearly justified extension,
                usually up to a further three months. From 1 January 2027,
                ordinary unfair-dismissal protection applies after six months of
                continuous employment, so probation decisions should not be
                allowed to drift beyond that point.
              </p>
            </div>

            <h2>Set the probation terms clearly</h2>
            <ul>
              <li>Include the probation length and any right to extend it in the contract.</li>
              <li>State the notice arrangements that apply during probation.</li>
              <li>Explain the standards, objectives and conduct expected in the role.</li>
              <li>Confirm how and when progress will be reviewed.</li>
              <li>Make clear that probation only ends when the outcome is confirmed in writing.</li>
            </ul>

            <h2>Manage probation actively</h2>
            <p>
              Probation should be a supported management process, not a single
              meeting at the end. Managers should provide induction, suitable
              training, regular feedback and a reasonable opportunity to
              improve where concerns arise.
            </p>
            <p>
              For a three-month probation, LEO recommends short reviews around
              weeks 2, 4, 8 and 12. Records should identify what is going well,
              any concerns, support provided, required improvement and the next
              review date.
            </p>

            <h2>Possible outcomes</h2>
            <ul>
              <li><strong>Pass:</strong> confirm successful completion in writing.</li>
              <li><strong>Extend:</strong> use only where more assessment is genuinely needed and the contract permits it.</li>
              <li><strong>End employment:</strong> reach a reasoned decision, meet with the employee, consider their response and confirm notice and the outcome in writing.</li>
              <li><strong>Alternative action:</strong> where appropriate, consider further support, adjustments or a suitable alternative role.</li>
            </ul>

            <h2>Extending probation</h2>
            <p>
              An extension should not be automatic. Explain the specific reason,
              the improvement required, the support available and the final
              review date. Keep the extension proportionate and confirm it
              before the original probation expires.
            </p>
            <p>
              Under LEO&apos;s recommended model, a three-month initial period may
              be followed by one extension of up to three months. Employers
              should take particular care not to let the effective dismissal
              date move beyond six months without following a demonstrably fair
              reason and process.
            </p>

            <h2>Ending employment during probation</h2>
            <p>
              Before dismissal, check whether the concern could involve
              disability, pregnancy or family leave, whistleblowing, health and
              safety activity, trade union activity, asserting a statutory
              right, or another automatically unfair or discriminatory reason.
              These protections can apply regardless of length of service.
            </p>
            <p>
              From 1 January 2027, employees with at least six months&apos;
              continuous service can normally claim ordinary unfair dismissal.
              Employers should therefore identify a potentially fair reason,
              investigate sufficiently, listen to the employee, act consistently
              and follow any relevant contractual procedure. Where misconduct
              is involved, the ACAS Code of Practice should be followed.
            </p>

            <h2>Common mistakes</h2>
            <ul>
              <li>Using six months as the default probation period with no room to extend.</li>
              <li>Waiting until the final week to raise concerns.</li>
              <li>Giving no clear objectives, training or support.</li>
              <li>Extending probation without a contractual right or clear reason.</li>
              <li>Assuming short service removes discrimination or automatically unfair dismissal risks.</li>
              <li>Forgetting to confirm the outcome before probation expires.</li>
            </ul>

            <h2>Key points for employers</h2>
            <ul>
              <li>Use three months as the normal starting point.</li>
              <li>Review regularly and keep proportionate written records.</li>
              <li>Address concerns early and explain what improvement looks like.</li>
              <li>Use one justified extension where genuinely required.</li>
              <li>Check protected-right and discrimination risks before dismissal.</li>
              <li>Do not allow probation to drift beyond six months.</li>
            </ul>

            <div className="notice">
              <strong>Legal position — January 2027</strong>
              <p>
                This factsheet reflects the six-month qualifying period for
                ordinary unfair-dismissal protection introduced by the
                Employment Rights Act 2025 from 1 January 2027. Probation
                remains contractual, and other statutory protections may apply
                from the beginning of employment.
              </p>
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Probation
                <br />
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
                  Managing probation effectively
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/checklists"
                >
                  Probation review checklist
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/forms"
                >
                  Probation review form
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/letters"
                >
                  Probation outcome letters
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}