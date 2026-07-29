"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type GuideResource = {
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
  "Managing performance",
  "Sickness & absence",
  "Disciplinary",
  "Grievance",
  "Family leave",
  "Flexible working",
  "Redundancy",
  "TUPE",
  "Ending employment",
];

// Published LEO guide resources will be supplied here by the library API.
const publishedGuides: GuideResource[] = [
  {
    id: "managing-a-disciplinary-process",
    title: "Managing a Disciplinary Process",
    summary:
      "A practical guide to planning and carrying out a fair disciplinary process, from investigation through to the hearing, decision and follow-up.",
    topic: "Disciplinary",
    lastUpdated: "July 2026",
    tags: ["disciplinary", "investigation", "hearing", "fair process"],
  },
];

export default function GuidesPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  function getGuideDocument(guide: GuideResource) {
    if (guide.id !== "managing-a-disciplinary-process") {
      return "";
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${guide.title}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              max-width: 820px;
              margin: 0 auto;
              font-family: Arial, Helvetica, sans-serif;
              color: #334155;
              line-height: 1.65;
            }
            h1, h2, h3 { color: #6e5084; }
            h1 { font-size: 30px; margin-bottom: 24px; }
            h2 { margin-top: 30px; margin-bottom: 10px; font-size: 21px; }
            h3 { margin-top: 22px; margin-bottom: 8px; font-size: 16px; }
            p, li { font-size: 11pt; }
            li + li { margin-top: 6px; }
            .notice {
              margin-top: 28px;
              padding: 14px;
              border: 1px solid #dcece4;
              background: #f5fff9;
            }
            .tip {
              margin: 18px 0;
              padding: 14px;
              border-left: 4px solid #6e5084;
              background: #f7f1fc;
            }
          </style>
        </head>
        <body>
          <h1>Managing a Disciplinary Process</h1>

          <h2>Purpose of this guide</h2>
          <p>
            This guide explains how to manage a fair and proportionate disciplinary
            process, from the initial concern through investigation, hearing,
            decision, appeal and record keeping.
          </p>

          <h2>Before you begin</h2>
          <ul>
            <li>Check the organisation's disciplinary policy and the employee's contract.</li>
            <li>Identify the concern clearly and avoid deciding the outcome in advance.</li>
            <li>Consider whether the matter is misconduct, capability, attendance or another issue.</li>
            <li>Act promptly while allowing enough time for a fair process.</li>
          </ul>

          <h2>Step 1 – Decide whether formal action is necessary</h2>
          <p>
            Minor issues can often be resolved informally through a clear management
            conversation, support, training or an agreed improvement plan. Formal
            disciplinary action should be used where the concern is sufficiently
            serious, repeated, or has not improved after appropriate informal action.
          </p>

          <h2>Step 2 – Investigate</h2>
          <p>
            Appoint an impartial investigator where possible. The investigation
            should establish the facts rather than prove guilt.
          </p>
          <ul>
            <li>Define the allegation or concern.</li>
            <li>Gather relevant documents, records and other evidence.</li>
            <li>Meet witnesses where necessary.</li>
            <li>Give the employee an opportunity to explain their account.</li>
            <li>Keep accurate notes and preserve relevant evidence.</li>
          </ul>

          <h2>Step 3 – Consider suspension carefully</h2>
          <p>
            Suspension is not a disciplinary sanction and should never be automatic.
            Consider alternatives first, such as temporary duties, adjusted access,
            a different reporting line or working from another location.
          </p>
          <p>
            Where suspension is necessary, keep it on full pay, explain the reason,
            confirm it in writing, maintain appropriate contact and review it regularly.
          </p>

          <h2>Step 4 – Decide whether there is a case to answer</h2>
          <p>
            Review the investigation objectively. A disciplinary hearing should only
            be arranged where there is sufficient information to justify formal
            consideration. If there is no case to answer, close the matter and confirm
            this appropriately.
          </p>

          <h2>Step 5 – Invite the employee to the hearing</h2>
          <p>The written invitation should include:</p>
          <ul>
            <li>The date, time and location or meeting arrangements.</li>
            <li>Clear details of each allegation.</li>
            <li>The evidence that will be considered.</li>
            <li>The possible outcomes, including dismissal where relevant.</li>
            <li>The right to be accompanied.</li>
            <li>Reasonable notice to prepare.</li>
          </ul>

          <h2>Step 6 – Conduct the hearing fairly</h2>
          <p>
            The chair should explain the purpose of the meeting, set out the concerns,
            review the evidence and allow the employee to respond fully. The employee
            should be able to ask questions, challenge evidence, provide information
            and raise relevant mitigating circumstances.
          </p>
          <p>
            Keep the tone professional and avoid hostile or leading questions. Adjourn
            if further investigation is required.
          </p>

          <h2>Step 7 – Reach a proportionate decision</h2>
          <p>
            The decision must be based on the evidence and the balance of probabilities.
            Consider consistency, length of service, disciplinary record, mitigation,
            the employee's explanation, the seriousness of the conduct and whether
            alternatives to a warning or dismissal are appropriate.
          </p>

          <h3>Possible outcomes</h3>
          <ul>
            <li>No formal action.</li>
            <li>Informal guidance or management instruction.</li>
            <li>First written warning.</li>
            <li>Final written warning.</li>
            <li>Dismissal with notice.</li>
            <li>Summary dismissal for gross misconduct.</li>
            <li>Another contractual sanction, where the contract permits it.</li>
          </ul>

          <h2>Step 8 – Confirm the outcome</h2>
          <p>
            Confirm the decision in writing without unreasonable delay. Explain the
            findings, the sanction, the required improvement or conduct, the review
            period, the consequences of further concerns and the right of appeal.
          </p>

          <h2>Step 9 – Manage any appeal</h2>
          <p>
            The appeal should, where possible, be heard by someone not previously
            involved and with appropriate authority. Consider the grounds raised,
            review the process and evidence, and carry out further enquiries where
            necessary. Confirm the final decision in writing.
          </p>

          <h2>Record keeping and confidentiality</h2>
          <ul>
            <li>Keep investigation notes, evidence, meeting records and decisions securely.</li>
            <li>Restrict access to those who genuinely need it.</li>
            <li>Record warnings accurately and remove or disregard them when expired, in line with policy.</li>
            <li>Do not circulate sensitive details unnecessarily.</li>
          </ul>

          <h2>Common mistakes to avoid</h2>
          <ul>
            <li>Deciding the outcome before the hearing.</li>
            <li>Using disciplinary action for a capability or health issue without proper consideration.</li>
            <li>Failing to provide the employee with the evidence.</li>
            <li>Automatically suspending the employee.</li>
            <li>Relying on vague allegations.</li>
            <li>Ignoring mitigation or inconsistent treatment.</li>
            <li>Failing to offer an appeal.</li>
          </ul>

          <div class="tip">
            <strong>Practical HR tip:</strong> Keep the allegation, evidence, finding
            and sanction clearly separated. This helps demonstrate that the decision
            was reasoned, proportionate and based on the information considered.
          </div>

          <div class="notice">
            This guide provides general HR guidance for England and Wales. It should
            be used alongside the organisation's own procedure and adapted to the
            facts of the case. Seek specialist advice where dismissal, discrimination,
            whistleblowing, health, trade union activity or another complex issue may arise.
          </div>
        </body>
      </html>
    `;
  }

  function downloadWord(guide: GuideResource) {
    const documentHtml = getGuideDocument(guide);

    if (!documentHtml) {
      return;
    }

    const blob = new Blob(["\ufeff", documentHtml], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "LEO-Managing-a-Disciplinary-Process.doc";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function openPdf(guide: GuideResource) {
    const documentHtml = getGuideDocument(guide);

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

  function getAskLeoHref(guide: GuideResource) {
    const prompt = [
      `I am reviewing the LEO guide "${guide.title}".`,
      guide.summary,
      "Please use this guide as the context for my question.",
    ].join("\n\n");

    return (
      `/dashboard/ask-leo?prompt=${encodeURIComponent(prompt)}` +
      `&resourceTitle=${encodeURIComponent(guide.title)}` +
      `&resourceType=${encodeURIComponent("Guide")}` +
      `&returnUrl=${encodeURIComponent(
        `/dashboard/policies/guides/${guide.id}`
      )}`
    );
  }

  const visibleGuides = useMemo(() => {
    const query = search.trim().toLowerCase();

    return publishedGuides.filter((guide) => {
      const matchesTopic =
        activeTopic === "All" || guide.topic === activeTopic;

      const matchesSearch =
        !query ||
        `${guide.title} ${guide.summary} ${guide.topic} ${guide.tags.join(" ")}`
          .toLowerCase()
          .includes(query);

      return matchesTopic && matchesSearch;
    });
  }, [activeTopic, search]);

  return (
    <main className="guides-page">
      <style jsx>{`
        .guides-page {
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
          .guides-page {
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
          .guides-page {
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
            <h1>Guides</h1>
            <p className="hero-copy">
              Clear, practical guidance to help managers handle workplace situations confidently and consistently.
            </p>
          </div>

          <div className="hero-badge">
            <span className="hero-count">{publishedGuides.length}</span>
            <span className="hero-count-label">published guides</span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guides by title, topic or keyword..."
              aria-label="Search guides"
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
                {activeTopic === "All" ? "All guides" : activeTopic}
              </h2>
              <span className="result-count">
                {visibleGuides.length} {visibleGuides.length === 1 ? "resource" : "resources"}
              </span>
            </div>

            {visibleGuides.length > 0 ? (
              <div className="resource-grid">
                {visibleGuides.map((guide) => (
                  <article className="resource-card" key={guide.id}>
                    <div className="resource-heading">
                      <div className="resource-icon" aria-hidden="true">
                        G
                      </div>
                      <h3>{guide.title}</h3>
                    </div>

                    <p>{guide.summary}</p>

                    <div className="resource-meta">
                      <span className="resource-pill">{guide.topic}</span>
                      {guide.lastUpdated ? (
                        <span className="resource-pill">
                          Updated {guide.lastUpdated}
                        </span>
                      ) : null}
                    </div>

                    <div className="resource-divider" />

                    <div className="resource-actions">
                      <Link
                        className="resource-action"
                        href={`/dashboard/policies/guides/${guide.id}`}
                      >
                        Preview
                      </Link>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => downloadWord(guide)}
                      >
                        Word
                      </button>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => openPdf(guide)}
                      >
                        PDF
                      </button>

                      <Link
                        className="resource-action"
                        href={getAskLeoHref(guide)}
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
                      ? "No matching guides found"
                      : "The professional guides library is ready to be populated"}
                  </h2>
                  <p>
                    {search || activeTopic !== "All"
                      ? "Try a different search term or choose another topic."
                      : "Published LEO guides will appear here as they are added to the professional resource library."}
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