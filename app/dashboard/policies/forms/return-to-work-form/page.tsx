"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const resourceTitle = "Return to Work Form";
const resourceId = "return-to-work-form";
const resourceSummary =
  "Record a return-to-work discussion following sickness absence, including the reason for absence, current fitness for work and any support or follow-up required.";

const askLeoPrompt = [
  `I am reviewing the LEO form "${resourceTitle}".`,
  resourceSummary,
  "Please use this form as the context for my question.",
].join("\n\n");

const askLeoHref =
  `/dashboard/ask-leo?prompt=${encodeURIComponent(askLeoPrompt)}` +
  `&resourceTitle=${encodeURIComponent(resourceTitle)}` +
  `&resourceType=${encodeURIComponent("Form")}` +
  `&returnUrl=${encodeURIComponent(
    `/dashboard/policies/forms/${resourceId}`
  )}`;

export default function ReturnToWorkFormPage() {
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

            .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .form-grid.compact {
          margin-top: 18px;
        }

        .field-card,
        .form-section-card {
          border: 1px solid #e1e5ea;
          border-radius: 14px;
          background: #ffffff;
        }

        .field-card {
          min-height: 72px;
          padding: 13px 14px;
        }

        .field-card strong,
        .large-field strong,
        .choice-field strong {
          display: block;
          color: #6e5084;
          font-size: 13px;
          font-weight: 600;
        }

        .field-card span {
          display: block;
          margin-top: 24px;
          border-bottom: 1px solid #cbd5e1;
        }

        .form-section-card {
          margin-top: 14px;
          padding: 18px;
        }

        .large-field + .large-field,
        .choice-field + .large-field,
        .large-field + .choice-field,
        .choice-field + .choice-field {
          margin-top: 20px;
        }

        .large-field span {
          display: block;
          min-height: 86px;
          margin-top: 10px;
          border: 1px solid #dfe3e8;
          border-radius: 10px;
          background:
            repeating-linear-gradient(
              to bottom,
              #ffffff 0,
              #ffffff 27px,
              #e8ecf0 28px
            );
        }

        .choice-field p {
          margin: 10px 0 0;
          color: #526174;
          line-height: 1.7;
        }

        @media (max-width: 720px) {
          .form-grid {
            grid-template-columns: 1fr;
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
    anchor.download = "LEO-Return-to-Work-Form.doc";
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
          href="/dashboard/policies/forms"
        >
          ← Back to Forms
        </Link>

        <header className="page-header">
          <div>
            <p className="eyebrow">Form</p>
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
          <article className="document form-document" id="resource-content">
            <section>
              <h2>How to use this form</h2>
              <p>
                Complete this form as soon as reasonably practicable after the
                employee returns from sickness absence. The discussion should
                be private, supportive and focused on current fitness for work,
                appropriate support and any necessary follow-up.
              </p>
            </section>

            <section>
              <h2>Employee and absence details</h2>
              <div className="form-grid">
                {[
                  "Employee name",
                  "Job title",
                  "Manager",
                  "Department",
                  "First day of absence",
                  "Last day of absence",
                  "Date returned to work",
                  "Total working days absent",
                ].map((label) => (
                  <div className="field-card" key={label}>
                    <strong>{label}</strong>
                    <span />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2>Reason for absence</h2>
              <div className="form-section-card">
                <div className="large-field">
                  <strong>Employee&apos;s explanation</strong>
                  <span />
                </div>
                <div className="choice-field">
                  <strong>Was the absence work-related?</strong>
                  <p>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Unsure</p>
                </div>
                <div className="choice-field">
                  <strong>Was an accident involved?</strong>
                  <p>☐ Yes &nbsp;&nbsp; ☐ No</p>
                </div>
                <div className="choice-field">
                  <strong>If yes, was it recorded?</strong>
                  <p>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Not applicable</p>
                </div>
              </div>
            </section>

            <section>
              <h2>Medical information and current fitness</h2>
              <div className="form-section-card">
                <div className="choice-field">
                  <strong>Fit note provided?</strong>
                  <p>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Not required</p>
                </div>
                <div className="large-field">
                  <strong>Medical advice or restrictions relevant to work</strong>
                  <span />
                </div>
                <div className="choice-field">
                  <strong>Employee considers themselves fit for work</strong>
                  <p>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ With support or adjustments</p>
                </div>
                <div className="large-field">
                  <strong>Medication or treatment considerations affecting work</strong>
                  <span />
                </div>
              </div>
            </section>

            <section>
              <h2>Support and adjustments</h2>
              <div className="form-section-card">
                {[
                  "Support requested by the employee",
                  "Temporary adjustments agreed",
                  "Reasonable adjustment considerations",
                ].map((label) => (
                  <div className="large-field" key={label}>
                    <strong>{label}</strong>
                    <span />
                  </div>
                ))}
                <div className="choice-field">
                  <strong>Occupational health or further medical advice required?</strong>
                  <p>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ To be reviewed</p>
                </div>
              </div>
            </section>

            <section>
              <h2>Attendance review</h2>
              <div className="form-section-card">
                <div className="choice-field">
                  <strong>Previous sickness absence discussed?</strong>
                  <p>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Not applicable</p>
                </div>
                <div className="large-field">
                  <strong>Any pattern or concern identified?</strong>
                  <span />
                </div>
                <div className="choice-field">
                  <strong>Relevant attendance procedure explained?</strong>
                  <p>☐ Yes &nbsp;&nbsp; ☐ No &nbsp;&nbsp; ☐ Not required</p>
                </div>
              </div>
            </section>

            <section>
              <h2>Agreed action and follow-up</h2>
              <div className="form-section-card">
                <div className="large-field">
                  <strong>Actions agreed</strong>
                  <span />
                </div>
                <div className="form-grid compact">
                  {["Person responsible", "Review date"].map((label) => (
                    <div className="field-card" key={label}>
                      <strong>{label}</strong>
                      <span />
                    </div>
                  ))}
                </div>
                <div className="large-field">
                  <strong>Further notes</strong>
                  <span />
                </div>
              </div>
            </section>

            <section>
              <h2>Employee comments and confirmation</h2>
              <div className="form-section-card">
                <div className="large-field">
                  <strong>Employee comments</strong>
                  <span />
                </div>
                <div className="form-grid">
                  {[
                    "Employee name",
                    "Employee signature",
                    "Employee date",
                    "Manager name",
                    "Manager signature",
                    "Manager date",
                  ].map((label) => (
                    <div className="field-card" key={label}>
                      <strong>{label}</strong>
                      <span />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="notice">
              This form should be stored securely with access restricted to
              those who genuinely need it. Record only information relevant to
              the employment relationship and any support, adjustment or
              follow-up required.
            </div>
          </article>

          <aside className="side-panel">
            <section className="side-card">
              <h2>About this resource</h2>
              <p>
                Topic: Sickness & absence
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