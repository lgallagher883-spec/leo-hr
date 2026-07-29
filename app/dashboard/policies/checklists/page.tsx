"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ChecklistResource = {
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
  "Onboarding",
  "Probation",
  "Performance",
  "Sickness & absence",
  "Disciplinary",
  "Grievance",
  "Family leave",
  "Flexible working",
  "Redundancy",
  "Compliance",
  "Offboarding",
];

// Published LEO checklist resources will be supplied here by the library API.
const publishedChecklists: ChecklistResource[] = [
  {
    id: "new-starter-checklist",
    title: "New Starter Checklist",
    summary:
      "A practical checklist covering the essential steps before, on and after a new employee's first day, helping ensure a consistent and compliant onboarding process.",
    topic: "Onboarding",
    lastUpdated: "July 2026",
    tags: ["new starter", "onboarding", "induction", "employment checks"],
  },
];

export default function ChecklistsPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  function getChecklistDocument(checklist: ChecklistResource) {
    if (checklist.id !== "new-starter-checklist") {
      return "";
    }

    const rows = {
      "Before the employee starts": [
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
      "First day": [
        "Welcome meeting completed",
        "Workplace tour and introductions completed",
        "Role, responsibilities, reporting line and working arrangements explained",
        "Health and safety induction completed, including emergency procedures",
        "Key policies, expected standards and reporting routes explained",
        "Equipment, access credentials and security requirements provided",
        "Breaks, facilities, working hours and absence reporting explained",
        "Data protection and confidentiality requirements explained",
      ],
      "First week": [
        "Initial duties and priorities agreed",
        "Probation arrangements, review dates and expected standards explained",
        "Mandatory and role-specific training booked",
        "Support contact, buddy or mentor confirmed where used",
        "Manager check-in completed and questions addressed",
        "Any early support needs or adjustments recorded appropriately",
      ],
      "First month": [
        "Early probation or onboarding review completed",
        "Progress against objectives discussed",
        "Mandatory training completed or progress reviewed",
        "Employee feedback on onboarding obtained",
        "Further training, supervision or support agreed where needed",
      ],
      "Probation follow-up": [
        "Scheduled probation reviews completed and documented",
        "Concerns raised promptly with clear support and improvement expectations",
        "Final probation review completed before the probation end date",
        "Outcome confirmed in writing",
        "Employee record and relevant systems updated",
      ],
    };

    const sections = Object.entries(rows)
      .map(
        ([title, items]) => `
          <h2>${title}</h2>
          <table>
            <tr>
              <th class="tick">Done</th>
              <th>Action</th>
              <th class="owner">Owner</th>
              <th class="date">Date</th>
            </tr>
            ${items
              .map(
                (item) => `
                  <tr>
                    <td class="tick">☐</td>
                    <td>${item}</td>
                    <td></td>
                    <td></td>
                  </tr>
                `
              )
              .join("")}
          </table>
        `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${checklist.title}</title>
          <style>
            @page { size: A4; margin: 16mm; }
            body {
              max-width: 820px;
              margin: 0 auto;
              font-family: Arial, Helvetica, sans-serif;
              color: #334155;
              line-height: 1.55;
            }
            h1, h2 { color: #6e5084; }
            h1 { font-size: 29px; margin-bottom: 8px; }
            h2 {
              margin-top: 28px;
              margin-bottom: 12px;
              padding-bottom: 6px;
              border-bottom: 1px solid #e8dfeb;
              font-size: 19px;
            }
            p, td, th { font-size: 10.5pt; }
            .intro { margin-bottom: 22px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
            th, td {
              padding: 9px 8px;
              border: 1px solid #dfe3e8;
              vertical-align: top;
            }
            th { background: #f7f1fc; color: #6e5084; text-align: left; }
            .tick { width: 34px; text-align: center; font-size: 15px; }
            .owner { width: 120px; }
            .date { width: 100px; }
            .notes { height: 34px; }
            .notice {
              margin-top: 26px;
              padding: 14px;
              border: 1px solid #dcece4;
              background: #f5fff9;
            }
          </style>
        </head>
        <body>
          <h1>${checklist.title}</h1>
          <p class="intro">
            Use this checklist to support a consistent, organised and compliant
            onboarding process. Adapt each item to the employee's role and the
            organisation's requirements.
          </p>

          <h2>Starter details</h2>
          <table>
            <tr><th>Employee name</th><td></td><th>Job title</th><td></td></tr>
            <tr><th>Manager</th><td></td><th>Start date</th><td></td></tr>
            <tr><th>Department</th><td></td><th>Work location</th><td></td></tr>
          </table>

          ${sections}

          <h2>Additional notes</h2>
          <table>
            <tr><td class="notes"></td></tr>
            <tr><td class="notes"></td></tr>
            <tr><td class="notes"></td></tr>
          </table>

          <div class="notice">
            This checklist provides general HR guidance for England and Wales.
            It should be adapted to the role, sector, contractual arrangements
            and the organisation's own onboarding and safeguarding requirements.
          </div>
        </body>
      </html>
    `;
  }

  function downloadWord(checklist: ChecklistResource) {
    const documentHtml = getChecklistDocument(checklist);

    if (!documentHtml) {
      return;
    }

    const blob = new Blob(["\ufeff", documentHtml], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LEO-New-Starter-Checklist.doc";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function openPdf(checklist: ChecklistResource) {
    const documentHtml = getChecklistDocument(checklist);

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

  function getAskLeoHref(checklist: ChecklistResource) {
    const prompt = [
      `I am reviewing the LEO checklist "${checklist.title}".`,
      checklist.summary,
      "Please use this checklist as the context for my question.",
    ].join("\n\n");

    return (
      `/dashboard/ask-leo?prompt=${encodeURIComponent(prompt)}` +
      `&resourceTitle=${encodeURIComponent(checklist.title)}` +
      `&resourceType=${encodeURIComponent("Checklist")}` +
      `&returnUrl=${encodeURIComponent(
        `/dashboard/policies/checklists/${checklist.id}`
      )}`
    );
  }

  const visibleChecklists = useMemo(() => {
    const query = search.trim().toLowerCase();

    return publishedChecklists.filter((checklist) => {
      const matchesTopic =
        activeTopic === "All" || checklist.topic === activeTopic;

      const matchesSearch =
        !query ||
        `${checklist.title} ${checklist.summary} ${checklist.topic} ${checklist.tags.join(" ")}`
          .toLowerCase()
          .includes(query);

      return matchesTopic && matchesSearch;
    });
  }, [activeTopic, search]);

  return (
    <main className="checklists-page">
      <style jsx>{`
        .checklists-page {
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
          .checklists-page {
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
          .checklists-page {
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
            <h1>Checklists</h1>
            <p className="hero-copy">
              Step-by-step checklists to help complete HR processes accurately, consistently and with confidence.
            </p>
          </div>

          <div className="hero-badge">
            <span className="hero-count">{publishedChecklists.length}</span>
            <span className="hero-count-label">published checklists</span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search checklists by title, topic or keyword..."
              aria-label="Search checklists"
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
                {activeTopic === "All" ? "All checklists" : activeTopic}
              </h2>
              <span className="result-count">
                {visibleChecklists.length} {visibleChecklists.length === 1 ? "resource" : "resources"}
              </span>
            </div>

            {visibleChecklists.length > 0 ? (
              <div className="resource-grid">
                {visibleChecklists.map((checklist) => (
                  <article className="resource-card" key={checklist.id}>
                    <div className="resource-heading">
                      <div className="resource-icon" aria-hidden="true">
                        C
                      </div>
                      <h3>{checklist.title}</h3>
                    </div>

                    <p>{checklist.summary}</p>

                    <div className="resource-meta">
                      <span className="resource-pill">{checklist.topic}</span>
                      {checklist.lastUpdated ? (
                        <span className="resource-pill">
                          Updated {checklist.lastUpdated}
                        </span>
                      ) : null}
                    </div>

                    <div className="resource-divider" />

                    <div className="resource-actions">
                      <Link
                        className="resource-action"
                        href={`/dashboard/policies/checklists/${checklist.id}`}
                      >
                        Preview
                      </Link>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => downloadWord(checklist)}
                      >
                        Word
                      </button>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => openPdf(checklist)}
                      >
                        PDF
                      </button>

                      <Link
                        className="resource-action"
                        href={getAskLeoHref(checklist)}
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
                      ? "No matching checklists found"
                      : "The professional checklist library is ready to be populated"}
                  </h2>
                  <p>
                    {search || activeTopic !== "All"
                      ? "Try a different search term or choose another topic."
                      : "Published LEO checklists will appear here as they are added to the professional resource library."}
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