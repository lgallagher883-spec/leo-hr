"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Performance Management";
const resourceId = "performance-management";
const resourceSummary =
  "A concise employer guide to setting expectations, addressing performance concerns and supporting fair, evidence-based improvement.";

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

export default function PerformanceManagementPage() {
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
    anchor.download = "LEO-Performance-Management-Guide.doc";
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
                Performance management is the process of setting clear standards,
                giving feedback, supporting improvement and responding fairly
                where an employee is not meeting the requirements of their role.
                It should be continuous and evidence-based, not reserved for when
                performance has already become a serious concern.
              </p>
            </section>

            <section>
              <h2>Before you begin</h2>
              <ul>
                <li>Check the employee&apos;s job description and contractual duties.</li>
                <li>Identify the required standard and how it can be measured.</li>
                <li>Review induction, training, supervision and previous feedback.</li>
                <li>Consider whether health, disability or workplace barriers may be relevant.</li>
                <li>Keep performance concerns separate from conduct concerns.</li>
              </ul>
            </section>

            <section>
              <h2>Step 1 – Set clear expectations</h2>
              <p>
                Employees should understand what is expected of them, how their
                work will be assessed and where they can obtain support.
              </p>
              <ul>
                <li>Use specific and realistic objectives.</li>
                <li>Explain required quality, quantity, accuracy and timescales.</li>
                <li>Confirm priorities and available resources.</li>
                <li>Record key expectations and review dates.</li>
              </ul>
            </section>

            <section>
              <h2>Step 2 – Give regular feedback</h2>
              <p>
                Feedback should be timely, balanced and based on examples.
                Recognise good performance as well as identifying gaps.
              </p>
              <ul>
                <li>Explain what happened and why it matters.</li>
                <li>Describe the standard required.</li>
                <li>Ask for the employee&apos;s perspective.</li>
                <li>Agree practical next steps.</li>
              </ul>
            </section>

            <section>
              <h2>Step 3 – Address concerns informally first</h2>
              <p>
                Where appropriate, start with an informal performance discussion.
                Explain the concern clearly and agree a short support plan.
              </p>
              <ul>
                <li>Identify the performance gap using evidence.</li>
                <li>Check whether instructions and training were adequate.</li>
                <li>Agree measurable improvement targets.</li>
                <li>Confirm support, supervision and review dates.</li>
                <li>Explain that formal action may follow if improvement is not achieved.</li>
              </ul>
            </section>

            <section>
              <h2>Step 4 – Consider underlying causes</h2>
              <p>
                Poor performance may result from unclear expectations, insufficient
                training, excessive workload, unsuitable systems, health concerns,
                disability or other workplace factors.
              </p>
              <p>
                Consider reasonable adjustments where disability may be relevant.
                Do not treat capability arising from health in the same way as
                deliberate misconduct.
              </p>
            </section>

            <section>
              <h2>Step 5 – Move to a formal process where necessary</h2>
              <p>
                If informal support has not worked, or the concern is sufficiently
                serious, invite the employee to a formal capability meeting.
              </p>
              <ul>
                <li>Give reasonable notice and explain the concerns.</li>
                <li>Provide the evidence to be considered.</li>
                <li>Allow the employee to respond fully.</li>
                <li>Consider any explanation, mitigation or support need.</li>
                <li>Confirm the possible outcomes.</li>
              </ul>
            </section>

            <section>
              <h2>Step 6 – Use a clear improvement plan</h2>
              <p>
                A performance improvement plan should be practical and measurable.
                It should state:
              </p>
              <ul>
                <li>the required standard;</li>
                <li>the current gap;</li>
                <li>the actions and support agreed;</li>
                <li>how progress will be measured;</li>
                <li>the review period; and</li>
                <li>the possible outcome if improvement is not achieved.</li>
              </ul>
            </section>

            <section>
              <h2>Step 7 – Review progress fairly</h2>
              <p>
                Hold scheduled review meetings and assess progress against the
                agreed measures. Consider whether the support provided has been
                effective and whether further reasonable time is justified.
              </p>
              <p>
                Confirm each review in writing and avoid introducing new standards
                without explanation.
              </p>
            </section>

            <section>
              <h2>Step 8 – Decide the outcome</h2>
              <p>Possible outcomes include:</p>
              <ul>
                <li>successful completion of the improvement plan;</li>
                <li>additional support or a short extension;</li>
                <li>a formal warning under the capability procedure;</li>
                <li>redeployment or adjusted duties where appropriate; or</li>
                <li>dismissal as a final step after a fair process.</li>
              </ul>
              <p>
                Any dismissal decision should be based on current evidence,
                meaningful support, reasonable opportunity to improve and
                consideration of alternatives.
              </p>
            </section>

            <section>
              <h2>Common mistakes to avoid</h2>
              <ul>
                <li>Using vague standards such as “must do better”.</li>
                <li>Waiting too long before raising concerns.</li>
                <li>Confusing capability with misconduct.</li>
                <li>Failing to provide training or support.</li>
                <li>Ignoring disability or health-related factors.</li>
                <li>Changing targets during the review period.</li>
                <li>Moving to dismissal before considering alternatives.</li>
              </ul>
            </section>

            <div className="tip">
              <strong>LEO Professional Recommendation</strong>
              <p>
                Keep expectations, evidence, support, review notes and outcomes
                clearly connected. The employee should always understand what
                must improve, by when, and how success will be measured.
              </p>
            </div>

            <div className="notice">
              <strong>Legal position — January 2027</strong>
              <p>
                Employers should follow a fair capability process, consider
                reasonable adjustments and avoid discrimination. Ordinary unfair
                dismissal protection generally applies after six months&apos;
                continuous employment from 1 January 2027, while discrimination,
                whistleblowing and automatically unfair dismissal protections may
                apply earlier.
              </p>
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Managing performance
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
                  href="/dashboard/policies/factsheets/performance-management"
                >
                  Performance Management Factsheet
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/letters/performance-improvement-meeting"
                >
                  Performance Improvement Meeting Invitation
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/guides/managing-probation-successfully"
                >
                  Managing Probation Successfully
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/checklists/probation-review-checklist"
                >
                  Probation Review Checklist
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}