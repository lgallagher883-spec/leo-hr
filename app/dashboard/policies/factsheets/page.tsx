"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { factsheetsCatalogue } from "./factsheetsCatalogue";

type FactsheetResource = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  lastUpdated?: string;
  tags: string[];
};

const topics = [
  "All",
  "Employment rights",
  "Recruitment",
  "Contracts & changes",
  "Probation",
  "Pay & working time",
  "Sickness & absence",
  "Disciplinary",
  "Grievance",
  "Family leave",
  "Flexible working",
  "Redundancy",
  "Ending employment",
];

const publishedFactsheets: FactsheetResource[] = factsheetsCatalogue;

export default function FactsheetsPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  function getFactsheetDocument(factsheet: FactsheetResource) {
    if (factsheet.id !== "employment-rights-day-one") {
      return "";
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${factsheet.title}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              max-width: 820px;
              margin: 0 auto;
              font-family: Arial, Helvetica, sans-serif;
              color: #334155;
              line-height: 1.65;
            }
            h1, h2 { color: #6e5084; }
            h1 { font-size: 30px; margin-bottom: 24px; }
            h2 { margin-top: 28px; font-size: 20px; }
            p, li { font-size: 11pt; }
            li + li { margin-top: 6px; }
            .notice {
              margin-top: 28px;
              padding: 14px;
              border: 1px solid #dcece4;
              background: #f5fff9;
            }
          </style>
        </head>
        <body>
          <h1>Day One Employment Rights</h1>

          <h2>What are day one employment rights?</h2>
          <p>
            Day one employment rights are legal protections and entitlements
            that apply as soon as an employee starts work. They apply during
            probation as well as after probation has been completed.
          </p>

          <h2>Key rights from the start of employment</h2>
          <ul>
            <li>Protection from unlawful discrimination and harassment.</li>
            <li>Entitlement to the National Minimum Wage or National Living Wage, where applicable.</li>
            <li>Paid annual leave and rest-break rights under working-time legislation.</li>
            <li>Protection from detriment for whistleblowing.</li>
            <li>The right to join a trade union.</li>
            <li>The right to request flexible working.</li>
            <li>Statutory paternity leave and unpaid parental leave, subject to the applicable eligibility rules.</li>
            <li>Statutory Sick Pay from the first qualifying day of sickness, where the statutory conditions are met.</li>
            <li>Protection from dismissal for certain automatically unfair reasons.</li>
          </ul>

          <h2>Written employment information</h2>
          <p>
            Employers should provide the required written statement of
            employment particulars at the start of employment. This should
            clearly explain the main terms of the role, including pay, hours,
            holiday, place of work, probation and notice arrangements.
          </p>

          <h2>Probation does not remove legal rights</h2>
          <p>
            A probation period allows an employer to assess suitability,
            conduct and performance. It does not remove statutory rights.
            Decisions made during probation should still be reasonable,
            evidence-based and free from discrimination.
          </p>

          <h2>Practical steps for employers</h2>
          <ul>
            <li>Issue accurate written terms and core policies promptly.</li>
            <li>Complete right-to-work and role-specific checks before work begins.</li>
            <li>Explain pay, working hours, holiday and absence-reporting arrangements.</li>
            <li>Make managers aware that statutory protections apply during probation.</li>
            <li>Record induction, training, concerns and review discussions.</li>
            <li>Consider reasonable adjustments where disability may be relevant.</li>
            <li>Check current statutory guidance before making decisions involving leave, sickness or dismissal.</li>
          </ul>

          <h2>When additional advice may be needed</h2>
          <p>
            Seek further guidance where a concern involves discrimination,
            whistleblowing, pregnancy or family leave, trade union activity,
            health and safety, statutory leave, or a possible automatically
            unfair reason for dismissal.
          </p>

          <div class="notice">
            <strong>Important</strong>
            <p>
              Employment law changes are being introduced in stages. Check the
              current legal position and the employee's contractual terms
              before taking action.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  function downloadWord(factsheet: FactsheetResource) {
    const documentHtml = getFactsheetDocument(factsheet);

    if (!documentHtml) {
      return;
    }

    const blob = new Blob(["\ufeff", documentHtml], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "LEO-Day-One-Employment-Rights.doc";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openPdf(factsheet: FactsheetResource) {
    const documentHtml = getFactsheetDocument(factsheet);

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

  function getAskLeoHref(factsheet: FactsheetResource) {
    const prompt = [
      `I am reviewing the LEO factsheet "${factsheet.title}".`,
      factsheet.summary,
      "Please use this factsheet as the context for my question.",
    ].join("\n\n");

    return `/dashboard/ask-leo?prompt=${encodeURIComponent(prompt)}`;
  }

  const visibleFactsheets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return publishedFactsheets.filter((factsheet) => {
      const matchesTopic =
        activeTopic === "All" || factsheet.topic === activeTopic;

      const matchesSearch =
        !query ||
        `${factsheet.title} ${factsheet.summary} ${factsheet.topic} ${factsheet.tags.join(" ")}`
          .toLowerCase()
          .includes(query);

      return matchesTopic && matchesSearch;
    });
  }, [activeTopic, search]);

  return (
    <main className="factsheets-page">
      <style jsx>{`
        .factsheets-page {
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
        }

        :global(.ask-link:hover) {
          background: #5f4573;
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
          background: #ffffff;
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
        }

        :global(.resource-action:hover) {
          border-color: #cdb2e2;
          background: #faf6fc;
        }

        :global(.resource-action.primary) {
          border-color: #6e5084;
          background: #6e5084;
          color: #ffffff;
        }

        :global(.resource-action.primary:hover) {
          border-color: #5f4573;
          background: #5f4573;
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
          .factsheets-page {
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
          .factsheets-page {
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
          â† Back to HR Resources
        </Link>

        <section className="hero">
          <div>
            <p className="eyebrow">HR Resources</p>
            <h1>Factsheets</h1>
            <p className="hero-copy">
              Clear, practical summaries of key employment law, workplace and
              people-management topics.
            </p>
          </div>

          <div className="hero-badge">
            <span className="hero-count">{publishedFactsheets.length}</span>
            <span className="hero-count-label">published factsheets</span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">âŒ•</span>

            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search factsheets by title, topic or keyword..."
              aria-label="Search factsheets"
            />
          </div>

          <Link className="ask-link" href="/dashboard/ask-leo">
            <span aria-hidden="true">âœ¦</span>
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
                  className={`topic-button ${
                    activeTopic === topic ? "active" : ""
                  }`}
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
                {activeTopic === "All" ? "All factsheets" : activeTopic}
              </h2>

              <span className="result-count">
                {visibleFactsheets.length}{" "}
                {visibleFactsheets.length === 1 ? "resource" : "resources"}
              </span>
            </div>

            {visibleFactsheets.length > 0 ? (
              <div className="resource-grid">
                {visibleFactsheets.map((factsheet) => (
                  <article className="resource-card" key={factsheet.id}>
                    <div className="resource-heading">
                      <div className="resource-icon" aria-hidden="true">
                        F
                      </div>

                      <h3>{factsheet.title}</h3>
                    </div>

                    <p>{factsheet.summary}</p>

                    <div className="resource-meta">
                      <span className="resource-pill">{factsheet.topic}</span>

                      {factsheet.lastUpdated ? (
                        <span className="resource-pill">
                          Updated {factsheet.lastUpdated}
                        </span>
                      ) : null}
                    </div>

                    <div className="resource-divider" />

                    <div className="resource-actions">
                      <Link
                        className="resource-action primary"
                        href={`/dashboard/policies/factsheets/${factsheet.id}`}
                      >
                        Preview
                      </Link>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => downloadWord(factsheet)}
                      >
                        Word
                      </button>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => openPdf(factsheet)}
                      >
                        PDF
                      </button>

                      <Link
                        className="resource-action"
                        href={getAskLeoHref(factsheet)}
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
                  <div className="empty-icon">F</div>

                  <h2>
                    {search || activeTopic !== "All"
                      ? "No matching factsheets found"
                      : "The professional factsheet library is ready to be populated"}
                  </h2>

                  <p>
                    {search || activeTopic !== "All"
                      ? "Try a different search term or choose another topic."
                      : "Published LEO factsheets will appear here as they are added to the professional resource library."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="current-note">
          <span>â†»</span>

          <div>
            <strong>Professionally maintained</strong>

            <p>
              LEO Resources are professionally reviewed and updated to reflect
              changes in employment legislation, official guidance and
              recognised HR best practice, helping ensure your organisation
              always has access to the latest documentation.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

