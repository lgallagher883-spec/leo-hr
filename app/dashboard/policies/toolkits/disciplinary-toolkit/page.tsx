"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Disciplinary Toolkit";
const resourceId = "disciplinary-toolkit";
const resourceSummary =
  "A complete resource pack for managing a disciplinary process, bringing together practical guidance, letters, forms and checklists from investigation through to outcome.";

const askLeoPrompt = [
  `I am reviewing the LEO toolkit "${resourceTitle}".`,
  resourceSummary,
  "Please use this toolkit as the context for my question.",
].join("\n\n");

const askLeoHref =
  `/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
  `&resourceTitle=${encodeURIComponent(resourceTitle)}` +
  `&resourceType=${encodeURIComponent("Toolkit")}` +
  `&returnUrl=${encodeURIComponent(
    `/dashboard/policies/toolkits/${resourceId}`
  )}`;

export default function DisciplinaryToolkitPage() {
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

            .toolkit-cover {
          padding: 24px;
          border: 1px solid #eadff0;
          border-radius: 18px;
          background: linear-gradient(135deg, #fbf8fd 0%, #f5fff9 100%);
        }

        .toolkit-cover h2 {
          margin-top: 4px;
          border: 0;
          font-size: 28px;
        }

        .toolkit-label {
          margin: 0;
          color: #8a6a9e;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .resource-pack-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .pack-item {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 58px;
          padding: 12px 14px;
          border: 1px solid #e8dfeb;
          border-radius: 12px;
          background: #ffffff;
        }

        .pack-item span {
          display: grid;
          flex: 0 0 auto;
          width: 30px;
          height: 30px;
          place-items: center;
          border-radius: 9px;
          background: #f4edf8;
          color: #6e5084;
          font-size: 12px;
          font-weight: 700;
        }

        .toolkit-table {
          overflow: hidden;
          margin-top: 14px;
          border: 1px solid #e1e5ea;
          border-radius: 14px;
        }

        .toolkit-table-header,
        .toolkit-table-row {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr) 130px 105px;
        }

        .toolkit-table-header {
          background: #f7f1fc;
          color: #6e5084;
          font-size: 13px;
          font-weight: 700;
        }

        .toolkit-table-header span,
        .toolkit-table-row span {
          min-height: 44px;
          padding: 11px 12px;
          border-right: 1px solid #e1e5ea;
        }

        .toolkit-table-header span:last-child,
        .toolkit-table-row span:last-child {
          border-right: 0;
        }

        .toolkit-table-row + .toolkit-table-row {
          border-top: 1px solid #e1e5ea;
        }

        .toolkit-check {
          display: grid;
          place-items: center;
          color: #6e5084;
          font-size: 20px;
        }

        .form-card,
        .template-card {
          margin-top: 14px;
          padding: 18px;
          border: 1px solid #e1e5ea;
          border-radius: 14px;
          background: #ffffff;
        }

        .form-field + .form-field {
          margin-top: 16px;
        }

        .form-field strong {
          display: block;
          margin-bottom: 18px;
          color: #6e5084;
          font-size: 13px;
        }

        .form-field span {
          display: block;
          border-bottom: 1px solid #cbd5e1;
        }

        .template-card p:last-child {
          margin-bottom: 0;
        }

        .simple-checklist {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .simple-checklist div {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          padding: 11px 12px;
          border: 1px solid #e8dfeb;
          border-radius: 11px;
          background: #ffffff;
        }

        .simple-checklist span {
          color: #6e5084;
          font-size: 20px;
        }

        .simple-checklist p {
          margin: 1px 0 0;
        }

        @media (max-width: 720px) {
          .resource-pack-grid {
            grid-template-columns: 1fr;
          }

          .toolkit-table-header,
          .toolkit-table-row {
            grid-template-columns: 52px minmax(0, 1fr);
          }

          .toolkit-table-header span:nth-child(3),
          .toolkit-table-header span:nth-child(4),
          .toolkit-table-row span:nth-child(3),
          .toolkit-table-row span:nth-child(4) {
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
    anchor.download = "LEO-Disciplinary-Toolkit.doc";
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
          href="/dashboard/policies/toolkits"
        >
          ← Back to Toolkits
        </Link>

        <header className="page-header">
          <div>
            <p className="eyebrow">Toolkit</p>
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
          <article className="document toolkit-document" id="resource-content">
            <section className="toolkit-cover">
              <p className="toolkit-label">Complete HR resource pack</p>
              <h2>Disciplinary Toolkit</h2>
              <p>
                Use this toolkit to manage a disciplinary process fairly,
                consistently and proportionately, from the initial concern
                through to investigation, hearing, outcome and appeal.
              </p>
            </section>

            <section>
              <h2>How to use this toolkit</h2>
              <ol>
                <li>Assess whether informal action may resolve the issue.</li>
                <li>Plan and complete a fair investigation.</li>
                <li>Decide whether there is a disciplinary case to answer.</li>
                <li>Invite the employee to a disciplinary hearing.</li>
                <li>Conduct the hearing and consider evidence and mitigation.</li>
                <li>Reach and record a proportionate decision.</li>
                <li>Confirm the outcome and provide a right of appeal.</li>
              </ol>
            </section>

            <section>
              <h2>Included resources</h2>
              <div className="resource-pack-grid">
                {[
                  ["1", "Disciplinary process guide"],
                  ["2", "Investigation planning checklist"],
                  ["3", "Investigation meeting record"],
                  ["4", "Invitation to disciplinary hearing"],
                  ["5", "Disciplinary hearing checklist"],
                  ["6", "Hearing notes form"],
                  ["7", "Outcome decision record"],
                  ["8", "Written warning outcome template"],
                  ["9", "Dismissal outcome template"],
                  ["10", "Appeal invitation template"],
                  ["11", "Appeal outcome template"],
                  ["12", "Record-keeping guidance"],
                ].map(([number, title]) => (
                  <div className="pack-item" key={number}>
                    <span>{number}</span>
                    <strong>{title}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2>1. Disciplinary process guide</h2>
              <h3>Initial assessment</h3>
              <p>
                Identify the concern clearly and decide whether it is misconduct,
                capability, attendance or another issue. Avoid predetermining the
                outcome. Minor concerns may be better managed informally.
              </p>
              <h3>Investigation</h3>
              <p>
                The investigation should establish the facts. Gather relevant
                evidence, meet witnesses where necessary and give the employee an
                opportunity to explain their account.
              </p>
              <h3>Hearing and decision</h3>
              <p>
                Supply the allegations and evidence in advance, allow the
                employee to be accompanied and give them a full opportunity to
                respond. Consider consistency, mitigation, service, disciplinary
                record and seriousness before deciding the outcome.
              </p>
              <h3>Appeal</h3>
              <p>
                Offer a right of appeal and, where possible, appoint someone who
                has not previously been involved to hear it.
              </p>
            </section>

            <section>
              <h2>2. Investigation planning checklist</h2>
              <div className="toolkit-table">
                <div className="toolkit-table-header">
                  <span>Done</span>
                  <span>Action</span>
                  <span>Owner</span>
                  <span>Date</span>
                </div>
                {[
                  "Define the allegation or concern clearly",
                  "Appoint an appropriate investigator",
                  "Identify relevant evidence and witnesses",
                  "Preserve documents, records and system data",
                  "Plan witness and employee meetings",
                  "Consider confidentiality and data protection",
                  "Review whether suspension is necessary",
                  "Record findings and whether there is a case to answer",
                ].map((item) => (
                  <div className="toolkit-table-row" key={item}>
                    <span className="toolkit-check">☐</span>
                    <span>{item}</span>
                    <span />
                    <span />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2>3. Investigation meeting record</h2>
              <div className="form-card">
                {[
                  "Case reference",
                  "Employee or witness",
                  "Date, time and location",
                  "People present",
                  "Purpose of meeting",
                  "Questions and responses",
                  "Documents or evidence referred to",
                  "Further action required",
                ].map((label) => (
                  <div className="form-field" key={label}>
                    <strong>{label}</strong>
                    <span />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2>4. Invitation to disciplinary hearing</h2>
              <div className="template-card">
                <p><strong>Private and confidential</strong></p>
                <p>[Employee name]<br />[Address]<br />[Date]</p>
                <p>Dear [Employee name],</p>
                <p><strong>Invitation to disciplinary hearing</strong></p>
                <p>
                  You are invited to attend a disciplinary hearing on [date] at
                  [time] at [location / meeting arrangements].
                </p>
                <p>
                  The allegations to be considered are: [set out each allegation
                  clearly and separately].
                </p>
                <p>
                  The evidence enclosed will be considered at the hearing. You
                  will have the opportunity to respond fully and explain any
                  mitigating circumstances.
                </p>
                <p>
                  The possible outcomes include [state the possible outcomes,
                  including dismissal where genuinely relevant].
                </p>
                <p>
                  You have the right to be accompanied by a workplace colleague
                  or trade union representative.
                </p>
              </div>
            </section>

            <section>
              <h2>5. Disciplinary hearing checklist</h2>
              <div className="simple-checklist">
                {[
                  "Invitation gave reasonable notice",
                  "Allegations were set out clearly",
                  "Evidence was supplied in advance",
                  "Right to be accompanied was confirmed",
                  "Possible outcomes were explained",
                  "Employee was allowed to respond fully",
                  "Mitigation and relevant context were considered",
                  "Further investigation was completed where required",
                  "Decision was adjourned and considered objectively",
                ].map((item) => (
                  <div key={item}><span>☐</span><p>{item}</p></div>
                ))}
              </div>
            </section>

            <section>
              <h2>6. Hearing notes form</h2>
              <div className="form-card">
                {[
                  "Employee",
                  "Chair",
                  "Companion",
                  "Note taker",
                  "Date and time",
                  "Allegations discussed",
                  "Employee response",
                  "Mitigating circumstances",
                  "Further evidence or enquiries required",
                ].map((label) => (
                  <div className="form-field" key={label}>
                    <strong>{label}</strong>
                    <span />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2>7. Outcome decision record</h2>
              <div className="form-card">
                {[
                  "Allegation",
                  "Evidence considered",
                  "Employee explanation",
                  "Finding",
                  "Mitigation considered",
                  "Consistency check",
                  "Outcome and rationale",
                  "Decision maker",
                  "Date",
                ].map((label) => (
                  <div className="form-field" key={label}>
                    <strong>{label}</strong>
                    <span />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2>8. Written warning outcome template</h2>
              <div className="template-card">
                <p><strong>Private and confidential</strong></p>
                <p>Dear [Employee name],</p>
                <p><strong>Outcome of disciplinary hearing</strong></p>
                <p>
                  Following the disciplinary hearing held on [date], I have
                  decided that the allegation of [allegation] is [upheld /
                  partially upheld].
                </p>
                <p>
                  You will receive a [first / final] written warning. It will
                  remain active for [period]. During this period you are required
                  to [state the expected conduct or improvement].
                </p>
                <p>
                  You may appeal in writing to [name / role] within [number] days,
                  explaining the grounds of your appeal.
                </p>
              </div>
            </section>

            <section>
              <h2>9. Dismissal outcome template</h2>
              <div className="template-card">
                <p><strong>Private and confidential</strong></p>
                <p>Dear [Employee name],</p>
                <p><strong>Outcome of disciplinary hearing</strong></p>
                <p>
                  Following the disciplinary hearing held on [date], I have
                  decided that the allegation of [allegation] is upheld.
                </p>
                <p>
                  The outcome is dismissal [with notice / without notice for
                  gross misconduct]. Your employment will end on [date].
                </p>
                <p>
                  You may appeal in writing to [name / role] within [number] days.
                </p>
              </div>
            </section>

            <section>
              <h2>10. Appeal invitation template</h2>
              <div className="template-card">
                <p>Dear [Employee name],</p>
                <p><strong>Invitation to disciplinary appeal hearing</strong></p>
                <p>
                  Your appeal will be heard on [date] at [time] at [location /
                  meeting arrangements].
                </p>
                <p>
                  The appeal will consider the grounds set out in your appeal.
                  You have the right to be accompanied.
                </p>
              </div>
            </section>

            <section>
              <h2>11. Appeal outcome template</h2>
              <div className="template-card">
                <p>Dear [Employee name],</p>
                <p><strong>Outcome of disciplinary appeal</strong></p>
                <p>
                  Following the appeal hearing held on [date], your appeal is
                  [upheld / partially upheld / not upheld].
                </p>
                <p>
                  The original outcome is therefore [confirmed / replaced with
                  the following outcome]. This decision is final under the
                  organisation&apos;s internal procedure.
                </p>
              </div>
            </section>

            <section>
              <h2>12. Record-keeping guidance</h2>
              <ul>
                <li>Keep evidence, notes, letters and decisions securely.</li>
                <li>Restrict access to those who genuinely need it.</li>
                <li>Maintain a clear chronology of the process.</li>
                <li>Apply warning expiry periods consistently.</li>
                <li>Do not retain information longer than necessary.</li>
                <li>Preserve the original record where corrections are required.</li>
              </ul>
            </section>

            <div className="notice">
              This toolkit provides general HR guidance for England and Wales.
              It must be adapted to the organisation&apos;s policy and the facts
              of the case. Seek specialist advice where dismissal,
              discrimination, whistleblowing, health, trade union activity,
              safeguarding or another complex issue may arise.
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