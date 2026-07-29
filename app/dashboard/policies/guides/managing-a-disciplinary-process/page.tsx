"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Managing a Disciplinary Process";
const resourceId = "managing-a-disciplinary-process";
const resourceSummary =
  "A practical guide to planning and carrying out a fair disciplinary process, from investigation through to the hearing, decision and follow-up.";

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

export default function ManagingADisciplinaryProcessPage() {
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
    anchor.download = "LEO-Managing-a-Disciplinary-Process.doc";
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

          <span className="updated-pill">Updated July 2026</span>
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
                This guide explains how to manage a fair and proportionate
                disciplinary process, from the initial concern through
                investigation, hearing, decision, appeal and record keeping.
              </p>
            </section>

            <section>
              <h2>Before you begin</h2>
              <ul>
                <li>
                  Check the organisation&apos;s disciplinary policy and the
                  employee&apos;s contract.
                </li>
                <li>
                  Identify the concern clearly and avoid deciding the outcome
                  in advance.
                </li>
                <li>
                  Consider whether the matter is misconduct, capability,
                  attendance or another issue.
                </li>
                <li>
                  Act promptly while allowing enough time for a fair process.
                </li>
              </ul>
            </section>

            <section>
              <h2>Step 1 – Decide whether formal action is necessary</h2>
              <p>
                Minor issues can often be resolved informally through a clear
                management conversation, support, training or an agreed
                improvement plan. Formal disciplinary action should be used
                where the concern is sufficiently serious, repeated, or has
                not improved after appropriate informal action.
              </p>
            </section>

            <section>
              <h2>Step 2 – Investigate</h2>
              <p>
                Appoint an impartial investigator where possible. The
                investigation should establish the facts rather than prove
                guilt.
              </p>
              <ul>
                <li>Define the allegation or concern.</li>
                <li>Gather relevant documents, records and other evidence.</li>
                <li>Meet witnesses where necessary.</li>
                <li>
                  Give the employee an opportunity to explain their account.
                </li>
                <li>Keep accurate notes and preserve relevant evidence.</li>
              </ul>
            </section>

            <section>
              <h2>Step 3 – Consider suspension carefully</h2>
              <p>
                Suspension is not a disciplinary sanction and should never be
                automatic. Consider alternatives first, such as temporary
                duties, adjusted access, a different reporting line or working
                from another location.
              </p>
              <p>
                Where suspension is necessary, keep it on full pay, explain
                the reason, confirm it in writing, maintain appropriate contact
                and review it regularly.
              </p>
            </section>

            <section>
              <h2>Step 4 – Decide whether there is a case to answer</h2>
              <p>
                Review the investigation objectively. A disciplinary hearing
                should only be arranged where there is sufficient information
                to justify formal consideration. If there is no case to answer,
                close the matter and confirm this appropriately.
              </p>
            </section>

            <section>
              <h2>Step 5 – Invite the employee to the hearing</h2>
              <p>The written invitation should include:</p>
              <ul>
                <li>The date, time and location or meeting arrangements.</li>
                <li>Clear details of each allegation.</li>
                <li>The evidence that will be considered.</li>
                <li>
                  The possible outcomes, including dismissal where relevant.
                </li>
                <li>The right to be accompanied.</li>
                <li>Reasonable notice to prepare.</li>
              </ul>
            </section>

            <section>
              <h2>Step 6 – Conduct the hearing fairly</h2>
              <p>
                The chair should explain the purpose of the meeting, set out
                the concerns, review the evidence and allow the employee to
                respond fully. The employee should be able to ask questions,
                challenge evidence, provide information and raise relevant
                mitigating circumstances.
              </p>
              <p>
                Keep the tone professional and avoid hostile or leading
                questions. Adjourn if further investigation is required.
              </p>
            </section>

            <section>
              <h2>Step 7 – Reach a proportionate decision</h2>
              <p>
                The decision must be based on the evidence and the balance of
                probabilities. Consider consistency, length of service,
                disciplinary record, mitigation, the employee&apos;s
                explanation, the seriousness of the conduct and whether
                alternatives to a warning or dismissal are appropriate.
              </p>

              <h3>Possible outcomes</h3>
              <ul>
                <li>No formal action.</li>
                <li>Informal guidance or management instruction.</li>
                <li>First written warning.</li>
                <li>Final written warning.</li>
                <li>Dismissal with notice.</li>
                <li>Summary dismissal for gross misconduct.</li>
                <li>
                  Another contractual sanction, where the contract permits it.
                </li>
              </ul>
            </section>

            <section>
              <h2>Step 8 – Confirm the outcome</h2>
              <p>
                Confirm the decision in writing without unreasonable delay.
                Explain the findings, the sanction, the required improvement
                or conduct, the review period, the consequences of further
                concerns and the right of appeal.
              </p>
            </section>

            <section>
              <h2>Step 9 – Manage any appeal</h2>
              <p>
                The appeal should, where possible, be heard by someone not
                previously involved and with appropriate authority. Consider
                the grounds raised, review the process and evidence, and carry
                out further enquiries where necessary. Confirm the final
                decision in writing.
              </p>
            </section>

            <section>
              <h2>Record keeping and confidentiality</h2>
              <ul>
                <li>
                  Keep investigation notes, evidence, meeting records and
                  decisions securely.
                </li>
                <li>
                  Restrict access to those who genuinely need it.
                </li>
                <li>
                  Record warnings accurately and remove or disregard them when
                  expired, in line with policy.
                </li>
                <li>Do not circulate sensitive details unnecessarily.</li>
              </ul>
            </section>

            <section>
              <h2>Common mistakes to avoid</h2>
              <ul>
                <li>Deciding the outcome before the hearing.</li>
                <li>
                  Using disciplinary action for a capability or health issue
                  without proper consideration.
                </li>
                <li>Failing to provide the employee with the evidence.</li>
                <li>Automatically suspending the employee.</li>
                <li>Relying on vague allegations.</li>
                <li>Ignoring mitigation or inconsistent treatment.</li>
                <li>Failing to offer an appeal.</li>
              </ul>
            </section>

            <div className="tip">
              <strong>Practical HR tip</strong>
              <p>
                Keep the allegation, evidence, finding and sanction clearly
                separated. This helps demonstrate that the decision was
                reasoned, proportionate and based on the information considered.
              </p>
            </div>

            <div className="notice">
              This guide provides general HR guidance for England and Wales. It
              should be used alongside the organisation&apos;s own procedure
              and adapted to the facts of the case. Seek specialist advice
              where dismissal, discrimination, whistleblowing, health, trade
              union activity or another complex issue may arise.
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Disciplinary
                <br />
                Resource ID: {resourceId}
                <br />
                Last reviewed: July 2026
              </p>
            </section>

            <section className="side-card">
              <h2>Related resources</h2>
              <div className="related-list">
                <Link
                  className="related-link"
                  href="/dashboard/policies/guides"
                >
                  Managing a probation period
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/checklists"
                >
                  New starter checklist
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/forms"
                >
                  New starter forms
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}