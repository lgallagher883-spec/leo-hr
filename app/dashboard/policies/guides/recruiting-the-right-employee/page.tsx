"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Recruiting the Right Employee";
const resourceId = "recruiting-the-right-employee";
const resourceSummary =
  "A concise employer guide to planning recruitment, assessing candidates fairly and making safe, evidence-based hiring decisions.";

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

export default function RecruitingTheRightEmployeePage() {
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
    anchor.download = "LEO-Recruiting-the-Right-Employee.doc";
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
                Effective recruitment begins with a clear understanding of the
                role and ends with a decision supported by evidence. A fair,
                structured process helps employers appoint someone who can do
                the job, fits the organisation&apos;s needs and has been assessed
                consistently against relevant criteria.
              </p>
            </section>

            <section>
              <h2>Before advertising</h2>
              <ul>
                <li>Confirm that the role and budget are genuinely required.</li>
                <li>Review the job description and reporting line.</li>
                <li>Identify essential and desirable criteria.</li>
                <li>Decide the salary range and working arrangements.</li>
                <li>Identify any safeguarding, DBS, registration or driving requirements.</li>
              </ul>
            </section>

            <section>
              <h2>Step 1 – Define what success looks like</h2>
              <p>
                Separate what the role genuinely requires from preferences that
                are not necessary. Criteria should be relevant, measurable and
                capable of fair assessment.
              </p>
              <ul>
                <li>Technical skills and qualifications.</li>
                <li>Relevant experience and knowledge.</li>
                <li>Behavioural competencies.</li>
                <li>Availability or working-pattern requirements.</li>
                <li>Any lawful occupational or regulatory requirement.</li>
              </ul>
            </section>

            <section>
              <h2>Step 2 – Advertise fairly</h2>
              <p>
                Use clear, accessible language and describe the role accurately.
                Avoid wording that may discourage suitable applicants or create
                unnecessary discrimination risk.
              </p>
              <ul>
                <li>State the main duties, location and working arrangements.</li>
                <li>Include the salary or realistic salary range.</li>
                <li>Explain how to request reasonable adjustments.</li>
                <li>Use more than one recruitment channel where appropriate.</li>
                <li>Keep evidence of the advert and closing date.</li>
              </ul>
            </section>

            <section>
              <h2>Step 3 – Shortlist consistently</h2>
              <p>
                Assess each application against the same published criteria.
                Use a scoring matrix where this improves consistency and record
                the reasons for progression or rejection.
              </p>
              <ul>
                <li>Do not make assumptions from names, addresses or personal details.</li>
                <li>Ignore information unrelated to the role.</li>
                <li>Consider reasonable adjustments to the selection process.</li>
                <li>Retain records for an appropriate period.</li>
              </ul>
            </section>

            <section>
              <h2>Step 4 – Conduct structured interviews</h2>
              <p>
                Ask all candidates a consistent core set of role-related questions,
                with appropriate follow-up questions where needed.
              </p>
              <ul>
                <li>Use behavioural and situational questions.</li>
                <li>Ask for evidence and examples.</li>
                <li>Score responses against agreed indicators.</li>
                <li>Keep factual interview notes.</li>
                <li>Avoid questions about protected characteristics or family plans.</li>
              </ul>
            </section>

            <section>
              <h2>Step 5 – Use assessments proportionately</h2>
              <p>
                Work tests, presentations or practical exercises should reflect
                the actual requirements of the role and should not create
                unnecessary barriers.
              </p>
              <ul>
                <li>Explain the assessment in advance.</li>
                <li>Use the same process for comparable candidates.</li>
                <li>Provide reasonable adjustments where required.</li>
                <li>Assess the work against stated criteria.</li>
              </ul>
            </section>

            <section>
              <h2>Step 6 – Make an evidence-based decision</h2>
              <p>
                Compare candidates against the role criteria rather than personal
                similarity or instinct alone. Record why the selected candidate
                best meets the requirements.
              </p>
              <p>
                Cultural contribution, professional behaviour and alignment with
                organisational standards can be relevant, but should not become
                a vague “fit” test that disadvantages candidates unfairly.
              </p>
            </section>

            <section>
              <h2>Step 7 – Make a conditional offer</h2>
              <p>
                Confirm the offer in writing and make clear which checks or
                conditions must be satisfied before employment begins.
              </p>
              <ul>
                <li>Right to work.</li>
                <li>References where required.</li>
                <li>DBS or safeguarding checks where lawful and relevant.</li>
                <li>Qualifications and professional registration.</li>
                <li>Driving licence or other role-specific checks.</li>
                <li>Any lawful health assessment after offer where appropriate.</li>
              </ul>
            </section>

            <section>
              <h2>Step 8 – Complete pre-employment checks safely</h2>
              <p>
                Apply checks consistently, keep personal information secure and
                avoid collecting more information than is necessary.
              </p>
              <ul>
                <li>Complete the right-to-work check before employment begins.</li>
                <li>Verify original or approved digital evidence.</li>
                <li>Follow up discrepancies before confirming the start.</li>
                <li>Record decisions and retain evidence securely.</li>
                <li>Do not allow a candidate to start where a legally required check is incomplete.</li>
              </ul>
            </section>

            <section>
              <h2>Common mistakes to avoid</h2>
              <ul>
                <li>Recruiting before defining the role clearly.</li>
                <li>Using vague or discriminatory criteria.</li>
                <li>Relying on instinct without recorded evidence.</li>
                <li>Asking inappropriate personal questions.</li>
                <li>Making an unconditional offer before checks are complete.</li>
                <li>Failing to provide reasonable adjustments.</li>
                <li>Keeping candidate information longer than necessary.</li>
              </ul>
            </section>

            <div className="tip">
              <strong>LEO Professional Recommendation</strong>
              <p>
                Use the same evidence framework from advert to appointment:
                criteria, questions, scoring, checks and decision. A structured
                process improves hiring quality and provides a clear audit trail.
              </p>
            </div>

            <div className="notice">
              <strong>Legal position — January 2027</strong>
              <p>
                Recruitment decisions must comply with equality, immigration,
                data-protection and sector-specific safeguarding requirements.
                Employers should make reasonable adjustments, avoid unlawful
                discrimination and complete a compliant right-to-work check
                before employment begins.
              </p>
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Recruitment
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
                  href="/dashboard/policies/factsheets/right-to-work-checks"
                >
                  Right to Work Checks Factsheet
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/checklists/right-to-work-checklist"
                >
                  Right to Work Checklist
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/checklists/new-starter-checklist"
                >
                  New Starter Checklist
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/talent"
                >
                  LEO Talent
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}