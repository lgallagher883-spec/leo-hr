"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LeoResourceMetadata } from "@/lib/hr-resources/leoCatalogue";

type ResourceCataloguePageProps = {
  resourceType: string;
  title: string;
  description: string;
  resources: LeoResourceMetadata[];
};

function formatTypeLabel(value: string) {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function ResourceCataloguePage(props: ResourceCataloguePageProps) {
  const { resourceType, title, description, resources } = props;

  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"featured" | "title" | "review">("featured");

  const topics = useMemo(() => {
    const unique = Array.from(
      new Set(resources.map((resource) => resource.topic).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    return ["All", ...unique];
  }, [resources]);

  const visibleResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = resources.filter((resource) => {
      const matchesTopic = topicFilter === "All" || resource.topic === topicFilter;

      if (!matchesTopic) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        resource.title,
        resource.summary,
        resource.topic,
        resource.employmentLifecycleStage,
        resource.employmentLawCategory,
        resource.searchableKeywords.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });

    if (sortBy === "title") {
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === "review") {
      return filtered.sort((a, b) => {
        const aValue = a.reviewDate || "";
        const bValue = b.reviewDate || "";
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
  }, [resources, search, sortBy, topicFilter]);

  const featuredCount = resources.filter((resource) => resource.featured).length;
  const aiEnabledCount = resources.filter(
    (resource) => resource.aiAvailability === "available" && resource.capabilities.askLeo,
  ).length;

  return (
    <main className="catalogue-page">
      <style jsx>{`
        .catalogue-page {
          min-height: 100%;
          padding: 32px;
          background: linear-gradient(180deg, #fbf8fd 0%, #ffffff 40%);
          color: #334155;
        }

        .page-shell {
          max-width: 1240px;
          margin: 0 auto;
        }

        .breadcrumb {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          color: #8a6a9e;
          font-size: 14px;
        }

        .breadcrumb a {
          color: #6e5084;
          text-decoration: none;
          font-weight: 600;
        }

        .breadcrumb a:hover {
          text-decoration: underline;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: end;
          padding: 30px;
          border: 1px solid #eadff0;
          border-radius: 24px;
          background: #ffffff;
          box-shadow: 0 16px 45px rgba(91, 66, 106, 0.07);
        }

        .eyebrow {
          margin: 0 0 6px;
          color: #8a6a9e;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
        }

        h1 {
          margin: 0;
          color: #6e5084;
          font-size: clamp(30px, 4.5vw, 48px);
          line-height: 1.08;
          letter-spacing: -0.03em;
          font-weight: 500;
        }

        .hero-copy {
          max-width: 780px;
          margin: 14px 0 0;
          color: #64748b;
          line-height: 1.7;
          font-size: 16px;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(110px, 1fr));
          gap: 10px;
        }

        .metric {
          min-height: 86px;
          padding: 14px;
          border-radius: 14px;
          background: #f8f3fb;
        }

        .metric-value {
          display: block;
          color: #6e5084;
          font-size: 28px;
          font-weight: 650;
        }

        .metric-label {
          color: #7f6b8d;
          font-size: 12px;
        }

        .toolbar {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) auto;
          gap: 12px;
          margin-top: 22px;
        }

        .search {
          min-height: 46px;
          padding: 0 14px;
          border: 1px solid #d6c7df;
          border-radius: 12px;
          color: #334155;
          background: #ffffff;
          font: inherit;
        }

        .sort-select {
          min-height: 46px;
          padding: 0 13px;
          border: 1px solid #d6c7df;
          border-radius: 12px;
          background: #ffffff;
          color: #5d4470;
          font: inherit;
        }

        .topics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .topic {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          border: 1px solid #d8cae1;
          background: #ffffff;
          color: #6d527f;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .topic.active {
          border-color: #6e5084;
          background: #6e5084;
          color: #ffffff;
        }

        .result-summary {
          margin-top: 15px;
          color: #7a6486;
          font-size: 13px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .card {
          display: grid;
          gap: 12px;
          padding: 18px;
          border: 1px solid #e7ddea;
          border-radius: 16px;
          background: #ffffff;
        }

        .card-type {
          color: #8a6a9e;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .card h2 {
          margin: 0;
          color: #523763;
          font-size: 20px;
          font-weight: 550;
          letter-spacing: -0.02em;
        }

        .card p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .meta {
          display: grid;
          gap: 6px;
          color: #6f6279;
          font-size: 12px;
        }

        .keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .keyword {
          display: inline-flex;
          align-items: center;
          min-height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: #f8f3fb;
          color: #6d527f;
          font-size: 11px;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .action,
        .action-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 650;
        }

        .action {
          border: 1px solid #6e5084;
          background: #6e5084;
          color: #ffffff;
        }

        .action-secondary {
          border: 1px solid #d9cde2;
          background: #ffffff;
          color: #6e5084;
        }

        .related {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .related a {
          color: #6e5084;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }

        .related a:hover {
          text-decoration: underline;
        }

        .empty {
          margin-top: 20px;
          padding: 20px;
          border: 1px dashed #decfe7;
          border-radius: 14px;
          color: #7f668d;
          background: #fdfbfe;
        }

        @media (max-width: 860px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .metrics {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-shell">
        <div className="breadcrumb">
          <Link href="/dashboard/policies">HR Resources</Link>
          <span>/</span>
          <span>{title}</span>
        </div>

        <section className="hero">
          <div>
            <p className="eyebrow">Metadata-driven catalogue</p>
            <h1>{title}</h1>
            <p className="hero-copy">{description}</p>
          </div>

          <div className="metrics">
            <div className="metric">
              <span className="metric-value">{resources.length}</span>
              <span className="metric-label">Total resources</span>
            </div>
            <div className="metric">
              <span className="metric-value">{featuredCount}</span>
              <span className="metric-label">Featured</span>
            </div>
            <div className="metric">
              <span className="metric-value">{aiEnabledCount}</span>
              <span className="metric-label">Ask Leo enabled</span>
            </div>
          </div>
        </section>

        <div className="toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="search"
            placeholder={`Search ${formatTypeLabel(resourceType).toLowerCase()}...`}
            aria-label={`Search ${title}`}
          />

          <select
            className="sort-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "featured" | "title" | "review")}
            aria-label="Sort resources"
          >
            <option value="featured">Sort: Featured</option>
            <option value="title">Sort: Title</option>
            <option value="review">Sort: Review date</option>
          </select>
        </div>

        <div className="topics">
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setTopicFilter(topic)}
              className={`topic ${topicFilter === topic ? "active" : ""}`}
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="result-summary">
          Showing {visibleResources.length} of {resources.length} resources
        </div>

        {visibleResources.length === 0 ? (
          <div className="empty">
            No resources match the current filters yet.
          </div>
        ) : (
          <div className="grid">
            {visibleResources.map((resource) => (
              <article key={resource.id} className="card">
                <div className="card-type">{formatTypeLabel(resource.resourceType)}</div>
                <h2>{resource.title}</h2>
                <p>{resource.summary}</p>

                <div className="meta">
                  <span>Topic: {resource.topic}</span>
                  <span>Lifecycle stage: {resource.employmentLifecycleStage}</span>
                  <span>Law category: {resource.employmentLawCategory}</span>
                  <span>Status: {resource.status.replaceAll("_", " ")}</span>
                  <span>Version: {resource.version}</span>
                  <span>Review date: {resource.reviewDate || "Not set"}</span>
                </div>

                <div className="keywords">
                  {resource.searchableKeywords.slice(0, 6).map((keyword) => (
                    <span key={keyword} className="keyword">
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="actions">
                  {resource.capabilities.preview && (
                    <Link className="action" href={resource.route}>
                      Open resource
                    </Link>
                  )}

                  {resource.capabilities.wordExport && (
                    <Link className="action-secondary" href={resource.route}>
                      Word
                    </Link>
                  )}

                  {resource.capabilities.pdfExport && (
                    <Link className="action-secondary" href={resource.route}>
                      PDF
                    </Link>
                  )}

                  {resource.capabilities.askLeo && (
                    <Link
                      className="action-secondary"
                      href={`/dashboard/ask-leo?prompt=${encodeURIComponent(
                        `I am reviewing the LEO ${resource.resourceType.slice(0, -1)} \"${resource.title}\".\n\n${resource.summary}\n\nPlease use this resource as context for my question.`,
                      )}&resourceTitle=${encodeURIComponent(resource.title)}&resourceType=${encodeURIComponent(formatTypeLabel(resource.resourceType).replace(/s$/, ""))}&returnUrl=${encodeURIComponent(resource.route)}`}
                    >
                      Ask Leo
                    </Link>
                  )}
                </div>

                {resource.relatedResources.length > 0 && (
                  <div className="related">
                    {resource.relatedResources.map((relatedId) => {
                      const related = resources.find((item) => item.id === relatedId);

                      if (!related) {
                        return null;
                      }

                      return (
                        <Link key={related.id} href={related.route}>
                          Related: {related.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
