"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Managing Flexible Working Requests";
const resourceId = "managing-flexible-working-requests";
const resourceSummary =
  "A concise employer guide to consulting on flexible working requests, assessing business impact and reaching fair, lawful decisions.";

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

export default function ManagingFlexibleWorkingRequestsPage() {
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
    anchor.download = "LEO-Managing-Flexible-Working-Requests.doc";
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
                Flexible working can change when, where or how an employee works.
                Employees have a day-one statutory right to request flexible
                working. Employers should consider each request reasonably,
                consult properly and reach a decision based on evidence rather
                than assumption.
              </p>
            </section>

            <section>
              <h2>Before you begin</h2>
              <ul>
                <li>Check the organisation&apos;s flexible working policy.</li>
                <li>Confirm whether the request is statutory or informal.</li>
                <li>Record the date the request was received.</li>
                <li>Check whether the employee has made previous requests.</li>
                <li>Identify the contractual change being requested.</li>
              </ul>
            </section>

            <section>
              <h2>Step 1 – Understand the request</h2>
              <p>
                Clarify the proposed working pattern, requested start date and
                whether the change is intended to be permanent or temporary.
                Consider whether a trial period or partial adjustment could meet
                the employee&apos;s needs.
              </p>
              <ul>
                <li>Working hours or days.</li>
                <li>Start and finish times.</li>
                <li>Remote or hybrid working.</li>
                <li>Compressed, annualised or term-time hours.</li>
                <li>Job sharing or reduced hours.</li>
              </ul>
            </section>

            <section>
              <h2>Step 2 – Consult the employee</h2>
              <p>
                Unless the request can be accepted in full, meet with the employee
                before deciding. Consultation should be genuine and aimed at
                understanding the request and exploring workable alternatives.
              </p>
              <ul>
                <li>Ask how the proposed arrangement could operate.</li>
                <li>Discuss any practical concerns openly.</li>
                <li>Explore alternatives rather than moving straight to refusal.</li>
                <li>Consider a temporary trial period where appropriate.</li>
                <li>Allow a companion where a reasonable request is made.</li>
              </ul>
            </section>

            <section>
              <h2>Step 3 – Assess the business impact</h2>
              <p>
                Assess the request using reliable information and the actual needs
                of the role, team and organisation.
              </p>
              <ul>
                <li>Workload, service delivery and customer demand.</li>
                <li>Ability to reorganise work or recruit additional staff.</li>
                <li>Quality, performance and supervision requirements.</li>
                <li>Costs and operational capacity.</li>
                <li>Impact on colleagues and existing arrangements.</li>
              </ul>
              <p>
                Avoid assuming that a role cannot be flexible simply because it
                has traditionally been performed in a particular way.
              </p>
            </section>

            <section>
              <h2>Step 4 – Consider equality implications</h2>
              <p>
                Flexible working requests may relate to disability, pregnancy,
                childcare, caring responsibilities, religion or another protected
                characteristic. Consider whether separate Equality Act duties,
                including reasonable adjustments, apply.
              </p>
              <p>
                A refusal that disadvantages a protected group may create indirect
                discrimination risk unless it can be objectively justified.
              </p>
            </section>

            <section>
              <h2>Step 5 – Reach a reasonable decision</h2>
              <p>
                Accept the request unless there is a genuine business reason not
                to. Where refusing, the reason must fall within one or more of the
                statutory business grounds and the employer must explain why the
                refusal is reasonable in the circumstances.
              </p>
              <ul>
                <li>Burden of additional costs.</li>
                <li>Inability to reorganise work among existing staff.</li>
                <li>Inability to recruit additional staff.</li>
                <li>Detrimental effect on quality or performance.</li>
                <li>Detrimental effect on ability to meet customer demand.</li>
                <li>Insufficient work during the proposed working periods.</li>
                <li>Planned structural changes.</li>
              </ul>
            </section>

            <section>
              <h2>Step 6 – Confirm the outcome</h2>
              <p>
                Confirm the decision in writing. If accepted, explain the agreed
                pattern, start date, whether the change is permanent or temporary,
                and any review arrangements.
              </p>
              <p>
                If refused, identify the statutory business reason, explain the
                evidence relied upon and why the decision is reasonable. Offer an
                appeal as good practice.
              </p>
            </section>

            <section>
              <h2>Step 7 – Implement and review</h2>
              <ul>
                <li>Update the contract or written terms where required.</li>
                <li>Confirm practical arrangements with the employee and manager.</li>
                <li>Set review dates for temporary or trial arrangements.</li>
                <li>Monitor outcomes using agreed measures.</li>
                <li>Address problems through discussion rather than assumption.</li>
              </ul>
            </section>

            <section>
              <h2>Time limits and records</h2>
              <p>
                The complete process, including any appeal, should normally be
                concluded within two months unless an extension is agreed. Keep
                the request, meeting notes, evidence, decision and any contractual
                variation securely.
              </p>
            </section>

            <section>
              <h2>Common mistakes to avoid</h2>
              <ul>
                <li>Refusing without consulting the employee.</li>
                <li>Using a generic business reason without supporting evidence.</li>
                <li>Failing to explore alternatives or trial periods.</li>
                <li>Ignoring discrimination or reasonable-adjustment duties.</li>
                <li>Missing the statutory decision deadline.</li>
                <li>Failing to confirm contractual changes clearly.</li>
              </ul>
            </section>

            <div className="tip">
              <strong>LEO Professional Recommendation</strong>
              <p>
                Test the proposed arrangement against real operational evidence.
                A reasoned trial period can often resolve uncertainty more fairly
                than an immediate refusal.
              </p>
            </div>

            <div className="notice">
              <strong>Legal position — January 2027</strong>
              <p>
                Employees have a day-one right to request flexible working.
                Employers must handle requests reasonably, consult unless accepting
                the request in full, and normally complete the process within two
                months. From January 2027, a refusal must rely on a genuine
                statutory business reason and the employer must explain why the
                refusal is reasonable.
              </p>
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Flexible working
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
                  href="/dashboard/policies/factsheets/flexible-working"
                >
                  Flexible Working Factsheet
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/checklists/flexible-working-assessment-checklist"
                >
                  Flexible Working Assessment Checklist
                </Link>

                <Link
                  className="related-link"
                  href="/dashboard/policies/letters/flexible-working-outcome"
                >
                  Flexible Working Request Outcome Letter
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