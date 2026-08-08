"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Right to Work Checklist";
const resourceId = "right-to-work-checklist";
const resourceSummary =
  "A thorough checklist for completing lawful Right to Work checks, identifying restrictions, retaining evidence and scheduling follow-up checks.";

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

export default function RightToWorkChecklistPage() {
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
    anchor.download = "LEO-Right-to-Work-Checklist.doc";
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
                Complete a compliant Right to Work check before employment
                begins. Use the Home Office online service, an approved digital
                verification route where permitted, a compliant manual
                document check, or the Employer Checking Service where
                appropriate. Apply the same process consistently to every
                candidate and do not make assumptions based on nationality,
                accent, ethnicity, name or appearance.
              </p>
            </section>

            <section>
              <h2>Worker details</h2>
              <div className="details-grid">
                <div><strong>Worker name</strong><span /></div>
                <div><strong>Role</strong><span /></div>
                <div><strong>Manager</strong><span /></div>
                <div><strong>Proposed start date</strong><span /></div>
                <div><strong>Check completed by</strong><span /></div>
                <div><strong>Date of check</strong><span /></div>
              </div>
            </section>

            {[
              {
                title: "Before carrying out the check",
                items: [
                  "Confirm the check will be completed before employment begins",
                  "Confirm the individual is being checked consistently with all other candidates",
                  "Identify the correct checking route: Home Office online, approved digital verification, manual document check or Employer Checking Service",
                  "Do not accept screenshots, photocopies or informal evidence unless the official process expressly permits it",
                  "Confirm the role and working arrangement so any restrictions can be assessed against the actual work",
                  "Ensure the person conducting the check understands the current Home Office guidance",
                ],
              },
              {
                title: "Home Office online check",
                items: [
                  "Obtain the worker's valid Right to Work share code",
                  "Obtain the worker's date of birth",
                  "Use the official Home Office online Right to Work service",
                  "Confirm the online profile photograph matches the person presenting for work",
                  "Confirm the name and date of birth match the worker's identity",
                  "Confirm the status permits the work offered",
                  "Check any restrictions on hours, role, employer, occupation or supplementary work",
                  "Save the official profile page showing the date the check was completed",
                  "Do not rely on a share code result supplied by the worker without completing the employer-side check",
                ],
              },
              {
                title: "Manual document check",
                items: [
                  "Obtain original documents from the current Home Office acceptable-document lists",
                  "Check the documents in the presence of the holder, physically or by a permitted live video process where the originals are held by the employer",
                  "Confirm photographs are consistent with the holder's appearance",
                  "Confirm dates of birth are consistent across documents and with the holder",
                  "Check expiry dates and immigration endorsements carefully",
                  "Check the documents appear genuine and have not been tampered with",
                  "Check names are consistent across documents and obtain supporting evidence for any name change",
                  "Confirm the documents permit the type of work offered",
                  "Copy every relevant page, including personal details, expiry dates, endorsements and immigration permissions",
                  "Record the date of the check clearly on the retained copy",
                ],
              },
              {
                title: "Digital verification route",
                items: [
                  "Confirm the individual is eligible to use the approved digital verification route",
                  "Use an Identity Service Provider that meets the current Home Office requirements",
                  "Review the provider's identity-check output rather than relying solely on a pass indicator",
                  "Confirm the provider's photograph and identity details match the person presenting for work",
                  "Retain the provider evidence in an unalterable form",
                  "Complete any additional employer identity match required by current guidance",
                ],
              },
              {
                title: "Employer Checking Service",
                items: [
                  "Use the Employer Checking Service where the worker cannot evidence status through the usual routes and Home Office verification is appropriate",
                  "Obtain the worker's consent and required Home Office reference details",
                  "Submit the Employer Checking Service request before employment begins where required",
                  "Do not treat an outstanding application, appeal or review as automatic proof of permission to work",
                  "Retain the Positive Verification Notice where one is issued",
                  "Record the expiry of the statutory excuse created by the Positive Verification Notice",
                  "Schedule a repeat check before the Positive Verification Notice expires",
                ],
              },
              {
                title: "Fraud and inconsistency checks",
                items: [
                  "Escalate documents that appear altered, inconsistent, damaged or suspicious",
                  "Check that the photograph reasonably resembles the holder",
                  "Check that dates, names and personal details are consistent",
                  "Check that visa or status conditions match the proposed role and hours",
                  "Do not accept an expired physical Biometric Residence Permit as proof where current guidance requires online evidence",
                  "Pause onboarding where the right to work cannot be verified",
                  "Do not accuse the individual of fraud without evidence; follow a neutral verification process",
                  "Seek Home Office or specialist advice where authenticity or permission remains unclear",
                ],
              },
              {
                title: "Time-limited permission and repeat checks",
                items: [
                  "Record whether the worker has continuous or time-limited permission",
                  "Record the permission expiry date or repeat-check deadline",
                  "Schedule the follow-up check before the statutory excuse expires",
                  "Confirm any new immigration status still permits the actual role and hours",
                  "Retain evidence of every follow-up check",
                  "Escalate immediately where permission cannot be reverified before expiry",
                  "Do not allow the worker to continue in breach of a known restriction",
                ],
              },
              {
                title: "Record keeping and data protection",
                items: [
                  "Retain clear evidence of the prescribed check for the full period of employment",
                  "Retain the evidence for the required period after employment ends",
                  "Store copies securely with access limited to authorised users",
                  "Record the method, date, checker and outcome",
                  "Record all restrictions, expiry dates and follow-up actions",
                  "Avoid retaining unnecessary immigration information",
                  "Ensure records can be produced promptly if requested by the Home Office",
                ],
              },
              {
                title: "Final approval before start",
                items: [
                  "The worker's identity has been matched to the evidence",
                  "The right to work has been verified using a prescribed route",
                  "The permission covers the actual role, hours and working arrangement",
                  "Any restrictions are recorded and understood by the manager",
                  "Evidence has been saved securely",
                  "Any repeat-check date has been entered into LEO Compliance",
                  "The worker has not started before the check was completed",
                  "Final approval has been recorded by an authorised person",
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
              <h2>Check outcome</h2>
              <div className="details-grid">
                <div><strong>Right to work confirmed</strong><span /></div>
                <div><strong>Check route used</strong><span /></div>
                <div><strong>Continuous or time-limited</strong><span /></div>
                <div><strong>Permission expiry date</strong><span /></div>
                <div><strong>Follow-up check due</strong><span /></div>
                <div><strong>Restrictions recorded</strong><span /></div>
              </div>
            </section>

            <section>
              <h2>Additional notes</h2>
              <div className="notes-box" />
            </section>

            <div className="tip">
              <strong>How LEO should help</strong>
              <p>
                LEO should record the completed check, retain the verification
                evidence securely, monitor any expiry or follow-up date, prevent
                duplicate reminders and initiate the next verification action
                before the statutory excuse expires. Human approval should be
                required where identity, authenticity, immigration restrictions
                or continued employment require judgement.
              </p>
            </div>

            <div className="notice">
              This checklist reflects Home Office Right to Work requirements for
              England and Wales as at January 2027. Always use the current Home
              Office employer guidance and acceptable-document lists. A
              compliant check may establish a statutory excuse against a civil
              penalty, but it does not protect an employer who knows or has
              reasonable cause to believe that a person is working illegally.
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Compliance
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
                  href="/dashboard/policies/guides"
                >
                  Right to Work Employer Guide
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/compliance"
                >
                  Compliance Workspace
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