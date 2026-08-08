"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Managing Redundancy";
const resourceId = "managing-redundancy";
const resourceSummary =
  "A concise employer guide to planning consultation, selecting fairly, exploring alternatives and managing redundancy decisions lawfully.";

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

export default function ManagingRedundancyPage() {
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
    anchor.download = "LEO-Managing-Redundancy.doc";
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
                Redundancy is a form of dismissal that usually arises because
                the employer needs fewer employees to carry out particular work,
                a workplace is closing or the organisation is restructuring.
                A fair process should be genuine, evidence-based and consultative.
              </p>
            </section>

            <section>
              <h2>Before you begin</h2>
              <ul>
                <li>Confirm that there is a genuine redundancy situation.</li>
                <li>Record the business reasons and proposed structure.</li>
                <li>Consider alternatives before identifying dismissals.</li>
                <li>Identify affected roles and employees provisionally.</li>
                <li>Check whether collective consultation duties may apply.</li>
              </ul>
            </section>

            <section>
              <h2>Step 1 – Explore ways to avoid redundancy</h2>
              <p>
                Consider reasonable alternatives before moving to dismissal.
              </p>
              <ul>
                <li>Recruitment freezes or reducing agency use.</li>
                <li>Voluntary redundancy or reduced overtime.</li>
                <li>Redeployment, retraining or alternative duties.</li>
                <li>Temporary reductions in hours by agreement.</li>
                <li>Natural turnover or postponing proposed changes.</li>
              </ul>
            </section>

            <section>
              <h2>Step 2 – Identify the correct selection pool</h2>
              <p>
                Where more than one employee performs the affected work, decide
                who should reasonably be included in the selection pool. Consider
                the work actually performed, interchangeable skills and how the
                organisation has operated in practice.
              </p>
              <p>
                A pool of one may be appropriate in some cases, but it should not
                be used merely to avoid meaningful selection.
              </p>
            </section>

            <section>
              <h2>Step 3 – Set fair selection criteria</h2>
              <p>
                Criteria should be objective, relevant to future business needs
                and capable of consistent scoring.
              </p>
              <ul>
                <li>Relevant skills, qualifications and experience.</li>
                <li>Performance supported by reliable records.</li>
                <li>Disciplinary record, excluding expired warnings.</li>
                <li>Attendance, adjusted for protected absences.</li>
                <li>Future role requirements.</li>
              </ul>
              <p>
                Do not count pregnancy, maternity, family leave, disability-related
                absence or another protected reason in a discriminatory way.
              </p>
            </section>

            <section>
              <h2>Step 4 – Begin meaningful consultation</h2>
              <p>
                Tell affected employees that they are provisionally at risk and
                explain the business proposal, timetable, proposed pool, criteria
                and alternatives considered.
              </p>
              <ul>
                <li>Consult before the decision is final.</li>
                <li>Allow employees to challenge the proposal and scores.</li>
                <li>Consider alternatives genuinely.</li>
                <li>Provide relevant information and reasonable time to respond.</li>
                <li>Keep clear notes of meetings and responses.</li>
              </ul>
            </section>

            <section>
              <h2>Step 5 – Follow collective consultation rules where required</h2>
              <p>
                Collective consultation normally applies where 20 or more
                redundancies are proposed at one establishment within 90 days.
                Consultation must be with recognised trade union representatives
                or properly elected employee representatives.
              </p>
              <ul>
                <li>20 to 99 proposed redundancies: begin at least 30 days before the first dismissal.</li>
                <li>100 or more proposed redundancies: begin at least 45 days before the first dismissal.</li>
                <li>Notify the Redundancy Payments Service using form HR1 before issuing individual notices.</li>
              </ul>
            </section>

            <section>
              <h2>Step 6 – Search for suitable alternative employment</h2>
              <p>
                Employers must actively consider available vacancies. Suitability
                depends on the role, terms, pay, status, hours, location and the
                employee&apos;s skills and circumstances.
              </p>
              <p>
                Employees selected for redundancy may have a statutory four-week
                trial period in an alternative role. Pregnant employees and certain
                new parents have priority rights to suitable alternative vacancies
                during the protected period.
              </p>
            </section>

            <section>
              <h2>Step 7 – Reach and confirm the decision</h2>
              <p>
                Only decide after consultation is complete and all representations
                have been considered. Confirm the outcome in writing and explain:
              </p>
              <ul>
                <li>the reason for redundancy;</li>
                <li>the consultation and selection outcome;</li>
                <li>notice arrangements;</li>
                <li>statutory or contractual redundancy pay;</li>
                <li>holiday and final pay;</li>
                <li>available alternative roles; and</li>
                <li>the right of appeal.</li>
              </ul>
            </section>

            <section>
              <h2>Common mistakes to avoid</h2>
              <ul>
                <li>Consulting after the outcome has already been decided.</li>
                <li>Using an artificially narrow selection pool.</li>
                <li>Relying on subjective or unsupported scoring.</li>
                <li>Ignoring suitable alternative vacancies.</li>
                <li>Counting protected absence unfairly.</li>
                <li>Missing collective consultation or HR1 requirements.</li>
                <li>Failing to consider an employee&apos;s appeal.</li>
              </ul>
            </section>

            <div className="tip">
              <strong>LEO Professional Recommendation</strong>
              <p>
                Keep the business proposal provisional until consultation has
                genuinely concluded. Good consultation should be capable of
                changing the proposal, reducing dismissals or improving the
                process for affected employees.
              </p>
            </div>

            <div className="notice">
              <strong>Legal position — January 2027</strong>
              <p>
                Redundancy dismissals must be genuine and procedurally fair.
                Employers should consult meaningfully, select fairly and consider
                suitable alternative employment. Ordinary unfair dismissal
                protection generally applies after six months&apos; continuous
                employment from 1 January 2027, while discrimination and
                automatically unfair dismissal protections may apply earlier.
              </p>
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Redundancy
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
                  href="/dashboard/policies/checklists/redundancy-consultation-checklist"
                >
                  Redundancy Consultation Checklist
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/factsheets"
                >
                  Redundancy Factsheet
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/letters"
                >
                  Redundancy Letters
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/employees"
                >
                  Employee Records
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}