"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { downloadBrandedWordFromElement, openBrandedPdfFromElement } from "@/lib/documents/browserExport";
const resourceTitle = "New Starter Checklist";
const resourceId = "new-starter-checklist";
const resourceSummary =
  "A practical checklist covering the essential steps before, on and after a new employee's first day, helping ensure a consistent and compliant onboarding process.";

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

export default function NewStarterChecklistPage() {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  async function openPdf() {
    await openBrandedPdfFromElement(resourceTitle);
  }

  async function downloadWord() {
    await downloadBrandedWordFromElement(resourceTitle);
  }

  function addToOrganisationResources() {
    window.alert(
      "Direct saving from the LEO library is not yet persistent. Download the Word version and upload it from HR Resources if you want an organisation-owned copy.",
    );
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

          <span className="updated-pill">Reviewed 12 September 2026</span>
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
                Use this checklist to support a consistent, organised and
                compliant onboarding process. Adapt each item to the
                employee&apos;s role, the organisation&apos;s requirements and
                any sector-specific checks.
              </p>
            </section>

            <section>
              <h2>Starter details</h2>
              <div className="details-grid">
                <div><strong>Employee name</strong><span /></div>
                <div><strong>Job title</strong><span /></div>
                <div><strong>Manager</strong><span /></div>
                <div><strong>Start date</strong><span /></div>
                <div><strong>Department</strong><span /></div>
                <div><strong>Work location</strong><span /></div>
              </div>
            </section>

            {[
              {
                title: "Before the employee starts",
                items: [
                  "Offer accepted and start date confirmed",
                  "Written statement or contract issued",
                  "Right to Work check completed before employment begins",
                  "References received and reviewed where required",
                  "DBS, safeguarding or other role-specific checks completed where applicable",
                  "Professional registration or licence verified where applicable",
                  "Payroll, tax and bank details requested securely",
                  "Emergency contact details requested securely",
                  "Workstation, uniform, equipment and system access arranged",
                  "Induction timetable prepared and relevant colleagues notified",
                  "Reasonable adjustments discussed and arranged where required",
                ],
              },
              {
                title: "First day",
                items: [
                  "Welcome meeting completed",
                  "Workplace tour and introductions completed",
                  "Role, responsibilities, reporting line and working arrangements explained",
                  "Health and safety induction completed, including emergency procedures",
                  "Key policies, expected standards and reporting routes explained",
                  "Equipment, access credentials and security requirements provided",
                  "Breaks, facilities, working hours and absence reporting explained",
                  "Data protection and confidentiality requirements explained",
                ],
              },
              {
                title: "First week",
                items: [
                  "Initial duties and priorities agreed",
                  "Probation arrangements, review dates and expected standards explained",
                  "Mandatory and role-specific training booked",
                  "Support contact, buddy or mentor confirmed where used",
                  "Manager check-in completed and questions addressed",
                  "Any early support needs or adjustments recorded appropriately",
                ],
              },
              {
                title: "First month",
                items: [
                  "Early probation or onboarding review completed",
                  "Progress against objectives discussed",
                  "Mandatory training completed or progress reviewed",
                  "Employee feedback on onboarding obtained",
                  "Further training, supervision or support agreed where needed",
                ],
              },
              {
                title: "Probation follow-up",
                items: [
                  "Scheduled probation reviews completed and documented",
                  "Concerns raised promptly with clear support and improvement expectations",
                  "Final probation review completed before the probation end date",
                  "Outcome confirmed in writing",
                  "Employee record and relevant systems updated",
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
                      <span className="check-box" aria-hidden="true">☐</span>
                      <span>{item}</span>
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section>
              <h2>Additional notes</h2>
              <div className="notes-box" />
            </section>

            <div className="notice">
              This checklist provides general HR guidance for England and Wales.
              It should be adapted to the role, sector, contractual arrangements
              and the organisation&apos;s own onboarding and safeguarding
              requirements.
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Onboarding
                <br />
                Resource ID: {resourceId}
                <br />
                Last reviewed: 12 September 2026
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