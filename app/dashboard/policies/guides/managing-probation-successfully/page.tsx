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
  "Probation",
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

const publishedGuides: GuideResource[] = [
  {
    id: "managing-a-disciplinary-process",
    title: "Managing a Disciplinary Process",
    summary:
      "A practical guide to planning and carrying out a fair disciplinary process, from investigation through to the hearing, decision and follow-up.",
    topic: "Disciplinary",
    lastUpdated: "January 2027",
    tags: ["disciplinary", "investigation", "hearing", "fair process"],
  },
  {
    id: "managing-probation-successfully",
    title: "Managing Probation Successfully",
    summary:
      "A concise employer guide to planning, reviewing and concluding probation fairly and effectively.",
    topic: "Probation",
    lastUpdated: "January 2027",
    tags: [
      "probation",
      "probation review",
      "new starter",
      "extension",
      "performance",
      "dismissal",
    ],
  },
];

export default function GuidesPage() {
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

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

  function getGuideHref(guide: GuideResource) {
    return `/dashboard/policies/guides/${guide.id}`;
  }

  function openGuide(guide: GuideResource) {
    window.location.href = getGuideHref(guide);
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
      `&returnUrl=${encodeURIComponent(getGuideHref(guide))}`
    );
  }

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

        .empty-state {
          display: flex;
          min-height: 360px;
          align-items: center;
          justify-content: center;
          text-align: center;
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
              Clear, practical guidance to help managers handle workplace
              situations confidently and consistently.
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
                {activeTopic === "All" ? "All guides" : activeTopic}
              </h2>
              <span className="result-count">
                {visibleGuides.length}{" "}
                {visibleGuides.length === 1 ? "resource" : "resources"}
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
                        href={getGuideHref(guide)}
                      >
                        Preview
                      </Link>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => openGuide(guide)}
                      >
                        Word
                      </button>

                      <button
                        className="resource-action"
                        type="button"
                        onClick={() => openGuide(guide)}
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
                <div>
                  <h2>No matching guides found</h2>
                  <p>Try a different search term or choose another topic.</p>
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
              LEO Resources are professionally reviewed and updated to reflect
              changes in employment legislation, official guidance and
              recognised HR best practice.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}