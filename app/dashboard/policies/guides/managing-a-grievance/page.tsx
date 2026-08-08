"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Managing a Grievance";
const resourceId = "managing-a-grievance";
const resourceSummary =
  "A concise employer guide to receiving, investigating and resolving workplace grievances fairly and without unreasonable delay.";

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

export default function ManagingAGrievancePage() {
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
    anchor.download = "LEO-Managing-a-Grievance.doc";
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
                A grievance is a concern, problem or complaint raised by an
                employee about their work, treatment or workplace. Employers
                should respond promptly, listen carefully and follow a fair
                process before reaching an outcome.
              </p>
            </section>

            <section>
              <h2>Before you begin</h2>
              <ul>
                <li>Check the organisation&apos;s grievance procedure.</li>
                <li>Confirm the concerns raised and the outcome sought.</li>
                <li>Consider whether informal resolution is appropriate.</li>
                <li>Identify any immediate wellbeing, safety or safeguarding risk.</li>
                <li>Choose an impartial person to manage the grievance.</li>
              </ul>
            </section>

            <section>
              <h2>Step 1 – Receive the grievance properly</h2>
              <p>
                Formal grievances should normally be raised in writing. If the
                concerns are unclear, ask the employee to explain the key issues,
                relevant dates, evidence and what they would like the employer
                to do.
              </p>
              <p>
                Acknowledge the grievance promptly and explain the next steps,
                expected timescale and who will handle it.
              </p>
            </section>

            <section>
              <h2>Step 2 – Consider informal resolution</h2>
              <p>
                Some concerns can be resolved through an early management
                conversation, clarification, mediation or agreed practical
                action. Informal resolution should only be used where it is
                appropriate and the employee is comfortable with it.
              </p>
              <p>
                Serious allegations, discrimination, harassment, whistleblowing
                or safeguarding concerns may require a formal process.
              </p>
            </section>

            <section>
              <h2>Step 3 – Investigate where necessary</h2>
              <p>
                Gather enough information to understand the issues fairly. The
                investigation should be proportionate to the seriousness and
                complexity of the grievance.
              </p>
              <ul>
                <li>Review relevant documents, emails and records.</li>
                <li>Interview appropriate witnesses.</li>
                <li>Give any person criticised a fair opportunity to respond.</li>
                <li>Keep accurate notes and preserve relevant evidence.</li>
                <li>Consider conflicting evidence objectively.</li>
              </ul>
            </section>

            <section>
              <h2>Step 4 – Hold the grievance meeting</h2>
              <p>
                Invite the employee without unreasonable delay and give them
                enough time to prepare. Remind them of the statutory right to be
                accompanied by a workplace colleague or trade union representative.
              </p>
              <ul>
                <li>Explain the purpose and structure of the meeting.</li>
                <li>Allow the employee to explain the grievance fully.</li>
                <li>Ask neutral questions and clarify the outcome sought.</li>
                <li>Consider any evidence or companion&apos;s contribution.</li>
                <li>Adjourn if further investigation is required.</li>
              </ul>
            </section>

            <section>
              <h2>Step 5 – Reach a reasoned outcome</h2>
              <p>
                Review the information objectively and decide whether each part
                of the grievance is upheld, partially upheld or not upheld.
              </p>
              <p>
                The outcome should explain the findings and any action the
                organisation intends to take. Confidential information about
                another employee should not be disclosed unnecessarily.
              </p>
            </section>

            <section>
              <h2>Step 6 – Confirm the outcome in writing</h2>
              <p>
                Write to the employee without unreasonable delay. The letter
                should confirm:
              </p>
              <ul>
                <li>the issues considered;</li>
                <li>the findings and reasons;</li>
                <li>any action or recommendations;</li>
                <li>any follow-up or review arrangements; and</li>
                <li>the right of appeal and the appeal deadline.</li>
              </ul>
            </section>

            <section>
              <h2>Step 7 – Manage any appeal</h2>
              <p>
                The appeal should, wherever possible, be handled by someone not
                previously involved and with authority to reach the final
                decision.
              </p>
              <p>
                Review the grounds of appeal, investigate further where needed
                and confirm the final outcome in writing.
              </p>
            </section>

            <section>
              <h2>After the grievance</h2>
              <ul>
                <li>Complete agreed actions promptly.</li>
                <li>Monitor working relationships and wellbeing where appropriate.</li>
                <li>Protect the employee from retaliation or victimisation.</li>
                <li>Keep records secure and access restricted.</li>
                <li>Address any separate disciplinary issue through its own fair process.</li>
              </ul>
            </section>

            <section>
              <h2>Common mistakes to avoid</h2>
              <ul>
                <li>Dismissing the concern as a personality clash without enquiry.</li>
                <li>Allowing unreasonable delay.</li>
                <li>Using someone involved in the complaint as decision-maker.</li>
                <li>Failing to investigate evidence from both sides.</li>
                <li>Promising complete confidentiality.</li>
                <li>Disclosing another employee&apos;s confidential outcome.</li>
                <li>Failing to offer an appeal.</li>
              </ul>
            </section>

            <div className="tip">
              <strong>LEO Professional Recommendation</strong>
              <p>
                Separate the employee&apos;s concern, the evidence, the findings
                and the action to be taken. A clear structure helps demonstrate
                that the grievance was taken seriously and decided fairly.
              </p>
            </div>

            <div className="notice">
              <strong>Legal position — January 2027</strong>
              <p>
                Employers should follow the ACAS Code of Practice on disciplinary
                and grievance procedures, act without unreasonable delay, allow
                the employee to be accompanied at the formal meeting and offer
                an appeal. Employment tribunals may adjust compensation where
                either party unreasonably fails to follow the Code.
              </p>
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Grievance
                <br />
                Resource ID: {resourceId}
                <br />
                Last reviewed: January 2027
              </p>
            </section>

            <section className="side-card">
              <h2>Related resources</h2>
              <div className="related-list">
                <Link className="related-link" href="/dashboard/policies/factsheets/grievance-procedure">
                  Grievance Procedure Factsheet
                </Link>
                <Link className="related-link" href="/dashboard/policies/checklists/grievance-investigation-checklist">
                  Grievance Investigation Checklist
                </Link>
                <Link className="related-link" href="/dashboard/policies/letters/invitation-to-grievance-meeting">
                  Invitation to Grievance Meeting
                </Link>
                <Link className="related-link" href="/dashboard/policies/letters/grievance-outcome">
                  Grievance Outcome Letter
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}