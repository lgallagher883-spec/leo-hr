"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type LetterResource = {
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
  "Contracts & changes",
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
  "Ending employment",
];

// Published LEO letter resources will be supplied here by the library API.
const publishedLetters: LetterResource[] = [
  {
    id: "disciplinary-outcome-warning",
    title: "Disciplinary Outcome – Written Warning",
    summary:
      "A professionally drafted outcome letter confirming a first written warning following a fair disciplinary process.",
    topic: "Disciplinary",
    lastUpdated: "July 2026",
    tags: ["disciplinary", "misconduct", "hearing"],
  },
];

export default function LettersPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  function getLetterDocument(letter: LetterResource) {
    if (letter.id !== "disciplinary-outcome-warning") {
      return "";
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${letter.title}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              max-width: 820px;
              margin: 0 auto;
              font-family: Arial, Helvetica, sans-serif;
              color: #334155;
              line-height: 1.65;
            }
            h1 { color: #6e5084; font-size: 30px; margin-bottom: 24px; }
            p, li { font-size: 11pt; }
            .field { font-weight: 700; color: #6e5084; }
            .notice {
              margin-top: 28px;
              padding: 14px;
              border: 1px solid #dcece4;
              background: #f5fff9;
            }
          </style>
        </head>
        <body>
          <h1>Disciplinary Outcome – Written Warning</h1>
<p><span class="field">Private and confidential</span></p>
<p><span class="field">To:</span> [Employee]</p>
<p><span class="field">Date:</span> [Date]</p>

<p>Dear [Employee],</p>

<p><strong>Outcome of disciplinary hearing</strong></p>

<p>Thank you for attending the disciplinary hearing held on <strong>[date]</strong>, chaired by <strong>[manager]</strong>. After carefully considering the investigation, the evidence presented and your representations, I have concluded that the allegation(s) have been upheld.</p>

<p>You are therefore issued with a <strong>First Written Warning</strong>.</p>

<p><strong>Reason for the warning</strong></p>
<ul>
<li>[Summarise the findings.]</li>
<li>[Explain why the allegation was upheld.]</li>
</ul>

<p><strong>Required improvement</strong></p>
<ul>
<li>[Expected standards.]</li>
<li>[Support/training to be provided.]</li>
<li>[Review period.]</li>
</ul>

<p>This warning will normally remain live for <strong>[6/12] months</strong>, subject to your organisation's disciplinary procedure.</p>

<p>Failure to achieve and maintain the required standard may result in further disciplinary action, which could include a final written warning or dismissal where appropriate.</p>

<p><strong>Right of appeal</strong></p>

<p>If you believe this decision is incorrect or procedurally unfair, you may appeal in writing to <strong>[name]</strong> within <strong>[5 working days]</strong>, explaining the grounds of your appeal.</p>

<p>Yours sincerely,</p>

<p>[Manager Name]<br/>[Job Title]</p>

<div class="notice">
This template reflects good HR practice for England &amp; Wales as at January 2027 and should be adapted to the circumstances of each case, following the ACAS Code of Practice and your disciplinary procedure.
</div>
</body>
      </html>
    `;
  }

  function downloadWord(letter: LetterResource) {
    const documentHtml = getLetterDocument(letter);

    if (!documentHtml) {
      return;
    }

    const blob = new Blob(["\ufeff", documentHtml], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LEO-Disciplinary-Outcome-Written-Warning.doc";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function openPdf(letter: LetterResource) {
    const documentHtml = getLetterDocument(letter);

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

  function getAskLeoHref(letter: LetterResource) {
    const prompt = [
      `I am reviewing the LEO letter "${letter.title}".`,
      letter.summary,
      "Please use this letter as the context for my question.",
    ].join("\n\n");

    return (
      `/dashboard/ask-leo?prompt=${encodeURIComponent(prompt)}` +
      `&resourceTitle=${encodeURIComponent(letter.title)}` +
      `&resourceType=${encodeURIComponent("Letter")}` +
      `&returnUrl=${encodeURIComponent(
        `/dashboard/policies/letters/${letter.id}`
      )}`
    );
  }

  const visibleLetters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return publishedLetters.filter((letter) => {
      const matchesTopic =
        activeTopic === "All" || letter.topic === activeTopic;

      const matchesSearch =
        !query ||
        `${letter.title} ${letter.summary} ${letter.topic} ${letter.tags.join(" ")}`
          .toLowerCase()
          .includes(query);

      return matchesTopic && matchesSearch;
    });
  }, [activeTopic, search]);

  return (
    <main className="letters-page">
      <style jsx>{`
        .letters-page {
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

        :global(.resource-action.primary) {
          border-color: #6e5084;
          background: #6e5084;
          color: #ffffff;
          box-shadow: 0 7px 16px rgba(110, 80, 132, 0.14);
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
          .letters-page {
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
          .letters-page {
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
            <h1>Letters</h1>
            <p className="hero-copy">
              Professionally drafted letters for common employment situations,
              workplace processes and important management decisions.
            </p>
          </div>

          <div className="hero-badge">
            <span className="hero-count">{publishedLetters.length}</span>
            <span className="hero-count-label">published letters</span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search letters by title, topic or keyword..."
              aria-label="Search letters"
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
                {activeTopic === "All" ? "All letters" : activeTopic}
              </h2>
              <span className="result-count">
                {visibleLetters.length} {visibleLetters.length === 1 ? "resource" : "resources"}
              </span>
            </div>

            {visibleLetters.length > 0 ? (
              <div className="resource-grid">
                {visibleLetters.map((letter) => (
                  <article className="resource-card" key={letter.id}>
                    <div className="resource-heading">
                      <div className="resource-icon" aria-hidden="true">
                        L
                      </div>
                      <h3>{letter.title}</h3>
                    </div>

                    <p>{letter.summary}</p>

                    <div className="resource-meta">
                      <span className="resource-pill">{letter.topic}</span>
                      {letter.lastUpdated ? (
                        <span className="resource-pill">
                          Updated {letter.lastUpdated}
                        </span>
                      ) : null}
                    </div>

                    <div className="resource-divider" />

                    <div className="resource-actions">
                      <Link
                        className="resource-action primary"
                        href={`/dashboard/policies/letters/${letter.id}`}
                      >
                        Preview
                      </Link>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => downloadWord(letter)}
                      >
                        Word
                      </button>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => openPdf(letter)}
                      >
                        PDF
                      </button>

                      <Link
                        className="resource-action"
                        href={getAskLeoHref(letter)}
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
                      ? "No matching letters found"
                      : "The professional letter library is ready to be populated"}
                  </h2>
                  <p>
                    {search || activeTopic !== "All"
                      ? "Try a different search term or choose another topic."
                      : "Published LEO letters will appear here as they are added to the professional resource library."}
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