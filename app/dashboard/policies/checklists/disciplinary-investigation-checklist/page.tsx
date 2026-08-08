"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Disciplinary Investigation Checklist";
const resourceId = "disciplinary-investigation-checklist";
const resourceSummary =
  "A thorough checklist for planning, conducting and documenting a fair disciplinary investigation before any formal decision is made.";

const askLeoPrompt = [
  `I am reviewing the LEO checklist "${resourceTitle}".`,
  resourceSummary,
  "Please use this checklist as the context for my question.",
].join("\n\n");

const askLeoHref =
  `/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
  `&resourceTitle=${encodeURIComponent(resourceTitle)}` +
  `&resourceType=${encodeURIComponent("Checklist")}` +
  `&returnUrl=${encodeURIComponent(
    `/dashboard/policies/checklists/${resourceId}`
  )}`;

export default function DisciplinaryInvestigationChecklistPage() {
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

            .details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .details-grid div {
          min-height: 66px;
          padding: 12px 14px;
          border: 1px solid #e8dfeb;
          border-radius: 12px;
          background: #ffffff;
        }

        .details-grid strong {
          display: block;
          margin-bottom: 18px;
          color: #6e5084;
          font-size: 13px;
        }

        .details-grid span {
          display: block;
          border-bottom: 1px solid #cbd5e1;
        }

        .checklist-table {
          overflow: hidden;
          margin-top: 14px;
          border: 1px solid #e1e5ea;
          border-radius: 14px;
        }

        .checklist-header,
        .checklist-row {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr) 130px 105px;
        }

        .checklist-header {
          background: #f7f1fc;
          color: #6e5084;
          font-size: 13px;
          font-weight: 700;
        }

        .checklist-header span,
        .checklist-row span {
          min-height: 44px;
          padding: 11px 12px;
          border-right: 1px solid #e1e5ea;
        }

        .checklist-header span:last-child,
        .checklist-row span:last-child {
          border-right: 0;
        }

        .checklist-row + .checklist-row {
          border-top: 1px solid #e1e5ea;
        }

        .check-box {
          display: grid;
          place-items: center;
          color: #6e5084;
          font-size: 21px;
        }

        .notes-box {
          min-height: 150px;
          margin-top: 14px;
          border: 1px solid #e1e5ea;
          border-radius: 14px;
          background:
            repeating-linear-gradient(
              to bottom,
              #ffffff 0,
              #ffffff 31px,
              #e7ebef 32px
            );
        }

        @media (max-width: 720px) {
          .details-grid {
            grid-template-columns: 1fr;
          }

          .checklist-header,
          .checklist-row {
            grid-template-columns: 52px minmax(0, 1fr);
          }

          .checklist-header span:nth-child(3),
          .checklist-header span:nth-child(4),
          .checklist-row span:nth-child(3),
          .checklist-row span:nth-child(4) {
            display: none;
          }
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
    anchor.download = "LEO-Disciplinary-Investigation-Checklist.doc";
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
          href="/dashboard/policies/checklists"
        >
          ← Back to Checklists
        </Link>

        <header className="page-header">
          <div>
            <p className="eyebrow">Checklist</p>
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
          <article className="document checklist-document" id="resource-content">
            <section>
              <h2>How to use this checklist</h2>
              <p>
                Use this checklist before and during every disciplinary
                investigation. The investigator&apos;s role is to establish the
                facts impartially, not to decide guilt or impose a sanction.
                Keep the investigation proportionate to the seriousness and
                complexity of the allegation.
              </p>
            </section>

            <section>
              <h2>Case details</h2>
              <div className="details-grid">
                <div><strong>Employee name</strong><span /></div>
                <div><strong>Job title</strong><span /></div>
                <div><strong>Investigator</strong><span /></div>
                <div><strong>Date appointed</strong><span /></div>
                <div><strong>Allegation received</strong><span /></div>
                <div><strong>Target completion date</strong><span /></div>
              </div>
            </section>

            {[
              {
                title: "Initial assessment",
                items: [
                  "Record the concern or allegation clearly and factually",
                  "Identify the relevant policy, rule or expected standard",
                  "Decide whether informal management action may be sufficient",
                  "Confirm whether a formal investigation is proportionate",
                  "Check for conflicts of interest before appointing the investigator",
                  "Define the investigator's terms of reference",
                  "Identify the potential scope and seriousness of the matter",
                  "Check whether safeguarding, whistleblowing, discrimination or criminal issues may be relevant",
                  "Consider whether specialist or external support is required",
                ],
              },
              {
                title: "Suspension and immediate safeguards",
                items: [
                  "Consider whether temporary measures are genuinely necessary",
                  "Consider alternatives to suspension, including changed duties, location or reporting lines",
                  "Use suspension only where needed to protect people, evidence or the investigation",
                  "Confirm that suspension is neutral and not a disciplinary sanction",
                  "Record the reasons for the decision",
                  "Keep any suspension as short as possible",
                  "Set regular suspension review dates",
                  "Maintain appropriate contact with the employee",
                ],
              },
              {
                title: "Investigation plan",
                items: [
                  "List the allegations or questions to be investigated",
                  "Identify relevant documents, systems and physical evidence",
                  "Identify potential witnesses",
                  "Plan the order of interviews",
                  "Set realistic timescales",
                  "Identify confidentiality and data protection requirements",
                  "Preserve relevant electronic records and audit evidence",
                  "Identify whether evidence could be lost, altered or deleted",
                  "Record any limitations on the investigation",
                ],
              },
              {
                title: "Gathering evidence",
                items: [
                  "Collect relevant policies, records, messages, documents and system evidence",
                  "Secure original evidence and preserve an audit trail",
                  "Consider evidence that supports and challenges the allegation",
                  "Check dates, times and sources for consistency",
                  "Avoid relying on rumour or unsupported assumptions",
                  "Record where requested evidence is unavailable and why",
                  "Limit access to evidence to authorised individuals",
                  "Do not access personal or sensitive information without a lawful and proportionate reason",
                ],
              },
              {
                title: "Witness interviews",
                items: [
                  "Invite each witness with reasonable notice",
                  "Explain the purpose and confidentiality expectations",
                  "Use open and neutral questions",
                  "Avoid leading the witness toward a preferred account",
                  "Ask follow-up questions where information is unclear",
                  "Record the interview accurately",
                  "Give the witness an opportunity to review and confirm the record",
                  "Identify inconsistencies requiring further enquiry",
                  "Avoid promising absolute confidentiality where disclosure may be required",
                ],
              },
              {
                title: "Interviewing the employee",
                items: [
                  "Explain the allegations clearly",
                  "Provide enough information for a meaningful response",
                  "Confirm the meeting is investigatory rather than disciplinary",
                  "Explain any applicable accompaniment arrangements",
                  "Ask for the employee's account and supporting evidence",
                  "Explore alternative explanations",
                  "Ask the employee to identify relevant witnesses or documents",
                  "Consider health, disability, language or adjustment needs",
                  "Allow reasonable time for the employee to respond",
                  "Record the interview accurately",
                ],
              },
              {
                title: "Reviewing the evidence",
                items: [
                  "Compare accounts, documents and system records objectively",
                  "Identify agreed and disputed facts",
                  "Assess the reliability and relevance of each piece of evidence",
                  "Distinguish facts from opinion",
                  "Follow up material inconsistencies",
                  "Consider whether further interviews or evidence are required",
                  "Avoid making credibility findings without explaining the basis",
                  "Check whether the investigation remained within its terms of reference",
                ],
              },
              {
                title: "Investigation report",
                items: [
                  "Summarise the allegation and terms of reference",
                  "Explain the investigation steps completed",
                  "List the evidence considered",
                  "Set out the relevant facts and conflicting evidence",
                  "Identify any evidence that could not be obtained",
                  "Avoid recommending a sanction unless the investigator's remit expressly permits it",
                  "State whether there is a case to answer, where required by the procedure",
                  "Keep conclusions balanced and evidence-based",
                  "Sign and date the final report",
                ],
              },
              {
                title: "Closing the investigation",
                items: [
                  "Provide the report to the authorised decision-maker",
                  "Confirm whether the matter should end, return to informal management or proceed to a disciplinary hearing",
                  "Inform relevant parties of the next step without disclosing unnecessary confidential information",
                  "Securely retain the investigation record",
                  "Update the matter and audit trail",
                  "Review and end any suspension promptly where no longer necessary",
                  "Identify any separate workplace, policy or safeguarding actions",
                ],
              },
            ].map((group) => (
              <section key={group.title}>
                <h2>{group.title}</h2>

                <div className="checklist-table">
                  <div className="checklist-header">
                    <span>Done</span>
                    <span>Action</span>
                    <span>Owner</span>
                    <span>Date</span>
                  </div>

                  {group.items.map((item) => (
                    <div className="checklist-row" key={item}>
                      <span className="check-box" aria-hidden="true">
                        ☐
                      </span>
                      <span>{item}</span>
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section>
              <h2>Investigation outcome</h2>
              <div className="details-grid">
                <div><strong>Case to answer</strong><span /></div>
                <div><strong>Report completed</strong><span /></div>
                <div><strong>Decision-maker</strong><span /></div>
                <div><strong>Suspension reviewed</strong><span /></div>
                <div><strong>Next action</strong><span /></div>
                <div><strong>Record secured</strong><span /></div>
              </div>
            </section>

            <section>
              <h2>Additional notes</h2>
              <div className="notes-box" />
            </section>

            <div className="notice">
              This checklist reflects good HR practice for England and Wales as
              at January 2027 and should be used alongside the organisation&apos;s
              disciplinary procedure and the ACAS Code of Practice. An
              investigation should establish facts impartially and should not
              be used to predetermine a disciplinary outcome.
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
                Last reviewed: January 2027
              </p>
            </section>

            <section className="side-card">
              <h2>Related resources</h2>
              <div className="related-list">
                <Link
                  className="related-link"
                  href="/dashboard/policies/factsheets/disciplinary-procedure"
                >
                  Disciplinary Procedure Factsheet
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/letters/invitation-to-disciplinary-hearing"
                >
                  Disciplinary Hearing Invitation
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/guides"
                >
                  Conducting Workplace Investigations Guide
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