"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ToolkitResource = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  lastUpdated?: string;
  tags: string[];
};

const topics = [
  "All",
  "Recruitment",
  "Probation",
  "Performance",
  "Sickness & absence",
  "Disciplinary",
  "Grievance",
  "Capability",
  "Family leave",
  "Flexible working",
  "Redundancy",
  "TUPE",
  "Investigations",
  "Ending employment",
];

// Published LEO toolkit resources will be supplied here by the library API.
const publishedToolkits: ToolkitResource[] = [
  {
    id: "disciplinary-toolkit",
    title: "Disciplinary Toolkit",
    summary:
      "A complete resource pack for managing a disciplinary process, bringing together practical guidance, letters, forms and checklists from investigation through to outcome.",
    topic: "Disciplinary",
    lastUpdated: "July 2026",
    tags: ["disciplinary", "investigation", "hearing", "outcome", "manager toolkit"],
  },
];

export default function ToolkitsPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  function getToolkitDocument(toolkit: ToolkitResource) {
    if (toolkit.id !== "disciplinary-toolkit") {
      return "";
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${toolkit.title}</title>
          <style>
            @page { size: A4; margin: 16mm; }
            body {
              max-width: 820px;
              margin: 0 auto;
              font-family: Arial, Helvetica, sans-serif;
              color: #334155;
              line-height: 1.6;
            }
            h1, h2, h3 { color: #6e5084; }
            h1 { font-size: 30px; margin-bottom: 8px; }
            h2 {
              margin-top: 30px;
              margin-bottom: 12px;
              padding-bottom: 7px;
              border-bottom: 1px solid #e8dfeb;
              font-size: 20px;
            }
            h3 { margin-top: 22px; font-size: 16px; }
            p, li, td, th { font-size: 10.5pt; }
            ul, ol { padding-left: 22px; }
            li + li { margin-top: 5px; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0 20px;
            }
            th, td {
              padding: 9px 8px;
              border: 1px solid #dfe3e8;
              vertical-align: top;
            }
            th {
              background: #f7f1fc;
              color: #6e5084;
              text-align: left;
            }
            .cover {
              padding: 26px;
              border: 1px solid #eadff0;
              background: #fbf8fd;
            }
            .intro { color: #64748b; }
            .template {
              margin: 16px 0 22px;
              padding: 16px;
              border: 1px solid #e1e5ea;
              background: #ffffff;
            }
            .field {
              display: block;
              min-height: 22px;
              margin: 8px 0 12px;
              border-bottom: 1px solid #b9c2cc;
            }
            .page-break { page-break-before: always; }
            .notice {
              margin-top: 28px;
              padding: 14px;
              border: 1px solid #dcece4;
              background: #f5fff9;
            }
          </style>
        </head>
        <body>
          <div class="cover">
            <h1>Disciplinary Toolkit</h1>
            <p class="intro">
              A complete practical resource pack for managing a disciplinary
              process fairly, consistently and proportionately.
            </p>
            <p><strong>Jurisdiction:</strong> England and Wales</p>
            <p><strong>Last reviewed:</strong> July 2026</p>
          </div>

          <h2>How to use this toolkit</h2>
          <p>
            Use the sections in order where a formal disciplinary process is
            required. Adapt all letters and records to the facts of the case,
            the employee's contract and the organisation's disciplinary policy.
          </p>
          <ol>
            <li>Assess whether informal action may resolve the issue.</li>
            <li>Plan and complete a fair investigation.</li>
            <li>Decide whether there is a disciplinary case to answer.</li>
            <li>Invite the employee to a disciplinary hearing.</li>
            <li>Conduct the hearing and consider all evidence and mitigation.</li>
            <li>Reach and record a proportionate decision.</li>
            <li>Confirm the outcome and provide a right of appeal.</li>
          </ol>

          <h2>Toolkit contents</h2>
          <ul>
            <li>Disciplinary process guide</li>
            <li>Investigation planning checklist</li>
            <li>Investigation meeting record</li>
            <li>Invitation to disciplinary hearing template</li>
            <li>Disciplinary hearing checklist</li>
            <li>Hearing notes form</li>
            <li>Outcome decision record</li>
            <li>Written warning outcome template</li>
            <li>Dismissal outcome template</li>
            <li>Appeal invitation and appeal outcome templates</li>
            <li>Record-keeping guidance</li>
          </ul>

          <div class="page-break"></div>
          <h2>1. Disciplinary process guide</h2>
          <h3>Initial assessment</h3>
          <p>
            Identify the concern clearly and decide whether it is misconduct,
            capability, attendance or another issue. Avoid predetermining the
            outcome. Minor concerns may be better managed informally.
          </p>
          <h3>Investigation</h3>
          <p>
            The purpose of the investigation is to establish the facts. Gather
            relevant evidence, meet witnesses where necessary and give the
            employee an opportunity to explain their account.
          </p>
          <h3>Suspension</h3>
          <p>
            Suspension must not be automatic. Consider alternatives first. If
            suspension is necessary, keep it on full pay, confirm the reasons in
            writing, maintain appropriate contact and review it regularly.
          </p>
          <h3>Hearing and decision</h3>
          <p>
            Provide the allegations and evidence in advance, allow the employee
            to be accompanied and give them a full opportunity to respond.
            Consider consistency, mitigation, length of service, disciplinary
            record and the seriousness of the conduct before deciding the outcome.
          </p>
          <h3>Appeal</h3>
          <p>
            Offer a right of appeal and, where possible, appoint someone who has
            not previously been involved to hear it.
          </p>

          <div class="page-break"></div>
          <h2>2. Investigation planning checklist</h2>
          <table>
            <tr><th>Done</th><th>Action</th><th>Owner</th><th>Date</th></tr>
            <tr><td>☐</td><td>Define the allegation or concern clearly</td><td></td><td></td></tr>
            <tr><td>☐</td><td>Appoint an appropriate investigator</td><td></td><td></td></tr>
            <tr><td>☐</td><td>Identify relevant evidence and witnesses</td><td></td><td></td></tr>
            <tr><td>☐</td><td>Preserve documents, records and system data</td><td></td><td></td></tr>
            <tr><td>☐</td><td>Plan witness and employee meetings</td><td></td><td></td></tr>
            <tr><td>☐</td><td>Consider confidentiality and data protection</td><td></td><td></td></tr>
            <tr><td>☐</td><td>Review whether suspension is necessary</td><td></td><td></td></tr>
            <tr><td>☐</td><td>Record findings and whether there is a case to answer</td><td></td><td></td></tr>
          </table>

          <h2>3. Investigation meeting record</h2>
          <div class="template">
            <strong>Case reference</strong><span class="field"></span>
            <strong>Employee or witness</strong><span class="field"></span>
            <strong>Date, time and location</strong><span class="field"></span>
            <strong>People present</strong><span class="field"></span>
            <strong>Purpose of meeting</strong><span class="field"></span>
            <strong>Questions and responses</strong><span class="field"></span>
            <span class="field"></span><span class="field"></span><span class="field"></span>
            <strong>Documents or evidence referred to</strong><span class="field"></span>
            <strong>Further action required</strong><span class="field"></span>
          </div>

          <div class="page-break"></div>
          <h2>4. Invitation to disciplinary hearing</h2>
          <div class="template">
            <p><strong>Private and confidential</strong></p>
            <p>[Employee name]<br />[Address]<br />[Date]</p>
            <p>Dear [Employee name],</p>
            <p><strong>Invitation to disciplinary hearing</strong></p>
            <p>
              You are invited to attend a disciplinary hearing on [date] at
              [time] at [location / meeting arrangements].
            </p>
            <p>
              The allegations to be considered are:
            </p>
            <p>[Set out each allegation clearly and separately.]</p>
            <p>
              The evidence enclosed with this letter will be considered at the
              hearing. You will have the opportunity to respond fully, provide
              relevant information and explain any mitigating circumstances.
            </p>
            <p>
              The possible outcomes include [state the possible outcomes,
              including dismissal where this is genuinely a possibility].
            </p>
            <p>
              You have the right to be accompanied by a workplace colleague or
              trade union representative.
            </p>
            <p>Yours sincerely,</p>
            <p>[Name]<br />[Job title]</p>
          </div>

          <h2>5. Disciplinary hearing checklist</h2>
          <table>
            <tr><th>Done</th><th>Action</th></tr>
            <tr><td>☐</td><td>Invitation gave reasonable notice</td></tr>
            <tr><td>☐</td><td>Allegations were set out clearly</td></tr>
            <tr><td>☐</td><td>Evidence was supplied in advance</td></tr>
            <tr><td>☐</td><td>Right to be accompanied was confirmed</td></tr>
            <tr><td>☐</td><td>Possible outcomes were explained</td></tr>
            <tr><td>☐</td><td>Employee was allowed to respond fully</td></tr>
            <tr><td>☐</td><td>Mitigation and relevant context were considered</td></tr>
            <tr><td>☐</td><td>Further investigation was completed where required</td></tr>
            <tr><td>☐</td><td>Decision was adjourned and considered objectively</td></tr>
          </table>

          <h2>6. Hearing notes form</h2>
          <div class="template">
            <strong>Employee</strong><span class="field"></span>
            <strong>Chair</strong><span class="field"></span>
            <strong>Companion</strong><span class="field"></span>
            <strong>Note taker</strong><span class="field"></span>
            <strong>Date and time</strong><span class="field"></span>
            <strong>Allegations discussed</strong><span class="field"></span>
            <strong>Employee response</strong><span class="field"></span>
            <span class="field"></span><span class="field"></span>
            <strong>Mitigating circumstances</strong><span class="field"></span>
            <strong>Further evidence or enquiries required</strong><span class="field"></span>
          </div>

          <div class="page-break"></div>
          <h2>7. Outcome decision record</h2>
          <div class="template">
            <strong>Allegation</strong><span class="field"></span>
            <strong>Evidence considered</strong><span class="field"></span>
            <strong>Employee explanation</strong><span class="field"></span>
            <strong>Finding</strong><span class="field"></span>
            <strong>Mitigation considered</strong><span class="field"></span>
            <strong>Consistency check</strong><span class="field"></span>
            <strong>Outcome and rationale</strong><span class="field"></span>
            <strong>Decision maker</strong><span class="field"></span>
            <strong>Date</strong><span class="field"></span>
          </div>

          <h2>8. Written warning outcome template</h2>
          <div class="template">
            <p><strong>Private and confidential</strong></p>
            <p>Dear [Employee name],</p>
            <p><strong>Outcome of disciplinary hearing</strong></p>
            <p>
              Following the disciplinary hearing held on [date], I have decided
              that the allegation of [allegation] is [upheld / partially upheld].
            </p>
            <p>
              This decision is based on [summarise the evidence and findings].
            </p>
            <p>
              You will receive a [first / final] written warning. The warning
              will remain active for [period]. During this period you are
              required to [state the expected conduct or improvement].
            </p>
            <p>
              Further misconduct or failure to meet the required standard may
              result in further disciplinary action, up to and including dismissal.
            </p>
            <p>
              You may appeal in writing to [name / role] within [number] days,
              explaining the grounds of your appeal.
            </p>
          </div>

          <h2>9. Dismissal outcome template</h2>
          <div class="template">
            <p><strong>Private and confidential</strong></p>
            <p>Dear [Employee name],</p>
            <p><strong>Outcome of disciplinary hearing</strong></p>
            <p>
              Following the disciplinary hearing held on [date], I have decided
              that the allegation of [allegation] is upheld.
            </p>
            <p>
              The evidence and reasons for this decision are [summary].
            </p>
            <p>
              The outcome is dismissal [with notice / without notice for gross
              misconduct]. Your employment will end on [date].
            </p>
            <p>
              You may appeal in writing to [name / role] within [number] days,
              setting out your grounds of appeal.
            </p>
          </div>

          <div class="page-break"></div>
          <h2>10. Appeal invitation template</h2>
          <div class="template">
            <p>Dear [Employee name],</p>
            <p><strong>Invitation to disciplinary appeal hearing</strong></p>
            <p>
              Your appeal will be heard on [date] at [time] at [location /
              meeting arrangements].
            </p>
            <p>
              The appeal will consider the grounds set out in your letter dated
              [date]. You may provide any further relevant information in advance.
            </p>
            <p>
              You have the right to be accompanied by a workplace colleague or
              trade union representative.
            </p>
          </div>

          <h2>11. Appeal outcome template</h2>
          <div class="template">
            <p>Dear [Employee name],</p>
            <p><strong>Outcome of disciplinary appeal</strong></p>
            <p>
              Following the appeal hearing held on [date], your appeal is
              [upheld / partially upheld / not upheld].
            </p>
            <p>
              The reasons for this decision are [summary].
            </p>
            <p>
              The original outcome is therefore [confirmed / replaced with the
              following outcome]. This decision is final under the organisation's
              internal procedure.
            </p>
          </div>

          <h2>12. Record-keeping guidance</h2>
          <ul>
            <li>Keep evidence, notes, letters and decisions securely.</li>
            <li>Restrict access to those who genuinely need it.</li>
            <li>Maintain a clear chronology of the process.</li>
            <li>Record warnings accurately and apply expiry periods consistently.</li>
            <li>Do not retain information longer than necessary.</li>
            <li>Preserve the original record where corrections are required.</li>
          </ul>

          <div class="notice">
            This toolkit provides general HR guidance for England and Wales.
            It must be adapted to the organisation's policy and the facts of the
            case. Seek specialist advice where dismissal, discrimination,
            whistleblowing, health, trade union activity, safeguarding or another
            complex issue may arise.
          </div>
        </body>
      </html>
    `;
  }

  function downloadWord(toolkit: ToolkitResource) {
    const documentHtml = getToolkitDocument(toolkit);

    if (!documentHtml) {
      return;
    }

    const blob = new Blob(["\ufeff", documentHtml], {
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

  function openPdf(toolkit: ToolkitResource) {
    const documentHtml = getToolkitDocument(toolkit);

    if (!documentHtml) {
      return;
    }

    const pdfWindow = window.open("", "_blank");

    if (!pdfWindow) {
      return;
    }

    pdfWindow.document.open();
    pdfWindow.document.write(documentHtml);
    pdfWindow.document.close();
  }

  function getAskLeoHref(toolkit: ToolkitResource) {
    const prompt = [
      `I am reviewing the LEO toolkit "${toolkit.title}".`,
      toolkit.summary,
      "Please use this toolkit as the context for my question.",
    ].join("\n\n");

    return (
      `/dashboard/ask-leo?prompt=${encodeURIComponent(prompt)}` +
      `&resourceTitle=${encodeURIComponent(toolkit.title)}` +
      `&resourceType=${encodeURIComponent("Toolkit")}` +
      `&returnUrl=${encodeURIComponent(
        `/dashboard/policies/toolkits/${toolkit.id}`
      )}`
    );
  }

  const visibleToolkits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return publishedToolkits.filter((toolkit) => {
      const matchesTopic =
        activeTopic === "All" || toolkit.topic === activeTopic;

      const matchesSearch =
        !query ||
        `${toolkit.title} ${toolkit.summary} ${toolkit.topic} ${toolkit.tags.join(" ")}`
          .toLowerCase()
          .includes(query);

      return matchesTopic && matchesSearch;
    });
  }, [activeTopic, search]);

  return (
    <main className="toolkits-page">
      <style jsx>{`
        .toolkits-page {
          min-height: 100%;
          padding: 32px;
          background: linear-gradient(180deg, #fbf8fd 0%, #ffffff 42%);
          color: #334155;
        }

        .page-shell {
          max-width: 1220px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          color: #6e5084;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 28px;
          align-items: end;
          padding: 34px;
          border: 1px solid #eadff0;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
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
          font-size: clamp(34px, 5vw, 52px);
          font-weight: 500;
          letter-spacing: -0.035em;
        }

        .hero-copy {
          max-width: 760px;
          margin: 14px 0 0;
          color: #64748b;
          font-size: 17px;
          line-height: 1.7;
        }

        .hero-badge {
          min-width: 150px;
          padding: 18px 20px;
          border-radius: 18px;
          background: #f7f1fc;
          text-align: center;
        }

        .hero-count {
          display: block;
          color: #6e5084;
          font-size: 32px;
          font-weight: 600;
        }

        .hero-count-label {
          color: #80678f;
          font-size: 13px;
        }

        .toolbar {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) auto;
          gap: 16px;
          margin-top: 26px;
        }

        .search-wrap {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 17px;
          top: 50%;
          transform: translateY(-50%);
          color: #90759f;
          font-size: 17px;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          height: 52px;
          box-sizing: border-box;
          padding: 0 18px 0 46px;
          border: 1px solid #dfd4e5;
          border-radius: 14px;
          background: #ffffff;
          color: #334155;
          font: inherit;
          outline: none;
        }

        .search-input:focus {
          border-color: #b995ce;
          box-shadow: 0 0 0 4px rgba(185, 149, 206, 0.15);
        }

        :global(.ask-link) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 52px;
          padding: 0 22px;
          border: 1px solid #6e5084;
          border-radius: 14px;
          background: #6e5084;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 8px 20px rgba(110, 80, 132, 0.16);
          transition:
            transform 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease;
        }

        :global(.ask-link:hover) {
          transform: translateY(-1px);
          background: #5f4573;
          box-shadow: 0 10px 24px rgba(110, 80, 132, 0.2);
        }

        .content-grid {
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
          gap: 26px;
          margin-top: 26px;
        }

        .filters,
        .library-panel {
          border: 1px solid #eadff0;
          border-radius: 20px;
          background: white;
        }

        .filters {
          align-self: start;
          padding: 20px;
          position: sticky;
          top: 24px;
        }

        .filters-title,
        .library-title {
          margin: 0;
          color: #6e5084;
          font-weight: 500;
        }

        .filters-title {
          font-size: 18px;
        }

        .topic-list {
          display: grid;
          gap: 5px;
          margin-top: 15px;
        }

        .topic-button {
          width: 100%;
          padding: 10px 12px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #526174;
          font: inherit;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
        }

        .topic-button:hover {
          background: #faf6fc;
          color: #6e5084;
        }

        .topic-button.active {
          background: #f2e9f8;
          color: #6e5084;
          font-weight: 600;
        }

        .library-panel {
          min-height: 470px;
          padding: 26px;
        }

        .library-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee7f1;
        }

        .library-title {
          font-size: 24px;
        }

        .result-count {
          color: #8b7896;
          font-size: 13px;
        }

        .resource-grid {
          display: grid;
          gap: 14px;
          margin-top: 20px;
        }

        .resource-card {
          padding: 22px;
          border: 1px solid #e8dfeb;
          border-radius: 16px;
          background: #ffffff;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            border-color 160ms ease;
        }

        .resource-card:hover {
          transform: translateY(-2px);
          border-color: #d8c8e1;
          box-shadow: 0 12px 30px rgba(91, 66, 106, 0.08);
        }

        .resource-heading {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .resource-icon {
          display: grid;
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 11px;
          background: #f4edf8;
          color: #6e5084;
          font-size: 17px;
          font-weight: 700;
        }

        .resource-card h3 {
          margin: 1px 0 0;
          color: #6e5084;
          font-size: 18px;
          font-weight: 600;
        }

        .resource-card p {
          margin: 10px 0 0 50px;
          color: #64748b;
          line-height: 1.65;
        }

        .resource-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0 0 50px;
        }

        .resource-pill {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          background: #f7f1fc;
          color: #6e5084;
          font-size: 12px;
          font-weight: 600;
        }

        .resource-divider {
          height: 1px;
          margin: 18px 0;
          background: #eee7f1;
        }

        .resource-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        :global(.resource-action) {
          display: inline-flex;
          min-height: 42px;
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
          transition:
            transform 150ms ease,
            background 150ms ease,
            border-color 150ms ease;
        }

        :global(.resource-action:hover) {
          transform: translateY(-1px);
          border-color: #cdb2e2;
          background: #faf6fc;
        }

        .empty-state {
          display: flex;
          min-height: 360px;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .empty-inner {
          max-width: 540px;
        }

        .empty-icon {
          display: grid;
          width: 62px;
          height: 62px;
          margin: 0 auto 18px;
          place-items: center;
          border-radius: 18px;
          background: #f4edf8;
          color: #6e5084;
          font-size: 28px;
        }

        .empty-state h2 {
          margin: 0;
          color: #6e5084;
          font-size: 24px;
          font-weight: 500;
        }

        .empty-state p {
          margin: 12px 0 0;
          color: #718096;
          line-height: 1.7;
        }

        .current-note {
          display: flex;
          gap: 14px;
          margin-top: 26px;
          padding: 20px 22px;
          border: 1px solid #dcece4;
          border-radius: 16px;
          background: #f5fff9;
        }

        .current-note strong {
          display: block;
          margin-bottom: 4px;
          color: #536f62;
          font-weight: 600;
        }

        .current-note p {
          margin: 0;
          color: #658073;
          font-size: 14px;
          line-height: 1.6;
        }

        @media (max-width: 850px) {
          .toolkits-page {
            padding: 20px;
          }

          .hero,
          .toolbar,
          .content-grid {
            grid-template-columns: 1fr;
          }

          .hero-badge {
            text-align: left;
          }

          .filters {
            position: static;
          }

          .topic-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 540px) {
          .toolkits-page {
            padding: 14px;
          }

          .hero,
          .library-panel {
            padding: 22px;
          }

          .topic-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-shell">
        <Link className="back-link" href="/dashboard/policies">
          ← Back to HR Resources
        </Link>

        <section className="hero">
          <div>
            <p className="eyebrow">HR Resources</p>
            <h1>Toolkits</h1>
            <p className="hero-copy">
              Complete resource packs bringing together letters, forms, guidance and checklists for more complex workplace situations.
            </p>
          </div>

          <div className="hero-badge">
            <span className="hero-count">{publishedToolkits.length}</span>
            <span className="hero-count-label">published toolkits</span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search toolkits by title, topic or keyword..."
              aria-label="Search toolkits"
            />
          </div>

          <Link className="ask-link" href="/dashboard/ask-leo">
            <span aria-hidden="true">✦</span>
            Ask Leo
          </Link>
        </div>

        <div className="content-grid">
          <aside className="filters">
            <h2 className="filters-title">Browse by topic</h2>
            <div className="topic-list">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={`topic-button ${activeTopic === topic ? "active" : ""}`}
                  onClick={() => setActiveTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </aside>

          <section className="library-panel">
            <div className="library-header">
              <h2 className="library-title">
                {activeTopic === "All" ? "All toolkits" : activeTopic}
              </h2>
              <span className="result-count">
                {visibleToolkits.length} {visibleToolkits.length === 1 ? "resource" : "resources"}
              </span>
            </div>

            {visibleToolkits.length > 0 ? (
              <div className="resource-grid">
                {visibleToolkits.map((toolkit) => (
                  <article className="resource-card" key={toolkit.id}>
                    <div className="resource-heading">
                      <div className="resource-icon" aria-hidden="true">
                        T
                      </div>
                      <h3>{toolkit.title}</h3>
                    </div>

                    <p>{toolkit.summary}</p>

                    <div className="resource-meta">
                      <span className="resource-pill">{toolkit.topic}</span>
                      {toolkit.lastUpdated ? (
                        <span className="resource-pill">
                          Updated {toolkit.lastUpdated}
                        </span>
                      ) : null}
                    </div>

                    <div className="resource-divider" />

                    <div className="resource-actions">
                      <Link
                        className="resource-action"
                        href={`/dashboard/policies/toolkits/${toolkit.id}`}
                      >
                        Preview
                      </Link>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => downloadWord(toolkit)}
                      >
                        Word
                      </button>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => openPdf(toolkit)}
                      >
                        PDF
                      </button>

                      <Link
                        className="resource-action"
                        href={getAskLeoHref(toolkit)}
                      >
                        Ask Leo
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-inner">
                  <div className="empty-icon">L</div>
                  <h2>
                    {search || activeTopic !== "All"
                      ? "No matching toolkits found"
                      : "The professional toolkit library is ready to be populated"}
                  </h2>
                  <p>
                    {search || activeTopic !== "All"
                      ? "Try a different search term or choose another topic."
                      : "Published LEO toolkits will appear here as they are added to the professional resource library."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="current-note">
          <span>↻</span>
          <div>
            <strong>Professionally maintained</strong>
            <p>
              LEO Resources are professionally reviewed and updated to reflect changes in employment legislation, official guidance and recognised HR best practice, helping ensure your organisation always has access to the latest documentation.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}