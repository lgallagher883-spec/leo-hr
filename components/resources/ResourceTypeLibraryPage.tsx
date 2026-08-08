"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LeoResourceMetadata } from "@/lib/hr-resources/leoCatalogue";

type ResourceTypeLibraryPageProps = {
  resourceType: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  iconLetter: string;
  emptyTitle: string;
  emptyDescription: string;
  resources: LeoResourceMetadata[];
};

type SortOption = "recommended" | "title" | "updated";

function formatResourceTypeLabel(resourceType: string) {
  const singular = resourceType.replace(/s$/, "");
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

function formatReviewDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return value;
}

export default function ResourceTypeLibraryPage(props: ResourceTypeLibraryPageProps) {
  const {
    resourceType,
    title,
    description,
    searchPlaceholder,
    iconLetter,
    emptyTitle,
    emptyDescription,
    resources,
  } = props;

  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");

  const topics = useMemo(() => {
    const unique = Array.from(
      new Set(resources.map((resource) => resource.topic).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...unique];
  }, [resources]);

  const visibleResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = resources.filter((resource) => {
      const matchesTopic = activeTopic === "All" || resource.topic === activeTopic;

      if (!matchesTopic) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [resource.title, resource.summary, resource.topic, resource.searchableKeywords.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    if (sortBy === "title") {
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === "updated") {
      return filtered.sort((a, b) => {
        const aValue = a.reviewDate ?? "";
        const bValue = b.reviewDate ?? "";
        return bValue.localeCompare(aValue);
      });
    }

    return filtered.sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.title.localeCompare(b.title);
    });
  }, [activeTopic, resources, search, sortBy]);

  const askLeoHref =
    `/dashboard/ask-leo?prompt=${encodeURIComponent(
      [
        `I am reviewing the LEO ${formatResourceTypeLabel(resourceType)} library.`,
        `Focus area: ${activeTopic}.`,
        search ? `Search context: ${search}.` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    )}` +
    `&resourceType=${encodeURIComponent(formatResourceTypeLabel(resourceType))}` +
    `&returnUrl=${encodeURIComponent(`/dashboard/policies/${resourceType}`)}`;

  return (
    <main className="resource-library-page">
      <style jsx>{`
        .resource-library-page {
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
          grid-template-columns: minmax(280px, 1fr) auto auto;
          gap: 12px;
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

        .sort-select {
          min-height: 52px;
          border: 1px solid #dfd4e5;
          border-radius: 14px;
          background: #ffffff;
          color: #5f4472;
          padding: 0 14px;
          font: inherit;
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
        }

        :global(.resource-action.primary:hover) {
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

        @media (max-width: 980px) {
          .toolbar {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 850px) {
          .resource-library-page {
            padding: 20px;
          }

          .hero,
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
          .resource-library-page {
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
            <h1>{title}</h1>
            <p className="hero-copy">{description}</p>
          </div>

          <div className="hero-badge">
            <span className="hero-count">{resources.length}</span>
            <span className="hero-count-label">published resources</span>
          </div>
        </section>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={`Search ${title}`}
            />
          </div>

          <select
            className="sort-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            aria-label={`Sort ${title}`}
          >
            <option value="recommended">Recommended</option>
            <option value="title">A-Z</option>
            <option value="updated">Recently updated</option>
          </select>

          <Link className="ask-link" href={askLeoHref}>
            <span aria-hidden="true">*</span>
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
                {activeTopic === "All" ? `All ${resourceType}` : activeTopic}
              </h2>
              <span className="result-count">
                {visibleResources.length} {visibleResources.length === 1 ? "resource" : "resources"}
              </span>
            </div>

            {visibleResources.length > 0 ? (
              <div className="resource-grid">
                {visibleResources.map((resource) => (
                  <article className="resource-card" key={resource.id}>
                    <div className="resource-heading">
                      <div className="resource-icon" aria-hidden="true">
                        {iconLetter}
                      </div>
                      <h3>{resource.title}</h3>
                    </div>

                    <p>{resource.summary}</p>

                    <div className="resource-meta">
                      <span className="resource-pill">{resource.topic}</span>
                      {formatReviewDate(resource.reviewDate) ? (
                        <span className="resource-pill">
                          Updated {formatReviewDate(resource.reviewDate)}
                        </span>
                      ) : null}
                    </div>

                    <div className="resource-divider" />

                    <div className="resource-actions">
                      <Link className="resource-action primary" href={resource.route}>
                        Open Resource
                      </Link>

                      <Link className="resource-action" href={`${resource.route}?format=word`}>
                        Word
                      </Link>

                      <Link className="resource-action" href={`${resource.route}?format=pdf`}>
                        PDF
                      </Link>

                      <Link
                        className="resource-action"
                        href={
                          `/dashboard/ask-leo?prompt=${encodeURIComponent(
                            [
                              `I am reviewing the LEO ${formatResourceTypeLabel(resource.resourceType)} \"${resource.title}\".`,
                              resource.summary,
                              "Please use this resource as context for my question.",
                            ].join("\n\n"),
                          )}` +
                          `&resourceTitle=${encodeURIComponent(resource.title)}` +
                          `&resourceType=${encodeURIComponent(formatResourceTypeLabel(resource.resourceType))}` +
                          `&returnUrl=${encodeURIComponent(resource.route)}`
                        }
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
                  <div className="empty-icon">{iconLetter}</div>
                  <h2>{emptyTitle}</h2>
                  <p>{emptyDescription}</p>
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
              LEO Resources are professionally reviewed and updated to reflect changes in employment legislation,
              official guidance and recognised HR best practice, helping ensure your organisation always has access
              to the latest documentation.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
