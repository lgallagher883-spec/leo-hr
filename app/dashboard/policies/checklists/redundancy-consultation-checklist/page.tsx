"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Redundancy Consultation Checklist";
const resourceId = "redundancy-consultation-checklist";
const resourceSummary =
  "A thorough checklist for planning and conducting a fair redundancy consultation, selection and dismissal process.";

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

export default function RedundancyConsultationChecklistPage() {
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
    anchor.download = "LEO-Redundancy-Consultation-Checklist.doc";
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
                Use this checklist whenever redundancies are proposed.
                Consultation must begin while proposals are still genuinely
                open to change. Employers should consider ways to avoid or
                reduce redundancies, use fair selection arrangements and
                consult meaningfully before reaching any final decision.
              </p>
            </section>

            <section>
              <h2>Process details</h2>
              <div className="details-grid">
                <div><strong>Business area</strong><span /></div>
                <div><strong>Process lead</strong><span /></div>
                <div><strong>Proposal date</strong><span /></div>
                <div><strong>Roles affected</strong><span /></div>
                <div><strong>Employees at risk</strong><span /></div>
                <div><strong>Target completion date</strong><span /></div>
              </div>
            </section>

            {[
              {
                title: "Business case and initial planning",
                items: [
                  "Document the genuine business reason for the proposed redundancies",
                  "Confirm that the proposal relates to a reduced need for employees to carry out work of a particular kind, workplace closure or business closure",
                  "Identify the roles and work affected rather than selecting named employees first",
                  "Record financial, operational or organisational evidence supporting the proposal",
                  "Consider whether the proposal could change following consultation",
                  "Appoint a process lead and decision-maker with appropriate authority",
                  "Identify HR, legal, payroll and employee-relations support required",
                  "Create a written project timetable",
                  "Preserve all relevant decision records and evidence",
                ],
              },
              {
                title: "Check collective consultation duties",
                items: [
                  "Count all proposed redundancy dismissals within the relevant statutory period",
                  "Check whether collective consultation obligations are triggered",
                  "Consider any organisation-wide threshold rules in force at the time",
                  "Identify the appropriate employee or trade union representatives",
                  "Arrange elections where employee representatives are required",
                  "Provide representatives with the prescribed written information",
                  "Submit the required government notification within the statutory deadline",
                  "Observe the applicable minimum consultation period before dismissals take effect",
                  "Record compliance with every collective consultation step",
                  "Seek specialist advice where threshold or establishment questions are unclear",
                ],
              },
              {
                title: "Consider alternatives to redundancy",
                items: [
                  "Review recruitment freezes and non-replacement of vacancies",
                  "Consider reduced overtime, temporary lay-off or short-time working where contractually permitted",
                  "Consider voluntary redundancy or early retirement options",
                  "Review use of agency workers, contractors and temporary staff",
                  "Consider redeployment, retraining or reduced hours",
                  "Consider job sharing, temporary changes or agreed contractual variations",
                  "Review vacant roles across the organisation",
                  "Assess whether savings can be achieved in another way",
                  "Record every alternative considered and the outcome",
                ],
              },
              {
                title: "Selection pool and criteria",
                items: [
                  "Identify a fair selection pool containing the same or similar roles",
                  "Consider whether interchangeable roles should be included",
                  "Explain and record the reason for the proposed pool",
                  "Use objective, measurable and job-related selection criteria",
                  "Avoid criteria that directly or indirectly discriminate",
                  "Exclude protected absences and activities from scoring",
                  "Check treatment of pregnancy, family leave, disability-related absence, trade union and whistleblowing activity",
                  "Weight criteria reasonably",
                  "Identify reliable evidence for every score",
                  "Moderate scores to improve consistency",
                  "Allow employees to challenge factual scoring errors",
                ],
              },
              {
                title: "At-risk communication",
                items: [
                  "Tell affected employees that redundancy is proposed, not decided",
                  "Explain the business reason and roles affected",
                  "Explain the proposed selection pool and criteria",
                  "Provide the proposed timetable",
                  "Explain how consultation will work",
                  "Confirm representation and accompaniment arrangements",
                  "Explain available support",
                  "Provide a named contact for questions",
                  "Avoid language suggesting the outcome is predetermined",
                  "Confirm the information in writing",
                ],
              },
              {
                title: "Individual consultation meetings",
                items: [
                  "Give reasonable notice of each consultation meeting",
                  "Explain why the employee's role is at risk",
                  "Share provisional selection scores where applicable",
                  "Explain the evidence supporting each score",
                  "Invite questions, corrections and alternatives",
                  "Consider the employee's suggestions genuinely",
                  "Discuss ways to avoid or reduce redundancy",
                  "Discuss suitable alternative employment",
                  "Consider health, disability, language and reasonable adjustment needs",
                  "Keep accurate written notes",
                  "Hold further meetings where issues remain unresolved",
                ],
              },
              {
                title: "Suitable alternative employment",
                items: [
                  "Search for vacancies across the organisation and associated employers where relevant",
                  "Assess suitability by role, pay, status, location, hours, skills and personal circumstances",
                  "Offer suitable roles before employment ends",
                  "Do not require an employee on maternity or certain family leave to compete for a suitable available vacancy where priority rules apply",
                  "Confirm offers in writing",
                  "Explain the statutory trial period where applicable",
                  "Record reasons where a role is considered unsuitable",
                  "Record any employee refusal and the reasons given",
                  "Avoid assumptions that an employee will not accept a lower-paid or different role",
                ],
              },
              {
                title: "Final decision",
                items: [
                  "Review all consultation feedback before deciding",
                  "Consider whether the business proposal should be amended",
                  "Recheck selection scores and evidence",
                  "Check consistency and discrimination risk",
                  "Confirm all suitable alternatives have been explored",
                  "Confirm collective obligations have been met where applicable",
                  "Obtain final internal approval",
                  "Record the reason for each final decision",
                  "Do not issue notice until consultation is complete",
                ],
              },
              {
                title: "Notice, pay and written outcome",
                items: [
                  "Confirm the redundancy decision in writing",
                  "Explain the reason the role is redundant",
                  "Explain the employee's selection score and final position",
                  "Confirm notice period and termination date",
                  "Calculate statutory and contractual redundancy pay",
                  "Calculate outstanding salary, holiday and other sums",
                  "Explain time off to look for work where applicable",
                  "Confirm any garden leave or payment in lieu arrangements",
                  "Explain the right of appeal and deadline",
                  "Provide a clear contact for questions",
                ],
              },
              {
                title: "Appeal and closure",
                items: [
                  "Offer a genuine appeal process",
                  "Appoint an impartial appeal manager where reasonably possible",
                  "Review selection, consultation and alternative-employment concerns",
                  "Confirm the appeal outcome in writing",
                  "Update payroll and employee records",
                  "Close access and recover property at the appropriate time",
                  "Retain the full redundancy audit trail securely",
                  "Provide appropriate wellbeing and outplacement support",
                  "Review lessons learned from the process",
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
              <h2>Outcome summary</h2>
              <div className="details-grid">
                <div><strong>Final outcome</strong><span /></div>
                <div><strong>Consultation completed</strong><span /></div>
                <div><strong>Alternative role offered</strong><span /></div>
                <div><strong>Notice issued</strong><span /></div>
                <div><strong>Appeal deadline</strong><span /></div>
                <div><strong>Final payment checked</strong><span /></div>
              </div>
            </section>

            <section>
              <h2>Additional notes</h2>
              <div className="notes-box" />
            </section>

            <div className="notice">
              This checklist reflects good HR practice for England and Wales as
              at January 2027. Consultation must be genuine and meaningful and
              take place before redundancy decisions are finalised. Employers
              proposing 20 or more redundancies must also comply with the
              collective consultation and government notification rules in
              force at the time. The maximum protective award for failure to
              comply with collective consultation requirements increased to
              180 days&apos; pay from April 2026.
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
                  href="/dashboard/policies/factsheets"
                >
                  Redundancy Factsheet
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/guides"
                >
                  Managing Redundancy Guide
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/letters"
                >
                  Redundancy Letter Templates
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